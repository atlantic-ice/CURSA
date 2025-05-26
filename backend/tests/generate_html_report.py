#!/usr/bin/env python
"""
Скрипт для генерации HTML-отчета на основе результатов тестирования
"""
import os
import sys
import json
import datetime
import argparse
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Использование серверного режима без GUI
import base64
from io import BytesIO

# Путь к директориям результатов и отчетов
TEST_DATA_DIR = Path(__file__).parent / "test_data"
RESULTS_DIR = TEST_DATA_DIR / "results"
REPORT_DIR = RESULTS_DIR / "html_reports"

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
    parser = argparse.ArgumentParser(description='Генерация HTML-отчета о тестировании')
    parser.add_argument('--functional-only', action='store_true', help='Включить только функциональные тесты')
    parser.add_argument('--api-only', action='store_true', help='Включить только тесты API')
    parser.add_argument('--unit-only', action='store_true', help='Включить только модульные тесты')
    parser.add_argument('-o', '--output', help='Путь для сохранения отчета (по умолчанию: results/html_reports/report_DATE.html)')
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
    categories = {}
    
    for result in results:
        category = result.get('test_name', 'Другие')
        if category not in categories:
            categories[category] = []
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


def generate_pie_chart(stats):
    """
    Генерирует круговую диаграмму со статистикой тестирования
    
    Args:
        stats: Данные статистики
        
    Returns:
        str: закодированное в Base64 изображение диаграммы
    """
    # Создаем круговую диаграмму
    fig, ax = plt.subplots(figsize=(8, 6), dpi=100)
    
    labels = ['Успешно', 'Не пройдено']
    sizes = [stats['passed'], stats['failed']]
    colors = ['#4CAF50', '#F44336']
    explode = (0.1, 0)  # explode 1st slice (Успешно)
    
    ax.pie(sizes, explode=explode, labels=labels, colors=colors,
           autopct='%1.1f%%', shadow=True, startangle=140)
    ax.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle
    plt.title('Результаты тестирования')
    
    # Сохраняем диаграмму в формате BytesIO и кодируем в Base64
    img_data = BytesIO()
    plt.savefig(img_data, format='png', bbox_inches='tight')
    img_data.seek(0)
    
    # Кодируем изображение в base64 для вставки в HTML
    encoded_img = base64.b64encode(img_data.getvalue()).decode('utf-8')
    plt.close(fig)
    
    return encoded_img


def generate_bar_chart(stats):
    """
    Генерирует столбчатую диаграмму с результатами по категориям
    
    Args:
        stats: Данные статистики
        
    Returns:
        str: закодированное в Base64 изображение диаграммы
    """
    categories = list(stats['categories'].keys())
    pass_rates = [stats['categories'][cat]['pass_rate'] for cat in categories]
    
    fig, ax = plt.subplots(figsize=(12, 6), dpi=100)
    bars = ax.bar(categories, pass_rates, color='#2196F3')
    
    # Добавляем подписи
    ax.set_ylabel('Процент успешных тестов')
    ax.set_title('Результаты по категориям тестов')
    ax.set_ylim(0, 100)
    
    # Добавляем значения над столбцами
    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'{height:.1f}%',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),  # 3 пикселя вертикального смещения
                    textcoords="offset points",
                    ha='center', va='bottom')
    
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    
    # Сохраняем диаграмму в формате BytesIO и кодируем в Base64
    img_data = BytesIO()
    plt.savefig(img_data, format='png', bbox_inches='tight')
    img_data.seek(0)
    
    # Кодируем изображение в base64 для вставки в HTML
    encoded_img = base64.b64encode(img_data.getvalue()).decode('utf-8')
    plt.close(fig)
    
    return encoded_img


def generate_html_report(functional_results, api_results, unit_results, output_path=None):
    """
    Генерирует HTML-отчет о результатах тестирования
    
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
    
    # Генерируем диаграммы
    pie_chart = generate_pie_chart(stats)
    bar_chart = generate_bar_chart(stats)
    
    # Если путь не указан, генерируем имя файла с текущей датой
    if output_path is None:
        current_date = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs(REPORT_DIR, exist_ok=True)
        output_path = REPORT_DIR / f"report_{current_date}.html"
    
    # Создаем директорию для отчета, если она не существует
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Формируем HTML-отчет
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Отчет о тестировании системы нормоконтроля</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                color: #333;
            }}
            h1, h2, h3 {{
                color: #2c3e50;
            }}
            .header {{
                background-color: #3498db;
                color: white;
                padding: 20px;
                border-radius: 5px;
                margin-bottom: 20px;
                text-align: center;
            }}
            .summary {{
                display: flex;
                justify-content: space-around;
                margin: 20px 0;
                flex-wrap: wrap;
            }}
            .summary-box {{
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                width: 180px;
                text-align: center;
                margin-bottom: 15px;
            }}
            .summary-box h3 {{
                margin-top: 0;
            }}
            .charts {{
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 20px 0;
            }}
            .chart {{
                margin: 20px 0;
                text-align: center;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }}
            th {{
                background-color: #f2f2f2;
            }}
            tr:nth-child(even) {{
                background-color: #f9f9f9;
            }}
            .success {{
                color: #4CAF50;
            }}
            .failure {{
                color: #F44336;
            }}
            .details {{
                margin-top: 30px;
            }}
            .category {{
                margin-bottom: 30px;
                border-bottom: 1px solid #eee;
                padding-bottom: 20px;
            }}
            .test-details {{
                padding-left: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Отчет о тестировании системы нормоконтроля документов DOCX</h1>
            <p>Дата проведения: {datetime.datetime.now().strftime('%d.%m.%Y %H:%M:%S')}</p>
        </div>

        <div class="summary">
            <div class="summary-box">
                <h3>Всего тестов</h3>
                <p style="font-size: 24px;">{stats['total']}</p>
            </div>
            <div class="summary-box">
                <h3>Успешно</h3>
                <p style="font-size: 24px; color: #4CAF50;">{stats['passed']}</p>
            </div>
            <div class="summary-box">
                <h3>Не пройдено</h3>
                <p style="font-size: 24px; color: #F44336;">{stats['failed']}</p>
            </div>
            <div class="summary-box">
                <h3>Успешность</h3>
                <p style="font-size: 24px; color: {'#4CAF50' if stats['pass_rate'] >= 80 else '#F44336'};">{stats['pass_rate']:.1f}%</p>
            </div>
        </div>

        <div class="charts">
            <div class="chart">
                <h2>Общие результаты тестирования</h2>
                <img src="data:image/png;base64,{pie_chart}" alt="Общая статистика тестирования">
            </div>
            <div class="chart">
                <h2>Результаты по категориям тестов</h2>
                <img src="data:image/png;base64,{bar_chart}" alt="Статистика по категориям">
            </div>
        </div>

        <div class="details">
            <h2>Результаты по категориям</h2>
    """
    
    # Добавляем таблицу со статистикой по категориям
    html_content += """
            <table>
                <tr>
                    <th>Категория</th>
                    <th>Всего тестов</th>
                    <th>Успешно</th>
                    <th>Не пройдено</th>
                    <th>Успешность</th>
                </tr>
    """
    
    for category, cat_stats in stats['categories'].items():
        html_content += f"""
                <tr>
                    <td>{category}</td>
                    <td>{cat_stats['total']}</td>
                    <td class="success">{cat_stats['passed']}</td>
                    <td class="failure">{cat_stats['failed']}</td>
                    <td style="font-weight: bold; color: {'#4CAF50' if cat_stats['pass_rate'] >= 80 else '#F44336'};">{cat_stats['pass_rate']:.1f}%</td>
                </tr>
        """
    
    html_content += """
            </table>
            
            <h2>Детальные результаты тестов</h2>
    """
    
    # Группируем результаты по категориям
    categories = group_test_results_by_category(all_results)
    
    # Добавляем детальные результаты по каждой категории
    for category, results in categories.items():
        html_content += f"""
            <div class="category">
                <h3>{category}</h3>
                <table>
                    <tr>
                        <th>Тест</th>
                        <th>Статус</th>
                        <th>Ожидаемый результат</th>
                        <th>Фактический результат</th>
                    </tr>
        """
        
        for result in results:
            test_case = result.get('test_case', 'Не указан')
            status = "УСПЕШНО" if result.get('passed', False) else "НЕ ПРОЙДЕН"
            status_class = "success" if result.get('passed', False) else "failure"
            
            expected = json.dumps(result.get('expected', {}), ensure_ascii=False)
            actual = json.dumps(result.get('actual', {}), ensure_ascii=False)
            
            html_content += f"""
                    <tr>
                        <td>{test_case}</td>
                        <td class="{status_class}">{status}</td>
                        <td><pre style="white-space: pre-wrap;">{expected}</pre></td>
                        <td><pre style="white-space: pre-wrap;">{actual}</pre></td>
                    </tr>
            """
        
        html_content += """
                </table>
            </div>
        """
    
    # Завершаем HTML-документ
    html_content += """
        </div>
    </body>
    </html>
    """
    
    # Записываем HTML в файл
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"HTML-отчет сохранен: {output_path}")
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
    report_path = generate_html_report(functional_results, api_results, unit_results, output_path)
    
    print(f"HTML-отчет успешно сгенерирован и сохранен: {report_path}")


if __name__ == "__main__":
    main() 