# 🎯 Приоритетные задачи (Февраль 2026)

> **Обновлено:** 02.02.2026  
> **Спринт:** 2026-W05 (29.01 - 04.02)  
> **Фокус:** Подготовка к v1.4.0 (PostgreSQL + Auth)

---

## 🔥 Эта неделя (до 09.02.2026)

### P0 - Критический приоритет

- [ ] **Дизайн схемы PostgreSQL**
  - [ ] Таблица `users` (id, email, password_hash, role, created_at)
  - [ ] Таблица `subscriptions` (id, user_id, plan, status, expires_at)
  - [ ] Таблица `documents` (id, user_id, filename, status, results_json)
  - [ ] Таблица `payments` (id, user_id, amount, provider, transaction_id)
  - [ ] Таблица `api_keys` (id, user_id, key_hash, scopes)
  - [ ] ER-диаграмма в docs/
  - **Ответственный:** Backend Lead
  - **Дедлайн:** 06.02.2026

- [ ] **Настройка PostgreSQL в Docker**
  - [ ] Обновить docker-compose.yml
  - [ ] Добавить postgres service с persistence
  - [ ] pgAdmin4 для управления (опционально)
  - [ ] Скрипты миграции `backend/migrations/`
  - **Ответственный:** DevOps
  - **Дедлайн:** 07.02.2026

- [ ] **Flask-SQLAlchemy models**
  - [ ] `app/models/user.py`
  - [ ] `app/models/subscription.py`
  - [ ] `app/models/document.py`
  - [ ] `app/models/payment.py`
  - [ ] Relationships (foreign keys)
  - **Ответственный:** Backend Dev
  - **Дедлайн:** 08.02.2026

### P1 - Высокий приоритет

- [ ] **Flask-Migrate setup**
  - [ ] `flask db init`
  - [ ] Первая миграция (initial schema)
  - [ ] Скрипт для тестовых данных (seed.py)
  - **Ответственный:** Backend Dev
  - **Дедлайн:** 09.02.2026

- [ ] **JWT Authentication (базовая версия)**
  - [ ] Эндпоинт POST /api/auth/register
  - [ ] Эндпоинт POST /api/auth/login
  - [ ] Генерация access + refresh tokens
  - [ ] Middleware для проверки JWT
  - **Ответственный:** Backend Dev
  - **Дедлайн:** 09.02.2026

---

## 📅 Следующая неделя (10.02 - 16.02.2026)

### Backend

- [ ] **OAuth2 интеграция**
  - [ ] Google OAuth
  - [ ] GitHub OAuth
  - [ ] Яндекс ID
  - **Библиотека:** Authlib или Flask-Dance

- [ ] **Email-верификация**
  - [ ] Генерация токена подтверждения
  - [ ] Эндпоинт GET /api/auth/verify-email?token=xxx
  - [ ] Email-шаблон "Подтвердите email"

- [ ] **Восстановление пароля**
  - [ ] POST /api/auth/forgot-password
  - [ ] POST /api/auth/reset-password
  - [ ] Email-шаблон "Восстановление пароля"

### Frontend

- [ ] **Страница Register/Login**
  - [ ] Форма регистрации (email, password, confirm)
  - [ ] Форма входа (email, password, remember me)
  - [ ] OAuth кнопки (Google, GitHub, Яндекс)
  - [ ] Валидация полей (Formik/React Hook Form)
  - **Дизайн:** Material UI v5

- [ ] **Protected Routes**
  - [ ] Higher-order component `RequireAuth`
  - [ ] Редирект на /login для неавторизованных
  - [ ] Хранение JWT в localStorage/sessionStorage

---

## 🗓️ Месячный план (до 01.03.2026)

### v1.4.0 - База данных и пользователи

**Чеклист:**

- [x] Celery/Redis (уже есть v1.3.0 ✅)
- [ ] PostgreSQL миграция (в работе)
- [ ] JWT Authentication (в работе)
- [ ] Ролевая модель (Guest, User, Pro, Enterprise, Admin)
- [ ] Endpoints:
  - [ ] GET /api/users/me (профиль текущего юзера)
  - [ ] PATCH /api/users/me (обновление профиля)
  - [ ] GET /api/users/me/documents (история проверок)
  - [ ] DELETE /api/users/me (удаление аккаунта)
- [ ] Unit-тесты для auth (coverage > 80%)
- [ ] Integration-тесты для auth flow
- [ ] Документация API (Swagger)

**Релиз:** 28.02.2026

---

## 🎯 Квартальные цели Q1 2026

### v1.5.0 - Монетизация (март)

- [ ] Stripe интеграция
- [ ] Yookassa интеграция
- [ ] Webhook handlers
- [ ] Страница тарифных планов
- [ ] Личный кабинет (MVP)
- [ ] Управление подпиской

**Релиз:** 31.03.2026

### Бизнес-метрики

- [ ] 100+ зарегистрированных пользователей
- [ ] 10+ платных подписок
- [ ] MRR ≥ ₽5,000
- [ ] NPS > 30

---

## 🛠️ Технический долг (параллельно)

### Можно делать в любое время

- [ ] **Рефакторинг DocumentCorrector**
  - Разделить на модули: StyleCorrector, StructureCorrector, ContentCorrector
  - **Estimate:** 3-5 дней
  - **Приоритет:** P2 (средний)

- [ ] **Удаление устаревшего кода**
  - `format_checker.py` (не используется)
  - Неактивные профили
  - **Estimate:** 1 день
  - **Приоритет:** P3 (низкий)

- [ ] **Улучшение test coverage**
  - Текущее: ~50%
  - Цель Q1: 70%
  - Цель Q2: 80%
  - **Estimate:** Постоянная задача (+5% каждую неделю)

---

## 📊 Дашборд прогресса

### v1.4.0 (PostgreSQL + Auth)

```
[████████████░░░░░░░░] 60% (12/20 задач)

✅ Docker Compose (Celery, Redis)
✅ PostgreSQL service
🔄 Database schema design (в работе)
🔄 Flask-SQLAlchemy models (в работе)
⏳ Flask-Migrate
⏳ JWT endpoints
⏳ OAuth2
⏳ Email verification
⏳ Frontend Register/Login
⏳ Protected Routes

Дедлайн: 28.02.2026 (26 дней)
```

### v1.5.0 (Payments)

```
[██░░░░░░░░░░░░░░░░░░] 10% (2/20 задач)

✅ Stripe account setup
✅ Yookassa account setup
⏳ Payment models
⏳ Webhook handlers
⏳ Subscription logic
⏳ Frontend pricing page
⏳ Dashboard
⏳ Billing settings

Дедлайн: 31.03.2026 (57 дней)
```

---

## 🚨 Блокеры и риски

| Блокер | Влияние | Решение | Статус |
|--------|---------|---------|--------|
| Нет PostgreSQL схемы | Критическое | Backend Lead разрабатывает | 🔄 В работе |
| Нет опыта с JWT | Среднее | Изучить Flask-JWT-Extended docs | ⏳ Запланировано |
| Stripe API сложность | Среднее | Использовать SDK + примеры | 📚 Исследование |

---

## 📞 Daily Standup (ежедневно 10:00)

**Формат:**
1. Что сделано вчера?
2. Что буду делать сегодня?
3. Есть ли блокеры?

**Канал:** Telegram/Slack/Discord

---

## 🔗 Полезные ссылки

### Документация

- [PostgreSQL 15 Docs](https://www.postgresql.org/docs/15/)
- [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Yookassa API](https://yookassa.ru/developers)

### Roadmap

- [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)
- [ROADMAP_BRIEF.md](ROADMAP_BRIEF.md)
- [IMPROVEMENTS.md](IMPROVEMENTS.md)

### Инструменты

- [pgAdmin4](https://www.pgadmin.org/)
- [Postman](https://www.postman.com/) - тестирование API
- [draw.io](https://app.diagrams.net/) - ER-диаграммы

---

**Версия:** 1.0  
**Следующее обновление:** 09.02.2026
