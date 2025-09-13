from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime
import enum

db = SQLAlchemy()
bcrypt = Bcrypt()

class UserRole(enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"

class Gender(enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class AppointmentStatus(enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class AppointmentType(enum.Enum):
    IN_PERSON = "in_person"
    VIDEO_CALL = "video_call"
    PHONE_CALL = "phone_call"

class RelationshipType(enum.Enum):
    SELF = "self"
    SPOUSE = "spouse"
    CHILD = "child"
    PARENT = "parent"
    SIBLING = "sibling"
    GRANDPARENT = "grandparent"
    GRANDCHILD = "grandchild"
    OTHER = "other"

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=True)  # Made nullable for wallet auth
    password_hash = db.Column(db.String(128), nullable=True)  # Made nullable for wallet auth
    wallet_address = db.Column(db.String(42), unique=True, nullable=True)  # Ethereum address
    first_name = db.Column(db.String(80), nullable=True)  # Made nullable for wallet auth
    last_name = db.Column(db.String(80), nullable=True)  # Made nullable for wallet auth
    phone = db.Column(db.String(20))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.Enum(Gender))
    preferred_language = db.Column(db.String(10), default='en')
    location_lat = db.Column(db.Float)
    location_lng = db.Column(db.Float)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.PATIENT)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def __init__(self, email=None, password=None, first_name=None, last_name=None, wallet_address=None, role=UserRole.PATIENT, **kwargs):
        self.email = email
        self.wallet_address = wallet_address
        if password:
            self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        self.first_name = first_name
        self.last_name = last_name
        self.role = role
        self.phone = kwargs.get('phone')
        self.date_of_birth = kwargs.get('date_of_birth')
        self.gender = kwargs.get('gender')
        self.preferred_language = kwargs.get('preferred_language', 'en')
        self.location_lat = kwargs.get('location_lat')
        self.location_lng = kwargs.get('location_lng')

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'wallet_address': self.wallet_address,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender.value if self.gender else None,
            'preferred_language': self.preferred_language,
            'location_lat': self.location_lat,
            'location_lng': self.location_lng,
            'role': self.role.value,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

# Family Members Model
class FamilyMember(db.Model):
    __tablename__ = 'family_members'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.Enum(RelationshipType), nullable=False)
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.Enum(Gender))
    phone = db.Column(db.String(20))
    medical_conditions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('family_members', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'relationship': self.relationship.value,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender.value if self.gender else None,
            'phone': self.phone,
            'medical_conditions': self.medical_conditions,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Enhanced Test Results Model
class TestResult(db.Model):
    __tablename__ = 'test_results'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    family_member_id = db.Column(db.Integer, db.ForeignKey('family_members.id'), nullable=True)
    test_type = db.Column(db.String(50), nullable=False)  # 'eye_disease', 'color_blindness', 'vision_test', 'power_analysis'
    test_date = db.Column(db.DateTime, default=datetime.utcnow)
    results = db.Column(db.JSON, nullable=False)
    notes = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('test_results', lazy=True))
    family_member = db.relationship('FamilyMember', backref=db.backref('test_results', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'family_member_id': self.family_member_id,
            'test_type': self.test_type,
            'test_date': self.test_date.isoformat() if self.test_date else None,
            'results': self.results,
            'notes': self.notes,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# AI Analysis Model
class AIAnalysis(db.Model):
    __tablename__ = 'ai_analysis'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    family_member_id = db.Column(db.Integer, db.ForeignKey('family_members.id'), nullable=True)
    image_url = db.Column(db.String(255), nullable=False)
    predicted_condition = db.Column(db.String(100), nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)
    detailed_results = db.Column(db.JSON)
    recommendations = db.Column(db.Text)
    follow_up_required = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('ai_analyses', lazy=True))
    family_member = db.relationship('FamilyMember', backref=db.backref('ai_analyses', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'family_member_id': self.family_member_id,
            'image_url': self.image_url,
            'predicted_condition': self.predicted_condition,
            'confidence_score': self.confidence_score,
            'detailed_results': self.detailed_results,
            'recommendations': self.recommendations,
            'follow_up_required': self.follow_up_required,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Doctor Profile Model
class DoctorProfile(db.Model):
    __tablename__ = 'doctor_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    experience_years = db.Column(db.Integer)
    qualifications = db.Column(db.Text)
    license_number = db.Column(db.String(50))
    clinic_name = db.Column(db.String(200))
    clinic_address = db.Column(db.Text)
    clinic_lat = db.Column(db.Float)
    clinic_lng = db.Column(db.Float)
    consultation_fee = db.Column(db.Float)
    accepted_insurance = db.Column(db.JSON)
    available_slots = db.Column(db.JSON)
    services_offered = db.Column(db.JSON)
    rating = db.Column(db.Float, default=0.0)
    total_reviews = db.Column(db.Integer, default=0)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('doctor_profile', uselist=False))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'specialization': self.specialization,
            'experience_years': self.experience_years,
            'qualifications': self.qualifications,
            'license_number': self.license_number,
            'clinic_name': self.clinic_name,
            'clinic_address': self.clinic_address,
            'clinic_lat': self.clinic_lat,
            'clinic_lng': self.clinic_lng,
            'consultation_fee': self.consultation_fee,
            'accepted_insurance': self.accepted_insurance,
            'available_slots': self.available_slots,
            'services_offered': self.services_offered,
            'rating': self.rating,
            'total_reviews': self.total_reviews,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
# Appointment Model
class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    family_member_id = db.Column(db.Integer, db.ForeignKey('family_members.id'), nullable=True)
    appointment_date = db.Column(db.DateTime, nullable=False)
    appointment_type = db.Column(db.Enum(AppointmentType), nullable=False)
    status = db.Column(db.Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)
    reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    consultation_fee = db.Column(db.Float)
    video_call_link = db.Column(db.String(255))
    prescription_id = db.Column(db.Integer, db.ForeignKey('prescriptions.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = db.relationship('User', foreign_keys=[patient_id], backref='patient_appointments')
    doctor = db.relationship('User', foreign_keys=[doctor_id], backref='doctor_appointments')
    family_member = db.relationship('FamilyMember', backref='appointments')

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'doctor_id': self.doctor_id,
            'family_member_id': self.family_member_id,
            'appointment_date': self.appointment_date.isoformat() if self.appointment_date else None,
            'appointment_type': self.appointment_type.value,
            'status': self.status.value,
            'reason': self.reason,
            'notes': self.notes,
            'consultation_fee': self.consultation_fee,
            'video_call_link': self.video_call_link,
            'prescription_id': self.prescription_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Prescription Model
class Prescription(db.Model):
    __tablename__ = 'prescriptions'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    family_member_id = db.Column(db.Integer, db.ForeignKey('family_members.id'), nullable=True)

    # Refractive Power Data
    od_sphere = db.Column(db.Float)  # Right eye sphere
    od_cylinder = db.Column(db.Float)  # Right eye cylinder
    od_axis = db.Column(db.Integer)  # Right eye axis
    od_add = db.Column(db.Float)  # Right eye addition

    os_sphere = db.Column(db.Float)  # Left eye sphere
    os_cylinder = db.Column(db.Float)  # Left eye cylinder
    os_axis = db.Column(db.Integer)  # Left eye axis
    os_add = db.Column(db.Float)  # Left eye addition

    # Additional prescription details
    pupillary_distance = db.Column(db.Float)
    lens_type = db.Column(db.String(100))
    frame_recommendations = db.Column(db.Text)

    # Medications
    medications = db.Column(db.JSON)

    # General notes and recommendations
    notes = db.Column(db.Text)
    recommendations = db.Column(db.Text)

    # Prescription metadata
    prescription_date = db.Column(db.DateTime, default=datetime.utcnow)
    valid_until = db.Column(db.DateTime)
    prescription_image_url = db.Column(db.String(255))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship('User', foreign_keys=[patient_id], backref='patient_prescriptions')
    doctor = db.relationship('User', foreign_keys=[doctor_id], backref='doctor_prescriptions')
    family_member = db.relationship('FamilyMember', backref='prescriptions')
    appointments = db.relationship('Appointment', backref='prescription')

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'doctor_id': self.doctor_id,
            'family_member_id': self.family_member_id,
            'od_sphere': self.od_sphere,
            'od_cylinder': self.od_cylinder,
            'od_axis': self.od_axis,
            'od_add': self.od_add,
            'os_sphere': self.os_sphere,
            'os_cylinder': self.os_cylinder,
            'os_axis': self.os_axis,
            'os_add': self.os_add,
            'pupillary_distance': self.pupillary_distance,
            'lens_type': self.lens_type,
            'frame_recommendations': self.frame_recommendations,
            'medications': self.medications,
            'notes': self.notes,
            'recommendations': self.recommendations,
            'prescription_date': self.prescription_date.isoformat() if self.prescription_date else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'prescription_image_url': self.prescription_image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
# Doctor Review Model
class DoctorReview(db.Model):
    __tablename__ = 'doctor_reviews'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    review_text = db.Column(db.Text)
    is_anonymous = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship('User', foreign_keys=[patient_id], backref='given_reviews')
    doctor = db.relationship('User', foreign_keys=[doctor_id], backref='received_reviews')
    appointment = db.relationship('Appointment', backref='review')

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id if not self.is_anonymous else None,
            'doctor_id': self.doctor_id,
            'appointment_id': self.appointment_id,
            'rating': self.rating,
            'review_text': self.review_text,
            'is_anonymous': self.is_anonymous,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Message Model for Doctor-Patient Communication
class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=True)
    message_text = db.Column(db.Text, nullable=False)
    attachment_url = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref='received_messages')
    appointment = db.relationship('Appointment', backref='messages')

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'appointment_id': self.appointment_id,
            'message_text': self.message_text,
            'attachment_url': self.attachment_url,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Vision Test Model for tracking power changes over time
class VisionTest(db.Model):
    __tablename__ = 'vision_tests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    family_member_id = db.Column(db.Integer, db.ForeignKey('family_members.id'), nullable=True)
    test_date = db.Column(db.DateTime, default=datetime.utcnow)

    # Vision scores
    od_vision_score = db.Column(db.String(10))  # e.g., "20/20", "6/6"
    os_vision_score = db.Column(db.String(10))

    # Near vision test results
    near_vision_od = db.Column(db.String(10))
    near_vision_os = db.Column(db.String(10))

    # Color vision test results
    color_vision_result = db.Column(db.String(50))
    ishihara_score = db.Column(db.Integer)

    # Additional test data
    test_conditions = db.Column(db.JSON)  # lighting, distance, etc.
    notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('vision_tests', lazy=True))
    family_member = db.relationship('FamilyMember', backref=db.backref('vision_tests', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'family_member_id': self.family_member_id,
            'test_date': self.test_date.isoformat() if self.test_date else None,
            'od_vision_score': self.od_vision_score,
            'os_vision_score': self.os_vision_score,
            'near_vision_od': self.near_vision_od,
            'near_vision_os': self.near_vision_os,
            'color_vision_result': self.color_vision_result,
            'ishihara_score': self.ishihara_score,
            'test_conditions': self.test_conditions,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Wallet(db.Model):
    """Crypto wallet model for storing encrypted wallet data"""
    __tablename__ = 'wallets'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)

    # Ethereum wallet
    eth_address = db.Column(db.String(42), nullable=False)
    encrypted_eth_private_key = db.Column(db.Text, nullable=False)

    # Bitcoin wallet
    btc_address = db.Column(db.String(62), nullable=True)
    encrypted_btc_private_key = db.Column(db.Text, nullable=True)

    # Encryption metadata
    salt = db.Column(db.String(255), nullable=False)
    encryption_method = db.Column(db.String(50), default='password')

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('wallet', uselist=False))

    def __repr__(self):
        return f'<Wallet {self.id} - User {self.user_id}>'

class BlockchainTransaction(db.Model):
    """Blockchain transaction history"""
    __tablename__ = 'blockchain_transactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Transaction details
    tx_hash = db.Column(db.String(66), nullable=False)
    tx_type = db.Column(db.String(20), nullable=False)  # ETH, BTC, DRST, VSC
    amount = db.Column(db.Numeric(precision=18, scale=8), nullable=False)

    # Addresses
    from_address = db.Column(db.String(62), nullable=True)
    to_address = db.Column(db.String(62), nullable=False)

    # Status
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, failed
    confirmations = db.Column(db.Integer, default=0)
    block_number = db.Column(db.Integer, nullable=True)

    # Metadata
    gas_used = db.Column(db.Integer, nullable=True)
    gas_price = db.Column(db.Numeric(precision=18, scale=8), nullable=True)
    network = db.Column(db.String(20), default='testnet')

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', backref='blockchain_transactions')

    def __repr__(self):
        return f'<BlockchainTransaction {self.tx_hash[:10]}...>'

class HealthRecord(db.Model):
    """Health records stored on blockchain"""
    __tablename__ = 'health_records'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Blockchain data
    record_id = db.Column(db.Integer, nullable=False)  # On-chain record ID
    ipfs_hash = db.Column(db.String(100), nullable=False)
    tx_hash = db.Column(db.String(66), nullable=False)

    # Record metadata
    record_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=True)
    description = db.Column(db.Text, nullable=True)

    # Status
    is_active = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='health_records')

    def __repr__(self):
        return f'<HealthRecord {self.record_id} - {self.record_type}>'

# =====================
# Staking & Referrals
# =====================

class StakingPosition(db.Model):
    __tablename__ = 'staking_positions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    amount = db.Column(db.Numeric(precision=18, scale=8), nullable=False)
    apy_percent = db.Column(db.Float, nullable=False)
    lock_period_days = db.Column(db.Integer, nullable=False)

    status = db.Column(db.String(20), default='active')  # active, unstaked, completed

    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)

    last_reward_calc = db.Column(db.DateTime, default=datetime.utcnow)
    accumulated_rewards = db.Column(db.Numeric(precision=18, scale=8), default=0)

    stake_tx_hash = db.Column(db.String(66), nullable=True)
    unstake_tx_hash = db.Column(db.String(66), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('staking_positions', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': float(self.amount),
            'apy_percent': self.apy_percent,
            'lock_period_days': self.lock_period_days,
            'status': self.status,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'last_reward_calc': self.last_reward_calc.isoformat() if self.last_reward_calc else None,
            'accumulated_rewards': float(self.accumulated_rewards),
            'stake_tx_hash': self.stake_tx_hash,
            'unstake_tx_hash': self.unstake_tx_hash,
        }

class StakingTransaction(db.Model):
    __tablename__ = 'staking_transactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    position_id = db.Column(db.Integer, db.ForeignKey('staking_positions.id'), nullable=True, index=True)

    action = db.Column(db.String(20), nullable=False)  # stake, unstake, reward
    amount = db.Column(db.Numeric(precision=18, scale=8), nullable=False)
    tx_hash = db.Column(db.String(66), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('staking_transactions', lazy=True))
    position = db.relationship('StakingPosition', backref=db.backref('transactions', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'position_id': self.position_id,
            'action': self.action,
            'amount': float(self.amount),
            'tx_hash': self.tx_hash,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Referral(db.Model):
    __tablename__ = 'referrals'

    id = db.Column(db.Integer, primary_key=True)
    referrer_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    referred_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)

    referral_code = db.Column(db.String(16), unique=True, nullable=False, index=True)
    status = db.Column(db.String(20), default='generated')  # generated, clicked, converted

    reward_amount = db.Column(db.Numeric(precision=18, scale=8), default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    clicked_at = db.Column(db.DateTime, nullable=True)
    converted_at = db.Column(db.DateTime, nullable=True)

    referrer = db.relationship('User', foreign_keys=[referrer_user_id], backref=db.backref('referrals_made', lazy=True))
    referred = db.relationship('User', foreign_keys=[referred_user_id], backref=db.backref('referrals_received', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'referrer_user_id': self.referrer_user_id,
            'referred_user_id': self.referred_user_id,
            'referral_code': self.referral_code,
            'status': self.status,
            'reward_amount': float(self.reward_amount),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'clicked_at': self.clicked_at.isoformat() if self.clicked_at else None,
            'converted_at': self.converted_at.isoformat() if self.converted_at else None,
        }
