from flask import Flask, send_from_directory
from flask_cors import CORS
import os
import logging
from logging.handlers import RotatingFileHandler
import sys

def create_app():
    app = Flask(__name__)
    CORS(app)
    
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
    
    # Настройка логирования в файл
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, 'app.log'), 
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    
    # Настройка логирования в консоль
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)
    
    # Добавляем обработчики к логгеру приложения
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.INFO)
    
    # Заменяем стандартный обработчик Flask на наш
    for handler in app.logger.handlers:
        app.logger.removeHandler(handler)
    
    app.logger.info("Логирование настроено") 