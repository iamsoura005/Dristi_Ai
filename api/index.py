import sys
import os
import tempfile
import requests
from functools import lru_cache
import logging
import json
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Model URL - Use environment variable for flexibility
MODEL_URL = os.environ.get('MODEL_URL', 'https://github.com/iamsoura005/Dristi_Ai/releases/download/v1.0.0/eye_disease_model.h5')

# Global model cache
_model_cache = None
_model_loaded = False

@lru_cache(maxsize=1)
def download_model():
    """Download and cache the ML model from external storage"""
    global _model_cache, _model_loaded
    
    if _model_cache is not None:
        return _model_cache
    
    try:
        logger.info(f"Downloading model from {MODEL_URL}")
        response = requests.get(MODEL_URL, timeout=120, stream=True)
        response.raise_for_status()
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.h5') as temp_file:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp_file.write(chunk)
            temp_path = temp_file.name
        
        # Load model using TensorFlow with optimizations
        import tensorflow as tf
        
        # Configure TensorFlow for serverless
        tf.config.set_visible_devices([], 'GPU')
        
        model = tf.keras.models.load_model(temp_path, compile=False)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        _model_cache = model
        _model_loaded = True
        logger.info("Model loaded successfully!")
        return model
        
    except Exception as e:
        logger.error(f"Failed to download/load model: {str(e)}")
        _model_loaded = False
        return None

# Create optimized Flask app for serverless
from flask import Flask, request, jsonify
from flask_cors import CORS
import warnings
from PIL import Image
import numpy as np
import io

# Suppress warnings
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Load class information
try:
    with open(os.path.join(os.path.dirname(__file__), '..', 'backend', 'class_info.json'), 'r') as f:
        class_info = json.load(f)
except:
    class_info = {
        "class_names": ["Normal", "Diabetic Retinopathy", "Glaucoma", "Cataract", 
                       "AMD", "Hypertension", "Myopia", "Other"],
        "input_size": [224, 224]
    }

# Load Ishihara test data
try:
    with open(os.path.join(os.path.dirname(__file__), '..', 'backend', 'ishihara_model.json'), 'r') as f:
        ishihara_data = json.load(f)
except:
    ishihara_data = {"plates": []}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        model = download_model()
        model_status = "loaded" if model is not None else "fallback_mode"
    except:
        model_status = "fallback_mode"
    
    return jsonify({
        'status': 'healthy',
        'model_status': model_status,
        'tensorflow_version': 'Available',
        'classes': class_info.get('class_names', []),
        'serverless': True
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict eye disease from uploaded image"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Load and preprocess image
        image = Image.open(io.BytesIO(file.read()))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to model input size
        input_size = class_info.get('input_size', [224, 224])
        image = image.resize(input_size)
        
        # Convert to array and normalize
        img_array = np.array(image) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Try to get model and make prediction
        model = download_model()
        
        if model is not None:
            # Real prediction
            predictions = model.predict(img_array, verbose=0)
            predicted_class_index = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class_index])
            
            # Get all class probabilities
            class_probabilities = {
                class_info['class_names'][i]: float(predictions[0][i])
                for i in range(len(class_info['class_names']))
            }
        else:
            # Fallback demo prediction
            import random
            predicted_class_index = random.randint(0, len(class_info['class_names']) - 1)
            confidence = random.uniform(0.7, 0.95)
            
            class_probabilities = {
                name: random.uniform(0.1, 0.9) if i != predicted_class_index else confidence
                for i, name in enumerate(class_info['class_names'])
            }
        
        predicted_class = class_info['class_names'][predicted_class_index]
        
        return jsonify({
            'predicted_class': predicted_class,
            'confidence': confidence,
            'class_probabilities': class_probabilities,
            'model_loaded': model is not None,
            'processing_info': {
                'image_size': image.size,
                'input_size': input_size,
                'model_status': 'loaded' if model is not None else 'fallback_demo'
            }
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/ishihara/plates', methods=['GET'])
def get_ishihara_plates():
    """Get Ishihara color vision test plates"""
    return jsonify(ishihara_data.get('plates', []))

@app.route('/ishihara/test', methods=['POST'])
def analyze_ishihara_test():
    """Analyze Ishihara color vision test results"""
    try:
        data = request.get_json()
        responses = data.get('responses', [])
        
        # Simple analysis based on correct answers
        total_plates = len(responses)
        correct_answers = sum(1 for response in responses if response.get('correct', False))
        
        accuracy = (correct_answers / total_plates) * 100 if total_plates > 0 else 0
        
        if accuracy >= 80:
            diagnosis = "Normal color vision"
            severity = "None"
        elif accuracy >= 60:
            diagnosis = "Mild color vision deficiency"
            severity = "Mild"
        elif accuracy >= 40:
            diagnosis = "Moderate color vision deficiency"
            severity = "Moderate"
        else:
            diagnosis = "Severe color vision deficiency"
            severity = "Severe"
        
        return jsonify({
            'diagnosis': diagnosis,
            'severity': severity,
            'accuracy': accuracy,
            'correct_answers': correct_answers,
            'total_plates': total_plates
        })
        
    except Exception as e:
        logger.error(f"Ishihara test error: {str(e)}")
        return jsonify({'error': f'Test analysis failed: {str(e)}'}), 500

# This is the entry point for Vercel serverless functions
def handler(event, context):
    """Serverless handler for Vercel"""
    return app(event, context)

# For direct Flask app access (development)
if __name__ == '__main__':
    app.run(debug=True)