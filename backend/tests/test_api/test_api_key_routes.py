"""
Tests for API Key API routes
"""

import pytest
from app.extensions import db
from app.models import User, APIKey, APIKeyAudit, UserRole
from datetime import datetime, timezone, timedelta
import hashlib


@pytest.fixture
def user(app):
    """Create a test user"""
    user = User(
        email="apikey_test@example.com",
        first_name="Test",
        last_name="User",
        role=UserRole.USER,
        is_active=True,
        is_email_verified=True
    )
    user.set_password("TestPassword123!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def auth_headers(user):
    """Get authentication headers for the test user"""
    from flask_jwt_extended import create_access_token
    access_token = create_access_token(identity=str(user.id))
    return {"Authorization": f"Bearer {access_token}"}


class TestAPIKeyRoutes:
    """Test API Key management endpoints"""

    @staticmethod
    def _create_raw_api_key(user_id, scopes, rate_limit=100):
        raw_key = "cursa_prod_testkey_1234567890"
        api_key = APIKey(
            user_id=user_id,
            name="Programmatic Key",
            key_hash=APIKey.hash_key(raw_key),
            key_prefix=raw_key[:16],
            scopes=scopes,
            is_active=True,
            rate_limit=rate_limit,
            usage_count=0,
        )
        db.session.add(api_key)
        db.session.commit()
        return raw_key, api_key

    def test_list_api_keys_empty(self, client, auth_headers):
        """Test listing API keys when none exist"""
        response = client.get("/api/api-keys", headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["api_keys"] == []
        assert data["total"] == 0

    def test_create_api_key(self, client, auth_headers):
        """Test creating a new API key"""
        payload = {
            "name": "Test Key",
            "scopes": ["document:check", "document:correct"],
            "expires_in_days": None
        }
        response = client.post(
            "/api/api-keys",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.get_json()

        # Verify response structure
        assert "id" in data
        assert data["name"] == "Test Key"
        assert data["key_prefix"].startswith("cursa_prod")
        assert data["scopes"] == ["document:check", "document:correct"]
        assert data["is_active"] == True
        assert "key" in data  # Full key shown only on creation
        assert "message" in data

    def test_create_api_key_without_name(self, client, auth_headers):
        """Test creating API key without a name"""
        payload = {
            "name": "",
            "scopes": ["document:check"]
        }
        response = client.post(
            "/api/api-keys",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_create_api_key_invalid_scope(self, client, auth_headers):
        """Test creating API key with invalid scope"""
        payload = {
            "name": "Test Key",
            "scopes": ["invalid:scope"]
        }
        response = client.post(
            "/api/api-keys",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "Invalid scopes" in data["error"]

    def test_list_api_keys_with_data(self, client, auth_headers, user):
        """Test listing API keys with data"""
        # Create a test key in database
        key_hash = hashlib.sha256(b"test_key_12345").hexdigest()
        api_key = APIKey(
            user_id=user.id,
            name="My API Key",
            key_hash=key_hash,
            key_prefix="cursa_prod",
            scopes=["document:check"],
            is_active=True
        )
        db.session.add(api_key)
        db.session.commit()

        response = client.get("/api/api-keys", headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1
        assert len(data["api_keys"]) == 1
        assert data["api_keys"][0]["name"] == "My API Key"

    def test_update_api_key(self, client, auth_headers, user):
        """Test updating an API key"""
        # Create initial key
        key_hash = hashlib.sha256(b"test_key_update").hexdigest()
        api_key = APIKey(
            user_id=user.id,
            name="Original Name",
            key_hash=key_hash,
            key_prefix="cursa_prod",
            scopes=["document:check"],
            is_active=True
        )
        db.session.add(api_key)
        db.session.commit()

        # Update the key
        payload = {
            "name": "Updated Name",
            "scopes": ["document:check", "document:correct"],
            "is_active": False
        }
        response = client.patch(
            f"/api/api-keys/{api_key.id}",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["name"] == "Updated Name"
        assert data["scopes"] == ["document:check", "document:correct"]
        assert data["is_active"] == False

    def test_revoke_api_key(self, client, auth_headers, user):
        """Test revoking an API key"""
        # Create initial key
        key_hash = hashlib.sha256(b"test_key_revoke").hexdigest()
        api_key = APIKey(
            user_id=user.id,
            name="To Be Revoked",
            key_hash=key_hash,
            key_prefix="cursa_prod",
            scopes=["document:check"],
            is_active=True
        )
        db.session.add(api_key)
        db.session.commit()
        key_id = api_key.id

        # Revoke the key
        response = client.delete(
            f"/api/api-keys/{key_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "message" in data

        # Verify it's deleted
        response = client.get("/api/api-keys", headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 0

    def test_revoke_nonexistent_key(self, client, auth_headers):
        """Test revoking a non-existent key"""
        response = client.delete(
            "/api/api-keys/99999",
            headers=auth_headers
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data

    def test_regenerate_api_key(self, client, auth_headers, user):
        """Test regenerating an API key"""
        # Create initial key
        key_hash = hashlib.sha256(b"test_key_regen").hexdigest()
        api_key = APIKey(
            user_id=user.id,
            name="To Be Regenerated",
            key_hash=key_hash,
            key_prefix="cursa_prod",
            scopes=["document:check"],
            is_active=True,
            usage_count=100,
            last_used_at=datetime.now(timezone.utc)
        )
        db.session.add(api_key)
        db.session.commit()
        key_id = api_key.id

        # Regenerate the key
        response = client.post(
            f"/api/api-keys/{key_id}/regenerate",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "key" in data  # New key shown on regeneration
        assert data["usage_count"] == 0  # Reset to 0
        assert data["last_used_at"] is None  # Reset

    def test_get_api_key_usage(self, client, auth_headers, user):
        """Test getting API key usage statistics"""
        # Create key with usage
        key_hash = hashlib.sha256(b"test_key_usage").hexdigest()
        last_used = datetime.now(timezone.utc)
        api_key = APIKey(
            user_id=user.id,
            name="Usage Test Key",
            key_hash=key_hash,
            key_prefix="cursa_prod",
            scopes=["document:check"],
            is_active=True,
            usage_count=42,
            last_used_at=last_used,
            rate_limit=1000
        )
        db.session.add(api_key)
        db.session.commit()

        response = client.get(
            f"/api/api-keys/{api_key.id}/usage",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["usage_count"] == 42
        assert data["usage_count_last_hour"] == 0
        assert data["hourly_remaining"] == 1000
        assert data["rate_limit"] == 1000
        assert "rate_limit_reset_at" in data
        assert data["is_active"] == True

    def test_get_api_key_usage_last_hour_metrics(self, client, auth_headers, user):
        """Usage endpoint should count only recent usage events within 1 hour."""
        key_hash = hashlib.sha256(b"test_key_usage_metrics").hexdigest()
        api_key = APIKey(
            user_id=user.id,
            name="Usage Metrics Key",
            key_hash=key_hash,
            key_prefix="cursa_prod",
            scopes=["document:check"],
            is_active=True,
            usage_count=10,
            rate_limit=5,
        )
        db.session.add(api_key)
        db.session.commit()

        recent_event = APIKeyAudit(
            user_id=user.id,
            api_key_id=api_key.id,
            event="api_key_used",
            details={"path": "/api/document/analyze"},
            created_at=datetime.now(timezone.utc) - timedelta(minutes=10),
        )
        old_event = APIKeyAudit(
            user_id=user.id,
            api_key_id=api_key.id,
            event="api_key_used",
            details={"path": "/api/document/analyze"},
            created_at=datetime.now(timezone.utc) - timedelta(hours=2),
        )
        db.session.add(recent_event)
        db.session.add(old_event)
        db.session.commit()

        response = client.get(
            f"/api/api-keys/{api_key.id}/usage",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["usage_count_last_hour"] == 1
        assert data["hourly_remaining"] == 4

    def test_get_api_keys_usage_bulk(self, client, auth_headers, user):
        """Bulk usage endpoint should return usage items for all user keys."""
        key1_hash = hashlib.sha256(b"bulk_key_1").hexdigest()
        key2_hash = hashlib.sha256(b"bulk_key_2").hexdigest()
        key1 = APIKey(
            user_id=user.id,
            name="Bulk Key 1",
            key_hash=key1_hash,
            key_prefix="cursa_prod_1",
            scopes=["document:check"],
            is_active=True,
            usage_count=3,
            rate_limit=10,
        )
        key2 = APIKey(
            user_id=user.id,
            name="Bulk Key 2",
            key_hash=key2_hash,
            key_prefix="cursa_prod_2",
            scopes=["document:view"],
            is_active=True,
            usage_count=1,
            rate_limit=5,
        )
        db.session.add(key1)
        db.session.add(key2)
        db.session.commit()

        event = APIKeyAudit(
            user_id=user.id,
            api_key_id=key1.id,
            event="api_key_used",
            details={"path": "/api/document/analyze"},
            created_at=datetime.now(timezone.utc) - timedelta(minutes=20),
        )
        db.session.add(event)
        db.session.commit()

        response = client.get("/api/api-keys/usage", headers=auth_headers)
        assert response.status_code == 200
        payload = response.get_json()

        assert payload["total"] == 2
        assert len(payload["items"]) == 2
        assert str(key1.id) in payload["usage_by_key_id"]
        assert str(key2.id) in payload["usage_by_key_id"]

    def test_get_api_keys_usage_bulk_filter_and_validation(self, client, auth_headers, user):
        """Bulk usage endpoint should support key_ids filter and reject invalid values."""
        key_hash = hashlib.sha256(b"bulk_filter_key").hexdigest()
        api_key = APIKey(
            user_id=user.id,
            name="Bulk Filter Key",
            key_hash=key_hash,
            key_prefix="cursa_prod_f",
            scopes=["document:check"],
            is_active=True,
            usage_count=0,
            rate_limit=10,
        )
        db.session.add(api_key)
        db.session.commit()

        valid_response = client.get(
            f"/api/api-keys/usage?key_ids={api_key.id}",
            headers=auth_headers,
        )
        assert valid_response.status_code == 200
        valid_payload = valid_response.get_json()
        assert valid_payload["total"] == 1
        assert valid_payload["items"][0]["key_id"] == api_key.id

        invalid_response = client.get(
            "/api/api-keys/usage?key_ids=abc",
            headers=auth_headers,
        )
        assert invalid_response.status_code == 400
        assert "error" in invalid_response.get_json()

    def test_unauthorized_access(self, client):
        """Test accessing API keys without authentication"""
        response = client.get("/api/api-keys")
        assert response.status_code == 401

    def test_cannot_access_other_users_keys(self, client, user, app):
        """Test that users cannot access other users' keys"""
        # Create another user
        user2 = User(
            email="another@example.com",
            first_name="Another",
            last_name="User",
            role=UserRole.USER,
            is_active=True,
            is_email_verified=True
        )
        user2.set_password("TestPassword123!")
        db.session.add(user2)
        db.session.commit()

        # Create API key for user2
        key_hash = hashlib.sha256(b"other_user_key").hexdigest()
        api_key = APIKey(
            user_id=user2.id,
            name="Other User's Key",
            key_hash=key_hash,
            key_prefix="cursa_prod",
            scopes=["document:check"],
            is_active=True
        )
        db.session.add(api_key)
        db.session.commit()

        # Try to access with user1's token
        from flask_jwt_extended import create_access_token
        access_token = create_access_token(identity=str(user.id))
        headers = {"Authorization": f"Bearer {access_token}"}

        response = client.delete(
            f"/api/api-keys/{api_key.id}",
            headers=headers
        )
        assert response.status_code == 404

    def test_document_analyze_allows_valid_api_key(self, client, user):
        """Valid API key with document:check scope should pass auth layer."""
        raw_key, _ = self._create_raw_api_key(user.id, ["document:check"])

        response = client.post(
            "/api/document/analyze",
            headers={"Authorization": f"Bearer {raw_key}"},
            data={},
        )

        # Auth passed; endpoint now fails on missing file validation.
        assert response.status_code == 400
        assert "error" in response.get_json()

    def test_document_analyze_rejects_invalid_api_key(self, client):
        """Invalid API key should be rejected before endpoint body validation."""
        response = client.post(
            "/api/document/analyze",
            headers={"Authorization": "Bearer cursa_prod_invalid_key"},
            data={},
        )

        assert response.status_code == 401
        data = response.get_json()
        assert data["error"] == "Invalid API key"

    def test_document_correct_requires_proper_scope(self, client, user):
        """API key without document:correct scope should get 403."""
        raw_key, _ = self._create_raw_api_key(user.id, ["document:check"])

        response = client.post(
            "/api/document/correct",
            headers={"X-API-Key": raw_key},
            json={"file_path": "missing.docx"},
        )

        assert response.status_code == 403
        data = response.get_json()
        assert data["required_scope"] == "document:correct"

    def test_document_analyze_increments_usage_count(self, client, user):
        """Successful API key authorization should increment usage counter."""
        raw_key, api_key = self._create_raw_api_key(user.id, ["document:check"])

        response = client.post(
            "/api/document/analyze",
            headers={"X-API-Key": raw_key},
            data={},
        )
        assert response.status_code == 400

        db.session.refresh(api_key)
        assert api_key.usage_count == 1
        assert api_key.last_used_at is not None

        usage_event = (
            APIKeyAudit.query.filter_by(api_key_id=api_key.id, event="api_key_used")
            .order_by(APIKeyAudit.created_at.desc())
            .first()
        )
        assert usage_event is not None
        assert (usage_event.details or {}).get("required_scope") == "document:check"
        assert (usage_event.details or {}).get("path") == "/api/document/analyze"

    def test_list_corrections_requires_view_scope(self, client, user):
        """API key without document:view scope must be rejected for list endpoint."""
        raw_key, _ = self._create_raw_api_key(user.id, ["document:check"])

        response = client.get(
            "/api/document/list-corrections",
            headers={"Authorization": f"Bearer {raw_key}"},
        )

        assert response.status_code == 403
        data = response.get_json()
        assert data["required_scope"] == "document:view"

    def test_list_corrections_allows_view_scope(self, client, user):
        """API key with document:view scope should pass auth layer."""
        raw_key, _ = self._create_raw_api_key(user.id, ["document:view"])

        response = client.get(
            "/api/document/list-corrections",
            headers={"X-API-Key": raw_key},
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

    def test_download_corrected_rejects_invalid_api_key(self, client):
        """Invalid API key should fail on protected download endpoint."""
        response = client.get(
            "/api/document/download-corrected?path=demo.docx",
            headers={"Authorization": "Bearer cursa_prod_invalid_key"},
        )

        assert response.status_code == 401
        data = response.get_json()
        assert data["error"] == "Invalid API key"

    def test_api_key_history_contains_lifecycle_events(self, client, auth_headers):
        """History endpoint should include events created by lifecycle operations."""
        create_resp = client.post(
            "/api/api-keys",
            json={"name": "History Key", "scopes": ["document:check", "document:view"]},
            headers=auth_headers,
        )
        assert create_resp.status_code == 201
        key_id = create_resp.get_json()["id"]

        update_resp = client.patch(
            f"/api/api-keys/{key_id}",
            json={"name": "History Key Updated", "scopes": ["document:view"]},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200

        history_resp = client.get("/api/api-keys/history?limit=20", headers=auth_headers)
        assert history_resp.status_code == 200
        payload = history_resp.get_json()
        events = [item["event"] for item in payload["items"]]

        assert "api_key_created" in events
        assert "api_key_updated" in events

    def test_api_key_history_filter_by_key_id(self, client, auth_headers):
        """History endpoint should return only selected key events when key_id is passed."""
        key1 = client.post(
            "/api/api-keys",
            json={"name": "K1", "scopes": ["document:check"]},
            headers=auth_headers,
        ).get_json()
        key2 = client.post(
            "/api/api-keys",
            json={"name": "K2", "scopes": ["document:view"]},
            headers=auth_headers,
        ).get_json()

        resp = client.get(f"/api/api-keys/history?key_id={key1['id']}", headers=auth_headers)
        assert resp.status_code == 200
        payload = resp.get_json()

        assert payload["total"] >= 1
        assert all(item["api_key_id"] == key1["id"] for item in payload["items"])
        assert not any(item["api_key_id"] == key2["id"] for item in payload["items"])

    def test_api_key_history_rejects_invalid_limit(self, client, auth_headers):
        """History endpoint must validate limit query parameter."""
        resp = client.get("/api/api-keys/history?limit=abc", headers=auth_headers)
        assert resp.status_code == 400
        assert "error" in resp.get_json()

    def test_api_key_rate_limit_enforced(self, client, user):
        """Second request within an hour must fail when key hourly limit is 1."""
        raw_key, _ = self._create_raw_api_key(user.id, ["document:check"], rate_limit=1)

        first_response = client.post(
            "/api/document/analyze",
            headers={"X-API-Key": raw_key},
            data={},
        )
        assert first_response.status_code == 400

        second_response = client.post(
            "/api/document/analyze",
            headers={"X-API-Key": raw_key},
            data={},
        )
        assert second_response.status_code == 429
        payload = second_response.get_json()
        assert payload["error"] == "API key rate limit exceeded"
        assert payload["rate_limit"] == 1
