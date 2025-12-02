"""
XMLDocumentEditor - Прямая работа с XML структурой DOCX файлов.

Гибридный подход: python-docx для базовых операций + lxml для точной работы с XML.
Это позволяет исправлять проблемы, которые python-docx не может обработать корректно.
"""

import os
import re
import zipfile
import tempfile
import shutil
from typing import Dict, List, Optional, Tuple, Any
from lxml import etree
from dataclasses import dataclass, field
from enum import Enum
from copy import deepcopy


# Пространства имён Word XML
NAMESPACES = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'w14': 'http://schemas.microsoft.com/office/word/2010/wordml',
    'w15': 'http://schemas.microsoft.com/office/word/2012/wordml',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
}

# Регистрируем пространства имён
for prefix, uri in NAMESPACES.items():
    etree.register_namespace(prefix, uri)


class XMLEditType(Enum):
    """Типы XML-редактирования"""
    FONT_NAME = "font_name"
    FONT_SIZE = "font_size"
    FONT_BOLD = "font_bold"
    FONT_ITALIC = "font_italic"
    FONT_COLOR = "font_color"
    LINE_SPACING = "line_spacing"
    PARAGRAPH_INDENT = "paragraph_indent"
    PARAGRAPH_ALIGNMENT = "paragraph_alignment"
    MARGIN = "margin"
    STYLE = "style"


@dataclass
class XMLEdit:
    """Описание XML-редактирования"""
    edit_type: XMLEditType
    xpath: str
    old_value: Any
    new_value: Any
    success: bool = False
    error_message: str = ""


@dataclass
class XMLEditReport:
    """Отчёт о XML-редактировании"""
    file_path: str
    edits: List[XMLEdit] = field(default_factory=list)
    total_edits: int = 0
    successful_edits: int = 0
    failed_edits: int = 0
    
    def add_edit(self, edit: XMLEdit):
        self.edits.append(edit)
        self.total_edits += 1
        if edit.success:
            self.successful_edits += 1
        else:
            self.failed_edits += 1


class XMLDocumentEditor:
    """
    Редактор DOCX на уровне XML.
    
    Позволяет напрямую модифицировать XML-структуру документа,
    обходя ограничения python-docx.
    """
    
    def __init__(self, file_path: str):
        """
        Инициализация редактора.
        
        Args:
            file_path: Путь к DOCX файлу
        """
        self.file_path = file_path
        self.temp_dir = None
        self.document_xml = None
        self.styles_xml = None
        self.settings_xml = None
        self.report = XMLEditReport(file_path=file_path)
        
        # Правила ГОСТ по умолчанию
        self.gost_rules = {
            'font_name': 'Times New Roman',
            'font_size': 28,  # В полупунктах (14pt * 2)
            'line_spacing': 360,  # В двадцатых долях пункта (1.5 * 240)
            'first_line_indent': 720,  # В твипах (1.25 см ≈ 720 твипов, точнее для Word)
            'left_margin': 1701,  # 3 см в твипах
            'right_margin': 850,  # 1.5 см в твипах
            'top_margin': 1134,  # 2 см в твипах
            'bottom_margin': 1134,  # 2 см в твипах
        }
    
    def __enter__(self):
        """Контекстный менеджер - открытие"""
        self._extract_docx()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Контекстный менеджер - закрытие"""
        self._cleanup()
    
    def _extract_docx(self):
        """Извлекает содержимое DOCX во временную директорию"""
        self.temp_dir = tempfile.mkdtemp(prefix="docx_xml_")
        
        with zipfile.ZipFile(self.file_path, 'r') as zf:
            zf.extractall(self.temp_dir)
        
        # Загружаем основные XML файлы
        doc_path = os.path.join(self.temp_dir, 'word', 'document.xml')
        if os.path.exists(doc_path):
            self.document_xml = etree.parse(doc_path)
        
        styles_path = os.path.join(self.temp_dir, 'word', 'styles.xml')
        if os.path.exists(styles_path):
            self.styles_xml = etree.parse(styles_path)
        
        settings_path = os.path.join(self.temp_dir, 'word', 'settings.xml')
        if os.path.exists(settings_path):
            self.settings_xml = etree.parse(settings_path)
    
    def _cleanup(self):
        """Очищает временные файлы"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def save(self, output_path: str = None) -> str:
        """
        Сохраняет изменённый документ.
        
        Args:
            output_path: Путь для сохранения (по умолчанию перезаписывает исходный)
            
        Returns:
            Путь к сохранённому файлу
        """
        if output_path is None:
            output_path = self.file_path
        
        # Сохраняем изменённые XML файлы
        if self.document_xml is not None:
            doc_path = os.path.join(self.temp_dir, 'word', 'document.xml')
            self.document_xml.write(doc_path, xml_declaration=True, 
                                   encoding='UTF-8', standalone=True)
        
        if self.styles_xml is not None:
            styles_path = os.path.join(self.temp_dir, 'word', 'styles.xml')
            self.styles_xml.write(styles_path, xml_declaration=True,
                                 encoding='UTF-8', standalone=True)
        
        if self.settings_xml is not None:
            settings_path = os.path.join(self.temp_dir, 'word', 'settings.xml')
            self.settings_xml.write(settings_path, xml_declaration=True,
                                   encoding='UTF-8', standalone=True)
        
        # Создаём новый DOCX
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(self.temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, self.temp_dir)
                    zf.write(file_path, arcname)
        
        return output_path
    
    # =========================================================================
    # МЕТОДЫ ИСПРАВЛЕНИЯ ШРИФТОВ
    # =========================================================================
    
    def fix_all_fonts(self, font_name: str = None, font_size: int = None) -> int:
        """
        Исправляет все шрифты в документе напрямую через XML.
        
        Args:
            font_name: Название шрифта (по умолчанию Times New Roman)
            font_size: Размер в полупунктах (по умолчанию 28 = 14pt)
            
        Returns:
            Количество исправленных элементов
        """
        if font_name is None:
            font_name = self.gost_rules['font_name']
        if font_size is None:
            font_size = self.gost_rules['font_size']
        
        fixed_count = 0
        
        if self.document_xml is None:
            return 0
        
        root = self.document_xml.getroot()
        
        # Находим все элементы rPr (Run Properties) - свойства текста
        for rPr in root.iter('{%s}rPr' % NAMESPACES['w']):
            fixed_count += self._fix_run_properties(rPr, font_name, font_size)
        
        # Также обновляем стили
        if self.styles_xml is not None:
            styles_root = self.styles_xml.getroot()
            for rPr in styles_root.iter('{%s}rPr' % NAMESPACES['w']):
                fixed_count += self._fix_run_properties(rPr, font_name, font_size)
        
        return fixed_count
    
    def _fix_run_properties(self, rPr: etree._Element, font_name: str, font_size: int) -> int:
        """Исправляет свойства текста (rPr)"""
        fixed = 0
        w = '{%s}' % NAMESPACES['w']
        
        # Исправляем название шрифта (rFonts)
        rFonts = rPr.find(f'{w}rFonts')
        if rFonts is not None:
            # Проверяем все атрибуты шрифта
            for attr in ['ascii', 'hAnsi', 'cs', 'eastAsia']:
                full_attr = f'{w}{attr}'
                if rFonts.get(full_attr) != font_name:
                    old_value = rFonts.get(full_attr)
                    rFonts.set(full_attr, font_name)
                    self._log_edit(XMLEditType.FONT_NAME, f"rFonts/@{attr}", 
                                 old_value, font_name, True)
                    fixed += 1
        else:
            # Создаём элемент rFonts
            rFonts = etree.SubElement(rPr, f'{w}rFonts')
            rFonts.set(f'{w}ascii', font_name)
            rFonts.set(f'{w}hAnsi', font_name)
            rFonts.set(f'{w}cs', font_name)
            self._log_edit(XMLEditType.FONT_NAME, "rFonts (created)", 
                         None, font_name, True)
            fixed += 1
        
        # Исправляем размер шрифта (sz и szCs)
        sz = rPr.find(f'{w}sz')
        if sz is not None:
            old_size = sz.get(f'{w}val')
            if old_size != str(font_size):
                sz.set(f'{w}val', str(font_size))
                self._log_edit(XMLEditType.FONT_SIZE, "sz/@val", 
                             old_size, font_size, True)
                fixed += 1
        else:
            sz = etree.SubElement(rPr, f'{w}sz')
            sz.set(f'{w}val', str(font_size))
            fixed += 1
        
        szCs = rPr.find(f'{w}szCs')
        if szCs is not None:
            old_size = szCs.get(f'{w}val')
            if old_size != str(font_size):
                szCs.set(f'{w}val', str(font_size))
                fixed += 1
        else:
            szCs = etree.SubElement(rPr, f'{w}szCs')
            szCs.set(f'{w}val', str(font_size))
            fixed += 1
        
        return fixed
    
    # =========================================================================
    # МЕТОДЫ ИСПРАВЛЕНИЯ АБЗАЦЕВ
    # =========================================================================
    
    def fix_all_paragraphs(self, line_spacing: int = None, 
                          first_indent: int = None,
                          alignment: str = "both") -> int:
        """
        Исправляет форматирование всех абзацев.
        
        Args:
            line_spacing: Межстрочный интервал в твипах (360 = 1.5)
            first_indent: Отступ первой строки в твипах (709 = 1.25 см)
            alignment: Выравнивание (both, left, right, center)
            
        Returns:
            Количество исправленных элементов
        """
        if line_spacing is None:
            line_spacing = self.gost_rules['line_spacing']
        if first_indent is None:
            first_indent = self.gost_rules['first_line_indent']
        
        fixed_count = 0
        
        if self.document_xml is None:
            return 0
        
        root = self.document_xml.getroot()
        w = '{%s}' % NAMESPACES['w']
        
        # Находим все абзацы
        for p in root.iter(f'{w}p'):
            # Пропускаем заголовки (проверяем стиль)
            pPr = p.find(f'{w}pPr')
            if pPr is not None:
                pStyle = pPr.find(f'{w}pStyle')
                if pStyle is not None:
                    style_val = pStyle.get(f'{w}val', '')
                    if 'Heading' in style_val or 'heading' in style_val.lower():
                        continue  # Пропускаем заголовки
            
            fixed_count += self._fix_paragraph_properties(p, line_spacing, 
                                                         first_indent, alignment)
        
        return fixed_count
    
    def _fix_paragraph_properties(self, p: etree._Element, 
                                  line_spacing: int,
                                  first_indent: int,
                                  alignment: str) -> int:
        """Исправляет свойства абзаца"""
        fixed = 0
        w = '{%s}' % NAMESPACES['w']
        
        # Находим или создаём pPr
        pPr = p.find(f'{w}pPr')
        if pPr is None:
            pPr = etree.SubElement(p, f'{w}pPr')
            # Вставляем в начало
            p.insert(0, pPr)
        
        # Исправляем межстрочный интервал (spacing)
        spacing = pPr.find(f'{w}spacing')
        if spacing is None:
            spacing = etree.SubElement(pPr, f'{w}spacing')
        
        # Устанавливаем line (межстрочный интервал)
        old_line = spacing.get(f'{w}line')
        if old_line != str(line_spacing):
            spacing.set(f'{w}line', str(line_spacing))
            spacing.set(f'{w}lineRule', 'auto')  # Множитель
            self._log_edit(XMLEditType.LINE_SPACING, "spacing/@line",
                         old_line, line_spacing, True)
            fixed += 1
        
        # Убираем интервалы до/после абзаца
        spacing.set(f'{w}before', '0')
        spacing.set(f'{w}after', '0')
        
        # Исправляем отступ первой строки (ind)
        ind = pPr.find(f'{w}ind')
        if ind is None:
            ind = etree.SubElement(pPr, f'{w}ind')
        
        old_indent = ind.get(f'{w}firstLine')
        if old_indent != str(first_indent):
            ind.set(f'{w}firstLine', str(first_indent))
            # Убираем левый/правый отступ для обычного текста
            ind.set(f'{w}left', '0')
            ind.set(f'{w}right', '0')
            self._log_edit(XMLEditType.PARAGRAPH_INDENT, "ind/@firstLine",
                         old_indent, first_indent, True)
            fixed += 1
        
        # Исправляем выравнивание (jc)
        jc = pPr.find(f'{w}jc')
        if jc is None:
            jc = etree.SubElement(pPr, f'{w}jc')
        
        old_alignment = jc.get(f'{w}val')
        if old_alignment != alignment:
            jc.set(f'{w}val', alignment)
            self._log_edit(XMLEditType.PARAGRAPH_ALIGNMENT, "jc/@val",
                         old_alignment, alignment, True)
            fixed += 1
        
        return fixed
    
    # =========================================================================
    # МЕТОДЫ ИСПРАВЛЕНИЯ ПОЛЕЙ СТРАНИЦЫ
    # =========================================================================
    
    def fix_page_margins(self, left: int = None, right: int = None,
                        top: int = None, bottom: int = None) -> int:
        """
        Исправляет поля страницы.
        
        Args:
            left: Левое поле в твипах (1701 = 3 см)
            right: Правое поле в твипах (850 = 1.5 см)
            top: Верхнее поле в твипах (1134 = 2 см)
            bottom: Нижнее поле в твипах (1134 = 2 см)
            
        Returns:
            Количество исправленных секций
        """
        if left is None:
            left = self.gost_rules['left_margin']
        if right is None:
            right = self.gost_rules['right_margin']
        if top is None:
            top = self.gost_rules['top_margin']
        if bottom is None:
            bottom = self.gost_rules['bottom_margin']
        
        fixed_count = 0
        
        if self.document_xml is None:
            return 0
        
        root = self.document_xml.getroot()
        w = '{%s}' % NAMESPACES['w']
        
        # Находим все секции (sectPr)
        for sectPr in root.iter(f'{w}sectPr'):
            pgMar = sectPr.find(f'{w}pgMar')
            if pgMar is None:
                pgMar = etree.SubElement(sectPr, f'{w}pgMar')
            
            # Устанавливаем поля
            changed = False
            
            if pgMar.get(f'{w}left') != str(left):
                pgMar.set(f'{w}left', str(left))
                changed = True
            
            if pgMar.get(f'{w}right') != str(right):
                pgMar.set(f'{w}right', str(right))
                changed = True
            
            if pgMar.get(f'{w}top') != str(top):
                pgMar.set(f'{w}top', str(top))
                changed = True
            
            if pgMar.get(f'{w}bottom') != str(bottom):
                pgMar.set(f'{w}bottom', str(bottom))
                changed = True
            
            if changed:
                self._log_edit(XMLEditType.MARGIN, "pgMar", None,
                             f"L:{left} R:{right} T:{top} B:{bottom}", True)
                fixed_count += 1
        
        return fixed_count
    
    # =========================================================================
    # МЕТОДЫ ИСПРАВЛЕНИЯ СТИЛЕЙ
    # =========================================================================
    
    def fix_normal_style(self) -> bool:
        """Исправляет стиль 'Normal' (основной текст)"""
        if self.styles_xml is None:
            return False
        
        root = self.styles_xml.getroot()
        w = '{%s}' % NAMESPACES['w']
        
        # Ищем стиль Normal
        for style in root.iter(f'{w}style'):
            style_id = style.get(f'{w}styleId')
            if style_id == 'Normal' or style_id == 'a':  # 'a' - русская версия
                # Находим или создаём rPr
                rPr = style.find(f'{w}rPr')
                if rPr is None:
                    rPr = etree.SubElement(style, f'{w}rPr')
                
                self._fix_run_properties(rPr, 
                                        self.gost_rules['font_name'],
                                        self.gost_rules['font_size'])
                
                # Находим или создаём pPr
                pPr = style.find(f'{w}pPr')
                if pPr is None:
                    pPr = etree.SubElement(style, f'{w}pPr')
                
                # Устанавливаем межстрочный интервал
                spacing = pPr.find(f'{w}spacing')
                if spacing is None:
                    spacing = etree.SubElement(pPr, f'{w}spacing')
                
                spacing.set(f'{w}line', str(self.gost_rules['line_spacing']))
                spacing.set(f'{w}lineRule', 'auto')
                spacing.set(f'{w}before', '0')
                spacing.set(f'{w}after', '0')
                
                # Устанавливаем отступ
                ind = pPr.find(f'{w}ind')
                if ind is None:
                    ind = etree.SubElement(pPr, f'{w}ind')
                
                ind.set(f'{w}firstLine', str(self.gost_rules['first_line_indent']))
                
                # Выравнивание по ширине
                jc = pPr.find(f'{w}jc')
                if jc is None:
                    jc = etree.SubElement(pPr, f'{w}jc')
                jc.set(f'{w}val', 'both')
                
                self._log_edit(XMLEditType.STYLE, "Normal style", None, 
                             "Updated", True)
                return True
        
        return False
    
    # =========================================================================
    # ПОЛНОЕ ИСПРАВЛЕНИЕ ДОКУМЕНТА
    # =========================================================================
    
    def fix_all(self) -> XMLEditReport:
        """
        Выполняет полное исправление документа по ГОСТ.
        
        Returns:
            XMLEditReport: Отчёт о выполненных изменениях
        """
        # 1. Исправляем стиль Normal
        self.fix_normal_style()
        
        # 2. Исправляем поля страницы
        self.fix_page_margins()
        
        # 3. Исправляем все шрифты
        self.fix_all_fonts()
        
        # 4. Исправляем все абзацы
        self.fix_all_paragraphs()
        
        return self.report
    
    def _log_edit(self, edit_type: XMLEditType, xpath: str, 
                 old_value: Any, new_value: Any, success: bool,
                 error_message: str = ""):
        """Логирует выполненное редактирование"""
        edit = XMLEdit(
            edit_type=edit_type,
            xpath=xpath,
            old_value=old_value,
            new_value=new_value,
            success=success,
            error_message=error_message
        )
        self.report.add_edit(edit)


def apply_xml_corrections(file_path: str, output_path: str = None) -> Tuple[str, XMLEditReport]:
    """
    Применяет XML-коррекции к документу.
    
    Это функция-обёртка для удобного использования XMLDocumentEditor.
    
    Args:
        file_path: Путь к исходному DOCX файлу
        output_path: Путь для сохранения (опционально)
        
    Returns:
        Tuple[str, XMLEditReport]: Путь к файлу и отчёт
    """
    if output_path is None:
        # Создаём имя выходного файла
        base, ext = os.path.splitext(file_path)
        output_path = f"{base}_xml_fixed{ext}"
    
    with XMLDocumentEditor(file_path) as editor:
        report = editor.fix_all()
        saved_path = editor.save(output_path)
    
    return saved_path, report
