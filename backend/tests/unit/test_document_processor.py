"""
Модульные тесты для класса DocumentProcessor
"""
import os
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

# Добавляем путь к корневой директории проекта
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.services.document_processor import DocumentProcessor

# Путь к тестовым данным
TEST_DATA_DIR = Path(__file__).parent.parent / "test_data"


class TestDocumentProcessor:
    """
    Модульные тесты для класса DocumentProcessor
    """
    
    def setup_method(self):
        """
        Настройка перед каждым тестом
        """
        self.test_file_path = TEST_DATA_DIR / "empty_document.docx"
        
        # Убедимся, что тестовый файл существует
        if not os.path.exists(self.test_file_path):
            # Если файла нет, то используем генератор тестовых данных
            try:
                from tests.test_data_generator import TestDocumentGenerator
                generator = TestDocumentGenerator()
                generator.create_empty_document()
            except ImportError:
                pytest.skip(f"Тестовый файл {self.test_file_path} не найден, а генератор тестовых данных недоступен")
        
        # Создаем экземпляр тестируемого класса
        self.processor = DocumentProcessor(self.test_file_path)
    
    def test_initialization(self):
        """
        Проверка успешной инициализации класса DocumentProcessor
        """
        assert self.processor.file_path == self.test_file_path
        assert hasattr(self.processor, 'document')
    
    def test_extract_data(self):
        """
        Проверка успешного извлечения данных из документа
        """
        data = self.processor.extract_data()
        assert isinstance(data, dict)
        assert 'paragraphs' in data
        assert 'document_properties' in data
    
    def test_extract_paragraphs(self):
        """
        Проверка извлечения параграфов документа
        """
        paragraphs = self.processor._extract_paragraphs()
        assert isinstance(paragraphs, list)
    
    def test_extract_tables(self):
        """
        Проверка извлечения таблиц
        """
        tables = self.processor._extract_tables()
        assert isinstance(tables, list)
    
    def test_extract_headings(self):
        """
        Проверка извлечения заголовков
        """
        headings = self.processor._extract_headings()
        assert isinstance(headings, list)
    
    def test_extract_document_properties(self):
        """
        Проверка извлечения свойств документа
        """
        properties = self.processor._extract_document_properties()
        assert isinstance(properties, dict)
    
    def test_extract_title_page(self):
        """
        Проверка извлечения титульного листа
        """
        paragraphs = self.processor._extract_paragraphs()
        title_page = self.processor._extract_title_page(paragraphs)
        assert isinstance(title_page, list)
    
    def test_with_nonexistent_file(self):
        """
        Проверка обработки несуществующего файла
        """
        with pytest.raises(FileNotFoundError):
            processor = DocumentProcessor(TEST_DATA_DIR / "nonexistent_file.docx")
    
    def test_with_invalid_file_format(self):
        """
        Проверка обработки файла неверного формата
        """
        # Создаем временный текстовый файл для теста
        invalid_file_path = TEST_DATA_DIR / "invalid_format.txt"
        with open(invalid_file_path, 'w', encoding='utf-8') as f:
            f.write("This is not a DOCX file")
        
        with pytest.raises(ValueError):
            processor = DocumentProcessor(invalid_file_path)
        
        # Удаляем временный файл
        if os.path.exists(invalid_file_path):
            os.remove(invalid_file_path) 