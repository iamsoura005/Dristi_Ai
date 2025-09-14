#!/usr/bin/env python3
"""
Fix wallet_address column in the correct database location used by Flask app
"""

import os
import sys
import sqlite3

def fix_wallet_column_correct_location():
    """Add wallet_address column to users table in the correct database location"""
    
    # Get database path - this is where Flask actually looks for the database
    backend_dir = os.path.dirname(__file__)
    db_path = os.path.join(backend_dir, 'hackloop_medical.db')
    
    print(f"🔄 Fixing wallet_address column in Flask database: {db_path}")
    
    conn = None
    try:
        # Check if database exists
        if not os.path.exists(db_path):
            print(f"❌ Database file not found at: {db_path}")
            print("Creating new database...")
            # Create an empty database file
            conn = sqlite3.connect(db_path)
            conn.close()
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        table_exists = cursor.fetchone() is not None
        
        if not table_exists:
            print("❌ Users table doesn't exist. Creating it...")
            # Create users table with wallet_address column included
            cursor.execute("""
                CREATE TABLE users (
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
            print("✅ Created users table with wallet_address column")
        else:
            # Check if wallet_address column exists
            cursor.execute("PRAGMA table_info(users)")
            columns = [column[1] for column in cursor.fetchall()]
            
            print(f"📋 Current users table columns: {columns}")
            
            if 'wallet_address' not in columns:
                print("📝 Adding wallet_address column...")
                cursor.execute("ALTER TABLE users ADD COLUMN wallet_address VARCHAR(42) UNIQUE")
                print("✅ Successfully added wallet_address column")
            else:
                print("✅ wallet_address column already exists")
        
        # Commit changes
        conn.commit()
        
        # Verify the final schema
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        
        print("\n📋 Final users table schema:")
        for column in columns:
            print(f"   - {column[1]} ({column[2]})")
        
        conn.close()
        
        print(f"\n🎉 Database fix completed successfully!")
        print(f"Database location: {db_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing database: {str(e)}")
        try:
            if 'conn' in locals() and conn:
                conn.rollback()
                conn.close()
        except:
            pass
        return False

if __name__ == "__main__":
    success = fix_wallet_column_correct_location()
    if success:
        print("\n✅ Backend server should now work with wallet authentication!")
    else:
        print("\n❌ Fix failed!")
        sys.exit(1)