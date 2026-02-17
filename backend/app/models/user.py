"""
User model with enhanced authentication and profile information
"""

from datetime import datetime, timezone
from enum import Enum as PyEnum
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


class UserRole(PyEnum):
    """User role enumeration"""
    GUEST = 'guest'  # 1 проверка/день (без регистрации)
    USER = 'user'  # 5 проверок/день
    PRO = 'pro'  # Безлимит, авто-исправление, API
    TEAM = 'team'  # 10 пользователей
    ENTERPRISE = 'enterprise'  # Кастомные профили, AI, SLA
    ADMIN = 'admin'  # Управление системой


class User(db.Model):
    """User model with authentication and profile information"""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for OAuth users
    
    # Profile
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    organization = db.Column(db.String(255))
    
    # Role and status
    role = db.Column(db.Enum(UserRole), default=UserRole.USER, nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_email_verified = db.Column(db.Boolean, default=False, nullable=False)
    email_verification_token = db.Column(db.String(255), unique=True)
    
    # OAuth
    oauth_provider = db.Column(db.String(50))  # google, github, yandex
    oauth_id = db.Column(db.String(255), unique=True, index=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), 
                          onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    last_login_at = db.Column(db.DateTime(timezone=True))
    
    # Relationships
    subscriptions = db.relationship('Subscription', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')
    documents = db.relationship('Document', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')
    payments = db.relationship('Payment', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')
    api_keys = db.relationship('APIKey', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')
    
    def set_password(self, password: str) -> None:
        """Hash and set user password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        """Verify user password"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email.split('@')[0]
    
    @property
    def current_subscription(self):
        """Get user's current active subscription"""
        from app.models.subscription import SubscriptionStatus
        active_subs = self.subscriptions.filter_by(status=SubscriptionStatus.ACTIVE).all()
        for sub in active_subs:
            if sub.expires_at > datetime.now(timezone.utc):
                return sub
        return None
    
    @property
    def is_admin(self) -> bool:
        """Check if user is admin"""
        return self.role == UserRole.ADMIN
    
    def to_dict(self, include_email: bool = True) -> dict:
        """Convert user to dictionary"""
        data = {
            'id': self.id,
            'full_name': self.full_name,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'organization': self.organization,
            'role': self.role.value,
            'is_active': self.is_active,
            'is_email_verified': self.is_email_verified,
            'created_at': self.created_at.isoformat(),
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
        if include_email:
            data['email'] = self.email
        return data
    
    def __repr__(self) -> str:
        return f'<User {self.email}>'

