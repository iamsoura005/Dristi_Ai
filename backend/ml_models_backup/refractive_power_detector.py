"""
Refractive Power Detection Model for Fundus Images

This module implements a CNN-based regression model for estimating refractive power
(spherical equivalent) from fundus/retinal images.

Author: Dristi AI Team
Date: 2025-09-13
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import cv2
from PIL import Image
import os
import logging
from typing import Dict, Tuple, Optional, Union

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RefractiveDetector:
    """
    Main class for refractive power detection from fundus images
    
    This class implements a CNN-based regression model that estimates the
    spherical equivalent refractive power in diopters from fundus images.
    """
    
    def __init__(self, model_path: Optional[str] = None, input_size: Tuple[int, int] = (224, 224)):
        """
        Initialize the RefractiveDetector
        
        Args:
            model_path: Path to pre-trained model weights (optional)
            input_size: Input image size for the model (width, height)
        """
        self.input_size = input_size
        self.model = None
        self.is_loaded = False
        self.model_path = model_path
        
        # Refractive power ranges (in diopters)
        self.min_diopter = -10.0
        self.max_diopter = 10.0
        
        # Quality thresholds
        self.quality_thresholds = {
            'excellent': 0.9,
            'good': 0.7,
            'fair': 0.5,
            'poor': 0.3
        }
        
        # Initialize model architecture
        self._build_model()
        
        # Load pre-trained weights if available
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def _build_model(self) -> None:
        """
        Build the CNN regression model architecture
        
        Uses EfficientNetB0 as backbone with custom regression head
        """
        try:
            # Base model - EfficientNetB0 pre-trained on ImageNet
            base_model = keras.applications.EfficientNetB0(
                weights='imagenet',
                include_top=False,
                input_shape=(*self.input_size, 3)
            )
            
            # Freeze base model initially
            base_model.trainable = False
            
            # Custom regression head
            inputs = keras.Input(shape=(*self.input_size, 3))
            x = base_model(inputs, training=False)
            x = layers.GlobalAveragePooling2D()(x)
            x = layers.Dropout(0.3)(x)
            x = layers.Dense(512, activation='relu')(x)
            x = layers.Dropout(0.2)(x)
            x = layers.Dense(256, activation='relu')(x)
            x = layers.Dropout(0.1)(x)
            
            # Output layer for refractive power (single continuous value)
            outputs = layers.Dense(1, activation='linear', name='refractive_power')(x)
            
            self.model = keras.Model(inputs, outputs)
            
            # Compile model
            self.model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=0.001),
                loss='mse',
                metrics=['mae']
            )
            
            logger.info("✅ Refractive power detection model built successfully")
            logger.info(f"Model input shape: {self.model.input_shape}")
            logger.info(f"Model output shape: {self.model.output_shape}")
            
        except Exception as e:
            logger.error(f"❌ Error building refractive power model: {str(e)}")
            self.model = None
    
    def load_model(self, model_path: str) -> bool:
        """
        Load pre-trained model weights
        
        Args:
            model_path: Path to the model file
            
        Returns:
            bool: True if loaded successfully, False otherwise
        """
        try:
            if self.model is None:
                logger.error("Model not built. Cannot load weights.")
                return False
                
            self.model.load_weights(model_path)
            self.is_loaded = True
            logger.info(f"✅ Refractive power model loaded from {model_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error loading refractive power model: {str(e)}")
            self.is_loaded = False
            return False
    
    def save_model(self, model_path: str) -> bool:
        """
        Save model weights
        
        Args:
            model_path: Path to save the model
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        try:
            if self.model is None:
                logger.error("No model to save")
                return False
                
            self.model.save_weights(model_path)
            logger.info(f"✅ Refractive power model saved to {model_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving refractive power model: {str(e)}")
            return False
    
    def preprocess_image(self, image: Union[np.ndarray, Image.Image]) -> np.ndarray:
        """
        Preprocess fundus image for refractive power analysis
        
        Args:
            image: Input image (PIL Image or numpy array)
            
        Returns:
            np.ndarray: Preprocessed image ready for model input
        """
        try:
            # Convert PIL Image to numpy array if needed
            if isinstance(image, Image.Image):
                img_array = np.array(image)
            else:
                img_array = image.copy()
            
            # Ensure RGB format
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                # Already RGB
                pass
            elif len(img_array.shape) == 3 and img_array.shape[2] == 4:
                # RGBA to RGB
                img_array = img_array[:, :, :3]
            elif len(img_array.shape) == 2:
                # Grayscale to RGB
                img_array = np.stack([img_array] * 3, axis=-1)
            else:
                raise ValueError(f"Unsupported image shape: {img_array.shape}")
            
            # Resize to model input size
            img_resized = cv2.resize(img_array, self.input_size, interpolation=cv2.INTER_LANCZOS4)
            
            # Normalize pixel values to [0, 1]
            img_normalized = img_resized.astype(np.float32) / 255.0
            
            # Add batch dimension
            img_batch = np.expand_dims(img_normalized, axis=0)
            
            return img_batch
            
        except Exception as e:
            logger.error(f"❌ Error preprocessing image: {str(e)}")
            raise
    
    def validate_fundus_quality(self, image: Union[np.ndarray, Image.Image]) -> Dict:
        """
        Validate if image is suitable for refractive power analysis
        
        Args:
            image: Input fundus image
            
        Returns:
            Dict: Quality assessment results
        """
        try:
            # Convert to numpy array if needed
            if isinstance(image, Image.Image):
                img_array = np.array(image)
            else:
                img_array = image.copy()
            
            # Basic quality metrics
            height, width = img_array.shape[:2]
            
            # Resolution check
            min_resolution = 150  # Minimum for refractive analysis
            resolution_score = min(1.0, (width * height) / (min_resolution ** 2))
            
            # Convert to grayscale for analysis
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Contrast assessment
            contrast = np.std(gray)
            contrast_score = min(1.0, contrast / 50.0)  # Normalize to 0-1
            
            # Brightness assessment
            brightness = np.mean(gray)
            brightness_score = 1.0 - abs(brightness - 128) / 128.0  # Optimal around 128
            
            # Sharpness assessment (using Laplacian variance)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness_score = min(1.0, laplacian_var / 500.0)  # Normalize
            
            # Overall quality score
            overall_score = (resolution_score * 0.3 + contrast_score * 0.25 + 
                           brightness_score * 0.25 + sharpness_score * 0.2)
            
            # Determine quality level
            if overall_score >= self.quality_thresholds['excellent']:
                quality_level = 'excellent'
            elif overall_score >= self.quality_thresholds['good']:
                quality_level = 'good'
            elif overall_score >= self.quality_thresholds['fair']:
                quality_level = 'fair'
            else:
                quality_level = 'poor'
            
            return {
                'is_suitable': overall_score >= self.quality_thresholds['poor'],
                'quality_level': quality_level,
                'overall_score': round(overall_score, 3),
                'metrics': {
                    'resolution_score': round(resolution_score, 3),
                    'contrast_score': round(contrast_score, 3),
                    'brightness_score': round(brightness_score, 3),
                    'sharpness_score': round(sharpness_score, 3)
                },
                'recommendations': self._get_quality_recommendations(quality_level)
            }
            
        except Exception as e:
            logger.error(f"❌ Error validating fundus quality: {str(e)}")
            return {
                'is_suitable': False,
                'quality_level': 'unknown',
                'overall_score': 0.0,
                'error': str(e)
            }
    
    def _get_quality_recommendations(self, quality_level: str) -> list:
        """Get recommendations based on quality level"""
        recommendations = {
            'excellent': ["Image quality is excellent for refractive analysis"],
            'good': ["Image quality is good for reliable analysis"],
            'fair': ["Image quality is acceptable but results may be less precise"],
            'poor': ["Image quality is poor - consider retaking with better equipment",
                    "Results should be interpreted with caution"]
        }
        return recommendations.get(quality_level, ["Unknown quality level"])

    def predict(self, fundus_image: Union[np.ndarray, Image.Image]) -> Dict:
        """
        Predict refractive power from fundus image

        Args:
            fundus_image: Input fundus image

        Returns:
            Dict: Prediction results including spherical equivalent and confidence
        """
        try:
            # Validate image quality first
            quality_result = self.validate_fundus_quality(fundus_image)

            if not quality_result['is_suitable']:
                return {
                    'success': False,
                    'error': 'Image quality too poor for refractive analysis',
                    'quality_assessment': quality_result,
                    'recommendations': quality_result.get('recommendations', [])
                }

            # Check if model is loaded
            if not self.is_loaded or self.model is None:
                # Use fallback prediction for demo
                return self._fallback_prediction(quality_result)

            # Preprocess image
            processed_image = self.preprocess_image(fundus_image)

            # Make prediction
            prediction = self.model.predict(processed_image, verbose=0)
            spherical_equivalent = float(prediction[0][0])

            # Clamp to valid range
            spherical_equivalent = np.clip(spherical_equivalent, self.min_diopter, self.max_diopter)

            # Calculate confidence based on quality and model certainty
            confidence = self._calculate_confidence(spherical_equivalent, quality_result)

            # Determine prescription category
            prescription_category = self._categorize_prescription(spherical_equivalent)

            return {
                'success': True,
                'spherical_equivalent': round(spherical_equivalent, 2),
                'confidence': round(confidence, 3),
                'prescription_category': prescription_category,
                'quality_assessment': quality_result,
                'recommendations': self._get_prescription_recommendations(spherical_equivalent, quality_result),
                'model_version': 'production',
                'analysis_timestamp': self._get_timestamp()
            }

        except Exception as e:
            logger.error(f"❌ Error in refractive power prediction: {str(e)}")
            return {
                'success': False,
                'error': f'Prediction failed: {str(e)}',
                'quality_assessment': quality_result if 'quality_result' in locals() else None
            }

    def _fallback_prediction(self, quality_result: Dict) -> Dict:
        """
        Generate fallback prediction when model is not loaded
        """
        # Generate realistic but random prediction for demo
        import random

        # Bias towards common refractive errors
        if random.random() < 0.4:  # 40% chance of myopia
            spherical_equivalent = random.uniform(-6.0, -0.5)
        elif random.random() < 0.3:  # 30% chance of hyperopia
            spherical_equivalent = random.uniform(0.5, 4.0)
        else:  # 30% chance of normal/low refractive error
            spherical_equivalent = random.uniform(-0.5, 0.5)

        # Adjust confidence based on quality
        base_confidence = 0.6  # Lower for fallback
        quality_multiplier = quality_result.get('overall_score', 0.5)
        confidence = base_confidence * quality_multiplier

        prescription_category = self._categorize_prescription(spherical_equivalent)

        return {
            'success': True,
            'spherical_equivalent': round(spherical_equivalent, 2),
            'confidence': round(confidence, 3),
            'prescription_category': prescription_category,
            'quality_assessment': quality_result,
            'recommendations': self._get_prescription_recommendations(spherical_equivalent, quality_result),
            'model_version': 'fallback_demo',
            'analysis_timestamp': self._get_timestamp(),
            'note': 'This is a demonstration prediction. For clinical use, a trained model is required.'
        }

    def _calculate_confidence(self, spherical_equivalent: float, quality_result: Dict) -> float:
        """
        Calculate prediction confidence based on various factors
        """
        # Base confidence from model (simplified - in real implementation would use model uncertainty)
        base_confidence = 0.85

        # Adjust based on image quality
        quality_score = quality_result.get('overall_score', 0.5)
        quality_adjustment = quality_score * 0.3

        # Adjust based on refractive power magnitude (higher errors are harder to predict)
        magnitude_adjustment = max(0.7, 1.0 - abs(spherical_equivalent) * 0.05)

        # Combine factors
        final_confidence = base_confidence * (0.7 + quality_adjustment) * magnitude_adjustment

        return min(final_confidence, 0.95)  # Cap at 95%

    def _categorize_prescription(self, spherical_equivalent: float) -> str:
        """
        Categorize prescription strength
        """
        abs_power = abs(spherical_equivalent)

        if abs_power < 0.25:
            return 'normal'
        elif abs_power < 1.0:
            return 'mild'
        elif abs_power < 3.0:
            return 'moderate'
        elif abs_power < 6.0:
            return 'high'
        else:
            return 'very_high'

    def _get_prescription_recommendations(self, spherical_equivalent: float, quality_result: Dict) -> list:
        """
        Get recommendations based on predicted refractive power
        """
        recommendations = []

        # Quality-based recommendations
        recommendations.extend(quality_result.get('recommendations', []))

        # Prescription-based recommendations
        abs_power = abs(spherical_equivalent)

        if abs_power < 0.25:
            recommendations.append("No significant refractive error detected")
            recommendations.append("Regular eye exams recommended")
        elif abs_power < 1.0:
            recommendations.append("Mild refractive error detected")
            recommendations.append("Consider corrective lenses for improved vision")
        elif abs_power < 3.0:
            recommendations.append("Moderate refractive error detected")
            recommendations.append("Corrective lenses recommended for daily activities")
        elif abs_power < 6.0:
            recommendations.append("High refractive error detected")
            recommendations.append("Strong corrective lenses required")
            recommendations.append("Consider specialized lens options")
        else:
            recommendations.append("Very high refractive error detected")
            recommendations.append("Specialized high-index lenses recommended")
            recommendations.append("Consider refractive surgery consultation")

        # Type-specific recommendations
        if spherical_equivalent < -0.5:
            recommendations.append("Myopia (nearsightedness) detected")
        elif spherical_equivalent > 0.5:
            recommendations.append("Hyperopia (farsightedness) detected")

        # General recommendations
        recommendations.append("Consult an eye care professional for comprehensive examination")
        recommendations.append("This analysis is for screening purposes only")

        return recommendations

    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
