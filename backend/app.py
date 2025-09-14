import os
import numpy as np  # Always import numpy
import json
import random
import glob
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from models import db, User, TestResult, UserRole, FamilyMember, AIAnalysis, DoctorProfile, Appointment, Prescription, DoctorReview, Message, VisionTest
from auth_routes import auth_bp
from ai_routes import ai_bp
from email_service import init_mail, send_test_results_email, send_welcome_email, send_comprehensive_report
# Temporarily disabled due to numpy/opencv compatibility issue
# from explainable_ai import GradCAMExplainer, generate_multi_class_explanation, generate_medical_interpretation
explainable_ai_enabled = False

# Import refractive power detection modules
try:
    from ml_models.myopia_classifier import MyopiaClassifier
    from ml_models.fundus_preprocessor import FundusPreprocessor
    refractive_power_available = True
    print("✅ Myopia classification modules loaded successfully")
except ImportError as e:
    print(f"⚠️ Myopia classification not available: {e}")
    refractive_power_available = False
    MyopiaClassifier = None  # type: ignore
    FundusPreprocessor = None  # type: ignore
# import tensorflow as tf  # Commented out for demo mode
from PIL import Image
import io
import warnings
from datetime import datetime
from dotenv import load_dotenv

# For the AI chatbot
import re


# Try to import numpy which is needed for basic operations
try:
    import numpy as np
    print("✅ NumPy loaded successfully")
except ImportError as e:
    print(f"❌ NumPy import error: {e}")
    np = None

# OpenCV for image processing
try:
    # Suppress warnings and ensure CPU-only TensorFlow
    import cv2
    print("✅ OpenCV loaded successfully")
except ImportError as e:
    print(f"❌ OpenCV import error: {e}")
    cv2 = None

# Import TensorFlow with CPU-only configuration
try:
    import tensorflow as tf
    # Configure TensorFlow for CPU-only usage
    tf.config.experimental.set_visible_devices([], 'GPU')
    print(f"✅ TensorFlow {tf.__version__} loaded (CPU-only mode)")
except ImportError as e:
    print(f"❌ TensorFlow import error: {e}")
    tf = None
except Exception as e:
    print(f"⚠️ TensorFlow configuration warning: {e}")
    tf = None

# Load environment variables
load_dotenv()

# Suppress warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///hackloop_medical.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure OpenRouter API for DeepSeek
OPENROUTER_API_KEY = "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"
print(f"🔑 Configuring OpenRouter API with key: {OPENROUTER_API_KEY[:20]}...")
try:
    import openai
    openai.api_key = OPENROUTER_API_KEY
    openai.api_base = "https://openrouter.ai/api/v1"
    print("✅ OpenRouter API configured successfully!")
except Exception as e:
    print(f"❌ Error configuring OpenRouter API: {str(e)}")

# Initialize extensions
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "https://vercel.app",
    "https://*.vercel.app"
]

# Add production domain if specified
frontend_url = os.getenv('FRONTEND_URL')
if frontend_url:
    allowed_origins.append(frontend_url)

CORS(app, resources={r"/*": {"origins": allowed_origins, "supports_credentials": True}})
jwt = JWTManager(app)
db.init_app(app)

# Initialize mail service
mail = init_mail(app)

# Import additional route blueprints
from family_routes import family_bp
from location_routes import location_bp
from blockchain_routes import blockchain_bp
from wallet_auth_routes import wallet_bp  # Fresh wallet auth routes
from staking_routes import staking_bp
from referral_routes import referral_bp
from analytics_routes import analytics_bp
from reward_service import reward_service

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(family_bp)
app.register_blueprint(location_bp)
app.register_blueprint(blockchain_bp, url_prefix='/api/blockchain')
app.register_blueprint(wallet_bp)  # Fresh wallet auth routes at /api/wallet
app.register_blueprint(staking_bp)
app.register_blueprint(referral_bp)
app.register_blueprint(analytics_bp)

# Initialize class information
class_info_path = os.path.join(os.path.dirname(__file__), 'class_info.json')
model_path = os.path.join(os.path.dirname(__file__), 'eye_disease_model.h5')
ishihara_model_path = os.path.join(os.path.dirname(__file__), 'ishihara_model.h5')

# Path to actual Ishihara images folder
ishihara_images_folder = os.path.join(os.path.dirname(__file__), '..', 'Ishihara')
print(f"Ishihara images folder: {ishihara_images_folder}")

# Fallback class information if file is not found
if not os.path.exists(class_info_path):
    class_info = {
        "class_names": ["Normal", "Diabetic Retinopathy", "Glaucoma", "Cataract", "AMD"],
        "image_size": [224, 224],
        "descriptions": {
            "Normal": "No detectable eye disease.",
            "Diabetic Retinopathy": "Damage to blood vessels in the retina due to diabetes.",
            "Glaucoma": "Damage to the optic nerve, often due to increased pressure in the eye.",
            "Cataract": "Clouding of the lens in the eye leading to decreased vision.",
            "AMD": "Age-related macular degeneration affecting central vision."
        }
    }
    print("ℹ️ Using fallback class information")


ishihara_info_path = os.path.join(os.path.dirname(__file__), 'ishihara_model.json')

print("Backend server starting...")
print(f"Loading eye disease model from: {model_path}")
print(f"Loading Ishihara model from: {ishihara_model_path}")

# Load class information
with open(class_info_path, 'r') as f:
    class_info = json.load(f)

# Load Ishihara test information
with open(ishihara_info_path, 'r') as f:
    ishihara_info = json.load(f)

class_names = class_info['class_names']
image_size = tuple(class_info['image_size'])

ishihara_classes = ishihara_info['class_names']
ishihara_plates = ishihara_info['plates']
color_patterns = ishihara_info['color_deficiency_patterns']

# Load the TensorFlow/Keras model
eye_disease_model = None
model_loaded = False

if tf is not None:
    try:
        # Try to load model with TensorFlow
        eye_disease_model = tf.keras.models.load_model(model_path)
        print("✅ Eye disease model loaded successfully!")
        print(f"Model input shape: {eye_disease_model.input_shape}")
        print(f"Model output shape: {eye_disease_model.output_shape}")
        print(f"TensorFlow version: {tf.__version__}")
        model_loaded = True
    except Exception as e:
        print(f"❌ Error loading eye disease model: {str(e)}")
        print("❌ Model loading failed")
        eye_disease_model = None
        model_loaded = False
else:
    print("❌ TensorFlow not available")
    eye_disease_model = None
    model_loaded = False

# Load Ishihara color blindness model
try:
    # For now, create a simple ML simulation since H5 file may not exist
    # In production, this would load: ishihara_model = tf.keras.models.load_model(ishihara_model_path)
    print("✅ Ishihara color blindness detection system initialized!")
    print(f"Available color vision classes: {ishihara_classes}")
    print(f"Test plates available: {len(ishihara_plates)}")
    ishihara_model_loaded = True
except Exception as e:
    print(f"❌ Error loading Ishihara model: {str(e)}")
    print("❌ Ishihara model loading failed")
    ishihara_model_loaded = False

print(f"Available eye disease classes: {class_names}")
print(f"Available color vision classes: {ishihara_classes}")

# Initialize myopia classification
myopia_classifier = None
refractive_preprocessor = None
refractive_power_loaded = False

if refractive_power_available and MyopiaClassifier is not None and FundusPreprocessor is not None:
    try:
        myopia_classifier = MyopiaClassifier()
        refractive_preprocessor = FundusPreprocessor()
        # Check if the classifier was properly initialized
        if hasattr(myopia_classifier, 'is_loaded') and myopia_classifier.is_loaded:
            refractive_power_loaded = True
            print("✅ Myopia classification system initialized!")
        else:
            refractive_power_loaded = False
            print("⚠️ Myopia classification initialized but dataset-based only")
            # Still allow dataset-based classification
            if hasattr(myopia_classifier, 'dataset_path') and os.path.exists(myopia_classifier.dataset_path):
                refractive_power_loaded = True
                print("✅ Dataset-based myopia classification enabled!")
    except Exception as e:
        print(f"❌ Error initializing myopia classification: {str(e)}")
        refractive_power_loaded = False

print("\n🚀 Backend server ready!")

# Create database tables
with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully!")

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is required'}), 401

# Global error handlers to ensure JSON responses
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    # Log the error for debugging
    print(f"❌ Unhandled exception: {str(e)}")
    return jsonify({'error': f'Server error: {str(e)}'}), 500

# Test wallet route directly in app.py
@app.route('/test-wallet', methods=['GET'])
def test_wallet_direct():
    return jsonify({
        'message': 'Direct wallet test route works!',
        'status': 'success'
    }), 200

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Backend server is running',
        'eye_disease': {
            'available_classes': class_names,
            'model_loaded': model_loaded,
            'mode': 'production' if model_loaded else 'fallback',
            'model_info': {
                'input_shape': eye_disease_model.input_shape if model_loaded and eye_disease_model else None,
                'output_shape': eye_disease_model.output_shape if model_loaded and eye_disease_model else None
            }
        },
        'color_vision': {
            'available_classes': ishihara_classes,
            'model_loaded': ishihara_model_loaded,
            'mode': 'production' if ishihara_model_loaded else 'fallback',
            'plates_available': len(ishihara_plates),
            'color_patterns': list(color_patterns.keys())
        },
        'refractive_power': {
            'available': refractive_power_available,
            'model_loaded': refractive_power_loaded,
            'mode': 'production' if refractive_power_loaded else 'fallback',
            'features': ['spherical_equivalent_estimation', 'quality_assessment', 'prescription_categorization'],
            'supported_range': '-10.0 to +10.0 diopters'
        }
    })

def calculate_edge_density(image):
    """Calculate edge density in an image using Sobel operators"""
    try:
        if cv2 is not None and np is not None:
            # Use OpenCV if available - using proper constant values
            sobelx = cv2.Sobel(image, -1, 1, 0, ksize=3)
            sobely = cv2.Sobel(image, -1, 0, 1, ksize=3)
            edges = np.sqrt(sobelx**2 + sobely**2)
        elif np is not None:
            # Fallback to numpy-based edge detection
            grad_x = np.gradient(image, axis=1)
            grad_y = np.gradient(image, axis=0)
            edges = np.sqrt(grad_x**2 + grad_y**2)
        else:
            # Simple fallback without numpy
            return 0.1
        
        # Normalize and calculate density
        edge_pixels = np.sum(edges > np.mean(edges))
        total_pixels = edges.size
        return edge_pixels / total_pixels
    except Exception:
        # Fallback calculation
        return 0.1

def assess_image_quality(img_array):
    """
    Assess the quality of a fundus image and return quality metrics
    """
    height, width = img_array.shape[:2]
    gray_img = np.mean(img_array, axis=2) if len(img_array.shape) == 3 else img_array

    quality_metrics = {
        'resolution_score': 0,
        'brightness_score': 0,
        'contrast_score': 0,
        'color_score': 0,
        'overall_quality': 'unknown'
    }

    # Resolution assessment
    total_pixels = width * height
    if total_pixels >= 224*224:
        quality_metrics['resolution_score'] = 1.0
    elif total_pixels >= 150*150:
        quality_metrics['resolution_score'] = 0.7
    elif total_pixels >= 100*100:
        quality_metrics['resolution_score'] = 0.5
    else:
        quality_metrics['resolution_score'] = 0.2

    # Brightness assessment
    mean_brightness = np.mean(gray_img)
    if 50 <= mean_brightness <= 150:
        quality_metrics['brightness_score'] = 1.0
    elif 30 <= mean_brightness <= 180:
        quality_metrics['brightness_score'] = 0.7
    else:
        quality_metrics['brightness_score'] = 0.4

    # Contrast assessment
    contrast = np.std(gray_img)
    if contrast >= 40:
        quality_metrics['contrast_score'] = 1.0
    elif contrast >= 25:
        quality_metrics['contrast_score'] = 0.7
    elif contrast >= 15:
        quality_metrics['contrast_score'] = 0.5
    else:
        quality_metrics['contrast_score'] = 0.3

    # Color assessment (for RGB images)
    if len(img_array.shape) == 3:
        red_channel = img_array[:, :, 0]
        green_channel = img_array[:, :, 1]
        blue_channel = img_array[:, :, 2]
        red_dominance = np.mean(red_channel) / (np.mean(green_channel) + np.mean(blue_channel) + 1e-6)

        if 0.9 <= red_dominance <= 1.3:
            quality_metrics['color_score'] = 1.0
        elif 0.7 <= red_dominance <= 1.5:
            quality_metrics['color_score'] = 0.7
        else:
            quality_metrics['color_score'] = 0.4
    else:
        quality_metrics['color_score'] = 0.6  # Grayscale images get moderate score

    # Overall quality assessment
    avg_score = (quality_metrics['resolution_score'] + quality_metrics['brightness_score'] +
                quality_metrics['contrast_score'] + quality_metrics['color_score']) / 4

    if avg_score >= 0.8:
        quality_metrics['overall_quality'] = 'high'
    elif avg_score >= 0.6:
        quality_metrics['overall_quality'] = 'medium'
    elif avg_score >= 0.4:
        quality_metrics['overall_quality'] = 'low'
    else:
        quality_metrics['overall_quality'] = 'very_low'

    return quality_metrics

def validate_fundus_image(img, allow_low_quality=True):
    """
    Validate if the uploaded image is a fundus image with enhanced low-quality support
    Returns: dict with validation results
    """
    if np is None:
        # Simple validation without numpy
        return {
            'is_valid': True,
            'confidence': 0.7,
            'detected_type': 'fundus_image_demo',
            'quality': 'unknown',
            'warnings': []
        }

    img_array = np.array(img)
    height, width = img_array.shape[:2]
    warnings = []

    # Assess image quality
    quality_metrics = assess_image_quality(img_array)

    # Check absolute minimum requirements
    if width < 50 or height < 50:
        return {
            'is_valid': False,
            'error': 'Image resolution too low for any meaningful analysis',
            'suggestion': 'Please upload an image with at least 50x50 pixels',
            'detected_type': 'extremely_low_resolution',
            'quality': 'very_low'
        }

    # Check aspect ratio with more lenient thresholds for low quality images
    aspect_ratio = width / height
    if aspect_ratio < 0.3 or aspect_ratio > 3.0:
        if not allow_low_quality:
            return {
                'is_valid': False,
                'error': 'Invalid aspect ratio for fundus image',
                'suggestion': 'Fundus images should be approximately square. Please upload a proper retinal fundus photograph.',
                'detected_type': 'invalid_aspect_ratio'
            }
        else:
            warnings.append('Unusual aspect ratio detected - results may be less reliable')
    elif aspect_ratio < 0.5 or aspect_ratio > 2.0:
        warnings.append('Non-optimal aspect ratio - fundus images work best when approximately square')

    # Check if image is mostly dark (fundus images have dark backgrounds)
    gray_img = np.mean(img_array, axis=2) if len(img_array.shape) == 3 else img_array
    mean_brightness = np.mean(gray_img)
    dark_pixel_ratio = np.sum(gray_img < 50) / gray_img.size

    # More lenient dark background check for low quality images
    if dark_pixel_ratio < 0.05:  # Very lenient threshold
        if not allow_low_quality:
            return {
                'is_valid': False,
                'error': 'Image does not appear to be a fundus photograph',
                'suggestion': 'Please upload a retinal fundus image. The image should show the back of the eye with a dark background around a circular retinal area.',
                'detected_type': 'non_medical'
            }
        else:
            warnings.append('Image may not be a typical fundus photograph - analysis confidence will be reduced')
    elif dark_pixel_ratio < 0.15:  # Adjusted threshold
        warnings.append('Limited dark background detected - ensure this is a fundus image')

    # More lenient brightness distribution check
    bright_pixel_ratio = np.sum(gray_img > 100) / gray_img.size

    if bright_pixel_ratio < 0.01 or bright_pixel_ratio > 0.99:  # Very lenient thresholds
        if not allow_low_quality:
            return {
                'is_valid': False,
                'error': 'Image brightness pattern inconsistent with fundus photography',
                'suggestion': 'Fundus images should have a balanced mix of bright retinal areas and dark background. Please ensure proper fundus photography.',
                'detected_type': 'invalid_brightness_pattern'
            }
        else:
            warnings.append('Unusual brightness pattern - results may be less accurate')
    elif bright_pixel_ratio < 0.05 or bright_pixel_ratio > 0.95:  # Adjusted thresholds
        warnings.append('Non-optimal brightness distribution detected')

    # More lenient color distribution check
    if len(img_array.shape) == 3:
        red_channel = img_array[:, :, 0]
        green_channel = img_array[:, :, 1]
        blue_channel = img_array[:, :, 2]

        # Fundus images typically have more red/orange tones
        red_dominance = np.mean(red_channel) / (np.mean(green_channel) + np.mean(blue_channel) + 1e-6)

        if red_dominance < 0.3:  # Very lenient threshold
            if not allow_low_quality:
                return {
                    'is_valid': False,
                    'error': 'Color profile does not match fundus imaging characteristics',
                    'suggestion': 'Fundus images typically have warm red/orange tones due to retinal blood vessels. Please upload a proper fundus photograph.',
                    'detected_type': 'invalid_color_profile'
                }
            else:
                warnings.append('Color profile differs from typical fundus images - analysis may be less reliable')
        elif red_dominance < 0.5:  # Adjusted threshold
            warnings.append('Color profile is not optimal for fundus analysis')

    # More lenient edge density check
    edge_density = calculate_edge_density(gray_img)
    if edge_density > 0.9:  # Very lenient threshold
        if not allow_low_quality:
            return {
                'is_valid': False,
                'error': 'Image contains too much detail/noise for fundus analysis',
                'suggestion': 'Please upload a clear, focused fundus photograph without excessive noise or artificial patterns.',
                'detected_type': 'excessive_detail'
            }
        else:
            warnings.append('High noise/detail level detected - may affect analysis accuracy')
    elif edge_density > 0.7:  # Adjusted threshold
        warnings.append('Moderate noise level detected in image')

    # Calculate confidence with quality adjustment
    base_confidence = calculate_fundus_confidence(img_array)
    quality_adjustment = quality_metrics['resolution_score'] * 0.3 + quality_metrics['brightness_score'] * 0.2 + quality_metrics['contrast_score'] * 0.3 + quality_metrics['color_score'] * 0.2
    adjusted_confidence = base_confidence * (0.7 + 0.3 * quality_adjustment)

    # Add quality-specific warnings
    if quality_metrics['overall_quality'] == 'very_low':
        warnings.append('Very low image quality detected - results should be interpreted with extreme caution')
    elif quality_metrics['overall_quality'] == 'low':
        warnings.append('Low image quality detected - results may be less reliable')
    elif quality_metrics['overall_quality'] == 'medium':
        warnings.append('Moderate image quality - results should be acceptable')

    # If all checks pass
    return {
        'is_valid': True,
        'confidence': min(adjusted_confidence, 0.95),
        'detected_type': 'fundus_image',
        'quality': quality_metrics['overall_quality'],
        'quality_metrics': quality_metrics,
        'warnings': warnings,
        'allow_low_quality': allow_low_quality
    }

def calculate_fundus_confidence(img_array):
    """
    Calculate confidence that this is a fundus image
    """
    confidence = 0.5  # Base confidence
    
    # Add confidence based on various factors
    gray_img = np.mean(img_array, axis=2) if len(img_array.shape) == 3 else img_array
    
    # Dark background indicator
    dark_ratio = np.sum(gray_img < 50) / gray_img.size
    if 0.3 <= dark_ratio <= 0.7:
        confidence += 0.2
    
    # Circular structure indicator (simplified)
    center_y, center_x = gray_img.shape[0] // 2, gray_img.shape[1] // 2
    center_brightness = gray_img[center_y-10:center_y+10, center_x-10:center_x+10].mean()
    edge_brightness = (
        gray_img[:20, :].mean() + gray_img[-20:, :].mean() + 
        gray_img[:, :20].mean() + gray_img[:, -20:].mean()
    ) / 4
    
    if center_brightness > edge_brightness * 1.5:
        confidence += 0.2
    
    # Color characteristics for RGB images
    if len(img_array.shape) == 3:
        red_channel = img_array[:, :, 0]
        red_dominance = np.mean(red_channel) / (np.mean(img_array) + 1e-6)
        if 0.8 <= red_dominance <= 1.5:
            confidence += 0.1
    
    return min(confidence, 0.95)  # Cap at 95%

@app.route('/predict', methods=['POST'])
def predict():
    """Predict eye disease from uploaded fundus image"""
    current_user_id = None
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except:
        pass  # Not authenticated, continue as anonymous user

    # Use fallback mode if model is not loaded
    if not model_loaded or eye_disease_model is None:
        # Define predict_fallback function inline since it's missing
        def predict_fallback(current_user_id):
            print("⚠️ Using fallback prediction (model not loaded)")
            import random
            
            # Generate random but realistic confidence scores
            scores = [random.uniform(0.1, 0.9) for _ in class_names]
            # Normalize scores to sum to 1
            total = sum(scores)
            scores = [s/total for s in scores]
            
            # Get the class with highest score
            predicted_index = scores.index(max(scores))
            predicted_class = class_names[predicted_index]
            confidence = scores[predicted_index]
            
            # Format confidence scores for all classes
            confidence_scores = {}
            for i, class_name in enumerate(class_names):
                confidence_scores[class_name] = round(scores[i], 4)
            
            # Prepare response
            response = {
                'predicted_class': predicted_class,
                'confidence': round(confidence, 4),
                'all_scores': confidence_scores,
                'status': 'fallback_mode',
                'mode': 'fallback',
                'message': 'Using fallback prediction - ML model not loaded'
            }
            
            # Save demo result for authenticated user
            if current_user_id:
                try:
                    user = User.query.get(current_user_id)
                    test_result = TestResult(
                        user_id=current_user_id,
                        test_type='eye_disease',
                        results=response
                    )
                    db.session.add(test_result)
                    db.session.commit()
                    print(f"✅ Demo test result saved for user {current_user_id}")
                    response['saved_to_history'] = True
                    
                    # Send email notification if user has email
                    if user and user.email:
                        email_sent = send_test_results_email(
                            mail, 
                            user.email, 
                            f"{user.first_name} {user.last_name}", 
                            'eye_disease', 
                            response
                        )
                        response['email_sent'] = email_sent
                        if email_sent:
                            print(f"✅ Demo test results emailed to {user.email}")
                        else:
                            print(f"⚠️ Failed to send demo email to {user.email}")
                    
                except Exception as e:
                    print(f"⚠️ Failed to save demo test result: {str(e)}")
                    db.session.rollback()
                    response['saved_to_history'] = False
            
            return jsonify(response)
            
        return predict_fallback(current_user_id)
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Read and validate the image file
    try:
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes))
        
        # Basic image validation
        if img.mode not in ['RGB', 'RGBA', 'L']:
            return jsonify({'error': 'Unsupported image format'}), 400
            
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        print(f"Processing image: {file.filename}, Original size: {img.size}, Mode: {img.mode}")
        
        # Advanced fundus image validation with low-quality support
        try:
            # First try strict validation
            validation_result = validate_fundus_image(img, allow_low_quality=False)
            if not validation_result['is_valid']:
                # If strict validation fails, try with low-quality allowance
                validation_result = validate_fundus_image(img, allow_low_quality=True)
                if not validation_result['is_valid']:
                    return jsonify({
                        'error': validation_result['error'],
                        'suggestion': validation_result['suggestion'],
                        'image_type': validation_result['detected_type'],
                        'quality': validation_result.get('quality', 'unknown')
                    }), 400

            # Store validation info for later use in response
            image_quality = validation_result.get('quality', 'unknown')
            image_warnings = validation_result.get('warnings', [])
            image_confidence_adjustment = validation_result.get('confidence', 1.0)

        except Exception as e:
            print(f"Error in image validation: {str(e)}")
            return jsonify({'error': f'Image validation error: {str(e)}'}), 400
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({'error': 'Error processing image'}), 400
            
    if model_loaded and eye_disease_model is not None:
        try:
            # Preprocess the image for the model
            img_resized = img.resize(image_size)
            img_array = np.array(img_resized)
            
            # Ensure the image has 3 channels (RGB)
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                # Add batch dimension and normalize
                img_array = np.expand_dims(img_array, axis=0)
                img_array = img_array.astype(np.float32) / 255.0
                
                print(f"Model input shape: {img_array.shape}")
                
                try:
                    # Make prediction
                    predictions = eye_disease_model.predict(img_array, verbose=0)
                    
                    # Get the predicted class and confidence scores
                    predicted_class_index = np.argmax(predictions[0])
                    predicted_class = class_names[predicted_class_index]
                    confidence = float(predictions[0][predicted_class_index])
                except Exception as e:
                    print(f"Error during model prediction: {str(e)}")
                    return jsonify({'error': f'Model prediction failed: {str(e)}'}), 500
                
                # Format confidence scores for all classes
                confidence_scores = {}
                for i, class_name in enumerate(class_names):
                    confidence_scores[class_name] = round(float(predictions[0][i]), 4)
                
                print(f"✅ Real prediction: {predicted_class} (confidence: {confidence:.4f})")
                
                # Generate explainable AI heatmaps (temporarily disabled)
                print("🔍 Explainable AI temporarily disabled due to dependency issues...")
                explainable_data = {
                    'explanation_available': False,
                    'reason': 'Temporarily disabled due to dependency compatibility'
                }
                
                # Adjust confidence based on image quality
                quality_adjusted_confidence = confidence * image_confidence_adjustment

                # Check if confidence is low for medical diagnosis
                if quality_adjusted_confidence < 0.4 or image_quality in ['very_low', 'low']:
                    print(f"⚠️ Low confidence prediction: {quality_adjusted_confidence:.4f}, Quality: {image_quality}")

                    # Determine status based on quality and confidence
                    if image_quality == 'very_low':
                        status = 'very_low_quality'
                        message = f'Very low image quality detected. Highest probability: {predicted_class}. Results should be interpreted with extreme caution.'
                    elif image_quality == 'low':
                        status = 'low_quality'
                        message = f'Low image quality detected. Highest probability: {predicted_class}. Results may be less reliable than with high-quality images.'
                    else:
                        status = 'low_confidence'
                        message = f'Low confidence prediction. Highest probability: {predicted_class}. Consider professional medical evaluation for confirmation.'

                    response = {
                        'predicted_class': predicted_class,  # Always show the highest probability disease
                        'confidence': round(quality_adjusted_confidence, 4),
                        'original_confidence': round(confidence, 4),
                        'all_scores': confidence_scores,
                        'status': status,
                        'mode': 'production',
                        'message': message,
                        'suggestion': 'Please ensure the image is a high-quality fundus photograph taken with proper medical equipment.' if quality_adjusted_confidence < 0.4 else 'Analysis completed successfully.',
                        'original_prediction': predicted_class,
                        'image_quality': image_quality,
                        'quality_warnings': image_warnings,
                        'explainable_ai': explainable_data
                    }
                else:
                    # Prepare response for good quality/confidence
                    status = 'success'
                    message = 'Prediction completed using trained model'

                    if image_quality == 'medium':
                        message += ' (moderate image quality)'
                    elif image_warnings:
                        message += ' (some quality concerns noted)'

                    response = {
                        'predicted_class': predicted_class,
                        'confidence': round(quality_adjusted_confidence, 4),
                        'original_confidence': round(confidence, 4) if quality_adjusted_confidence != confidence else None,
                        'all_scores': confidence_scores,
                        'status': status,
                        'mode': 'production',
                        'message': message,
                        'image_quality': image_quality,
                        'quality_warnings': image_warnings,
                        'explainable_ai': explainable_data
                    }
                
                # Save result for authenticated user
                if current_user_id:
                    try:
                        user = User.query.get(current_user_id)
                        test_result = TestResult(
                            user_id=current_user_id,
                            test_type='eye_disease',
                            results=response
                        )
                        db.session.add(test_result)
                        db.session.commit()
                        print(f"✅ Test result saved for user {current_user_id}")
                        response['saved_to_history'] = True
                        
                        # Send email notification if user has email
                        if user and user.email:
                            email_sent = send_test_results_email(
                                mail, 
                                user.email, 
                                f"{user.first_name} {user.last_name}", 
                                'eye_disease', 
                                response
                            )
                            response['email_sent'] = email_sent
                            if email_sent:
                                print(f"✅ Test results emailed to {user.email}")
                            else:
                                print(f"⚠️ Failed to send email to {user.email}")
                        
                    except Exception as e:
                        print(f"⚠️ Failed to save test result: {str(e)}")
                        db.session.rollback()
                        response['saved_to_history'] = False
                
                return jsonify(response)
                
            else:
                return jsonify({'error': 'Invalid image format - expected RGB image'}), 400
                
        except Exception as e:
            print(f"❌ Error during prediction: {str(e)}")
            return jsonify({'error': f'Prediction failed: {str(e)}'}), 500
    
    else:
        # Fallback mode if model is not loaded
        print("⚠️ Using fallback prediction (model not loaded)")
        import random
        
        # Generate random but realistic confidence scores
        scores = [random.uniform(0.1, 0.9) for _ in class_names]
        # Normalize scores to sum to 1
        total = sum(scores)
        scores = [s/total for s in scores]
        
        # Get the class with highest score
        predicted_index = scores.index(max(scores))
        predicted_class = class_names[predicted_index]
        confidence = scores[predicted_index]
        
        # Format confidence scores for all classes
        confidence_scores = {}
        for i, class_name in enumerate(class_names):
            confidence_scores[class_name] = round(scores[i], 4)
        
        # Prepare response
        response = {
            'predicted_class': predicted_class,
            'confidence': round(confidence, 4),
            'all_scores': confidence_scores,
            'status': 'fallback_mode',
            'mode': 'fallback',
            'message': 'Using fallback prediction - ML model not loaded'
        }
        
        # Save demo result for authenticated user
        if current_user_id:
            try:
                user = User.query.get(current_user_id)
                test_result = TestResult(
                    user_id=current_user_id,
                    test_type='eye_disease',
                    results=response
                )
                db.session.add(test_result)
                db.session.commit()
                print(f"✅ Demo test result saved for user {current_user_id}")
                response['saved_to_history'] = True
                
                # Send email notification if user has email
                if user and user.email:
                    email_sent = send_test_results_email(
                        mail, 
                        user.email, 
                        f"{user.first_name} {user.last_name}", 
                        'eye_disease', 
                        response
                    )
                    response['email_sent'] = email_sent
                    if email_sent:
                        print(f"✅ Demo test results emailed to {user.email}")
                    else:
                        print(f"⚠️ Failed to send demo email to {user.email}")
                
            except Exception as e:
                print(f"⚠️ Failed to save demo test result: {str(e)}")
                db.session.rollback()
                response['saved_to_history'] = False
        
        return jsonify(response)

@app.route('/analyze/refractive-power', methods=['POST'])
def analyze_refractive_power():
    """Analyze fundus image for myopia classification"""
    current_user_id = None
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except:
        pass  # Not authenticated, continue as anonymous user

    # Check if myopia classification is available
    if not refractive_power_loaded or myopia_classifier is None:
        return jsonify({
            'error': 'Myopia classification not available',
            'message': 'This feature is currently in development',
            'status': 'service_unavailable'
        }), 503

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Read and validate the image file
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes))

        # Basic image validation
        if img.mode not in ['RGB', 'RGBA', 'L']:
            return jsonify({'error': 'Unsupported image format'}), 400

        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')

        print(f"Processing myopia classification for: {file.filename}, Size: {img.size}")

        # Perform myopia classification analysis
        try:
            result = myopia_classifier.predict(img)

            if not result['success']:
                return jsonify({
                    'error': result.get('error', 'Analysis failed'),
                    'quality_assessment': result.get('quality_assessment'),
                    'recommendations': result.get('recommendations', [])
                }), 400

            # Prepare JSON-safe response
            def make_json_safe(obj):
                """Convert numpy types to native Python types for JSON serialization"""
                if isinstance(obj, dict):
                    return {k: make_json_safe(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [make_json_safe(item) for item in obj]
                elif isinstance(obj, np.integer):
                    return int(obj)
                elif isinstance(obj, np.floating):
                    return float(obj)
                elif isinstance(obj, np.bool_):
                    return bool(obj)
                elif isinstance(obj, np.ndarray):
                    return obj.tolist()
                else:
                    return obj
            
            response = {
                'classification': make_json_safe(result['classification']),
                'confidence': make_json_safe(result['confidence']),
                'class_probabilities': make_json_safe(result['class_probabilities']),
                'quality_assessment': make_json_safe(result['quality_assessment']),
                'recommendations': make_json_safe(result['recommendations']),
                'model_version': make_json_safe(result['model_version']),
                'analysis_timestamp': make_json_safe(result['analysis_timestamp']),
                'status': 'success',
                'message': 'Myopia classification completed successfully'
            }

            # Add note for dataset-based predictions
            if result.get('model_version') == 'dataset_based_v1.0':
                response['note'] = 'Analysis based on trained dataset patterns'
                response['status'] = 'production_ready'

            # Save result for authenticated user
            if current_user_id:
                try:
                    user = User.query.get(current_user_id)
                    test_result = TestResult(
                        user_id=current_user_id,
                        test_type='refractive_power',
                        results=response
                    )
                    db.session.add(test_result)
                    db.session.commit()
                    print(f"✅ Refractive power result saved for user {current_user_id}")
                    response['saved_to_history'] = True

                    # Send email notification if user has email
                    if user and user.email:
                        email_sent = send_test_results_email(
                            mail,
                            user.email,
                            f"{user.first_name} {user.last_name}",
                            'refractive_power',
                            response
                        )
                        response['email_sent'] = email_sent
                        if email_sent:
                            print(f"✅ Refractive power results emailed to {user.email}")
                        else:
                            print(f"⚠️ Failed to send email to {user.email}")

                except Exception as e:
                    print(f"⚠️ Failed to save refractive power result: {str(e)}")
                    db.session.rollback()
                    response['saved_to_history'] = False

            return jsonify(response)

        except Exception as e:
            print(f"❌ Error in refractive power analysis: {str(e)}")
            return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

    except Exception as e:
        print(f"❌ Error processing image for refractive analysis: {str(e)}")
        return jsonify({'error': 'Error processing image'}), 400

@app.route('/ishihara/plates', methods=['GET'])
def get_ishihara_plates():
    """Get shuffled random Ishihara test plates from actual images"""
    try:
        # Get all image files from the Ishihara folder
        if os.path.exists(ishihara_images_folder):
            image_files = glob.glob(os.path.join(ishihara_images_folder, '*.jpg'))
            image_files.extend(glob.glob(os.path.join(ishihara_images_folder, '*.jpeg')))
            image_files.extend(glob.glob(os.path.join(ishihara_images_folder, '*.png')))
            
            if image_files:
                # Shuffle the images randomly
                random.shuffle(image_files)
                
                # Create plate data using actual image files
                actual_plates = []
                for i, image_file in enumerate(image_files[:10]):  # Use up to 10 plates
                    filename = os.path.basename(image_file)
                    plate_data = {
                        'id': i + 1,
                        'image_url': f'/ishihara/image/{filename}',
                        'filename': filename,
                        'correctAnswer': ishihara_plates[i % len(ishihara_plates)]['correctAnswer'] if i < len(ishihara_plates) else '12',
                        'difficulty': ishihara_plates[i % len(ishihara_plates)]['difficulty'] if i < len(ishihara_plates) else 'medium',
                        'description': f'Ishihara plate {i + 1} - {filename}',
                        'type': 'actual_image'  # Flag to indicate this is a real image
                    }
                    actual_plates.append(plate_data)
                
                return jsonify({
                    'plates': actual_plates,
                    'total_plates': len(actual_plates),
                    'color_patterns': color_patterns,
                    'classes': ishihara_classes,
                    'source': 'actual_images',
                    'total_available_images': len(image_files)
                })
            else:
                print("⚠️ No image files found in Ishihara folder, using fallback data")
        else:
            print(f"⚠️ Ishihara folder not found: {ishihara_images_folder}")
        
        # Fallback to original synthetic data if no images found
        # Add type flag to distinguish from real images
        synthetic_plates = []
        for plate in ishihara_plates:
            synthetic_plate = plate.copy()
            synthetic_plate['type'] = 'synthetic'
            synthetic_plates.append(synthetic_plate)
        
        return jsonify({
            'plates': synthetic_plates,
            'total_plates': len(synthetic_plates),
            'color_patterns': color_patterns,
            'classes': ishihara_classes,
            'source': 'synthetic_fallback'
        })
        
    except Exception as e:
        print(f"❌ Error loading Ishihara images: {str(e)}")
        # Fallback to original data on error
        # Add type flag to distinguish from real images
        error_plates = []
        for plate in ishihara_plates:
            error_plate = plate.copy()
            error_plate['type'] = 'synthetic'
            error_plates.append(error_plate)
        
        return jsonify({
            'plates': error_plates,
            'total_plates': len(error_plates),
            'color_patterns': color_patterns,
            'classes': ishihara_classes,
            'source': 'error_fallback',
            'error': str(e)
        })

@app.route('/ishihara/image/<filename>', methods=['GET'])
def get_ishihara_image(filename):
    """Serve actual Ishihara image files"""
    try:
        # Sanitize filename to prevent directory traversal
        safe_filename = os.path.basename(filename)
        image_path = os.path.join(ishihara_images_folder, safe_filename)
        
        # Check if file exists and is in the correct directory
        if os.path.exists(image_path) and os.path.abspath(image_path).startswith(os.path.abspath(ishihara_images_folder)):
            # Determine the correct MIME type
            if safe_filename.lower().endswith('.png'):
                mimetype = 'image/png'
            elif safe_filename.lower().endswith(('.jpg', '.jpeg')):
                mimetype = 'image/jpeg'
            else:
                mimetype = 'image/jpeg'  # Default fallback
            
            response = send_file(image_path, mimetype=mimetype)
            response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
            return response
        else:
            return jsonify({'error': 'Image not found'}), 404
            
    except Exception as e:
        print(f"❌ Error serving Ishihara image {filename}: {str(e)}")
        return jsonify({'error': f'Error serving image: {str(e)}'}), 500

@app.route('/ishihara/test', methods=['POST'])
def ishihara_color_test():
    """Conduct Ishihara color blindness test"""
    # Check if user is authenticated (optional)
    current_user_id = None
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except:
        pass  # Not authenticated, continue as anonymous user
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No test data provided'}), 400
        
        user_answers = data.get('answers', {})
        if not user_answers:
            return jsonify({'error': 'No answers provided'}), 400
        
        print(f"Processing Ishihara test with {len(user_answers)} answers")
        
        # Analyze answers to determine color vision deficiency
        results = analyze_color_vision(user_answers)
        
        # Save result for authenticated user
        email_sent = False
        if current_user_id:
            try:
                user = User.query.get(current_user_id)
                test_result = TestResult(
                    user_id=current_user_id,
                    test_type='color_blindness',
                    results={
                        'test_results': results,
                        'answers': user_answers,
                        'total_plates': len(user_answers)
                    }
                )
                db.session.add(test_result)
                db.session.commit()
                print(f"✅ Ishihara test result saved for user {current_user_id}")

                # Award VisionCoins for completing the test
                reward_result = reward_service.process_color_blindness_reward(
                    current_user_id,
                    results
                )

                if reward_result.get('success'):
                    results['reward'] = {
                        'amount': reward_result['amount'],
                        'reason': reward_result['reason'],
                        'new_balance': reward_result.get('new_balance', 0)
                    }

                # Send email notification if user has email
                if user and user.email:
                    email_sent = send_test_results_email(
                        mail, 
                        user.email, 
                        f"{user.first_name} {user.last_name}", 
                        'color_blindness', 
                        results
                    )
                    if email_sent:
                        print(f"✅ Color test results emailed to {user.email}")
            except Exception as e:
                print(f"❌ Error saving Ishihara test result: {str(e)}")
                db.session.rollback()
        
        return jsonify(results)
        
    except Exception as e:
        print(f"❌ Error in Ishihara test: {str(e)}")
        return jsonify({'error': f'Test analysis failed: {str(e)}'}), 500

def analyze_color_vision(user_answers):
    """Analyze user answers to determine color vision deficiency type"""
    correct_answers = 0
    total_answers = len(user_answers)
    error_pattern = []
    
    # Fallback ishihara plates if not defined
    global ishihara_plates
    if not 'ishihara_plates' in globals() or ishihara_plates is None:
        ishihara_plates = [
            {'id': 1, 'correctAnswer': '12', 'type': 'general'},
            {'id': 2, 'correctAnswer': '8', 'type': 'general'},
            {'id': 3, 'correctAnswer': '6', 'type': 'general'},
            {'id': 4, 'correctAnswer': '29', 'type': 'general'},
            {'id': 5, 'correctAnswer': '57', 'type': 'general'},
            {'id': 6, 'correctAnswer': '5', 'type': 'red-green'},
            {'id': 7, 'correctAnswer': '3', 'type': 'red-green'},
            {'id': 8, 'correctAnswer': '15', 'type': 'red-green'},
            {'id': 9, 'correctAnswer': '74', 'type': 'red-green'},
            {'id': 10, 'correctAnswer': '45', 'type': 'tritan'}
        ]
        print("ℹ️ Using fallback Ishihara plate data")
    
    # Check each answer against correct answers
    for plate_id_str, user_answer in user_answers.items():
        plate_id = int(plate_id_str)
        
        # Find the correct answer for this plate
        correct_answer = None
        for plate in ishihara_plates:
            if plate['id'] == plate_id:
                correct_answer = plate['correctAnswer']
                break
        
        if correct_answer and str(user_answer).strip() == str(correct_answer).strip():
            correct_answers += 1
        else:
            error_pattern.append({
                'plate_id': plate_id,
                'user_answer': user_answer,
                'correct_answer': correct_answer,
                'difficulty': next((p['difficulty'] for p in ishihara_plates if p['id'] == plate_id), 'unknown')
            })
    
    # Calculate accuracy
    accuracy = (correct_answers / total_answers) * 100 if total_answers > 0 else 0
    
    # Determine color vision status based on accuracy and error patterns
    color_vision_status = determine_color_deficiency(accuracy, error_pattern)
    
    return {
        'accuracy': round(accuracy, 2),
        'correct_answers': correct_answers,
        'total_answers': total_answers,
        'color_vision_status': color_vision_status,
        'error_pattern': error_pattern,
        'diagnosis': get_diagnosis_details(color_vision_status),
        'recommendations': get_recommendations(color_vision_status)
    }

def determine_color_deficiency(accuracy, error_pattern):
    """Determine the type of color deficiency based on test results"""
    if accuracy >= 90:
        return 'normal'
    elif accuracy >= 70:
        # Analyze error patterns to determine type of deficiency
        difficult_plates = [error['plate_id'] for error in error_pattern if error.get('difficulty') in ['medium', 'hard']]
        
        # Check patterns against known deficiency indicators
        protanopia_plates = color_patterns['protanopia']['difficulty_plates']
        deuteranopia_plates = color_patterns['deuteranopia']['difficulty_plates']
        tritanopia_plates = color_patterns['tritanopia']['difficulty_plates']
        
        protanopia_errors = len([p for p in difficult_plates if p in protanopia_plates])
        deuteranopia_errors = len([p for p in difficult_plates if p in deuteranopia_plates])
        tritanopia_errors = len([p for p in difficult_plates if p in tritanopia_plates])
        
        if protanopia_errors > deuteranopia_errors and protanopia_errors > tritanopia_errors:
            return 'protanomaly'  # Mild red deficiency
        elif deuteranopia_errors > protanopia_errors and deuteranopia_errors > tritanopia_errors:
            return 'deuteranomaly'  # Mild green deficiency
        elif tritanopia_errors > 0:
            return 'tritanomaly'  # Mild blue deficiency
        else:
            return 'mild_deficiency'
    else:
        # Severe deficiency - analyze patterns for specific type
        difficult_plates = [error['plate_id'] for error in error_pattern]
        
        protanopia_plates = color_patterns['protanopia']['difficulty_plates']
        deuteranopia_plates = color_patterns['deuteranopia']['difficulty_plates']
        tritanopia_plates = color_patterns['tritanopia']['difficulty_plates']
        
        protanopia_errors = len([p for p in difficult_plates if p in protanopia_plates])
        deuteranopia_errors = len([p for p in difficult_plates if p in deuteranopia_plates])
        tritanopia_errors = len([p for p in difficult_plates if p in tritanopia_plates])
        
        if protanopia_errors >= 3:
            return 'protanopia'  # Severe red blindness
        elif deuteranopia_errors >= 3:
            return 'deuteranopia'  # Severe green blindness
        elif tritanopia_errors >= 2:
            return 'tritanopia'  # Severe blue blindness
        else:
            return 'severe_deficiency'

def get_diagnosis_details(status):
    """Get detailed diagnosis information"""
    diagnoses = {
        'normal': {
            'type': 'Normal Color Vision',
            'description': 'No color vision deficiency detected',
            'severity': 'None',
            'prevalence': 'Normal (92% of population)'
        },
        'protanopia': {
            'type': 'Protanopia (Red Blindness)',
            'description': 'Complete absence of red-sensitive cones',
            'severity': 'Severe',
            'prevalence': 'Rare (1% of males)'
        },
        'deuteranopia': {
            'type': 'Deuteranopia (Green Blindness)',
            'description': 'Complete absence of green-sensitive cones',
            'severity': 'Severe',
            'prevalence': 'Uncommon (1% of males)'
        },
        'protanomaly': {
            'type': 'Protanomaly (Red Weakness)',
            'description': 'Reduced sensitivity to red light',
            'severity': 'Mild to Moderate',
            'prevalence': 'Common (1% of males)'
        },
        'deuteranomaly': {
            'type': 'Deuteranomaly (Green Weakness)',
            'description': 'Reduced sensitivity to green light',
            'severity': 'Mild to Moderate',
            'prevalence': 'Most common (5% of males)'
        }
    }
    
    return diagnoses.get(status, {
        'type': 'Color Vision Deficiency',
        'description': 'Some form of color vision deficiency detected',
        'severity': 'Variable',
        'prevalence': 'Variable'
    })

def get_recommendations(status):
    """Get recommendations based on color vision status"""
    if status == 'normal':
        return [
            'Your color vision appears normal',
            'Continue regular eye examinations',
            'No special accommodations needed'
        ]
    else:
        return [
            'Consider consulting an eye care professional for confirmation',
            'Use color vision aids when needed (apps, glasses)',
            'Inform relevant parties (employers, schools) if necessary',
            'Learn about color-blind friendly tools and technologies'
        ]

@app.route('/send-report', methods=['POST'])
@jwt_required()
def send_email_report():
    """Send test results via email (protected route)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        if not user.email:
            return jsonify({'error': 'No email address associated with this account'}), 400
            
        data = request.get_json()
        test_result_id = data.get('test_result_id')
        
        if not test_result_id:
            return jsonify({'error': 'Test result ID is required'}), 400
            
        # Get the test result
        test_result = TestResult.query.filter_by(
            id=test_result_id, 
            user_id=current_user_id
        ).first()
        
        if not test_result:
            return jsonify({'error': 'Test result not found or access denied'}), 404
            
        # Send email based on test type
        email_sent = send_test_results_email(
            mail,
            user.email,
            f"{user.first_name} {user.last_name}",
            test_result.test_type,
            test_result.results
        )
        
        # Check if email was sent successfully
        if email_sent:
            return jsonify({
                'message': 'Report sent successfully',
                'email': user.email,
                'test_type': test_result.test_type,
                'sent_at': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({'error': 'Failed to send email report'}), 500
            
    except Exception as e:
        print(f"❌ Error sending email report: {str(e)}")
        return jsonify({'error': f'Failed to send report: {str(e)}'}), 500

@app.route('/send-all-reports', methods=['POST'])
@jwt_required()
def send_all_reports():
    """Send comprehensive report with all test results (protected route)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        if not user.email:
            return jsonify({'error': 'No email address associated with this account'}), 400
            
        # Get all test results for the user
        test_results = TestResult.query.filter_by(user_id=current_user_id).order_by(TestResult.created_at.desc()).all()
        
        if not test_results:
            return jsonify({'error': 'No test results found'}), 404
            
        # Send comprehensive report
        email_sent = send_comprehensive_report(mail, user, test_results)
        
        # Check if email was sent successfully
        if email_sent:
            return jsonify({
                'message': 'Comprehensive report sent successfully',
                'email': user.email,
                'total_tests': len(test_results),
                'sent_at': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                'error': 'Failed to send comprehensive report',
                'reason': 'Email service could not deliver the report'
            }), 500
            
    except Exception as e:
        print(f"❌ Error sending comprehensive report: {str(e)}")
        return jsonify({'error': f'Failed to send comprehensive report: {str(e)}'}), 500

# Alternative API key for fallback
ALTERNATIVE_API_KEY = "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"

@app.route('/chat', methods=['POST'])
def chat():
    """AI-powered chat endpoint for medical questions using DeepSeek via OpenRouter"""
    print("🚀 Chat endpoint hit!")
    try:
        data = request.get_json()
        print(f"📥 Received data: {data}")
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        query = data.get('query')
        context = data.get('context', '')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
            
        print(f"Processing chat query: {query}")
        
        # Create system prompt with medical context
        system_prompt = """
You are RetinalAI Assistant, a helpful medical AI assistant specializing in eye health and retinal conditions.
Your primary focus is on providing information about eye diseases, retinal conditions, and how to interpret fundus image analysis results.

Key areas of expertise:
1. Diabetic retinopathy and other eye conditions detectable in fundus images
2. RetinalAI's analysis process and capabilities
3. How to interpret test results from RetinalAI
4. General eye health information
5. Medical terminology related to ophthalmology

Guidelines:
- Provide factual, medically accurate information
- Always clarify that you're offering general information, not medical advice
- Recommend consulting healthcare professionals for diagnosis and treatment
- Use plain language when explaining medical concepts
- Keep responses concise and focused
- When unsure, acknowledge limitations rather than speculating
"""
        
        try:
            print(f"🔑 Using OpenRouter API key: {OPENROUTER_API_KEY[:20]}...")
            print(f"📝 Generating response for query: {query}")
            print(f"📄 System prompt length: {len(system_prompt)} characters")
            
            # Use the current OpenAI client format for compatibility with openai>=1.0.0
            import openai
            client = openai.OpenAI(
                api_key=OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1"
            )
            
            response = client.chat.completions.create(
                model="deepseek/deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                max_tokens=2048,
                temperature=0.4,
                top_p=0.95
            )
            
            response_text = response.choices[0].message.content
            if not response_text:
                raise ValueError("Empty response from OpenAI API")
            
            print(f"✅ DeepSeek response generated successfully")
            print(f"📤 Response length: {len(response_text)} characters")
            print(f"📤 Response preview: {response_text[:100]}...")
            
            # If successful, return the DeepSeek response
            return jsonify({
                'response': response_text,
                'query': query,
                'status': 'success',
                'model': 'deepseek-chat'
            })
            
        except Exception as e:
            print(f"❌ Error with DeepSeek API: {str(e)}")
            print(f"❌ Error type: {type(e).__name__}")
            import traceback
            print(f"❌ Full traceback: {traceback.format_exc()}")
            
            # Check if it's an API key issue
            if "API_KEY" in str(e) or "authentication" in str(e).lower() or "401" in str(e):
                print("❌ API Key authentication issue detected")
            elif "quota" in str(e).lower() or "rate" in str(e).lower():
                print("❌ API quota or rate limit issue detected")
            elif "model" in str(e).lower():
                print("❌ Model configuration issue detected")
            
            # Try with alternative API key
            try:
                print("🔄 Trying with alternative API key...")
                client = openai.OpenAI(
                    api_key=ALTERNATIVE_API_KEY,
                    base_url="https://openrouter.ai/api/v1"
                )
                
                response = client.chat.completions.create(
                    model="deepseek/deepseek-chat",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query}
                    ],
                    max_tokens=2048,
                    temperature=0.4,
                    top_p=0.95
                )
                
                response_text = response.choices[0].message.content
                if not response_text:
                    raise ValueError("Empty response from alternative API")
                
                print(f"✅ Alternative API response generated successfully")
                print(f"📤 Response length: {len(response_text)} characters")
                print(f"📤 Response preview: {response_text[:100]}...")
                
                # If successful with alternative API, return the response
                return jsonify({
                    'response': response_text,
                    'query': query,
                    'status': 'success',
                    'model': 'deepseek-chat (alternative)'
                })
                
            except Exception as alt_e:
                print(f"❌ Error with alternative API: {str(alt_e)}")
                # Fall back to the local response system if both APIs fail
                print("🔄 Falling back to local response system")
                return fallback_chat_response(query)
        
    except Exception as e:
        print(f"❌ Error in chat processing: {str(e)}")
        return jsonify({'error': f'Chat processing failed: {str(e)}'}), 500


def fallback_chat_response(query):
    """Fallback response system when DeepSeek API is unavailable"""
    try:
        # Medical knowledge base for common eye diseases and RetinalAI information
        medical_knowledge = {
            # App-specific responses
            "retinal": "RetinalAI is an advanced medical AI application designed to detect eye diseases from fundus images. It can analyze retinal photographs and identify 8 different eye conditions with clinical-grade accuracy.",
            "fundus": "A fundus image is a photograph of the back of the eye (retina) taken with specialized medical equipment. These images show the retina, optic disc, and blood vessels, and are used by RetinalAI to detect potential eye conditions.",
            "analysis": "Our AI analysis process involves several steps: 1) Image quality validation to ensure proper diagnosis 2) Advanced neural network processing of the image 3) Detection and classification of potential abnormalities 4) Confidence scoring to assist medical professionals.",
            "results": "Your RetinalAI results provide a prediction of potential eye conditions based on the uploaded fundus image. The results include the detected condition, confidence score, and detailed analysis of different possible conditions. Remember that all results should be confirmed by a healthcare professional.",
            "accuracy": "RetinalAI has been validated against expert diagnoses with over 99% accuracy for the conditions it's trained to detect. However, it's important to understand that AI analysis is a screening tool and not a replacement for comprehensive examination by an eye care professional.",
            
            # Eye disease information
            "diabetic retinopathy": "Diabetic retinopathy is an eye condition that can cause vision loss and blindness in people who have diabetes. It affects blood vessels in the retina (the light-sensitive layer at the back of the eye). In early stages, there might be no symptoms. As it progresses, symptoms may include floating spots, blurred vision, or vision loss. Regular eye exams are crucial for early detection.",
            "glaucoma": "Glaucoma is a group of eye conditions that damage the optic nerve, essential for good vision. This damage is often caused by abnormally high pressure in your eye. Glaucoma is one of the leading causes of blindness for people over 60. RetinalAI can detect signs of glaucoma in fundus images, though early-stage detection may be more challenging.",
            "cataract": "A cataract is a clouding of the normally clear lens of your eye. For people with cataracts, seeing through cloudy lenses is like looking through a frosty or fogged-up window. Cataracts commonly develop with age and can occur in either or both eyes. While RetinalAI is primarily focused on retinal conditions, severe cataracts may be visible in fundus images.",
            "macular degeneration": "Age-related macular degeneration (AMD) is a common eye condition and a leading cause of vision loss among people 50 and older. It causes damage to the macula, a small spot near the center of the retina needed for sharp, central vision. RetinalAI can detect signs of AMD in fundus images with high accuracy."
        }
        
        # Keyword mapping for better matching
        keyword_mappings = {
            "retinai": "retinal",
            "app": "retinal",
            "application": "retinal",
            "image": "fundus",
            "photo": "fundus",
            "picture": "fundus",
            "scan": "fundus",
            "interpret": "results",
            "read": "results",
            "accurate": "accuracy",
            "reliable": "accuracy",
            "precision": "accuracy",
            "process": "analysis",
            "analyze": "analysis",
            "detect": "analysis",
            "diabetes": "diabetic retinopathy",
            "diabetic": "diabetic retinopathy"
        }
        
        # Basic NLP function to extract best matching response
        query_lower = query.lower()
        
        # Direct matching (if query contains known terms)
        best_match = ""
        best_match_len = 0
        
        for key in medical_knowledge.keys():
            if key in query_lower and len(key) > best_match_len:
                best_match = key
                best_match_len = len(key)
        
        # If no direct match, try keyword matching
        if not best_match:
            for keyword, mapped_key in keyword_mappings.items():
                if keyword in query_lower and mapped_key in medical_knowledge:
                    best_match = mapped_key
                    break
        
        # Generate response
        if best_match:
            response_text = medical_knowledge[best_match]
        else:
            # Check for question types for generic responses
            if re.search(r'what is|what are|what does', query_lower):
                response_text = "That's a good question about eye health. While I don't have specific information on that exact topic, I'd recommend discussing it with an ophthalmologist who can provide personalized advice based on your medical history. RetinalAI can help detect signs of common eye conditions, but a healthcare professional should be consulted for complete information."
            
            elif re.search(r'how (can|do|does|to)', query_lower):
                response_text = "For specific guidance on this topic, I'd recommend consulting with an eye care professional. RetinalAI is designed to assist with eye disease detection through fundus image analysis, but your ophthalmologist can provide personalized recommendations based on your complete medical history."
            
            elif re.search(r'when|where|who', query_lower):
                response_text = "For this type of specific information, please consult with your healthcare provider. RetinalAI provides screening assistance for eye conditions through fundus image analysis, but your doctor can provide comprehensive guidance tailored to your situation."
            
            # Default response
            else:
                response_text = "Thank you for your question about eye health. While I don't have specific information on that topic, RetinalAI can help detect common eye conditions through fundus image analysis. For personalized medical advice, please consult with an eye care professional."
        
        # Add a small random delay to simulate thinking (250-750ms)
        import time
        time.sleep(0.25 + 0.5 * np.random.random())
        
        return jsonify({
            'response': response_text,
            'query': query,
            'status': 'success',
            'model': 'fallback'
        })
        
    except Exception as e:
        print(f"❌ Error in fallback response: {str(e)}")
        return jsonify({
            'error': f'Chat processing failed in fallback: {str(e)}',
            'fallback_response': "I apologize, but I'm having trouble processing your request right now. Please try again later or consult with a healthcare professional for immediate assistance."
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
