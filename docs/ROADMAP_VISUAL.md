# 📊 Визуальный Roadmap CURSA 2026

## Gantt-диаграмма основных вех

```mermaid
gantt
    title CURSA Development Roadmap 2026
    dateFormat YYYY-MM-DD
    section Q1 2026
    PostgreSQL Migration           :crit, db, 2026-01-15, 2w
    JWT Authentication            :crit, auth, 2026-02-01, 2w
    Role Model                    :crit, roles, 2026-03-01, 1w
    Payment Integration           :payment, 2026-03-10, 2w
    User Dashboard                :dashboard, 2026-03-20, 2w
    
    section Q2 2026
    Kubernetes Setup              :k8s, 2026-04-01, 3w
    CDN Integration               :cdn, 2026-04-15, 1w
    i18n Backend                  :i18n-be, 2026-05-01, 1w
    i18n Frontend                 :i18n-fe, 2026-05-10, 2w
    UI Redesign                   :redesign, 2026-06-01, 2w
    Interactive Preview           :preview, 2026-06-15, 2w
    
    section Q3 2026
    Admin Panel - Users           :admin-users, 2026-07-01, 2w
    Admin Panel - Analytics       :admin-analytics, 2026-07-15, 2w
    Bibliography Check            :bibliography, 2026-08-15, 2w
    Plagiarism Check              :plagiarism, 2026-09-01, 3w
    AI Assistant                  :ai, 2026-09-01, 3w
    
    section Q4 2026
    LMS Plugins                   :lms, 2026-10-01, 4w
    MS Word Add-in                :word, 2026-11-01, 4w
    Cloud Storage Integration     :cloud, 2026-11-15, 2w
    Profile Marketplace           :marketplace, 2026-12-01, 2w
    Profile Builder               :builder, 2026-12-10, 3w
```

## Timeline по версиям

```mermaid
timeline
    title Релизы 2026
    section Q1
        v1.4.0 : PostgreSQL : JWT Auth : Роли
        v1.5.0 : Платежи : Личный кабинет : Тарифы
    section Q2
        v1.6.0 : Kubernetes : CDN : Оптимизация
        v1.7.0 : Мультиязычность (RU/EN)
        v1.8.0 : Редизайн UI : Предпросмотр
    section Q3
        v2.0.0 : Панель администратора
        v2.1.0 : Библиография : Плагиат : AI
        v2.2.0 : Batch-обработка : Webhooks : CLI
    section Q4
        v2.3.0 : LMS Плагины : MS Word Add-in
        v2.4.0 : Мобильное приложение
        v2.5.0 : Маркетплейс профилей
```

## Архитектура компонентов

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[User Interface]
        PWA[PWA Service Worker]
        I18N[i18next]
    end
    
    subgraph "Backend (Flask)"
        API[REST API]
        WS[WebSocket]
        AUTH[JWT Auth]
        LIMITER[Rate Limiter]
    end
    
    subgraph "Services"
        CHECKER[Norm Control Checker]
        CORRECTOR[Document Corrector]
        XML[XML Editor]
        AI[AI Assistant]
        PLAGIARISM[Plagiarism Detector]
    end
    
    subgraph "Infrastructure"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis)]
        CELERY[Celery Workers]
        S3[S3 Storage]
    end
    
    subgraph "Monitoring"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        SENTRY[Sentry]
    end
    
    subgraph "Integrations"
        STRIPE[Stripe/Yookassa]
        LMS[Moodle/Canvas]
        CLOUD[Google Drive/OneDrive]
        WORD[MS Word Add-in]
    end
    
    UI --> API
    UI --> WS
    API --> AUTH
    API --> LIMITER
    API --> CHECKER
    API --> CORRECTOR
    API --> XML
    API --> AI
    API --> PLAGIARISM
    
    CORRECTOR --> CELERY
    CELERY --> REDIS
    API --> POSTGRES
    API --> S3
    
    API --> PROMETHEUS
    PROMETHEUS --> GRAFANA
    API --> SENTRY
    
    API --> STRIPE
    API --> LMS
    API --> CLOUD
    UI --> WORD
```

## User Flow (проверка документа)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant API
    participant Auth
    participant Celery
    participant Checker
    participant S3
    participant Email
    
    User->>Frontend: Загрузка DOCX
    Frontend->>API: POST /api/document/upload
    API->>Auth: Проверка JWT
    Auth-->>API: ✅ Authorized
    API->>S3: Сохранить файл
    API->>Celery: Запуск задачи
    API-->>Frontend: 202 Accepted (task_id)
    
    Frontend->>API: WebSocket подключение
    Celery->>Checker: Проверка правил
    Checker-->>Celery: Результаты (30+ правил)
    Celery->>API: Обновление статуса
    API-->>Frontend: Progress 50%
    
    Celery->>Checker: Автоисправление
    Checker-->>Celery: Исправленный DOCX
    Celery->>S3: Сохранить результат
    Celery->>API: Завершено
    API-->>Frontend: Progress 100%
    
    API->>Email: Отправить уведомление
    Frontend->>User: Показать результаты
```

## Monetization Flow

```mermaid
stateDiagram-v2
    [*] --> Guest
    Guest --> Free: Регистрация
    Free --> Pro: Оплата ₽499/мес
    Free --> Team: Оплата ₽2999/мес
    Pro --> Team: Upgrade
    Team --> Enterprise: Связь с Sales
    Pro --> Enterprise: Связь с Sales
    
    Guest: 1 проверка/день
    Free: 5 проверок/день
    Pro: Безлимит + Автоисправление + API
    Team: 10 юзеров + Статистика
    Enterprise: Кастомные профили + AI + SLA
    
    Free --> [*]: Отказ от подписки
    Pro --> Free: Downgrade
    Team --> Pro: Downgrade
```

## Priority Matrix

```mermaid
graph LR
    subgraph "High Impact + High Effort"
        A1[PostgreSQL Migration]
        A2[Kubernetes]
        A3[AI Assistant]
    end
    
    subgraph "High Impact + Low Effort"
        B1[JWT Auth]
        B2[Payment Integration]
        B3[i18n]
    end
    
    subgraph "Low Impact + High Effort"
        C1[Mobile App]
        C2[LibreOffice Extension]
    end
    
    subgraph "Low Impact + Low Effort"
        D1[Dark Theme]
        D2[Email Templates]
    end
    
    style A1 fill:#ff6b6b
    style A2 fill:#ff6b6b
    style A3 fill:#ff6b6b
    style B1 fill:#51cf66
    style B2 fill:#51cf66
    style B3 fill:#51cf66
    style C1 fill:#ffd43b
    style C2 fill:#ffd43b
    style D1 fill:#94d82d
    style D2 fill:#94d82d
```

## Технический долг Tracking

```mermaid
pie title Технический долг по компонентам
    "DocumentCorrector (Рефакторинг)" : 30
    "Test Coverage (50% → 80%)" : 25
    "TypeScript Migration" : 20
    "API Versioning" : 15
    "Устаревший код" : 10
```

## Метрики роста (прогноз)

```mermaid
xychart-beta
    title "MAU Growth 2026"
    x-axis [Q1, Q2, Q3, Q4]
    y-axis "Users" 0 --> 12000
    line [100, 1000, 5000, 10000]
```

---

**Примечание:** Все диаграммы можно рендерить в GitHub, GitLab, VS Code (с расширением Markdown Preview) или на [mermaid.live](https://mermaid.live).

**Легенда приоритетов:**
- 🔴 Критический (crit)
- 🟢 Низкий приоритет
- 🟡 Можно отложить

---

**Версия:** 1.0  
**Дата:** 02.02.2026
