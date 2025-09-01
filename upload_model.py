#!/usr/bin/env python3
"""
Script to upload the ML model to external storage for Vercel deployment.
This helps bypass Vercel's 300MB size limit by hosting the model externally.
"""

import os
import sys
import argparse
from pathlib import Path

def upload_to_github_releases():
    """Instructions for uploading to GitHub Releases"""
    print("=== GITHUB RELEASES UPLOAD ===")
    print("1. Go to your GitHub repository")
    print("2. Click on 'Releases' tab")
    print("3. Click 'Create a new release'")
    print("4. Upload your eye_disease_model.h5 file")
    print("5. Copy the download URL and update MODEL_URL in vercel.json")
    print("\nThe URL format will be:")
    print("https://github.com/USERNAME/REPO/releases/download/v1.0.0/eye_disease_model.h5")

def upload_to_huggingface():
    """Instructions for uploading to Hugging Face"""
    print("=== HUGGING FACE UPLOAD ===")
    print("1. Install huggingface_hub: pip install huggingface_hub")
    print("2. Login: huggingface-cli login")
    print("3. Create a new model repository on huggingface.co")
    print("4. Upload your model:")
    print("   from huggingface_hub import HfApi")
    print("   api = HfApi()")
    print("   api.upload_file(")
    print("       path_or_fileobj='backend/eye_disease_model.h5',")
    print("       path_in_repo='eye_disease_model.h5',")
    print("       repo_id='your-username/hackloop-eye-disease-model',")
    print("       repo_type='model'")
    print("   )")
    print("\nThe URL format will be:")
    print("https://huggingface.co/your-username/hackloop-eye-disease-model/resolve/main/eye_disease_model.h5")

def upload_to_google_drive():
    """Instructions for uploading to Google Drive"""
    print("=== GOOGLE DRIVE UPLOAD ===")
    print("1. Upload your eye_disease_model.h5 to Google Drive")
    print("2. Right-click the file → Share → Change to 'Anyone with the link'")
    print("3. Copy the sharing link")
    print("4. Convert the link format:")
    print("   From: https://drive.google.com/file/d/FILE_ID/view?usp=sharing")
    print("   To: https://drive.google.com/uc?export=download&id=FILE_ID")

def check_model_exists():
    """Check if the model file exists"""
    model_path = Path("backend/eye_disease_model.h5")
    if not model_path.exists():
        print(f"❌ Model file not found at {model_path}")
        print("Please ensure your model file exists before uploading.")
        return False
    
    size_mb = model_path.stat().st_size / (1024 * 1024)
    print(f"✅ Model file found: {model_path}")
    print(f"📊 File size: {size_mb:.2f} MB")
    return True

def update_vercel_config(model_url):
    """Update vercel.json with the new model URL"""
    vercel_path = Path("vercel.json")
    if not vercel_path.exists():
        print("❌ vercel.json not found")
        return
    
    try:
        import json
        with open(vercel_path, 'r') as f:
            config = json.load(f)
        
        # Update the MODEL_URL environment variable
        if 'env' not in config:
            config['env'] = {}
        
        config['env']['MODEL_URL'] = model_url
        
        with open(vercel_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"✅ Updated vercel.json with MODEL_URL: {model_url}")
    except Exception as e:
        print(f"❌ Failed to update vercel.json: {e}")

def main():
    parser = argparse.ArgumentParser(description="Upload ML model for Vercel deployment")
    parser.add_argument('--platform', choices=['github', 'huggingface', 'gdrive'], 
                       default='github', help="Upload platform")
    parser.add_argument('--url', help="Model URL after upload")
    
    args = parser.parse_args()
    
    print("🚀 HACKLOOP MODEL UPLOAD HELPER")
    print("================================")
    
    if not check_model_exists():
        sys.exit(1)
    
    print(f"\n📤 Upload instructions for {args.platform.upper()}:")
    print("-" * 50)
    
    if args.platform == 'github':
        upload_to_github_releases()
    elif args.platform == 'huggingface':
        upload_to_huggingface()
    elif args.platform == 'gdrive':
        upload_to_google_drive()
    
    if args.url:
        update_vercel_config(args.url)
    else:
        print(f"\n💡 After uploading, run:")
        print(f"python upload_model.py --platform {args.platform} --url YOUR_MODEL_URL")
    
    print("\n🎯 NEXT STEPS:")
    print("1. Upload your model using the instructions above")
    print("2. Update MODEL_URL in vercel.json with your model's public URL")
    print("3. Test the API locally: python api/index.py")
    print("4. Deploy to Vercel: vercel --prod")
    print("\n✨ Your app will now work on Vercel without the 300MB limit!")

if __name__ == "__main__":
    main()