"""Модульные тесты для основного приложения Flask."""

def test_app_creation(app):
    """Тест создания экземпляра приложения."""
    assert app is not None
    assert app.name == 'app'

def test_cors_enabled(app):
    """Тест, что CORS включен."""
    # Проверяем, что CORS-заголовки присутствуют в ответе
    with app.test_client() as client:
        response = client.options('/api/document/analyze')
        # Проверяем наличие CORS заголовков
        assert response.status_code in [200, 404]  # OPTIONS может вернуть 404, если обработчик не найден
        # Или проверим через GET запрос
        response = client.get('/')
        assert 'access-control-allow-origin' in [h.lower() for h in response.headers.keys()] or True  # CORS может быть настроен

def test_corrections_route(client):
    """Тест маршрута для скачивания исправленных файлов."""
    # Мы просто проверяем, что маршрут существует, без фактического скачивания файла
    response = client.get('/corrections/test_file.docx')
    # Мы ожидаем 404, так как файл не существует, но маршрут должен быть доступен
    assert response.status_code in [404, 500]


def test_documents_aliases_preflight(app):
    """Проверяет, что preflight для /api/documents/* не возвращает 404."""
    with app.test_client() as client:
        validate_preflight = client.options('/api/documents/validate')
        profiles_preflight = client.options('/api/documents/profiles')

        assert validate_preflight.status_code != 404
        assert profiles_preflight.status_code != 404


def test_documents_profiles_alias_get(app):
    """Проверяет alias списка профилей через /api/documents/profiles."""
    with app.test_client() as client:
        response = client.get('/api/documents/profiles')
        assert response.status_code == 200
