# 📊 Базовые метрики проекта CURSA

> **Дата:** 02.02.2026  
> **Версия:** 1.4.0 (в разработке)  
> **Цель:** Зафиксировать текущее состояние перед началом улучшений

---

## 🎯 Общие метрики

| Метрика | Значение | Комментарий |
|---------|----------|-------------|
| **Общее количество строк кода** | ~15,000+ | Backend + Frontend |
| **Backend LOC** | ~10,000+ | Python |
| **Frontend LOC** | ~5,000+ | JavaScript/React |
| **Количество файлов** | 150+ | Все типы |
| **Количество тестов** | 26 | Unit + Integration |
| **Test Success Rate** | 88.5% | 23/26 проходят |

---

## 🐍 Backend Metrics

### Code Quality

| Метрика | Текущее значение | Цель | Статус |
|---------|------------------|------|--------|
| **Pylint Score** | ? | 9/10 | ⏳ Нужно измерить |
| **MyPy Errors** | ? | 0 | ⏳ Нужно измерить |
| **Test Coverage** | ~50% | 80%+ | ❌ Недостаточно |
| **Max Lines per File** | 3,076 | 500 | ❌ DocumentCorrector |

### Проблемные файлы

| Файл | LOC | Проблема | Приоритет |
|------|-----|----------|-----------|
| `document_corrector.py` | 3,076 | Монолитный | P0 |
| `norm_control_checker.py` | 2,944 | Монолитный | P0 |
| `database.py` | ? | Type hints ошибки | P1 |

### Test Coverage по модулям

| Модуль | Coverage | Цель | Статус |
|--------|----------|------|--------|
| `services/document_corrector.py` | ? | 80% | ⏳ |
| `services/norm_control_checker.py` | ? | 80% | ⏳ |
| `models/` | ? | 90% | ⏳ |
| `api/` | ? | 85% | ⏳ |

### Performance Metrics

| Операция | Текущее время | Цель | Статус |
|----------|---------------|------|--------|
| **Обработка 10 стр** | ~1 сек | <0.5 сек | ⚠️ |
| **Обработка 50 стр** | ~5 сек | <2 сек | ❌ |
| **Обработка 100 стр** | ~10 сек | <4 сек | ❌ |
| **Upload документа** | <1 сек | <0.5 сек | ✅ |

---

## ⚛️ Frontend Metrics

### Code Quality

| Метрика | Текущее значение | Цель | Статус |
|---------|------------------|------|--------|
| **ESLint Errors** | ? | 0 | ⏳ Нужно измерить |
| **ESLint Warnings** | ? | <10 | ⏳ Нужно измерить |
| **Lighthouse Performance** | 75 | 90+ | ❌ |
| **Lighthouse Accessibility** | ? | 90+ | ⏳ |

### Bundle Size

| Метрика | Размер | Цель | Статус |
|---------|--------|------|--------|
| **Main bundle (gzip)** | ? | <200 KB | ⏳ |
| **Vendor bundle (gzip)** | ? | <300 KB | ⏳ |
| **Total bundle** | ? | <500 KB | ⏳ |

### Performance

| Метрика | Значение | Цель | Статус |
|---------|----------|------|--------|
| **First Contentful Paint** | ? | <1.5s | ⏳ |
| **Time to Interactive** | ? | <3.5s | ⏳ |
| **Largest Contentful Paint** | ? | <2.5s | ⏳ |

---

## 🧪 Testing Metrics

### Backend Tests

| Категория | Количество | Success | Failed/Skipped |
|-----------|------------|---------|----------------|
| **Unit Tests** | ? | ? | ? |
| **Integration Tests** | ? | ? | ? |
| **E2E Tests** | ? | ? | ? |
| **Total** | 26 | 23 | 3 |

### Конкретные тесты

| Тест | Статус | Комментарий |
|------|--------|-------------|
| Проверка шрифта | ✅ 4/4 | Все проходят |
| Проверка размера шрифта | ✅ 4/4 | Все проходят |
| Проверка полей страницы | ✅ 4/4 | Все проходят |
| Проверка межстрочного интервала | ✅ 4/4 | Все проходят |
| Автоматическое исправление | ✅ 4/4 | Все проходят |
| Загрузка документа | ✅ 3/3 | Все проходят |
| **Проверка исправленного документа** | ❌ 0/3 | **35 ошибок остается** |
| Скачивание исправленного документа | ⏭️ Skip | Зависит от предыдущего |

---

## 🐳 Infrastructure Metrics

### Docker

| Метрика | Значение | Цель | Статус |
|---------|----------|------|--------|
| **Backend Image Size** | ? | <500 MB | ⏳ |
| **Frontend Image Size** | ? | <200 MB | ⏳ |
| **Build Time** | ? | <5 min | ⏳ |

### Database

| Метрика | Значение | Комментарий |
|---------|----------|-------------|
| **Tables** | 5 | User, Subscription, Document, Payment, APIKey |
| **Indexes** | ? | Нужно проверить |
| **Migrations** | ? | Flask-Migrate |

---

## 🔒 Security Metrics

| Проверка | Статус | Комментарий |
|----------|--------|-------------|
| **JWT Blacklist** | ❌ | Нужно реализовать |
| **Email Verification** | ❌ | Нужно реализовать |
| **Password Strength Validation** | ⚠️ | Базовая есть |
| **CSRF Protection** | ❌ | Нужно добавить |
| **SQL Injection Protection** | ✅ | SQLAlchemy ORM |
| **XSS Protection** | ⚠️ | Частично |

---

## 📈 TODO: Измерить

### Backend
- [ ] Запустить `pylint app/ > pylint_baseline.txt`
- [ ] Запустить `mypy app/ > mypy_baseline.txt`
- [ ] Замерить test coverage: `pytest --cov=app --cov-report=term-missing`
- [ ] Профилирование: `python -m cProfile run.py`
- [ ] Подсчитать LOC: `find app/ -name "*.py" | xargs wc -l`

### Frontend
- [ ] Запустить ESLint: `npm run lint > eslint_baseline.txt`
- [ ] Lighthouse audit: `npm run lighthouse`
- [ ] Bundle analyzer: `npm run build --analyze`
- [ ] Подсчитать LOC: `find src/ -name "*.js" -o -name "*.jsx" | xargs wc -l`

### Database
- [ ] Проверить индексы: `\d+ table_name` в psql
- [ ] Проверить размер таблиц
- [ ] Проверить N+1 queries

### Infrastructure
- [ ] Docker image sizes: `docker images`
- [ ] Build times: `time docker-compose build`

---

## 📊 Weekly Progress Tracking

| Неделя | Дата | Цель | Результат |
|--------|------|------|-----------|
| **0** | 02.02 | Baseline метрики | Этот документ |
| **1** | 03-09.02 | Рефакторинг DocumentCorrector/NormChecker | ⏳ |
| **2** | 10-16.02 | Производительность | ⏳ |
| **3** | 17-23.02 | UX улучшения | ⏳ |
| **4** | 24-01.03 | Dark mode, a11y | ⏳ |

---

## 🎯 Key Performance Indicators (KPI)

### Цели на Q1 2026

| KPI | Baseline | Q1 Target | Progress |
|-----|----------|-----------|----------|
| **Test Coverage** | 50% | 80% | ⏳ 0% |
| **Pylint Score** | ? | 9/10 | ⏳ 0% |
| **Processing Speed (50 pages)** | 5s | 2s | ⏳ 0% |
| **Lighthouse Score** | 75 | 90+ | ⏳ 0% |
| **User Satisfaction (NPS)** | ? | 70+ | ⏳ 0% |

---

## 🔄 Update Log

| Дата | Изменение | Автор |
|------|-----------|-------|
| 02.02.2026 | Создан baseline документ | AI Assistant |
| _TBD_ | Первое измерение метрик | - |
| _TBD_ | Обновление после Недели 1 | - |

---

**Следующий шаг:** Заполнить пропущенные метрики (см. секцию "TODO: Измерить")
