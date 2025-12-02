"""
Конфигурация безопасности приложения.

Настройки rate limiting, валидации загрузок и защиты от атак.
"""

import os
from typing import Dict, Any

# === Rate Limiting ===
# Ограничения количества запросов

RATE_LIMITS: Dict[str, str] = {
    # Глобальный лимит на IP
    'default': '200 per minute',
    
    # Загрузка файлов (ресурсоёмкая операция)
    'upload': '10 per minute',
    
    # Исправление документов
    'correct': '20 per minute',
    
    # API профилей
    'profiles': '100 per minute',
    
    # Создание/изменение профилей
    'profiles_write': '20 per minute',
    
    # Импорт/экспорт
    'import_export': '30 per minute',
}


# === Валидация загрузок ===

# Максимальный размер файла (в байтах)
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB

# Разрешённые расширения файлов
ALLOWED_EXTENSIONS = {'docx'}

# Разрешённые MIME типы
ALLOWED_MIME_TYPES = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',  # Иногда браузеры отправляют как binary
}

# Минимальный размер файла (защита от пустых файлов)
MIN_FILE_SIZE = 1024  # 1 KB

# Максимальный размер JSON payload для профилей
MAX_PROFILE_SIZE = 1 * 1024 * 1024  # 1 MB


# === Защита путей ===

# Паттерны опасных символов в именах файлов
DANGEROUS_PATH_PATTERNS = [
    '..',       # Path traversal
    '/',        # Unix path separator
    '\\',       # Windows path separator
    ':',        # Windows drive letter
    '<', '>',   # Redirect symbols
    '|',        # Pipe
    '"',        # Quote
    '*', '?',   # Wildcards
    '\x00',     # Null byte
]


# === Заголовки безопасности ===

SECURITY_HEADERS: Dict[str, str] = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'"
    ),
}


# === Функции валидации ===

def is_allowed_file(filename: str) -> bool:
    """Проверяет, разрешён ли файл по расширению"""
    if not filename or '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def is_safe_filename(filename: str) -> bool:
    """Проверяет, безопасно ли имя файла"""
    if not filename:
        return False
    
    for pattern in DANGEROUS_PATH_PATTERNS:
        if pattern in filename:
            return False
    
    return True


def sanitize_filename(filename: str) -> str:
    """Очищает имя файла от опасных символов"""
    if not filename:
        return 'document.docx'
    
    # Удаляем опасные символы
    safe_name = filename
    for pattern in DANGEROUS_PATH_PATTERNS:
        safe_name = safe_name.replace(pattern, '_')
    
    # Убираем пробелы в начале и конце
    safe_name = safe_name.strip()
    
    # Если имя стало пустым, используем дефолтное
    if not safe_name:
        return 'document.docx'
    
    # Добавляем расширение если его нет
    if '.' not in safe_name:
        safe_name += '.docx'
    
    return safe_name


def get_config() -> Dict[str, Any]:
    """Возвращает полную конфигурацию безопасности"""
    return {
        'rate_limits': RATE_LIMITS,
        'max_content_length': MAX_CONTENT_LENGTH,
        'allowed_extensions': list(ALLOWED_EXTENSIONS),
        'allowed_mime_types': list(ALLOWED_MIME_TYPES),
        'min_file_size': MIN_FILE_SIZE,
        'max_profile_size': MAX_PROFILE_SIZE,
        'security_headers': SECURITY_HEADERS,
    }
