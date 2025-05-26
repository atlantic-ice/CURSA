#!/bin/bash

echo "======================================="
echo "= Запуск тестов системы нормоконтроля ="
echo "======================================="
echo

# Проверка зависимостей
if ! pip freeze | grep -q pytest; then
    echo "Установка pytest..."
    pip install pytest
fi

if ! pip freeze | grep -q python-docx; then
    echo "Установка python-docx..."
    pip install python-docx
fi

echo
echo "Выберите режим запуска:"
echo "1. Запустить все тесты"
echo "2. Создать пример результатов и отчет"
echo "3. Сформировать отчет из существующих результатов"
echo

read -p "Ваш выбор (1-3): " choice

if [ "$choice" = "1" ]; then
    echo
    echo "Запуск всех тестов..."
    python tests/run_tests.py -v
elif [ "$choice" = "2" ]; then
    echo
    echo "Создание примера результатов тестирования..."
    python tests/run_tests.py -s
elif [ "$choice" = "3" ]; then
    echo
    echo "Формирование отчета из существующих результатов..."
    python tests/run_tests.py -r
else
    echo
    echo "Неверный выбор. Пожалуйста, выберите 1, 2 или 3."
    exit 1
fi

echo
echo "Проверьте результаты в директории tests/test_data/results/"
echo 