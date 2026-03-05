"""Tests for Telegram authentication routes in auth API."""

from unittest.mock import patch


def test_telegram_start_requires_config(client):
    """Should return 503 when Telegram bot config is missing."""
    response = client.get("/api/auth/telegram/start")

    assert response.status_code == 503
    data = response.get_json()
    assert data["error"] == "Telegram not configured"


def test_telegram_start_renders_widget(client, app):
    """Should render Telegram Login Widget HTML when bot username is configured."""
    with app.app_context():
        app.config["TELEGRAM_BOT_USERNAME"] = "cursa_checker_bot"

    response = client.get("/api/auth/telegram/start")

    assert response.status_code == 200
    body = response.get_data(as_text=True)
    assert "telegram-widget.js" in body
    assert 'data-telegram-login="cursa_checker_bot"' in body


@patch("app.api.auth_routes._verify_telegram_signature", return_value=True)
def test_telegram_callback_success_redirects_with_tokens(mock_verify, client, app):
    """Successful Telegram callback should redirect to frontend with tokens in hash."""
    with app.app_context():
        app.config["JWT_SECRET_KEY"] = "test-secret-key-for-jwt-at-least-32-bytes"

    response = client.get(
        "/api/auth/telegram/callback"
        "?redirect_uri=http://localhost:3000/auth/telegram/callback"
        "&id=8609202073"
        "&first_name=Ivan"
        "&last_name=Ivanov"
        "&username=ivan"
        "&auth_date=1700000000"
        "&hash=stub",
        follow_redirects=False,
    )

    assert response.status_code in (301, 302)
    location = response.headers.get("Location", "")
    assert location.startswith("http://localhost:3000/auth/telegram/callback#")
    assert "access_token=" in location
    assert "refresh_token=" in location
    assert "is_new_user=" in location


@patch("app.api.auth_routes._verify_telegram_signature", return_value=False)
def test_telegram_callback_rejects_invalid_signature(mock_verify, client):
    """Invalid Telegram signature should redirect with error query."""
    response = client.get(
        "/api/auth/telegram/callback"
        "?redirect_uri=http://localhost:3000/auth/telegram/callback"
        "&id=8609202073"
        "&auth_date=1700000000"
        "&hash=bad",
        follow_redirects=False,
    )

    assert response.status_code in (301, 302)
    location = response.headers.get("Location", "")
    assert location.endswith("?error=invalid_telegram_signature")
