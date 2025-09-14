#!/usr/bin/env python3
"""
Quick fix for wallet_address column issue
Adds wallet_address column to existing users table
"""

import os
import sys
import sqlite3

def fix_wallet_column():
    """Add wallet_address column to users table"""
    
    # Get database path
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'hackloop_medical.db')
    
    print(f"🔄 Fixing wallet_address column in database: {db_path}")
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if wallet_address column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        print(f"📋 Current users table columns: {columns}")
        
        if 'wallet_address' not in columns:
            print("📝 Adding wallet_address column...")
            
            # Add wallet_address column
            cursor.execute("ALTER TABLE users ADD COLUMN wallet_address VARCHAR(42) UNIQUE")
            
            print("✅ Successfully added wallet_address column")
            
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
        
        print("\n🎉 Wallet column fix completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing wallet column: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    success = fix_wallet_column()
    if success:
        print("\n✅ Wallet authentication should now work!")
    else:
        print("\n❌ Fix failed!")
        sys.exit(1)