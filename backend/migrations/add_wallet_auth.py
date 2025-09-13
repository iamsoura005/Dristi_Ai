#!/usr/bin/env python3
"""
Database Migration: Add MetaMask Wallet Authentication Support
Adds wallet_address column to users table and updates constraints
"""

import os
import sys
import sqlite3
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, User
from app import app

def add_wallet_address_column():
    """Add wallet_address column to users table"""
    
    # Get database path
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'hackloop_medical.db')
    
    print(f"🔄 Adding wallet authentication support to database: {db_path}")
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if wallet_address column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'wallet_address' not in columns:
            print("📝 Creating new table with wallet authentication support...")

            # Create new table with updated schema
            cursor.execute("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY,
                    email VARCHAR(120) UNIQUE,
                    password_hash VARCHAR(128),
                    wallet_address VARCHAR(42) UNIQUE,
                    first_name VARCHAR(80),
                    last_name VARCHAR(80),
                    phone VARCHAR(20),
                    date_of_birth DATE,
                    gender VARCHAR(10),
                    preferred_language VARCHAR(10) DEFAULT 'en',
                    location_lat FLOAT,
                    location_lng FLOAT,
                    role VARCHAR(20) NOT NULL DEFAULT 'patient',
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME
                )
            """)

            # Copy data from old table
            cursor.execute("""
                INSERT INTO users_new (
                    id, email, password_hash, first_name, last_name, phone,
                    date_of_birth, gender, preferred_language, location_lat,
                    location_lng, role, is_active, created_at, last_login
                )
                SELECT
                    id, email, password_hash, first_name, last_name, phone,
                    date_of_birth, gender, preferred_language, location_lat,
                    location_lng, role, is_active, created_at, last_login
                FROM users
            """)

            # Drop old table and rename new one
            cursor.execute("DROP TABLE users")
            cursor.execute("ALTER TABLE users_new RENAME TO users")
            
            print("✅ Successfully updated users table schema")
            
        else:
            print("✅ wallet_address column already exists")
        
        # Commit changes
        conn.commit()
        
        # Verify the changes
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        
        print("\n📋 Updated users table schema:")
        for column in columns:
            print(f"   - {column[1]} ({column[2]})")
        
        conn.close()
        
        print("\n🎉 Wallet authentication migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

def verify_migration():
    """Verify that the migration was successful"""
    
    print("\n🔍 Verifying migration...")
    
    try:
        with app.app_context():
            # Test creating a user with wallet address
            test_wallet = "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87"
            
            # Check if test user already exists
            existing_user = User.query.filter_by(wallet_address=test_wallet).first()
            if existing_user:
                print("✅ Test wallet user already exists")
                return True
            
            # Import UserRole enum
            from models import UserRole

            # Create test user with wallet
            test_user = User(
                wallet_address=test_wallet,
                first_name="Test",
                last_name="Wallet",
                role=UserRole.PATIENT
            )
            
            db.session.add(test_user)
            db.session.commit()
            
            print("✅ Successfully created test user with wallet address")
            
            # Clean up test user
            db.session.delete(test_user)
            db.session.commit()
            
            print("✅ Migration verification completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Migration verification failed: {str(e)}")
        return False

def main():
    """Run the migration"""
    
    print("🚀 Starting MetaMask Wallet Authentication Migration")
    print("=" * 60)
    
    # Step 1: Add wallet_address column
    if not add_wallet_address_column():
        print("❌ Migration failed at step 1")
        return False
    
    # Step 2: Verify migration
    if not verify_migration():
        print("❌ Migration verification failed")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 MetaMask Wallet Authentication Migration Completed!")
    print("\nUsers can now authenticate using:")
    print("  • Email + Password (traditional)")
    print("  • MetaMask Wallet Address (Web3)")
    print("\nNext steps:")
    print("  1. Restart the backend server")
    print("  2. Test wallet authentication in the frontend")
    print("  3. Verify blockchain integration works")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
