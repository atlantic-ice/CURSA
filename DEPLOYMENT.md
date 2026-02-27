# 🚀 Production Deployment Guide

> **Дата версии:** Февраль 2026
> **Текущая версия:** v1.3.0
> **Для версии:** v1.4.0+

---

## 📋 Содержание

- [Требования](#требования)
- [Graceful Degradation](#graceful-degradation)
- [Развёртывание с Docker](#развёртывание-с-docker)
- [Ручное развёртывание](#ручное-развёртывание)
- [Настройка Redis](#настройка-redis)
- [Настройка PostgreSQL](#настройка-postgresql)
- [Nginx Reverse Proxy](#nginx-reverse-proxy)
- [SSL/TLS сертификаты](#ssltls-сертификаты)
- [Мониторинг](#мониторинг)
- [Бэкапы](#бэкапы)

---

## 🎯 Требования

### Минимальная конфигурация (без Redis)

- **CPU:** 2 cores
- **RAM:** 2 GB
- **Диск:** 10 GB SSD
- **ОС:** Ubuntu 20.04+, Debian 11+, CentOS 8+
- **Python:** 3.11+
- **Node.js:** 18+

### Рекомендуемая конфигурация (с Redis)

- **CPU:** 4 cores
- **RAM:** 4 GB
- **Диск:** 20 GB SSD
- **ОС:** Ubuntu 22.04 LTS
- **Python:** 3.11+
- **Node.js:** 18+
- **Redis:** 7.0+
- **PostgreSQL:** 14+ (для v1.4.0+)

---

## 🔄 Graceful Degradation

CURSA автоматически адаптируется к доступности зависимостей:

### Компоненты и их состояния

| Компонент                        | Обязателен? | Fallback при отсутствии                                      |
| -------------------------------- | ----------- | ------------------------------------------------------------ |
| **Python Backend**               | ✅ ДА       | -                                                            |
| **React Frontend**               | ✅ ДА       | -                                                            |
| **Redis**                        | ❌ НЕТ      | Memory storage для rate limiting, JWT logout/revoke отключён |
| **PostgreSQL**                   | ❌ НЕТ      | SQLite (только для dev/test)                                 |
| **OAuth (Google/GitHub/Yandex)** | ❌ НЕТ      | Email/password авторизация                                   |

### Сценарии работы

#### 1. Полная конфигурация (Production)

```
Backend + Frontend + Redis + PostgreSQL + OAuth
```

✅ Все функции доступны
✅ Распределённый rate limiting
✅ JWT blacklist (logout работает)
✅ Масштабируемость

#### 2. Минимальная конфигурация (Dev/Small prod)

```
Backend + Frontend
```

✅ Основной функционал работает
⚠️ Rate limiting на memory (не персистентный)
⚠️ JWT logout не работает (токены истекают по таймеру)
⚠️ SQLite БД (не для production нагрузки)

---

## 🐳 Развёртывание с Docker

### Полная конфигурация (с Redis)

**docker-compose.yml:**

```yaml
version: "3.8"

services:
  redis:
    image: redis:7-alpine
    container_name: cursa-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: cursa-backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - FRONTEND_ORIGINS=http://localhost:3000,https://your-domain.com
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    volumes:
      - ./backend/profiles:/app/profiles
      - ./backend/app/static:/app/app/static
      - ./backend/app/logs:/app/app/logs
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: cursa-frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:5000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  redis-data:
    driver: local

networks:
  default:
    name: cursa-network
```

**Запуск:**

```bash
# Создайте .env файл
cat > .env << EOF
JWT_SECRET_KEY=$(openssl rand -hex 32)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
EOF

# Запуск
docker-compose up -d

# Проверка статуса
docker-compose ps
curl http://localhost:5000/api/health/detailed
```

### Минимальная конфигурация (без Redis)

Просто удалите секцию `redis` из docker-compose.yml и `depends_on: redis` из backend.

**Backend автоматически переключится на memory storage.**

---

## 🔧 Ручное развёртывание

### 1. Установка зависимостей (Ubuntu 22.04)

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip -y

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Redis (опционально)
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Nginx
sudo apt install nginx -y
```

### 2. Клонирование и настройка

```bash
# Клонирование репозитория
git clone https://github.com/your-username/CURSA.git
cd CURSA

# Backend
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Frontend (production build)
cd ../frontend
npm ci --production
npm run build
```

### 3. Конфигурация окружения

**backend/.env:**

```env
FLASK_ENV=production
SECRET_KEY=your_secret_key_here_generate_random
JWT_SECRET_KEY=your_jwt_secret_here_generate_random

# Redis (опционально)
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0

# Опционально: OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# CORS
FRONTEND_ORIGINS=https://your-domain.com

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_STORAGE_URI=redis://localhost:6379/0  # или memory://
```

### 4. Systemd сервисы

**/etc/systemd/system/cursa-backend.service:**

```ini
[Unit]
Description=CURSA Backend API
After=network.target redis.service
Wants=redis.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/CURSA/backend
Environment="PATH=/opt/CURSA/backend/.venv/bin"
ExecStart=/opt/CURSA/backend/.venv/bin/gunicorn \
    --bind 127.0.0.1:5000 \
    --workers 4 \
    --worker-class gevent \
    --timeout 120 \
    --access-logfile /var/log/cursa/access.log \
    --error-logfile /var/log/cursa/error.log \
    'app:create_app()'
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Активация:**

```bash
sudo mkdir -p /var/log/cursa
sudo chown www-data:www-data /var/log/cursa
sudo systemctl daemon-reload
sudo systemctl enable cursa-backend
sudo systemctl start cursa-backend
sudo systemctl status cursa-backend
```

---

## 📡 Настройка Redis

### Установка

```bash
# Ubuntu/Debian
sudo apt install redis-server -y

# CentOS/RHEL
sudo yum install redis -y

# macOS
brew install redis

# Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Конфигурация для production

**/etc/redis/redis.conf:**

```conf
# Бинд только на localhost (если backend на той же машине)
bind 127.0.0.1

# Пароль (рекомендуется)
requirepass your_strong_password_here

# Персистентность
appendonly yes
appendfsync everysec

# Лимиты памяти
maxmemory 256mb
maxmemory-policy allkeys-lru

# Логирование
loglevel notice
logfile /var/log/redis/redis-server.log
```

**Перезапуск:**

```bash
sudo systemctl restart redis-server
```

**Обновите backend/.env:**

```env
REDIS_URL=redis://:your_strong_password_here@localhost:6379/0
```

### Проверка работы

```bash
# Ping Redis
redis-cli ping  # Ответ: PONG

# С паролем
redis-cli -a your_strong_password_here ping

# Проверка через API
curl http://localhost:5000/api/health/detailed | jq '.components.redis'
```

**Ожидаемый ответ:**

```json
{
  "status": "healthy",
  "url": "redis://localhost:6379/0"
}
```

---

## 🗄️ Настройка PostgreSQL (для v1.4.0+)

### Установка

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Создание БД и пользователя

```bash
sudo -u postgres psql

CREATE DATABASE cursa;
CREATE USER cursa_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE cursa TO cursa_user;
\q
```

### Обновление backend/.env

```env
DATABASE_URL=postgresql://cursa_user:strong_password_here@localhost:5432/cursa
```

### Миграции

```bash
cd backend
source .venv/bin/activate
flask db upgrade
```

---

## 🌐 Nginx Reverse Proxy

**/etc/nginx/sites-available/cursa:**

```nginx
upstream backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Редирект на HTTPS (после настройки SSL)
    # return 301 https://$server_name$request_uri;

    # Размер загружаемых файлов
    client_max_body_size 50M;

    # Frontend (статика)
    location / {
        root /opt/CURSA/frontend/build;
        try_files $uri $uri/ /index.html;

        # Кэширование статики
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Таймауты для долгих операций
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket (если используется)
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check
    location /api/health {
        proxy_pass http://backend;
        access_log off;
    }
}
```

**Активация:**

```bash
sudo ln -s /etc/nginx/sites-available/cursa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL/TLS сертификаты

### Certbot (Let's Encrypt)

```bash
# Установка
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автообновление (проверка)
sudo certbot renew --dry-run
```

Certbot автоматически обновит Nginx конфигурацию для HTTPS.

---

## 📊 Мониторинг

### Health Checks

```bash
# Простой health check
curl http://localhost:5000/api/health

# Детальный с метриками
curl http://localhost:5000/api/health/detailed | jq

# Проверка Redis
curl http://localhost:5000/api/health/detailed | jq '.components.redis'
```

### Логирование

```bash
# Backend логи
tail -f /var/log/cursa/error.log
tail -f /var/log/cursa/access.log

# Systemd журнал
sudo journalctl -u cursa-backend -f

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Redis логи
tail -f /var/log/redis/redis-server.log
```

### Prometheus + Grafana (опционально)

Будет добавлено в v1.4.0.

---

## 💾 Бэкапы

### База данных (PostgreSQL)

```bash
# Создание бэкапа
pg_dump -U cursa_user cursa > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление
psql -U cursa_user cursa < backup_20260227_120000.sql
```

### Файлы и профили

```bash
# Бэкап важных директорий
tar -czf cursa_files_$(date +%Y%m%d).tar.gz \
    /opt/CURSA/backend/profiles \
    /opt/CURSA/backend/app/static \
    /opt/CURSA/backend/.env

# Восстановление
tar -xzf cursa_files_20260227.tar.gz -C /opt/CURSA
```

### Автоматический бэкап (cron)

```bash
# Добавить в crontab
crontab -e

# Ежедневный бэкап в 2:00
0 2 * * * /opt/CURSA/scripts/backup.sh
```

**/opt/CURSA/scripts/backup.sh:**

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/cursa"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# PostgreSQL
pg_dump -U cursa_user cursa > $BACKUP_DIR/db_$DATE.sql

# Файлы
tar -czf $BACKUP_DIR/files_$DATE.tar.gz \
    /opt/CURSA/backend/profiles \
    /opt/CURSA/backend/app/static

# Удаление старых бэкапов (>30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

---

## 🚨 Troubleshooting

### Redis недоступен

**Симптомы:**

```
⚠️  Redis недоступен, используется memory storage для rate limiting
```

**Решение:**

```bash
# Проверить статус
sudo systemctl status redis-server

# Перезапустить
sudo systemctl restart redis-server

# Проверить логи
tail -f /var/log/redis/redis-server.log

# Проверить подключение
redis-cli ping
```

Приложение продолжит работать с memory storage.

### Backend не стартует

```bash
# Проверить логи
sudo journalctl -u cursa-backend -n 50

# Проверить права
ls -la /opt/CURSA/backend

# Проверить зависимости
source /opt/CURSA/backend/.venv/bin/activate
pip check
```

### Rate limiting не работает

```bash
# Проверить Redis
curl http://localhost:5000/api/health/detailed | jq '.components.redis.status'

# Если Redis unavailable - ожидаемо работа на memory storage
```

---

## 📞 Поддержка

- **Issues:** [GitHub Issues](https://github.com/your-username/CURSA/issues)
- **Документация:** [README.md](README.md)
- **Roadmap:** [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)

---

**Дата последнего обновления:** 27 февраля 2026
