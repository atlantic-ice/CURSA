"""Tests for TokenManager and authentication services"""

import pytest
import os
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from flask import Flask
from flask_jwt_extended import JWTManager
from redis import Redis


# Setup Flask app for testing
@pytest.fixture
def app():
    """Create Flask app for testing"""
    app = Flask(__name__)
    app.config["TESTING"] = True
    app.config["JWT_SECRET_KEY"] = "test-secret-key"
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 900  # 15 min
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 2592000  # 30 days
    app.config["REDIS_URL"] = "redis://localhost:6379/0"

    JWTManager(app)

    return app


@pytest.fixture
def mock_redis():
    """Create basic mock Redis instance for general tests"""
    redis_mock = MagicMock(spec=Redis)
    redis_mock.ping.return_value = True
    redis_mock.exists.return_value = 0
    redis_mock.get.return_value = None
    redis_mock.setex.return_value = True
    redis_mock.delete.return_value = 1
    return redis_mock


@pytest.fixture
def mock_redis_with_tracking():
    """Create mock Redis that properly tracks blacklisted tokens"""
    redis_mock = MagicMock(spec=Redis)
    redis_mock.ping.return_value = True
    redis_mock.blacklist = set()  # Track revoked tokens

    def setex_impl(key, expires, value):
        redis_mock.blacklist.add(key)
        return True

    def exists_impl(key):
        return 1 if key in redis_mock.blacklist else 0

    redis_mock.setex.side_effect = setex_impl
    redis_mock.exists.side_effect = exists_impl
    redis_mock.get.return_value = None
    redis_mock.delete.return_value = 1

    return redis_mock


class TestTokenManager:
    """Tests for TokenManager service"""

    def test_import_token_service(self):
        """Test that TokenManager can be imported"""
        try:
            from app.services.token_service import TokenManager

            assert TokenManager is not None
        except ImportError as e:
            pytest.fail(f"Failed to import TokenManager: {e}")

    def test_token_manager_initialization(self, app, mock_redis):
        """Test TokenManager initialization"""
        from app.services.token_service import TokenManager

        with app.app_context():
            manager = TokenManager(mock_redis, app.config)
            assert manager is not None
            assert manager.access_expires == 900
            assert manager.refresh_expires == 2592000

    def test_create_tokens(self, app, mock_redis):
        """Test creating access and refresh tokens"""
        from app.services.token_service import TokenManager

        with app.app_context():
            manager = TokenManager(mock_redis, app.config)
            access_token, refresh_token = manager.create_tokens("test_user", "test@example.com")

            assert access_token is not None
            assert refresh_token is not None
            assert isinstance(access_token, str)
            assert isinstance(refresh_token, str)
            assert len(access_token) > 0
            assert len(refresh_token) > 0

    def test_token_contains_correct_data(self, app, mock_redis):
        """Test that tokens contain correct user data"""
        from flask_jwt_extended import decode_token
        from app.services.token_service import TokenManager

        with app.app_context():
            manager = TokenManager(mock_redis, app.config)
            user_id = "test_user"
            email = "test@example.com"

            access_token, _ = manager.create_tokens(user_id, email)

            # Decode token to verify payload
            decoded = decode_token(access_token)
            assert decoded["sub"] == user_id
            assert decoded["email"] == email
            assert decoded["type"] == "access"

    def test_refresh_access_token(self, app, mock_redis):
        """Test refreshing access token with refresh token"""
        from app.services.token_service import TokenManager

        with app.app_context():
            manager = TokenManager(mock_redis, app.config)
            _, refresh_token = manager.create_tokens("test_user", "test@example.com")

            # Create a new access token from refresh token
            new_access_token = manager.refresh_access_token("test_user", "test@example.com")

            assert new_access_token is not None
            assert isinstance(new_access_token, str)
            assert new_access_token != refresh_token

    def test_revoke_token(self, app, mock_redis):
        """Test revoking a token"""
        from flask_jwt_extended import decode_token
        from app.services.token_service import TokenManager

        with app.app_context():
            manager = TokenManager(mock_redis, app.config)
            access_token, _ = manager.create_tokens("test_user", "test@example.com")

            # Get JTI from token
            decoded = decode_token(access_token)
            jti = decoded["jti"]

            # Revoke token
            result = manager.revoke_token(jti)
            assert result is True

            # Verify token is in blacklist
            assert mock_redis.setex.called

    def test_is_token_revoked(self, app, mock_redis):
        """Test checking if token is revoked"""
        from app.services.token_service import TokenManager

        with app.app_context():
            manager = TokenManager(mock_redis, app.config)

            # Test non-revoked token
            mock_redis.exists.return_value = 0
            assert manager.is_token_revoked("non-revoked-jti") is False

            # Test revoked token
            mock_redis.exists.return_value = 1
            assert manager.is_token_revoked("revoked-jti") is True

    def test_get_token_expiry_times(self, app, mock_redis):
        """Test getting token expiry times"""
        from app.services.token_service import TokenManager

        with app.app_context():
            manager = TokenManager(mock_redis, app.config)
            expiry = manager.get_token_expiry_times()

            assert expiry is not None
            assert "access_token_expires_seconds" in expiry
            assert "refresh_token_expires_seconds" in expiry
            assert expiry["access_token_expires_seconds"] == 900
            assert expiry["refresh_token_expires_seconds"] == 2592000


class TestEmailService:
    """Tests for EmailService"""

    def test_import_email_service(self):
        """Test that EmailService can be imported"""
        try:
            from app.services.email_service import EmailService

            assert EmailService is not None
        except ImportError as e:
            pytest.fail(f"Failed to import EmailService: {e}")

    @patch.dict(os.environ, {"SENDGRID_API_KEY": ""})
    def test_email_service_without_api_key(self):
        """Test EmailService gracefully handles missing API key"""
        from app.services.email_service import EmailService

        service = EmailService()
        assert service.is_configured() is False

    @patch.dict(os.environ, {"SENDGRID_API_KEY": "test-key"})
    def test_email_service_initialization(self):
        """Test EmailService initialization"""
        from app.services.email_service import EmailService

        service = EmailService(api_key="test-key")
        assert service is not None
        assert service.from_email == "noreply@cursa.app"


class TestTOTPService:
    """Tests for TOTP 2FA Service"""

    def test_import_totp_service(self):
        """Test that TOTPService can be imported"""
        try:
            from app.services.totp_service import TOTPService

            assert TOTPService is not None
        except ImportError as e:
            pytest.fail(f"Failed to import TOTPService: {e}")

    def test_generate_secret(self):
        """Test generating TOTP secret"""
        from app.services.totp_service import TOTPService

        service = TOTPService()
        secret = service.generate_secret()

        assert secret is not None
        assert isinstance(secret, str)
        assert len(secret) == 32  # Base32 encoded

    def test_generate_qr_code(self):
        """Test generating QR code"""
        from app.services.totp_service import TOTPService

        service = TOTPService()
        secret = service.generate_secret()
        qr_code = service.generate_qr_code("test@example.com", secret)

        assert qr_code is not None
        assert isinstance(qr_code, str)
        assert qr_code.startswith("iVBORw0KGgoAAAANSUhEUgAA")  # PNG base64 magic bytes

    def test_generate_backup_codes(self):
        """Test generating backup codes"""
        from app.services.totp_service import TOTPService

        service = TOTPService()
        codes = service.generate_backup_codes(10)

        assert len(codes) == 10
        assert all(isinstance(code, str) for code in codes)
        assert all(code.count("-") == 3 for code in codes)  # XXX-XXX-XXX-XXX format

    def test_verify_totp_token(self):
        """Test TOTP token verification"""
        from app.services.totp_service import TOTPService
        import pyotp
        import time

        service = TOTPService()
        secret = service.generate_secret()

        # Generate a valid token
        totp = pyotp.TOTP(secret)
        valid_token = totp.now()

        # Verify token
        result = service.verify_token(secret, valid_token)
        assert result is True

        # Verify invalid token
        result = service.verify_token(secret, "000000")
        assert result is False


class TestVerificationService:
    """Tests for Email Verification Service"""

    def test_import_verification_service(self):
        """Test that VerificationService can be imported"""
        try:
            from app.services.verification_service import VerificationService

            assert VerificationService is not None
        except ImportError as e:
            pytest.fail(f"Failed to import VerificationService: {e}")

    def test_generate_token(self):
        """Test token generation"""
        from app.services.verification_service import VerificationService

        service = VerificationService()
        token = service.generate_token()

        assert token is not None
        assert isinstance(token, str)
        assert len(token) == 32  # 16 bytes hex = 32 characters

    def test_create_verification_token(self, mock_redis):
        """Test creating verification token"""
        from app.services.verification_service import VerificationService

        service = VerificationService(storage=mock_redis)
        token = service.create_verification_token("test@example.com", "email")

        assert token is not None
        assert isinstance(token, str)
        assert mock_redis.setex.called

    def test_rate_limiting(self, mock_redis):
        """Test attempt rate limiting"""
        from app.services.verification_service import VerificationService

        service = VerificationService(storage=mock_redis)

        # Simulate counting attempts
        mock_redis.get.return_value = b"3"
        is_allowed, remaining = service.check_rate_limit("test-token")

        assert is_allowed is True
        assert remaining == 2  # 5 max - 3 attempts = 2 remaining


class TestSecurityMiddleware:
    """Tests for Security middleware"""

    def test_import_security(self):
        """Test that security module can be imported"""
        try:
            from app import security

            assert security is not None
        except ImportError as e:
            pytest.fail(f"Failed to import security module: {e}")

    def test_validate_email(self):
        """Test email validation"""
        from app.security import validate_email

        assert validate_email("test@example.com") is True
        assert validate_email("invalid-email") is False
        assert validate_email("test@domain.co.uk") is True

    def test_sanitize_input(self):
        """Test input sanitization"""
        from app.security import sanitize_input

        # Test XSS prevention
        malicious = '<script>alert("xss")</script>'
        sanitized = sanitize_input(malicious)
        assert "<script>" not in sanitized

        # Test length limit
        long_string = "a" * 2000
        sanitized = sanitize_input(long_string, max_length=1000)
        assert len(sanitized) == 1000

    def test_mask_sensitive_data(self):
        """Test sensitive data masking"""
        from app.security import mask_sensitive_data

        data = {
            "username": "john_doe",
            "password": "super_secret_password",
            "email": "john@example.com",
        }

        masked = mask_sensitive_data(data)
        assert masked["username"] == "john_doe"
        assert "super" not in masked["password"]
        assert masked["password"].startswith("sup")


class TestUser2FA:
    """Tests for User 2FA helpers"""

    def test_enable_disable_2fa(self):
        """User can enable and disable 2FA"""
        from app.models.user import User
        from app.services.totp_service import totp_service

        user = User(email="twofa@example.com")
        secret = totp_service.generate_secret()
        backup_codes = totp_service.generate_backup_codes(5)

        user.enable_2fa(secret, backup_codes)
        assert user.totp_enabled is True
        assert user.totp_secret == secret
        assert user.backup_codes == backup_codes

        user.disable_2fa()
        assert user.totp_enabled is False
        assert user.totp_secret is None
        assert user.backup_codes is None

    def test_verify_backup_code(self):
        """User can verify with backup code"""
        from app.models.user import User
        from app.services.totp_service import totp_service

        user = User(email="backup@example.com")
        secret = totp_service.generate_secret()
        backup_codes = totp_service.generate_backup_codes(3)

        user.totp_secret = secret
        user.backup_codes = backup_codes

        valid_code = backup_codes[0]
        assert user.verify_2fa_token(valid_code) is True
        assert valid_code not in user.backup_codes


# Integration tests
class TestAuthenticationFlow:
    """Integration tests for complete authentication flow"""

    def test_full_jwt_flow(self, app, mock_redis_with_tracking):
        """Test complete JWT authentication flow"""
        from app.services.token_service import TokenManager
        from flask_jwt_extended import decode_token

        with app.app_context():
            manager = TokenManager(mock_redis_with_tracking, app.config)

            # 1. Create tokens on login
            user_id = "user123"
            email = "user@example.com"
            access_token, refresh_token = manager.create_tokens(user_id, email)

            # 2. Verify token contents
            decoded = decode_token(access_token)
            assert decoded["sub"] == user_id

            # 3. Refresh token
            new_access = manager.refresh_access_token(user_id, email)
            assert new_access is not None

            # 4. Logout (revoke token)
            jti = decoded["jti"]
            manager.revoke_token(jti)
            assert manager.is_token_revoked(jti) is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
