"""
Модуль Celery задач CURSA.
"""

from app.tasks.celery_tasks import (
    celery_app,
    process_document,
    send_email,
    cleanup_old_files,
    health_check,
    batch_process
)

__all__ = [
    'celery_app',
    'process_document',
    'send_email',
    'cleanup_old_files',
    'health_check',
    'batch_process'
]
