---
description: "Автоматическая обработка ошибок, багов, исключений. Применяется при обнаружении проблем, падении тестов, runtime errors."
---

# Автоматическая отладка и исправление ошибок

## Принцип: Нашёл баг → Исправил → Протестировал

Не спрашивайте разрешения на исправление багов. Любая ошибка должна быть устранена немедленно.

## Алгоритм работы с ошибками

### 1. Обнаружение
- Тесты падают
- Runtime ошибки в логах
- Неожиданное поведение
- Сообщения пользователей

### 2. Анализ (автоматически)
- Воспроизвести ошибку
- Определить root cause
- Проверить похожие места в коде

### 3. Исправление (без согласования)
- Исправить баг
- Добавить обработку edge case
- Улучшить валидацию входных данных
- Добавить логирование

### 4. Тестирование (обязательно)
- Написать regression test (тест, который упал бы до исправления)
- Убедиться что исправление работает
- Проверить что не сломано ничего другого

### 5. Документирование
- Обновить docstring если поведение изменилось
- Добавить комментарий если баг был неочевидным

## Типы ошибок и автоматические действия

### ValueError / TypeError (неверные данные)
✅ **Действие:**
```python
# Было (плохо)
def process(value):
    return value.upper()

# Стало (хорошо)
def process(value: Optional[str]) -> str:
    """
    Обработка значения.
    
    Args:
        value: Строка для обработки
        
    Returns:
        Обработанная строка
        
    Raises:
        ValueError: Если value = None
    """
    if value is None:
        raise ValueError("value cannot be None")
    return value.upper()
```

### KeyError / AttributeError (отсутствующие ключи/атрибуты)
✅ **Действие:**
```python
# Было
result = data['key']

# Стало
result = data.get('key')
if result is None:
    logger.warning(f"Key 'key' not found in data")
    result = default_value
```

### IndexError / StopIteration (проблемы с итерацией)
✅ **Действие:**
```python
# Было
first_item = items[0]

# Стало
if not items:
    logger.warning("Empty items list")
    return None
first_item = items[0]
```

### FileNotFoundError / IOError (файловые операции)
✅ **Действие:**
```python
from pathlib import Path

def read_file(filepath: str) -> str:
    """Чтение файла с обработкой ошибок"""
    path = Path(filepath)
    
    if not path.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    
    if not path.is_file():
        raise ValueError(f"Path is not a file: {filepath}")
    
    try:
        return path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        logger.error(f"Failed to decode {filepath} as UTF-8")
        return path.read_text(encoding='latin-1')
```

### Timeout / ConnectionError (сетевые операции)
✅ **Действие:**
```python
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

def get_with_retry(url: str) -> requests.Response:
    """HTTP запрос с retry логикой"""
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    return session.get(url, timeout=10)
```

### Race Conditions / Threading Issues
✅ **Действие:**
```python
from threading import Lock

class ThreadSafeCounter:
    def __init__(self):
        self._value = 0
        self._lock = Lock()
    
    def increment(self):
        with self._lock:
            self._value += 1
```

## Логирование ошибок

Всегда добавляйте логирование при обработке ошибок:

```python
import logging
logger = logging.getLogger(__name__)

try:
    risky_operation()
except ValueError as e:
    # Логируем warning для ожидаемых ошибок
    logger.warning(f"Invalid input: {e}")
    raise
except Exception as e:
    # Логируем exception для неожиданных ошибок (с traceback)
    logger.exception(f"Unexpected error in risky_operation: {e}")
    raise
```

## Отладка тестов

### Тест падает → Автоматические действия:

1. **Запустить тест отдельно**
```bash
pytest tests/test_module.py::test_failing -v
```

2. **Добавить отладочный вывод**
```python
def test_failing():
    result = function_under_test(input_data)
    print(f"DEBUG: result = {result}")  # Временно для отладки
    assert result == expected
```

3. **Исправить проблему**
4. **Удалить отладочный вывод**
5. **Убедиться что все тесты проходят**

## Performance Issues (медленный код)

### При обнаружении узких мест:

✅ **Действия:**
1. Профилирование
```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()
slow_function()
profiler.disable()

stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(10)  # Топ 10 медленных функций
```

2. Оптимизация
- Кэширование результатов
- Batch операции вместо циклов
- Асинхронность для I/O операций
- Индексы для БД запросов

3. Добавить бенчмарк тест
```python
import time

def test_performance():
    start = time.time()
    result = optimized_function(large_input)
    duration = time.time() - start
    assert duration < 1.0  # Должно работать < 1 секунды
```

## Memory Leaks

При росте памяти:

✅ **Проверить:**
- Закрытие файловых дескрипторов
- Закрытие DB соединений
- Очистка больших объектов
- Circular references

```python
# Было (плохо)
f = open('file.txt')
data = f.read()

# Стало (хорошо)
with open('file.txt') as f:
    data = f.read()
# Файл автоматически закрывается
```

## Регрессионные тесты

После каждого исправления бага:

✅ **Обязательно добавить тест:**
```python
def test_bug_fix_issue_123():
    """
    Regression test для бага #123.
    Проверяет что функция корректно обрабатывает пустой список.
    """
    # Этот тест упал бы до исправления
    result = process_items([])
    assert result == []  # Не должно падать
```

## Приоритеты исправления

1. **Критические** (сразу) - приложение падает, потеря данных
2. **Высокий** (в течение дня) - неработающая функциональность
3. **Средний** (в течение недели) - неудобство для пользователя
4. **Низкий** (когда есть время) - косметические проблемы

Критические и высокие приоритеты - исправляйте немедленно без согласования.

## Не спрашивайте:

❌ "Исправить ли этот баг?"  
❌ "Добавить ли обработку ошибок?"  
❌ "Стоит ли написать regression test?"  
❌ "Нужно ли логирование?"  

→ Просто исправьте и добавьте всё необходимое.

## Сообщайте кратко:

После исправления:
```
Исправлен баг с обработкой пустых файлов:
- Добавлена валидация входных данных
- Добавлена обработка FileNotFoundError
- Добавлен regression test
- Улучшено логирование

Проверено: все 127 тестов проходят
```
