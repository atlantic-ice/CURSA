"""
Конфигурация и общие фикстуры для тестов
"""
import os
import sys
import pytest
from pathlib import Path
import json
import logging

# Настраиваем логирование
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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


@pytest.hookimpl(tryfirst=True)
def pytest_sessionfinish(session, exitstatus):
    """
    Хук, выполняющийся после завершения всех тестов
    Сохраняет результаты тестов в JSON-файл
    """
    # Собираем результаты всех тестов
    test_results = []
    
    for item in session.items:
        # Получаем результат теста
        report = getattr(item, '_report', None)
        if not report:
            continue
            
        # Определяем тип теста
        test_type = "unit"
        if hasattr(item, 'keywords'):
            if 'integration' in item.keywords:
                test_type = "integration"
            elif 'api' in item.keywords:
                test_type = "api"
            elif 'functional' in item.keywords:
                test_type = "functional"
        
        # Сохраняем информацию о тесте
        test_results.append({
            'test_id': item.nodeid,
            'test_name': item.name,
            'test_type': test_type,
            'passed': report.passed,
            'duration': getattr(report, 'duration', 0),
            'failed': report.failed if hasattr(report, 'failed') else False,
            'skipped': report.skipped if hasattr(report, 'skipped') else False
        })
    
    # Сохраняем результаты в соответствующий файл
    result_files = {
        'unit': RESULTS_DIR / "unit_test_results.json",
        'functional': RESULTS_DIR / "test_results.json",
        'api': RESULTS_DIR / "api_test_results.json",
        'integration': RESULTS_DIR / "integration_test_results.json"
    }
    
    for test_type, file_path in result_files.items():
        # Фильтруем результаты по типу теста
        filtered_results = [r for r in test_results if r['test_type'] == test_type]
        
        if filtered_results:
            # Сохраняем результаты
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(filtered_results, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Результаты тестов типа '{test_type}' сохранены в {file_path}")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Хук для отслеживания результатов выполнения тестов
    """
    # Стандартный хук pytest
    outcome = yield
    report = outcome.get_result()
    
    # Сохраняем отчет о тесте
    if report.when == "call":
        item._report = report

# Добавляем корневую директорию проекта в PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app

@pytest.fixture
def app():
    """Создает и настраивает экземпляр приложения Flask для тестирования."""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "DEBUG": False,
    })
    
    # Создаем тестовый контекст приложения
    with app.app_context():
        yield app

@pytest.fixture
def client(app):
    """Создает тестовый клиент."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Создает CLI runner для тестирования команд Flask."""
    return app.test_cli_runner() 