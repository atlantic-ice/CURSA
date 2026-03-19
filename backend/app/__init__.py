from flask import Flask, send_from_directory, send_file, jsonify, request, Response
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler
import sys
from app.config.security import (
    MAX_CONTENT_LENGTH,
    SECURITY_HEADERS,
    RATE_LIMITS,
)

# SocketIO instance - глобальный для использования в других модулях
socketio = None


def get_socketio():
    """Получить экземпляр SocketIO"""
    return socketio


def _collect_allowed_origins():
    default_origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    }
    env_origins = os.getenv("FRONTEND_ORIGINS", "")
    for origin in env_origins.split(","):
        cleaned = origin.strip()
        if cleaned:
            default_origins.add(cleaned)
    return sorted(default_origins)


def setup_rate_limiting(app):
    """Настройка rate limiting с graceful degradation для Redis"""
    try:
        from flask_limiter.util import get_remote_address
        from app.security import limiter
        import redis

        limiter.key_func = get_remote_address

        # В тестовом режиме всегда используем memory storage
        if app.config.get("TESTING"):
            storage_uri = "memory://"
            app.config["RATELIMIT_STORAGE_URI"] = storage_uri
            limiter.init_app(app)
            app.limiter = limiter
            return limiter

        # Пробуем использовать Redis, если доступен
        redis_uri = app.config.get("RATELIMIT_STORAGE_URI", "redis://localhost:6379/0")

        # Проверяем доступность Redis
        use_redis = False
        if redis_uri and redis_uri.startswith("redis://"):
            try:
                # Парсим Redis URI
                import re

                redis_match = re.match(r"redis://([^:]+):?(\d+)?/(\d+)", redis_uri)
                if redis_match:
                    host = redis_match.group(1)
                    port = int(redis_match.group(2)) if redis_match.group(2) else 6379
                    db = int(redis_match.group(3))

                    # Пробуем подключиться
                    r = redis.Redis(host=host, port=port, db=db, socket_connect_timeout=1)
                    r.ping()
                    use_redis = True
                    app.logger.info(
                        f"✓ Redis доступен, используется для rate limiting: {redis_uri}"
                    )
            except (redis.ConnectionError, redis.TimeoutError, Exception) as e:
                app.logger.warning(
                    f"⚠️  Redis недоступен ({e}), используется memory storage для rate limiting. "
                    f"Для production запустите Redis: redis-server"
                )

        # Устанавливаем storage URI
        storage_uri = redis_uri if use_redis else "memory://"
        app.config["RATELIMIT_STORAGE_URI"] = storage_uri

        # Инициализируем limiter с выбранным storage
        limiter.init_app(app)
        app.limiter = limiter

        if not use_redis:
            app.logger.info("Rate limiting включен (memory storage)")

        return limiter

    except ImportError as e:
        app.logger.warning(
            f"flask-limiter не установлен ({e}). Rate limiting отключен. "
            "Установите: pip install flask-limiter redis"
        )
        return None
    except Exception as e:
        app.logger.error(f"Ошибка настройки rate limiting: {e}")
        return None


def setup_security_headers(app):
    """Добавляет security headers ко всем ответам"""

    @app.after_request
    def add_security_headers(response: Response) -> Response:
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value
        return response


def setup_error_handlers(app):
    """Регистрирует JSON-обработчики ошибок для API."""

    @app.errorhandler(429)
    def handle_rate_limit_exceeded(error):
        response = jsonify(
            {
                "error": "Слишком много запросов. Повторите попытку позже.",
                "status": 429,
            }
        )
        response.status_code = 429

        retry_after = None
        if hasattr(error, "get_response"):
            original_response = error.get_response()
            retry_after = original_response.headers.get("Retry-After")

        if retry_after:
            response.headers["Retry-After"] = retry_after

        return response


def create_app():
    global socketio

    # Load repository-level .env if present so env vars like PINTEREST_RSS_URL are available
    try:
        repo_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
        if os.path.exists(repo_env):
            load_dotenv(repo_env)
        else:
            # fallback to any default .env on PYTHONPATH
            load_dotenv()
    except Exception:
        # don't fail startup if dotenv isn't available or there's an issue reading the file
        pass

    app = Flask(__name__)

    # Проверяем, запущено ли приложение в тестовом режиме
    is_testing = os.environ.get("FLASK_TESTING") == "1"
    if is_testing:
        app.config["TESTING"] = True

    # === Загрузка конфигурации из config/database.py ===
    from app.config.database import get_config

    config_class = get_config()
    app.config.from_object(config_class)

    # === Инициализация расширений БД ===
    from app.extensions import db, migrate, jwt

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # === JWT blacklist support (TokenManager) ===
    try:
        from redis import Redis, ConnectionError as RedisConnectionError
        from app.services.token_service import TokenManager

        redis_url = app.config.get("REDIS_URL", "redis://localhost:6379/0")

        # Проверяем доступность Redis перед созданием TokenManager
        try:
            redis_client = Redis.from_url(redis_url, socket_connect_timeout=1)
            redis_client.ping()
            app.token_manager = TokenManager(redis_client, app.config)

            @jwt.token_in_blocklist_loader
            def check_if_token_revoked(jwt_header, jwt_payload):
                jti = jwt_payload.get("jti")
                if not jti:
                    return False
                return app.token_manager.is_token_revoked(jti)

            if not is_testing:
                app.logger.info("✓ TokenManager активирован с Redis")

        except (RedisConnectionError, Exception) as e:
            app.token_manager = None
            if not is_testing:
                app.logger.warning(
                    f"⚠️  TokenManager отключен (Redis недоступен): {e}. "
                    "JWT logout/revoke функции не будут работать. "
                    "Для активации запустите: redis-server"
                )

    except ImportError as e:
        app.token_manager = None
        if not is_testing:
            app.logger.warning(f"⚠️  TokenManager отключен (модуль не установлен): {e}")

    # === OAuth2 initialization ===
    from app.services.oauth_service import get_oauth_service

    get_oauth_service(app)

    # Импорт моделей для миграций (важно после инициализации db)
    from app.models import User, Subscription, Document, APIKey

    if not is_testing:
        app.logger.info("База данных инициализирована")

    # === Конфигурация безопасности ===
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    # Настройка CORS с правильными параметрами
    cors_origins = _collect_allowed_origins()
    CORS(
        app,
        origins=cors_origins,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True,
    )

    # === Инициализация SocketIO для WebSocket ===
    try:
        from flask_socketio import SocketIO

        socketio = SocketIO(
            app,
            cors_allowed_origins=cors_origins,
            async_mode="eventlet",
            logger=not is_testing,
            engineio_logger=False,
        )
        if not is_testing:
            app.logger.info("WebSocket (SocketIO) инициализирован")

        # Инициализируем ProgressEmitter
        from app.websocket import init_socketio

        init_socketio(socketio)
    except ImportError:
        if not is_testing:
            app.logger.warning(
                "flask-socketio не установлен. WebSocket недоступен. "
                "Установите: pip install flask-socketio eventlet"
            )
        socketio = None
    except Exception as e:
        if not is_testing:
            app.logger.warning(f"Не удалось инициализировать SocketIO: {e}")
        socketio = None

    # Настройка логгирования (отключено в тестовом режиме)
    setup_logging(app)
    if not is_testing:
        app.logger.info("CORS origins: %s", cors_origins)

    # === Security Headers ===
    setup_security_headers(app)
    setup_error_handlers(app)

    # === Rate Limiting ===
    setup_rate_limiting(app)

    # Директория для исправленных файлов
    corrections_dir = os.path.join(app.root_path, "static", "corrections")
    os.makedirs(corrections_dir, exist_ok=True)
    if not is_testing:
        app.logger.info(f"Директория для исправленных файлов: {corrections_dir}")

    # Подключаем Swagger документацию (если flasgger установлен)
    try:
        from flasgger import Swagger
        from app.api.swagger_config import SWAGGER_CONFIG, SWAGGER_TEMPLATE

        Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)
        if not is_testing:
            app.logger.info("Swagger UI доступен по адресу /api/docs/")
    except ImportError:
        if not is_testing:
            app.logger.warning(
                "flasgger не установлен. Swagger UI недоступен. Установите: pip install flasgger"
            )
    except Exception as e:
        if not is_testing:
            app.logger.warning(f"Не удалось инициализировать Swagger: {e}")

    # Регистрация API маршрутов
    from app.api import document_routes
    from app.api import profile_routes
    from app.api import health_routes
    from app.api import preview_routes
    from app.api import auth_routes
    from app.api import validation_routes

    app.register_blueprint(document_routes.bp)
    app.register_blueprint(profile_routes.bp)
    app.register_blueprint(health_routes.bp)
    app.register_blueprint(preview_routes.bp)
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(validation_routes.validation_bp)

    # Маршрут для API документации (JSON)
    @app.route("/api/openapi.json")
    def openapi_spec():
        """Возвращает OpenAPI спецификацию в формате JSON"""
        from app.api.swagger_config import SWAGGER_TEMPLATE

        return jsonify(SWAGGER_TEMPLATE)

    # Маршрут для прямого доступа к исправленным файлам
    @app.route("/corrections/<path:filename>")
    def serve_correction(filename):
        app.logger.info(f"Запрос на скачивание файла: {filename}")
        file_path = os.path.join(corrections_dir, filename)
        if not os.path.exists(file_path):
            app.logger.error(f"Файл не найден: {file_path}")
            return "File not found", 404

        # Используем send_file с правильным MIME-типом для docx
        return send_file(
            file_path,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            as_attachment=True,
            download_name=filename,
        )

    return app


def setup_logging(app):
    """Настройка логирования приложения"""
    # Если приложение в тестовом режиме, минимизируем логирование
    if app.config.get("TESTING"):
        app.logger.handlers = []
        app.logger.setLevel(logging.ERROR)
        # Добавляем только NullHandler чтобы избежать ошибок
        app.logger.addHandler(logging.NullHandler())
        return

    log_dir = os.path.join(app.root_path, "logs")
    os.makedirs(log_dir, exist_ok=True)

    # Создаем форматтер для логов
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s в %(module)s: %(message)s")

    # Настройка логирования в файл с UTF-8
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, "app.log"),
        maxBytes=10485760,  # 10MB
        backupCount=10,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    # Настройка логирования в консоль с UTF-8
    import io

    console_handler = logging.StreamHandler(
        io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)
    )
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)

    # Сначала очищаем существующие обработчики (если есть), затем добавляем наши
    app.logger.handlers = []
    app.logger.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)

    app.logger.info("Логирование настроено")
