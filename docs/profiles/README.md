# Модуль конфигураций стандартов нормоконтроля

## Обзор

Модуль профилей позволяет настраивать правила проверки документов под различные стандарты оформления:
- ГОСТ 7.32-2017 (базовый профиль)
- Локальные требования вузов (МГУ, ВШЭ, СПбГУ, МГТУ, МФТИ и др.)
- Пользовательские профили

## Структура профиля

```json
{
    "name": "Название профиля",
    "description": "Описание профиля",
    "extends": "parent_profile_id",  // Опционально: наследование от другого профиля
    "rules": {
        "font": {
            "name": "Times New Roman",
            "size": 14.0,
            "color": "000000"
        },
        "margins": {
            "left": 3.0,
            "right": 1.5,
            "top": 2.0,
            "bottom": 2.0
        },
        "line_spacing": 1.5,
        "first_line_indent": 1.25,
        "paragraph_alignment": "JUSTIFY",
        "headings": {
            "h1": {
                "font_size": 14.0,
                "bold": true,
                "alignment": "CENTER",
                "all_caps": true,
                "space_before": 0,
                "space_after": 12
            },
            "h2": { ... },
            "h3": { ... }
        },
        "tables": {
            "font_size": 12.0,
            "alignment": "LEFT",
            "line_spacing": 1.0
        },
        "captions": {
            "font_size": 12.0,
            "alignment": "CENTER",
            "separator": " – "
        },
        "lists": {
            "font_size": 14.0,
            "left_indent": 1.25
        },
        "footnotes": {
            "font_size": 10.0,
            "line_spacing": 1.0
        },
        "required_sections": [
            "введение",
            "заключение",
            "список литературы"
        ]
    },
    "bibliography": {
        "min_sources": 20,
        "patterns": { ... },
        "messages": { ... }
    }
}
```

## API Endpoints

### Основные операции

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/profiles/` | Список всех профилей |
| GET | `/api/profiles/{id}` | Получить профиль |
| GET | `/api/profiles/{id}/resolved` | Профиль с применённым наследованием |
| GET | `/api/profiles/{id}/inheritance` | Цепочка наследования |
| POST | `/api/profiles/` | Создать профиль |
| PUT | `/api/profiles/{id}` | Обновить профиль |
| DELETE | `/api/profiles/{id}` | Удалить профиль |
| POST | `/api/profiles/{id}/duplicate` | Дублировать профиль |

### Импорт/Экспорт

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/profiles/{id}/export` | Экспорт профиля в JSON |
| GET | `/api/profiles/{id}/export?resolve=true` | Экспорт с применённым наследованием |
| POST | `/api/profiles/import` | Импорт профиля из JSON |
| GET | `/api/profiles/export-all` | Экспорт всех профилей (бэкап) |
| POST | `/api/profiles/import-all` | Импорт из бэкапа |

### Схема

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/profiles/schema` | JSON Schema для валидации |

## Наследование профилей

Профили поддерживают наследование через поле `extends`. Это позволяет создавать локальные профили, которые переопределяют только отличающиеся параметры.

### Пример

**Базовый профиль (МГУ):**
```json
{
    "name": "МГУ",
    "rules": {
        "font": { "name": "Times New Roman", "size": 14 },
        "margins": { "left": 3.0, "right": 1.5, "top": 2.0, "bottom": 2.0 }
    }
}
```

**Профиль кафедры (наследует от МГУ):**
```json
{
    "name": "Кафедра информатики МГУ",
    "extends": "mgu_requirements",
    "rules": {
        "code_listings": {
            "font_name": "JetBrains Mono",
            "font_size": 11.0
        },
        "required_sections": [
            "введение",
            "архитектура системы",
            "реализация",
            "тестирование",
            "заключение"
        ]
    }
}
```

При проверке документа с профилем "Кафедра информатики МГУ":
- Используются настройки шрифта и полей из МГУ
- Добавляются требования к листингам кода
- Заменяются обязательные разделы

### Ограничения наследования

- Максимальная глубина: 10 уровней
- Защита от циклических зависимостей
- Системные профили (`default_gost`) нельзя изменять

## Предустановленные профили

| ID | Название | Описание |
|----|----------|----------|
| `default_gost` | ГОСТ 7.32-2017 | Базовый профиль (системный) |
| `mgu_requirements` | МГУ им. Ломоносова | Требования МГУ |
| `hse_requirements` | НИУ ВШЭ | Требования Высшей школы экономики |
| `spbgu_requirements` | СПбГУ | Требования Санкт-Петербургского университета |
| `bmstu_requirements` | МГТУ им. Баумана | Требования для технических работ |
| `mipt_requirements` | МФТИ | Требования физтеха |
| `mgu_informatics` | Кафедра информатики МГУ | Пример профиля с наследованием |

## Использование в коде

### Python (Backend)

```python
from app.api.profile_routes import load_profile_with_inheritance
from app.services.norm_control_checker import NormControlChecker

# Загрузка профиля с наследованием
profile_data = load_profile_with_inheritance('mgu_informatics')

# Создание checker с профилем
checker = NormControlChecker(profile_data=profile_data)

# Проверка документа
results = checker.check_document(document_data)
```

### JavaScript (Frontend)

```javascript
import axios from 'axios';

// Загрузка списка профилей
const profiles = await axios.get('/api/profiles/');

// Загрузка профиля с наследованием
const resolved = await axios.get('/api/profiles/mgu_informatics/resolved');

// Загрузка документа с профилем
const formData = new FormData();
formData.append('file', file);
formData.append('profile_id', 'mgu_informatics');
const result = await axios.post('/api/document/upload', formData);
```

## Валидация профилей

При создании/обновлении профиля проверяются:

1. **Обязательные поля верхнего уровня:**
   - `name` (строка)
   - `rules` (объект)

2. **Обязательные разделы в rules:**
   - `font` (объект с `name`, `size`)
   - `margins` (объект с `left`, `right`, `top`, `bottom`)
   - `line_spacing` (число > 0)

3. **При наследовании:**
   - Родительский профиль должен существовать
   - Нет циклических зависимостей

## Резервное копирование

При удалении профиля автоматически создаётся резервная копия в директории `backend/profiles/.backup/`.

Для полного бэкапа используйте endpoint `/api/profiles/export-all`.
