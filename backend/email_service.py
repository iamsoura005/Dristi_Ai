"""
Email service for sending test results and notifications
"""

from flask import render_template_string
from flask_mail import Mail, Message
import os
from datetime import datetime

def init_mail(app):
    """Initialize Flask-Mail with app configuration"""
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', '')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', '')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', '')
    
    mail = Mail(app)
    return mail

def send_test_results_email(mail, user_email, user_name, test_type, results):
    """Send test results via email"""
    try:
        if not mail or not user_email or not test_type or not results:
            print("❌ Missing required parameters for sending email")
            return False
        # Email template for eye disease test
        if test_type == 'eye_disease':
            subject = "Your Eye Disease Test Results - Hackloop Medical AI"
            html_template = """
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .result-box { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
                    .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
                    .confidence { font-weight: bold; color: #28a745; }
                    .disclaimer { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🔬 Hackloop Medical AI</h1>
                    <p>Eye Disease Detection Results</p>
                </div>
                <div class="content">
                    <h2>Hello {{ user_name }},</h2>
                    <p>Your eye disease test has been completed. Here are your results:</p>
                    
                    <div class="result-box">
                        <h3>📊 Test Results</h3>
                        <p><strong>Predicted Condition:</strong> {{ results.predicted_class }}</p>
                        <p><strong>Confidence Level:</strong> <span class="confidence">{{ (results.confidence * 100)|round(2) }}%</span></p>
                        <p><strong>Test Date:</strong> {{ current_date }}</p>
                    </div>
                    
                    <div class="disclaimer">
                        <h4>⚠️ Important Disclaimer</h4>
                        <p>This AI-based screening is for preliminary assessment only. These results should not replace professional medical consultation. Please consult with an eye care professional for proper diagnosis and treatment recommendations.</p>
                    </div>
                    
                    <p>You can view your complete test history by logging into your Hackloop Medical AI account.</p>
                    
                    <p>Best regards,<br>The Hackloop Medical AI Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent from Hackloop Medical AI. Please do not reply to this email.</p>
                    <p>© 2024 Hackloop Medical AI. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
        
        # Email template for color blindness test
        elif test_type == 'color_blindness':
            subject = "Your Color Vision Test Results - Hackloop Medical AI"
            html_template = """
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .result-box { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
                    .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
                    .score { font-weight: bold; color: #28a745; }
                    .disclaimer { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎨 Hackloop Medical AI</h1>
                    <p>Color Vision Test Results</p>
                </div>
                <div class="content">
                    <h2>Hello {{ user_name }},</h2>
                    <p>Your Ishihara color vision test has been completed. Here are your results:</p>
                    
                    <div class="result-box">
                        <h3>📊 Test Results</h3>
                        {% if results.test_results %}
                        <p><strong>Classification:</strong> {{ results.test_results.color_vision_status }}</p>
                        <p><strong>Accuracy:</strong> <span class="score">{{ results.test_results.accuracy }}%</span></p>
                        <p><strong>Correct Answers:</strong> {{ results.test_results.correct_answers }}/{{ results.test_results.total_answers }}</p>
                        {% else %}
                        <p><strong>Classification:</strong> {{ results.classification }}</p>
                        <p><strong>Accuracy:</strong> <span class="score">{{ results.accuracy }}%</span></p>
                        <p><strong>Correct Answers:</strong> {{ results.correct_answers }}/{{ results.total_questions }}</p>
                        {% endif %}
                        <p><strong>Test Date:</strong> {{ current_date }}</p>
                    </div>
                    
                    <div class="disclaimer">
                        <h4>⚠️ Important Disclaimer</h4>
                        <p>This color vision screening is for preliminary assessment only. For comprehensive color vision evaluation and professional diagnosis, please consult with an eye care professional.</p>
                    </div>
                    
                    <p>You can view your complete test history by logging into your Hackloop Medical AI account.</p>
                    
                    <p>Best regards,<br>The Hackloop Medical AI Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent from Hackloop Medical AI. Please do not reply to this email.</p>
                    <p>© 2024 Hackloop Medical AI. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
        
        # Render the template
        html_body = render_template_string(html_template, 
                                         user_name=user_name, 
                                         results=results, 
                                         current_date=datetime.now().strftime("%B %d, %Y at %I:%M %p"))
        
        # Create and send message
        msg = Message(subject=subject,
                     recipients=[user_email],
                     html=html_body)
        
        mail.send(msg)
        print(f"✅ Email sent successfully to {user_email}")
        return True
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def send_welcome_email(mail, user_email, user_name):
    """Send welcome email to new users"""
    try:
        subject = "Welcome to Hackloop Medical AI"
        html_template = """
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .feature-box { background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 10px 0; }
                .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔬 Welcome to Hackloop Medical AI</h1>
                <p>Your AI-Powered Eye Health Companion</p>
            </div>
            <div class="content">
                <h2>Hello {{ user_name }},</h2>
                <p>Welcome to Hackloop Medical AI! We're excited to help you monitor your eye health with cutting-edge AI technology.</p>
                
                <h3>What you can do:</h3>
                <div class="feature-box">
                    <h4>🔍 Eye Disease Detection</h4>
                    <p>Upload fundus images for AI-powered disease screening</p>
                </div>
                <div class="feature-box">
                    <h4>🎨 Color Vision Testing</h4>
                    <p>Take comprehensive Ishihara color blindness tests</p>
                </div>
                <div class="feature-box">
                    <h4>📊 Health Tracking</h4>
                    <p>Monitor your eye health progress over time</p>
                </div>
                
                <p>Get started by logging into your account and taking your first test!</p>
                
                <p>Best regards,<br>The Hackloop Medical AI Team</p>
            </div>
            <div class="footer">
                <p>This email was sent from Hackloop Medical AI. Please do not reply to this email.</p>
                <p>© 2024 Hackloop Medical AI. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        html_body = render_template_string(html_template, user_name=user_name)
        
        msg = Message(subject=subject,
                     recipients=[user_email],
                     html=html_body)
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Error sending welcome email: {str(e)}")
        return False

def send_comprehensive_report(mail, user, test_results):
    """Send comprehensive report with all test results"""
    try:
        if not mail or not user or not test_results or not user.email:
            print("❌ Missing required parameters for sending comprehensive report")
            return False
        subject = "Your Complete Medical Test History - Hackloop Medical AI"
        
        # Separate results by type
        eye_disease_tests = [t for t in test_results if t.test_type == 'eye_disease']
        color_tests = [t for t in test_results if t.test_type == 'color_blindness']
        
        html_template = """
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .section { margin: 30px 0; }
                .test-result { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; }
                .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
                .stats { display: flex; justify-content: space-around; text-align: center; margin: 20px 0; }
                .stat-item { padding: 10px; }
                .confidence { font-weight: bold; color: #28a745; }
                .disclaimer { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 15px 0; }
                h3 { color: #007bff; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📈 Hackloop Medical AI</h1>
                <p>Complete Medical Test Report</p>
            </div>
            <div class="content">
                <h2>Hello {{ user_name }},</h2>
                <p>Here is your comprehensive medical test history from Hackloop Medical AI.</p>
                
                <div class="stats">
                    <div class="stat-item">
                        <h3>{{ total_tests }}</h3>
                        <p>Total Tests</p>
                    </div>
                    <div class="stat-item">
                        <h3>{{ eye_tests_count }}</h3>
                        <p>Eye Disease Tests</p>
                    </div>
                    <div class="stat-item">
                        <h3>{{ color_tests_count }}</h3>
                        <p>Color Vision Tests</p>
                    </div>
                </div>
                
                {% if eye_disease_tests %}
                <div class="section">
                    <h3>🔍 Eye Disease Test Results</h3>
                    {% for test in eye_disease_tests %}
                    <div class="test-result">
                        <h4>Test Date: {{ test.created_at.strftime('%B %d, %Y at %I:%M %p') }}</h4>
                        <p><strong>Predicted Condition:</strong> {{ test.results.predicted_class }}</p>
                        <p><strong>Confidence Level:</strong> <span class="confidence">{{ (test.results.confidence * 100)|round(2) }}%</span></p>
                        <p><strong>Status:</strong> {{ test.results.status }}</p>
                    </div>
                    {% endfor %}
                </div>
                {% endif %}
                
                {% if color_tests %}
                <div class="section">
                    <h3>🎨 Color Vision Test Results</h3>
                    {% for test in color_tests %}
                    <div class="test-result">
                        <h4>Test Date: {{ test.created_at.strftime('%B %d, %Y at %I:%M %p') }}</h4>
                        {% if test.results.test_results %}
                        <p><strong>Classification:</strong> {{ test.results.test_results.color_vision_status }}</p>
                        <p><strong>Accuracy:</strong> <span class="confidence">{{ test.results.test_results.accuracy }}%</span></p>
                        <p><strong>Correct Answers:</strong> {{ test.results.test_results.correct_answers }}/{{ test.results.test_results.total_answers }}</p>
                        {% else %}
                        <p><strong>Classification:</strong> {{ test.results.classification }}</p>
                        <p><strong>Accuracy:</strong> <span class="confidence">{{ test.results.accuracy }}%</span></p>
                        {% endif %}
                    </div>
                    {% endfor %}
                </div>
                {% endif %}
                
                <div class="disclaimer">
                    <h4>⚠️ Important Medical Disclaimer</h4>
                    <p>These AI-based screenings are for preliminary assessment only. All results should be reviewed by a qualified healthcare professional for proper diagnosis and treatment recommendations. Do not make medical decisions based solely on these test results.</p>
                </div>
                
                <p>For more detailed analysis or if you have concerns about any results, please consult with an eye care professional.</p>
                
                <p>Best regards,<br>The Hackloop Medical AI Team</p>
            </div>
            <div class="footer">
                <p>This comprehensive report was generated on {{ current_date }}</p>
                <p>© 2024 Hackloop Medical AI. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        html_body = render_template_string(
            html_template,
            user_name=f"{user.first_name} {user.last_name}",
            total_tests=len(test_results),
            eye_tests_count=len(eye_disease_tests),
            color_tests_count=len(color_tests),
            eye_disease_tests=eye_disease_tests,
            color_tests=color_tests,
            current_date=datetime.now().strftime("%B %d, %Y at %I:%M %p")
        )
        
        msg = Message(
            subject=subject,
            recipients=[user.email],
            html=html_body
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Error sending comprehensive report: {str(e)}")
        return False