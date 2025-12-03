# ===========================================
# CURSA - Dockerfile для Backend (Flask API)
# ===========================================

FROM python:3.12-slim

# Метаданные
LABEL maintainer="CURSA Team"
LABEL version="1.1.0"
LABEL description="CURSA Norm Control API Server"

# Переменные окружения
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV PORT=5000

# Рабочая директория
WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libxml2-dev \
    libxslt1-dev \
    && rm -rf /var/lib/apt/lists/*

# Копирование requirements и установка зависимостей Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

# Копирование кода приложения
COPY . .

# Создание директорий для хранения данных
RUN mkdir -p /app/app/static/corrections \
    && mkdir -p /app/app/static/reports \
    && mkdir -p /app/app/logs \
    && mkdir -p /app/profiles

# Создание непривилегированного пользователя
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

# Порт
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health')" || exit 1

# Запуск через Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--timeout", "120", "run:app"]
