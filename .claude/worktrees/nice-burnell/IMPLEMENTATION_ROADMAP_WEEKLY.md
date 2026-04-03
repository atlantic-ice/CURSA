# 🎯 QUICK IMPLEMENTATION ROADMAP - CURSA v2.0.0

> Быстрый справочник для реализации плана завершения
> **Финальная дата:** 30 апреля 2026
> **Сейчас:** 26 февраля 2026 (21 неделя)

---

## 📈 ВИЗУАЛЬНАЯ ШКАЛА ПРОГРЕССА

```
ФАЗА 1: Auth/Security [████████░░] 40 часов (5-6 дней)
  ├─ JWT + Email [████░░] 10ч
  ├─ OAuth2 [████░░] 15ч
  ├─ 2FA + Security [████░░] 15ч

ФАЗА 2: Payments [████████░░] 50 часов (7 дней)
  ├─ Stripe [████░░] 20ч
  ├─ Yookassa [████░░] 20ч
  ├─ Subscription Mgmt [████░░] 10ч

ФАЗА 3: Frontend UX [████████░░] 45 часов (6 дней)
  ├─ Account Pages [████░░] 15ч
  ├─ Subscription UI [████░░] 15ч
  ├─ API Tools [████░░] 15ч

ФАЗА 4: Backend API [████████░░] 40 часов (5 дней)
  ├─ Migrations + Schema [████░░] 10ч
  ├─ All Endpoints [████░░] 20ч
  ├─ Error Handling [████░░] 10ч

ФАЗА 5-7: Quality & Ops [████████░░] 105 часов (14 дней)
  ├─ Testing (Unit/Integration) [████░░] 45ч
  ├─ Monitoring & Logs [████░░] 35ч
  ├─ Docs & DevOps [████░░] 35ч

ФАЗА 8-11: Polish & Launch [████████░░] 95 часов (13 дней)
  ├─ Performance Optimization [████░░] 30ч
  ├─ Security Audit [████░░] 20ч
  ├─ Beta Testing [████░░] 25ч
  ├─ Launch Prep [████░░] 20ч
```

---

## 🔴 THIS WEEK (Неделя 1) - AUTHENTICATION

**Цель:** Полная система аутентификации с email verification

### Day 1 (Понедельник) - JWT Foundation

- [ ] Установить redis-py
- [ ] Реализовать JWT refresh flow с Redis blacklist
- [ ] Создать TokenManager service
- [ ] Добавить rate limiting middleware для auth endpoints
- **Deliverable:** `/api/auth/register` и `/api/auth/login` с rate limiting

```python
# backend/app/services/token_service.py
from flask_jwt_extended import create_access_token, create_refresh_token
from redis import Redis

class TokenManager:
    def __init__(self, redis_client):
        self.redis = redis_client

    def revoke_token(self, jti):
        """Add token to blacklist"""
        self.redis.setex(f"blacklist:{jti}", 3600, "true")

    def is_token_revoked(self, jti):
        """Check if token is blacklisted"""
        return self.redis.exists(f"blacklist:{jti}")
```

### Day 2-3 (Вторник-Среда) - Email Service

- [ ] Выбрать email provider (SendGrid recommended)
- [ ] Создать email templates (verification, password reset)
- [ ] Реализовать email service
- [ ] Создать verification token flow
- **Deliverable:** Email sending + verification working

```python
# backend/app/services/email_service.py
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class EmailService:
    def __init__(self, api_key):
        self.sg = SendGridAPIClient(api_key)

    def send_verification_email(self, email, token):
        message = Mail(
            from_email='noreply@cursa.app',
            to_emails=email,
            subject='Verify Your Email',
            html_content=f'''
            <a href="https://cursa.app/verify?token={token}">
            Verify Email
            </a>
            '''
        )
        self.sg.send(message)

    def send_password_reset(self, email, reset_link):
        # Similar implementation
        pass
```

### Day 4-5 (Четверг-Пятница) - OAuth2

- [ ] Установить authlib
- [ ] Создать Google OAuth2 flow
- [ ] Добавить GitHub OAuth2
- [ ] Tests для всех auth endpoints
- **Deliverable:** OAuth2 login working, 80%+ test coverage

```python
# backend/app/config/oauth.py
from authlib.integrations.flask_client import OAuth

oauth = OAuth()

oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)
```

### Code Structure for Week 1

```
backend/app/
├─ services/
│  ├─ token_service.py (NEW) - JWT with blacklist
│  ├─ email_service.py (NEW) - Email sending
│  ├─ oauth_service.py (NEW) - OAuth logic
│  ├─ auth_service.py (ENHANCE) - Enhanced auth logic
│
├─ api/
│  ├─ auth_routes.py (ENHANCE)
│  │  ├─ POST /auth/register - with email verification
│  │  ├─ POST /auth/login - JWT + refresh
│  │  ├─ POST /auth/refresh - token refresh
│  │  ├─ POST /auth/logout - token blacklist
│  │  ├─ POST /auth/oauth/google/callback
│  │  ├─ POST /auth/oauth/github/callback
│  │  ├─ POST /auth/forgot-password
│  │  ├─ POST /auth/reset-password
│
├─ middleware/
│  ├─ auth.py (ENHANCE) - JWT validation
│  ├─ rate_limit.py (ENHANCE) - Auth-specific limits
│
├─ templates/
│  ├─ emails/
│  │  ├─ verification.html (NEW)
│  │  ├─ password_reset.html (NEW)
│  │  ├─ welcome.html (NEW)

tests/
├─ test_auth_service.py (NEW)
├─ test_auth_routes.py (ENHANCE)
├─ test_oauth.py (NEW)
```

### Environment Variables to Add (.env)

```env
# Email Service
SENDGRID_API_KEY=sg_...
SENDGRID_FROM_EMAIL=noreply@cursa.app

# OAuth2
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
YANDEX_CLIENT_ID=...
YANDEX_CLIENT_SECRET=...

# Redis for token blacklist
REDIS_URL=redis://localhost:6379/1

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-prod
JWT_ACCESS_TOKEN_EXPIRES=900  # 15 minutes
JWT_REFRESH_TOKEN_EXPIRES=2592000  # 30 days
```

---

## 🟠 NEXT WEEK (Неделя 2) - PAYMENTS

**Цель:** Stripe и Yookassa интегрированы, платежи работают

### Week 2 Outline

**Day 1-3:** Stripe Integration

```python
# backend/app/services/payment_service.py
import stripe

class StripePaymentService:
    def __init__(self, api_key):
        stripe.api_key = api_key

    def create_payment_intent(self, user_id, amount, plan):
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Stripe uses cents
            currency="rub",
            metadata={"user_id": user_id, "plan": plan}
        )
        return intent

    def handle_webhook(self, event):
        if event['type'] == 'payment_intent.succeeded':
            self.upgrade_subscription(event['data']['object']['metadata']['user_id'])
        elif event['type'] == 'payment_intent.payment_failed':
            self.notify_payment_failed(event['data']['object']['metadata']['user_id'])
```

**Day 4-5:** Yookassa Integration + Tests

```python
# backend/app/services/yookassa_service.py
from yookassa import Configuration, Payment

class YookassaPaymentService:
    def __init__(self, shop_id, api_key):
        Configuration.account_id = shop_id
        Configuration.secret_key = api_key

    def create_payment(self, user_id, amount, plan):
        payment = Payment.create({
            "amount": {
                "value": amount,
                "currency": "RUB"
            },
            "confirmation": {
                "type": "redirect",
                "return_url": f"https://cursa.app/billing?status=success"
            },
            "description": f"CURSA subscription: {plan}",
            "metadata": {
                "user_id": user_id,
                "plan": plan
            }
        })
        return payment
```

### Files to Create/Update

```
backend/app/
├─ services/
│  ├─ payment_service.py (NEW)
│  ├─ yookassa_service.py (NEW)
│  ├─ subscription_service.py (ENHANCE)
│
├─ api/
│  ├─ payment_routes.py (NEW)
│  │  ├─ POST /payments/create-intent (Stripe)
│  │  ├─ POST /payments/create-payment (Yookassa)
│  │  ├─ GET /payments/history
│  │  ├─ GET /payments/invoices
│  │  ├─ POST /webhooks/stripe
│  │  ├─ POST /webhooks/yookassa
│
│  ├─ subscription_routes.py (NEW)
│  │  ├─ GET /subscriptions/me
│  │  ├─ GET /subscriptions/plans
│  │  ├─ POST /subscriptions/upgrade
│  │  ├─ POST /subscriptions/downgrade
│  │  ├─ POST /subscriptions/cancel

tests/
├─ test_payment_service.py (NEW)
├─ test_payment_routes.py (NEW)
```

---

## 🟡 WEEKS 3-8 (Phases 3-4) - FRONTEND & BACKEND

### Phase 3: Frontend Account Pages (Week 5-6)

```
frontend/src/pages/
├─ ProfilePage.js (NEW) - User profile editing
├─ SettingsPage.js (NEW) - Preferences, security
├─ BillingPage.js (NEW) - Subscription management
├─ DownloadInvoicePage.js (NEW) - Invoice history
├─ APIKeysPage.js (NEW) - API key management
├─ PricingPage.js (NEW) - Tier comparison

frontend/src/components/
├─ PlanComparison.js (NEW) - Plan comparison table
├─ UpgradeDialog.js (NEW) - Upgrade/downgrade
├─ InvoiceList.js (NEW) - Invoice history
├─ APIKeyManager.js (NEW) - API key CRUD
```

### Phase 4: Backend API Completion (Week 7-8)

```python
# All CRUD endpoints for:
- Users (/api/users/*)
- Documents (/api/documents/*)
- Subscriptions (/api/subscriptions/*)
- Payments (/api/payments/*)
- API Keys (/api/api-keys/*)
- Admin (/api/admin/*)
```

---

## 📊 EFFORT ESTIMATION

| Week  | Phase | Task          | Est. Hours | Dev | QA  | Completion % |
| ----- | ----- | ------------- | ---------- | --- | --- | ------------ |
| 1     | 1.1   | JWT + Email   | 15         | 2   | 0.5 | 15%          |
| 1     | 1.2   | OAuth2        | 15         | 2   | 0.5 |              |
| 1     | 1.3   | 2FA           | 15         | 1.5 | 0.5 |              |
| 2     | 2.1   | Stripe        | 20         | 2   | 0.5 | 30%          |
| 2     | 2.2   | Yookassa      | 20         | 2   | 0.5 |              |
| 2     | 2.3   | Subscriptions | 10         | 1.5 | 0.5 |              |
| 3-4   | 3     | Frontend Acct | 45         | 2   | 1   | 45%          |
| 5-6   | 4     | Backend API   | 40         | 2   | 1   | 55%          |
| 7-8   | 5     | Testing       | 45         | 1.5 | 2   | 65%          |
| 9-10  | 6     | Monitoring    | 35         | 1.5 | 1   | 75%          |
| 11-12 | 7     | Docs & DevOps | 35         | 1.5 | 1   | 85%          |
| 13-14 | 8     | Performance   | 30         | 2   | 0.5 | 90%          |
| 15    | 9     | Security      | 20         | 1.5 | 1   | 95%          |
| 16-17 | 10    | Beta          | 25         | 1   | 1.5 | 98%          |
| 18    | 11    | Launch        | 20         | 1.5 | 1   | 100%         |

---

## ✅ DAILY STANDUP TEMPLATE

```
STAND-UP UPDATE FORMAT:

🟢 DONE TODAY:
- Task 1 (100%)
- Task 2 (80%)

🟡 DOING NOW:
- Task 3 (40%)
- Task 4 (10%)

🔴 BLOCKED BY:
- Issue X (waiting for review)
- Issue Y (external dependency)

📊 METRICS:
- Test coverage: 65%
- Code review: 2/3 PRs merged
- Issues closed: 5/8
```

---

## 🎯 SUCCESS CRITERIA FOR EACH PHASE

### Phase 1 (Auth) - SUCCESS IF:

- ✅ 3+ auth methods (email, Google, GitHub)
- ✅ Email verification flow works
- ✅ Password reset works
- ✅ 2FA implemented
- ✅ JWT tokens rotate
- ✅ 80%+ test coverage
- ✅ All endpoints have rate limiting

### Phase 2 (Payments) - SUCCESS IF:

- ✅ Stripe payments work
- ✅ Yookassa payments work
- ✅ Webhooks reliable
- ✅ Subscription auto-activates
- ✅ Payment mails sent
- ✅ 100% test coverage (payments code)
- ✅ Refund processing works

### Phase 3-4 (Frontend/API) - SUCCESS IF:

- ✅ All account pages responsive
- ✅ All API endpoints documented
- ✅ Zero 404s or 500s
- ✅ Database migrations reversible
- ✅ Form validation complete
- ✅ Error messages user-friendly
- ✅ Lighthouse > 90

### Phase 5+ - SUCCESS IF:

- ✅ 80%+ test coverage overall
- ✅ Monitoring alerts created
- ✅ All docs written
- ✅ Performance targets met
- ✅ Security audit clean
- ✅ Zero P1 bugs

---

## 💡 KEY IMPLEMENTATION TIPS

1. **Do Auth first** - Everything depends on it
2. **Use factories** for test data (factory_boy)
3. **Setup CI/CD early** - Test on every commit
4. **Separate concerns** - Services, models, routers
5. **Document APIs** - OpenAPI/Swagger as you build
6. **Test edge cases** - Not just happy path
7. **Monitor from day 1** - Add logging/metrics early
8. **Secure by default** - Don't patch security later
9. **Database migrations** - Test upgrade and downgrade
10. **Load test early** - Find bottlenecks before launch

---

**Документ обновляется еженедельно с прогрессом.**
**Начало работы:** Понедельник, 26 февраля 2026
