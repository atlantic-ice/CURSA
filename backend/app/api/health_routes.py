"""
Health Check и Metrics для CURSA API.
Предоставляет endpoints для мониторинга состояния сервиса.
"""

from flask import Blueprint, jsonify, current_app
import os
import time
import datetime
import psutil
from typing import Dict, Any

bp = Blueprint('health', __name__, url_prefix='/api')

# Время запуска приложения
START_TIME = time.time()

# Счётчики для метрик
_metrics = {
    'documents_processed': 0,
    'documents_corrected': 0,
    'errors_count': 0,
    'last_request_time': None
}


def increment_metric(name: str, value: int = 1) -> None:
    """Увеличивает значение метрики"""
    if name in _metrics:
        _metrics[name] += value
    _metrics['last_request_time'] = datetime.datetime.now().isoformat()


def get_dir_size_mb(path: str) -> float:
    """Вычисляет размер директории в мегабайтах"""
    total_size = 0
    if os.path.exists(path):
        for dirpath, dirnames, filenames in os.walk(path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                try:
                    total_size += os.path.getsize(fp)
                except (OSError, IOError):
                    pass
    return round(total_size / (1024 * 1024), 2)


def get_files_count(path: str, extension: str = None) -> int:
    """Подсчитывает количество файлов в директории"""
    count = 0
    if os.path.exists(path):
        for f in os.listdir(path):
            if extension is None or f.endswith(extension):
                count += 1
    return count


def check_component_health(name: str) -> Dict[str, Any]:
    """Проверяет здоровье компонента"""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    checks = {
        'storage': lambda: os.path.exists(os.path.join(base_dir, 'app', 'static', 'corrections')),
        'profiles': lambda: os.path.exists(os.path.join(base_dir, 'profiles')),
        'logs': lambda: os.path.exists(os.path.join(base_dir, 'app', 'logs')),
    }
    
    if name in checks:
        try:
            healthy = checks[name]()
            return {'status': 'healthy' if healthy else 'unhealthy', 'accessible': healthy}
        except Exception as e:
            return {'status': 'unhealthy', 'error': str(e)}
    
    return {'status': 'unknown'}


@bp.route('/health', methods=['GET'])
def health_check():
    """
    Базовая проверка здоровья API.
    
    Возвращает:
    - status: healthy/degraded/unhealthy
    - version: версия API
    - uptime_seconds: время работы
    """
    uptime = time.time() - START_TIME
    
    # Проверяем компоненты
    components = {
        'api': {'status': 'healthy'},
        'storage': check_component_health('storage'),
        'profiles': check_component_health('profiles')
    }
    
    # Определяем общий статус
    unhealthy_count = sum(1 for c in components.values() if c.get('status') == 'unhealthy')
    
    if unhealthy_count == 0:
        status = 'healthy'
    elif unhealthy_count < len(components):
        status = 'degraded'
    else:
        status = 'unhealthy'
    
    return jsonify({
        'status': status,
        'version': '1.1.0',
        'uptime_seconds': round(uptime, 2),
        'uptime_human': str(datetime.timedelta(seconds=int(uptime))),
        'timestamp': datetime.datetime.now().isoformat(),
        'components': components
    }), 200 if status != 'unhealthy' else 503


@bp.route('/health/detailed', methods=['GET'])
def health_detailed():
    """
    Детальная проверка здоровья с метриками.
    
    Включает:
    - Все данные базового health check
    - Системные метрики (CPU, память, диск)
    - Статистику по файлам
    - Счётчики операций
    """
    uptime = time.time() - START_TIME
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Пути к директориям
    corrections_dir = os.path.join(base_dir, 'app', 'static', 'corrections')
    reports_dir = os.path.join(base_dir, 'app', 'static', 'reports')
    profiles_dir = os.path.join(base_dir, 'profiles')
    logs_dir = os.path.join(base_dir, 'app', 'logs')
    
    # Системные метрики
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        system_metrics = {
            'cpu_percent': cpu_percent,
            'memory': {
                'total_gb': round(memory.total / (1024**3), 2),
                'available_gb': round(memory.available / (1024**3), 2),
                'percent_used': memory.percent
            },
            'disk': {
                'total_gb': round(disk.total / (1024**3), 2),
                'free_gb': round(disk.free / (1024**3), 2),
                'percent_used': disk.percent
            }
        }
    except Exception:
        system_metrics = {'error': 'Unable to collect system metrics'}
    
    # Статистика по файлам
    storage_stats = {
        'corrections': {
            'count': get_files_count(corrections_dir, '.docx'),
            'size_mb': get_dir_size_mb(corrections_dir)
        },
        'reports': {
            'count': get_files_count(reports_dir, '.docx'),
            'size_mb': get_dir_size_mb(reports_dir)
        },
        'profiles': {
            'count': get_files_count(profiles_dir, '.json'),
            'size_mb': get_dir_size_mb(profiles_dir)
        },
        'logs': {
            'size_mb': get_dir_size_mb(logs_dir)
        }
    }
    
    # Компоненты
    components = {
        'api': {'status': 'healthy'},
        'storage': check_component_health('storage'),
        'profiles': check_component_health('profiles'),
        'logs': check_component_health('logs')
    }
    
    unhealthy_count = sum(1 for c in components.values() if c.get('status') == 'unhealthy')
    status = 'healthy' if unhealthy_count == 0 else ('degraded' if unhealthy_count < len(components) else 'unhealthy')
    
    return jsonify({
        'status': status,
        'version': '1.1.0',
        'environment': os.environ.get('FLASK_ENV', 'development'),
        'uptime': {
            'seconds': round(uptime, 2),
            'human': str(datetime.timedelta(seconds=int(uptime)))
        },
        'timestamp': datetime.datetime.now().isoformat(),
        'components': components,
        'system': system_metrics,
        'storage': storage_stats,
        'metrics': _metrics
    }), 200 if status != 'unhealthy' else 503


@bp.route('/health/live', methods=['GET'])
def liveness_probe():
    """
    Kubernetes liveness probe.
    Простая проверка, что приложение работает.
    """
    return jsonify({'status': 'alive'}), 200


@bp.route('/health/ready', methods=['GET'])
def readiness_probe():
    """
    Kubernetes readiness probe.
    Проверяет, готово ли приложение принимать запросы.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    profiles_dir = os.path.join(base_dir, 'profiles')
    
    # Проверяем наличие профилей
    profiles_ok = os.path.exists(profiles_dir) and len([
        f for f in os.listdir(profiles_dir) if f.endswith('.json')
    ]) > 0
    
    if profiles_ok:
        return jsonify({'status': 'ready'}), 200
    else:
        return jsonify({'status': 'not_ready', 'reason': 'Profiles not loaded'}), 503


@bp.route('/metrics', methods=['GET'])
def prometheus_metrics():
    """
    Метрики в формате Prometheus.
    """
    uptime = time.time() - START_TIME
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    corrections_dir = os.path.join(base_dir, 'app', 'static', 'corrections')
    profiles_dir = os.path.join(base_dir, 'profiles')
    
    # Формируем метрики в формате Prometheus
    metrics_text = f"""# HELP cursa_uptime_seconds Time since application start
# TYPE cursa_uptime_seconds gauge
cursa_uptime_seconds {round(uptime, 2)}

# HELP cursa_documents_processed_total Total documents processed
# TYPE cursa_documents_processed_total counter
cursa_documents_processed_total {_metrics['documents_processed']}

# HELP cursa_documents_corrected_total Total documents corrected
# TYPE cursa_documents_corrected_total counter
cursa_documents_corrected_total {_metrics['documents_corrected']}

# HELP cursa_errors_total Total errors encountered
# TYPE cursa_errors_total counter
cursa_errors_total {_metrics['errors_count']}

# HELP cursa_corrections_files_count Number of corrected files stored
# TYPE cursa_corrections_files_count gauge
cursa_corrections_files_count {get_files_count(corrections_dir, '.docx')}

# HELP cursa_corrections_size_bytes Size of corrections directory
# TYPE cursa_corrections_size_bytes gauge
cursa_corrections_size_bytes {int(get_dir_size_mb(corrections_dir) * 1024 * 1024)}

# HELP cursa_profiles_count Number of profiles
# TYPE cursa_profiles_count gauge
cursa_profiles_count {get_files_count(profiles_dir, '.json')}
"""
    
    from flask import Response
    return Response(metrics_text, mimetype='text/plain')
