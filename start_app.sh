#!/bin/bash

echo "================================================================"
echo "=  Запуск системы нормоконтроля документов (CURSA)             ="
echo "================================================================"
echo ""

# Проверка наличия Python и Node.js
if ! command -v python3 &> /dev/null; then
    echo "[ОШИБКА] Python не установлен. Пожалуйста, установите Python 3.8 или выше."
    echo "Для Linux: sudo apt install python3 python3-pip python3-venv"
    echo "Для macOS: brew install python"
    echo ""
    read -p "Нажмите Enter для открытия страницы загрузки Python..."
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://www.python.org/downloads/"
    elif command -v open &> /dev/null; then
        open "https://www.python.org/downloads/"
    fi
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "[ПРЕДУПРЕЖДЕНИЕ] Node.js не установлен. Необходимо установить Node.js для запуска приложения."
    echo ""
    read -p "Хотите автоматически установить Node.js? (y/n): " choice
    
    if [[ "$choice" != "y" && "$choice" != "Y" ]]; then
        echo ""
        echo "Вы можете установить Node.js вручную:"
        echo "Для Linux: sudo apt install nodejs npm"
        echo "Для macOS: brew install node"
        echo ""
        read -p "Нажмите Enter для открытия страницы загрузки Node.js..."
        if command -v xdg-open &> /dev/null; then
            xdg-open "https://nodejs.org/"
        elif command -v open &> /dev/null; then
            open "https://nodejs.org/"
        fi
        exit 1
    else
        echo ""
        echo "Установка Node.js..."
        
        # Определяем ОС
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            echo "Обнаружена Linux система"
            
            # Проверяем наличие apt (Debian/Ubuntu)
            if command -v apt &> /dev/null; then
                echo "Установка через apt..."
                sudo apt update
                sudo apt install -y nodejs npm
            # Проверяем наличие dnf (Fedora)
            elif command -v dnf &> /dev/null; then
                echo "Установка через dnf..."
                sudo dnf install -y nodejs npm
            # Проверяем наличие yum (CentOS/RHEL)
            elif command -v yum &> /dev/null; then
                echo "Установка через yum..."
                sudo yum install -y nodejs npm
            # Проверяем наличие pacman (Arch Linux)
            elif command -v pacman &> /dev/null; then
                echo "Установка через pacman..."
                sudo pacman -S --noconfirm nodejs npm
            else
                echo "[ОШИБКА] Не удалось определить пакетный менеджер."
                echo "Пожалуйста, установите Node.js вручную с сайта https://nodejs.org/"
                exit 1
            fi
            
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            echo "Обнаружена macOS система"
            
            # Проверяем наличие Homebrew
            if command -v brew &> /dev/null; then
                echo "Установка через Homebrew..."
                brew install node
            else
                echo "Установка Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                echo "Установка Node.js..."
                brew install node
            fi
        else
            echo "[ОШИБКА] Неподдерживаемая операционная система."
            echo "Пожалуйста, установите Node.js вручную с сайта https://nodejs.org/"
            exit 1
        fi
        
        # Проверяем, установился ли Node.js
        if ! command -v npm &> /dev/null; then
            echo "[ОШИБКА] Не удалось установить Node.js."
            echo "Пожалуйста, установите Node.js вручную с сайта https://nodejs.org/"
            exit 1
        fi
        
        echo "Node.js успешно установлен!"
        echo ""
    fi
fi

# Проверка, не заняты ли порты 5000 и 3000
if command -v lsof &> /dev/null; then
    if lsof -i:5000 &> /dev/null; then
        echo "[ПРЕДУПРЕЖДЕНИЕ] Порт 5000 уже используется. Возможно, бэкенд уже запущен."
        echo "Попытка остановить процесс на порту 5000..."
        lsof -ti:5000 | xargs kill -9
        echo "Процесс остановлен."
    fi

    if lsof -i:3000 &> /dev/null; then
        echo "[ПРЕДУПРЕЖДЕНИЕ] Порт 3000 уже используется. Возможно, фронтенд уже запущен."
        echo "Попытка остановить процесс на порту 3000..."
        lsof -ti:3000 | xargs kill -9
        echo "Процесс остановлен."
    fi
fi

echo "[1/4] Активация виртуального окружения..."
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "Создание виртуального окружения..."
    python3 -m venv .venv
    source .venv/bin/activate
fi

echo "[2/4] Установка зависимостей бэкенда..."
cd backend
pip install -r requirements.txt
cd ..

echo "[3/4] Установка зависимостей фронтенда..."
cd frontend
npm install
cd ..

echo "[4/4] Запуск приложения..."
echo ""
echo "Бэкенд запускается на http://localhost:5000/"
echo "Фронтенд запускается на http://localhost:3000/"
echo ""
echo "Для остановки приложения нажмите Ctrl+C в этом окне."
echo ""

# Запуск бэкенда в фоновом режиме
echo "Запуск бэкенда..."
cd backend
python3 run.py &
BACKEND_PID=$!
cd ..

# Запуск фронтенда
echo "Запуск фронтенда..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Подождать и открыть браузер
echo "Ожидание запуска приложения (15 секунд)..."
sleep 15

echo "Открытие браузера..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000/
elif command -v open &> /dev/null; then
    open http://localhost:3000/
fi

echo ""
echo "Приложение запущено!"
echo ""
echo "Для остановки приложения нажмите Ctrl+C в этом окне."
echo ""

# Обработка завершения скрипта
function cleanup {
    echo "Остановка приложения..."
    kill $FRONTEND_PID
    kill $BACKEND_PID
    exit 0
}

# Перехват сигнала завершения
trap cleanup SIGINT SIGTERM

# Ждем завершения процессов
wait 