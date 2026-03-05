# ⚡ Быстрый запуск OAuth авторизации

> **Цель:** Запустить CURSA с работающей авторизацией через Telegram за 5 минут

## 🎯 Что нужно сделать

**Всего 4 шага:**

1. ✅ Создать Telegram бота
2. ✅ Настроить backend
3. ✅ Настроить frontend
4. ✅ Запустить и протестировать

---

## Шаг 1: Создать Telegram бота (2 минуты)

### 1.1 Откройте @BotFather в Telegram

Найдите [@BotFather](https://t.me/botfather) и начните диалог: `/start`

### 1.2 Создайте бота

```
/newbot
```

Введите:

- **Имя:** `CURSA Document Checker` (или любое другое)
- **Username:** `cursa_checker_bot` (или ваш вариант, должен заканчиваться на `_bot`)

### 1.3 Сохраните токен

BotFather пришлёт токен вида:

```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
```

**📋 Скопируйте его!**

### 1.4 Настройте домен

```
/setdomain
```

Выберите вашего бота, затем введите:

```
localhost
```

**⚠️ ВАЖНО:** Только `localhost` БЕЗ порта `:3000`!

✅ **Готово!** BotFather подтвердит: `Success! Domain updated.`

---

## Шаг 2: Настроить Backend (1 минута)

### 2.1 Создайте .env файл

```bash
cd backend
cp .env.example .env
```

**Если .env.example не существует**, создайте `backend/.env` вручную:

```env
# Базовая конфигурация
SECRET_KEY=dev-secret-key-change-later
JWT_SECRET_KEY=jwt-secret-key-change-later
FLASK_DEBUG=1
FRONTEND_ORIGINS=http://localhost:3000

# Telegram Bot (замените на ваши значения!)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_BOT_USERNAME=cursa_checker_bot

# Database (SQLite для разработки)
DATABASE_URL=sqlite:///cursa.db
```

### 2.2 Замените значения

**Обязательно замените:**

- `TELEGRAM_BOT_TOKEN` - ваш токен от @BotFather
- `TELEGRAM_BOT_USERNAME` - username вашего бота (без @)

**Опционально:** Сгенерируйте случайные ключи:

```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Скопируйте результат в `SECRET_KEY` и `JWT_SECRET_KEY`.

---

## Шаг 3: Настроить Frontend (30 секунд)

### 3.1 Создайте .env.local

```bash
cd frontend
cp .env.local.example .env.local
```

**Если файла нет**, создайте `frontend/.env.local` вручную:

```env
# API Backend
REACT_APP_API_URL=http://localhost:5000

# Telegram Bot ID (только число до двоеточия!)
REACT_APP_TELEGRAM_BOT_TOKEN=1234567890
```

### 3.2 Замените bot_id

**⚠️ ВАЖНО:** Используйте **только число до двоеточия** из токена!

Если токен: `1234567890:ABCdefGHI...`
То bot_id: `1234567890`

```env
REACT_APP_TELEGRAM_BOT_TOKEN=1234567890
```

---

## Шаг 4: Запустить и протестировать (1 минута)

### 4.1 Запустите backend

```bash
cd backend

# Создайте виртуальное окружение (если ещё нет)
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/macOS

# Установите зависимости (один раз)
pip install -r requirements.txt

# Запустите сервер
python run.py
```

✅ Должно появиться:

```
* Running on http://127.0.0.1:5000
```

### 4.2 Запустите frontend (новый терминал)

```bash
cd frontend

# Установите зависимости (один раз)
npm install

# Запустите dev server
npm start
```

✅ Браузер откроется автоматически на `http://localhost:3000`

### 4.3 Проверьте авторизацию

1. На главной странице найдите кнопку **"Войти через Telegram"**
2. Нажмите на неё
3. Должна появиться страница с Telegram Login Widget (синяя кнопка)
4. Нажмите на кнопку Telegram
5. Подтвердите вход в открывшемся окне Telegram
6. Вы будете перенаправлены на `/upload`

✅ **Авторизация работает!**

---

## 🐛 Проблемы?

### ❌ Кнопка не появляется

**Проверьте консоль браузера (F12):**

- Должно быть сообщение: `[OAuth telegram] Config:`
- Если `clientId: "NOT SET"` - не установлен `REACT_APP_TELEGRAM_BOT_TOKEN`

**Решение:**

```bash
cd frontend
# Убедитесь что .env.local существует
cat .env.local  # Linux/macOS
type .env.local  # Windows

# Перезапустите dev server
npm start
```

### ❌ Backend ошибка "Telegram not configured"

**Решение:**

```bash
cd backend
# Проверьте .env
cat .env | grep TELEGRAM  # Linux/macOS
type .env | findstr TELEGRAM  # Windows

# Перезапустите сервер
python run.py
```

### ❌ CORS ошибка в браузере

**Решение:**
Добавьте в `backend/.env`:

```env
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Перезапустите backend.

### ❌ "Invalid signature"

**Причина:** Неверный токен или домен не настроен

**Решение:**

1. Проверьте токен в `backend/.env` (должен быть полный, без пробелов)
2. Убедитесь что домен настроен в @BotFather:
   ```
   /setdomain
   localhost:3000
   ```

---

## 📚 Дополнительно

### Полная документация

Подробная инструкция с production deployment: **[docs/TELEGRAM_OAUTH_SETUP.md](docs/TELEGRAM_OAUTH_SETUP.md)**

### Тесты

Проверьте что всё работает:

```bash
cd backend
pytest tests/unit/test_telegram_auth.py -v
```

Ожидаемый результат: **4 passed**

### Production развёртывание

Для production нужно:

1. Обновить домен в @BotFather на реальный
2. Включить HTTPS (обязательно!)
3. Изменить `REACT_APP_API_URL` на production URL
4. Сгенерировать безопасные ключи для `SECRET_KEY` и `JWT_SECRET_KEY`

Подробнее: [docs/TELEGRAM_OAUTH_SETUP.md#6-production-развертывание](docs/TELEGRAM_OAUTH_SETUP.md#6-production-развертывание)

---

## ✅ Checklist

- [ ] Создан Telegram бот через @BotFather
- [ ] Настроен домен (`/setdomain` → `localhost` БЕЗ порта!)
- [ ] Создан `backend/.env` с `TELEGRAM_BOT_TOKEN`
- [ ] Создан `frontend/.env.local` с `REACT_APP_TELEGRAM_BOT_TOKEN`
- [ ] Backend запускается без ошибок (http://localhost:5000)
- [ ] Frontend запускается без ошибок (http://localhost:3000)
- [ ] Кнопка "Войти через Telegram" видна на главной
- [ ] Авторизация работает (редирект на `/upload` после входа)

---

**🎉 Готово!** Авторизация через Telegram настроена.

**Следующие шаги:**

- Добавьте Yandex OAuth (опционально): [docs/TELEGRAM_OAUTH_SETUP.md](docs/TELEGRAM_OAUTH_SETUP.md)
- Настройте email уведомления
- Деплой в production

Если нужна помощь, создайте Issue на GitHub.
