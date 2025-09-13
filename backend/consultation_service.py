"""
Consultation Service for managing appointments, video calls, and messaging
"""

import uuid
import hashlib
import hmac
import base64
import time
import json
from datetime import datetime, timedelta, time as dt_time
from typing import List, Dict, Optional, Tuple
from flask import current_app
import requests
from models import db, Appointment, DoctorAvailability, ConsultationMessage, User, AppointmentStatus, AppointmentType

class VideoCallService:
    """Service for managing video calls using Jitsi Meet or Zoom"""
    
    def __init__(self):
        self.jitsi_domain = None
        self.zoom_api_key = None
        self.zoom_api_secret = None

    def _get_config(self):
        """Get configuration values within application context"""
        if self.jitsi_domain is None:
            self.jitsi_domain = current_app.config.get('JITSI_DOMAIN', 'meet.jit.si')
            self.zoom_api_key = current_app.config.get('ZOOM_API_KEY')
            self.zoom_api_secret = current_app.config.get('ZOOM_API_SECRET')
        
    def create_jitsi_room(self, appointment_id: int, doctor_name: str, patient_name: str) -> Dict:
        """Create a Jitsi Meet room for consultation"""
        self._get_config()
        room_name = f"dristi-consultation-{appointment_id}-{int(time.time())}"
        room_url = f"https://{self.jitsi_domain}/{room_name}"
        
        # Generate a secure password
        password = self._generate_meeting_password()
        
        return {
            'room_id': room_name,
            'room_url': room_url,
            'password': password,
            'provider': 'jitsi',
            'doctor_name': doctor_name,
            'patient_name': patient_name
        }
    
    def create_zoom_meeting(self, appointment_id: int, appointment_date: datetime, duration: int = 30) -> Dict:
        """Create a Zoom meeting for consultation"""
        self._get_config()
        if not self.zoom_api_key or not self.zoom_api_secret:
            raise ValueError("Zoom API credentials not configured")
        
        # Generate JWT token for Zoom API
        jwt_token = self._generate_zoom_jwt()
        
        meeting_data = {
            "topic": f"Eye Consultation - Appointment #{appointment_id}",
            "type": 2,  # Scheduled meeting
            "start_time": appointment_date.strftime("%Y-%m-%dT%H:%M:%S"),
            "duration": duration,
            "timezone": "Asia/Kolkata",
            "settings": {
                "host_video": True,
                "participant_video": True,
                "join_before_host": False,
                "mute_upon_entry": True,
                "watermark": False,
                "use_pmi": False,
                "approval_type": 0,
                "audio": "both",
                "auto_recording": "none",
                "waiting_room": True
            }
        }
        
        headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(
                'https://api.zoom.us/v2/users/me/meetings',
                headers=headers,
                json=meeting_data
            )
            
            if response.status_code == 201:
                meeting_info = response.json()
                return {
                    'room_id': str(meeting_info['id']),
                    'room_url': meeting_info['join_url'],
                    'password': meeting_info.get('password', ''),
                    'provider': 'zoom',
                    'meeting_id': meeting_info['id']
                }
            else:
                raise Exception(f"Failed to create Zoom meeting: {response.text}")
                
        except Exception as e:
            current_app.logger.error(f"Zoom meeting creation failed: {str(e)}")
            # Fallback to Jitsi
            return self.create_jitsi_room(appointment_id, "Doctor", "Patient")
    
    def _generate_meeting_password(self) -> str:
        """Generate a secure meeting password"""
        return str(uuid.uuid4())[:8].upper()
    
    def _generate_zoom_jwt(self) -> str:
        """Generate JWT token for Zoom API"""
        self._get_config()
        header = {"alg": "HS256", "typ": "JWT"}
        payload = {
            "iss": self.zoom_api_key,
            "exp": int(time.time() + 3600)  # 1 hour expiry
        }
        
        # Encode header and payload
        header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        
        # Create signature
        message = f"{header_encoded}.{payload_encoded}"
        signature = hmac.new(
            self.zoom_api_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        signature_encoded = base64.urlsafe_b64encode(signature).decode().rstrip('=')
        
        return f"{header_encoded}.{payload_encoded}.{signature_encoded}"

class AppointmentService:
    """Service for managing appointments and scheduling"""
    
    def __init__(self):
        self.video_service = VideoCallService()
    
    def get_doctor_availability(self, doctor_id: int, date: datetime) -> List[Dict]:
        """Get available time slots for a doctor on a specific date"""
        day_of_week = date.weekday()  # 0=Monday, 6=Sunday
        
        # Get doctor's availability for the day
        availability = DoctorAvailability.query.filter_by(
            doctor_id=doctor_id,
            day_of_week=day_of_week,
            is_available=True
        ).first()
        
        if not availability:
            return []
        
        # Get existing appointments for the day
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        existing_appointments = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date >= start_of_day,
            Appointment.appointment_date < end_of_day,
            Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED])
        ).all()
        
        # Generate available slots
        slots = self._generate_time_slots(availability, existing_appointments, date)
        return slots
    
    def _generate_time_slots(self, availability: DoctorAvailability, existing_appointments: List[Appointment], date: datetime) -> List[Dict]:
        """Generate available time slots based on doctor availability"""
        slots = []
        current_time = datetime.combine(date.date(), availability.start_time)
        end_time = datetime.combine(date.date(), availability.end_time)
        slot_duration = timedelta(minutes=availability.slot_duration)
        
        # Create set of booked times
        booked_times = set()
        for appointment in existing_appointments:
            booked_times.add(appointment.appointment_date.time())
        
        while current_time < end_time:
            # Check if slot is during break time
            if availability.break_start and availability.break_end:
                if availability.break_start <= current_time.time() <= availability.break_end:
                    current_time += slot_duration
                    continue
            
            # Check if slot is already booked
            if current_time.time() not in booked_times:
                # Check if slot is in the future (not in the past)
                if current_time > datetime.now():
                    slots.append({
                        'time': current_time.strftime('%H:%M'),
                        'datetime': current_time.isoformat(),
                        'available': True
                    })
            
            current_time += slot_duration
        
        return slots
    
    def book_appointment(self, patient_id: int, doctor_id: int, appointment_data: Dict) -> Appointment:
        """Book a new appointment"""
        try:
            # Validate appointment slot is still available
            appointment_datetime = datetime.fromisoformat(appointment_data['appointment_date'])
            available_slots = self.get_doctor_availability(doctor_id, appointment_datetime)
            
            slot_available = any(
                slot['datetime'] == appointment_datetime.isoformat() and slot['available']
                for slot in available_slots
            )
            
            if not slot_available:
                raise ValueError("Selected time slot is no longer available")
            
            # Create appointment
            appointment = Appointment(
                patient_id=patient_id,
                doctor_id=doctor_id,
                family_member_id=appointment_data.get('family_member_id'),
                appointment_date=appointment_datetime,
                appointment_type=AppointmentType(appointment_data['appointment_type']),
                reason=appointment_data.get('reason', ''),
                patient_symptoms=appointment_data.get('symptoms', ''),
                consultation_fee=appointment_data.get('consultation_fee', 0),
                duration_minutes=appointment_data.get('duration', 30)
            )
            
            # Create video call room if it's a video consultation
            if appointment.appointment_type == AppointmentType.VIDEO_CALL:
                try:
                    video_info = self.video_service.create_jitsi_room(
                        appointment.id or 0,
                        "Doctor",  # Will be updated after appointment is saved
                        "Patient"
                    )
                    appointment.video_room_id = video_info['room_id']
                    appointment.video_call_link = video_info['room_url']
                    appointment.meeting_password = video_info['password']
                except Exception as e:
                    current_app.logger.error(f"Failed to create video room: {str(e)}")
            
            db.session.add(appointment)
            db.session.commit()
            
            return appointment
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def update_appointment_status(self, appointment_id: int, status: AppointmentStatus, notes: str = None) -> Appointment:
        """Update appointment status"""
        appointment = Appointment.query.get_or_404(appointment_id)
        appointment.status = status
        
        if notes:
            appointment.doctor_notes = notes
        
        appointment.updated_at = datetime.utcnow()
        db.session.commit()
        
        return appointment
    
    def get_upcoming_appointments(self, user_id: int, is_doctor: bool = False) -> List[Appointment]:
        """Get upcoming appointments for a user"""
        query = Appointment.query.filter(
            Appointment.appointment_date > datetime.utcnow(),
            Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED])
        )
        
        if is_doctor:
            query = query.filter(Appointment.doctor_id == user_id)
        else:
            query = query.filter(Appointment.patient_id == user_id)
        
        return query.order_by(Appointment.appointment_date).all()

class MessagingService:
    """Service for managing consultation messages"""
    
    def send_message(self, appointment_id: int, sender_id: int, receiver_id: int, content: str, message_type: str = 'text') -> ConsultationMessage:
        """Send a message in consultation"""
        message = ConsultationMessage(
            appointment_id=appointment_id,
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content,
            message_type=message_type,
            is_encrypted=True  # In production, implement actual encryption
        )
        
        db.session.add(message)
        db.session.commit()
        
        return message
    
    def get_conversation(self, appointment_id: int, user_id: int) -> List[ConsultationMessage]:
        """Get all messages for an appointment"""
        messages = ConsultationMessage.query.filter(
            ConsultationMessage.appointment_id == appointment_id,
            db.or_(
                ConsultationMessage.sender_id == user_id,
                ConsultationMessage.receiver_id == user_id
            )
        ).order_by(ConsultationMessage.created_at).all()
        
        # Mark messages as read
        unread_messages = [msg for msg in messages if not msg.is_read and msg.receiver_id == user_id]
        for msg in unread_messages:
            msg.is_read = True
            msg.read_at = datetime.utcnow()
        
        if unread_messages:
            db.session.commit()
        
        return messages
    
    def get_unread_count(self, user_id: int) -> int:
        """Get count of unread messages for a user"""
        return ConsultationMessage.query.filter(
            ConsultationMessage.receiver_id == user_id,
            ConsultationMessage.is_read == False
        ).count()
