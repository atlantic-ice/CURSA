"""Email sending service using SendGrid"""

import base64
import logging
import mimetypes
import os
from string import Template
from typing import Optional, List, Dict, Any

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Mail,
    Email,
    To,
    Attachment,
    FileContent,
    FileName,
    FileType,
    Disposition,
)

logger = logging.getLogger(__name__)


EMAIL_TEMPLATES = {
    "default": {
        "subject": "CURSA - Результаты проверки нормоконтроля",
        "body": """
Здравствуйте!

Ваш документ был успешно проверен системой CURSA.

$content

Результаты проверки прикреплены к этому письму.

С уважением,
Система CURSA
        """,
    },
    "corrections_ready": {
        "subject": "CURSA - Документ исправлен",
        "body": """
Здравствуйте!

Проверка документа "$filename" завершена.

Статистика:
- Найдено проблем: $issues_count
- Исправлено автоматически: $corrections_count
- Время обработки: $processing_time сек.

$additional_info

Исправленный документ и отчет прикреплены к письму.

С уважением,
Система CURSA
        """,
    },
    "batch_summary": {
        "subject": "CURSA - Пакетная обработка завершена",
        "body": """
Здравствуйте!

Пакетная обработка документов завершена.

Результаты:
- Всего документов: $total
- Успешно обработано: $successful
- Ошибок: $failed

$details

С уважением,
Система CURSA
        """,
    },
    "error": {
        "subject": "CURSA - Ошибка обработки документа",
        "body": """
Здравствуйте!

При обработке документа "$filename" произошла ошибка.

Описание ошибки:
$error_message

Пожалуйста, проверьте формат документа и попробуйте снова.

С уважением,
Система CURSA
        """,
    },
}


class EmailService:
    """SendGrid-based email service for transactional emails"""

    def __init__(self, api_key: Optional[str] = None, from_email: Optional[str] = None):
        """
        Initialize email service

        Args:
            api_key: SendGrid API key (defaults to SENDGRID_API_KEY env var)
            from_email: From address (defaults to SENDGRID_FROM_EMAIL env var)
        """
        self.api_key = api_key or os.getenv("SENDGRID_API_KEY")
        self.from_email = from_email or os.getenv("SENDGRID_FROM_EMAIL", "noreply@cursa.app")

        if not self.api_key:
            logger.warning("⚠️  SENDGRID_API_KEY not configured - emails will not be sent")
            self.sg = None
            return

        try:
            self.sg = SendGridAPIClient(self.api_key)
            logger.info(f"✓ SendGrid connected (from: {self.from_email})")
        except Exception as e:
            logger.error(f"✗ SendGrid initialization failed: {str(e)}")
            self.sg = None

    def _is_configured(self) -> bool:
        """Check if SendGrid is properly configured"""
        return self.sg is not None

    def _build_attachments(self, attachments: List[str]) -> List[Attachment]:
        """Build SendGrid attachment objects"""
        items = []
        for file_path in attachments:
            if not os.path.exists(file_path):
                logger.warning(f"Attachment not found: {file_path}")
                continue

            mime_type, _ = mimetypes.guess_type(file_path)
            mime_type = mime_type or "application/octet-stream"
            with open(file_path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode("utf-8")

            attachment = Attachment(
                FileContent(encoded),
                FileName(os.path.basename(file_path)),
                FileType(mime_type),
                Disposition("attachment"),
            )
            items.append(attachment)
        return items

    def send(
        self,
        to_email: str,
        subject: str,
        body: Optional[str] = None,
        html_body: Optional[str] = None,
        template: Optional[str] = None,
        template_vars: Optional[Dict[str, Any]] = None,
        attachments: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Send a general email with optional templates and attachments"""
        if not self._is_configured():
            logger.error("Email service not configured")
            return {"success": False, "error": "Email service not configured"}

        try:
            if template and template in EMAIL_TEMPLATES:
                tmpl = EMAIL_TEMPLATES[template]
                template_vars = template_vars or {}

                if subject == template:
                    subject = Template(tmpl["subject"]).safe_substitute(template_vars)

                if not body:
                    body = Template(tmpl["body"]).safe_substitute(template_vars)

            plain_content = body or ""
            html_content = html_body
            if not html_content and plain_content:
                html_content = "<br>".join(plain_content.splitlines())

            message = Mail(
                from_email=Email(self.from_email, name="CURSA"),
                to_emails=To(to_email),
                subject=subject,
                plain_text_content=plain_content,
                html_content=html_content,
            )

            if attachments:
                message.attachment = self._build_attachments(attachments)

            response = self.sg.send(message)
            if response.status_code == 202:
                logger.info(f"✓ Email sent to {to_email}")
                return {"success": True, "message_id": response.headers.get("X-Message-Id")}
            return {"success": False, "error": f"SendGrid error {response.status_code}"}

        except Exception as e:
            logger.error(f"✗ Error sending email: {str(e)}")
            return {"success": False, "error": str(e)}

    def send_verification_email(self, to_email: str, verification_token: str) -> bool:
        """Send email verification link"""
        if not self._is_configured():
            logger.warning(f"⚠️  SendGrid not configured - skipping verification email")
            return True

        try:
            verification_url = f"https://cursa.app/verify?token={verification_token}"

            message = Mail(
                from_email=Email(self.from_email, name="CURSA"),
                to_emails=To(to_email),
                subject="Подтвердите ваш email в CURSA",
                html_content=f"""
                <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22d3ee;">Добро пожаловать в CURSA! 👋</h2>
                    <p>Подтвердите ваш email:</p>
                    <a href="{verification_url}" style="background: #22d3ee; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px;">
                        Подтвердить email
                    </a>
                    <p><small>Ссылка действительна 24 часа</small></p>
                </div>
                """,
            )

            response = self.sg.send(message)
            if response.status_code == 202:
                logger.info(f"✓ Verification email sent to {to_email}")
                return True
            return False
        except Exception as e:
            logger.error(f"✗ Failed to send verification email: {str(e)}")
            return False

    def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        """Send password reset link"""
        if not self._is_configured():
            logger.warning(f"⚠️  SendGrid not configured - skipping reset email")
            return True

        try:
            reset_url = f"https://cursa.app/reset-password?token={reset_token}"

            message = Mail(
                from_email=Email(self.from_email, name="CURSA"),
                to_emails=To(to_email),
                subject="Сброс пароля CURSA",
                html_content=f"""
                <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22d3ee;">Сброс пароля</h2>
                    <a href="{reset_url}" style="background: #f97316; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px;">
                        Сбросить пароль
                    </a>
                    <p><small>Ссылка действительна 1 час</small></p>
                </div>
                """,
            )

            response = self.sg.send(message)
            if response.status_code == 202:
                logger.info(f"✓ Password reset email sent to {to_email}")
                return True
            return False
        except Exception as e:
            logger.error(f"✗ Failed to send reset email: {str(e)}")
            return False

    def send_welcome_email(self, to_email: str, user_name: str = "") -> bool:
        """Send welcome email after email verification"""
        if not self._is_configured():
            logger.warning(f"⚠️  SendGrid not configured - skipping welcome email")
            return True

        try:
            name_part = f", {user_name.split()[0]}" if user_name else ""

            message = Mail(
                from_email=Email(self.from_email, name="CURSA"),
                to_emails=To(to_email),
                subject="Добро пожаловать в CURSA!",
                html_content=f"""
                <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22d3ee;">Привет{name_part}! 🚀</h2>
                    <p>Ваш аккаунт готов. Начните проверку документов:</p>
                    <a href="https://cursa.app/upload" style="background: #22d3ee; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px;">
                        Загрузить документ
                    </a>
                </div>
                """,
            )

            response = self.sg.send(message)
            if response.status_code == 202:
                logger.info(f"✓ Welcome email sent to {to_email}")
                return True
            return False
        except Exception as e:
            logger.error(f"✗ Failed to send welcome email: {str(e)}")
            return False

    def is_configured(self) -> bool:
        """Check if email service is properly configured"""
        return self._is_configured()
