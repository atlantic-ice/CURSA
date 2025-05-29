import os
import re
import datetime
import tempfile
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
import shutil
from docxtpl import DocxTemplate
from docxcompose.composer import Composer

class DocumentCorrector:
    """
    Класс для исправления ошибок в документе
    """
    def __init__(self):
        # Стандартные правила для курсовых работ
        self.standard_rules = {
            'font': {
                'name': 'Times New Roman',
                'size': 14.0,  # pt
            },
            'margins': {
                'left': 3.0,  # cm
                'right': 1.5,  # cm
                'top': 2.0,  # cm
                'bottom': 2.0,  # cm
            },
            'line_spacing': 1.5,
            'first_line_indent': Cm(1.25),
            'headings': {
                'h1': {
                    'font_size': 16.0,  # pt
                    'bold': True,
                    'alignment': WD_PARAGRAPH_ALIGNMENT.CENTER,
                    'all_caps': True
                },
                'h2': {
                    'font_size': 14.0,  # pt
                    'bold': True,
                    'alignment': WD_PARAGRAPH_ALIGNMENT.LEFT
                }
            }
        }
        self.errors = []
        self.temp_files = []
    
    def __del__(self):
        """
        Деструктор для очистки временных файлов
        """
        for temp_file in self.temp_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    print(f"Удален временный файл: {temp_file}")
                    
                # Проверяем, пуста ли директория, и если да, удаляем её
                temp_dir = os.path.dirname(temp_file)
                if os.path.exists(temp_dir) and not os.listdir(temp_dir):
                    os.rmdir(temp_dir)
                    print(f"Удалена пустая временная директория: {temp_dir}")
            except Exception as e:
                print(f"Ошибка при удалении временного файла {temp_file}: {str(e)}")
    
    def correct_document(self, file_path, errors=None, out_path=None):
        """
        Исправляет ошибки в документе
        
        Args:
            file_path: Путь к файлу для исправления
            errors: Список ошибок для исправления (если None, исправляем все возможные)
            out_path: Путь для сохранения исправленного файла (если None, генерируется автоматически)
            
        Returns:
            str: Путь к исправленному файлу
        """
        self.errors = errors
        
        # Проверяем существование файла
        if not os.path.exists(file_path):
            # Пробуем добавить расширение .docx если его нет
            if not file_path.lower().endswith('.docx'):
                corrected_path = file_path + '.docx'
                if os.path.exists(corrected_path):
                    file_path = corrected_path
                else:
                    raise FileNotFoundError(f"Файл не найден: {file_path}")
            else:
                raise FileNotFoundError(f"Файл не найден: {file_path}")
        
        try:
            # Загружаем документ
            document = Document(file_path)
            
            # Если указан путь для сохранения
            if out_path:
                # Проверяем, что путь имеет правильное расширение
                if not out_path.lower().endswith('.docx'):
                    out_path = out_path + '.docx'
                
                # Создаем директорию, если ее нет
                out_dir = os.path.dirname(out_path)
                if out_dir and not os.path.exists(out_dir):
                    os.makedirs(out_dir, exist_ok=True)
            else:
                # Если путь не указан, создаем временный файл
                temp_dir = tempfile.mkdtemp()
                file_name = os.path.basename(file_path)
                
                # Убедимся, что имя имеет расширение .docx
                if not file_name.lower().endswith('.docx'):
                    file_name = os.path.splitext(file_name)[0] + '.docx'
                
                out_path = os.path.join(temp_dir, f"corrected_{file_name}")
                self.temp_files.append(out_path)
            
            # Если список ошибок не предоставлен, исправляем все, что можем
            if errors is None:
                self._correct_all(document)
            else:
                # Исправляем только указанные ошибки
                self._correct_specific_errors(document, errors)
            
            # Сохраняем исправленный документ
            document.save(out_path)
            return out_path
            
        except Exception as e:
            print(f"Ошибка при исправлении документа: {str(e)}")
            raise
    
    def _correct_all(self, document):
        """
        Исправляет все типичные ошибки в документе
        """
        # Сначала исправляем поля страницы и базовые настройки документа
        self._correct_margins(document)
        
        # Исправляем шрифт для всего документа
        self._correct_font(document)
        
        # Исправляем межстрочный интервал
        self._correct_line_spacing(document)
        
        # Исправляем заголовки разделов (улучшенная версия)
        self._correct_section_headings(document)
        
        # Исправляем оформление таблиц
        self._correct_tables(document)
        
        # Исправляем подписи к рисункам (точки в конце)
        self._correct_images(document)
        
        # Исправляем оформление формул
        self._correct_formulas(document)
        
        # Исправляем оформление списков
        self._correct_lists(document)
        
        # Исправляем библиографические ссылки
        self._correct_bibliography_references(document)
        
        # Исправляем список литературы по ГОСТу
        self._correct_gost_bibliography(document)
        
        # Исправляем оглавление
        self._correct_toc(document)
        
        # Исправляем список сокращений и условных обозначений
        self._correct_abbreviations_list(document)
        
        # Исправляем перекрестные ссылки
        self._correct_cross_references(document)
        
        # Исправляем оформление приложений
        self._correct_appendices(document)
        
        # Исправляем оформление акцентов в тексте
        self._correct_text_accents(document)
        
        # Исправляем подстрочные ссылки
        self._correct_footnotes(document)
        
        # Исправляем нумерацию страниц
        self._correct_page_numbers(document)
        
        # Исправляем титульный лист
        self._correct_title_page(document)
        
        # Исправляем переносы в тексте
        self._correct_hyphenation(document)
        
        # В конце применяем форматирование абзацев и выравнивание
        # для гарантии правильного форматирования всего текста
        self._correct_first_line_indent(document)
        self._correct_paragraph_alignment(document)
    
    def _correct_specific_errors(self, document, errors):
        """
        Исправляет только указанные ошибки
        """
        error_types = set(error.get('type') for error in errors if 'type' in error)
        
        # Группируем ошибки по типу
        font_errors = any(et.startswith('font_') for et in error_types)
        margin_errors = any(et.endswith('_margin') for et in error_types)
        spacing_errors = 'line_spacing' in error_types
        indent_errors = 'first_line_indent' in error_types
        heading_errors = any(et.startswith('heading_') for et in error_types)
        image_errors = any(et.startswith('image_') for et in error_types)
        table_errors = any(et.startswith('table_') for et in error_types)
        page_numbers_errors = any(et.startswith('page_numbers_') for et in error_types)
        paragraph_alignment_errors = 'paragraph_alignment' in error_types
        list_errors = any(et.startswith('list_') for et in error_types)
        title_page_errors = any(et.startswith('title_page_') for et in error_types)
        
        # Исправляем соответствующие группы ошибок
        if font_errors:
            self._correct_font(document)
        if margin_errors:
            self._correct_margins(document)
        if spacing_errors:
            self._correct_line_spacing(document)
        if indent_errors:
            self._correct_first_line_indent(document)
        if heading_errors:
            self._correct_section_headings(document)
        if image_errors:
            self._correct_images(document)
        if paragraph_alignment_errors:
            self._correct_paragraph_alignment(document)
        if table_errors:
            self._correct_tables(document)
        if page_numbers_errors:
            self._correct_page_numbers(document)
        if list_errors:
            self._correct_lists(document)
        if title_page_errors:
            self._correct_title_page(document)
    
    def _correct_font(self, document):
        """
        Исправляет шрифт для всего документа
        """
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы
            if not paragraph.text.strip():
                continue
            
            # Определяем, является ли параграф заголовком
            is_heading = paragraph.style.name.startswith('Heading')
            heading_level = None
            
            if is_heading:
                try:
                    heading_level = int(paragraph.style.name.replace('Heading ', ''))
                except ValueError:
                    heading_level = None
            
            # Применяем соответствующий стиль шрифта
            for run in paragraph.runs:
                # Устанавливаем базовый шрифт для всех элементов
                run.font.name = self.standard_rules['font']['name']
                
                if is_heading and heading_level == 1:
                    # Для заголовков 1 уровня
                    run.font.size = Pt(self.standard_rules['headings']['h1']['font_size'])
                    run.font.bold = self.standard_rules['headings']['h1']['bold']
                elif is_heading and heading_level == 2:
                    # Для заголовков 2 уровня
                    run.font.size = Pt(self.standard_rules['headings']['h2']['font_size'])
                    run.font.bold = self.standard_rules['headings']['h2']['bold']
                else:
                    # Для обычного текста
                    run.font.size = Pt(self.standard_rules['font']['size'])
    
    def _correct_margins(self, document):
        """
        Исправляет поля страницы
        """
        # Устанавливаем правильные поля для всех секций документа
        for section in document.sections:
            # Устанавливаем значения полей в сантиметрах
            section.top_margin = Cm(self.standard_rules['margins']['top'])
            section.bottom_margin = Cm(self.standard_rules['margins']['bottom'])
            section.left_margin = Cm(self.standard_rules['margins']['left'])
            section.right_margin = Cm(self.standard_rules['margins']['right'])
            
            # Устанавливаем стандартную ориентацию страницы
            section.orientation = 0  # 0 - портретная ориентация
            
            # Устанавливаем размер страницы A4
            section.page_width = Cm(21.0)
            section.page_height = Cm(29.7)
    
    def _correct_line_spacing(self, document):
        """
        Исправляет межстрочный интервал
        """
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы и заголовки
            if not paragraph.text.strip() or paragraph.style.name.startswith('Heading'):
                continue
            
            # Устанавливаем полуторный интервал (1.5)
            paragraph.paragraph_format.line_spacing = self.standard_rules['line_spacing']
            paragraph.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
            
            # Дополнительно устанавливаем правильный интервал перед и после абзаца
            paragraph.paragraph_format.space_before = Pt(0)
            paragraph.paragraph_format.space_after = Pt(0)
    
    def _correct_first_line_indent(self, document):
        """
        Исправляет отступы первой строки (абзацный отступ)
        """
        # Обрабатываем основные параграфы документа
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы и заголовки
            if not paragraph.text.strip() or paragraph.style.name.startswith('Heading'):
                continue
                
            # Пропускаем подписи к рисункам (которые должны быть без отступа)
            if paragraph.text.strip().lower().startswith(('рисунок', 'рис.')):
                # Явно устанавливаем нулевой отступ для подписей к рисункам
                paragraph.paragraph_format.first_line_indent = Cm(0)
                continue
                
            # Пропускаем заголовки таблиц (которые должны быть без отступа)
            if paragraph.text.strip().lower().startswith('таблица'):
                # Явно устанавливаем нулевой отступ для заголовков таблиц
                paragraph.paragraph_format.first_line_indent = Cm(0)
                continue
                
            # Особая обработка для элементов списков
            if re.match(r'^[•\-–—]\s', paragraph.text) or re.match(r'^\d+[.)]\s', paragraph.text):
                # Для элементов списка устанавливаем отрицательный отступ первой строки
                paragraph.paragraph_format.first_line_indent = Cm(-0.5)
                paragraph.paragraph_format.left_indent = Cm(1.0)
                continue
                
            # Принудительно устанавливаем отступ первой строки 1.25 см для остальных параграфов
            paragraph.paragraph_format.first_line_indent = Cm(1.25)
            
            # Сбрасываем другие отступы, которые могут мешать
            paragraph.paragraph_format.left_indent = Cm(0)
            paragraph.paragraph_format.right_indent = Cm(0)
        
        # Обрабатываем параграфы в таблицах
        for table in document.tables:
            for row in table.rows:
                for cell in row.cells:
                    for paragraph in cell.paragraphs:
                        # Пропускаем пустые параграфы
                        if not paragraph.text.strip():
                            continue
                            
                        # Для заголовков таблиц (первая строка) отступ не нужен
                        if row == table.rows[0]:
                            paragraph.paragraph_format.first_line_indent = Cm(0)
                        else:
                            # Для остальных строк устанавливаем стандартный отступ
                            paragraph.paragraph_format.first_line_indent = Cm(1.25)
                            
                        # Сбрасываем другие отступы
                        paragraph.paragraph_format.left_indent = Cm(0)
                        paragraph.paragraph_format.right_indent = Cm(0)
    
    def _correct_section_headings(self, document):
        """
        Улучшенная функция для форматирования заголовков разделов
        """
        # Паттерны для идентификации заголовков разделов
        chapter_patterns = [
            r'^глава\s+\d+\.?\s+',
            r'^раздел\s+\d+\.?\s+',
            r'^\d+\.\s+[А-Я]',
            r'^\d+\.\d+\.\s+[А-Я]'
        ]
        
        # Словарь для хранения информации об уровнях заголовков
        heading_levels = {}
        
        # Первый проход: определяем уровни заголовков по нумерации
        for i, paragraph in enumerate(document.paragraphs):
            text = paragraph.text.strip()
            
            # Пропускаем пустые параграфы
            if not text:
                continue
                
            # Проверяем, является ли параграф потенциальным заголовком
            is_heading = False
            heading_level = None
            
            # Проверяем по регулярным выражениям
            for pattern in chapter_patterns:
                if re.match(pattern, text, re.IGNORECASE):
                    is_heading = True
                    
                    # Определяем уровень заголовка по количеству чисел в нумерации
                    numbers = re.findall(r'\d+', text.split()[0])
                    heading_level = len(numbers)
                    break
            
            # Также проверяем, является ли параграф уже заголовком по стилю
            if paragraph.style and paragraph.style.name.startswith('Heading'):
                is_heading = True
                try:
                    current_level = int(paragraph.style.name.replace('Heading ', ''))
                    heading_level = current_level if heading_level is None else heading_level
                except (ValueError, AttributeError):
                    pass
            
            # Если это заголовок, сохраняем информацию
            if is_heading and heading_level:
                heading_levels[i] = heading_level
        
        # Второй проход: форматируем заголовки согласно их уровню
        for i, paragraph in enumerate(document.paragraphs):
            if i in heading_levels:
                level = heading_levels[i]
                
                # Применяем соответствующий стиль заголовка
                if level == 1:
                    paragraph.style = document.styles['Heading 1']
                    # Дополнительное форматирование для Heading 1
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                    paragraph.paragraph_format.space_before = Pt(12)
                    paragraph.paragraph_format.space_after = Pt(12)
                    
                    # Делаем текст заглавными буквами
                    paragraph.text = paragraph.text.upper()
                elif level == 2:
                    paragraph.style = document.styles['Heading 2']
                    # Дополнительное форматирование для Heading 2
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                    paragraph.paragraph_format.space_before = Pt(12)
                    paragraph.paragraph_format.space_after = Pt(6)
                    
                    # Первая буква заглавная, остальные строчные
                    # (сохраняем первое слово как есть, т.к. это может быть номер)
                    parts = paragraph.text.split(' ', 1)
                    if len(parts) > 1:
                        paragraph.text = parts[0] + ' ' + parts[1].capitalize()
                elif level == 3:
                    paragraph.style = document.styles['Heading 3']
                    # Дополнительное форматирование для Heading 3
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                    paragraph.paragraph_format.space_before = Pt(6)
                    paragraph.paragraph_format.space_after = Pt(3)
                
                # Общие правила для всех заголовков
                paragraph.paragraph_format.first_line_indent = Cm(0)
                paragraph.paragraph_format.left_indent = Cm(0)
                paragraph.paragraph_format.right_indent = Cm(0)
                
                # Убираем точку в конце заголовка, если она есть
                if paragraph.text.strip().endswith('.'):
                    paragraph.text = paragraph.text.strip().rstrip('.')
                
                # Форматирование шрифта заголовка
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    if level == 1:
                        run.font.size = Pt(16)
                        run.font.bold = True
                    elif level == 2:
                        run.font.size = Pt(14)
                        run.font.bold = True
                    else:
                        run.font.size = Pt(14)
                        run.font.bold = True 

    def _correct_images(self, document):
        """
        Исправляет подписи к рисункам
        """
        for paragraph in document.paragraphs:
            # Проверяем, является ли параграф подписью к рисунку
            if paragraph.text.strip().lower().startswith(('рис.', 'рисунок', 'рис ')):
                # Заменяем сокращение "рис." на полное "Рисунок"
                if paragraph.text.strip().lower().startswith('рис.') or paragraph.text.strip().lower().startswith('рис '):
                    number_match = re.search(r'рис\.?\s*(\d+)', paragraph.text.lower())
                    if number_match:
                        number = number_match.group(1)
                        text_after = paragraph.text[number_match.end():].lstrip()
                        
                        # Проверяем, есть ли разделитель между номером и названием
                        if text_after.startswith('-'):
                            text_after = text_after[1:].lstrip()
                        elif not text_after.startswith('–') and not text_after.startswith('—'):
                            text_after = '– ' + text_after
                            
                        paragraph.text = f"Рисунок {number} {text_after}"
                
                # Добавляем точку в конце подписи, если её нет
                if not paragraph.text.strip().endswith('.'):
                    paragraph.text = paragraph.text.strip() + '.'
                
                # Выравниваем подпись по центру
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                
                # Сбрасываем отступы
                paragraph.paragraph_format.first_line_indent = Cm(0)
                paragraph.paragraph_format.left_indent = Cm(0)
    
    def _correct_paragraph_alignment(self, document):
        """
        Исправляет выравнивание параграфов
        """
        # Сначала проходим по всем параграфам в основном документе
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы
            if not paragraph.text.strip():
                continue
                
            # Обрабатываем заголовки
            if paragraph.style.name.startswith('Heading'):
                heading_level = int(paragraph.style.name.replace('Heading ', ''))
                if heading_level == 1:
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                else:
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                continue
                
            # Подписи к рисункам выравниваем по центру
            if paragraph.text.strip().lower().startswith(('рисунок', 'рис.')):
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                continue
                
            # Заголовки таблиц выравниваем по левому краю
            if paragraph.text.strip().lower().startswith('таблица'):
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                continue
                
            # Элементы списков выравниваем по ширине, но с особым форматированием
            if re.match(r'^[•\-–—]\s', paragraph.text) or re.match(r'^\d+[.)]\s', paragraph.text):
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                continue
                
            # Все остальные параграфы (основной текст) выравниваем по ширине
            paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
            
            # Включаем автоматические переносы для улучшения выравнивания по ширине
            self._enable_hyphenation(paragraph)
        
        # Затем проходим по всем таблицам и выравниваем текст в ячейках
        for table in document.tables:
            for row in table.rows:
                for cell in row.cells:
                    for paragraph in cell.paragraphs:
                        # Пропускаем пустые параграфы
                        if not paragraph.text.strip():
                            continue
                        
                        # Выравниваем текст в ячейках по ширине
                        paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY                        # Включаем автоматические переносы для улучшения выравнивания
                        self._enable_hyphenation(paragraph)

    def _enable_hyphenation(self, paragraph):
        """
        Включает автоматические переносы для параграфа
        """
        try:
            pPr = paragraph._element.get_or_add_pPr()
            if pPr is not None:
                # Добавляем свойство автоматического переноса слов
                hyphenation_element = OxmlElement('w:autoSpaceDE')
                hyphenation_element.set(qn('w:val'), '1')
                pPr.append(hyphenation_element)
                
                # Добавляем свойство выравнивания последней строки
                last_line_element = OxmlElement('w:contextualSpacing')
                last_line_element.set(qn('w:val'), '1')
                pPr.append(last_line_element)
        except Exception as e:
            print(f"Предупреждение: Не удалось включить переносы слов: {str(e)}")
    
    def _correct_tables(self, document):
        """
        Исправляет оформление таблиц
        """
        for table in document.tables:
            # Устанавливаем единый шрифт и форматирование для всей таблицы
            for row in table.rows:
                for cell in row.cells:
                    for paragraph in cell.paragraphs:
                        # Устанавливаем шрифт для всех элементов текста
                        for run in paragraph.runs:
                            run.font.name = self.standard_rules['font']['name']
                            run.font.size = Pt(self.standard_rules['font']['size'])
                        
                        # Пропускаем пустые параграфы
                        if not paragraph.text.strip():
                            continue
                            
                        # Устанавливаем выравнивание по ширине для текста в ячейках
                        paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                        
                        # Устанавливаем абзацный отступ для текста в ячейках
                        # (только если это не заголовок таблицы - обычно первая строка)
                        if row != table.rows[0]:  # Не первая строка таблицы
                            paragraph.paragraph_format.first_line_indent = Cm(1.25)
                        else:
                            # Для заголовка таблицы убираем отступ
                            paragraph.paragraph_format.first_line_indent = Cm(0)
                        
                        # Устанавливаем межстрочный интервал
                        paragraph.paragraph_format.line_spacing = self.standard_rules['line_spacing']
                        paragraph.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
                        
                        # Убираем лишние интервалы до и после параграфа внутри ячейки
                        paragraph.paragraph_format.space_before = Pt(0)
                        paragraph.paragraph_format.space_after = Pt(0)
        
        # Исправляем заголовки таблиц
        for paragraph in document.paragraphs:
            if paragraph.text.strip().lower().startswith('таблица'):
                # Форматирование заголовка таблицы
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                paragraph.paragraph_format.space_after = Pt(6)
                paragraph.paragraph_format.space_before = Pt(12)
                paragraph.paragraph_format.first_line_indent = Cm(0)
                
                # Добавляем точку в конце подписи, если её нет
                if not paragraph.text.strip().endswith('.'):
                    paragraph.text = paragraph.text.strip() + '.'
    
    def _correct_page_numbers(self, document):
        """
        Исправляет нумерацию страниц (добавляет нумерацию в верхний колонтитул справа)
        """
        # Для каждой секции документа
        for section in document.sections:
            # Отключаем связь с предыдущим колонтитулом
            section.header.is_linked_to_previous = False
            
            # Получаем доступ к верхнему колонтитулу
            header = section.header
            
            # Очищаем содержимое верхнего колонтитула
            for paragraph in header.paragraphs:
                p = paragraph._element
                p.getparent().remove(p)
            
            # Создаем новый параграф для номера страницы
            header_paragraph = header.add_paragraph()
            
            # Настраиваем форматирование параграфа
            header_paragraph.alignment = WD_PARAGRAPH_ALIGNMENT.RIGHT  # Выравнивание справа
            header_paragraph.paragraph_format.space_before = Pt(0)
            header_paragraph.paragraph_format.space_after = Pt(0)
            header_paragraph.paragraph_format.line_spacing = 1.0
            
            # Добавляем номер страницы через поле
            run = header_paragraph.add_run()
            self._add_page_number(run)
            
            # Устанавливаем шрифт для номера страницы
            run.font.name = self.standard_rules['font']['name']  # Times New Roman
            run.font.size = Pt(12)  # 12pt
            run.font.bold = False
            
            # Добавляем пустой run после номера страницы для корректного отображения
            header_paragraph.add_run()
        
        # Отключаем нумерацию на первых страницах
        self._suppress_initial_page_numbers(document)
    
    def _add_page_number(self, run):
        """
        Добавляет номер страницы через поле
        """
        # Создаем элементы для номера страницы
        fldChar1 = OxmlElement('w:fldChar')
        fldChar1.set(qn('w:fldCharType'), 'begin')

        instrText = OxmlElement('w:instrText')
        instrText.set(qn('xml:space'), 'preserve')
        instrText.text = " PAGE \\* MERGEFORMAT "  # Добавляем MERGEFORMAT для лучшей совместимости

        fldChar2 = OxmlElement('w:fldChar')
        fldChar2.set(qn('w:fldCharType'), 'separate')

        fldChar3 = OxmlElement('w:t')
        fldChar3.text = "1"  # Placeholder для номера страницы

        fldChar4 = OxmlElement('w:fldChar')
        fldChar4.set(qn('w:fldCharType'), 'end')

        # Добавляем созданные элементы в параграф
        run._element.append(fldChar1)
        run._element.append(instrText)
        run._element.append(fldChar2)
        run._element.append(fldChar3)
        run._element.append(fldChar4)
    
    def _suppress_initial_page_numbers(self, document):
        """
        Отключает нумерацию на начальных страницах (титульный лист, задание, реферат, оглавление)
        и устанавливает начало нумерации с нужной страницы
        """
        try:
            if document.sections:
                first_section = document.sections[0]
                
                # Получаем XML-элемент секции
                section_props = first_section._sectPr
                
                # Создаем новый элемент titlePg
                title_pg = OxmlElement('w:titlePg')
                
                # Проверяем, существует ли уже элемент
                if section_props.find(qn('w:titlePg')) is None:
                    section_props.append(title_pg)
                
                # Устанавливаем начальный номер страницы (3 или 4, в зависимости от оглавления)
                # Находим элемент pgNumType или создаем новый
                pg_num_type = section_props.find(qn('w:pgNumType'))
                if pg_num_type is None:
                    pg_num_type = OxmlElement('w:pgNumType')
                    section_props.append(pg_num_type)
                
                # Устанавливаем начальный номер страницы как 3
                # (можно будет вручную изменить на 4, если оглавление занимает две страницы)
                pg_num_type.set(qn('w:start'), '3')
                
        except Exception as e:
            print(f"Предупреждение: Не удалось настроить нумерацию начальных страниц: {str(e)}")
            # Продолжаем выполнение даже при ошибке, т.к. это некритичная функция
    
    def _correct_lists(self, document):
        """
        Исправляет оформление списков
        """
        for paragraph in document.paragraphs:
            # Проверяем, является ли параграф элементом списка
            is_list_item = False
            list_type = None
            
            # Проверка на маркированный список
            if re.match(r'^[•\-–—]\s', paragraph.text):
                is_list_item = True
                list_type = 'bullet'
            
            # Проверка на нумерованный список
            elif re.match(r'^\d+[.)]\s', paragraph.text) or re.match(r'^[a-z][.)]\s', paragraph.text):
                is_list_item = True
                list_type = 'numbered'
            
            # Применяем форматирование к элементам списка
            if is_list_item:
                # Устанавливаем левый отступ
                paragraph.paragraph_format.left_indent = Cm(1.0)
                paragraph.paragraph_format.first_line_indent = Cm(-0.5)  # Обратный отступ для маркера
                
                # Устанавливаем межстрочный интервал
                paragraph.paragraph_format.line_spacing = self.standard_rules['line_spacing']
                paragraph.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
                
                # Устанавливаем выравнивание по ширине
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                
                # Шрифт для элементов списка
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])
        
        # Дополнительно обрабатываем буквенные перечисления
        self._correct_letter_lists(document)
    
    def _correct_letter_lists(self, document):
        """
        Исправляет оформление перечислений с буквенной нумерацией
        """
        # Регулярное выражение для поиска буквенных перечислений
        letter_list_pattern = r'^([а-я])[)\.]\s'
        
        for paragraph in document.paragraphs:
            text = paragraph.text.strip()
            
            # Пропускаем пустые параграфы и заголовки
            if not text or paragraph.style.name.startswith('Heading'):
                continue
            
            # Проверяем, является ли параграф элементом буквенного перечисления
            match = re.match(letter_list_pattern, text)
            if match:
                # Форматируем перечисление
                paragraph.paragraph_format.first_line_indent = Cm(-0.5)  # Обратный отступ для буквы
                paragraph.paragraph_format.left_indent = Cm(1.0)  # Отступ слева для текста
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                
                # Проверяем формат буквы - должен быть с закрывающей скобкой: а)
                letter = match.group(1)
                
                # Если формат буквы неправильный (с точкой вместо скобки), исправляем
                if text[1] == '.':
                    paragraph.text = text.replace(f"{letter}.", f"{letter})", 1)
                
                # Восстанавливаем форматирование шрифта
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])
        
        # Ищем многоуровневые перечисления и правильно их форматируем
        current_level = 0
        in_list = False
        
        for i, paragraph in enumerate(document.paragraphs):
            text = paragraph.text.strip()
            
            # Пропускаем пустые параграфы и заголовки
            if not text or paragraph.style.name.startswith('Heading'):
                in_list = False
                current_level = 0
                continue
            
            # Проверяем, является ли параграф началом нумерованного списка
            num_match = re.match(r'^(\d+)[)\.]\s', text)
            
            # Проверяем, является ли параграф элементом буквенного перечисления
            letter_match = re.match(letter_list_pattern, text)
            
            if num_match:
                # Начало нумерованного списка (первый уровень)
                in_list = True
                current_level = 1
                
                # Форматируем первый уровень
                paragraph.paragraph_format.first_line_indent = Cm(-0.5)
                paragraph.paragraph_format.left_indent = Cm(0.5)
                
            elif letter_match and in_list:
                # Буквенное перечисление (второй уровень)
                current_level = 2
                
                # Форматируем второй уровень с дополнительным отступом
                paragraph.paragraph_format.first_line_indent = Cm(-0.5)
                paragraph.paragraph_format.left_indent = Cm(1.5)  # Увеличенный отступ для вложенного списка
                
            elif in_list and text and not (num_match or letter_match):
                # Проверяем наличие тире или маркера (третий уровень)
                if text.startswith('-') or text.startswith('•'):
                    current_level = 3
                    
                    # Форматируем третий уровень
                    paragraph.paragraph_format.first_line_indent = Cm(-0.5)
                    paragraph.paragraph_format.left_indent = Cm(2.5)  # Еще больший отступ
                else:
                    # Обычный параграф - конец списка
                    in_list = False
                    current_level = 0 

    def _correct_title_page(self, document):
        """
        Исправляет титульный лист: заменяет неправильный титульный лист на шаблонный
        или вставляет шаблонный титульный лист, если он отсутствует
        """
        # Проверяем наличие титульного листа
        title_page_exists = False
        title_page_paragraphs = []
        
        # Собираем все параграфы титульного листа (до первого Heading 1 или до "СОДЕРЖАНИЕ"/"ВВЕДЕНИЕ")
        for i, para in enumerate(document.paragraphs):
            text = para.text.strip().lower()
            if para.style.name.startswith('Heading') and para.style.name == 'Heading 1':
                break
            if any(word in text for word in ['содержание', 'введение']):
                break
            title_page_paragraphs.append((i, para))
        
        # Определяем, содержит ли документ титульный лист
        title_keywords = [
            'университет', 'кафедра', 'факультет', 'курсовая', 'работа', 'студент', 'руководитель'
        ]
        
        # Проверяем, содержит ли титульный лист ключевые слова
        if len(title_page_paragraphs) > 3:  # Минимальное количество строк для титульного листа
            title_text = ' '.join([para[1].text.lower() for para in title_page_paragraphs])
            if any(keyword in title_text for keyword in title_keywords):
                title_page_exists = True
        
        # Путь к шаблону титульного листа
        template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates', 'Титульный лист.docx')
        
        if not os.path.exists(template_path):
            print(f"Предупреждение: Шаблон титульного листа не найден по пути {template_path}")
            return

        if title_page_exists:
            # Если титульный лист существует, но неправильно оформлен - заменяем его
            # Удаляем старые параграфы титульного листа
            for i, para in reversed(title_page_paragraphs):
                p = para._element
                p.getparent().remove(p)
                
            # Вставляем новый титульный лист из шаблона
            self._insert_title_page_from_template(document, template_path)
        else:
            # Если титульного листа нет - просто вставляем шаблон
            self._insert_title_page_from_template(document, template_path)

    def _insert_title_page_from_template(self, document, template_path):
        """
        Вставляет титульный лист из шаблона в начало документа
        """
        try:
            # Создаем временный файл для сохранения текущего документа
            temp_doc_fd, temp_doc_path = tempfile.mkstemp(suffix='.docx')
            os.close(temp_doc_fd)
            document.save(temp_doc_path)
            self.temp_files.append(temp_doc_path)
            
            # Создаем новый документ на основе шаблона титульного листа
            title_doc = Document(template_path)
            
            # Сохраняем шаблон во временный файл
            temp_title_fd, temp_title_path = tempfile.mkstemp(suffix='.docx')
            os.close(temp_title_fd)
            title_doc.save(temp_title_path)
            self.temp_files.append(temp_title_path)
            
            # Используем Composer для объединения документов
            composer = Composer(title_doc)
            doc_to_merge = Document(temp_doc_path)
            composer.append(doc_to_merge)
            
            # Сохраняем результат во временный файл
            temp_result_fd, temp_result_path = tempfile.mkstemp(suffix='.docx')
            os.close(temp_result_fd)
            composer.save(temp_result_path)
            self.temp_files.append(temp_result_path)
            
            # Загружаем результат обратно в исходный документ
            result_doc = Document(temp_result_path)
            
            # Очищаем исходный документ
            for element in list(document._element.body):
                document._element.body.remove(element)
            
            # Копируем все элементы из результата в исходный документ
            for element in list(result_doc._element.body):
                document._element.body.append(element)
                
            print("Титульный лист успешно вставлен")
            
        except Exception as e:
            print(f"Ошибка при вставке титульного листа: {str(e)}")
            # Продолжаем выполнение даже при ошибке, т.к. титульный лист не критичен 

    def _correct_formulas(self, document):
        """
        Исправляет оформление формул в документе
        """
        for i, paragraph in enumerate(document.paragraphs):
            # Ищем параграфы, которые могут содержать формулы
            if re.search(r'(?:\(\d+\)|\(\d+\.\d+\))', paragraph.text):  # Формат (1) или (1.1)
                # Выравниваем формулы по центру
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                
                # Убираем абзацный отступ
                paragraph.paragraph_format.first_line_indent = Cm(0)
                
                # Добавляем интервал до и после формулы
                paragraph.paragraph_format.space_before = Pt(6)
                paragraph.paragraph_format.space_after = Pt(6)
                
                # Проверяем, есть ли номер формулы
                formula_number_match = re.search(r'\((\d+(?:\.\d+)?)\)', paragraph.text)
                if formula_number_match:
                    # Если номер формулы найден, проверяем правильность его размещения (должен быть справа)
                    formula_text = paragraph.text.replace(formula_number_match.group(0), '').strip()
                    formula_number = formula_number_match.group(0)
                    
                    # Очищаем параграф
                    for run in paragraph.runs:
                        run.text = ''
                    
                    # Создаем таблицу для выравнивания формулы и номера
                    # (это имитация табуляции, которая лучше работает для формул)
                    table = document.add_table(rows=1, cols=2)
                    table.autofit = False
                    table.alignment = WD_TABLE_ALIGNMENT.CENTER
                    table.style = 'Table Grid'
                    
                    # Устанавливаем ширину столбцов (80% и 20%)
                    table.columns[0].width = Cm(12)  # Примерно 80% ширины
                    table.columns[1].width = Cm(3)   # Примерно 20% ширины
                    
                    # Добавляем формулу в левую ячейку
                    cell_left = table.cell(0, 0)
                    cell_left.text = formula_text
                    cell_left.paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                    
                    # Добавляем номер формулы в правую ячейку
                    cell_right = table.cell(0, 1)
                    cell_right.text = formula_number
                    cell_right.paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.RIGHT
                    
                    # Удаляем границы таблицы
                    table.style = 'Table Grid'
                    for row in table.rows:
                        for cell in row.cells:
                            for border in ['top', 'bottom', 'left', 'right']:
                                cell._element.get_or_add_tcPr().first_or_add('w:tcBorders').get_or_add_child('w:{}'.format(border)).set('w:val', 'none')
                    
                    # Вставляем таблицу вместо параграфа
                    p = paragraph._p
                    p.addnext(table._tbl)
                    p.getparent().remove(p)

    def _correct_bibliography_references(self, document):
        """
        Исправляет оформление библиографических ссылок в тексте
        """
        # Регулярное выражение для поиска неправильно оформленных ссылок
        wrong_ref_patterns = [
            # Ссылки без квадратных скобок
            r'(?<!\[)(\d+)(?!\])',
            # Ссылки с круглыми скобками вместо квадратных
            r'\((\d+)\)',
            # Ссылки с буквой "с" вне скобок
            r'\[(\d+)\]\s*с\.\s*(\d+)',
            # Ссылки без пробела после запятой
            r'\[(\d+),(\d+)\]'
        ]
        
        # Правильные форматы ссылок
        correct_formats = {
            'simple': '[{}]',
            'page': '[{}, с. {}]',
            'multiple': '[{}, {}]'
        }
        
        # Проходим по всем параграфам документа
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы
            if not paragraph.text.strip():
                continue
                
            # Исправляем различные форматы ссылок
            
            # 1. Исправляем ссылки без квадратных скобок (только цифры)
            # Находим все вхождения цифр, которые могут быть ссылками
            text = paragraph.text
            
            # Исправляем ссылки с круглыми скобками
            text = re.sub(r'\((\d+)\)', r'[\1]', text)
            
            # Исправляем ссылки с буквой "с" вне скобок
            text = re.sub(r'\[(\d+)\]\s*с\.\s*(\d+)', r'[\1, с. \2]', text)
            
            # Исправляем ссылки без пробела после запятой
            text = re.sub(r'\[(\d+),(\d+)\]', r'[\1, \2]', text)
            
            # Если текст изменился, обновляем параграф
            if text != paragraph.text:
                paragraph.text = text
                
                # Восстанавливаем форматирование после изменения текста
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size']) 

    def _correct_gost_bibliography(self, document):
        """
        Исправляет оформление списка литературы в соответствии с ГОСТ 7.0.100-2018
        """
        # Ищем раздел со списком литературы
        bibliography_started = False
        bibliography_paragraphs = []
        
        # Паттерны для идентификации различных типов источников
        source_patterns = {
            'book': r'(?i)(?:^|\s)[а-яА-Я][а-яА-Я\s]+\s[А-Я]\.\s?[А-Я]\.(?:\s|,)',  # Фамилия И. О.
            'article': r'(?i)(?:^|\s)[а-яА-Я][а-яА-Я\s]+\s[А-Я]\.\s?[А-Я]\.\s[А-Я][а-я]',  # Фамилия И. О. Название статьи
            'web': r'(?i)(?:https?://|www\.|электронный|ресурс|доступ)',  # Электронный ресурс
            'law': r'(?i)(?:федеральный закон|приказ|постановление|распоряжение|указ)',  # Нормативные документы
            'gost': r'(?i)(?:^|\s)ГОСТ\s',  # ГОСТ
            'dissertation': r'(?i)(?:дис|автореф)\.(?:\s|\.)'  # Диссертации и авторефераты
        }
        
        for i, paragraph in enumerate(document.paragraphs):
            text = paragraph.text.strip().lower()
            
            # Определяем начало списка литературы
            if not bibliography_started and re.search(r'список\s+(использованн(ой|ых)\s+)?литератур', text):
                bibliography_started = True
                # Форматируем заголовок списка литературы
                paragraph.style = document.styles['Heading 1']
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                paragraph.paragraph_format.first_line_indent = Cm(0)
                paragraph.paragraph_format.space_after = Pt(12)
                paragraph.paragraph_format.space_before = Pt(12)
                
                # Убираем точку в конце заголовка, если она есть
                if paragraph.text.strip().endswith('.'):
                    paragraph.text = paragraph.text.strip().rstrip('.')
                
                # Приводим к верхнему регистру
                paragraph.text = paragraph.text.upper()
                continue
            
            # Собираем параграфы списка литературы
            if bibliography_started:
                # Если встретили новый заголовок, значит список литературы закончился
                if paragraph.style.name.startswith('Heading'):
                    break
                
                # Добавляем параграф в список для дальнейшей обработки
                bibliography_paragraphs.append((i, paragraph))
        
        # Если нашли список литературы, форматируем его
        if bibliography_paragraphs:
            for i, (paragraph_index, paragraph) in enumerate(bibliography_paragraphs):
                # Пропускаем пустые параграфы
                if not paragraph.text.strip():
                    continue
                
                # Определяем тип источника
                source_type = self._detect_source_type(paragraph.text, source_patterns)
                
                # Форматируем элемент списка литературы
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                paragraph.paragraph_format.first_line_indent = Cm(-0.75)  # Обратный отступ для номера
                paragraph.paragraph_format.left_indent = Cm(0.75)  # Отступ слева для текста
                paragraph.paragraph_format.space_after = Pt(6)
                paragraph.paragraph_format.space_before = Pt(0)
                
                # Проверяем, есть ли номер в начале строки
                numbered = re.match(r'^\d+\.?\s', paragraph.text.strip())
                
                # Если номера нет, добавляем его
                if not numbered:
                    paragraph.text = f"{i + 1}. {paragraph.text.strip()}"
                
                # Применяем форматирование по ГОСТу в зависимости от типа источника
                if source_type:
                    paragraph.text = self._format_source_by_gost(paragraph.text, source_type)
                
                # Восстанавливаем форматирование после изменения текста
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])
    
    def _detect_source_type(self, text, patterns):
        """
        Определяет тип источника по его тексту
        """
        for source_type, pattern in patterns.items():
            if re.search(pattern, text):
                return source_type
        return None
    
    def _format_source_by_gost(self, text, source_type):
        """
        Форматирует библиографическую запись по ГОСТу в зависимости от типа источника
        """
        # Убираем лишние пробелы
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Проверяем, есть ли номер в начале строки и сохраняем его
        number_match = re.match(r'^(\d+\.?\s+)', text)
        number_prefix = number_match.group(1) if number_match else ""
        
        # Убираем номер для обработки и добавим его в конце
        if number_prefix:
            text = text[len(number_prefix):].strip()
        
        # Форматируем по типу источника
        if source_type == 'book':
            # Форматирование для книг
            # Фамилия, И. О. Название книги / И. О. Фамилия. – Город : Издательство, Год. – N с.
            
            # Ищем автора и название
            author_match = re.match(r'([а-яА-Я][а-яА-Я\s]+)\s([А-Я])\.\s?([А-Я])\.', text)
            if author_match:
                surname, initial1, initial2 = author_match.groups()
                rest_of_text = text[author_match.end():].strip()
                
                # Проверяем, есть ли ":" или ";" после названия для определения издательства
                publisher_match = re.search(r'[:;]\s*([^,.]+),\s*(\d{4})', rest_of_text)
                
                if publisher_match:
                    publisher, year = publisher_match.groups()
                    
                    # Форматируем строку по ГОСТу
                    formatted_text = f"{surname}, {initial1}. {initial2}. {rest_of_text}"
                    
                    # Проверяем, есть ли информация о страницах
                    if not re.search(r'\d+\s*с\.', formatted_text):
                        formatted_text += " – Текст : непосредственный."
                else:
                    # Если не удалось выделить все компоненты, оставляем как есть
                    formatted_text = text
            else:
                formatted_text = text
                
        elif source_type == 'article':
            # Форматирование для статей
            # Фамилия, И. О. Название статьи / И. О. Фамилия // Название журнала. – Год. – Т. X, № N. – С. XX-XX.
            
            # Ищем автора и название
            author_match = re.match(r'([а-яА-Я][а-яА-Я\s]+)\s([А-Я])\.\s?([А-Я])\.', text)
            if author_match:
                surname, initial1, initial2 = author_match.groups()
                rest_of_text = text[author_match.end():].strip()
                
                # Проверяем, есть ли "//" для разделения названия статьи и журнала
                journal_match = re.search(r'//\s*([^.]+)', rest_of_text)
                
                if journal_match:
                    # Форматируем строку по ГОСТу
                    formatted_text = f"{surname}, {initial1}. {initial2}. {rest_of_text}"
                else:
                    # Если не удалось выделить все компоненты, оставляем как есть
                    formatted_text = text
            else:
                formatted_text = text
                
        elif source_type == 'web':
            # Форматирование для веб-ресурсов
            # Название сайта : сайт. – URL: http://... (дата обращения: ДД.ММ.ГГГГ). – Текст : электронный.
            
            # Проверяем, есть ли URL в тексте
            url_match = re.search(r'(https?://[^\s]+)', text)
            
            if url_match:
                url = url_match.group(1)
                
                # Проверяем, есть ли фраза "дата обращения"
                if not re.search(r'дата\s+обращения', text, re.IGNORECASE):
                    # Если нет, добавляем текущую дату
                    today = datetime.datetime.now().strftime("%d.%m.%Y")
                    text = text.replace(url, f"{url} (дата обращения: {today})")
                
                # Проверяем, есть ли указание на электронный ресурс
                if not re.search(r'электронный|ресурс', text, re.IGNORECASE):
                    text += " – Текст : электронный."
                
                formatted_text = text
            else:
                formatted_text = text
                
        elif source_type == 'law':
            # Форматирование для нормативных документов
            # Об образовании в Российской Федерации : Федеральный закон № 273-ФЗ : [принят Государственной думой 21 декабря 2012 года : одобрен Советом Федерации 26 декабря 2012 года]. – Москва : Проспект, 2020. – 192 с.
            
            formatted_text = text
            
        elif source_type == 'gost':
            # Форматирование для ГОСТов
            # ГОСТ Р 7.0.100-2018. Библиографическая запись. Библиографическое описание. Общие требования и правила составления : национальный стандарт Российской Федерации : издание официальное : утвержден и введен в действие Приказом Федерального агентства по техническому регулированию и метрологии от 3 декабря 2018 г. № 1050-ст : введен впервые : дата введения 2019-07-01 / разработан Федеральным государственным унитарным предприятием "Информационное телеграфное агентство России (ИТАР-ТАСС)" филиал "Российская книжная палата", Федеральным государственным бюджетным учреждением "Российская государственная библиотека", Федеральным государственным бюджетным учреждением "Российская национальная библиотека". – Москва : Стандартинформ, 2018. – IV, 124, [1] c.
            
            formatted_text = text
            
        elif source_type == 'dissertation':
            # Форматирование для диссертаций и авторефератов
            # Фамилия, И. О. Название диссертации : специальность 00.00.00 «Название специальности» : диссертация на соискание ученой степени доктора / кандидата наук / И. О. Фамилия ; Организация. – Город, Год. – Число страниц с.
            
            formatted_text = text
            
        else:
            # Если тип не определен, оставляем как есть
            formatted_text = text
        
        # Добавляем номер обратно
        return f"{number_prefix}{formatted_text}" 

    def _correct_toc(self, document):
        """
        Исправляет оформление оглавления (содержания)
        """
        # Ищем раздел с оглавлением
        toc_started = False
        toc_paragraphs = []
        
        for i, paragraph in enumerate(document.paragraphs):
            text = paragraph.text.strip().lower()
            
            # Определяем начало оглавления
            if not toc_started and re.search(r'^(оглавление|содержание)$', text):
                toc_started = True
                # Форматируем заголовок оглавления
                paragraph.style = document.styles['Heading 1']
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                paragraph.paragraph_format.first_line_indent = Cm(0)
                paragraph.paragraph_format.space_after = Pt(12)
                paragraph.paragraph_format.space_before = Pt(12)
                
                # Убираем точку в конце заголовка, если она есть
                if paragraph.text.strip().endswith('.'):
                    paragraph.text = paragraph.text.strip().rstrip('.')
                
                # Приводим к верхнему регистру
                paragraph.text = paragraph.text.upper()
                continue
            
            # Собираем параграфы оглавления
            if toc_started:
                # Если встретили заголовок "ВВЕДЕНИЕ", значит оглавление закончилось
                if text == 'введение' or paragraph.style.name.startswith('Heading'):
                    break
                
                # Добавляем параграф в список для дальнейшей обработки
                toc_paragraphs.append((i, paragraph))
        
        # Если нашли оглавление, форматируем его
        if toc_paragraphs:
            for i, paragraph in toc_paragraphs:
                # Пропускаем пустые параграфы
                if not paragraph.text.strip():
                    continue
                
                # Форматируем элемент оглавления
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                paragraph.paragraph_format.first_line_indent = Cm(0)  # Без абзацного отступа
                paragraph.paragraph_format.left_indent = Cm(0)  # Без отступа слева
                paragraph.paragraph_format.space_after = Pt(0)
                paragraph.paragraph_format.space_before = Pt(0)
                
                # Восстанавливаем форматирование после изменения текста
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])
                    
                # Проверяем наличие точек между текстом и номером страницы
                # Если точек нет, добавляем их
                if not re.search(r'\.{2,}\s*\d+$', paragraph.text):
                    # Разделяем текст и номер страницы
                    match = re.search(r'^(.*?)\s*(\d+)$', paragraph.text)
                    if match:
                        text_part = match.group(1).strip()
                        page_number = match.group(2)
                        
                        # Добавляем точки между текстом и номером страницы
                        paragraph.text = f"{text_part} {'.' * 20} {page_number}"

    def _correct_appendices(self, document):
        """
        Исправляет оформление приложений
        """
        # Ищем начало раздела приложений
        appendix_started = False
        current_appendix = None
        
        for i, paragraph in enumerate(document.paragraphs):
            text = paragraph.text.strip()
            
            # Проверяем, не является ли параграф началом приложения
            if re.match(r'^ПРИЛОЖЕНИЕ\s+[А-Я]', text, re.IGNORECASE):
                appendix_started = True
                current_appendix = text
                
                # Форматируем заголовок приложения
                paragraph.style = document.styles['Heading 1']
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                paragraph.paragraph_format.first_line_indent = Cm(0)
                paragraph.paragraph_format.space_after = Pt(12)
                paragraph.paragraph_format.space_before = Pt(12)
                
                # Убираем точку в конце заголовка, если она есть
                if paragraph.text.strip().endswith('.'):
                    paragraph.text = paragraph.text.strip().rstrip('.')
                
                # Приводим к верхнему регистру
                paragraph.text = paragraph.text.upper()
                
                # Если после слова "ПРИЛОЖЕНИЕ" и буквы нет названия, ищем следующий параграф с названием
                if len(paragraph.text.split()) < 3:
                    next_para_index = i + 1
                    if next_para_index < len(document.paragraphs):
                        next_para = document.paragraphs[next_para_index]
                        if next_para.text.strip() and not next_para.style.name.startswith('Heading'):
                            # Форматируем название приложения
                            next_para.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                            next_para.paragraph_format.first_line_indent = Cm(0)
                            next_para.paragraph_format.space_after = Pt(12)
                            next_para.paragraph_format.space_before = Pt(0)
                            
                            # Приводим к верхнему регистру
                            next_para.text = next_para.text.upper()
            
            # Форматируем содержимое приложения, если это не заголовок
            elif appendix_started and not paragraph.style.name.startswith('Heading') and text:
                # Для текста внутри приложения применяем стандартное форматирование
                if not re.match(r'^(рисунок|рис\.|таблица)', text.lower()):
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                    paragraph.paragraph_format.first_line_indent = Cm(1.25)
                    
                    # Восстанавливаем форматирование шрифта
                    for run in paragraph.runs:
                        run.font.name = self.standard_rules['font']['name']
                        run.font.size = Pt(self.standard_rules['font']['size'])
                
                # Для подписей к рисункам и таблицам применяем специальное форматирование
                elif re.match(r'^(рисунок|рис\.)', text.lower()):
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                    paragraph.paragraph_format.first_line_indent = Cm(0)
                elif re.match(r'^таблица', text.lower()):
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                    paragraph.paragraph_format.first_line_indent = Cm(0)
                
                # Проверяем наличие нового приложения (если встретился заголовок нового приложения)
                if re.match(r'^ПРИЛОЖЕНИЕ\s+[А-Я]', text, re.IGNORECASE) and text != current_appendix:
                    current_appendix = text

    def _correct_text_accents(self, document):
        """
        Исправляет оформление акцентов в тексте (курсив, жирность)
        """
        # Проходим по всем параграфам
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы
            if not paragraph.text.strip():
                continue
            
            # Пропускаем заголовки - у них свое форматирование
            if paragraph.style.name.startswith('Heading'):
                continue
            
            # Проверяем форматирование текста (акценты)
            has_inconsistent_formatting = False
            expected_bold = None
            expected_italic = None
            expected_font_size = None
            runs_count = len(paragraph.runs)
            
            # Пропускаем параграфы с одним run - они не требуют выравнивания форматирования
            if runs_count <= 1:
                continue
            
            # Если количество runs больше 1, проверяем необходимость выравнивания форматирования
            for i, run in enumerate(paragraph.runs):
                # Пропускаем пустые runs
                if not run.text.strip():
                    continue
                
                # Если это первый непустой run, запоминаем его форматирование как ожидаемое
                if expected_bold is None:
                    expected_bold = run.bold
                    expected_italic = run.italic
                    if hasattr(run.font, 'size') and run.font.size:
                        expected_font_size = run.font.size
                
                # Проверяем наличие несоответствий в форматировании
                if run.bold != expected_bold or run.italic != expected_italic:
                    # Если текст содержит всего несколько символов и отличается по форматированию,
                    # вероятно, это специально выделенный фрагмент (акцент)
                    if len(run.text.strip()) <= 5 or re.match(r'^[\s\.\,\:\;\"\'\(\)\[\]\-]+$', run.text):
                        # Сохраняем отдельное форматирование для акцентов
                        continue
                    
                    # Иначе считаем это ошибкой форматирования
                    has_inconsistent_formatting = True
                    break
                
                # Проверяем размер шрифта
                if hasattr(run.font, 'size') and run.font.size and expected_font_size and run.font.size != expected_font_size:
                    # Для небольших фрагментов текста допускаем разный размер шрифта
                    if len(run.text.strip()) <= 5:
                        continue
                    
                    has_inconsistent_formatting = True
                    break
            
            # Если обнаружено несогласованное форматирование, выравниваем его
            if has_inconsistent_formatting:
                # Используем основной стиль текста документа
                for run in paragraph.runs:
                    # Устанавливаем стандартный шрифт и размер
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])
                    
                    # Сбрасываем жирность и курсив
                    run.font.bold = False
                    run.font.italic = False

    def _correct_footnotes(self, document):
        """
        Исправляет оформление подстрочных ссылок
        """
        # Ищем все сноски в документе
        footnotes_found = False
        
        try:
            # Получаем доступ к сноскам документа через XML
            if hasattr(document, '_element') and hasattr(document._element, 'xpath'):
                # Найдем все элементы сносок в документе
                footnote_refs = document._element.xpath('//w:footnoteReference')
                
                if footnote_refs:
                    footnotes_found = True
                    # Сноски есть, проверяем их форматирование
                    
                    # Получаем доступ к части документа с содержимым сносок
                    footnotes_part = document._part.footnotes_part
                    
                    if footnotes_part:
                        footnotes_element = footnotes_part.element
                        
                        # Найдем все сноски
                        footnotes = footnotes_element.xpath('.//w:footnote')
                        
                        for footnote in footnotes:
                            # Проверяем, является ли это служебной сноской (разделитель)
                            footnote_id = footnote.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}id')
                            if footnote_id in ('0', '1'):  # Служебные сноски
                                continue
                            
                            # Находим параграфы внутри сноски
                            footnote_paras = footnote.xpath('.//w:p')
                            
                            for para in footnote_paras:
                                # Создаем объект Paragraph из XML элемента
                                p = Paragraph(para, document)
                                
                                # Форматируем текст сноски
                                p.paragraph_format.first_line_indent = Cm(0)
                                p.paragraph_format.left_indent = Cm(0)
                                p.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                                p.paragraph_format.space_after = Pt(0)
                                p.paragraph_format.space_before = Pt(0)
                                
                                # Форматируем шрифт сноски (обычно шрифт для сносок - 10pt)
                                for run in p.runs:
                                    run.font.name = self.standard_rules['font']['name']
                                    run.font.size = Pt(10)  # Размер шрифта для сносок
                                    
                                    # Убираем курсив из URL (если это не ГОСТ)
                                    if 'http' in run.text:
                                        run.font.italic = False
            
            # Если сноски не были найдены через xpath, проверим наличие обычных сносок через API
            if not footnotes_found and hasattr(document, 'footnotes'):
                for footnote in document.footnotes:
                    # Форматируем параграфы сноски
                    for para in footnote.paragraphs:
                        para.paragraph_format.first_line_indent = Cm(0)
                        para.paragraph_format.left_indent = Cm(0)
                        para.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                        
                        # Форматируем шрифт сноски
                        for run in para.runs:
                            run.font.name = self.standard_rules['font']['name']
                            run.font.size = Pt(10)  # Размер шрифта для сносок
                            
                            # Убираем курсив из URL
                            if 'http' in run.text:
                                run.font.italic = False
                
                footnotes_found = True
                        
        except Exception as e:
            print(f"Предупреждение: Не удалось исправить сноски: {str(e)}")
            # Продолжаем выполнение даже при ошибке, т.к. это некритичная функция
            
        return footnotes_found 

    def _correct_hyphenation(self, document):
        """
        Исправляет автоматические переносы в документе
        """
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы и заголовки
            if not paragraph.text.strip() or paragraph.style.name.startswith('Heading'):
                continue
                
            # Включаем автоматические переносы для параграфа
            try:
                if paragraph._element.get_or_add_pPr():
                    # Создаем элемент для автоматической расстановки переносов
                    hyphenation_element = OxmlElement('w:suppressAutoHyphens')
                    hyphenation_element.set(qn('w:val'), '0')  # 0 = включено (не подавлять)
                    paragraph._element.get_or_add_pPr().append(hyphenation_element)
                    
                    # Добавляем настройку автоматического разрыва слов для русского языка
                    lang_element = OxmlElement('w:lang')
                    lang_element.set(qn('w:val'), 'ru-RU')
                    paragraph._element.get_or_add_pPr().append(lang_element)
            except Exception as e:
                print(f"Предупреждение: Не удалось настроить переносы: {str(e)}")
        
        # Исправляем неправильные переносы в тексте
        self._fix_incorrect_hyphenation(document)
        
        # Исправляем "висячие" предлоги и союзы
        self._fix_hanging_prepositions(document)

    def _fix_incorrect_hyphenation(self, document):
        """
        Исправляет неправильные переносы в тексте
        """
        # Список запрещенных переносов (слова, которые не должны переноситься)
        forbidden_hyphen_words = [
            r'\bи\b', r'\bа\b', r'\bв\b', r'\bс\b', r'\bк\b', r'\bу\b', r'\bо\b',  # Предлоги из 1 буквы
            r'\bна\b', r'\bот\b', r'\bдо\b', r'\bза\b', r'\bиз\b', r'\bпо\b',  # Предлоги из 2 букв
            r'\bт\.д\b', r'\bт\.п\b', r'\bт\.е\b',  # Сокращения
            r'\bг\.\b', r'\bгг\.\b', r'\bвв\.\b', r'\bстр\.\b'  # Обозначения
        ]
        
        # Список правил для проверки и исправления неправильных переносов
        hyphen_rules = [
            (r'(\w)-\s+(\w)', r'\1\2'),  # Убираем переносы внутри слов
            (r'(\d+)\s*-\s*(\d+)', r'\1-\2'),  # Исправляем дефисы в числовых диапазонах
            (r'(\w+)\s*-\s*(\w+)', r'\1-\2')  # Исправляем дефисы между словами
        ]
        
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы
            if not paragraph.text.strip():
                continue
                
            # Проверяем наличие переноса запрещенных слов
            text = paragraph.text
            modified = False
            
            # Проверяем запрещенные переносы
            for pattern in forbidden_hyphen_words:
                # Ищем случаи, когда запрещенное слово находится в конце строки
                # (это можно определить только по XML, в тексте это не видно)
                # Поэтому мы проверяем наличие слова и в случае необходимости добавляем
                # неразрывный пробел перед ним
                if re.search(pattern, text):
                    # Заменяем обычный пробел перед запрещенным словом на неразрывный
                    for match in re.finditer(r'\s+(' + pattern[2:-2] + r')\b', text):
                        word = match.group(1)
                        text = text.replace(f" {word}", f"\u00A0{word}")  # \u00A0 - неразрывный пробел
                        modified = True
            
            # Применяем правила для исправления переносов
            for pattern, replacement in hyphen_rules:
                if re.search(pattern, text):
                    text = re.sub(pattern, replacement, text)
                    modified = True
            
            # Если были внесены изменения, обновляем текст параграфа
            if modified:
                paragraph.text = text
                
                # Восстанавливаем форматирование
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])

    def _fix_hanging_prepositions(self, document):
        """
        Исправляет "висячие" предлоги и союзы в конце строк, добавляя неразрывные пробелы
        """
        # Список предлогов и союзов, которые не должны находиться в конце строки
        hanging_words = [
            'а', 'и', 'в', 'с', 'к', 'у', 'о', 'на', 'от', 'до', 'за', 'из', 'по', 'под', 'над',
            'при', 'для', 'без', 'про', 'через', 'перед', 'после', 'кроме', 'вдоль', 'вместо',
            'около', 'возле', 'между', 'сквозь', 'среди', 'из-за', 'из-под', 'но', 'да', 'или',
            'либо', 'то', 'не', 'ни', 'бы', 'же', 'ведь', 'вот', 'что', 'как', 'так', 'уж'
        ]
        
        # Регулярное выражение для поиска предлогов и союзов в тексте
        # Ищем предлог/союз и пробел после него
        pattern = r'\b(' + '|'.join(hanging_words) + r')\s+'
        
        for paragraph in document.paragraphs:
            text = paragraph.text
            
            # Ищем все вхождения предлогов и союзов
            for match in re.finditer(pattern, text):
                # Получаем найденное слово и его позицию
                word = match.group(1)
                pos = match.start()
                
                # Заменяем обычный пробел после предлога на неразрывный
                text = text[:match.end()-1] + '\u00A0' + text[match.end():]
                
            # Если текст изменился, обновляем параграф
            if text != paragraph.text:
                paragraph.text = text
                
                # Восстанавливаем форматирование
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])

    def _correct_cross_references(self, document):
        """
        Исправляет перекрестные ссылки в документе
        """
        # Словарь для хранения номеров рисунков, таблиц и формул
        reference_dict = {
            'рисунок': {},  # номер: заголовок
            'таблица': {},  # номер: заголовок
            'формула': {},  # номер: текст
            'раздел': {},   # номер: заголовок
            'приложение': {}  # буква: заголовок
        }
        
        # Первый проход - собираем информацию о номерах элементов
        for i, paragraph in enumerate(document.paragraphs):
            text = paragraph.text.strip()
            
            # Поиск рисунков
            if re.match(r'^рисунок\s+\d+', text.lower()) or re.match(r'^рис\.\s*\d+', text.lower()):
                match = re.search(r'(?:рисунок|рис\.)\s*(\d+)', text.lower())
                if match:
                    figure_num = match.group(1)
                    title = text[match.end():].strip()
                    if title.startswith('–') or title.startswith('-') or title.startswith('—'):
                        title = title[1:].strip()
                    reference_dict['рисунок'][figure_num] = title
            
            # Поиск таблиц
            elif re.match(r'^таблица\s+\d+', text.lower()):
                match = re.search(r'таблица\s+(\d+)', text.lower())
                if match:
                    table_num = match.group(1)
                    title = text[match.end():].strip()
                    if title.startswith('–') or title.startswith('-') or title.startswith('—'):
                        title = title[1:].strip()
                    reference_dict['таблица'][table_num] = title
            
            # Поиск формул с номерами
            elif '(' in text and ')' in text and len(text.strip()) < 50:  # Предположительно формула
                match = re.search(r'\((\d+(?:\.\d+)?)\)', text)
                if match:
                    formula_num = match.group(1)
                    reference_dict['формула'][formula_num] = text.replace(match.group(0), '').strip()
            
            # Поиск заголовков разделов
            elif paragraph.style.name.startswith('Heading'):
                match = re.match(r'^(\d+(?:\.\d+)*)\s+(.+)', text)
                if match:
                    section_num = match.group(1)
                    title = match.group(2)
                    reference_dict['раздел'][section_num] = title
            
            # Поиск приложений
            elif re.match(r'^приложение\s+[А-Я]', text.upper()):
                match = re.search(r'приложение\s+([А-Я])', text.upper())
                if match:
                    appendix_letter = match.group(1)
                    title = text[match.end():].strip()
                    reference_dict['приложение'][appendix_letter] = title
        
        # Второй проход - исправляем ссылки в тексте
        for paragraph in document.paragraphs:
            text = paragraph.text
            modified = False
            
            # Ищем ссылки на рисунки
            for match in re.finditer(r'(?<!\w)(рис\.|рисунк[а-я]*)\s*\.?\s*(\d+)(?!\d)', text, re.IGNORECASE):
                prefix, num = match.groups()
                if num in reference_dict['рисунок']:
                    correct_ref = f"рисунок {num}"
                    if text[match.start()-1:match.start()].isalpha():
                        correct_ref = f" {correct_ref}"
                    text = text[:match.start()] + correct_ref + text[match.end():]
                    modified = True
            
            # Ищем ссылки на таблицы
            for match in re.finditer(r'(?<!\w)(табл\.|таблиц[а-я]*)\s*\.?\s*(\d+)(?!\d)', text, re.IGNORECASE):
                prefix, num = match.groups()
                if num in reference_dict['таблица']:
                    correct_ref = f"таблица {num}"
                    if text[match.start()-1:match.start()].isalpha():
                        correct_ref = f" {correct_ref}"
                    text = text[:match.start()] + correct_ref + text[match.end():]
                    modified = True
            
            # Ищем ссылки на формулы
            for match in re.finditer(r'(?<!\w)(формул[а-я]*|выражени[а-я]*)\s*\.?\s*(\d+(?:\.\d+)?)(?!\d)', text, re.IGNORECASE):
                prefix, num = match.groups()
                if num in reference_dict['формула']:
                    correct_ref = f"формула ({num})"
                    if text[match.start()-1:match.start()].isalpha():
                        correct_ref = f" {correct_ref}"
                    text = text[:match.start()] + correct_ref + text[match.end():]
                    modified = True
            
            # Ищем ссылки на разделы
            for match in re.finditer(r'(?<!\w)(раздел[а-я]*|глав[а-я]*)\s*\.?\s*(\d+(?:\.\d+)?)(?!\d)', text, re.IGNORECASE):
                prefix, num = match.groups()
                if num in reference_dict['раздел']:
                    correct_ref = f"раздел {num}"
                    if text[match.start()-1:match.start()].isalpha():
                        correct_ref = f" {correct_ref}"
                    text = text[:match.start()] + correct_ref + text[match.end():]
                    modified = True
            
            # Ищем ссылки на приложения
            for match in re.finditer(r'(?<!\w)(приложени[а-я]*)\s*\.?\s*([А-Я])(?![А-Я])', text, re.IGNORECASE):
                prefix, letter = match.groups()
                if letter in reference_dict['приложение']:
                    correct_ref = f"приложение {letter}"
                    if text[match.start()-1:match.start()].isalpha():
                        correct_ref = f" {correct_ref}"
                    text = text[:match.start()] + correct_ref + text[match.end():]
                    modified = True
            
            # Обновляем текст параграфа, если были внесены изменения
            if modified:
                paragraph.text = text
                
                # Восстанавливаем форматирование после изменения текста
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])

    def _correct_abbreviations_list(self, document):
        """
        Исправляет список сокращений и условных обозначений
        """
        # Ищем раздел со списком сокращений
        abbreviations_started = False
        abbreviations_paragraphs = []
        
        # Паттерны для идентификации раздела с сокращениями
        abbr_title_patterns = [
            r'список\s+сокращений',
            r'перечень\s+сокращений',
            r'список\s+условных\s+обозначений',
            r'условные\s+обозначения',
            r'принятые\s+сокращения'
        ]
        
        for i, paragraph in enumerate(document.paragraphs):
            text = paragraph.text.strip().lower()
            
            # Определяем начало списка сокращений
            if not abbreviations_started:
                if any(re.search(pattern, text) for pattern in abbr_title_patterns):
                    abbreviations_started = True
                    # Форматируем заголовок списка сокращений
                    paragraph.style = document.styles['Heading 1']
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                    paragraph.paragraph_format.first_line_indent = Cm(0)
                    paragraph.paragraph_format.space_after = Pt(12)
                    paragraph.paragraph_format.space_before = Pt(12)
                    
                    # Убираем точку в конце заголовка, если она есть
                    if paragraph.text.strip().endswith('.'):
                        paragraph.text = paragraph.text.strip().rstrip('.')
                    
                    # Приводим к верхнему регистру
                    paragraph.text = paragraph.text.upper()
                    continue
            
            # Собираем параграфы списка сокращений
            if abbreviations_started:
                # Если встретили новый заголовок, значит список сокращений закончился
                if paragraph.style.name.startswith('Heading'):
                    break
                
                # Добавляем параграф в список для дальнейшей обработки
                abbreviations_paragraphs.append((i, paragraph))
        
        # Если нашли список сокращений, форматируем его
        if abbreviations_paragraphs:
            # Создаем словарь сокращений для проверки и исправления
            abbreviations_dict = {}
            
            # Форматируем каждый элемент списка сокращений
            for i, paragraph in abbreviations_paragraphs:
                # Пропускаем пустые параграфы
                if not paragraph.text.strip():
                    continue
                
                text = paragraph.text.strip()
                
                # Определяем формат элемента списка сокращений (обычно это "Сокращение – расшифровка")
                parts = re.split(r'\s+[-–—]\s+', text, 1)
                
                if len(parts) == 2:
                    abbr, description = parts
                    abbreviations_dict[abbr.strip()] = description.strip()
                    
                    # Форматируем элемент списка
                    paragraph.paragraph_format.first_line_indent = Cm(0)
                    paragraph.paragraph_format.left_indent = Cm(0)
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                    
                    # Проверяем, есть ли точка в конце расшифровки
                    if not description.strip().endswith('.') and not description.strip().endswith(':'):
                        # Добавляем точку в конце
                        paragraph.text = f"{abbr.strip()} – {description.strip()}."
                
                # Восстанавливаем форматирование после изменения текста
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])
            
            # Проверяем использование сокращений в тексте
            self._check_abbreviations_usage(document, abbreviations_dict)
            
            return True
        
        return False
    
    def _check_abbreviations_usage(self, document, abbreviations_dict):
        """
        Проверяет правильность использования сокращений в тексте
        
        Args:
            document: Документ Word
            abbreviations_dict: Словарь сокращений (сокращение: расшифровка)
        """
        if not abbreviations_dict:
            return
        
        # Находим первое использование каждого сокращения и проверяем, 
        # было ли оно расшифровано при первом употреблении
        abbreviation_first_use = {}
        
        for i, paragraph in enumerate(document.paragraphs):
            text = paragraph.text.strip()
            
            # Ищем сокращения в тексте
            for abbr in abbreviations_dict.keys():
                # Используем регулярное выражение для поиска сокращения как отдельного слова
                pattern = r'\b' + re.escape(abbr) + r'\b'
                match = re.search(pattern, text)
                
                if match and abbr not in abbreviation_first_use:
                    # Сохраняем информацию о первом использовании
                    abbreviation_first_use[abbr] = (i, paragraph)
                    
                    # Проверяем, есть ли расшифровка в этом же параграфе
                    description = abbreviations_dict[abbr]
                    if description.lower() not in text.lower() and f"({abbr})" not in text:
                        # Если расшифровки нет, добавляем ее в скобках после первого употребления
                        text_before = text[:match.end()]
                        text_after = text[match.end():]
                        new_text = f"{text_before} ({description}){text_after}"
                        paragraph.text = new_text