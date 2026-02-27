---
description: "Стандарты качества кода для Python (backend) и TypeScript (frontend). Применяется при написании, проверке и review кода."
---

# Стандарты качества кода

## Python (Backend)

### Стиль
- **PEP 8**: Следуйте стандарту Python
- **Длина строки**: 88 символов (Black formatter)
- **Импорты**: Сортированы, сгруппированы (stdlib, third-party, local)
- **Docstrings**: Google style для всех публичных функций/классов

### Типизация
```python
from typing import Optional, List, Dict

def process_data(
    data: List[Dict[str, Any]], 
    filter_value: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Обработка данных с опциональной фильтрацией.
    
    Args:
        data: Список словарей для обработки
        filter_value: Опциональное значение для фильтрации
        
    Returns:
        Обработанный список данных
    """
    pass
```

### Обработка ошибок
```python
# ❌ Плохо
try:
    result = risky_operation()
except:
    pass

# ✅ Хорошо
import logging
logger = logging.getLogger(__name__)

try:
    result = risky_operation()
except ValueError as e:
    logger.error(f"Invalid value: {e}")
    raise
except Exception as e:
    logger.exception("Unexpected error in risky_operation")
    raise
```

### Структура классов
```python
from dataclasses import dataclass

@dataclass
class Config:
    """Конфигурация приложения"""
    api_key: str
    timeout: int = 30
    debug: bool = False
```

## TypeScript (Frontend)

### Типизация
```typescript
// ✅ Всегда указывайте типы
interface User {
  id: string;
  name: string;
  email: string;
}

const fetchUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};
```

### React компоненты
```typescript
import { FC } from 'react';

interface Props {
  title: string;
  onSubmit: (value: string) => void;
}

export const MyComponent: FC<Props> = ({ title, onSubmit }) => {
  // Implementation
};
```

### Обработка ошибок
```typescript
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  console.error('Failed to fetch data:', error);
  setError(error instanceof Error ? error.message : 'Unknown error');
}
```

## Общие принципы

### SOLID
- **S**ingle Responsibility: Один класс = одна ответственность
- **O**pen/Closed: Открыт для расширения, закрыт для модификации
- **L**iskov Substitution: Подтип должен заменять базовый тип
- **I**nterface Segregation: Много специфичных интерфейсов лучше одного общего
- **D**ependency Inversion: Зависимости от абстракций, не от конкретики

### DRY (Don't Repeat Yourself)
- Дублирование кода → Вынести в функцию
- Повторяющаяся логика → Создать общий компонент/утилиту

### KISS (Keep It Simple, Stupid)
- Простое решение > сложного
- Читаемость > "умность"

### YAGNI (You Aren't Gonna Need It)
- Не добавляйте функциональность "на будущее"
- Реализуйте только то, что нужно сейчас

## Код-ревью чеклист (автоматически проверяйте)

- [ ] Есть типы для всех функций
- [ ] Есть обработка ошибок
- [ ] Есть тесты
- [ ] Есть docstrings/комментарии
- [ ] Нет дублирования кода
- [ ] Нет магических чисел
- [ ] Используются константы
- [ ] Переменные названы понятно
- [ ] Функции < 50 строк
- [ ] Вложенность < 3 уровней

## Автоматические исправления

При обнаружении нарушений стандартов - исправляйте сразу:
- Отсутствие типов → Добавить
- Нет обработки ошибок → Добавить
- Длинная функция → Разбить
- Дублирование → Рефакторить
- Плохие названия → Переименовать
