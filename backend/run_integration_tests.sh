#!/bin/bash

echo "==============================================================="
echo "=  Запуск интеграционных тестов системы нормоконтроля документов  ="
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

if ! pip freeze | grep -q requests; then
    echo "Установка requests..."
    pip install requests
fi

if ! pip freeze | grep -q matplotlib; then
    echo "Установка matplotlib..."
    pip install matplotlib
fi

echo
echo "[1/2] Запуск интеграционных тестов полного цикла работы с документами..."
python -m pytest backend/tests/integration/test_document_flow.py -v -m integration

echo
echo "[2/2] Формирование HTML-отчета о результатах тестирования..."
python backend/tests/generate_html_report.py

echo
echo "Тестирование завершено. Отчеты доступны в директории tests/test_data/results/"
xdg-open backend/tests/test_data/results/html_reports/ 2>/dev/null || open backend/tests/test_data/results/html_reports/ 2>/dev/null || echo "Отчеты находятся в директории: backend/tests/test_data/results/html_reports/" 