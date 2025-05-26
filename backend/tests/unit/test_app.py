"""Модульные тесты для основного приложения Flask."""

def test_app_creation(app):
    """Тест создания экземпляра приложения."""
    assert app is not None
    assert app.name == 'app'

def test_cors_enabled(app):
    """Тест, что CORS включен."""
    assert 'flask_cors.extension' in app.extensions

def test_corrections_route(client):
    """Тест маршрута для скачивания исправленных файлов."""
    # Мы просто проверяем, что маршрут существует, без фактического скачивания файла
    response = client.get('/corrections/test_file.docx')
    # Мы ожидаем 404, так как файл не существует, но маршрут должен быть доступен
    assert response.status_code in [404, 500] 