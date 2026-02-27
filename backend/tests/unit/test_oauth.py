"""Tests for OAuth2 authentication functionality

Tests Google, GitHub, and Yandex OAuth2 callbacks.
"""

import pytest
from unittest.mock import patch, MagicMock
from flask import json
from app.models.user import User, UserRole


@pytest.fixture
def oauth_headers():
    """Headers for OAuth callback requests"""
    return {"Content-Type": "application/json"}


@pytest.fixture
def google_auth_code():
    """Mock Google authorization code"""
    return "4/0AX4XfWh..."


@pytest.fixture
def google_token_response():
    """Mock Google OAuth token response"""
    return {
        "access_token": "ya29.a0afH6SMB...",
        "token_type": "Bearer",
        "expires_in": 3599,
    }


@pytest.fixture
def google_userinfo_response():
    """Mock Google user info response"""
    return {
        "id": "118364750330...",
        "email": "user@gmail.com",
        "verified_email": True,
        "name": "John Doe",
        "given_name": "John",
        "family_name": "Doe",
        "picture": "https://lh3.googleusercontent.com/...",
        "locale": "en",
    }


class TestGoogleOAuth:
    """Test Google OAuth2 authentication"""

    @patch("app.api.oauth_routes.requests.post")
    @patch("app.api.oauth_routes.requests.get")
    def test_google_oauth_new_user(
        self,
        mock_get,
        mock_post,
        client,
        oauth_headers,
        google_auth_code,
        google_token_response,
        google_userinfo_response,
    ):
        """Test successful Google OAuth authentication for new user"""
        # Mock Google token exchange
        mock_post_response = MagicMock()
        mock_post_response.status_code = 200
        mock_post_response.json.return_value = google_token_response
        mock_post.return_value = mock_post_response

        # Mock Google userinfo endpoint
        mock_get_response = MagicMock()
        mock_get_response.status_code = 200
        mock_get_response.json.return_value = google_userinfo_response
        mock_get.return_value = mock_get_response

        # Make callback request
        response = client.post(
            "/api/auth/oauth/google/callback",
            data=json.dumps({"code": google_auth_code}),
            headers=oauth_headers,
        )

        assert response.status_code == 200
        data = response.get_json()

        assert data["success"] is True
        assert data["access_token"] is not None
        assert data["refresh_token"] is not None
        assert data["email"] == "user@gmail.com"
        assert data["first_name"] == "John"

        # Check user was created in database
        user = User.query.filter_by(email="user@gmail.com").first()
        assert user is not None
        assert user.oauth_provider == "google"
        assert user.is_email_verified is True
        assert user.role == UserRole.USER

    @patch("app.api.oauth_routes.requests.post")
    @patch("app.api.oauth_routes.requests.get")
    def test_google_oauth_existing_user(
        self,
        mock_get,
        mock_post,
        client,
        oauth_headers,
        db,
        app,
        google_auth_code,
        google_token_response,
        google_userinfo_response,
    ):
        """Test Google OAuth authentication for existing user"""
        # Create existing user
        with app.app_context():
            existing_user = User(
                email="user@gmail.com",
                first_name="Jane",
                role=UserRole.USER,
            )
            db.session.add(existing_user)
            db.session.commit()

        # Mock Google responses
        mock_post_response = MagicMock()
        mock_post_response.status_code = 200
        mock_post_response.json.return_value = google_token_response
        mock_post.return_value = mock_post_response

        mock_get_response = MagicMock()
        mock_get_response.status_code = 200
        mock_get_response.json.return_value = google_userinfo_response
        mock_get.return_value = mock_get_response

        # Make callback request
        response = client.post(
            "/api/auth/oauth/google/callback",
            data=json.dumps({"code": google_auth_code}),
            headers=oauth_headers,
        )

        assert response.status_code == 200
        data = response.get_json()

        assert data["success"] is True
        assert data["access_token"] is not None

        # Check user was updated, not duplicated
        users = User.query.filter_by(email="user@gmail.com").all()
        assert len(users) == 1
        assert users[0].first_name == "John"  # Updated from OAuth
        assert users[0].oauth_provider == "google"

    def test_google_oauth_missing_code(self, client, oauth_headers):
        """Test OAuth callback without authorization code"""
        response = client.post(
            "/api/auth/oauth/google/callback",
            data=json.dumps({}),
            headers=oauth_headers,
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "Missing authorization code" in data["error"]

    @patch("app.api.oauth_routes.requests.post")
    def test_google_oauth_invalid_code(self, mock_post, client, oauth_headers):
        """Test OAuth callback with invalid code"""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_post.return_value = mock_response

        response = client.post(
            "/api/auth/oauth/google/callback",
            data=json.dumps({"code": "invalid_code"}),
            headers=oauth_headers,
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "Invalid authorization code" in data["error"]


class TestGitHubOAuth:
    """Test GitHub OAuth2 authentication"""

    @pytest.fixture
    def github_token_response(self):
        """Mock GitHub OAuth token response"""
        return {
            "access_token": "ghu_16C7e42F...",
            "token_type": "bearer",
        }

    @pytest.fixture
    def github_userinfo_response(self):
        """Mock GitHub user info response"""
        return {
            "id": 1,
            "login": "octocat",
            "name": "The Octocat",
            "email": None,
        }

    @pytest.fixture
    def github_email_response(self):
        """Mock GitHub email list response"""
        return [
            {
                "email": "octocat@github.com",
                "primary": True,
                "verified": True,
                "visibility": "public",
            }
        ]

    @patch("app.api.oauth_routes.requests.post")
    @patch("app.api.oauth_routes.requests.get")
    def test_github_oauth_new_user(
        self,
        mock_get,
        mock_post,
        client,
        oauth_headers,
        github_token_response,
        github_userinfo_response,
        github_email_response,
    ):
        """Test successful GitHub OAuth authentication for new user"""
        # Mock GitHub token exchange
        token_response = MagicMock()
        token_response.status_code = 200
        token_response.json.return_value = github_token_response

        # Mock GitHub userinfo and emails
        userinfo_response = MagicMock()
        userinfo_response.status_code = 200
        userinfo_response.json.return_value = github_userinfo_response

        email_response = MagicMock()
        email_response.status_code = 200
        email_response.json.return_value = github_email_response

        mock_post.return_value = token_response
        mock_get.side_effect = [userinfo_response, email_response]

        # Make callback request
        response = client.post(
            "/api/auth/oauth/github/callback",
            data=json.dumps({"code": "github_code"}),
            headers=oauth_headers,
        )

        assert response.status_code == 200
        data = response.get_json()

        assert data["success"] is True
        assert data["access_token"] is not None
        assert data["email"] == "octocat@github.com"

        # Check user was created
        user = User.query.filter_by(email="octocat@github.com").first()
        assert user is not None
        assert user.oauth_provider == "github"


class TestYandexOAuth:
    """Test Yandex OAuth2 authentication"""

    @pytest.fixture
    def yandex_token_response(self):
        """Mock Yandex OAuth token response"""
        return {
            "access_token": "AQAAAABcVeq...",
            "token_type": "bearer",
            "expires_in": 31536000,
        }

    @pytest.fixture
    def yandex_userinfo_response(self):
        """Mock Yandex user info response"""
        return {
            "id": "123456789",
            "login": "user",
            "first_name": "Ivan",
            "last_name": "Petrov",
            "display_name": "Ivan Petrov",
            "default_email": "user@yandex.ru",
            "emails": ["user@yandex.ru"],
            "birthday": "1990-01-01",
            "sex": "male",
            "default_phone": {
                "id": "123",
                "number": "+79999999999",
            },
        }

    @patch("app.api.oauth_routes.requests.post")
    @patch("app.api.oauth_routes.requests.get")
    def test_yandex_oauth_new_user(
        self,
        mock_get,
        mock_post,
        client,
        oauth_headers,
        yandex_token_response,
        yandex_userinfo_response,
    ):
        """Test successful Yandex OAuth authentication for new user"""
        # Mock Yandex token exchange
        token_response = MagicMock()
        token_response.status_code = 200
        token_response.json.return_value = yandex_token_response

        # Mock Yandex userinfo
        userinfo_response = MagicMock()
        userinfo_response.status_code = 200
        userinfo_response.json.return_value = yandex_userinfo_response

        mock_post.return_value = token_response
        mock_get.return_value = userinfo_response

        # Make callback request
        response = client.post(
            "/api/auth/oauth/yandex/callback",
            data=json.dumps({"code": "yandex_code"}),
            headers=oauth_headers,
        )

        assert response.status_code == 200
        data = response.get_json()

        assert data["success"] is True
        assert data["access_token"] is not None
        assert data["email"] == "user@yandex.ru"
        assert data["first_name"] == "Ivan"

        # Check user was created
        user = User.query.filter_by(email="user@yandex.ru").first()
        assert user is not None
        assert user.oauth_provider == "yandex"


class TestOAuthConfiguration:
    """Test OAuth configuration endpoints"""

    def test_oauth_config_status(self, client):
        """Test retrieving OAuth configuration status (which providers are enabled)"""
        # This endpoint would check which providers are configured
        # Implementation depends on whether you want to expose this info
        pass


class TestOAuthErrorHandling:
    """Test OAuth error handling"""

    @patch("app.api.oauth_routes.requests.post")
    def test_oauth_network_error(self, mock_post, client, oauth_headers):
        """Test handling of network errors during OAuth"""
        mock_post.side_effect = Exception("Network error")

        response = client.post(
            "/api/auth/oauth/google/callback",
            data=json.dumps({"code": "test_code"}),
            headers=oauth_headers,
        )

        assert response.status_code == 500
        data = response.get_json()
        assert "Authentication failed" in data["error"]

    def test_oauth_not_configured(self, client, oauth_headers, monkeypatch):
        """Test OAuth endpoint when provider is not configured"""
        monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
        monkeypatch.delenv("GOOGLE_CLIENT_SECRET", raising=False)

        response = client.post(
            "/api/auth/oauth/google/callback",
            data=json.dumps({"code": "test_code"}),
            headers=oauth_headers,
        )

        # Should return 503 Service Unavailable
        assert response.status_code == 503
        data = response.get_json()
        assert "not configured" in data["error"]
