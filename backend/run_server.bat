@echo off
setlocal EnableExtensions EnableDelayedExpansion
echo ================================================================
echo =  Запуск сервера системы нормоконтроля документов (CURSA)     =
echo ================================================================
echo.

REM Переходим в директорию скрипта
cd /d "%~dp0"

REM 1. Пытаемся найти виртуальное окружение в корне проекта
set "VENV_PYTHON=..\.venv\Scripts\python.exe"
if exist "%VENV_PYTHON%" (
    echo [INFO] Найдено виртуальное окружение: .venv
    set "PYTHON_CMD=%VENV_PYTHON%"
) else (
    REM 2. Если нет venv, ищем глобальный python
    set PYTHON_CMD=
    where python >nul 2>nul && set PYTHON_CMD=python
    if not defined PYTHON_CMD (
        where py >nul 2>nul && set PYTHON_CMD=py -3
    )
    if not defined PYTHON_CMD (
        echo [ОШИБКА] Python не найден в PATH. Установите Python 3 и перезапустите.
        exit /b 1
    )
    echo [INFO] Используется глобальный Python
)

echo [1/2] Проверка зависимостей...
REM Проверяем наличие ключевой библиотеки dotenv
"%PYTHON_CMD%" -c "import dotenv" >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Установка зависимостей...
    "%PYTHON_CMD%" -m pip install -r requirements.txt
)

echo.
echo [2/2] Запуск сервера...
echo.
echo Сервер запущен на http://localhost:5000/
echo Для остановки сервера нажмите Ctrl+C
echo.

"%PYTHON_CMD%" run.py

echo.
echo Сервер остановлен.
echo. 
endlocal
