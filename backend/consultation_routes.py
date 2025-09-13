"""
Consultation Routes for appointment booking, video calls, and messaging
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import traceback

from models import db, User, Appointment, DoctorAvailability, ConsultationMessage, AppointmentStatus, AppointmentType
from consultation_service import AppointmentService, MessagingService, VideoCallService

consultation_bp = Blueprint('consultation', __name__, url_prefix='/api/consultation')

# Initialize services
appointment_service = AppointmentService()
messaging_service = MessagingService()
video_service = VideoCallService()

@consultation_bp.route('/doctors/<int:doctor_id>/availability', methods=['GET'])
@jwt_required()
def get_doctor_availability(doctor_id):
    """Get available time slots for a doctor"""
    try:
        date_str = request.args.get('date')
        if not date_str:
            return jsonify({'error': 'Date parameter is required'}), 400
        
        date = datetime.fromisoformat(date_str).date()
        date_obj = datetime.combine(date, datetime.min.time())
        
        slots = appointment_service.get_doctor_availability(doctor_id, date_obj)
        
        return jsonify({
            'success': True,
            'date': date_str,
            'doctor_id': doctor_id,
            'available_slots': slots
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting doctor availability: {str(e)}")
        return jsonify({'error': 'Failed to get availability'}), 500

@consultation_bp.route('/appointments', methods=['POST'])
@jwt_required()
def book_appointment():
    """Book a new appointment"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['doctor_id', 'appointment_date', 'appointment_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate appointment type
        try:
            appointment_type = AppointmentType(data['appointment_type'])
        except ValueError:
            return jsonify({'error': 'Invalid appointment type'}), 400
        
        # Book appointment
        appointment = appointment_service.book_appointment(user_id, data['doctor_id'], data)
        
        return jsonify({
            'success': True,
            'message': 'Appointment booked successfully',
            'appointment': appointment.to_dict()
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error booking appointment: {str(e)}")
        return jsonify({'error': 'Failed to book appointment'}), 500

@consultation_bp.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    """Get user's appointments"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check if user is a doctor
        is_doctor = hasattr(user, 'doctor_profile') and user.doctor_profile is not None
        
        status_filter = request.args.get('status')
        limit = request.args.get('limit', type=int)
        
        # Build query
        if is_doctor:
            query = Appointment.query.filter(Appointment.doctor_id == user_id)
        else:
            query = Appointment.query.filter(Appointment.patient_id == user_id)
        
        if status_filter:
            try:
                status = AppointmentStatus(status_filter)
                query = query.filter(Appointment.status == status)
            except ValueError:
                return jsonify({'error': 'Invalid status filter'}), 400
        
        query = query.order_by(Appointment.appointment_date.desc())
        
        if limit:
            query = query.limit(limit)
        
        appointments = query.all()
        
        return jsonify({
            'success': True,
            'appointments': [appointment.to_dict() for appointment in appointments],
            'is_doctor': is_doctor
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting appointments: {str(e)}")
        return jsonify({'error': 'Failed to get appointments'}), 500

@consultation_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment_details(appointment_id):
    """Get detailed appointment information"""
    try:
        user_id = get_jwt_identity()
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check if user has access to this appointment
        if appointment.patient_id != user_id and appointment.doctor_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get related information
        patient = User.query.get(appointment.patient_id)
        doctor = User.query.get(appointment.doctor_id)
        
        appointment_data = appointment.to_dict()
        appointment_data['patient_info'] = {
            'id': patient.id,
            'name': f"{patient.first_name} {patient.last_name}",
            'email': patient.email,
            'phone': patient.phone
        }
        appointment_data['doctor_info'] = {
            'id': doctor.id,
            'name': f"{doctor.first_name} {doctor.last_name}",
            'email': doctor.email,
            'specialization': getattr(doctor.doctor_profile, 'specialization', 'General') if hasattr(doctor, 'doctor_profile') else 'General'
        }
        
        return jsonify({
            'success': True,
            'appointment': appointment_data
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting appointment details: {str(e)}")
        return jsonify({'error': 'Failed to get appointment details'}), 500

@consultation_bp.route('/appointments/<int:appointment_id>/status', methods=['PUT'])
@jwt_required()
def update_appointment_status(appointment_id):
    """Update appointment status (doctor only)"""
    try:
        user_id = get_jwt_identity()
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check if user is the doctor for this appointment
        if appointment.doctor_id != user_id:
            return jsonify({'error': 'Only the assigned doctor can update appointment status'}), 403
        
        data = request.get_json()
        status = data.get('status')
        notes = data.get('notes')
        
        if not status:
            return jsonify({'error': 'Status is required'}), 400
        
        try:
            status_enum = AppointmentStatus(status)
        except ValueError:
            return jsonify({'error': 'Invalid status'}), 400
        
        updated_appointment = appointment_service.update_appointment_status(
            appointment_id, status_enum, notes
        )
        
        return jsonify({
            'success': True,
            'message': 'Appointment status updated',
            'appointment': updated_appointment.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error updating appointment status: {str(e)}")
        return jsonify({'error': 'Failed to update appointment status'}), 500

@consultation_bp.route('/appointments/<int:appointment_id>/video-room', methods=['POST'])
@jwt_required()
def create_video_room(appointment_id):
    """Create or get video room for appointment"""
    try:
        user_id = get_jwt_identity()
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check if user has access to this appointment
        if appointment.patient_id != user_id and appointment.doctor_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if appointment is for video call
        if appointment.appointment_type != AppointmentType.VIDEO_CALL:
            return jsonify({'error': 'This appointment is not scheduled for video call'}), 400
        
        # Check if video room already exists
        if appointment.video_call_link:
            return jsonify({
                'success': True,
                'video_room': {
                    'room_id': appointment.video_room_id,
                    'room_url': appointment.video_call_link,
                    'password': appointment.meeting_password
                }
            })
        
        # Create new video room
        patient = User.query.get(appointment.patient_id)
        doctor = User.query.get(appointment.doctor_id)
        
        video_info = video_service.create_jitsi_room(
            appointment_id,
            f"{doctor.first_name} {doctor.last_name}",
            f"{patient.first_name} {patient.last_name}"
        )
        
        # Update appointment with video room info
        appointment.video_room_id = video_info['room_id']
        appointment.video_call_link = video_info['room_url']
        appointment.meeting_password = video_info['password']
        db.session.commit()
        
        return jsonify({
            'success': True,
            'video_room': {
                'room_id': video_info['room_id'],
                'room_url': video_info['room_url'],
                'password': video_info['password']
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error creating video room: {str(e)}")
        return jsonify({'error': 'Failed to create video room'}), 500

@consultation_bp.route('/appointments/<int:appointment_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(appointment_id):
    """Get messages for an appointment"""
    try:
        user_id = get_jwt_identity()
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check if user has access to this appointment
        if appointment.patient_id != user_id and appointment.doctor_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        messages = messaging_service.get_conversation(appointment_id, user_id)
        
        return jsonify({
            'success': True,
            'messages': [message.to_dict() for message in messages]
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting messages: {str(e)}")
        return jsonify({'error': 'Failed to get messages'}), 500

@consultation_bp.route('/appointments/<int:appointment_id>/messages', methods=['POST'])
@jwt_required()
def send_message(appointment_id):
    """Send a message in consultation"""
    try:
        user_id = get_jwt_identity()
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check if user has access to this appointment
        if appointment.patient_id != user_id and appointment.doctor_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        content = data.get('content')
        message_type = data.get('message_type', 'text')
        
        if not content:
            return jsonify({'error': 'Message content is required'}), 400
        
        # Determine receiver
        receiver_id = appointment.doctor_id if user_id == appointment.patient_id else appointment.patient_id
        
        message = messaging_service.send_message(
            appointment_id, user_id, receiver_id, content, message_type
        )
        
        return jsonify({
            'success': True,
            'message': message.to_dict()
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Error sending message: {str(e)}")
        return jsonify({'error': 'Failed to send message'}), 500

@consultation_bp.route('/messages/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread messages"""
    try:
        user_id = get_jwt_identity()
        count = messaging_service.get_unread_count(user_id)
        
        return jsonify({
            'success': True,
            'unread_count': count
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting unread count: {str(e)}")
        return jsonify({'error': 'Failed to get unread count'}), 500

@consultation_bp.route('/doctors/<int:doctor_id>/schedule', methods=['POST'])
@jwt_required()
def set_doctor_schedule(doctor_id):
    """Set doctor's availability schedule (doctor only)"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is the doctor
        if user_id != doctor_id:
            return jsonify({'error': 'You can only set your own schedule'}), 403
        
        data = request.get_json()
        schedule = data.get('schedule', [])
        
        # Delete existing schedule
        DoctorAvailability.query.filter_by(doctor_id=doctor_id).delete()
        
        # Add new schedule
        for slot in schedule:
            availability = DoctorAvailability(
                doctor_id=doctor_id,
                day_of_week=slot['day_of_week'],
                start_time=datetime.strptime(slot['start_time'], '%H:%M').time(),
                end_time=datetime.strptime(slot['end_time'], '%H:%M').time(),
                is_available=slot.get('is_available', True),
                max_appointments=slot.get('max_appointments', 10),
                slot_duration=slot.get('slot_duration', 30),
                break_start=datetime.strptime(slot['break_start'], '%H:%M').time() if slot.get('break_start') else None,
                break_end=datetime.strptime(slot['break_end'], '%H:%M').time() if slot.get('break_end') else None
            )
            db.session.add(availability)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Schedule updated successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error setting doctor schedule: {str(e)}")
        return jsonify({'error': 'Failed to update schedule'}), 500
