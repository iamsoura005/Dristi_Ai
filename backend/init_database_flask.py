#!/usr/bin/env python3
"""
Initialize database schema using Flask app context to ensure correct configuration
"""

import sys
import os

# Add the backend directory to path
backend_dir = os.path.dirname(__file__)
sys.path.insert(0, backend_dir)

# Import Flask app and models
from flask import Flask
from models import db, User, UserRole, Gender
from datetime import datetime

def initialize_database():
    """Initialize database with proper Flask configuration"""
    
    print("🔄 Initializing database with Flask configuration...")
    
    # Create Flask app with same config as main app
    app = Flask(__name__)
    
    # Use the same database configuration as the main app
    app.config['SECRET_KEY'] = 'dev-secret-key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hackloop_medical.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize database
    db.init_app(app)
    
    with app.app_context():
        try:
            # Drop and recreate all tables to ensure schema is correct
            print("🗑️  Dropping existing tables...")
            db.drop_all()
            
            print("🏗️  Creating all tables with correct schema...")
            db.create_all()
            
            # Verify wallet_address column exists
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'users' in tables:
                columns = inspector.get_columns('users')
                column_names = [col['name'] for col in columns]
                
                print(f"✅ Users table created with columns: {column_names}")
                
                if 'wallet_address' in column_names:
                    print("✅ wallet_address column confirmed in users table")
                else:
                    print("❌ wallet_address column missing!")
                    return False
            
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
            
            print("✅ Test admin user created successfully")
            print("   Email: admin@dristi.ai")
            print("   Password: admin123")
            
            # Test wallet user creation
            print("\n🔗 Testing wallet user creation...")
            wallet_user = User(
                wallet_address='0x1234567890123456789012345678901234567890',
                first_name='Wallet',
                last_name='User',
                role=UserRole.PATIENT
            )
            
            db.session.add(wallet_user)
            db.session.commit()
            
            print("✅ Test wallet user created successfully")
            print("   Wallet: 0x1234567890123456789012345678901234567890")
            
            # Clean up test wallet user
            db.session.delete(wallet_user)
            db.session.commit()
            
            print("\n🎉 Database initialization completed successfully!")
            print(f"Database location: {os.path.join(backend_dir, 'hackloop_medical.db')}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error initializing database: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    success = initialize_database()
    if success:
        print("\n✅ Database is ready! Backend server can now be started.")
    else:
        print("\n❌ Database initialization failed!")
        sys.exit(1)