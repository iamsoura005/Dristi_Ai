"""
Fresh MetaMask Wallet Authentication Routes
Separate file to avoid any import/caching issues
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, UserRole
from datetime import datetime, timedelta
import secrets
import re

# Create a new blueprint for wallet authentication
wallet_bp = Blueprint('wallet_auth', __name__, url_prefix='/api/wallet')

@wallet_bp.route('/test', methods=['GET'])
def test_wallet_auth():
    """Simple test endpoint to verify wallet auth routes are working"""
    return jsonify({
        'message': 'Wallet authentication routes are working!',
        'status': 'success',
        'endpoints': [
            'GET /api/wallet/test',
            'POST /api/wallet/nonce',
            'POST /api/wallet/verify'
        ]
    }), 200

@wallet_bp.route('/nonce', methods=['POST'])
def get_wallet_nonce():
    """Generate a nonce for wallet signature verification"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'JSON data required'}), 400
        
        wallet_address = data.get('wallet_address')
        
        if not wallet_address:
            return jsonify({'error': 'Wallet address is required'}), 400
        
        # Basic validation of Ethereum address format
        if not re.match(r'^0x[a-fA-F0-9]{40}$', wallet_address):
            return jsonify({'error': 'Invalid wallet address format'}), 400
        
        # Generate a random nonce
        nonce = secrets.token_hex(16)
        
        # Create message to be signed
        message = f"Sign this message to authenticate with Dristi AI.\n\nNonce: {nonce}\nAddress: {wallet_address}"
        
        return jsonify({
            'message': message,
            'nonce': nonce,
            'wallet_address': wallet_address
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate nonce: {str(e)}'}), 500

@wallet_bp.route('/verify', methods=['POST'])
def verify_wallet_signature():
    """Verify wallet signature and authenticate user (simplified version)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'JSON data required'}), 400
        
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Wallet address, signature, and message are required'}), 400
        
        # Basic validation of Ethereum address format
        if not re.match(r'^0x[a-fA-F0-9]{40}$', wallet_address):
            return jsonify({'error': 'Invalid wallet address format'}), 400
        
        # For now, we'll skip signature verification and just create/login user
        # In production, you would verify the signature here
        
        # Normalize address to lowercase for consistency
        wallet_address = wallet_address.lower()
        
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

@wallet_bp.route('/profile', methods=['POST'])
@jwt_required()
def complete_wallet_profile():
    """Complete user profile after wallet authentication"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'JSON data required'}), 400
        
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
