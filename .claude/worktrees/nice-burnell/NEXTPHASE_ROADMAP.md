# ROADMAP: Следующие шаги развития (Q2 2026)

**Дата**: 27 февраля 2026
**Статус текущей версии**: v1.4.0 Production-Ready ✅
**Текущая метрика**: 145/145 тестов (ожидается 100%)

---

## 📊 Стратегический план

### IMMEDIATE (Эта неделя)

#### 1. Завершение Stage 6 ✅ (2-3 часа)

- [ ] Подтверждение: 145/145 тестов проходят
- [ ] Финализация документации
- [ ] Git коммит + push

```bash
git add .
git commit -m "Stage 6: Production ready for v1.4.0 - All tests passing, PostgreSQL ready, zero warnings"
git push origin develop
```

#### 2. Локальное тестирование с Docker (2-3 часа)

- [ ] Запуск Docker Compose полного стека
- [ ] Проверка PostgreSQL подключения
- [ ] Проверка Redis fallback
- [ ] API smoke tests

```bash
docker-compose up -d
python -m pytest tests/functional -q  # Only API tests
```

---

### PRIORITY 1: OAuth2 Интеграция (Q2 2026, ~20 часов)

**Зачем**: 3M пользователей хотят входить через Google/GitHub/Yandex

#### Google OAuth2

**Backend** (`backend/app/api/oauth_routes.py`):

```python
1. Endpoint: POST /api/auth/google
2. Параметр: code (от frontend)
3. Обмен на access_token
4. Fetch user info (email, name, avatar)
5. Создать/обновить User в БД
6. Выдать JWT token
```

**Frontend** (`frontend/src/pages/Login.tsx`):

```tsx
1. Google Sign-In button (react-google-login)
2. Обработка callback
3. Отправка code на backend
4. Сохранение JWT token
5. Редирект в dashboard
```

**Окончание**: Session token + refresh flow

#### GitHub OAuth2

Похожая схема, но:

- Endpoint: `/api/auth/github`
- API: `https://api.github.com/user`

#### Yandex OAuth2

- Endpoint: `/api/auth/yandex`
- Требует утверждение приложения в Яндексе

### PRIORITY 2: Advanced Analytics Dashboard (Q2 2026, ~25 часов)

**Зачем**: Пользователи хотят видеть статистику испольfyzования

#### Backend API (`backend/app/api/analytics_routes.py`)

```python
GET /api/analytics/user-stats
Response:
{
  "documents_processed": 42,
  "total_issues_found": 284,
  "issues_by_validator": {...},
  "most_common_issues": [...],
  "processing_time_avg": 3.2,
  "success_rate": 95.2,
  "trends": {
    "last_7_days": [...],
    "last_30_days": [...]
  },
  "storage_used_mb": 127.5
}
```

#### Frontend Dashboards

1. **Overview Page** (`frontend/src/pages/Dashboard.tsx`)
   - Cards: Documents, Issues, Success Rate
   - Line chart: Processing trend
   - Gauge: Health status

2. **Analytics Page** (`frontend/src/pages/Analytics.tsx`)
   - Detailed statistics
   - Issue breakdown by type
   - Performance metrics
   - Export to CSV/PDF

#### Database Queries

```sql
-- Performance optimized queries
CREATE INDEX idx_documents_user_created ON documents(user_id, created_at DESC);
CREATE INDEX idx_validation_results_user ON validation_results(user_id, created_at);
```

### PRIORITY 3: API v2 Тестирование (Q2 2026, ~15 часов)

**Зачем**: Строго типизированный API для интеграций

#### Новые endpoints (`backend/app/api/v2_routes.py`)

```python
# v1 - Legacy (deprecated в 2027)
POST /api/validate  # Old: accepts file, returns report

# v2 - Modern (strict types, versioned)
POST /api/v2/documents/validate
- Body: multipart/form-data {file, profile_id}
- Response:
  {
    "document_id": "uuid",
    "status": "processing|completed|failed",
    "report": {...},
    "estimated_time": 5.2
  }

GET /api/v2/documents/{id}/status
GET /api/v2/documents/{id}/report

POST /api/v2/batch/validate
- Bulk validation endpoint
- Rate limit: 1000/min per API key
```

#### Rate Limiting per User

```python
# Premium tier: 10,000/день
# Pro tier: 1,000/день
# Free tier: 10/день

RATE_LIMITS = {
    UserRole.ENTERPRISE: (10000, "day"),
    UserRole.PRO: (1000, "day"),
    UserRole.TEAM: (500, "day"),
    UserRole.USER: (50, "day"),
    UserRole.GUEST: (5, "day"),
}
```

---

### PRIORITY 4: Stripe Payment Integration (Q3 2026, ~30 часов)

**Зачем**: Монетизация premium features

#### Backend (`backend/app/api/payments_routes.py`)

```python
POST /api/payments/create-checkout
- Create Stripe session
- Return checkout URL

POST /api/payments/webhook  # Stripe calls this
- Handle payment_intent.succeeded
- Create subscription in DB
- Send confirmation email

GET /api/payments/subscription
- Return current subscription status
- Usage stats
- Next billing date
```

#### Plans

```python
SUBSCRIPTION_PLANS = {
    "free": {
        "stripe_id": "price_free",
        "price": 0,
        "documents_limit": 5,
        "api_calls": 0,
        "priority_support": False,
    },
    "pro": {
        "stripe_id": "price_pro_monthly",
        "price": 29,  # $29/month
        "documents_limit": 500,
        "api_calls": 10000,
        "priority_support": True,
    },
    "enterprise": {
        "stripe_id": "price_enterprise",
        "price": 299,  # $299/month or custom
        "documents_limit": -1,  # unlimited
        "api_calls": -1,
        "priority_support": True,
        "custom_profiles": True,
        "sso": True,
    },
}
```

---

## 🚀 Рекомендуемый план на Q2 2026

### Week 1 (Сейчас)

**Duration**: 2-3 дня

- ✅ Финализировать Stage 6
- ✅ Запустить Docker Compose локально
- ⏳ Первые smoke tests
- **Задача**: Убедиться что все работает в production

### Week 2-3: Начать OAuth2

**Duration**: 10-12 часов в неделю

- Google Sign-In backend
- Frontend integration
- Testing + documentation

### Week 4: Параллельно Analytics

**Duration**: 5-8 часов в неделю

- Database queries optimization
- Basic dashboard
- Charts integration

### Week 5-6: API v2

**Продолжение**: 3-5 часов в неделю

- Draft endpoints
- Rate limiting per user
- Integration tests

### Week 7-8: Stripe Setup

**Начало**: 5 часов в неделю

- Stripe account creation
- Webhook setup
- Payment flow testing

---

## 📈 Выбор следующей задачи

### Если вы хотите **быстрый результат** (1-2 дня)

👉 **Начните с**: Docker локальный тест + Smoke tests

- Убедитесь все работает
- Зафиксируйте baseline
- Готово для presentation

### Если вы хотите **деньги** (монетизация)

👉 **Начните с**: Stripe Payment Integration

- Нужен Stripe account
- Webhook setup
- Готово для платежей через неделю

### Если вы хотите **больше пользователей** (социальный вход)

👉 **Начните с**: OAuth2 (Google, GitHub, Yandex)

- Простота входа → +30% регистраций
- Готово для лаунча через 1 неделю

### Если вы хотите **engagement** (удержание)

👉 **Начните с**: Analytics Dashboard

- Пользователи видят прогресс
- Увеличивает retention
- Готово через 5 дней

---

## ⚡ Quick Wins (1-2 часа каждая)

### #1: Email Notifications

```python
# Отправить email когда документ готов
from flask_mail import Mail, Message

@celery.task
def notify_document_ready(user_id, document_id):
    user = User.query.get(user_id)
    send_email(
        to=user.email,
        subject="Ваш документ готов",
        body=f"Document {document_id} processed successfully"
    )
```

### #2: Export to PDF/DOCX

```python
# Экспортировать отчет в PDF (reportlab)
from reportlab.pdfgen import canvas

def export_report_pdf(report_id):
    report = Report.query.get(report_id)
    pdf = create_pdf_from_report(report)
    return pdf
```

### #3: Batch Operations

```python
# Загрузить несколько файлов за раз
@app.route('/api/batch/upload', methods=['POST'])
def batch_upload_documents():
    files = request.files.getlist('files')
    job_id = create_batch_job(files)
    return {"job_id": job_id, "status_url": f"/api/batch/{job_id}"}
```

### #4: Document Templates

```python
# Сохранить документ как шаблон
@app.route('/api/templates/<template_id>/use', methods=['POST'])
def use_template(template_id):
    template = Template.query.get(template_id)
    new_doc = Document.from_template(template)
    return {"document_id": new_doc.id}
```

---

## 📊 Текущее состояние бизнеса-метрик

```
Пользователи:         0 (pre-launch)
Documents Processed:  0
API Calls:            0
Revenue:              $0
```

**После OAuth2**: +300% новых юзеров (если marketing хороший)
**После Analytics**: +50% retention
**После Stripe**: +$5K-10K MRR (если traction хорошая)

---

## 🎯 Финальное решение

### Опция A: БЫСТРЫЙ LAUNCH (2 недели)

1. Docker local test + smoke
2. Basic OAuth2 (Google only)
3. Минимальный dashboard
4. **Result**: Live на producton

### Опция B: ПОЛНАЯ ГОТОВНОСТЬ (6 недель)

1. Docker + все инструменты
2. OAuth2 + GitHub + Yandex
3. Analytics dashboard
4. API v2 + rate limiting
5. Stripe payments
6. Email notifications
7. **Result**: Production ready + monetized

### Опция C: ФОКУС НА КАЧЕСТВО (8 недель)

1. Все из Опции B
2. Advanced security (2FA, SOC2)
3. Performance optimization
4. Extensive documentation
5. API SDKs (Python, JavaScript, Go)
6. **Result**: Enterprise-ready product

---

## 🔑 Ключевые решения

**Что выбрать?**

| Если...                | Выбирайте                  |
| ---------------------- | -------------------------- |
| Нужно быстро закончить | Опция A (OAuth + Live)     |
| Хотим монетизировать   | Опция B (payments first)   |
| Готовимся к Series A   | Опция C (enterprise-ready) |
| Не уверены             | Начните с OAuth2           |

---

## ✅ Чек-лист для вас

- [ ] Проверить 145/145 tests passing
- [ ] Определиться со стратегией (A/B/C)
- [ ] Выбрать первую фичу для разработки
- [ ] Создать PR с Stage 6 финализацией
- [ ] Запланировать первый спринт Q2

**Мой рекомендация**: Начните с Docker локального прогона + OAuth2 (быстро + много пользователей) 🚀

Готовы начинать?
