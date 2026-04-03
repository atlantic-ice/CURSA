#!/bin/bash
# Quick Start Script для начала работы над улучшением качества кода

echo "🎯 CURSA - Quick Start для доведения функционала до идеала"
echo "=========================================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Установка инструментов для линтинга и форматирования
echo -e "${YELLOW}📦 Шаг 1: Установка инструментов качества кода...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Создание виртуального окружения..."
    python -m venv venv
fi

source venv/bin/activate  # Linux/Mac

echo "Установка black, isort, pylint, mypy..."
pip install black isort pylint mypy pytest pytest-cov pre-commit -q

echo -e "${GREEN}✅ Инструменты установлены${NC}"
echo ""

# 2. Форматирование кода
echo -e "${YELLOW}🎨 Шаг 2: Форматирование кода...${NC}"
echo "Запуск black..."
black app/ tests/ --line-length 100

echo "Сортировка imports..."
isort app/ tests/ --profile black

echo -e "${GREEN}✅ Код отформатирован${NC}"
echo ""

# 3. Проверка линтерами
echo -e "${YELLOW}🔍 Шаг 3: Проверка качества кода...${NC}"
echo "Запуск pylint..."
pylint app/ --max-line-length=100 || true

echo "Запуск mypy..."
mypy app/ --ignore-missing-imports || true

echo -e "${GREEN}✅ Проверка завершена${NC}"
echo ""

# 4. Запуск тестов
echo -e "${YELLOW}🧪 Шаг 4: Запуск тестов с coverage...${NC}"
pytest --cov=app --cov-report=term-missing --cov-report=html

echo -e "${GREEN}✅ Тесты завершены. Отчет: htmlcov/index.html${NC}"
echo ""

# 5. Pre-commit hooks
echo -e "${YELLOW}🪝 Шаг 5: Настройка pre-commit hooks...${NC}"
if [ -f "../.pre-commit-config.yaml" ]; then
    pre-commit install
    echo -e "${GREEN}✅ Pre-commit hooks установлены${NC}"
else
    echo -e "${RED}⚠️  .pre-commit-config.yaml не найден${NC}"
fi
echo ""

# 6. Итоги
echo "=========================================================="
echo -e "${GREEN}🎉 Готово! Система настроена для работы над качеством кода${NC}"
echo ""
echo "📋 Следующие шаги:"
echo "1. Просмотрите PERFECTION_PLAN.md для общего плана"
echo "2. Проверьте htmlcov/index.html для анализа покрытия тестами"
echo "3. Начните с рефакторинга DocumentCorrector (см. план)"
echo "4. Используйте CODE_REVIEW_CHECKLIST.md при code review"
echo ""
echo "🔧 Полезные команды:"
echo "  black .                      # Форматирование"
echo "  isort .                      # Сортировка imports"
echo "  pylint app/                  # Линтинг"
echo "  pytest --cov=app             # Тесты с coverage"
echo "  mypy app/                    # Type checking"
echo ""
echo "Удачи! 🚀"
