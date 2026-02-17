#!/usr/bin/env python
"""
Database initialization script

Создает таблицы БД и применяет миграции
"""

import os
import sys

# Добавляем родительскую директорию в sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db  
from app.models import User, Subscription, Document, Payment, APIKey


def init_db():
    """Инициализация базы данных"""
    app = create_app()
    
    with app.app_context():
        # Создаем все таблицы
        db.create_all()
        print("✅ Таблицы базы данных созданы успешно!")
        
        # Проверяем созданные таблицы
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"\n📋 Созданные таблицы ({len(tables)}):")
        for table in tables:
            print(f"  - {table}")


if __name__ == '__main__':
    init_db()
