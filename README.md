# CURSA - Система нормоконтроля документов

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 18+](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/flask-3.0+-black.svg)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-59%20passed-brightgreen.svg)](#-тестирование)

> 🎓 Автоматизированная система проверки и исправления оформления документов DOCX по ГОСТ 7.32-2017

## 🚀 Быстрый запуск

### Windows (1 клик)
```cmd
start_simple.bat
```

### Linux/macOS
```bash
chmod +x start_app.sh && ./start_app.sh
```

**Что происходит:**
1. ✅ Установка зависимостей (Python + Node.js)
2. ✅ Запуск Backend на http://localhost:5000
3. ✅ Запуск Frontend на http://localhost:3000
4. ✅ Открытие браузера автоматически

---

## ✨ Возможности

| Функция | Описание |
|---------|----------|
| 📄 **Проверка DOCX** | Анализ 30+ правил нормоконтроля |
| 🔧 **Автоисправление** | Многопроходная коррекция + XML-редактор |
| 📊 **Отчёты** | Подробный DOCX-отчёт с рекомендациями |
| ⚙️ **Профили** | Настраиваемые правила (ГОСТ, БГПУ и др.) |
| 📖 **API Docs** | Swagger UI на `/api/docs/` |
| 🛡️ **Безопасность** | Rate limiting, CORS, security headers |
| ⚡ **Производительность** | LRU-кэш, lazy loading, код-сплиттинг |

### Проверяемые правила

- ✅ Шрифт Times New Roman 14pt (12pt для кода)
- ✅ Поля: левое 3 см, правое 1-1.5 см, верх/низ 2 см
- ✅ Межстрочный интервал 1.5
- ✅ Абзацный отступ 1.25 см
- ✅ Заголовки, списки, таблицы, рисунки
- ✅ Нумерация страниц
- ✅ Библиография по ГОСТ 7.0.100-2018
- ✅ Листинги кода (моноширинный шрифт)

---

## 📡 API

### Основные эндпоинты

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `POST` | `/api/document/upload` | Загрузка и анализ DOCX |
| `POST` | `/api/document/upload-batch` | Пакетная загрузка и обработка |
| `POST` | `/api/document/correct` | Автоматическое исправление |
| `POST` | `/api/document/generate-report` | Генерация отчёта |
| `GET` | `/api/profiles` | Список профилей |
| `GET` | `/api/health` | Health check |

### Swagger UI

После запуска сервера: **http://localhost:5000/api/docs/**

### Пример использования

```python
import requests

# Загрузка и проверка документа
with open('document.docx', 'rb') as f:
    response = requests.post(
        'http://localhost:5000/api/document/upload',
        files={'file': f}
    )

result = response.json()
print(f"Найдено ошибок: {result['check_results']['total_issues_count']}")
```

---

## 🧪 Тестирование

```bash
cd backend

# Все тесты
python -m pytest tests/ -v

# Unit-тесты
python -m pytest tests/unit/ -v

# С покрытием кода
python -m pytest tests/ --cov=app --cov-report=html

# E2E тест
python run_full_test.py
```

### Frontend тесты

```bash
cd frontend
npm test
```

**Текущее покрытие:**
- 🟢 Backend: 44 теста (unit + integration + functional)
- 🟢 Frontend: 15 тестов (ErrorBoundary, StarLogo)

---

## 🏗️ Архитектура

```
CURSA/
├── backend/                 # Flask API (Python 3.11+)
│   ├── app/
│   │   ├── api/            # REST endpoints
│   │   │   ├── document_routes.py
│   │   │   ├── profile_routes.py
│   │   │   └── swagger_config.py
│   │   ├── services/       # Бизнес-логика
│   │   │   ├── document_corrector.py    # Многопроходный корректор
│   │   │   ├── xml_document_editor.py   # XML-редактор OOXML
│   │   │   ├── norm_control_checker.py  # Проверка правил
│   │   │   └── correction_service.py    # Обёртка сервисов
│   │   └── utils/          # Утилиты (logger, validators)
│   ├── profiles/           # JSON-профили нормоконтроля
│   └── tests/              # Pytest тесты
│
├── frontend/               # React 18 + Material-UI
│   ├── src/
│   │   ├── pages/         # Страницы (lazy-loaded)
│   │   ├── components/    # Переиспользуемые компоненты
│   │   └── utils/         # logger.js, api.js
│   └── package.json
│
├── docs/                   # Документация
└── .github/               # CI/CD workflows
```

---

## ⚙️ Конфигурация

### Профили нормоконтроля

Профили хранятся в `backend/profiles/` в формате JSON:

```json
{
  "id": "gost",
  "name": "ГОСТ 7.32-2017",
  "rules": {
    "font": {"name": "Times New Roman", "size": 14},
    "margins": {"left": 3.0, "right": 1.0, "top": 2.0, "bottom": 2.0},
    "line_spacing": 1.5,
    "first_line_indent": 1.25
  }
}
```

### Переменные окружения

```env
FRONTEND_ORIGINS=http://localhost:3000,https://your-domain.com
FLASK_DEBUG=1
RATE_LIMIT=100/minute
```

---

## 🛡️ Безопасность

- **Rate Limiting**: Защита от DDoS (100 req/min)
- **CORS**: Настраиваемые origins
- **Security Headers**: XSS, clickjacking protection
- **Input Validation**: PropTypes, type hints

---

## 🛠️ Разработка

### Установка

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Запуск в режиме разработки

```bash
# Backend (терминал 1)
cd backend && python run.py

# Frontend (терминал 2)
cd frontend && npm start
```

---

## 📋 Требования

| Компонент | Версия |
|-----------|--------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |
| ОС | Windows 10+, macOS 10.15+, Linux |

---

## 📈 Последние улучшения

### v1.1.0 (Декабрь 2024)

- ⚡ **Производительность**
  - Lazy loading страниц (бандл -220 KB)
  - LRU-кэш для профилей
  - React.memo для статических компонентов

- 🛡️ **Безопасность**
  - Rate limiting (Flask-Limiter)
  - Security headers (X-Content-Type-Options, X-Frame-Options)
  - Улучшенная CORS-конфигурация

- 🧪 **Качество кода**
  - ErrorBoundary для обработки ошибок
  - PropTypes для всех компонентов
  - Type hints в Python-утилитах
  - 15+ новых frontend тестов

- 📝 **Документация**
  - Улучшенный logger.js
  - Обновлённая структура проекта

---

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE)

---

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменений (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

<p align="center">
  <b>Вопросы?</b> Создайте <a href="https://github.com/yourusername/cursa/issues">Issue</a>
</p>
