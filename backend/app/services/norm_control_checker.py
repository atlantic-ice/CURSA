import re
from docx.shared import Pt, Cm
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

# === NORM_RULES: 30 нормоконтрольных правил ===
NORM_RULES = [
    {"id": 1, "name": "Наименование темы работы", "description": "Тема соответствует утвержденной приказом.", "checker": "_check_topic_title"},
    {"id": 2, "name": "Размер шрифта", "description": "Размер основного шрифта — 14.", "checker": "_check_font"},
    {"id": 3, "name": "Название шрифта", "description": "Times New Roman, обычный, черный.", "checker": "_check_font"},
    {"id": 4, "name": "Межстрочный интервал", "description": "Межстрочный интервал 1,5.", "checker": "_check_line_spacing"},
    {"id": 5, "name": "Абзацный отступ (мм)", "description": "Абзацный отступ 1,25 см.", "checker": "_check_paragraphs"},
    {"id": 6, "name": "Поля (мм)", "description": "Левое 30 мм, правое 10-15 мм, верх/низ 20 мм.", "checker": "_check_margins"},
    {"id": 7, "name": "Акценты", "description": "Только курсив, размер, жирность (кроме заголовков).", "checker": "_check_accents"},
    {"id": 8, "name": "Нумерация страниц", "description": "Сквозная, вверху справа, шрифт 12 TNR, не на титуле/оглавлении.", "checker": "_check_page_numbers"},
    {"id": 9, "name": "Выравнивание", "description": "Основной текст — по ширине, автоперенос.", "checker": "_check_paragraphs"},
    {"id": 10, "name": "Объем работы", "description": "40-90 стр. (без приложений).", "checker": "_check_page_count"},
    {"id": 11, "name": "Интервалы", "description": "Между заголовками и текстом — 2 одинарных.", "checker": "_check_heading_spacing"},
    {"id": 12, "name": "Структурные части", "description": "Каждая с новой страницы.", "checker": "_check_section_start"},
    {"id": 13, "name": "Заголовки структурных элементов", "description": "По центру, ЗАГЛАВНЫМИ, без точки.", "checker": "_check_headings"},
    {"id": 14, "name": "Глава", "description": "Заканчивается выводами, выравнивание по центру, интервалы.", "checker": "_check_chapter_conclusion"},
    {"id": 15, "name": "Оформление заголовков (разделы/подразделы)", "description": "Разделы — ЗАГЛАВНЫМИ, по ширине, с отступом; подразделы — с прописной, по ширине, без точки.", "checker": "_check_headings"},
    {"id": 16, "name": "Оформление заголовков (общие требования)", "description": "Без переносов, без подчеркивания, без разрядки.", "checker": "_check_headings"},
    {"id": 17, "name": "Оформление приложений", "description": "Отдельный лист 'ПРИЛОЖЕНИЯ', далее 'Приложение А', далее название.", "checker": "_check_appendices"},
    {"id": 18, "name": "Числительные количественные", "description": "Однозначные — словами, многозначные — цифрами, в начале предложения — словами.", "checker": "_check_numerals"},
    {"id": 19, "name": "Порядковые числительные", "description": "С падежными окончаниями.", "checker": "_check_ordinals"},
    {"id": 20, "name": "Фамилии", "description": "В тексте: А.С. Пушкин; в списке: Пушкин А.С.; не отделять инициалы.", "checker": "_check_surnames"},
    {"id": 21, "name": "Оглавление", "description": "Все разделы, без абзацного отступа.", "checker": "_check_toc"},
    {"id": 22, "name": "Титульный лист", "description": "Только черной ручкой, дата — индивидуально.", "checker": "_check_title_page"},
    {"id": 23, "name": "Перечисления", "description": "С абзацного отступа, простые — запятая, сложные — точка с запятой, подуровни смещены.", "checker": "_check_lists"},
    {"id": 24, "name": "Оформление таблиц", "description": "Название над таблицей, по левому краю, без абзаца, 1,5 интервала до/после, высота строк ≥8 мм.", "checker": "_check_images_and_tables"},
    {"id": 25, "name": "Оформление иллюстраций", "description": "Название под рисунком, по центру, без абзаца, 1,5 интервала до/после.", "checker": "_check_images_and_tables"},
    {"id": 26, "name": "Ссылки на иллюстрации, таблицы, формулы", "description": "Обязательны.", "checker": "_check_references"},
    {"id": 27, "name": "Нумерация таблиц, формул, иллюстраций", "description": "Сквозная или по разделам, в приложениях — отдельная.", "checker": "_check_numbering"},
    {"id": 28, "name": "Последовательность частей", "description": "Титул, задание, реферат, глоссарий, оглавление, введение, основная, заключение, источники, приложения.", "checker": "_check_document_structure"},
    {"id": 29, "name": "Список использованных источников", "description": "≥35 (пед), ≥20 (ИС, МО), алфавит/хронология/тематика, URL, дата обращения.", "checker": "_check_bibliography"},
    {"id": 30, "name": "Библиографические ссылки", "description": "[5], [1, с. 28] и т.д.", "checker": "_check_bibliography_references"},
]

class NormControlChecker:
    """
    Класс для проверки документа на соответствие требованиям нормоконтроля
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
            },
            # Добавляем обязательные разделы для курсовой работы
            'required_sections': [
                'введение', 
                'заключение', 
                'список литературы', 
                'содержание',
                'цель',
                'задачи'
            ]
        }
        
        # Улучшенные паттерны для проверки литературы
        self.bibliography_patterns = {
            'one_author': r'^[А-Я][а-я]+,\s[А-Я]\.\s?[А-Я]\.\s.*\s[–—-]\s.*,\s\d{4}\.\s[–—-]\s\d+\sс\.?$',
            '2_3_authors': r'^[А-Я][а-я]+,\s[А-Я]\.\s?[А-Я]\.,\s[А-Я][а-я]+,\s[А-Я]\.\s?[А-Я]\..*\s[–—-]\s.*,\s\d{4}\.\s[–—-]\s\d+\sс\.?$',
            '4_authors': r'^[А-Я][а-я]+,\s[А-Я]\.\s?[А-Я]\.,\s[А-Я][а-я]+,\s[А-Я]\.\s?[А-Я]\.,\s[А-Я][а-я]+,\s[А-Я]\.\s?[А-Я]\.,\s[А-Я][а-я]+,\s[А-Я]\.\s?[А-Я]\..*$',
            '5_plus_authors': r'^.*\[и\sдр\.\].*$',
            'web_resource': r'^.*\s?\[Электронный\sресурс\]\s?.*URL:\s.+\s\(дата\sобращения:?\s\d{2}\.\d{2}\.\d{4}\)\.?$',
            'law': r'^.*(закон|постановление|указ|кодекс).*от\s\d{2}\.\d{2}\.\d{4}.*№.*$',
            'gost': r'^ГОСТ\s.*[–—-]\s\d{4}.*$'
        }
        
        # Типовые сообщения об ошибках
        self.bibliography_error_messages = {
            'one_author': "Неправильное оформление источника с одним автором. Должно быть: 'Фамилия, И.О. Название – Город, Год. – Количество страниц с.'",
            '2_3_authors': "Неправильное оформление источника с 2-3 авторами. Должно быть: 'Фамилия, И.О., Фамилия, И.О. Название – Город, Год. – Количество страниц с.'",
            '4_authors': "Неправильное оформление источника с 4 авторами. Должно содержать четыре автора, разделенных запятыми.",
            '5_plus_authors': "Неправильное оформление источника с 5 и более авторами. Должно содержать '[и др.]'.",
            'web_resource': "Неправильное оформление интернет-ресурса. Должно содержать '[Электронный ресурс]', 'URL:' и '(дата обращения: ДД.ММ.ГГГГ)'.",
            'law': "Неправильное оформление законодательного акта. Должно содержать тип документа, дату и номер.",
            'gost': "Неправильное оформление ГОСТа. Должно быть: 'ГОСТ Номер–Год...'."
        }
    
    def check_document(self, document_data):
        """
        Проверяет документ на соответствие требованиям нормоконтроля
        
        Args:
            document_data: Структурированные данные документа
            
        Returns:
            dict: Результаты проверки с выявленными несоответствиями
        """
        results = []
        for rule in NORM_RULES:
            check_func = getattr(self, rule["checker"], None)
            if check_func is not None:
                result = check_func(document_data)
            else:
                result = [{
                    'type': 'not_implemented',
                    'severity': 'info',
                    'location': 'Документ',
                    'description': f'Проверка для нормы "{rule["name"]}" ещё не реализована.',
                    'auto_fixable': False
                }]
            results.append({
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "description": rule["description"],
                "issues": result
            })
        
        # Считаем общее количество проблем
        all_issues = []
        for category, issues in results.items():
            if issues:
                all_issues.extend(issues)
                
        results['total_issues_count'] = len(all_issues)
        results['issues'] = all_issues
        
        # Подготовим статистику по категориям и серьезности проблем
        results['statistics'] = self._calculate_statistics(results)
        
        return results
    
    def _check_font(self, document_data):
        """
        Проверяет соответствие шрифта требованиям
        """
        issues = []
        
        # Проверяем наличие ключа 'paragraphs' в document_data
        if not document_data or 'paragraphs' not in document_data:
            issues.append({
                'type': 'font_missing_data',
                'severity': 'high',
                'location': "Документ",
                'description': "Невозможно проверить шрифт: данные о параграфах отсутствуют.",
                'auto_fixable': False
            })
            return issues
        
        # Проверяем основной текст документа
        for para in document_data['paragraphs']:
            # Пропускаем заголовки и параграфы без текста
            if not para or 'style' not in para or para.get('style', '').startswith('Heading'):
                continue
                
            font = para.get('font', {})
            if not font:
                continue
            
            # Проверяем название шрифта
            if font.get('name') and font.get('name') != self.standard_rules['font']['name']:
                issues.append({
                    'type': 'font_name',
                    'severity': 'high',
                    'location': f"Параграф {para['index'] + 1}",
                    'description': f"Неверный шрифт: {font.get('name')}. Должен быть {self.standard_rules['font']['name']}.",
                    'auto_fixable': True
                })
                
            # Проверяем размер шрифта
            if font.get('size') and font.get('size') != self.standard_rules['font']['size']:
                issues.append({
                    'type': 'font_size',
                    'severity': 'high',
                    'location': f"Параграф {para['index'] + 1}",
                    'description': f"Неверный размер шрифта: {font.get('size')}. Должен быть {self.standard_rules['font']['size']}.",
                    'auto_fixable': True
                })
                
            # Проверяем согласованность форматирования
            if font.get('consistent_formatting') is False:
                issues.append({
                    'type': 'font_consistency',
                    'severity': 'medium',
                    'location': f"Параграф {para['index'] + 1}",
                    'description': "Непоследовательное форматирование текста внутри параграфа. Текст должен иметь единое форматирование.",
                    'auto_fixable': True
                })
                
        return issues
    
    def _check_margins(self, document_data):
        """
        Проверяет соответствие полей страницы требованиям
        """
        issues = []
        page_setup = document_data.get('page_setup', {})
        
        # Берем поля из первого раздела, если он есть
        section_data = None
        for key in page_setup:
            if key.startswith('section_'):
                section_data = page_setup[key]
                break
                
        if not section_data:
            return issues
            
        # Проверяем левое поле
        left_margin = section_data.get('left_margin')
        if left_margin and abs(left_margin - self.standard_rules['margins']['left']) > 0.1:
            issues.append({
                'type': 'left_margin',
                'severity': 'medium',
                'location': "Настройки страницы",
                'description': f"Неверное левое поле: {left_margin} см. Должно быть {self.standard_rules['margins']['left']} см.",
                'auto_fixable': True
            })
            
        # Проверяем правое поле
        right_margin = section_data.get('right_margin')
        if right_margin and abs(right_margin - self.standard_rules['margins']['right']) > 0.1:
            issues.append({
                'type': 'right_margin',
                'severity': 'medium',
                'location': "Настройки страницы",
                'description': f"Неверное правое поле: {right_margin} см. Должно быть {self.standard_rules['margins']['right']} см.",
                'auto_fixable': True
            })
            
        # Проверяем верхнее поле
        top_margin = section_data.get('top_margin')
        if top_margin and abs(top_margin - self.standard_rules['margins']['top']) > 0.1:
            issues.append({
                'type': 'top_margin',
                'severity': 'medium',
                'location': "Настройки страницы",
                'description': f"Неверное верхнее поле: {top_margin} см. Должно быть {self.standard_rules['margins']['top']} см.",
                'auto_fixable': True
            })
            
        # Проверяем нижнее поле
        bottom_margin = section_data.get('bottom_margin')
        if bottom_margin and abs(bottom_margin - self.standard_rules['margins']['bottom']) > 0.1:
            issues.append({
                'type': 'bottom_margin',
                'severity': 'medium',
                'location': "Настройки страницы",
                'description': f"Неверное нижнее поле: {bottom_margin} см. Должно быть {self.standard_rules['margins']['bottom']} см.",
                'auto_fixable': True
            })
            
        return issues
    
    def _check_line_spacing(self, document_data):
        """
        Проверяет соответствие межстрочного интервала требованиям
        """
        issues = []
        
        for para in document_data['paragraphs']:
            # Пропускаем заголовки
            if para.get('style', '').startswith('Heading'):
                continue
                
            line_spacing = para.get('line_spacing')
            
            # Если информация о межстрочном интервале доступна
            if line_spacing and line_spacing != self.standard_rules['line_spacing']:
                issues.append({
                    'type': 'line_spacing',
                    'severity': 'medium',
                    'location': f"Параграф {para['index'] + 1}",
                    'description': f"Неверный межстрочный интервал: {line_spacing}. Должен быть {self.standard_rules['line_spacing']}.",
                    'auto_fixable': True
                })
                
        return issues
    
    def _check_paragraphs(self, document_data):
        """
        Проверяет форматирование параграфов (отступы первой строки и т.д.)
        """
        issues = []
        
        for para in document_data['paragraphs']:
            # Пропускаем заголовки и параграфы, для которых нет данных о стилях
            if para.get('style', '').startswith('Heading') or not para.get('paragraph_format'):
                continue
                
            # Проверяем отступ первой строки
            paragraph_format = para.get('paragraph_format', {})
            first_line_indent = paragraph_format.get('first_line_indent')
            
            # Если отступ первой строки отличается от стандартного
            expected_indent = self.standard_rules['first_line_indent'].cm
            if first_line_indent is not None and abs(first_line_indent - expected_indent) > 0.05:
                issues.append({
                    'type': 'first_line_indent',
                    'severity': 'medium',
                    'location': f"Параграф {para['index'] + 1}",
                    'description': f"Неверный отступ первой строки: {first_line_indent} см. Должен быть {expected_indent} см.",
                    'auto_fixable': True
                })
                
            # Проверяем выравнивание текста (должно быть по ширине)
            alignment = paragraph_format.get('alignment')
            if alignment and alignment != WD_PARAGRAPH_ALIGNMENT.JUSTIFY:
                issues.append({
                    'type': 'paragraph_alignment',
                    'severity': 'low',
                    'location': f"Параграф {para['index'] + 1}",
                    'description': "Неверное выравнивание текста. Основной текст должен быть выровнен по ширине.",
                    'auto_fixable': True
                })
                
        return issues
    
    def _check_headings(self, document_data):
        """
        Проверяет соответствие заголовков требованиям
        """
        issues = []
        headings = document_data.get('headings', [])
        
        for heading in headings:
            # Проверяем точку в конце заголовка
            if heading.get('has_ending_dot'):
                issues.append({
                    'type': 'heading_dot',
                    'severity': 'medium',
                    'location': f"Заголовок {heading['index'] + 1}",
                    'description': "Заголовок не должен заканчиваться точкой.",
                    'auto_fixable': True
                })
            
            # Проверяем заголовок первого уровня
            if heading.get('level') == 1:
                # Проверка выравнивания заголовка первого уровня
                if heading.get('alignment') != WD_PARAGRAPH_ALIGNMENT.CENTER:
                    issues.append({
                        'type': 'heading_alignment',
                        'severity': 'medium',
                        'location': f"Заголовок {heading['index'] + 1}",
                        'description': "Заголовок первого уровня должен быть выровнен по центру.",
                        'auto_fixable': True
                    })
                
                # Проверка размера шрифта для заголовка первого уровня
                font_size = heading.get('font', {}).get('size')
                expected_size = self.standard_rules['headings']['h1']['font_size']
                if font_size and abs(font_size - expected_size) > 0.1:
                    issues.append({
                        'type': 'heading_font_size',
                        'severity': 'low',
                        'location': f"Заголовок {heading['index'] + 1}",
                        'description': f"Размер шрифта заголовка первого уровня должен быть {expected_size} пт.",
                        'auto_fixable': True
                    })
                
                # Проверка жирности для заголовка первого уровня
                bold = heading.get('font', {}).get('bold')
                if bold is False:  # Только если явно не жирный
                    issues.append({
                        'type': 'heading_bold',
                        'severity': 'low',
                        'location': f"Заголовок {heading['index'] + 1}",
                        'description': "Заголовок первого уровня должен быть выделен полужирным шрифтом.",
                        'auto_fixable': True
                    })
                
            # Проверяем заголовки второго уровня
            elif heading.get('level') == 2:
                # Проверка выравнивания заголовка второго уровня
                if heading.get('alignment') == WD_PARAGRAPH_ALIGNMENT.CENTER:
                    issues.append({
                        'type': 'heading_alignment',
                        'severity': 'low',
                        'location': f"Заголовок {heading['index'] + 1}",
                        'description': "Заголовок второго уровня не должен быть выровнен по центру.",
                        'auto_fixable': True
                    })
                    
                # Проверка жирности для заголовка второго уровня
                bold = heading.get('font', {}).get('bold')
                if bold is False:  # Только если явно не жирный
                    issues.append({
                        'type': 'heading_bold',
                        'severity': 'low',
                        'location': f"Заголовок {heading['index'] + 1}",
                        'description': "Заголовок второго уровня должен быть выделен полужирным шрифтом.",
                        'auto_fixable': True
                    })
                    
        return issues
    
    def _check_bibliography(self, document_data):
        """
        Проверяет соответствие оформления списка литературы требованиям ГОСТ
        """
        issues = []
        
        # Извлекаем библиографию, если она есть
        bibliography = document_data.get('bibliography', [])
        
        if not bibliography:
            issues.append({
                'type': 'bibliography_missing',
                'severity': 'high',
                'location': "Документ",
                'description': "Список литературы не найден или не распознан. Убедитесь, что раздел существует и имеет заголовок 'Список литературы', 'Библиография' или аналогичный.",
                'auto_fixable': False
            })
            return issues
            
        # Проверка каждой записи в списке литературы
        for i, item in enumerate(bibliography):
            item_text = item.get('text', '')
            if not item_text.strip():
                continue
                
            # Определяем тип библиографической записи
            record_type = self._determine_bibliography_record_type(item_text)
            
            if record_type == 'unknown':
                issues.append({
                    'type': 'bibliography_unknown_format',
                    'severity': 'medium',
                    'location': f"Список литературы, запись {i + 1}",
                    'description': f"Не удалось определить тип библиографической записи: '{item_text[:100]}...'",
                    'auto_fixable': False,
                    'raw_text': item_text
                })
                continue
                
            # Проверяем соответствие библиографической записи шаблону
            pattern = self.bibliography_patterns.get(record_type)
            if pattern and not re.match(pattern, item_text.strip()):
                issues.append({
                    'type': f'bibliography_{record_type}_format',
                    'severity': 'medium',
                    'location': f"Список литературы, запись {i + 1}",
                    'description': f"{self.bibliography_error_messages.get(record_type)}\nТекущий вариант: '{item_text}'",
                    'auto_fixable': False,
                    'raw_text': item_text
                })
                
            # Проверяем наличие обязательных элементов для электронных ресурсов
            if 'электронный ресурс' in item_text.lower() or 'url:' in item_text.lower():
                if 'дата обращения' not in item_text.lower():
                    issues.append({
                        'type': 'bibliography_missing_access_date',
                        'severity': 'medium',
                        'location': f"Список литературы, запись {i + 1}",
                        'description': f"Для электронного ресурса отсутствует дата обращения. Добавьте '(дата обращения: ДД.ММ.ГГГГ)'.",
                        'auto_fixable': False,
                        'raw_text': item_text
                    })
                    
                if 'url:' not in item_text.lower():
                    issues.append({
                        'type': 'bibliography_missing_url',
                        'severity': 'high',
                        'location': f"Список литературы, запись {i + 1}",
                        'description': f"Для электронного ресурса отсутствует URL. Добавьте 'URL: http://...'.",
                        'auto_fixable': False,
                        'raw_text': item_text
                    })
                
            # Проверка наличия года издания для всех типов источников
            if not re.search(r'\d{4}', item_text):
                issues.append({
                    'type': 'bibliography_missing_year',
                    'severity': 'medium',
                    'location': f"Список литературы, запись {i + 1}",
                    'description': f"Не указан год издания. Все источники должны содержать год издания в формате 'ГГГГ'.",
                    'auto_fixable': False,
                    'raw_text': item_text
                })
                
            # Проверка корректности нумерации
            if 'index' in item and item['index'] > 0:
                expected_number = item['index']
                actual_number_match = re.match(r'^\s*(\d+)\.\s', item_text)
                if actual_number_match:
                    actual_number = int(actual_number_match.group(1))
                    if actual_number != expected_number:
                        issues.append({
                            'type': 'bibliography_wrong_numbering',
                            'severity': 'low',
                            'location': f"Список литературы, запись {i + 1}",
                            'description': f"Неправильный номер записи. Фактический: {actual_number}, ожидаемый: {expected_number}.",
                            'auto_fixable': True,
                            'raw_text': item_text,
                            'correction': item_text.replace(f"{actual_number}.", f"{expected_number}.")
                        })
        
        # Проверка общего форматирования списка литературы
        bibliography_title_found = False
        for para in document_data.get('paragraphs', []):
            text = para.get('text', '').lower()
            if any(title in text for title in [
                'список литературы', 'список использованных источников', 
                'список использованной литературы', 'литература', 'библиография'
            ]):
                bibliography_title_found = True
                # Проверка форматирования заголовка списка литературы
                if not para.get('is_heading', False):
                    issues.append({
                        'type': 'bibliography_title_format',
                        'severity': 'medium',
                        'location': f"Заголовок списка литературы",
                        'description': "Заголовок списка литературы должен быть оформлен стилем заголовка.",
                        'auto_fixable': True
                    })
                break

        if len(bibliography) > 0 and not bibliography_title_found:
            issues.append({
                'type': 'bibliography_title_missing',
                'severity': 'medium',
                'location': "Документ",
                'description': "Заголовок списка литературы не найден. Должен быть заголовок 'Список литературы', 'Библиография' или аналогичный.",
                'auto_fixable': True
            })
            
        return issues

    def _determine_bibliography_record_type(self, text):
        """
        Определяет тип библиографической записи
        """
        text = text.strip()
        
        # Удаляем нумерацию в начале строки, если она есть
        text = re.sub(r'^\d+\.?\s*', '', text)
        
        # Проверяем на электронный ресурс
        if ('[электронный ресурс]' in text.lower() or 'url:' in text.lower() or 
            'электронный адрес' in text.lower() or 'режим доступа' in text.lower()):
            return 'web_resource'
            
        # Проверяем на ГОСТ
        if text.lower().startswith('гост'):
            return 'gost'
            
        # Проверяем на законодательные материалы
        law_keywords = ['федеральный закон', 'постановление', 'указ', 'кодекс']
        if any(keyword in text.lower() for keyword in law_keywords):
            return 'law'
            
        # Проверяем на 5+ авторов
        if '[и др.]' in text or '[et al.]' in text:
            return '5_plus_authors'
            
        # Подсчитываем количество авторов по количеству инициалов И.О.
        initials_count = len(re.findall(r'[А-Я]\.\s?[А-Я]\.', text))
        
        if initials_count == 1:
            # Проверяем паттерн для одного автора
            if re.match(r'^[А-Я][а-я]+,\s[А-Я]\.\s?[А-Я]\.', text):
                return 'one_author'
        elif initials_count == 2 or initials_count == 3:
            # Проверяем паттерн для 2-3 авторов
            return '2_3_authors'
        elif initials_count == 4:
            # Проверяем паттерн для 4 авторов
            return '4_authors'
            
        # Если не удалось определить тип
        return 'unknown'
    
    def _check_images_and_tables(self, document_data):
        """
        Проверяет оформление изображений и таблиц
        """
        issues = []
        
        # Проверяем наличие ключей в document_data
        if not document_data:
            issues.append({
                'type': 'data_missing',
                'severity': 'high',
                'location': "Документ",
                'description': "Данные документа отсутствуют для проверки изображений и таблиц.",
                'auto_fixable': False
            })
            return issues
            
        images = document_data.get('images', [])
        tables = document_data.get('tables', [])
        
        # Проверяем оформление рисунков
        for i, image in enumerate(images):
            if not image:
                continue
                
            caption = image.get('caption', '')
            
            # Проверяем наличие номера у рисунка
            if not image.get('has_number'):
                issues.append({
                    'type': 'image_number',
                    'severity': 'high',
                    'location': f"Рисунок {i + 1}",
                    'description': "У рисунка отсутствует номер. Подпись должна содержать слово 'Рисунок' и номер.",
                    'auto_fixable': False
                })
                
            # Проверяем формат подписи (Рисунок X - Название)
            if caption and not re.match(r'^Рисунок\s+\d+\s*[–—-]\s*.+$', caption, re.IGNORECASE):
                issues.append({
                    'type': 'image_caption_format',
                    'severity': 'medium',
                    'location': f"Рисунок {i + 1}",
                    'description': "Неверный формат подписи к рисунку. Должно быть: 'Рисунок X - Название'.",
                    'auto_fixable': False
                })
                
            # Проверяем точку в конце подписи
            if caption and not image.get('ends_with_dot'):
                issues.append({
                    'type': 'image_caption_dot',
                    'severity': 'low',
                    'location': f"Рисунок {i + 1}",
                    'description': "Подпись к рисунку должна заканчиваться точкой.",
                    'auto_fixable': True
                })
                
            # Проверяем выравнивание подписи (должно быть по центру)
            if image.get('alignment') is not None and image.get('alignment') != WD_PARAGRAPH_ALIGNMENT.CENTER:
                issues.append({
                    'type': 'image_alignment',
                    'severity': 'medium',
                    'location': f"Рисунок {i + 1}",
                    'description': "Подпись к рисунку должна быть выровнена по центру.",
                    'auto_fixable': True
                })
                
        # Проверяем оформление таблиц
        for i, table in enumerate(tables):
            if not table:
                continue
                
            # Проверяем наличие заголовка у таблицы
            if not table.get('title'):
                issues.append({
                    'type': 'table_title',
                    'severity': 'high',
                    'location': f"Таблица {i + 1}",
                    'description': "У таблицы отсутствует заголовок. Заголовок должен содержать слово 'Таблица' и номер.",
                    'auto_fixable': False
                })
                continue
                
            title = table.get('title', '')
            
            # Проверяем формат заголовка (Таблица X - Название)
            if title and not re.match(r'^Таблица\s+\d+\s*[–—-]\s*.+$', title, re.IGNORECASE):
                issues.append({
                    'type': 'table_title_format',
                    'severity': 'medium',
                    'location': f"Таблица {i + 1}",
                    'description': "Неверный формат заголовка таблицы. Должно быть: 'Таблица X - Название'.",
                    'auto_fixable': False
                })
                
        return issues

    def _check_page_numbers(self, document_data):
        """
        Проверяет нумерацию страниц
        """
        issues = []
        page_numbers = document_data.get('page_numbers', {})
        
        # Проверяем наличие нумерации страниц
        if not page_numbers.get('has_page_numbers'):
            issues.append({
                'type': 'page_numbers_missing',
                'severity': 'medium',
                'location': "Документ",
                'description': "В документе отсутствует нумерация страниц.",
                'auto_fixable': True
            })
            return issues
            
        # Проверяем позицию нумерации (должна быть внизу)
        if page_numbers.get('position') != 'footer':
            issues.append({
                'type': 'page_numbers_position',
                'severity': 'low',
                'location': "Документ",
                'description': "Номера страниц должны располагаться внизу страницы.",
                'auto_fixable': True
            })
            
        # Проверяем выравнивание нумерации (должно быть по центру)
        if page_numbers.get('alignment') != 'center':
            issues.append({
                'type': 'page_numbers_alignment',
                'severity': 'low',
                'location': "Документ",
                'description': "Номера страниц должны быть выровнены по центру.",
                'auto_fixable': True
            })
            
        return issues

    def _check_lists(self, document_data):
        """
        Проверяет оформление нумерованных и маркированных списков
        """
        issues = []
        paragraphs = document_data.get('paragraphs', [])
        
        for i, para in enumerate(paragraphs):
            list_info = para.get('list_info', {})
            
            if list_info.get('is_list_item'):
                # Проверка на отступ слева для элементов списка
                paragraph_format = para.get('paragraph_format', {})
                left_indent = paragraph_format.get('left_indent')
                
                if left_indent is not None and left_indent < 0.5:
                    issues.append({
                        'type': 'list_indent',
                        'severity': 'low',
                        'location': f"Параграф {para['index'] + 1}",
                        'description': "Недостаточный отступ для элемента списка. Элементы списка должны иметь левый отступ.",
                        'auto_fixable': True
                    })
                
                # Проверка на соответствие форматирования для списков
                line_spacing = para.get('line_spacing')
                if line_spacing and line_spacing != self.standard_rules['line_spacing']:
                    issues.append({
                        'type': 'list_line_spacing',
                        'severity': 'low',
                        'location': f"Параграф {para['index'] + 1}",
                        'description': f"Неверный межстрочный интервал в элементе списка. Должен быть {self.standard_rules['line_spacing']}.",
                        'auto_fixable': True
                    })
            
        return issues

    def _check_references(self, document_data):
        """
        Проверяет наличие и корректность ссылок на рисунки и таблицы
        """
        issues = []
        
        # Проверка наличия необходимых данных
        if not document_data:
            issues.append({
                'type': 'references_missing_data',
                'severity': 'high',
                'location': "Документ",
                'description': "Данные документа отсутствуют для проверки ссылок.",
                'auto_fixable': False
            })
            return issues
            
        paragraphs = document_data.get('paragraphs', [])
        images = document_data.get('images', [])
        tables = document_data.get('tables', [])
        
        # Если нет рисунков или таблиц, проверка не нужна
        if not images and not tables:
            return issues
        
        # Получаем все номера рисунков
        image_numbers = []
        for image in images:
            if not image or 'caption' not in image:
                continue
                
            caption = image.get('caption', '')
            if not caption:
                continue
                
            match = re.search(r'Рисунок\s+(\d+)', caption, re.IGNORECASE)
            if match:
                image_numbers.append(match.group(1))
                
        # Получаем все номера таблиц
        table_numbers = []
        for table in tables:
            if not table or 'title' not in table:
                continue
                
            title = table.get('title', '')
            if not title:
                continue
                
            match = re.search(r'Таблица\s+(\d+)', title, re.IGNORECASE)
            if match:
                table_numbers.append(match.group(1))
                
        # Если нет номеров рисунков или таблиц, проверка не нужна
        if not image_numbers and not table_numbers:
            return issues
                
        # Ищем ссылки на рисунки и таблицы в тексте
        images_referenced = set()
        tables_referenced = set()
        
        for i, para in enumerate(paragraphs):
            if not para or 'text' not in para:
                continue
                
            text = para.get('text', '')
            if not text:
                continue
            
            # Ищем ссылки на рисунки
            for match in re.finditer(r'(?:рис\.|рисунок|рисунку)\s+(\d+)', text, re.IGNORECASE):
                images_referenced.add(match.group(1))
                
            # Ищем ссылки на таблицы
            for match in re.finditer(r'(?:табл\.|таблица|таблицу|таблице)\s+(\d+)', text, re.IGNORECASE):
                tables_referenced.add(match.group(1))
                
        # Проверяем, есть ли ссылки на все рисунки
        for num in image_numbers:
            if num not in images_referenced:
                issues.append({
                    'type': 'image_reference',
                    'severity': 'medium',
                    'location': f"Рисунок {num}",
                    'description': f"Отсутствует ссылка на рисунок {num} в тексте документа.",
                    'auto_fixable': False
                })
                
        # Проверяем, есть ли ссылки на все таблицы
        for num in table_numbers:
            if num not in tables_referenced:
                issues.append({
                    'type': 'table_reference',
                    'severity': 'medium',
                    'location': f"Таблица {num}",
                    'description': f"Отсутствует ссылка на таблицу {num} в тексте документа.",
                    'auto_fixable': False
                })
                
        return issues

    def _check_document_structure(self, document_data):
        """
        Проверяет структуру документа на наличие обязательных разделов
        """
        issues = []
        
        # Получаем список заголовков документа
        headings_text = []
        
        # Проверяем наличие ключа 'paragraphs' в данных документа
        if not document_data or 'paragraphs' not in document_data or not document_data['paragraphs']:
            issues.append({
                'type': 'structure_missing_data',
                'severity': 'high',
                'location': "Весь документ",
                'description': "Не удалось проанализировать структуру документа из-за отсутствия данных о параграфах.",
                'auto_fixable': False
            })
            return issues
        
        # Собираем текст всех параграфов документа
        all_text = " ".join([p.get('text', '').lower() for p in document_data['paragraphs']])
        
        # Проверяем наличие обязательных разделов
        for section in self.standard_rules['required_sections']:
            # Проверяем, содержится ли раздел в тексте
            if section not in all_text:
                issues.append({
                    'type': 'structure_missing_section',
                    'severity': 'high',
                    'location': "Весь документ",
                    'description': f"В работе отсутствует обязательный раздел '{section.capitalize()}'",
                    'auto_fixable': False
                })
        
        # Проверка последовательности разделов
        # Собираем список заголовков
        headings = document_data.get('headings', [])
        if headings:
            headings_text = [h.get('text', '').lower() for h in headings]
            
            # Проверяем, что введение идет в начале работы (после содержания)
            if 'введение' in headings_text:
                intro_index = headings_text.index('введение')
                sections_before_intro = [h for i, h in enumerate(headings_text) if i < intro_index and h != 'содержание']
                
                if sections_before_intro:
                    issues.append({
                        'type': 'structure_wrong_order',
                        'severity': 'medium',
                        'location': "Структура документа",
                        'description': "Раздел 'Введение' должен идти в начале работы после содержания",
                        'auto_fixable': False
                    })
                    
            # Проверяем, что заключение идет в конце работы (перед списком литературы)
            if 'заключение' in headings_text and any(lit in headings_text for lit in ['список литературы', 'библиография', 'список использованных источников']):
                conclusion_index = headings_text.index('заключение')
                lit_index = next((i for i, h in enumerate(headings_text) if h in ['список литературы', 'библиография', 'список использованных источников']), -1)
                
                if conclusion_index > lit_index:
                    issues.append({
                        'type': 'structure_wrong_order',
                        'severity': 'medium',
                        'location': "Структура документа",
                        'description': "Раздел 'Заключение' должен идти перед списком литературы",
                        'auto_fixable': False
                    })
        
        return issues

    def _calculate_statistics(self, results):
        """
        Рассчитывает статистику по результатам проверки
        """
        statistics = {
            'severity': {
                'high': 0,
                'medium': 0,
                'low': 0
            },
            'categories': {},
            'auto_fixable_count': 0,
            'issues_by_location': {}
        }
        
        all_issues = results.get('issues', [])
        for issue in all_issues:
            # Подсчет по серьезности
            severity = issue.get('severity')
            if severity in statistics['severity']:
                statistics['severity'][severity] += 1
                
            # Подсчет по категориям
            category = issue.get('type', '').split('_')[0]
            if category not in statistics['categories']:
                statistics['categories'][category] = 0
            statistics['categories'][category] += 1
            
            # Подсчет автоматически исправляемых проблем
            if issue.get('auto_fixable'):
                statistics['auto_fixable_count'] += 1
                
            # Подсчет по локации
            location = issue.get('location')
            if location not in statistics['issues_by_location']:
                statistics['issues_by_location'][location] = 0
            statistics['issues_by_location'][location] += 1
            
        return statistics 

    def _check_title_page(self, document_data):
        """
        Проверяет титульный лист на соответствие строгим требованиям ГОСТ/методичек, включая порядок, интервалы, регистр
        """
        issues = []
        title_page = document_data.get('title_page', [])
        if not title_page or len(title_page) < 4:
            issues.append({
                'type': 'title_page_missing',
                'severity': 'high',
                'location': 'Титульный лист',
                'description': 'Титульный лист не найден или слишком короткий. Проверьте структуру документа.',
                'auto_fixable': False
            })
            return issues
        # Проверка структуры и порядка
        template = self.TITLE_PAGE_TEMPLATE
        idx = 0
        prev_line = -1
        for block in template:
            found = False
            for i in range(idx, len(title_page)):
                text = title_page[i]['text'].lower()
                if any(kw in text for kw in block['keywords']):
                    found = True
                    # Проверка порядка
                    if i > idx and i - idx > 2:
                        issues.append({
                            'type': 'title_page_order',
                            'severity': 'medium',
                            'location': f"Титульный лист, строка {i+1}",
                            'description': f"Блок '{block['keywords'][0]}' находится не на своем месте. Ожидался на позиции {idx+1}.",
                            'auto_fixable': False
                        })
                    # Проверка регистра
                    orig_text = title_page[i]['text']
                    if block['case'] == 'upper' and orig_text != orig_text.upper():
                        issues.append({
                            'type': 'title_page_case',
                            'severity': 'low',
                            'location': f"Титульный лист, строка {i+1}",
                            'description': f"Блок '{block['keywords'][0]}' должен быть написан ПРОПИСНЫМИ буквами.",
                            'auto_fixable': True
                        })
                    if block['case'] == 'title' and orig_text != orig_text.capitalize():
                        issues.append({
                            'type': 'title_page_case',
                            'severity': 'low',
                            'location': f"Титульный лист, строка {i+1}",
                            'description': f"Блок '{block['keywords'][0]}' должен начинаться с заглавной буквы.",
                            'auto_fixable': True
                        })
                    # Проверка интервалов (количество пустых строк после блока)
                    min_lines = block['min_lines_after']
                    empty_count = 0
                    for j in range(i+1, min(i+1+min_lines+2, len(title_page))):
                        if not title_page[j]['text'].strip():
                            empty_count += 1
                    if empty_count < min_lines:
                        issues.append({
                            'type': 'title_page_spacing',
                            'severity': 'low',
                            'location': f"Титульный лист, строка {i+1}",
                            'description': f"После блока '{block['keywords'][0]}' должно быть не менее {min_lines} пустых строк.",
                            'auto_fixable': True
                        })
                    idx = i + 1
                    prev_line = i
                    break
            if not found:
                issues.append({
                    'type': 'title_page_block_missing',
                    'severity': 'high',
                    'location': 'Титульный лист',
                    'description': f"На титульном листе отсутствует обязательный блок: '{block['keywords'][0]}'",
                    'auto_fixable': False
                })
        # Остальная проверка (шрифт, выравнивание, отступы, номер страницы) — как было
        paragraphs = document_data.get('paragraphs', [])
        for p in title_page:
            idx_p = p['index']
            para = next((x for x in paragraphs if x['index'] == idx_p), None)
            if not para:
                continue
            font = para.get('font', {})
            pf = para.get('paragraph_format', {})
            if font.get('name') and font.get('name') != self.standard_rules['font']['name']:
                issues.append({
                    'type': 'title_page_font',
                    'severity': 'high',
                    'location': f"Титульный лист, параграф {idx_p+1}",
                    'description': f"Неверный шрифт: {font.get('name')}. Должен быть {self.standard_rules['font']['name']}.",
                    'auto_fixable': True
                })
            if font.get('size') and font.get('size') != self.standard_rules['font']['size']:
                issues.append({
                    'type': 'title_page_font_size',
                    'severity': 'high',
                    'location': f"Титульный лист, параграф {idx_p+1}",
                    'description': f"Неверный размер шрифта: {font.get('size')}. Должен быть {self.standard_rules['font']['size']}.",
                    'auto_fixable': True
                })
            if pf.get('alignment') is not None and pf.get('alignment') != WD_PARAGRAPH_ALIGNMENT.CENTER:
                issues.append({
                    'type': 'title_page_alignment',
                    'severity': 'medium',
                    'location': f"Титульный лист, параграф {idx_p+1}",
                    'description': "Параграф титульного листа должен быть выровнен по центру.",
                    'auto_fixable': True
                })
            if pf.get('first_line_indent') and pf.get('first_line_indent') > 0.01:
                issues.append({
                    'type': 'title_page_indent',
                    'severity': 'medium',
                    'location': f"Титульный лист, параграф {idx_p+1}",
                    'description': "На титульном листе не должно быть абзацного отступа.",
                    'auto_fixable': True
                })
        page_numbers = document_data.get('page_numbers', {})
        if page_numbers.get('has_page_numbers'):
            issues.append({
                'type': 'title_page_page_number',
                'severity': 'medium',
                'location': 'Титульный лист',
                'description': 'На титульном листе не должно быть номера страницы.',
                'auto_fixable': False
            })
        return issues 

    # ==== Заглушки для новых норм ====
    def _check_topic_title(self, document_data):
        # TODO: Реализовать проверку темы работы по утвержденному списку/приказу
        return []
    def _check_accents(self, document_data):
        # TODO: Проверка акцентов (курсив, жирность, размер)
        return []
    def _check_page_count(self, document_data):
        # TODO: Проверка объема работы (количество страниц)
        return []
    def _check_heading_spacing(self, document_data):
        # TODO: Проверка интервалов между заголовками и текстом
        return []
    def _check_section_start(self, document_data):
        # TODO: Проверка начала каждой главы/раздела с новой страницы
        return []
    def _check_chapter_conclusion(self, document_data):
        # TODO: Проверка наличия выводов в конце главы
        return []
    def _check_appendices(self, document_data):
        # TODO: Проверка оформления приложений
        return []
    def _check_numerals(self, document_data):
        # TODO: Проверка количественных числительных
        return []
    def _check_ordinals(self, document_data):
        # TODO: Проверка порядковых числительных
        return []
    def _check_surnames(self, document_data):
        # TODO: Проверка оформления фамилий и инициалов
        return []
    def _check_toc(self, document_data):
        # TODO: Проверка оформления оглавления
        return []
    def _check_numbering(self, document_data):
        # TODO: Проверка нумерации таблиц, формул, иллюстраций
        return []
    def _check_bibliography_references(self, document_data):
        # TODO: Проверка оформления библиографических ссылок в тексте
        return [] 