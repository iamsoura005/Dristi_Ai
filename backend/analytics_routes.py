"""
Health Analytics API Routes
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, TestResult, AIAnalysis

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


@analytics_bp.route('/health/summary', methods=['GET'])
@jwt_required()
def health_summary():
    user_id = get_jwt_identity()

    test_count = TestResult.query.filter_by(user_id=user_id).count()
    ai_count = AIAnalysis.query.filter_by(user_id=user_id).count()

    # Recent tests
    recent_tests = TestResult.query.filter_by(user_id=user_id).order_by(TestResult.created_at.desc()).limit(10).all()
    tests_payload = []
    for t in recent_tests:
        tests_payload.append({
            'id': t.id,
            'type': t.test_type,
            'created_at': t.created_at.isoformat() if t.created_at else None,
            'summary': t.results if isinstance(t.results, dict) else {'raw': str(t.results)[:300]}
        })

    # Simple risk score based on AIAnalysis severity
    analyses = AIAnalysis.query.filter_by(user_id=user_id).order_by(AIAnalysis.created_at.desc()).limit(50).all()
    risk_scores = []
    for a in analyses:
        sev = (a.severity or '').lower()
        score = 0
        if 'severe' in sev:
            score = 80
        elif 'moderate' in sev or 'mild' in sev:
            score = 50
        else:
            score = 20
        risk_scores.append({'id': a.id, 'score': score, 'timestamp': a.created_at.isoformat() if a.created_at else None})

    avg_risk = round(sum([x['score'] for x in risk_scores]) / len(risk_scores), 2) if risk_scores else 0

    return jsonify({
        'success': True,
        'counts': {
            'test_results': test_count,
            'ai_analyses': ai_count
        },
        'recent_tests': tests_payload,
        'risk_scores': risk_scores,
        'avg_risk_score': avg_risk,
    })


@analytics_bp.route('/health/trends', methods=['GET'])
@jwt_required()
def health_trends():
    user_id = get_jwt_identity()

    # Very simple monthly grouping of tests
    tests = TestResult.query.filter_by(user_id=user_id).all()
    buckets = {}
    for t in tests:
        if not t.created_at:
            continue
        key = t.created_at.strftime('%Y-%m')
        buckets[key] = buckets.get(key, 0) + 1

    data = [{'month': k, 'tests': v} for k, v in sorted(buckets.items())]

    return jsonify({'success': True, 'trends': data})


@analytics_bp.route('/health/export', methods=['GET'])
@jwt_required()
def health_export():
    user_id = get_jwt_identity()

    tests = TestResult.query.filter_by(user_id=user_id).order_by(TestResult.created_at.desc()).all()
    payload = []
    for t in tests:
        payload.append({
            'id': t.id,
            'type': t.test_type,
            'created_at': t.created_at.isoformat() if t.created_at else None,
            'results': t.results if isinstance(t.results, dict) else {'raw': str(t.results)}
        })

    return jsonify({'success': True, 'exported': payload, 'generated_at': datetime.utcnow().isoformat()})

