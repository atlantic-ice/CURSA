"""Unit tests for TOTP Service"""

import pytest
from app.services.totp_service import totp_service


class TestTOTPService:
    """Test TOTP service functionality"""

    def test_generate_secret(self):
        """Test generating TOTP secret"""
        secret = totp_service.generate_secret()

        assert secret is not None
        assert len(secret) > 0
        assert isinstance(secret, str)

    def test_get_totp_uri(self):
        """Test getting TOTP provisioning URI"""
        email = "test@example.com"
        secret = totp_service.generate_secret()

        uri = totp_service.get_totp_uri(email, secret)

        assert uri is not None
        assert "otpauth://" in uri
        # Email may be URL-encoded in URI
        assert email in uri or email.replace("@", "%40") in uri
        assert "CURSA" in uri

    def test_generate_qr_code(self):
        """Test generating QR code"""
        email = "test@example.com"
        secret = totp_service.generate_secret()

        qr_code = totp_service.generate_qr_code(email, secret)

        assert qr_code is not None
        assert isinstance(qr_code, str)
        assert len(qr_code) > 0
        # QR code in base64 should contain data
        assert qr_code.startswith("iVBOR") or "iVBOR" in qr_code[:100] or len(qr_code) > 100

    def test_verify_token_valid(self):
        """Test verifying valid TOTP token"""
        secret = totp_service.generate_secret()

        # Generate current token using pyotp
        import pyotp

        totp = pyotp.TOTP(secret)
        token = totp.now()

        is_valid = totp_service.verify_token(secret, token)

        assert is_valid is True

    def test_verify_token_invalid(self):
        """Test verifying invalid TOTP token"""
        secret = totp_service.generate_secret()

        is_valid = totp_service.verify_token(secret, "000000")

        assert is_valid is False

    def test_verify_token_with_spaces(self):
        """Test verifying token with spaces"""
        secret = totp_service.generate_secret()

        import pyotp

        totp = pyotp.TOTP(secret)
        token = totp.now()
        token_with_spaces = f"{token[:3]} {token[3:]}"

        is_valid = totp_service.verify_token(secret, token_with_spaces)

        assert is_valid is True

    def test_generate_backup_codes(self):
        """Test generating backup codes"""
        codes = totp_service.generate_backup_codes(count=10)

        assert len(codes) == 10
        assert all(isinstance(code, str) for code in codes)
        assert all("-" in code for code in codes)  # Format XXX-XXX-XXX-XXX
        assert all(len(code.replace("-", "")) == 12 for code in codes)

    def test_verify_backup_code_valid(self):
        """Test verifying valid backup code"""
        codes = totp_service.generate_backup_codes(count=5)

        is_valid, remaining = totp_service.verify_backup_code(codes[0], codes)

        assert is_valid is True
        assert len(remaining) == 4
        assert codes[0] not in remaining

    def test_verify_backup_code_invalid(self):
        """Test verifying invalid backup code"""
        codes = totp_service.generate_backup_codes(count=5)

        is_valid, remaining = totp_service.verify_backup_code("INVALID-CODE-HERE", codes)

        assert is_valid is False
        assert len(remaining) == 5
        assert remaining == codes

    def test_verify_backup_code_case_insensitive(self):
        """Test verifying backup code is case insensitive"""
        codes = totp_service.generate_backup_codes(count=5)
        code_upper = codes[0].upper()

        is_valid, remaining = totp_service.verify_backup_code(code_upper, codes)

        assert is_valid is True
        assert len(remaining) == 4

    def test_get_time_remaining(self):
        """Test getting time remaining in TOTP window"""
        time_remaining = totp_service.get_time_remaining()

        assert 0 <= time_remaining <= 30
        assert isinstance(time_remaining, int)

    def test_create_setup_response(self):
        """Test creating setup response"""
        email = "test@example.com"
        secret = totp_service.generate_secret()
        qr_code = totp_service.generate_qr_code(email, secret)
        backup_codes = totp_service.generate_backup_codes(count=10)

        response = totp_service.create_setup_response(email, secret, qr_code, backup_codes)

        assert "secret" in response
        assert "qr_code" in response
        assert "backup_codes" in response
        assert response["secret"] == secret
        assert len(response["backup_codes"]) == 10
