# ✅ Code Review Checklist

Используйте этот чеклист при проведении code review и перед созданием Pull Request.

---

## 🎯 Общие требования

### Функциональность
- [ ] PR решает заявленную проблему
- [ ] Новый функционал работает корректно
- [ ] Обработаны edge cases
- [ ] Нет регрессий существующего функционала
- [ ] Добавлены необходимые валидации

### Код
- [ ] Код читаем и понятен
- [ ] Следует принятому code style
- [ ] Нет дублирования логики
- [ ] Переменные и функции имеют осмысленные названия
- [ ] Нет магических чисел (использованы константы)
- [ ] Соблюдается принцип единственной ответственности
- [ ] Нет излишней сложности

---

## 🐍 Backend (Python)

### Code Style
- [ ] Код отформатирован с помощью `black`
- [ ] Импорты отсортированы с помощью `isort`
- [ ] Проходит проверку `pylint` (score >= 9/10)
- [ ] Проходит проверку `mypy` (без ошибок)
- [ ] Line length <= 100 символов

### Type Hints
- [ ] Все функции имеют type hints для параметров и возвращаемого значения
- [ ] Использованы правильные типы из `typing` (List, Dict, Optional, Union)
- [ ] Typing корректен (mypy не выдает ошибок)

```python
# ✅ Good
def process_document(
    document: Document,
    profile: Optional[Profile] = None
) -> CorrectionReport:
    ...

# ❌ Bad
def process_document(document, profile=None):
    ...
```

### Docstrings
- [ ] Все публичные функции имеют docstrings в Google style
- [ ] Описаны параметры (Args)
- [ ] Описан возвращаемый тип (Returns)
- [ ] Описаны исключения (Raises)

```python
# ✅ Good
def correct_font(paragraph: Paragraph, target_font: str) -> bool:
    """
    Исправляет шрифт в параграфе.
    
    Args:
        paragraph: Параграф для исправления
        target_font: Целевое название шрифта
        
    Returns:
        True если шрифт был изменен, False в противном случае
        
    Raises:
        ValueError: Если target_font невалиден
    """
    ...
```

### Error Handling
- [ ] Обработаны все возможные исключения
- [ ] Используются специфичные исключения (не голый `except:`)
- [ ] Логируются ошибки с контекстом
- [ ] Понятные сообщения об ошибках для пользователя

```python
# ✅ Good
try:
    doc = Document(file_path)
except FileNotFoundError:
    logger.error(f"File not found: {file_path}")
    raise DocumentError("Файл не найден")
except CorruptedDocumentError as e:
    logger.error(f"Corrupted document: {e}")
    raise DocumentError("Документ поврежден")

# ❌ Bad
try:
    doc = Document(file_path)
except:
    pass
```

### Database
- [ ] Используется ORM (SQLAlchemy), а не raw SQL
- [ ] Queries оптимизированы (использован eager loading где нужно)
- [ ] Добавлены индексы для часто запрашиваемых полей
- [ ] Используются транзакции где необходимо
- [ ] Нет N+1 query проблемы

```python
# ✅ Good
users = User.query.options(
    joinedload(User.subscriptions),
    joinedload(User.documents)
).filter_by(is_active=True).all()

# ❌ Bad
users = User.query.filter_by(is_active=True).all()
for user in users:
    # N+1 query!
    subscriptions = user.subscriptions
```

### Security
- [ ] Нет SQL инъекций (используется ORM)
- [ ] Пароли хешируются (bcrypt/argon2)
- [ ] JWT токены валидируются
- [ ] Input данные валидируются
- [ ] Нет hardcoded секретов (используются env переменные)
- [ ] Критичные операции требуют аутентификации

### Performance
- [ ] Нет неоптимальных циклов
- [ ] Используются генераторы для больших данных
- [ ] Кэширование применено где нужно
- [ ] Нет блокирующих операций в основном потоке (используется Celery)

```python
# ✅ Good
@lru_cache(maxsize=128)
def get_gost_rules(profile_name: str) -> List[Rule]:
    ...

# ❌ Bad
def get_gost_rules(profile_name: str):
    # Читает файл каждый раз!
    with open(f'profiles/{profile_name}.json') as f:
        ...
```

### Tests
- [ ] Добавлены unit тесты для новой логики
- [ ] Integration тесты для API endpoints
- [ ] Test coverage для новых файлов >= 80%
- [ ] Тесты проходят локально
- [ ] Тесты изолированы (не зависят друг от друга)

---

## ⚛️ Frontend (React)

### Code Style
- [ ] Код отформатирован с помощью `prettier`
- [ ] Проходит проверку `eslint` (без ошибок)
- [ ] Следует React best practices

### Components
- [ ] Компоненты имеют осмысленные названия (PascalCase)
- [ ] Разбиты на маленькие переиспользуемые части
- [ ] PropTypes определены для всех props
- [ ] DefaultProps установлены где нужно
- [ ] JSDoc комментарий для сложных компонентов

```javascript
// ✅ Good
/**
 * Компонент для отображения прогресса обработки документа.
 *
 * @param {Object} props
 * @param {number} props.progress - Прогресс в процентах (0-100)
 * @param {string} props.status - Статус обработки
 */
const ProgressTracker = ({ progress, status }) => {
  ...
};

ProgressTracker.propTypes = {
  progress: PropTypes.number.isRequired,
  status: PropTypes.oneOf(['idle', 'processing', 'done', 'error']).isRequired,
};

// ❌ Bad
function Progress(props) {
  // Нет PropTypes, нет JSDoc
  ...
}
```

### Hooks
- [ ] Используются правильные хуки (useState, useEffect, useMemo, useCallback)
- [ ] Dependency arrays корректны
- [ ] Нет бесконечных циклов в useEffect
- [ ] Используется cleanup где нужно

```javascript
// ✅ Good
useEffect(() => {
  const interval = setInterval(() => {
    fetchStatus();
  }, 1000);
  
  return () => clearInterval(interval);  // Cleanup!
}, [fetchStatus]);

// ❌ Bad
useEffect(() => {
  setInterval(() => {
    fetchStatus();
  }, 1000);
  // Нет cleanup - утечка памяти!
});
```

### State Management
- [ ] Состояние находится на правильном уровне
- [ ] Не используется излишний глобальный state
- [ ] Используется Context API для shared state
- [ ] Состояние не дублируется

### Performance
- [ ] Используется React.memo для тяжелых компонентов
- [ ] useMemo для дорогих вычислений
- [ ] useCallback для функций передаваемых в props
- [ ] Lazy loading для больших компонентов

```javascript
// ✅ Good
const MemoizedComponent = React.memo(HeavyComponent);

const MemoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

const MemoizedCallback = useCallback(() => {
  handleClick(id);
}, [id]);

// ❌ Bad - пересоздается каждый рендер
<HeavyComponent onClick={() => handleClick(id)} />
```

### Accessibility
- [ ] Семантичный HTML (button, nav, header, footer)
- [ ] ARIA labels где нужно
- [ ] Keyboard navigation работает
- [ ] Color contrast достаточный (WCAG AA)
- [ ] Alt text для изображений

```javascript
// ✅ Good
<button
  aria-label="Загрузить документ"
  onClick={handleUpload}
  disabled={isUploading}
>
  {isUploading ? 'Загрузка...' : 'Загрузить'}
</button>

// ❌ Bad
<div onClick={handleUpload}>Загрузить</div>
```

### Error Handling
- [ ] Error Boundary для fallback UI
- [ ] Try-catch для async операций
- [ ] Понятные сообщения об ошибках

```javascript
// ✅ Good
try {
  const result = await uploadDocument(file);
  setDocument(result);
} catch (error) {
  console.error('Upload failed:', error);
  toast.error('Не удалось загрузить документ. Проверьте формат файла.');
}

// ❌ Bad
const result = await uploadDocument(file);
// Нет обработки ошибок!
```

### Tests
- [ ] Unit тесты для утилит и хуков
- [ ] Component тесты для UI
- [ ] E2E тесты для критичных флоу
- [ ] Test coverage >= 70%

---

## 🗄️ Database

### Migrations
- [ ] Миграция создана корректно
- [ ] Rollback работает
- [ ] Нет breaking changes без миграционного пути
- [ ] Добавлены индексы

### Models
- [ ] Relationships определены корректно
- [ ] Constraints установлены (unique, nullable, default)
- [ ] Cascade deletes настроены правильно
- [ ] `__repr__` метод определен для удобства дебага

```python
# ✅ Good
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    
    documents = db.relationship(
        'Document',
        backref='user',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    def __repr__(self):
        return f'<User {self.email}>'
```

---

## 🔒 Security

### Authentication
- [ ] JWT токены валидируются на каждом endpoint
- [ ] Refresh tokens используются правильно
- [ ] Blacklist для logout реализован
- [ ] CSRF protection включен

### Authorization
- [ ] Проверяются права доступа
- [ ] User может изменять только свои ресурсы
- [ ] Admin endpoints защищены

### Input Validation
- [ ] Все input валидируются
- [ ] File типы проверяются (не только extension)
- [ ] Size limits установлены
- [ ] Sanitization для user input

### Secrets
- [ ] Нет hardcoded паролей/ключей
- [ ] Используются environment переменные
- [ ] .env в .gitignore

---

## 📚 Documentation

### Code Documentation
- [ ] Docstrings для сложных функций
- [ ] Inline комментарии для неочевидной логики
- [ ] README обновлен если нужно

### API Documentation
- [ ] OpenAPI schema обновлена
- [ ] Примеры request/response добавлены
- [ ] Error codes документированы

### User Documentation
- [ ] User guide обновлен для новых фич
- [ ] FAQ дополнены при необходимости

---

## 🐳 Docker & DevOps

### Dockerfile
- [ ] Multi-stage build используется
- [ ] Layer caching оптимизирован
- [ ] Secrets не попадают в образ
- [ ] Размер образа разумный (<500MB для Python)

### Docker Compose
- [ ] Health checks определены
- [ ] Volumes корректно настроены
- [ ] Environment переменные через .env
- [ ] Networks настроены правильно

---

## 🚀 Deployment

### Configuration
- [ ] Environment-specific конфигурация
- [ ] Production настройки отличаются от Development
- [ ] Debug mode выключен в production

### Performance
- [ ] Static files минифицированы и сжаты
- [ ] CDN используется для assets
- [ ] Caching headers настроены

---

## 📊 Logging & Monitoring

### Logging
- [ ] Используется structured logging
- [ ] Log levels правильные (DEBUG, INFO, WARNING, ERROR)
- [ ] Sensitive данные не логируются
- [ ] Логи содержат достаточно контекста

```python
# ✅ Good
logger.info(
    "Document processed",
    extra={
        'document_id': doc.id,
        'user_id': user.id,
        'duration_ms': duration,
        'errors_count': len(errors)
    }
)

# ❌ Bad
print("Document processed")
```

### Metrics
- [ ] Важные метрики экспортируются в Prometheus
- [ ] Dashboards в Grafana обновлены

---

## ✅ Pre-Merge Checklist

### Локально
- [ ] Все тесты проходят (`pytest`, `npm test`)
- [ ] Coverage достаточный (>=80%)
- [ ] Линтеры не выдают ошибок
- [ ] Код отформатирован
- [ ] Нет console.log/print для дебага

### CI/CD
- [ ] GitHub Actions проходят
- [ ] Build успешен
- [ ] Deploy в staging прошел без ошибок

### Документация
- [ ] CHANGELOG.md обновлен
- [ ] API docs актуальны
- [ ] README дополнен если нужно

### Review
- [ ] Self-review проведен
- [ ] Получен approve от reviewer
- [ ] Все комментарии разрешены

---

## 🎯 Final Check

**Перед merge задайте себе вопросы:**

1. ✅ Код читаем и понятен через 6 месяцев?
2. ✅ Новый разработчик сможет разобраться?
3. ✅ Производительность не деградирует?
4. ✅ Безопасность учтена?
5. ✅ Тесты покрывают edge cases?
6. ✅ Документация актуальна?
7. ✅ Можно безопасно откатить изменения?

**Если на все вопросы "да" - можно мержить! 🚀**
