import os
import re
import json
from docx.shared import Pt, Cm
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from collections import defaultdict

# === NORM_RULES: 30 нормоконтрольных правил ===
NORM_RULES = [
    {"id": 1, "name": "Наименование темы работы", "description": "Тема соответствует утвержденной приказом.", "checker": "_check_topic_title"},    {"id": 2, "name": "Размер шрифта", "description": "Размер основного шрифта — 14pt. Для листингов кода допустим 12pt.", "checker": "_check_font"},
    {"id": 3, "name": "Название шрифта", "description": "Times New Roman, обычный, черный. Для листингов кода допустимы моноширинные шрифты (Courier New, Consolas и др.).", "checker": "_check_font"},
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
        {'type': 'supervisor', 'keywords': ['руководитель'], 'case': 'title', 'min_lines_after': 4},
        {'type': 'city_year', 'keywords': ['город', 'благовещенск'], 'case': 'title', 'min_lines_after': 0},
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
        for rule_result in results:
            if 'issues' in rule_result and rule_result['issues']:
                all_issues.extend(rule_result['issues'])
        
        # Преобразуем список результатов в словарь для ответа
        response = {
            'rules_results': results,
            'total_issues_count': len(all_issues),
            'issues': all_issues
        }
          # Подготовим статистику по категориям и серьезности проблем
        response['statistics'] = self._calculate_statistics(results)
        
        return response
    
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

            # Проверяем, является ли это листингом кода
            is_code_listing = self._is_code_listing(para)
            
            # Проверяем название шрифта
            font_name = font.get('name')
            if font_name and font_name != self.standard_rules['font']['name']:
                # Если это листинг кода и используется Courier New, это допустимо
                if is_code_listing and font_name in ['Courier New', 'Consolas', 'Monaco', 'Menlo']:
                    continue  # Пропускаем - это допустимо для кода
                
                issues.append({
                    'type': 'font_name',
                    'severity': 'high',
                    'location': f"Параграф {para['index'] + 1}",
                    'description': f"Неверный шрифт: {font_name}. Должен быть {self.standard_rules['font']['name']} (для листингов кода допустимы моноширинные шрифты).",
                    'auto_fixable': True
                })                
            # Проверяем размер шрифта
            font_size = font.get('size')
            if font_size and font_size != self.standard_rules['font']['size']:
                # Для листингов кода допустим размер 12pt
                if is_code_listing and font_size == 12.0:
                    continue  # Пропускаем - это допустимо для кода
                
                issues.append({
                    'type': 'font_size',
                    'severity': 'high',
                    'location': f"Параграф {para['index'] + 1}",
                    'description': f"Неверный размер шрифта: {font_size}. Должен быть {self.standard_rules['font']['size']} (для листингов кода допустим 12pt).",
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
    
    def _is_code_listing(self, para):
        """
        Определяет, является ли параграф листингом программного кода
        """
        # Проверяем текст параграфа на наличие признаков кода
        text = para.get('text', '').strip()
        if not text:
            return False
        
        # Признаки программного кода
        code_indicators = [
            # Ключевые слова программирования
            r'\b(def|function|class|if|else|elif|for|while|return|import|include|#include|using|namespace)\b',
            # Операторы и синтаксис
            r'[{}();]',
            r'=>|->|\+\+|--|==|!=|<=|>=',
            # Типичные конструкции
            r'\b(int|string|char|float|double|boolean|void|public|private|protected)\b',
            r'\b(printf|cout|cin|scanf|print|console\.log)\b',
            # HTML/CSS/JS
            r'<[^>]+>|{\s*[a-zA-Z-]+\s*:',
            # SQL
            r'\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE)\b',
            # Отступы как в коде (4+ пробелов в начале)
            r'^\s{4,}'
        ]
        
        # Также проверяем стиль параграфа
        style = para.get('style', '').lower()
        if 'code' in style or 'listing' in style or 'программ' in style:
            return True
            
        # Проверяем шрифт - моноширинные шрифты часто используются для кода
        font_name = para.get('font', {}).get('name', '')
        monospace_fonts = ['Courier New', 'Consolas', 'Monaco', 'Menlo', 'Source Code Pro', 'Fira Code']
        if font_name in monospace_fonts:
            return True
        
        # Проверяем текст на наличие признаков кода
        for pattern in code_indicators:
            if re.search(pattern, text, re.IGNORECASE):
                return True
                
        return False
    
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
            
        # Проверяем позицию нумерации (должна быть вверху)
        if page_numbers.get('position') != 'header':
            issues.append({
                'type': 'page_numbers_position',
                'severity': 'low',
                'location': "Документ",
                'description': "Номера страниц должны располагаться в верхней части листа.",
                'auto_fixable': True
            })
            
        # Проверяем выравнивание нумерации (должно быть справа)
        if page_numbers.get('alignment') != 'right':
            issues.append({
                'type': 'page_numbers_alignment',
                'severity': 'low',
                'location': "Документ",
                'description': "Номера страниц должны быть выровнены по правому краю.",
                'auto_fixable': True
            })

        # Проверяем начальную страницу нумерации (должна быть 3 или 4)
        first_page = page_numbers.get('first_numbered_page')
        if first_page is not None and first_page not in [3, 4]:
            issues.append({
                'type': 'page_numbers_start_page',
                'severity': 'low',
                'location': "Документ",
                'description': "Нумерация должна начинаться со страницы ВВЕДЕНИЕ (страница 3 или 4).",
                'auto_fixable': True
            })

        # Проверяем шрифт нумерации
        styles = document_data.get('styles', {})
        header_style = None
        for section in document_data.get('page_setup', {}).values():
            if section.get('header_style'):
                header_style = styles.get(section.get('header_style'))
                break

        if header_style and header_style.get('font'):
            font = header_style.get('font')
            if font.get('name') != 'Times New Roman':
                issues.append({
                    'type': 'page_numbers_font_name',
                    'severity': 'low',
                    'location': "Документ",
                    'description': "Номера страниц должны быть набраны шрифтом Times New Roman.",
                    'auto_fixable': True
                })
            if font.get('size') != 12:
                issues.append({
                    'type': 'page_numbers_font_size',
                    'severity': 'low',
                    'location': "Документ",
                    'description': "Размер шрифта номеров страниц должен быть 12 пт.",
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
        
        Args:
            results: Список результатов проверки по всем правилам
            
        Returns:
            dict: Статистика по проверкам
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
        
        # Собираем все найденные проблемы из списка результатов
        all_issues = []
        for rule_result in results:
            if 'issues' in rule_result and rule_result['issues']:
                # Подсчитываем статистику по категориям
                rule_name = rule_result.get('rule_name', 'Прочее')
                if rule_name not in statistics['categories']:
                    statistics['categories'][rule_name] = {
                        'total': 0,
                        'high': 0,
                        'medium': 0,
                        'low': 0,
                        'fixable': 0
                    }
                
                # Обрабатываем каждую проблему в правиле
                for issue in rule_result['issues']:
                    all_issues.append(issue)
                    
                    # Подсчет по серьезности
                    severity = issue.get('severity', 'low')
                    if severity in statistics['severity']:
                        statistics['severity'][severity] += 1
                    
                    # Подсчет по категориям
                    statistics['categories'][rule_name]['total'] += 1
                    if severity in statistics['categories'][rule_name]:
                        statistics['categories'][rule_name][severity] += 1
                    
                    # Подсчет исправляемых проблем
                    if issue.get('auto_fixable', False):
                        statistics['auto_fixable_count'] += 1
                        statistics['categories'][rule_name]['fixable'] += 1
                    
                    # Подсчет по местоположению
                    location = issue.get('location', 'Неизвестно')
                    if location not in statistics['issues_by_location']:
                        statistics['issues_by_location'][location] = 0
                    statistics['issues_by_location'][location] += 1
        
        # Добавляем общее количество проблем
        statistics['total_issues'] = len(all_issues)
        
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
        # Проверка формата "город год" в последней строке
        last_line_found = False
        for i in range(len(title_page) - 1, -1, -1):
            text = title_page[i]['text'].strip()
            if text:
                # Проверяем, содержит ли последняя непустая строка город и год через пробел
                city_year_pattern = r'^[А-Я][а-я]+ \d{4}$'
                if not re.match(city_year_pattern, text):
                    issues.append({
                        'type': 'title_page_city_year',
                        'severity': 'medium',
                        'location': f"Титульный лист, последняя строка",
                        'description': "В нижней части титульного листа должен быть указан город и год через пробел (например, 'Благовещенск 2024').",
                        'auto_fixable': True
                    })
                last_line_found = True
                break
        
        if not last_line_found:
            issues.append({
                'type': 'title_page_city_year_missing',
                'severity': 'medium',
                'location': 'Титульный лист',
                'description': "В нижней части титульного листа отсутствует строка с городом и годом.",
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
        """
        Проверяет соответствие темы работы утвержденному списку.
        Проверяет также форматирование и оформление названия темы.
        
        Args:
            document_data: Данные документа
            
        Returns:
            list: Список проблем с темой работы
        """
        issues = []
        
        # Проверяем наличие данных о титульном листе
        if 'title_page' not in document_data or not document_data['title_page']:
            issues.append({
                'type': 'topic_title_missing_data',
                'severity': 'high',
                'location': 'Документ',
                'description': 'Невозможно проверить тему работы: данные о титульном листе отсутствуют.',
                'auto_fixable': False
            })
            return issues
        
        # Извлекаем тему из титульного листа
        title_page = document_data['title_page']
        topic = None
        
        # Поиск темы в данных титульного листа
        for element in title_page:
            if element.get('type') == 'topic':
                topic = element.get('text', '').strip()
                break
        
        if not topic:
            issues.append({
                'type': 'topic_title_missing',
                'severity': 'high',
                'location': 'Титульный лист',
                'description': 'Тема работы не найдена на титульном листе.',
                'auto_fixable': False
            })
            return issues
        
        # Проверка форматирования темы
        # 1. Проверяем, что тема написана с большой буквы
        if not topic[0].isupper():
            issues.append({
                'type': 'topic_title_format',
                'severity': 'medium',
                'location': 'Титульный лист',
                'description': 'Тема работы должна начинаться с заглавной буквы.',
                'auto_fixable': True,
                'context': topic
            })
        
        # 2. Проверяем, что тема не заканчивается точкой
        if topic.endswith('.'):
            issues.append({
                'type': 'topic_title_format',
                'severity': 'medium',
                'location': 'Титульный лист',
                'description': 'Тема работы не должна заканчиваться точкой.',
                'auto_fixable': True,
                'context': topic
            })
        
        # 3. Проверяем длину темы
        if len(topic) < 10:
            issues.append({
                'type': 'topic_title_length',
                'severity': 'medium',
                'location': 'Титульный лист',
                'description': 'Тема работы слишком короткая. Рекомендуемая длина - не менее 10 символов.',
                'auto_fixable': False,
                'context': topic
            })
        elif len(topic) > 200:
            issues.append({
                'type': 'topic_title_length',
                'severity': 'medium',
                'location': 'Титульный лист',
                'description': 'Тема работы слишком длинная. Рекомендуемая длина - не более 200 символов.',
                'auto_fixable': False,
                'context': topic
            })
        
        # 4. Проверяем наличие ключевых слов в теме
        # Проверяем соответствие темы предметной области
        # Это упрощенная проверка, в реальной системе можно использовать базу данных утвержденных тем
        
        # Примеры ключевых слов для распространенных дисциплин
        topic_keywords = {
            'информатика': ['алгоритм', 'программ', 'информаци', 'систем', 'модел', 'данных', 'разработка'],
            'экономика': ['экономик', 'финанс', 'анализ', 'рынок', 'бюджет', 'бизнес', 'производств'],
            'педагогика': ['педагогик', 'образован', 'обучени', 'методик', 'воспитани', 'технологи', 'развити'],
            'юриспруденция': ['прав', 'закон', 'норматив', 'юридическ', 'ответственност', 'регулирован']
        }
        
        # Поиск ключевых слов в теме
        found_disciplines = []
        for discipline, keywords in topic_keywords.items():
            for keyword in keywords:
                if keyword.lower() in topic.lower():
                    found_disciplines.append(discipline)
                    break
        
        if not found_disciplines:
            issues.append({
                'type': 'topic_title_keywords',
                'severity': 'low',
                'location': 'Титульный лист',
                'description': 'Тема работы не содержит ключевых слов, характерных для известных дисциплин.',
                'auto_fixable': False,
                'context': topic
            })
        
        # 5. Проверка корректности темы по существу
        # Это могло бы быть проверкой на соответствие утвержденному списку тем
        # или проверкой с использованием более сложного алгоритма или API
        
        # Для реальной реализации проверки на соответствие утвержденным темам
        # здесь должен быть запрос к базе данных с утвержденными темами
        
        return issues
    def _check_accents(self, document_data):
        """
        Проверяет акценты в тексте (курсив, жирность, размер шрифта)
        Согласно требованиям ГОСТ, в тексте допускается использовать только курсив, 
        изменение размера и жирность (кроме заголовков).
        
        Args:
            document_data: Данные документа
            
        Returns:
            list: Список проблем с акцентами в тексте
        """
        issues = []
        
        if 'paragraphs' not in document_data:
            issues.append({
                'type': 'accents_missing_data',
                'severity': 'medium',
                'location': 'Документ',
                'description': 'Невозможно проверить акценты: данные о параграфах отсутствуют.',
                'auto_fixable': False
            })
            return issues
        
        # Допустимые акценты в тексте
        allowed_accents = ['italic', 'bold', 'size']
        
        # Проверяем форматирование каждого параграфа
        for para in document_data['paragraphs']:
            # Пропускаем заголовки (в них разрешены акценты)
            if para.get('style', '').startswith('Heading') or para.get('is_heading', False):
                continue
            
            # Получаем список запусков (runs) в параграфе
            runs = para.get('runs', [])
            
            for run_idx, run in enumerate(runs):
                # Пропускаем пустые запуски
                if not run.get('text'):
                    continue
                
                # Проверяем наличие недопустимых акцентов
                run_style = run.get('style', {})
                
                # Проверяем подчеркивание
                if run_style.get('underline'):
                    issues.append({
                        'type': 'accent_underline',
                        'severity': 'medium',
                        'location': f"Параграф {para.get('index', 0) + 1}, фрагмент {run_idx + 1}",
                        'description': f"Недопустимое подчеркивание в тексте: '{run.get('text')[:30]}...'",
                        'auto_fixable': True,
                        'context': run.get('text')
                    })
                
                # Проверяем разрядку (расширенный межзнаковый интервал)
                if run_style.get('char_spacing') and run_style.get('char_spacing') != 0:
                    issues.append({
                        'type': 'accent_char_spacing',
                        'severity': 'medium',
                        'location': f"Параграф {para.get('index', 0) + 1}, фрагмент {run_idx + 1}",
                        'description': f"Недопустимая разрядка (расширенный межзнаковый интервал) в тексте: '{run.get('text')[:30]}...'",
                        'auto_fixable': True,
                        'context': run.get('text')
                    })
                
                # Проверяем цвет текста (должен быть черным)
                if run_style.get('color') and run_style.get('color').lower() != 'black' and run_style.get('color').lower() != '000000':
                    issues.append({
                        'type': 'accent_color',
                        'severity': 'medium',
                        'location': f"Параграф {para.get('index', 0) + 1}, фрагмент {run_idx + 1}",
                        'description': f"Недопустимое использование цветного текста: '{run.get('text')[:30]}...'",
                        'auto_fixable': True,
                        'context': run.get('text')
                    })
                
                # Проверяем верхний/нижний индекс
                if run_style.get('superscript') or run_style.get('subscript'):
                    # Разрешаем только для математических формул и сносок
                    if not any(char in run.get('text', '') for char in '0123456789+-*/()[]{}=<>'):
                        issues.append({
                            'type': 'accent_script',
                            'severity': 'low',
                            'location': f"Параграф {para.get('index', 0) + 1}, фрагмент {run_idx + 1}",
                            'description': f"Верхний/нижний индекс разрешен только для формул и сносок: '{run.get('text')[:30]}...'",
                            'auto_fixable': False,
                            'context': run.get('text')
                        })
                
                # Проверяем шрифт
                font_name = run_style.get('font', {}).get('name')
                if font_name and font_name != self.standard_rules['font']['name']:
                    issues.append({
                        'type': 'accent_font',
                        'severity': 'high',
                        'location': f"Параграф {para.get('index', 0) + 1}, фрагмент {run_idx + 1}",
                        'description': f"Недопустимый шрифт '{font_name}' в тексте: '{run.get('text')[:30]}...'",
                        'auto_fixable': True,
                        'context': run.get('text')
                    })
                
                # Проверяем размер шрифта
                font_size = run_style.get('font', {}).get('size')
                if font_size and font_size != self.standard_rules['font']['size'] and not run_style.get('bold') and not run_style.get('italic'):
                    # Допускаем размер 12 pt для подписей к таблицам и рисункам
                    if para.get('is_caption') and font_size == 12.0:
                        continue
                    
                    issues.append({
                        'type': 'accent_font_size',
                        'severity': 'medium',
                        'location': f"Параграф {para.get('index', 0) + 1}, фрагмент {run_idx + 1}",
                        'description': f"Необычный размер шрифта {font_size} pt в тексте: '{run.get('text')[:30]}...'",
                        'auto_fixable': True,
                        'context': run.get('text')
                    })
        
        return issues
    def _check_page_count(self, document_data):
        """
        Проверяет объем работы (количество страниц)
        Согласно требованиям, объем курсовой работы должен быть 40-90 страниц без приложений.
        
        Args:
            document_data: Данные документа
            
        Returns:
            list: Список проблем с объемом работы
        """
        issues = []
        
        # Проверяем наличие информации о страницах
        if 'page_count' not in document_data:
            issues.append({
                'type': 'page_count_missing_data',
                'severity': 'medium',
                'location': 'Документ',
                'description': 'Невозможно проверить объем работы: данные о количестве страниц отсутствуют.',
                'auto_fixable': False
            })
            return issues
        
        # Параметры проверки для разных типов работ
        work_types = {
            'курсовая работа': {'min': 30, 'max': 50, 'opt': 40},
            'дипломная работа': {'min': 60, 'max': 90, 'opt': 70},
            'магистерская диссертация': {'min': 80, 'max': 120, 'opt': 100},
            'отчет по практике': {'min': 20, 'max': 40, 'opt': 30},
            'реферат': {'min': 15, 'max': 25, 'opt': 20}
        }
        
        # Определяем тип работы по титульному листу
        work_type = 'курсовая работа'  # По умолчанию
        if 'title_page' in document_data and document_data['title_page']:
            for element in document_data['title_page']:
                if element.get('type') == 'work_type':
                    work_type_text = element.get('text', '').lower()
                    
                    # Определяем тип работы на основе текста
                    for wtype in work_types.keys():
                        if wtype in work_type_text:
                            work_type = wtype
                            break
                    break
        
        # Получаем информацию о страницах
        page_count = document_data['page_count']
        
        # Получаем количество страниц без приложений
        pages_without_appendices = page_count
        if 'appendices_start_page' in document_data and document_data['appendices_start_page'] > 0:
            pages_without_appendices = document_data['appendices_start_page'] - 1
        
        # Получаем параметры для текущего типа работы
        min_pages = work_types[work_type]['min']
        max_pages = work_types[work_type]['max']
        optimal_pages = work_types[work_type]['opt']
        
        # Проверяем, соответствует ли объем работы требованиям
        if pages_without_appendices < min_pages:
            issues.append({
                'type': 'page_count_low',
                'severity': 'high',
                'location': 'Документ',
                'description': f"Недостаточный объем работы: {pages_without_appendices} страниц без приложений. " +
                               f"Минимальный объем для {work_type} - {min_pages} страниц.",
                'auto_fixable': False
            })
        elif pages_without_appendices > max_pages:
            issues.append({
                'type': 'page_count_high',
                'severity': 'medium',
                'location': 'Документ',
                'description': f"Превышен рекомендуемый объем работы: {pages_without_appendices} страниц без приложений. " +
                               f"Максимальный рекомендуемый объем для {work_type} - {max_pages} страниц.",
                'auto_fixable': False
            })
        elif abs(pages_without_appendices - optimal_pages) > 10:
            # Если отклонение от оптимального значения больше 10 страниц, но в пределах нормы
            issues.append({
                'type': 'page_count_suboptimal',
                'severity': 'low',
                'location': 'Документ',
                'description': f"Объем работы ({pages_without_appendices} страниц) отличается от оптимального " +
                               f"({optimal_pages} страниц) для {work_type}.",
                'auto_fixable': False
            })
        
        # Дополнительная проверка: наличие приложений
        if 'appendices' in document_data and document_data['appendices']:
            appendices_count = len(document_data['appendices'])
            if appendices_count > 0:
                appendices_pages = page_count - pages_without_appendices
                if appendices_pages > pages_without_appendices:
                    issues.append({
                        'type': 'page_count_appendices',
                        'severity': 'medium',
                        'location': 'Приложения',
                        'description': f"Объем приложений ({appendices_pages} страниц) превышает объем основной части " +
                                       f"работы ({pages_without_appendices} страниц).",
                        'auto_fixable': False
                    })
        
        return issues
    def _check_heading_spacing(self, document_data):
        """
        Проверяет интервалы между заголовками и текстом
        Согласно ГОСТ, между заголовками и текстом должно быть 2 одинарных интервала (или 1 полуторный)
        
        Args:
            document_data: Данные документа
            
        Returns:
            list: Список проблем с интервалами между заголовками и текстом
        """
        issues = []
        
        if 'paragraphs' not in document_data:
            issues.append({
                'type': 'heading_spacing_missing_data',
                'severity': 'medium',
                'location': 'Документ',
                'description': 'Невозможно проверить интервалы между заголовками и текстом: данные о параграфах отсутствуют.',
                'auto_fixable': False
            })
            return issues
        
        # Норма для интервала после заголовка
        required_spacing_after = {
            'line_spacing': 2.0,  # Для одинарного интервала
            'pt': 24.0  # В пунктах
        }
        
        # Норма для интервала перед заголовком
        required_spacing_before = {
            'line_spacing': 3.0,  # Для одинарного интервала
            'pt': 36.0  # В пунктах
        }
        
        # Пройдемся по всем параграфам и найдем заголовки
        for i, para in enumerate(document_data['paragraphs']):
            # Проверяем, является ли параграф заголовком
            if para.get('style', '').startswith('Heading') or para.get('is_heading', False):
                heading_level = None
                
                # Определяем уровень заголовка
                if para.get('style', '').startswith('Heading'):
                    # Получаем уровень из стиля, например "Heading 1" -> 1
                    try:
                        heading_level = int(para.get('style', '').split()[-1])
                    except (ValueError, IndexError):
                        heading_level = 1
                elif para.get('heading_level'):
                    heading_level = para.get('heading_level')
                else:
                    heading_level = 1
                
                # Проверяем интервал после заголовка, если это не последний параграф
                if i < len(document_data['paragraphs']) - 1:
                    next_para = document_data['paragraphs'][i + 1]
                    
                    # Проверяем, является ли следующий параграф также заголовком
                    next_is_heading = next_para.get('style', '').startswith('Heading') or next_para.get('is_heading', False)
                      # Если следующий параграф не заголовок, проверяем интервал между ними
                    if not next_is_heading:
                        # Получаем информацию об интервале после заголовка
                        spacing_after = para.get('paragraph_format', {}).get('space_after', 0)
                        line_spacing = para.get('paragraph_format', {}).get('line_spacing', 1.0)
                        
                        # Вычисляем фактический интервал в пунктах
                        # Проверяем на None и устанавливаем значение по умолчанию
                        actual_spacing = spacing_after if spacing_after is not None else 0
                        
                        # Проверяем, соответствует ли интервал требованиям
                        # Используем допуск в 2 пт для компенсации погрешности измерения
                        if abs(actual_spacing - required_spacing_after['pt']) > 2.0:
                            issues.append({
                                'type': 'heading_spacing_after',
                                'severity': 'medium',
                                'location': f"Заголовок '{para.get('text', '').strip()}'",
                                'description': f"Неверный интервал после заголовка: {actual_spacing} пт. " +
                                              f"Должно быть {required_spacing_after['pt']} пт (2 одинарных интервала).",
                                'auto_fixable': True,
                                'heading_index': i,
                                'context': para.get('text', '')
                            })
                
                # Проверяем интервал перед заголовком, если это не первый параграф
                if i > 0:
                    prev_para = document_data['paragraphs'][i - 1]
                    
                    # Проверяем, является ли предыдущий параграф также заголовком
                    prev_is_heading = prev_para.get('style', '').startswith('Heading') or prev_para.get('is_heading', False)
                      # Если предыдущий параграф не заголовок, проверяем интервал между ними
                    if not prev_is_heading:
                        # Получаем информацию об интервале перед заголовком
                        spacing_before = para.get('paragraph_format', {}).get('space_before', 0)
                        
                        # Вычисляем фактический интервал в пунктах
                        # Проверяем на None и устанавливаем значение по умолчанию
                        actual_spacing = spacing_before if spacing_before is not None else 0
                        
                        # Разные требования к интервалам для разных уровней заголовков
                        if heading_level == 1:
                            # Для заголовков первого уровня (разделы) - больший интервал
                            if abs(actual_spacing - required_spacing_before['pt']) > 2.0:
                                issues.append({
                                    'type': 'heading_spacing_before',
                                    'severity': 'medium',
                                    'location': f"Заголовок '{para.get('text', '').strip()}'",
                                    'description': f"Неверный интервал перед заголовком: {actual_spacing} пт. " +
                                                  f"Должно быть {required_spacing_before['pt']} пт (3 одинарных интервала).",
                                    'auto_fixable': True,
                                    'heading_index': i,
                                    'context': para.get('text', '')
                                })
                        else:
                            # Для заголовков второго и более уровней - меньший интервал
                            if abs(actual_spacing - required_spacing_after['pt']) > 2.0:
                                issues.append({
                                    'type': 'heading_spacing_before',
                                    'severity': 'medium',
                                    'location': f"Заголовок '{para.get('text', '').strip()}'",
                                    'description': f"Неверный интервал перед заголовком: {actual_spacing} пт. " +
                                                  f"Должно быть {required_spacing_after['pt']} пт (2 одинарных интервала).",
                                    'auto_fixable': True,
                                    'heading_index': i,
                                    'context': para.get('text', '')
                                })
        
        return issues
    def _check_section_start(self, document_data):
        """
        Проверяет, начинается ли каждая структурная часть (глава, раздел) с новой страницы
        Согласно ГОСТ, каждая структурная часть работы должна начинаться с новой страницы
        
        Args:
            document_data: Данные документа
            
        Returns:
            list: Список проблем с началом структурных частей
        """
        issues = []
        
        # Проверяем наличие данных о страницах и параграфах
        if 'paragraphs' not in document_data or 'pages' not in document_data:
            issues.append({
                'type': 'section_start_missing_data',
                'severity': 'medium',
                'location': 'Документ',
                'description': 'Невозможно проверить начало разделов: данные о страницах или параграфах отсутствуют.',
                'auto_fixable': False
            })
            return issues
        
        # Получаем словарь соответствия параграфов и страниц
        paragraphs_pages = document_data.get('paragraphs_pages', {})
        if not paragraphs_pages:
            # Если информация о страницах параграфов отсутствует, пытаемся использовать
            # информацию о разрывах страниц из параграфов
            current_page = 1
            paragraphs_pages = {}
            
            for i, para in enumerate(document_data['paragraphs']):
                # Если есть явное указание на номер страницы
                if 'page_number' in para:
                    current_page = para['page_number']
                # Если параграф содержит разрыв страницы
                elif para.get('page_break_before', False):
                    current_page += 1
                
                paragraphs_pages[i] = current_page
        
        # Список структурных частей, которые должны начинаться с новой страницы
        main_sections = [
            'введение', 'заключение', 'список литературы', 'список использованных источников',
            'список использованной литературы', 'библиографический список', 'содержание',
            'оглавление', 'приложения', 'приложение'
        ]
        
        # Проверяем каждый параграф
        for i, para in enumerate(document_data['paragraphs']):
            # Пропускаем пустые параграфы
            if not para.get('text', '').strip():
                continue
            
            # Проверяем, является ли параграф заголовком раздела первого уровня или основной структурной частью
            is_main_section = False
            
            # Проверяем по стилю и уровню заголовка
            if para.get('style', '').startswith('Heading 1') or para.get('heading_level') == 1:
                is_main_section = True
            
            # Проверяем по тексту (для основных структурных частей)
            para_text = para.get('text', '').strip().lower()
            if any(section in para_text for section in main_sections):
                is_main_section = True
            
            # Если это основная структурная часть, проверяем, начинается ли она с новой страницы
            if is_main_section:
                current_page = paragraphs_pages.get(i, 0)
                
                # Проверяем, если это не первый параграф
                if i > 0:
                    prev_page = paragraphs_pages.get(i - 1, 0)
                    
                    # Если предыдущий параграф на той же странице
                    if current_page == prev_page:
                        issues.append({
                            'type': 'section_start_page',
                            'severity': 'high',
                            'location': f"Раздел '{para.get('text', '').strip()}'",
                            'description': f"Структурная часть не начинается с новой страницы. " +
                                          f"Раздел '{para.get('text', '').strip()}' должен начинаться с новой страницы.",
                            'auto_fixable': True,
                            'section_index': i,
                            'context': para.get('text', '')
                        })
        
        # Дополнительно проверяем обязательные структурные части
        required_sections = ['введение', 'заключение', 'список литературы', 'список использованных источников']
        found_sections = set()
        
        for para in document_data['paragraphs']:
            para_text = para.get('text', '').strip().lower()
            for section in required_sections:
                if section in para_text and len(para_text) < len(section) + 5:  # Допуск на небольшие различия
                    found_sections.add(section)
        
        # Проверяем наличие всех обязательных частей
        for section in required_sections[:2]:  # Проверяем только введение и заключение
            if section not in found_sections:
                issues.append({
                    'type': 'section_missing',
                    'severity': 'high',
                    'location': 'Документ',
                    'description': f"Обязательная структурная часть '{section.capitalize()}' не найдена в документе.",
                    'auto_fixable': False
                })
        
        # Проверяем наличие списка литературы (хотя бы одного из вариантов)
        if not any(section in found_sections for section in required_sections[2:]):
            issues.append({
                'type': 'section_missing',
                'severity': 'high',
                'location': 'Документ',
                'description': f"Обязательная структурная часть 'Список литературы' не найдена в документе.",
                'auto_fixable': False
            })
        
        return issues

    def _check_chapter_conclusion(self, document_data):
        """
        Проверяет наличие выводов в конце каждой главы
        Согласно ГОСТ, каждая глава должна заканчиваться выводами
        
        Args:
            document_data: Данные документа
            
        Returns:
            list: Список проблем с выводами в конце глав
        """
        issues = []
        
        if 'paragraphs' not in document_data:
            issues.append({
                'type': 'chapter_conclusion_missing_data',
                'severity': 'medium',
                'location': 'Документ',
                'description': 'Невозможно проверить выводы в главах: данные о параграфах отсутствуют.',
                'auto_fixable': False
            })
            return issues
        
        # Получаем структуру глав и разделов
        chapters = []
        current_chapter = None
        
        # Собираем информацию о главах и их содержимом
        for i, para in enumerate(document_data['paragraphs']):
            # Пропускаем пустые параграфы
            if not para.get('text', '').strip():
                continue
            
            # Определяем, является ли параграф заголовком главы (уровня 1)
            is_chapter_heading = False
            if para.get('style', '') == 'Heading 1' or para.get('heading_level') == 1:
                is_chapter_heading = True
                # Исключаем стандартные разделы, которые не являются главами
                standard_sections = ['введение', 'заключение', 'список литературы', 'список использованных источников',
                                    'содержание', 'оглавление', 'приложения']
                para_text = para.get('text', '').strip().lower()
                if any(section in para_text for section in standard_sections):
                    is_chapter_heading = False
            
            # Если это заголовок главы, создаем новую запись
            if is_chapter_heading:
                # Сохраняем предыдущую главу, если она существует
                if current_chapter:
                    chapters.append(current_chapter)
                
                # Создаем новую главу
                current_chapter = {
                    'title': para.get('text', '').strip(),
                    'start_index': i,
                    'end_index': None,
                    'paragraphs': []
                }
            # Если глава уже создана, добавляем параграф в текущую главу
            elif current_chapter:
                current_chapter['paragraphs'].append(para)
                current_chapter['end_index'] = i
        
        # Добавляем последнюю главу, если она существует
        if current_chapter:
            chapters.append(current_chapter)
        
        # Проверяем каждую главу на наличие выводов в конце
        for chapter in chapters:
            # Пропускаем главы с менее чем 3 параграфами (слишком короткие)
            if len(chapter['paragraphs']) < 3:
                continue
            
            # Проверяем последние 3 параграфа главы на наличие ключевых слов, указывающих на выводы
            conclusion_keywords = ['вывод', 'резюм', 'итог', 'заключ', 'таким образом', 'следовательно']
            has_conclusion = False
            
            # Проверяем последние N параграфов (или все, если их меньше)
            last_n = min(5, len(chapter['paragraphs']))
            last_paragraphs = chapter['paragraphs'][-last_n:]
            
            for para in last_paragraphs:
                para_text = para.get('text', '').strip().lower()
                if any(keyword in para_text for keyword in conclusion_keywords):
                    has_conclusion = True
                    break
            
            # Если выводы не найдены, добавляем проблему
            if not has_conclusion:
                issues.append({
                    'type': 'chapter_conclusion_missing',
                    'severity': 'medium',
                    'location': f"Глава '{chapter['title']}'",
                    'description': f"В конце главы '{chapter['title']}' не найдены выводы. " +
                                  f"Рекомендуется добавить заключительный параграф с выводами по главе.",
                    'auto_fixable': False,
                    'chapter_index': chapter['start_index']
                })
        
        return issues

    def _check_appendices(self, document_data):
        """
        Проверяет оформление приложений
        Согласно ГОСТ, приложения должны начинаться с новой страницы, 
        иметь заголовок 'ПРИЛОЖЕНИЯ', каждое приложение должно быть обозначено буквой и иметь название.
        
        Args:
            document_data: Данные документа
            
        Returns:
            list: Список проблем с оформлением приложений
        """
        issues = []
        
        # Проверяем наличие данных о приложениях
        if 'appendices' not in document_data or not document_data['appendices']:
            # Если приложений нет, проверка не требуется
            return issues
        
        # Проверяем, начинаются ли приложения с новой страницы
        if 'appendices_start_page' not in document_data:
            issues.append({
                'type': 'appendices_start_missing',
                'severity': 'medium',
                'location': 'Приложения',
                'description': 'Невозможно проверить начало приложений: данные о странице начала приложений отсутствуют.',
                'auto_fixable': False
            })
        elif 'paragraphs_pages' in document_data:
            # Проверяем, что перед страницей приложений нет текста на той же странице
            appendices_start_page = document_data['appendices_start_page']
            paragraphs_on_same_page = []
            
            for i, page in document_data['paragraphs_pages'].items():
                if page == appendices_start_page and i < document_data['appendices_start_index']:
                    paragraphs_on_same_page.append(i)
            
            if paragraphs_on_same_page:
                issues.append({
                    'type': 'appendices_start_page',
                    'severity': 'high',
                    'location': 'Приложения',
                    'description': 'Приложения не начинаются с новой страницы.',
                    'auto_fixable': True
                })
        
        # Проверяем наличие заголовка ПРИЛОЖЕНИЯ
        has_appendices_heading = False
        if 'paragraphs' in document_data:
            for para in document_data['paragraphs']:
                if para.get('text', '').strip().upper() == 'ПРИЛОЖЕНИЯ':
                    has_appendices_heading = True
                    # Проверяем форматирование заголовка ПРИЛОЖЕНИЯ
                    if para.get('alignment') != WD_PARAGRAPH_ALIGNMENT.CENTER:
                        issues.append({
                            'type': 'appendices_heading_alignment',
                            'severity': 'medium',
                            'location': 'Приложения',
                            'description': 'Заголовок "ПРИЛОЖЕНИЯ" должен быть выровнен по центру.',
                            'auto_fixable': True
                        })
                    break
        
        if not has_appendices_heading:
            issues.append({
                'type': 'appendices_heading_missing',
                'severity': 'medium',
                'location': 'Приложения',
                'description': 'Отсутствует заголовок "ПРИЛОЖЕНИЯ" перед приложениями.',
                'auto_fixable': True
            })
        
        # Проверяем каждое приложение
        appendices = document_data['appendices']
        
        # Список допустимых букв для обозначения приложений
        valid_letters = "АБВГДЕЖЗИКЛМНПРСТУФХЦЧШЩЭЮЯ"
        used_letters = set()
        
        for i, appendix in enumerate(appendices):
            # Проверяем наличие буквенного обозначения
            if 'letter' not in appendix or not appendix['letter']:
                issues.append({
                    'type': 'appendix_letter_missing',
                    'severity': 'high',
                    'location': f"Приложение {i+1}",
                    'description': f"Приложение {i+1} не имеет буквенного обозначения.",
                    'auto_fixable': False
                })
            else:
                letter = appendix['letter'].upper()
                
                # Проверяем правильность буквы
                if letter not in valid_letters:
                    issues.append({
                        'type': 'appendix_letter_invalid',
                        'severity': 'medium',
                        'location': f"Приложение {letter}",
                        'description': f"Недопустимая буква '{letter}' для обозначения приложения. " +
                                      f"Допустимые буквы: {', '.join(valid_letters)}.",
                        'auto_fixable': False
                    })
                
                # Проверяем уникальность буквы
                if letter in used_letters:
                    issues.append({
                        'type': 'appendix_letter_duplicate',
                        'severity': 'high',
                        'location': f"Приложение {letter}",
                        'description': f"Буква '{letter}' для обозначения приложения уже использована.",
                        'auto_fixable': False
                    })
                used_letters.add(letter)
            
            # Проверяем наличие заголовка приложения
            if 'title' not in appendix or not appendix['title']:
                issues.append({
                    'type': 'appendix_title_missing',
                    'severity': 'medium',
                    'location': f"Приложение {appendix.get('letter', i+1)}",
                    'description': f"Приложение не имеет заголовка.",
                    'auto_fixable': False
                })
            
            # Проверяем, начинается ли приложение с новой страницы
            if i > 0 and 'page' in appendix and 'page' in appendices[i-1]:
                if appendix['page'] == appendices[i-1]['page']:
                    issues.append({
                        'type': 'appendix_start_page',
                        'severity': 'medium',
                        'location': f"Приложение {appendix.get('letter', i+1)}",
                        'description': f"Приложение не начинается с новой страницы.",
                        'auto_fixable': True
                    })
        
        # Проверяем последовательность букв
        letters = [appendix.get('letter', '').upper() for appendix in appendices if 'letter' in appendix]
        expected_letters = valid_letters[:len(letters)]
        
        for i, (actual, expected) in enumerate(zip(letters, expected_letters)):
            if actual != expected:
                issues.append({
                    'type': 'appendix_letter_sequence',
                    'severity': 'low',
                    'location': f"Приложение {actual}",
                    'description': f"Нарушена последовательность букв для обозначения приложений. " +
                                  f"Ожидалась буква '{expected}' вместо '{actual}'.",
                    'auto_fixable': True
                })
        
        return issues

    def _check_numerals(self, document_data):
        """
        Проверяет корректность оформления количественных числительных
        
        Требования:
        - Однозначные числительные (от 0 до 9) записываются словами
        - Многозначные числительные записываются цифрами
        - Числительные в начале предложения всегда записываются словами
        """
        issues = []
        
        if 'paragraphs' not in document_data:
            issues.append({
                'type': 'numerals_missing_data',
                'severity': 'low',
                'location': 'Документ',
                'description': 'Невозможно проверить оформление числительных: данные о параграфах отсутствуют.',
                'auto_fixable': False
            })
            return issues
        
        # Словарь числительных от 0 до 9
        digit_words = {
            '0': ['ноль', 'нулевой', 'нулевая', 'нулевое', 'нулевые'],
            '1': ['один', 'одна', 'одно', 'первый', 'первая', 'первое', 'первые'],
            '2': ['два', 'две', 'второй', 'вторая', 'второе', 'вторые'],
            '3': ['три', 'третий', 'третья', 'третье', 'третьи'],
            '4': ['четыре', 'четвертый', 'четвертая', 'четвертое', 'четвертые'],
            '5': ['пять', 'пятый', 'пятая', 'пятое', 'пятые'],
            '6': ['шесть', 'шестой', 'шестая', 'шестое', 'шестые'],
            '7': ['семь', 'седьмой', 'седьмая', 'седьмое', 'седьмые'],
            '8': ['восемь', 'восьмой', 'восьмая', 'восьмое', 'восьмые'],
            '9': ['девять', 'девятый', 'девятая', 'девятое', 'девятые']
        }
        
        # Инвертируем словарь для поиска цифры по слову
        word_to_digit = {}
        for digit, words in digit_words.items():
            for word in words:
                word_to_digit[word] = digit
        
        # Регулярное выражение для поиска однозначных чисел в тексте
        # Исключаем числа в составе слов, десятичные дроби и т.д.
        single_digit_pattern = r'(?<!\d)(?<!\w)[0-9](?!\d)(?!\w)'
        
        # Проверяем каждый параграф
        for para in document_data['paragraphs']:
            # Пропускаем пустые параграфы и заголовки
            if not para.get('text', '').strip() or para.get('style', '').startswith('Heading'):
                continue
            
            # Пропускаем особые типы параграфов (подписи к таблицам, формулам и т.д.)
            if para.get('is_caption') or para.get('is_table_content') or para.get('is_formula'):
                continue
            
            text = para.get('text', '')
            
            # Проверяем наличие однозначных чисел, записанных цифрами
            single_digits = re.finditer(single_digit_pattern, text)
            
            for match in single_digits:
                # Получаем цифру и ее позицию в тексте
                digit = match.group()
                pos = match.start()
                
                # Проверяем, не является ли цифра частью специального контекста
                # (например, перечисления, номера и т.д.)
                context_before = text[max(0, pos-5):pos]
                
                # Пропускаем цифры в контексте перечислений, номеров и т.д.
                if re.search(r'[№пn]\s*$', context_before) or re.search(r'^\s*\d+\)', context_before):
                    continue
                
                # Проверяем, является ли цифра началом предложения
                is_sentence_start = False
                if pos > 0:
                    text_before = text[:pos].rstrip()
                    if text_before.endswith('.') or text_before.endswith('!') or text_before.endswith('?'):
                        is_sentence_start = True
                elif pos == 0:
                    is_sentence_start = True
                
                if is_sentence_start:
                    issues.append({
                        'type': 'numeral_at_sentence_start',
                        'severity': 'medium',
                        'location': f"Параграф {para.get('index', 0) + 1}",
                        'description': f"Число в начале предложения должно быть записано словами: '{digit}'.",
                        'auto_fixable': True,
                        'context': text[max(0, pos-10):min(len(text), pos+20)],
                        'position': pos,
                        'replacement': digit_words.get(digit, [''])[0]
                    })
                else:
                    # Для однозначных чисел внутри предложения (не относящихся к перечислениям)
                    issues.append({
                        'type': 'single_digit_as_numeral',
                        'severity': 'low',
                        'location': f"Параграф {para.get('index', 0) + 1}",
                        'description': f"Однозначное число '{digit}' рекомендуется писать словами.",
                        'auto_fixable': True,
                        'context': text[max(0, pos-10):min(len(text), pos+20)],
                        'position': pos,
                        'replacement': digit_words.get(digit, [''])[0]
                    })
            
            # Разбиваем текст на предложения
            sentences = re.split(r'(?<=[.!?])\s+', text)
            
            for sentence in sentences:
                # Пропускаем пустые предложения
                if not sentence.strip():
                    continue
                
                # Проверяем, начинается ли предложение с числительного, записанного словами
                words = sentence.strip().split()
                if not words:
                    continue
                
                first_word = words[0].lower()
                # Удаляем знаки препинания для проверки
                first_word = re.sub(r'[^\w\s]', '', first_word)
                
                # Если первое слово - числительное в виде слова, оно записано правильно
                if first_word in word_to_digit:
                    continue
                
                # Проверяем, начинается ли предложение с многозначного числа
                if re.match(r'^\d{2,}', words[0]):
                    issues.append({
                        'type': 'multi_digit_at_sentence_start',
                        'severity': 'medium',
                        'location': f"Параграф {para.get('index', 0) + 1}",
                        'description': f"Число в начале предложения должно быть записано словами: '{words[0]}'.",
                        'auto_fixable': False,
                        'context': sentence[:50],
                        'position': 0
                    })
        
        return issues
    
    def _check_ordinals(self, document_data):
        """
        Проверяет корректность оформления порядковых числительных с падежными окончаниями
        
        Требования:
        - Порядковые числительные должны иметь соответствующие падежные окончания
        - При записи цифрами: 1-й, 2-го, 5-му, 25-х и т.д.
        - Одно окончание при числительном, оканчивающемся на одну, две одинаковые согласные
          Пример: 20-й, 30-й
        - Два окончания при числительном, оканчивающемся на согласную и гласную
          Пример: 5-го, 10-му, 22-ми
        """
        issues = []
        
        # Проверяем наличие данных о параграфах
        if not document_data or 'paragraphs' not in document_data:
            issues.append({
                'type': 'ordinals_missing_data',
                'severity': 'medium',
                'location': "Документ",
                'description': "Невозможно проверить порядковые числительные: данные о параграфах отсутствуют.",
                'auto_fixable': False
            })
            return issues        # Регулярные выражения для поиска неправильно оформленных порядковых числительных
        # Находим числительные без дефиса и окончания
        no_suffix_pattern = r'\b\d+\s+(век[а-яёе]?|столети[а-яёеию]?|дн[а-яёеий]?|день|год[а-яёеы]?)\b'
        
        # Находим числительные с неправильными окончаниями 
        wrong_suffix_pattern = r'\b\d+(-[а-яё]{1,3})?\s+(год[а-я]{0,2}|век[а-я]{0,2}|столети[а-яё]{0,2}|дн[а-яё]{0,2}|месяц[а-я]{0,2})\b'
          # Находим числительные в виде сокращений с неправильным оформлением (включая "на 10 стр.")
        abbr_pattern = r'\b\d+\s+(стр?\.)'
        
        for para in document_data['paragraphs']:
            if not para or 'text' not in para or not para['text']:
                continue
            
            text = para['text']
            para_idx = para.get('index', 0)
            
            # Поиск числительных без окончаний
            matches_no_suffix = re.finditer(no_suffix_pattern, text, re.IGNORECASE)
            for match in matches_no_suffix:
                matched_text = match.group(0)
                num = re.search(r'\d+', matched_text).group(0)
                unit = re.search(r'[а-яё]+$', matched_text, re.IGNORECASE).group(0)
                
                # Определяем правильное окончание в зависимости от контекста
                suffix = self._determine_ordinal_suffix(num, unit)
                
                issues.append({
                    'type': 'ordinal_no_suffix',
                    'severity': 'medium',
                    'location': f"Параграф {para_idx + 1}",
                    'description': f"Порядковое числительное без окончания: '{matched_text}'. Правильно: '{num}-{suffix} {unit}'.",
                    'auto_fixable': True,
                    'text': matched_text,
                    'replacement': f"{num}-{suffix} {unit}"
                })
            
            # Поиск сокращений без дефиса
            matches_abbr = re.finditer(abbr_pattern, text)
            for match in matches_abbr:
                matched_text = match.group(0)
                num = re.search(r'\d+', matched_text).group(0)
                abbr = re.search(r'[а-яё]+\.', matched_text, re.IGNORECASE).group(0)
                
                # Определяем правильное окончание для сокращений
                if abbr == 'г.':  # год
                    suffix = 'м' if 'на' in matched_text.lower() else 'й'
                elif abbr == 'в.':  # век
                    suffix = 'м' if 'на' in matched_text.lower() else 'й'
                elif abbr in ['стр.', 'с.']:  # страница
                    suffix = 'й'
                else:
                    suffix = 'й'  # по умолчанию
                
                issues.append({
                    'type': 'ordinal_abbr_no_suffix',
                    'severity': 'medium',
                    'location': f"Параграф {para_idx + 1}",
                    'description': f"Сокращение без правильного окончания: '{matched_text}'. Правильно: '{num}-{suffix} {abbr}'.",                    'auto_fixable': True,
                    'text': matched_text,
                    'replacement': matched_text.replace(f"{num} {abbr}", f"{num}-{suffix} {abbr}")
                })
        
        return issues
    
    def _determine_ordinal_suffix(self, num, unit):
        """
        Определяет правильное окончание для порядкового числительного
        
        Args:
            num: Числительное в виде строки
            unit: Единица измерения или существительное
            
        Returns:
            str: Правильное окончание
        """
        last_digit = int(num[-1]) if num else 0
        
        # В зависимости от единицы измерения и контекста
        if unit.lower() in ['год', 'года', 'годы', 'лет']:
            return 'й'
        
        elif unit.lower() in ['век', 'века', 'веке', 'веков']:
            return 'м'  # "В 21-м веке"
        
        elif unit.lower() in ['день', 'дня', 'дни', 'дней']:
            return 'й'  # "на 5-й день"
                
        elif unit.lower() in ['столетие', 'столетия', 'столетий', 'столетию']:
            return 'му'  # "к 3-му столетию"
        
        else:
            # По умолчанию
            return 'й'
    
    def _check_surnames(self, document_data):
        """
        Проверяет оформление фамилий в тексте и списках
        
        Требования:
        - В тексте: А.С. Пушкин (инициалы перед фамилией)
        - В списках: Пушкин А.С. (инициалы после фамилии)
        - Не разделять инициалы и фамилию разрывом строки
        - Между инициалами не должно быть пробелов
        """
        issues = []
        
        if 'paragraphs' not in document_data:
            issues.append({
                'type': 'surnames_missing_data',
                'severity': 'medium',
                'location': 'Документ',
                'description': 'Невозможно проверить фамилии: данные о параграфах отсутствуют.',
                'auto_fixable': False
            })
            return issues
        
        # Регулярные выражения для поиска фамилий и инициалов
        # Неправильное оформление в тексте (фамилия перед инициалами)
        wrong_text_pattern = r'(?<!\sи\s)(?<![«"\'\(])([А-Я][а-я]+)\s+([А-Я])\.\s*([А-Я])\.'
        
        # Неправильное оформление инициалов (пробелы между ними)
        wrong_initials_pattern = r'([А-Я])\.\s+([А-Я])\.'
          # Неправильное оформление в списках (инициалы перед фамилией)
        wrong_list_pattern = r'(?:^\s*\d+\.\s*)?([А-Я])\.\s*([А-Я])\.\s+([А-Я][а-я]+)'
        
        for para in document_data['paragraphs']:
            if not para or 'text' not in para or not para['text']:
                continue
            
            text = para['text']
            para_idx = para.get('index', 0)
            is_bibliography = False
            
            # Определяем, является ли параграф частью списка литературы
            if 'bibliography' in document_data and para_idx in [p.get('index') for p in document_data.get('bibliography', [])]:
                is_bibliography = True
            
            # Проверка на наличие названия списка литературы
            if re.search(r'список\s+(?:использованн[ыо]й|использованной|испол[ьз]зуемой)\s+литературы', text, re.IGNORECASE):
                is_bibliography = True
            
            # Проверяем оформление фамилий в тексте (если не список литературы)
            if not is_bibliography:
                # Поиск фамилий перед инициалами в основном тексте
                matches = re.finditer(wrong_text_pattern, text)
                for match in matches:
                    surname, init1, init2 = match.groups()
                    issues.append({
                        'type': 'surname_wrong_order_in_text',
                        'severity': 'medium',
                        'location': f"Параграф {para_idx + 1}",
                        'description': f"Неправильное оформление фамилии в тексте: '{surname} {init1}.{init2}.'. Должно быть: '{init1}.{init2}. {surname}'.",
                        'auto_fixable': True,
                        'text': f"{surname} {init1}.{init2}.",
                        'replacement': f"{init1}.{init2}. {surname}"
                    })
                
                # Поиск неправильно оформленных инициалов (с пробелами)
                matches = re.finditer(wrong_initials_pattern, text)
                for match in matches:
                    init1, init2 = match.groups()
                    issues.append({
                        'type': 'surname_wrong_initials_spacing',
                        'severity': 'medium',
                        'location': f"Параграф {para_idx + 1}",
                        'description': f"Неправильное оформление инициалов: '{init1}. {init2}.'. Должно быть: '{init1}.{init2}.'.",
                        'auto_fixable': True,
                        'text': f"{init1}. {init2}.",
                        'replacement': f"{init1}.{init2}."
                    })
            
            # Проверяем оформление фамилий в списке литературы
            else:
                # Поиск инициалов перед фамилией в списке литературы
                matches = re.finditer(wrong_list_pattern, text)
                for match in matches:
                    init1, init2, surname = match.groups()
                    issues.append({
                        'type': 'surname_wrong_order_in_list',
                        'severity': 'medium',
                        'location': f"Параграф {para_idx + 1} (список литературы)",
                        'description': f"Неправильное оформление фамилии в списке: '{init1}.{init2}. {surname}'. Должно быть: '{surname} {init1}.{init2}.'.",
                        'auto_fixable': True,
                        'text': f"{init1}.{init2}. {surname}",
                        'replacement': f"{surname} {init1}.{init2}."
                    })
        
        return issues
        
    def _check_toc(self, document_data):
        """
        Проверяет оформление оглавления
        
        Требования:
        - Должны присутствовать все разделы
        - Нет абзацного отступа у элементов оглавления
        - Заголовки должны совпадать с фактическими заголовками в тексте
        """
        issues = []
        
        # Проверяем наличие данных об оглавлении
        if 'toc' not in document_data or not document_data['toc']:
            issues.append({
                'type': 'toc_missing_data',
                'severity': 'high',
                'location': 'Документ',
                'description': 'Оглавление не найдено или его структура не определена.',
                'auto_fixable': False
            })
            return issues
        
        # Проверяем наличие всех обязательных разделов в оглавлении
        toc_entries = document_data['toc']
        required_sections_lower = [s.lower() for s in self.standard_rules['required_sections']]
        
        # Проверяем присутствие всех обязательных разделов
        for req_section in self.standard_rules['required_sections']:
            found = False
            for entry in toc_entries:
                if 'title' in entry and req_section.lower() in entry['title'].lower():
                    found = True
                    break
            
            if not found:
                issues.append({
                    'type': 'toc_missing_required_section',
                    'severity': 'high',
                    'location': 'Оглавление',
                    'description': f"В оглавлении отсутствует обязательный раздел '{req_section}'.",
                    'auto_fixable': False
                })
        
        # Проверяем форматирование элементов оглавления
        for entry in toc_entries:
            if 'first_line_indent' in entry and entry['first_line_indent'] > 0:
                issues.append({
                    'type': 'toc_wrong_indent',
                    'severity': 'medium',
                    'location': f"Оглавление, элемент '{entry.get('title', 'Без названия')}'",
                    'description': "Элемент оглавления имеет абзацный отступ. Должен быть без отступа.",
                    'auto_fixable': True
                })
        
        # Проверяем соответствие оглавления фактическим заголовкам
        if 'headings' in document_data and document_data['headings']:
            headings = document_data['headings']
            
            # Создаем множества заголовков для сравнения
            toc_titles = {entry.get('title', '').lower() for entry in toc_entries if 'title' in entry}
            doc_titles = {h.get('text', '').lower() for h in headings if 'text' in h}
            
            # Находим заголовки, которые есть в документе, но отсутствуют в оглавлении
            missing_in_toc = doc_titles - toc_titles
            for title in missing_in_toc:
                issues.append({
                    'type': 'toc_missing_heading',
                    'severity': 'medium',
                    'location': 'Оглавление',
                    'description': f"Заголовок '{title}' присутствует в документе, но отсутствует в оглавлении.",
                    'auto_fixable': False
                })
            
            # Находим заголовки, которые есть в оглавлении, но отсутствуют в документе
            extra_in_toc = toc_titles - doc_titles
            for title in extra_in_toc:
                issues.append({
                    'type': 'toc_extra_heading',
                    'severity': 'medium',
                    'location': 'Оглавление',
                    'description': f"Заголовок '{title}' присутствует в оглавлении, но отсутствует в документе.",
                    'auto_fixable': False
                })
        
        return issues
    
    def _check_numbering(self, document_data):
        """
        Проверяет нумерацию таблиц, формул и иллюстраций
        
        Требования:
        - Сквозная нумерация или нумерация в пределах разделов
        - В приложениях - отдельная нумерация
        - Для таблиц формат: "Таблица X"
        - Для рисунков формат: "Рисунок X"
        - Для формул: "(X)"
        """
        issues = []
        
        # Проверяем наличие данных
        if not document_data:
            issues.append({
                'type': 'numbering_missing_data',
                'severity': 'medium',
                'location': 'Документ',
                'description': 'Невозможно проверить нумерацию: данные отсутствуют.',
                'auto_fixable': False
            })
            return issues
        
        # Проверка нумерации таблиц
        tables = document_data.get('tables', [])
        self._check_element_numbering(tables, 'table', issues)
        
        # Проверка нумерации иллюстраций (рисунков)
        images = document_data.get('images', [])
        self._check_element_numbering(images, 'image', issues)
        
        # Проверка нумерации формул
        formulas = document_data.get('formulas', [])
        self._check_element_numbering(formulas, 'formula', issues)
        
        # Проверка нумерации элементов в приложениях
        if 'appendices' in document_data and document_data['appendices']:
            appendices = document_data['appendices']
            
            for appendix in appendices:
                # Проверка таблиц в приложениях
                app_tables = appendix.get('tables', [])
                if app_tables:
                    self._check_appendix_element_numbering(app_tables, 'table', appendix.get('id', ''), issues)
                
                # Проверка иллюстраций в приложениях
                app_images = appendix.get('images', [])
                if app_images:
                    self._check_appendix_element_numbering(app_images, 'image', appendix.get('id', ''), issues)
                
                # Проверка формул в приложениях
                app_formulas = appendix.get('formulas', [])
                if app_formulas:
                    self._check_appendix_element_numbering(app_formulas, 'formula', appendix.get('id', ''), issues)
        
        return issues
    
    def _check_element_numbering(self, elements, element_type, issues):
        """
        Проверяет нумерацию элементов заданного типа
        
        Args:
            elements: Список элементов для проверки
            element_type: Тип элемента ('table', 'image', 'formula')
            issues: Список для добавления найденных проблем
        """
        if not elements:
            return
        
        # Определяем названия для типов элементов
        type_names = {
            'table': 'таблица',
            'image': 'рисунок',
            'formula': 'формула'
        }
        type_name = type_names.get(element_type, element_type)
        
        # Проверяем наличие нумерации у всех элементов
        for idx, element in enumerate(elements):
            # Проверяем наличие номера
            if 'number' not in element or not element['number']:
                issues.append({
                    'type': f'{element_type}_missing_number',
                    'severity': 'high',
                    'location': f"{type_name.capitalize()} {idx + 1}",
                    'description': f"{type_name.capitalize()} без номера. Должна быть сквозная нумерация или нумерация в пределах раздела.",
                    'auto_fixable': True
                })
                continue
            
            # Проверяем формат номера
            number = element['number']
            # Шаблон для проверки: только цифры или цифры с точкой (X или X.Y)
            if not re.match(r'^\d+(\.\d+)?$', str(number)):
                issues.append({
                    'type': f'{element_type}_wrong_number_format',
                    'severity': 'medium',
                    'location': f"{type_name.capitalize()} {number}",
                    'description': f"Неправильный формат номера {type_name}: '{number}'. Должен быть в формате 'X' или 'X.Y'.",
                    'auto_fixable': True
                })
        
        # Проверяем последовательность нумерации
        # Для сквозной нумерации
        numbers = [int(str(element.get('number', '0')).split('.')[0]) for element in elements if 'number' in element]
        if numbers:
            # Проверяем, что номера идут последовательно
            expected_numbers = list(range(min(numbers), min(numbers) + len(numbers)))
            if sorted(numbers) != expected_numbers:
                issues.append({
                    'type': f'{element_type}_non_sequential_numbering',
                    'severity': 'medium',
                    'location': f"{type_name.capitalize()}ы",
                    'description': f"Нарушена последовательность нумерации {type_name}. Номера должны идти последовательно.",
                    'auto_fixable': True
                })
    
    def _check_appendix_element_numbering(self, elements, element_type, appendix_id, issues):
        """
        Проверяет нумерацию элементов в приложениях
        
        Args:
            elements: Список элементов для проверки
            element_type: Тип элемента ('table', 'image', 'formula')
            appendix_id: Идентификатор приложения
            issues: Список для добавления найденных проблем
        """
        if not elements:
            return
        
        # Определяем названия для типов элементов
        type_names = {
            'table': 'таблица',
            'image': 'рисунок',
            'formula': 'формула'
        }
        type_name = type_names.get(element_type, element_type)
        
        # Проверяем формат нумерации в приложениях
        for idx, element in enumerate(elements):
            # Проверяем наличие номера
            if 'number' not in element or not element['number']:
                issues.append({
                    'type': f'appendix_{element_type}_missing_number',
                    'severity': 'high',
                    'location': f"Приложение {appendix_id}, {type_name} {idx + 1}",
                    'description': f"{type_name.capitalize()} в приложении без номера. Должна быть отдельная нумерация в рамках приложения.",
                    'auto_fixable': True
                })
                continue
            
            number = element['number']
            # Проверяем, что номер начинается с буквы приложения
            if not str(number).startswith(appendix_id):
                issues.append({
                    'type': f'appendix_{element_type}_wrong_number_format',
                    'severity': 'medium',
                    'location': f"Приложение {appendix_id}, {type_name} {number}",
                    'description': f"Неправильный формат номера {type_name} в приложении: '{number}'. Должен начинаться с идентификатора приложения (например, '{appendix_id}.1').",
                    'auto_fixable': True
                })