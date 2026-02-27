"""OAuth2 integrations for CURSA (Google, GitHub, Yandex)"""

import logging
from typing import Dict, Optional, Tuple
from authlib.integrations.flask_client import OAuth
from flask import Flask, session, redirect, url_for
import os

logger = logging.getLogger(__name__)


class OAuth2Service:
    """Manages OAuth2 integrations with multiple providers"""

    PROVIDERS = ["google", "github", "yandex"]

    def __init__(self, app: Optional[Flask] = None):
        """
        Initialize OAuth2 service

        Args:
            app: Flask application instance
        """
        self.oauth = OAuth()
        self.app = app
        self.providers_config = {}

        if app:
            self.init_app(app)

    def init_app(self, app: Flask):
        """
        Initialize OAuth with Flask app

        Args:
            app: Flask application
        """
        self.app = app
        self.oauth.init_app(app)
        self._register_providers()
        logger.info("✓ OAuth2 service initialized")

    def _register_providers(self):
        """Register all OAuth2 providers"""

        # Google OAuth
        if self.app.config.get("GOOGLE_CLIENT_ID"):
            self.oauth.register(
                name="google",
                client_id=self.app.config["GOOGLE_CLIENT_ID"],
                client_secret=self.app.config["GOOGLE_CLIENT_SECRET"],
                server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
                client_kwargs={"scope": "openid email profile"},
                authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
                authorize_params={"access_type": "offline"},
                access_token_url="https://oauth2.googleapis.com/token",
                api_base_url="https://www.googleapis.com/oauth2/v3/",
                userinfo_endpoint="https://www.googleapis.com/oauth2/v3/userinfo",
            )
            logger.info("✓ Google OAuth registered")
        else:
            logger.warning("⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID)")

        # GitHub OAuth
        if self.app.config.get("GITHUB_CLIENT_ID"):
            self.oauth.register(
                name="github",
                client_id=self.app.config["GITHUB_CLIENT_ID"],
                client_secret=self.app.config["GITHUB_CLIENT_SECRET"],
                access_token_url="https://github.com/login/oauth/access_token",
                access_token_params=None,
                authorize_url="https://github.com/login/oauth/authorize",
                authorize_params=None,
                api_base_url="https://api.github.com/",
                client_kwargs={"scope": "user:email"},
                userinfo_endpoint="https://api.github.com/user",
            )
            logger.info("✓ GitHub OAuth registered")
        else:
            logger.warning("⚠️  GitHub OAuth not configured (missing GITHUB_CLIENT_ID)")

        # Yandex OAuth
        if self.app.config.get("YANDEX_CLIENT_ID"):
            self.oauth.register(
                name="yandex",
                client_id=self.app.config["YANDEX_CLIENT_ID"],
                client_secret=self.app.config["YANDEX_CLIENT_SECRET"],
                access_token_url="https://oauth.yandex.ru/token",
                authorize_url="https://oauth.yandex.ru/authorize",
                api_base_url="https://login.yandex.ru/info",
                userinfo_endpoint="https://login.yandex.ru/info",
                client_kwargs={"scope": "login:email"},
            )
            logger.info("✓ Yandex OAuth registered")
        else:
            logger.warning("⚠️  Yandex OAuth not configured (missing YANDEX_CLIENT_ID)")

    def get_authorize_url(self, provider: str, redirect_uri: Optional[str] = None) -> str:
        """
        Get authorization URL for OAuth provider

        Args:
            provider: Provider name ('google', 'github', 'yandex')
            redirect_uri: Optional redirect URI

        Returns:
            Authorization URL
        """
        if provider not in self.PROVIDERS:
            raise ValueError(f"Unsupported provider: {provider}")

        try:
            oauth_client = getattr(self.oauth, provider, None)
            if not oauth_client:
                raise ValueError(f"Provider {provider} not configured")

            return oauth_client.create_authorization_url(redirect_uri)
        except Exception as e:
            logger.error(f"✗ Error generating {provider} auth URL: {str(e)}")
            raise

    def get_user_info(self, provider: str, token: str) -> Optional[Dict]:
        """
        Get user info from OAuth provider

        Args:
            provider: Provider name
            token: Access token from provider

        Returns:
            Dictionary with user info (email, name, picture, etc.)
        """
        if provider not in self.PROVIDERS:
            raise ValueError(f"Unsupported provider: {provider}")

        try:
            oauth_client = getattr(self.oauth, provider, None)
            if not oauth_client:
                raise ValueError(f"Provider {provider} not configured")

            # Different providers have different endpoints
            if provider == "google":
                return self._get_google_userinfo(oauth_client, token)
            elif provider == "github":
                return self._get_github_userinfo(oauth_client, token)
            elif provider == "yandex":
                return self._get_yandex_userinfo(oauth_client, token)
        except Exception as e:
            logger.error(f"✗ Error getting {provider} user info: {str(e)}")
            raise

    def _get_google_userinfo(self, oauth_client, token: str) -> Dict:
        """Get user info from Google"""
        resp = oauth_client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo", token={"access_token": token}
        )
        data = resp.json()

        return {
            "provider": "google",
            "provider_id": data.get("sub"),
            "email": data.get("email"),
            "email_verified": data.get("email_verified", False),
            "name": data.get("name", ""),
            "picture": data.get("picture", ""),
            "locale": data.get("locale", ""),
        }

    def _get_github_userinfo(self, oauth_client, token: str) -> Dict:
        """Get user info from GitHub"""
        resp = oauth_client.get("https://api.github.com/user", token={"access_token": token})
        user_data = resp.json()

        # Get email if not public
        email = user_data.get("email")
        if not email:
            email_resp = oauth_client.get(
                "https://api.github.com/user/emails", token={"access_token": token}
            )
            email_data = email_resp.json()
            for email_obj in email_data:
                if email_obj.get("primary"):
                    email = email_obj.get("email")
                    break

        return {
            "provider": "github",
            "provider_id": str(user_data.get("id")),
            "email": email,
            "email_verified": True,
            "name": user_data.get("name", user_data.get("login", "")),
            "picture": user_data.get("avatar_url", ""),
            "locale": user_data.get("location", ""),
        }

    def _get_yandex_userinfo(self, oauth_client, token: str) -> Dict:
        """Get user info from Yandex"""
        resp = oauth_client.get(
            "https://login.yandex.ru/info?format=json", token={"access_token": token}
        )
        data = resp.json()

        return {
            "provider": "yandex",
            "provider_id": str(data.get("id")),
            "email": data.get("default_email"),
            "email_verified": True,
            "name": data.get("display_name", ""),
            "picture": data.get("default_avatar_id", ""),
            "locale": "ru" if data.get("is_avatar_empty") is not None else "en",
        }

    def validate_oauth_user(self, user_info: Dict) -> Tuple[bool, str]:
        """
        Validate OAuth user info

        Args:
            user_info: User info dict from provider

        Returns:
            Tuple of (is_valid, error_message)
        """
        required_fields = ["email", "provider", "provider_id"]

        for field in required_fields:
            if not user_info.get(field):
                return False, f"Missing required field: {field}"

        # Validate email format
        from app.security import validate_email

        if not validate_email(user_info["email"]):
            return False, "Invalid email format"

        logger.info(f"✓ OAuth user validated: {user_info['provider']} ({user_info['email']})")
        return True, ""


# Helper functions for Flask endpoints
def get_oauth_service(app: Flask = None) -> OAuth2Service:
    """Get or create OAuth2Service instance"""
    if not hasattr(get_oauth_service, "_instance"):
        get_oauth_service._instance = OAuth2Service(app)
    return get_oauth_service._instance


def get_oauth_user_info(provider: str, token: str) -> Optional[Dict]:
    """Quick function to get user info from OAuth provider"""
    service = get_oauth_service()
    try:
        return service.get_user_info(provider, token)
    except Exception as e:
        logger.error(f"✗ Failed to get user info: {str(e)}")
        return None
