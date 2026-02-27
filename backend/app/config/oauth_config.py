"""OAuth2 Configuration

Handles OAuth2 provider configuration for Google, GitHub, and Yandex.
Loads credentials from environment variables.
"""

import os
from typing import Dict, Optional


class OAuthConfig:
    """Base OAuth configuration"""

    def __init__(self):
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        self.google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
        self.google_redirect_uri = os.getenv(
            "GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback"
        )

        self.github_client_id = os.getenv("GITHUB_CLIENT_ID", "")
        self.github_client_secret = os.getenv("GITHUB_CLIENT_SECRET", "")
        self.github_redirect_uri = os.getenv(
            "GITHUB_REDIRECT_URI", "http://localhost:3000/auth/github/callback"
        )

        self.yandex_client_id = os.getenv("YANDEX_CLIENT_ID", "")
        self.yandex_client_secret = os.getenv("YANDEX_CLIENT_SECRET", "")
        self.yandex_redirect_uri = os.getenv(
            "YANDEX_REDIRECT_URI", "http://localhost:3000/auth/yandex/callback"
        )

    def is_google_configured(self) -> bool:
        """Check if Google OAuth is fully configured"""
        return bool(self.google_client_id and self.google_client_secret)

    def is_github_configured(self) -> bool:
        """Check if GitHub OAuth is fully configured"""
        return bool(self.github_client_id and self.github_client_secret)

    def is_yandex_configured(self) -> bool:
        """Check if Yandex OAuth is fully configured"""
        return bool(self.yandex_client_id and self.yandex_client_secret)

    def get_enabled_providers(self) -> list[str]:
        """Get list of enabled OAuth providers"""
        providers = []
        if self.is_google_configured():
            providers.append("google")
        if self.is_github_configured():
            providers.append("github")
        if self.is_yandex_configured():
            providers.append("yandex")
        return providers

    def to_dict(self) -> Dict[str, Optional[str]]:
        """Export configuration as dictionary (without secrets)"""
        return {
            "google_configured": self.is_google_configured(),
            "github_configured": self.is_github_configured(),
            "yandex_configured": self.is_yandex_configured(),
            "enabled_providers": self.get_enabled_providers(),
            "google_redirect_uri": self.google_redirect_uri,
            "github_redirect_uri": self.github_redirect_uri,
            "yandex_redirect_uri": self.yandex_redirect_uri,
        }


# Global instance
oauth_config = OAuthConfig()
