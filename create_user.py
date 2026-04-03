#!/usr/bin/env python3
"""Script for creating a user"""

import sys
import os

# Add paths
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app import create_app
from app.extensions import db
from app.models.user import User

app = create_app()

with app.app_context():
    email = "admin@cursa.local"
    password = "admin123"
    name = "Administrator"
    
    # Check if user exists
    existing = User.query.filter_by(email=email).first()
    if existing:
        print(f"[INFO] User {email} already exists")
        existing.set_password(password)
        print(f"[OK] Password reset to: {password}")
    else:
        user = User(
            email=email,
            first_name=name,
            role="admin"
        )
        user.set_password(password)
        db.session.add(user)
        print(f"[OK] Created user: {email}")
    
    db.session.commit()
    print(f"\nLogin credentials:")
    print(f"  Email: {email}")
    print(f"  Password: {password}")
