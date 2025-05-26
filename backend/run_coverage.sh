#!/bin/bash

echo "==============================================================="
echo "=  Анализ покрытия кода тестами системы нормоконтроля документов  ="
echo "==============================================================="
echo

# Проверка зависимостей
if ! pip freeze | grep -q pytest-cov; then
    echo "Установка pytest-cov..."
    pip install pytest-cov
fi

if ! pip freeze | grep -q pytest; then
    echo "Установка pytest..."
    pip install pytest
fi

echo
echo "[1/3] Запуск тестов с анализом покрытия кода..."
python -m pytest --cov=backend/app/services --cov-report=html backend/tests/

echo
echo "[2/3] Формирование отчета о покрытии..."
echo "Отчет создан в директории htmlcov/"

echo
echo "[3/3] Открытие отчета о покрытии..."
xdg-open htmlcov/index.html 2>/dev/null || open htmlcov/index.html 2>/dev/null || echo "Отчет находится в директории: htmlcov/index.html"

echo
echo "Анализ покрытия завершен. Отчет доступен в директории htmlcov/" 