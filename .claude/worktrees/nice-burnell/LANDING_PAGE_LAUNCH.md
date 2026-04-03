# 🚀 ЗАПУСК ПРИЛОЖЕНИЯ С НОВОЙ LANDING PAGE

## ⚙️ Требования

### Backend

- Python 3.11+
- Flask 2.3.3+
- Python-docx, PyYAML, SQLAlchemy и другие (см. `requirements.txt`)
- PostgreSQL или SQLite БД
- SendGrid API ключ (для welcome email)

### Frontend

- Node.js 18+
- npm или yarn
- React 18+
- Material-UI 5+
- Framer Motion

## 📝 Конфигурация

### 1. Backend конфигурация (`.env` или `config.py`)

```env
# Flask
FLASK_ENV=production
FLASK_APP=run.py
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cursa
# или для локальной разработки
# DATABASE_URL=sqlite:///./cursa.db

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

YANDEX_CLIENT_ID=your-yandex-client-id
YANDEX_CLIENT_SECRET=your-yandex-client-secret

# SendGrid (для welcome email)
SENDGRID_API_KEY=SG.your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@cursa.com

# Redis (опционально, для TokenManager)
REDIS_URL=redis://localhost:6379/0

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://cursa.onrender.com

# API
API_PORT=5000
API_HOST=0.0.0.0
```

### 2. Frontend конфигурация (`.env.local`)

```env
# API
REACT_APP_API_URL=http://localhost:5000
# или для production
# REACT_APP_API_URL=https://api.cursa.onrender.com

# OAuth Client IDs
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_GITHUB_CLIENT_ID=your-github-client-id
REACT_APP_YANDEX_CLIENT_ID=your-yandex-client-id

# Analytics (опционально)
REACT_APP_GOOGLE_ANALYTICS_ID=G-xxxxxxxxxx
```

## 🏃 Запуск приложения

### Вариант 1: Локальная разработка

#### Terminal 1 - Backend

```bash
cd backend

# Установить зависимости (если ещё не установлены)
pip install -r requirements.txt

# Создать/обновить БД
python init_db.py

# Запустить сервер
python run.py
# Сервер запустится на http://localhost:5000
```

#### Terminal 2 - Frontend

```bash
cd frontend

# Установить зависимости (если ещё не установлены)
npm install

# Начать dev сервер
npm start
# Приложение откроется на http://localhost:3000
```

### Вариант 2: Docker (рекомендуется для production)

```bash
# В корневой директории проекта
docker-compose up

# После успешного запуска:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# API Docs: http://localhost:5000/api/docs
```

### Вариант 3: Windows - One click (если есть batch скрипт)

```cmd
start_simple.bat
```

## ✅ Проверка установки

### 1. Проверить backend

```bash
curl http://localhost:5000/api/health
# Должен вернуть: {"status": "healthy", "version": "..."}
```

### 2. Проверить frontend

Открыть http://localhost:3000 в браузере

- Должна загрузиться Landing Page
- Видны все компоненты (Hero, Demo, Testimonials, etc.)

### 3. Проверить OAuth интеграцию

#### Google OAuth

1. Открыть http://localhost:3000
2. Нажать кнопку "Войти с Google"
3. Авторизоваться в Google
4. Должны вернуться на `/upload?welcome=true`
5. В localStorage должны быть токены: `access_token`, `refresh_token`, `email`, `user_id`

#### GitHub OAuth

1. Открыть http://localhost:3000
2. Нажать кнопку "Войти с GitHub"
3. Авторизоваться на GitHub
4. Должны вернуться на `/upload`

#### Yandex OAuth

1. Открыть http://localhost:3000
2. Нажать кнопку "Войти с Yandex"
3. Авторизоваться на Yandex
4. Должны вернуться на `/upload`

## 🔍 Отладка

### Frontend

- Открыть DevTools (F12)
- Console tab для ошибок JavaScript
- Network tab для проверки API запросов
- Responsive Design Mode (Ctrl+Shift+M) для мобильной версии

### Backend

- Открыть logs: `tail backend/app/logs/*.log`
- Проверить логи при 500 ошибках
- Использовать `print()` для отладки

### Common issues

**Issue: "Module not found" для компонентов**

```bash
# Проверить очередность папок
frontend/src/
├── App.js
├── index.js
├── components/
│   ├── HeroLanding.js
│   ├── DemoSection.js
│   ├── TestimonialsSection.js
│   └── ...
├── pages/
│   ├── LandingPage.js
│   ├── OAuthCallbackPage.js
│   ├── UploadPage.js
│   └── ...
```

**Issue: OAuth не работает**

- Проверить что CLIENT_ID в `.env` правильные
- Убедиться что Redirect URI совпадает в конфигурации провайдера
- Check Network tab в DevTools при нажатии OAuth кнопки

**Issue: Welcome email не приходит**

- Проверить SENDGRID_API_KEY в `.env`
- Проверить что email в spam папке
- Проверить backend логи на ошибки SendGrid

## 🎯 Что дальше?

### Задачи для фронтенда

1. **Улучшение Landing Page**
   - [ ] A/B тестирование заголовков
   - [ ] Heatmap анализ кликов
   - [ ] User testing сессии

2. **Оптимизация производительности**
   - [ ] Bundle size < 100KB
   - [ ] Lighthouse score > 90
   - [ ] Lazy loading images
   - [ ] Code splitting

3. **Дополнительные страницы**
   - [ ] Pricing page
   - [ ] FAQ page
   - [ ] Documentation
   - [ ] Blog

4. **Analytics & Monitoring**
   - [ ] Google Analytics
   - [ ] Sentry для ошибок
   - [ ] Hotjar для user behavior
   - [ ] LogRocket для session replay

### Задачи для бэкенда

1. **Улучшение OAuth**
   - [ ] Email verification
   - [ ] Account linking
   - [ ] Social profile
   - [ ] Two-factor auth

2. **Новые API эндпоинты**
   - [ ] Bulk upload для архивов
   - [ ] Сравнение версий документов
   - [ ] Export в PDF
   - [ ] Sharing results

3. **Расширение функционала**
   - [ ] Поддержка ODT/PDF файлов
   - [ ] Batch processing
   - [ ] Webhooks для интеграции
   - [ ] API rate limiting

## 🚀 Production deployment

### Heroku

```bash
# Настроить переменные окружения в Heroku Dashboard
# Задеплоить
git push heroku main

# Проверить логи
heroku logs --tail
```

### Docker на VPS

```bash
# Build и push на registry
docker build -t cursa:latest .
docker push registry.com/cursa:latest

# На VPS
docker pull registry.com/cursa:latest
docker-compose up -d
```

### Vercel (только frontend)

```bash
# Настроить в Vercel Dashboard
# Установить env variables
# Deployment происходит автоматически при push в main

npm run build  # локально для проверки
```

## 📊 Мониторинг

Рекомендуемые tools:

- 🔍 **Sentry** - отслеживание ошибок
- 📊 **DataDog** или **New Relic** - APM
- 📈 **Prometheus + Grafana** - метрики
- 🔔 **PagerDuty** - alerts
- 🔐 **Auth0** - продвинутая аутентификация (опционально)

## 🎉 Готово!

Приложение готово к использованию! 🚀

**Основные компоненты:**

- ✅ Впечатляющая Landing Page с Hero section
- ✅ Интерактивная Demo с анимациями
- ✅ Отзывы пользователей для доверия
- ✅ OAuth интеграция (Google, GitHub, Yandex)
- ✅ Welcome email для новых пользователей
- ✅ Полностью адаптивный дизайн
- ✅ Production-ready код

Поделитесь результатом! 🎊
