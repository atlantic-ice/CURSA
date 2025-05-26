#!/usr/bin/env python
"""
Скрипт запуска Flask-приложения нормоконтроля DOCX-документов
"""
import sys
import os

# Добавляем директорию приложения в sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app

def main():
    """
    Основная функция запуска приложения
    """
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    main() 