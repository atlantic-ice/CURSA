"""
Payment model for payment transactions
"""

from datetime import datetime, timezone
from enum import Enum as PyEnum
from app.extensions import db


class PaymentStatus(PyEnum):
    """Payment status"""
    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'
    REFUNDED = 'refunded'


class Payment(db.Model):
    """Payment transaction model"""

    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    # Payment details
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='RUB', nullable=False)
    status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)

    # Provider information
    provider = db.Column(db.String(50), nullable=False)  # stripe, yookassa
    transaction_id = db.Column(db.String(255), unique=True, nullable=False, index=True)

    # Metadata
    description = db.Column(db.String(500))
    payment_metadata = db.Column(db.JSON)

    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                          onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = db.Column(db.DateTime(timezone=True))

    # Relationships
    user = db.relationship('User', back_populates='payments')

    def to_dict(self) -> dict:
        """Convert payment to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': float(self.amount),
            'currency': self.currency,
            'status': self.status.value,
            'provider': self.provider,
            'transaction_id': self.transaction_id,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

    def __repr__(self) -> str:
        return f'<Payment {self.transaction_id}: {self.amount} {self.currency}>'
