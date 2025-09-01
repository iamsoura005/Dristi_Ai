# PowerShell script to set up GitHub repository for Hackloop deployment
# Run this script to initialize Git and push to GitHub

Write-Host "🚀 HACKLOOP GITHUB SETUP" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Check if git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check if we're already in a git repository
if (Test-Path ".git") {
    Write-Host "📁 Git repository already exists" -ForegroundColor Yellow
} else {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Cyan
    git init
}

# Add all files (respecting .gitignore)
Write-Host "📦 Adding files to Git..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Committing changes..." -ForegroundColor Cyan
    git commit -m "Optimize Hackloop for Vercel deployment - Remove large files, add external model loading"
} else {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
}

# Check if remote origin exists
$remotes = git remote -v
if ($remotes -match "origin") {
    Write-Host "🔗 Remote origin already configured" -ForegroundColor Yellow
    Write-Host "Current remotes:" -ForegroundColor Cyan
    git remote -v
} else {
    Write-Host "🔗 Setting up GitHub remote..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please follow these steps:" -ForegroundColor Yellow
    Write-Host "1. Go to https://github.com/new" -ForegroundColor White
    Write-Host "2. Create a new repository named 'hackloop'" -ForegroundColor White
    Write-Host "3. Don't initialize with README (we already have one)" -ForegroundColor White
    Write-Host "4. Copy the repository URL" -ForegroundColor White
    Write-Host ""
    
    $repoUrl = Read-Host "Enter your GitHub repository URL (https://github.com/username/hackloop.git)"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✅ Remote origin added: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No repository URL provided. You can add it later with:" -ForegroundColor Yellow
        Write-Host "git remote add origin https://github.com/username/hackloop.git" -ForegroundColor White
    }
}

# Push to GitHub
if (git remote -v | Select-String "origin") {
    Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
    
    # Check if main branch exists on remote
    $branches = git branch -r
    if ($branches -match "origin/main") {
        git push origin main
    } else {
        # First push
        git branch -M main
        git push -u origin main
    }
    
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "⚠️ No remote configured. Please set up GitHub remote first." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Green
Write-Host "1. Upload your ML model to external storage:" -ForegroundColor White
Write-Host "   python upload_model.py --platform github" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Update MODEL_URL in vercel.json with your model's public URL" -ForegroundColor White
Write-Host ""
Write-Host "3. Test your deployment:" -ForegroundColor White
Write-Host "   python test_deployment.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Deploy to Vercel:" -ForegroundColor White
Write-Host "   - Go to https://vercel.com" -ForegroundColor Cyan
Write-Host "   - Import your GitHub repository" -ForegroundColor Cyan
Write-Host "   - Deploy automatically!" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Your optimized Hackloop is ready for deployment!" -ForegroundColor Green