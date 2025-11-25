    def _correct_first_line_indent(self, document):
        """
        Исправляет отступы первой строки (абзацный отступ)
        ВАЖНО: осторожно с таблицами!
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
            paragraph.paragraph_format.first_line_indent = Cm(self.rules.get('first_line_indent', 1.25))
            
            # Сбрасываем другие отступы, которые могут мешать
            paragraph.paragraph_format.left_indent = Cm(0)
            paragraph.paragraph_format.right_indent = Cm(0)
        
        # ОСТОРОЖНО с таблицами - минимальные изменения!
        try:
            for table in document.tables:
                for row_idx, row in enumerate(table.rows):
                    for cell in row.cells:
                        for paragraph in cell.paragraphs:
                            # Пропускаем пустые параграфы в таблицах!
                            if not paragraph.text.strip():
                                continue
                            
                            try:
                                # Для заголовков таблиц (первая строка) отступ не нужен
                                if row_idx == 0:
                                    # Только если отступ не задан явно
                                    if paragraph.paragraph_format.first_line_indent != Cm(0):
                                        paragraph.paragraph_format.first_line_indent = Cm(0)
                                else:
                                    # Для остальных строк - только если отступа нет
                                    if paragraph.paragraph_format.first_line_indent is None or paragraph.paragraph_format.first_line_indent == Cm(0):
                                        paragraph.paragraph_format.first_line_indent = Cm(self.rules.get('first_line_indent', 1.25))
                                
                                # НЕ трогаем left/right indent в таблицах!
                                # paragraph.paragraph_format.left_indent = Cm(0)
                                # paragraph.paragraph_format.right_indent = Cm(0)
                            except Exception as e:
                                print(f"Предупреждение: ошибка установки отступа в ячейке таблицы: {str(e)}")
                                continue
        except Exception as e:
            print(f"ОШИБКА при обработке отступов в таблицах: {str(e)}")
    
    def _correct_section_headings(self, document):
        """
        Улучшенная функция для форматирования заголовков разделов
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
                # КРИТИЧЕСКАЯ ПРОВЕРКА: пропускаем параграфы внутри таблиц
                if id(paragraph) in table_paragraphs:
                    continue
                
                text = paragraph.text.strip()
                
                # Пропускаем пустые параграфы
                if not text:
                    continue
                    
                try:
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
                
                except Exception as e:
                    print(f"ОШИБКА при анализе заголовка '{text[:50]}...': {str(e)}")
                    continue
            
            # Второй проход: форматируем заголовки согласно их уровню
            for i, paragraph in enumerate(document.paragraphs):
                # КРИТИЧЕСКАЯ ПРОВЕРКА: пропускаем параграфы внутри таблиц
                if id(paragraph) in table_paragraphs:
                    continue
                
                if i in heading_levels:
                    try:
                        level = heading_levels[i]
                        
                        # Применяем соответствующий стиль заголовка
                        if level == 1:
                            paragraph.style = document.styles['Heading 1']
                            # Дополнительное форматирование для Heading 1
                            paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                            paragraph.paragraph_format.space_before = Pt(12)
                            paragraph.paragraph_format.space_after = Pt(12)
                            
                            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: делаем текст заглавными буквами через runs
                            for run in paragraph.runs:
                                run.text = run.text.upper()
                        
                        elif level == 2:
                            paragraph.style = document.styles['Heading 2']
                            # Дополнительное форматирование для Heading 2
                            paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                            paragraph.paragraph_format.space_before = Pt(12)
                            paragraph.paragraph_format.space_after = Pt(6)
                            
                            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: capitalize через runs
                            # (сохраняем первое слово как есть, т.к. это может быть номер)
                            if paragraph.runs:
                                full_text = paragraph.text
                                parts = full_text.split(' ', 1)
                                if len(parts) > 1:
                                    new_text = parts[0] + ' ' + parts[1].capitalize()
                                    # Применяем к первому run
                                    for run in paragraph.runs:
                                        run.text = ''
                                    if paragraph.runs:
                                        paragraph.runs[0].text = new_text
                        
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
                        
                        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: убираем точку через runs
                        if paragraph.text.strip().endswith('.'):
                            if paragraph.runs:
                                last_run = paragraph.runs[-1]
                                last_run.text = last_run.text.rstrip('.')
                        
                        # Форматирование шрифта заголовка
                        for run in paragraph.runs:
                            run.font.name = self.rules['font']['name']
                            if level == 1:
                                run.font.size = Pt(self.rules['headings']['h1']['font_size'])
                                run.font.bold = self.rules['headings']['h1']['bold']
                            elif level == 2:
                                run.font.size = Pt(self.rules['headings']['h2']['font_size'])
                                run.font.bold = self.rules['headings']['h2']['bold']
                            else:
                                run.font.size = Pt(14)
                                run.font.bold = True
                    
                    except Exception as e:
                        print(f"ОШИБКА при форматировании заголовка '{paragraph.text[:50]}...': {str(e)}")
                        continue
        
        except Exception as e:
            print(f"КРИТИЧЕСКАЯ ОШИБКА в _correct_section_headings: {str(e)}")
            import traceback
            traceback.print_exc() 

    def _correct_images(self, document):
        """
        Исправляет подписи к рисункам
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
            
            for paragraph in document.paragraphs:
                # КРИТИЧЕСКАЯ ПРОВЕРКА: пропускаем параграфы внутри таблиц
                if id(paragraph) in table_paragraphs:
                    continue
                
                text = paragraph.text.strip()
                if not text:
                    continue
                
                try:
                    # Проверяем, является ли параграф подписью к рисунку
                    if text.lower().startswith(('рис.', 'рисунок', 'рис ')):
                        # Заменяем сокращение "рис." на полное "Рисунок"
                        if text.lower().startswith('рис.') or text.lower().startswith('рис '):
                            number_match = re.search(r'рис\.?\s*(\d+)', text.lower())
                            if number_match:
                                number = number_match.group(1)
                                text_after = text[number_match.end():].lstrip()
                                
                                # Проверяем, есть ли разделитель между номером и названием
                                if text_after.startswith('-'):
                                    text_after = text_after[1:].lstrip()
                                elif not text_after.startswith('–') and not text_after.startswith('—'):
                                    text_after = '– ' + text_after
                                
                                # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: изменяем через runs, а не paragraph.text
                                new_text = f"Рисунок {number} {text_after}"
                                
                                # Очищаем все runs и создаём один новый с правильным текстом
                                # Сохраняем форматирование первого run
                                if paragraph.runs:
                                    first_run = paragraph.runs[0]
                                    # Сохраняем форматирование
                                    font_name = first_run.font.name
                                    font_size = first_run.font.size
                                    
                                    # Очищаем все runs
                                    for run in paragraph.runs:
                                        run.text = ''
                                    
                                    # Устанавливаем новый текст в первый run
                                    paragraph.runs[0].text = new_text
                                    paragraph.runs[0].font.name = font_name
                                    if font_size:
                                        paragraph.runs[0].font.size = font_size
                        
                        # Добавляем точку в конце подписи, если её нет
                        if not paragraph.text.strip().endswith('.'):
                            if paragraph.runs:
                                last_run = paragraph.runs[-1]
                                last_run.text = last_run.text.rstrip() + '.'
                        
                        # Выравниваем подпись по центру
                        pf = paragraph.paragraph_format
                        if pf.alignment != WD_PARAGRAPH_ALIGNMENT.CENTER:
                            pf.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                        
                        # Сбрасываем отступы
                        if pf.first_line_indent != Cm(0):
                            pf.first_line_indent = Cm(0)
                        if pf.left_indent != Cm(0):
                            pf.left_indent = Cm(0)
                
                except Exception as e:
                    print(f"ОШИБКА при обработке подписи к рисунку '{text[:50]}...': {str(e)}")
                    continue
        
        except Exception as e:
            print(f"КРИТИЧЕСКАЯ ОШИБКА в _correct_images: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def _correct_paragraph_alignment(self, document):
        """
        Исправляет выравнивание параграфов
        ВАЖНО: НЕ трогаем параграфы в таблицах - они обрабатываются отдельно!
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
        Исправляет оформление таблиц с защитой структуры
        """
        try:
            for table in document.tables:
                # Сохраняем исходные свойства таблицы
                try:
                    table_alignment = table.alignment
                except:
                    table_alignment = WD_TABLE_ALIGNMENT.LEFT
                
                # Обрабатываем каждую ячейку осторожно
                for row_idx, row in enumerate(table.rows):
                    for cell_idx, cell in enumerate(row.cells):
                        # Сохраняем объединения ячеек - НЕ трогаем merged cells
                        try:
                            # Проверяем, не является ли ячейка частью объединения
                            tc = cell._element
                            tcPr = tc.get_or_add_tcPr()
                            vMerge = tcPr.find(qn('w:vMerge'))
                            hMerge = tcPr.find(qn('w:hMerge'))
                            gridSpan = tcPr.find(qn('w:gridSpan'))
                            
                            # Если ячейка объединена - минимальные изменения
                            is_merged = (vMerge is not None or hMerge is not None or gridSpan is not None)
                        except:
                            is_merged = False
                        
                        for para_idx, paragraph in enumerate(cell.paragraphs):
                            # КРИТИЧЕСКИ ВАЖНО: не удаляем пустые параграфы в таблицах!
                            # Они могут быть частью структуры
                            
                            # Применяем форматирование только к непустым параграфам
                            if paragraph.text.strip():
                                try:
                                    # Устанавливаем шрифт
                                    for run in paragraph.runs:
                                        if run.font.name != self.rules['font']['name']:
                                            run.font.name = self.rules['font']['name']
                                        if run.font.size != Pt(self.rules['font']['size']):
                                            run.font.size = Pt(self.rules['font']['size'])
                                    
                                    # Выравнивание: только если не задано явно
                                    if paragraph.paragraph_format.alignment is None or paragraph.paragraph_format.alignment == WD_PARAGRAPH_ALIGNMENT.LEFT:
                                        paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                                    
                                    # Отступ: НЕ трогаем в заголовках (первая строка) и объединённых ячейках
                                    if row_idx > 0 and not is_merged:
                                        # Проверяем, не задан ли уже отступ
                                        if paragraph.paragraph_format.first_line_indent is None or paragraph.paragraph_format.first_line_indent == Cm(0):
                                            paragraph.paragraph_format.first_line_indent = Cm(self.rules.get('first_line_indent', 1.25))
                                    elif row_idx == 0:
                                        # Для первой строки (заголовок) - явно убираем отступ
                                        paragraph.paragraph_format.first_line_indent = Cm(0)
                                    
                                    # Межстрочный интервал - аккуратно
                                    if paragraph.paragraph_format.line_spacing_rule != WD_LINE_SPACING.MULTIPLE:
                                        paragraph.paragraph_format.line_spacing = self.rules['line_spacing']
                                        paragraph.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
                                    
                                    # Убираем интервалы ДО и ПОСЛЕ только внутри ячеек
                                    paragraph.paragraph_format.space_before = Pt(0)
                                    paragraph.paragraph_format.space_after = Pt(0)
                                    
                                except Exception as e:
                                    # Логируем ошибку, но продолжаем обработку
                                    print(f"Предупреждение: ошибка форматирования параграфа в ячейке [{row_idx}][{cell_idx}]: {str(e)}")
                                    continue
                
        except Exception as e:
            print(f"ОШИБКА при исправлении таблиц: {str(e)}")
            # Не падаем, просто логируем и продолжаем
        
        # Исправляем заголовки таблиц (вне таблицы)
        try:
            for paragraph in document.paragraphs:
                text_lower = paragraph.text.strip().lower()
                if text_lower.startswith('таблица'):
                    # Форматирование заголовка таблицы
                    paragraph.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                    paragraph.paragraph_format.space_after = Pt(6)
                    paragraph.paragraph_format.space_before = Pt(12)
                    paragraph.paragraph_format.first_line_indent = Cm(0)
                    
                    # Добавляем точку в конце подписи, если её нет
                    if not paragraph.text.strip().endswith('.'):
                        paragraph.text = paragraph.text.strip() + '.'
        except Exception as e:
            print(f"ОШИБКА при исправлении заголовков таблиц: {str(e)}")
    
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
            run.font.name = self.rules['font']['name']  # Times New Roman
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
        ВАЖНО: обрабатывает только списки вне таблиц
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
                
                # Пропускаем пустые параграфы и заголовки
                if not paragraph.text.strip() or paragraph.style.name.startswith('Heading'):
                    continue
                
                try:
                    # Проверяем, является ли параграф элементом списка
                    is_list_item = False
                    list_type = None
                    
                    # Проверка на маркированный список
                    if re.match(r'^[•\-–—]\s', paragraph.text):
                        is_list_item = True
                        list_type = 'bullet'
                    
                    # Проверка на нумерованный список
                    elif re.match(r'^\d+[.)]\s', paragraph.text) or re.match(r'^[a-яa-z][.)]\s', paragraph.text, re.IGNORECASE):
                        is_list_item = True
                        list_type = 'numbered'
                    
                    # Применяем форматирование к элементам списка
                    if is_list_item:
                        pf = paragraph.paragraph_format
                        
                        # БЕЗОПАСНАЯ УСТАНОВКА: проверяем текущее значение перед изменением
                        if pf.left_indent is None or pf.left_indent != Cm(1.0):
                            pf.left_indent = Cm(1.0)
                        
                        if pf.first_line_indent is None or pf.first_line_indent != Cm(-0.5):
                            pf.first_line_indent = Cm(-0.5)  # Обратный отступ для маркера
                        
                        # Устанавливаем межстрочный интервал
                        if pf.line_spacing != self.rules['line_spacing']:
                            pf.line_spacing = self.rules['line_spacing']
                            pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
                        
                        # Выравнивание по ширине только если не установлено
                        if pf.alignment != WD_PARAGRAPH_ALIGNMENT.JUSTIFY:
                            pf.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                        
                        # Шрифт для элементов списка - БЕЗ УДАЛЕНИЯ RUNS
                        for run in paragraph.runs:
                            if run.font.name != self.rules['font']['name']:
                                run.font.name = self.rules['font']['name']
                            if run.font.size != Pt(self.rules['font']['size']):
                                run.font.size = Pt(self.rules['font']['size'])
                
                except Exception as e:
                    print(f"ОШИБКА при обработке элемента списка '{paragraph.text[:50]}...': {str(e)}")
                    continue
            
            # Дополнительно обрабатываем буквенные перечисления
            self._correct_letter_lists(document)
            
        except Exception as e:
            print(f"КРИТИЧЕСКАЯ ОШИБКА в _correct_lists: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def _correct_letter_lists(self, document):
        """
        Исправляет оформление перечислений с буквенной нумерацией
        ВАЖНО: сохраняет форматирование текста, не перезаписывает paragraph.text
        """
        try:
            # Получаем список всех параграфов внутри таблиц для исключения
            table_paragraphs = set()
            for table in document.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for para in cell.paragraphs:
                            table_paragraphs.add(id(para))
            
            # Регулярное выражение для поиска буквенных перечислений
            letter_list_pattern = r'^([а-яa-z])[)\.]\s'
            
            for paragraph in document.paragraphs:
                # КРИТИЧЕСКАЯ ПРОВЕРКА: пропускаем параграфы внутри таблиц
                if id(paragraph) in table_paragraphs:
                    continue
                
                text = paragraph.text.strip()
                
                # Пропускаем пустые параграфы и заголовки
                if not text or paragraph.style.name.startswith('Heading'):
                    continue
                
                try:
                    # Проверяем, является ли параграф элементом буквенного перечисления
                    match = re.match(letter_list_pattern, text, re.IGNORECASE)
                    if match:
                        pf = paragraph.paragraph_format
                        
                        # Форматируем перечисление - БЕЗОПАСНО
                        if pf.first_line_indent != Cm(-0.5):
                            pf.first_line_indent = Cm(-0.5)  # Обратный отступ для буквы
                        
                        if pf.left_indent != Cm(1.0):
                            pf.left_indent = Cm(1.0)  # Отступ слева для текста
                        
                        if pf.alignment != WD_PARAGRAPH_ALIGNMENT.JUSTIFY:
                            pf.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
                        
                        # Проверяем формат буквы - должен быть с закрывающей скобкой: а)
                        letter = match.group(1)
                        
                        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: НЕ ИСПОЛЬЗУЕМ paragraph.text = ...
                        # Вместо этого изменяем только первый run
                        if text[1] == '.' and len(paragraph.runs) > 0:
                            # Ищем точку в первом run и заменяем на скобку
                            first_run = paragraph.runs[0]
                            if '.' in first_run.text:
                                first_run.text = first_run.text.replace(f"{letter}.", f"{letter})", 1)
                        
                        # Восстанавливаем форматирование шрифта БЕЗ УНИЧТОЖЕНИЯ runs
                        for run in paragraph.runs:
                            if run.font.name != self.rules['font']['name']:
                                run.font.name = self.rules['font']['name']
                            if run.font.size != Pt(self.rules['font']['size']):
                                run.font.size = Pt(self.rules['font']['size'])
                
                except Exception as e:
                    print(f"ОШИБКА при обработке буквенного перечисления '{text[:50]}...': {str(e)}")
                    continue
            
            # УЛУЧШЕННАЯ ЛОГИКА многоуровневых перечислений
            self._correct_multilevel_lists(document, table_paragraphs)
            
        except Exception as e:
            print(f"КРИТИЧЕСКАЯ ОШИБКА в _correct_letter_lists: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def _correct_multilevel_lists(self, document, table_paragraphs):
        """
        Форматирует многоуровневые перечисления с правильными отступами
        """
        try:
            # Регулярные выражения для разных уровней
            level1_pattern = r'^(\d+)[)\.]\s'  # 1) или 1.
            level2_pattern = r'^([а-яa-z])[)\.]\s'  # а) или а.
            level3_pattern = r'^[•\-–—]\s'  # маркеры
            
            in_list = False
            
            for paragraph in document.paragraphs:
                # Пропускаем параграфы внутри таблиц
                if id(paragraph) in table_paragraphs:
                    continue
                
                text = paragraph.text.strip()
                
                # Пропускаем пустые параграфы и заголовки
                if not text or paragraph.style.name.startswith('Heading'):
                    in_list = False
                    continue
                
                try:
                    pf = paragraph.paragraph_format
                    
                    # Проверяем уровень списка
                    if re.match(level1_pattern, text):
                        # Начало нумерованного списка (первый уровень)
                        in_list = True
                        
                        # Форматируем первый уровень - БЕЗОПАСНО
                        if pf.first_line_indent != Cm(-0.5):
                            pf.first_line_indent = Cm(-0.5)
                        if pf.left_indent != Cm(0.5):
                            pf.left_indent = Cm(0.5)
                        
                    elif re.match(level2_pattern, text, re.IGNORECASE) and in_list:
                        # Буквенное перечисление (второй уровень)
                        
                        # Форматируем второй уровень с дополнительным отступом - БЕЗОПАСНО
                        if pf.first_line_indent != Cm(-0.5):
                            pf.first_line_indent = Cm(-0.5)
                        if pf.left_indent != Cm(1.5):
                            pf.left_indent = Cm(1.5)  # Увеличенный отступ для вложенного списка
                        
                    elif re.match(level3_pattern, text) and in_list:
                        # Маркированный список (третий уровень)
                        
                        # Форматируем третий уровень - БЕЗОПАСНО
                        if pf.first_line_indent != Cm(-0.5):
                            pf.first_line_indent = Cm(-0.5)
                        if pf.left_indent != Cm(2.5):
                            pf.left_indent = Cm(2.5)  # Еще больший отступ
                        
                    elif in_list and text:
                        # Обычный параграф между элементами списка - НЕ СБРАСЫВАЕМ in_list
                        # Проверяем, является ли это продолжением элемента списка
                        if not (re.match(level1_pattern, text) or 
                                re.match(level2_pattern, text, re.IGNORECASE) or 
                                re.match(level3_pattern, text)):
                            # Это обычный текст - конец списка только если нет отступа
                            if pf.left_indent is None or pf.left_indent < Cm(0.5):
                                in_list = False
                
                except Exception as e:
                    print(f"ОШИБКА при форматировании многоуровневого списка '{text[:50]}...': {str(e)}")
                    continue
        
        except Exception as e:
            print(f"КРИТИЧЕСКАЯ ОШИБКА в _correct_multilevel_lists: {str(e)}")
            import traceback
            traceback.print_exc() 

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
