"""
Database migration script to add blockchain-related tables
Run this script to create the necessary tables for blockchain functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import db, Wallet, BlockchainTransaction, HealthRecord

def create_blockchain_tables():
    """Create blockchain-related database tables"""
    
    # Initialize Flask app for database operations
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///dristi_ai.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize database
    db.init_app(app)
    
    with app.app_context():
        try:
            print("🔄 Creating blockchain tables...")
            
            # Create tables
            db.create_all()
            
            print("✅ Successfully created blockchain tables:")
            print("   - wallets")
            print("   - blockchain_transactions") 
            print("   - health_records")
            
            # Verify tables were created
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            blockchain_tables = ['wallets', 'blockchain_transactions', 'health_records']
            for table in blockchain_tables:
                if table in tables:
                    print(f"✅ Table '{table}' created successfully")
                else:
                    print(f"❌ Table '{table}' was not created")
            
            print("\n🎉 Database migration completed!")
            
        except Exception as e:
            print(f"❌ Error creating tables: {str(e)}")
            return False
    
    return True

if __name__ == "__main__":
    create_blockchain_tables()
