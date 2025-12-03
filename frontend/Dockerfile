# ===========================================
# CURSA - Dockerfile для Frontend (React)
# ===========================================

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Копирование package.json и установка зависимостей
COPY package*.json ./
RUN npm ci --silent

# Копирование исходного кода и сборка
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Метаданные
LABEL maintainer="CURSA Team"
LABEL version="1.1.0"
LABEL description="CURSA Frontend (React)"

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копирование собранного приложения
COPY --from=builder /app/build /usr/share/nginx/html

# Порт
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]
