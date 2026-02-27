"""Two-Factor Authentication (TOTP) Service using PyOTP"""

import os
import logging
from typing import Dict, List, Optional, Tuple
import pyotp
import qrcode
import io
from base64 import b64encode

logger = logging.getLogger(__name__)


class TOTPService:
    """Manages TOTP (Time-based One-Time Password) for 2FA"""

    # Standard TOTP settings
    TOTP_DIGITS = 6  # Standard 6-digit codes
    TOTP_INTERVAL = 30  # 30 seconds validity period
    ISSUER_NAME = "CURSA"

    def __init__(self, issuer_name: str = ISSUER_NAME):
        """
        Initialize TOTP service

        Args:
            issuer_name: Name of the service (shown in authenticator apps)
        """
        self.issuer_name = issuer_name

    def generate_secret(self) -> str:
        """
        Generate a new TOTP secret key

        Returns:
            Base32-encoded secret key for TOTP
        """
        secret = pyotp.random_base32()
        logger.info("✓ New TOTP secret generated")
        return secret

    def get_totp_uri(self, email: str, secret: str, issuer: Optional[str] = None) -> str:
        """
        Get provisioning URI for QR code generation

        Args:
            email: User email address
            secret: TOTP secret key
            issuer: Issuer name (defaults to self.issuer_name)

        Returns:
            otpauth:// URI string for QR code
        """
        issuer = issuer or self.issuer_name
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=email, issuer_name=issuer)
        return uri

    def generate_qr_code(self, email: str, secret: str, issuer: Optional[str] = None) -> str:
        """
        Generate QR code for TOTP secret

        Args:
            email: User email address
            secret: TOTP secret key
            issuer: Issuer name

        Returns:
            Base64-encoded PNG image of QR code
        """
        try:
            uri = self.get_totp_uri(email, secret, issuer)
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(uri)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")

            # Convert to bytes
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)

            # Encode to base64
            qr_base64 = b64encode(buffer.getvalue()).decode("utf-8")
            logger.info(f"✓ QR code generated for {email}")
            return qr_base64
        except Exception as e:
            logger.error(f"✗ Failed to generate QR code: {str(e)}")
            raise

    def verify_token(self, secret: str, token: str) -> bool:
        """
        Verify a TOTP token

        Args:
            secret: TOTP secret key
            token: 6-digit token from authenticator app

        Returns:
            True if token is valid, False otherwise
        """
        try:
            # Remove any spaces from token
            token = token.replace(" ", "").strip()

            if not token.isdigit() or len(token) != self.TOTP_DIGITS:
                logger.warning(f"⚠️  Invalid token format: {len(token)} digits")
                return False

            totp = pyotp.TOTP(secret)

            # Verify with a 30-second window (±1 interval) for clock skew
            is_valid = totp.verify(token, valid_window=1)

            if is_valid:
                logger.info(f"✓ TOTP token verified")
            else:
                logger.warning(f"⚠️  TOTP token verification failed")

            return is_valid
        except Exception as e:
            logger.error(f"✗ Error verifying token: {str(e)}")
            return False

    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """
        Generate backup codes for 2FA recovery

        Args:
            count: Number of codes to generate

        Returns:
            List of backup codes (format: XXX-XXX-XXX-XXX)
        """
        import secrets
        import string

        codes = []
        chars = string.ascii_uppercase + string.digits

        for _ in range(count):
            # Generate 12 characters (16 total with dashes)
            code = "".join(secrets.choice(chars) for _ in range(12))
            # Format as XXX-XXX-XXX-XXX
            formatted = f"{code[0:3]}-{code[3:6]}-{code[6:9]}-{code[9:12]}"
            codes.append(formatted)

        logger.info(f"✓ Generated {count} backup codes")
        return codes

    def verify_backup_code(
        self, backup_code: str, stored_codes: List[str]
    ) -> Tuple[bool, List[str]]:
        """
        Verify and consume a backup code

        Args:
            backup_code: Code to verify
            stored_codes: List of remaining backup codes

        Returns:
            Tuple of (is_valid, remaining_codes)
        """
        # Normalize the entered code
        backup_code = backup_code.replace(" ", "").replace("-", "").upper()
        # Normalize stored codes for comparison
        normalized_stored = [code.replace("-", "").upper() for code in stored_codes]

        if backup_code in normalized_stored:
            # Remove the used code
            idx = normalized_stored.index(backup_code)
            remaining = [code for i, code in enumerate(stored_codes) if i != idx]
            logger.info(f"✓ Backup code verified, {len(remaining)} remaining")
            return True, remaining

        logger.warning(f"⚠️  Invalid backup code")
        return False, stored_codes

    def get_time_remaining(self) -> int:
        """
        Get seconds remaining in current TOTP window

        Returns:
            Seconds until next code is required
        """
        import time

        return self.TOTP_INTERVAL - int(time.time()) % self.TOTP_INTERVAL

    def create_setup_response(
        self, email: str, secret: str, qr_code: str, backup_codes: List[str]
    ) -> Dict[str, any]:
        """
        Create response for 2FA setup endpoint

        Args:
            email: User email
            secret: TOTP secret
            qr_code: Base64-encoded QR code
            backup_codes: List of backup codes

        Returns:
            Dictionary with setup data for frontend
        """
        return {
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_code}",
            "backup_codes": backup_codes,
            "instructions": [
                "1. Откройте приложение Authenticator (Google Authenticator, Authy, Microsoft Authenticator)",
                "2. Отсканируйте QR-код или введите ключ вручную",
                "3. Введите 6-значный код из приложения для подтверждения",
            ],
            "backup_info": f"Сохраните эти {len(backup_codes)} кодов восстановления в безопасном месте",
        }


# Convenience instance
totp_service = TOTPService()


def verify_2fa_token(secret: str, token: str) -> bool:
    """Quick function to verify TOTP token"""
    return totp_service.verify_token(secret, token)


def generate_2fa_secret() -> str:
    """Quick function to generate TOTP secret"""
    return totp_service.generate_secret()


def get_2fa_qr_code(email: str, secret: str) -> str:
    """Quick function to get QR code for 2FA setup"""
    return totp_service.generate_qr_code(email, secret)
