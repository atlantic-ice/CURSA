@echo off
echo ===============================================================
echo =  Запуск интеграционных тестов системы нормоконтроля документов  =
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

python -m pip freeze | findstr requests > nul
if %errorlevel% neq 0 (
    echo Установка requests...
    python -m pip install requests
)

python -m pip freeze | findstr matplotlib > nul
if %errorlevel% neq 0 (
    echo Установка matplotlib...
    python -m pip install matplotlib
)

echo.
echo [1/2] Запуск интеграционных тестов полного цикла работы с документами...
python -m pytest backend\tests\integration\test_document_flow.py -v -m integration

echo.
echo [2/2] Формирование HTML-отчета о результатах тестирования...
python backend\tests\generate_html_report.py

echo.
echo Тестирование завершено. Отчеты доступны в директории tests/test_data/results/
start backend\tests\test_data\results\html_reports\
echo. 