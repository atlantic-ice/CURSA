# 🔐 OAuth Setup Guide - Настройка Telegram и Yandex

## 🇷🇺 Используем OAuth провайдеры, доступные в России

В России стабильно работают:

- ✅ **Telegram** - есть у всех, быстрая авторизация через бота
- ✅ **Yandex ID** - российский сервис, доступен всем

---

## 📱 Telegram OAuth Setup

### Шаг 1: Создать Telegram бота через @BotFather

1. Открыть Telegram
2. Найти бота **@BotFather** (официальный бот Telegram)
3. Отправить команду: `/newbot`
4. Ввести имя бота (например: `CURSA Document Checker`)
5. Ввести username бота (например: `cursa_checker_bot`)
6. BotFather выдаст **Bot Token**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

⚠️ **ВАЖНО**: Сохранить Bot Token - это ваш Client ID для Telegram!

### Шаг 2: Настроить Telegram Login Widget

1. Отправить боту @BotFather команду: `/setdomain`
2. Выбрать созданного бота
3. Указать домен:
   ```
   localhost:3000
   ```
   Для production:
   ```
   yourapp.com
   ```

### Шаг 3: Включить Telegram Login

1. Команда боту: `/mybots`
2. Выбрать бота
3. **Bot Settings** → **Domain**
4. Добавить:
   ```
   localhost:3000
   yourapp.com
   ```

### Шаг 4: Получить Bot ID

Bot ID - это первая часть токена до двоеточия.
Например, если токен: `1234567890:ABCdefGHI...`
То Bot ID: `1234567890`

---

## 🟡 Yandex OAuth Setup

### Шаг 1: Yandex OAuth Portal

1. Перейти: https://oauth.yandex.ru/
2. Войти с Яндекс аккаунтом
3. Нажать **Зарегистрировать новое приложение**

### Шаг 2: Заполнить информацию

1. **Название**: `CURSA`
2. **Права (Scopes)** - выбрать:
   - `login:email` - доступ к email
   - `login:info` - доступ к профилю
   - `login:avatar` - доступ к аватару
3. **Платформы** → выбрать **Веб-сервисы**
4. **Callback URI** (Redirect URI):
   ```
   http://localhost:3000/auth/yandex/callback
   http://127.0.0.1:3000/auth/yandex/callback
   https://yourapp.com/auth/yandex/callback
   ```

### Шаг 3: Получить Client ID

1. После создания приложения нажать на него
2. Скопировать **ID приложения** (Client ID)
   - Выглядит так: `a1b2c3d4e5f6g7h8i9j0`

### Шаг 4: Примечание о Client Secret

⚠️ **Client Secret** нужен только для backend!

- Frontend использует только **Client ID**
- Secret должен храниться на сервере в переменных окружения

---

## 💾 Сохранить в .env.local

Создать файл `frontend/.env.local`:

```env
# Telegram Bot Token (или Bot ID)
REACT_APP_TELEGRAM_BOT_TOKEN=1234567890

# Yandex Client ID
REACT_APP_YANDEX_CLIENT_ID=a1b2c3d4e5f6g7h8i9j0

# Backend API URL
REACT_APP_API_URL=http://localhost:5000
```

⚠️ **ВАЖНО**:

- Файл `.env.local` должен быть в папке `frontend/`, НЕ в корне!
- Не коммитить `.env.local` в Git (добавить в `.gitignore`)
- Telegram использует Bot ID (число до двоеточия в токене)

---

## 🔄 Перезагрузить приложение

```bash
# Terminal в директории frontend/
Ctrl+C  # остановить старый процесс если запущен

npm start  # перезапустить с новыми переменными окружения
```

### Проверка

1. Открыть http://localhost:3000
2. F12 → Console tab
3. Выполнить:
   ```javascript
   console.log("Telegram Bot Token:", process.env.REACT_APP_TELEGRAM_BOT_TOKEN);
   console.log("Yandex Client ID:", process.env.REACT_APP_YANDEX_CLIENT_ID);
   ```
4. Должны вывести ваши значения (не `undefined`!)

---

## 🧪 Тестирование OAuth Flow

### Локальное тестирование

1. Открыть http://localhost:3000
2. Нажать "Войти через Telegram"
3. Должен редирект на Telegram login страницу
4. После авторизации → редирект на http://localhost:3000/auth/telegram/callback
5. Должен видеть loading spinner "Вы входите в приложение..."
6. После успеха → редирект на `/upload?welcome=true`

### Debug информация

При клике на OAuth кнопку в DevTools Console должны видеть:

```
[OAuth telegram] Config: {
  clientId: "1234567890",
  provider: "telegram",
  redirectUri: "http://localhost:3000/auth/telegram/callback"
}
[OAuth telegram] Redirecting to: https://oauth.telegram.org/auth?bot_id=...
```

### Если ошибка

При отсутствии Bot Token:

```
❌ OAuth Bot Token для telegram не установлен!

Установите переменную окружения:
REACT_APP_TELEGRAM_BOT_TOKEN=your_bot_id

В файле frontend/.env.local
```

---

## 🔧 Troubleshooting

### Проблема: "Bot not found"

**Причина**: Bot Token/ID неправильный или бот не создан

**Решение**:

```bash
# 1. Проверить что бот создан через @BotFather
# 2. Убедиться что .env.local существует
ls frontend/.env.local

# 3. Проверить что Bot ID скопирован правильно (только число до двоеточия)
cat frontend/.env.local | grep TELEGRAM_BOT_TOKEN

# 4. Перезагрузить браузер
Ctrl+Shift+R

# 5. Restart dev сервер
npm start
```

### Проблема: "Domain not allowed"

**Причина**: Домен не добавлен в настройках бота

**Решение**:

1. Открыть Telegram → @BotFather
2. Команда: `/mybots`
3. Выбрать бота → **Bot Settings** → **Domain**
4. Добавить: `localhost:3000` или ваш production домен

### Проблема: "invalid_client" (Yandex)

**Причина**: Client ID неправильный или Redirect URI не совпадает

**Решение**:

1. Проверить Client ID на https://oauth.yandex.ru
2. Убедиться что Redirect URI точно:
   ```
   http://localhost:3000/auth/yandex/callback
   ```
3. Проверить все символы - пробелы, слешы, регистр

---

## 🌐 Production Setup

### Для Heroku/Render/Vercel

1. **Смена Domain**:

   ```
   http://localhost:3000/auth/telegram/callback
   ↓
   https://cursa.onrender.com/auth/telegram/callback
   ```

2. **Telegram Bot Settings**:
   - @BotFather → `/setdomain`
   - Добавить production домен: `cursa.onrender.com`

3. **Yandex OAuth**:
   - https://oauth.yandex.ru → ваше приложение
   - Добавить Redirect URI:
     ```
     https://cursa.onrender.com/auth/yandex/callback
     ```

4. **Backend Environment Variables**:

   ```env
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHI...
   YANDEX_CLIENT_ID=a1b2c3d4e5f6
   YANDEX_CLIENT_SECRET=your_secret
   ```

5. **Frontend Environment Variables** (на хостинге):
   ```env
   REACT_APP_TELEGRAM_BOT_TOKEN=1234567890
   REACT_APP_YANDEX_CLIENT_ID=a1b2c3d4e5f6
   REACT_APP_API_URL=https://api.cursa.onrender.com
   ```

---

## ✅ Checklist

### Перед запуском

- [ ] Frontend/.env.local создан
- [ ] REACT_APP_TELEGRAM_BOT_TOKEN установлен (Bot ID)
- [ ] REACT_APP_YANDEX_CLIENT_ID установлен
- [ ] npm start перезапущен после изменения .env.local
- [ ] Backend запущен (python run.py)
- [ ] Telegram бот создан через @BotFather
- [ ] Domain добавлен в настройки бота

### При тестировании

- [ ] DevTools Console показывает Bot Token и Client ID (не undefined)
- [ ] Клик на OAuth кнопку редирект на провайдера
- [ ] После логина редирект на /auth/{provider}/callback
- [ ] Tokens сохраняются в localStorage (DevTools → Application → Local Storage)
- [ ] Редирект на /upload происходит успешно

### Для production

- [ ] Production домен добавлен в Telegram бота (@BotFather)
- [ ] Redirect URI обновлена в Yandex OAuth
- [ ] Environment variables установлены на хостинге
- [ ] HTTPS используется
- [ ] Client Secret никогда не отправляется на frontend

---

## 🆘 Если всё ещё не работает

### Debug шаги

1. **Проверить Network запрос**:

   ```
   DevTools → Network tab → нажать OAuth кнопку
   Должны видеть запрос на oauth.telegram.org или oauth.yandex.ru
   ```

2. **Проверить Response**:

   ```
   Если видите ошибку - посмотреть её в окне браузера
   Скопировать текст ошибки
   ```

3. **Проверить Backend логи**:

   ```bash
   Backend должен получить код от провайдера
   И обменять его на токены
   Проверить backend/app/logs/
   ```

4. **Telegram специфичные проблемы**:
   - Убедиться что бот создан и активен
   - Проверить что используется Bot ID (число), а не полный токен
   - Проверить что домен добавлен через @BotFather

5. **Yandex специфичные проблемы**:
   - Проверить что Callback URI абсолютно точный (с /auth/yandex/callback)
   - Убедиться что scopes добавлены: `login:email` и `login:info`
   - Проверить что приложение не заблокировано

---

## 📝 Резюме

**Что нужно сделать**:

1. ✅ Создать Telegram бота через @BotFather → получить Bot Token
2. ✅ Зарегистрировать приложение в Yandex OAuth → получить Client ID
3. ✅ Создать `frontend/.env.local` с обоими значениями
4. ✅ Перезапустить npm start
5. ✅ Протестировать авторизацию

**Время на настройку**: ~10 минут

**Преимущества**:

- ✅ Работает в России без VPN
- ✅ Telegram есть у всех
- ✅ Yandex - российский сервис
- ✅ Быстрая авторизация
- ✅ Нет блокировок и проблем с доступом
