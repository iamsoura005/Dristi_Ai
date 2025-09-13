"""
Security Service for HIPAA compliance, encryption, and audit logging
"""

import os
import hashlib
import hmac
import base64
import secrets
import pyotp
import qrcode
from io import BytesIO
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from flask import current_app, request, g
import json

from models import db, User

class EncryptionService:
    """Service for encrypting and decrypting sensitive medical data"""
    
    def __init__(self):
        self.master_key = None
        self.fernet = None

    def _initialize(self):
        """Initialize encryption service within application context"""
        if self.master_key is None:
            self.master_key = self._get_or_create_master_key()
            self.fernet = Fernet(self.master_key)
    
    def _get_or_create_master_key(self) -> bytes:
        """Get or create the master encryption key"""
        key_file = current_app.config.get('ENCRYPTION_KEY_FILE', 'master.key')
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            # Generate new key
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            return key
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        self._initialize()
        if not data:
            return data

        try:
            encrypted_data = self.fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
        except Exception as e:
            current_app.logger.error(f"Encryption failed: {str(e)}")
            raise
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        self._initialize()
        if not encrypted_data:
            return encrypted_data

        try:
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = self.fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception as e:
            current_app.logger.error(f"Decryption failed: {str(e)}")
            raise
    
    def encrypt_dict(self, data: Dict) -> Dict:
        """Encrypt sensitive fields in a dictionary"""
        sensitive_fields = [
            'medical_conditions', 'symptoms', 'notes', 'content',
            'phone', 'address', 'prescription_notes'
        ]
        
        encrypted_data = data.copy()
        for field in sensitive_fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = self.encrypt_data(str(encrypted_data[field]))
        
        return encrypted_data
    
    def decrypt_dict(self, data: Dict) -> Dict:
        """Decrypt sensitive fields in a dictionary"""
        sensitive_fields = [
            'medical_conditions', 'symptoms', 'notes', 'content',
            'phone', 'address', 'prescription_notes'
        ]
        
        decrypted_data = data.copy()
        for field in sensitive_fields:
            if field in decrypted_data and decrypted_data[field]:
                try:
                    decrypted_data[field] = self.decrypt_data(decrypted_data[field])
                except:
                    # If decryption fails, data might not be encrypted
                    pass
        
        return decrypted_data

class AuditLogger:
    """Service for HIPAA-compliant audit logging"""
    
    def __init__(self):
        self.log_file = None

    def _get_config(self):
        """Get configuration values within application context"""
        if self.log_file is None:
            self.log_file = current_app.config.get('AUDIT_LOG_FILE', 'audit.log')
    
    def log_access(self, user_id: int, resource_type: str, resource_id: str,
                   action: str, ip_address: str = None, user_agent: str = None,
                   additional_data: Dict = None):
        """Log access to medical data"""
        self._get_config()
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'action': action,
            'ip_address': ip_address or getattr(request, 'remote_addr', 'unknown'),
            'user_agent': user_agent or getattr(request, 'user_agent', {}).get('string', 'unknown'),
            'session_id': getattr(g, 'session_id', 'unknown'),
            'additional_data': additional_data or {}
        }
        
        # Write to audit log file
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
        
        # Also log to application logger
        current_app.logger.info(f"AUDIT: {action} on {resource_type}:{resource_id} by user:{user_id}")
    
    def log_authentication(self, user_id: int, action: str, success: bool, 
                          ip_address: str = None, additional_data: Dict = None):
        """Log authentication events"""
        self.log_access(
            user_id=user_id,
            resource_type='authentication',
            resource_id=str(user_id),
            action=f"{action}_{'success' if success else 'failure'}",
            ip_address=ip_address,
            additional_data=additional_data
        )
    
    def log_data_export(self, user_id: int, data_type: str, record_count: int):
        """Log data export events"""
        self.log_access(
            user_id=user_id,
            resource_type='data_export',
            resource_id=data_type,
            action='export',
            additional_data={'record_count': record_count}
        )
    
    def get_audit_logs(self, user_id: int = None, start_date: datetime = None,
                       end_date: datetime = None, limit: int = 100) -> List[Dict]:
        """Retrieve audit logs with filtering"""
        self._get_config()
        logs = []

        try:
            with open(self.log_file, 'r') as f:
                for line in f:
                    try:
                        log_entry = json.loads(line.strip())
                        
                        # Apply filters
                        if user_id and log_entry.get('user_id') != user_id:
                            continue
                        
                        log_timestamp = datetime.fromisoformat(log_entry['timestamp'])
                        if start_date and log_timestamp < start_date:
                            continue
                        if end_date and log_timestamp > end_date:
                            continue
                        
                        logs.append(log_entry)
                        
                        if len(logs) >= limit:
                            break
                            
                    except json.JSONDecodeError:
                        continue
                        
        except FileNotFoundError:
            pass
        
        return logs[::-1]  # Return most recent first

class MFAService:
    """Service for Multi-Factor Authentication"""
    
    def __init__(self):
        self.app_name = None

    def _get_config(self):
        """Get configuration values within application context"""
        if self.app_name is None:
            self.app_name = current_app.config.get('APP_NAME', 'Dristi AI')
    
    def generate_secret(self) -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()
    
    def generate_qr_code(self, user_email: str, secret: str) -> str:
        """Generate QR code for TOTP setup"""
        self._get_config()
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=self.app_name
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    def verify_totp(self, secret: str, token: str) -> bool:
        """Verify TOTP token"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)  # Allow 1 window tolerance
    
    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """Generate backup codes for MFA"""
        codes = []
        for _ in range(count):
            code = secrets.token_hex(4).upper()
            codes.append(f"{code[:4]}-{code[4:]}")
        return codes

class RBACService:
    """Service for Role-Based Access Control"""
    
    ROLES = {
        'patient': {
            'permissions': [
                'view_own_data', 'edit_own_profile', 'book_appointments',
                'view_own_prescriptions', 'manage_family_members'
            ]
        },
        'doctor': {
            'permissions': [
                'view_patient_data', 'edit_patient_notes', 'manage_appointments',
                'create_prescriptions', 'view_analytics'
            ]
        },
        'admin': {
            'permissions': [
                'view_all_data', 'manage_users', 'view_audit_logs',
                'system_configuration', 'data_export'
            ]
        }
    }
    
    def __init__(self):
        self.audit_logger = AuditLogger()
    
    def check_permission(self, user: User, permission: str, resource_id: str = None) -> bool:
        """Check if user has specific permission"""
        user_role = getattr(user, 'role', 'patient')
        role_permissions = self.ROLES.get(user_role, {}).get('permissions', [])
        
        # Log permission check
        self.audit_logger.log_access(
            user_id=user.id,
            resource_type='permission_check',
            resource_id=permission,
            action='check',
            additional_data={'resource_id': resource_id, 'granted': permission in role_permissions}
        )
        
        return permission in role_permissions
    
    def require_permission(self, permission: str):
        """Decorator to require specific permission"""
        def decorator(f):
            def decorated_function(*args, **kwargs):
                from flask_jwt_extended import get_jwt_identity
                
                user_id = get_jwt_identity()
                user = User.query.get(user_id)
                
                if not user or not self.check_permission(user, permission):
                    return {'error': 'Insufficient permissions'}, 403
                
                return f(*args, **kwargs)
            return decorated_function
        return decorator

class DataAnonymizationService:
    """Service for anonymizing data for analytics"""
    
    def __init__(self):
        self.encryption_service = EncryptionService()
    
    def anonymize_user_data(self, data: Dict) -> Dict:
        """Anonymize user data for analytics"""
        anonymized = data.copy()
        
        # Remove or hash identifying information
        if 'email' in anonymized:
            anonymized['email_hash'] = hashlib.sha256(anonymized['email'].encode()).hexdigest()[:8]
            del anonymized['email']
        
        if 'first_name' in anonymized:
            del anonymized['first_name']
        
        if 'last_name' in anonymized:
            del anonymized['last_name']
        
        if 'phone' in anonymized:
            del anonymized['phone']
        
        if 'address' in anonymized:
            del anonymized['address']
        
        # Keep only necessary fields for analytics
        analytics_fields = [
            'id', 'age_group', 'gender', 'created_at', 'email_hash',
            'prescription_count', 'last_visit_date'
        ]
        
        return {k: v for k, v in anonymized.items() if k in analytics_fields}
    
    def anonymize_prescription_data(self, data: Dict) -> Dict:
        """Anonymize prescription data for analytics"""
        anonymized = data.copy()
        
        # Remove user identifying information
        if 'user_id' in anonymized:
            anonymized['user_hash'] = hashlib.sha256(str(anonymized['user_id']).encode()).hexdigest()[:8]
            del anonymized['user_id']
        
        # Remove notes and other identifying text
        text_fields = ['notes', 'doctor_notes', 'clinic_name']
        for field in text_fields:
            if field in anonymized:
                del anonymized[field]
        
        return anonymized

class PrivacyControlService:
    """Service for managing user privacy preferences"""
    
    def __init__(self):
        self.audit_logger = AuditLogger()
    
    def get_privacy_settings(self, user_id: int) -> Dict:
        """Get user's privacy settings"""
        # In a real implementation, this would be stored in the database
        default_settings = {
            'data_sharing_analytics': False,
            'data_sharing_research': False,
            'marketing_communications': False,
            'appointment_reminders': True,
            'family_data_sharing': True,
            'doctor_data_sharing': True,
            'data_retention_period': 7  # years
        }
        
        return default_settings
    
    def update_privacy_settings(self, user_id: int, settings: Dict) -> bool:
        """Update user's privacy settings"""
        try:
            # Log privacy settings change
            self.audit_logger.log_access(
                user_id=user_id,
                resource_type='privacy_settings',
                resource_id=str(user_id),
                action='update',
                additional_data={'new_settings': settings}
            )
            
            # In a real implementation, save to database
            return True
            
        except Exception as e:
            current_app.logger.error(f"Failed to update privacy settings: {str(e)}")
            return False
    
    def can_share_data(self, user_id: int, sharing_type: str) -> bool:
        """Check if user allows specific type of data sharing"""
        settings = self.get_privacy_settings(user_id)
        return settings.get(sharing_type, False)
    
    def request_data_deletion(self, user_id: int, reason: str = None) -> str:
        """Request deletion of user data (GDPR right to be forgotten)"""
        deletion_request_id = secrets.token_urlsafe(16)
        
        # Log deletion request
        self.audit_logger.log_access(
            user_id=user_id,
            resource_type='data_deletion',
            resource_id=deletion_request_id,
            action='request',
            additional_data={'reason': reason}
        )
        
        # In a real implementation, this would trigger a workflow
        # for manual review and data deletion
        
        return deletion_request_id
    
    def export_user_data(self, user_id: int) -> Dict:
        """Export all user data (GDPR right to data portability)"""
        # Log data export
        self.audit_logger.log_data_export(user_id, 'full_export', 1)
        
        # In a real implementation, this would collect all user data
        # from all tables and return it in a structured format
        
        return {
            'export_date': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'data': {
                'profile': {},
                'prescriptions': [],
                'appointments': [],
                'family_members': [],
                'ai_analyses': []
            }
        }
