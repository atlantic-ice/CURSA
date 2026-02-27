"""Email Verification and Password Reset Service"""

import os
import logging
import secrets
from typing import Optional, Dict, Tuple
from datetime import datetime, timedelta, timezone
from functools import wraps

logger = logging.getLogger(__name__)


class VerificationService:
    """Manages email verification and password reset tokens"""

    # Token types and their expiration times
    VERIFICATION_TOKEN_EXPIRES = 24 * 3600  # 24 hours
    RESET_TOKEN_EXPIRES = 3600  # 1 hour
    TOKEN_LENGTH = 32

    def __init__(self, storage=None):
        """
        Initialize verification service

        Args:
            storage: Redis or other storage instance for token management
                     If None, will try to use Flask-RedisService
        """
        self.storage = storage
        self._attempts_key_prefix = "verify:attempts:"
        self._tokens_key_prefix = "verify:tokens:"
        self._max_attempts = 5  # Max verification attempts per token
        self._attempt_window = 300  # 5 minutes

    def set_storage(self, storage):
        """Set the storage backend (Redis)"""
        self.storage = storage

    def generate_token(self) -> str:
        """
        Generate a secure verification token

        Returns:
            Random 32-character hex token
        """
        token = secrets.token_hex(self.TOKEN_LENGTH // 2)
        logger.debug(f"✓ Verification token generated")
        return token

    def create_verification_token(self, user_email: str, token_type: str = "email") -> str:
        """
        Create and store a verification token

        Args:
            user_email: User's email address
            token_type: Type of token ('email' or 'password_reset')

        Returns:
            Verification token
        """
        if not self.storage:
            logger.warning("⚠️  Storage not configured, token will be generated but not stored")

        token = self.generate_token()
        expiration = (
            self.VERIFICATION_TOKEN_EXPIRES if token_type == "email" else self.RESET_TOKEN_EXPIRES
        )

        if self.storage:
            try:
                # Store token with expiration
                key = f"{self._tokens_key_prefix}{token_type}:{token}"
                data = {
                    "email": user_email,
                    "type": token_type,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "expires_at": (
                        datetime.now(timezone.utc) + timedelta(seconds=expiration)
                    ).isoformat(),
                }

                # Store in Redis with automatic expiration
                self.storage.setex(key, expiration, str(data))
                logger.info(f"✓ {token_type} token created for {user_email}")
            except Exception as e:
                logger.error(f"✗ Failed to store token: {str(e)}")
                raise

        return token

    def verify_email_token(self, token: str, user_email: str) -> Tuple[bool, str]:
        """
        Verify an email verification token

        Args:
            token: Token to verify
            user_email: Expected email address

        Returns:
            Tuple of (is_valid, message)
        """
        if not self.storage:
            logger.warning("⚠️  Storage not configured, cannot verify token")
            return False, "Email service not configured"

        try:
            key = f"{self._tokens_key_prefix}email:{token}"

            # Check if token exists
            token_data = self.storage.get(key)
            if not token_data:
                logger.warning(f"⚠️  Token not found or expired: {token[:10]}...")
                return False, "Link expired or invalid. Please request a new verification email."

            # Parse token data (it's stored as string repr of dict)
            token_info = eval(token_data) if isinstance(token_data, str) else token_data

            # Verify email matches
            if token_info.get("email") != user_email:
                logger.warning(f"⚠️  Email mismatch in token")
                return False, "Token does not match email"

            # Delete token after successful verification
            self.storage.delete(key)
            logger.info(f"✓ Email verified for {user_email}")
            return True, "Email verified successfully"

        except Exception as e:
            logger.error(f"✗ Error verifying token: {str(e)}")
            return False, "Verification failed"

    def create_password_reset_token(self, user_email: str) -> str:
        """Create a password reset token"""
        return self.create_verification_token(user_email, token_type="password_reset")

    def verify_reset_token(self, token: str, user_email: str) -> Tuple[bool, str]:
        """
        Verify a password reset token

        Args:
            token: Token to verify
            user_email: Expected email address

        Returns:
            Tuple of (is_valid, message)
        """
        if not self.storage:
            logger.warning("⚠️  Storage not configured")
            return False, "Password reset service not configured"

        try:
            key = f"{self._tokens_key_prefix}password_reset:{token}"

            # Check if token exists
            token_data = self.storage.get(key)
            if not token_data:
                logger.warning(f"⚠️  Reset token expired")
                return False, "Reset link expired. Please request a new one."

            # Parse token data
            token_info = eval(token_data) if isinstance(token_data, str) else token_data

            # Verify email matches
            if token_info.get("email") != user_email:
                logger.warning(f"⚠️  Email mismatch in reset token")
                return False, "Token invalid"

            logger.info(f"✓ Reset token verified for {user_email}")
            return True, "Token valid"

        except Exception as e:
            logger.error(f"✗ Error verifying reset token: {str(e)}")
            return False, "Verification failed"

    def consume_reset_token(self, token: str) -> bool:
        """
        Consume (delete) a password reset token after use

        Args:
            token: Token to consume

        Returns:
            True if token was deleted
        """
        if not self.storage:
            return True  # If no storage, allow "consumption"

        try:
            key = f"{self._tokens_key_prefix}password_reset:{token}"
            deleted = self.storage.delete(key)
            if deleted:
                logger.info(f"✓ Reset token consumed")
            return deleted
        except Exception as e:
            logger.error(f"✗ Error consuming token: {str(e)}")
            return False

    def track_attempt(self, token: str) -> Tuple[int, int]:
        """
        Track verification attempts per token to prevent brute force

        Args:
            token: Token being verified

        Returns:
            Tuple of (attempts_made, remaining_attempts)
        """
        if not self.storage:
            return 1, self._max_attempts

        try:
            key = f"{self._attempts_key_prefix}{token}"

            # Increment attempt counter
            attempts = self.storage.incr(key)

            # Set expiration if first attempt
            if attempts == 1:
                self.storage.expire(key, self._attempt_window)

            remaining = max(0, self._max_attempts - attempts)
            logger.debug(f"Attempt {attempts}/{self._max_attempts} for token")

            return attempts, remaining
        except Exception as e:
            logger.error(f"✗ Error tracking attempts: {str(e)}")
            return 1, self._max_attempts

    def check_rate_limit(self, token: str) -> Tuple[bool, int]:
        """
        Check if token verification attempts have exceeded limit

        Args:
            token: Token to check

        Returns:
            Tuple of (is_allowed, remaining_attempts)
        """
        if not self.storage:
            return True, self._max_attempts

        try:
            key = f"{self._attempts_key_prefix}{token}"
            attempts = int(self.storage.get(key) or 0)
            remaining = max(0, self._max_attempts - attempts)

            is_allowed = attempts < self._max_attempts
            return is_allowed, remaining
        except Exception as e:
            logger.error(f"✗ Error checking rate limit: {str(e)}")
            return True, self._max_attempts

    def clear_attempts(self, token: str) -> bool:
        """Clear attempt counter for token"""
        if not self.storage:
            return True

        try:
            key = f"{self._attempts_key_prefix}{token}"
            self.storage.delete(key)
            logger.debug(f"Attempt counter cleared for token")
            return True
        except Exception as e:
            logger.error(f"✗ Error clearing attempts: {str(e)}")
            return False

    def get_token_info(self, token: str) -> Optional[Dict]:
        """
        Get information about a stored token

        Args:
            token: Token to check

        Returns:
            Dictionary with token info or None if not found
        """
        if not self.storage:
            return None

        try:
            # Try email token first
            key = f"{self._tokens_key_prefix}email:{token}"
            data = self.storage.get(key)

            if not data:
                # Try password reset token
                key = f"{self._tokens_key_prefix}password_reset:{token}"
                data = self.storage.get(key)

            if data:
                return eval(data) if isinstance(data, str) else data
            return None
        except Exception as e:
            logger.error(f"✗ Error getting token info: {str(e)}")
            return None


# Convenience instance
verification_service = VerificationService()


def require_email_verification(f):
    """
    Decorator to require email verification for endpoints
    Usage:
        @require_email_verification
        def my_endpoint():
            pass
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import request, jsonify
        from flask_jwt_extended import get_jwt_identity

        # This would check user's email_verified status
        # Implementation depends on your User model
        return f(*args, **kwargs)

    return decorated_function
