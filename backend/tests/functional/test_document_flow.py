"""Функциональные тесты для потока работы с документами.
Тестирует полный процесс от загрузки документа до скачивания исправленного документа.
"""
import os
import io
import pytest
import tempfile
import time
from unittest.mock import patch

@pytest.mark.skip(reason="Требуется интеграция с реальным сервером и файлами")
def test_complete_document_flow(client):
    """Тестирует полный поток работы с документом.
    
    1. Загрузка документа для анализа
    2. Получение результатов анализа
    3. Отправка запроса на исправление
    4. Получение исправленного документа
    
    Этот тест пропущен, так как требует реальный docx файл и интеграцию с сервером.
    """
    # Путь к тестовому файлу docx
    test_file_path = os.path.join(os.path.dirname(__file__), '..', 'test_data', 'test_document.docx')
    
    if not os.path.exists(test_file_path):
        pytest.skip(f"Тестовый файл не найден: {test_file_path}")
    
    # 1. Загрузка документа для анализа
    with open(test_file_path, 'rb') as f:
        file_data = io.BytesIO(f.read())
    
    # Отправляем файл на анализ
    response_analysis = client.post(
        '/api/document/analyze',
        data={
            'file': (file_data, 'test_document.docx')
        },
        content_type='multipart/form-data'
    )
    
    assert response_analysis.status_code == 200
    analysis_result = response_analysis.json
    assert 'analysis' in analysis_result
    assert 'document_id' in analysis_result
    
    document_id = analysis_result['document_id']
    
    # 2. Отправка запроса на исправление
    response_correction = client.post(
        f'/api/document/{document_id}/correct',
        json={
            'corrections': ['formatting', 'structure']  # Пример параметров исправления
        }
    )
    
    assert response_correction.status_code == 200
    correction_result = response_correction.json
    assert 'correction_id' in correction_result
    
    correction_id = correction_result['correction_id']
    
    # 3. Проверка статуса исправления (может быть асинхронным)
    max_retries = 5
    for _ in range(max_retries):
        response_status = client.get(f'/api/document/correction/{correction_id}/status')
        assert response_status.status_code == 200
        status = response_status.json
        
        if status.get('status') == 'completed':
            break
            
        time.sleep(1)  # Ждем 1 секунду перед повторной проверкой
    
    assert status.get('status') == 'completed'
    assert 'download_url' in status
    
    # 4. Скачивание исправленного документа
    download_url = status['download_url']
    response_download = client.get(download_url)
    
    assert response_download.status_code == 200
    assert response_download.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    
    # Проверяем, что мы получили непустой документ
    assert len(response_download.data) > 0
    
    # Опционально: Сохраняем файл во временную директорию для проверки
    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
        temp_file.write(response_download.data)
        temp_file_path = temp_file.name
    
    # Проверяем, что файл существует и не пустой
    assert os.path.exists(temp_file_path)
    assert os.path.getsize(temp_file_path) > 0
    
    # Удаляем временный файл
    os.unlink(temp_file_path) 