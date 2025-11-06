from flask import Flask, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler
import sys

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
    CORS(app, 
         origins=['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization'],
         supports_credentials=True)
    
    # Настройка логгирования
    setup_logging(app)
    
    # Директория для исправленных файлов
    corrections_dir = os.path.join(app.root_path, 'static', 'corrections')
    os.makedirs(corrections_dir, exist_ok=True)
    app.logger.info(f"Директория для исправленных файлов: {corrections_dir}")
    
    # Регистрация API маршрутов
    from app.api import document_routes
    app.register_blueprint(document_routes.bp)
    
    # Маршрут для прямого доступа к исправленным файлам
    @app.route('/corrections/<path:filename>')
    def serve_correction(filename):
        app.logger.info(f"Запрос на скачивание файла: {filename}")
        return send_from_directory(corrections_dir, filename)
    
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