"""
Authentication API routes

Endpoints:
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/refresh - Refresh access token
- POST /api/auth/logout - Logout user
- GET /api/auth/me - Get current user
"""

from flask import Blueprint, request, jsonify, redirect, url_for, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from datetime import datetime, timezone
from redis import Redis
from email_validator import validate_email, EmailNotValidError

from app.extensions import db
from app.models import User, UserRole
from app.services.oauth_service import get_oauth_service
from app.services.email_service import EmailService
from app.services.verification_service import VerificationService
from app.services.totp_service import totp_service
from app.security import rate_limit

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _split_full_name(full_name: str):
    if not full_name:
        return None, None
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0], None
    return parts[0], " ".join(parts[1:])


def _get_oauth_service():
    return get_oauth_service(current_app)


def _get_redis_client():
    redis_url = current_app.config.get("REDIS_URL", "redis://localhost:6379/0")
    return Redis.from_url(redis_url)


def _get_current_user_id():
    identity = get_jwt_identity()
    try:
        return int(identity)
    except (TypeError, ValueError):
        return identity


@bp.route("/register", methods=["POST"])
@rate_limit("5 per hour")
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: SecurePassword123
            first_name:
              type: string
              example: John
            last_name:
              type: string
              example: Doe
            organization:
              type: string
              example: University
    responses:
      201:
        description: User registered successfully
      400:
        description: Invalid input
      409:
        description: User already exists
    """
    try:
        data = request.get_json()

        # Валидация входных данных
        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email и password обязательны"}), 400

        email = data["email"].lower().strip()
        password = data["password"]

        # Валидация email
        try:
            valid = validate_email(email)
            email = valid.email
        except EmailNotValidError as e:
            return jsonify({"error": f"Некорректный email: {str(e)}"}), 400

        # Проверка длины пароля
        if len(password) < 8:
            return jsonify({"error": "Пароль должен быть не менее 8 символов"}), 400

        # Проверка существования пользователя
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Пользователь с таким email уже существует"}), 409

        # Создание пользователя
        user = User(
            email=email,
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            organization=data.get("organization"),
            role=UserRole.USER,
            is_active=True,
            is_email_verified=False,  # TODO: Email verification in v1.4.0
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # Отправка письма верификации
        email_verification_sent = False
        try:
            redis_client = _get_redis_client()
            verification_service = VerificationService(storage=redis_client)
            token = verification_service.create_verification_token(user.email, token_type="email")
            email_service = EmailService()
            email_verification_sent = email_service.send_verification_email(user.email, token)
        except Exception:
            # Не блокируем регистрацию, если email сервис недоступен
            email_verification_sent = False

        # Создание токенов
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return jsonify(
            {
                "message": "Пользователь успешно зарегистрирован",
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
                "email_verification_sent": email_verification_sent,
            }
        ), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ошибка регистрации: {str(e)}"}), 500


@bp.route("/login", methods=["POST"])
@rate_limit("10 per hour")
def login():
    """
    Login user
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: SecurePassword123
    responses:
      200:
        description: Login successful
      400:
        description: Invalid input
      401:
        description: Invalid credentials
    """
    try:
        data = request.get_json()

        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email и password обязательны"}), 400

        email = data["email"].lower().strip()
        password = data["password"]

        # Поиск пользователя
        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({"error": "Неверный email или пароль"}), 401

        if not user.is_active:
            return jsonify({"error": "Аккаунт деактивирован"}), 401

        if not user.is_email_verified:
            return jsonify({"error": "Email не подтвержден"}), 401

        # Обновление last_login_at
        user.last_login_at = datetime.now(timezone.utc)
        db.session.commit()

        # Создание токенов
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return jsonify(
            {
                "message": "Успешный вход",
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        ), 200

    except Exception as e:
        return jsonify({"error": f"Ошибка входа: {str(e)}"}), 500


@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Token refreshed successfully
      401:
        description: Invalid refresh token
    """
    try:
            current_user_id = _get_current_user_id()
        access_token = create_access_token(identity=str(current_user_id))

        return jsonify({"access_token": access_token}), 200

    except Exception as e:
        return jsonify({"error": f"Ошибка обновления токена: {str(e)}"}), 500


@bp.route("/logout", methods=["POST"])
@rate_limit("30 per hour")
@jwt_required()
def logout():
    """
    Logout user
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Logout successful
    """
    try:
        jwt_payload = get_jwt()
        jti = jwt_payload.get("jti")
        exp = jwt_payload.get("exp")

        if hasattr(current_app, "token_manager") and current_app.token_manager and jti and exp:
            now_ts = datetime.now(timezone.utc).timestamp()
            expires_in = max(0, int(exp - now_ts))
            current_app.token_manager.revoke_token(jti, expires_in=expires_in)

        return jsonify({"message": "Успешный выход"}), 200
    except Exception as e:
        return jsonify({"error": f"Ошибка выхода: {str(e)}"}), 500


@bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    Get current user information
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: User information
      404:
        description: User not found
    """
    try:
            current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        # Получить текущую подписку
        subscription = user.current_subscription
        subscription_data = subscription.to_dict() if subscription else None

        return jsonify({"user": user.to_dict(), "subscription": subscription_data}), 200

    except Exception as e:
        return jsonify({"error": f"Ошибка получения пользователя: {str(e)}"}), 500


@bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_current_user():
    """
    Update current user information
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            first_name:
              type: string
            last_name:
              type: string
            organization:
              type: string
    responses:
      200:
        description: User updated successfully
      404:
        description: User not found
    """
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        data = request.get_json()

        # Обновление полей
        if "first_name" in data:
            user.first_name = data["first_name"]
        if "last_name" in data:
            user.last_name = data["last_name"]
        if "organization" in data:
            user.organization = data["organization"]

        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        return jsonify({"message": "Профиль обновлён", "user": user.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ошибка обновления: {str(e)}"}), 500


@bp.route("/verify-email", methods=["POST"])
@rate_limit("10 per hour")
def verify_email():
    """
    Verify user email with token
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - token
          properties:
            email:
              type: string
              example: user@example.com
            token:
              type: string
    responses:
      200:
        description: Email verified
      400:
        description: Invalid token
      404:
        description: User not found
    """
    try:
        data = request.get_json()
        if not data or not data.get("email") or not data.get("token"):
            return jsonify({"error": "Email и token обязательны"}), 400

        email = data["email"].lower().strip()
        token = data["token"].strip()

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        redis_client = _get_redis_client()
        verification_service = VerificationService(storage=redis_client)
        is_valid, message = verification_service.verify_email_token(token, email)
        if not is_valid:
            return jsonify({"error": message}), 400

        user.is_email_verified = True
        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        email_service = EmailService()
        email_service.send_welcome_email(user.email, user.full_name)

        return jsonify({"message": "Email подтвержден", "user": user.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ошибка подтверждения: {str(e)}"}), 500


@bp.route("/forgot-password", methods=["POST"])
@rate_limit("3 per hour")
def forgot_password():
    """
    Send password reset email
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
          properties:
            email:
              type: string
              example: user@example.com
    responses:
      200:
        description: Reset email sent
      400:
        description: Invalid input
    """
    try:
        data = request.get_json()
        if not data or not data.get("email"):
            return jsonify({"error": "Email обязателен"}), 400

        email = data["email"].lower().strip()
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({"message": "Если email существует, письмо будет отправлено"}), 200

        redis_client = _get_redis_client()
        verification_service = VerificationService(storage=redis_client)
        token = verification_service.create_verification_token(email, token_type="password_reset")

        email_service = EmailService()
        sent = email_service.send_password_reset_email(email, token)

        return jsonify({"message": "Письмо для сброса пароля отправлено", "sent": sent}), 200

    except Exception as e:
        return jsonify({"error": f"Ошибка отправки: {str(e)}"}), 500


@bp.route("/reset-password", methods=["POST"])
@rate_limit("5 per hour")
def reset_password():
    """
    Reset user password with token
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - token
            - password
          properties:
            email:
              type: string
              example: user@example.com
            token:
              type: string
            password:
              type: string
              example: NewSecurePass123
    responses:
      200:
        description: Password updated
      400:
        description: Invalid token or password
      404:
        description: User not found
    """
    try:
        data = request.get_json()
        if not data or not data.get("email") or not data.get("token") or not data.get("password"):
            return jsonify({"error": "Email, token и password обязательны"}), 400

        email = data["email"].lower().strip()
        token = data["token"].strip()
        password = data["password"]

        if len(password) < 8:
            return jsonify({"error": "Пароль должен быть не менее 8 символов"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        redis_client = _get_redis_client()
        verification_service = VerificationService(storage=redis_client)
        is_valid, message = verification_service.verify_reset_token(token, email)
        if not is_valid:
            return jsonify({"error": message}), 400

        user.set_password(password)
        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        verification_service.consume_reset_token(token)

        return jsonify({"message": "Пароль обновлен"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ошибка сброса: {str(e)}"}), 500


@bp.route("/2fa/setup", methods=["POST"])
@rate_limit("10 per hour")
@jwt_required()
def setup_2fa():
    """
    Initialize 2FA setup for user
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: 2FA setup data
      400:
        description: 2FA already enabled
      404:
        description: User not found
    """
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        if user.totp_enabled:
            return jsonify({"error": "2FA уже включен"}), 400

        secret = totp_service.generate_secret()
        qr_code = totp_service.generate_qr_code(user.email, secret)
        backup_codes = totp_service.generate_backup_codes()

        user.totp_secret = secret
        user.backup_codes = backup_codes
        user.totp_enabled = False
        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        return (
            jsonify({"qr_code": f"data:image/png;base64,{qr_code}", "backup_codes": backup_codes}),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ошибка 2FA setup: {str(e)}"}), 500


@bp.route("/2fa/enable", methods=["POST"])
@rate_limit("10 per hour")
@jwt_required()
def enable_2fa():
    """
    Enable 2FA for user
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: 2FA enabled
      400:
        description: Invalid token
    """
    try:
        data = request.get_json()
        if not data or not data.get("token"):
            return jsonify({"error": "Требуется token"}), 400

        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)
        if not user or not user.totp_secret:
            return jsonify({"error": "2FA не настроен"}), 400

        if not totp_service.verify_token(user.totp_secret, data["token"]):
            return jsonify({"error": "Неверный токен"}), 400

        user.totp_enabled = True
        user.last_2fa_check = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        return jsonify({"message": "2FA включен"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ошибка включения 2FA: {str(e)}"}), 500


@bp.route("/2fa/disable", methods=["POST"])
@rate_limit("10 per hour")
@jwt_required()
def disable_2fa():
    """
    Disable 2FA for user
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: 2FA disabled
      400:
        description: Invalid token
    """
    try:
        data = request.get_json()
        if not data or not data.get("token"):
            return jsonify({"error": "Требуется token"}), 400

        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)
        if not user or not user.totp_enabled:
            return jsonify({"error": "2FA не включен"}), 400

        if not user.verify_2fa_token(data["token"]):
            return jsonify({"error": "Неверный токен"}), 400

        user.disable_2fa()
        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        return jsonify({"message": "2FA отключен"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ошибка отключения 2FA: {str(e)}"}), 500


@bp.route("/2fa/backup-codes", methods=["POST"])
@rate_limit("5 per hour")
@jwt_required()
def regenerate_backup_codes():
    """
    Regenerate 2FA backup codes
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Backup codes regenerated
      400:
        description: Invalid token
    """
    try:
        data = request.get_json()
        if not data or not data.get("token"):
            return jsonify({"error": "Требуется token"}), 400

        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)
        if not user or not user.totp_enabled:
            return jsonify({"error": "2FA не включен"}), 400

        if not user.verify_2fa_token(data["token"]):
            return jsonify({"error": "Неверный токен"}), 400

        backup_codes = totp_service.generate_backup_codes()
        user.backup_codes = backup_codes
        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        return jsonify({"backup_codes": backup_codes}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ошибка генерации backup codes: {str(e)}"}), 500


@bp.route("/oauth/providers", methods=["GET"])
@rate_limit("60 per hour")
def oauth_providers():
    """
    List available OAuth providers
    ---
    tags:
      - Authentication
    responses:
      200:
        description: Providers list
    """
    providers = {
        "google": bool(current_app.config.get("GOOGLE_CLIENT_ID")),
        "github": bool(current_app.config.get("GITHUB_CLIENT_ID")),
        "yandex": bool(current_app.config.get("YANDEX_CLIENT_ID")),
    }
    return jsonify({"providers": providers}), 200


@bp.route("/oauth/<provider>", methods=["GET"])
@rate_limit("20 per hour")
def oauth_login(provider):
    """
    Redirect to OAuth provider
    ---
    tags:
      - Authentication
    parameters:
      - in: path
        name: provider
        type: string
        required: true
    responses:
      302:
        description: Redirect to provider
      400:
        description: Provider not supported
    """
    service = _get_oauth_service()
    if provider not in service.PROVIDERS:
        return jsonify({"error": "Неподдерживаемый OAuth провайдер"}), 400

    client = service.oauth.create_client(provider)
    if not client:
        return jsonify({"error": "OAuth провайдер не настроен"}), 400

    redirect_uri = url_for("auth.oauth_callback", provider=provider, _external=True)
    return client.authorize_redirect(redirect_uri)


@bp.route("/oauth/<provider>/callback", methods=["GET"])
@rate_limit("20 per hour")
def oauth_callback(provider):
    """
    OAuth callback handler
    ---
    tags:
      - Authentication
    parameters:
      - in: path
        name: provider
        type: string
        required: true
    responses:
      200:
        description: OAuth success
      400:
        description: OAuth error
    """
    try:
        service = _get_oauth_service()
        if provider not in service.PROVIDERS:
            return jsonify({"error": "Неподдерживаемый OAuth провайдер"}), 400

        client = service.oauth.create_client(provider)
        if not client:
            return jsonify({"error": "OAuth провайдер не настроен"}), 400

        token = client.authorize_access_token()
        access_token = token.get("access_token")
        if not access_token:
            return jsonify({"error": "Не удалось получить OAuth token"}), 400

        user_info = service.get_user_info(provider, access_token)
        is_valid, message = service.validate_oauth_user(user_info)
        if not is_valid:
            return jsonify({"error": message}), 400

        user = User.query.filter_by(
            oauth_provider=provider, oauth_id=user_info["provider_id"]
        ).first()
        if not user:
            user = User.query.filter_by(email=user_info["email"]).first()

        if not user:
            first_name, last_name = _split_full_name(user_info.get("name", ""))
            user = User(
                email=user_info["email"],
                first_name=first_name,
                last_name=last_name,
                role=UserRole.USER,
                is_active=True,
                is_email_verified=True,
                oauth_provider=provider,
                oauth_id=user_info["provider_id"],
            )
            db.session.add(user)
        else:
            if not user.oauth_provider or not user.oauth_id:
                user.oauth_provider = provider
                user.oauth_id = user_info["provider_id"]
            if not user.is_email_verified:
                user.is_email_verified = True

        user.last_login_at = datetime.now(timezone.utc)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return (
            jsonify(
                {
                    "message": "OAuth вход успешен",
                    "user": user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"OAuth ошибка: {str(e)}"}), 500
