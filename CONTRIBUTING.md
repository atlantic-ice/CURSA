# Вклад в CURSA

Спасибо за интерес к развитию проекта! 🎉

## 📋 Как внести вклад

### Сообщение об ошибках

1. Проверьте, не существует ли уже [похожего issue](https://github.com/yourusername/cursa/issues)
2. Создайте новый issue с подробным описанием:
   - Шаги для воспроизведения
   - Ожидаемое поведение
   - Фактическое поведение
   - Версии (Python, Node.js, ОС)
   - Скриншоты (если применимо)

### Предложение улучшений

1. Опишите проблему, которую решает улучшение
2. Предложите возможное решение
3. Укажите альтернативы, если есть

### Pull Requests

#### Подготовка

```bash
# 1. Fork репозитория на GitHub

# 2. Клонирование
git clone https://github.com/your-username/cursa.git
cd cursa

# 3. Создание ветки
git checkout -b feature/amazing-feature
```

#### Разработка

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

#### Тестирование

```bash
# Backend тесты
cd backend
python -m pytest tests/ -v

# Frontend тесты
cd frontend
npm test
```

#### Отправка

```bash
git add .
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

Затем создайте Pull Request на GitHub.

---

## 📝 Стиль кода

### Python

- Следуем PEP 8
- Type hints для функций
- Docstrings для публичных методов
- Максимальная длина строки: 100 символов

```python
def process_document(file_path: str, profile_id: str = "gost") -> dict:
    """
    Обрабатывает документ по указанному профилю.
    
    Args:
        file_path: Путь к DOCX файлу
        profile_id: ID профиля нормоконтроля
        
    Returns:
        Словарь с результатами проверки
    """
    ...
```

### JavaScript/React

- ESLint конфигурация проекта
- PropTypes для всех компонентов
- Функциональные компоненты с хуками
- React.memo для оптимизации

```jsx
import PropTypes from 'prop-types';

const Component = memo(({ title, onClick }) => {
  return <button onClick={onClick}>{title}</button>;
});

Component.propTypes = {
  title: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

Component.displayName = 'Component';
```

---

## 🏷️ Commits

Используем [Conventional Commits](https://www.conventionalcommits.org/):

| Тип | Описание |
|-----|----------|
| `feat` | Новая функция |
| `fix` | Исправление бага |
| `docs` | Документация |
| `style` | Форматирование (не влияет на код) |
| `refactor` | Рефакторинг |
| `test` | Тесты |
| `chore` | Обслуживание |

Примеры:
```
feat: add lazy loading for pages
fix: correct margin calculation in checker
docs: update API examples in README
test: add ErrorBoundary unit tests
```

---

## 🔍 Код-ревью

- Все PR проходят ревью
- Требуется минимум 1 approve
- CI должен быть зелёным
- Конфликты должны быть разрешены

---

## 📜 Лицензия

Внося вклад, вы соглашаетесь, что ваш код будет лицензирован под MIT License.

---

Вопросы? Создайте [Discussion](https://github.com/yourusername/cursa/discussions) 💬
