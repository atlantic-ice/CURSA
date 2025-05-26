"""Интеграционные тесты для API маршрутов."""
import os
import io
import pytest

def test_api_document_analysis_route_exists(client):
    """Тест существования маршрута для анализа документа."""
    # Отправляем пустой запрос, ожидаем ошибку 400 или 422, но не 404
    response = client.post('/api/document/analyze')
    assert response.status_code in [400, 422]
    assert response.status_code != 404

def test_document_analysis_with_invalid_data(client):
    """Тест анализа документа с неверными данными."""
    response = client.post('/api/document/analyze', data={
        'wrong_key': 'wrong_value'
    })
    assert response.status_code in [400, 422]
    
@pytest.mark.skip(reason="Требуется реальный docx файл для тестирования")
def test_document_analysis_with_valid_file(client):
    """Тест анализа документа с корректным файлом.
    
    Этот тест пропущен, так как требует реальный docx файл.
    Для запуска теста, создайте тестовый файл и уберите декоратор @pytest.mark.skip.
    """
    # Путь к тестовому файлу docx
    test_file_path = os.path.join(os.path.dirname(__file__), '..', 'test_data', 'test_document.docx')
    
    if not os.path.exists(test_file_path):
        pytest.skip(f"Тестовый файл не найден: {test_file_path}")
    
    with open(test_file_path, 'rb') as f:
        file_data = io.BytesIO(f.read())
    
    response = client.post(
        '/api/document/analyze',
        data={
            'file': (file_data, 'test_document.docx')
        },
        content_type='multipart/form-data'
    )
    
    assert response.status_code == 200
    assert 'analysis' in response.json 