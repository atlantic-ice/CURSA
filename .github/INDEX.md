# 📚 Документация автономного AI-агента

Навигация по всем файлам настройки и документации.

---

## 🚀 Быстрый старт

**Начните здесь:**
- [QUICKSTART_AGENT.md](../QUICKSTART_AGENT.md) - Краткая инструкция для немедленного старта
- [VSCODE_SETUP.md](../VSCODE_SETUP.md) - Установка и настройка VS Code Insiders

---

## 📖 Документация

### Основная документация
- [AGENT_SETUP.md](AGENT_SETUP.md) - Полное описание настройки автономного агента
- [AGENT_EXAMPLES.md](AGENT_EXAMPLES.md) - Реальные примеры работы агента

---

## ⚙️ Файлы конфигурации

### Основные инструкции
Файлы в `.github/`:

| Файл | Описание |
|------|----------|
| [copilot-instructions.md](copilot-instructions.md) | Главные правила автономной работы агента |

### Специализированные инструкции
Файлы в `.github/instructions/`:

| Файл | Когда применяется |
|------|-------------------|
| [autonomous-agent.instructions.md](instructions/autonomous-agent.instructions.md) | Всегда (applyTo: "**") - детали автономного режима |
| [proactive-refactoring.instructions.md](instructions/proactive-refactoring.instructions.md) | При рефакторинге, code smells |
| [automatic-testing.instructions.md](instructions/automatic-testing.instructions.md) | При разработке функций, исправлении багов |
| [code-quality-standards.instructions.md](instructions/code-quality-standards.instructions.md) | При проверке качества кода |
| [automatic-debugging.instructions.md](instructions/automatic-debugging.instructions.md) | При отладке, исправлении ошибок |
| [project-specifics.instructions.md](instructions/project-specifics.instructions.md) | Специфика проекта (DOCX, профили) |
| [language.instructions.md](instructions/language.instructions.md) | Язык коммуникации: русский |

### VS Code настройки
Файлы в `.vscode/`:

| Файл | Описание |
|------|----------|
| [settings.json](../.vscode/settings.json) | Оптимальные настройки редактора |
| [extensions.json](../.vscode/extensions.json) | Рекомендуемые расширения |

---

## 🎯 Режимы работы

### Автономный режим (текущий)
- ✅ Агент принимает решения самостоятельно
- ✅ Не спрашивает подтверждений
- ✅ Реализует полный цикл (код + тесты + документация)
- ✅ Предлагает следующие шаги

### Стандартный режим
Чтобы вернуть обычный режим с подтверждениями:
1. Переименуйте `copilot-instructions.md` в `copilot-instructions.md.disabled`
2. Перезагрузите VS Code

---

## 📋 Правила работы агента

### ❌ Агент НЕ спрашивает:
- "Добавить ли тест?"
- "Какой подход выбрать?"
- "Исправить ли баг?"
- "Продолжить работу?"

### ✅ Агент делает автоматически:
- Пишет тесты для нового кода
- Исправляет найденные баги
- Рефакторит проблемный код
- Добавляет обработку ошибок
- Типизирует код (types/type hints)
- Документирует (docstrings)
- Предлагает улучшения

### ⚠️ Агент обращается к вам только:
- Критические изменения архитектуры всего проекта
- Необходимы внешние данные (API ключи, credentials)
- Безвыходная ситуация

---

## 🔧 Примеры задач

### Простые
```
Добавь логирование в функцию parse_document
```

### Средние
```
Создай API endpoint для получения списка профилей
```

### Сложные
```
Реализуй систему кэширования для документов
```

**Во всех случаях** агент:
1. Реализует функциональность
2. Напишет тесты (unit + integration)
3. Добавит обработку ошибок
4. Задокументирует код
5. Проверит что всё работает
6. Предложит дальнейшие улучшения

---

## 📊 Стандарты качества

Каждая реализация агента включает:

1. **Типизация**
   - Python: type hints для всех функций
   - TypeScript: types для всех компонентов

2. **Тесты**
   - Unit тесты для логики
   - Integration тесты для API/БД
   - Edge cases обработаны

3. **Обработка ошибок**
   - Try-except с логированием
   - Валидация входных данных
   - Понятные сообщения об ошибках

4. **Документация**
   - Docstrings для всех публичных функций/классов
   - Комментарии для сложной логики
   - README обновлён при необходимости

5. **Код стайл**
   - Python: PEP 8, Black formatting
   - TypeScript: ESLint, Prettier
   - SOLID, DRY, KISS принципы

---

## 🛠️ Обслуживание

### Обновление инструкций

Чтобы изменить поведение агента:
1. Отредактируйте нужный `.instructions.md` файл
2. Сохраните изменения
3. Перезагрузите VS Code (Ctrl+Shift+P → "Developer: Reload Window")

### Добавление новых инструкций

Создайте файл `.github/instructions/new-instruction.instructions.md`:

```markdown
---
description: "Описание когда применяется (для on-demand)"
applyTo: "**/*.py"  # Опционально: для auto-attach
---

# Заголовок

Правила и примеры...
```

### Отключение инструкций

Переименуйте файл добавив `.disabled`:
```
autonomous-agent.instructions.md
→ autonomous-agent.instructions.md.disabled
```

---

## 🐛 Устранение проблем

| Проблема | Решение |
|----------|---------|
| Агент спрашивает подтверждения | Перезапустите VS Code, проверьте что `copilot-instructions.md` существует |
| Инструкции не применяются | Ctrl+Shift+P → "Developer: Reload Window" |
| Python не работает | Установите Python, выберите интерпретатор |
| ESLint не работает | В `frontend/` запустите `npm install` |

---

## 📞 Помощь

### Спросите агента:
```
Почему автономный режим не работает?
```

```
Покажи текущие настройки агента
```

```
Какие инструкции сейчас применяются?
```

### Проверочные команды:

```bash
# Backend тесты
cd backend
pytest

# Frontend тесты
cd frontend
npm test

# Проверка Python форматирования
black --check backend/

# Проверка TypeScript
cd frontend
npm run lint
```

---

## 📈 Развитие

После настройки агента вы можете:
- ✅ Ставить задачи любой сложности
- ✅ Полагаться на автоматическое качество кода
- ✅ Фокусироваться на бизнес-логике, не на деталях
- ✅ Получать готовые решения (код + тесты + документация)

---

## 🔗 Полезные ссылки

- [VS Code Copilot Documentation](https://code.visualstudio.com/docs/copilot/)
- [GitHub Copilot Best Practices](https://docs.github.com/en/copilot)
- [Custom Instructions Guide](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)

---

**Агент готов к работе! Просто ставьте задачи.** 🚀
