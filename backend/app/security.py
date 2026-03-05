"""Security middleware and decorators for CURSA API"""

import logging
import hashlib
import hmac
from functools import wraps
from datetime import datetime
from typing import Callable, Optional, Dict, Any
from flask import request, jsonify, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app.config.security import RATE_LIMITS

logger = logging.getLogger(__name__)


# Initialize rate limiter without storage (will be configured in Flask app)
# Storage будет установлен в setup_rate_limiting() с graceful degradation
limiter = Limiter(
    key_func=get_remote_address,
    # Берем базовый лимит из конфигурации безопасности,
    # чтобы не блокировать легитимный трафик (например, polling профилей).
    default_limits=[RATE_LIMITS.get("default", "200 per minute")],
    storage_uri="memory://",  # Default fallback
)


class SecurityHeaders:
    """Security headers for protection against common vulnerabilities"""

    # Standard security headers
    HEADERS = {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
    }

    @staticmethod
    def apply_headers(response):
        """Apply security headers to response"""
        for header, value in SecurityHeaders.HEADERS.items():
            response.headers[header] = value

        # Add CORS headers
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

        # CSP header
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none'"
        )

        return response


def add_security_headers(f: Callable) -> Callable:
    """Decorator to add security headers to response"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = f(*args, **kwargs)
        if hasattr(response, "headers"):
            SecurityHeaders.apply_headers(response)
        return response

    return decorated_function


def rate_limit(limit: str = "10 per minute"):
    """
    Decorator to rate limit endpoints

    Examples:
        @rate_limit("5 per minute")
        def login():
            pass

        @rate_limit("10/hour")
        def register():
            pass
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        @limiter.limit(limit)
        def decorated_function(*args, **kwargs):
            return f(*args, **kwargs)

        return decorated_function

    return decorator


def validate_json(*required_fields: str):
    """
    Decorator to validate JSON request has required fields

    Usage:
        @validate_json('email', 'password')
        def login():
            pass
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Content-Type must be application/json"}), 400

            data = request.get_json()
            missing_fields = [field for field in required_fields if field not in data]

            if missing_fields:
                return (
                    jsonify({"error": f'Missing required fields: {", ".join(missing_fields)}'}),
                    400,
                )

            # Store data in request context
            g.json_data = data
            return f(*args, **kwargs)

        return decorated_function

    return decorator


def validate_email(email: str) -> bool:
    """
    Validate email format

    Args:
        email: Email address to validate

    Returns:
        True if valid, False otherwise
    """
    import re

    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def sanitize_input(data: str, max_length: int = 1000) -> str:
    """
    Sanitize user input to prevent XSS

    Args:
        data: Input to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized string
    """
    if not isinstance(data, str):
        return data

    # Remove leading/trailing whitespace
    data = data.strip()

    # Check length
    if len(data) > max_length:
        return data[:max_length]

    # Remove potentially dangerous characters (basic protection)
    dangerous_chars = ["<", ">", '"', "'", "&", ";", "`"]
    for char in dangerous_chars:
        data = data.replace(char, "")

    return data


def verify_signature(secret: str) -> Callable:
    """
    Decorator to verify request signature (for webhooks)

    Usage:
        @verify_signature(os.environ.get('WEBHOOK_SECRET'))
        def webhook_handler():
            pass
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get signature from header
            signature_header = request.headers.get("X-Signature")
            if not signature_header:
                logger.warning("⚠️  Missing signature header")
                return jsonify({"error": "Invalid signature"}), 401

            # Get request body
            body = request.get_data(as_text=True)

            # Calculate expected signature
            expected_signature = hmac.new(
                secret.encode(), body.encode(), hashlib.sha256
            ).hexdigest()

            # Compare signatures (using constant-time comparison)
            if not hmac.compare_digest(signature_header, expected_signature):
                logger.warning(f"⚠️  Invalid signature from {request.remote_addr}")
                return jsonify({"error": "Invalid signature"}), 401

            logger.debug(f"✓ Signature verified from {request.remote_addr}")
            return f(*args, **kwargs)

        return decorated_function

    return decorator


def log_request_info(f: Callable) -> Callable:
    """Decorator to log request details for debugging"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        logger.debug(
            f"""
        Request: {request.method} {request.path}
        IP: {request.remote_addr}
        Data: {request.get_json() if request.is_json else None}
        """
        )
        return f(*args, **kwargs)

    return decorated_function


def handle_errors(f: Callable) -> Callable:
    """Decorator to handle common errors gracefully"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            logger.warning(f"⚠️  Validation error: {str(e)}")
            return jsonify({"error": str(e)}), 400
        except PermissionError as e:
            logger.warning(f"⚠️  Permission denied: {str(e)}")
            return jsonify({"error": "Permission denied"}), 403
        except Exception as e:
            logger.error(f"✗ Unexpected error: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    return decorated_function


class IPWhitelist:
    """IP whitelist for sensitive endpoints"""

    def __init__(self, allowed_ips: Optional[list] = None):
        self.allowed_ips = allowed_ips or []

    def add_ip(self, ip: str):
        """Add IP to whitelist"""
        if ip not in self.allowed_ips:
            self.allowed_ips.append(ip)
            logger.info(f"✓ IP added to whitelist: {ip}")

    def remove_ip(self, ip: str):
        """Remove IP from whitelist"""
        if ip in self.allowed_ips:
            self.allowed_ips.remove(ip)
            logger.info(f"✓ IP removed from whitelist: {ip}")

    def is_allowed(self, ip: str) -> bool:
        """Check if IP is allowed"""
        return ip in self.allowed_ips or len(self.allowed_ips) == 0

    def require(self) -> Callable:
        """Decorator to enforce IP whitelist"""

        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def decorated_function(*args, **kwargs):
                ip = request.remote_addr
                if not self.is_allowed(ip):
                    logger.warning(f"⚠️  Request from non-whitelisted IP: {ip}")
                    return jsonify({"error": "Access denied"}), 403
                return f(*args, **kwargs)

            return decorated_function

        return decorator


class CORSConfig:
    """CORS configuration for frontend requests"""

    DEFAULT_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5000",
        "https://cursa.app",
        "https://www.cursa.app",
    ]

    DEFAULT_ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]

    DEFAULT_ALLOWED_HEADERS = [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Accept-Language",
    ]

    @classmethod
    def get_config(cls) -> Dict[str, Any]:
        """Get CORS configuration"""
        return {
            "origins": cls.DEFAULT_ALLOWED_ORIGINS,
            "methods": cls.DEFAULT_ALLOWED_METHODS,
            "allow_headers": cls.DEFAULT_ALLOWED_HEADERS,
            "supports_credentials": True,
            "max_age": 86400,  # 24 hours
        }


def mask_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mask sensitive fields in logging/response

    Args:
        data: Dictionary with potentially sensitive data

    Returns:
        Dictionary with masked sensitive fields
    """
    sensitive_fields = [
        "password",
        "token",
        "secret",
        "api_key",
        "refresh_token",
        "access_token",
        "ssn",
        "credit_card",
    ]

    masked = data.copy()
    for field in sensitive_fields:
        if field in masked:
            value = str(masked[field])
            masked[field] = f"{value[:3]}...{value[-3:]}" if len(value) > 6 else "***"

    return masked
