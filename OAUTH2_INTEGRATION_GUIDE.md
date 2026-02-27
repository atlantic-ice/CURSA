# OAuth2 Integration Guide

Это руководство описывает как настроить и использовать OAuth2 аутентификацию в CURSA через Google, GitHub и Yandex.

## Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Поддерживаемые провайдеры](#поддерживаемые-провайдеры)
3. [Настройка Google OAuth](#настройка-google-oauth)
4. [Настройка GitHub OAuth](#настройка-github-oauth)
5. [Настройка Yandex OAuth](#настройка-yandex-oauth)
6. [Использование в приложении](#использование-в-приложении)
7. [API Endpoints](#api-endpoints)
8. [Тестирование](#тестирование)

## Быстрый старт

### 1. Установка зависимостей

```bash
pip install authlib requests
```

### 2. Добавление credentials в `.env`

```env
# Google
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# Yandex
YANDEX_CLIENT_ID=your-client-id
YANDEX_CLIENT_SECRET=your-client-secret
```

### 3. Перезагрузка приложения

```bash
python run.py
```

## Поддерживаемые провайдеры

### Google
- ✅ Полная поддержка профиля пользователя
- ✅ Email verification через Google
- ✅ Фотография профиля
- **Рекомендуемый провайдер**

### GitHub
- ✅ Интеграция с GitHub аккаунтом
- ✅ Автоматическое получение email
- ✅ Публичная информация профиля

### Yandex
- ✅ Поддержка русскоязычных пользователей
- ✅ Интеграция с Яндекс аккаунтом
- ✅ Российская целевая аудитория

## Настройка Google OAuth

### 1. Создание проекта в Google Cloud Console

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект

### 2. Включение Google+ API

1. Перейдите в "APIs & Services"
2. Нажмите "Enable APIs and Services"
3. Поищите "Google+ API" и включите её

### 3. Создание OAuth 2.0 учетных данных

1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "OAuth client ID"
3. Выберите "Web application"
4. Добавьте redirect URI:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
5. Скопируйте `Client ID` и `Client Secret`

### 4. Добавление в `.env`

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## Настройка GitHub OAuth

### 1. Регистрация OAuth App в GitHub

1. Откройте [GitHub Settings → Developer settings](https://github.com/settings/developers)
2. Нажмите "New OAuth App"
3. Заполните форму:
   - **Application name**: CURSA
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`

### 2. Получение credentials

После создания приложения скопируйте:
- Client ID
- Client Secret

### 3. Добавление в `.env`

```env
GITHUB_CLIENT_ID=YOUR_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_CLIENT_SECRET
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
```

## Настройка Yandex OAuth

### 1. Регистрация приложения в Яндекс

1. Откройте [Yandex OAuth](https://oauth.yandex.ru/)
2. Нажмите "Создать новое приложение"
3. Заполните информацию:
   - **Название**: CURSA
   - **Платформы**: Web
   - **Redirect URI**: `http://localhost:3000/auth/yandex/callback`

### 2. Получение credentials

1. В разделе "Приложения" найдите свое приложение
2. Скопируйте:
   - ID приложения (Client ID)
   - Пароль приложения (Client Secret)

### 3. Добавление в `.env`

```env
YANDEX_CLIENT_ID=YOUR_APP_ID
YANDEX_CLIENT_SECRET=YOUR_APP_PASSWORD
YANDEX_REDIRECT_URI=http://localhost:3000/auth/yandex/callback
```

## Использование в приложении

### Frontend - React компонент

```typescript
import { OAuthLogin } from './components/auth/OAuthLogin';

export const LoginPage = () => {
  return (
    <div>
      <h1>Вход в CURSA</h1>
      
      {/* Все провайдеры */}
      <OAuthLogin showAllProviders={true} />
      
      {/* Или отдельный провайдер */}
      <OAuthLogin provider="google" />
    </div>
  );
};
```

### Backend - Автоматический обработчик

OAuth endpoints обрабатываются автоматически в:
```
POST /api/auth/oauth/google/callback
POST /api/auth/oauth/github/callback
POST /api/auth/oauth/yandex/callback
```

## API Endpoints

### Google OAuth Callback

```
POST /api/auth/oauth/google/callback
Content-Type: application/json

{
  "code": "authorization_code_from_google"
}

Response (200):
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user_id": 123,
  "email": "user@gmail.com",
  "first_name": "John",
  "role": "user"
}
```

### GitHub OAuth Callback

```
POST /api/auth/oauth/github/callback
Content-Type: application/json

{
  "code": "authorization_code_from_github"
}

Response (200):
{
  "success": true,
  "access_token": "...",
  "refresh_token": "...",
  "user_id": 123,
  "email": "user@github.com",
  "first_name": "John"
}
```

### Yandex OAuth Callback

```
POST /api/auth/oauth/yandex/callback
Content-Type: application/json

{
  "code": "authorization_code_from_yandex"
}

Response (200):
{
  "success": true,
  "access_token": "...",
  "refresh_token": "...",
  "user_id": 123,
  "email": "user@yandex.ru",
  "first_name": "Ivan"
}
```

## Тестирование

### Unit Tests

```bash
# Запуск OAuth тестов
pytest tests/unit/test_oauth.py -v

# Запуск конкретного теста
pytest tests/unit/test_oauth.py::TestGoogleOAuth::test_google_oauth_new_user -v
```

### Manual Testing

#### 1. Development Flow

```bash
# 1. Запустите backend
python run.py

# 2. Запустите frontend
cd frontend && npm start

# 3. Откройте http://localhost:3000
# 4. Нажмите кнопку "Sign in with Google"
# 5. Разрешите доступ
# 6. Вы должны быть авторизованы и перенаправлены на dashboard
```

#### 2. Testing OAuth Endpoints

```bash
# Тест Google OAuth (замените на реальный код)
curl -X POST http://localhost:5000/api/auth/oauth/google/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "test_code"}'

# Тест GitHub OAuth
curl -X POST http://localhost:5000/api/auth/oauth/github/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "test_code"}'

# Тест Yandex OAuth
curl -X POST http://localhost:5000/api/auth/oauth/yandex/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "test_code"}'
```

## Архитектура

### Backend Flow

```
1. Frontend получает authorization code от провайдера
           ↓
2. Frontend отправляет код на backend endpoint
           ↓
3. Backend обменивает код на access token
           ↓
4. Backend получает информацию о пользователе
           ↓
5. Backend создает / обновляет пользователя в БД
           ↓
6. Backend генерирует JWT токены
           ↓
7. Backend возвращает токены frontend'у
           ↓
8. Frontend сохраняет токены и авторизует пользователя
```

### Система хранения данных

```python
User model:
- oauth_provider (google, github, yandex)  # Какой провайдер использовался
- oauth_id (строка)                        # Уникальный ID от провайдера
- is_email_verified (boolean)              # OAuth users всегда verified
- password_hash (nullable)                 # Optional для OAuth users
```

## Обработка ошибок

### Возможные error codes

| Status | Error | Описание |
|--------|-------|----------|
| 400 | Missing authorization code | Не передан код авторизации |
| 400 | Invalid authorization code | Код истек или невалидный |
| 400 | Failed to retrieve user info | Не удалось получить инфо о пользователе |
| 503 | OAuth not configured | Провайдер не настроен |
| 500 | Authentication failed | Неизвестная ошибка |

## Security Best Practices

### 1. Защита credentials

✅ Храните в `.env` файле, **не коммитьте в Git**

```bash
# В .gitignore
.env
.env.local
```

### 2. HTTPS в Production

Для production используйте HTTPS:

```env
# Production
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

### 3. CORS Configuration

Убедитесь что CORS правильно настроен:

```python
CORS_ORIGINS = [
    "https://yourdomain.com",  # Production
    "http://localhost:3000",    # Development
]
```

### 4. Rate Limiting

OAuth endpoints защищены rate limiting:
- 5 попыток в минуту на IP адрес
- Защита от brute force атак

## Troubleshooting

### "OAuth not configured"

**Решение**: Убедитесь что в `.env` установлены:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

И приложение перезагружено.

### "Invalid authorization code"

**Причины**:
- Код истек (обычно на 10 минут)
- Redirect URI не совпадает с настройками провайдера
- Неправильный Client Secret

**Решение**: Повторите авторизацию с начала.

### "Failed to retrieve user info"

**Причины**:
- Сетевая ошибка
- API провайдера недоступен
- Недостаточные permissions

**Решение**: Проверьте сетевое соединение и permissions в настройках провайдера.

## Следующие шаги

После наладки базовой OAuth2:

1. **Email notifications** - Отправлять письма при первом входе
2. **Profile enrichment** - Заполнять дополнительные данные из провайдера
3. **Account linking** - Связать несколько OAuth провайдеров одному пользователю
4. **2FA/MFA** - Двухфакторная аутентификация
5. **Social login buttons** - Красивые кнопки в UI

## References

- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Yandex OAuth Documentation](https://yandex.ru/dev/id/doc/en/user-account/authorization/)
- [Authlib Documentation](http://authlib.org/)
