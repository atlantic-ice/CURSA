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


def test_document_analyze_returns_document_token(client):
    """Анализ документа возвращает токен сессии вместо temp_path для UI."""
    with tempfile.TemporaryDirectory() as tmpdir:
        test_path = os.path.join(tmpdir, 'analyze_test.docx')
        doc = Document()
        doc.add_paragraph("Тестовый документ для анализа")
        doc.save(test_path)

        with open(test_path, 'rb') as f:
            response = client.post(
                '/api/document/analyze',
                data={'file': (io.BytesIO(f.read()), 'analyze_test.docx')},
                content_type='multipart/form-data'
            )

        assert response.status_code == 200
        assert 'check_results' in response.json
        assert 'document_token' in response.json
        assert response.json['document_token']
        assert 'temp_path' not in response.json


def test_document_autocorrect_requires_document_token(client):
    """Новый маршрут автокоррекции требует document_token."""
    response = client.post('/api/document/autocorrect', json={})

    assert response.status_code == 400
    assert 'error' in response.json


def test_legacy_autocorrect_route_returns_not_found_without_session(client):
    """Legacy маршрут совместимости отвечает 404 при отсутствии активной сессии."""
    response = client.post('/api/document/missing-session/autocorrect', json={})

    assert response.status_code == 404
    assert 'error' in response.json


def test_document_autocorrect_returns_corrected_check_results(client):
    """Автокоррекция возвращает check_results уже исправленного документа."""
    with tempfile.TemporaryDirectory() as tmpdir:
        test_path = os.path.join(tmpdir, 'autocorrect_check_results.docx')
        doc = Document()
        paragraph = doc.add_paragraph("Тест для повторного анализа после коррекции")
        for run in paragraph.runs:
            run.font.name = 'Arial'
        doc.save(test_path)

        with open(test_path, 'rb') as f:
            analyze_response = client.post(
                '/api/document/analyze',
                data={'file': (io.BytesIO(f.read()), 'autocorrect_check_results.docx')},
                content_type='multipart/form-data'
            )

        assert analyze_response.status_code == 200
        document_token = analyze_response.json['document_token']
        initial_total_issues = analyze_response.json['check_results']['total_issues_count']

        autocorrect_response = client.post(
            '/api/document/autocorrect',
            json={
                'document_token': document_token,
                'original_filename': 'autocorrect_check_results.docx',
            }
        )

        assert autocorrect_response.status_code == 200
        assert 'check_results' in autocorrect_response.json
        assert 'original_preview_path' in autocorrect_response.json
        assert 'temp_path' not in autocorrect_response.json
        assert (
            autocorrect_response.json['check_results']['total_issues_count']
            <= initial_total_issues
        )