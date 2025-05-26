#!/usr/bin/env python
"""
Скрипт для генерации отчетов о результатах тестирования
"""
import os
import sys
import json
import datetime
import argparse
from pathlib import Path
from collections import defaultdict

# Путь к директориям результатов и отчетов
TEST_DATA_DIR = Path(__file__).parent / "test_data"
RESULTS_DIR = TEST_DATA_DIR / "results"

# Имена файлов с результатами тестов
FUNCTIONAL_RESULTS_FILE = RESULTS_DIR / "test_results.json"
API_RESULTS_FILE = RESULTS_DIR / "api_test_results.json"
UNIT_RESULTS_FILE = RESULTS_DIR / "unit_test_results.json"


def parse_arguments():
    """
    Разбор аргументов командной строки
    
    Returns:
        argparse.Namespace: Аргументы командной строки
    """
    parser = argparse.ArgumentParser(description='Генерация отчетов о тестировании')
    parser.add_argument('--functional-only', action='store_true', help='Включить только функциональные тесты')
    parser.add_argument('--api-only', action='store_true', help='Включить только тесты API')
    parser.add_argument('--unit-only', action='store_true', help='Включить только модульные тесты')
    parser.add_argument('-o', '--output', help='Путь для сохранения отчета (по умолчанию: results/test_report_DATE.txt)')
    return parser.parse_args()


def load_test_results(results_file):
    """
    Загружает результаты тестов из файла JSON
    
    Args:
        results_file: Путь к файлу с результатами
        
    Returns:
        list: Список результатов тестов
    """
    if not os.path.exists(results_file):
        print(f"Предупреждение: Файл результатов {results_file} не найден.")
        return []
    
    try:
        with open(results_file, 'r', encoding='utf-8') as f:
            results = json.load(f)
        return results
    except Exception as e:
        print(f"Ошибка при загрузке файла результатов {results_file}: {str(e)}")
        return []


def group_test_results_by_category(results):
    """
    Группирует результаты тестов по категориям
    
    Args:
        results: Список результатов тестов
        
    Returns:
        dict: Словарь с результатами, сгруппированными по категориям
    """
    categories = defaultdict(list)
    
    for result in results:
        category = result.get('test_name', 'Другие')
        categories[category].append(result)
    
    return categories


def calculate_statistics(results):
    """
    Рассчитывает статистику выполнения тестов
    
    Args:
        results: Список результатов тестов
        
    Returns:
        dict: Статистика выполнения тестов
    """
    total_tests = len(results)
    passed_tests = sum(1 for r in results if r.get('passed', False))
    
    stats = {
        'total': total_tests,
        'passed': passed_tests,
        'failed': total_tests - passed_tests,
        'pass_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0
    }
    
    # Расчет статистики по категориям
    categories = group_test_results_by_category(results)
    category_stats = {}
    
    for category, cat_results in categories.items():
        total_cat = len(cat_results)
        passed_cat = sum(1 for r in cat_results if r.get('passed', False))
        
        category_stats[category] = {
            'total': total_cat,
            'passed': passed_cat,
            'failed': total_cat - passed_cat,
            'pass_rate': (passed_cat / total_cat * 100) if total_cat > 0 else 0
        }
    
    stats['categories'] = category_stats
    return stats


def generate_report(functional_results, api_results, unit_results, output_path=None):
    """
    Генерирует отчет о результатах тестирования
    
    Args:
        functional_results: Результаты функциональных тестов
        api_results: Результаты тестов API
        unit_results: Результаты модульных тестов
        output_path: Путь для сохранения отчета
        
    Returns:
        str: Путь к сгенерированному отчету
    """
    all_results = functional_results + api_results + unit_results
    stats = calculate_statistics(all_results)
    
    # Если путь не указан, генерируем имя файла с текущей датой
    if output_path is None:
        current_date = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = RESULTS_DIR / f"test_report_{current_date}.txt"
    
    # Создаем директорию для отчета, если она не существует
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Генерируем отчет
    with open(output_path, 'w', encoding='utf-8') as f:
        # Заголовок отчета
        f.write("="*80 + "\n")
        f.write("ОТЧЕТ О РЕЗУЛЬТАТАХ ТЕСТИРОВАНИЯ\n")
        f.write("="*80 + "\n\n")
        
        # Общая статистика
        f.write(f"Дата проведения: {datetime.datetime.now().strftime('%d.%m.%Y %H:%M:%S')}\n")
        f.write(f"Всего тестов: {stats['total']}\n")
        f.write(f"Успешно: {stats['passed']} ({stats['pass_rate']:.1f}%)\n")
        f.write(f"Не пройдено: {stats['failed']} ({100 - stats['pass_rate']:.1f}%)\n\n")
        
        # Статистика по категориям
        f.write("РЕЗУЛЬТАТЫ ПО КАТЕГОРИЯМ\n")
        f.write("-"*80 + "\n")
        
        for category, cat_stats in stats['categories'].items():
            f.write(f"{category}: {cat_stats['passed']}/{cat_stats['total']} успешно ({cat_stats['pass_rate']:.1f}%)\n")
        
        f.write("\n\nДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ ТЕСТОВ\n")
        f.write("-"*80 + "\n\n")
        
        # Детальные результаты по категориям
        categories = group_test_results_by_category(all_results)
        
        for category, results in categories.items():
            f.write(f"Категория: {category}\n")
            f.write("="*40 + "\n")
            
            for result in results:
                test_case = result.get('test_case', 'Не указан')
                passed = "УСПЕШНО" if result.get('passed', False) else "НЕ ПРОЙДЕН"
                
                f.write(f"Тест: {test_case} - {passed}\n")
                
                if 'expected' in result:
                    expected_str = json.dumps(result['expected'], ensure_ascii=False)
                    f.write(f"Ожидаемый результат: {expected_str}\n")
                
                if 'actual' in result:
                    actual_str = json.dumps(result['actual'], ensure_ascii=False)
                    f.write(f"Фактический результат: {actual_str}\n")
                
                # Разделитель между тестами
                f.write("-"*40 + "\n")
            
            # Разделитель между категориями
            f.write("\n")
    
    print(f"Отчет сохранен: {output_path}")
    return output_path


def main():
    """
    Основная функция
    """
    args = parse_arguments()
    
    # Загружаем результаты тестов в зависимости от указанных параметров
    functional_results = []
    api_results = []
    unit_results = []
    
    # Если не указаны флаги --*-only, то загружаем все результаты
    load_all = not (args.functional_only or args.api_only or args.unit_only)
    
    if load_all or args.functional_only:
        functional_results = load_test_results(FUNCTIONAL_RESULTS_FILE)
    
    if load_all or args.api_only:
        api_results = load_test_results(API_RESULTS_FILE)
    
    if load_all or args.unit_only:
        unit_results = load_test_results(UNIT_RESULTS_FILE)
    
    # Генерируем отчет
    output_path = args.output
    report_path = generate_report(functional_results, api_results, unit_results, output_path)
    
    print(f"Отчет успешно сгенерирован и сохранен: {report_path}")


if __name__ == "__main__":
    main() 