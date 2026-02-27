"""
Authentication API routes

Endpoints:
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/refresh - Refresh access token
- POST /api/auth/logout - Logout user
- GET /api/auth/me - Get current user
- POST /api/auth/verify-email - Verify email
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password
- POST /api/auth/2fa/setup - Setup 2FA
- POST /api/auth/2fa/enable - Enable 2FA
- POST /api/auth/2fa/disable - Disable 2FA
- POST /api/auth/2fa/backup-codes - Regenerate backup codes
- GET /api/auth/oauth/providers - Get OAuth providers
- POST /api/auth/oauth/<provider> - Login with OAuth
- GET /api/auth/oauth/<provider>/callback - OAuth callback
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from datetime import datetime, timezone, timedelta
from redis import Redis
from email_validator import validate_email, EmailNotValidError
import logging

from app.extensions import db
from app.models import User, UserRole
from app.services.oauth_service import get_oauth_service
from app.services.email_service import EmailService
from app.services.verification_service import VerificationService
from app.services.totp_service import totp_service
from app.security import rate_limit

logger = logging.getLogger(__name__)
bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ============ Helpers ============


def _split_full_name(full_name: str):
    """Parse full name into first and last names"""
    if not full_name:
        return None, None
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0], None
    return parts[0], " ".join(parts[1:])


def _get_oauth_service():
    """Get OAuth service instance"""
    return get_oauth_service(current_app)


def _get_redis_client():
    """Get Redis client for token storage"""
    redis_url = current_app.config.get("REDIS_URL", "redis://localhost:6379/0")
    return Redis.from_url(redis_url)


def _get_current_user_id():
    """Get user ID from JWT, normalized to int"""
    identity = get_jwt_identity()
    try:
        return int(identity)
    except (TypeError, ValueError):
        return identity


# ============ Register ============


@bp.route("/register", methods=["POST"])
@rate_limit("5 per hour")
def register():
    """Register new user with email and password"""
    try:
        data = request.get_json()

        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email и password обязательны"}), 400

        email = data["email"].lower().strip()
        password = data["password"]

        # Validate email
        try:
            valid = validate_email(email)
            email = valid.normalized
        except EmailNotValidError as e:
            return jsonify({"error": f"Некорректный email: {str(e)}"}), 400

        # Validate password length
        if len(password) < 8:
            return jsonify({"error": "Пароль должен быть не менее 8 символов"}), 400

        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Пользователь с таким email уже существует"}), 409

        # Create user
        first_name, last_name = _split_full_name(data.get("full_name", ""))
        user = User(
            email=email,
            first_name=first_name or data.get("first_name"),
            last_name=last_name or data.get("last_name"),
            organization=data.get("organization"),
            role=UserRole.USER,
            is_active=True,
            is_email_verified=False,
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # Send verification email
        email_sent = False
        try:
            redis_client = _get_redis_client()
            verification_service = VerificationService(storage=redis_client)
            token = verification_service.create_verification_token(user.email, token_type="email")
            email_service = EmailService()
            email_sent = email_service.send_verification_email(user.email, token)
        except Exception as e:
            logger.warning(f"Failed to send verification email: {e}")

        # Create tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return (
            jsonify(
                {
                    "message": "Пользователь успешно зарегистрирован",
                    "user": user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "email_verification_sent": email_sent,
                }
            ),
            201,
        )

    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({"error": f"Ошибка регистрации: {str(e)}"}), 500


# ============ Login ============


@bp.route("/login", methods=["POST"])
@rate_limit("10 per hour")
def login():
    """Login user with email and password"""
    try:
        data = request.get_json()

        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email и password обязательны"}), 400

        email = data["email"].lower().strip()
        password = data["password"]

        # Find user
        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({"error": "Неверный email или пароль"}), 401

        if not user.is_active:
            return jsonify({"error": "Аккаунт деактивирован"}), 401

        if not user.is_email_verified:
            return jsonify({"error": "Email не подтвержден"}), 401

        # Check 2FA if enabled
        requires_2fa = user.totp_enabled if hasattr(user, "totp_enabled") else False
        if requires_2fa and not data.get("totp_token"):
            return jsonify({"error": "Требуется 2FA код", "requires_2fa": True}), 401

        if requires_2fa:
            if not user.verify_2fa_token(data.get("totp_token")):
                return jsonify({"error": "Неверный 2FA код"}), 401

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        db.session.commit()

        # Create tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return (
            jsonify(
                {
                    "message": "Успешный вход",
                    "user": user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"error": f"Ошибка входа: {str(e)}"}), 500


# ============ Refresh Token ============


@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
@rate_limit("30 per hour")
def refresh():
    """Refresh access token"""
    try:
        current_user_id = _get_current_user_id()
        access_token = create_access_token(identity=str(current_user_id))

        return jsonify({"access_token": access_token}), 200

    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return jsonify({"error": f"Ошибка обновления токена: {str(e)}"}), 500


# ============ Logout ============


@bp.route("/logout", methods=["POST"])
@jwt_required()
@rate_limit("30 per hour")
def logout():
    """Logout user (revoke token)"""
    try:
        token = get_jwt()
        jti = token.get("jti")

        if jti and hasattr(current_app, "token_manager"):
            exp = token.get("exp")
            current_app.token_manager.revoke_token(jti, exp)

        return jsonify({"message": "Успешный выход"}), 200

    except Exception as e:
        logger.error(f"Logout error: {e}")
        return jsonify({"error": f"Ошибка выхода: {str(e)}"}), 500


# ============ Get Current User ============


@bp.route("/me", methods=["GET"])
@jwt_required()
@rate_limit("100 per hour")
def get_current_user():
    """Get current authenticated user"""
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        subscription = user.current_subscription if hasattr(user, "current_subscription") else None
        subscription_data = subscription.to_dict() if subscription else None

        return jsonify({"user": user.to_dict(), "subscription": subscription_data}), 200

    except Exception as e:
        logger.error(f"Get user error: {e}")
        return jsonify({"error": f"Ошибка получения данных: {str(e)}"}), 500


# ============ Email Verification ============


@bp.route("/verify-email", methods=["POST"])
@rate_limit("10 per hour")
def verify_email():
    """Verify email with token"""
    try:
        data = request.get_json()

        if not data or not data.get("email") or not data.get("token"):
            return jsonify({"error": "Email и token обязательны"}), 400

        email = data["email"].lower().strip()
        token = data["token"]

        redis_client = _get_redis_client()
        verification_service = VerificationService(storage=redis_client)

        is_valid, message = verification_service.verify_email_token(token, email)

        if not is_valid:
            return jsonify({"error": message or "Неверный или истекший токен"}), 400

        user = User.query.filter_by(email=email).first()
        if user:
            user.is_email_verified = True
            db.session.commit()

        return (
            jsonify({"message": "Email подтвержден", "user": user.to_dict() if user else None}),
            200,
        )

    except Exception as e:
        logger.error(f"Email verification error: {e}")
        return jsonify({"error": f"Ошибка верификации: {str(e)}"}), 500


# ============ Password Reset ============


@bp.route("/forgot-password", methods=["POST"])
@rate_limit("3 per hour")
def forgot_password():
    """Request password reset"""
    try:
        data = request.get_json()

        if not data or not data.get("email"):
            return jsonify({"error": "Email обязателен"}), 400

        email = data["email"].lower().strip()
        user = User.query.filter_by(email=email).first()

        redis_client = _get_redis_client()
        verification_service = VerificationService(storage=redis_client)
        token = verification_service.create_verification_token(email, token_type="password_reset")

        email_sent = False
        if user:
            try:
                email_service = EmailService()
                email_sent = email_service.send_password_reset_email(email, token)
            except Exception as e:
                logger.warning(f"Failed to send reset email: {e}")

        # Don't reveal if user exists
        return (
            jsonify(
                {"message": "Если email существует, письмо будет отправлено", "sent": email_sent}
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return jsonify({"error": f"Ошибка: {str(e)}"}), 500


@bp.route("/reset-password", methods=["POST"])
@rate_limit("5 per hour")
def reset_password():
    """Reset password with token"""
    try:
        data = request.get_json()

        if not data or not all(data.get(k) for k in ["email", "token", "password"]):
            return jsonify({"error": "Email, token и password обязательны"}), 400

        email = data["email"].lower().strip()
        token = data["token"]
        password = data["password"]

        if len(password) < 8:
            return jsonify({"error": "Пароль должен быть не менее 8 символов"}), 400

        redis_client = _get_redis_client()
        verification_service = VerificationService(storage=redis_client)

        is_valid, message = verification_service.verify_reset_token(token, email)

        if not is_valid:
            return jsonify({"error": message or "Неверный или истекший токен"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        user.set_password(password)
        db.session.commit()

        return jsonify({"message": "Пароль успешно изменен"}), 200

    except Exception as e:
        logger.error(f"Reset password error: {e}")
        return jsonify({"error": f"Ошибка сброса пароля: {str(e)}"}), 500


# ============ 2FA Setup ============


@bp.route("/2fa/setup", methods=["POST"])
@jwt_required()
@rate_limit("5 per hour")
def setup_2fa():
    """Setup 2FA - get QR code"""
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        secret, qr_code = totp_service.generate_qr_code(user.email)

        return jsonify({"secret": secret, "qr_code": f"data:image/png;base64,{qr_code}"}), 200

    except Exception as e:
        logger.error(f"2FA setup error: {e}")
        return jsonify({"error": f"Ошибка настройки 2FA: {str(e)}"}), 500


@bp.route("/2fa/enable", methods=["POST"])
@jwt_required()
@rate_limit("5 per hour")
def enable_2fa():
    """Enable 2FA with verification"""
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        data = request.get_json()
        if not data or not data.get("secret") or not data.get("token"):
            return jsonify({"error": "Secret и token обязательны"}), 400

        if not totp_service.verify_token(data["secret"], data["token"]):
            return jsonify({"error": "Неверный код 2FA"}), 400

        backup_codes = user.enable_2fa(data["secret"])
        db.session.commit()

        return jsonify({"message": "2FA включена", "backup_codes": backup_codes}), 200

    except Exception as e:
        logger.error(f"Enable 2FA error: {e}")
        return jsonify({"error": f"Ошибка включения 2FA: {str(e)}"}), 500


@bp.route("/2fa/disable", methods=["POST"])
@jwt_required()
@rate_limit("5 per hour")
def disable_2fa():
    """Disable 2FA"""
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        user.disable_2fa()
        db.session.commit()

        return jsonify({"message": "2FA отключена"}), 200

    except Exception as e:
        logger.error(f"Disable 2FA error: {e}")
        return jsonify({"error": f"Ошибка отключения 2FA: {str(e)}"}), 500


@bp.route("/2fa/backup-codes", methods=["POST"])
@jwt_required()
@rate_limit("5 per hour")
def regenerate_backup_codes():
    """Regenerate 2FA backup codes"""
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"error": "Пользователь not найден"}), 404

        if not user.totp_enabled:
            return jsonify({"error": "2FA не включена"}), 400

        backup_codes = user.regenerate_backup_codes()
        db.session.commit()

        return jsonify({"backup_codes": backup_codes}), 200

    except Exception as e:
        logger.error(f"Regenerate codes error: {e}")
        return jsonify({"error": f"Ошибка: {str(e)}"}), 500


# ============ OAuth ============


@bp.route("/oauth/providers", methods=["GET"])
@rate_limit("60 per hour")
def oauth_providers():
    """Get available OAuth providers"""
    try:
        return jsonify({"providers": ["google", "github", "yandex"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/oauth/<provider>", methods=["POST"])
@rate_limit("20 per hour")
def oauth_login(provider):
    """Login with OAuth provider"""
    try:
        oauth_service = _get_oauth_service()
        auth_url = oauth_service.get_authorization_url(provider)
        return jsonify({"auth_url": auth_url}), 200
    except Exception as e:
        logger.error(f"OAuth login error: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/oauth/<provider>/callback", methods=["POST"])
@rate_limit("20 per hour")
def oauth_callback(provider):
    """OAuth provider callback"""
    try:
        data = request.get_json()
        code = data.get("code")

        if not code:
            return jsonify({"error": "Auth code required"}), 400

        oauth_service = _get_oauth_service()
        user_info = oauth_service.exchange_code_for_token(provider, code)

        if not user_info:
            return jsonify({"error": "Failed to get user info"}), 400

        email = user_info.get("email")
        user = User.query.filter_by(email=email).first()

        if not user:
            user = User(
                email=email,
                first_name=user_info.get("given_name"),
                last_name=user_info.get("family_name"),
                oauth_provider=provider,
                oauth_id=user_info.get("sub"),
                is_email_verified=True,
                is_active=True,
            )
            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return (
            jsonify(
                {
                    "user": user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        return jsonify({"error": str(e)}), 500
