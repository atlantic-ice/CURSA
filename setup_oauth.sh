#!/bin/bash

# Setup script для OAuth конфигурации CURSA (Telegram + Yandex)

echo "🇷🇺 CURSA OAuth Configuration Setup - Telegram & Yandex"
echo "========================================================"
echo ""

# Проверить что находимся в правильной директории
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    exit 1
fi

cd frontend

# Создать .env.local если не существует
if [ ! -f ".env.local" ]; then
    echo "📁 Создание frontend/.env.local..."
    touch .env.local
fi

echo ""
echo "📝 Введите ваши OAuth данные:"
echo ""

# Telegram Bot Token
echo "📡 Telegram Bot Setup:"
echo "1. Открыть Telegram → @BotFather"
echo "2. /newbot → создать бота"
echo "3. Скопировать Bot Token: 1234567890:ABCdef..."
echo "4. Bot ID = число ДО двоеточия (например: 1234567890)"
echo ""
read -p "Telegram Bot ID (число до двоеточия): " TELEGRAM_BOT_TOKEN
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "⚠️  Пропущен Telegram Bot Token"
else
    echo "REACT_APP_TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN" >> .env.local
    echo "✅ Telegram Bot Token добавлен"
fi

echo ""

# Yandex Client ID
echo "🟡 Yandex OAuth Setup:"
echo "1. Перейти на https://oauth.yandex.ru/"
echo "2. Зарегистрировать новое приложение"
echo "3. Скопировать ID приложения (Client ID)"
echo ""
read -p "Yandex Client ID (из oauth.yandex.ru): " YANDEX_CLIENT_ID
if [ -z "$YANDEX_CLIENT_ID" ]; then
    echo "⚠️  Пропущен Yandex Client ID"
else
    echo "REACT_APP_YANDEX_CLIENT_ID=$YANDEX_CLIENT_ID" >> .env.local
    echo "✅ Yandex Client ID добавлен"
fi

echo ""

# API URL
read -p "API URL (по умолчанию http://localhost:5000): " API_URL
API_URL=${API_URL:-http://localhost:5000}
echo "REACT_APP_API_URL=$API_URL" >> .env.local
echo "✅ API URL добавлен: $API_URL"

echo ""
echo "✅ Конфигурация сохранена в frontend/.env.local"
echo ""
echo "📋 Содержимое файла:"
cat .env.local
echo ""
echo "🚀 Теперь:"
echo "   1. @BotFather → /setdomain → указать localhost:3000"
echo "   2. npm start"
echo "   3. Открыть http://localhost:3000"
