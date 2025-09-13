"""
Location Services and Doctor Finder API Routes
Provides endpoints for location services and nearby doctor search
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from location_service import location_service
from models import db, User

location_bp = Blueprint('location', __name__, url_prefix='/api/location')

@location_bp.route('/geocode', methods=['POST'])
@jwt_required(optional=True)
def geocode_address():
    """
    Convert address to coordinates
    
    Expected JSON:
    {
        "address": "123 Main Street, City, State"
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('address'):
            return jsonify({'error': 'Address is required'}), 400
        
        address = data['address'].strip()
        coordinates = location_service.get_user_location(address)
        
        if not coordinates:
            return jsonify({'error': 'Address not found'}), 404
        
        return jsonify({
            'message': 'Address geocoded successfully',
            'address': address,
            'coordinates': {
                'latitude': coordinates[0],
                'longitude': coordinates[1]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Geocoding failed: {str(e)}'}), 500

@location_bp.route('/doctors/nearby', methods=['POST'])
@jwt_required(optional=True)
def find_nearby_doctors():
    """
    Find nearby doctors and hospitals
    
    Expected JSON:
    {
        "latitude": 19.0760,
        "longitude": 72.8777,
        "radius": 10,
        "specialty": "ophthalmology",
        "limit": 20
    }
    
    Or with address:
    {
        "address": "Mumbai, Maharashtra",
        "radius": 10,
        "specialty": "ophthalmology",
        "limit": 20
    }
    """
    try:
        data = request.get_json()
        
        # Get coordinates
        if data.get('latitude') and data.get('longitude'):
            lat, lng = data['latitude'], data['longitude']
        elif data.get('address'):
            coordinates = location_service.get_user_location(data['address'])
            if not coordinates:
                return jsonify({'error': 'Address not found'}), 404
            lat, lng = coordinates
        else:
            return jsonify({
                'error': 'Either coordinates (latitude, longitude) or address is required'
            }), 400
        
        # Get search parameters
        radius = data.get('radius', 10)  # Default 10km
        specialty = data.get('specialty')
        limit = data.get('limit', 20)  # Default 20 results
        
        # Validate parameters
        if radius <= 0 or radius > 100:
            return jsonify({'error': 'Radius must be between 1 and 100 km'}), 400
        
        if limit <= 0 or limit > 50:
            return jsonify({'error': 'Limit must be between 1 and 50'}), 400
        
        # Find nearby doctors
        doctors = location_service.find_nearby_doctors(lat, lng, radius, specialty, limit)
        
        # Update user location if logged in
        current_user_id = get_jwt_identity()
        if current_user_id:
            try:
                user = User.query.get(current_user_id)
                if user:
                    user.location_lat = lat
                    user.location_lng = lng
                    db.session.commit()
            except Exception as e:
                print(f"Error updating user location: {e}")
        
        return jsonify({
            'message': f'Found {len(doctors)} doctors within {radius}km',
            'search_location': {
                'latitude': lat,
                'longitude': lng
            },
            'search_parameters': {
                'radius': radius,
                'specialty': specialty,
                'limit': limit
            },
            'doctors': doctors,
            'total_found': len(doctors)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@location_bp.route('/doctors/<string:doctor_id>', methods=['GET'])
@jwt_required(optional=True)
def get_doctor_details(doctor_id):
    """Get detailed information about a specific doctor"""
    try:
        # Check if it's a registered doctor
        if doctor_id.startswith('db_'):
            from models import DoctorProfile, User, UserRole
            
            profile_id = int(doctor_id.replace('db_', ''))
            doctor_profile = DoctorProfile.query.get(profile_id)
            
            if not doctor_profile:
                return jsonify({'error': 'Doctor not found'}), 404
            
            user = User.query.get(doctor_profile.user_id)
            if not user or user.role != UserRole.DOCTOR:
                return jsonify({'error': 'Doctor not found'}), 404
            
            doctor_details = {
                'id': doctor_id,
                'name': f"Dr. {user.first_name} {user.last_name}",
                'email': user.email,
                'phone': user.phone,
                'specialization': doctor_profile.specialization,
                'experience_years': doctor_profile.experience_years,
                'qualifications': doctor_profile.qualifications,
                'license_number': doctor_profile.license_number,
                'clinic_name': doctor_profile.clinic_name,
                'clinic_address': doctor_profile.clinic_address,
                'consultation_fee': doctor_profile.consultation_fee,
                'accepted_insurance': doctor_profile.accepted_insurance,
                'services_offered': doctor_profile.services_offered,
                'available_slots': doctor_profile.available_slots,
                'rating': doctor_profile.rating,
                'total_reviews': doctor_profile.total_reviews,
                'is_verified': doctor_profile.is_verified,
                'created_at': doctor_profile.created_at.isoformat()
            }
            
            return jsonify({
                'message': 'Doctor details retrieved successfully',
                'doctor': doctor_details
            }), 200
        
        else:
            # For Google Places or mock doctors, return basic info
            return jsonify({
                'message': 'Doctor details not available for external listings',
                'doctor_id': doctor_id,
                'note': 'Contact the clinic directly for detailed information'
            }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve doctor details: {str(e)}'}), 500

@location_bp.route('/directions', methods=['POST'])
@jwt_required(optional=True)
def get_directions():
    """
    Get directions between two locations
    
    Expected JSON:
    {
        "origin": {
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "destination": {
            "latitude": 19.0850,
            "longitude": 72.8950
        }
    }
    
    Or with addresses:
    {
        "origin_address": "Mumbai Central",
        "destination_address": "Bandra West, Mumbai"
    }
    """
    try:
        data = request.get_json()
        
        # Get origin coordinates
        if data.get('origin'):
            origin = (data['origin']['latitude'], data['origin']['longitude'])
        elif data.get('origin_address'):
            origin_coords = location_service.get_user_location(data['origin_address'])
            if not origin_coords:
                return jsonify({'error': 'Origin address not found'}), 404
            origin = origin_coords
        else:
            return jsonify({'error': 'Origin location is required'}), 400
        
        # Get destination coordinates
        if data.get('destination'):
            destination = (data['destination']['latitude'], data['destination']['longitude'])
        elif data.get('destination_address'):
            dest_coords = location_service.get_user_location(data['destination_address'])
            if not dest_coords:
                return jsonify({'error': 'Destination address not found'}), 404
            destination = dest_coords
        else:
            return jsonify({'error': 'Destination location is required'}), 400
        
        # Get directions
        directions = location_service.get_directions(origin, destination)
        
        if not directions:
            return jsonify({'error': 'Directions not available'}), 404
        
        return jsonify({
            'message': 'Directions retrieved successfully',
            'origin': {
                'latitude': origin[0],
                'longitude': origin[1]
            },
            'destination': {
                'latitude': destination[0],
                'longitude': destination[1]
            },
            'directions': directions
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get directions: {str(e)}'}), 500

@location_bp.route('/specialties', methods=['GET'])
def get_medical_specialties():
    """Get list of available medical specialties for filtering"""
    specialties = [
        'General Ophthalmology',
        'Retinal Specialist',
        'Glaucoma Specialist',
        'Corneal Specialist',
        'Pediatric Ophthalmology',
        'Oculoplastic Surgery',
        'Neuro-Ophthalmology',
        'Cataract Surgery',
        'Refractive Surgery',
        'Emergency Eye Care'
    ]
    
    return jsonify({
        'message': 'Medical specialties retrieved successfully',
        'specialties': specialties
    }), 200

@location_bp.route('/search-filters', methods=['GET'])
def get_search_filters():
    """Get available search filters for doctor/hospital search"""
    filters = {
        'radius_options': [5, 10, 25, 50],  # kilometers
        'sort_options': [
            {'value': 'distance', 'label': 'Distance'},
            {'value': 'rating', 'label': 'Rating'},
            {'value': 'experience', 'label': 'Experience'},
            {'value': 'consultation_fee', 'label': 'Consultation Fee'}
        ],
        'service_types': [
            'Eye Examination',
            'Cataract Surgery',
            'Glaucoma Treatment',
            'Retinal Surgery',
            'Laser Treatment',
            'Emergency Care',
            'Pediatric Care',
            'Contact Lens Fitting'
        ],
        'consultation_types': [
            'In-Person',
            'Video Consultation',
            'Phone Consultation'
        ]
    }
    
    return jsonify({
        'message': 'Search filters retrieved successfully',
        'filters': filters
    }), 200

@location_bp.route('/user-location', methods=['PUT'])
@jwt_required()
def update_user_location():
    """
    Update user's saved location
    
    Expected JSON:
    {
        "latitude": 19.0760,
        "longitude": 72.8777
    }
    
    Or:
    {
        "address": "Mumbai, Maharashtra"
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get coordinates
        if data.get('latitude') and data.get('longitude'):
            lat, lng = data['latitude'], data['longitude']
        elif data.get('address'):
            coordinates = location_service.get_user_location(data['address'])
            if not coordinates:
                return jsonify({'error': 'Address not found'}), 404
            lat, lng = coordinates
        else:
            return jsonify({
                'error': 'Either coordinates (latitude, longitude) or address is required'
            }), 400
        
        # Update user location
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.location_lat = lat
        user.location_lng = lng
        db.session.commit()
        
        return jsonify({
            'message': 'Location updated successfully',
            'location': {
                'latitude': lat,
                'longitude': lng
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update location: {str(e)}'}), 500
