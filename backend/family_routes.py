"""
Family Member Management API Routes
Handles family member profiles and health tracking
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, User, FamilyMember, RelationshipType, Gender

family_bp = Blueprint('family', __name__, url_prefix='/api/family')

@family_bp.route('/members', methods=['GET'])
@jwt_required()
def get_family_members():
    """Get all family members for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        family_members = FamilyMember.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'message': 'Family members retrieved successfully',
            'family_members': [member.to_dict() for member in family_members],
            'total_count': len(family_members)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve family members: {str(e)}'}), 500

@family_bp.route('/members', methods=['POST'])
@jwt_required()
def add_family_member():
    """Add a new family member"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'relationship']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate relationship type
        try:
            relationship = RelationshipType(data['relationship'])
        except ValueError:
            valid_relationships = [r.value for r in RelationshipType]
            return jsonify({
                'error': f'Invalid relationship. Valid options: {valid_relationships}'
            }), 400
        
        # Validate gender if provided
        gender = None
        if data.get('gender'):
            try:
                gender = Gender(data['gender'])
            except ValueError:
                valid_genders = [g.value for g in Gender]
                return jsonify({
                    'error': f'Invalid gender. Valid options: {valid_genders}'
                }), 400
        
        # Parse date of birth if provided
        date_of_birth = None
        if data.get('date_of_birth'):
            try:
                date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'error': 'Invalid date format. Use YYYY-MM-DD'
                }), 400
        
        # Create family member
        family_member = FamilyMember(
            user_id=current_user_id,
            name=data['name'].strip(),
            relationship=relationship,
            date_of_birth=date_of_birth,
            gender=gender,
            phone=data.get('phone', '').strip() if data.get('phone') else None,
            medical_conditions=data.get('medical_conditions', '').strip() if data.get('medical_conditions') else None
        )
        
        db.session.add(family_member)
        db.session.commit()
        
        return jsonify({
            'message': 'Family member added successfully',
            'family_member': family_member.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add family member: {str(e)}'}), 500

@family_bp.route('/members/<int:member_id>', methods=['GET'])
@jwt_required()
def get_family_member(member_id):
    """Get specific family member details"""
    try:
        current_user_id = get_jwt_identity()
        
        family_member = FamilyMember.query.filter_by(
            id=member_id, 
            user_id=current_user_id
        ).first()
        
        if not family_member:
            return jsonify({'error': 'Family member not found'}), 404
        
        return jsonify({
            'message': 'Family member retrieved successfully',
            'family_member': family_member.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve family member: {str(e)}'}), 500

@family_bp.route('/members/<int:member_id>', methods=['PUT'])
@jwt_required()
def update_family_member(member_id):
    """Update family member information"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        family_member = FamilyMember.query.filter_by(
            id=member_id, 
            user_id=current_user_id
        ).first()
        
        if not family_member:
            return jsonify({'error': 'Family member not found'}), 404
        
        # Update fields if provided
        if 'name' in data:
            family_member.name = data['name'].strip()
        
        if 'relationship' in data:
            try:
                family_member.relationship = RelationshipType(data['relationship'])
            except ValueError:
                valid_relationships = [r.value for r in RelationshipType]
                return jsonify({
                    'error': f'Invalid relationship. Valid options: {valid_relationships}'
                }), 400
        
        if 'gender' in data:
            if data['gender']:
                try:
                    family_member.gender = Gender(data['gender'])
                except ValueError:
                    valid_genders = [g.value for g in Gender]
                    return jsonify({
                        'error': f'Invalid gender. Valid options: {valid_genders}'
                    }), 400
            else:
                family_member.gender = None
        
        if 'date_of_birth' in data:
            if data['date_of_birth']:
                try:
                    family_member.date_of_birth = datetime.strptime(
                        data['date_of_birth'], '%Y-%m-%d'
                    ).date()
                except ValueError:
                    return jsonify({
                        'error': 'Invalid date format. Use YYYY-MM-DD'
                    }), 400
            else:
                family_member.date_of_birth = None
        
        if 'phone' in data:
            family_member.phone = data['phone'].strip() if data['phone'] else None
        
        if 'medical_conditions' in data:
            family_member.medical_conditions = data['medical_conditions'].strip() if data['medical_conditions'] else None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Family member updated successfully',
            'family_member': family_member.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update family member: {str(e)}'}), 500

@family_bp.route('/members/<int:member_id>', methods=['DELETE'])
@jwt_required()
def delete_family_member(member_id):
    """Delete a family member"""
    try:
        current_user_id = get_jwt_identity()
        
        family_member = FamilyMember.query.filter_by(
            id=member_id, 
            user_id=current_user_id
        ).first()
        
        if not family_member:
            return jsonify({'error': 'Family member not found'}), 404
        
        # Store name for response
        member_name = family_member.name
        
        # Delete family member (this will cascade to related records)
        db.session.delete(family_member)
        db.session.commit()
        
        return jsonify({
            'message': f'Family member {member_name} deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete family member: {str(e)}'}), 500

@family_bp.route('/members/<int:member_id>/health-summary', methods=['GET'])
@jwt_required()
def get_family_member_health_summary(member_id):
    """Get health summary for a family member"""
    try:
        current_user_id = get_jwt_identity()
        
        family_member = FamilyMember.query.filter_by(
            id=member_id, 
            user_id=current_user_id
        ).first()
        
        if not family_member:
            return jsonify({'error': 'Family member not found'}), 404
        
        # Get health data
        from models import AIAnalysis, TestResult, VisionTest
        
        # Get AI analyses
        ai_analyses = AIAnalysis.query.filter_by(
            user_id=current_user_id,
            family_member_id=member_id
        ).order_by(AIAnalysis.created_at.desc()).limit(5).all()
        
        # Get test results
        test_results = TestResult.query.filter_by(
            user_id=current_user_id,
            family_member_id=member_id
        ).order_by(TestResult.created_at.desc()).limit(5).all()
        
        # Get vision tests
        vision_tests = VisionTest.query.filter_by(
            user_id=current_user_id,
            family_member_id=member_id
        ).order_by(VisionTest.created_at.desc()).limit(5).all()
        
        health_summary = {
            'family_member': family_member.to_dict(),
            'recent_ai_analyses': [analysis.to_dict() for analysis in ai_analyses],
            'recent_test_results': [result.to_dict() for result in test_results],
            'recent_vision_tests': [test.to_dict() for test in vision_tests],
            'total_records': {
                'ai_analyses': len(ai_analyses),
                'test_results': len(test_results),
                'vision_tests': len(vision_tests)
            }
        }
        
        return jsonify({
            'message': 'Health summary retrieved successfully',
            'health_summary': health_summary
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve health summary: {str(e)}'}), 500

@family_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_family_dashboard():
    """Get family health dashboard overview"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get all family members
        family_members = FamilyMember.query.filter_by(user_id=current_user_id).all()
        
        dashboard_data = {
            'total_family_members': len(family_members),
            'family_members': [],
            'recent_activities': [],
            'health_alerts': []
        }
        
        # Get summary for each family member
        for member in family_members:
            from models import AIAnalysis, TestResult
            
            # Get latest analysis
            latest_analysis = AIAnalysis.query.filter_by(
                user_id=current_user_id,
                family_member_id=member.id
            ).order_by(AIAnalysis.created_at.desc()).first()
            
            # Get total records
            total_analyses = AIAnalysis.query.filter_by(
                user_id=current_user_id,
                family_member_id=member.id
            ).count()
            
            member_summary = {
                'member_info': member.to_dict(),
                'latest_analysis': latest_analysis.to_dict() if latest_analysis else None,
                'total_analyses': total_analyses,
                'needs_follow_up': latest_analysis.follow_up_required if latest_analysis else False
            }
            
            dashboard_data['family_members'].append(member_summary)
            
            # Add to health alerts if follow-up needed
            if latest_analysis and latest_analysis.follow_up_required:
                dashboard_data['health_alerts'].append({
                    'member_name': member.name,
                    'condition': latest_analysis.predicted_condition,
                    'date': latest_analysis.created_at.isoformat(),
                    'urgency': 'high' if latest_analysis.confidence_score > 0.8 else 'moderate'
                })
        
        return jsonify({
            'message': 'Family dashboard retrieved successfully',
            'dashboard': dashboard_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve family dashboard: {str(e)}'}), 500
