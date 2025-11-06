@echo off
chcp 65001 > nul
echo ================================================================
echo =  Запуск системы нормоконтроля документов (CURSA)             =
echo ================================================================
echo.

REM Проверка наличия Python (python или py) и Node.js
set PYTHON_CMD=
where python >nul 2>nul && set PYTHON_CMD=python
if not defined PYTHON_CMD (
    where py >nul 2>nul && set PYTHON_CMD=py -3
)
if not defined PYTHON_CMD (
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

echo [1/5] Проверка зависимостей бэкенда...
cd backend
%PYTHON_CMD% -m pip install -q -r requirements.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось установить зависимости бэкенда.
    pause
    exit /b 1
)
cd ..
echo    ✓ Зависимости бэкенда установлены

echo [2/5] Проверка зависимостей фронтенда...
cd frontend
if not exist node_modules (
    echo    Установка зависимостей фронтенда (это может занять несколько минут)...
    call npm install >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось установить зависимости фронтенда.
        cd ..
        pause
        exit /b 1
    )
) else (
    echo    ✓ Зависимости фронтенда уже установлены
)
cd ..

echo [3/5] Проверка портов...
echo.
echo Бэкенд запускается на http://localhost:5000/
echo Фронтенд запускается на http://localhost:3000/
echo.
echo Для остановки приложения закройте это окно.
echo.

echo [3/5] Проверка портов...
REM Проверка, не заняты ли порты 5000 и 3000
netstat -ano | findstr ":5000" > nul
if %errorlevel% equ 0 (
    echo    ⚠ Порт 5000 занят. Останавливаю процесс...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

netstat -ano | findstr ":3000" > nul
if %errorlevel% equ 0 (
    echo    ⚠ Порт 3000 занят. Останавливаю процесс...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)
echo    ✓ Порты свободны

echo [4/5] Запуск Backend (http://localhost:5000)...
start "CURSA Backend" cmd /k "chcp 65001 > nul && title CURSA Backend && cd /d %CD%\backend && set PYTHONIOENCODING=utf-8 && %PYTHON_CMD% run.py"
timeout /t 3 /nobreak >nul
echo    ✓ Backend запущен

echo [5/5] Запуск Frontend (http://localhost:3000)...
start "CURSA Frontend" cmd /k "chcp 65001 > nul && title CURSA Frontend && cd /d %CD%\frontend && npm start"
timeout /t 5 /nobreak >nul
echo    ✓ Frontend запускается...

echo    ✓ Frontend запускается...

echo.
echo ================================================================
echo   ПРИЛОЖЕНИЕ УСПЕШНО ЗАПУЩЕНО!
echo ================================================================
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo.
echo   Откройте браузер и перейдите на http://localhost:3000
echo.
echo   Для остановки закройте окна "CURSA Backend" и "CURSA Frontend"
echo ================================================================
echo.

REM Ожидание полного запуска и открытие браузера
timeout /t 10 /nobreak >nul

echo Открытие приложения в браузере...
start http://localhost:3000/

echo.
echo Нажмите любую клавишу для выхода из этого окна...
echo (Backend и Frontend продолжат работать в отдельных окнах)
pause >nul 