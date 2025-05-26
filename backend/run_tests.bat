@echo off
echo =======================================
echo = Запуск тестов системы нормоконтроля =
echo =======================================
echo.

REM Проверка зависимостей
python -m pip freeze | findstr pytest > nul
if %errorlevel% neq 0 (
    echo Установка pytest...
    python -m pip install pytest
)

python -m pip freeze | findstr docx > nul
if %errorlevel% neq 0 (
    echo Установка python-docx...
    python -m pip install python-docx
)

echo.
echo Выберите режим запуска:
echo 1. Запустить все тесты
echo 2. Создать пример результатов и отчет
echo 3. Сформировать отчет из существующих результатов
echo.

set /p choice="Ваш выбор (1-3): "

if "%choice%"=="1" (
    echo.
    echo Запуск всех тестов...
    python tests/run_tests.py -v
) else if "%choice%"=="2" (
    echo.
    echo Создание примера результатов тестирования...
    python tests/run_tests.py -s
) else if "%choice%"=="3" (
    echo.
    echo Формирование отчета из существующих результатов...
    python tests/run_tests.py -r
) else (
    echo.
    echo Неверный выбор. Пожалуйста, выберите 1, 2 или 3.
    exit /b 1
)

echo.
echo Проверьте результаты в директории tests/test_data/results/
echo. 