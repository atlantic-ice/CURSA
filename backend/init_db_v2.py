#!/usr/bin/env python
"""
Database initialization script for CURSA application

Usage:
    python init_db.py                    # Initialize with defaults
    python init_db.py --drop-all         # Drop all tables first
    python init_db.py --demo-data        # Add demonstration data
"""

import os
import sys
import argparse
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.subscription import Subscription, SubscriptionTier
from app.models.document import Document
from app.models.api_key import APIKey
from app.models.payment import Payment


def init_db(app, drop_all=False, demo_data=False):
    """Initialize database"""
    with app.app_context():
        print("🔧 Initializing database...")

        if drop_all:
            print("⚠️  Dropping all tables...")
            db.drop_all()

        # Create all tables
        print("📦 Creating tables...")
        db.create_all()
        print("✅ Tables created")

        # Add demonstration data if requested
        if demo_data:
            print("📝 Adding demonstration data...")
            add_demo_data()
            print("✅ Demo data added")

        print("\n✨ Database initialized successfully!")
        print("\nDatabase URL:", app.config.get("SQLALCHEMY_DATABASE_URI"))


def add_demo_data():
    """Add demonstration data to database"""
    # Demo user
    demo_user = User(
        email="demo@cursa.dev",
        first_name="Demo",
        last_name="User",
        organization="CURSA Demo",
        role=UserRole.PRO,
        is_active=True,
        is_email_verified=True,
    )
    demo_user.set_password("demo123456")

    # Demo subscription
    demo_sub = Subscription(
        user=demo_user,
        tier=SubscriptionTier.PRO,
        is_active=True,
        documents_limit=100,
        api_calls_limit=10000,
    )

    try:
        db.session.add(demo_user)
        db.session.add(demo_sub)
        db.session.commit()
        print(f"✓ Created demo user: {demo_user.email}")
        print(f"✓ Created PRO subscription for demo user")
    except Exception as e:
        db.session.rollback()
        print(f"⚠️  Demo data already exists or error: {str(e)}")


def check_db_connection(app):
    """Check if database connection works"""
    try:
        with app.app_context():
            db.session.execute("SELECT 1")
            db.session.close()
            print("✅ Database connection OK")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        print(f"Check DATABASE_URL: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Initialize CURSA database")
    parser.add_argument("--drop-all", action="store_true", help="Drop all tables before creating")
    parser.add_argument("--demo-data", action="store_true", help="Add demonstration data")
    parser.add_argument("--check-only", action="store_true", help="Only check database connection")

    args = parser.parse_args()

    # Load environment
    from dotenv import load_dotenv

    load_dotenv()

    # Create app
    app = create_app()

    # Check connection first
    if not check_db_connection(app):
        sys.exit(1)

    if args.check_only:
        print("\n📊 Database Info:")
        with app.app_context():
            try:
                from sqlalchemy import inspect, text

                inspector = inspect(db.engine)
                tables = inspector.get_table_names()
                print(f"✓ Tables count: {len(tables)}")
                for table in tables:
                    cols = len(inspector.get_columns(table))
                    print(f"  - {table} ({cols} columns)")
            except Exception as e:
                print(f"⚠️  Could not inspect schema: {str(e)}")
        return

    # Initialize database
    init_db(app, drop_all=args.drop_all, demo_data=args.demo_data)


if __name__ == "__main__":
    main()
