#!/usr/bin/env python3
"""Быстрый тест API с выводом ключевых полей"""
import requests
import os
import sys

# Тестовый файл
test_file = os.path.join(os.path.dirname(__file__), 'tests', 'test_data', 'documents', 'all_errors.docx')
if not os.path.exists(test_file):
    print(f"ОШИБКА: файл не найден: {test_file}")
    sys.exit(1)

print(f"Тестируем файл: {os.path.basename(test_file)}")
print()

try:
    with open(test_file, 'rb') as f:
        response = requests.post(
            'http://localhost:5000/api/document/upload',
            files={'file': (os.path.basename(test_file), f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')},
            timeout=60
        )
    
    print(f"Статус: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"success: {data.get('success')}")
        print(f"filename: {data.get('filename')}")
        print()
        
        check_results = data.get('check_results', {})
        issues = check_results.get('issues', [])
        print(f"Найдено ошибок: {len(issues)}")
        
        print()
        print(f"correction_success: {data.get('correction_success')}")
        print(f"corrected_file_path: {data.get('corrected_file_path')}")
        
        corrected_check = data.get('corrected_check_results')
        if corrected_check:
            corrected_issues = corrected_check.get('issues', [])
            print(f"Ошибок после исправления: {len(corrected_issues)}")
        else:
            print("Ошибок после исправления: Н/Д (исправленный документ не проверен)")
        
        print()
        print("=" * 50)
        if data.get('correction_success') and data.get('corrected_file_path'):
            print("✅ АВТОИСПРАВЛЕНИЕ РАБОТАЕТ!")
            print(f"   Исправленный файл: {data.get('corrected_file_path')}")
        else:
            print("❌ АВТОИСПРАВЛЕНИЕ НЕ ВЫПОЛНЕНО")
    else:
        print(f"ОШИБКА: {response.text}")

except requests.exceptions.ConnectionError:
    print("ОШИБКА: Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на порту 5000")
except Exception as e:
    print(f"ОШИБКА: {type(e).__name__}: {e}")
