# ГЛАВА 2. ПРОЕКТНАЯ ЧАСТЬ

## 2.1. Архитектура программного комплекса

### 2.1.1. Общее описание архитектуры

Программный комплекс CURSA построен на основе **клиент-серверной архитектуры** с разделением на frontend (клиентскую часть) и backend (серверную часть). Данный подход обеспечивает независимое масштабирование компонентов, возможность работы с любого устройства с веб-браузером, а также централизованное управление бизнес-логикой и данными.

Система реализована в соответствии с принципами **многоуровневой архитектуры** (multi-tier architecture), что обеспечивает:

- Разделение представления, бизнес-логики и доступа к данным
- Возможность независимой разработки и тестирования компонентов
- Лёгкость внесения изменений в отдельные слои без влияния на остальные
- Повторное использование компонентов

На рисунке 2.1 представлена общая архитектура программного комплекса.

```
┌─────────────────────────────────────────────────────────────────┐
│                        КЛИЕНТ (BROWSER)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    FRONTEND (React)                        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │  │
│  │  │ Upload  │  │ Report  │  │Dashboard│  │  Profiles   │  │  │
│  │  │  Page   │  │  Page   │  │  Page   │  │    Page     │  │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘  │  │
│  │       └────────────┴────────────┴───────────────┘          │  │
│  │                         │                                   │  │
│  │                    React Context                            │  │
│  │                    (Auth, Theme)                            │  │
│  └─────────────────────────┬───────────────────────────────────┘  │
│                            │ HTTP/REST API                       │
└────────────────────────────┼──────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────┐
│                       СЕРВЕР                                      │
│  ┌─────────────────────────┴───────────────────────────────────┐  │
│  │                    BACKEND (Flask)                          │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │                  API LAYER                              ││  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ││  │
│  │  │  │  Auth    │ │Document  │ │ Profile  │ │  Admin   │ ││  │
│  │  │  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │ ││  │
│  │  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ ││  │
│  │  └───────┼───────────┼─────────────┼────────────┼────────┘│  │
│  │          │           │             │            │          │  │
│  │  ┌───────┴───────────┴─────────────┴────────────┴────────┐│  │
│  │  │              BUSINESS LOGIC LAYER                      ││  │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐  ││  │
│  │  │  │Validation │  │Correction  │  │  Profile       │  ││  │
│  │  │  │  Engine   │  │  Service   │  │  Manager       │  ││  │
│  │  │  └─────┬──────┘  └─────┬──────┘  └───────┬───────┘  ││  │
│  │  │        │               │                  │          ││  │
│  │  │  ┌─────┴───────────────┴──────────────────┴───────┐  ││  │
│  │  │  │              VALIDATORS                        │  ││  │
│  │  │  │ Font │ Margin │ Paragraph │ Heading │ Table │...│  ││  │
│  │  │  └─────────────────────────────────────────────────┘  ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  │                            │                               │  │
│  │  ┌─────────────────────────┴─────────────────────────────┐│  │
│  │  │                  DATA ACCESS LAYER                     ││  │
│  │  │  ┌────────────┐  ┌────────────┐  ┌───────────────┐  ││  │
│  │  │  │  SQLAlchemy│  │  JSON      │  │  File System  │  ││  │
│  │  │  │   ORM      │  │  Profiles  │  │   Storage     │  ││  │
│  │  │  └─────┬──────┘  └────────────┘  └───────────────┘  ││  │
│  │  └────────┼─────────────────────────────────────────────┘│  │
│  └───────────┼─────────────────────────────────────────────┘  │
│              │                                                   │
│  ┌───────────┴───────────────────────────────────────────────┐  │
│  │                    DATA STORAGE                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │  PostgreSQL │  │  JSON Files │  │  File Storage   │   │  │
│  │  │  (Users,    │  │  (Profiles) │  │  (Documents)    │   │  │
│  │  │   Sessions) │  │             │  │                 │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Рисунок 2.1 — Общая архитектура программного комплекса CURSA**

### 2.1.2. Структура frontend-приложения

Frontend-приложение реализовано как одностраничное приложение (SPA, Single Page Application) на базе React. Архитектура приложения построена с использованием следующих принципов:

**Компонентный подход.** Интерфейс разделён на переиспользуемые компоненты, каждый из которых отвечает за отображение определённого элемента UI и управление его состоянием.

**Централизованное управление состоянием.** Для управления глобальным состоянием приложения (авторизация, тема, уведомления) используется React Context API.

**Маршрутизация.** Навигация между страницами реализована с помощью React Router, что обеспечивает работу приложения без перезагрузки страницы.

Структура файлов frontend-приложения представлена в таблице 2.1.

**Таблица 2.1 — Структура frontend-приложения**

```
frontend/src/
├── components/          # Переиспользуемые компоненты
│   ├── ui/             # Базовые UI-компоненты
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── layout/        # Компоненты макета
│   │   └── AppLayout.tsx
│   ├── document/       # Компоненты документов
│   │   ├── FileUploader.tsx
│   │   ├── DocumentCard.tsx
│   │   └── IssueList.tsx
│   └── common/         # Общие компоненты
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── pages/              # Страницы приложения
│   ├── HomePage.tsx
│   ├── UploadPage.tsx
│   ├── ReportPage.tsx
│   ├── HistoryPage.tsx
│   ├── ProfilesPage.tsx
│   └── LoginPage.tsx
├── contexts/           # React Context
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── hooks/              # Пользовательские хуки
│   ├── useAuth.ts
│   └── useApi.ts
├── services/           # API-сервисы
│   └── api.ts
├── types/              # TypeScript-типы
│   └── index.ts
└── App.tsx             # Корневой компонент
```

### 2.1.3. Структура backend-приложения

Backend-приложение реализовано на Python с использованием Flask. Архитектура построена по принципу «ресурс-сервис-репозиторий» (resource-service-repository), что обеспечивает разделение уровня обработки HTTP-запросов, бизнес-логики и доступа к данным.

Структура backend-приложения представлена в таблице 2.2.

**Таблица 2.2 — Структура backend-приложения**

```
backend/
├── app/
│   ├── __init__.py           # Инициализация приложения
│   ├── config.py             # Конфигурация
│   ├── api/                  # REST API endpoints
│   │   ├── __init__.py
│   │   ├── auth_routes.py    # Аутентификация
│   │   ├── document_routes.py
│   │   └── profile_routes.py
│   ├── models/               # Модели данных (SQLAlchemy)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── document.py
│   │   └── validation_result.py
│   ├── services/             # Бизнес-логика
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── document_service.py
│   │   ├── validation_engine.py
│   │   └── correction_service.py
│   ├── validators/            # Валидаторы документов
│   │   ├── __init__.py
│   │   ├── base.py           # Базовый класс валидатора
│   │   ├── font_validator.py
│   │   ├── margin_validator.py
│   │   ├── paragraph_validator.py
│   │   └── ...
│   ├── utils/                # Утилиты
│   │   ├── decorators.py
│   │   └── exceptions.py
│   └── schemas/              # Схемы валидации данных
│       └── __init__.py
├── profiles/                  # Профили требований (JSON)
│   ├── gost_7_32_2017.json
│   └── bgpu_requirements.json
├── tests/                     # Тесты
│   ├── unit/
│   ├── integration/
│   └── functional/
├── requirements.txt
└── run.py                     # Точка входа
```

### 2.1.4. Взаимодействие компонентов

Взаимодействие между frontend и backend осуществляется посредством REST API по протоколу HTTP. Формат обмена данными — JSON.

Основные сценарии использования системы:

**Сценарий 1: Загрузка и проверка документа**

1. Пользователь выбирает файл DOCX и профиль проверки
2. Frontend отправляет файл и идентификатор профиля на backend
3. Backend сохраняет файл и инициирует проверку
4. Validation Engine последовательно запускает валидаторы
5. Результаты проверки сохраняются в БД
6. Frontend получает результаты и отображает отчёт

**Сценарий 2: Автокоррекция документа**

1. Пользователь нажимает кнопку «Исправить»
2. Frontend отправляет запрос на исправление
3. Backend запускает Correction Service
4. Для каждой исправляемой ошибки применяется соответствующий корректор
5. Исправленный документ сохраняется
6. Пользователю возвращается исправленный файл

## 2.2. Проектирование базы данных

### 2.2.1. Концептуальная модель данных

На основании анализа предметной области и требований к системе определены следующие основные сущности:

**User (Пользователь)** — зарегистрированный пользователь системы.

**Document (Документ)** — загруженный пользователем DOCX-файл.

**Profile (Профиль)** — набор требований для проверки документа.

**ValidationResult (Результат проверки)** — результат проверки документа.

**Issue (Проблема)** — найденная при проверке ошибка.

ER-диаграмма сущностей представлена на рисунке 2.2.

```
┌──────────────────┐       ┌──────────────────┐
│       User        │       │     Profile      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ email            │       │ name             │
│ password_hash    │       │ description      │
│ created_at       │       │ rules_json       │
│ is_active        │       │ university       │
└────────┬─────────┘       └──────────────────┘
         │                         │
         │ 1:N                     │ 1:N
         ▼                         ▼
┌──────────────────┐       ┌──────────────────┐
│     Document     │       │ ValidationResult│
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ user_id (FK)     │───────│ document_id (FK) │
│ profile_id (FK)  │       │ profile_id (FK)  │
│ filename         │       │ status           │
│ file_path        │       │ score            │
│ status           │       │ created_at       │
│ created_at       │       └────────┬─────────┘
└────────┬─────────┘                │ 1:N
         │                           ▼
         │                 ┌──────────────────┐
         │                 │      Issue      │
         └─────────────────│──────────────────┤
                           │ id (PK)          │
                           │ result_id (FK)   │
                           │ rule_id          │
                           │ severity         │
                           │ description      │
                           │ position          │
                           │ can_autocorrect   │
                           └──────────────────┘
```

**Рисунок 2.2 — ER-диаграмма сущностей базы данных**

### 2.2.2. Физическая модель данных

На основании концептуальной модели разработана физическая модель данных для СУБД PostgreSQL. Основные таблицы и их структура представлены в таблицах 2.3–2.7.

**Таблица 2.3 — Структура таблицы users**

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Идентификатор пользователя |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email пользователя |
| password_hash | VARCHAR(255) | NOT NULL | Хеш пароля |
| name | VARCHAR(100) | | Имя пользователя |
| role | VARCHAR(20) | DEFAULT 'user' | Роль (user/admin) |
| is_active | BOOLEAN | DEFAULT TRUE | Активен ли аккаунт |
| created_at | TIMESTAMP | DEFAULT NOW() | Дата регистрации |
| updated_at | TIMESTAMP | DEFAULT NOW() | Дата обновления |

**Таблица 2.4 — Структура таблицы documents**

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Идентификатор документа |
| user_id | UUID | FK → users(id), NOT NULL | Владелец документа |
| profile_id | UUID | FK → profiles(id) | Применённый профиль |
| filename | VARCHAR(255) | NOT NULL | Имя файла |
| original_path | VARCHAR(500) | | Путь к оригиналу |
| corrected_path | VARCHAR(500) | | Путь к исправленному |
| status | VARCHAR(20) | DEFAULT 'pending' | Статус обработки |
| page_count | INTEGER | | Количество страниц |
| created_at | TIMESTAMP | DEFAULT NOW() | Дата загрузки |

**Таблица 2.5 — Структура таблицы profiles**

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Идентификатор профиля |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Название профиля |
| description | TEXT | | Описание профиля |
| university | VARCHAR(100) | | Название университета |
| rules | JSONB | NOT NULL | Правила проверки |
| is_system | BOOLEAN | DEFAULT FALSE | Системный профиль |
| created_at | TIMESTAMP | DEFAULT NOW() | Дата создания |

**Таблица 2.6 — Структура таблицы validation_results**

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Идентификатор результата |
| document_id | UUID | FK → documents(id), NOT NULL | Проверенный документ |
| profile_id | UUID | FK → profiles(id), NOT NULL | Применённый профиль |
| status | VARCHAR(20) | NOT NULL | Статус (success/failed) |
| score | DECIMAL(5,2) | | Оценка соответствия (0-100) |
| total_issues | INTEGER | DEFAULT 0 | Всего ошибок |
| critical_issues | INTEGER | DEFAULT 0 | Критических ошибок |
| processing_time_ms | INTEGER | | Время обработки (мс) |
| created_at | TIMESTAMP | DEFAULT NOW() | Дата проверки |

**Таблица 2.7 — Структура таблицы issues**

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Идентификатор проблемы |
| result_id | UUID | FK → validation_results(id), NOT NULL | Родительский результат |
| rule_id | VARCHAR(50) | NOT NULL | Идентификатор правила |
| validator | VARCHAR(50) | NOT NULL | Имя валидатора |
| severity | VARCHAR(20) | NOT NULL | Критичность |
| description | TEXT | NOT NULL | Описание проблемы |
| suggestion | TEXT | | Рекомендация по исправлению |
| position | JSONB | | Позиция в документе |
| can_autocorrect | BOOLEAN | DEFAULT FALSE | Можно ли исправить автоматически |
| is_fixed | BOOLEAN | DEFAULT FALSE | Исправлена ли проблема |
| created_at | TIMESTAMP | DEFAULT NOW() | Дата обнаружения |

### 2.2.3. Индексы и оптимизация

Для обеспечения производительности запросов созданы следующие индексы:

```sql
-- Индексы для таблицы documents
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- Индексы для таблицы validation_results
CREATE INDEX idx_results_document_id ON validation_results(document_id);
CREATE INDEX idx_results_profile_id ON validation_results(profile_id);

-- Индексы для таблицы issues
CREATE INDEX idx_issues_result_id ON issues(result_id);
CREATE INDEX idx_issues_severity ON issues(severity);
```

## 2.3. Проектирование API

### 2.3.1. Общая структура REST API

REST API программного комплекса построено в соответствии с принципами REST (Representational State Transfer). Все эндпоинты располагаются по пути `/api/v1/`.

**Базовая структура ответа**

Все ответы API имеют единый формат:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

При возникновении ошибки:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid file format"
  }
}
```

### 2.3.2. Эндпоинты аутентификации

**Таблица 2.8 — Эндпоинты аутентификации**

| Метод | Endpoint | Описание | Тело запроса | Ответ |
|-------|----------|----------|--------------|-------|
| POST | /api/v1/auth/register | Регистрация | `{email, password, name}` | `{user, access_token}` |
| POST | /api/v1/auth/login | Вход | `{email, password}` | `{user, access_token}` |
| POST | /api/v1/auth/logout | Выход | — | `{success: true}` |
| GET | /api/v1/auth/me | Профиль | Headers: Authorization | `{user}` |
| POST | /api/v1/auth/refresh | Обновить токен | `{refresh_token}` | `{access_token}` |

### 2.3.3. Эндпоинты работы с документами

**Таблица 2.9 — Эндпоинты работы с документами**

| Метод | Endpoint | Описание | Тело запроса | Ответ |
|-------|----------|----------|--------------|-------|
| POST | /api/v1/documents/upload | Загрузить документ | `multipart/form-data: file, profile_id` | `{document}` |
| GET | /api/v1/documents | Список документов | Query: `?page=1&limit=20` | `{documents, pagination}` |
| GET | /api/v1/documents/{id} | Информация о документе | — | `{document}` |
| DELETE | /api/v1/documents/{id} | Удалить документ | — | `{success: true}` |
| POST | /api/v1/documents/{id}/validate | Запустить проверку | — | `{validation_result}` |
| POST | /api/v1/documents/{id}/correct | Исправить ошибки | `{issue_ids[]}` | `{corrected_document}` |
| GET | /api/v1/documents/{id}/report | Получить отчёт | — | `{report}` |
| GET | /api/v1/documents/{id}/download | Скачать файл | Query: `?corrected=true` | Binary (DOCX) |

### 2.3.4. Эндпоинты работы с профилями

**Таблица 2.10 — Эндпоинты работы с профилями**

| Метод | Endpoint | Описание | Тело запроса | Ответ |
|-------|----------|----------|--------------|-------|
| GET | /api/v1/profiles | Список профилей | — | `{profiles[]}` |
| GET | /api/v1/profiles/{id} | Информация о профиле | — | `{profile}` |
| POST | /api/v1/profiles | Создать профиль | `{name, rules}` | `{profile}` |
| PUT | /api/v1/profiles/{id} | Обновить профиль | `{name, rules}` | `{profile}` |
| DELETE | /api/v1/profiles/{id} | Удалить профиль | — | `{success: true}` |

### 2.3.5. Примеры запросов

**Загрузка и проверка документа:**

```bash
# Загрузка документа
curl -X POST http://localhost:5000/api/v1/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.docx" \
  -F "profile_id=550e8400-e29b-41d4-a716-446655440000"

# Ответ:
{
  "success": true,
  "data": {
    "document": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "filename": "document.docx",
      "status": "processing",
      "profile_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}

# Получение результата проверки
curl -X GET http://localhost:5000/api/v1/documents/123e4567/report \
  -H "Authorization: Bearer <token>"

# Ответ:
{
  "success": true,
  "data": {
    "result_id": "789e0123-e45b-67d8-a901-234567890000",
    "score": 78.5,
    "total_issues": 12,
    "critical_issues": 2,
    "issues": [
      {
        "id": "issue_001",
        "rule_id": "font_name",
        "validator": "FontValidator",
        "severity": "error",
        "description": "Используется шрифт Arial вместо Times New Roman",
        "position": {"paragraph": 15, "run": 3},
        "can_autocorrect": true
      }
    ]
  }
}
```

## 2.4. Проектирование подсистемы валидации

### 2.4.1. Архитектура валидаторов

Подсистема валидации является ключевым компонентом программного комплекса, обеспечивающим анализ документа на соответствие требованиям нормоконтроля.

Валидаторы реализованы с использованием **шаблона проектирования «Стратегия»** (Strategy Pattern). Каждый валидатор реализует общий интерфейс `BaseValidator` и инкапсулирует логику проверки определённой группы требований.

```
┌──────────────────────────────────────────────┐
│             ValidationEngine                  │
│  (оркестратор валидаторов)                   │
├──────────────────────────────────────────────┤
│  + validate_document(doc, profile) → Result  │
│  + register_validator(validator)             │
│  + get_validators() → List[BaseValidator]    │
└────────────────────┬─────────────────────────┘
                     │ использует
     ┌────────────────┼────────────────┐
     ▼                ▼                ▼
┌─────────┐    ┌───────────┐    ┌─────────────┐
│  Font   │    │  Margin   │    │  Paragraph  │
│Validator│    │ Validator │    │  Validator  │
├─────────┤    ├───────────┤    ├─────────────┤
│+validate│    │ +validate │    │ +validate   │
└─────────┘    └───────────┘    └──────┬──────┘
     │                │                │
     └────────────────┼────────────────┘
                     │ наследуют
┌────────────────────┴─────────────────────┐
│              BaseValidator                 │
├───────────────────────────────────────────┤
│ + name: str                               │
│ + validate(doc, profile) → List[Issue]    │
│ # create_issue(...) → ValidationIssue     │
└───────────────────────────────────────────┘
```

**Рисунок 2.3 — Диаграмма классов валидаторов**

### 2.4.2. Базовый класс валидатора

Каждый валидатор наследуется от базового класса `BaseValidator`, который определяет общий интерфейс:

```python
class BaseValidator(ABC):
    """Базовый класс для всех валидаторов"""
    
    def __init__(self):
        self.name = self.__class__.__name__
        self.issues: List[ValidationIssue] = []
    
    @abstractmethod
    def validate(self, doc: Document, profile: dict) -> List[ValidationIssue]:
        """
        Выполнить проверку документа
        
        Args:
            doc: Объект документа python-docx
            profile: Словарь с параметрами профиля
            
        Returns:
            Список найденных проблем
        """
        pass
    
    def _create_issue(
        self,
        rule_id: str,
        severity: str,
        description: str,
        position: dict = None,
        can_autocorrect: bool = False,
        suggestion: str = None
    ) -> ValidationIssue:
        """Создать объект проблемы"""
        return ValidationIssue(
            validator=self.name,
            rule_id=rule_id,
            severity=severity,
            description=description,
            position=position or {},
            can_autocorrect=can_autocorrect,
            suggestion=suggestion
        )
```

### 2.4.3. Система валидаторов

Программный комплекс включает 10 валидаторов, обеспечивающих проверку 19 требований ГОСТ 7.32-2017:

**Таблица 2.11 — Реестр валидаторов**

| № | Валидатор | Правила | Описание |
|---|-----------|---------|----------|
| 1 | StructureValidator | 13, 28 | Проверка структуры документа |
| 2 | FontValidator | 1, 2 | Проверка шрифтов |
| 3 | MarginValidator | 3, 8 | Проверка полей страницы |
| 4 | ParagraphValidator | 4, 5, 9, 11 | Проверка параграфов и интервалов |
| 5 | HeadingValidator | 13, 15, 16 | Проверка заголовков |
| 6 | BibliographyValidator | 24 | Проверка списка литературы |
| 7 | TableValidator | 19, 21 | Проверка таблиц |
| 8 | FormulaValidator | 17, 18 | Проверка формул |
| 9 | ImageValidator | 20 | Проверка изображений |
| 10 | AppendixValidator | 22, 23 | Проверка приложений |

### 2.4.4. Алгоритм работы Validation Engine

```
Алгоритм 1: Валидация документа

Вход: doc (Document), profile (dict)
Выход: ValidationResult

1.  result ← new ValidationResult()
2.  issues ← []
3.  start_time ← current_time()
4.  
5.  ДЛЯ КАЖДОГО validator В validators:
6.      ПРОФИЛЬ_ПРОВЕРКИ ← profile.get(validator.type)
7.      ЕСЛИ ПРОФИЛЬ_ПРОВЕРКИ существует:
8.          НАЙДЕННЫЕ ← validator.validate(doc, ПРОФИЛЬ_ПРОВЕРКИ)
9.          issues.extend(НАЙДЕННЫЕ)
10. 
11. result.issues ← issues
12. result.score ← calculate_score(issues)
13. result.total_issues ← len(issues)
14. result.critical_issues ← count_by_severity(issues, 'critical')
15. result.processing_time ← current_time() - start_time
16.
17. ВЕРНУТЬ result
```

### 2.4.5. Система оценки документа

Оценка соответствия документа требованиям рассчитывается по формуле:

```
Score = 100 × (1 - weighted_issues / max_possible_issues)

где:
- weighted_issues = Σ (issues[severity] × weight[severity])
- weight[critical] = 10
- weight[error] = 5
- weight[warning] = 2
- weight[info] = 1
- max_possible_issues = 100 (нормализующий коэффициент)
```

Шкала оценки:

- **90-100**: Документ соответствует требованиям
- **70-89**: Документ требует незначительных исправлений
- **50-69**: Документ требует существенных исправлений
- **< 50**: Документ требует значительной доработки

## 2.5. Проектирование подсистемы автокоррекции

### 2.5.1. Архитектура корректоров

Подсистема автокоррекции предназначена для автоматического исправления обнаруженных ошибок форматирования. Корректоры реализованы как отдельные классы, взаимодействующие с документом через python-docx API.

```
┌──────────────────────────────────────────────┐
│           CorrectionService                   │
├──────────────────────────────────────────────┤
│  + correct_document(doc, issues) → Document   │
│  + correct_issue(doc, issue) → bool          │
└────────────────────┬─────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
┌─────────┐    ┌───────────┐    ┌─────────────┐
│  Font   │    │  Margin   │    │  Spacing    │
│Corrector│    │ Corrector │    │  Corrector  │
└─────────┘    └───────────┘    └─────────────┘
```

**Рисунок 2.4 — Архитектура подсистемы автокоррекции**

### 2.5.2. Принципы работы корректоров

При автокоррекции соблюдаются следующие принципы:

1. **Сохранение содержания.** Текст документа не изменяется, исправляется только форматирование.

2. **Обратимость операций.** Каждое исправление документируется для возможности отката.

3. **Последовательное применение.** Исправления применяются в определённом порядке для минимизации конфликтов.

4. **Валидация результата.** После исправлений выполняется повторная проверка.

### 2.5.3. Поддерживаемые операции коррекции

**Таблица 2.12 — Операции автокоррекции**

| Операция | Валидатор | Пример |
|----------|-----------|--------|
| Изменение шрифта | FontValidator | Arial → Times New Roman |
| Изменение размера шрифта | FontValidator | 11pt → 14pt |
| Установка межстрочного интервала | ParagraphValidator | 1.0 → 1.5 |
| Установка абзацного отступа | ParagraphValidator | 0 → 1.25 см |
| Выравнивание текста | ParagraphValidator | По левому краю → По ширине |
| Изменение полей страницы | MarginValidator | Левое 2.5 см → 3.0 см |

## 2.6. Безопасность системы

### 2.6.1. Аутентификация и авторизация

Система аутентификации реализована на основе JWT (JSON Web Tokens). При успешной авторизации пользователю выдаётся пара токенов:

- **Access token** — используется для авторизации запросов, срок жизни: 15 минут
- **Refresh token** — используется для обновления access token, срок жизни: 7 дней

**Структура JWT:**

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "role": "user",
    "iat": 1677654321,
    "exp": 1677655221
  }
}
```

### 2.6.2. Защита от атак

Для защиты системы реализованы следующие меры:

**Rate limiting.** Ограничение количества запросов с одного IP адреса:

- Аутентификация: 5 попыток за 15 минут
- API endpoints: 100 запросов за минуту

**Валидация входных данных.** Все входные данные проверяются на соответствие ожидаемому формату с использованием схем валидации.

**Защита заголовков.** Настроены security headers:

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000

**Шифрование паролей.** Пароли хешируются с использованием алгоритма bcrypt с солью.

## 2.7. Выводы по главе 2

Во второй главе представлено проектирование программного комплекса CURSA.

Разработана общая архитектура системы на основе клиент-серверной модели с разделением на frontend (React) и backend (Flask). Определена структура компонентов и взаимодействие между ними.

Спроектирована база данных с пятью основными таблицами: users, documents, profiles, validation_results, issues. Создана физическая модель данных для PostgreSQL с оптимизированными индексами.

Разработано REST API с эндпоинтами для аутентификации, работы с документами и управления профилями. Определена единая структура запросов и ответов.

Представлена архитектура подсистемы валидации с 10 валидаторами, обеспечивающими проверку 19 требований ГОСТ 7.32-2017. Описан алгоритм работы Validation Engine и система оценки документа.

Спроектирована подсистема автокоррекции для автоматического исправления ошибок форматирования.

Определены меры безопасности системы, включая аутентификацию на основе JWT, rate limiting и защиту от типовых атак.

---

*(Продолжение следует: Глава 3. Реализация и тестирование)*
