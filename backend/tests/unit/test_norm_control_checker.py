"""
Модульные тесты для класса NormControlChecker
"""
import os
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

# Добавляем путь к корневой директории проекта
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.services.norm_control_checker import NormControlChecker

# Путь к тестовым данным
TEST_DATA_DIR = Path(__file__).parent.parent / "test_data"


class TestNormControlChecker:
    """
    Модульные тесты для класса NormControlChecker
    """
    
    def setup_method(self):
        """
        Настройка перед каждым тестом
        """
        self.checker = NormControlChecker()
    
    def test_initialization(self):
        """
        Проверка успешной инициализации класса NormControlChecker
        """
        assert hasattr(self.checker, 'standard_rules')
        assert isinstance(self.checker.standard_rules, dict)
    
    def test_check_document_empty(self):
        """
        Проверка обработки пустого документа
        """
        document_data = {
            'paragraphs': [],
            'tables': [],
            'headings': [],
            'bibliography': [],
            'styles': {},
            'page_setup': {},
            'images': [],
            'page_numbers': {'has_page_numbers': False},
            'document_properties': {}
        }
        
        result = self.checker.check_document(document_data)
        assert isinstance(result, dict)
        assert 'rules_results' in result
        assert 'total_issues_count' in result
    
    def test_check_font(self):
        """
        Проверка правила проверки шрифта
        """
        # Пример данных с несоответствием типа шрифта
        document_data = {
            'paragraphs': [
                {
                    'index': 0,
                    'text': 'Текст с неправильным шрифтом',
                    'style': 'Normal',  # Это нужно для проверки (не заголовок)
                    'font': {
                        'name': 'Arial',  # Вместо Times New Roman
                        'size': 14.0
                    }
                }
            ]
        }
        
        # Вызываем непосредственно метод проверки шрифта
        issues = self.checker._check_font(document_data)
        
        # Проверяем результаты
        assert isinstance(issues, list)
        assert len(issues) > 0
        assert any('font_name' in issue['type'] for issue in issues)
        assert any('Arial' in issue['description'] for issue in issues)
    
    def test_check_font_size(self):
        """
        Проверка правила проверки размера шрифта
        """
        # Пример данных с несоответствием размера шрифта
        document_data = {
            'paragraphs': [
                {
                    'index': 0,
                    'text': 'Текст с неправильным размером шрифта',
                    'style': 'Normal',  # Это нужно для проверки (не заголовок)
                    'font': {
                        'name': 'Times New Roman',
                        'size': 12.0  # Вместо 14.0
                    }
                }
            ]
        }
        
        # Вызываем непосредственно метод проверки шрифта
        issues = self.checker._check_font(document_data)
          # Проверяем результаты
        assert isinstance(issues, list)
        assert len(issues) > 0
        assert any('font_size' in issue['type'] for issue in issues)
        assert any('12.0' in issue['description'] for issue in issues)
    
    def test_check_font_code_listing_exception(self):
        """
        Проверка, что Courier New и размер 12pt допустимы для листингов кода
        """
        # Пример данных с листингом кода в Courier New 12pt
        document_data = {
            'paragraphs': [
                {
                    'index': 0,
                    'text': 'def hello_world():\n    print("Hello, World!")\n    return True',
                    'style': 'Normal',
                    'font': {
                        'name': 'Courier New',
                        'size': 12.0,
                        'consistent_formatting': True
                    }
                },
                {
                    'index': 1,
                    'text': 'function calculateSum(a, b) {\n    return a + b;\n}',
                    'style': 'Normal',
                    'font': {
                        'name': 'Consolas',
                        'size': 12.0,
                        'consistent_formatting': True
                    }
                }
            ]
        }
        
        # Вызываем метод проверки шрифта
        issues = self.checker._check_font(document_data)
        
        # Проверяем, что для листингов кода ошибок шрифта нет
        font_issues = [issue for issue in issues if 'font_name' in issue['type'] or 'font_size' in issue['type']]
        assert len(font_issues) == 0, f"Найдены ошибки шрифта для листингов кода: {font_issues}"
    
    def test_check_margins(self):
        """
        Проверка правила проверки полей страницы
        """
        # Пример данных с несоответствием полей страницы
        document_data = {
            'page_setup': {
                'section_0': {
                    'left_margin': 2.0,  # Вместо 3.0
                    'right_margin': 1.0,  # Вместо 1.5
                    'top_margin': 1.5,    # Вместо 2.0
                    'bottom_margin': 1.5  # Вместо 2.0
                }
            }
        }
        
        # Проверяем конкретное правило
        rule_result = self.checker._check_margins(document_data)
        assert isinstance(rule_result, list)
        assert len(rule_result) > 0
    
    def test_check_line_spacing(self):
        """
        Проверка правила проверки межстрочного интервала
        """
        # Пример данных с несоответствием межстрочного интервала
        document_data = {
            'paragraphs': [
                {
                    'index': 0,
                    'text': 'Текст с неправильным межстрочным интервалом',
                    'line_spacing': 1.0,  # Вместо 1.5
                    'is_heading': False
                }
            ]
        }
        
        # Проверяем конкретное правило
        rule_result = self.checker._check_line_spacing(document_data)
        assert isinstance(rule_result, list)
    
    def test_check_paragraphs(self):
        """
        Проверка правила проверки отступа первой строки
        """
        # Пример данных с несоответствием отступа первой строки
        document_data = {
            'paragraphs': [
                {
                    'index': 0,
                    'text': 'Текст абзаца без отступа',
                    'is_heading': False,
                    'paragraph_format': {
                        'first_line_indent': 0.0,  # Вместо 1.25
                    }
                }
            ]
        }
        
        # Проверяем конкретное правило
        rule_result = self.checker._check_paragraphs(document_data)
        assert isinstance(rule_result, list)
    
    def test_check_page_numbers(self):
        """
        Проверка правила проверки нумерации страниц
        """
        # Пример данных с отсутствием нумерации страниц
        document_data = {
            'page_numbers': {
                'has_page_numbers': False
            }
        }
        
        # Проверяем конкретное правило
        rule_result = self.checker._check_page_numbers(document_data)
        assert isinstance(rule_result, list)
        assert len(rule_result) > 0
        
    def test_calculate_statistics(self):
        """
        Проверка расчета статистики результатов
        """
        results = [
            {
                "rule_id": 1, 
                "rule_name": "Тест", 
                "description": "Описание", 
                "issues": [
                    {
                        "type": "error", 
                        "severity": "high", 
                        "location": "Документ"
                    },
                    {
                        "type": "error", 
                        "severity": "medium", 
                        "location": "Страница 1"
                    }
                ]
            }
        ]
        
        statistics = self.checker._calculate_statistics(results)
        assert isinstance(statistics, dict)
        assert 'severity' in statistics 
        
    def test_check_ordinals(self):
        """
        Проверка правила проверки порядковых числительных
        """
        # Пример данных с неправильным оформлением порядковых числительных
        document_data = {
            'paragraphs': [
                {
                    'index': 0,
                    'text': 'В 21 веке технологии развиваются очень быстро.',
                    'style': 'Normal'
                },
                {
                    'index': 1,
                    'text': 'События происходили на 5 день месяца.',
                    'style': 'Normal'
                },
                {
                    'index': 2,
                    'text': 'Это относится к 3 столетию нашей эры.',
                    'style': 'Normal'
                },
                {
                    'index': 3,
                    'text': 'Информация находится на 10 стр. документа.',
                    'style': 'Normal'
                }
            ]
        }
        
        # Вызываем метод проверки порядковых числительных
        issues = self.checker._check_ordinals(document_data)
        
        # Проверяем результаты
        assert isinstance(issues, list)
        assert len(issues) > 0
        
        # Проверяем, что найдены проблемы с порядковыми числительными
        assert any('ordinal_no_suffix' in issue['type'] for issue in issues)
          # Проверяем описания найденных проблем
        assert any('21 век' in issue['description'] for issue in issues)
        assert any('5 день' in issue['description'] for issue in issues)
        assert any('3 столетию' in issue['description'] for issue in issues)
        assert any('10 стр' in issue['description'] for issue in issues)
        
    def test_check_surnames(self):
        """
        Проверка правила проверки оформления фамилий
        """
        # Пример данных с неправильным оформлением фамилий
        document_data = {
            'paragraphs': [
                {
                    'index': 0,
                    'text': 'Пушкин А. С. является великим русским поэтом.',
                    'style': 'Normal'
                },
                {
                    'index': 1,
                    'text': 'В своих работах А. П. Чехов описывал...',
                    'style': 'Normal'
                },
                {
                    'index': 2,
                    'text': 'Список литературы:',
                    'style': 'Normal'
                },
                {
                    'index': 3,
                    'text': '1. А.С. Пушкин "Евгений Онегин"',
                    'style': 'Normal'
                }
            ],
            'bibliography': [
                {
                    'index': 3
                }
            ]
        }
        
        # Вызываем метод проверки оформления фамилий
        issues = self.checker._check_surnames(document_data)
        
        # Проверяем результаты
        assert isinstance(issues, list)
        assert len(issues) > 0
        
        # Проверяем, что найдены проблемы с оформлением фамилий
        assert any('surname_wrong_order_in_text' in issue['type'] for issue in issues)
        assert any('surname_wrong_order_in_list' in issue['type'] for issue in issues)
        
    def test_check_numbering(self):
        """
        Проверка правила проверки нумерации таблиц, формул и иллюстраций
        """
        # Пример данных с неправильной нумерацией
        document_data = {
            'tables': [
                {
                    'index': 0,
                    'caption': 'Таблица данных',
                    'number': 1
                },
                {
                    'index': 1,
                    'caption': 'Таблица расчетов',
                    'number': 3  # Пропущен номер 2
                }
            ],
            'images': [
                {
                    'index': 0,
                    'caption': 'Схема алгоритма',
                    'number': '1.A'  # Неправильный формат номера
                }
            ],
            'formulas': [
                {
                    'index': 0,
                    'caption': 'Формула расчета',
                    # Отсутствует номер
                }
            ],
            'appendices': [
                {
                    'id': 'А',
                    'tables': [
                        {
                            'index': 0,
                            'caption': 'Таблица в приложении',
                            'number': 1  # Неправильный формат для приложения
                        }
                    ]
                }
            ]
        }
        
        # Вызываем метод проверки нумерации
        issues = self.checker._check_numbering(document_data)
        
        # Проверяем результаты
        assert isinstance(issues, list)
        assert len(issues) > 0
        
        # Проверяем, что найдены проблемы с нумерацией
        assert any('table_non_sequential_numbering' in issue['type'] for issue in issues)
        assert any('image_wrong_number_format' in issue['type'] for issue in issues)
        assert any('formula_missing_number' in issue['type'] for issue in issues)
        assert any('appendix_table_wrong_number_format' in issue['type'] for issue in issues) 