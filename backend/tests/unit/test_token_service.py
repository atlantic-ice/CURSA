"""Unit tests for TokenManager service"""

import pytest
from datetime import datetime, timedelta, timezone
from redis import Redis
from app.services.token_service import TokenManager


class TestTokenManager:
    """Test TokenManager JWT functionality"""

    @pytest.fixture
    def redis_client(self):
        """Create Redis client for testing"""
        # Use memory storage for tests
        try:
            # Try to connect to Redis
            client = Redis.from_url("redis://localhost:6379/0", socket_connect_timeout=1)
            client.ping()
            # Clean up test data
            client.flushdb(asynchronous=False)
            return client
        except Exception:
            # If Redis not available, skip these tests
            pytest.skip("Redis not available for testing")

    @pytest.fixture
    def token_manager(self, redis_client):
        """Create TokenManager instance"""
        config = {
            "JWT_ACCESS_TOKEN_EXPIRES": 900,  # 15 min
            "JWT_REFRESH_TOKEN_EXPIRES": 2592000,  # 30 days
        }
        return TokenManager(redis_client, config)

    def test_create_tokens(self, token_manager):
        """Test creating access and refresh tokens"""
        user_id = 1
        email = "test@example.com"

        access_token, refresh_token = token_manager.create_tokens(user_id, email)

        assert access_token is not None
        assert refresh_token is not None
        assert isinstance(access_token, str)
        assert isinstance(refresh_token, str)
        assert len(access_token) > 0
        assert len(refresh_token) > 0

    def test_revoke_token(self, token_manager, redis_client):
        """Test revoking a token"""
        jti = "test-jti-12345"

        result = token_manager.revoke_token(jti, expires_in=3600)

        assert result is True
        assert redis_client.exists(f"token_blacklist:{jti}") > 0

    def test_is_token_revoked_true(self, token_manager):
        """Test checking revoked token"""
        jti = "test-jti-revoked"
        token_manager.revoke_token(jti)

        is_revoked = token_manager.is_token_revoked(jti)

        assert is_revoked is True

    def test_is_token_revoked_false(self, token_manager):
        """Test checking non-revoked token"""
        jti = "test-jti-not-revoked"

        is_revoked = token_manager.is_token_revoked(jti)

        assert is_revoked is False

    def test_refresh_access_token(self, token_manager):
        """Test refreshing access token"""
        user_id = 1
        email = "test@example.com"

        new_access_token = token_manager.refresh_access_token(user_id, email)

        assert new_access_token is not None
        assert isinstance(new_access_token, str)


class TestTokenManagerEdgeCases:
    """Test TokenManager edge cases and error handling"""

    @pytest.fixture
    def redis_client(self):
        """Create Redis client for testing"""
        try:
            client = Redis.from_url("redis://localhost:6379/0", socket_connect_timeout=1)
            client.ping()
            client.flushdb(asynchronous=False)
            return client
        except Exception:
            pytest.skip("Redis not available")

    @pytest.fixture
    def token_manager(self, redis_client):
        """Create TokenManager instance"""
        config = {
            "JWT_ACCESS_TOKEN_EXPIRES": 900,
            "JWT_REFRESH_TOKEN_EXPIRES": 2592000,
        }
        return TokenManager(redis_client, config)

    def test_revoke_multiple_tokens(self, token_manager):
        """Test revoking multiple tokens"""
        jtis = ["jti-1", "jti-2", "jti-3"]

        for jti in jtis:
            result = token_manager.revoke_token(jti)
            assert result is True

        for jti in jtis:
            assert token_manager.is_token_revoked(jti) is True

    def test_token_revocation_cleanup(self, token_manager, redis_client):
        """Test token auto-cleanup after expiration"""
        jti = "test-jti-cleanup"
        expires_in = 2

        token_manager.revoke_token(jti, expires_in=expires_in)

        # Token should exist immediately
        assert redis_client.exists(f"token_blacklist:{jti}") > 0

        # Wait for expiration
        import time

        time.sleep(expires_in + 1)

        # Token should be expired
        assert redis_client.exists(f"token_blacklist:{jti}") == 0
