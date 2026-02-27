"""Functional tests for authentication API routes."""

import os
import pytest

os.environ.setdefault("FLASK_ENV", "testing")

from app.extensions import db


class FakeRedis:
    def __init__(self):
        self.store = {}

    def ping(self):
        return True

    def setex(self, key, expires, value):
        self.store[key] = value
        return True

    def get(self, key):
        return self.store.get(key)

    def delete(self, key):
        return 1 if self.store.pop(key, None) is not None else 0

    def exists(self, key):
        return 1 if key in self.store else 0

    def incr(self, key):
        current = int(self.store.get(key, 0))
        current += 1
        self.store[key] = current
        return current

    def expire(self, key, seconds):
        return True

    def find_token(self, prefix):
        for key in self.store.keys():
            if key.startswith(prefix):
                return key.split(":")[-1]
        return None


class FakeTokenManager:
    def __init__(self):
        self.revoked = []

    def revoke_token(self, jti, expires_in=3600):
        self.revoked.append(jti)
        return True

    def is_token_revoked(self, jti):
        return jti in self.revoked


@pytest.fixture(autouse=True)
def setup_db(app):
    """Create and drop all tables for auth tests."""
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()
        db.drop_all()


def test_register_verify_login_flow(client, app, monkeypatch):
    from app.api import auth_routes

    fake_redis = FakeRedis()
    monkeypatch.setattr(auth_routes, "_get_redis_client", lambda: fake_redis)

    # Register
    register_payload = {
        "email": "user1@cursa.app",
        "password": "SecurePass123",
        "first_name": "Ivan",
        "last_name": "Petrov",
    }
    response = client.post("/api/auth/register", json=register_payload)
    assert response.status_code == 201, response.json
    assert response.json.get("access_token")
    assert response.json.get("refresh_token")

    # Login should fail until email verified
    response = client.post(
        "/api/auth/login", json={"email": "user1@cursa.app", "password": "SecurePass123"}
    )
    assert response.status_code == 401

    # Verify email
    token = fake_redis.find_token("verify:tokens:email:")
    assert token is not None
    response = client.post(
        "/api/auth/verify-email",
        json={
            "email": "user1@cursa.app",
            "token": token,
        },
    )
    assert response.status_code == 200

    # Login should succeed after verification
    response = client.post(
        "/api/auth/login", json={"email": "user1@cursa.app", "password": "SecurePass123"}
    )
    assert response.status_code == 200
    access_token = response.json.get("access_token")
    refresh_token = response.json.get("refresh_token")
    assert access_token
    assert refresh_token

    # Refresh token
    refresh_response = client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert refresh_response.status_code == 200, refresh_response.json
    assert refresh_response.json.get("access_token")

    # Logout revokes token
    app.token_manager = FakeTokenManager()
    logout_response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_response.status_code == 200
    assert len(app.token_manager.revoked) == 1


def test_forgot_and_reset_password(client, monkeypatch, app):
    from app.api import auth_routes
    from app.services.email_service import EmailService

    fake_redis = FakeRedis()
    monkeypatch.setattr(auth_routes, "_get_redis_client", lambda: fake_redis)

    # Mock EmailService to avoid SendGrid errors in testing
    monkeypatch.setattr(EmailService, "send_password_reset_email", lambda self, email, token: True)

    # Register and verify
    client.post(
        "/api/auth/register",
        json={
            "email": "reset@cursa.app",
            "password": "SecurePass123",
        },
    )

    token = fake_redis.find_token("verify:tokens:email:")
    client.post(
        "/api/auth/verify-email",
        json={
            "email": "reset@cursa.app",
            "token": token,
        },
    )

    # Forgot password
    response = client.post(
        "/api/auth/forgot-password",
        json={
            "email": "reset@cursa.app",
        },
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json}"

    reset_token = fake_redis.find_token("verify:tokens:password_reset:")
    assert reset_token is not None

    # Reset password
    response = client.post(
        "/api/auth/reset-password",
        json={
            "email": "reset@cursa.app",
            "token": reset_token,
            "password": "NewSecurePass123",
        },
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json}"

    # Login with new password
    response = client.post(
        "/api/auth/login",
        json={
            "email": "reset@cursa.app",
            "password": "NewSecurePass123",
        },
    )
    assert response.status_code == 200
