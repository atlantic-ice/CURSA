# Модульная система валидации документов CURSA

## Описание

Новая модульная система валидации документов состоит из независимых валидаторов, каждый из которых отвечает за проверку определённого аспекта документа.

## Архитектура

### Компоненты

#### 1. BaseValidator (`validators/__init__.py`)

Базовый класс для всех валидаторов. Предоставляет:

- `validate()` - метод для проверки документа
- `Severity` - уровни серьезности (CRITICAL, ERROR, WARNING, INFO)
- `ValidationIssue` - класс для представления проблем
- `ValidationResult` - результат валидации

#### 2. Валидаторы

##### FontValidator

Проверяет форматирование шрифтов:

- Название шрифта (Times New Roman, Arial и т.д.)
- Размер шрифта (14pt для основного текста)
- Цвет шрифта (черный)
- Шрифты в таблицах (допускается 10-12pt)

##### MarginValidator

Проверяет поля страницы:

- Левое поле (обычно 3.0 см)
- Правое поле (обычно 1.5 см)
- Верхнее/нижнее поля (обычно 2.0 см)
- Поля колонтитулов
- Консистентность полей между секциями

##### ParagraphValidator ⭐ НОВЫЙ

Проверяет оформление параграфов:

- Абзацный отступ первой строки (1.25 см)
- Выравнивание текста (по ширине)
- Межстрочный интервал (1.5 строки)
- Интервалы до/после параграфов
- Обнаружение ручных переносов строк
- Обнаружение множественных пробелов
- Обнаружение использования табуляции

##### HeadingValidator ⭐ НОВЫЙ

Проверяет оформление заголовков:

- Форматирование структурных элементов (ВВЕДЕНИЕ, ЗАКЛЮЧЕНИЕ)
- Форматирование разделов (ГЛАВА 1, 1. НАЗВАНИЕ)
- Форматирование подразделов (1.1, 1.1.1)
- Нумерация заголовков (последовательность)
- Отсутствие переносов и подчеркиваний
- Интервалы до/после заголовков
- Запрет точки в конце заголовка
- Проверка регистра (ЗАГЛАВНЫЕ/С заглавной)

##### StructureValidator ⭐ НОВЫЙ

Проверяет структуру документа:

- Наличие обязательных разделов (Содержание, Введение, Заключение, Список литературы)
- Наличие рекомендуемых разделов (Реферат, Аннотация)
- Правильность порядка разделов
- Объем документа (минимум/максимум страниц)
- Наличие нумерации страниц
- Наличие и позиция оглавления/содержания

##### TableValidator ⭐ НОВЫЙ

Проверяет оформление таблиц:

- Наличие подписи таблицы
- Форматирование подписи (Таблица X - Название)
- Последовательность нумерации таблиц
- Размер шрифта в ячейках (10-14pt)
- Выравнивание подписи
- Наличие ссылок на таблицы в тексте

##### BibliographyValidator

Проверяет список литературы:

- Наличие раздела
- Минимальное количество источников
- Формат оформления (ГОСТ Р 7.0.5-2008)
- Актуальность источников
- Правильность библиографических ссылок в тексте

##### ImageValidator ⭐ НОВЫЙ

Проверяет оформление изображений и рисунков:

- Наличие подписей для всех изображений
- Форматирование подписей (Рисунок X - Описание)
- Последовательность нумерации рисунков
- Ссылки на рисунки в тексте
- Наличие списка рисунков (для документов с несколькими изображениями)

##### AppendixValidator ⭐ НОВЫЙ

Проверяет оформление приложений:

- Наличие приложений в документе
- Правильность нумерации (ППРИЛОЖЕНИЕ А, Б, В или 1, 2, 3)
- Наличие названия приложения
- Пъследовательность алфавитной нумерации
- Наличие ссылок на приложения в тексте

##### ImageValidator ⭐ НОВЫЙ

Проверяет оформление изображений и рисунков:

- Наличие подписей для всех изображений
- Форматирование подписей (Рисунок X - Описание)
- Последовательность нумерации рисунков
- Ссылки на рисунки в тексте
- Наличие списка рисунков (для документов с несколькими изображениями)

**Документация:** [IMAGE_VALIDATOR.md](IMAGE_VALIDATOR.md)

##### AppendixValidator ⭐ НОВЫЙ

Проверяет оформление приложений:

- Наличие приложений в документе
- Правильность нумерации (ПРИЛОЖЕНИЕ А, Б, В или 1, 2, 3)
- Наличие названия приложения
- Последовательность алфавитной нумерации
- Наличие ссылок на приложения в тексте

**Документация:** [APPENDIX_VALIDATOR.md](APPENDIX_VALIDATOR.md)

##### AdvancedFormatValidator ⭐ НОВЫЙ (Stage 4)

Проверяет расширенные правила форматирования:

- Отступы абзацев (правило 6)
- Использование табуляции (правило 7)
- Мягкие переносы (правило 12)
- Оформление источников в библиографии (правило 25)
- Правильное оформление ссылок и сносок (правило 26)

**Документация:** [ADVANCED_FORMAT_VALIDATOR.md](ADVANCED_FORMAT_VALIDATOR.md)

##### CrossReferenceValidator ⭐ НОВЫЙ (Stage 4)

Проверяет перекрестные ссылки и нумерацию разделов:

- Иерархия нумерации разделов (1, 1.1, 1.1.1) (правило 14)
- Корректность переходов между уровнями нумерации
- Существование объектов на которые ссылаются (правило 26)
- Валидность перекрестных ссылок на разделы (правило 27)

**Документация:** [CROSS_REFERENCE_VALIDATOR.md](CROSS_REFERENCE_VALIDATOR.md)

Оркестратор валидаторов:

- Запускает все валидаторы
- Агрегирует результаты
- Генерирует итоговый отчет
- Подсчитывает статистику
- Формирует рекомендации

## API Endpoints

### POST /api/validation/check

Полная проверка документа.

**Request:**

```http
POST /api/validation/check
Content-Type: multipart/form-data

file: document.docx
profile_id: gost_7_32_2017 (optional)
```

**Response:**

```json
{
  "status": "failed",
  "passed": false,
  "document": {
    "path": "/tmp/document.docx",
    "filename": "document.docx"
  },
  "profile": {
    "name": "ГОСТ 7.32-2017",
    "version": "7.32-2017"
  },
  "summary": {
    "total_issues": 15,
    "critical": 1,
    "errors": 8,
    "warnings": 5,
    "info": 1,
    "autocorrectable": 10,
    "completion_percentage": 85.0
  },
  "execution": {
    "total_time": 2.156,
    "validators_run": 3,
    "timestamp": "2026-02-24 10:30:00"
  },
  "validators": [
    {
      "validator_name": "FontValidator",
      "passed": false,
      "execution_time": 0.523,
      "statistics": {
        "total_issues": 5,
        "critical": 0,
        "errors": 3,
        "warnings": 2,
        "info": 0
      },
      "issues": [...]
    }
  ],
  "issues_by_severity": {
    "critical": [...],
    "error": [...],
    "warning": [...],
    "info": [...]
  },
  "recommendations": [
    "Размер шрифта: найдено 3 проблем(а). Установите размер шрифта 14pt",
    "Доступна автокоррекция для 10 проблем. Используйте функцию автоматического исправления."
  ]
}
```

### POST /api/validation/quick-check

Быстрая проверка (базовые метрики).

**Request:**

```http
POST /api/validation/quick-check
Content-Type: multipart/form-data

file: document.docx
```

**Response:**

```json
{
  "status": "success",
  "filename": "document.docx",
  "basic_checks": {
    "has_content": true,
    "has_sections": true,
    "has_tables": true,
    "has_images": false
  },
  "formatting": {
    "font": "Times New Roman",
    "font_size": 14,
    "line_spacing": 1.5,
    "margins": {
      "left": 3.0,
      "right": 1.5,
      "top": 2.0,
      "bottom": 2.0
    }
  },
  "statistics": {
    "sections": ["Введение", "Глава 1", "Заключение"],
    "pages_count": 25,
    "paragraphs_count": 150,
    "tables_count": 5,
    "images_count": 0,
    "headings_count": 12
  }
}
```

### GET /api/validation/validators

Список доступных валидаторов.

**Response:**

```json
{
  "status": "success",
  "validators": [
    {
      "name": "StructureValidator",
      "enabled": true,
      "class": "StructureValidator"
    },
    {
      "name": "FontValidator",
      "enabled": true,
      "class": "FontValidator"
    },
    {
      "name": "MarginValidator",
      "enabled": true,
      "class": "MarginValidator"
    },
    {
      "name": "ParagraphValidator",
      "enabled": true,
      "class": "ParagraphValidator"
    },
    {
      "name": "HeadingValidator",
      "enabled": true,
      "class": "HeadingValidator"
    },
    {
      "name": "BibliographyValidator",
      "enabled": true,
      "class": "BibliographyValidator"
    },
    {
      "name": "TableValidator",
      "enabled": true,
      "class": "TableValidator"
    },
    {
      "name": "FormulaValidator",
      "enabled": true,
      "class": "FormulaValidator"
    },
    {
      "name": "ImageValidator",
      "enabled": true,
      "class": "ImageValidator"
    },
    {
      "name": "AppendixValidator",
      "enabled": true,
      "class": "AppendixValidator"
    }
  ],
  "count": 10
}
```

### GET /api/validation/profiles

Список доступных профилей требований.

**Response:**

```json
{
  "status": "success",
  "profiles": [
    {
      "id": "gost_7_32_2017",
      "name": "Стандарт ГОСТ 7.32-2017",
      "description": "ГОСТ 7.32-2017 — Отчёт о научно-исследовательской работе",
      "version": "7.32-2017",
      "category": "gost"
    },
    {
      "id": "mgu_requirements",
      "name": "Требования МГУ",
      "description": "Требования Московского государственного университета",
      "version": "2023",
      "category": "university"
    }
  ],
  "count": 2
}
```

## Использование

### Python код

```python
from app.services.validation_engine import ValidationEngine
from docx import Document

# Загрузка профиля
profile = {
    'name': 'Custom Profile',
    'rules': {
        'font': {'name': 'Times New Roman', 'size': 14.0},
        'margins': {'left': 3.0, 'right': 1.5, 'top': 2.0, 'bottom': 2.0}
    }
}

# Создание движка валидации
engine = ValidationEngine(profile=profile)

# Валидация документа
report = engine.validate_document('document.docx')

# Вывод результатов
print(f"Статус: {report['status']}")
print(f"Найдено проблем: {report['summary']['total_issues']}")
print(f"Процент выполнения: {report['summary']['completion_percentage']}%")

# Вывод рекомендаций
for recommendation in report['recommendations']:
    print(f"- {recommendation}")
```

### Создание нового валидатора

```python
from app.services.validators import BaseValidator, ValidationResult, ValidationIssue, Severity
from typing import Dict, Any, List
import time

class HeadingValidator(BaseValidator):
    """Валидатор для проверки заголовков"""

    @property
    def name(self) -> str:
        return "HeadingValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        start_time = time.time()
        issues: List[ValidationIssue] = []

        # Проверка заголовков
        for idx, paragraph in enumerate(document.paragraphs):
            if self._is_heading(paragraph):
                # Проверка форматирования заголовка
                if not self._check_heading_format(paragraph):
                    issues.append(self._create_issue(
                        rule_id=13,
                        rule_name="Формат заголовка",
                        description="Неправильное оформление заголовка",
                        severity=Severity.ERROR,
                        location=self._format_location(paragraph_index=idx),
                        can_autocorrect=True
                    ))

        execution_time = time.time() - start_time
        return ValidationResult(
            validator_name=self.name,
            passed=len(issues) == 0,
            issues=issues,
            execution_time=execution_time
        )

# Регистрация в ValidationEngine
from app.services.validation_engine import ValidationEngine
ValidationEngine.VALIDATORS.append(HeadingValidator)
```

## Тесты

Запуск тестов:

```bash
cd backend
pytest tests/test_validators.py -v
```

Запуск с покрытием:

```bash
pytest tests/test_validators.py --cov=app/services/validators --cov-report=html
```

## Добавление новых проверок

1. Создайте класс валидатора наследуя `BaseValidator`
2. Реализуйте метод `validate()`
3. Добавьте валидатор в `ValidationEngine.VALIDATORS`
4. Напишите тесты
5. Обновите документацию

## Профили требований

Профили хранятся в `backend/profiles/*.json`.

Структура профиля:

```json
{
  "name": "Название профиля",
  "version": "1.0",
  "rules": {
    "font": {
      "name": "Times New Roman",
      "size": 14.0,
      "allowed_fonts": ["Times New Roman", "Arial"]
    },
    "margins": {
      "left": 3.0,
      "right": 1.5,
      "top": 2.0,
      "bottom": 2.0
    },
    "bibliography": {
      "min_sources": 15,
      "max_age_years": 5
    }
  },
  "validation": {
    "check_font": true,
    "check_margins": true,
    "check_bibliography": true
  }
}
```

## Производительность

- FontValidator: ~0.1-0.5с для документа 50 страниц
- MarginValidator: ~0.05-0.1с
- BibliographyValidator: ~0.2-0.5с
- Общая валидация: ~0.5-2с для документа 50 страниц

Оптимизации:

- Параллельная обработка параграфов (при необходимости)
- Кэширование настроек профиля
- Batch обработка для больших документов

## Roadmap

- [ ] Валидатор структуры документа (разделы, нумерация)
- [ ] Валидатор таблиц и изображений
- [ ] Валидатор формул
- [ ] Параллельная обработка валидаторов
- [ ] WebSocket для прогресса валидации
- [ ] Экспорт отчёта в PDF/HTML
- [ ] Интерактивный предпросмотр проблем
