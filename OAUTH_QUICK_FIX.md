# ⚡ QUICK FIX: OAuth Setup для России

## 🇷🇺 Используем доступные в России провайдеры

Telegram и Yandex - работают стабильно, есть у всех, без VPN.

---

## ✅ Решение за 5 минут

### Шаг 1: Создать Telegram бота

1. Открыть Telegram → найти **@BotFather**
2. Отправить команду: `/newbot`
3. Ввести имя бота: `CURSA Checker`
4. Ввести username: `cursa_checker_bot`
5. **Скопировать Bot Token**: `1234567890:ABCdefGHI...`
6. **Bot ID** = число до двоеточия: `1234567890`

### Шаг 2: Настроить домен бота

1. Команда боту @BotFather: `/setdomain`
2. Выбрать бота
3. Указать: `localhost:3000`

### Шаг 3: Создать Yandex OAuth App

1. Перейти: https://oauth.yandex.ru/
2. Войти с Яндекс аккаунтом
3. **Зарегистрировать новое приложение**
4. Название: `CURSA`
5. **Права**:
   - `login:email`
   - `login:info`
   - `login:avatar`
6. **Платформы** → **Веб-сервисы**
7. **Callback URI**:
   ```
   http://localhost:3000/auth/yandex/callback
   ```
8. **Создать** → скопировать **ID приложения**

### Шаг 4: Создать .env.local

Создать файл `frontend/.env.local`:

```env
# Telegram Bot ID (число до двоеточия из Bot Token)
REACT_APP_TELEGRAM_BOT_TOKEN=1234567890

# Yandex Client ID
REACT_APP_YANDEX_CLIENT_ID=a1b2c3d4e5f6g7h8

# Backend URL
REACT_APP_API_URL=http://localhost:5000
```

⚠️ **ВАЖНО**: Файл должен быть в папке `frontend/`, не в корне!

### Шаг 5: Перезагрузить приложение

```bash
cd frontend
npm start
```

---

## 🔍 Проверка

### DevTools Console

```javascript
// F12 → Console → выполнить:
console.log("Telegram:", process.env.REACT_APP_TELEGRAM_BOT_TOKEN);
console.log("Yandex:", process.env.REACT_APP_YANDEX_CLIENT_ID);

// Должны вывестись ваши значения (не "undefined")
```

### Попробовать логин

1. Открыть http://localhost:3000
2. Нажать "Войти через Telegram"
3. Если перенаправит на Telegram → всё работает! ✅

---

## 🆘 Troubleshooting

### Ошибка 1: "undefined" в консоли

```javascript
console.log(process.env.REACT_APP_GOOGLE_CLIENT_ID); // undefined ❌
```

**Решение**:

```bash
# 1. Проверить что файл существует и в правильной папке
ls frontend/.env.local  # должен существовать

# 2. Проверить что скопировано правильно
cat frontend/.env.local  # должен показать Client ID

# 3. Перезагрузить браузер полностью
Ctrl+Shift+R  # hard refresh

# 4. Перезагрузить npm
npm start
```

### Ошибка 2: "redirect_uri doesn't match"

```
The redirect URI doesn't match the ones you registered
```

**Решение**:

- Убедиться что в Google Cloud Console добавлена:
  ```
  http://localhost:3000/auth/google/callback
  ```
- ⚠️ **Точно такой же как в коде!** (с /auth/google/callback в конце)

### Ошибка 3: "invalid_client" при уже установленном Client ID

```
The OAuth client was not found. Ошибка 401: invalid_client
```

**Решение**:

1. Скопировать Client ID ещё раз из Google Cloud Console
2. Убедиться что нет пробелов в начале/конце
3. Убедиться что это именно **Client ID**, а не **Client Secret**
4. Удалить старый .env.local и создать новый:
   ```bash
   rm frontend/.env.local
   # Создать заново с правильным Client ID
   ```

---

## 📋 Файловая структура (как должно быть)

```
CURSA/
├── frontend/
│   ├── .env.local              ← ДОЛЖЕН БЫТЬ ЗДЕСЬ (с Client ID)
│   ├── package.json
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   └── ...
├── backend/
├── OAUTH_SETUP_GUIDE.md
├── setup_oauth.sh
├── setup_oauth.bat
└── ...
```

---

## 🚀 Автоматическая настройка (опционально)

Если хотите быстро настроить:

### Linux/Mac:

```bash
chmod +x setup_oauth.sh
./setup_oauth.sh
```

### Windows:

```cmd
setup_oauth.bat
```

Скрипт спросит ваш Client ID и создаст `.env.local` автоматически.

---

## ✅ Финальный чекпоинт

Перед тем как начать тестировать:

- [ ] `frontend/.env.local` создана
- [ ] `REACT_APP_GOOGLE_CLIENT_ID=...` добавлен (не пустой, не undefined)
- [ ] `npm start` перезапущен
- [ ] DevTools Console показывает Client ID (не undefined)
- [ ] Backend запущен на http://localhost:5000

---

## 📞 Если ничего не помогло

1. Скопировать **полный текст ошибки** из браузера
2. Проверить что Client ID скопирован **точно как в Google Cloud Console**
3. Убедиться что **http://localhost:3000/auth/google/callback добавлен** в Google Cloud Console
4. Перезагрузить браузер **полностью** (Ctrl+Shift+R)
5. Перезагрузить npm (запустить npm start заново)

Если всё ещё ошибка - check OAUTH_SETUP_GUIDE.md для полных инструкций! 📚
