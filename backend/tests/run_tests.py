#!/usr/bin/env python
"""
Скрипт для запуска всех тестов и формирования отчета о результатах
"""
import os
import sys
import json
import time
import datetime
import subprocess
import argparse
from pathlib import Path

# Добавляем путь к корневой директории проекта
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Директории для тестовых файлов и результатов
TEST_DIR = Path(__file__).parent
TEST_DATA_DIR = TEST_DIR / "test_data"
TEST_RESULTS_DIR = TEST_DATA_DIR / "results"
os.makedirs(TEST_RESULTS_DIR, exist_ok=True)

# Файлы с результатами тестов
RESULTS_FILE = TEST_RESULTS_DIR / "test_results.json"
API_RESULTS_FILE = TEST_RESULTS_DIR / "api_test_results.json"
REPORT_FILE = TEST_RESULTS_DIR / f"test_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"


def generate_report(results):
    """
    Генерирует текстовый отчет о результатах тестирования
    
    Args:
        results: Список результатов тестов
        
    Returns:
        str: Текст отчета
    """
    # Подсчитываем статистику
    total_tests = len(results)
    passed_tests = sum(1 for r in results if r.get('passed', False))
    failed_tests = total_tests - passed_tests
    
    # Группируем тесты по категориям
    test_categories = {}
    for result in results:
        category = result.get('test_name', 'Неизвестная категория')
        if category not in test_categories:
            test_categories[category] = {
                'total': 0,
                'passed': 0
            }
        test_categories[category]['total'] += 1
        if result.get('passed', False):
            test_categories[category]['passed'] += 1
    
    # Формируем отчет
    report = []
    report.append("=" * 80)
    report.append("ОТЧЕТ О РЕЗУЛЬТАТАХ ТЕСТИРОВАНИЯ")
    report.append("=" * 80)
    report.append("")
    report.append(f"Дата проведения: {datetime.datetime.now().strftime('%d.%m.%Y %H:%M:%S')}")
    report.append(f"Всего тестов: {total_tests}")
    report.append(f"Успешно: {passed_tests} ({passed_tests / total_tests * 100:.1f}%)")
    report.append(f"Не пройдено: {failed_tests} ({failed_tests / total_tests * 100:.1f}%)")
    report.append("")
    report.append("РЕЗУЛЬТАТЫ ПО КАТЕГОРИЯМ")
    report.append("-" * 80)
    for category, stats in test_categories.items():
        report.append(f"{category}: {stats['passed']}/{stats['total']} успешно ({stats['passed'] / stats['total'] * 100:.1f}%)")
    report.append("")
    report.append("")
    report.append("ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ ТЕСТОВ")
    report.append("-" * 80)
    report.append("")
    
    # Выводим детальные результаты тестов, сгруппированные по категориям
    for category, stats in test_categories.items():
        report.append(f"Категория: {category}")
        report.append("=" * 40)
        
        # Выводим результаты тестов этой категории
        for result in results:
            if result.get('test_name', '') == category:
                status = "УСПЕШНО" if result.get('passed', False) else "ОШИБКА"
                report.append(f"Тест: {result.get('test_case', 'Не указан')} - {status}")
                
                expected = result.get('expected', {})
                actual = result.get('actual', {})
                
                report.append(f"Ожидаемый результат: {json.dumps(expected, ensure_ascii=False)}")
                report.append(f"Фактический результат: {json.dumps(actual, ensure_ascii=False)}")
                report.append("-" * 40)
        report.append("")
    
    report.append("")
    report.append("КОНЕЦ ОТЧЕТА")
    report.append("=" * 80)
    
    return "\n".join(report)


def generate_and_save_report(results_file, output_file):
    """
    Генерирует отчет и сохраняет его в файл
    
    Args:
        results_file: Путь к файлу с результатами
        output_file: Путь к файлу для сохранения отчета
    """
    if not os.path.exists(results_file):
        print("Файл с результатами тестов не найден:", results_file)
        return
    
    try:
        with open(results_file, 'r', encoding='utf-8') as f:
            results = json.load(f)
        
        if not results:
            print("Нет данных для формирования отчета")
            return
        
        # Генерируем отчет
        report = generate_report(results)
        
        # Сохраняем в файл с кодировкой UTF-8 с BOM для корректного отображения в Windows
        with open(output_file, 'w', encoding='utf-8-sig') as f:
            f.write(report)
        
        print("\nСодержимое отчета:")
        print(report)
        
        print(f"\nОтчет сохранен в файл: {output_file}\n")
    except Exception as e:
        print(f"Ошибка при генерации отчета: {str(e)}")


def generate_sample_results():
    """
    Создает пример результатов тестирования
    """
    # Создаем директорию для результатов, если ее нет
    os.makedirs(TEST_RESULTS_DIR, exist_ok=True)
    
    # Пример результатов тестирования
    sample_document_results = [
        {
            "test_name": "Проверка шрифта",
            "test_case": "Документ с неправильным шрифтом (Arial вместо Times New Roman)",
            "expected": {
                "has_font_issues": True,
                "is_auto_fixable": True,
                "error_description": "неверный шрифт"
            },
            "actual": {
                "has_font_issues": True,
                "is_auto_fixable": True,
                "error_description": "Неверный шрифт: Arial. Должен быть Times New Roman."
            },
            "passed": True,
            "timestamp": datetime.datetime.now().isoformat()
        },
        {
            "test_name": "Проверка размера шрифта",
            "test_case": "Документ с неверным размером шрифта (12pt вместо 14pt)",
            "expected": {
                "has_font_size_issues": True,
                "is_auto_fixable": True,
                "error_description": "неверный размер шрифта"
            },
            "actual": {
                "has_font_size_issues": True,
                "is_auto_fixable": True,
                "error_description": "Неверный размер шрифта: 12.0. Должен быть 14.0."
            },
            "passed": True,
            "timestamp": datetime.datetime.now().isoformat()
        },
        {
            "test_name": "Проверка полей страницы",
            "test_case": "Документ с неправильными полями страницы",
            "expected": {
                "has_margin_issues": True,
                "is_auto_fixable": True
            },
            "actual": {
                "has_margin_issues": True,
                "is_auto_fixable": True
            },
            "passed": True,
            "timestamp": datetime.datetime.now().isoformat()
        },
        {
            "test_name": "Проверка межстрочного интервала",
            "test_case": "Документ с неправильным межстрочным интервалом (одинарный вместо полуторного)",
            "expected": {
                "has_line_spacing_issues": True,
                "is_auto_fixable": True
            },
            "actual": {
                "has_line_spacing_issues": True,
                "is_auto_fixable": True
            },
            "passed": True,
            "timestamp": datetime.datetime.now().isoformat()
        },
        {
            "test_name": "Автоматическое исправление документа",
            "test_case": "Документ с множественными ошибками форматирования",
            "expected": {
                "file_created": True
            },
            "actual": {
                "file_created": True
            },
            "passed": True,
            "timestamp": datetime.datetime.now().isoformat()
        }
    ]
    
    # Пример результатов тестирования API
    sample_api_results = [
        {
            "test_name": "Загрузка некорректного файла",
            "test_case": "Загрузка файла неподдерживаемого формата (не .docx)",
            "expected": {
                "status_code": 400,
                "error_message": "Недопустимый формат файла"
            },
            "actual": {
                "status_code": 400,
                "error_message": "Недопустимый формат файла. Разрешены только файлы DOCX."
            },
            "passed": True,
            "timestamp": datetime.datetime.now().isoformat()
        },
        {
            "test_name": "API исправления документа",
            "test_case": "Загрузка и исправление документа через API",
            "expected": {
                "status_code": 200,
                "has_corrected_file_path": True
            },
            "actual": {
                "status_code": 200,
                "has_corrected_file_path": True
            },
            "passed": True,
            "timestamp": datetime.datetime.now().isoformat()
        },
        {
            "test_name": "Скачивание исправленного файла",
            "test_case": "Запрос на скачивание исправленного документа",
            "expected": {
                "status_code": 200,
                "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            },
            "actual": {
                "status_code": 200,
                "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            },
            "passed": True,
            "timestamp": datetime.datetime.now().isoformat()
        },
        {
            "test_name": "Производительность при обработке больших документов",
            "test_case": "Загрузка и обработка документа большого объема",
            "expected": {
                "status_code": 200,
                "processing_time_less_than": 30
            },
            "actual": {
                "status_code": 200,
                "processing_time": 12.5
            },
            "passed": True,
            "timestamp": datetime.datetime.now().isoformat()
        },
        {
            "test_name": "Загрузка документа",
            "test_case": "Загрузка валидного DOCX файла через API",
            "expected": {
                "status_code": 200,
                "has_check_results": True
            },
            "actual": {
                "status_code": 500,
                "has_check_results": False
            },
            "passed": False,
            "timestamp": datetime.datetime.now().isoformat()
        }
    ]
    
    # Сохраняем результаты в файлы
    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(sample_document_results, f, indent=2, ensure_ascii=False)
        
    with open(API_RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(sample_api_results, f, indent=2, ensure_ascii=False)
        
    print(f"Пример результатов сохранен в файлы: {RESULTS_FILE} и {API_RESULTS_FILE}")


def main():
    """
    Основная функция для запуска тестов
    """
    parser = argparse.ArgumentParser(description='Запуск тестов системы нормоконтроля.')
    parser.add_argument('-v', '--verbose', action='store_true', help='Подробный вывод тестов')
    parser.add_argument('-s', '--sample', action='store_true', help='Сгенерировать пример результатов и отчет')
    parser.add_argument('-r', '--report', action='store_true', help='Только сформировать отчет из существующих результатов')
    
    args = parser.parse_args()
    
    if args.sample:
        print("Создание примера результатов тестирования...")
        generate_sample_results()
        
        # Сгенерируем отчет
        report_file = TEST_RESULTS_DIR / f"test_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        generate_and_save_report(RESULTS_FILE, report_file)
        
        return 0
    
    if args.report:
        print("Формирование отчета из существующих результатов...")
        # Сгенерируем отчет
        report_file = TEST_RESULTS_DIR / f"test_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        generate_and_save_report(RESULTS_FILE, report_file)
        
        return 0
    
    # Запускаем тесты
    print("Запуск тестов...")
    
    # Формируем команду для запуска тестов
    pytest_cmd = [sys.executable, "-m", "pytest"]
    
    if args.verbose:
        pytest_cmd.append("-v")
    
    # Добавляем путь к функциональным тестам
    pytest_cmd.append(str(TEST_DIR / "functional"))
    
    # Запускаем тесты через subprocess
    print(f"Выполняем команду: {' '.join(pytest_cmd)}")
    result = subprocess.run(pytest_cmd, capture_output=True, text=True)
    
    # Выводим результаты
    if result.returncode == 0:
        print("Тесты успешно выполнены")
    else:
        print(f"Тесты завершились с ошибками (код {result.returncode})")
        print("Ошибки:")
        if result.stderr:
            print(result.stderr)
    
    print("Полный вывод тестов:")
    print(result.stdout)
    
    # Формируем отчет
    report_file = TEST_RESULTS_DIR / f"test_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    generate_and_save_report(RESULTS_FILE, report_file)
    
    return result.returncode


if __name__ == "__main__":
    sys.exit(main()) 