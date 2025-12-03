"""
Сервис отправки email уведомлений.
Поддерживает SMTP и шаблоны писем.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
from string import Template

logger = logging.getLogger(__name__)


# Шаблоны писем
EMAIL_TEMPLATES = {
    'default': {
        'subject': 'CURSA - Результаты проверки нормоконтроля',
        'body': '''
Здравствуйте!

Ваш документ был успешно проверен системой CURSA.

$content

Результаты проверки прикреплены к этому письму.

С уважением,
Система CURSA
        '''
    },
    'corrections_ready': {
        'subject': 'CURSA - Документ исправлен',
        'body': '''
Здравствуйте!

Проверка документа "$filename" завершена.

📊 Статистика:
- Найдено проблем: $issues_count
- Исправлено автоматически: $corrections_count
- Время обработки: $processing_time сек.

$additional_info

Исправленный документ и отчёт прикреплены к письму.

С уважением,
Система CURSA
        '''
    },
    'batch_summary': {
        'subject': 'CURSA - Пакетная обработка завершена',
        'body': '''
Здравствуйте!

Пакетная обработка документов завершена.

📊 Результаты:
- Всего документов: $total
- Успешно обработано: $successful
- Ошибок: $failed

$details

С уважением,
Система CURSA
        '''
    },
    'error': {
        'subject': 'CURSA - Ошибка обработки документа',
        'body': '''
Здравствуйте!

При обработке документа "$filename" произошла ошибка.

❌ Описание ошибки:
$error_message

Пожалуйста, проверьте формат документа и попробуйте снова.
Если ошибка повторяется, обратитесь в поддержку.

С уважением,
Система CURSA
        '''
    },
    'weekly_report': {
        'subject': 'CURSA - Еженедельный отчёт',
        'body': '''
Здравствуйте!

Еженедельный отчёт по использованию системы CURSA.

📈 Статистика за неделю:
- Обработано документов: $documents_count
- Общее количество исправлений: $total_corrections
- Среднее время обработки: $avg_processing_time сек.

🔝 Топ проблем:
$top_issues

С уважением,
Система CURSA
        '''
    }
}


class EmailService:
    """
    Сервис отправки email.
    
    Использование:
        service = EmailService()
        service.send(
            to_email='user@example.com',
            subject='Тема',
            body='Текст письма',
            attachments=['/path/to/file.docx']
        )
    """
    
    def __init__(
        self,
        smtp_host: Optional[str] = None,
        smtp_port: Optional[int] = None,
        smtp_user: Optional[str] = None,
        smtp_password: Optional[str] = None,
        from_email: Optional[str] = None,
        use_tls: bool = True
    ):
        """
        Инициализация сервиса.
        
        Args:
            smtp_host: SMTP сервер (или из SMTP_HOST env)
            smtp_port: Порт SMTP (или из SMTP_PORT env)
            smtp_user: Пользователь SMTP (или из SMTP_USER env)
            smtp_password: Пароль SMTP (или из SMTP_PASSWORD env)
            from_email: Email отправителя (или из SMTP_FROM env)
            use_tls: Использовать TLS
        """
        self.smtp_host = smtp_host or os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = smtp_port or int(os.environ.get('SMTP_PORT', '587'))
        self.smtp_user = smtp_user or os.environ.get('SMTP_USER', '')
        self.smtp_password = smtp_password or os.environ.get('SMTP_PASSWORD', '')
        self.from_email = from_email or os.environ.get('SMTP_FROM', self.smtp_user)
        self.use_tls = use_tls
        
        # Проверяем конфигурацию
        self._configured = all([
            self.smtp_host,
            self.smtp_port,
            self.smtp_user,
            self.smtp_password
        ])
        
        if not self._configured:
            logger.warning("Email service not fully configured. Set SMTP_* environment variables.")
    
    def is_configured(self) -> bool:
        """Проверяет, настроен ли сервис"""
        return self._configured
    
    def send(
        self,
        to_email: str,
        subject: str,
        body: Optional[str] = None,
        html_body: Optional[str] = None,
        template: Optional[str] = None,
        template_vars: Optional[Dict[str, Any]] = None,
        attachments: Optional[List[str]] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Отправляет email.
        
        Args:
            to_email: Email получателя
            subject: Тема письма
            body: Текст письма (plain text)
            html_body: HTML-версия письма
            template: Имя шаблона из EMAIL_TEMPLATES
            template_vars: Переменные для шаблона
            attachments: Список путей к файлам для прикрепления
            cc: Список CC-получателей
            bcc: Список BCC-получателей
        
        Returns:
            Результат отправки с message_id
        """
        if not self._configured:
            logger.error("Email service not configured")
            return {
                'success': False,
                'error': 'Email service not configured'
            }
        
        try:
            # Создаём сообщение
            msg = MIMEMultipart('mixed')
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            
            # Получаем текст из шаблона, если указан
            if template and template in EMAIL_TEMPLATES:
                tmpl = EMAIL_TEMPLATES[template]
                template_vars = template_vars or {}
                
                # Используем тему из шаблона, если не переопределена
                if subject == template:
                    msg.replace_header('Subject', Template(tmpl['subject']).safe_substitute(template_vars))
                
                body = Template(tmpl['body']).safe_substitute(template_vars)
            
            # Добавляем текстовую часть
            if body:
                text_part = MIMEText(body, 'plain', 'utf-8')
                msg.attach(text_part)
            
            # Добавляем HTML-часть
            if html_body:
                html_part = MIMEText(html_body, 'html', 'utf-8')
                msg.attach(html_part)
            
            # Добавляем вложения
            if attachments:
                for file_path in attachments:
                    if os.path.exists(file_path):
                        self._attach_file(msg, file_path)
                    else:
                        logger.warning(f"Attachment not found: {file_path}")
            
            # Отправляем
            all_recipients = [to_email]
            if cc:
                all_recipients.extend(cc)
            if bcc:
                all_recipients.extend(bcc)
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, all_recipients, msg.as_string())
            
            logger.info(f"Email sent successfully to {to_email}")
            
            return {
                'success': True,
                'message_id': msg['Message-ID'],
                'to': to_email
            }
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            return {'success': False, 'error': 'Authentication failed'}
            
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            return {'success': False, 'error': str(e)}
            
        except Exception as e:
            logger.exception(f"Error sending email: {e}")
            return {'success': False, 'error': str(e)}
    
    def _attach_file(self, msg: MIMEMultipart, file_path: str):
        """Прикрепляет файл к сообщению"""
        filename = os.path.basename(file_path)
        
        # Определяем MIME-тип
        if filename.endswith('.docx'):
            maintype = 'application'
            subtype = 'vnd.openxmlformats-officedocument.wordprocessingml.document'
        elif filename.endswith('.pdf'):
            maintype = 'application'
            subtype = 'pdf'
        else:
            maintype = 'application'
            subtype = 'octet-stream'
        
        with open(file_path, 'rb') as f:
            part = MIMEBase(maintype, subtype)
            part.set_payload(f.read())
        
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename="{filename}"'
        )
        msg.attach(part)
    
    def send_corrections_ready(
        self,
        to_email: str,
        filename: str,
        issues_count: int,
        corrections_count: int,
        processing_time: float,
        corrected_file: Optional[str] = None,
        report_file: Optional[str] = None,
        additional_info: str = ''
    ) -> Dict[str, Any]:
        """
        Отправляет уведомление о готовых исправлениях.
        
        Args:
            to_email: Email получателя
            filename: Имя исходного файла
            issues_count: Количество найденных проблем
            corrections_count: Количество исправлений
            processing_time: Время обработки в секундах
            corrected_file: Путь к исправленному файлу
            report_file: Путь к отчёту
            additional_info: Дополнительная информация
        """
        attachments = []
        if corrected_file and os.path.exists(corrected_file):
            attachments.append(corrected_file)
        if report_file and os.path.exists(report_file):
            attachments.append(report_file)
        
        return self.send(
            to_email=to_email,
            subject=f'CURSA - Документ "{filename}" проверен',
            template='corrections_ready',
            template_vars={
                'filename': filename,
                'issues_count': issues_count,
                'corrections_count': corrections_count,
                'processing_time': round(processing_time, 2),
                'additional_info': additional_info
            },
            attachments=attachments
        )
    
    def send_error_notification(
        self,
        to_email: str,
        filename: str,
        error_message: str
    ) -> Dict[str, Any]:
        """
        Отправляет уведомление об ошибке.
        
        Args:
            to_email: Email получателя
            filename: Имя файла
            error_message: Описание ошибки
        """
        return self.send(
            to_email=to_email,
            subject=f'CURSA - Ошибка при обработке "{filename}"',
            template='error',
            template_vars={
                'filename': filename,
                'error_message': error_message
            }
        )


# Функции для быстрого использования
def send_notification(
    to_email: str,
    subject: str,
    body: str,
    attachments: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Быстрая отправка уведомления"""
    service = EmailService()
    return service.send(to_email, subject, body, attachments=attachments)


def send_document_ready(
    to_email: str,
    filename: str,
    corrected_file: str,
    report_file: Optional[str] = None,
    stats: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Отправка уведомления о готовом документе"""
    service = EmailService()
    stats = stats or {}
    return service.send_corrections_ready(
        to_email=to_email,
        filename=filename,
        issues_count=stats.get('issues_count', 0),
        corrections_count=stats.get('corrections_count', 0),
        processing_time=stats.get('processing_time', 0),
        corrected_file=corrected_file,
        report_file=report_file
    )
