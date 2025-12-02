"""Интеграционные тесты для API маршрутов."""
import os
import io
import pytest
import tempfile
from docx import Document


def test_api_document_upload_route_exists(client):
    """Тест существования маршрута для загрузки документа."""
    # Отправляем пустой запрос, ожидаем ошибку 400, но не 404
    response = client.post('/api/document/upload')
    assert response.status_code != 404, "Route /api/document/upload should exist"
    assert response.status_code == 400  # Нет файла


def test_document_upload_with_invalid_data(client):
    """Тест загрузки документа с неверными данными."""
    response = client.post('/api/document/upload', data={
        'wrong_key': 'wrong_value'
    })
    assert response.status_code == 400
    

def test_document_upload_with_valid_file(client):
    """Тест загрузки документа с корректным файлом."""
    # Создаём тестовый DOCX файл
    with tempfile.TemporaryDirectory() as tmpdir:
        test_path = os.path.join(tmpdir, 'test.docx')
        doc = Document()
        doc.add_paragraph("Тестовый документ")
        doc.save(test_path)
        
        with open(test_path, 'rb') as f:
            response = client.post(
                '/api/document/upload',
                data={'file': (io.BytesIO(f.read()), 'test.docx')},
                content_type='multipart/form-data'
            )
        
        assert response.status_code == 200
        assert 'check_results' in response.json
        assert 'temp_path' in response.json 