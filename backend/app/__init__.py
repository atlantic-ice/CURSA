from flask import Flask, send_from_directory, send_file, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler
import sys


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
    
    # Настройка CORS с правильными параметрами
    cors_origins = _collect_allowed_origins()
    CORS(app, 
        origins=cors_origins,
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization'],
        supports_credentials=True)
    
    # Настройка логгирования
    setup_logging(app)
    app.logger.info('CORS origins: %s', cors_origins)
    
    # Директория для исправленных файлов
    corrections_dir = os.path.join(app.root_path, 'static', 'corrections')
    os.makedirs(corrections_dir, exist_ok=True)
    app.logger.info(f"Директория для исправленных файлов: {corrections_dir}")
    
    # Подключаем Swagger документацию (если flasgger установлен)
    try:
        from flasgger import Swagger
        from app.api.swagger_config import SWAGGER_CONFIG, SWAGGER_TEMPLATE
        Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)
        app.logger.info("Swagger UI доступен по адресу /api/docs/")
    except ImportError:
        app.logger.warning("flasgger не установлен. Swagger UI недоступен. Установите: pip install flasgger")
    except Exception as e:
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