"""
Конфигурация и общие фикстуры для тестов
"""
import os
import sys
import pytest
from pathlib import Path
import json

# Константы
TEST_DATA_DIR = Path(__file__).parent / "test_data"
RESULTS_DIR = TEST_DATA_DIR / "results"

# Создаем директорию для результатов, если она не существует
os.makedirs(RESULTS_DIR, exist_ok=True)


def pytest_configure(config):
    """
    Регистрация кастомных маркеров для pytest
    """
    config.addinivalue_line("markers", "unit: модульные тесты")
    config.addinivalue_line("markers", "functional: функциональные тесты")
    config.addinivalue_line("markers", "api: тесты API")
    config.addinivalue_line("markers", "integration: интеграционные тесты")


def pytest_collection_modifyitems(items):
    """
    Автоматическая разметка тестов на основе их расположения в директориях
    """
    for item in items:
        module_path = item.module.__file__
        
        # Определяем тип теста по директории
        if "unit" in module_path:
            item.add_marker(pytest.mark.unit)
        elif "functional" in module_path:
            if "api" in module_path:
                item.add_marker(pytest.mark.api)
            item.add_marker(pytest.mark.functional)
        elif "integration" in module_path:
            item.add_marker(pytest.mark.integration)


# Добавляем корневую директорию проекта в PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app

@pytest.fixture
def app():
    """Создает и настраивает экземпляр приложения Flask для тестирования."""
    import os
    import logging
    
    # Устанавливаем переменную окружения для тестового режима
    os.environ['FLASK_TESTING'] = '1'
    
    # Отключаем логирование полностью во время тестов
    logging.disable(logging.CRITICAL)
    
    app = create_app()
    app.config.update({
        "TESTING": True,
        "DEBUG": False,
    })
    
    # Создаем тестовый контекст приложения
    with app.app_context():
        yield app
    
    # Восстанавливаем логирование после тестов
    logging.disable(logging.NOTSET)
    if 'FLASK_TESTING' in os.environ:
        del os.environ['FLASK_TESTING']

@pytest.fixture
def client(app):
    """Создает тестовый клиент."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Создает CLI runner для тестирования команд Flask."""
    return app.test_cli_runner() 