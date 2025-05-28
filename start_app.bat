@echo off
chcp 65001 > nul
echo ================================================================
echo =  Запуск системы нормоконтроля документов (CURSA)             =
echo ================================================================
echo.

REM Проверка наличия Python и Node.js
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не установлен. Пожалуйста, установите Python 3.8 или выше.
    echo Перейдите на сайт https://www.python.org/downloads/ для загрузки.
    echo.
    echo Нажмите любую клавишу для открытия страницы загрузки Python...
    pause > nul
    start https://www.python.org/downloads/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Node.js не установлен. Необходимо установить Node.js для запуска приложения.
    echo.
    choice /C YN /M "Хотите автоматически скачать и установить Node.js?"
    if errorlevel 2 (
        echo.
        echo Вы можете установить Node.js вручную, перейдя на сайт https://nodejs.org/
        echo После установки запустите этот скрипт снова.
        echo.
        echo Нажмите любую клавишу для открытия страницы загрузки Node.js...
        pause > nul
        start https://nodejs.org/
        pause
        exit /b 1
    ) else (
        echo.
        echo Загрузка установщика Node.js...
        
        REM Создаем временную директорию
        if not exist "%TEMP%\cursa_temp" mkdir "%TEMP%\cursa_temp"
        
        REM Скачиваем установщик Node.js
        powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.14.0/node-v20.14.0-x64.msi' -OutFile '%TEMP%\cursa_temp\nodejs_installer.msi'}"
        
        if not exist "%TEMP%\cursa_temp\nodejs_installer.msi" (
            echo [ОШИБКА] Не удалось загрузить установщик Node.js.
            echo Пожалуйста, установите Node.js вручную с сайта https://nodejs.org/
            pause
            exit /b 1
        )
        
        echo Запуск установщика Node.js...
        echo Следуйте инструкциям установщика. После установки нажмите любую клавишу для продолжения.
        start "" "%TEMP%\cursa_temp\nodejs_installer.msi"
        pause
        
        REM Проверяем, установился ли Node.js
        where npm >nul 2>nul
        if %errorlevel% neq 0 (
            echo [ОШИБКА] Не удалось установить Node.js или установка была отменена.
            echo Пожалуйста, установите Node.js вручную с сайта https://nodejs.org/
            pause
            exit /b 1
        )
        
        echo Node.js успешно установлен!
        echo.
    )
)

echo [1/4] Активация виртуального окружения...
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else (
    echo Создание виртуального окружения...
    python -m venv .venv
    call .venv\Scripts\activate.bat
)

echo [2/4] Установка зависимостей бэкенда...
cd backend
python -m pip install -r requirements.txt
cd ..

echo [3/4] Установка зависимостей фронтенда...
cd frontend
npm install
cd ..

echo [4/4] Запуск приложения...
echo.
echo Бэкенд запускается на http://localhost:5000/
echo Фронтенд запускается на http://localhost:3000/
echo.
echo Для остановки приложения закройте это окно.
echo.

REM Проверка, не заняты ли порты 5000 и 3000
netstat -ano | findstr ":5000" > nul
if %errorlevel% equ 0 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Порт 5000 уже используется. Возможно, бэкенд уже запущен.
    echo Попытка остановить процесс на порту 5000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000"') do (
        taskkill /F /PID %%a
        echo Процесс с PID %%a остановлен.
    )
)

netstat -ano | findstr ":3000" > nul
if %errorlevel% equ 0 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Порт 3000 уже используется. Возможно, фронтенд уже запущен.
    echo Попытка остановить процесс на порту 3000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        taskkill /F /PID %%a
        echo Процесс с PID %%a остановлен.
    )
)

REM Запуск бэкенда в фоновом режиме с правильной кодировкой
echo Запуск бэкенда...
start "CURSA Backend" cmd /k "chcp 65001 > nul && cd backend && python run.py"

REM Запуск фронтенда с правильной кодировкой
echo Запуск фронтенда...
start "CURSA Frontend" cmd /k "chcp 65001 > nul && cd frontend && npm start"

REM Подождать и открыть браузер
echo Ожидание запуска приложения (15 секунд)...
timeout /t 15 /nobreak > nul

echo Открытие браузера...
start http://localhost:3000/

echo.
echo Приложение запущено!
echo.
echo Для остановки приложения закройте это окно командной строки.
echo. 