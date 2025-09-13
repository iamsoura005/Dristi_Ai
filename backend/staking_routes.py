"""
Staking API Routes for DRST token
"""
from datetime import datetime, timedelta
from decimal import Decimal
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, StakingPosition, StakingTransaction
from blockchain_services.wallet_service import get_wallet_service

staking_bp = Blueprint('staking', __name__, url_prefix='/api/staking')

# Simple APY tiers
APY_OPTIONS = {
    30: 8.0,    # 30 days -> 8% APY
    90: 12.0,   # 90 days -> 12% APY
    180: 16.0   # 180 days -> 16% APY
}


def _calc_rewards(position: StakingPosition) -> float:
    """Calculate rewards accrued since last calc assuming linear APY."""
    if not position or position.status != 'active':
        return 0.0
    now = datetime.utcnow()
    last = position.last_reward_calc or position.start_time or now
    days = (now - last).total_seconds() / 86400.0
    apy = float(position.apy_percent) / 100.0
    amount = float(position.amount)
    daily_rate = apy / 365.0
    return amount * daily_rate * days


@staking_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    user_id = get_jwt_identity()

    # Wallet balances
    wallet_service = get_wallet_service()
    wallet_info = wallet_service.get_wallet_info(user_id)
    if wallet_info.get('status') != 'active':
        return jsonify({'error': 'No active wallet found'}), 404

    eth_address = wallet_info['eth_address']
    drst_balance = 0.0
    try:
        drst_balance = wallet_service.get_token_balance(eth_address, 'DRST')
    except Exception as e:
        print(f"DRST balance error: {e}")

    # Positions
    positions = StakingPosition.query.filter_by(user_id=user_id).all()
    enriched = []
    total_staked = 0.0
    total_rewards = 0.0
    for p in positions:
        accrued = _calc_rewards(p)
        total_rewards += accrued + float(p.accumulated_rewards)
        total_staked += float(p.amount) if p.status == 'active' else 0.0
        enriched.append({**p.to_dict(), 'accrued_rewards': round(accrued, 8)})

    return jsonify({
        'success': True,
        'balances': {
            'DRST': drst_balance,
            'ETH_address': eth_address
        },
        'positions': enriched,
        'totals': {
            'total_staked': round(total_staked, 8),
            'total_rewards': round(total_rewards, 8)
        },
        'apy_options': APY_OPTIONS
    })


@staking_bp.route('/stake', methods=['POST'])
@jwt_required()
def stake_tokens():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    try:
        amount = float(data.get('amount', 0))
        lock_days = int(data.get('lock_period_days', 30))
        tx_hash = data.get('tx_hash')  # Optional if staked via MetaMask
    except Exception:
        return jsonify({'error': 'Invalid amount or lock period'}), 400

    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400

    if lock_days not in APY_OPTIONS:
        return jsonify({'error': 'Invalid lock period'}), 400

    apy = APY_OPTIONS[lock_days]

    # Create position (off-chain accounting for now)
    position = StakingPosition(
        user_id=user_id,
        amount=Decimal(str(amount)),
        apy_percent=apy,
        lock_period_days=lock_days,
        stake_tx_hash=tx_hash,
        status='active'
    )
    db.session.add(position)
    db.session.flush()  # Get position.id

    tx = StakingTransaction(
        user_id=user_id,
        position_id=position.id,
        action='stake',
        amount=Decimal(str(amount)),
        tx_hash=tx_hash
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({'success': True, 'position': position.to_dict(), 'transaction': tx.to_dict()})


@staking_bp.route('/unstake', methods=['POST'])
@jwt_required()
def unstake_tokens():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    position_id = data.get('position_id')
    tx_hash = data.get('tx_hash')  # Optional if done via MetaMask

    if not position_id:
        return jsonify({'error': 'position_id is required'}), 400

    position = StakingPosition.query.filter_by(id=position_id, user_id=user_id).first()
    if not position:
        return jsonify({'error': 'Position not found'}), 404

    if position.status != 'active':
        return jsonify({'error': 'Position is not active'}), 400

    # Enforce lock period
    min_end = position.start_time + timedelta(days=position.lock_period_days)
    if datetime.utcnow() < min_end:
        return jsonify({'error': 'Cannot unstake before lock period ends'}), 400

    # Calculate and finalize rewards
    accrued = _calc_rewards(position)
    position.accumulated_rewards = Decimal(str(float(position.accumulated_rewards) + accrued))
    position.last_reward_calc = datetime.utcnow()
    position.end_time = datetime.utcnow()
    position.status = 'unstaked'
    position.unstake_tx_hash = tx_hash

    # Log transaction
    tx = StakingTransaction(
        user_id=user_id,
        position_id=position.id,
        action='unstake',
        amount=position.amount,
        tx_hash=tx_hash
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({'success': True, 'position': position.to_dict(), 'accrued_rewards': round(accrued, 8)})


@staking_bp.route('/history', methods=['GET'])
@jwt_required()
def staking_history():
    user_id = get_jwt_identity()
    txs = StakingTransaction.query.filter_by(user_id=user_id).order_by(StakingTransaction.created_at.desc()).limit(100).all()
    return jsonify({'success': True, 'history': [t.to_dict() for t in txs]})

