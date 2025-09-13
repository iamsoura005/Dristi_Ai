#!/usr/bin/env python3
"""
Database initialization script for Dristi AI
Creates all required tables based on the models
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from flask import Flask
from models import db, User, UserRole, Gender
from datetime import datetime

def create_app():
    """Create Flask app with database configuration"""
    app = Flask(__name__)
    
    # Database configuration (use same as app.py)
    # Flask creates instance folder automatically, so we need to match that path
    instance_path = os.path.join(os.path.dirname(__file__), 'instance')
    os.makedirs(instance_path, exist_ok=True)
    db_path = os.path.join(instance_path, 'hackloop_medical.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'dev-secret-key'
    
    # Initialize database
    db.init_app(app)
    
    return app

def init_database():
    """Initialize the database with all tables"""
    
    print("🔄 Initializing Dristi AI database...")
    
    app = create_app()
    
    with app.app_context():
        try:
            # Drop all tables (fresh start)
            print("🗑️  Dropping existing tables...")
            db.drop_all()
            
            # Create all tables
            print("🏗️  Creating all tables...")
            db.create_all()
            
            # Verify tables were created
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            print(f"✅ Created {len(tables)} tables:")
            for table in sorted(tables):
                print(f"   - {table}")
            
            # Create a test admin user
            print("\n👤 Creating test admin user...")
            admin_user = User(
                email='admin@dristi.ai',
                password='admin123',
                first_name='Admin',
                last_name='User',
                role=UserRole.ADMIN,
                phone='+1234567890',
                preferred_language='en',
                is_active=True
            )
            
            db.session.add(admin_user)
            db.session.commit()
            
            print("✅ Test admin user created:")
            print("   Email: admin@dristi.ai")
            print("   Password: admin123")
            
            print("\n🎉 Database initialization completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing database: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    success = init_database()
    if success:
        print("\n✅ Database is ready for use!")
    else:
        print("\n❌ Database initialization failed!")
        sys.exit(1)
