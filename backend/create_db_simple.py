import sqlite3
import os
import bcrypt

# Database path where Flask expects it
db_path = os.path.join(os.path.dirname(__file__), 'hackloop_medical.db')

print(f"Creating database at: {db_path}")

# Remove existing database
if os.path.exists(db_path):
    os.remove(db_path)
    print("Removed existing database")

# Create new database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create users table with wallet_address column
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

# Create password hash for admin user
password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Insert test admin user
cursor.execute("""
INSERT INTO users (email, password_hash, first_name, last_name, role, phone, preferred_language, is_active)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", ('admin@dristi.ai', password_hash, 'Admin', 'User', 'admin', '+1234567890', 'en', 1))

# Commit and close
conn.commit()

# Verify schema
cursor.execute("PRAGMA table_info(users)")
columns = cursor.fetchall()

print("Users table schema:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# Verify wallet_address column exists
column_names = [col[1] for col in columns]
if 'wallet_address' in column_names:
    print("✅ wallet_address column confirmed!")
else:
    print("❌ wallet_address column missing!")

conn.close()
print("Database created successfully!")