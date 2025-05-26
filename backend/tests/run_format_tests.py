#!/usr/bin/env python
"""
Скрипт для запуска тестов форматирования документов и генерации отчетов
"""
import os
import sys
import json
import datetime
import argparse
from pathlib import Path

# Добавляем корневой каталог проекта в sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Импортируем модуль с тестами
from tests.functional.test_format_requirements import TestFormatRequirements, run_tests

def generate_html_report(json_results, output_path):
    """
    Генерирует HTML-отчет на основе результатов тестирования
    """
    # Преобразуем JSON в список словарей если это строка
    if isinstance(json_results, str):
        results = json.loads(json_results)
    else:
        results = json_results
    
    # Подсчитываем статистику
    total_tests = len(results)
    successful_tests = sum(1 for result in results if result['success'])
    failed_tests = total_tests - successful_tests
    success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
    
    # Генерируем HTML
    html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчет о тестировании форматирования документов</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        h1, h2, h3 {{
            color: #2c3e50;
        }}
        .summary {{
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }}
        .summary-item {{
            margin-bottom: 10px;
        }}
        .test-results {{
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
        }}
        .test-results th, .test-results td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        .test-results th {{
            background-color: #f2f2f2;
        }}
        .test-results tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}
        .test-results tr:hover {{
            background-color: #f1f1f1;
        }}
        .success {{
            color: green;
        }}
        .failure {{
            color: red;
        }}
        .progress-bar {{
            height: 20px;
            background-color: #e9ecef;
            border-radius: 10px;
            margin: 10px 0;
        }}
        .progress {{
            height: 100%;
            background-color: #4caf50;
            border-radius: 10px;
            width: {success_rate}%;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Отчет о тестировании форматирования документов</h1>
        <div class="summary">
            <h2>Сводная информация</h2>
            <div class="summary-item">Дата и время: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
            <div class="summary-item">Всего тестов: {total_tests}</div>
            <div class="summary-item">Успешных тестов: {successful_tests}</div>
            <div class="summary-item">Неудачных тестов: {failed_tests}</div>
            <div class="summary-item">Процент успешных тестов: {success_rate:.2f}%</div>
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
        </div>
        
        <h2>Подробные результаты тестов</h2>
        <table class="test-results">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Название теста</th>
                    <th>Требование</th>
                    <th>Входные данные</th>
                    <th>Ожидаемый результат</th>
                    <th>Фактический результат</th>
                    <th>Статус</th>
                </tr>
            </thead>
            <tbody>
"""
    
    # Добавляем строки с результатами тестов
    for i, result in enumerate(results, 1):
        status_class = "success" if result['success'] else "failure"
        status_text = "УСПЕХ" if result['success'] else "НЕУДАЧА"
        
        html += f"""
                <tr>
                    <td>{i}</td>
                    <td>{result['test_name']}</td>
                    <td>{result['requirement']}</td>
                    <td>{result['input_data']}</td>
                    <td>{result['expected_result']}</td>
                    <td>{result['actual_result']}</td>
                    <td class="{status_class}">{status_text}</td>
                </tr>"""
    
    # Завершаем HTML
    html += """
            </tbody>
        </table>
    </div>
</body>
</html>
"""
    
    # Записываем HTML в файл
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    return output_path

def main():
    """Основная функция запуска тестов и генерации отчетов"""
    parser = argparse.ArgumentParser(description='Запуск тестов форматирования документов')
    parser.add_argument('--html', action='store_true', help='Генерировать HTML-отчет')
    parser.add_argument('--json', action='store_true', help='Генерировать JSON-отчет')
    parser.add_argument('--txt', action='store_true', help='Генерировать текстовый отчет')
    parser.add_argument('--output-dir', default=None, help='Каталог для сохранения отчетов')
    
    args = parser.parse_args()
    
    # Если не указаны форматы отчетов, включаем все
    if not (args.html or args.json or args.txt):
        args.html = args.json = args.txt = True
    
    # Определяем каталог для отчетов
    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        output_dir = Path(__file__).parent / "test_data" / "results"
    
    # Создаем каталог для отчетов, если он не существует
    html_reports_dir = output_dir / "html_reports"
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(html_reports_dir, exist_ok=True)
    
    print("Запуск тестов форматирования документов...")
    
    # Запускаем тесты
    test_suite = TestFormatRequirements()
    test_suite.setup_method()
    
    # Запускаем все тесты
    try:
        test_suite.test_font_check()
        test_suite.test_font_size_check()
        test_suite.test_margins_check()
        test_suite.test_line_spacing_check()
        test_suite.test_auto_correction()
        test_suite.test_headers_formatting()
        test_suite.test_page_numbering()
        test_suite.test_references_check()
        test_suite.test_required_sections()
        test_suite.test_tables_formatting()
        test_suite.test_figures_formatting()
        test_suite.test_download_corrected_document()
        test_suite.test_large_document()
        test_suite.test_perfect_document()
        test_suite.test_math_formulas()
        test_suite.test_diagrams()
        test_suite.test_headers_and_footers()
        test_suite.test_multi_upload()
        test_suite.test_history()
    except Exception as e:
        print(f"Ошибка при выполнении тестов: {str(e)}")
    
    # Сохраняем результаты и получаем данные для отчетов
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    results = [result.to_dict() for result in test_suite.results]
    
    # Генерируем отчеты в запрошенных форматах
    if args.json:
        json_path = output_dir / f"format_test_results_{timestamp}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=4)
        print(f"JSON-отчет сохранен: {json_path}")
    
    if args.txt:
        txt_path = output_dir / f"format_test_report_{timestamp}.txt"
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write("Отчет о результатах тестирования форматирования документов\n")
            f.write("======================================================\n\n")
            f.write(f"Дата и время: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            total_tests = len(results)
            successful_tests = sum(1 for result in results if result['success'])
            failed_tests = total_tests - successful_tests
            
            f.write(f"Всего тестов: {total_tests}\n")
            f.write(f"Успешных тестов: {successful_tests}\n")
            f.write(f"Неудачных тестов: {failed_tests}\n\n")
            
            f.write("Подробные результаты:\n")
            f.write("--------------------\n\n")
            
            for i, result in enumerate(results, 1):
                f.write(f"Тест #{i}: {result['test_name']}\n")
                f.write(f"Требование: {result['requirement']}\n")
                f.write(f"Входные данные: {result['input_data']}\n")
                f.write(f"Ожидаемый результат: {result['expected_result']}\n")
                f.write(f"Фактический результат: {result['actual_result']}\n")
                f.write(f"Статус: {'УСПЕХ' if result['success'] else 'НЕУДАЧА'}\n")
                if result['error_message']:
                    f.write(f"Сообщение об ошибке: {result['error_message']}\n")
                f.write("\n")
        print(f"Текстовый отчет сохранен: {txt_path}")
    
    if args.html:
        html_path = html_reports_dir / f"format_test_report_{timestamp}.html"
        generate_html_report(results, html_path)
        print(f"HTML-отчет сохранен: {html_path}")
    
    # Выводим краткую статистику
    total_tests = len(results)
    successful_tests = sum(1 for result in results if result['success'])
    failed_tests = total_tests - successful_tests
    
    print("\nРезультаты тестирования:")
    print(f"Всего тестов: {total_tests}")
    print(f"Успешных тестов: {successful_tests}")
    print(f"Неудачных тестов: {failed_tests}")
    print(f"Процент успешных тестов: {(successful_tests / total_tests) * 100:.2f}%" if total_tests > 0 else "Нет результатов")

if __name__ == "__main__":
    main() 