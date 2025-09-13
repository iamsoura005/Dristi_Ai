"""
Fundus Image Preprocessing Pipeline for Refractive Power Detection

This module provides specialized preprocessing functions for fundus images
to optimize them for refractive power analysis.

Author: Dristi AI Team
Date: 2025-09-13
"""

import numpy as np
import cv2
from PIL import Image, ImageEnhance, ImageFilter
from typing import Tuple, Union, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class FundusPreprocessor:
    """
    Specialized preprocessor for fundus images used in refractive power detection
    """
    
    def __init__(self, target_size: Tuple[int, int] = (224, 224)):
        """
        Initialize the preprocessor
        
        Args:
            target_size: Target image size (width, height)
        """
        self.target_size = target_size
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    
    def preprocess_for_refractive_analysis(self, image: Union[np.ndarray, Image.Image]) -> Dict:
        """
        Complete preprocessing pipeline for refractive power analysis
        
        Args:
            image: Input fundus image
            
        Returns:
            Dict: Processed image and metadata
        """
        try:
            # Convert to numpy array if needed
            if isinstance(image, Image.Image):
                img_array = np.array(image)
            else:
                img_array = image.copy()
            
            # Store original dimensions
            original_shape = img_array.shape
            
            # Step 1: Basic validation and format conversion
            img_rgb = self._ensure_rgb_format(img_array)
            
            # Step 2: Quality enhancement
            img_enhanced = self._enhance_image_quality(img_rgb)
            
            # Step 3: Optic disc detection and centering (simplified)
            img_centered = self._center_optic_disc(img_enhanced)
            
            # Step 4: Resize and normalize
            img_resized = self._resize_with_aspect_ratio(img_centered)
            img_normalized = self._normalize_for_model(img_resized)
            
            # Step 5: Generate preprocessing metadata
            metadata = self._generate_preprocessing_metadata(
                original_shape, img_normalized.shape, img_rgb, img_normalized
            )
            
            return {
                'processed_image': img_normalized,
                'metadata': metadata,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"❌ Error in fundus preprocessing: {str(e)}")
            return {
                'processed_image': None,
                'metadata': {'error': str(e)},
                'success': False
            }
    
    def _ensure_rgb_format(self, img_array: np.ndarray) -> np.ndarray:
        """
        Ensure image is in RGB format
        """
        if len(img_array.shape) == 2:
            # Grayscale to RGB
            return np.stack([img_array] * 3, axis=-1)
        elif len(img_array.shape) == 3:
            if img_array.shape[2] == 4:
                # RGBA to RGB
                return img_array[:, :, :3]
            elif img_array.shape[2] == 3:
                # Already RGB
                return img_array
            else:
                raise ValueError(f"Unsupported number of channels: {img_array.shape[2]}")
        else:
            raise ValueError(f"Unsupported image shape: {img_array.shape}")
    
    def _enhance_image_quality(self, img_rgb: np.ndarray) -> np.ndarray:
        """
        Enhance image quality using various techniques
        """
        # Convert to PIL for some operations
        pil_image = Image.fromarray(img_rgb.astype(np.uint8))
        
        # 1. Contrast enhancement using CLAHE on each channel
        enhanced_channels = []
        for i in range(3):
            channel = img_rgb[:, :, i].astype(np.uint8)
            enhanced_channel = self.clahe.apply(channel)
            enhanced_channels.append(enhanced_channel)
        
        img_clahe = np.stack(enhanced_channels, axis=-1)
        
        # 2. Slight sharpening
        pil_enhanced = Image.fromarray(img_clahe)
        sharpness_enhancer = ImageEnhance.Sharpness(pil_enhanced)
        pil_sharpened = sharpness_enhancer.enhance(1.2)  # Slight sharpening
        
        # 3. Color balance adjustment for fundus images
        color_enhancer = ImageEnhance.Color(pil_sharpened)
        pil_color_balanced = color_enhancer.enhance(1.1)  # Slight color enhancement
        
        # 4. Brightness adjustment if needed
        brightness_enhancer = ImageEnhance.Brightness(pil_color_balanced)
        
        # Calculate optimal brightness adjustment
        img_array = np.array(pil_color_balanced)
        mean_brightness = np.mean(img_array)
        
        if mean_brightness < 100:
            brightness_factor = 1.2
        elif mean_brightness > 180:
            brightness_factor = 0.9
        else:
            brightness_factor = 1.0
        
        pil_final = brightness_enhancer.enhance(brightness_factor)
        
        return np.array(pil_final)
    
    def _center_optic_disc(self, img_enhanced: np.ndarray) -> np.ndarray:
        """
        Detect and center the optic disc (simplified implementation)
        
        In a full implementation, this would use sophisticated optic disc detection.
        For now, we assume the image is reasonably centered.
        """
        # Convert to grayscale for optic disc detection
        gray = cv2.cvtColor(img_enhanced, cv2.COLOR_RGB2GRAY)
        
        # Simple bright region detection (optic disc is typically bright)
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (15, 15), 0)
        
        # Find the brightest region
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(blurred)
        
        # Get image center
        h, w = gray.shape
        center_x, center_y = w // 2, h // 2
        
        # Calculate offset from detected bright spot to center
        offset_x = max_loc[0] - center_x
        offset_y = max_loc[1] - center_y
        
        # Only apply centering if offset is significant but not too large
        if 20 < abs(offset_x) < w//4 or 20 < abs(offset_y) < h//4:
            # Create translation matrix
            M = np.float32([[1, 0, -offset_x//2], [0, 1, -offset_y//2]])
            
            # Apply translation
            img_centered = cv2.warpAffine(img_enhanced, M, (w, h), borderMode=cv2.BORDER_REFLECT)
            return img_centered
        
        # Return original if centering not needed or offset too large
        return img_enhanced
    
    def _resize_with_aspect_ratio(self, img_centered: np.ndarray) -> np.ndarray:
        """
        Resize image while maintaining aspect ratio and padding if necessary
        """
        h, w = img_centered.shape[:2]
        target_w, target_h = self.target_size
        
        # Calculate scaling factor
        scale = min(target_w / w, target_h / h)
        
        # Calculate new dimensions
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # Resize image
        img_resized = cv2.resize(img_centered, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
        
        # Create padded image
        img_padded = np.zeros((target_h, target_w, 3), dtype=img_resized.dtype)
        
        # Calculate padding
        pad_x = (target_w - new_w) // 2
        pad_y = (target_h - new_h) // 2
        
        # Place resized image in center
        img_padded[pad_y:pad_y+new_h, pad_x:pad_x+new_w] = img_resized
        
        return img_padded
    
    def _normalize_for_model(self, img_resized: np.ndarray) -> np.ndarray:
        """
        Normalize image for model input
        """
        # Convert to float32 and normalize to [0, 1]
        img_normalized = img_resized.astype(np.float32) / 255.0
        
        # Optional: Apply ImageNet normalization if using pre-trained models
        # mean = np.array([0.485, 0.456, 0.406])
        # std = np.array([0.229, 0.224, 0.225])
        # img_normalized = (img_normalized - mean) / std
        
        return img_normalized
    
    def _generate_preprocessing_metadata(self, original_shape: Tuple, final_shape: Tuple, 
                                       original_img: np.ndarray, processed_img: np.ndarray) -> Dict:
        """
        Generate metadata about the preprocessing steps
        """
        # Calculate quality metrics
        original_gray = cv2.cvtColor(original_img, cv2.COLOR_RGB2GRAY)
        processed_gray = cv2.cvtColor((processed_img * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        
        # Contrast improvement
        original_contrast = np.std(original_gray)
        processed_contrast = np.std(processed_gray)
        contrast_improvement = processed_contrast / (original_contrast + 1e-6)
        
        # Brightness statistics
        original_brightness = np.mean(original_gray)
        processed_brightness = np.mean(processed_gray)
        
        # Sharpness (using Laplacian variance)
        original_sharpness = cv2.Laplacian(original_gray, cv2.CV_64F).var()
        processed_sharpness = cv2.Laplacian(processed_gray, cv2.CV_64F).var()
        sharpness_improvement = processed_sharpness / (original_sharpness + 1e-6)
        
        return {
            'original_shape': original_shape,
            'final_shape': final_shape,
            'preprocessing_steps': [
                'RGB format conversion',
                'CLAHE contrast enhancement',
                'Sharpness enhancement',
                'Color balance adjustment',
                'Brightness optimization',
                'Optic disc centering',
                'Aspect ratio preservation',
                'Normalization'
            ],
            'quality_metrics': {
                'contrast_improvement': round(contrast_improvement, 3),
                'original_brightness': round(original_brightness, 1),
                'processed_brightness': round(processed_brightness, 1),
                'sharpness_improvement': round(sharpness_improvement, 3)
            },
            'target_size': self.target_size
        }
    
    def batch_preprocess(self, images: list) -> list:
        """
        Preprocess multiple images in batch
        
        Args:
            images: List of images to preprocess
            
        Returns:
            List of preprocessing results
        """
        results = []
        for i, image in enumerate(images):
            logger.info(f"Processing image {i+1}/{len(images)}")
            result = self.preprocess_for_refractive_analysis(image)
            results.append(result)
        
        return results
