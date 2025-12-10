import pytest
import os
import io
import sys
from docx import Document

# Добавляем путь к backend в sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def create_test_docx():
    doc = Document()
    doc.add_paragraph("Test content")
    byte_io = io.BytesIO()
    doc.save(byte_io)
    byte_io.seek(0)
    return byte_io

def test_batch_upload(client):
    file1 = create_test_docx()
    file2 = create_test_docx()
    
    data = {
        'files': [
            (file1, 'test1.docx'),
            (file2, 'test2.docx')
        ]
    }
    
    response = client.post(
        '/api/document/upload-batch',
        data=data,
        content_type='multipart/form-data'
    )
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['success'] is True
    assert len(json_data['results']) == 2
    
    # Проверяем результаты
    filenames = [r['filename'] for r in json_data['results']]
    assert 'test1.docx' in filenames
    assert 'test2.docx' in filenames
    
    # Проверяем успешность обработки
    for res in json_data['results']:
        assert res['success'] is True
        assert res['check_results'] is not None
