# ML Model Upload Instructions for Vercel Deployment

## Overview
The eye disease detection model (`eye_disease_model.h5`) is **222.07 MB** and needs to be hosted externally due to Vercel's 300MB deployment limit.

## Current Status
- ✅ Code pushed to GitHub repository: `https://github.com/iamsoura005/Dristi_Ai.git`
- ✅ vercel.json configured with model URL
- ⏳ **NEXT STEP**: Upload ML model to GitHub Releases

## Step-by-Step Model Upload Process

### 1. Create GitHub Release
1. Go to your repository: `https://github.com/iamsoura005/Dristi_Ai`
2. Click on **"Releases"** tab (on the right side)
3. Click **"Create a new release"**

### 2. Configure Release
- **Tag version**: `v1.0.0`
- **Release title**: `Hackloop v1.0.0 - Eye Disease Detection Model`
- **Description**: 
  ```
  Initial release of Hackloop - AI-Powered Eye Disease Detection System
  
  This release includes the trained ML model (eye_disease_model.h5) for:
  - Eye disease detection (8 classes)
  - Color blindness testing
  - Explainable AI with heatmaps
  
  Model size: 222.07 MB
  ```

### 3. Upload Model File
1. In the release creation page, scroll down to **"Attach binaries"**
2. Click **"choose your files"** or drag and drop
3. Upload: `backend/eye_disease_model.h5`
4. Wait for upload to complete (may take a few minutes due to file size)
5. Click **"Publish release"**

### 4. Verify Model URL
After publishing, the model will be available at:
```
https://github.com/iamsoura005/Dristi_Ai/releases/download/v1.0.0/eye_disease_model.h5
```

This URL is already configured in `vercel.json` under the `MODEL_URL` environment variable.

## Alternative Upload Methods

### Option A: GitHub CLI (if available)
```bash
# Install GitHub CLI: https://cli.github.com/
gh release create v1.0.0 backend/eye_disease_model.h5 \
  --title "Hackloop v1.0.0 - Eye Disease Detection Model" \
  --notes "Initial release with ML model for eye disease detection"
```

### Option B: Hugging Face (backup option)
```bash
pip install huggingface_hub
huggingface-cli login
# Create repository on huggingface.co/new
# Upload model via web interface or CLI
```

## Verification Steps

### 1. Test Model Download
```bash
# Test if model URL works
curl -I https://github.com/iamsoura005/Dristi_Ai/releases/download/v1.0.0/eye_disease_model.h5
```

### 2. Local API Test
```bash
cd api
python index.py
# Test at http://localhost:5000
```

### 3. Deploy to Vercel
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy
vercel --prod
```

## Post-Deployment Checklist
- [ ] Model uploaded to GitHub Releases
- [ ] Model URL accessible publicly
- [ ] vercel.json updated with correct MODEL_URL
- [ ] Local API test successful
- [ ] Vercel deployment successful
- [ ] Production API endpoints working

## Troubleshooting

### Model Download Issues
- Ensure the release is **public** (not draft)
- Check file name matches exactly: `eye_disease_model.h5`
- Verify URL format is correct

### Vercel Deployment Issues
- Check Vercel function logs for model loading errors
- Ensure MODEL_URL environment variable is set
- Verify memory allocation (3008MB) is sufficient

## Final Deployment Commands
After model upload is complete, run:

```bash
# Commit the updated vercel.json
git add vercel.json
git commit -m "Update MODEL_URL with GitHub Releases link"
git push origin main

# Deploy to Vercel
vercel --prod
```

---

**Next Step**: Please follow the GitHub Release creation steps above to upload the ML model, then proceed with Vercel deployment.