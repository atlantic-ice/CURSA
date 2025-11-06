#!/usr/bin/env python
"""
Скрипт запуска Flask-приложения нормоконтроля DOCX-документов
"""
import sys
import os

from dotenv import load_dotenv

# Добавляем директорию приложения в sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app

def main():
    """
    Основная функция запуска приложения
    """
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(project_root, '.env')
    load_dotenv(env_path, override=False)

    app = create_app()
    # Используем FLASK_DEBUG из переменных окружения (по умолчанию False для production)
    debug_mode = os.environ.get('FLASK_DEBUG', '0') == '1'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    main() 