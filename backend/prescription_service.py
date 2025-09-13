"""
Prescription Service for OCR, analysis, and recommendations
"""

import re
import cv2
import numpy as np
import pytesseract
from PIL import Image
import io
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from flask import current_app

from models import db, EyePrescription, LensRecommendation, User, FamilyMember

class PrescriptionOCRService:
    """Service for extracting prescription data from images using OCR"""
    
    def __init__(self):
        # Configure Tesseract (adjust path as needed)
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        # Common prescription patterns
        self.sphere_pattern = r'[+-]?\d+\.?\d*'
        self.cylinder_pattern = r'[+-]?\d+\.?\d*'
        self.axis_pattern = r'\d{1,3}'
        self.pd_pattern = r'\d{2,3}\.?\d*'
        
        # Keywords to identify prescription sections
        self.right_eye_keywords = ['OD', 'R', 'RIGHT', 'RE', 'OCULUS DEXTER']
        self.left_eye_keywords = ['OS', 'L', 'LEFT', 'LE', 'OCULUS SINISTER']
        self.sphere_keywords = ['SPH', 'SPHERE', 'S']
        self.cylinder_keywords = ['CYL', 'CYLINDER', 'C']
        self.axis_keywords = ['AXIS', 'AX', 'A']
        self.add_keywords = ['ADD', 'ADDITION']
        self.pd_keywords = ['PD', 'PUPILLARY DISTANCE', 'IPD']

    def preprocess_image(self, image_data: bytes) -> np.ndarray:
        """Preprocess image for better OCR results"""
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
        
        # Apply noise reduction
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Morphological operations to clean up
        kernel = np.ones((1, 1), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        return cleaned

    def extract_text_from_image(self, image_data: bytes) -> Tuple[str, float]:
        """Extract text from prescription image using OCR"""
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            
            # Configure Tesseract for better number recognition
            custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789+-.,ABCDEFGHIJKLMNOPQRSTUVWXYZ '
            
            # Extract text
            extracted_text = pytesseract.image_to_string(processed_image, config=custom_config)
            
            # Get confidence score
            data = pytesseract.image_to_data(processed_image, output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            return extracted_text.upper(), avg_confidence / 100.0
            
        except Exception as e:
            current_app.logger.error(f"OCR extraction failed: {str(e)}")
            return "", 0.0

    def parse_prescription_text(self, text: str) -> Dict:
        """Parse extracted text to identify prescription values"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        prescription_data = {
            'right_eye': {'sphere': None, 'cylinder': None, 'axis': None, 'add': None},
            'left_eye': {'sphere': None, 'cylinder': None, 'axis': None, 'add': None},
            'pupillary_distance': None,
            'confidence_scores': {}
        }
        
        current_eye = None
        
        for line in lines:
            line_upper = line.upper()
            
            # Identify which eye we're looking at
            if any(keyword in line_upper for keyword in self.right_eye_keywords):
                current_eye = 'right_eye'
                continue
            elif any(keyword in line_upper for keyword in self.left_eye_keywords):
                current_eye = 'left_eye'
                continue
            
            # Extract PD
            if any(keyword in line_upper for keyword in self.pd_keywords):
                pd_match = re.search(rf'({self.pd_pattern})', line)
                if pd_match:
                    prescription_data['pupillary_distance'] = float(pd_match.group(1))
            
            # Extract prescription values for current eye
            if current_eye:
                # Look for sphere, cylinder, axis in the line
                numbers = re.findall(rf'[+-]?\d+\.?\d*', line)
                
                if len(numbers) >= 2:
                    # Assume first number is sphere, second is cylinder
                    if prescription_data[current_eye]['sphere'] is None:
                        prescription_data[current_eye]['sphere'] = float(numbers[0])
                    if prescription_data[current_eye]['cylinder'] is None and len(numbers) > 1:
                        prescription_data[current_eye]['cylinder'] = float(numbers[1])
                    if prescription_data[current_eye]['axis'] is None and len(numbers) > 2:
                        axis_val = int(float(numbers[2]))
                        if 0 <= axis_val <= 180:
                            prescription_data[current_eye]['axis'] = axis_val
        
        return prescription_data

    def extract_prescription_from_image(self, image_data: bytes) -> Tuple[Dict, float]:
        """Complete pipeline to extract prescription from image"""
        # Extract text using OCR
        extracted_text, confidence = self.extract_text_from_image(image_data)
        
        if not extracted_text:
            return {}, 0.0
        
        # Parse the extracted text
        prescription_data = self.parse_prescription_text(extracted_text)
        
        return prescription_data, confidence

class PrescriptionAnalysisService:
    """Service for analyzing prescriptions and generating recommendations"""
    
    def __init__(self):
        self.ocr_service = PrescriptionOCRService()
    
    def calculate_prescription_strength(self, sphere: float, cylinder: float = 0) -> str:
        """Calculate overall prescription strength category"""
        # Calculate spherical equivalent
        spherical_equivalent = sphere + (cylinder / 2) if cylinder else sphere
        abs_se = abs(spherical_equivalent)
        
        if abs_se <= 0.25:
            return "Minimal"
        elif abs_se <= 2.00:
            return "Mild"
        elif abs_se <= 6.00:
            return "Moderate"
        elif abs_se <= 10.00:
            return "High"
        else:
            return "Very High"
    
    def analyze_prescription_changes(self, current: EyePrescription, previous: List[EyePrescription]) -> Dict:
        """Analyze changes in prescription over time"""
        if not previous:
            return {'status': 'first_prescription', 'changes': []}
        
        latest_previous = max(previous, key=lambda p: p.prescription_date)
        changes = []
        
        # Analyze right eye changes
        if current.od_sphere is not None and latest_previous.od_sphere is not None:
            sphere_change = current.od_sphere - latest_previous.od_sphere
            if abs(sphere_change) >= 0.25:
                changes.append({
                    'eye': 'right',
                    'parameter': 'sphere',
                    'change': sphere_change,
                    'direction': 'increased' if sphere_change > 0 else 'decreased',
                    'significance': 'significant' if abs(sphere_change) >= 0.50 else 'minor'
                })
        
        # Analyze left eye changes
        if current.os_sphere is not None and latest_previous.os_sphere is not None:
            sphere_change = current.os_sphere - latest_previous.os_sphere
            if abs(sphere_change) >= 0.25:
                changes.append({
                    'eye': 'left',
                    'parameter': 'sphere',
                    'change': sphere_change,
                    'direction': 'increased' if sphere_change > 0 else 'decreased',
                    'significance': 'significant' if abs(sphere_change) >= 0.50 else 'minor'
                })
        
        # Determine overall status
        significant_changes = [c for c in changes if c['significance'] == 'significant']
        if significant_changes:
            status = 'significant_change'
        elif changes:
            status = 'minor_change'
        else:
            status = 'stable'
        
        return {
            'status': status,
            'changes': changes,
            'time_since_last': (current.prescription_date - latest_previous.prescription_date).days
        }
    
    def generate_lens_recommendations(self, prescription: EyePrescription) -> List[LensRecommendation]:
        """Generate lens recommendations based on prescription"""
        recommendations = []
        
        # Calculate prescription strength for both eyes
        od_strength = self.calculate_prescription_strength(
            prescription.od_sphere or 0, prescription.od_cylinder or 0
        )
        os_strength = self.calculate_prescription_strength(
            prescription.os_sphere or 0, prescription.os_cylinder or 0
        )
        
        max_sphere = max(abs(prescription.od_sphere or 0), abs(prescription.os_sphere or 0))
        
        # Lens material recommendations
        if max_sphere <= 2.0:
            recommendations.append(LensRecommendation(
                prescription_id=prescription.id,
                recommendation_type='lens_material',
                recommended_value='Standard Plastic',
                reason='Low prescription strength allows for standard plastic lenses',
                confidence_score=0.9,
                priority=1,
                estimated_cost=50.0
            ))
        elif max_sphere <= 4.0:
            recommendations.append(LensRecommendation(
                prescription_id=prescription.id,
                recommendation_type='lens_material',
                recommended_value='Polycarbonate',
                reason='Medium prescription benefits from lighter, impact-resistant polycarbonate',
                confidence_score=0.85,
                priority=1,
                estimated_cost=100.0
            ))
        else:
            recommendations.append(LensRecommendation(
                prescription_id=prescription.id,
                recommendation_type='lens_material',
                recommended_value='High Index 1.67',
                reason='High prescription requires thinner, lighter high-index lenses',
                confidence_score=0.95,
                priority=1,
                estimated_cost=200.0
            ))
        
        # Coating recommendations
        recommendations.append(LensRecommendation(
            prescription_id=prescription.id,
            recommendation_type='coating',
            recommended_value='Anti-Reflective',
            reason='Reduces glare and improves visual clarity',
            confidence_score=0.9,
            priority=1,
            estimated_cost=75.0
        ))
        
        # Blue light coating for younger users or computer users
        recommendations.append(LensRecommendation(
            prescription_id=prescription.id,
            recommendation_type='coating',
            recommended_value='Blue Light Filter',
            reason='Protects against digital eye strain from screens',
            confidence_score=0.8,
            priority=2,
            estimated_cost=50.0
        ))
        
        # Progressive lenses for presbyopia (if ADD power is present)
        if prescription.od_add or prescription.os_add:
            recommendations.append(LensRecommendation(
                prescription_id=prescription.id,
                recommendation_type='lens_type',
                recommended_value='Progressive',
                reason='ADD power indicates presbyopia - progressive lenses provide seamless vision at all distances',
                confidence_score=0.95,
                priority=1,
                estimated_cost=300.0
            ))
        
        return recommendations
    
    def calculate_next_checkup_date(self, prescription: EyePrescription, user_age: int = None) -> datetime:
        """Calculate recommended date for next eye checkup"""
        base_date = prescription.prescription_date
        
        # Default intervals based on age and prescription strength
        if user_age and user_age < 18:
            # Children need more frequent checkups
            months = 6
        elif user_age and user_age > 60:
            # Seniors need more frequent checkups
            months = 12
        else:
            # Adults
            max_sphere = max(abs(prescription.od_sphere or 0), abs(prescription.os_sphere or 0))
            if max_sphere > 6.0:
                months = 12  # High prescriptions need annual checkups
            else:
                months = 24  # Regular prescriptions every 2 years
        
        return base_date + timedelta(days=months * 30)
    
    def get_prescription_summary(self, prescription: EyePrescription) -> Dict:
        """Generate a comprehensive prescription summary"""
        summary = {
            'prescription_id': prescription.id,
            'date': prescription.prescription_date.isoformat(),
            'strength_analysis': {
                'right_eye': self.calculate_prescription_strength(
                    prescription.od_sphere or 0, prescription.od_cylinder or 0
                ),
                'left_eye': self.calculate_prescription_strength(
                    prescription.os_sphere or 0, prescription.os_cylinder or 0
                )
            },
            'prescription_type': self._determine_prescription_type(prescription),
            'recommendations_count': len(prescription.recommendations),
            'is_current': prescription.is_current,
            'expiry_date': prescription.expiry_date.isoformat() if prescription.expiry_date else None
        }
        
        return summary
    
    def _determine_prescription_type(self, prescription: EyePrescription) -> str:
        """Determine the type of prescription based on values"""
        has_add = prescription.od_add or prescription.os_add
        has_cylinder = prescription.od_cylinder or prescription.os_cylinder
        
        if has_add:
            return "Progressive/Bifocal"
        elif has_cylinder:
            return "Astigmatism Correction"
        else:
            return "Single Vision"
