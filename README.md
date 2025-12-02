# CURSA - Система нормоконтроля документов

[![CI/CD](https://github.com/yourusername/cursa/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/cursa/actions)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Автоматизированная система проверки и исправления оформления документов DOCX по ГОСТ

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
4. ✅ Открытие браузера

---

## ✨ Возможности

| Функция | Описание |
|---------|----------|
| 📄 **Проверка DOCX** | Анализ 30+ правил нормоконтроля |
| 🔧 **Автоисправление** | Многопроходная коррекция + XML-редактор |
| 📊 **Отчёты** | Подробный DOCX-отчёт с рекомендациями |
| ⚙️ **Профили** | Настраиваемые правила (ГОСТ, БГПУ и др.) |
| 📖 **API Docs** | Swagger UI на `/api/docs/` |

### Проверяемые правила
- Шрифт Times New Roman 14pt (12pt для кода)
- Поля: левое 3 см, правое 1-1.5 см, верх/низ 2 см
- Межстрочный интервал 1.5
- Абзацный отступ 1.25 см
- Заголовки, списки, таблицы, рисунки
- Библиография по ГОСТ 7.0.100-2018
- И многое другое...

---

## 📡 API

### Основные эндпоинты

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `POST` | `/api/document/upload` | Загрузка и анализ DOCX |
| `POST` | `/api/document/correct` | Автоматическое исправление |
| `POST` | `/api/document/generate-report` | Генерация отчёта |
| `GET` | `/api/profiles` | Список профилей |
| `GET` | `/api/health` | Проверка состояния |

### Swagger UI
После запуска сервера откройте: **http://localhost:5000/api/docs/**

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

# Только unit-тесты
python -m pytest tests/unit/ -v

# С покрытием кода
python -m pytest tests/ --cov=app --cov-report=html

# E2E тест
python run_full_test.py
```

**Покрытие:** 12 unit-тестов для XMLDocumentEditor, функциональные и интеграционные тесты.

---

## 🏗️ Структура проекта

```
CURSA/
├── backend/                 # Flask API
│   ├── app/
│   │   ├── api/            # REST endpoints
│   │   │   ├── document_routes.py
│   │   │   ├── profile_routes.py
│   │   │   └── swagger_config.py
│   │   └── services/       # Бизнес-логика
│   │       ├── document_corrector.py    # Основной корректор
│   │       ├── xml_document_editor.py   # XML-редактор
│   │       ├── norm_control_checker.py  # Проверка правил
│   │       └── correction_service.py    # Обёртка
│   ├── profiles/           # JSON-профили нормоконтроля
│   ├── tests/              # Тесты
│   └── requirements.txt
├── frontend/               # React UI
│   ├── src/
│   │   ├── pages/         # Страницы (Upload, Report, History)
│   │   └── components/    # Компоненты UI
│   └── package.json
├── .github/workflows/      # CI/CD
└── docs/                   # Документация
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
```

---

## 🛠️ Разработка

### Установка для разработки
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
# Backend (в одном терминале)
cd backend
python run.py

# Frontend (в другом терминале)
cd frontend
npm start
```

---

## 📋 Требования

- **Python** 3.11+
- **Node.js** 18+
- **ОС:** Windows 10+, macOS 10.15+, Linux

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

**Вопросы?** Создайте [Issue](https://github.com/yourusername/cursa/issues)
