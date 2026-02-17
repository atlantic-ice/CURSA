# 🎯 Быстрый старт: Доведение до идеала

> Краткое руководство для начала работы над улучшением качества CURSA

---

## 📋 Что уже готово

✅ **Инфраструктура качества**
- [PERFECTION_PLAN.md](PERFECTION_PLAN.md) - Полный план улучшений (март 2026)
- [WEEK1_TASKS.md](WEEK1_TASKS.md) - Детальные задачи на первую неделю
- [CODE_REVIEW_CHECKLIST.md](.github/CODE_REVIEW_CHECKLIST.md) - Чеклист для review
- [CONTRIBUTING.md](CONTRIBUTING.md) - Руководство для контрибуторов
- [BASELINE_METRICS.md](BASELINE_METRICS.md) - Текущие метрики проекта

✅ **Конфигурация инструментов**
- `.editorconfig` - Унификация настроек IDE
- `backend/pyproject.toml` - Black, isort, pylint, mypy, pytest
- `.pre-commit-config.yaml` - Автоматические проверки при commit

✅ **Скрипты автоматизации**
- `scripts/quick_start_perfection.bat` (Windows)
- `scripts/quick_start_perfection.sh` (Linux/Mac)

---

## 🚀 Шаг 1: Запустить Quick Start (≈10 минут)

### Windows
```cmd
cd C:\Users\Никита\Documents\GitHub\CURSA
.\scripts\quick_start_perfection.bat
```

### Linux/Mac
```bash
cd /path/to/CURSA
chmod +x scripts/quick_start_perfection.sh
./scripts/quick_start_perfection.sh
```

**Что делает скрипт:**
1. ✅ Устанавливает black, isort, pylint, mypy, pytest
2. ✅ Форматирует весь код
3. ✅ Запускает линтеры
4. ✅ Запускает тесты с coverage
5. ✅ Настраивает pre-commit hooks

---

## 📊 Шаг 2: Посмотреть текущее состояние (≈5 минут)

### Coverage Report
```bash
open backend/htmlcov/index.html  # Mac/Linux
start backend\htmlcov\index.html  # Windows
```

**Что смотреть:**
- Общий coverage (ожидается ~50%)
- Файлы с низким покрытием
- Непротестированные модули

### Baseline Метрики
```bash
# См. BASELINE_METRICS.md
# TODO: Заполнить пропущенные метрики
```

---

## 🎯 Шаг 3: Выбрать задачу из WEEK1_TASKS.md (≈5 минут)

### День 1 (Сегодня)
- [ ] Настройка инструментов (уже сделано скриптом ✅)
- [ ] Форматирование кода (уже сделано скриптом ✅)
- [ ] Проверка запуска всех тестов

### День 2 (Завтра)
- [ ] Анализ текущего состояния
- [ ] Создание baseline документа
- [ ] Определение top-5 проблемных файлов

### День 3-7
- [ ] Рефакторинг DocumentCorrector (3076 → <500 строк)
- [ ] Рефакторинг NormControlChecker (2944 → <500 строк)

---

## 🔧 Шаг 4: Начать разработку (≈30 минут setup)

### 1. Создать ветку
```bash
git checkout -b feature/week1-refactoring
```

### 2. Запустить окружение
```bash
# Запустить Docker Compose
docker-compose up -d postgres redis

# Активировать venv (если еще не активирован)
cd backend
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Инициализировать БД
flask db upgrade
```

### 3. Запустить dev сервер
```bash
# Backend
cd backend
python run.py

# Frontend (в другом терминале)
cd frontend
npm install
npm start
```

### 4. Проверить что все работает
```bash
# Запустить тесты
cd backend
pytest

# Открыть http://localhost:3000
```

---

## 📝 Шаг 5: Следовать workflow (каждый день)

### Перед началом работы
```bash
git pull origin main
pytest  # Убедиться что тесты проходят
```

### Во время работы
```bash
# Писать код
# Добавлять тесты
# Запускать тесты: pytest tests/unit/...
```

### Перед commit
```bash
# Pre-commit hooks запустятся автоматически:
# - black (форматирование)
# - isort (сортировка imports)
# - flake8 (линтинг)
# - mypy (type checking)
# - pylint (глубокий анализ)

git add .
git commit -m "refactor: extract StyleCorrector from DocumentCorrector"
```

### Перед push
```bash
# Финальная проверка
pytest --cov=app
pylint app/
mypy app/

git push origin feature/week1-refactoring
```

### Создать PR
1. Перейти на GitHub
2. Создать Pull Request
3. Заполнить template
4. Использовать [CODE_REVIEW_CHECKLIST.md](.github/CODE_REVIEW_CHECKLIST.md)

---

## 📚 Полезные команды

### Code Quality
```bash
# Форматирование
black app/ tests/ --line-length 100
isort app/ tests/ --profile black

# Линтинг
pylint app/ --max-line-length=100
mypy app/ --ignore-missing-imports
flake8 app/ --max-line-length=100

# Все сразу
black . && isort . && pylint app/ && mypy app/
```

### Testing
```bash
# Все тесты
pytest

# С coverage
pytest --cov=app --cov-report=html

# Только unit
pytest tests/unit/

# Конкретный файл
pytest tests/unit/services/test_document_corrector.py

# Verbose
pytest -vv

# С логами
pytest -s
```

### Git
```bash
# Статус
git status

# Diff
git diff

# Добавить файлы
git add app/services/correctors/

# Commit
git commit -m "feat: add StyleCorrector module"

# Push
git push origin feature/week1-refactoring

# Создать новую ветку
git checkout -b fix/some-bug
```

---

## 🎯 Фокус на ближайшие дни

### Приоритет 0 (Критично)
1. ✅ Настроить инфраструктуру (DONE)
2. ⏳ Рефакторинг DocumentCorrector (3076 строк → <500)
3. ⏳ Рефакторинг NormControlChecker (2944 строки → <500)
4. ⏳ Исправить type hints ошибки

### Приоритет 1 (Важно)
- Поднять test coverage до 60%+
- Улучшить docstrings
- Добавить недостающие типы

### Приоритет 2 (Можно позже)
- Dark mode
- Анимации
- Документация

---

## ❓ Частые вопросы

**Q: Что делать если тесты падают?**
```bash
# Посмотреть детальный вывод
pytest -vv

# Посмотреть логи
pytest -s

# Запустить конкретный тест
pytest tests/unit/services/test_document_corrector.py::test_correct_font -vv
```

**Q: Что делать если линтеры выдают ошибки?**
```bash
# Автоматически исправить большинство проблем
black .
isort .

# Посмотреть детальный отчет
pylint app/ --output-format=text > pylint_report.txt
```

**Q: Как добавить новый тест?**
```python
# tests/unit/services/correctors/test_style_corrector.py
import pytest
from app.services.correctors import StyleCorrector

def test_correct_font():
    """Тестирует исправление шрифта."""
    corrector = StyleCorrector()
    # ... тестовая логика
```

**Q: Как посмотреть coverage для конкретного файла?**
```bash
pytest --cov=app/services/correctors/style_corrector.py --cov-report=term-missing
```

---

## 📖 Дополнительные ресурсы

- [PERFECTION_PLAN.md](PERFECTION_PLAN.md) - Полный план на март 2026
- [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) - Роадмап до 2026
- [SPRINT_TASKS.md](SPRINT_TASKS.md) - Спринты и задачи
- [README.md](README.md) - Главный README проекта

---

## 🎉 Checklist быстрого старта

- [ ] Запущен quick_start_perfection скрипт
- [ ] Все тесты проходят
- [ ] Coverage report просмотрен
- [ ] WEEK1_TASKS.md изучен
- [ ] Создана ветка для работы
- [ ] Docker Compose запущен
- [ ] Dev сервер работает
- [ ] Pre-commit hooks установлены
- [ ] Выбрана первая задача

**Если все чекбоксы отмечены - можно начинать! 🚀**

---

## 💡 Принципы работы

1. **Качество важнее скорости**
   - Не спешить
   - Писать тесты
   - Делать код review

2. **Маленькие шаги**
   - Один модуль за раз
   - Частые commits
   - Инкрементальные улучшения

3. **Тестирование**
   - Сначала тест, потом рефакторинг
   - Coverage >= 80%
   - Все тесты должны проходить

4. **Документация**
   - Docstrings для всех функций
   - Type hints везде
   - Комментарии для сложной логики

---

**Удачи! Вопросы? Смотри CONTRIBUTING.md или создай issue.**
