#!/usr/bin/env python3
"""
Test script to verify OpenAI API connection
"""

import openai

# Configure OpenAI API
OPENAI_API_KEY = "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"

def test_openai_connection():
    """Test the OpenAI API connection"""
    try:
        print(f"🔑 Configuring OpenAI API with key: {OPENAI_API_KEY[:20]}...")
        openai.api_key = OPENAI_API_KEY
        print("✅ OpenAI API configured successfully!")
        
        print("📝 Testing a simple query...")
        
        # Simple test prompt
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": "Please respond with a simple greeting and confirm that you are working properly."}
            ],
            max_tokens=100,
            temperature=0.4
        )
        
        response_text = response.choices[0].message.content
        
        print("✅ OpenAI response generated successfully!")
        print(f"📤 Response: {response_text}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing OpenAI API: {str(e)}")
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
    print("🚀 Testing OpenAI API connection...")
    success = test_openai_connection()
    
    if success:
        print("\n🎉 OpenAI API test completed successfully!")
    else:
        print("\n💥 OpenAI API test failed!")