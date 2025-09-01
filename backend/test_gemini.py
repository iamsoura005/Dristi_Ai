#!/usr/bin/env python3
"""
Test script to verify Gemini API connection
"""

import google.generativeai as genai

# Configure Gemini AI
GEMINI_API_KEY = "AIzaSyBriyODlxfC0ABch_fssZYde0mpX-JBJb4"

def test_gemini_connection():
    """Test the Gemini API connection"""
    try:
        print(f"🔑 Configuring Gemini API with key: {GEMINI_API_KEY[:20]}...")
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ Gemini API configured successfully!")
        
        # Configure the model (using gemini-1.5-flash for higher free tier limits)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "temperature": 0.4,
                "top_p": 0.95,
                "top_k": 64,
                "max_output_tokens": 2048,
            },
            safety_settings=[
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            ],
        )
        
        print("📝 Testing a simple query...")
        
        # Simple test prompt
        test_prompt = """
        You are a helpful AI assistant. Please respond with a simple greeting and confirm that you are working properly.
        """
        
        # Generate content with Gemini
        response = model.generate_content(test_prompt)
        response_text = response.text
        
        print("✅ Gemini response generated successfully!")
        print(f"📤 Response: {response_text}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing Gemini API: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        
        # Check specific error types
        if "API_KEY" in str(e) or "authentication" in str(e).lower() or "401" in str(e):
            print("❌ API Key authentication issue detected")
        elif "quota" in str(e).lower() or "rate" in str(e).lower():
            print("❌ API quota or rate limit issue detected")
        elif "model" in str(e).lower():
            print("❌ Model configuration issue detected")
        
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        
        return False

if __name__ == "__main__":
    print("🚀 Testing Gemini API connection...")
    success = test_gemini_connection()
    
    if success:
        print("\n🎉 Gemini API test completed successfully!")
    else:
        print("\n💥 Gemini API test failed!")