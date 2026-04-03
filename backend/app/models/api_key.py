"""
API Key model for programmatic access
"""

from datetime import datetime, timezone
import hashlib
from app.extensions import db


class APIKey(db.Model):
    """API key model for programmatic access (Pro+)"""

    __tablename__ = 'api_keys'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    # Key details
    name = db.Column(db.String(255), nullable=False)  # User-friendly name
    key_hash = db.Column(db.String(255), unique=True, nullable=False, index=True)  # Hashed API key
    key_prefix = db.Column(db.String(20), nullable=False)  # First 8 chars for display

    # Permissions
    scopes = db.Column(db.JSON, default=list)  # ['document:check', 'document:correct', etc]

    # Rate limiting
    rate_limit = db.Column(db.Integer, default=100)  # requests per hour

    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Usage tracking
    last_used_at = db.Column(db.DateTime(timezone=True))
    usage_count = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True))  # Optional expiration

    # Relationships
    user = db.relationship('User', back_populates='api_keys')

    @staticmethod
    def hash_key(raw_key: str) -> str:
        """Create deterministic hash for API key lookup and storage."""
        return hashlib.sha256(raw_key.encode()).hexdigest()

    @property
    def is_valid(self) -> bool:
        """Check if API key is valid"""
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < datetime.now(timezone.utc):
            return False
        return True

    def to_dict(self, include_key: bool = False) -> dict:
        """Convert API key to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'key_prefix': self.key_prefix,
            'scopes': self.scopes,
            'is_active': self.is_active,
            'is_valid': self.is_valid,
            'usage_count': self.usage_count,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
        if include_key:
            # WARNING: Only show on creation
            data['key_hash'] = self.key_hash
        return data

    def __repr__(self) -> str:
        return f'<APIKey {self.key_prefix}... for User {self.user_id}>'
