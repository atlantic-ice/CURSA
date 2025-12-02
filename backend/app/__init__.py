from flask import Flask, send_from_directory, send_file, jsonify, request, Response
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler
import sys
from app.config.security import (
    MAX_CONTENT_LENGTH,
    SECURITY_HEADERS,
    RATE_LIMITS,
)


def _collect_allowed_origins():
    default_origins = {
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
    }
    env_origins = os.getenv('FRONTEND_ORIGINS', '')
    for origin in env_origins.split(','):
        cleaned = origin.strip()
        if cleaned:
            default_origins.add(cleaned)
    return sorted(default_origins)


def setup_rate_limiting(app):
    """Настройка rate limiting (если flask-limiter установлен)"""
    try:
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address
        
        limiter = Limiter(
            key_func=get_remote_address,
            app=app,
            default_limits=[RATE_LIMITS['default']],
            storage_uri="memory://",
        )
        app.limiter = limiter
        if not app.config.get('TESTING'):
            app.logger.info("Rate limiting включен: %s", RATE_LIMITS['default'])
        return limiter
    except ImportError:
        if not app.config.get('TESTING'):
            app.logger.warning(
                "flask-limiter не установлен. Rate limiting отключен. "
                "Установите: pip install flask-limiter"
            )
        return None


def setup_security_headers(app):
    """Добавляет security headers ко всем ответам"""
    @app.after_request
    def add_security_headers(response: Response) -> Response:
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value
        return response

def create_app():
    # Load repository-level .env if present so env vars like PINTEREST_RSS_URL are available
    try:
        repo_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
        if os.path.exists(repo_env):
            load_dotenv(repo_env)
        else:
            # fallback to any default .env on PYTHONPATH
            load_dotenv()
    except Exception:
        # don't fail startup if dotenv isn't available or there's an issue reading the file
        pass

    app = Flask(__name__)
    
    # Проверяем, запущено ли приложение в тестовом режиме
    is_testing = os.environ.get('FLASK_TESTING') == '1'
    if is_testing:
        app.config['TESTING'] = True
    
    # === Конфигурация безопасности ===
    app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
    
    # Настройка CORS с правильными параметрами
    cors_origins = _collect_allowed_origins()
    CORS(app, 
        origins=cors_origins,
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization'],
        supports_credentials=True)
    
    # Настройка логгирования (отключено в тестовом режиме)
    setup_logging(app)
    if not is_testing:
        app.logger.info('CORS origins: %s', cors_origins)
    
    # === Security Headers ===
    setup_security_headers(app)
    
    # === Rate Limiting ===
    setup_rate_limiting(app)
    
    # Директория для исправленных файлов
    corrections_dir = os.path.join(app.root_path, 'static', 'corrections')
    os.makedirs(corrections_dir, exist_ok=True)
    if not is_testing:
        app.logger.info(f"Директория для исправленных файлов: {corrections_dir}")
    
    # Подключаем Swagger документацию (если flasgger установлен)
    try:
        from flasgger import Swagger
        from app.api.swagger_config import SWAGGER_CONFIG, SWAGGER_TEMPLATE
        Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)
        if not is_testing:
            app.logger.info("Swagger UI доступен по адресу /api/docs/")
    except ImportError:
        if not is_testing:
            app.logger.warning("flasgger не установлен. Swagger UI недоступен. Установите: pip install flasgger")
    except Exception as e:
        if not is_testing:
            app.logger.warning(f"Не удалось инициализировать Swagger: {e}")
    
    # Регистрация API маршрутов
    from app.api import document_routes
    from app.api import profile_routes
    app.register_blueprint(document_routes.bp)
    app.register_blueprint(profile_routes.bp)
    
    # Маршрут для API документации (JSON)
    @app.route('/api/openapi.json')
    def openapi_spec():
        """Возвращает OpenAPI спецификацию в формате JSON"""
        from app.api.swagger_config import SWAGGER_TEMPLATE
        return jsonify(SWAGGER_TEMPLATE)
    
    # Маршрут для прямого доступа к исправленным файлам
    @app.route('/corrections/<path:filename>')
    def serve_correction(filename):
        app.logger.info(f"Запрос на скачивание файла: {filename}")
        file_path = os.path.join(corrections_dir, filename)
        if not os.path.exists(file_path):
            app.logger.error(f"Файл не найден: {file_path}")
            return "File not found", 404
        
        # Используем send_file с правильным MIME-типом для docx
        return send_file(
            file_path,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=filename
        )
    
    return app

def setup_logging(app):
    """Настройка логирования приложения"""
    # Если приложение в тестовом режиме, минимизируем логирование
    if app.config.get('TESTING'):
        app.logger.handlers = []
        app.logger.setLevel(logging.ERROR)
        # Добавляем только NullHandler чтобы избежать ошибок
        app.logger.addHandler(logging.NullHandler())
        return
    
    log_dir = os.path.join(app.root_path, 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Создаем форматтер для логов
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s в %(module)s: %(message)s'
    )
    
    # Настройка логирования в файл с UTF-8
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, 'app.log'), 
        maxBytes=10485760,  # 10MB
        backupCount=10,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    
    # Настройка логирования в консоль с UTF-8
    import io
    console_handler = logging.StreamHandler(
        io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
    )
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)
    
    # Сначала очищаем существующие обработчики (если есть), затем добавляем наши
    app.logger.handlers = []
    app.logger.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    
    app.logger.info("Логирование настроено")