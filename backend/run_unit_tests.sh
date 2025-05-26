#!/bin/bash

echo "==============================================================="
echo "=  Запуск модульных тестов системы нормоконтроля документов  ="
echo "==============================================================="
echo

# Проверка зависимостей
if ! pip freeze | grep -q pytest; then
    echo "Установка pytest..."
    pip install pytest
fi

if ! pip freeze | grep -q docx; then
    echo "Установка python-docx..."
    pip install python-docx
fi

echo
echo "[1/2] Запуск модульных тестов DocumentProcessor..."
python -m pytest backend/tests/unit/test_document_processor.py -v

echo
echo "[2/2] Запуск модульных тестов NormControlChecker..."
python -m pytest backend/tests/unit/test_norm_control_checker.py -v

echo
echo "Формирование отчета о результатах тестирования..."
python backend/tests/generate_report.py --unit-only

echo
echo "Тестирование завершено. Отчет сохранен в директории tests/test_data/results/" 