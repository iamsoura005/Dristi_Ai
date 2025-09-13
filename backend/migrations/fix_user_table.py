#!/usr/bin/env python3
"""
Migration script to fix the users table schema
Adds missing columns that are defined in the User model
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import sqlite3

def fix_user_table():
    """Fix the users table by adding missing columns"""
    
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), '..', 'dristi_ai.db')
    
    print("🔄 Fixing users table schema...")
    print(f"📁 Database path: {db_path}")
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current table structure
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        existing_columns = [col[1] for col in columns]
        
        print(f"📋 Current columns: {existing_columns}")
        
        # Define required columns with their SQL definitions
        required_columns = {
            'phone': 'VARCHAR(20)',
            'date_of_birth': 'DATE',
            'gender': 'VARCHAR(10)',
            'preferred_language': 'VARCHAR(10) DEFAULT "en"',
            'location_lat': 'FLOAT',
            'location_lng': 'FLOAT',
            'role': 'VARCHAR(20) DEFAULT "patient"',
            'is_active': 'BOOLEAN DEFAULT 1',
            'created_at': 'DATETIME',
            'last_login': 'DATETIME'
        }
        
        # Add missing columns
        columns_added = []
        for column_name, column_def in required_columns.items():
            if column_name not in existing_columns:
                try:
                    sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_def}"
                    cursor.execute(sql)
                    columns_added.append(column_name)
                    print(f"✅ Added column: {column_name}")
                except sqlite3.Error as e:
                    print(f"⚠️  Warning adding {column_name}: {e}")
        
        # Commit changes
        conn.commit()
        
        # Verify the fix
        cursor.execute("PRAGMA table_info(users)")
        updated_columns = cursor.fetchall()
        final_columns = [col[1] for col in updated_columns]
        
        print(f"\n📋 Updated columns: {final_columns}")
        
        if columns_added:
            print(f"\n🎉 Successfully added {len(columns_added)} missing columns:")
            for col in columns_added:
                print(f"   - {col}")
        else:
            print("\n✅ All required columns already exist!")
        
        # Close connection
        conn.close()
        
        print("\n🎉 Users table schema fix completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing users table: {e}")
        return False

if __name__ == "__main__":
    success = fix_user_table()
    if success:
        print("\n✅ Migration completed successfully!")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
