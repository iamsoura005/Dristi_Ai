-- Create users table with wallet_address column
DROP TABLE IF EXISTS users;

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
);

-- Insert test admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, phone, preferred_language, is_active)
VALUES ('admin@dristi.ai', '$2b$12$K8Y.V4Z5Q6tBqY8vJy7.XeQrW8zR2s9x7.B5nM6fJ4K8L9pN2qS6u', 'Admin', 'User', 'admin', '+1234567890', 'en', 1);

-- Verify table structure
.schema users