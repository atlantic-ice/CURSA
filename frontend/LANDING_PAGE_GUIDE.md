# Frontend - Новая Landing Page с OAuth

## Компоненты

### 1. HeroLanding (`components/HeroLanding.js`)

**Главная landing page с впечатляющим первым впечатлением**

Включает:

- Hero section с заголовком и описанием
- OAuth buttons (Google, GitHub, Yandex)
- Feature cards (4 основных возможности)
- Live statistics с анимацией счётчиков
- Декоративные фон-орбы для атмосферы

**Использование:**

```jsx
<HeroLanding />
```

### 2. DemoSection (`components/DemoSection.js`)

**Интерактивная демонстрация работы приложения**

Включает:

- Step-by-step процесс (загрузка → анализ → результаты)
- Интерактивные кнопки для переключения между шагами
- Анимированная полоса прогресса
- Примеры найденных ошибок с разными уровнями серьёзности

**Особенности:**

- Сжимаемо на мобильных устройствах
- Автоматическая анимация при выборе step 1

### 3. TestimonialsSection (`components/TestimonialsSection.js`)

**Отзывы от пользователей для построения доверия**

Включает:

- 6 testimonial cards с рейтингом (5 звёзд)
- Info section с основной статистикой
- Hover анимации для каждой карточки

**Использование:**

```jsx
<TestimonialsSection />
```

### 4. OAuthCallbackPage (`pages/OAuthCallbackPage.js`)

**Обработчик OAuth редиректа с любого провайдера**

Функциональность:

- Получает код из URL параметров
- Отправляет на бэкенд `/api/auth/oauth/{provider}/callback`
- Сохраняет токены в localStorage
- Редирект на `/upload` после успеха

**Маршрут:**

```
/auth/:provider/callback
```

### 5. LandingPage (`pages/LandingPage.js`)

**Wrapper для HeroLanding**

Просто отображает HeroLanding компонент

## Изменения в App.js

1. Добавлены импорты для всех новых компонентов
2. Добавлены маршруты:
   - `/` → LandingPage (вместо UploadPage)
   - `/upload` → UploadPage (перемещена)
   - `/auth/:provider/callback` → OAuthCallbackPage

## Переменные окружения

В `.env` или `.env.local` добавить:

```env
# OAuth Client IDs
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
REACT_APP_YANDEX_CLIENT_ID=your_yandex_client_id

# API Base URL (если нужно изменить)
REACT_APP_API_URL=http://localhost:5000
```

## Дизайн

### Цветовая схема

- **Primary**: `#22d3ee` (Cyan)
- **Secondary**: `#f97316` (Orange)
- **Background**: `#07070a` (Black)
- **Error**: `#fca5a5` (Red)
- **Warning**: `#fcd34d` (Yellow)
- **Success**: `#86efac` (Green)

### Анимации

- Используется Framer Motion для всех анимаций
- Page transitions с blur effect
- Hover и click анимации на всех интерактивных элементах
- Floating background orbs для атмосферы

## Мобильная оптимизация

Все компоненты полностью адаптивны:

- Используются Material-UI breakpoints (`xs`, `sm`, `md`, `lg`)
- Grid система автоматически перестраивается
- Typography масштабируется на малых экранах
- Hover эффекты отключены на сенсорных устройствах (где нужно)

## Интеграция OAuth

### Backend requirements

Backend должен предоставить эндпоинт:

```
POST /api/auth/oauth/{provider}/callback
Content-Type: application/json

{
  "code": "authorization_code_from_provider"
}

Response:
{
  "success": true,
  "access_token": "jwt_token",
  "refresh_token": "jwt_token",
  "user_id": 123,
  "email": "user@example.com",
  "first_name": "John",
  "is_new_user": true,
  "user": { ... }
}
```

OAuth flow:

1. Пользователь нажимает кнопку (Google/GitHub/Yandex)
2. Редирект на OAuth провайдер
3. Пользователь авторизуется
4. Провайдер редирект на `/auth/{provider}/callback?code=...`
5. OAuthCallbackPage отправляет код на бэкенд
6. Получает токены и сохраняет в localStorage
7. Редирект на `/upload`

## Тестирование

### Локальный запуск

```bash
npm start
```

### Проверка OAuth

1. В Firefox/Chrome DevTools → Network tab
2. Нажать OAuth кнопку
3. Проверить запросы на OAuth провайдер
4. Проверить запрос на `/api/auth/oauth/...`

### Проверка мобильного вида

```bash
npm start
# Открыть DevTools → Toggle device toolbar
```

## Futture improvements

- [ ] Email verification после OAuth login
- [ ] Account linking (несколько OAuth на одном аккаунте)
- [ ] Welcome email с шагами для новых пользователей
- [ ] Two-factor authentication (опционально)
- [ ] Social sharing features (поделиться результатом)
- [ ] Progressive Web App (PWA) функции
- [ ] Dark/Light theme toggle

## Известные проблемы

Нет на данный момент ✓
