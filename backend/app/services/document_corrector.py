import os
import re
import datetime
import tempfile
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT, WD_LINE_SPACING
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn
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
                
                # Шрифт для элементов списка
                for run in paragraph.runs:
                    run.font.name = self.standard_rules['font']['name']
                    run.font.size = Pt(self.standard_rules['font']['size'])
    
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