@echo off
REM Setup script для OAuth конфигурации CURSA (Windows) - Telegram & Yandex

echo 🇷🇺 CURSA OAuth Configuration Setup - Telegram & Yandex
echo ========================================================
echo.

REM Проверить что находимся в правильной директории
if not exist "frontend\package.json" (
    echo ❌ Ошибка: запустите скрипт из корневой директории проекта
    exit /b 1
)

cd frontend

REM Создать .env.local если не существует
if not exist ".env.local" (
    echo 📁 Создание frontend\.env.local...
    type nul > .env.local
)

echo.
echo 📝 Введите ваши OAuth данные:
echo.

REM Telegram Bot Token
echo 📱 Telegram Bot Setup:
echo 1. Открыть Telegram → @BotFather
echo 2. /newbot → создать бота
echo 3. Скопировать Bot Token: 1234567890:ABCdef...
echo 4. Bot ID = число ДО двоеточия (например: 1234567890)
echo.
set /p TELEGRAM_BOT_TOKEN="Telegram Bot ID (число до двоеточия): "
if not "%TELEGRAM_BOT_TOKEN%"=="" (
    echo REACT_APP_TELEGRAM_BOT_TOKEN=%TELEGRAM_BOT_TOKEN%>> .env.local
    echo ✅ Telegram Bot Token добавлен
) else (
    echo ⚠️  Пропущен Telegram Bot Token
)

echo.

REM Yandex Client ID
echo 🟡 Yandex OAuth Setup:
echo 1. Перейти на https://oauth.yandex.ru/
echo 2. Зарегистрировать новое приложение
echo 3. Скопировать ID приложения (Client ID)
echo.
set /p YANDEX_CLIENT_ID="Yandex Client ID (из oauth.yandex.ru): "
if not "%YANDEX_CLIENT_ID%"=="" (
    echo REACT_APP_YANDEX_CLIENT_ID=%YANDEX_CLIENT_ID%>> .env.local
    echo ✅ Yandex Client ID добавлен
) else (
    echo ⚠️  Пропущен Yandex Client ID
)

echo.

REM API URL
set "API_URL=http://localhost:5000"
set /p "API_URL=API URL (по умолчанию http://localhost:5000): "
echo REACT_APP_API_URL=%API_URL%>> .env.local
echo ✅ API URL добавлен: %API_URL%

echo.
echo ✅ Конфигурация сохранена в frontend\.env.local
echo.
echo 📋 Содержимое файла:
type .env.local
echo.
echo 🚀 Теперь:
echo    1. @BotFather → /setdomain → указать localhost:3000
echo    2. npm start
echo    3. Открыть http://localhost:3000
