"""
Celery задачи для фоновой обработки документов.
"""

import os
import time
import logging
from celery import Celery, Task
from typing import Dict, Any, Optional

# Настройка Celery
celery_app = Celery(
    'cursa_tasks',
    broker=os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
)

# Конфигурация Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Moscow',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 минут максимум
    task_soft_time_limit=540,  # 9 минут soft limit
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    result_expires=3600,  # Результаты хранятся 1 час
    
    # Очереди
    task_routes={
        'cursa_tasks.process_document': {'queue': 'documents'},
        'cursa_tasks.send_email': {'queue': 'emails'},
        'cursa_tasks.cleanup_old_files': {'queue': 'maintenance'},
    },
    
    # Beat schedule (периодические задачи)
    beat_schedule={
        'cleanup-old-files-daily': {
            'task': 'cursa_tasks.cleanup_old_files',
            'schedule': 86400.0,  # каждые 24 часа
            'options': {'queue': 'maintenance'}
        },
        'health-check-every-minute': {
            'task': 'cursa_tasks.health_check',
            'schedule': 60.0,
            'options': {'queue': 'maintenance'}
        }
    }
)

logger = logging.getLogger(__name__)


class BaseTask(Task):
    """Базовый класс задачи с обработкой ошибок"""
    
    autoretry_for = (Exception,)
    retry_kwargs = {'max_retries': 3}
    retry_backoff = True
    retry_backoff_max = 600
    retry_jitter = True
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Обработка ошибки задачи"""
        logger.error(f"Task {self.name}[{task_id}] failed: {exc}")
        
        # Можно отправить уведомление или записать в БД
        try:
            from app.metrics import record_error
            record_error(type(exc).__name__, 'celery')
        except ImportError:
            pass
    
    def on_success(self, retval, task_id, args, kwargs):
        """Обработка успешного выполнения"""
        logger.info(f"Task {self.name}[{task_id}] completed successfully")
    
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Обработка повторной попытки"""
        logger.warning(f"Task {self.name}[{task_id}] retrying: {exc}")


@celery_app.task(bind=True, base=BaseTask, name='cursa_tasks.process_document')
def process_document(
    self,
    file_path: str,
    profile_name: str = 'default',
    user_email: Optional[str] = None,
    options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Фоновая обработка документа.
    
    Args:
        file_path: Путь к файлу документа
        profile_name: Имя профиля нормоконтроля
        user_email: Email для отправки результатов (опционально)
        options: Дополнительные параметры обработки
    
    Returns:
        Результат обработки с путями к файлам и статистикой
    """
    options = options or {}
    start_time = time.time()
    
    try:
        # Обновляем состояние задачи
        self.update_state(
            state='PROCESSING',
            meta={'stage': 'upload', 'progress': 10}
        )
        
        # Импортируем сервисы внутри задачи (избегаем циклических импортов)
        from app.services.document_processor import DocumentProcessor
        from app.services.document_corrector import DocumentCorrector
        from app.services.norm_control_checker import NormControlChecker
        
        # Этап 1: Извлечение данных
        self.update_state(
            state='PROCESSING',
            meta={'stage': 'extract', 'progress': 20}
        )
        
        processor = DocumentProcessor()
        document_data = processor.process(file_path)
        
        # Этап 2: Проверка нормоконтроля
        self.update_state(
            state='PROCESSING',
            meta={'stage': 'check', 'progress': 40}
        )
        
        checker = NormControlChecker(profile_name)
        check_result = checker.check(document_data)
        
        # Этап 3: Исправление
        self.update_state(
            state='PROCESSING',
            meta={'stage': 'correct', 'progress': 60}
        )
        
        corrector = DocumentCorrector()
        corrected_path, corrections = corrector.correct(file_path, check_result)
        
        # Этап 4: Генерация отчёта
        self.update_state(
            state='PROCESSING',
            meta={'stage': 'report', 'progress': 80}
        )
        
        report_path = None
        if options.get('generate_report', True):
            report_path = corrector.generate_report(check_result, corrections)
        
        # Этап 5: Отправка email (если указан)
        if user_email:
            self.update_state(
                state='PROCESSING',
                meta={'stage': 'email', 'progress': 90}
            )
            send_email.delay(
                to_email=user_email,
                subject='Результаты проверки нормоконтроля',
                corrected_file=corrected_path,
                report_file=report_path
            )
        
        processing_time = time.time() - start_time
        
        # Записываем метрики
        try:
            from app.metrics import record_document_processed
            record_document_processed(len(corrections), processing_time)
        except ImportError:
            pass
        
        return {
            'success': True,
            'corrected_file': corrected_path,
            'report_file': report_path,
            'corrections_count': len(corrections),
            'processing_time': round(processing_time, 2),
            'issues_found': len(check_result.get('issues', [])),
            'profile_used': profile_name
        }
        
    except Exception as e:
        logger.exception(f"Error processing document: {e}")
        raise


@celery_app.task(bind=True, base=BaseTask, name='cursa_tasks.send_email')
def send_email(
    self,
    to_email: str,
    subject: str,
    body: Optional[str] = None,
    corrected_file: Optional[str] = None,
    report_file: Optional[str] = None,
    template: str = 'default'
) -> Dict[str, Any]:
    """
    Отправка email с результатами.
    
    Args:
        to_email: Email получателя
        subject: Тема письма
        body: Текст письма (опционально)
        corrected_file: Путь к исправленному файлу
        report_file: Путь к отчёту
        template: Шаблон письма
    
    Returns:
        Результат отправки
    """
    try:
        from app.services.email_service import EmailService
        
        email_service = EmailService()
        
        attachments = []
        if corrected_file and os.path.exists(corrected_file):
            attachments.append(corrected_file)
        if report_file and os.path.exists(report_file):
            attachments.append(report_file)
        
        result = email_service.send(
            to_email=to_email,
            subject=subject,
            body=body,
            template=template,
            attachments=attachments
        )
        
        return {
            'success': True,
            'to': to_email,
            'message_id': result.get('message_id')
        }
        
    except Exception as e:
        logger.exception(f"Error sending email to {to_email}: {e}")
        raise


@celery_app.task(name='cursa_tasks.cleanup_old_files')
def cleanup_old_files(days: int = 7) -> Dict[str, Any]:
    """
    Очистка старых файлов.
    
    Args:
        days: Удалять файлы старше N дней
    
    Returns:
        Статистика удаления
    """
    import shutil
    from datetime import datetime, timedelta
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    directories = [
        os.path.join(base_dir, 'app', 'static', 'corrections'),
        os.path.join(base_dir, 'app', 'static', 'reports'),
    ]
    
    cutoff_time = datetime.now() - timedelta(days=days)
    deleted_count = 0
    freed_bytes = 0
    errors = []
    
    for directory in directories:
        if not os.path.exists(directory):
            continue
            
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            
            try:
                mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
                
                if mtime < cutoff_time:
                    file_size = os.path.getsize(filepath)
                    os.remove(filepath)
                    deleted_count += 1
                    freed_bytes += file_size
                    logger.info(f"Deleted old file: {filename}")
                    
            except Exception as e:
                errors.append({'file': filename, 'error': str(e)})
                logger.error(f"Error deleting {filename}: {e}")
    
    return {
        'deleted_count': deleted_count,
        'freed_mb': round(freed_bytes / (1024 * 1024), 2),
        'errors': errors
    }


@celery_app.task(name='cursa_tasks.health_check')
def health_check() -> Dict[str, Any]:
    """
    Периодическая проверка здоровья системы.
    
    Returns:
        Статус компонентов
    """
    import psutil
    
    try:
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Проверяем критические пороги
        warnings = []
        
        if cpu_percent > 90:
            warnings.append(f"High CPU usage: {cpu_percent}%")
        
        if memory.percent > 90:
            warnings.append(f"High memory usage: {memory.percent}%")
        
        if disk.percent > 90:
            warnings.append(f"Low disk space: {100 - disk.percent}% free")
        
        return {
            'status': 'warning' if warnings else 'healthy',
            'cpu_percent': cpu_percent,
            'memory_percent': memory.percent,
            'disk_percent': disk.percent,
            'warnings': warnings,
            'timestamp': time.time()
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': time.time()
        }


@celery_app.task(bind=True, name='cursa_tasks.batch_process')
def batch_process(
    self,
    file_paths: list,
    profile_name: str = 'default',
    user_email: Optional[str] = None
) -> Dict[str, Any]:
    """
    Пакетная обработка нескольких документов.
    
    Args:
        file_paths: Список путей к файлам
        profile_name: Профиль нормоконтроля
        user_email: Email для отправки сводного отчёта
    
    Returns:
        Сводный результат обработки
    """
    results = []
    total = len(file_paths)
    
    for i, file_path in enumerate(file_paths):
        self.update_state(
            state='PROCESSING',
            meta={
                'current': i + 1,
                'total': total,
                'file': os.path.basename(file_path)
            }
        )
        
        try:
            # Синхронный вызов для пакетной обработки
            result = process_document(
                file_path=file_path,
                profile_name=profile_name,
                options={'generate_report': False}
            )
            results.append({
                'file': os.path.basename(file_path),
                'status': 'success',
                'result': result
            })
        except Exception as e:
            results.append({
                'file': os.path.basename(file_path),
                'status': 'error',
                'error': str(e)
            })
    
    # Отправляем сводный email
    if user_email:
        successful = sum(1 for r in results if r['status'] == 'success')
        send_email.delay(
            to_email=user_email,
            subject=f'Пакетная обработка завершена ({successful}/{total})',
            body=f'Обработано {successful} из {total} документов.',
            template='batch_summary'
        )
    
    return {
        'total': total,
        'successful': sum(1 for r in results if r['status'] == 'success'),
        'failed': sum(1 for r in results if r['status'] == 'error'),
        'results': results
    }
