"""
Blockchain API Routes for Dristi AI
Handles wallet management, token transactions, and blockchain interactions
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from blockchain_services.wallet_service import get_wallet_service
from blockchain_services.web3_service import get_web3_service
from blockchain_services.ipfs_service import get_ipfs_service
from models import db, User
import json
from datetime import datetime

blockchain_bp = Blueprint('blockchain', __name__, url_prefix='/api/blockchain')

@blockchain_bp.route('/wallet/create', methods=['POST'])
@jwt_required()
def create_wallet():
    """Create new crypto wallet for user"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        password = data.get('password')
        if not password:
            return jsonify({'error': 'Password required'}), 400
        
        wallet_service = get_wallet_service()
        wallet_info = wallet_service.create_wallet(user_id, password)
        
        return jsonify({
            'success': True,
            'wallet': wallet_info
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/wallet/info', methods=['GET'])
@jwt_required()
def get_wallet_info():
    """Get wallet information for current user"""
    try:
        user_id = get_jwt_identity()
        wallet_service = get_wallet_service()
        
        wallet_info = wallet_service.get_wallet_info(user_id)
        
        return jsonify({
            'success': True,
            'wallet': wallet_info
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/wallet/balances', methods=['GET'])
@jwt_required()
def get_wallet_balances():
    """Get all wallet balances for current user"""
    try:
        user_id = get_jwt_identity()
        wallet_service = get_wallet_service()
        
        wallet_info = wallet_service.get_wallet_info(user_id)
        if wallet_info.get('status') != 'active':
            return jsonify({'error': 'No active wallet found'}), 404
        
        eth_address = wallet_info['eth_address']
        btc_address = wallet_info['btc_address']
        
        # Get balances
        eth_balance = wallet_service.get_eth_balance(eth_address)
        drst_balance = wallet_service.get_token_balance(eth_address, 'DRST')
        vsc_balance = wallet_service.get_token_balance(eth_address, 'VSC')
        btc_balance = wallet_service.get_btc_balance(btc_address)
        
        return jsonify({
            'success': True,
            'balances': {
                'ETH': eth_balance,
                'DRST': drst_balance,
                'VSC': vsc_balance,
                'BTC': btc_balance
            },
            'addresses': {
                'ethereum': eth_address,
                'bitcoin': btc_address
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/wallet/send', methods=['POST'])
@jwt_required()
def send_crypto():
    """Send cryptocurrency or tokens"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        password = data.get('password')
        to_address = data.get('to_address')
        amount = data.get('amount')
        crypto_type = data.get('type')  # ETH, BTC, DRST, VSC
        
        if not all([password, to_address, amount, crypto_type]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        wallet_service = get_wallet_service()
        
        if crypto_type == 'ETH':
            tx_hash = wallet_service.send_eth(user_id, password, to_address, float(amount))
        elif crypto_type == 'BTC':
            tx_hash = wallet_service.send_btc(user_id, password, to_address, float(amount))
        elif crypto_type in ['DRST', 'VSC']:
            tx_hash = wallet_service.send_tokens(user_id, password, to_address, float(amount), crypto_type)
        else:
            return jsonify({'error': 'Invalid crypto type'}), 400
        
        return jsonify({
            'success': True,
            'transaction_hash': tx_hash
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/wallet/transactions', methods=['GET'])
@jwt_required()
def get_transaction_history():
    """Get transaction history for current user"""
    try:
        user_id = get_jwt_identity()
        wallet_service = get_wallet_service()
        
        transactions = wallet_service.get_transaction_history(user_id)
        
        return jsonify({
            'success': True,
            'transactions': transactions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/health-passport/add', methods=['POST'])
@jwt_required()
def add_health_record():
    """Add health record to blockchain"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        record_type = data.get('record_type')
        test_results = data.get('test_results')
        doctor_notes = data.get('doctor_notes', '')
        recommendations = data.get('recommendations', [])
        
        if not all([record_type, test_results]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get user's wallet address
        wallet_service = get_wallet_service()
        wallet_info = wallet_service.get_wallet_info(user_id)
        
        if wallet_info.get('status') != 'active':
            return jsonify({'error': 'No active wallet found'}), 404
        
        patient_address = wallet_info['eth_address']
        
        # Create health record metadata
        ipfs_service = get_ipfs_service()
        record_metadata = ipfs_service.create_health_record_metadata(
            record_type, test_results, doctor_notes, recommendations
        )
        
        # Store on IPFS
        ipfs_hash = ipfs_service.store_health_record(
            patient_address, record_type, record_metadata
        )
        
        # Add to blockchain
        web3_service = get_web3_service()
        tx_hash = web3_service.add_health_record(patient_address, ipfs_hash, record_type)
        
        return jsonify({
            'success': True,
            'ipfs_hash': ipfs_hash,
            'transaction_hash': tx_hash
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/health-passport/records', methods=['GET'])
@jwt_required()
def get_health_records():
    """Get health records for current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's wallet address
        wallet_service = get_wallet_service()
        wallet_info = wallet_service.get_wallet_info(user_id)
        
        if wallet_info.get('status') != 'active':
            return jsonify({'error': 'No active wallet found'}), 404
        
        patient_address = wallet_info['eth_address']
        
        # Get records from blockchain
        web3_service = get_web3_service()
        records = web3_service.get_health_records(patient_address)
        
        # Fetch IPFS data for each record
        ipfs_service = get_ipfs_service()
        detailed_records = []
        
        for record in records:
            try:
                ipfs_data = ipfs_service.retrieve_data(record['ipfsHash'])
                record['data'] = ipfs_data
                detailed_records.append(record)
            except Exception as e:
                print(f"Failed to fetch IPFS data for {record['ipfsHash']}: {str(e)}")
                detailed_records.append(record)
        
        return jsonify({
            'success': True,
            'records': detailed_records
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/tokens/mint-drst', methods=['POST'])
@jwt_required()
def mint_drst_tokens():
    """Mint DRST tokens for user activity"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        activity_type = data.get('activity_type')  # eye_test, daily_exercise, family_member
        
        if not activity_type:
            return jsonify({'error': 'Activity type required'}), 400
        
        # Get user's wallet address
        wallet_service = get_wallet_service()
        wallet_info = wallet_service.get_wallet_info(user_id)
        
        if wallet_info.get('status') != 'active':
            return jsonify({'error': 'No active wallet found'}), 404
        
        user_address = wallet_info['eth_address']
        
        # Mint tokens
        web3_service = get_web3_service()
        tx_hash = web3_service.mint_drst_tokens(user_address, activity_type)
        
        return jsonify({
            'success': True,
            'transaction_hash': tx_hash,
            'activity_type': activity_type
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/tokens/mint-vsc', methods=['POST'])
@jwt_required()
def mint_vision_coins():
    """Mint VisionCoins based on health analysis"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        health_condition = data.get('health_condition')  # 0=Normal, 1=Mild, 2=Severe
        analysis_data = data.get('analysis_data')
        
        if health_condition is None or not analysis_data:
            return jsonify({'error': 'Health condition and analysis data required'}), 400
        
        # Get user's wallet address
        wallet_service = get_wallet_service()
        wallet_info = wallet_service.get_wallet_info(user_id)
        
        if wallet_info.get('status') != 'active':
            return jsonify({'error': 'No active wallet found'}), 404
        
        user_address = wallet_info['eth_address']
        
        # Store analysis on IPFS
        ipfs_service = get_ipfs_service()
        ipfs_hash = ipfs_service.store_health_record(
            user_address, 'vision_analysis', analysis_data
        )
        
        # Mint VisionCoins
        web3_service = get_web3_service()
        tx_hash = web3_service.mint_vision_coins(user_address, health_condition, ipfs_hash)
        
        return jsonify({
            'success': True,
            'transaction_hash': tx_hash,
            'ipfs_hash': ipfs_hash,
            'health_condition': health_condition
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/nft/mint', methods=['POST'])
@jwt_required()
def mint_achievement_nft():
    """Mint achievement NFT for user"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        achievement_type = data.get('achievement_type')  # 0=FirstEyeTest, 1=VisionImproved, 2=FamilyComplete
        image_data = data.get('image_data')  # Base64 encoded image
        
        if achievement_type is None:
            return jsonify({'error': 'Achievement type required'}), 400
        
        # Get user's wallet address
        wallet_service = get_wallet_service()
        wallet_info = wallet_service.get_wallet_info(user_id)
        
        if wallet_info.get('status') != 'active':
            return jsonify({'error': 'No active wallet found'}), 404
        
        user_address = wallet_info['eth_address']
        
        # Store image on IPFS if provided
        image_uri = ""
        if image_data:
            import base64
            image_bytes = base64.b64decode(image_data)
            ipfs_service = get_ipfs_service()
            image_hash = ipfs_service.store_image(image_bytes, f"achievement_{achievement_type}")
            image_uri = f"ipfs://{image_hash}"
        
        # Mint NFT
        web3_service = get_web3_service()
        tx_hash = web3_service.mint_achievement_nft(user_address, achievement_type, image_uri)
        
        return jsonify({
            'success': True,
            'transaction_hash': tx_hash,
            'image_uri': image_uri
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/nft/user-nfts', methods=['GET'])
@jwt_required()
def get_user_nfts():
    """Get user's achievement NFTs"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's wallet address
        wallet_service = get_wallet_service()
        wallet_info = wallet_service.get_wallet_info(user_id)
        
        if wallet_info.get('status') != 'active':
            return jsonify({'error': 'No active wallet found'}), 404
        
        user_address = wallet_info['eth_address']
        
        # Get NFTs
        web3_service = get_web3_service()
        nfts = web3_service.get_user_nfts(user_address)
        
        return jsonify({
            'success': True,
            'nfts': nfts
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/status', methods=['GET'])
def get_blockchain_status():
    """Get blockchain service status"""
    try:
        web3_service = get_web3_service()
        ipfs_service = get_ipfs_service()
        
        status = {
            'web3_connected': web3_service.is_connected(),
            'ipfs_online': ipfs_service.is_online(),
            'contracts_loaded': len(web3_service.contracts) > 0,
            'network': 'testnet',  # or get from web3_service
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'success': True,
            'status': status
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
