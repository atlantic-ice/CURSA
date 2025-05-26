#!/bin/bash

echo "==============================================================="
echo "=  Запуск полного тестирования системы нормоконтроля документов  ="
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
echo "[1/4] Генерация тестовых документов..."
python backend/tests/test_data_generator.py -a

echo
echo "[2/4] Запуск функциональных тестов обработки документов..."
python -m pytest backend/tests/functional/test_document_processing.py -v

echo
echo "[3/4] Запуск тестов API..."
python -m pytest backend/tests/functional/test_document_api.py -v

echo
echo "[4/4] Формирование сводного отчета..."
python backend/tests/run_tests.py -r

echo
echo "Тестирование завершено! Отчет находится в директории backend/tests/test_data/results/"
echo 