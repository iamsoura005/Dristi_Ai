"""
Enhanced AI Disease Detection API Routes
Provides comprehensive endpoints for AI-powered eye disease analysis
"""

import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from ai_disease_service import ai_detector
from models import db, User, FamilyMember, AIAnalysis
from reward_service import reward_service

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

# Configuration
UPLOAD_FOLDER = 'uploads/eye_images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def ensure_upload_folder():
    """Ensure upload folder exists"""
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

@ai_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_eye_image():
    """
    Comprehensive AI analysis of eye image
    
    Expected form data:
    - image: Eye image file
    - family_member_id: Optional ID of family member (if analyzing for family)
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF'
            }), 400
        
        # Check file size
        if len(file.read()) > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large. Maximum size: 16MB'}), 400
        file.seek(0)  # Reset file pointer
        
        # Get optional family member ID
        family_member_id = request.form.get('family_member_id')
        if family_member_id:
            try:
                family_member_id = int(family_member_id)
                # Verify family member belongs to current user
                family_member = FamilyMember.query.filter_by(
                    id=family_member_id, 
                    user_id=current_user_id
                ).first()
                if not family_member:
                    return jsonify({'error': 'Invalid family member ID'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid family member ID format'}), 400
        else:
            family_member_id = None
        
        # Save uploaded file
        ensure_upload_folder()
        filename = secure_filename(file.filename)
        timestamp = str(int(datetime.now().timestamp()))
        filename = f"{current_user_id}_{timestamp}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Perform AI analysis
        analysis_result = ai_detector.analyze_image(
            file_path, current_user_id, family_member_id
        )
        
        if not analysis_result['success']:
            return jsonify({'error': analysis_result['error']}), 500

        # Award VisionCoins for completing the analysis
        reward_result = reward_service.process_eye_analysis_reward(
            current_user_id,
            analysis_result['analysis']
        )

        response_data = {
            'message': 'Analysis completed successfully',
            'analysis': analysis_result['analysis']
        }

        # Include reward information if successful
        if reward_result.get('success'):
            response_data['reward'] = {
                'amount': reward_result['amount'],
                'reason': reward_result['reason'],
                'new_balance': reward_result.get('new_balance', 0)
            }

        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@ai_bp.route('/history', methods=['GET'])
@jwt_required()
def get_analysis_history():
    """
    Get analysis history for current user
    
    Query parameters:
    - family_member_id: Optional filter by family member
    - limit: Number of results to return (default: 10)
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        family_member_id = request.args.get('family_member_id')
        limit = int(request.args.get('limit', 10))
        
        if family_member_id:
            try:
                family_member_id = int(family_member_id)
                # Verify family member belongs to current user
                family_member = FamilyMember.query.filter_by(
                    id=family_member_id, 
                    user_id=current_user_id
                ).first()
                if not family_member:
                    return jsonify({'error': 'Invalid family member ID'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid family member ID format'}), 400
        else:
            family_member_id = None
        
        # Get analysis history
        history = ai_detector.get_analysis_history(current_user_id, family_member_id)
        
        # Limit results
        if limit > 0:
            history = history[:limit]
        
        return jsonify({
            'message': 'Analysis history retrieved successfully',
            'history': history,
            'total_count': len(history)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve history: {str(e)}'}), 500

@ai_bp.route('/analysis/<int:analysis_id>', methods=['GET'])
@jwt_required()
def get_analysis_details(analysis_id):
    """Get detailed analysis results by ID"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get analysis record
        analysis = AIAnalysis.query.filter_by(
            id=analysis_id, 
            user_id=current_user_id
        ).first()
        
        if not analysis:
            return jsonify({'error': 'Analysis not found'}), 404
        
        return jsonify({
            'message': 'Analysis details retrieved successfully',
            'analysis': analysis.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve analysis: {str(e)}'}), 500

@ai_bp.route('/disease-info/<string:condition>', methods=['GET'])
def get_disease_information(condition):
    """Get comprehensive information about a specific eye condition"""
    try:
        disease_info = ai_detector._get_disease_information(condition)
        
        if not disease_info:
            return jsonify({'error': 'Disease information not found'}), 404
        
        return jsonify({
            'message': 'Disease information retrieved successfully',
            'condition': condition,
            'info': disease_info
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve disease info: {str(e)}'}), 500

@ai_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_analysis_statistics():
    """Get analysis statistics for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get all analyses for user
        analyses = AIAnalysis.query.filter_by(user_id=current_user_id).all()
        
        # Calculate statistics
        total_analyses = len(analyses)
        conditions_detected = {}
        confidence_scores = []
        follow_ups_required = 0
        
        for analysis in analyses:
            condition = analysis.predicted_condition
            conditions_detected[condition] = conditions_detected.get(condition, 0) + 1
            confidence_scores.append(analysis.confidence_score)
            if analysis.follow_up_required:
                follow_ups_required += 1
        
        # Calculate average confidence
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        statistics = {
            'total_analyses': total_analyses,
            'conditions_detected': conditions_detected,
            'average_confidence': round(avg_confidence, 3),
            'follow_ups_required': follow_ups_required,
            'latest_analysis': analyses[-1].to_dict() if analyses else None
        }
        
        return jsonify({
            'message': 'Statistics retrieved successfully',
            'statistics': statistics
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve statistics: {str(e)}'}), 500

@ai_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_personalized_recommendations():
    """Get personalized recommendations based on analysis history"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get recent analyses
        recent_analyses = AIAnalysis.query.filter_by(
            user_id=current_user_id
        ).order_by(AIAnalysis.created_at.desc()).limit(5).all()
        
        if not recent_analyses:
            return jsonify({
                'message': 'No analysis history found',
                'recommendations': [
                    "Upload your first eye image for AI analysis",
                    "Regular eye check-ups are recommended",
                    "Maintain a healthy lifestyle for good eye health"
                ]
            }), 200
        
        # Generate recommendations based on history
        recommendations = []
        conditions_found = set()
        
        for analysis in recent_analyses:
            conditions_found.add(analysis.predicted_condition)
        
        # Add condition-specific recommendations
        if 'normal' in conditions_found and len(conditions_found) == 1:
            recommendations.extend([
                "Great! Your eyes appear healthy. Continue regular monitoring.",
                "Maintain current eye care routine",
                "Schedule annual comprehensive eye exams"
            ])
        else:
            recommendations.extend([
                "Multiple conditions detected in recent analyses",
                "Consider consulting an ophthalmologist for comprehensive evaluation",
                "Regular monitoring is important for eye health"
            ])
        
        # Add follow-up recommendations
        follow_ups_needed = sum(1 for a in recent_analyses if a.follow_up_required)
        if follow_ups_needed > 0:
            recommendations.append(f"You have {follow_ups_needed} analyses requiring follow-up")
        
        return jsonify({
            'message': 'Personalized recommendations generated',
            'recommendations': recommendations,
            'based_on_analyses': len(recent_analyses)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate recommendations: {str(e)}'}), 500

# Import datetime at the top of the file
from datetime import datetime
