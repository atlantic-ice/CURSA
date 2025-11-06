@echo off
setlocal EnableExtensions EnableDelayedExpansion
echo ================================================================
echo =  Запуск сервера системы нормоконтроля документов (CURSA)     =
echo ================================================================
echo.

REM Определяем доступную команду Python
set PYTHON_CMD=
where python >nul 2>nul && set PYTHON_CMD=python
if not defined PYTHON_CMD (
    where py >nul 2>nul && set PYTHON_CMD=py -3
)
if not defined PYTHON_CMD (
    echo [ОШИБКА] Python не найден в PATH. Установите Python 3 и перезапустите.
    exit /b 1
)

echo [1/2] Проверка зависимостей...
%PYTHON_CMD% -m pip freeze | findstr /I flask > nul
if %errorlevel% neq 0 (
    echo Установка Flask...
    %PYTHON_CMD% -m pip install -r requirements.txt
)

echo.
echo [2/2] Запуск сервера...
echo.
echo Сервер запущен на http://localhost:5000/
echo Для остановки сервера нажмите Ctrl+C
echo.

%PYTHON_CMD% run.py

echo.
echo Сервер остановлен.
echo. 
endlocal