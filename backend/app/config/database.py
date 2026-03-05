"""
Database and application configuration
"""

import os
import socket
from datetime import timedelta


def _normalize_database_url(raw_url: str) -> str:
    """Normalize DB URL for local development.

    If DATABASE_URL points to host `postgres` but this hostname is not resolvable
    in the current environment (typical local non-docker run), fallback to
    localhost to avoid connection failures during auth/registration.
    """
    if not raw_url:
        return "sqlite:///cursa.db"

    if "@postgres:" in raw_url:
        try:
            socket.gethostbyname("postgres")
        except socket.gaierror:
            return raw_url.replace("@postgres:", "@localhost:")

    return raw_url


class Config:
    """Base configuration"""

    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    DEBUG = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    TESTING = False

    # Database
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(
        os.getenv(
            "DATABASE_URL",
            "sqlite:///cursa.db",
        )
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ConnectionPool только для PostgreSQL
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("postgresql"):
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_size": 10,
            "pool_recycle": 3600,
            "pool_pre_ping": True,
        }
    else:
        SQLALCHEMY_ENGINE_OPTIONS = {}

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600))
    )  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 2592000))
    )  # 30 days
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # CORS
    CORS_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    CORS_ALLOW_HEADERS = ["Content-Type", "Authorization"]
    CORS_EXPOSE_HEADERS = ["Content-Type", "Authorization"]
    CORS_SUPPORTS_CREDENTIALS = True

    # File Upload
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
    CORRECTIONS_FOLDER = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "static", "corrections"
    )
    REPORTS_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "reports")

    # Celery
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    # Redis (Auth + Token blacklist)
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Email
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM = os.getenv("SMTP_FROM", "noreply@cursa.dev")
    SMTP_USE_TLS = True

    # SendGrid (preferred)
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
    SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@cursa.app")
    EMAIL_VERIFICATION_REQUIRED = os.getenv("EMAIL_VERIFICATION_REQUIRED", "true").lower() == "true"

    # Rate Limiting
    RATELIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "True").lower() == "true"
    RATELIMIT_STORAGE_URI = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    RATELIMIT_STRATEGY = "fixed-window"

    # Stripe (для v1.5.0)
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    # Yookassa
    YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID", "")
    YOOKASSA_SECRET_KEY = os.getenv("YOOKASSA_SECRET_KEY", "")

    # OAuth2 (для v1.4.0)
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
    YANDEX_CLIENT_ID = os.getenv("YANDEX_CLIENT_ID", "")
    YANDEX_CLIENT_SECRET = os.getenv("YANDEX_CLIENT_SECRET", "")

    # Telegram Bot OAuth (primary login method for Russia)
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "")


class DevelopmentConfig(Config):
    """Development configuration"""

    DEBUG = True
    TESTING = False
    EMAIL_VERIFICATION_REQUIRED = (
        os.getenv("EMAIL_VERIFICATION_REQUIRED", "false").lower() == "true"
    )


class ProductionConfig(Config):
    """Production configuration"""

    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {}  # SQLite doesn't support pool_size, etc.
    JWT_SECRET_KEY = "test-jwt-secret"
    SECRET_KEY = "test-secret-key"


# Configuration dictionary
config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}


def get_config(env: str = None) -> Config:
    """Get configuration based on environment"""
    if env is None:
        env = os.getenv("FLASK_ENV", "development")
    return config.get(env, config["default"])
