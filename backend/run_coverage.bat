@echo off
echo ===============================================================
echo =  Анализ покрытия кода тестами системы нормоконтроля документов  =
echo ===============================================================
echo.

REM Проверка зависимостей
python -m pip freeze | findstr pytest-cov > nul
if %errorlevel% neq 0 (
    echo Установка pytest-cov...
    python -m pip install pytest-cov
)

python -m pip freeze | findstr pytest > nul
if %errorlevel% neq 0 (
    echo Установка pytest...
    python -m pip install pytest
)

echo.
echo [1/3] Запуск тестов с анализом покрытия кода...
python -m pytest --cov=backend/app/services --cov-report=html backend/tests/

echo.
echo [2/3] Формирование отчета о покрытии...
echo Отчет создан в директории htmlcov/

echo.
echo [3/3] Открытие отчета о покрытии...
start htmlcov\index.html

echo.
echo Анализ покрытия завершен. Отчет доступен в директории htmlcov/
echo. 