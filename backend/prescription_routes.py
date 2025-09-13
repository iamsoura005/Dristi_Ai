"""
Prescription Routes for OCR, analysis, and tracking
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import base64
import traceback
from werkzeug.utils import secure_filename
import os

from models import db, User, EyePrescription, LensRecommendation, FamilyMember
from prescription_service import PrescriptionOCRService, PrescriptionAnalysisService

prescription_bp = Blueprint('prescription', __name__, url_prefix='/api/prescription')

# Initialize services
ocr_service = PrescriptionOCRService()
analysis_service = PrescriptionAnalysisService()

@prescription_bp.route('/upload-image', methods=['POST'])
@jwt_required()
def upload_prescription_image():
    """Upload and process prescription image with OCR"""
    try:
        user_id = get_jwt_identity()
        
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Read image data
        image_data = file.read()
        
        # Process with OCR
        prescription_data, confidence = ocr_service.extract_prescription_from_image(image_data)
        
        if not prescription_data or confidence < 0.3:
            return jsonify({
                'success': False,
                'error': 'Could not extract prescription data from image',
                'confidence': confidence,
                'suggestion': 'Please ensure the image is clear and well-lit'
            }), 400
        
        # Save image (in production, use cloud storage)
        filename = secure_filename(f"prescription_{user_id}_{int(datetime.now().timestamp())}.{file.filename.rsplit('.', 1)[1].lower()}")
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        
        # Save the file
        with open(file_path, 'wb') as f:
            f.write(image_data)
        
        return jsonify({
            'success': True,
            'prescription_data': prescription_data,
            'confidence': confidence,
            'image_url': f'/uploads/{filename}',
            'message': 'Prescription extracted successfully. Please review and confirm the values.'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error processing prescription image: {str(e)}")
        return jsonify({'error': 'Failed to process prescription image'}), 500

@prescription_bp.route('/prescriptions', methods=['POST'])
@jwt_required()
def create_prescription():
    """Create a new prescription record"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if 'prescription_date' not in data:
            return jsonify({'error': 'Prescription date is required'}), 400
        
        # Parse prescription date
        prescription_date = datetime.fromisoformat(data['prescription_date'])
        
        # Create prescription record
        prescription = EyePrescription(
            user_id=user_id,
            family_member_id=data.get('family_member_id'),
            doctor_id=data.get('doctor_id'),
            prescription_date=prescription_date,
            
            # Right eye
            od_sphere=data.get('right_eye', {}).get('sphere'),
            od_cylinder=data.get('right_eye', {}).get('cylinder'),
            od_axis=data.get('right_eye', {}).get('axis'),
            od_add=data.get('right_eye', {}).get('add'),
            od_prism=data.get('right_eye', {}).get('prism'),
            od_base=data.get('right_eye', {}).get('base'),
            
            # Left eye
            os_sphere=data.get('left_eye', {}).get('sphere'),
            os_cylinder=data.get('left_eye', {}).get('cylinder'),
            os_axis=data.get('left_eye', {}).get('axis'),
            os_add=data.get('left_eye', {}).get('add'),
            os_prism=data.get('left_eye', {}).get('prism'),
            os_base=data.get('left_eye', {}).get('base'),
            
            # Measurements
            pupillary_distance=data.get('measurements', {}).get('pupillary_distance'),
            near_pd=data.get('measurements', {}).get('near_pd'),
            vertex_distance=data.get('measurements', {}).get('vertex_distance'),
            
            # Details
            prescription_type=data.get('details', {}).get('prescription_type', 'glasses'),
            lens_type=data.get('details', {}).get('lens_type'),
            lens_material=data.get('details', {}).get('lens_material'),
            coating=data.get('details', {}).get('coating'),
            
            # Metadata
            prescription_source=data.get('metadata', {}).get('prescription_source', 'manual'),
            image_url=data.get('metadata', {}).get('image_url'),
            ocr_confidence=data.get('metadata', {}).get('ocr_confidence'),
            notes=data.get('metadata', {}).get('notes'),
            expiry_date=datetime.fromisoformat(data['expiry_date']) if data.get('expiry_date') else None
        )
        
        # Mark previous prescriptions as not current
        if data.get('is_current', True):
            EyePrescription.query.filter_by(
                user_id=user_id,
                family_member_id=data.get('family_member_id'),
                is_current=True
            ).update({'is_current': False})
        
        db.session.add(prescription)
        db.session.flush()  # Get the ID
        
        # Generate recommendations
        recommendations = analysis_service.generate_lens_recommendations(prescription)
        for rec in recommendations:
            db.session.add(rec)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Prescription created successfully',
            'prescription': prescription.to_dict(),
            'recommendations': [rec.to_dict() for rec in recommendations]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating prescription: {str(e)}")
        return jsonify({'error': 'Failed to create prescription'}), 500

@prescription_bp.route('/prescriptions', methods=['GET'])
@jwt_required()
def get_prescriptions():
    """Get user's prescription history"""
    try:
        user_id = get_jwt_identity()
        family_member_id = request.args.get('family_member_id', type=int)
        current_only = request.args.get('current_only', 'false').lower() == 'true'
        limit = request.args.get('limit', type=int)
        
        # Build query
        query = EyePrescription.query.filter_by(user_id=user_id)
        
        if family_member_id:
            query = query.filter_by(family_member_id=family_member_id)
        
        if current_only:
            query = query.filter_by(is_current=True)
        
        query = query.order_by(EyePrescription.prescription_date.desc())
        
        if limit:
            query = query.limit(limit)
        
        prescriptions = query.all()
        
        return jsonify({
            'success': True,
            'prescriptions': [prescription.to_dict() for prescription in prescriptions]
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting prescriptions: {str(e)}")
        return jsonify({'error': 'Failed to get prescriptions'}), 500

@prescription_bp.route('/prescriptions/<int:prescription_id>', methods=['GET'])
@jwt_required()
def get_prescription_details(prescription_id):
    """Get detailed prescription information with analysis"""
    try:
        user_id = get_jwt_identity()
        prescription = EyePrescription.query.filter_by(
            id=prescription_id,
            user_id=user_id
        ).first_or_404()
        
        # Get prescription history for comparison
        previous_prescriptions = EyePrescription.query.filter(
            EyePrescription.user_id == user_id,
            EyePrescription.family_member_id == prescription.family_member_id,
            EyePrescription.prescription_date < prescription.prescription_date
        ).order_by(EyePrescription.prescription_date.desc()).all()
        
        # Analyze changes
        change_analysis = analysis_service.analyze_prescription_changes(
            prescription, previous_prescriptions
        )
        
        # Get summary
        summary = analysis_service.get_prescription_summary(prescription)
        
        # Calculate next checkup date
        user = User.query.get(user_id)
        user_age = None
        if user.date_of_birth:
            user_age = (datetime.now() - user.date_of_birth).days // 365
        
        next_checkup = analysis_service.calculate_next_checkup_date(prescription, user_age)
        
        return jsonify({
            'success': True,
            'prescription': prescription.to_dict(),
            'analysis': {
                'change_analysis': change_analysis,
                'summary': summary,
                'next_checkup_date': next_checkup.isoformat(),
                'recommendations': [rec.to_dict() for rec in prescription.recommendations]
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting prescription details: {str(e)}")
        return jsonify({'error': 'Failed to get prescription details'}), 500

@prescription_bp.route('/prescriptions/<int:prescription_id>/recommendations', methods=['GET'])
@jwt_required()
def get_prescription_recommendations(prescription_id):
    """Get lens recommendations for a prescription"""
    try:
        user_id = get_jwt_identity()
        prescription = EyePrescription.query.filter_by(
            id=prescription_id,
            user_id=user_id
        ).first_or_404()
        
        recommendations = LensRecommendation.query.filter_by(
            prescription_id=prescription_id
        ).order_by(LensRecommendation.priority, LensRecommendation.confidence_score.desc()).all()
        
        return jsonify({
            'success': True,
            'recommendations': [rec.to_dict() for rec in recommendations]
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify({'error': 'Failed to get recommendations'}), 500

@prescription_bp.route('/analytics/progression', methods=['GET'])
@jwt_required()
def get_prescription_progression():
    """Get prescription progression analytics"""
    try:
        user_id = get_jwt_identity()
        family_member_id = request.args.get('family_member_id', type=int)
        years = request.args.get('years', 5, type=int)
        
        # Get prescriptions from the last N years
        start_date = datetime.now() - timedelta(days=years * 365)
        
        query = EyePrescription.query.filter(
            EyePrescription.user_id == user_id,
            EyePrescription.prescription_date >= start_date
        )
        
        if family_member_id:
            query = query.filter_by(family_member_id=family_member_id)
        
        prescriptions = query.order_by(EyePrescription.prescription_date).all()
        
        # Prepare progression data
        progression_data = {
            'right_eye': {
                'sphere': [],
                'cylinder': [],
                'dates': []
            },
            'left_eye': {
                'sphere': [],
                'cylinder': [],
                'dates': []
            },
            'summary': {
                'total_prescriptions': len(prescriptions),
                'date_range': {
                    'start': prescriptions[0].prescription_date.isoformat() if prescriptions else None,
                    'end': prescriptions[-1].prescription_date.isoformat() if prescriptions else None
                },
                'trends': {}
            }
        }
        
        for prescription in prescriptions:
            date_str = prescription.prescription_date.strftime('%Y-%m-%d')
            
            # Right eye data
            if prescription.od_sphere is not None:
                progression_data['right_eye']['sphere'].append({
                    'date': date_str,
                    'value': prescription.od_sphere
                })
            
            if prescription.od_cylinder is not None:
                progression_data['right_eye']['cylinder'].append({
                    'date': date_str,
                    'value': prescription.od_cylinder
                })
            
            # Left eye data
            if prescription.os_sphere is not None:
                progression_data['left_eye']['sphere'].append({
                    'date': date_str,
                    'value': prescription.os_sphere
                })
            
            if prescription.os_cylinder is not None:
                progression_data['left_eye']['cylinder'].append({
                    'date': date_str,
                    'value': prescription.os_cylinder
                })
            
            progression_data['right_eye']['dates'].append(date_str)
            progression_data['left_eye']['dates'].append(date_str)
        
        # Calculate trends
        if len(prescriptions) >= 2:
            first = prescriptions[0]
            last = prescriptions[-1]
            
            # Right eye trends
            if first.od_sphere is not None and last.od_sphere is not None:
                sphere_change = last.od_sphere - first.od_sphere
                progression_data['summary']['trends']['right_sphere_change'] = sphere_change
                progression_data['summary']['trends']['right_sphere_trend'] = (
                    'increasing' if sphere_change > 0.25 else
                    'decreasing' if sphere_change < -0.25 else
                    'stable'
                )
            
            # Left eye trends
            if first.os_sphere is not None and last.os_sphere is not None:
                sphere_change = last.os_sphere - first.os_sphere
                progression_data['summary']['trends']['left_sphere_change'] = sphere_change
                progression_data['summary']['trends']['left_sphere_trend'] = (
                    'increasing' if sphere_change > 0.25 else
                    'decreasing' if sphere_change < -0.25 else
                    'stable'
                )
        
        return jsonify({
            'success': True,
            'progression_data': progression_data
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting prescription progression: {str(e)}")
        return jsonify({'error': 'Failed to get prescription progression'}), 500

@prescription_bp.route('/reminders', methods=['GET'])
@jwt_required()
def get_prescription_reminders():
    """Get prescription renewal reminders"""
    try:
        user_id = get_jwt_identity()
        
        # Get current prescriptions that are expiring soon
        thirty_days_from_now = datetime.now() + timedelta(days=30)
        
        expiring_prescriptions = EyePrescription.query.filter(
            EyePrescription.user_id == user_id,
            EyePrescription.is_current == True,
            EyePrescription.expiry_date <= thirty_days_from_now,
            EyePrescription.expiry_date >= datetime.now()
        ).all()
        
        # Get prescriptions that need checkups
        checkup_reminders = []
        current_prescriptions = EyePrescription.query.filter_by(
            user_id=user_id,
            is_current=True
        ).all()
        
        user = User.query.get(user_id)
        user_age = None
        if user.date_of_birth:
            user_age = (datetime.now() - user.date_of_birth).days // 365
        
        for prescription in current_prescriptions:
            next_checkup = analysis_service.calculate_next_checkup_date(prescription, user_age)
            if next_checkup <= thirty_days_from_now:
                checkup_reminders.append({
                    'prescription': prescription.to_dict(),
                    'next_checkup_date': next_checkup.isoformat(),
                    'days_until_checkup': (next_checkup - datetime.now()).days
                })
        
        return jsonify({
            'success': True,
            'expiring_prescriptions': [p.to_dict() for p in expiring_prescriptions],
            'checkup_reminders': checkup_reminders
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting prescription reminders: {str(e)}")
        return jsonify({'error': 'Failed to get prescription reminders'}), 500
