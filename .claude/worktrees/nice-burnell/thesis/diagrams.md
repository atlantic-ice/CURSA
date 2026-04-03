# ДИАГРАММЫ АРХИТЕКТУРЫ И МОДЕЛЕЙ

> Для отображения диаграмм используйте расширение Mermaid Previewer или скопируйте код в https://mermaid.live

---

## Диаграмма 1: Общая архитектура системы

```mermaid
graph TB
    subgraph Client["Клиент (Browser)"]
        FE[React Frontend<br/>TypeScript]
        UI[UI Components<br/>Material-UI]
        API[API Service<br/>Axios]
    end

    subgraph Server["Сервер"]
        Flask[Flask API<br/>Python]
        Auth[JWT Auth<br/>OAuth2]
        Validators[Validation Engine<br/>10 Validators]
        Corrector[Correction Service<br/>Autocorrect]
        Storage[(Storage<br/>SQLite/PostgreSQL)]
    end

    subgraph Validators["Валидаторы"]
        FontV[FontValidator]
        MarginV[MarginValidator]
        ParagraphV[ParagraphValidator]
        HeadingV[HeadingValidator]
        TableV[TableValidator]
        FormulaV[FormulaValidator]
        ImageV[ImageValidator]
        AppendixV[AppendixValidator]
        BiblioV[BibliographyValidator]
        StructureV[StructureValidator]
    end

    FE --> UI
    UI --> API
    API --> Flask
    Flask --> Auth
    Flask --> Validators
    Flask --> Corrector
    Flask --> Storage
    Validators --> FontV
    Validators --> MarginV
    Validators --> ParagraphV
    Validators --> HeadingV
    Validators --> TableV
    Validators --> FormulaV
    Validators --> ImageV
    Validators --> AppendixV
    Validators --> BiblioV
    Validators --> StructureV
```

---

## Диаграмма 2: ER-диаграмма базы данных

```mermaid
erDiagram
    USER {
        uuid id PK
        string email UK
        string password_hash
        string name
        string role
        boolean is_active
        timestamp created_at
    }

    DOCUMENT {
        uuid id PK
        uuid user_id FK
        uuid profile_id FK
        string filename
        string file_path
        string status
        integer page_count
        timestamp created_at
    }

    PROFILE {
        uuid id PK
        string name UK
        text description
        string university
        jsonb rules
        boolean is_system
        timestamp created_at
    }

    VALIDATION_RESULT {
        uuid id PK
        uuid document_id FK
        uuid profile_id FK
        string status
        decimal score
        integer total_issues
        integer critical_issues
        integer processing_time_ms
        timestamp created_at
    }

    ISSUE {
        uuid id PK
        uuid result_id FK
        string rule_id
        string validator
        string severity
        text description
        text suggestion
        jsonb position
        boolean can_autocorrect
        boolean is_fixed
        timestamp created_at
    }

    USER ||--o{ DOCUMENT : "has"
    DOCUMENT ||--o{ VALIDATION_RESULT : "produces"
    PROFILE ||--o{ DOCUMENT : "applied_to"
    VALIDATION_RESULT ||--o{ ISSUE : "contains"
```

---

## Диаграмма 3: Диаграмма компонентов

```mermaid
graph LR
    subgraph Frontend["Frontend (React)"]
        App[App.tsx<br/>938 lines]
        Pages[Pages<br/>Upload, Report,<br/>Dashboard, Profiles]
        Components[Components<br/>Header, Sidebar,<br/>Uploader]
        Types[Types<br/>TypeScript interfaces]
        API[Services<br/>API client]
    end

    subgraph Backend["Backend (Flask)"]
        Routes[API Routes<br/>/documents, /profiles,<br/>/auth]
        Services[Services<br/>ValidationEngine,<br/>CorrectionService]
        Validators[Validators<br/>10 validators]
        Models[Models<br/>SQLAlchemy ORM]
        Utils[Utils<br/>decorators, exceptions]
    end

    subgraph Data["Data Layer"]
        DB[(PostgreSQL<br/>SQLite)]
        Files[(Files<br/>DOCX)]
        Profiles[(JSON<br/>Profiles)]
    end

    Frontend --> API
    API --> Routes
    Routes --> Services
    Services --> Validators
    Services --> Models
    Models --> DB
    Routes --> Files
    Services --> Profiles
```

---

## Диаграмма 4: Алгоритм валидации документа

```mermaid
flowchart TD
    Start([Начало]) --> Input[/Ввод: DOCX файл/]
    Input --> LoadDoc[Загрузить документ<br/>python-docx]
    LoadDoc --> LoadProfile[Загрузить профиль<br/>требований]
    LoadProfile --> Init[Инициализация<br/>10 валидаторов]
    
    Init --> Loop{Все валидаторы<br/>обработаны?}
    
    Loop -->|Нет| Run[Запуск валидатора]
    Run --> Check[Проверка<br/>параграфов и runs]
    Check --> IssuesFound{Найдены<br/>проблемы?}
    
    IssuesFound -->|Да| AddIssue[Добавить в список<br/>проблем]
    AddIssue --> Loop
    
    IssuesFound -->|Нет| Loop
    
    Loop -->|Да| CalcScore[Расчёт оценки<br/>документа]
    CalcScore --> Status{Оценка >= 70?}
    
    Status -->|Да| Pass[passed = True]
    Status -->|Нет| Fail[passed = False]
    
    Pass --> Generate[Генерация<br/>отчёта]
    Fail --> Generate
    
    Generate --> Output[/Вывод: Отчёт<br/>о проверке/]
    Output --> End([Конец])
```

---

## Диаграмма 5: Диаграмма вариантов использования

```mermaid
graph LR
    subgraph Actors["Акторы"]
        Student[Студент]
        Teacher[Преподаватель]
        Admin[Администратор]
    end

    subgraph UseCases["Варианты использования"]
        Upload[Загрузить документ]
        Validate[Проверить документ]
        ViewReport[Просмотреть отчёт]
        Autocorrect[Автокоррекция]
        Download[Скачать результат]
        ManageProfiles[Управлять профилями]
        ViewHistory[История проверок]
        ManageUsers[Управление<br/>пользователями]
    end

    Student --> Upload
    Student --> Validate
    Student --> ViewReport
    Student --> Autocorrect
    Student --> Download
    Student --> ViewHistory

    Teacher --> Upload
    Teacher --> Validate
    Teacher --> ViewReport
    Teacher --> Autocorrect
    Teacher --> Download
    Teacher --> ManageProfiles
    Teacher --> ViewHistory

    Admin --> ManageUsers
    Admin --> ManageProfiles
```

---

## Диаграмма 6: Диаграмма последовательности (загрузка и проверка)

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant FE as Frontend
    participant API as Flask API
    participant VE as ValidationEngine
    participant V as Validators
    participant DB as Database

    U->>FE: Загрузить DOCX
    FE->>FE: Выбор профиля
    FE->>API: POST /documents/upload
    API->>API: Сохранение файла
    API->>VE: Валидация документа
    VE->>V: Запуск FontValidator
    VE->>V: Запуск MarginValidator
    VE->>V: Запуск ParagraphValidator
    VE->>V: ... (ещё 7 валидаторов)
    V-->>VE: Список проблем
    VE-->>API: Результат валидации
    API->>DB: Сохранение результата
    API-->>FE: Отчёт о проверке
    FE-->>U: Отображение результата
```

---

## Диаграмма 7: Структура Frontend

```mermaid
graph TD
    App[App.tsx<br/>Root Component] --> Routes
    
    subgraph Routes["Маршруты"]
        Upload[UploadPage<br/>Загрузка]
        Report[ReportPage<br/>Отчёт]
        Profiles[ProfilesPage<br/>Профили]
        Dashboard[DashboardPage<br/>Панель]
        History[HistoryPage<br/>История]
        Admin[AdminPage<br/>Админка]
    end

    subgraph Contexts["Контексты"]
        Auth[AuthContext<br/>Аутентификация]
        Color[ColorModeContext<br/>Тема]
        HistoryCtx[CheckHistoryContext<br/>История]
    end

    subgraph Components["Компоненты"]
        Header[SiteHeader]
        Sidebar[AppSidebar]
        Uploader[FileUploader]
        IssueList[IssueList]
    end

    Routes --> Contexts
    Routes --> Components
```

---

## Диаграмма 8: Структура Backend

```mermaid
graph TD
    Flask[Flask App<br/>create_app()] --> Blueprints

    subgraph Blueprints["Blueprints"]
        AuthBP[auth_routes<br/>Аутентификация]
        DocBP[document_routes<br/>Документы]
        ProfileBP[profile_routes<br/>Профили]
    end

    subgraph Services["Services"]
        ValidationEngine[validation_engine.py<br/>Оркестратор]
        CorrectionService[correction_service.py<br/>Автокоррекция]
        DocumentProcessor[document_processor.py<br/>Обработка]
    end

    subgraph Validators["Validators"]
        Base[base.py<br/>BaseValidator]
        Font[font_validator.py]
        Margin[margin_validator.py]
        Paragraph[paragraph_validator.py]
        Heading[heading_validator.py]
        Table[table_validator.py]
        Formula[formula_validator.py]
        Image[image_validator.py]
        Appendix[appendix_validator.py]
        Bibliography[bibliography_validator.py]
        Structure[structure_validator.py]
    end

    Blueprints --> Services
    Services --> Validators
    ValidationEngine --> Base
```

---

*Для просмотра диаграмм используйте онлайн-редактор: https://mermaid.live*
