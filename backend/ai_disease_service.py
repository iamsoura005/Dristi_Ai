"""
Enhanced AI Eye Disease Detection Service
Provides comprehensive disease analysis with detailed information, recommendations, and confidence scoring.
"""

import json
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from models import db, AIAnalysis, User, FamilyMember

class EyeDiseaseInfo:
    """Comprehensive eye disease information database"""
    
    DISEASE_DATABASE = {
        "normal": {
            "name": "Normal/Healthy",
            "description": "No signs of eye disease detected. The retinal structure appears healthy.",
            "severity": "none",
            "symptoms": [],
            "recommendations": [
                "Continue regular eye check-ups annually",
                "Maintain a healthy diet rich in vitamins A, C, and E",
                "Protect eyes from UV radiation with sunglasses",
                "Take regular breaks from screen time (20-20-20 rule)"
            ],
            "follow_up": "Annual routine check-up recommended",
            "urgency": "low"
        },
        "diabetic_retinopathy": {
            "name": "Diabetic Retinopathy",
            "description": "A diabetes complication that affects eyes, caused by damage to blood vessels in the retina.",
            "severity": "moderate_to_severe",
            "symptoms": [
                "Blurred or fluctuating vision",
                "Dark spots or strings floating in vision",
                "Impaired color vision",
                "Vision loss"
            ],
            "recommendations": [
                "Immediate consultation with an ophthalmologist required",
                "Strict blood sugar control",
                "Regular monitoring of blood pressure",
                "Consider laser treatment or injections if recommended",
                "Avoid smoking and maintain healthy lifestyle"
            ],
            "follow_up": "Urgent - within 1-2 weeks",
            "urgency": "high"
        },
        "glaucoma": {
            "name": "Glaucoma",
            "description": "A group of eye conditions that damage the optic nerve, often due to high eye pressure.",
            "severity": "moderate_to_severe",
            "symptoms": [
                "Gradual loss of peripheral vision",
                "Tunnel vision in advanced stages",
                "Eye pain and headaches",
                "Nausea and vomiting (in acute cases)"
            ],
            "recommendations": [
                "Immediate ophthalmologist consultation required",
                "Regular eye pressure monitoring",
                "Use prescribed eye drops consistently",
                "Avoid activities that increase eye pressure",
                "Regular exercise to improve blood flow"
            ],
            "follow_up": "Urgent - within 1 week",
            "urgency": "high"
        },
        "cataract": {
            "name": "Cataract",
            "description": "Clouding of the eye's natural lens, leading to decreased vision.",
            "severity": "mild_to_moderate",
            "symptoms": [
                "Cloudy or blurry vision",
                "Increased sensitivity to light",
                "Seeing halos around lights",
                "Frequent changes in eyeglass prescription"
            ],
            "recommendations": [
                "Consult ophthalmologist for evaluation",
                "Consider cataract surgery when vision significantly impaired",
                "Use anti-glare sunglasses",
                "Ensure adequate lighting for reading",
                "Regular eye examinations"
            ],
            "follow_up": "Within 1-3 months",
            "urgency": "moderate"
        },
        "age_related_macular_degeneration": {
            "name": "Age-Related Macular Degeneration (AMD)",
            "description": "Progressive disease affecting the macula, leading to central vision loss.",
            "severity": "moderate_to_severe",
            "symptoms": [
                "Blurred or fuzzy central vision",
                "Straight lines appearing wavy",
                "Dark or empty areas in central vision",
                "Difficulty recognizing faces"
            ],
            "recommendations": [
                "Immediate retinal specialist consultation",
                "AREDS2 vitamin supplements if recommended",
                "Amsler grid monitoring at home",
                "Protect eyes from UV light",
                "Quit smoking and maintain healthy diet"
            ],
            "follow_up": "Urgent - within 1-2 weeks",
            "urgency": "high"
        },
        "hypertensive_retinopathy": {
            "name": "Hypertensive Retinopathy",
            "description": "Retinal damage caused by high blood pressure affecting retinal blood vessels.",
            "severity": "moderate",
            "symptoms": [
                "Blurred vision",
                "Headaches",
                "Visual disturbances",
                "May be asymptomatic in early stages"
            ],
            "recommendations": [
                "Blood pressure control is essential",
                "Consult both ophthalmologist and cardiologist",
                "Regular monitoring of blood pressure",
                "Lifestyle modifications (diet, exercise)",
                "Medication compliance for hypertension"
            ],
            "follow_up": "Within 2-4 weeks",
            "urgency": "moderate"
        }
    }

class AIEyeDiseaseDetector:
    """Enhanced AI Eye Disease Detection System"""
    
    def __init__(self):
        self.disease_info = EyeDiseaseInfo()
        self.confidence_threshold = 0.7
        
    def analyze_image(self, image_path: str, user_id: int, family_member_id: Optional[int] = None) -> Dict:
        """
        Perform comprehensive AI analysis of eye image
        
        Args:
            image_path: Path to the uploaded eye image
            user_id: ID of the user requesting analysis
            family_member_id: Optional ID of family member being analyzed
            
        Returns:
            Comprehensive analysis results with recommendations
        """
        try:
            # For demo purposes, simulate AI prediction
            # In production, this would use actual TensorFlow model
            prediction_result = self._simulate_ai_prediction(image_path)
            
            # Get detailed disease information
            disease_info = self._get_disease_information(prediction_result['predicted_class'])
            
            # Generate personalized recommendations
            recommendations = self._generate_recommendations(
                prediction_result, user_id, family_member_id
            )
            
            # Create comprehensive analysis result
            analysis_result = {
                'predicted_condition': prediction_result['predicted_class'],
                'confidence_score': prediction_result['confidence'],
                'disease_info': disease_info,
                'recommendations': recommendations,
                'risk_factors': self._assess_risk_factors(user_id, family_member_id),
                'follow_up_required': disease_info['urgency'] in ['high', 'moderate'],
                'analysis_timestamp': datetime.now().isoformat(),
                'image_quality_score': prediction_result.get('image_quality', 0.8)
            }
            
            # Save analysis to database
            self._save_analysis_to_db(
                user_id, family_member_id, image_path, analysis_result
            )
            
            return {
                'success': True,
                'analysis': analysis_result
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Analysis failed: {str(e)}'
            }
    
    def _simulate_ai_prediction(self, image_path: str) -> Dict:
        """Simulate AI model prediction (replace with actual model in production)"""
        import random
        
        # Simulate different conditions with varying probabilities
        conditions = [
            ('normal', 0.4),
            ('diabetic_retinopathy', 0.15),
            ('glaucoma', 0.15),
            ('cataract', 0.15),
            ('age_related_macular_degeneration', 0.1),
            ('hypertensive_retinopathy', 0.05)
        ]
        
        # Weighted random selection
        predicted_class = random.choices(
            [c[0] for c in conditions],
            weights=[c[1] for c in conditions]
        )[0]
        
        # Generate confidence score
        if predicted_class == 'normal':
            confidence = random.uniform(0.75, 0.95)
        else:
            confidence = random.uniform(0.65, 0.90)
        
        return {
            'predicted_class': predicted_class,
            'confidence': round(confidence, 3),
            'image_quality': random.uniform(0.7, 0.95)
        }
    
    def _get_disease_information(self, condition: str) -> Dict:
        """Get comprehensive disease information"""
        return self.disease_info.DISEASE_DATABASE.get(
            condition, 
            self.disease_info.DISEASE_DATABASE['normal']
        )
    
    def _generate_recommendations(self, prediction: Dict, user_id: int, family_member_id: Optional[int]) -> List[str]:
        """Generate personalized recommendations based on analysis and user profile"""
        base_recommendations = self._get_disease_information(prediction['predicted_class'])['recommendations']
        
        # Add confidence-based recommendations
        confidence_recommendations = []
        if prediction['confidence'] < 0.8:
            confidence_recommendations.append(
                "Consider retaking the image with better lighting and focus for more accurate analysis"
            )
        
        # Add user-specific recommendations based on profile
        user_recommendations = self._get_user_specific_recommendations(user_id, family_member_id)
        
        return base_recommendations + confidence_recommendations + user_recommendations
    
    def _get_user_specific_recommendations(self, user_id: int, family_member_id: Optional[int]) -> List[str]:
        """Generate recommendations based on user profile and history"""
        recommendations = []
        
        try:
            # Get user information
            user = User.query.get(user_id)
            if not user:
                return recommendations
            
            # Age-based recommendations
            if user.date_of_birth:
                age = (datetime.now().date() - user.date_of_birth).days // 365
                if age > 60:
                    recommendations.append("Regular comprehensive eye exams recommended for seniors")
                elif age > 40:
                    recommendations.append("Annual eye exams recommended after age 40")
            
            # Check for previous analyses
            previous_analyses = AIAnalysis.query.filter_by(
                user_id=user_id, 
                family_member_id=family_member_id
            ).order_by(AIAnalysis.created_at.desc()).limit(3).all()
            
            if len(previous_analyses) > 1:
                recommendations.append("Track changes over time with regular monitoring")
            
        except Exception as e:
            print(f"Error generating user-specific recommendations: {e}")
        
        return recommendations
    
    def _assess_risk_factors(self, user_id: int, family_member_id: Optional[int]) -> List[str]:
        """Assess risk factors based on user profile"""
        risk_factors = []
        
        try:
            user = User.query.get(user_id)
            if not user:
                return risk_factors
            
            # Age-related risk factors
            if user.date_of_birth:
                age = (datetime.now().date() - user.date_of_birth).days // 365
                if age > 60:
                    risk_factors.append("Advanced age (increased risk for AMD, glaucoma, cataracts)")
                elif age > 40:
                    risk_factors.append("Middle age (increased risk for glaucoma, presbyopia)")
            
            # Gender-based risk factors
            if user.gender:
                if user.gender.value == 'female':
                    risk_factors.append("Female gender (slightly higher risk for dry eye syndrome)")
            
        except Exception as e:
            print(f"Error assessing risk factors: {e}")
        
        return risk_factors
    
    def _save_analysis_to_db(self, user_id: int, family_member_id: Optional[int], 
                           image_path: str, analysis_result: Dict):
        """Save analysis results to database"""
        try:
            ai_analysis = AIAnalysis(
                user_id=user_id,
                family_member_id=family_member_id,
                image_url=image_path,
                predicted_condition=analysis_result['predicted_condition'],
                confidence_score=analysis_result['confidence_score'],
                detailed_results=analysis_result,
                recommendations='\n'.join(analysis_result['recommendations']),
                follow_up_required=analysis_result['follow_up_required']
            )
            
            db.session.add(ai_analysis)
            db.session.commit()
            
        except Exception as e:
            print(f"Error saving analysis to database: {e}")
            db.session.rollback()
    
    def get_analysis_history(self, user_id: int, family_member_id: Optional[int] = None) -> List[Dict]:
        """Get analysis history for user or family member"""
        try:
            query = AIAnalysis.query.filter_by(user_id=user_id)
            if family_member_id:
                query = query.filter_by(family_member_id=family_member_id)
            
            analyses = query.order_by(AIAnalysis.created_at.desc()).all()
            return [analysis.to_dict() for analysis in analyses]
            
        except Exception as e:
            print(f"Error retrieving analysis history: {e}")
            return []

# Global instance
ai_detector = AIEyeDiseaseDetector()
