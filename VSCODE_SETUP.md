# Настройка VS Code Insiders + GitHub Copilot для автономного агента

## Шаг 1: Проверка установленного ПО

### VS Code Insiders
Убедитесь что у вас установлен **VS Code Insiders** (не обычный VS Code).

Если не установлен:
- Скачайте: https://code.visualstudio.com/insiders/
- Установите и запустите

### GitHub Copilot
1. Откройте VS Code Insiders
2. Перейдите в Extensions (Ctrl+Shift+X)
3. Найдите и установите:
   - **GitHub Copilot** (обязательно)
   - **GitHub Copilot Chat** (обязательно)
4. Войдите в GitHub аккаунт когда попросит

## Шаг 2: Установка рекомендуемых расширений

VS Code автоматически предложит установить расширения при открытии проекта.

Нажмите **"Install All"** или установите вручную:

### Обязательные:
- GitHub Copilot
- GitHub Copilot Chat
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)

### Рекомендуемые:
- Black Formatter (ms-python.black-formatter)
- GitLens (eamodio.gitlens)
- Docker (ms-azuretools.vscode-docker)
- Code Spell Checker + Russian (streetsidesoftware.code-spell-checker*)

## Шаг 3: Активация автономного режима

Файлы уже созданы в проекте:
- ✅ `.github/copilot-instructions.md`
- ✅ `.github/instructions/*.instructions.md`
- ✅ `.vscode/settings.json`
- ✅ `.vscode/extensions.json`

**Перезапустите VS Code Insiders** чтобы настройки применились:
1. Закройте VS Code Insiders
2. Откройте снова
3. Откройте папку проекта `c:\Users\neytq\CURSA`

## Шаг 4: Проверка работы

### Откройте GitHub Copilot Chat:
- **Ctrl+Shift+I** (Windows)
- Или через Command Palette (Ctrl+Shift+P): "GitHub Copilot: Open Chat"

### Тестовый запрос:
```
Покажи текущие настройки автономного режима
```

Агент должен ответить информацией о настроенном автономном режиме.

### Тестовая задача:
```
Добавь комментарий в файл backend/run.py
```

Агент должен:
- Открыть файл
- Добавить комментарий
- НЕ спрашивать подтверждения

## Шаг 5: Настройка GitHub Copilot Chat

В настройках GitHub Copilot (если нужно изменить):

1. **Ctrl+Shift+P** → "Preferences: Open User Settings"
2. Найдите "Copilot"
3. Убедитесь что включено:
   - ✅ `github.copilot.enable` = true (для всех языков)
   - ✅ Chat включен

## Возможные проблемы и решения

### Проблема: Агент спрашивает подтверждения

**Решение:**
1. Убедитесь что файл `.github/copilot-instructions.md` существует
2. Перезапустите VS Code Insiders
3. Очистите кэш: Ctrl+Shift+P → "Developer: Reload Window"

### Проблема: Инструкции не применяются

**Решение:**
1. Проверьте что файлы в правильных путях:
   - `.github/copilot-instructions.md` (в корне проекта)
   - `.github/instructions/*.instructions.md`
2. Перезагрузите окно: Ctrl+Shift+P → "Developer: Reload Window"
3. Проверьте Output → GitHub Copilot на ошибки

### Проблема: Python расширения не работают

**Решение:**
1. Установите Python: https://www.python.org/downloads/
2. Перезапустите VS Code Insiders
3. Выберите интерпретатор: Ctrl+Shift+P → "Python: Select Interpreter"

### Проблема: ESLint/Prettier не работают

**Решение:**
1. В папке `frontend/` выполните:
   ```bash
   npm install
   ```
2. Перезапустите VS Code Insiders

## Дополнительные настройки

### Увеличение лимита контекста Copilot

В `.vscode/settings.json` (уже настроено):
```json
{
  "github.copilot.enable": {
    "*": true
  }
}
```

### Клавиатурные сокращения

Добавьте в **Keyboard Shortcuts** (Ctrl+K Ctrl+S):

```json
[
  {
    "key": "ctrl+shift+i",
    "command": "workbench.action.chat.open"
  },
  {
    "key": "ctrl+i",
    "command": "github.copilot.inlineChat"
  }
]
```

## Проверка что всё работает

### Чек-лист:
- [ ] VS Code Insiders запущен
- [ ] GitHub Copilot активен (иконка в статус-баре)
- [ ] Расширения установлены
- [ ] Проект открыт в VS Code
- [ ] Файл `.github/copilot-instructions.md` существует
- [ ] Tестовая задача выполнена без подтверждений

### Тестовые команды:

```
# 1. Простая задача
Добавь TODO комментарий в backend/run.py

# 2. Средняя задача
Создай функцию hello_world в backend/app/utils.py с типами

# 3. Информация
Покажи структуру проекта
```

Если агент выполняет задачи автоматически и не спрашивает постоянно разрешения - **всё работает!** ✅

## Режимы работы с агентом

### В Chat:
- Долгие задачи
- Комплексная разработка
- Обсуждение архитектуры

### Inline (Ctrl+I):
- Быстрые правки в файле
- Автозаполнение
- Рефакторинг участка кода

## Использование

После настройки просто общайтесь с агентом в Chat:

```
Добавь валидацию email
```

```
Оптимизируй функцию parse_document
```

```
Исправь баг с кодировкой
```

Агент всё сделает сам: код, тесты, документацию, проверит работу, предложит следующие шаги.

---

## Документация

- Быстрый старт: [QUICKSTART_AGENT.md](../QUICKSTART_AGENT.md)
- Полная настройка: [AGENT_SETUP.md](.github/AGENT_SETUP.md)
- Примеры: [AGENT_EXAMPLES.md](.github/AGENT_EXAMPLES.md)

---

**Готово! Теперь агент работает автономно.** 🚀

При любых проблемах - спросите агента:
```
Почему автономный режим не работает?
```
