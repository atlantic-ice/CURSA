"""
Модуль для проверки форматирования документов DOCX.
Реализует проверку форматирования на соответствие требованиям нормоконтроля.
"""

import logging

logger = logging.getLogger(__name__)

class FormatChecker:
    """
    Класс для проверки форматирования документов.
    Выполняет анализ и проверку документа на соответствие требованиям.
    """
    
    def __init__(self):
        """Инициализация проверяющего модуля"""
        # Настройки требований к форматированию
        self.requirements = {
            "font": "Times New Roman",
            "font_size": 14,
            "line_spacing": 1.5,
            "margins": {
                "left": 3.0,
                "right": 1.5,
                "top": 2.0,
                "bottom": 2.0
            },
            "paragraph_indent": 1.25,
            "header_formatting": {
                "bold": True,
                "alignment": "center"
            },
            "required_sections": [
                "Введение",
                "Заключение"
            ]
        }
    
    def check_document(self, document):
        """
        Выполняет полную проверку документа на соответствие требованиям.
        
        Args:
            document (dict): Данные документа для проверки
            
        Returns:
            dict: Результаты проверки со списком выявленных ошибок
        """
        errors = []
        
        # Проверка шрифта
        font_errors = self.check_font(document).get("errors", [])
        errors.extend(font_errors)
        
        # Проверка размера шрифта
        font_size_errors = self.check_font_size(document).get("errors", [])
        errors.extend(font_size_errors)
        
        # Проверка полей страницы
        margins_errors = self.check_margins(document).get("errors", [])
        errors.extend(margins_errors)
        
        # Проверка межстрочного интервала
        line_spacing_errors = self.check_line_spacing(document).get("errors", [])
        errors.extend(line_spacing_errors)
        
        # Проверка форматирования заголовков
        headers_errors = self.check_headers(document).get("errors", [])
        errors.extend(headers_errors)
        
        # Проверка списка литературы
        references_errors = self.check_references(document).get("errors", [])
        errors.extend(references_errors)
        
        # Проверка наличия обязательных разделов
        sections_errors = self.check_required_sections(document).get("errors", [])
        errors.extend(sections_errors)
        
        return {
            "status": "success",
            "errors_count": len(errors),
            "errors": errors
        }
    
    def check_font(self, document):
        """
        Проверяет соответствие шрифта документа требованиям.
        
        Args:
            document (dict): Данные документа для проверки
            
        Returns:
            dict: Результаты проверки с ошибками шрифта
        """
        errors = []
        required_font = self.requirements["font"]
        
        # Проверка параграфов
        if "paragraphs" in document:
            for i, paragraph in enumerate(document.get("paragraphs", [])):
                current_font = paragraph.get("font", "Unknown")
                if current_font != required_font:
                    errors.append({
                        "type": "font",
                        "message": f"Неправильный шрифт: {current_font} вместо {required_font}",
                        "location": f"Параграф {i+1}",
                        "severity": "high",
                        "auto_fixable": True
                    })
        
        return {
            "errors": errors
        }
    
    def check_font_size(self, document):
        """
        Проверяет соответствие размера шрифта документа требованиям.
        
        Args:
            document (dict): Данные документа для проверки
            
        Returns:
            dict: Результаты проверки с ошибками размера шрифта
        """
        errors = []
        required_size = self.requirements["font_size"]
        
        # Проверка параграфов
        if "paragraphs" in document:
            for i, paragraph in enumerate(document.get("paragraphs", [])):
                current_size = paragraph.get("size", 0)
                if current_size != required_size and current_size != 0:
                    errors.append({
                        "type": "font_size",
                        "message": f"Неправильный размер шрифта: {current_size}pt вместо {required_size}pt",
                        "location": f"Параграф {i+1}",
                        "severity": "high",
                        "auto_fixable": True
                    })
        
        return {
            "errors": errors
        }
    
    def check_margins(self, document):
        """
        Проверяет соответствие полей страницы требованиям.
        
        Args:
            document (dict): Данные документа для проверки
            
        Returns:
            dict: Результаты проверки с ошибками полей страницы
        """
        errors = []
        required_margins = self.requirements["margins"]
        
        # Проверка полей страницы
        if "margins" in document:
            margins = document["margins"]
            for side, value in margins.items():
                required_value = required_margins.get(side, 0)
                if abs(value - required_value) > 0.1:  # Допустимая погрешность 0.1 см
                    errors.append({
                        "type": "margins",
                        "message": f"Неправильное поле {side}: {value}см вместо {required_value}см",
                        "location": "Настройки страницы",
                        "severity": "high",
                        "auto_fixable": True
                    })
        
        return {
            "errors": errors
        }
    
    def check_line_spacing(self, document):
        """
        Проверяет соответствие межстрочного интервала требованиям.
        
        Args:
            document (dict): Данные документа для проверки
            
        Returns:
            dict: Результаты проверки с ошибками межстрочного интервала
        """
        errors = []
        required_spacing = self.requirements["line_spacing"]
        
        # Проверка параграфов
        if "paragraphs" in document:
            for i, paragraph in enumerate(document.get("paragraphs", [])):
                current_spacing = paragraph.get("line_spacing", 0)
                if current_spacing != required_spacing and current_spacing != 0:
                    errors.append({
                        "type": "line_spacing",
                        "message": f"Неправильный межстрочный интервал: {current_spacing} вместо {required_spacing}",
                        "location": f"Параграф {i+1}",
                        "severity": "medium",
                        "auto_fixable": True
                    })
        
        return {
            "errors": errors
        }
    
    def check_headers(self, document):
        """
        Проверяет соответствие форматирования заголовков требованиям.
        
        Args:
            document (dict): Данные документа для проверки
            
        Returns:
            dict: Результаты проверки с ошибками форматирования заголовков
        """
        errors = []
        header_requirements = self.requirements["header_formatting"]
        
        # Проверка заголовков
        for i, paragraph in enumerate(document.get("paragraphs", [])):
            if paragraph.get("is_header", False):
                # Проверка выделения жирным
                if header_requirements["bold"] and not paragraph.get("bold", False):
                    errors.append({
                        "type": "header_format",
                        "message": "Заголовок не выделен жирным шрифтом",
                        "location": f"Заголовок '{paragraph.get('text', '')}'",
                        "severity": "medium",
                        "auto_fixable": True
                    })
                
                # Проверка выравнивания
                if paragraph.get("alignment", "") != header_requirements["alignment"]:
                    errors.append({
                        "type": "header_format",
                        "message": f"Неправильное выравнивание заголовка: {paragraph.get('alignment', '')} вместо {header_requirements['alignment']}",
                        "location": f"Заголовок '{paragraph.get('text', '')}'",
                        "severity": "medium",
                        "auto_fixable": True
                    })
        
        return {
            "errors": errors
        }
    
    def check_references(self, document):
        """
        Проверяет соответствие оформления списка литературы по ГОСТ.
        
        Args:
            document (dict): Данные документа для проверки
            
        Returns:
            dict: Результаты проверки с ошибками оформления списка литературы
        """
        errors = []
        
        # Проверка наличия списка литературы
        if "references" not in document or not document["references"]:
            errors.append({
                "type": "reference_missing",
                "message": "Отсутствует список литературы",
                "location": "Документ",
                "severity": "high",
                "auto_fixable": False
            })
            return {"errors": errors}
        
        # Проверка оформления каждого источника в списке литературы
        for i, reference in enumerate(document.get("references", [])):
            text = reference.get("text", "")
            
            # Проверка оформления по ГОСТ (упрощенная)
            if not self._is_valid_reference_format(text):
                errors.append({
                    "type": "reference_format",
                    "message": "Оформление источника не соответствует ГОСТ Р 7.0.5-2008",
                    "location": f"Источник #{i+1}: '{text[:50]}...'",
                    "severity": "high",
                    "auto_fixable": False
                })
        
        return {
            "errors": errors
        }
    
    def check_required_sections(self, document):
        """
        Проверяет наличие обязательных разделов в документе.
        
        Args:
            document (dict): Данные документа для проверки
            
        Returns:
            dict: Результаты проверки с ошибками по отсутствию обязательных разделов
        """
        errors = []
        required_sections = self.requirements["required_sections"]
        found_sections = set()
        
        # Собираем все заголовки разделов
        for section in document.get("sections", []):
            section_title = section.get("title", "").strip()
            found_sections.add(section_title)
        
        # Проверяем наличие всех обязательных разделов
        for required_section in required_sections:
            if required_section not in found_sections:
                errors.append({
                    "type": "missing_section",
                    "message": f"Отсутствует обязательный раздел '{required_section}'",
                    "location": "Структура документа",
                    "severity": "high",
                    "auto_fixable": False
                })
        
        return {
            "errors": errors
        }
    
    def _is_valid_reference_format(self, text):
        """
        Проверяет, соответствует ли текст формату ГОСТ для списка литературы.
        
        Args:
            text (str): Текст ссылки для проверки
            
        Returns:
            bool: True, если формат соответствует ГОСТ, иначе False
        """
        # Упрощенная проверка
        # В реальной реализации здесь будет более сложная логика проверки по ГОСТ
        import re
        
        # Проверка на формат "Автор. Название. - Место издания: Издательство, Год. - Страницы."
        # или "Автор. Название // Журнал. - Год. - Том. - №. - Страницы."
        pattern = r'^[А-Я][а-яА-Я\s.,]+(\.|\s//)\s[А-Я].*\d{4}'
        return bool(re.search(pattern, text)) 