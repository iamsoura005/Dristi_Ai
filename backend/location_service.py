"""
Location Services and Doctor Finder
Provides geolocation services and nearby doctor/hospital search functionality
"""

import os
import googlemaps
import requests
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from models import db, DoctorProfile, User, UserRole

class LocationService:
    """Handles geolocation and place search functionality"""
    
    def __init__(self):
        # Initialize Google Maps client
        self.gmaps_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if self.gmaps_api_key:
            self.gmaps = googlemaps.Client(key=self.gmaps_api_key)
        else:
            self.gmaps = None
            print("Warning: Google Maps API key not found. Location services will use mock data.")
    
    def get_user_location(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Get coordinates from address using Google Geocoding API
        
        Args:
            address: Address string to geocode
            
        Returns:
            Tuple of (latitude, longitude) or None if not found
        """
        if not self.gmaps:
            return self._mock_geocode(address)
        
        try:
            geocode_result = self.gmaps.geocode(address)
            if geocode_result:
                location = geocode_result[0]['geometry']['location']
                return (location['lat'], location['lng'])
            return None
        except Exception as e:
            print(f"Geocoding error: {e}")
            return None
    
    def _mock_geocode(self, address: str) -> Tuple[float, float]:
        """Mock geocoding for demo purposes"""
        # Return coordinates for major Indian cities based on address keywords
        city_coordinates = {
            'mumbai': (19.0760, 72.8777),
            'delhi': (28.7041, 77.1025),
            'bangalore': (12.9716, 77.5946),
            'hyderabad': (17.3850, 78.4867),
            'chennai': (13.0827, 80.2707),
            'kolkata': (22.5726, 88.3639),
            'pune': (18.5204, 73.8567),
            'ahmedabad': (23.0225, 72.5714),
            'jaipur': (26.9124, 75.7873),
            'lucknow': (26.8467, 80.9462)
        }
        
        address_lower = address.lower()
        for city, coords in city_coordinates.items():
            if city in address_lower:
                return coords
        
        # Default to Mumbai coordinates
        return (19.0760, 72.8777)
    
    def find_nearby_doctors(self, lat: float, lng: float, radius: int = 10, 
                          specialty: str = None, limit: int = 20) -> List[Dict]:
        """
        Find nearby doctors and hospitals
        
        Args:
            lat: Latitude
            lng: Longitude
            radius: Search radius in kilometers
            specialty: Medical specialty filter
            limit: Maximum number of results
            
        Returns:
            List of doctor/hospital information
        """
        if not self.gmaps:
            return self._mock_nearby_doctors(lat, lng, radius, specialty, limit)
        
        try:
            # Search for hospitals and eye clinics
            places_result = self.gmaps.places_nearby(
                location=(lat, lng),
                radius=radius * 1000,  # Convert km to meters
                type='hospital',
                keyword='eye doctor ophthalmologist'
            )
            
            doctors = []
            for place in places_result.get('results', [])[:limit]:
                doctor_info = self._process_place_result(place, lat, lng)
                if doctor_info:
                    doctors.append(doctor_info)
            
            # Also search our database for registered doctors
            db_doctors = self._find_registered_doctors(lat, lng, radius, specialty)
            doctors.extend(db_doctors)
            
            # Sort by distance
            doctors.sort(key=lambda x: x.get('distance', float('inf')))
            
            return doctors[:limit]
            
        except Exception as e:
            print(f"Error finding nearby doctors: {e}")
            return self._mock_nearby_doctors(lat, lng, radius, specialty, limit)
    
    def _process_place_result(self, place: Dict, user_lat: float, user_lng: float) -> Dict:
        """Process Google Places API result into standardized format"""
        try:
            location = place['geometry']['location']
            place_lat, place_lng = location['lat'], location['lng']
            
            # Calculate distance
            distance = self._calculate_distance(user_lat, user_lng, place_lat, place_lng)
            
            # Get additional details
            place_id = place['place_id']
            details = self.gmaps.place(place_id=place_id, fields=[
                'name', 'formatted_address', 'formatted_phone_number',
                'opening_hours', 'rating', 'reviews', 'website'
            ])['result']
            
            return {
                'id': place_id,
                'name': details.get('name', 'Unknown'),
                'type': 'hospital',
                'specialization': 'General Ophthalmology',
                'address': details.get('formatted_address', ''),
                'phone': details.get('formatted_phone_number', ''),
                'website': details.get('website', ''),
                'rating': details.get('rating', 0),
                'total_reviews': len(details.get('reviews', [])),
                'distance': round(distance, 2),
                'latitude': place_lat,
                'longitude': place_lng,
                'opening_hours': details.get('opening_hours', {}).get('weekday_text', []),
                'is_open_now': details.get('opening_hours', {}).get('open_now', None),
                'source': 'google_places'
            }
            
        except Exception as e:
            print(f"Error processing place result: {e}")
            return None
    
    def _find_registered_doctors(self, lat: float, lng: float, radius: int, specialty: str) -> List[Dict]:
        """Find doctors registered in our database"""
        try:
            # Query doctors within radius
            doctors = db.session.query(DoctorProfile, User).join(
                User, DoctorProfile.user_id == User.id
            ).filter(
                User.role == UserRole.DOCTOR,
                User.is_active == True
            ).all()
            
            registered_doctors = []
            for doctor_profile, user in doctors:
                if doctor_profile.clinic_lat and doctor_profile.clinic_lng:
                    distance = self._calculate_distance(
                        lat, lng, doctor_profile.clinic_lat, doctor_profile.clinic_lng
                    )
                    
                    if distance <= radius:
                        # Filter by specialty if specified
                        if specialty and specialty.lower() not in doctor_profile.specialization.lower():
                            continue
                        
                        doctor_info = {
                            'id': f"db_{doctor_profile.id}",
                            'name': f"Dr. {user.first_name} {user.last_name}",
                            'type': 'doctor',
                            'specialization': doctor_profile.specialization,
                            'experience_years': doctor_profile.experience_years,
                            'qualifications': doctor_profile.qualifications,
                            'clinic_name': doctor_profile.clinic_name,
                            'address': doctor_profile.clinic_address,
                            'phone': user.phone,
                            'consultation_fee': doctor_profile.consultation_fee,
                            'rating': doctor_profile.rating,
                            'total_reviews': doctor_profile.total_reviews,
                            'distance': round(distance, 2),
                            'latitude': doctor_profile.clinic_lat,
                            'longitude': doctor_profile.clinic_lng,
                            'is_verified': doctor_profile.is_verified,
                            'services_offered': doctor_profile.services_offered,
                            'available_slots': doctor_profile.available_slots,
                            'source': 'registered_doctor'
                        }
                        registered_doctors.append(doctor_info)
            
            return registered_doctors
            
        except Exception as e:
            print(f"Error finding registered doctors: {e}")
            return []
    
    def _mock_nearby_doctors(self, lat: float, lng: float, radius: int, specialty: str, limit: int) -> List[Dict]:
        """Generate mock doctor data for demo purposes"""
        mock_doctors = [
            {
                'id': 'mock_1',
                'name': 'Dr. Rajesh Kumar',
                'type': 'doctor',
                'specialization': 'Retinal Specialist',
                'experience_years': 15,
                'clinic_name': 'Vision Care Center',
                'address': 'Shop 12, Medical Complex, Main Road',
                'phone': '+91-9876543210',
                'consultation_fee': 800,
                'rating': 4.5,
                'total_reviews': 127,
                'distance': 2.3,
                'latitude': lat + 0.01,
                'longitude': lng + 0.01,
                'is_verified': True,
                'services_offered': ['Retinal Surgery', 'Diabetic Retinopathy Treatment'],
                'source': 'mock_data'
            },
            {
                'id': 'mock_2',
                'name': 'Dr. Priya Sharma',
                'type': 'doctor',
                'specialization': 'Glaucoma Specialist',
                'experience_years': 12,
                'clinic_name': 'Eye Care Hospital',
                'address': 'Building A, Healthcare Plaza',
                'phone': '+91-9876543211',
                'consultation_fee': 1000,
                'rating': 4.7,
                'total_reviews': 89,
                'distance': 3.1,
                'latitude': lat - 0.015,
                'longitude': lng + 0.02,
                'is_verified': True,
                'services_offered': ['Glaucoma Surgery', 'Laser Treatment'],
                'source': 'mock_data'
            },
            {
                'id': 'mock_3',
                'name': 'City General Hospital',
                'type': 'hospital',
                'specialization': 'General Ophthalmology',
                'address': '123 Hospital Road, Medical District',
                'phone': '+91-9876543212',
                'rating': 4.2,
                'total_reviews': 234,
                'distance': 4.5,
                'latitude': lat + 0.02,
                'longitude': lng - 0.01,
                'services_offered': ['Emergency Eye Care', 'Comprehensive Eye Exams'],
                'source': 'mock_data'
            }
        ]
        
        # Filter by specialty if specified
        if specialty:
            mock_doctors = [
                doc for doc in mock_doctors 
                if specialty.lower() in doc['specialization'].lower()
            ]
        
        return mock_doctors[:limit]
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        import math
        
        # Convert latitude and longitude from degrees to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
    
    def get_directions(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> Dict:
        """Get driving directions between two points"""
        if not self.gmaps:
            return self._mock_directions(origin, destination)
        
        try:
            directions_result = self.gmaps.directions(
                origin=origin,
                destination=destination,
                mode="driving",
                departure_time=datetime.now()
            )
            
            if directions_result:
                route = directions_result[0]
                leg = route['legs'][0]
                
                return {
                    'distance': leg['distance']['text'],
                    'duration': leg['duration']['text'],
                    'steps': [step['html_instructions'] for step in leg['steps']],
                    'polyline': route['overview_polyline']['points']
                }
            
            return None
            
        except Exception as e:
            print(f"Error getting directions: {e}")
            return self._mock_directions(origin, destination)
    
    def _mock_directions(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> Dict:
        """Generate mock directions for demo purposes"""
        distance = self._calculate_distance(origin[0], origin[1], destination[0], destination[1])
        
        return {
            'distance': f"{distance:.1f} km",
            'duration': f"{int(distance * 3)} mins",  # Assume 20 km/h average speed
            'steps': [
                "Head north on Main Road",
                "Turn right onto Hospital Street",
                "Destination will be on your left"
            ],
            'polyline': 'mock_polyline_data'
        }

# Global instance
location_service = LocationService()
