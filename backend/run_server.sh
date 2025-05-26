#!/bin/bash

echo "================================================================"
echo "=  Запуск сервера системы нормоконтроля документов (CURSA)     ="
echo "================================================================"
echo ""

echo "[1/2] Проверка зависимостей..."
pip_check=$(pip freeze | grep -q "flask")
if [ $? -ne 0 ]; then
    echo "Установка Flask..."
    pip install -r requirements.txt
fi

echo ""
echo "[2/2] Запуск сервера..."
echo ""
echo "Сервер запущен на http://localhost:5000/"
echo "Для остановки сервера нажмите Ctrl+C"
echo ""

python run.py

echo ""
echo "Сервер остановлен."
echo "" 