#!/usr/bin/env python
"""
Тестовый скрипт для загрузки DOCX документов в систему нормоконтроля
"""
import requests
import os
import sys
import json
import argparse
import mimetypes
from pathlib import Path

# Добавляем текущую директорию в путь для импорта
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

def upload_document(api_url, file_path, keep_extension=True):
    """
    Загружает документ в систему нормоконтроля
    
    :param api_url: URL API сервера
    :param file_path: путь к файлу
    :param keep_extension: сохранять ли расширение при загрузке
    :return: словарь с результатами проверки
    """
    print(f"Загрузка файла: {file_path}")
    
    # Проверяем существование файла
    if not os.path.exists(file_path):
        print(f"Ошибка: файл не найден: {file_path}")
        return None
    
    # Базовый URL для API
    if not api_url.endswith('/'):
        api_url = api_url + '/'
    
    # URL для загрузки документа
    upload_url = f"{api_url}api/document/upload"
    
    # Формируем имя файла
    file_name = os.path.basename(file_path)
    
    # Если требуется удалить расширение
    if not keep_extension:
        file_name_no_ext = os.path.splitext(file_name)[0]
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        # Сохраняем временно без расширения
        temp_path = os.path.join(os.path.dirname(file_path), file_name_no_ext)
        with open(temp_path, 'wb') as f:
            f.write(file_content)
        
        # Используем временный файл без расширения
        file_obj = (file_name_no_ext, open(temp_path, 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        print(f"Загружаем с измененным именем: {file_name_no_ext}")
    else:
        # Используем оригинальный файл
        file_obj = ('file', open(file_path, 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    
    try:
        # Отправляем запрос на загрузку файла
        response = requests.post(
            upload_url,
            files={'file': file_obj},
            timeout=30
        )
        
        # Закрываем файл
        file_obj[1].close()
        
        # Удаляем временный файл, если он был создан
        if not keep_extension and os.path.exists(temp_path):
            os.remove(temp_path)
            print(f"Временный файл удален: {temp_path}")
        
        # Проверяем статус ответа
        if response.status_code == 200:
            result = response.json()
            print("Файл успешно загружен и проверен")
            return result
        else:
            print(f"Ошибка загрузки: HTTP {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"Ошибка при выполнении запроса: {str(e)}")
        
        # Закрываем файл, если он еще открыт
        if 'file_obj' in locals() and hasattr(file_obj[1], 'close'):
            file_obj[1].close()
            
        # Удаляем временный файл, если он был создан
        if not keep_extension and os.path.exists(temp_path):
            os.remove(temp_path)
            
        return None

def correct_document(api_url, file_path, check_results):
    """
    Отправляет запрос на исправление документа
    
    :param api_url: URL API сервера
    :param file_path: путь к файлу
    :param check_results: результаты проверки
    :return: словарь с результатами исправления
    """
    print(f"Исправление документа: {file_path}")
    
    # Базовый URL для API
    if not api_url.endswith('/'):
        api_url = api_url + '/'
    
    # URL для исправления документа
    correct_url = f"{api_url}api/document/correct"
    
    # Формируем запрос
    request_data = {
        'file_path': file_path,
        'original_filename': os.path.basename(file_path),
        'errors': check_results.get('check_results', {})
    }
    
    try:
        # Отправляем запрос на исправление
        response = requests.post(
            correct_url,
            json=request_data,
            timeout=30
        )
        
        # Проверяем статус ответа
        if response.status_code == 200:
            result = response.json()
            print("Документ успешно исправлен")
            return result
        else:
            print(f"Ошибка исправления: HTTP {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"Ошибка при выполнении запроса: {str(e)}")
        return None

def download_corrected(api_url, corrected_info):
    """
    Скачивает исправленный документ
    
    :param api_url: URL API сервера
    :param corrected_info: информация об исправленном документе
    :return: путь к скачанному файлу или None в случае ошибки
    """
    # Базовый URL для API
    if not api_url.endswith('/'):
        api_url = api_url + '/'
    
    # Путь к исправленному файлу
    file_path = corrected_info.get('corrected_file_path')
    
    if not file_path:
        print("Ошибка: отсутствует путь к исправленному файлу")
        return None
        
    # URL для скачивания
    download_url = f"{api_url}api/document/download-corrected?path={file_path}"
    print(f"Скачивание исправленного документа: {download_url}")
    
    try:
        # Отправляем запрос на скачивание
        response = requests.get(download_url, timeout=30)
        
        # Проверяем статус ответа
        if response.status_code == 200:
            # Определяем имя файла из заголовка
            content_disposition = response.headers.get('Content-Disposition')
            filename = None
            
            if content_disposition:
                import re
                filename_match = re.search('filename="(.+)"', content_disposition)
                if filename_match:
                    filename = filename_match.group(1)
            
            if not filename:
                filename = f"downloaded_{os.path.basename(file_path)}"
            
            # Сохраняем файл
            download_path = os.path.join(os.getcwd(), filename)
            with open(download_path, 'wb') as f:
                f.write(response.content)
                
            print(f"Исправленный документ сохранен: {download_path}")
            return download_path
        else:
            print(f"Ошибка скачивания: HTTP {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"Ошибка при выполнении запроса: {str(e)}")
        return None

def main():
    # Парсер аргументов командной строки
    parser = argparse.ArgumentParser(description="Тестирование загрузки и обработки документов")
    parser.add_argument('file', help="Путь к DOCX файлу для загрузки")
    parser.add_argument('-u', '--url', default='http://localhost:5000', help="URL API сервера (по умолчанию: http://localhost:5000)")
    parser.add_argument('--no-ext', action='store_true', help="Загрузить файл без расширения (для тестирования обработки)")
    parser.add_argument('--correct', action='store_true', help="Выполнить исправление документа после проверки")
    parser.add_argument('--download', action='store_true', help="Скачать исправленный документ")
    
    args = parser.parse_args()
    
    # Проверяем, что файл существует
    if not os.path.exists(args.file):
        print(f"Ошибка: файл '{args.file}' не найден")
        return
        
    # Проверяем, что файл является DOCX если указано расширение
    if args.file.lower().endswith('.docx') or not args.no_ext:
        if not args.file.lower().endswith('.docx'):
            print("Предупреждение: файл должен иметь расширение .docx")
            if not input("Продолжить? (y/n): ").lower().startswith('y'):
                return
    
    # Загружаем и проверяем документ
    check_results = upload_document(args.url, args.file, not args.no_ext)
    
    if not check_results:
        print("Ошибка при проверке документа")
        return
    
    # Выводим краткую информацию о результатах проверки
    if 'check_results' in check_results:
        categories = check_results['check_results'].keys()
        errors_count = sum(len(check_results['check_results'][cat].get('errors', [])) for cat in categories)
        warnings_count = sum(len(check_results['check_results'][cat].get('warnings', [])) for cat in categories)
        
        print(f"Найдено ошибок: {errors_count}, предупреждений: {warnings_count}")
    
    # Если запрошено исправление документа
    corrected_info = None
    if args.correct and check_results:
        corrected_info = correct_document(args.url, check_results.get('temp_path'), check_results)
        
        if not corrected_info:
            print("Ошибка при исправлении документа")
            return
    
    # Если запрошено скачивание исправленного документа
    if args.download and corrected_info:
        download_path = download_corrected(args.url, corrected_info)
        
        if not download_path:
            print("Ошибка при скачивании исправленного документа")
            return

if __name__ == "__main__":
    main() 