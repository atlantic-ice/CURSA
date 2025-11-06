@echo off
setlocal EnableExtensions EnableDelayedExpansion
echo ===============================================================
echo =  Запуск модульных тестов системы нормоконтроля документов  =
echo ===============================================================
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

REM Проверка зависимостей
%PYTHON_CMD% -m pip freeze | findstr /I pytest > nul
if %errorlevel% neq 0 (
    echo Установка pytest...
    %PYTHON_CMD% -m pip install pytest
)

%PYTHON_CMD% -m pip freeze | findstr /I docx > nul
if %errorlevel% neq 0 (
    echo Установка python-docx...
    %PYTHON_CMD% -m pip install python-docx
)

echo.
echo [1/3] Запуск модульных тестов DocumentProcessor...
%PYTHON_CMD% -m pytest backend\tests\unit\test_document_processor.py -v

echo.
echo [2/3] Запуск модульных тестов NormControlChecker...
%PYTHON_CMD% -m pytest backend\tests\unit\test_norm_control_checker.py -v

echo.
echo [3/3] Запуск модульного теста заголовков и интервалов...
%PYTHON_CMD% -m pytest backend\tests\unit\test_heading_spacing_correction.py -v

echo.
echo Формирование отчета о результатах тестирования...
%PYTHON_CMD% backend\tests\generate_report.py --unit-only

echo.
echo Тестирование завершено. Отчет сохранен в директории tests/test_data/results/
echo. 
endlocal