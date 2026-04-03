# 🔐 OAuth Setup для России - Telegram и Yandex

## 🇷🇺 Почему Telegram и Yandex?

- ✅ **Работают в России без VPN**
- ✅ **Есть у всех** - Telegram у 95% пользователей
- ✅ **Быстрая авторизация** - 1 клик в Telegram
- ✅ **Надёжно** - российские сервисы, нет блокировок

---

## 📱 Вариант 1: Telegram OAuth (РЕКОМЕНДУЕТСЯ)

### Шаг 1: Создать бота через @BotFather

1. Открыть Telegram
2. Найти **@BotFather** (официальный бот)
3. Отправить: `/newbot`
4. Ввести имя: `CURSA Document Checker`
5. Ввести username: `cursa_checker_bot`
6. **Скопировать Bot Token**: `1234567890:ABCdefGHI...`

⚠️ **Bot ID** = число до двоеточия: `1234567890`

### Шаг 2: Настроить домен

1. Команда боту: `/setdomain`
2. Выбрать бота
3. Указать: `localhost:3000`

### Шаг 3: Создать .env.local

Создать файл `frontend/.env.local`:

```env
# Telegram Bot ID (число до двоеточия)
REACT_APP_TELEGRAM_BOT_TOKEN=1234567890

# Backend URL
REACT_APP_API_URL=http://localhost:5000
```

### Шаг 4: Перезагрузить

```bash
cd frontend
npm start
```

### Шаг 5: Проверить

F12 → Console:

```javascript
console.log(process.env.REACT_APP_TELEGRAM_BOT_TOKEN);
// Должна вывести: 1234567890
```

---

## 🟡 Вариант 2: Yandex OAuth

### Шаг 1: Создать приложение

1. Перейти: https://oauth.yandex.ru/
2. Войти с Яндекс аккаунтом
3. **Зарегистрировать новое приложение**

### Шаг 2: Заполнить данные

- **Название**: `CURSA`
- **Права (Scopes)**:
  - `login:email` ✅
  - `login:info` ✅
  - `login:avatar` ✅
- **Платформы**: Веб-сервисы
- **Callback URI**:
  ```
  http://localhost:3000/auth/yandex/callback
  ```

### Шаг 3: Получить Client ID

1. Создать приложение
2. Скопировать **ID приложения**
3. Выглядит так: `a1b2c3d4e5f6g7h8`

### Шаг 4: Сохранить в .env.local

В `frontend/.env.local`:

```env
REACT_APP_YANDEX_CLIENT_ID=a1b2c3d4e5f6g7h8
REACT_APP_API_URL=http://localhost:5000
```

### Шаг 5: Перезагрузить

```bash
cd frontend
npm start
```

---

## ⚡ Вариант 3: Оба провайдера (рекомендуется)

### frontend/.env.local

```env
# Telegram
REACT_APP_TELEGRAM_BOT_TOKEN=1234567890

# Yandex
REACT_APP_YANDEX_CLIENT_ID=a1b2c3d4e5f6g7h8

# Backend
REACT_APP_API_URL=http://localhost:5000
```

Перезагрузить:

```bash
cd frontend
npm start
```

---

## 🔍 Проверка

После всех шагов:

```javascript
// F12 → Console → выполнить:
console.log("Telegram:", process.env.REACT_APP_TELEGRAM_BOT_TOKEN);
console.log("Yandex:", process.env.REACT_APP_YANDEX_CLIENT_ID);

// Если вывести значения (не "undefined") → всё работает! ✅
```

---

## 🧪 Тестирование

1. Открыть http://localhost:3000
2. Нажать кнопку "Войти через Telegram"
3. Если перенаправит на Telegram → **успешно!** ✅
4. После авторизации должен вернуть на `/auth/telegram/callback`
5. Потом редирект на `/upload?welcome=true`

---

## 🆘 Troubleshooting

### Проблема: "Bot not found"

**Решение**:

1. Проверить что бот создан через @BotFather
2. Проверить Bot ID (число до двоеточия в токене)
3. Убедиться что домен добавлен: `/setdomain`

### Проблема: "undefined" в консоли

**Решение**:

```bash
# 1. Проверить файл существует
ls frontend/.env.local

# 2. Проверить содержимое
cat frontend/.env.local

# 3. Перезагрузить npm
cd frontend
npm start

# 4. Hard refresh браузера
Ctrl+Shift+R
```

### Проблема: "Domain not allowed" (Telegram)

**Решение**:

1. @BotFather → `/setdomain`
2. Выбрать бота
3. Добавить: `localhost:3000` или ваш production домен

### Проблема: "invalid_client" (Yandex)

**Решение**:

1. Проверить Client ID на https://oauth.yandex.ru
2. Убедиться Redirect URI точный:
   ```
   http://localhost:3000/auth/yandex/callback
   ```

---

## 📚 Полная документация

Подробные инструкции смотри в:

- **`OAUTH_SETUP_GUIDE.md`** - полный гайд для Telegram и Yandex
- **`OAUTH_QUICK_FIX.md`** - быстрое исправление за 5 минут

---

## 🚀 После настройки

Приложение работает так:

1. Пользователь видит Landing Page ✨
2. Нажимает "Войти через Telegram" 📱
3. Редирект на Telegram авторизацию
4. После авторизации → возврат в приложение
5. Tokens сохраняются в localStorage
6. Редирект на `/upload` страницу
7. Видит welcome сообщение (если новый пользователь)

---

## ✅ Чекпоинт перед началом

- [ ] Telegram бот создан через @BotFather
- [ ] Yandex приложение создано (опционально)
- [ ] `frontend/.env.local` создана с Bot Token/Client ID
- [ ] `npm start` выполнен
- [ ] DevTools Console показывает значения (не undefined)
- [ ] Backend запущен (`python run.py` в другом терминале)

---

## 🎯 Преимущества Telegram/Yandex

✅ **Без VPN** - работает в России
✅ **Быстро** - авторизация за 3 секунды
✅ **Удобно** - Telegram у всех на телефоне
✅ **Надёжно** - российские сервисы, стабильные
✅ **Безопасно** - OAuth 2.0 стандарт

---

**Готово!** 🎉 OAuth с Telegram и Yandex настроен для работы в России!
