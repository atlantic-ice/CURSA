@echo off
echo ===============================================================
echo =  Запуск модульных тестов системы нормоконтроля документов  =
echo ===============================================================
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
echo [1/2] Запуск модульных тестов DocumentProcessor...
python -m pytest backend\tests\unit\test_document_processor.py -v

echo.
echo [2/2] Запуск модульных тестов NormControlChecker...
python -m pytest backend\tests\unit\test_norm_control_checker.py -v

echo.
echo Формирование отчета о результатах тестирования...
python backend\tests\generate_report.py --unit-only

echo.
echo Тестирование завершено. Отчет сохранен в директории tests/test_data/results/
echo. 