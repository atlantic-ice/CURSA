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

from flask import (
    Blueprint,
    request,
    jsonify,
    current_app,
    redirect,
    make_response,
)
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
import logging
import requests
import os
import hashlib
import hmac
from urllib.parse import urlencode

from app.extensions import db
from app.models import User, UserRole
from app.services.oauth_service import get_oauth_service
from app.services.email_service import EmailService
from app.services.verification_service import VerificationService
from app.services.totp_service import totp_service
from app.security import rate_limit
from app.api import oauth_routes as oauth_api

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


def _is_email_verification_required() -> bool:
    """Return whether email verification must be enforced for password login."""
    return bool(current_app.config.get("EMAIL_VERIFICATION_REQUIRED", True))


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

        # In local development we allow password auth even without mail delivery.
        if not _is_email_verification_required() and not user.is_email_verified:
            user.is_email_verified = True
            db.session.commit()

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
                    "email_verification_required": _is_email_verification_required(),
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
            if _is_email_verification_required():
                return jsonify({"error": "Email не подтвержден"}), 401

            # Dev fallback for legacy accounts created before EMAIL_VERIFICATION_REQUIRED=false.
            user.is_email_verified = True
            db.session.commit()
            logger.warning(
                "Email verification skipped for %s because EMAIL_VERIFICATION_REQUIRED=false",
                user.email,
            )

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


@bp.route("/me", methods=["PUT"])
@jwt_required()
@rate_limit("30 per hour")
def update_profile():
    """Update current user profile fields"""
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "Нет данных"}), 400

        if "first_name" in data:
            user.first_name = data["first_name"].strip()[:100] if data["first_name"] else None
        if "last_name" in data:
            user.last_name = data["last_name"].strip()[:100] if data["last_name"] else None
        if "organization" in data:
            user.organization = data["organization"].strip()[:255] if data["organization"] else None

        db.session.commit()
        return jsonify({"user": user.to_dict(), "message": "Профиль обновлён"}), 200
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        return jsonify({"error": f"Ошибка обновления: {str(e)}"}), 500


@bp.route("/change-password", methods=["POST"])
@jwt_required()
@rate_limit("10 per hour")
def change_password():
    """Change user password (supports OAuth users setting a password)"""
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "Нет данных"}), 400

        new_password = data.get("new_password", "")
        old_password = data.get("old_password", "")

        if not new_password or len(new_password) < 8:
            return jsonify({"error": "Пароль должен быть не менее 8 символов"}), 400

        if user.password_hash:
            if not old_password:
                return jsonify({"error": "Укажите текущий пароль"}), 400
            if not user.check_password(old_password):
                return jsonify({"error": "Неверный текущий пароль"}), 400

        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": "Пароль успешно изменён"}), 200
    except Exception as e:
        logger.error(f"Change password error: {e}")
        return jsonify({"error": f"Ошибка смены пароля: {str(e)}"}), 500


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


@bp.route("/delete-account", methods=["DELETE"])
@jwt_required()
@rate_limit("3 per hour")
def delete_account():
    """Permanently delete the authenticated user account and all associated data."""
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        db.session.delete(user)
        db.session.commit()

        logger.info(f"Account deleted: user_id={current_user_id}")
        return jsonify({"message": "Аккаунт удалён"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete account error: {e}")
        return jsonify({"error": f"Ошибка удаления аккаунта: {str(e)}"}), 500


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


# ============ Resend Email Verification ============


@bp.route("/resend-verification", methods=["POST"])
@jwt_required()
@rate_limit("5 per hour")
def resend_verification():
    """Resend email verification letter to the current user"""
    try:
        current_user_id = _get_current_user_id()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        if user.is_email_verified:
            return jsonify({"error": "Email уже подтверждён"}), 400

        redis_client = _get_redis_client()
        verification_service = VerificationService(storage=redis_client)
        token = verification_service.create_verification_token(user.email, token_type="email")
        email_service = EmailService()
        sent = email_service.send_verification_email(user.email, token)

        if not sent:
            return jsonify({"error": "Не удалось отправить письмо. Попробуйте позже."}), 503

        return jsonify({"message": "Письмо отправлено"}), 200
    except Exception as e:
        logger.error(f"Resend verification error: {e}")
        return jsonify({"error": f"Ошибка: {str(e)}"}), 500


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

        # Generate secret and QR code
        secret = totp_service.generate_secret()
        qr_code = totp_service.generate_qr_code(user.email, secret)

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
        return jsonify({"providers": ["telegram", "yandex"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/telegram/start", methods=["GET"])
@rate_limit("30 per hour")
def telegram_start():
    """Render Telegram Login Widget page and start Telegram auth flow."""
    try:
        bot_username = _resolve_telegram_bot_username()
        if not bot_username:
            return (
                jsonify(
                    {
                        "error": "Telegram not configured",
                        "message": "Set TELEGRAM_BOT_TOKEN (and optionally TELEGRAM_BOT_USERNAME)",
                    }
                ),
                503,
            )

        redirect_uri = request.args.get(
            "redirect_uri", "http://localhost:3000/auth/telegram/callback"
        )
        callback_base = request.host_url.rstrip("/")
        auth_url = (
            f"{callback_base}/api/auth/telegram/callback?"
            f"{urlencode({'redirect_uri': redirect_uri})}"
        )

        html = f"""
<!doctype html>
<html lang=\"ru\">
    <head>
        <meta charset=\"utf-8\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
        <title>Вход через Telegram</title>
        <style>
            body {{
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                background: #0f1115;
                color: #f3f4f6;
                font-family: Arial, sans-serif;
            }}
            .card {{
                padding: 24px;
                border: 1px solid #1f2937;
                border-radius: 12px;
                background: #111827;
                text-align: center;
                width: min(92vw, 420px);
            }}
            p {{ color: #9ca3af; }}
        </style>
    </head>
    <body>
        <div class=\"card\">
            <h2>Вход через Telegram</h2>
            <p>Нажмите кнопку ниже для авторизации.</p>
            <script async src=\"https://telegram.org/js/telegram-widget.js?22\"
                data-telegram-login=\"{bot_username}\"
                data-size=\"large\"
                data-auth-url=\"{auth_url}\"
                data-request-access=\"write\">
            </script>
        </div>
    </body>
</html>
"""

        response = make_response(html, 200)
        response.headers["Content-Type"] = "text/html; charset=utf-8"
        return response
    except Exception as e:
        logger.error(f"Telegram start error: {e}")
        return jsonify({"error": "Failed to start Telegram auth", "message": str(e)}), 500


@bp.route("/telegram/callback", methods=["GET"])
@rate_limit("60 per hour")
def telegram_callback():
    """Handle Telegram Login Widget callback, verify signature, issue tokens, redirect to frontend."""
    try:
        redirect_uri = request.args.get(
            "redirect_uri", "http://localhost:3000/auth/telegram/callback"
        )
        telegram_data = {
            "id": request.args.get("id"),
            "first_name": request.args.get("first_name"),
            "last_name": request.args.get("last_name"),
            "username": request.args.get("username"),
            "photo_url": request.args.get("photo_url"),
            "auth_date": request.args.get("auth_date"),
            "hash": request.args.get("hash"),
        }

        if not telegram_data["id"] or not telegram_data["auth_date"] or not telegram_data["hash"]:
            return redirect(f"{redirect_uri}?error=missing_telegram_data")

        if not _verify_telegram_signature(telegram_data):
            return redirect(f"{redirect_uri}?error=invalid_telegram_signature")

        user, is_new_user = _find_or_create_user_from_telegram(telegram_data)
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        fragment = urlencode(
            {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user_id": user.id,
                "email": user.email,
                "first_name": user.first_name or "",
                "is_new_user": str(is_new_user).lower(),
            }
        )
        return redirect(f"{redirect_uri}#{fragment}")
    except Exception as e:
        logger.error(f"Telegram callback error: {e}")
        fallback_redirect = request.args.get(
            "redirect_uri", "http://localhost:3000/auth/telegram/callback"
        )
        return redirect(f"{fallback_redirect}?error=telegram_auth_failed")


@bp.route("/oauth/<provider>", methods=["POST"])
@rate_limit("20 per hour")
def oauth_login(provider):
    """Login with OAuth provider"""
    try:
        oauth_service = _get_oauth_service()
        auth_result = oauth_service.get_authorize_url(provider)
        auth_url = auth_result[0] if isinstance(auth_result, tuple) else auth_result
        return jsonify({"auth_url": auth_url}), 200
    except Exception as e:
        logger.error(f"OAuth login error: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/oauth/<provider>/callback", methods=["POST"])
@rate_limit("20 per hour")
def oauth_callback(provider):
    """OAuth provider callback"""
    try:
        provider = (provider or "").lower().strip()
        if provider not in {"google", "github", "yandex"}:
            return jsonify({"error": "Unsupported OAuth provider"}), 400

        data = request.get_json()
        code = data.get("code") if data else None

        if not code:
            return jsonify({"error": "Missing authorization code"}), 400

        provider_keys = {
            "google": ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
            "github": ("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"),
            "yandex": ("YANDEX_CLIENT_ID", "YANDEX_CLIENT_SECRET"),
        }
        key_id, key_secret = provider_keys[provider]
        if not current_app.config.get(key_id) or not current_app.config.get(key_secret):
            return jsonify({"error": "OAuth not configured"}), 503

        if provider == "google":
            token = oauth_api._exchange_google_code_for_token(code)
            if not token:
                return jsonify({"error": "Invalid authorization code"}), 400
            user_info = oauth_api._get_google_user_info(token["access_token"])
            if not user_info:
                return jsonify({"error": "Failed to retrieve user info"}), 400
            user, is_new_user = oauth_api._find_or_create_user_from_google(user_info)

        elif provider == "github":
            token = oauth_api._exchange_github_code_for_token(code)
            if not token:
                return jsonify({"error": "Invalid authorization code"}), 400
            user_info = oauth_api._get_github_user_info(token["access_token"])
            if not user_info:
                return jsonify({"error": "Failed to retrieve user info"}), 400

            user_email = user_info.get("email")
            if not user_email:
                user_email = oauth_api._get_github_user_email(token["access_token"])
            if not user_email:
                return jsonify({"error": "Unable to get email from GitHub"}), 400

            user, is_new_user = oauth_api._find_or_create_user_from_github(user_info, user_email)

        else:  # yandex
            token = oauth_api._exchange_yandex_code_for_token(code)
            if not token:
                return jsonify({"error": "Invalid authorization code"}), 400
            user_info = oauth_api._get_yandex_user_info(token["access_token"])
            if not user_info:
                return jsonify({"error": "Failed to retrieve user info"}), 400
            user, is_new_user = oauth_api._find_or_create_user_from_yandex(user_info)

        access_token, refresh_token = oauth_api._generate_tokens(user)
        oauth_api._send_welcome_email_if_new(user, is_new_user)

        return (
            jsonify(
                {
                    "success": True,
                    "user": user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "user_id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "is_new_user": is_new_user,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        return jsonify({"error": "Authentication failed", "message": str(e)}), 500


def _verify_telegram_signature(telegram_data: dict) -> bool:
    """Validate Telegram Login Widget payload signature."""
    bot_token = current_app.config.get("TELEGRAM_BOT_TOKEN") or os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        return False

    received_hash = telegram_data.get("hash", "")
    if not received_hash:
        return False

    check_pairs = []
    for key in ["auth_date", "first_name", "id", "last_name", "photo_url", "username"]:
        value = telegram_data.get(key)
        if value is not None and value != "":
            check_pairs.append(f"{key}={value}")
    data_check_string = "\n".join(sorted(check_pairs))

    secret_key = hashlib.sha256(bot_token.encode("utf-8")).digest()
    computed_hash = hmac.new(
        secret_key, data_check_string.encode("utf-8"), hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(computed_hash, received_hash)


def _resolve_telegram_bot_username() -> str | None:
    """Resolve bot username from config/env or via Telegram getMe API."""
    username = current_app.config.get("TELEGRAM_BOT_USERNAME") or os.getenv("TELEGRAM_BOT_USERNAME")
    if username:
        return username.lstrip("@").strip()

    bot_token = current_app.config.get("TELEGRAM_BOT_TOKEN") or os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        return None

    try:
        response = requests.get(f"https://api.telegram.org/bot{bot_token}/getMe", timeout=10)
        if response.status_code != 200:
            return None
        payload = response.json()
        if not payload.get("ok"):
            return None
        user = payload.get("result") or {}
        resolved = (user.get("username") or "").strip()
        return resolved or None
    except Exception:
        return None


def _find_or_create_user_from_telegram(telegram_user: dict) -> tuple[User, bool]:
    """Find existing user or create new one from Telegram user data."""
    oauth_id = str(telegram_user.get("id"))
    user = User.query.filter_by(oauth_provider="telegram", oauth_id=oauth_id).first()
    if user:
        if telegram_user.get("first_name"):
            user.first_name = telegram_user.get("first_name")
        if telegram_user.get("last_name"):
            user.last_name = telegram_user.get("last_name")
        user.is_email_verified = True
        db.session.commit()
        return user, False

    username = (telegram_user.get("username") or "").strip().lower()
    email = f"tg_{username}@telegram.local" if username else f"tg_{oauth_id}@telegram.local"

    # If synthetic email already exists, attach telegram identity to that user.
    existing_by_email = User.query.filter_by(email=email).first()
    if existing_by_email:
        existing_by_email.oauth_provider = "telegram"
        existing_by_email.oauth_id = oauth_id
        existing_by_email.is_email_verified = True
        if telegram_user.get("first_name"):
            existing_by_email.first_name = telegram_user.get("first_name")
        if telegram_user.get("last_name"):
            existing_by_email.last_name = telegram_user.get("last_name")
        db.session.commit()
        return existing_by_email, False

    user = User(
        email=email,
        first_name=telegram_user.get("first_name", ""),
        last_name=telegram_user.get("last_name", ""),
        is_email_verified=True,
        oauth_provider="telegram",
        oauth_id=oauth_id,
        role=UserRole.USER,
        is_active=True,
    )

    db.session.add(user)
    db.session.commit()
    return user, True
