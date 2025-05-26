@echo off
echo ================================================================
echo =  Запуск сервера системы нормоконтроля документов (CURSA)     =
echo ================================================================
echo.

echo [1/2] Проверка зависимостей...
python -m pip freeze | findstr flask > nul
if %errorlevel% neq 0 (
    echo Установка Flask...
    python -m pip install -r requirements.txt
)

echo.
echo [2/2] Запуск сервера...
echo.
echo Сервер запущен на http://localhost:5000/
echo Для остановки сервера нажмите Ctrl+C
echo.

python run.py

echo.
echo Сервер остановлен.
echo. 