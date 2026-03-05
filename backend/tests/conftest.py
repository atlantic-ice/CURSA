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
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import db as _db


@pytest.fixture
def app():
    """Создает и настраивает экземпляр приложения Flask для тестирования."""
    import os
    import logging

    # Устанавливаем переменные окружения для тестового режима
    os.environ["FLASK_TESTING"] = "1"
    os.environ["FLASK_ENV"] = "testing"

    # Отключаем логирование полностью во время тестов
    logging.disable(logging.CRITICAL)

    app = create_app()
    app.config.update(
        {
            "TESTING": True,
            "DEBUG": False,
            "GOOGLE_CLIENT_ID": "test-google-client-id",
            "GOOGLE_CLIENT_SECRET": "test-google-client-secret",
            "GITHUB_CLIENT_ID": "test-github-client-id",
            "GITHUB_CLIENT_SECRET": "test-github-client-secret",
            "YANDEX_CLIENT_ID": "test-yandex-client-id",
            "YANDEX_CLIENT_SECRET": "test-yandex-client-secret",
        }
    )

    # Создаем тестовый контекст приложения и схему БД
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()

    # Восстанавливаем логирование после тестов
    logging.disable(logging.NOTSET)
    if "FLASK_TESTING" in os.environ:
        del os.environ["FLASK_TESTING"]
    if "FLASK_ENV" in os.environ:
        del os.environ["FLASK_ENV"]


@pytest.fixture
def db(app):
    """Возвращает объект SQLAlchemy для тестов."""
    return _db


@pytest.fixture
def client(app):
    """Создает тестовый клиент."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Создает CLI runner для тестирования команд Flask."""
    return app.test_cli_runner()


@pytest.fixture
def test_user(app, db):
    """Создает тестового пользователя для тестов"""
    from app.models import User, UserRole

    user = User(
        email="test@example.com",
        first_name="Test",
        last_name="User",
        role=UserRole.USER,
        is_active=True,
        is_email_verified=True,
    )
    user.set_password("TestPassword123!")

    db.session.add(user)
    db.session.commit()

    return user


@pytest.fixture
def user_id(test_user):
    """Возвращает ID тестового пользователя"""
    return test_user.id


@pytest.fixture
def auth_headers(app, test_user):
    """Возвращает headers с JWT токеном"""
    from flask_jwt_extended import create_access_token

    with app.app_context():
        access_token = create_access_token(identity=str(test_user.id))
        return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def user_with_2fa(app, db):
    """Создает пользователя с включенной 2FA"""
    from app.models import User, UserRole
    from app.services.totp_service import totp_service

    user = User(
        email="2fa_user@example.com",
        first_name="2FA",
        last_name="User",
        role=UserRole.USER,
        is_active=True,
        is_email_verified=True,
    )
    user.set_password("TestPassword123!")

    # Генерируем secret для 2FA
    secret = totp_service.generate_secret()
    user.enable_2fa(secret)  # This generates and stores backup codes

    db.session.add(user)
    db.session.commit()

    return user
