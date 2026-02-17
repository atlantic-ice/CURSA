"""
Document model for document processing tracking
"""

from datetime import datetime, timezone
from enum import Enum as PyEnum
from app.extensions import db


class DocumentStatus(PyEnum):
    """Document processing status"""
    UPLOADED = 'uploaded'
    CHECKING = 'checking'
    CHECKED = 'checked'
    CORRECTING = 'correcting'
    CORRECTED = 'corrected'
    ERROR = 'error'


class Document(db.Model):
    """Document processing model"""
    
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)  # Nullable for guests
    
    # File information
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer)  # bytes
    file_path = db.Column(db.String(500))  # S3 path or local path
    
    # Processing
    status = db.Column(db.Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False, index=True)
    profile_id = db.Column(db.String(100))  # Profile used for checking
    
    # Results (JSON fields)
    check_results = db.Column(db.JSON)  # Validation results
    correction_results = db.Column(db.JSON)  # Correction details
    
    # Corrected document
    corrected_filename = db.Column(db.String(255))
    corrected_file_path = db.Column(db.String(500))
    
    # Report
    report_filename = db.Column(db.String(255))
    report_file_path = db.Column(db.String(500))
    
    # Error tracking
    error_message = db.Column(db.Text)
    
    # Task tracking
    celery_task_id = db.Column(db.String(255), unique=True, index=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), 
                          onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    processed_at = db.Column(db.DateTime(timezone=True))
    
    # Relationships
    user = db.relationship('User', back_populates='documents')
    
    @property
    def total_issues_count(self) -> int:
        """Get total count of issues found"""
        if not self.check_results:
            return 0
        return self.check_results.get('total_issues_count', 0)
    
    def to_dict(self, include_results: bool = True) -> dict:
        """Convert document to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'status': self.status.value,
            'profile_id': self.profile_id,
            'total_issues_count': self.total_issues_count,
            'created_at': self.created_at.isoformat(),
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }
        if include_results:
            data['check_results'] = self.check_results
            data['correction_results'] = self.correction_results
        return data
    
    def __repr__(self) -> str:
        return f'<Document {self.original_filename}>'
