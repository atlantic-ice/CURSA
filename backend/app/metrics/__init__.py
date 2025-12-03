"""
Модуль метрик CURSA.
"""

from app.metrics.prometheus import (
    metrics,
    MetricsCollector,
    track_request_time,
    track_document_processing,
    RequestMetricsMiddleware,
    init_app_metrics,
    record_document_upload,
    record_document_processed,
    record_error
)

__all__ = [
    'metrics',
    'MetricsCollector',
    'track_request_time',
    'track_document_processing',
    'RequestMetricsMiddleware',
    'init_app_metrics',
    'record_document_upload',
    'record_document_processed',
    'record_error'
]
