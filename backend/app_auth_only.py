"""
Simplified Flask backend for testing authentication system without TensorFlow dependencies
This version focuses on user authentication and can be used to test the auth features.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, create_refresh_token, get_jwt_identity, verify_jwt_in_request
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import random
import json

# Import our auth models and routes
from models import db, User, TestResult, UserRole, bcrypt
from auth_routes import auth_bp
from email_service import init_mail, send_test_results_email, send_welcome_email

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///medical_ai.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
jwt = JWTManager(app)
bcrypt.init_app(app)
db.init_app(app)
mail = init_mail(app)
CORS(app, origins=['http://localhost:3000'], supports_credentials=True)

# Register auth blueprint
app.register_blueprint(auth_bp, url_prefix='/auth')

# Demo data for eye disease classes (without ML model)
class_names = [
    'bulging_eyes',
    'cataracts',
    'crossed_eyes',
    'glaucoma',
    'normal_eyes',
    'uveitis'
]

# Demo data for color blindness test
ishihara_classes = ['Normal', 'Protanopia', 'Deuteranopia', 'Tritanopia']

ishihara_plates = [
    {
        "id": 1,
        "image_url": "/api/ishihara/plate/1",
        "normal_answer": "12",
        "colorblind_answer": "1",
        "description": "Circle with number 12"
    },
    {
        "id": 2,
        "image_url": "/api/ishihara/plate/2", 
        "normal_answer": "8",
        "colorblind_answer": "3",
        "description": "Circle with number 8"
    }
]

color_patterns = {
    "red-green": ["Protanopia", "Deuteranopia"],
    "blue-yellow": ["Tritanopia"],
    "normal": ["Normal"]
}

# Create tables
with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully")

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

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Authentication backend server is running',
        'mode': 'demo_auth',
        'eye_disease': {
            'available_classes': class_names,
            'model_loaded': False,
            'mode': 'demo'
        },
        'color_vision': {
            'available_classes': ishihara_classes,
            'model_loaded': False,
            'mode': 'demo',
            'plates_available': len(ishihara_plates),
            'color_patterns': list(color_patterns.keys())
        }
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Demo eye disease prediction endpoint"""
    # Check if user is authenticated (optional)
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except:
        pass  # Not authenticated, continue as anonymous user
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Generate random but realistic demo predictions
    print(f"📸 Processing demo prediction for: {file.filename}")
    
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
        'status': 'demo_mode',
        'mode': 'demo',
        'message': 'Demo prediction - Authentication system working!'
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
                email_sent = send_test_results_email(mail, user.email, user.username, 'eye_disease', response)
                response['email_sent'] = email_sent
            
        except Exception as e:
            print(f"⚠️ Failed to save demo test result: {str(e)}")
            db.session.rollback()
            response['saved_to_history'] = False
    else:
        response['saved_to_history'] = False
        response['note'] = 'Login to save results to your history'
    
    return jsonify(response)

@app.route('/ishihara/plates', methods=['GET'])
def get_ishihara_plates():
    """Get all available Ishihara test plates"""
    return jsonify({
        'plates': ishihara_plates,
        'total_plates': len(ishihara_plates),
        'color_patterns': color_patterns,
        'classes': ishihara_classes
    })

@app.route('/ishihara/test', methods=['POST'])
def ishihara_color_test():
    """Demo Ishihara color blindness test"""
    # Check if user is authenticated (optional)
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except:
        pass  # Not authenticated, continue as anonymous user
    
    data = request.get_json()
    if not data or 'answers' not in data:
        return jsonify({'error': 'Test answers are required'}), 400
    
    answers = data['answers']
    print(f"🎨 Processing demo color blindness test with {len(answers)} answers")
    
    # Demo scoring logic
    correct_answers = 0
    total_questions = len(answers)
    
    for answer in answers:
        # Simulate checking against correct answers
        if random.choice([True, False]):  # Random 50% correct for demo
            correct_answers += 1
    
    accuracy = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    
    # Demo classification based on accuracy
    if accuracy >= 80:
        classification = "Normal"
        confidence = 0.85 + random.uniform(0, 0.15)
    elif accuracy >= 60:
        classification = random.choice(["Protanopia", "Deuteranopia"])
        confidence = 0.70 + random.uniform(0, 0.20)
    else:
        classification = random.choice(ishihara_classes[1:])  # Any colorblind type
        confidence = 0.60 + random.uniform(0, 0.25)
    
    response = {
        'classification': classification,
        'confidence': round(confidence, 4),
        'accuracy': round(accuracy, 2),
        'correct_answers': correct_answers,
        'total_questions': total_questions,
        'status': 'demo_mode',
        'mode': 'demo',
        'message': 'Demo color vision test - Authentication system working!'
    }
    
    # Save demo result for authenticated user
    if current_user_id:
        try:
            user = User.query.get(current_user_id)
            test_result = TestResult(
                user_id=current_user_id,
                test_type='color_blindness',
                results=response
            )
            db.session.add(test_result)
            db.session.commit()
            print(f"✅ Demo color test result saved for user {current_user_id}")
            response['saved_to_history'] = True
            
            # Send email notification if user has email
            if user and user.email:
                email_sent = send_test_results_email(mail, user.email, user.username, 'color_blindness', response)
                response['email_sent'] = email_sent
            
        except Exception as e:
            print(f"⚠️ Failed to save demo color test result: {str(e)}")
            db.session.rollback()
            response['saved_to_history'] = False
    else:
        response['saved_to_history'] = False
        response['note'] = 'Login to save results to your history'
    
    return jsonify(response)

@app.route('/user/history', methods=['GET'])
@jwt_required()
def get_user_history():
    """Get user's test history (protected route)"""
    current_user_id = get_jwt_identity()
    
    try:
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's test results
        test_results = TestResult.query.filter_by(user_id=current_user_id).order_by(TestResult.created_at.desc()).all()
        
        history = {
            'user': user.to_dict(),
            'total_tests': len(test_results),
            'tests': [result.to_dict() for result in test_results],
            'eye_disease_tests': len([r for r in test_results if r.test_type == 'eye_disease']),
            'color_blindness_tests': len([r for r in test_results if r.test_type == 'color_blindness'])
        }
        
        return jsonify(history)
        
    except Exception as e:
        print(f"❌ Error getting user history: {str(e)}")
        return jsonify({'error': 'Failed to get user history'}), 500

if __name__ == '__main__':
    print("🚀 Starting Medical AI Authentication Backend (Demo Mode)")
    print("📍 Authentication endpoints available at: http://localhost:5000/auth/")
    print("🔍 Eye Disease Demo API: http://localhost:5000/predict")
    print("🎨 Color Vision Demo API: http://localhost:5000/ishihara/")
    print("📊 Health Check: http://localhost:5000/health")
    print("💾 User History: http://localhost:5000/user/history")
    
    app.run(debug=True, host='0.0.0.0', port=5000)