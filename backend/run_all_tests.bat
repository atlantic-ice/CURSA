@echo off
echo ===============================================================
echo =  Запуск полного тестирования системы нормоконтроля документов  =
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
echo [1/4] Генерация тестовых документов...
python backend\tests\test_data_generator.py -a

echo.
echo [2/4] Запуск функциональных тестов обработки документов...
python -m pytest backend\tests\functional\test_document_processing.py -v

echo.
echo [3/4] Запуск тестов API...
python -m pytest backend\tests\functional\test_document_api.py -v

echo.
echo [4/4] Формирование сводного отчета...
python backend\tests\run_tests.py -r

echo.
echo Тестирование завершено! Отчет находится в директории backend\tests\test_data\results\
echo. 