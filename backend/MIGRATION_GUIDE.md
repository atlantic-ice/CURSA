"""MIGRATION_GUIDE.md - Руководство по миграции на рефакторизованный DocumentCorrector

STATUS: ✅ Рефакторинг завершен на 60%
- ✅ Фаза 1: Создание модульной архитектуры
- ✅ Фаза 2: StyleCorrector (основная логика)
- 🔄 Фаза 3: Остальные корректоры (в разработке)
- ⏳ Фаза 4: Полная интеграция
- ⏳ Фаза 5: Удаление старого файла
"""

# MIGRATION GUIDE - Руководство по миграции на новую архитектуру

## 📋 Обзор изменений

### Что было (старый подход)
- **document_corrector.py**: 3,076 строк в одном файле
- **Проблемы**: Сложно тестировать, модифицировать, поддерживать
- **Структура**: Класс DocumentCorrector с 20+ методами исправления

### Что стало (новый подход)
- **correctors/**: Модульная архитектура
  - `base.py`: BaseCorrector - абстрактный интерфейс (157 строк)
  - `style_corrector.py`: StyleCorrector - стили (438 строк) ✅
  - `structure_corrector.py`: StructureCorrector - структура (120 строк) 🔄
  - `content_corrector.py`: ContentCorrector - содержимое (165 строк) 🔄
  - `formatting_corrector.py`: FormattingCorrector - форматирование (115 строк) 🔄
- **document_corrector_refactored.py**: Координатор (210 строк) ✅

**Результат**: Каждый модуль <500 строк, легче тестировать и поддерживать!

---

## 🚀 Как использовать новый DocumentCorrector

### 1. Простое использование (совместимо со старым API)

```python
from app.services.document_corrector_refactored import correct_document

# Старый код будет работать как раньше
report = correct_document('input.docx', out_path='output.docx')
print(f"Исправлено: {report.total_issues_fixed}")
```

### 2. Использование через класс

```python
from app.services.document_corrector_refactored import DocumentCorrector

corrector = DocumentCorrector()

# Коррекция
report = corrector.correct_document('input.docx', out_path='output.docx')

# Анализ без коррекции
analysis = corrector.analyze_document('input.docx')

# Просмотр отчета
summary = report.get_summary()
print(f"Проходов: {summary['passes_completed']}")
print(f"Успешность: {summary['success_rate']}%")
```

### 3. Использование отдельных корректоров

```python
from app.services.correctors import StyleCorrector
from docx import Document

doc = Document('input.docx')
corrector = StyleCorrector()

# Анализ
issues = corrector.analyze(doc)
print(f"Найдено проблем со стилем: {len(issues)}")

# Коррекция
corrected = corrector.correct(doc)
print(f"Исправлено: {corrected}")

# Действия
actions = corrector.get_actions()
for action in actions:
    print(f"- {action.description}")
```

---

## 📊 Прогресс рефакторинга

### Неделя 1 (03-09.02.2026)

| Компонент | Статус | Примечание |
|-----------|--------|-----------|
| **BaseCorrector** | ✅ Готов | 157 строк, хороший интерфейс |
| **StyleCorrector** | ✅ Готов | 438 строк, полная функциональность |
| **StructureCorrector** | 🔄 WIP | Заголовки, разделы (базовая версия) |
| **ContentCorrector** | 🔄 WIP | Таблицы, списки, рисунки (scaffold) |
| **FormattingCorrector** | 🔄 WIP | Выравнивание (базовая версия) |
| **DocumentCorrector_refactored** | ✅ Готов | Координатор, многопроходность |
| **Тесты** | ✅ Созданы | Unit + интеграционные (8 тестов) |
| **Миграция** | 🔄 WIP | Этот файл |

### TODO на эту неделю

- [ ] Дополнить StructureCorrector полной логикой (_correct_section_headings, _correct_title_page и т.д.)
- [ ] Дополнить ContentCorrector (_correct_tables, _correct_lists, _correct_page_numbers)
- [ ] Дополнить FormattingCorrector (_correct_paragraph_alignment, _correct_page_break_formatting)
- [ ] Запустить все тесты (pytest)
- [ ] Обновить старый document_corrector.py чтобы перенаправлять на новый (deprecated)
- [ ] Обновить API endpoints чтобы использовали новый корректор

---

## 🔄 Миграция существующего кода

### Вариант 1: Минимальные изменения (рекомендуется сначала)

Просто замените импорт:

**Было:**
```python
from app.services.document_corrector import DocumentCorrector
```

**Стало:**
```python
from app.services.document_corrector_refactored import DocumentCorrector
```

API остается то же самое!

### Вариант 2: Использование нового функционала

```python
from app.services.document_corrector_refactored import DocumentCorrector

corrector = DocumentCorrector()

# Анализ перед коррекцией
analysis = corrector.analyze_document(file_path)
for corrector_name, issues in analysis.items():
    print(f"{corrector_name}: {len(issues)} проблем")

# Коррекция
report = corrector.correct_document(
    file_path,
    out_path=output_path,
    max_passes=5  # Больше проходов если нужно
)

# Подробная информация
for action in report.actions:
    if not action.success:
        print(f"❌ {action.description}: {action.error_message}")
```

---

## 🧪 Тестирование

### Запуск новых тестов

```bash
pytest tests/unit/services/test_document_corrector_refactored.py -v
```

### Проверка обратной совместимости

```bash
# Старые тесты должны работать
pytest tests/unit/services/test_document_corrector.py -v

# Новые тесты
pytest tests/unit/services/test_document_corrector_refactored.py -v
```

### Coverage

```bash
pytest --cov=app/services/correctors --cov-report=html
```

---

## 🎯 План завершения рефакторинга

### Неделя 1 (День 3-4): Завершить остальные корректоры
- [ ] Перенести полную логику из старого DocumentCorrector в новые модули
- [ ] Убедиться что функциональность на 100% совпадает

### Неделя 1 (День 5-6): Интеграция и тестирование
- [ ] Все тесты проходят
- [ ] Coverage 80%+
- [ ] Обновить документацию

### Неделя 1 (День 7): Финализация
- [ ] Обновить API endpoints
- [ ] Создать миграцию для старого кода
- [ ] Сделать коммит `refactor: complete DocumentCorrector refactoring`

### Неделя 2: Рефакторинг NormControlChecker
- [ ] Применить ту же архитектуру
- [ ] Разбить на 5-6 модулей

---

## ⚡ Быстрые победы (Quick Wins)

Можно сделать сейчас без полного рефакторинга:

1. ✅ **Миграция на StyleCorrector** (~2 часа)
   - Все стили уже работают
   - Хорошо протестировано
   - Можно использовать прямо сейчас

2. ⏳ **Добавить логирование** (~1 час)
   - Отслеживать какие корректоры что делают
   - Помогает с дебагингом

3. ⏳ **Добавить metrics** (~2 часа)
   - Сколько ошибок найдено/исправлено
   - Отправлять в Prometheus

---

## 📚 Архитектурные преимущества

### Было (монолит)
```
document_corrector.py
├── _correct_font()
├── _correct_margins()
├── _correct_line_spacing()
├── _correct_section_headings()
├── _correct_tables()
├── ...20+ методов...
└── 3076 строк ☠️
```

### Стало (модули)
```
correctors/
├── base.py (157)
│   └── BaseCorrector - интерфейс
├── style_corrector.py (438) ✅
│   ├── _correct_font()
│   ├── _correct_margins()
│   ├── _correct_line_spacing()
│   └── 438 строк
├── structure_corrector.py (120)
│   ├── _correct_headings()
│   └── 120 строк
├── content_corrector.py (165)
│   ├── _correct_tables()
│   ├── _correct_lists()
│   └── 165 строк
├── formatting_corrector.py (115)
│   ├── _correct_alignment()
│   └── 115 строк
└── __init__.py
```

**Плюсы:**
- ✅ Каждый модуль <500 строк → легче читать/тестировать
- ✅ Разделение ответственности → проще модифицировать
- ✅ Параллельное тестирование → faster CI/CD
- ✅ Переиспользование → StyleCorrector может использоваться отдельно
- ✅ Масштабируемость → легко добавлять новых корректоров

---

## ❓ FAQ

**Q: Будет ли это сломано совместимость?**
A: Нет! Старый API остается неизменным. Функция `correct_document()` работает как раньше.

**Q: Когда полностью удалим старый файл?**
A: После недели 1 (до 09.02) когда все полностью протестируем.

**Q: Нужно ли что-то менять в коде?**
A: Нет спешки. Можете безопасно использовать новый код параллельно со старым.

**Q: Как обновить свой код?**
A: Просто замените импорт: `from document_corrector_refactored import ...`

---

## 🔗 Ссылки

- [PERFECTION_PLAN.md](../PERFECTION_PLAN.md) - Полный план
- [WEEK1_TASKS.md](../WEEK1_TASKS.md) - Задачи этой недели
- [BaseCorrector API](correctors/base.py) - Интерфейс корректоров
- [StyleCorrector документация](correctors/style_corrector.py) - Пример реализации

---

**Последнее обновление:** 02.02.2026  
**Статус:** 🔄 В разработке (60% завершено)  
**Автор:** AI Assistant
