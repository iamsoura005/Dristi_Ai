"""
Models package for Dristi AI

This package contains machine learning models and related utilities for:
- Eye disease detection
- Color blindness testing  
- Refractive power estimation
- Image preprocessing

Author: Dristi AI Team
Date: 2025-09-13
"""

__version__ = "1.0.0"
__author__ = "Dristi AI Team"

# Import main classes for easy access
try:
    from .refractive_power_detector import RefractiveDetector
    from .fundus_preprocessor import FundusPreprocessor
    
    __all__ = [
        'RefractiveDetector',
        'FundusPreprocessor'
    ]
    
except ImportError as e:
    print(f"Warning: Some model components could not be imported: {e}")
    __all__ = []
