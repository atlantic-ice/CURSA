# CURSA — Полный набор схем и диаграмм

> Автоматически сгенерировано на основе кодовой базы проекта.  
> Все диаграммы написаны в формате **Mermaid** — рендерятся в GitHub, GitLab, Obsidian, VS Code (плагин Mermaid Preview), Notion и др.

---

## Содержание

1. [ER-диаграмма базы данных](#1-er-диаграмма-базы-данных)
2. [Архитектура системы (высокий уровень)](#2-архитектура-системы-высокий-уровень)
3. [Схема развёртывания (Deployment)](#3-схема-развёртывания-deployment)
4. [Поток аутентификации — Email/Password + JWT](#4-поток-аутентификации--emailpassword--jwt)
5. [Поток аутентификации — OAuth2](#5-поток-аутентификации--oauth2)
6. [Поток аутентификации — 2FA (TOTP)](#6-поток-аутентификации--2fa-totp)
7. [Поток обработки документа (Upload → Check → Correct → Report)](#7-поток-обработки-документа-upload--check--correct--report)
8. [Конвейер валидаторов](#8-конвейер-валидаторов)
9. [Многопроходная автоисправление документа](#9-многопроходное-автоисправление-документа)
10. [API — маршруты и сервисы](#10-api--маршруты-и-сервисы)
11. [Диаграмма компонентов фронтенда](#11-диаграмма-компонентов-фронтенда)
12. [Состояния документа (State Machine)](#12-состояния-документа-state-machine)
13. [Жизненный цикл подписки (State Machine)](#13-жизненный-цикл-подписки-state-machine)
14. [Поток оплаты — Stripe](#14-поток-оплаты--stripe)
15. [Поток оплаты — YooKassa](#15-поток-оплаты--yookassa)
16. [Управление API-ключами](#16-управление-api-ключами)
17. [Модель ролей и доступа (RBAC)](#17-модель-ролей-и-доступа-rbac)
18. [Диаграмма классов — Модели](#18-диаграмма-классов--модели)
19. [Диаграмма классов — Сервисы](#19-диаграмма-классов--сервисы)
20. [Диаграмма классов — Валидаторы](#20-диаграмма-классов--валидаторы)
21. [Диаграмма классов — Корректоры](#21-диаграмма-классов--корректоры)
22. [Sequence: Вход пользователя](#22-sequence-вход-пользователя)
23. [Sequence: Загрузка и проверка документа](#23-sequence-загрузка-и-проверка-документа)
24. [Sequence: Автоисправление документа](#24-sequence-автоисправление-документа)
25. [Sequence: Refresh JWT-токена](#25-sequence-refresh-jwt-токена)
26. [Структура профилей валидации](#26-структура-профилей-валидации)
27. [Дерево маршрутов фронтенда](#27-дерево-маршрутов-фронтенда)
28. [Обзорная диаграмма безопасности](#28-обзорная-диаграмма-безопасности)

---

## 1. ER-диаграмма базы данных

```mermaid
erDiagram
    USER {
        int id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string organization
        enum role "GUEST|USER|PRO|TEAM|ENTERPRISE|ADMIN"
        string oauth_provider
        string oauth_id
        bool is_email_verified
        string email_verification_token
        string totp_secret
        json backup_codes
        bool totp_enabled
        datetime created_at
        datetime updated_at
    }

    DOCUMENT {
        int id PK
        int user_id FK
        string filename
        string original_filename
        string file_path
        enum status "UPLOADED|CHECKING|CHECKED|CORRECTING|CORRECTED|ERROR"
        string profile_id
        json check_results
        int total_issues_count
        float completion_percentage
        json correction_results
        string corrected_filename
        string report_filename
        string celery_task_id
        datetime created_at
        datetime updated_at
    }

    SUBSCRIPTION {
        int id PK
        int user_id FK
        string plan "FREE|STUDENT|PRO|TEAM|ENTERPRISE"
        enum status "ACTIVE|INACTIVE|TRIAL|CANCELLED|EXPIRED"
        float amount
        string currency
        datetime started_at
        datetime expires_at
        string stripe_subscription_id
        string yookassa_subscription_id
        json payment_metadata
        datetime created_at
    }

    PAYMENT {
        int id PK
        int user_id FK
        float amount
        string currency
        enum status "PENDING|COMPLETED|FAILED|REFUNDED"
        string provider "stripe|yookassa"
        string transaction_id
        json payment_metadata
        datetime completed_at
        datetime created_at
    }

    API_KEY {
        int id PK
        int user_id FK
        string name
        string key_hash
        string key_prefix
        json scopes
        int rate_limit
        bool is_active
        int usage_count
        datetime last_used_at
        datetime expires_at
        datetime created_at
    }

    API_KEY_AUDIT {
        int id PK
        int user_id FK
        int api_key_id FK
        string event
        json details
        string ip_address
        string user_agent
        datetime created_at
    }

    USER ||--o{ DOCUMENT : "uploads"
    USER ||--o{ SUBSCRIPTION : "has"
    USER ||--o{ PAYMENT : "makes"
    USER ||--o{ API_KEY : "owns"
    API_KEY ||--o{ API_KEY_AUDIT : "generates"
    USER ||--o{ API_KEY_AUDIT : "recorded in"
```

---

## 2. Архитектура системы (высокий уровень)

```mermaid
graph TB
    subgraph CLIENT["Клиент"]
        Browser["Браузер\n(React 19 + TS)"]
    end

    subgraph BACKEND["Backend (Flask / Python 3.11)"]
        API["REST API\n(Flask Blueprints)"]
        WS["WebSocket\n(Flask-SocketIO)"]
        Services["Сервисы\n(бизнес-логика)"]
        Validators["Валидаторы\n(15+ модулей)"]
        Correctors["Корректоры\n(многопроходные)"]
        Models["ORM Модели\n(SQLAlchemy)"]
    end

    subgraph ASYNC["Асинхронная обработка"]
        Celery["Celery Worker\n(очередь задач)"]
        Redis["Redis\n(брокер / кэш)"]
    end

    subgraph STORAGE["Хранилище"]
        DB[("PostgreSQL\n(production)")]
        SQLite[("SQLite\n(разработка)")]
        Files["Файловая система\n(uploads / corrections / reports)"]
    end

    subgraph EXTERNAL["Внешние сервисы"]
        Stripe["Stripe\n(платежи)"]
        YooKassa["YooKassa\n(платежи RU)"]
        Google["Google OAuth2"]
        GitHub["GitHub OAuth2"]
        Yandex["Yandex OAuth2"]
        SendGrid["SendGrid\n(email)"]
    end

    Browser -->|"HTTPS REST"| API
    Browser -->|"WSS"| WS
    API --> Services
    WS --> Services
    Services --> Validators
    Services --> Correctors
    Services --> Models
    Models --> DB
    Models --> SQLite
    Services --> Files
    API --> Celery
    Celery --> Redis
    Celery --> Services
    Services --> Stripe
    Services --> YooKassa
    Services --> Google
    Services --> GitHub
    Services --> Yandex
    Services --> SendGrid
```

---

## 3. Схема развёртывания (Deployment)

```mermaid
graph TB
    subgraph INTERNET["Интернет"]
        User["Пользователь"]
    end

    subgraph CDN["CDN / Nginx"]
        Nginx["Nginx\n(reverse proxy + static)"]
    end

    subgraph APP["Сервер приложений"]
        Gunicorn["Gunicorn / Eventlet\n(WSGI server)"]
        Flask["Flask Application"]
    end

    subgraph WORKERS["Worker-серверы"]
        CeleryW1["Celery Worker 1\n(doc processing)"]
        CeleryW2["Celery Worker 2\n(email tasks)"]
        CeleryBeat["Celery Beat\n(scheduled tasks)"]
    end

    subgraph DATA["Слой данных"]
        PG[("PostgreSQL 15\nPrimary")]
        PGR[("PostgreSQL\nRead Replica")]
        RedisM["Redis Master\n(broker + blacklist)"]
        RedisS["Redis Slave\n(cache)"]
    end

    subgraph STORAGE2["Хранилище файлов"]
        LocalFS["Локальная ФС\n/static/uploads\n/static/corrections\n/static/reports"]
    end

    subgraph MONITORING["Мониторинг"]
        Prometheus["Prometheus\n(/api/metrics)"]
        Grafana["Grafana\n(дашборды)"]
    end

    User -->|"HTTPS :443"| Nginx
    Nginx -->|"proxy_pass :5000"| Gunicorn
    Nginx -->|"static files"| LocalFS
    Gunicorn --> Flask
    Flask --> PG
    Flask --> RedisM
    Flask -->|"publish tasks"| RedisM
    CeleryW1 -->|"consume"| RedisM
    CeleryW2 -->|"consume"| RedisM
    CeleryBeat --> RedisM
    CeleryW1 --> PG
    PG -->|"replication"| PGR
    RedisM -->|"replication"| RedisS
    Flask --> LocalFS
    Flask --> Prometheus
    Prometheus --> Grafana
```

---

## 4. Поток аутентификации — Email/Password + JWT

```mermaid
flowchart TD
    A([Пользователь]) --> B["POST /api/auth/register\n{email, password, first_name}"]
    B --> C{Валидация\nвходных данных}
    C -->|Ошибка| D["400 Bad Request"]
    C -->|OK| E["Создать User\n(role=USER, is_email_verified=false)"]
    E --> F["Генерировать токен верификации\n(Redis, TTL 24h)"]
    F --> G["Отправить email\n(SendGrid / SMTP)"]
    G --> H["Вернуть JWT\n(access + refresh)"]

    A --> I["POST /api/auth/login\n{email, password}"]
    I --> J{Найти User\nпо email}
    J -->|Не найден| K["401 Unauthorized"]
    J -->|Найден| L{Проверить\npassword_hash}
    L -->|Неверный| K
    L -->|OK| M{2FA включён?}
    M -->|Да| N["Запросить TOTP код"]
    N --> O{Проверить TOTP}
    O -->|Неверный| P["401 Invalid 2FA"]
    O -->|OK| Q
    M -->|Нет| Q["Сгенерировать JWT\naccess (1ч) + refresh (30д)"]
    Q --> R["200 OK + tokens"]

    A --> S["GET /api/auth/me\n(Bearer: access_token)"]
    S --> T{Проверить JWT\n+ blacklist Redis}
    T -->|Истёк / blacklist| U["401 Unauthorized"]
    T -->|OK| V["200 OK + user data"]

    A --> W["POST /api/auth/logout"]
    W --> X["Добавить JTI в blacklist\n(Redis, TTL до истечения)"]
    X --> Y["204 No Content"]

    style D fill:#f44,color:#fff
    style K fill:#f44,color:#fff
    style P fill:#f44,color:#fff
    style U fill:#f44,color:#fff
    style H fill:#4a4,color:#fff
    style R fill:#4a4,color:#fff
    style V fill:#4a4,color:#fff
    style Y fill:#4a4,color:#fff
```

---

## 5. Поток аутентификации — OAuth2

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant FE as Frontend (React)
    participant BE as Backend (Flask)
    participant OAuth as OAuth Provider<br/>(Google / GitHub / Yandex)
    participant DB as PostgreSQL

    User->>FE: Нажать "Войти через Google"
    FE->>BE: POST /api/oauth/authorize/google
    BE-->>FE: {auth_url, state}
    FE->>OAuth: Редирект на auth_url
    User->>OAuth: Подтвердить доступ
    OAuth->>BE: GET /api/oauth/callback/google?code=...&state=...
    BE->>OAuth: POST /token (обмен code на access_token)
    OAuth-->>BE: {access_token, id_token}
    BE->>OAuth: GET /userinfo
    OAuth-->>BE: {sub, email, name, picture}
    BE->>DB: Найти User по oauth_id / email
    alt Новый пользователь
        DB-->>BE: Не найден
        BE->>DB: Создать User (oauth_provider, oauth_id)
        DB-->>BE: User создан
    else Существующий пользователь
        DB-->>BE: User найден
        BE->>DB: Обновить oauth_id если нужно
    end
    BE->>BE: Сгенерировать JWT (access + refresh)
    BE-->>FE: Редирект /auth/callback?token=...&refresh=...&is_new=true
    FE->>FE: Сохранить токены в localStorage
    FE-->>User: Показать Dashboard
```

---

## 6. Поток аутентификации — 2FA (TOTP)

```mermaid
flowchart TD
    subgraph SETUP["Настройка 2FA"]
        A1["GET /api/auth/2fa/setup"] --> B1["Генерировать TOTP secret\n(pyotp.random_base32)"]
        B1 --> C1["Сохранить secret во\nUser.totp_secret (temp)"]
        C1 --> D1["Вернуть QR-код URL\n+ secret для ручного ввода"]
        D1 --> E1["Пользователь сканирует QR\n(Google Authenticator / Authy)"]
        E1 --> F1["POST /api/auth/2fa/enable\n{totp_code}"]
        F1 --> G1{Проверить TOTP}
        G1 -->|Неверный| H1["400 Invalid Code"]
        G1 -->|OK| I1["User.totp_enabled = True"]
        I1 --> J1["Генерировать 10 backup codes\n(sha256-хэшированные)"]
        J1 --> K1["Вернуть backup codes\n(показать единожды!)"]
    end

    subgraph LOGIN["Вход с 2FA"]
        A2["POST /api/auth/login"] --> B2{Пароль верен?}
        B2 -->|Нет| C2["401"]
        B2 -->|Да| D2{totp_enabled?}
        D2 -->|Нет| E2["Вернуть JWT"]
        D2 -->|Да| F2["Запросить TOTP/backup code"]
        F2 --> G2["POST /api/auth/2fa/verify\n{code}"]
        G2 --> H2{Тип кода}
        H2 -->|TOTP| I2{pyotp.verify?}
        H2 -->|Backup| J2{Код в backup_codes?}
        I2 -->|OK| K2["Вернуть JWT"]
        I2 -->|Нет| L2["401 Invalid 2FA"]
        J2 -->|OK| M2["Удалить использованный код"]
        M2 --> K2
        J2 -->|Нет| L2
    end

    subgraph DISABLE["Отключение 2FA"]
        A3["POST /api/auth/2fa/disable\n{password}"] --> B3{Пароль верен?}
        B3 -->|Нет| C3["401"]
        B3 -->|Да| D3["User.totp_enabled = False\nUser.totp_secret = None\nUser.backup_codes = []"]
        D3 --> E3["200 OK"]
    end

    style H1 fill:#f44,color:#fff
    style C2 fill:#f44,color:#fff
    style L2 fill:#f44,color:#fff
    style C3 fill:#f44,color:#fff
```

---

## 7. Поток обработки документа (Upload → Check → Correct → Report)

```mermaid
flowchart TD
    START([Пользователь загружает DOCX]) --> A

    A["POST /api/document/upload\n{file, profile_id}"] --> B{Валидация файла}
    B -->|Не DOCX / > 50MB| ERR1["400 Invalid File"]
    B -->|OK| C["Создать Document\nstatus=UPLOADED"]
    C --> D{Async mode?}
    D -->|Celery| E["Поставить задачу\nв очередь Redis"]
    D -->|Sync| F

    E --> F["DocumentProcessor\n.extract_data(docx)"]
    F --> F1["Загрузить python-docx"]
    F1 --> F2["Извлечь параграфы\nшрифты, отступы"]
    F2 --> F3["Извлечь таблицы\nизображения, стили"]
    F3 --> F4["Извлечь поля\nколонтитулы, сноски"]
    F4 --> F5{{"Структурированные данные документа"}}

    F5 --> G["ValidationEngine\n.validate_document(data, profile)"]
    G --> G1["Загрузить профиль ГОСТ\n(JSON)"]
    G1 --> G2["Запустить 15+ валидаторов\nпоследовательно"]
    G2 --> G3{{"Список нарушений\n[severity, location, message]"}}
    G3 --> G4["Подсчитать статистику\n(score, completion_%)"]
    G4 --> H["Обновить Document\ncheck_results=JSON\nstatus=CHECKED"]
    H --> I{{"Результаты проверки\nпользователю"}}

    I --> J{Пользователь хочет\nавтоисправление?}
    J -->|Нет| REPORT
    J -->|Да| K

    K["POST /api/document/correct\n{document_id}"] --> L["DocumentCorrector\n.correct_multipass(docx)"]
    L --> M["Проход 1: Шрифты\nTimes New Roman 14pt"]
    M --> N["Проход 2: Поля\n3/1/2/2 см"]
    N --> O["Проход 3: Интервалы\n1.5, отступ 1.25 см"]
    O --> P["Проход 4: Структура\nзаголовки, нумерация"]
    P --> Q["Ре-валидация после\nкаждого прохода"]
    Q --> R{Все проходы\nвыполнены?}
    R -->|Нет| M
    R -->|Да| S["Сохранить исправленный DOCX\napp/static/corrections/"]
    S --> T["Обновить Document\ncorrected_filename\nstatus=CORRECTED"]

    T --> REPORT
    I --> REPORT

    REPORT["POST /api/document/generate-report\n{document_id}"] --> REP1["Создать DOCX-отчёт\n(docxtpl)"]
    REP1 --> REP2["Включить: нарушения,\nисправления, рекомендации"]
    REP2 --> REP3["Сохранить в\napp/static/reports/"]
    REP3 --> END(["Ссылки для скачивания\nисправленного файла + отчёта"])

    style ERR1 fill:#f44,color:#fff
    style END fill:#4a4,color:#fff
```

---

## 8. Конвейер валидаторов

```mermaid
flowchart LR
    INPUT{{"Данные документа\n(extract_data)"}} --> ENGINE

    subgraph ENGINE["ValidationEngine"]
        direction TB
        V1["StructureValidator\nСтруктура разделов,\nоглавление"]
        V2["FontValidator\nTimes New Roman 14pt\n(код: 12pt)"]
        V3["MarginValidator\nПоля: лев 3, пр 1,\nвер 2, ниж 2 (см)"]
        V4["ParagraphValidator\nМежстрочный 1.5,\nотступ 1.25 см"]
        V5["HeadingValidator\nИерархия, нумерация,\nоформление"]
        V6["BibliographyValidator\nГОСТ Р 7.0.100-2018,\nуказатели источников"]
        V7["TableValidator\nСтруктура таблиц,\nподписи, нумерация"]
        V8["FormulaValidator\nФормулы, нумерация\n(Уравнение 1.1)"]
        V9["ImageValidator\nИзображения,\nподписи \"Рисунок X\""]
        V10["AppendixValidator\nПриложения A, Б...\nструктура"]
        V11["AdvancedFormatValidator\nКомплексное\nоформление"]
        V12["CrossReferenceValidator\nВнутренние ссылки,\nконсистентность"]
        V13["HeaderFooterValidator\nКолонтитулы,\nномера страниц"]
        V14["FootnoteValidator\nСноски, расположение,\nоформление"]
        V15["PageBreakValidator\nРазрывы страниц,\nраздельность глав"]
    end

    ENGINE --> AGG["Агрегация результатов"]
    AGG --> STATS["Статистика:\n• total_issues\n• by_severity (ERROR/WARN/INFO)\n• by_category\n• completion_%\n• score_100"]
    STATS --> OUTPUT{{"check_results JSON"}}

    V1 & V2 & V3 & V4 & V5 --> AGG
    V6 & V7 & V8 & V9 & V10 --> AGG
    V11 & V12 & V13 & V14 & V15 --> AGG
```

---

## 9. Многопроходное автоисправление документа

```mermaid
flowchart TD
    START(["Исходный DOCX"]) --> LOAD["Загрузить DOCX\npython-docx"]
    LOAD --> XML["XMLDocumentEditor\nРаспаковать ZIP → document.xml"]

    XML --> P1

    subgraph PASSES["Многопроходное исправление"]
        P1["Проход 1: ШРИФТЫ\n• Times New Roman → все параграфы\n• Размер: 14pt (обычный), 12pt (код)\n• Жирный/курсив → только заголовки"]
        P1 --> R1["Ре-валидация\nFontValidator"]
        R1 --> P2

        P2["Проход 2: ПОЛЯ СТРАНИЦЫ\n• Левое: 3.0 см\n• Правое: 1.0 см\n• Верхнее: 2.0 см\n• Нижнее: 2.0 см"]
        P2 --> R2["Ре-валидация\nMarginValidator"]
        R2 --> P3

        P3["Проход 3: МЕЖСТРОЧНЫЕ ИНТЕРВАЛЫ\n• Интервал: 1.5 строки\n• Отступ первой строки: 1.25 см\n• Интервал до/после абзаца: 0"]
        P3 --> R3["Ре-валидация\nParagraphValidator"]
        R3 --> P4

        P4["Проход 4: СТРУКТУРА\n• Нумерация разделов (1, 1.1, 1.1.1)\n• Иерархия заголовков\n• Оглавление (при необходимости)"]
        P4 --> R4["Ре-валидация\nStructure + HeadingValidator"]
        R4 --> P5

        P5["Проход 5 (опц.): СПИСКИ ЛИТЕРАТУРЫ\n• Нумерация источников\n• Формат ГОСТ"]
        P5 --> R5["Ре-валидация\nBibliographyValidator"]
    end

    R5 --> SAVE["Запаковать XML → DOCX"]
    SAVE --> RESULT(["Исправленный DOCX\napp/static/corrections/"])

    subgraph XML_OPS["Операции XMLDocumentEditor"]
        direction LR
        XA["Изменить <w:rPr>\n(шрифт, размер)"]
        XB["Изменить <w:pPr>\n(отступы, интервалы)"]
        XC["Изменить <w:sectPr>\n(поля страницы)"]
        XD["Изменить <w:numPr>\n(нумерация)"]
    end

    style RESULT fill:#4a4,color:#fff
```

---

## 10. API — маршруты и сервисы

```mermaid
graph TB
    subgraph ROUTES["API Маршруты (Flask Blueprints)"]
        R_AUTH["auth_routes.py\n/api/auth/*\n• register, login, logout\n• me, refresh\n• forgot/reset password\n• 2fa/setup, enable, disable, verify"]
        R_OAUTH["oauth_routes.py\n/api/oauth/*\n• authorize/<provider>\n• callback/<provider>"]
        R_DOC["document_routes.py\n/api/document/*\n• upload, upload-batch\n• correct, generate-report\n• <id>/corrected"]
        R_VALID["validation_routes.py\n/api/validation/*\n• check, quick-check\n• validators, profiles"]
        R_PROF["profile_routes.py\n/api/profiles/*\n• GET list, GET by id\n• POST create\n• PATCH update\n• DELETE"]
        R_PAY["payment_routes.py\n/api/payments/*\n• plans, subscription\n• subscribe, cancel\n• history\n• webhook/stripe\n• webhook/yookassa"]
        R_KEY["api_key_routes.py\n/api/api-keys/*\n• GET list, POST create\n• DELETE, PATCH\n• <id>/regenerate"]
        R_HEALTH["health_routes.py\n/api/health"]
        R_PREVIEW["preview_routes.py\n/api/preview/<id>"]
    end

    subgraph SERVICES["Сервисный слой"]
        S_VALID["ValidationEngine\nОркестрирует валидаторы"]
        S_PROC["DocumentProcessor\nИзвлечение данных DOCX"]
        S_CORR["DocumentCorrector\nМногопроходное исправление"]
        S_XML["XMLDocumentEditor\nНизкоуровневый OOXML"]
        S_WORK["WorkflowService\nОркестрация end-to-end"]
        S_PAY["PaymentService\nStripe + YooKassa"]
        S_OAUTH["OAuthService\nGoogle/GitHub/Yandex"]
        S_EMAIL["EmailService\nSendGrid / SMTP"]
        S_TOKEN["TokenService\nJWT + Redis blacklist"]
        S_TOTP["TOTPService\npyotp 2FA"]
        S_VERIFY["VerificationService\nEmail/password tokens"]
        S_APIKEY["APIKeyAuth\nАутентификация по ключу"]
    end

    R_AUTH --> S_TOKEN & S_TOTP & S_EMAIL & S_VERIFY
    R_OAUTH --> S_OAUTH & S_TOKEN
    R_DOC --> S_WORK & S_PROC & S_VALID & S_CORR
    R_VALID --> S_VALID & S_PROC
    R_PAY --> S_PAY
    R_KEY --> S_APIKEY
    S_CORR --> S_XML
    S_WORK --> S_PROC & S_VALID & S_CORR
```

---

## 11. Диаграмма компонентов фронтенда

```mermaid
graph TB
    subgraph APP["App.tsx (корень)"]
        CTX["Контексты\n• AuthContext\n• ColorModeContext\n• CheckHistoryContext"]
        ROUTER["React Router v7\n(lazy-loaded routes)"]
    end

    subgraph LAYOUT["Основной Layout"]
        SIDEBAR["AppSidebar\napp-sidebar.tsx"]
        HEADER["SiteHeader\nsite-header.tsx"]
        NAV_MAIN["NavMain\nnav-main.tsx"]
        NAV_USER["NavUser\nnav-user.tsx"]
        NAV_DOCS["NavDocuments\nnav-documents.tsx"]
    end

    subgraph PAGES["Страницы (pages/)"]
        P_HOME["HomePageLinear\n(Landing)"]
        P_LOGIN["LoginPage\n(Auth)"]
        P_UPLOAD["UploadPage\n(Загрузка)"]
        P_CHECK["CheckPage\n(Результаты проверки)"]
        P_DASH["DashboardPage\n(Дашборд)"]
        P_REPORT["ReportPage\n(Отчёт)"]
        P_HIST["HistoryPage\n(История)"]
        P_PROF["ProfilesPage\n(Профили)"]
        P_KEYS["APIKeysPage\n(API-ключи)"]
        P_BILL["BillingPage\n(Оплата)"]
        P_ACC["AccountPage\n(Аккаунт)"]
        P_ADM["AdminPage\n(Администратор)"]
        P_PREV["PreviewPage\n(Предпросмотр)"]
        P_OAUTH["OAuthCallbackPage\n(OAuth-callback)"]
    end

    subgraph COMPONENTS["Компоненты (components/)"]
        C_AUTH["auth/\n• AuthShell\n• OAuthLogin\n• GoogleOAuthLogin"]
        C_UI["ui/ (Shadcn/Radix)\n• button, dialog, input\n• table, sidebar, card\n• badge, tooltip, tabs\n• (15+ компонентов)"]
        C_DOC["Документы\n• DocumentViewer\n• DataTable"]
        C_PROF["Профили\n• ProfileEditor\n• ProfileComparison\n• ProfileValidation\n• ProfileStatistics"]
        C_ERR["ErrorBoundary"]
        C_DEMO["DemoSection"]
    end

    subgraph API_CLIENT["api/client.ts"]
        AX["Axios instance\n+ interceptors\n(JWT refresh)"]
        TYPES["TypeScript типы\n(User, Document,\nSubscription, APIKey...)"]
    end

    APP --> LAYOUT
    APP --> PAGES
    PAGES --> COMPONENTS
    PAGES --> API_CLIENT
    LAYOUT --> C_UI
```

---

## 12. Состояния документа (State Machine)

```mermaid
stateDiagram-v2
    [*] --> UPLOADED : POST /upload (файл принят)

    UPLOADED --> CHECKING : Начало валидации\n(sync или Celery task)
    CHECKING --> CHECKED : ValidationEngine завершён\n(check_results сохранены)
    CHECKING --> ERROR : Ошибка обработки\n(невалидный DOCX и т.д.)

    CHECKED --> CORRECTING : POST /correct\n(пользователь запросил исправление)
    CHECKED --> CHECKED : Повторная проверка\n(другой профиль)

    CORRECTING --> CORRECTED : DocumentCorrector завершён\n(corrected_filename сохранён)
    CORRECTING --> ERROR : Ошибка исправления

    CORRECTED --> CORRECTING : Повторное исправление\n(другой профиль)

    CHECKED --> [*] : Скачать отчёт\n(generate-report)
    CORRECTED --> [*] : Скачать исправленный файл

    ERROR --> UPLOADED : Повторная загрузка
    ERROR --> [*] : Удалить документ

    note right of CHECKING
        WebSocket события:
        progress_update
        task_complete
        error_occurred
    end note
```

---

## 13. Жизненный цикл подписки (State Machine)

```mermaid
stateDiagram-v2
    [*] --> FREE : Регистрация\n(роль USER)

    FREE --> TRIAL : Начало пробного периода

    FREE --> ACTIVE : Оформить подписку\n(Stripe / YooKassa)
    TRIAL --> ACTIVE : Оплата после пробного

    ACTIVE --> CANCELLED : Пользователь отменил\n(webhook: subscription.deleted)
    ACTIVE --> EXPIRED : Срок истёк\n(без продления)
    ACTIVE --> ACTIVE : Успешное продление\n(webhook: invoice.succeeded)

    TRIAL --> EXPIRED : Пробный период истёк

    CANCELLED --> ACTIVE : Повторная подписка
    EXPIRED --> ACTIVE : Повторная подписка

    CANCELLED --> [*]
    EXPIRED --> [*]

    note right of ACTIVE
        Stripe webhooks:
        • customer.subscription.deleted
        • invoice.payment_succeeded
        • invoice.payment_failed

        YooKassa webhooks:
        • payment.succeeded
        • payment.canceled
    end note
```

---

## 14. Поток оплаты — Stripe

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant FE as Frontend
    participant BE as Backend
    participant Stripe as Stripe API
    participant DB as PostgreSQL

    User->>FE: Выбрать тарифный план
    FE->>BE: GET /api/payments/plans
    BE-->>FE: [{plan, price, features}]
    FE->>BE: POST /api/payments/subscribe\n{plan, payment_method_id}
    BE->>Stripe: customers.create(email)
    Stripe-->>BE: {customer_id}
    BE->>Stripe: subscriptions.create\n{customer, price_id, payment_method}
    Stripe-->>BE: {subscription_id, status}
    BE->>DB: Создать Subscription\n(plan, status=ACTIVE, stripe_subscription_id)
    BE->>DB: Создать Payment\n(amount, status=COMPLETED)
    BE->>DB: Обновить User.role → PRO/TEAM/...
    BE-->>FE: {success, subscription}
    FE-->>User: "Подписка оформлена!"

    Note over Stripe,BE: Async Webhooks

    Stripe->>BE: POST /api/payments/webhook/stripe\n(X-Stripe-Signature)
    BE->>BE: Проверить подпись\n(STRIPE_WEBHOOK_SECRET)
    alt invoice.payment_succeeded
        BE->>DB: Продлить Subscription.expires_at
        BE->>DB: Создать Payment (COMPLETED)
    else invoice.payment_failed
        BE->>DB: Subscription.status = INACTIVE
        BE->>DB: Создать Payment (FAILED)
    else customer.subscription.deleted
        BE->>DB: Subscription.status = CANCELLED
        BE->>DB: User.role → USER
    end
    BE-->>Stripe: 200 OK
```

---

## 15. Поток оплаты — YooKassa

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant FE as Frontend
    participant BE as Backend
    participant YK as YooKassa API
    participant DB as PostgreSQL

    User->>FE: Выбрать план (RU рынок)
    FE->>BE: POST /api/payments/subscribe\n{plan, provider="yookassa"}
    BE->>YK: Создать платёж\n{amount, currency=RUB, capture=true}
    YK-->>BE: {payment_id, confirmation_url}
    BE->>DB: Создать Payment\n(status=PENDING, provider=yookassa)
    BE-->>FE: {confirmation_url}
    FE-->>User: Редирект на YooKassa\n(3DS страница)
    User->>YK: Оплатить
    YK->>BE: POST /api/payments/webhook/yookassa\n{event: payment.succeeded}
    BE->>DB: Обновить Payment → COMPLETED
    BE->>DB: Создать Subscription (ACTIVE)
    BE->>DB: Обновить User.role
    BE-->>YK: 200 OK
    User->>FE: Вернуться на сайт
    FE->>BE: GET /api/payments/subscription
    BE-->>FE: {plan, status: ACTIVE}
    FE-->>User: "Подписка активна!"
```

---

## 16. Управление API-ключами

```mermaid
flowchart TD
    subgraph CREATE["Создание ключа"]
        A1["POST /api/api-keys\n{name, scopes, rate_limit}"] --> B1["Генерировать ключ\nsk_<prefix>_<random64>"]
        B1 --> C1["sha256(key) → key_hash\nSохранить key_prefix"]
        C1 --> D1["Создать APIKey в DB\n(key_hash, scopes, rate_limit)"]
        D1 --> E1["Создать AuditLog\n(event=created)"]
        E1 --> F1["Вернуть ключ\n(единственный раз!)"]
    end

    subgraph AUTH["Аутентификация по ключу"]
        A2["Request: X-API-Key: sk_xxx_..."] --> B2["Извлечь prefix"]
        B2 --> C2["Найти APIKey по prefix\n(WHERE is_active=True)"]
        C2 --> D2{sha256(input)\n== key_hash?}
        D2 -->|Нет| E2["401 Invalid Key"]
        D2 -->|Да| F2{Срок не истёк?}
        F2 -->|Истёк| G2["401 Key Expired"]
        F2 -->|OK| H2{Scope разрешён?}
        H2 -->|Нет| I2["403 Forbidden"]
        H2 -->|Да| J2{Rate limit OK?}
        J2 -->|Превышен| K2["429 Too Many Requests"]
        J2 -->|OK| L2["Обновить last_used_at\nusage_count++"]
        L2 --> M2["Запрос разрешён"]
    end

    subgraph AUDIT["Аудит"]
        N["Все операции с ключами\nписьменно фиксируются в\nAPIKeyAudit:\n• created, deleted, regenerated\n• used, rate_limited\n+ ip_address, user_agent"]
    end

    style E2 fill:#f44,color:#fff
    style G2 fill:#f44,color:#fff
    style I2 fill:#f44,color:#fff
    style K2 fill:#f44,color:#fff
    style M2 fill:#4a4,color:#fff
```

---

## 17. Модель ролей и доступа (RBAC)

```mermaid
graph TD
    subgraph ROLES["Роли пользователей"]
        GUEST["GUEST\n(неаутентифицирован)"]
        USER["USER\n(зарегистрирован)"]
        PRO["PRO\n(платная подписка)"]
        TEAM["TEAM\n(командная подписка)"]
        ENTERPRISE["ENTERPRISE\n(корпоративная)"]
        ADMIN["ADMIN\n(администратор)"]
    end

    subgraph PERMS["Разрешения"]
        P1["• Проверить документ\n  1 раз/день"]
        P2["• Просмотр результатов\n• История документов"]
        P3["• Проверка 5 раз/день\n• Экспорт отчётов"]
        P4["• Неограниченные проверки\n• Автоисправление\n• API-ключи\n• Пакетная загрузка"]
        P5["• Всё из PRO\n• 10 пользователей\n• Командные профили"]
        P6["• Всё из TEAM\n• AI-функции\n• SLA поддержка\n• Кастомный профиль"]
        P7["• Полный доступ\n• Управление пользователями\n• Системные настройки\n• Метрики / мониторинг"]
    end

    GUEST --> P1
    USER --> P1 & P2 & P3
    PRO --> P1 & P2 & P3 & P4
    TEAM --> P1 & P2 & P3 & P4 & P5
    ENTERPRISE --> P1 & P2 & P3 & P4 & P5 & P6
    ADMIN --> P7

    subgraph UPGRADE["Повышение роли"]
        U1["Регистрация → USER"]
        U2["Оплата STUDENT → USER+"]
        U3["Оплата PRO → PRO"]
        U4["Оплата TEAM → TEAM"]
        U5["Договор → ENTERPRISE"]
        U6["Ручное → ADMIN"]
    end
```

---

## 18. Диаграмма классов — Модели

```mermaid
classDiagram
    class User {
        +int id
        +str email
        +str password_hash
        +str first_name
        +str last_name
        +str organization
        +UserRole role
        +str oauth_provider
        +str oauth_id
        +bool is_email_verified
        +str totp_secret
        +list backup_codes
        +bool totp_enabled
        +datetime created_at
        +set_password(password)
        +check_password(password) bool
        +to_dict() dict
    }

    class Document {
        +int id
        +int user_id
        +str filename
        +str file_path
        +DocumentStatus status
        +str profile_id
        +dict check_results
        +int total_issues_count
        +float completion_percentage
        +dict correction_results
        +str corrected_filename
        +str celery_task_id
        +to_dict() dict
    }

    class Subscription {
        +int id
        +int user_id
        +str plan
        +SubscriptionStatus status
        +float amount
        +str currency
        +datetime started_at
        +datetime expires_at
        +str stripe_subscription_id
        +str yookassa_subscription_id
        +is_active() bool
        +to_dict() dict
    }

    class Payment {
        +int id
        +int user_id
        +float amount
        +str currency
        +PaymentStatus status
        +str provider
        +str transaction_id
        +dict payment_metadata
        +datetime completed_at
        +to_dict() dict
    }

    class APIKey {
        +int id
        +int user_id
        +str name
        +str key_hash
        +str key_prefix
        +list scopes
        +int rate_limit
        +bool is_active
        +int usage_count
        +datetime last_used_at
        +datetime expires_at
        +verify_key(key) bool
        +has_scope(scope) bool
        +is_expired() bool
        +to_dict() dict
    }

    class APIKeyAudit {
        +int id
        +int user_id
        +int api_key_id
        +str event
        +dict details
        +str ip_address
        +str user_agent
        +datetime created_at
    }

    class UserRole {
        <<enumeration>>
        GUEST
        USER
        PRO
        TEAM
        ENTERPRISE
        ADMIN
    }

    class DocumentStatus {
        <<enumeration>>
        UPLOADED
        CHECKING
        CHECKED
        CORRECTING
        CORRECTED
        ERROR
    }

    class SubscriptionStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
        TRIAL
        CANCELLED
        EXPIRED
    }

    class PaymentStatus {
        <<enumeration>>
        PENDING
        COMPLETED
        FAILED
        REFUNDED
    }

    User "1" --> "N" Document : uploads
    User "1" --> "N" Subscription : has
    User "1" --> "N" Payment : makes
    User "1" --> "N" APIKey : owns
    APIKey "1" --> "N" APIKeyAudit : logs
    User --> UserRole
    Document --> DocumentStatus
    Subscription --> SubscriptionStatus
    Payment --> PaymentStatus
```

---

## 19. Диаграмма классов — Сервисы

```mermaid
classDiagram
    class ValidationEngine {
        +list validators
        +load_profile(profile_id) dict
        +validate_document(doc_data, profile) dict
        +aggregate_results(results) dict
        +calculate_score(issues) float
    }

    class DocumentProcessor {
        +extract_data(docx_path) dict
        +extract_paragraphs(doc) list
        +extract_tables(doc) list
        +extract_images(doc) list
        +extract_styles(doc) dict
        +extract_margins(doc) dict
        +extract_fonts(doc) list
        +extract_headers_footers(doc) dict
    }

    class DocumentCorrector {
        +correct_document_multipass(docx_path, profile) str
        +correct_fonts(doc, profile) int
        +correct_margins(doc, profile) int
        +correct_spacing(doc, profile) int
        +correct_structure(doc, profile) int
        +revalidate(doc_path, profile) dict
    }

    class XMLDocumentEditor {
        +load(docx_path)
        +edit_run_properties(xpath, props) int
        +edit_paragraph_properties(xpath, props) int
        +edit_section_properties(props) bool
        +save(output_path) str
        -_unzip(path) Path
        -_repack(xml_dir, output) str
    }

    class WorkflowService {
        +process_document(document_id, profile_id)
        +upload_and_check(file, user_id, profile_id) Document
        +check_document(document_id) dict
        +correct_document(document_id) dict
        +generate_report(document_id) str
    }

    class PaymentService {
        +get_plans() list
        +create_subscription(user, plan, payment_method) Subscription
        +cancel_subscription(user) bool
        +handle_stripe_webhook(payload, sig) bool
        +handle_yookassa_webhook(payload) bool
        +get_payment_history(user_id) list
    }

    class OAuthService {
        +get_providers() list
        +get_authorization_url(provider, state) str
        +handle_callback(provider, code, state) dict
        +get_user_info(provider, token) dict
        +create_or_update_user(provider, user_info) User
    }

    class EmailService {
        +send_verification_email(user) bool
        +send_password_reset_email(user, token) bool
        +send_payment_confirmation(user, payment) bool
        -_send_via_sendgrid(to, subject, html) bool
        -_send_via_smtp(to, subject, html) bool
    }

    class TokenService {
        +generate_tokens(user_id) dict
        +refresh_access_token(refresh_token) str
        +revoke_token(jti, expires_at)
        +is_token_revoked(jti) bool
    }

    class TOTPService {
        +generate_secret() str
        +get_qr_url(secret, email) str
        +verify_code(secret, code) bool
        +generate_backup_codes() list
        +verify_backup_code(user, code) bool
    }

    WorkflowService --> DocumentProcessor
    WorkflowService --> ValidationEngine
    WorkflowService --> DocumentCorrector
    DocumentCorrector --> XMLDocumentEditor
    ValidationEngine --> DocumentProcessor
```

---

## 20. Диаграмма классов — Валидаторы

```mermaid
classDiagram
    class BaseValidator {
        <<abstract>>
        +str name
        +str category
        +validate(doc_data, profile) ValidationResult
        +_check_rule(value, expected, tolerance) Issue
    }

    class ValidationResult {
        +str validator_name
        +list~Issue~ issues
        +bool passed
        +dict metadata
    }

    class Issue {
        +str severity "ERROR|WARNING|INFO"
        +str location "paragraph N / table M"
        +str message
        +str rule
        +str suggestion
    }

    class StructureValidator {
        +validate_sections(doc_data) list
        +validate_toc(doc_data) list
        +validate_section_order(doc_data) list
    }

    class FontValidator {
        +expected_font str
        +expected_size int
        +validate_paragraph_fonts(paragraphs) list
        +validate_heading_fonts(headings) list
        +validate_code_fonts(code_blocks) list
    }

    class MarginValidator {
        +left_cm float
        +right_cm float
        +top_cm float
        +bottom_cm float
        +validate_margins(section_props) list
    }

    class ParagraphValidator {
        +line_spacing float
        +first_line_indent_cm float
        +validate_spacing(paragraphs) list
        +validate_indent(paragraphs) list
    }

    class BibliographyValidator {
        +validate_bibliography(doc_data) list
        +validate_references(doc_data) list
        +check_source_format(source) bool
    }

    class HeadingValidator {
        +validate_hierarchy(headings) list
        +validate_numbering(headings) list
        +validate_heading_format(heading) list
    }

    class TableValidator {
        +validate_table_structure(tables) list
        +validate_captions(tables) list
        +check_caption_format(caption) bool
    }

    class CrossReferenceValidator {
        +validate_figure_refs(doc_data) list
        +validate_table_refs(doc_data) list
        +validate_section_refs(doc_data) list
    }

    BaseValidator <|-- StructureValidator
    BaseValidator <|-- FontValidator
    BaseValidator <|-- MarginValidator
    BaseValidator <|-- ParagraphValidator
    BaseValidator <|-- BibliographyValidator
    BaseValidator <|-- HeadingValidator
    BaseValidator <|-- TableValidator
    BaseValidator <|-- CrossReferenceValidator
    BaseValidator <|-- FormulaValidator
    BaseValidator <|-- ImageValidator
    BaseValidator <|-- AppendixValidator
    BaseValidator <|-- AdvancedFormatValidator
    BaseValidator <|-- HeaderFooterValidator
    BaseValidator <|-- FootnoteValidator
    BaseValidator <|-- PageBreakValidator
    BaseValidator --> ValidationResult
    ValidationResult "1" --> "N" Issue
```

---

## 21. Диаграмма классов — Корректоры

```mermaid
classDiagram
    class BaseCorrector {
        <<abstract>>
        +str name
        +apply(doc, profile) CorrectionResult
        +can_fix(issue) bool
    }

    class CorrectionResult {
        +str corrector_name
        +int fixes_applied
        +list~str~ changes_log
        +list~str~ remaining_issues
    }

    class FontCorrector {
        +target_font str
        +target_size int
        +apply(doc, profile) CorrectionResult
        +fix_paragraph_font(para, font, size)
        +fix_heading_font(heading, profile)
    }

    class FormattingCorrector {
        +apply(doc, profile) CorrectionResult
        +fix_line_spacing(para, spacing)
        +fix_first_line_indent(para, indent_cm)
        +fix_paragraph_spacing(para)
    }

    class StructureCorrector {
        +apply(doc, profile) CorrectionResult
        +fix_section_numbering(doc)
        +fix_heading_levels(doc)
        +rebuild_toc(doc)
    }

    class StyleCorrector {
        +apply(doc, profile) CorrectionResult
        +fix_margins(doc, profile)
        +fix_page_size(doc)
        +fix_orientation(doc)
    }

    class ContentCorrector {
        +apply(doc, profile) CorrectionResult
        +fix_bibliography_numbering(doc)
        +fix_figure_captions(doc)
        +fix_table_captions(doc)
    }

    class DocumentCorrector {
        +list~BaseCorrector~ correctors
        +correct_document_multipass(path, profile) str
        +_run_pass(doc, corrector, profile) CorrectionResult
        +_revalidate(path, profile) dict
    }

    class XMLDocumentEditor {
        +docx_path str
        +load()
        +save(output) str
        +edit_run_properties(para_idx, run_idx, props)
        +edit_paragraph_properties(para_idx, props)
        +edit_section_properties(props)
        -xml_tree ElementTree
    }

    BaseCorrector <|-- FontCorrector
    BaseCorrector <|-- FormattingCorrector
    BaseCorrector <|-- StructureCorrector
    BaseCorrector <|-- StyleCorrector
    BaseCorrector <|-- ContentCorrector
    DocumentCorrector "1" --> "N" BaseCorrector
    DocumentCorrector --> XMLDocumentEditor
    BaseCorrector --> CorrectionResult
```

---

## 22. Sequence: Вход пользователя

```mermaid
sequenceDiagram
    actor User as Пользователь
    participant FE as Frontend (React)
    participant AC as AuthContext
    participant API as /api/auth
    participant DB as PostgreSQL
    participant Redis as Redis

    User->>FE: Заполнить email + пароль
    User->>FE: Нажать "Войти"
    FE->>AC: login(email, password)
    AC->>API: POST /api/auth/login
    API->>DB: SELECT * FROM users WHERE email=?
    DB-->>API: User record
    API->>API: werkzeug.check_password_hash()

    alt Неверный пароль
        API-->>AC: 401 {error: "Invalid credentials"}
        AC-->>FE: throw Error
        FE-->>User: "Неверный email или пароль"
    else 2FA включён
        API-->>AC: 200 {requires_2fa: true, temp_token}
        AC-->>FE: показать форму 2FA
        User->>FE: Ввести TOTP-код
        FE->>API: POST /api/auth/2fa/verify {code, temp_token}
        API->>API: pyotp.verify(code, secret)
        API->>API: Сгенерировать JWT
        API-->>AC: 200 {access_token, refresh_token, user}
    else Успешный вход
        API->>API: Сгенерировать JWT\n(access 1ч + refresh 30д)
        API-->>AC: 200 {access_token, refresh_token, user}
    end

    AC->>AC: localStorage.setItem(tokens, user)
    AC-->>FE: isAuthenticated = true
    FE-->>User: Редирект → Dashboard
```

---

## 23. Sequence: Загрузка и проверка документа

```mermaid
sequenceDiagram
    actor User as Пользователь
    participant FE as Frontend
    participant BE as Backend API
    participant Celery as Celery Worker
    participant WS as WebSocket
    participant DB as PostgreSQL

    User->>FE: Перетащить DOCX файл
    User->>FE: Выбрать профиль (ГОСТ/ВУЗ)
    User->>FE: Нажать "Проверить"
    FE->>BE: POST /api/document/upload\n{file, profile_id}\nAuthorization: Bearer <token>
    BE->>BE: Валидировать файл\n(расширение, размер ≤50MB)
    BE->>DB: INSERT INTO documents\n(status=UPLOADED, profile_id)
    BE->>Celery: task = process_document.delay(doc_id)
    BE->>DB: UPDATE documents SET celery_task_id=task.id
    BE-->>FE: 202 {document_id, status: "UPLOADED"}

    FE->>WS: connect()
    FE->>WS: subscribe(document_id)

    loop Обработка документа
        Celery->>WS: emit("progress_update", {doc_id, step, pct})
        WS-->>FE: progress_update event
        FE-->>User: Прогресс-бар обновляется
    end

    Celery->>DB: UPDATE documents\n(status=CHECKED,\ncheck_results=JSON)
    Celery->>WS: emit("task_complete", {doc_id})
    WS-->>FE: task_complete event
    FE->>BE: GET /api/validation/check?doc_id={id}
    BE->>DB: SELECT check_results
    DB-->>BE: {issues, score, completion_%}
    BE-->>FE: 200 {results}
    FE-->>User: Показать страницу результатов\n(CheckPage)
```

---

## 24. Sequence: Автоисправление документа

```mermaid
sequenceDiagram
    actor User as Пользователь
    participant FE as Frontend (CheckPage)
    participant BE as Backend API
    participant Corr as DocumentCorrector
    participant XML as XMLDocumentEditor
    participant DB as PostgreSQL
    participant FS as Файловая система

    User->>FE: Нажать "Автоисправить"
    FE->>BE: POST /api/document/correct\n{document_id}
    BE->>DB: SELECT document (status=CHECKED)
    BE->>DB: UPDATE status=CORRECTING
    BE->>Corr: correct_document_multipass(path, profile)

    loop Многопроходное исправление
        Corr->>XML: load(docx_path)
        Corr->>XML: edit_run_properties() [шрифты]
        Corr->>XML: edit_paragraph_properties() [отступы]
        Corr->>XML: edit_section_properties() [поля]
        Corr->>XML: save(temp_path)
        Corr->>Corr: revalidate(temp_path, profile)
        Corr-->>Corr: {remaining_issues}
    end

    Corr->>FS: Сохранить corrected_<id>.docx\napp/static/corrections/
    Corr-->>BE: {corrected_path, fixes_applied, changes_log}
    BE->>DB: UPDATE documents\nSET corrected_filename=...\nstatus=CORRECTED\ncorrection_results=JSON
    BE-->>FE: 200 {corrected_url, fixes_applied}
    FE-->>User: "Исправлено N ошибок!"
    FE-->>User: Кнопка "Скачать исправленный файл"

    opt Генерация отчёта
        User->>FE: Нажать "Скачать отчёт"
        FE->>BE: POST /api/document/generate-report
        BE->>BE: Сформировать DOCX-отчёт\n(docxtpl)
        BE->>FS: Сохранить report_<id>.docx
        BE-->>FE: {report_url}
        FE-->>User: Скачать report_<id>.docx
    end
```

---

## 25. Sequence: Refresh JWT-токена

```mermaid
sequenceDiagram
    participant FE as Frontend (axios interceptor)
    participant BE as Backend API
    participant Redis as Redis (blacklist)
    participant DB as PostgreSQL

    FE->>BE: GET /api/auth/me\nAuthorization: Bearer <expired_access_token>
    BE->>Redis: Проверить JTI в blacklist
    BE->>BE: Декодировать JWT → TokenExpiredError
    BE-->>FE: 401 {error: "Token expired"}

    FE->>FE: Перехватчик Axios (interceptor)\nОбнаружить 401

    FE->>BE: POST /api/auth/refresh\n{refresh_token}
    BE->>BE: Декодировать refresh_token
    BE->>Redis: Проверить refresh JTI в blacklist
    alt Refresh token истёк или в blacklist
        BE-->>FE: 401 {error: "Refresh token expired"}
        FE->>FE: AuthContext.logout()
        FE-->>FE: Редирект → /login
    else OK
        BE->>DB: SELECT user WHERE id=sub
        BE->>BE: Сгенерировать новый access_token
        BE-->>FE: 200 {access_token}
        FE->>FE: Обновить localStorage.auth.token
        FE->>BE: Повторить оригинальный запрос\nс новым токеном
        BE-->>FE: 200 {данные}
    end
```

---

## 26. Структура профилей валидации

```mermaid
graph TB
    subgraph PROFILES["Профили (backend/profiles/)"]
        SYS1["bgpu_2023.json\n(БГПУ, системный)"]
        SYS2["default_gost.json\n(ГОСТ 7.32-2017)"]
        SYS3["gost_r_7_0_100_2018.json\n(ГОСТ для библиографии)"]
        CUSTOM["custom_*.json\n(пользовательские)"]
    end

    subgraph STRUCTURE["Структура профиля"]
        ROOT["Profile JSON"]
        ROOT --> META["Метаданные\n• id\n• name\n• category\n• is_system\n• version\n• description"]
        ROOT --> RULES["rules: {...}"]
        RULES --> FONT["font:\n• name: Times New Roman\n• size: 14\n• code_size: 12"]
        RULES --> MARGINS["margins:\n• left: 3.0 cm\n• right: 1.0 cm\n• top: 2.0 cm\n• bottom: 2.0 cm"]
        RULES --> SPACING["spacing:\n• line_spacing: 1.5\n• first_line_indent: 1.25\n• before: 0\n• after: 0"]
        RULES --> HEADINGS["headings:\n• numbering: true\n• bold: true\n• uppercase: varies"]
        RULES --> BIBLIO["bibliography:\n• format: GOST\n• numbering: true"]
        RULES --> PAGES["pages:\n• size: A4\n• orientation: portrait\n• page_numbers: true"]
    end

    subgraph API_FLOW["API управления профилями"]
        GET_LIST["GET /api/profiles\n→ все профили (system + user)"]
        GET_ONE["GET /api/profiles/<id>\n→ один профиль"]
        POST["POST /api/profiles\n{name, rules}\n→ создать пользовательский"]
        PATCH["PATCH /api/profiles/<id>\n{rules}\n→ обновить (только свои)"]
        DELETE["DELETE /api/profiles/<id>\n→ удалить (только свои)"]
    end

    SYS1 & SYS2 & SYS3 & CUSTOM --> STRUCTURE
    STRUCTURE --> API_FLOW
```

---

## 27. Дерево маршрутов фронтенда

```mermaid
graph TD
    ROOT["/"] --> HOME["HomePageLinear\n(Landing Page)"]

    ROOT --> AUTH["/login\nLoginPage\n(email + OAuth)"]
    ROOT --> OAUTH["/auth/:provider/callback\nOAuthCallbackPage"]

    ROOT --> PROTECTED["Защищённые маршруты\n(требуют JWT)"]

    PROTECTED --> DASH["/dashboard\nDashboardPage"]
    PROTECTED --> UPLOAD["/upload\nUploadPage"]
    PROTECTED --> CHECK["/check/:documentId\nCheckPage"]
    PROTECTED --> REPORT["/report/:documentId\nReportPage"]
    PROTECTED --> HISTORY["/history\nHistoryPage"]
    PROTECTED --> PREVIEW["/preview/:documentId\nPreviewPage"]

    PROTECTED --> PROFILES["/profiles\nProfilesPage"]
    PROFILES --> PROF_NEW["/profiles/new\nProfileEditor (create)"]
    PROFILES --> PROF_EDIT["/profiles/:id/edit\nProfileEditor (edit)"]
    PROFILES --> PROF_CMP["/profiles/compare\nProfileComparison"]

    PROTECTED --> ACCOUNT["/account\nAccountPage\n(профиль, 2FA, пароль)"]
    PROTECTED --> SETTINGS["/settings\nSettingsPage"]
    PROTECTED --> BILLING["/billing\nBillingPage\n(подписка, платежи)"]

    PROTECTED --> KEYS["/api-keys\nAPIKeysPage"]

    PROTECTED --> ADMIN["/admin\nAdminPage\n(только ADMIN)"]

    subgraph LAYOUTS["Layouts"]
        L_AUTH["AuthShell\n(форма входа)"]
        L_APP["AppLayout\n(sidebar + header)"]
        L_NONE["Без layout\n(landing, preview)"]
    end

    AUTH --> L_AUTH
    DASH & UPLOAD & CHECK --> L_APP
    HOME --> L_NONE
```

---

## 28. Обзорная диаграмма безопасности

```mermaid
graph TB
    subgraph PERIMETER["Периметр безопасности"]
        NGINX["Nginx\n• TLS termination\n• Rate limiting (IP)\n• Security headers"]
    end

    subgraph AUTH_LAYER["Слой аутентификации"]
        JWT["JWT Access Tokens\n• Expiry: 1ч\n• HS256 подпись\n• JTI в blacklist (Redis)"]
        REFRESH["JWT Refresh Tokens\n• Expiry: 30д\n• Ротация при обновлении"]
        APIKEY["API Key Auth\n• SHA-256 хэш в БД\n• Только префикс хранится\n• Scope-based access"]
        OAUTH2["OAuth2\n• Google / GitHub / Yandex\n• PKCE flow\n• State parameter (CSRF)"]
        TOTP["2FA TOTP\n• RFC 6238\n• 10 backup codes\n• Disable требует пароль"]
    end

    subgraph DATA["Защита данных"]
        PASS["Пароли\n• PBKDF2-SHA256\n• werkzeug.security"]
        EMAIL["Email верификация\n• Токен в Redis (TTL 24ч)\n• Одноразовый"]
        RESET["Password Reset\n• Токен в Redis (TTL 1ч)\n• Одноразовый"]
    end

    subgraph RATE["Rate Limiting"]
        RL_GLOBAL["Глобальный: 100 req/мин"]
        RL_LOGIN["Login: 20 попыток/ч"]
        RL_UPLOAD["Upload: 10 файлов/ч (free)"]
        RL_API["API Keys: индивидуальный"]
    end

    subgraph VALIDATION["Валидация входных данных"]
        FV["Файлы: только .docx, ≤50MB"]
        EV["Email: email-validator"]
        PV["Пароли: мин 8 символов"]
        TV["Токены: JWT + signature verify"]
    end

    subgraph DB_SEC["Безопасность БД"]
        ORM["SQLAlchemy ORM\n(параметрические запросы)"]
        NO_SQL["Нет сырых SQL-запросов"]
        ENUM["Enum типы для ролей и статусов"]
    end

    subgraph PAYMENT_SEC["Безопасность платежей"]
        STRIPE_SIG["Stripe webhook signature\nSTRIPE_WEBHOOK_SECRET"]
        NO_CARD["Карточные данные не хранятся\n(только Stripe token)"]
    end

    NGINX --> JWT & APIKEY
    JWT --> AUTH_LAYER
    OAUTH2 --> AUTH_LAYER
    TOTP --> AUTH_LAYER
    AUTH_LAYER --> RATE
    RATE --> VALIDATION
    VALIDATION --> DB_SEC
    DATA --> AUTH_LAYER
```

---

## Примечания по рендерингу

Все диаграммы используют **Mermaid** синтаксис. Для просмотра:

| Инструмент | Как использовать |
|------------|-----------------|
| **GitHub** | Откройте этот файл в браузере — диаграммы отрендерятся автоматически |
| **VS Code** | Установите плагин "Mermaid Preview" или "Markdown Preview Mermaid Support" |
| **Obsidian** | Поддерживается из коробки |
| **draw.io** | Импорт через Extras → Edit Diagram |
| **mermaid.live** | Вставить код отдельной диаграммы на сайт |
| **Notion** | Блок "Code" с языком "mermaid" |
