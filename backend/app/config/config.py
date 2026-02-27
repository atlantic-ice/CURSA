import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-prod')

        # JWT Configuration
        JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', '900'))  # 15 min
        JWT_REFRESH_TOKEN_EXPIRES = int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', '2592000'))  # 30 days
        JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
        JWT_TOKEN_LOCATION = ['headers']
        JWT_HEADER_NAME = 'Authorization'
        JWT_HEADER_TYPE = 'Bearer'
        JWT_ERROR_MESSAGE_KEY = 'error'

        # Redis Configuration
        REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

        # Email Configuration (SendGrid)
        SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
        SENDGRID_FROM_EMAIL = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@cursa.app')

        # OAuth2 Configuration
        GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
        GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
        GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID', '')
        GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET', '')
        YANDEX_CLIENT_ID = os.environ.get('YANDEX_CLIENT_ID', '')
        YANDEX_CLIENT_SECRET = os.environ.get('YANDEX_CLIENT_SECRET', '')

        # Security Configuration
        CORS_ORIGINS = [
            'http://localhost:3000',
            'http://localhost:5000',
            'https://cursa.app',
        ]

        # Rate Limiting
        RATELIMIT_ENABLED = os.environ.get('RATELIMIT_ENABLED', 'true').lower() == 'true'
        RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL', 'redis://localhost:6379/1')

        # Session Configuration
        PERMANENT_SESSION_LIFETIME = 2592000  # 30 days
        SESSION_COOKIE_SECURE = True
        SESSION_COOKIE_HTTPONLY = True
        SESSION_COOKIE_SAMESITE = 'Lax'

        # Logging
        LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

    # Uploads
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'app', 'static', 'uploads')

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///dev.db')

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
