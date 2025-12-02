"""
Конфигурация Swagger/OpenAPI документации для API.
"""

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs/"
}

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "CURSA - API Нормоконтроля документов",
        "description": """
## API для проверки и автоматического исправления документов DOCX по ГОСТ

### Основные функции:
- **Загрузка и проверка документов** на соответствие нормам оформления
- **Автоматическое исправление** ошибок форматирования
- **Управление профилями** с настраиваемыми правилами

### Поддерживаемые стандарты:
- ГОСТ 7.32-2017 (Отчет о НИР)
- СТО БГПУ (локальный стандарт)
- Настраиваемые профили

### Технологии:
- python-docx для работы с документами
- lxml для глубокой XML-коррекции
- Multi-pass алгоритм исправления
        """,
        "version": "2.0.0",
        "contact": {
            "name": "CURSA Support",
            "url": "https://github.com/yourusername/cursa"
        },
        "license": {
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT"
        }
    },
    "host": "localhost:5000",
    "basePath": "/api",
    "schemes": ["http", "https"],
    "tags": [
        {
            "name": "documents",
            "description": "Операции с документами"
        },
        {
            "name": "profiles",
            "description": "Управление профилями нормоконтроля"
        },
        {
            "name": "health",
            "description": "Проверка состояния API"
        }
    ],
    "definitions": {
        "Document": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "Уникальный ID документа"},
                "filename": {"type": "string", "description": "Имя файла"},
                "status": {"type": "string", "enum": ["pending", "checked", "corrected", "error"]},
                "created_at": {"type": "string", "format": "date-time"}
            }
        },
        "CheckResult": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "enum": ["success", "error"]},
                "total_issues": {"type": "integer"},
                "high_severity": {"type": "integer"},
                "medium_severity": {"type": "integer"},
                "low_severity": {"type": "integer"},
                "issues": {
                    "type": "array",
                    "items": {"$ref": "#/definitions/Issue"}
                }
            }
        },
        "Issue": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "description": "Тип ошибки"},
                "severity": {"type": "string", "enum": ["high", "medium", "low"]},
                "description": {"type": "string"},
                "location": {"type": "string"},
                "suggestion": {"type": "string"}
            }
        },
        "CorrectionResult": {
            "type": "object",
            "properties": {
                "status": {"type": "string"},
                "corrected_file_url": {"type": "string"},
                "corrections_count": {"type": "integer"},
                "corrections": {
                    "type": "array",
                    "items": {"type": "object"}
                }
            }
        },
        "Profile": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "rules": {"type": "object"},
                "created_at": {"type": "string", "format": "date-time"}
            }
        },
        "Error": {
            "type": "object",
            "properties": {
                "error": {"type": "string"},
                "message": {"type": "string"},
                "details": {"type": "object"}
            }
        }
    }
}

# API документация для эндпоинтов
API_DOCS = {
    "upload": """
    Загрузка документа для проверки
    ---
    tags:
      - documents
    consumes:
      - multipart/form-data
    parameters:
      - name: file
        in: formData
        type: file
        required: true
        description: DOCX файл для проверки
      - name: profile_id
        in: formData
        type: string
        required: false
        description: ID профиля нормоконтроля
    responses:
      200:
        description: Результат проверки документа
        schema:
          $ref: '#/definitions/CheckResult'
      400:
        description: Ошибка валидации
        schema:
          $ref: '#/definitions/Error'
      500:
        description: Внутренняя ошибка сервера
    """,
    
    "correct": """
    Автоматическое исправление документа
    ---
    tags:
      - documents
    consumes:
      - multipart/form-data
    parameters:
      - name: file
        in: formData
        type: file
        required: true
        description: DOCX файл для исправления
      - name: profile_id
        in: formData
        type: string
        required: false
        description: ID профиля нормоконтроля
      - name: enable_xml
        in: formData
        type: boolean
        required: false
        default: true
        description: Включить глубокую XML-коррекцию
      - name: enable_multipass
        in: formData
        type: boolean
        required: false
        default: true
        description: Включить многопроходный алгоритм
    responses:
      200:
        description: Результат исправления
        schema:
          $ref: '#/definitions/CorrectionResult'
      400:
        description: Ошибка валидации
      500:
        description: Внутренняя ошибка
    """,
    
    "download": """
    Скачивание исправленного документа
    ---
    tags:
      - documents
    parameters:
      - name: filename
        in: path
        type: string
        required: true
        description: Имя файла для скачивания
    responses:
      200:
        description: DOCX файл
        schema:
          type: file
      404:
        description: Файл не найден
    """,
    
    "profiles_list": """
    Получение списка профилей
    ---
    tags:
      - profiles
    responses:
      200:
        description: Список профилей
        schema:
          type: array
          items:
            $ref: '#/definitions/Profile'
    """,
    
    "profile_get": """
    Получение профиля по ID
    ---
    tags:
      - profiles
    parameters:
      - name: profile_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: Профиль
        schema:
          $ref: '#/definitions/Profile'
      404:
        description: Профиль не найден
    """,
    
    "profile_create": """
    Создание нового профиля
    ---
    tags:
      - profiles
    consumes:
      - application/json
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
              required: true
            description:
              type: string
            rules:
              type: object
              required: true
    responses:
      201:
        description: Профиль создан
        schema:
          $ref: '#/definitions/Profile'
      400:
        description: Ошибка валидации
    """,
    
    "health": """
    Проверка состояния API
    ---
    tags:
      - health
    responses:
      200:
        description: API работает
        schema:
          type: object
          properties:
            status:
              type: string
              example: ok
            message:
              type: string
              example: API работает нормально
            version:
              type: string
              example: 2.0.0
    """
}
