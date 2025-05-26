#!/usr/bin/env python
"""
Точка входа для запуска Flask-приложения нормоконтроля документов
"""
import sys
import os

# Добавляем родительскую директорию в sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Теперь импортируем из пакета app, используя абсолютный путь
from app import create_app

app = create_app()

# Маршрут для проверки состояния API
@app.route('/api/health')
def health_check():
    """
    Маршрут для проверки работоспособности API
    """
    return {'status': 'ok', 'message': 'API работает нормально'}, 200

if __name__ == '__main__':
    app.run(debug=True) 