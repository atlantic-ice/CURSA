"""Token management with Redis blacklist support"""

from datetime import datetime, timedelta, timezone
from flask_jwt_extended import create_access_token, create_refresh_token
from redis import Redis
import logging

logger = logging.getLogger(__name__)


class TokenManager:
    """Manages JWT tokens with Redis blacklist for logout support"""

    def __init__(self, redis_client: Redis, config: dict):
        """
        Initialize TokenManager

        Args:
            redis_client: Redis client instance
            config: Config dict with JWT settings
                - JWT_ACCESS_TOKEN_EXPIRES: seconds (default 900 = 15 min)
                - JWT_REFRESH_TOKEN_EXPIRES: seconds (default 2592000 = 30 days)
        """
        self.redis = redis_client
        self.access_expires = self._normalize_expiry(config.get("JWT_ACCESS_TOKEN_EXPIRES", 900))
        self.refresh_expires = self._normalize_expiry(
            config.get("JWT_REFRESH_TOKEN_EXPIRES", 2592000)
        )

        # Validate Redis connection
        try:
            self.redis.ping()
            logger.info("✓ Redis connection established for TokenManager")
        except Exception as e:
            logger.error(f"✗ Redis connection failed: {str(e)}")
            raise

    def create_tokens(self, user_id: int, email: str) -> tuple:
        """
        Generate access and refresh JWT tokens

        Args:
            user_id: User ID
            email: User email

        Returns:
            Tuple of (access_token, refresh_token)
        """
        try:
            additional_claims = {
                "email": email,
                "user_id": user_id,
                "issued_at": datetime.now(timezone.utc).isoformat(),
            }

            # Create access token (short-lived, 15 minutes)
            access_token = create_access_token(
                identity=str(user_id),
                expires_delta=timedelta(seconds=self.access_expires),
                additional_claims=additional_claims,
            )

            # Create refresh token (long-lived, 30 days)
            refresh_token = create_refresh_token(
                identity=str(user_id),
                expires_delta=timedelta(seconds=self.refresh_expires),
                additional_claims={"email": email},
            )

            logger.info(f"✓ Created tokens for user {user_id} ({email})")
            return access_token, refresh_token

        except Exception as e:
            logger.error(f"✗ Failed to create tokens: {str(e)}")
            raise

    def revoke_token(self, jti: str, expires_in: int = 3600) -> bool:
        """
        Add JWT to blacklist (for logout)

        Args:
            jti: JWT ID (from token payload)
            expires_in: Seconds until token naturally expires (to clean up Redis)

        Returns:
            True if revoked successfully
        """
        try:
            self.redis.setex(
                f"token_blacklist:{jti}", expires_in, "revoked"  # Auto-delete after token expires
            )
            logger.info(f"✓ Revoked token {jti[:10]}...")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to revoke token: {str(e)}")
            return False

    def is_token_revoked(self, jti: str) -> bool:
        """
        Check if JWT is in blacklist

        Args:
            jti: JWT ID from token

        Returns:
            True if token is revoked, False otherwise
        """
        try:
            is_revoked = self.redis.exists(f"token_blacklist:{jti}") > 0
            if is_revoked:
                logger.debug(f"✗ Token {jti[:10]}... is revoked")
            return is_revoked
        except Exception as e:
            logger.error(f"✗ Failed to check token revocation: {str(e)}")
            # Be conservative: if Redis fails, reject token
            return True

    def verify_token_not_revoked(self, jti: str):
        """
        Called by Flask-JWT to validate token is not revoked.
        This is the callback registered with JWT.

        Args:
            jti: JWT ID

        Raises:
            Exception: If token is revoked
        """
        if self.is_token_revoked(jti):
            raise Exception("Token has been revoked (logout)")

    def refresh_access_token(self, user_id: int, email: str) -> str:
        """
        Generate new access token from refresh token

        Args:
            user_id: User ID
            email: User email

        Returns:
            New access token
        """
        try:
            additional_claims = {
                "email": email,
                "user_id": user_id,
                "refreshed_at": datetime.now(timezone.utc).isoformat(),
            }

            access_token = create_access_token(
                identity=str(user_id),
                expires_delta=timedelta(seconds=self.access_expires),
                additional_claims=additional_claims,
            )

            logger.info(f"✓ Refreshed access token for user {user_id}")
            return access_token

        except Exception as e:
            logger.error(f"✗ Failed to refresh token: {str(e)}")
            raise

    def get_token_expiry_times(self) -> dict:
        """Get configured token expiry times"""
        return {
            "access_token_expires_seconds": self.access_expires,
            "access_token_expires_minutes": self.access_expires / 60,
            "refresh_token_expires_seconds": self.refresh_expires,
            "refresh_token_expires_days": self.refresh_expires / (24 * 3600),
        }

    def _normalize_expiry(self, value) -> int:
        """Normalize JWT expiry configuration to seconds"""
        try:
            if hasattr(value, "total_seconds"):
                return int(value.total_seconds())
            return int(value)
        except Exception:
            return 900
