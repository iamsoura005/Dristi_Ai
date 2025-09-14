"""
Referral System API Routes
"""
from datetime import datetime
import secrets
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Referral, User

referral_bp = Blueprint('referrals', __name__, url_prefix='/api/referrals')


def _generate_code() -> str:
    # 10-char alphanumeric code
    return secrets.token_hex(5)


@referral_bp.route('/my-code', methods=['GET'])
@jwt_required(optional=True)
def my_code():
    user_id = get_jwt_identity()

    if not user_id:
        return jsonify({'error': 'Authentication required', 'code': None}), 401

    # Try to find an existing generated code for this user without conversion
    existing = Referral.query.filter_by(referrer_user_id=user_id).order_by(Referral.created_at.asc()).first()
    if existing:
        code = existing.referral_code
    else:
        code = _generate_code()
        ref = Referral(referrer_user_id=user_id, referral_code=code, status='generated')
        db.session.add(ref)
        db.session.commit()
    
    # Build share link (frontend handles redirect)
    frontend_base = 'http://localhost:3000/register'
    share_link = f"{frontend_base}?ref={code}"

    return jsonify({'success': True, 'code': code, 'share_link': share_link})


@referral_bp.route('/track-click', methods=['POST'])
def track_click():
    data = request.get_json() or {}
    code = data.get('code')
    if not code:
        return jsonify({'error': 'code is required'}), 400

    ref = Referral.query.filter_by(referral_code=code).first()
    if not ref:
        # Create a placeholder entry if unknown code arrives (optional)
        ref = Referral(referrer_user_id=0, referral_code=code, status='clicked')
        ref.clicked_at = datetime.utcnow()
        db.session.add(ref)
        db.session.commit()
        return jsonify({'success': True})

    ref.status = 'clicked' if ref.status == 'generated' else ref.status
    ref.clicked_at = ref.clicked_at or datetime.utcnow()
    db.session.commit()
    return jsonify({'success': True})


@referral_bp.route('/register-attribution', methods=['POST'])
@jwt_required()
def register_attribution():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    code = data.get('code')

    if not code:
        return jsonify({'error': 'code is required'}), 400

    ref = Referral.query.filter_by(referral_code=code).first()
    if not ref:
        return jsonify({'error': 'Invalid referral code'}), 404

    if ref.referred_user_id:
        return jsonify({'error': 'Referral already attributed'}), 400

    ref.referred_user_id = user_id
    ref.status = 'converted'
    ref.converted_at = datetime.utcnow()

    # Basic reward crediting logic (off-chain); integrate with DRST minting later
    ref.reward_amount = ref.reward_amount or 0

    db.session.commit()
    return jsonify({'success': True})


@referral_bp.route('/stats', methods=['GET'])
@jwt_required(optional=True)
def stats():
    user_id = get_jwt_identity()

    if not user_id:
        return jsonify({'error': 'Authentication required', 'stats': None}), 401

    refs = Referral.query.filter_by(referrer_user_id=user_id).all()
    total = len(refs)
    clicks = sum(1 for r in refs if r.clicked_at)
    conversions = sum(1 for r in refs if r.converted_at)
    total_rewards = float(sum(r.reward_amount or 0 for r in refs))

    referred_users = []
    for r in refs:
        if r.referred_user_id:
            user = User.query.get(r.referred_user_id)
            if user:
                referred_users.append({
                    'id': user.id,
                    'name': f"{user.first_name or ''} {user.last_name or ''}".strip() or f"User {user.id}",
                    'joined_at': r.converted_at.isoformat() if r.converted_at else None
                })

    return jsonify({
        'success': True,
        'summary': {
            'total_links': total,
            'clicks': clicks,
            'conversions': conversions,
            'total_rewards': total_rewards
        },
        'referred_users': referred_users
    })


@referral_bp.route('/leaderboard', methods=['GET'])
@jwt_required(optional=True)
def leaderboard():
    user_id = get_jwt_identity()

    if not user_id:
        return jsonify({'error': 'Authentication required', 'leaderboard': []}), 401
    # Top referrers by conversions
    # Simple raw SQL-like aggregation using Python for SQLite simplicity
    # In production, use proper GROUP BY queries
    all_refs = Referral.query.all()
    by_user = {}
    for r in all_refs:
        if r.referrer_user_id not in by_user:
            by_user[r.referrer_user_id] = {'conversions': 0, 'clicks': 0}
        if r.clicked_at:
            by_user[r.referrer_user_id]['clicks'] += 1
        if r.converted_at:
            by_user[r.referrer_user_id]['conversions'] += 1

    # Fetch user names
    rows = []
    for uid, agg in by_user.items():
        user = User.query.get(uid)
        rows.append({
            'user_id': uid,
            'name': f"{(user.first_name or '')} {(user.last_name or '')}".strip() or f"User {uid}",
            'conversions': agg['conversions'],
            'clicks': agg['clicks']
        })

    rows.sort(key=lambda x: (-x['conversions'], -x['clicks']))
    return jsonify({'success': True, 'leaderboard': rows[:20]})

