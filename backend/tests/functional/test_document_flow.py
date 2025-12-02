"""Функциональные тесты для потока работы с документами.
Тестирует полный процесс от загрузки документа до скачивания исправленного документа.
"""
import os
import io
import pytest
import tempfile
from pathlib import Path
from docx import Document

# Путь к тестовым данным
TEST_DATA_DIR = Path(__file__).parent.parent / "test_data"


def test_complete_document_flow(client):
    """Тестирует полный поток работы с документом.
    
    1. Загрузка документа для анализа через /api/document/upload
    2. Получение результатов проверки
    3. Отправка запроса на исправление через /api/document/correct
    4. Скачивание исправленного документа через /api/document/download-corrected
    """
    # Создаём тестовый документ с ошибками
    with tempfile.TemporaryDirectory() as tmpdir:
        test_file_path = os.path.join(tmpdir, 'test_flow.docx')
        
        doc = Document()
        # Добавляем текст с неправильным шрифтом
        p = doc.add_paragraph("Тестовый документ для проверки полного потока")
        for run in p.runs:
            run.font.name = 'Arial'  # Неправильный шрифт
        doc.save(test_file_path)
        
        # 1. Загрузка документа для анализа
        with open(test_file_path, 'rb') as f:
            response_upload = client.post(
                '/api/document/upload',
                data={'file': (io.BytesIO(f.read()), 'test_flow.docx')},
                content_type='multipart/form-data'
            )
        
        assert response_upload.status_code == 200, f"Upload failed: {response_upload.json}"
        upload_result = response_upload.json
        
        # Проверяем результат загрузки
        assert 'check_results' in upload_result, "check_results not in response"
        assert 'temp_path' in upload_result, "temp_path not in response"
        
        temp_path = upload_result['temp_path']
        check_results = upload_result['check_results']
        
        # 2. Отправка запроса на исправление
        correction_data = {
            'file_path': temp_path,
            'original_filename': 'test_flow.docx',
            'errors_to_fix': check_results.get('issues', [])
        }
        
        response_correction = client.post('/api/document/correct', json=correction_data)
        
        assert response_correction.status_code == 200, f"Correction failed: {response_correction.json}"
        correction_result = response_correction.json
        assert 'corrected_file_path' in correction_result, "corrected_file_path not in response"
        
        corrected_file_path = correction_result['corrected_file_path']
        
        # 3. Скачивание исправленного документа
        download_url = f"/api/document/download-corrected?path={corrected_file_path}"
        response_download = client.get(download_url)
        
        assert response_download.status_code == 200, f"Download failed with status {response_download.status_code}"
        assert len(response_download.data) > 0, "Downloaded file is empty"
        
        # Проверяем что это валидный DOCX
        content_type = response_download.headers.get('Content-Type', '')
        assert 'application/vnd.openxmlformats-officedocument' in content_type or len(response_download.data) > 1000 