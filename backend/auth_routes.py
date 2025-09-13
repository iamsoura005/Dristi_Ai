from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, UserRole, TestResult
from datetime import datetime, timedelta
import re
import secrets
from eth_account.messages import encode_defunct
from eth_account import Account
from web3 import Web3

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    # At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Valid password"

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()
        role_str = data.get('role', 'patient').lower()
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Validate role
        try:
            if role_str == 'patient':
                role = UserRole.PATIENT
            elif role_str == 'doctor':
                role = UserRole.DOCTOR
            elif role_str == 'admin':
                role = UserRole.ADMIN
            else:
                role = UserRole.PATIENT  # Default to patient
        except:
            role = UserRole.PATIENT
        
        # Create new user
        user = User(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Generate access token
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate access token
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user info: {str(e)}'}), 500

# MetaMask Wallet Authentication Routes

@auth_bp.route('/wallet/nonce', methods=['POST'])
def get_wallet_nonce():
    """Generate a nonce for wallet signature verification"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')

        if not wallet_address:
            return jsonify({'error': 'Wallet address is required'}), 400

        # Validate Ethereum address format
        if not Web3.is_address(wallet_address):
            return jsonify({'error': 'Invalid wallet address format'}), 400

        # Normalize address to checksum format
        wallet_address = Web3.to_checksum_address(wallet_address)

        # Generate a random nonce
        nonce = secrets.token_hex(16)

        # Store nonce temporarily (in production, use Redis or similar)
        # For now, we'll include it in the message to be signed
        message = f"Sign this message to authenticate with Dristi AI.\n\nNonce: {nonce}\nAddress: {wallet_address}"

        return jsonify({
            'message': message,
            'nonce': nonce
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to generate nonce: {str(e)}'}), 500

@auth_bp.route('/wallet/verify', methods=['POST'])
def verify_wallet_signature():
    """Verify wallet signature and authenticate user"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')

        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Wallet address, signature, and message are required'}), 400

        # Validate Ethereum address format
        if not Web3.is_address(wallet_address):
            return jsonify({'error': 'Invalid wallet address format'}), 400

        # Normalize address to checksum format
        wallet_address = Web3.to_checksum_address(wallet_address)

        try:
            # Verify the signature
            message_hash = encode_defunct(text=message)
            recovered_address = Account.recover_message(message_hash, signature=signature)

            if recovered_address.lower() != wallet_address.lower():
                return jsonify({'error': 'Invalid signature'}), 401

        except Exception as e:
            return jsonify({'error': 'Invalid signature format'}), 401

        # Check if user exists with this wallet address
        user = User.query.filter_by(wallet_address=wallet_address).first()

        if not user:
            # Create new user with wallet address
            user = User(
                wallet_address=wallet_address,
                first_name=f"User",
                last_name=wallet_address[-6:],  # Use last 6 chars of address as identifier
                role=UserRole.PATIENT
            )
            db.session.add(user)
            db.session.commit()

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Generate access token
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )

        return jsonify({
            'message': 'Wallet authentication successful',
            'access_token': access_token,
            'user': user.to_dict(),
            'is_new_user': not bool(user.email)  # True if user hasn't completed profile
        }), 200

    except Exception as e:
        return jsonify({'error': f'Wallet authentication failed: {str(e)}'}), 500

@auth_bp.route('/wallet/profile', methods=['POST'])
@jwt_required()
def complete_wallet_profile():
    """Complete user profile after wallet authentication"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        # Update user profile information
        if data.get('email'):
            # Check if email is already taken by another user
            existing_user = User.query.filter(
                User.email == data['email'].lower().strip(),
                User.id != user.id
            ).first()

            if existing_user:
                return jsonify({'error': 'Email already registered'}), 409

            user.email = data['email'].lower().strip()

        if data.get('first_name'):
            user.first_name = data['first_name'].strip()

        if data.get('last_name'):
            user.last_name = data['last_name'].strip()

        if data.get('phone'):
            user.phone = data['phone']

        if data.get('date_of_birth'):
            try:
                user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

        if data.get('gender'):
            user.gender = data['gender']

        if data.get('preferred_language'):
            user.preferred_language = data['preferred_language']

        db.session.commit()

        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

# Test route to verify wallet routes are loaded
@auth_bp.route('/wallet/test', methods=['GET'])
def test_wallet_routes():
    """Test endpoint to verify wallet routes are working"""
    return jsonify({
        'message': 'Wallet routes are loaded and working!',
        'endpoints': [
            '/auth/wallet/nonce',
            '/auth/wallet/verify',
            '/auth/wallet/profile',
            '/auth/wallet/test'
        ]
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'Invalid user'}), 401
        
        # Generate new access token
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )
        
        return jsonify({
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Token refresh failed: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # In a production environment, you might want to blacklist the token
    # For now, we'll just return a success message
    return jsonify({'message': 'Logout successful'}), 200

# Protected routes for user management
@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Only admins and doctors can view all users
        if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        users = User.query.all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get users: {str(e)}'}), 500