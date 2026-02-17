# 🚀 Неделя 1: Быстрый старт улучшений

> **Даты:** 03.02.2026 - 09.02.2026  
> **Цель:** Исправить критические проблемы качества кода и настроить инфраструктуру

---

## 📅 День 1 (03.02) - Настройка инструментов

### ✅ Задачи

- [ ] **Установить и настроить линтеры**
  ```bash
  cd backend
  pip install black isort pylint mypy pytest pytest-cov
  ```

- [ ] **Создать pyproject.toml** (уже создан ✅)
  - Конфигурация black
  - Конфигурация isort
  - Конфигурация pylint
  - Конфигурация pytest

- [ ] **Настроить .editorconfig** (уже создан ✅)
  - Унификация настроек IDE
  - Правила отступов
  - Кодировки

- [ ] **Установить pre-commit hooks**
  ```bash
  pip install pre-commit
  pre-commit install
  pre-commit run --all-files  # Первый запуск
  ```

- [ ] **Запустить форматирование всего кода**
  ```bash
  black app/ tests/ --line-length 100
  isort app/ tests/ --profile black
  ```

### 📊 Ожидаемый результат
- ✅ Весь код отформатирован единообразно
- ✅ Pre-commit hooks автоматически проверяют код
- ✅ Базовые инструменты настроены

### ⏱️ Estimate: 2-3 часа

---

## 📅 День 2 (04.02) - Анализ текущего состояния

### ✅ Задачи

- [ ] **Запустить текущие тесты**
  ```bash
  pytest --cov=app --cov-report=html --cov-report=term-missing
  ```
  - Проверить coverage (ожидается ~50%)
  - Найти модули без тестов
  - Открыть htmlcov/index.html

- [ ] **Проверить код линтерами**
  ```bash
  pylint app/ --max-line-length=100 > pylint_report.txt
  mypy app/ --ignore-missing-imports > mypy_report.txt
  ```

- [ ] **Создать baseline документ**
  - Записать текущие метрики:
    - Test coverage: ____%
    - Pylint score: ___/10
    - MyPy errors: ___
    - Lines per file: document_corrector.py (3076), norm_control_checker.py (2944)

- [ ] **Определить top-5 проблемных файлов**
  ```bash
  # Найти самые большие файлы
  find app/ -name "*.py" -exec wc -l {} \; | sort -rn | head -10
  
  # Найти файлы с самым низким coverage
  # (смотреть в htmlcov/index.html)
  ```

### 📊 Ожидаемый результат
- ✅ Baseline метрики зафиксированы
- ✅ Проблемные файлы идентифицированы
- ✅ План приоритизации готов

### ⏱️ Estimate: 3-4 часа

---

## 📅 День 3 (05.02) - Начало рефакторинга DocumentCorrector

### ✅ Задачи

- [ ] **Создать структуру модулей**
  ```bash
  mkdir -p app/services/correctors
  touch app/services/correctors/__init__.py
  touch app/services/correctors/base.py
  touch app/services/correctors/style_corrector.py
  touch app/services/correctors/structure_corrector.py
  touch app/services/correctors/content_corrector.py
  touch app/services/correctors/formatting_corrector.py
  ```

- [ ] **Создать базовый класс BaseCorrector**
  ```python
  # app/services/correctors/base.py
  from abc import ABC, abstractmethod
  from typing import List
  from docx import Document
  
  class BaseCorrector(ABC):
      """Базовый класс для корректоров."""
      
      @abstractmethod
      def analyze(self, document: Document) -> List[NormError]:
          """Анализирует документ и возвращает ошибки."""
          pass
      
      @abstractmethod
      def correct(self, document: Document) -> int:
          """Исправляет ошибки в документе."""
          pass
  ```

- [ ] **Выделить StyleCorrector**
  - Перенести логику исправления шрифтов
  - Перенести логику исправления размеров
  - Перенести логику исправления интервалов
  - Добавить type hints
  - Добавить docstrings

### 📊 Ожидаемый результат
- ✅ Создана модульная структура
- ✅ BaseCorrector работает
- ✅ StyleCorrector выделен в отдельный модуль
- ✅ Тесты для StyleCorrector

### ⏱️ Estimate: 5-6 часов

---

## 📅 День 4 (06.02) - Продолжение рефакторинга

### ✅ Задачи

- [ ] **Выделить StructureCorrector**
  - Логика заголовков
  - Логика разделов
  - Логика нумерации
  - Type hints + docstrings

- [ ] **Выделить ContentCorrector**
  - Логика таблиц
  - Логика рисунков
  - Логика подписей
  - Type hints + docstrings

- [ ] **Написать тесты**
  ```python
  # tests/unit/services/correctors/test_structure_corrector.py
  def test_heading_correction():
      corrector = StructureCorrector()
      doc = create_test_doc_with_wrong_headings()
      
      errors = corrector.analyze(doc)
      assert len(errors) > 0
      
      corrector.correct(doc)
      errors_after = corrector.analyze(doc)
      assert len(errors_after) == 0
  ```

### 📊 Ожидаемый результат
- ✅ StructureCorrector готов
- ✅ ContentCorrector готов
- ✅ Тесты покрывают базовую функциональность

### ⏱️ Estimate: 5-6 часов

---

## 📅 День 5 (07.02) - Завершение рефакторинга DocumentCorrector

### ✅ Задачи

- [ ] **Выделить FormattingCorrector**
  - Логика полей страницы
  - Логика отступов
  - Логика выравнивания
  - Type hints + docstrings

- [ ] **Переписать DocumentCorrector как координатор**
  ```python
  # app/services/document_corrector.py
  from .correctors import (
      StyleCorrector,
      StructureCorrector,
      ContentCorrector,
      FormattingCorrector
  )
  
  class DocumentCorrector:
      """Координатор корректоров."""
      
      def __init__(self):
          self.correctors = [
              StyleCorrector(),
              StructureCorrector(),
              ContentCorrector(),
              FormattingCorrector(),
          ]
      
      def correct_document(self, document: Document) -> CorrectionReport:
          """Исправляет документ всеми корректорами."""
          report = CorrectionReport()
          
          for corrector in self.correctors:
              errors = corrector.analyze(document)
              report.add_errors(errors)
              corrector.correct(document)
          
          return report
  ```

- [ ] **Проверить совместимость**
  - Запустить все существующие тесты
  - Убедиться что API не сломался
  - Проверить integration tests

### 📊 Ожидаемый результат
- ✅ DocumentCorrector теперь <200 строк
- ✅ Все корректоры в отдельных модулях (<500 строк каждый)
- ✅ Все старые тесты проходят

### ⏱️ Estimate: 4-5 часов

---

## 📅 День 6 (08.02) - Начало рефакторинга NormControlChecker

### ✅ Задачи

- [ ] **Создать структуру модулей**
  ```bash
  mkdir -p app/services/checkers
  touch app/services/checkers/__init__.py
  touch app/services/checkers/base.py
  touch app/services/checkers/font_checker.py
  touch app/services/checkers/layout_checker.py
  touch app/services/checkers/heading_checker.py
  touch app/services/checkers/content_checker.py
  touch app/services/checkers/bibliography_checker.py
  ```

- [ ] **Создать базовый класс BaseChecker**
  ```python
  # app/services/checkers/base.py
  from abc import ABC, abstractmethod
  from typing import List, Dict, Any
  from docx import Document
  
  class BaseChecker(ABC):
      """Базовый класс для чекеров."""
      
      def __init__(self, rules: List[Dict[str, Any]]):
          self.rules = rules
      
      @abstractmethod
      def check(self, document: Document) -> List[NormError]:
          """Проверяет документ по правилам."""
          pass
  ```

- [ ] **Выделить FontChecker (правила 2-3)**
  - Проверка шрифта
  - Проверка размера шрифта
  - Type hints + docstrings

- [ ] **Выделить LayoutChecker (правила 4-12)**
  - Проверка полей
  - Проверка отступов
  - Проверка интервалов
  - Type hints + docstrings

### 📊 Ожидаемый результат
- ✅ Структура checkers создана
- ✅ FontChecker работает
- ✅ LayoutChecker работает

### ⏱️ Estimate: 5-6 часов

---

## 📅 День 7 (09.02) - Завершение недели

### ✅ Задачи

- [ ] **Выделить HeadingChecker (правила 13-16)**
- [ ] **Выделить ContentChecker (правила 17-27)**
- [ ] **Выделить BibliographyChecker (правила 29-30)**

- [ ] **Переписать NormControlChecker как координатор**
  ```python
  class NormControlChecker:
      """Координатор чекеров."""
      
      def __init__(self, profile: Profile):
          self.checkers = [
              FontChecker(profile.font_rules),
              LayoutChecker(profile.layout_rules),
              HeadingChecker(profile.heading_rules),
              ContentChecker(profile.content_rules),
              BibliographyChecker(profile.bibliography_rules),
          ]
      
      def check_document(self, document: Document) -> List[NormError]:
          """Проверяет документ всеми чекерами."""
          errors = []
          for checker in self.checkers:
              errors.extend(checker.check(document))
          return errors
  ```

- [ ] **Запустить все тесты**
  ```bash
  pytest --cov=app --cov-report=html
  ```

- [ ] **Сравнить метрики**
  - Coverage: было ___%, стало ____%
  - Pylint: было ___/10, стало ___/10
  - Lines per file: было 3000+, стало <500

- [ ] **Commit & Push**
  ```bash
  git add .
  git commit -m "refactor: split DocumentCorrector and NormControlChecker into modules"
  git push origin feature/week1-refactoring
  ```

### 📊 Ожидаемый результат
- ✅ NormControlChecker < 200 строк
- ✅ Все чекеры в отдельных модулях
- ✅ Coverage увеличился
- ✅ Код чище и понятнее

### ⏱️ Estimate: 6-7 часов

---

## 📊 Итоги недели

### Метрики до/после

| Метрика | До | После (цель) |
|---------|-----|--------------|
| **DocumentCorrector** | 3076 строк | <200 строк |
| **NormControlChecker** | 2944 строки | <200 строк |
| **Число модулей** | 2 | 12 |
| **Coverage** | ~50% | ~60%+ |
| **Pylint score** | 7/10 | 8/10 |

### Достижения
- ✅ Рефакторинг двух самых больших файлов
- ✅ Модульная архитектура
- ✅ Улучшенная тестируемость
- ✅ Настроена инфраструктура качества (black, isort, pylint, mypy)
- ✅ Pre-commit hooks работают

### Проблемы и риски
- ⚠️ Возможны breaking changes - нужна тщательная проверка тестов
- ⚠️ Миграция большого объема кода - риск багов
- ⚠️ Нужно обновить документацию

---

## 🔜 План на Неделю 2

**Фокус:** Производительность и оптимизация

1. Профилирование DocumentCorrector
2. Оптимизация SQL запросов
3. Кэширование (Redis)
4. Frontend оптимизация (React.memo, виртуализация)

---

## 📚 Полезные ссылки

- [PERFECTION_PLAN.md](../PERFECTION_PLAN.md) - Общий план
- [CODE_REVIEW_CHECKLIST.md](../.github/CODE_REVIEW_CHECKLIST.md) - Чеклист для review
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Руководство по контрибуции

---

**Удачи на первой неделе! 🚀**
