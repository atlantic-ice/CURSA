# PostgreSQL Миграция (v1.4.0)

## 📋 Статус: Готово к готовке

- ✅ Приложение уже использует SQLAlchemy
- ✅ Flask-Migrate готов для управления миграциями
- ✅ docker-compose.yml настроен на PostgreSQL 15
- ✅ Все модели совместимы с PostgreSQL
- ✅ Конфигурация БД поддерживает переменные окружения
- ✅ Исправлены deprecation warnings (`datetime.utcnow()` → `datetime.now(timezone.utc)`)

## 🚀 Этапы миграции

### Этап 1: Локальная разработка (ЗАВЕРШЕНО)

```bash
# Запуск полного стека с PostgreSQL
docker-compose up -d

# Проверка доступности PostgreSQL
docker-compose logs postgres

# Создание таблиц
docker-compose exec backend flask db upgrade
```

### Этап 2: Инициализация миграций (ЕСЛИ НЕОБХОДИМО)

Если миграции не существуют:

```bash
# Инициализация миграций (один раз)
flask db init

# Создание первой миграции
flask db migrate -m "Initial schema"

# Применение миграции
flask db upgrade
```

### Этап 3: Миграция данных (если есть SQLite БД)

```python
# Экспорт из SQLite
from sqlite3 import connect
sqlite_conn = connect('instance/cursa.db')

# Импорт в PostgreSQL
# Используется SQLAlchemy ORM - автоматический маппинг
```

### Этап 4: Production Deployment

1. Установить PostgreSQL 15+ на production сервер
2. Обновить `DATABASE_URL` для production
3. Запустить `flask db upgrade` перед запуском приложения
4. Включить резервное копирование БД

## 📊 Схема БД

### Основные таблицы:

- **users** - пользователи с ролями и OAuth
- **documents** - загруженные документы
- **subscriptions** - подписки пользователей
- **payments** - платежи через Stripe/Yookassa
- **api_keys** - API ключи для интеграций

### Соотношения:

```
User
├── Subscriptions (1:*) → Subscription
├── Documents (1:*) → Document (с валидацией reports)
├── Payments (1:*) → Payment
└── APIKeys (1:*) → APIKey
```

## 🔧 Конфигурация

### Локальная разработка (.env)

```env
DATABASE_URL=postgresql://cursa_user:cursa_password_change_in_production@localhost:5432/cursa_db
SQLALCHEMY_ECHO=False
```

### Production (.env.production)

```env
DATABASE_URL=postgresql://prod_user:SECURE_PASSWORD@db.production.com:5432/cursa_prod
SQLALCHEMY_POOL_SIZE=20
SQLALCHEMY_POOL_RECYCLE=3600
SQLALCHEMY_POOL_PRE_PING=True
```

## 🔒 Безопасность

- ✅ Пароли в переменных окружения
- ✅ Connection pooling включен
- ✅ Pre-ping для check idle connections
- ✅ SSL для production подключений (опционально)

```python
# Для SSL в production:
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

## ⚙️ Оптимизация

### Current Settings (backend/app/config/database.py)

```python
SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_size": 10,          # Размер пула соединений
    "pool_recycle": 3600,     # Переподключение каждый час
    "pool_pre_ping": True,    # Проверка соединений перед использованием
}
```

### Рекомендуется для production (>>50 пользователей)

```python
# Development
SQLALCHEMY_ENGINE_OPTIONS = {"pool_size": 10, "pool_recycle": 3600, "pool_pre_ping": True}

# Production High-Load
SQLALCHEMY_ENGINE_OPTIONS = {"pool_size": 30, "max_overflow": 20, "pool_recycle": 3600, "pool_pre_ping": True}
```

## 📈 Масштабирование

### Этап 1: Read Replicas (Q2 2026)

```sql
-- Setup read replica
CREATE PUBLICATION cursa_publication FOR ALL TABLES;
-- На replica сервере
CREATE SUBSCRIPTION cursa_subscription CONNECTION ... PUBLICATION cursa_publication;
```

### Этап 2: Data Partitioning (Q3 2026)

```sql
-- Partition documents by user_id
CREATE TABLE documents_part PARTITION OF documents
    FOR VALUES FROM (1) TO (1000000);
```

### Этап 3: Архивирование (Q4 2026)

```sql
-- Archive old documents (>1 год)
CREATE TABLE documents_archive AS SELECT * FROM documents WHERE created_at < NOW() - INTERVAL '1 year';
DELETE FROM documents WHERE created_at < NOW() - INTERVAL '1 year';
```

## 🔄 Rollback процедура

Если что-то пошло не так:

```bash
# Откат на одну миграцию назад
flask db downgrade -1

# Просмотр истории миграций
flask db history

# Откат на конкретную миграцию
flask db downgrade {revision}
```

## 📝 Отслеживание миграций

Все миграции хранятся в `backend/migrations/versions/`

```bash
# Просмотр текущего revision
flask db current

# Просмотр всех доступных миграций
flask db branches
```

## ✅ Checklist для v1.4.0 Release

- [ ] PostgreSQL 15+ установлен в production
- [ ] DATABASE_URL обновлен
- [ ] Все миграции применены (`flask db upgrade`)
- [ ] Backup старых данных выполнен (если есть SQLite)
- [ ] Тесты пройдены на PostgreSQL
- [ ] Performance testing завершено
- [ ] Мониторинг настроен (connections, query time)
- [ ] Documentation обновлена
- [ ] Changelog обновлен

## 🎯 Цели v1.4.0

- ✅ PostgreSQL production-ready
- ⏳ OAuth2 интеграция (Google, GitHub, Yandex)
- ⏳ Улучшенная аналитика
- ⏳ Advanced reporting

## 📚 Ссылки

- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [SQLAlchemy PostgreSQL](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)
- [Flask-Migrate Documentation](https://flask-migrate.readthedocs.io/)
- [Docker PostgreSQL](https://hub.docker.com/_/postgres)
