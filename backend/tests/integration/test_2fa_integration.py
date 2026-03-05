"""Integration tests for 2FA endpoints"""

import pytest
import json
from flask import Flask
from flask_jwt_extended import create_access_token


def test_setup_2fa_endpoint(client, auth_headers, user_id):
    """Test 2FA setup endpoint"""
    response = client.post("/api/auth/2fa/setup", headers=auth_headers)

    assert response.status_code == 200
    data = json.loads(response.data)
    assert "secret" in data
    assert "qr_code" in data
    assert data["qr_code"].startswith("data:image/png;base64,")


def test_setup_2fa_without_auth(client):
    """Test 2FA setup without authentication"""
    response = client.post("/api/auth/2fa/setup")

    assert response.status_code == 401


def test_enable_2fa_endpoint(client, app, auth_headers, user_id):
    """Test enabling 2FA"""
    # First setup 2FA to get secret
    response = client.post("/api/auth/2fa/setup", headers=auth_headers)
    assert response.status_code == 200

    setup_data = json.loads(response.data)
    secret = setup_data["secret"]

    # Generate valid token
    import pyotp

    totp = pyotp.TOTP(secret)
    token = totp.now()

    # Enable 2FA
    enable_data = {"secret": secret, "token": token}
    response = client.post("/api/auth/2fa/enable", json=enable_data, headers=auth_headers)

    assert response.status_code == 200
    data = json.loads(response.data)
    assert "message" in data
    assert "backup_codes" in data
    assert len(data["backup_codes"]) > 0


def test_enable_2fa_invalid_token(client, auth_headers):
    """Test enabling 2FA with invalid token"""
    import pyotp

    secret = pyotp.random_base32()

    enable_data = {"secret": secret, "token": "000000"}
    response = client.post("/api/auth/2fa/enable", json=enable_data, headers=auth_headers)

    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data


def test_enable_2fa_missing_fields(client, auth_headers):
    """Test enabling 2FA without required fields"""
    response = client.post("/api/auth/2fa/enable", json={}, headers=auth_headers)

    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data


def test_disable_2fa_endpoint(client, app, user_with_2fa):
    """Test disabling 2FA"""
    from flask_jwt_extended import create_access_token

    access_token = create_access_token(identity=str(user_with_2fa.id))
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    response = client.post("/api/auth/2fa/disable", headers=auth_headers)

    assert response.status_code == 200
    data = json.loads(response.data)
    assert "message" in data


def test_disable_2fa_without_auth(client):
    """Test disabling 2FA without authentication"""
    response = client.post("/api/auth/2fa/disable")

    assert response.status_code == 401


def test_regenerate_backup_codes(client, app, user_with_2fa):
    """Test regenerating backup codes"""
    from flask_jwt_extended import create_access_token

    access_token = create_access_token(identity=str(user_with_2fa.id))
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    response = client.post("/api/auth/2fa/backup-codes", headers=auth_headers)

    assert response.status_code == 200
    data = json.loads(response.data)
    assert "backup_codes" in data
    assert len(data["backup_codes"]) > 0


def test_regenerate_backup_codes_2fa_disabled(client, auth_headers):
    """Test regenerating backup codes when 2FA is disabled"""
    response = client.post("/api/auth/2fa/backup-codes", headers=auth_headers)

    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data


def test_oauth_providers_list(client):
    """Test getting available OAuth providers"""
    response = client.get("/api/auth/oauth/providers")

    assert response.status_code == 200
    data = json.loads(response.data)
    assert "providers" in data
    assert isinstance(data["providers"], list)
