# 🤖 Настройка Telegram OAuth авторизации

> Пошаговая инструкция по настройке входа через Telegram для CURSA

## 📋 Содержание

1. [Создание Telegram бота](#1-создание-telegram-бота)
2. [Настройка домена](#2-настройка-домена)
3. [Конфигурация Backend](#3-конфигурация-backend)
4. [Конфигурация Frontend](#4-конфигурация-frontend)
5. [Тестирование](#5-тестирование)
6. [Production развертывание](#6-production-развертывание)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Создание Telegram бота

### Шаг 1.1: Откройте @BotFather

1. Откройте Telegram
2. Найдите [@BotFather](https://t.me/botfather)
3. Начните диалог: `/start`

### Шаг 1.2: Создайте нового бота

```
/newbot
```

**BotFather спросит:**

```
Alright, a new bot. How are we going to call it?
Please choose a name for your bot.
```

**Введите имя** (например): `CURSA Document Checker`

```
Good. Now let's choose a username for your bot.
It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.
```

**Введите username** (например): `cursa_checker_bot`

### Шаг 1.3: Сохраните токен

BotFather пришлёт сообщение с токеном:

```
Done! Congratulations on your new bot. You will find it at t.me/cursa_checker_bot.

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890

For a description of the Bot API, see this page: https://core.telegram.org/bots/api
```

**⚠️ ВАЖНО:** Сохраните этот токен! Он понадобится для конфигурации.

---

## 2. Настройка домена

### Для локальной разработки

```
/setdomain
```

BotFather спросит: **Please choose a bot for setup.**

Выберите вашего бота: `@cursa_checker_bot`

BotFather спросит: **Send me the domain name. For example: example.com**

Введите:

```
localhost
```

**⚠️ ВАЖНО:** Отправьте только `localhost` **БЕЗ порта**! Telegram Login Widget работает на уровне домена, порт браузер определит автоматически.

✅ **Готово!** BotFather подтвердит: `Success! Domain updated.`

### Для production

Повторите процесс, но укажите реальный домен:

```
cursa.yourdomain.com
```

или

```
yourdomain.com
```

**⚠️ Важно:**

- Домен должен быть без `http://` или `https://`
- Для production Telegram требует **HTTPS** (HTTP не работает)
- Можно указать поддомен или корневой домен

---

## 3. Конфигурация Backend

### Шаг 3.1: Создайте .env файл

```bash
cd backend
cp .env.example .env
```

### Шаг 3.2: Добавьте Telegram credentials

Откройте `backend/.env` и найдите секцию **OAuth Providers**:

```env
# ============ OAuth Providers ============

# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_BOT_USERNAME=cursa_checker_bot
```

**Замените значения** на ваши реальные:

- `TELEGRAM_BOT_TOKEN` - полный токен от @BotFather
- `TELEGRAM_BOT_USERNAME` - username бота (без @)

**📌 Note:** `TELEGRAM_BOT_USERNAME` опционален - бэкенд автоматически определит его через [Telegram Bot API](https://core.telegram.org/bots/api#getme), но указание ускорит запуск.

### Шаг 3.3: Настройте другие переменные

```env
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
FRONTEND_ORIGINS=http://localhost:3000
```

Сгенерировать случайные ключи:

```bash
# Linux/macOS
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

---

## 4. Конфигурация Frontend

### Шаг 4.1: Создайте .env.local файл

```bash
cd frontend
cp .env.local.example .env.local
```

### Шаг 4.2: Добавьте Telegram Bot ID

Откройте `frontend/.env.local`:

```env
# API URL
REACT_APP_API_URL=http://localhost:5000

# Telegram Bot Token (только bot_id - число перед двоеточием)
REACT_APP_TELEGRAM_BOT_TOKEN=1234567890
```

**⚠️ ВАЖНО:**

- Используйте **только bot_id** (число перед `:`), НЕ полный токен!
- Если токен `1234567890:ABCdefGHI...`, то `REACT_APP_TELEGRAM_BOT_TOKEN=1234567890`

**Почему только bot_id?**

- Полный токен не должен попадать в frontend (безопасность)
- Bot ID достаточно для Telegram Login Widget

---

## 5. Тестирование

### Шаг 5.1: Запустите backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/macOS

pip install -r requirements.txt
python run.py
```

✅ Backend должен запуститься на `http://localhost:5000`

### Шаг 5.2: Запустите frontend

```bash
cd frontend
npm install
npm start
```

✅ Frontend должен открыться на `http://localhost:3000`

### Шаг 5.3: Протестируйте OAuth flow

1. Откройте `http://localhost:3000`
2. Нажмите кнопку **"Войти через Telegram"**
3. Должна появиться кнопка Telegram Login Widget
4. Нажмите на неё
5. Telegram откроет окно авторизации
6. Подтвердите вход
7. Вы будете перенаправлены на `/upload?welcome=true`

### Шаг 5.4: Проверьте тесты

```bash
cd backend
pytest tests/unit/test_telegram_auth.py -v
```

Ожидаемый результат:

```
tests/unit/test_telegram_auth.py::test_telegram_start_requires_config PASSED
tests/unit/test_telegram_auth.py::test_telegram_start_renders_widget PASSED
tests/unit/test_telegram_auth.py::test_telegram_callback_success_redirects_with_tokens PASSED
tests/unit/test_telegram_auth.py::test_telegram_callback_rejects_invalid_signature PASSED

====== 4 passed in 0.15s ======
```

---

## 6. Production развертывание

### Шаг 6.1: Обновите домен в @BotFather

```
/setdomain
```

Укажите production домен:

```
cursa.yourdomain.com
```

### Шаг 6.2: Обновите environment variables

**Backend (.env):**

```env
FLASK_ENV=production
FLASK_DEBUG=0
FRONTEND_ORIGINS=https://cursa.yourdomain.com
```

**Frontend (.env.production):**

```env
REACT_APP_API_URL=https://api.cursa.yourdomain.com
REACT_APP_TELEGRAM_BOT_TOKEN=1234567890
```

### Шаг 6.3: Настройте HTTPS

Telegram Login Widget **требует HTTPS** для production.

**Варианты:**

- Let's Encrypt (бесплатно)
- Cloudflare SSL
- Nginx reverse proxy с SSL
- Докер с Certbot

### Шаг 6.4: Настройте CORS

В `backend/.env`:

```env
FRONTEND_ORIGINS=https://cursa.yourdomain.com,https://www.cursa.yourdomain.com
```

---

## 7. Troubleshooting

### ❌ Кнопка не появляется

**Причина:** Frontend не видит `REACT_APP_TELEGRAM_BOT_TOKEN`

**Решение:**

```bash
cd frontend
# Проверьте наличие .env.local
cat .env.local

# Перезапустите dev server
npm start
```

### ❌ "Telegram not configured" (503)

**Причина:** Backend не видит `TELEGRAM_BOT_TOKEN`

**Решение:**

```bash
cd backend
# Проверьте .env файл
cat .env | grep TELEGRAM

# Перезапустите сервер
python run.py
```

### ❌ "Invalid signature" при callback

**Причина:** Неверный `TELEGRAM_BOT_TOKEN` или подделка данных

**Решение:**

1. Проверьте, что токен скопирован полностью
2. Проверьте, что нет лишних пробелов
3. Убедитесь, что домен настроен в @BotFather

### ❌ "Redirect URI mismatch"

**Причина:** Домен не настроен в @BotFather

**Решение:**

```
/setdomain в @BotFather
Укажите: localhost (БЕЗ порта!)
```

### ❌ CORS ошибка

**Причина:** Frontend origin не указан в `FRONTEND_ORIGINS`

**Решение:**

```env
# backend/.env
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### ❌ Кнопка появляется, но клик не работает

**Причина:** `REACT_APP_API_URL` не установлен или неверный

**Решение:**

```env
# frontend/.env.local
REACT_APP_API_URL=http://localhost:5000
```

Перезапустите frontend после изменения.

---

## 📚 Дополнительные ресурсы

- [Telegram Login Widget Documentation](https://core.telegram.org/widgets/login)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [@BotFather команды](https://core.telegram.org/bots#6-botfather)
- [CURSA Backend API Docs](http://localhost:5000/api/docs/)

---

## 🔐 Безопасность

### ✅ Что делать:

- Храните токены в `.env` файлах (НЕ в Git!)
- Используйте только bot_id во frontend
- Включите HTTPS для production
- Проверяйте HMAC-SHA256 подпись (уже реализовано в backend)

### ❌ Что НЕ делать:

- НЕ коммитьте `.env` или `.env.local` в Git
- НЕ используйте полный токен во frontend
- НЕ отключайте проверку подписи в production
- НЕ используйте HTTP в production

---

## ✅ Checklist

- [ ] Создан Telegram бот через @BotFather
- [ ] Настроен домен через `/setdomain`
- [ ] Создан `backend/.env` с `TELEGRAM_BOT_TOKEN`
- [ ] Создан `frontend/.env.local` с `REACT_APP_TELEGRAM_BOT_TOKEN`
- [ ] Backend запускается без ошибок
- [ ] Frontend запускается без ошибок
- [ ] Кнопка "Войти через Telegram" видна
- [ ] Клик открывает Telegram Login Widget
- [ ] После авторизации происходит редирект на `/upload`
- [ ] Тесты проходят успешно

---

**Готово! 🎉** Авторизация через Telegram настроена и работает.

Если возникли проблемы, проверьте [Troubleshooting](#7-troubleshooting) или создайте Issue на GitHub.
