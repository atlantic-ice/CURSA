"""
Функциональные тесты API для обработки документов.
"""
import os
import json
import time
import sys
import pytest
import shutil
import datetime
from io import BytesIO
from pathlib import Path
from docx import Document

# Путь к тестовым данным
TEST_DATA_DIR = Path(__file__).parent.parent / "test_data"

# Убедимся, что директория существует
os.makedirs(TEST_DATA_DIR, exist_ok=True)

# Создадим директорию для результатов тестирования
TEST_RESULTS_DIR = TEST_DATA_DIR / "results"
os.makedirs(TEST_RESULTS_DIR, exist_ok=True)

# Файл для записи результатов тестирования API
API_RESULTS_FILE = TEST_RESULTS_DIR / "api_test_results.json"

class TestDocumentAPI:
    """
    Тесты API для работы с документами
    """
    
    def setup_method(self):
        """Настройка перед каждым тестом"""
        # Создаем список для сохранения результатов
        self.test_results = []
        
        # Создаем тестовые файлы, если их еще нет
        self._ensure_test_files_exist()
    
    def teardown_method(self):
        """Действия после каждого теста"""
        # Сохраняем результат теста в общий список результатов
        self._append_results_to_file()
    
    def _append_results_to_file(self):
        """Добавляет результаты текущего теста в файл результатов"""
        try:
            # Если файл существует, загружаем существующие результаты
            if os.path.exists(API_RESULTS_FILE):
                with open(API_RESULTS_FILE, 'r', encoding='utf-8') as f:
                    all_results = json.load(f)
            else:
                all_results = []
            
            # Добавляем новые результаты
            all_results.extend(self.test_results)
            
            # Сохраняем обновленные результаты в файл
            with open(API_RESULTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(all_results, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Ошибка при сохранении результатов: {str(e)}")
    
    def _record_test_result(self, test_name, test_case, expected, actual, passed):
        """
        Записывает результат выполнения теста
        
        Args:
            test_name: Название теста
            test_case: Описание тестового случая
            expected: Ожидаемый результат
            actual: Фактический результат
            passed: Флаг успешности теста (True/False)
        """
        self.test_results.append({
            'test_name': test_name,
            'test_case': test_case,
            'timestamp': datetime.datetime.now().isoformat(),
            'expected': expected,
            'actual': actual,
            'passed': passed
        })
    
    def _ensure_test_files_exist(self):
        """
        Создает тестовые файлы, если они не существуют
        """
        # Проверяем наличие генератора тестовых данных и запускаем его, если нужно
        generator_path = Path(__file__).parent.parent / "test_data_generator.py"
        if os.path.exists(generator_path) and not os.path.exists(TEST_DATA_DIR / "multiple_errors_document.docx"):
            import subprocess
            subprocess.run([sys.executable, str(generator_path), "-a"])
    
    def test_upload_invalid_file(self, client):
        """
        Тест загрузки неподдерживаемого файла
        
        Тестовый случай:
        - Загрузка файла неподдерживаемого формата (не .docx)
        
        Ожидаемый результат:
        - Система возвращает ошибку с кодом 400
        - В ответе содержится сообщение об ошибке формата
        """
        # Создаем временный текстовый файл для теста
        test_txt_path = TEST_DATA_DIR / "test_invalid.txt"
        with open(test_txt_path, 'w', encoding='utf-8') as f:
            f.write("Это текстовый файл, а не DOCX")
        
        # Открываем файл для отправки
        with open(test_txt_path, 'rb') as f:
            data = {
                'file': (BytesIO(f.read()), 'test_invalid.txt')
            }
            
            # Отправляем запрос на загрузку неподдерживаемого файла
            response = client.post('/api/document/upload', data=data, content_type='multipart/form-data')
            
            # Проверяем код ответа и сообщение об ошибке
            expected = {
                'status_code': 400,
                'error_message': "Недопустимый формат файла"
            }
            
            actual = {
                'status_code': response.status_code,
                'error_message': response.json.get('error') if response.status_code == 400 else None
            }
            
            # Проверяем, что ответ соответствует ожиданиям
            passed = expected['status_code'] == actual['status_code'] and (
                expected['error_message'] in actual['error_message'] if actual['error_message'] else False
            )
            
            # Записываем результат
            self._record_test_result(
                'Загрузка некорректного файла',
                'Загрузка файла неподдерживаемого формата (не .docx)',
                expected,
                actual,
                passed
            )
            
            assert passed, "Тест загрузки неподдерживаемого файла не пройден"
        
        # Удаляем временный файл
        if os.path.exists(test_txt_path):
            os.remove(test_txt_path)
    
    def test_document_correction_api(self, client):
        """
        Тест API для исправления документов
        
        Тестовый случай:
        - Загрузка документа с ошибками форматирования и запрос на его исправление через API
        
        Ожидаемый результат:
        - Система принимает документ, находит ошибки и возвращает путь к исправленному файлу
        """
        # Используем документ с несколькими ошибками
        test_file_path = TEST_DATA_DIR / "multiple_errors_document.docx"
        
        if not os.path.exists(test_file_path):
            # Если тестовый файл отсутствует, пропускаем тест или создаем файл
            pytest.skip(f"Тестовый файл {test_file_path} не найден")
        
        # Открываем файл для отправки
        with open(test_file_path, 'rb') as f:
            data = {
                'file': (BytesIO(f.read()), 'test_document.docx')
            }
            
            # Шаг 1: Загружаем документ и получаем результаты проверки
            upload_response = client.post('/api/document/upload', data=data, content_type='multipart/form-data')
            
            # Проверяем успешную загрузку
            assert upload_response.status_code == 200, f"Ошибка загрузки документа: {upload_response.json}"
            
            # Получаем данные из ответа
            check_results = upload_response.json.get('check_results')
            temp_path = upload_response.json.get('temp_path')
            
            # Проверяем наличие результатов проверки и пути к временному файлу
            assert check_results is not None, "Результаты проверки не получены"
            assert temp_path is not None, "Путь к временному файлу не получен"
            
            # Шаг 2: Отправляем запрос на исправление документа
            correction_data = {
                'file_path': temp_path,
                'original_filename': 'test_document.docx',
                'errors_to_fix': check_results.get('issues', [])
            }
            
            correction_response = client.post('/api/document/correct', json=correction_data)
            
            # Проверяем успешное исправление
            expected = {
                'status_code': 200,
                'has_corrected_file_path': True
            }
            
            actual = {
                'status_code': correction_response.status_code,
                'has_corrected_file_path': 'corrected_file_path' in correction_response.json if correction_response.status_code == 200 else False
            }
            
            # Проверяем, что ответ соответствует ожиданиям
            passed = expected['status_code'] == actual['status_code'] and expected['has_corrected_file_path'] == actual['has_corrected_file_path']
            
            # Записываем результат
            self._record_test_result(
                'API исправления документа',
                'Загрузка и исправление документа через API',
                expected,
                actual,
                passed
            )
            
            assert passed, "Тест API для исправления документов не пройден"
            
            # Для последующего теста сохраняем путь к исправленному файлу
            if passed:
                self.last_corrected_file_path = correction_response.json.get('corrected_file_path')
    
    def test_download_corrected_file(self, client):
        """
        Тест API для скачивания исправленного документа
        
        Тестовый случай:
        - Запрос на скачивание исправленного документа
        
        Ожидаемый результат:
        - Система возвращает файл или перенаправление на файл
        """
        # Используем тестовый файл для скачивания вместо зависимости от предыдущего теста
        test_file_path = TEST_DATA_DIR / "multiple_errors_document.docx"
        
        if not os.path.exists(test_file_path):
            # Создаем тестовый файл, если он не существует
            doc = Document()
            doc.add_paragraph("Тестовый документ для скачивания")
            os.makedirs(os.path.dirname(test_file_path), exist_ok=True)
            doc.save(test_file_path)
        
        # Загружаем файл через API
        with open(test_file_path, 'rb') as f:
            data = {'file': (BytesIO(f.read()), 'test_download.docx')}
            upload_response = client.post('/api/document/upload', data=data, content_type='multipart/form-data')
        
        if upload_response.status_code != 200:
            pytest.fail(f"Не удалось загрузить тестовый документ: {upload_response.json}")
        
        # Получаем путь к файлу
        temp_path = upload_response.json.get('temp_path')
        print(f"Временный путь: {temp_path}")
        
        # Отправляем запрос на исправление документа
        correction_data = {
            'file_path': temp_path,
            'original_filename': 'test_download.docx',
            'errors_to_fix': []  # Пустой список для исправления всех найденных ошибок
        }
        
        correction_response = client.post('/api/document/correct', json=correction_data)
        
        if correction_response.status_code != 200:
            pytest.fail(f"Не удалось исправить документ: {correction_response.json}")
        
        # Получаем путь к исправленному файлу
        corrected_file_path = correction_response.json.get('corrected_file_path')
        print(f"Путь к исправленному файлу: {corrected_file_path}")
        
        # Отправляем запрос на скачивание исправленного файла через правильный маршрут
        download_url = f"/api/document/download-corrected?path={corrected_file_path}"
        print(f"URL для скачивания: {download_url}")
        download_response = client.get(download_url, follow_redirects=False)
        
        print(f"Код ответа: {download_response.status_code}")
        print(f"Заголовки ответа: {download_response.headers}")
        
        # Проверяем код ответа - может быть либо 200 (прямая выдача файла), либо 302 (перенаправление)
        expected = {
            'valid_status_code': True,  # Проверяем, что статус код либо 200, либо 302
            'has_redirect_or_content': True  # Если 200, должен быть файл; если 302, должно быть перенаправление
        }
        
        status_code_valid = download_response.status_code in [200, 302]
        
        # Проверяем наличие либо перенаправления, либо данных
        has_redirect_or_content = False
        if download_response.status_code == 302:
            has_redirect_or_content = 'Location' in download_response.headers
            print(f"Перенаправление на: {download_response.headers.get('Location', 'не указано')}")
        else:
            has_redirect_or_content = len(download_response.data) > 0
            print(f"Размер данных: {len(download_response.data)} байт")
            
        actual = {
            'valid_status_code': status_code_valid,
            'has_redirect_or_content': has_redirect_or_content,
            'status_code': download_response.status_code
        }
        
        # Проверяем, что ответ соответствует ожиданиям
        passed = expected['valid_status_code'] == actual['valid_status_code'] and expected['has_redirect_or_content'] == actual['has_redirect_or_content']
        
        # Записываем результат
        self._record_test_result(
            'Скачивание исправленного файла',
            'Запрос на скачивание исправленного документа',
            expected,
            actual,
            passed
        )
        
        assert passed, "Тест скачивания исправленного файла не пройден"
    
    def test_large_document_performance(self, client):
        """
        Тест производительности при обработке больших документов
        
        Тестовый случай:
        - Загрузка и обработка документа большого объема
        
        Ожидаемый результат:
        - Система обрабатывает документ за разумное время (менее 30 секунд)
        """
        # Используем заранее созданный большой документ
        test_file_path = TEST_DATA_DIR / "large_document.docx"
        
        if not os.path.exists(test_file_path):
            # Если тестовый файл отсутствует, пропускаем тест
            pytest.skip(f"Тестовый файл большого объема {test_file_path} не найден")
        
        # Открываем файл для отправки
        with open(test_file_path, 'rb') as f:
            data = {
                'file': (BytesIO(f.read()), 'large_document.docx')
            }
            
            # Замеряем время выполнения запроса
            start_time = time.time()
            
            # Отправляем запрос на загрузку и проверку
            response = client.post('/api/document/upload', data=data, content_type='multipart/form-data')
            
            # Вычисляем время выполнения
            processing_time = time.time() - start_time
            
            # Проверяем код ответа и время обработки
            expected = {
                'status_code': 200,
                'processing_time_less_than': 30  # секунд
            }
            
            actual = {
                'status_code': response.status_code,
                'processing_time': processing_time
            }
            
            # Проверяем, что ответ соответствует ожиданиям
            passed = expected['status_code'] == actual['status_code'] and actual['processing_time'] < expected['processing_time_less_than']
            
            # Записываем результат
            self._record_test_result(
                'Производительность при обработке больших документов',
                'Загрузка и обработка документа большого объема',
                expected,
                actual,
                passed
            )
            
            assert passed, f"Тест производительности не пройден: время обработки {processing_time:.2f} сек. превышает допустимое" 