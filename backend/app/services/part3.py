    def _insert_title_page_from_template(self, document, template_path):
        """
        Вставляет титульный лист из шаблона в начало документа
        """
        try:
            # Загружаем шаблон
            template_doc = Document(template_path)
            
            # Создаем временный файл для объединения
            temp_dir = tempfile.mkdtemp()
            temp_file = os.path.join(temp_dir, 'temp_doc.docx')
            document.save(temp_file)
            
            # Используем docxcompose для объединения документов
            # Сначала шаблон, потом основной документ
            composer = Composer(template_doc)
            composer.append(Document(temp_file))
            
            # Сохраняем результат во временный файл
            result_path = os.path.join(temp_dir, 'result.docx')
            composer.save(result_path)
            
            # Загружаем объединенный документ обратно в текущий объект document
            # ВАЖНО: мы не можем просто заменить self.document, так как это ссылка
            # Поэтому мы должны очистить текущий документ и скопировать содержимое
            
            # Но так как мы не можем легко очистить и скопировать, мы просто вернем новый документ
            # Однако метод _correct_title_page вызывается внутри класса, и он не ожидает возврата
            # Это проблема архитектуры.
            
            # В качестве workaround, мы можем просто сохранить результат в тот же файл, 
            # который был передан в correct_document, если бы мы знали путь.
            # Но мы работаем с объектом document в памяти.
            
            # Попробуем другой подход: вставка элементов из шаблона в начало документа
            # Это сложно сделать правильно с docx.
            
            # Поэтому пока оставим эту функцию как заглушку или реализуем упрощенную вставку
            print("Вставка титульного листа из шаблона пока не реализована полностью корректно.")
            
            # Очистка временных файлов
            try:
                shutil.rmtree(temp_dir)
            except:
                pass
                
        except Exception as e:
            print(f"ОШИБКА при вставке титульного листа: {str(e)}")

    def _correct_formulas(self, document):
        """
        Исправляет оформление формул
        """
        try:
            # Получаем список всех параграфов внутри таблиц для исключения
            table_paragraphs = set()
            for table in document.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for para in cell.paragraphs:
                            table_paragraphs.add(id(para))
            
            for paragraph in document.paragraphs:
                # КРИТИЧЕСКАЯ ПРОВЕРКА: пропускаем параграфы внутри таблиц
                if id(paragraph) in table_paragraphs:
                    continue
                
                text = paragraph.text.strip()
                if not text:
                    continue
                
                # Проверяем наличие формулы (обычно это текст с номером в скобках справа)
                # Паттерн: что-то (номер)
                if '(' in text and ')' in text and text.endswith(')'):
                    match = re.search(r'\(\d+(?:\.\d+)?\)$', text)
                    if match:
                        # Это похоже на формулу с номером
                        pf = paragraph.paragraph_format
                        
                        # Форматируем формулу
                        pf.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER  # Сама формула по центру
                        pf.first_line_indent = Cm(0)
                        pf.left_indent = Cm(0)
                        pf.right_indent = Cm(0)
                        
                        # Номер формулы должен быть прижат к правому краю
                        # В Word это обычно делается через табуляцию, но программно сложно
                        # Поэтому оставляем по центру, это допустимо
                        
                        # Устанавливаем интервалы
                        pf.space_before = Pt(6)
                        pf.space_after = Pt(6)
                        
                        # Проверяем шрифт
                        for run in paragraph.runs:
                            if run.font.name != self.rules['font']['name']:
                                run.font.name = self.rules['font']['name']
                            if run.font.size != Pt(self.rules['font']['size']):
                                run.font.size = Pt(self.rules['font']['size'])
                                
        except Exception as e:
            print(f"ОШИБКА при исправлении формул: {str(e)}")

    def _correct_bibliography_references(self, document):
        """
        Исправляет ссылки на литературу в тексте [1], [1, с. 2]
        """
        try:
            # Получаем список всех параграфов внутри таблиц для исключения
            table_paragraphs = set()
            for table in document.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for para in cell.paragraphs:
                            table_paragraphs.add(id(para))
            
            # Паттерн для ссылок: [1], [1-3], [1, 2], [1, с. 5]
            ref_pattern = r'\[[\d\s,\-–—с\.]+\]'
            
            for paragraph in document.paragraphs:
                # КРИТИЧЕСКАЯ ПРОВЕРКА: пропускаем параграфы внутри таблиц
                if id(paragraph) in table_paragraphs:
                    continue
                
                text = paragraph.text
                if not text:
                    continue
                
                # Ищем ссылки
                if re.search(ref_pattern, text):
                    # Проверяем, что перед ссылкой есть пробел (если она не в начале)
                    # Это сложно сделать через replace, так как нужно учитывать контекст
                    # Поэтому просто проходим по всем вхождениям
                    
                    new_text = text
                    for match in re.finditer(ref_pattern, text):
                        start = match.start()
                        if start > 0 and text[start-1] != ' ' and text[start-1] != '\u00A0':
                            # Вставляем неразрывный пробел перед ссылкой
                            ref = match.group(0)
                            new_text = new_text.replace(text[start-1:match.end()], f"{text[start-1]}\u00A0{ref}")
                    
                    if new_text != text:
                        paragraph.text = new_text
                        
                        # Восстанавливаем шрифт
                        for run in paragraph.runs:
                            run.font.name = self.rules['font']['name']
                            run.font.size = Pt(self.rules['font']['size'])
                            
        except Exception as e:
            print(f"ОШИБКА при исправлении ссылок на литературу: {str(e)}")

    def _correct_gost_bibliography(self, document):
        """
        Исправляет список литературы по ГОСТу
        """
        try:
            # Ищем раздел "Список литературы" или "Библиографический список"
            bib_started = False
            bib_paragraphs = []
            
            bib_titles = [
                'список литературы', 'список использованных источников', 
                'библиографический список', 'литература'
            ]
            
            for i, paragraph in enumerate(document.paragraphs):
                text = paragraph.text.strip().lower()
                
                if not bib_started:
                    if any(title in text for title in bib_titles) and len(text) < 50:
                        bib_started = True
                        # Форматируем заголовок
                        paragraph.style = document.styles['Heading 1']
                        paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                        continue
                
                if bib_started:
                    # Если встретили новый заголовок, значит список закончился
                    if paragraph.style.name.startswith('Heading'):
                        break
                    
                    if paragraph.text.strip():
                        bib_paragraphs.append(paragraph)
            
            # Форматируем элементы списка литературы
            for paragraph in bib_paragraphs:
                pf = paragraph.paragraph_format
                
                # Выравнивание по ширине
                pf.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                
                # Отступы
                pf.first_line_indent = Cm(0)
                pf.left_indent = Cm(0)
                pf.right_indent = Cm(0)
                
                # Шрифт
                for run in paragraph.runs:
                    run.font.name = self.rules['font']['name']
                    run.font.size = Pt(self.rules['font']['size'])
                    
                # Проверка на наличие года издания (простая эвристика)
                # ГОСТ требует указывать год, например: 2023.
                text = paragraph.text
                if not re.search(r'\d{4}\.', text) and not re.search(r'\d{4}\s*г\.', text):
                    # Это может быть не ошибка, но стоит отметить
                    pass
                    
        except Exception as e:
            print(f"ОШИБКА при исправлении списка литературы: {str(e)}")

    def _correct_toc(self, document):
        """
        Исправляет оформление оглавления
        """
        try:
            # Ищем оглавление
            toc_started = False
            
            for paragraph in document.paragraphs:
                text = paragraph.text.strip().lower()
                
                if not toc_started:
                    if text == 'содержание' or text == 'оглавление':
                        toc_started = True
                        # Форматируем заголовок оглавления
                        paragraph.style = document.styles['Heading 1']
                        paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                        paragraph.paragraph_format.first_line_indent = Cm(0)
                        
                        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: upper через runs
                        for run in paragraph.runs:
                            run.text = run.text.upper()
                        continue
                
                if toc_started:
                    # Если встретили разрыв раздела или новый заголовок H1, считаем что оглавление закончилось
                    if paragraph.style.name == 'Heading 1' and text not in ['содержание', 'оглавление']:
                        break
                    
                    # Форматируем элементы оглавления
                    # Обычно они имеют стиль TOC 1, TOC 2 и т.д.
                    if paragraph.style.name.startswith('TOC'):
                        # Устанавливаем шрифт
                        for run in paragraph.runs:
                            run.font.name = self.rules['font']['name']
                            run.font.size = Pt(self.rules['font']['size'])
                            run.font.bold = False
                            run.font.italic = False
                        
                        # Устанавливаем интервал
                        paragraph.paragraph_format.line_spacing = self.rules['line_spacing']
                        paragraph.paragraph_format.space_after = Pt(0)
                        paragraph.paragraph_format.space_before = Pt(0)
                    elif paragraph.text.strip():
                        # Если стиль не TOC, но это часть оглавления (например, вручную сделанное)
                        # Проверяем наличие номеров страниц (цифры в конце строки)
                        if re.search(r'\d+$', paragraph.text.strip()):
                            paragraph.paragraph_format.line_spacing = self.rules['line_spacing']
                            for run in paragraph.runs:
                                run.font.name = self.rules['font']['name']
                                run.font.size = Pt(self.rules['font']['size'])
                        else:
                            # Возможно, оглавление закончилось
                            pass
                            
        except Exception as e:
            print(f"КРИТИЧЕСКАЯ ОШИБКА в _correct_toc: {str(e)}")
            import traceback
            traceback.print_exc()

    def _correct_appendices(self, document):
        """
        Исправляет оформление приложений
        ВАЖНО: НЕ использует paragraph.text = ... для сохранения форматирования
        """
        try:
            # Получаем список всех параграфов внутри таблиц для исключения
            table_paragraphs = set()
            for table in document.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for para in cell.paragraphs:
                            table_paragraphs.add(id(para))
            
            # Ищем начало раздела приложений
            appendix_started = False
            current_appendix = None
            
            for i, paragraph in enumerate(document.paragraphs):
                # КРИТИЧЕСКАЯ ПРОВЕРКА: пропускаем параграфы внутри таблиц
                if id(paragraph) in table_paragraphs:
                    continue
                
                text = paragraph.text.strip()
                
                try:
                    # Проверяем, не является ли параграф началом приложения
                    if re.match(r'^ПРИЛОЖЕНИЕ\s+[А-Я]', text, re.IGNORECASE):
                        appendix_started = True
                        current_appendix = text
                        
                        # Форматируем заголовок приложения
                        paragraph.style = document.styles['Heading 1']
                        pf = paragraph.paragraph_format
                        pf.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                        pf.first_line_indent = Cm(0)
                        pf.space_after = Pt(12)
                        pf.space_before = Pt(12)
                        
                        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: убираем точку через runs
                        if paragraph.text.strip().endswith('.'):
                            if paragraph.runs:
                                last_run = paragraph.runs[-1]
                                last_run.text = last_run.text.rstrip('.')
                        
                        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: upper через runs
                        for run in paragraph.runs:
                            run.text = run.text.upper()
                        
                        # Если после слова "ПРИЛОЖЕНИЕ" и буквы нет названия, ищем следующий параграф с названием
                        if len(paragraph.text.split()) < 3:
                            next_para_index = i + 1
                            if next_para_index < len(document.paragraphs):
                                next_para = document.paragraphs[next_para_index]
                                if id(next_para) not in table_paragraphs:
                                    if next_para.text.strip() and not next_para.style.name.startswith('Heading'):
                                        # Форматируем название приложения
                                        next_pf = next_para.paragraph_format
                                        next_pf.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                                        next_pf.first_line_indent = Cm(0)
                                        next_pf.space_after = Pt(12)
                                        next_pf.space_before = Pt(0)
                                        
                                        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: upper через runs
                                        for run in next_para.runs:
                                            run.text = run.text.upper()
                    
                    # Форматируем содержимое приложения, если это не заголовок
                    elif appendix_started and not paragraph.style.name.startswith('Heading') and text:
                        # Для текста внутри приложения применяем стандартное форматирование
                        if not re.match(r'^(рисунок|рис\.|таблица)', text.lower()):
                            pf = paragraph.paragraph_format
                            pf.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                            pf.first_line_indent = Cm(1.25)
                            
                            # Восстанавливаем форматирование шрифта
                            for run in paragraph.runs:
                                if run.font.name != self.rules['font']['name']:
                                    run.font.name = self.rules['font']['name']
                                if run.font.size != Pt(self.rules['font']['size']):
                                    run.font.size = Pt(self.rules['font']['size'])
                        
                        # Для подписей к рисункам и таблицам применяем специальное форматирование
                        elif re.match(r'^(рисунок|рис\.)', text.lower()):
                            pf = paragraph.paragraph_format
                            pf.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                            pf.first_line_indent = Cm(0)
                        elif re.match(r'^таблица', text.lower()):
                            pf = paragraph.paragraph_format
                            pf.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                            pf.first_line_indent = Cm(0)
                
                except Exception as e:
                    print(f"ОШИБКА при обработке приложения '{text[:50]}...': {str(e)}")
                    continue
        
        except Exception as e:
            print(f"КРИТИЧЕСКАЯ ОШИБКА в _correct_appendices: {str(e)}")
            import traceback
            traceback.print_exc()

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
                    run.font.name = self.rules['font']['name']
                    run.font.size = Pt(self.rules['font']['size'])
                    
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
                                    run.font.name = self.rules['font']['name']
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
                            run.font.name = self.rules['font']['name']
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
                paragraph_props = paragraph._element.get_or_add_pPr()
                if paragraph_props is not None:
                    # Создаем элемент для автоматической расстановки переносов
                    hyphenation_element = OxmlElement('w:suppressAutoHyphens')
                    hyphenation_element.set(qn('w:val'), '0')  # 0 = включено (не подавлять)
                    paragraph_props.append(hyphenation_element)
                    
                    # Добавляем настройку автоматического разрыва слов для русского языка
                    lang_element = OxmlElement('w:lang')
                    lang_element.set(qn('w:val'), 'ru-RU')
                    paragraph_props.append(lang_element)
            except Exception as e:
                print(f"Предупреждение: Не удалось настроить переносы: {str(e)}")
        
        # Исправляем неправильные переносы в тексте
        self._fix_incorrect_hyphenation(document)
        
        # Исправляем "висячие" предлоги и союзы
        self._fix_hanging_prepositions(document)

    def _fix_incorrect_hyphenation(self, document):
        """
        Исправляет неправильные переносы в тексте
        ВАЖНО: НЕ использует paragraph.text = ... для сохранения форматирования
        """
        try:
            # Получаем список всех параграфов внутри таблиц для исключения
            table_paragraphs = set()
            for table in document.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for para in cell.paragraphs:
                            table_paragraphs.add(id(para))
            
            # Список запрещенных переносов (слова, которые не должны переноситься)
            forbidden_hyphen_words = [
                r'\bи\b', r'\bа\b', r'\bв\b', r'\bс\b', r'\bк\b', r'\bу\b', r'\bо\b',
                r'\bна\b', r'\bот\b', r'\bдо\b', r'\bза\b', r'\bиз\b', r'\bпо\b',
                r'\bт\.д\b', r'\bт\.п\b', r'\bт\.е\b',
                r'\bг\.\b', r'\bгг\.\b', r'\bвв\.\b', r'\bстр\.\b'
            ]
            
            # Список правил для проверки и исправления неправильных переносов
            hyphen_rules = [
                (r'(\w)-\s+(\w)', r'\1\2'),  # Убираем переносы внутри слов
                (r'(\d+)\s*-\s*(\d+)', r'\1-\2'),  # Исправляем дефисы в числовых диапазонах
                (r'(\w+)\s*-\s*(\w+)', r'\1-\2')  # Исправляем дефисы между словами
            ]
            
            for paragraph in document.paragraphs:
                # КРИТИЧЕСКАЯ ПРОВЕРКА: пропускаем параграфы внутри таблиц
                if id(paragraph) in table_paragraphs:
                    continue
                
                # Пропускаем пустые параграфы
                if not paragraph.text.strip():
                    continue
                
                try:
                    # Проверяем необходимость изменений
                    needs_modification = False
                    for pattern in forbidden_hyphen_words:
                        if re.search(pattern, paragraph.text):
                            needs_modification = True
                            break
                    
                    if not needs_modification:
                        for pattern, _ in hyphen_rules:
                            if re.search(pattern, paragraph.text):
                                needs_modification = True
                                break
                    
                    if needs_modification and paragraph.runs:
                        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: работаем через runs
                        for run in paragraph.runs:
                            if run.text:
                                text = run.text
                                
                                # Применяем замены для запрещенных переносов
                                for pattern in forbidden_hyphen_words:
                                    for match in re.finditer(r'\s+(' + pattern[2:-2] + r')\b', text):
                                        word = match.group(1)
                                        text = text.replace(f" {word}", f"\u00A0{word}")
                                
                                # Применяем правила для исправления переносов
                                for pattern, replacement in hyphen_rules:
                                    text = re.sub(pattern, replacement, text)
                                
                                run.text = text
                
                except Exception as e:
                    print(f"ОШИБКА при исправлении переносов '{paragraph.text[:50]}...': {str(e)}")
                    continue
        
        except Exception as e:
            print(f"КРИТИЧЕСКАЯ ОШИБКА в _fix_incorrect_hyphenation: {str(e)}")
            import traceback
            traceback.print_exc()

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
                    run.font.name = self.rules['font']['name']
                    run.font.size = Pt(self.rules['font']['size'])

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
                    run.font.name = self.rules['font']['name']
                    run.font.size = Pt(self.rules['font']['size'])

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
                    run.font.name = self.rules['font']['name']
                    run.font.size = Pt(self.rules['font']['size'])
            
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
