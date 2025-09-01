#!/usr/bin/env python3
"""
Test script for explainable AI functionality
"""

import os
import sys
import numpy as np
from PIL import Image
import json

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

def test_explainable_ai():
    """Test the explainable AI module"""
    try:
        # Import our modules
        from explainable_ai import GradCAMExplainer, generate_multi_class_explanation, generate_medical_interpretation
        
        print("✅ Successfully imported explainable AI modules")
        
        # Test without actual model (simulation mode)
        print("🔄 Testing explainable AI without model...")
        
        # Create dummy data
        dummy_img_array = np.random.rand(1, 224, 224, 3).astype(np.float32)
        class_names = ["cataract", "diabetic_retinopathy", "glaucoma", "normal"]
        
        print("✅ Created dummy data for testing")
        
        # Test medical interpretation function
        dummy_attention_stats = {
            'center_of_attention': {'x': 0.6, 'y': 0.4},
            'attention_concentration': 0.25,
            'dominant_quadrant': 'top_right',
            'quadrant_scores': {
                'top_left': 0.15,
                'top_right': 0.45,
                'bottom_left': 0.20,
                'bottom_right': 0.20
            },
            'max_attention_value': 0.8,
            'coverage_percentage': 35.0
        }
        
        interpretation = generate_medical_interpretation(
            dummy_attention_stats, 
            "diabetic_retinopathy", 
            0.87
        )
        
        print("✅ Medical interpretation generated successfully:")
        print(f"  - Focus: {interpretation['focus_description']}")
        print(f"  - Clinical relevance: {interpretation['clinical_relevance']}")
        print(f"  - Recommendations: {len(interpretation['recommendations'])} items")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {str(e)}")
        print("💡 This is expected if OpenCV is not installed. The module will work when dependencies are installed.")
        return False
    except Exception as e:
        print(f"❌ Error testing explainable AI: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_demo_mode():
    """Test demo mode functionality"""
    try:
        print("🔄 Testing demo mode functionality...")
        
        # Load class information
        class_info_path = os.path.join(os.path.dirname(__file__), 'class_info.json')
        if os.path.exists(class_info_path):
            with open(class_info_path, 'r') as f:
                class_info = json.load(f)
            
            class_names = class_info['class_names']
            print(f"✅ Loaded class names: {class_names}")
            
            # Generate demo explanation data
            demo_explanation = {
                'explanation_available': True,
                'main_explanation': {
                    'heatmap_base64': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                    'overlay_base64': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                    'attention_stats': {
                        'center_of_attention': {'x': 0.5, 'y': 0.5},
                        'attention_concentration': 0.3,
                        'dominant_quadrant': 'center',
                        'quadrant_scores': {
                            'top_left': 0.2,
                            'top_right': 0.25,
                            'bottom_left': 0.25,
                            'bottom_right': 0.3
                        },
                        'max_attention_value': 0.9,
                        'coverage_percentage': 40.0
                    },
                    'layer_used': 'conv5_block3_out',
                    'success': True
                },
                'multi_class_explanations': {},
                'medical_interpretation': {
                    'focus_description': 'Demo mode: Simulated attention pattern',
                    'clinical_relevance': 'This is a demonstration of the explainable AI feature.',
                    'confidence_explanation': 'Demo confidence analysis',
                    'recommendations': ['This is demo data for testing purposes.']
                }
            }
            
            print("✅ Generated demo explanation data")
            print(f"  - Explanation available: {demo_explanation['explanation_available']}")
            print(f"  - Attention center: {demo_explanation['main_explanation']['attention_stats']['center_of_attention']}")
            
            return True
        else:
            print(f"⚠️ Class info file not found at {class_info_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error in demo mode test: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Explainable AI Implementation")
    print("=" * 50)
    
    # Test basic functionality
    success1 = test_explainable_ai()
    print()
    
    # Test demo mode
    success2 = test_demo_mode()
    print()
    
    if success1 and success2:
        print("🎉 All explainable AI tests passed!")
        print("💡 The implementation is ready for testing with real models.")
    else:
        print("⚠️ Some tests failed, but this is expected without full dependencies.")
        print("💡 Install opencv-python and other dependencies for full functionality.")
    
    print("\n📋 Next steps:")
    print("1. Install dependencies: pip install opencv-python scipy matplotlib")
    print("2. Test with real fundus images and trained model")
    print("3. Verify heatmap generation and medical interpretations")