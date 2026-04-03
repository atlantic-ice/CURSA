"""Audit log model for API key lifecycle events."""

from datetime import datetime, timezone

from app.extensions import db


class APIKeyAudit(db.Model):
    """Stores immutable audit events for API key operations."""

    __tablename__ = "api_key_audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    api_key_id = db.Column(db.Integer, nullable=True, index=True)
    event = db.Column(db.String(64), nullable=False, index=True)
    details = db.Column(db.JSON, nullable=True)
    ip_address = db.Column(db.String(64), nullable=True)
    user_agent = db.Column(db.String(512), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    def to_dict(self) -> dict:
        """Serialize audit record for API responses."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "api_key_id": self.api_key_id,
            "event": self.event,
            "metadata": self.details or {},
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat(),
        }
