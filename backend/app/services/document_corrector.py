import os
import docx
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT, WD_LINE_SPACING
from docx.oxml.shared import OxmlElement, qn
from docx.oxml.ns import qn
from docx.oxml import parse_xml
import re
import datetime

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
        # Загружаем документ
        document = docx.Document(file_path)
        
        # Определяем путь для сохранения исправленного файла
        if out_path is None:
            # Создаем путь для сохранения исправленного файла
            base_name, ext = os.path.splitext(file_path)
            corrected_file_path = f"{base_name}_corrected{ext}"
        else:
            corrected_file_path = out_path
        
        # Если список ошибок не предоставлен, исправляем все, что можем
        if errors is None:
            self._correct_all(document)
        else:
            # Исправляем только указанные ошибки
            self._correct_specific_errors(document, errors)
        
        # Создаем директорию для файла, если её нет
        os.makedirs(os.path.dirname(os.path.abspath(corrected_file_path)), exist_ok=True)
        
        # Сохраняем исправленный документ
        document.save(corrected_file_path)
        return corrected_file_path
    
    def _correct_all(self, document):
        """
        Исправляет все типичные ошибки в документе
        """
        # Исправляем титульный лист
        self._correct_title_page(document)
        # Исправляем шрифт для всего документа
        self._correct_font(document)
        
        # Исправляем поля страницы
        self._correct_margins(document)
        
        # Исправляем межстрочный интервал
        self._correct_line_spacing(document)
        
        # Исправляем отступы первой строки
        self._correct_first_line_indent(document)
        
        # Исправляем заголовки (точки в конце, регистр)
        self._correct_headings(document)
        
        # Исправляем подписи к рисункам (точки в конце)
        self._correct_images(document)
        
        # Исправляем выравнивание параграфов
        self._correct_paragraph_alignment(document)
        
        # Исправляем оформление таблиц
        self._correct_tables(document)
        
        # Исправляем нумерацию страниц
        self._correct_page_numbers(document)
        
        # Исправляем оформление списков
        self._correct_lists(document)
    
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
            self._correct_headings(document)
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
                # Заголовки обрабатываем отдельно в _correct_headings
                if not is_heading:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])
    
    def _correct_margins(self, document):
        """
        Исправляет поля страницы
        """
        for section in document.sections:
            section.top_margin = Cm(self.standard_rules['margins']['top'])
            section.bottom_margin = Cm(self.standard_rules['margins']['bottom'])
            section.left_margin = Cm(self.standard_rules['margins']['left'])
            section.right_margin = Cm(self.standard_rules['margins']['right'])
    
    def _correct_line_spacing(self, document):
        """
        Исправляет межстрочный интервал
        """
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы и заголовки
            if not paragraph.text.strip() or paragraph.style.name.startswith('Heading'):
                continue
                
            paragraph.paragraph_format.line_spacing = self.standard_rules['line_spacing']
            paragraph.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    
    def _correct_first_line_indent(self, document):
        """
        Исправляет отступы первой строки
        """
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы и заголовки
            if not paragraph.text.strip() or paragraph.style.name.startswith('Heading'):
                continue
                
            paragraph.paragraph_format.first_line_indent = self.standard_rules['first_line_indent']
    
    def _correct_headings(self, document):
        """
        Исправляет форматирование заголовков
        """
        for paragraph in document.paragraphs:
            if paragraph.style.name.startswith('Heading'):
                heading_level = int(paragraph.style.name.replace('Heading ', ''))
                
                # Исправляем точку в конце заголовка
                if paragraph.text.strip().endswith('.'):
                    paragraph.text = paragraph.text.strip().rstrip('.')
                
                # Исправляем регистр первой буквы заголовка
                if paragraph.text and not paragraph.text[0].isupper():
                    paragraph.text = paragraph.text[0].upper() + paragraph.text[1:]
                
                # Применяем форматирование в зависимости от уровня заголовка
                if heading_level == 1:
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                    
                    # Устанавливаем размер шрифта и жирность
                    for run in paragraph.runs:
                        run.font.size = Pt(self.standard_rules['headings']['h1']['font_size'])
                        run.font.bold = True
                        run.font.name = self.standard_rules['font']['name']
                    
                elif heading_level == 2:
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                    
                    # Устанавливаем размер шрифта и жирность
                    for run in paragraph.runs:
                        run.font.size = Pt(self.standard_rules['headings']['h2']['font_size'])
                        run.font.bold = True
                        run.font.name = self.standard_rules['font']['name']
                
                # Сбрасываем отступы для заголовков
                paragraph.paragraph_format.first_line_indent = Cm(0)
                paragraph.paragraph_format.left_indent = Cm(0)
    
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
        for paragraph in document.paragraphs:
            # Пропускаем пустые параграфы, заголовки и подписи к рисункам
            if not paragraph.text.strip() or paragraph.style.name.startswith('Heading'):
                continue
                
            # Пропускаем подписи к рисункам (которые должны быть выровнены по центру)
            if paragraph.text.strip().lower().startswith(('рисунок', 'рис.')):
                continue
                
            # Пропускаем заголовки таблиц (которые должны быть выровнены влево)
            if paragraph.text.strip().lower().startswith('таблица'):
                continue
                
            # Выравниваем основной текст по ширине
            paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
    
    def _correct_tables(self, document):
        """
        Исправляет оформление таблиц
        """
        for table in document.tables:
            # Устанавливаем единый шрифт для всей таблицы
            for row in table.rows:
                for cell in row.cells:
                    for paragraph in cell.paragraphs:
                        for run in paragraph.runs:
                            run.font.name = self.standard_rules['font']['name']
                            run.font.size = Pt(self.standard_rules['font']['size'])
        
        # Исправляем заголовки таблиц
        for paragraph in document.paragraphs:
            if paragraph.text.strip().lower().startswith('таблица'):
                # Форматирование заголовка таблицы
                paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                paragraph.paragraph_format.space_after = Pt(6)
                paragraph.paragraph_format.space_before = Pt(12)
                paragraph.paragraph_format.first_line_indent = Cm(0)
    
    def _correct_page_numbers(self, document):
        """
        Исправляет нумерацию страниц (добавляет нумерацию в нижний колонтитул)
        """
        # Для каждой секции документа
        for section in document.sections:
            # Получаем доступ к нижнему колонтитулу
            footer = section.footer
            
            # Очищаем содержимое нижнего колонтитула, удаляя все параграфы кроме первого
            # (удаляем все существующие параграфы)
            for i in range(len(footer.paragraphs) - 1, 0, -1):
                p = footer.paragraphs[i]
                p._element.getparent().remove(p._element)
            
            # Если у нас есть хотя бы один параграф, используем его
            # В противном случае создаем новый
            if footer.paragraphs:
                footer_paragraph = footer.paragraphs[0]
                # Очищаем текст параграфа
                for run in footer_paragraph.runs:
                    run._element.getparent().remove(run._element)
            else:
                footer_paragraph = footer.add_paragraph()
                
            # Настраиваем форматирование параграфа
            footer_paragraph.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
            footer_paragraph.paragraph_format.space_before = Pt(0)
            footer_paragraph.paragraph_format.space_after = Pt(0)
            
            # Добавляем номер страницы через поле
            run = footer_paragraph.add_run()
            self._add_page_number(run)
            
            # Устанавливаем шрифт для номера страницы
            run.font.name = self.standard_rules['font']['name']
            run.font.size = Pt(12)
        
        # Устанавливаем титульный лист без номера (первая страница)
        self._suppress_first_page_number(document)
    
    def _add_page_number(self, run):
        """
        Добавляет номер страницы через поле
        """
        # Создаем элементы для номера страницы с правильным пространством имен
        fldChar1 = OxmlElement('w:fldChar')
        fldChar1.set(qn('w:fldCharType'), 'begin')
        
        instrText = OxmlElement('w:instrText')
        instrText.set(qn('xml:space'), 'preserve')
        instrText.text = "PAGE"
        
        fldChar2 = OxmlElement('w:fldChar')
        fldChar2.set(qn('w:fldCharType'), 'end')
        
        # Добавляем созданные элементы в параграф
        run._element.append(fldChar1)
        run._element.append(instrText)
        run._element.append(fldChar2)
    
    def _suppress_first_page_number(self, document):
        """
        Убирает номер страницы с первой страницы (титульный лист)
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
                    # Определяем правильную позицию для вставки
                    # Обычно titlePg следует за элементами type, pgSz, pgMar
                    section_props.append(title_pg)
                    
        except Exception as e:
            print(f"Предупреждение: Не удалось отключить номер страницы на первой странице: {str(e)}")
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
                
                # Шрифт для элементов списка
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])
    
    def _correct_title_page(self, document):
        """
        Исправляет титульный лист: порядок блоков, регистр, интервалы, шрифт, размер, выравнивание, отсутствие абзацного отступа
        """
        TITLE_PAGE_TEMPLATE = [
            {'type': 'university', 'keywords': ['федеральное государственное', 'университет'], 'case': 'upper', 'min_lines_after': 1},
            {'type': 'faculty', 'keywords': ['факультет'], 'case': 'upper', 'min_lines_after': 0},
            {'type': 'department', 'keywords': ['кафедра'], 'case': 'upper', 'min_lines_after': 2},
            {'type': 'work_type', 'keywords': ['курсовая работа', 'отчет', 'дисциплина'], 'case': 'upper', 'min_lines_after': 1},
            {'type': 'topic', 'keywords': ['тема'], 'case': 'title', 'min_lines_after': 2},
            {'type': 'student', 'keywords': ['студент'], 'case': 'title', 'min_lines_after': 0},
            {'type': 'supervisor', 'keywords': ['руководитель'], 'case': 'title', 'min_lines_after': 2},
            {'type': 'city', 'keywords': ['город'], 'case': 'title', 'min_lines_after': 0},
            {'type': 'year', 'keywords': ['год'], 'case': 'title', 'min_lines_after': 0},
        ]
        current_year = str(datetime.datetime.now().year)
        # Собираем все параграфы титульного листа (до первого Heading 1 или до "СОДЕРЖАНИЕ"/"ВВЕДЕНИЕ")
        title_page_paragraphs = []
        for i, para in enumerate(document.paragraphs):
            text = para.text.strip().lower()
            if para.style.name.startswith('Heading') and para.style.name == 'Heading 1':
                break
            if any(word in text for word in ['содержание', 'введение']):
                break
            title_page_paragraphs.append((i, para))
        # Сопоставляем блоки шаблона с найденными параграфами
        used = set()
        new_title_page = []
        for block in TITLE_PAGE_TEMPLATE:
            found = False
            for idx, (i, para) in enumerate(title_page_paragraphs):
                if idx in used:
                    continue
                text = para.text.strip().lower()
                if any(kw in text for kw in block['keywords']):
                    # Исправляем регистр
                    if block['case'] == 'upper':
                        para.text = para.text.upper()
                    elif block['case'] == 'title':
                        para.text = para.text.capitalize()
                    # Исправляем шрифт и размер
                    for run in para.runs:
                        run.font.name = self.standard_rules['font']['name']
                        run.font.size = Pt(self.standard_rules['font']['size'])
                    # Исправляем выравнивание
                    para.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                    # Убираем абзацный отступ
                    para.paragraph_format.first_line_indent = Cm(0)
                    new_title_page.append((i, para))
                    used.add(idx)
                    found = True
                    break
            if not found:
                # Интеллектуальные заглушки
                if block['type'] == 'topic':
                    dummy_text = 'ТЕМА: [указать тему]'
                elif block['type'] == 'student':
                    dummy_text = 'Студент: [ФИО]'
                elif block['type'] == 'supervisor':
                    dummy_text = 'Руководитель: [ФИО]'
                elif block['type'] == 'city':
                    dummy_text = 'Город: [указать город]'
                elif block['type'] == 'year':
                    dummy_text = current_year
                else:
                    dummy_text = block['keywords'][0].upper() if block['case'] == 'upper' else block['keywords'][0].capitalize()
                para = document.add_paragraph(dummy_text)
                para.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                para.paragraph_format.first_line_indent = Cm(0)
                for run in para.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])
                new_title_page.append((None, para))
        # Удаляем старые параграфы титульного листа
        for i, para in reversed(title_page_paragraphs):
            p = para._element
            p.getparent().remove(p)
        # Вставляем новые параграфы титульного листа в начало документа
        body = document._element.body
        insert_pos = 0
        for _, para in new_title_page:
            body.insert(insert_pos, para._element)
            insert_pos += 1
        # Добавляем интервалы (пустые строки) после блоков, если требуется
        for idx, block in enumerate(TITLE_PAGE_TEMPLATE):
            min_lines = block['min_lines_after']
            if min_lines > 0:
                for _ in range(min_lines):
                    para = document.add_paragraph("")
                    para.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                    para.paragraph_format.first_line_indent = Cm(0)
                    body.insert(idx + 1, para._element) 