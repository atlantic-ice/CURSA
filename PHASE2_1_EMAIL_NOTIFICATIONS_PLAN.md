# Phase 2.1: Email Notifications Implementation Plan

**Epic:** Improve user experience with email notifications  
**Timeline:** 1-2 hours  
**Priority:** High (UX improvement for account recovery)

## Overview

Система уведомлений по электронной почте для важных событий:
- 📧 Welcome email при регистрации/первой OAuth авторизации
- 🔑 Password reset flow  
- ✅ Email verification
- 🔔 Document validation results
- 🎯 Usage alerts (quota limits)

## Architecture

```
Event → EmailService → Template → SMTP → User Inbox

Components:
├── EmailService (basic SMTP)
├── Email Templates (Jinja2)
├── Queue System (optional - for async delivery)
└── Configuration (SMTP settings)
```

## Implementation Tasks

### Task 1: Email Service Base Class (30 min)
- [ ] Create `backend/app/services/email_service.py`
- [ ] SMTP client wrapper
- [ ] Error handling & retries
- [ ] HTML/plaintext support
- [ ] Logging

```python
class EmailService:
    def send_welcome_email(user: User) -> bool
    def send_password_reset(user: User, token: str) -> bool
    def send_email_verification(user: User, token: str) -> bool
    def send_validation_report(user: User, document: Document) -> bool
```

### Task 2: Email Templates (20 min)
- [ ] Create `backend/app/templates/emails/`
  - `welcome.html` - Приватный для новых пользователей
  - `password_reset.html` - Восстановление пароля
  - `verification.html` - Верификация email
  - `document_report.html` - Результаты проверки

### Task 3: OAuth Integration (15 min)
- [ ] Update `oauth_routes.py` to send welcome email
- [ ] Add to `_find_or_create_user()` function
- [ ] Handle email delivery errors gracefully

### Task 4: Tests (20 min)
- [ ] Create `tests/unit/test_email_service.py`
- [ ] Mock SMTP server
- [ ] Test template rendering
- [ ] Test error handling

### Task 5: Configuration & Documentation (15 min)
- [ ] Add SMTP settings to `.env.example`
- [ ] Create `EMAIL_SETUP.md` guide
- [ ] Add to main documentation

## Code Structure

### `backend/app/services/email_service.py`

```python
from flask_mail import Mail, Message
from flask import render_template
import logging

class EmailService:
    """Service for sending emails to users"""
    
    def __init__(self, app=None):
        self.mail = Mail()
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize email service with Flask app"""
        self.mail.init_app(app)
        self.app = app
    
    def send_welcome_email(self, user: User) -> bool:
        """Send welcome email to new OAuth user"""
        try:
            # Build message
            subject = f"Welcome to CURSA, {user.first_name}!"
            html = render_template('emails/welcome.html', user=user)
            
            # Send
            self.mail.send(Message(
                subject=subject,
                recipients=[user.email],
                html=html
            ))
            
            logger.info(f"✓ Welcome email sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to send welcome email: {str(e)}")
            return False
    
    def send_password_reset(self, user: User, token: str) -> bool:
        """Send password reset email"""
        # Implementation...
        pass
    
    def send_validation_report(self, user: User, report: dict) -> bool:
        """Send document validation results"""
        # Implementation...
        pass
```

### `backend/app/templates/emails/welcome.html`

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 4px; }
        .content { padding: 20px; }
        .button { background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to CURSA! 🎉</h1>
        </div>
        
        <div class="content">
            <p>Hello {{ user.first_name }},</p>
            
            <p>Thank you for joining CURSA - the document validation system for academic standards!</p>
            
            <p>You're now ready to:</p>
            <ul>
                <li>✓ Validate your documents against university standards</li>
                <li>✓ Get automatic corrections and suggestions</li>
                <li>✓ Export formatted documents</li>
                <li>✓ Access detailed validation reports</li>
            </ul>
            
            <p>
                <a href="{{ frontend_url }}/dashboard" class="button">
                    Go to Dashboard →
                </a>
            </p>
            
            <p><strong>Quick Tips:</strong></p>
            <ul>
                <li>Upload a DOCX file to get started</li>
                <li>Choose your university profile for accurate validation</li>
                <li>See detailed issues with automatic fixes</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
                CURSA Team<br>
                Document Validation Platform<br>
                <a href="{{ frontend_url }}">https://cursa.app</a>
            </p>
        </div>
    </div>
</body>
</html>
```

### Integration with OAuth

```python
# In oauth_routes.py

from app.services.email_service import email_service

def _find_or_create_user(google_user: dict, provider: str) -> User:
    """Find or create user, send welcome email if new"""
    email = google_user.get("email")
    user = User.query.filter_by(email=email).first()
    
    is_new_user = user is None
    
    if not user:
        user = User(
            email=email,
            first_name=google_user.get("given_name", ""),
            oauth_provider=provider,
            is_email_verified=True,
        )
        db.session.add(user)
        db.session.commit()
        
        # Send welcome email asynchronously (optional: use Celery)
        try:
            email_service.send_welcome_email(user)
        except Exception as e:
            logger.warning(f"Could not send welcome email: {e}")
    
    return user, is_new_user
```

## Configuration

### `.env.example`

```env
# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # For Gmail: use App Passwords
MAIL_DEFAULT_SENDER=noreply@cursa.app
```

### `app/__init__.py`

```python
from app.services.email_service import email_service

def create_app():
    app = Flask(__name__)
    
    # ... other setup ...
    
    # Initialize email service
    email_service.init_app(app)
    
    return app
```

## Testing

### `tests/unit/test_email_service.py`

```python
import pytest
from unittest.mock import patch, MagicMock

class TestEmailService:
    """Test email service functionality"""
    
    @patch('app.services.email_service.Mail.send')
    def test_send_welcome_email(self, mock_send, email_service):
        """Test welcome email sending"""
        user = User(email="test@gmail.com", first_name="John")
        
        result = email_service.send_welcome_email(user)
        
        assert result is True
        mock_send.assert_called_once()
    
    def test_welcome_email_template(self):
        """Test welcome email template rendering"""
        user = User(email="test@gmail.com", first_name="John")
        
        html = render_template('emails/welcome.html', user=user)
        
        assert "Welcome to CURSA" in html
        assert "John" in html
    
    @patch('app.services.email_service.Mail.send')
    def test_send_email_failure_handling(self, mock_send):
        """Test graceful failure handling"""
        mock_send.side_effect = Exception("SMTP error")
        
        user = User(email="test@gmail.com", first_name="John")
        result = email_service.send_welcome_email(user)
        
        assert result is False
```

## Metrics

| Component | LOC | Time | Status |
|-----------|-----|------|--------|
| EmailService class | ~150 | 30 min | TODO |
| Email templates (4x) | ~200 | 20 min | TODO |
| OAuth integration | ~20 | 15 min | TODO |
| Tests | ~150 | 20 min | TODO |
| Documentation | ~50 | 10 min | TODO |
| **Total** | **~570** | **95 min** | **TODO** |

## Alternative: Using Celery for Async Email

If you want non-blocking email delivery:

```python
# tasks.py
from celery import shared_task

@shared_task
def send_welcome_email_task(user_id):
    """Send welcome email asynchronously"""
    user = User.query.get(user_id)
    if user:
        email_service.send_welcome_email(user)

# In oauth_routes.py
send_welcome_email_task.delay(user.id)  # Fire and forget
```

## Checklist

- [ ] Create `email_service.py` with SMTP wrapper
- [ ] Create email templates directory and files
- [ ] Add Flask-Mail dependency to `requirements.txt`
- [ ] Integrate with OAuth callback handler
- [ ] Write comprehensive unit tests
- [ ] Document SMTP configuration
- [ ] Test with real email (Gmail test account)
- [ ] Add email settings to example `.env`
- [ ] Create setup guide `EMAIL_SETUP.md`
- [ ] Update main documentation

## Related Features

### Password Reset Flow (for future)
```python
POST /api/auth/forgot-password
{
    "email": "user@gmail.com"
}
→ Sends reset link to email
→ User clicks link
→ POST /api/auth/reset-password with new password
```

### Usage Alerts (for future)
```python
# When user hits quota limit, send alert
if user.documents_today >= user.quota:
    email_service.send_quota_alert(user)
```

## Deployment Notes

### Gmail Setup
```bash
# For Gmail, use App Passwords (not your actual password)
# 1. Enable 2FA on Gmail account
# 2. Go to myaccount.google.com/apppasswords
# 3. Generate app password for "Mail" + "Windows"
# 4. Use this password in MAIL_PASSWORD env var
```

### Production SMTP
Consider using:
- **SendGrid** (best for scale, has API)
- **AWS SES** (good pricing)
- **Postmark** (excellent deliverability)
- **Mailgun** (developer-friendly)

---

**Start Date:** $(date +%Y-%m-%d)  
**Estimated Completion:** +2 hours  
**Dependencies:** Flask-Mail library  
**Related Issues:** Phase 2 OAuth2 completion
