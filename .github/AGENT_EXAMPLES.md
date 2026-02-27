# Примеры работы с автономным агентом

Реальные примеры того, как агент решает задачи без вашего вмешательства.

## Пример 1: Добавление новой функции

### Ваш запрос:
```
Добавь функцию проверки оформления списка литературы по ГОСТ
```

### Что делает агент (автоматически):

1. **Анализирует требования:**
   - Изучает ГОСТ 7.0.5-2008
   - Проверяет существующие профили
   - Определяет что нужно проверять

2. **Реализует функциональность:**
```python
# backend/app/services/validators/bibliography_validator.py
from typing import List
from app.models.validation_error import ValidationError

class BibliographyValidator:
    """
    Валидатор оформления списка литературы по ГОСТ 7.0.5-2008.
    """

    def validate(self, document) -> List[ValidationError]:
        """
        Проверка оформления библиографии.

        Args:
            document: Документ для проверки

        Returns:
            Список найденных ошибок
        """
        errors = []

        # Логика проверки
        # ...

        return errors
```

3. **Пишет тесты:**
```python
# backend/tests/test_bibliography_validator.py
import pytest
from app.services.validators.bibliography_validator import BibliographyValidator

def test_valid_bibliography():
    """Тест корректно оформленной библиографии"""
    validator = BibliographyValidator()
    result = validator.validate(valid_document)
    assert len(result) == 0

def test_invalid_author_format():
    """Тест неверного формата автора"""
    validator = BibliographyValidator()
    result = validator.validate(invalid_author_document)
    assert len(result) == 1
    assert "author" in result[0].message.lower()

# ... ещё 10 тестов для edge cases
```

4. **Обновляет документацию:**
```markdown
# docs/validators.md

## BibliographyValidator

Проверяет оформление списка литературы по ГОСТ 7.0.5-2008.

Проверки:
- Формат автора
- Порядок элементов
- Знаки препинания
- Нумерация
```

5. **Сообщает результат:**
```
✅ Добавлена проверка оформления списка литературы

Реализовано:
- BibliographyValidator с поддержкой ГОСТ 7.0.5-2008
- Проверка формата авторов, названий, издательств
- 12 unit тестов (включая edge cases)
- Интеграция с существующими профилями
- Документация в docs/validators.md

Все 143 теста проходят успешно.

Далее: добавить автокоррекцию оформления библиографии, поддержка зарубежных источников
```

---

## Пример 2: Исправление бага

### Ваш запрос:
```
При загрузке пустого DOCX файла приложение падает
```

### Что делает агент:

1. **Воспроизводит проблему:**
   - Создаёт пустой test.docx
   - Запускает код
   - Получает traceback

2. **Находит root cause:**
```python
# Проблема в backend/app/services/document_parser.py
def parse_document(file_path):
    doc = Document(file_path)
    # ❌ Падает если doc.paragraphs пустой
    first_paragraph = doc.paragraphs[0]
```

3. **Исправляет:**
```python
def parse_document(file_path: str) -> DocumentData:
    """
    Парсинг DOCX документа.

    Args:
        file_path: Путь к файлу

    Returns:
        Распарсенные данные

    Raises:
        ValueError: Если документ пустой
    """
    doc = Document(file_path)

    # ✅ Проверка на пустой документ
    if not doc.paragraphs:
        logger.warning(f"Empty document: {file_path}")
        raise ValueError("Document is empty")

    first_paragraph = doc.paragraphs[0]
    # ... остальная логика
```

4. **Добавляет regression test:**
```python
def test_empty_document():
    """
    Regression test для бага с пустым документом.
    Проверяет что корректно обрабатывается пустой DOCX.
    """
    empty_doc_path = create_empty_docx()  # helper

    with pytest.raises(ValueError, match="Document is empty"):
        parse_document(empty_doc_path)
```

5. **Проверяет похожие места:**
   - Находит аналогичную проблему в `parse_tables()`
   - Исправляет превентивно
   - Добавляет тест

6. **Сообщает:**
```
✅ Исправлен баг с обработкой пустых документов

Изменения:
- Добавлена валидация пустого документа в parse_document()
- Добавлена валидация в parse_tables() (превентивно)
- Улучшено логирование
- 2 regression теста
- Обновлена документация

Дополнительно исправлено:
- Аналогичная проблема в parse_tables()
- Отсутствовала обработка DocumentError

Все 145 тестов проходят.
```

---

## Пример 3: Оптимизация производительности

### Ваш запрос:
```
Загрузка больших документов (>50 страниц) занимает слишком много времени
```

### Что делает агент:

1. **Профилирует код:**
```python
# Запускает профилировщик
import cProfile
profiler = cProfile.Profile()
profiler.enable()
process_large_document()
profiler.disable()

# Находит узкое место:
# validate_formatting() вызывается N раз для каждого параграфа
```

2. **Оптимизирует:**

**Было:**
```python
def validate_document(doc):
    for paragraph in doc.paragraphs:
        # ❌ Каждый раз создаётся новый validator
        validator = FormattingValidator()
        errors = validator.validate(paragraph)
```

**Стало:**
```python
def validate_document(doc):
    # ✅ Validator создаётся один раз
    validator = FormattingValidator()

    # ✅ Batch обработка параграфов
    paragraphs_batch = []
    for paragraph in doc.paragraphs:
        paragraphs_batch.append(paragraph)

        if len(paragraphs_batch) >= 100:
            errors = validator.validate_batch(paragraphs_batch)
            paragraphs_batch = []
```

3. **Добавляет кэширование:**
```python
from functools import lru_cache

class FormattingValidator:
    @lru_cache(maxsize=1000)
    def get_font_requirements(self, profile_name: str):
        """Кэширование требований профиля"""
        return load_profile(profile_name)
```

4. **Добавляет прогресс-бар:**
```python
from tqdm import tqdm

def validate_document(doc):
    validator = FormattingValidator()

    for paragraph in tqdm(doc.paragraphs, desc="Validating"):
        errors = validator.validate(paragraph)
```

5. **Измеряет улучшение:**
```python
# Добавляет benchmark тест
def test_large_document_performance():
    """Тест производительности на большом документе"""
    large_doc = create_test_document(pages=100)

    start = time.time()
    validate_document(large_doc)
    duration = time.time() - start

    # До оптимизации: ~45 секунд
    # После: <10 секунд
    assert duration < 10, f"Too slow: {duration}s"
```

6. **Сообщает:**
```
✅ Оптимизирована обработка больших документов

Улучшения:
- Batch обработка параграфов (100 за раз)
- Кэширование требований профилей (lru_cache)
- Оптимизация создания validators (создаётся 1 раз)
- Добавлен прогресс-бар для UX

Результаты:
- Документ 50 страниц: 45s → 8s (5.6x быстрее)
- Документ 100 страниц: 95s → 15s (6.3x быстрее)
- Использование памяти: -30%

Добавлен benchmark тест для мониторинга производительности.

Далее: добавить параллельную обработку через multiprocessing, оптимизировать работу с таблицами
```

---

## Пример 4: Сложная задача

### Ваш запрос:
```
Реализуй автокоррекцию найденных ошибок форматирования
```

### Что делает агент:

Это сложная задача, агент разбивает на этапы:

1. **План (внутренний, не показывает):**
   - Создать corrector service
   - Реализовать коррекцию для каждого типа ошибок
   - Добавить API endpoint
   - Создать UI кнопку
   - Написать тесты
   - Документировать

2. **Реализует поэтапно:**

**Этап 1: Backend service**
```python
# backend/app/services/corrector.py
class DocumentCorrector:
    def correct(self, document, errors):
        """Автоматическое исправление ошибок"""
        # ...
```

**Этап 2: API endpoint**
```python
# backend/app/api/routes.py
@app.route('/api/correct', methods=['POST'])
def correct_document():
    # ...
```

**Этап 3: Frontend**
```typescript
// frontend/src/components/CorrectButton.tsx
export const CorrectButton: FC = () => {
  // ...
};
```

**Этап 4: Тесты (все уровни)**
```python
# Unit, integration, E2E тесты
```

3. **Сообщает:**
```
✅ Реализована автокоррекция ошибок форматирования

Полный функционал:
Backend:
- DocumentCorrector service с поддержкой 15 типов коррекций
- API endpoint POST /api/correct
- Обработка ошибок и валидация
- 25 unit тестов, 8 integration тестов

Frontend:
- Кнопка "Автоисправление" в UI
- Прогресс-бар при коррекции
- Отображение результатов (что исправлено)
- 12 component тестов

Поддерживаемые коррекции:
✓ Шрифт и размер
✓ Отступы и интервалы
✓ Поля страницы
✓ Нумерация
✓ Оформление заголовков
✓ ... и ещё 10 типов

Документация обновлена, все 178 тестов проходят.

Далее: добавить предпросмотр изменений перед применением, undo/redo для коррекций, экспорт отчёта об исправлениях
```

---

## Ключевые особенности работы агента

### ✅ Делает автоматически:
- Принимает технические решения
- Выбирает лучшие практики
- Пишет код + тесты + документацию
- Исправляет найденные баги
- Предлагает улучшения

### ❌ НЕ спрашивает:
- "Добавить ли тест?"
- "Какой подход использовать?"
- "Стоит ли исправить это?"
- "Продолжить ли?"

### 📊 Всегда включает:
- Типизация (type hints, TypeScript types)
- Обработка ошибок (try-except, validation)
- Логирование (для отладки)
- Тесты (unit + integration)
- Документация (docstrings, комментарии)

---

Просто ставьте задачи - агент сделает всё остальное! 🚀
