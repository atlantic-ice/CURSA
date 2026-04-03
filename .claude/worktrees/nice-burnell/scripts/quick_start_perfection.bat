@echo off
REM Quick Start Script для начала работы над улучшением качества кода (Windows)

echo ========================================================
echo 🎯 CURSA - Quick Start для доведения функционала до идеала
echo ========================================================
echo.

REM 1. Установка инструментов для линтинга и форматирования
echo 📦 Шаг 1: Установка инструментов качества кода...
cd backend

if not exist "venv" (
    echo Создание виртуального окружения...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo Установка black, isort, pylint, mypy...
pip install black isort pylint mypy pytest pytest-cov pre-commit -q

echo ✅ Инструменты установлены
echo.

REM 2. Форматирование кода
echo 🎨 Шаг 2: Форматирование кода...
echo Запуск black...
black app\ tests\ --line-length 100

echo Сортировка imports...
isort app\ tests\ --profile black

echo ✅ Код отформатирован
echo.

REM 3. Проверка линтерами
echo 🔍 Шаг 3: Проверка качества кода...
echo Запуск pylint...
pylint app\ --max-line-length=100

echo Запуск mypy...
mypy app\ --ignore-missing-imports

echo ✅ Проверка завершена
echo.

REM 4. Запуск тестов
echo 🧪 Шаг 4: Запуск тестов с coverage...
pytest --cov=app --cov-report=term-missing --cov-report=html

echo ✅ Тесты завершены. Отчет: htmlcov\index.html
echo.

REM 5. Pre-commit hooks
echo 🪝 Шаг 5: Настройка pre-commit hooks...
if exist "..\\.pre-commit-config.yaml" (
    pre-commit install
    echo ✅ Pre-commit hooks установлены
) else (
    echo ⚠️  .pre-commit-config.yaml не найден
)
echo.

REM 6. Итоги
echo ========================================================
echo 🎉 Готово! Система настроена для работы над качеством кода
echo.
echo 📋 Следующие шаги:
echo 1. Просмотрите PERFECTION_PLAN.md для общего плана
echo 2. Проверьте htmlcov\index.html для анализа покрытия тестами
echo 3. Начните с рефакторинга DocumentCorrector (см. план)
echo 4. Используйте CODE_REVIEW_CHECKLIST.md при code review
echo.
echo 🔧 Полезные команды:
echo   black .                      # Форматирование
echo   isort .                      # Сортировка imports
echo   pylint app\                  # Линтинг
echo   pytest --cov=app             # Тесты с coverage
echo   mypy app\                    # Type checking
echo.
echo Удачи! 🚀
echo.
pause
