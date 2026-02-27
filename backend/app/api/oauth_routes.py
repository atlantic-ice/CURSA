"""OAuth2 Google Authentication Routes

Provides OAuth2 endpoints for Google Sign-In integration.
Allows users to register/login using their Google account.
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timezone
import requests
import logging
from app.extensions import db
from app.models.user import User, UserRole
from app.services.token_service import TokenManager
from functools import wraps

logger = logging.getLogger(__name__)

oauth_bp = Blueprint("oauth", __name__, url_prefix="/api/auth/oauth")


def require_config(*keys):
    """Decorator: Check if OAuth config keys are set"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            for key in keys:
                if not current_app.config.get(key):
                    return (
                        jsonify(
                            {
                                "error": "OAuth not configured",
                                "message": f"Missing {key} configuration",
                            }
                        ),
                        503,
                    )
            return f(*args, **kwargs)

        return decorated_function

    return decorator


@oauth_bp.route("/google/callback", methods=["POST"])
@require_config("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")
def google_callback():
    """
    Handle Google OAuth2 callback.

    Expected request body:
    {
        "code": "authorization_code_from_google"
    }

    Returns JWT tokens on success:
    {
        "access_token": "...",
        "refresh_token": "...",
        "user_id": 123,
        "email": "user@gmail.com"
    }
    """
    try:
        data = request.get_json()
        code = data.get("code")

        if not code:
            return jsonify({"error": "Missing authorization code"}), 400

        # Exchange code for access token with Google
        google_token = _exchange_google_code_for_token(code)
        if not google_token:
            return jsonify({"error": "Invalid authorization code"}), 400

        # Get user info from Google
        google_user = _get_google_user_info(google_token["access_token"])
        if not google_user:
            return jsonify({"error": "Failed to retrieve user info"}), 400

        # Find or create user in database
        user = _find_or_create_user_from_google(google_user)

        # Generate JWT tokens
        token_manager = TokenManager(redis_client=current_app.redis, config=current_app.config)
        access_token, refresh_token = token_manager.create_tokens(user_id=user.id, email=user.email)

        logger.info(f"✓ User {user.email} authenticated via Google OAuth")

        return (
            jsonify(
                {
                    "success": True,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "user_id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "role": user.role.value,
                    "is_new_user": user.created_at.replace(tzinfo=timezone.utc)
                    == datetime.now(timezone.utc).replace(tzinfo=timezone.utc),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"✗ Google OAuth error: {str(e)}")
        return jsonify({"error": "Authentication failed", "message": str(e)}), 500


@oauth_bp.route("/github/callback", methods=["POST"])
@require_config("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
def github_callback():
    """
    Handle GitHub OAuth2 callback.
    Similar to Google but uses GitHub API.
    """
    try:
        data = request.get_json()
        code = data.get("code")

        if not code:
            return jsonify({"error": "Missing authorization code"}), 400

        # Exchange code for access token with GitHub
        github_token = _exchange_github_code_for_token(code)
        if not github_token:
            return jsonify({"error": "Invalid authorization code"}), 400

        # Get user info from GitHub
        github_user = _get_github_user_info(github_token["access_token"])
        if not github_user:
            return jsonify({"error": "Failed to retrieve user info"}), 400

        # Ensure we have primary email from GitHub
        user_email = github_user.get("email")
        if not user_email:
            # GitHub doesn't always return email in main response
            user_email = _get_github_user_email(github_token["access_token"])

        if not user_email:
            return jsonify({"error": "Unable to get email from GitHub"}), 400

        # Find or create user
        user = _find_or_create_user_from_github(github_user, user_email)

        # Generate JWT tokens
        token_manager = TokenManager(redis_client=current_app.redis, config=current_app.config)
        access_token, refresh_token = token_manager.create_tokens(user_id=user.id, email=user.email)

        logger.info(f"✓ User {user.email} authenticated via GitHub OAuth")

        return (
            jsonify(
                {
                    "success": True,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "user_id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"✗ GitHub OAuth error: {str(e)}")
        return jsonify({"error": "Authentication failed", "message": str(e)}), 500


@oauth_bp.route("/yandex/callback", methods=["POST"])
@require_config("YANDEX_CLIENT_ID", "YANDEX_CLIENT_SECRET")
def yandex_callback():
    """
    Handle Yandex OAuth2 callback.
    Similar to Google but uses Yandex API.
    """
    try:
        data = request.get_json()
        code = data.get("code")

        if not code:
            return jsonify({"error": "Missing authorization code"}), 400

        # Exchange code for access token with Yandex
        yandex_token = _exchange_yandex_code_for_token(code)
        if not yandex_token:
            return jsonify({"error": "Invalid authorization code"}), 400

        # Get user info from Yandex
        yandex_user = _get_yandex_user_info(yandex_token["access_token"])
        if not yandex_user:
            return jsonify({"error": "Failed to retrieve user info"}), 400

        # Find or create user
        user = _find_or_create_user_from_yandex(yandex_user)

        # Generate JWT tokens
        token_manager = TokenManager(redis_client=current_app.redis, config=current_app.config)
        access_token, refresh_token = token_manager.create_tokens(user_id=user.id, email=user.email)

        logger.info(f"✓ User {user.email} authenticated via Yandex OAuth")

        return (
            jsonify(
                {
                    "success": True,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "user_id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"✗ Yandex OAuth error: {str(e)}")
        return jsonify({"error": "Authentication failed", "message": str(e)}), 500


# Helper functions
def _exchange_google_code_for_token(code: str) -> dict:
    """Exchange Google authorization code for access token"""
    try:
        response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": current_app.config["GOOGLE_CLIENT_ID"],
                "client_secret": current_app.config["GOOGLE_CLIENT_SECRET"],
                "redirect_uri": current_app.config.get(
                    "OAUTH_REDIRECT_URI", "http://localhost:3000/auth/google/callback"
                ),
                "grant_type": "authorization_code",
            },
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error(f"Google token exchange error: {str(e)}")
        return None


def _get_google_user_info(access_token: str) -> dict:
    """Get user info from Google using access token"""
    try:
        response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error(f"Google userinfo error: {str(e)}")
        return None


def _exchange_github_code_for_token(code: str) -> dict:
    """Exchange GitHub authorization code for access token"""
    try:
        response = requests.post(
            "https://github.com/login/oauth/access_token",
            data={
                "code": code,
                "client_id": current_app.config["GITHUB_CLIENT_ID"],
                "client_secret": current_app.config["GITHUB_CLIENT_SECRET"],
            },
            headers={"Accept": "application/json"},
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error(f"GitHub token exchange error: {str(e)}")
        return None


def _get_github_user_info(access_token: str) -> dict:
    """Get user info from GitHub using access token"""
    try:
        response = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error(f"GitHub userinfo error: {str(e)}")
        return None


def _get_github_user_email(access_token: str) -> str:
    """Get primary email from GitHub API"""
    try:
        response = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )

        if response.status_code == 200:
            emails = response.json()
            # Find primary email
            for email_obj in emails:
                if email_obj.get("primary"):
                    return email_obj.get("email")
            # Fallback to first email
            if emails:
                return emails[0].get("email")
        return None
    except Exception as e:
        logger.error(f"GitHub email fetch error: {str(e)}")
        return None


def _exchange_yandex_code_for_token(code: str) -> dict:
    """Exchange Yandex authorization code for access token"""
    try:
        response = requests.post(
            "https://oauth.yandex.ru/token",
            data={
                "code": code,
                "client_id": current_app.config["YANDEX_CLIENT_ID"],
                "client_secret": current_app.config["YANDEX_CLIENT_SECRET"],
                "grant_type": "authorization_code",
            },
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error(f"Yandex token exchange error: {str(e)}")
        return None


def _get_yandex_user_info(access_token: str) -> dict:
    """Get user info from Yandex using access token"""
    try:
        response = requests.get(
            "https://login.yandex.ru/info", params={"oauth_token": access_token}, timeout=10
        )

        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error(f"Yandex userinfo error: {str(e)}")
        return None


def _find_or_create_user_from_google(google_user: dict) -> User:
    """Find existing user or create new one from Google user data"""
    email = google_user.get("email")

    # Try to find by email
    user = User.query.filter_by(email=email).first()

    if user:
        # Update user info if provided
        if "given_name" in google_user:
            user.first_name = google_user["given_name"]
        if "family_name" in google_user:
            user.last_name = google_user["family_name"]

        # Mark as verified if came through OAuth
        user.is_email_verified = True
        user.oauth_provider = "google"
        user.oauth_id = google_user.get("id")

        db.session.commit()
        return user

    # Create new user
    user = User(
        email=email,
        first_name=google_user.get("given_name", ""),
        last_name=google_user.get("family_name", ""),
        is_email_verified=True,
        oauth_provider="google",
        oauth_id=google_user.get("id"),
        role=UserRole.USER,
        is_active=True,
    )

    db.session.add(user)
    db.session.commit()
    return user


def _find_or_create_user_from_github(github_user: dict, email: str) -> User:
    """Find existing user or create new one from GitHub user data"""
    # Try to find by email
    user = User.query.filter_by(email=email).first()

    if user:
        # Update user info
        if github_user.get("name"):
            name_parts = github_user["name"].split(" ", 1)
            user.first_name = name_parts[0]
            if len(name_parts) > 1:
                user.last_name = name_parts[1]

        user.is_email_verified = True
        user.oauth_provider = "github"
        user.oauth_id = str(github_user.get("id"))

        db.session.commit()
        return user

    # Create new user
    name_parts = github_user.get("name", "").split(" ", 1) if github_user.get("name") else ["", ""]

    user = User(
        email=email,
        first_name=name_parts[0] if name_parts[0] else github_user.get("login", ""),
        last_name=name_parts[1] if len(name_parts) > 1 else "",
        is_email_verified=True,
        oauth_provider="github",
        oauth_id=str(github_user.get("id")),
        role=UserRole.USER,
        is_active=True,
    )

    db.session.add(user)
    db.session.commit()
    return user


def _find_or_create_user_from_yandex(yandex_user: dict) -> User:
    """Find existing user or create new one from Yandex user data"""
    email = yandex_user.get("default_email")

    # Try to find by email
    user = User.query.filter_by(email=email).first()

    if user:
        # Update user info
        user.is_email_verified = True
        user.oauth_provider = "yandex"
        user.oauth_id = str(yandex_user.get("id"))

        db.session.commit()
        return user

    # Create new user
    user = User(
        email=email,
        first_name=yandex_user.get("first_name", yandex_user.get("display_name", "")),
        last_name=yandex_user.get("last_name", ""),
        is_email_verified=True,
        oauth_provider="yandex",
        oauth_id=str(yandex_user.get("id")),
        role=UserRole.USER,
        is_active=True,
    )

    db.session.add(user)
    db.session.commit()
    return user
