"""
Расширенные Prometheus-метрики для CURSA.
Включает кастомные счётчики, гистограммы и метрики бизнес-логики.
"""

import time
import functools
from typing import Callable, Any, Dict, Optional
from flask import request, g
import threading

# Потокобезопасное хранилище метрик
_lock = threading.Lock()


class MetricsCollector:
    """
    Сборщик метрик для Prometheus.
    Поддерживает counters, gauges, histograms.
    """
    
    def __init__(self):
        self._counters: Dict[str, float] = {}
        self._gauges: Dict[str, float] = {}
        self._histograms: Dict[str, Dict] = {}
        self._labels: Dict[str, Dict[str, Any]] = {}
    
    def counter_inc(self, name: str, value: float = 1, labels: Dict[str, str] = None):
        """Увеличивает счётчик"""
        key = self._make_key(name, labels)
        with _lock:
            self._counters[key] = self._counters.get(key, 0) + value
            if labels:
                self._labels[key] = labels
    
    def gauge_set(self, name: str, value: float, labels: Dict[str, str] = None):
        """Устанавливает значение gauge"""
        key = self._make_key(name, labels)
        with _lock:
            self._gauges[key] = value
            if labels:
                self._labels[key] = labels
    
    def gauge_inc(self, name: str, value: float = 1, labels: Dict[str, str] = None):
        """Увеличивает gauge"""
        key = self._make_key(name, labels)
        with _lock:
            self._gauges[key] = self._gauges.get(key, 0) + value
            if labels:
                self._labels[key] = labels
    
    def gauge_dec(self, name: str, value: float = 1, labels: Dict[str, str] = None):
        """Уменьшает gauge"""
        self.gauge_inc(name, -value, labels)
    
    def histogram_observe(self, name: str, value: float, labels: Dict[str, str] = None):
        """Добавляет наблюдение в гистограмму"""
        key = self._make_key(name, labels)
        
        # Стандартные бакеты
        buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, float('inf')]
        
        with _lock:
            if key not in self._histograms:
                self._histograms[key] = {
                    'buckets': {b: 0 for b in buckets},
                    'sum': 0,
                    'count': 0
                }
            
            hist = self._histograms[key]
            hist['sum'] += value
            hist['count'] += 1
            
            for bucket in buckets:
                if value <= bucket:
                    hist['buckets'][bucket] += 1
            
            if labels:
                self._labels[key] = labels
    
    def _make_key(self, name: str, labels: Dict[str, str] = None) -> str:
        """Создаёт уникальный ключ для метрики с labels"""
        if not labels:
            return name
        label_str = ','.join(f'{k}="{v}"' for k, v in sorted(labels.items()))
        return f'{name}{{{label_str}}}'
    
    def get_counter(self, name: str, labels: Dict[str, str] = None) -> float:
        """Получает значение счётчика"""
        key = self._make_key(name, labels)
        with _lock:
            return self._counters.get(key, 0)
    
    def get_gauge(self, name: str, labels: Dict[str, str] = None) -> float:
        """Получает значение gauge"""
        key = self._make_key(name, labels)
        with _lock:
            return self._gauges.get(key, 0)
    
    def export_prometheus(self) -> str:
        """Экспортирует все метрики в формате Prometheus"""
        lines = []
        
        # Экспорт counters
        exported_counters = set()
        with _lock:
            for key, value in self._counters.items():
                name = key.split('{')[0]
                if name not in exported_counters:
                    lines.append(f'# HELP {name} Counter metric')
                    lines.append(f'# TYPE {name} counter')
                    exported_counters.add(name)
                lines.append(f'{key} {value}')
        
        # Экспорт gauges
        exported_gauges = set()
        with _lock:
            for key, value in self._gauges.items():
                name = key.split('{')[0]
                if name not in exported_gauges:
                    lines.append(f'# HELP {name} Gauge metric')
                    lines.append(f'# TYPE {name} gauge')
                    exported_gauges.add(name)
                lines.append(f'{key} {value}')
        
        # Экспорт histograms
        exported_histograms = set()
        with _lock:
            for key, hist in self._histograms.items():
                name = key.split('{')[0]
                labels_part = key[len(name):] if '{' in key else ''
                
                if name not in exported_histograms:
                    lines.append(f'# HELP {name} Histogram metric')
                    lines.append(f'# TYPE {name} histogram')
                    exported_histograms.add(name)
                
                for bucket, count in hist['buckets'].items():
                    bucket_label = f'le="{bucket}"' if bucket != float('inf') else 'le="+Inf"'
                    if labels_part:
                        lines.append(f'{name}_bucket{{{labels_part[1:-1]},{bucket_label}}} {count}')
                    else:
                        lines.append(f'{name}_bucket{{{bucket_label}}} {count}')
                
                lines.append(f'{name}_sum{labels_part} {hist["sum"]}')
                lines.append(f'{name}_count{labels_part} {hist["count"]}')
        
        return '\n'.join(lines)


# Глобальный экземпляр
metrics = MetricsCollector()


def track_request_time(func: Callable = None, name: str = None):
    """
    Декоратор для отслеживания времени выполнения запроса.
    
    Использование:
        @track_request_time
        def my_endpoint():
            ...
        
        @track_request_time(name='custom_metric')
        def another_endpoint():
            ...
    """
    def decorator(f: Callable) -> Callable:
        metric_name = name or f'cursa_request_duration_seconds'
        
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = f(*args, **kwargs)
                status = 'success'
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                endpoint = request.endpoint or 'unknown'
                method = request.method
                
                metrics.histogram_observe(
                    metric_name,
                    duration,
                    {'endpoint': endpoint, 'method': method, 'status': status}
                )
                metrics.counter_inc(
                    'cursa_requests_total',
                    labels={'endpoint': endpoint, 'method': method, 'status': status}
                )
            
            return result
        return wrapper
    
    if func is not None:
        return decorator(func)
    return decorator


def track_document_processing(stage: str):
    """Декоратор для отслеживания этапов обработки документа"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            metrics.gauge_inc('cursa_documents_in_progress', labels={'stage': stage})
            
            try:
                result = func(*args, **kwargs)
                status = 'success'
                metrics.counter_inc('cursa_documents_stage_total', labels={'stage': stage, 'status': status})
            except Exception as e:
                status = 'error'
                metrics.counter_inc('cursa_documents_stage_total', labels={'stage': stage, 'status': status})
                metrics.counter_inc('cursa_errors_total', labels={'stage': stage, 'type': type(e).__name__})
                raise
            finally:
                duration = time.time() - start_time
                metrics.gauge_dec('cursa_documents_in_progress', labels={'stage': stage})
                metrics.histogram_observe(
                    'cursa_document_stage_duration_seconds',
                    duration,
                    {'stage': stage}
                )
            
            return result
        return wrapper
    return decorator


class RequestMetricsMiddleware:
    """
    Middleware для сбора метрик HTTP-запросов.
    """
    
    def __init__(self, app):
        self.app = app
        self._setup_hooks()
    
    def _setup_hooks(self):
        @self.app.before_request
        def before_request():
            g.start_time = time.time()
            metrics.gauge_inc('cursa_active_requests')
        
        @self.app.after_request
        def after_request(response):
            if hasattr(g, 'start_time'):
                duration = time.time() - g.start_time
                endpoint = request.endpoint or 'unknown'
                method = request.method
                status_code = str(response.status_code)
                
                metrics.histogram_observe(
                    'cursa_http_request_duration_seconds',
                    duration,
                    {'endpoint': endpoint, 'method': method}
                )
                
                metrics.counter_inc(
                    'cursa_http_requests_total',
                    labels={'method': method, 'status': status_code}
                )
            
            metrics.gauge_dec('cursa_active_requests')
            return response
        
        @self.app.teardown_request
        def teardown_request(exception):
            if exception:
                metrics.counter_inc(
                    'cursa_http_exceptions_total',
                    labels={'type': type(exception).__name__}
                )


# Предопределённые метрики приложения
def init_app_metrics():
    """Инициализирует метрики приложения"""
    metrics.gauge_set('cursa_info', 1, {'version': '1.2.0', 'env': 'production'})
    metrics.gauge_set('cursa_active_requests', 0)
    metrics.gauge_set('cursa_documents_in_progress', 0)


# Функции для использования в коде
def record_document_upload(file_size: int, file_type: str):
    """Записывает метрику загрузки документа"""
    metrics.counter_inc('cursa_documents_uploaded_total', labels={'type': file_type})
    metrics.histogram_observe('cursa_document_size_bytes', file_size, {'type': file_type})


def record_document_processed(corrections_count: int, processing_time: float):
    """Записывает метрику обработанного документа"""
    metrics.counter_inc('cursa_documents_processed_total')
    metrics.histogram_observe('cursa_processing_time_seconds', processing_time)
    metrics.histogram_observe('cursa_corrections_per_document', corrections_count)


def record_error(error_type: str, component: str):
    """Записывает ошибку"""
    metrics.counter_inc('cursa_errors_total', labels={'type': error_type, 'component': component})
