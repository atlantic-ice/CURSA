"""
Subscription model for user subscriptions
"""

from datetime import datetime, timezone
from enum import Enum as PyEnum
from app.extensions import db


class SubscriptionStatus(PyEnum):
    """Subscription status enumeration"""
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    TRIAL = 'trial'
    CANCELLED = 'cancelled'
    EXPIRED = 'expired'


class Subscription(db.Model):
    """User subscription model"""
    
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Subscription details
    plan = db.Column(db.String(50), nullable=False)  # PRO, TEAM, ENTERPRISE
    status = db.Column(db.Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False)
    
    # Billing
    amount = db.Column(db.Numeric(10, 2), nullable=False)  # Monthly price
    currency = db.Column(db.String(3), default='RUB', nullable=False)
    
    # Dates
    started_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    cancelled_at = db.Column(db.DateTime(timezone=True))
    
    # External references
    stripe_subscription_id = db.Column(db.String(255), unique=True, index=True)
    yookassa_subscription_id = db.Column(db.String(255), unique=True, index=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), 
                          onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='subscriptions')
    
    @property
    def is_active(self) -> bool:
        """Check if subscription is currently active"""
        return (
            self.status == SubscriptionStatus.ACTIVE and 
            self.expires_at > datetime.now(timezone.utc)
        )
    
    @property
    def days_remaining(self) -> int:
        """Calculate days remaining in subscription"""
        if not self.is_active:
            return 0
        delta = self.expires_at - datetime.now(timezone.utc)
        return max(0, delta.days)
    
    def to_dict(self) -> dict:
        """Convert subscription to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan': self.plan,
            'status': self.status.value,
            'amount': float(self.amount),
            'currency': self.currency,
            'started_at': self.started_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'is_active': self.is_active,
            'days_remaining': self.days_remaining
        }
    
    def __repr__(self) -> str:
        return f'<Subscription {self.plan} for User {self.user_id}>'
