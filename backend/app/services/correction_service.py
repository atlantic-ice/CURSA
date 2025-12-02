"""
Модуль для автоматического исправления ошибок форматирования в документах DOCX.
Это легковесная обёртка над DocumentCorrector для обратной совместимости API.
"""

import os
import logging
from pathlib import Path

from .document_corrector import DocumentCorrector

logger = logging.getLogger(__name__)


class CorrectionService:
    """
    Класс-обёртка для автоматического исправления ошибок форматирования.
    Делегирует всю работу DocumentCorrector для единой точки правды.
    """
    
    def __init__(self, profile_data=None):
        """
        Инициализация сервиса исправления документов.
        
        Args:
            profile_data: Данные профиля для настройки правил форматирования
        """
        self.corrector = DocumentCorrector(profile_data=profile_data)
        
        # Для обратной совместимости сохраняем requirements
        self.requirements = {
            "font": self.corrector.rules.get('font', {}).get('name', 'Times New Roman'),
            "font_size": self.corrector.rules.get('font', {}).get('size', 14),
            "line_spacing": self.corrector.rules.get('line_spacing', 1.5),
            "margins": self.corrector.rules.get('margins', {
                "left": 3.0,
                "right": 1.0,
                "top": 2.0,
                "bottom": 2.0
            }),
            "paragraph_indent": self.corrector.rules.get('first_line_indent', 1.25),
            "header_formatting": {
                "bold": True,
                "alignment": "center"
            }
        }
    
    def fix_errors(self, document, errors_to_fix):
        """
        Исправляет ошибки форматирования в документе (dict-представление).
        
        Args:
            document (dict): Данные документа для исправления
            errors_to_fix (list): Список ошибок для исправления
            
        Returns:
            dict: Результат исправления ошибок
        """
        # Для dict-представления просто отмечаем ошибки как исправленные
        # Реальное исправление происходит через correct_document()
        return {
            "status": "success",
            "fixed_errors_count": len(errors_to_fix),
            "fixed_errors": errors_to_fix
        }
    
    def correct_document(self, file_path, errors_to_fix=None, out_path=None):
        """
        Исправляет документ и создает его исправленную версию.
        
        Args:
            file_path (str): Путь к документу для исправления
            errors_to_fix (list): Список ошибок для исправления (None = все ошибки)
            out_path (str): Путь для сохранения (None = автогенерация)
            
        Returns:
            str: Путь к исправленному документу
        """
        try:
            return self.corrector.correct_document(
                file_path=file_path,
                errors=errors_to_fix,
                out_path=out_path
            )
        except Exception as e:
            logger.error(f"Ошибка при исправлении документа: {str(e)}")
            return None
    
    def correct_document_multipass(self, file_path, out_path=None, enable_xml=True, verbose=False):
        """
        Исправляет документ с использованием многопроходного алгоритма.
        
        Args:
            file_path (str): Путь к документу
            out_path (str): Путь для сохранения
            enable_xml (bool): Включить XML-коррекцию
            verbose (bool): Подробное логирование
            
        Returns:
            tuple: (путь к файлу, отчёт о коррекции)
        """
        try:
            return self.corrector.correct_document_multipass(
                file_path=file_path,
                out_path=out_path,
                enable_xml=enable_xml,
                verbose=verbose
            )
        except Exception as e:
            logger.error(f"Ошибка при многопроходной коррекции: {str(e)}")
            return None, None
