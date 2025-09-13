"""
Security Service for Dristi AI Blockchain Integration
Handles encryption, key management, and security utilities
"""

import os
import hashlib
import secrets
import base64
from typing import Dict, Any, Optional, Tuple
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import jwt
from datetime import datetime, timedelta
import bcrypt

class SecurityService:
    """Service for handling security operations"""
    
    def __init__(self):
        """Initialize security service"""
        self.backend = default_backend()
        self.jwt_secret = os.getenv('JWT_SECRET_KEY', self._generate_secret())
        self.encryption_key = self._get_or_create_master_key()
        
    def _generate_secret(self) -> str:
        """Generate a secure random secret"""
        return secrets.token_urlsafe(32)
    
    def _get_or_create_master_key(self) -> bytes:
        """Get or create master encryption key"""
        key_file = os.path.join(os.path.dirname(__file__), '.master_key')
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            # Set restrictive permissions
            os.chmod(key_file, 0o600)
            return key
    
    def derive_key_from_password(self, password: str, salt: bytes) -> bytes:
        """
        Derive encryption key from password using PBKDF2
        
        Args:
            password: User password
            salt: Random salt
            
        Returns:
            Derived key
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=self.backend
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
    
    def encrypt_data(self, data: str, password: str = None) -> Dict[str, str]:
        """
        Encrypt data using Fernet encryption
        
        Args:
            data: Data to encrypt
            password: Optional password for key derivation
            
        Returns:
            Dictionary with encrypted data and metadata
        """
        if password:
            # Use password-based encryption
            salt = os.urandom(16)
            key = self.derive_key_from_password(password, salt)
            fernet = Fernet(key)
            encrypted_data = fernet.encrypt(data.encode())
            
            return {
                'encrypted_data': base64.b64encode(encrypted_data).decode(),
                'salt': base64.b64encode(salt).decode(),
                'method': 'password'
            }
        else:
            # Use master key encryption
            fernet = Fernet(self.encryption_key)
            encrypted_data = fernet.encrypt(data.encode())
            
            return {
                'encrypted_data': base64.b64encode(encrypted_data).decode(),
                'method': 'master_key'
            }
    
    def decrypt_data(self, encrypted_data: str, password: str = None, 
                    salt: str = None, method: str = 'master_key') -> str:
        """
        Decrypt data
        
        Args:
            encrypted_data: Base64 encoded encrypted data
            password: Password for decryption (if method is 'password')
            salt: Base64 encoded salt (if method is 'password')
            method: Encryption method used
            
        Returns:
            Decrypted data
        """
        encrypted_bytes = base64.b64decode(encrypted_data)
        
        if method == 'password':
            if not password or not salt:
                raise ValueError("Password and salt required for password-based decryption")
            
            salt_bytes = base64.b64decode(salt)
            key = self.derive_key_from_password(password, salt_bytes)
            fernet = Fernet(key)
        else:
            fernet = Fernet(self.encryption_key)
        
        decrypted_data = fernet.decrypt(encrypted_bytes)
        return decrypted_data.decode()
    
    def hash_password(self, password: str) -> str:
        """
        Hash password using bcrypt
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """
        Verify password against hash
        
        Args:
            password: Plain text password
            hashed: Hashed password
            
        Returns:
            True if password matches
        """
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def generate_secure_token(self, length: int = 32) -> str:
        """
        Generate secure random token
        
        Args:
            length: Token length
            
        Returns:
            Secure random token
        """
        return secrets.token_urlsafe(length)
    
    def create_jwt_token(self, user_id: int, expires_in_hours: int = 24) -> str:
        """
        Create JWT token
        
        Args:
            user_id: User ID
            expires_in_hours: Token expiration time
            
        Returns:
            JWT token
        """
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=expires_in_hours),
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify JWT token
        
        Args:
            token: JWT token
            
        Returns:
            Decoded payload or None if invalid
        """
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def generate_rsa_keypair(self) -> Tuple[str, str]:
        """
        Generate RSA key pair for asymmetric encryption
        
        Returns:
            Tuple of (private_key_pem, public_key_pem)
        """
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=self.backend
        )
        
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        return private_pem.decode(), public_pem.decode()
    
    def encrypt_with_public_key(self, data: str, public_key_pem: str) -> str:
        """
        Encrypt data with RSA public key
        
        Args:
            data: Data to encrypt
            public_key_pem: Public key in PEM format
            
        Returns:
            Base64 encoded encrypted data
        """
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode(),
            backend=self.backend
        )
        
        encrypted = public_key.encrypt(
            data.encode(),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return base64.b64encode(encrypted).decode()
    
    def decrypt_with_private_key(self, encrypted_data: str, private_key_pem: str) -> str:
        """
        Decrypt data with RSA private key
        
        Args:
            encrypted_data: Base64 encoded encrypted data
            private_key_pem: Private key in PEM format
            
        Returns:
            Decrypted data
        """
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode(),
            password=None,
            backend=self.backend
        )
        
        encrypted_bytes = base64.b64decode(encrypted_data)
        
        decrypted = private_key.decrypt(
            encrypted_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return decrypted.decode()
    
    def create_data_hash(self, data: str) -> str:
        """
        Create SHA-256 hash of data
        
        Args:
            data: Data to hash
            
        Returns:
            Hex encoded hash
        """
        return hashlib.sha256(data.encode()).hexdigest()
    
    def verify_data_integrity(self, data: str, expected_hash: str) -> bool:
        """
        Verify data integrity using hash
        
        Args:
            data: Original data
            expected_hash: Expected hash
            
        Returns:
            True if data is intact
        """
        actual_hash = self.create_data_hash(data)
        return actual_hash == expected_hash
    
    def secure_delete_file(self, file_path: str) -> bool:
        """
        Securely delete a file by overwriting it
        
        Args:
            file_path: Path to file to delete
            
        Returns:
            True if successful
        """
        try:
            if os.path.exists(file_path):
                # Get file size
                file_size = os.path.getsize(file_path)
                
                # Overwrite with random data multiple times
                with open(file_path, 'r+b') as f:
                    for _ in range(3):
                        f.seek(0)
                        f.write(os.urandom(file_size))
                        f.flush()
                        os.fsync(f.fileno())
                
                # Finally delete the file
                os.remove(file_path)
                return True
        except Exception as e:
            print(f"Error securely deleting file: {str(e)}")
            return False
    
    def validate_ethereum_address(self, address: str) -> bool:
        """
        Validate Ethereum address format
        
        Args:
            address: Ethereum address
            
        Returns:
            True if valid format
        """
        if not address.startswith('0x'):
            return False
        
        if len(address) != 42:
            return False
        
        try:
            int(address[2:], 16)
            return True
        except ValueError:
            return False
    
    def validate_bitcoin_address(self, address: str) -> bool:
        """
        Validate Bitcoin address format (simplified)
        
        Args:
            address: Bitcoin address
            
        Returns:
            True if valid format
        """
        # Legacy addresses
        if address.startswith('1') or address.startswith('3'):
            return 25 <= len(address) <= 34
        
        # Bech32 addresses
        if address.startswith('bc1') or address.startswith('tb1'):
            return 42 <= len(address) <= 62
        
        return False

# Global security service instance
security_service = SecurityService()

def get_security_service() -> SecurityService:
    """Get the global security service instance"""
    return security_service
