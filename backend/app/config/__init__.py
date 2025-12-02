"""
Модуль конфигурации приложения.
"""

from .security import (
    RATE_LIMITS,
    MAX_CONTENT_LENGTH,
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    MIN_FILE_SIZE,
    MAX_PROFILE_SIZE,
    SECURITY_HEADERS,
    is_allowed_file,
    is_safe_filename,
    sanitize_filename,
    get_config,
)

__all__ = [
    'RATE_LIMITS',
    'MAX_CONTENT_LENGTH',
    'ALLOWED_EXTENSIONS',
    'ALLOWED_MIME_TYPES',
    'MIN_FILE_SIZE',
    'MAX_PROFILE_SIZE',
    'SECURITY_HEADERS',
    'is_allowed_file',
    'is_safe_filename',
    'sanitize_filename',
    'get_config',
]
