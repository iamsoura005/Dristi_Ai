# Hackloop Vercel Deployment Guide

## 🚀 Deploy Full Stack App on Vercel

This guide explains how to deploy both the Next.js frontend and Flask backend on Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Prepare your production environment variables

## 🛠️ Deployment Steps

### Step 1: Prepare Your Repository

1. Ensure all files are committed to your GitHub repository
2. Your project structure should look like this:
   ```
   Hackloop/
   ├── frontend/          # Next.js app
   ├── backend/           # Flask API
   ├── api/               # Vercel serverless functions
   ├── vercel.json        # Vercel configuration
   ├── .env.example       # Environment variables template
   └── DEPLOYMENT_GUIDE.md
   ```

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

2. **Important**: Never commit `.env` to your repository!

### Step 3: Deploy to Vercel

#### Method 1: Vercel Dashboard (Recommended)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Next.js project
5. Configure environment variables in Vercel dashboard:
   - Go to Settings → Environment Variables
   - Add all variables from your `.env` file

#### Method 2: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to configure your deployment

### Step 4: Environment Variables Setup

Add these environment variables in Vercel dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | `your-secret-key-here` |
| `JWT_SECRET_KEY` | JWT signing key | `your-jwt-secret-here` |
| `DATABASE_URL` | Database connection | `sqlite:///hackloop.db` |
| `OPENROUTER_API_KEY` | AI API key | `sk-or-v1-...` |
| `MAIL_SERVER` | Email server | `smtp.gmail.com` |
| `MAIL_PORT` | Email port | `587` |
| `MAIL_USERNAME` | Email username | `your-email@gmail.com` |
| `MAIL_PASSWORD` | Email password | `your-app-password` |

### Step 5: Configure Frontend API Calls

Update your frontend API calls to use the correct base URL:

```typescript
// In your frontend components
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000';

// Example API call
const response = await fetch(`${API_BASE}/predict`, {
  method: 'POST',
  body: formData
});
```

## 📁 File Structure Explanation

### `vercel.json`
Configures how Vercel builds and routes your application:
- **Builds**: Specifies Next.js frontend and Python backend
- **Routes**: Routes `/api/*` to backend, everything else to frontend
- **Functions**: Sets timeout limits for serverless functions

### `api/index.py`
Entry point for Vercel serverless functions, imports your Flask app.

### `backend/requirements.txt`
Lists all Python dependencies needed for the backend.

## 🔧 Troubleshooting

### Common Issues:

1. **Build Errors**:
   - Check that all dependencies are in `requirements.txt`
   - Verify Python version compatibility

2. **API Route Issues**:
   - Ensure `vercel.json` routes are correctly configured
   - Check that API calls use `/api/` prefix in production

3. **Model Loading Issues**:
   - Large model files (>50MB) may need to be stored externally
   - Consider using model compression or external storage

4. **Database Issues**:
   - SQLite works for development but consider PostgreSQL for production
   - Add database service like Vercel Postgres for production

### Performance Optimization:

1. **Serverless Function Limits**:
   - Max execution time: 30 seconds (configurable)
   - Max memory: 1GB
   - Consider breaking large operations into smaller functions

2. **Model Loading**:
   - Cache models between function invocations
   - Use lighter model formats if possible

## 🌐 Custom Domain (Optional)

1. In Vercel dashboard → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## 📊 Monitoring

- View deployment logs in Vercel dashboard
- Monitor function performance and errors
- Set up alerts for critical issues

## 🔒 Security Considerations

1. **Environment Variables**: Never expose sensitive data
2. **CORS**: Configure proper CORS origins for production
3. **Rate Limiting**: Consider adding rate limiting to API endpoints
4. **Input Validation**: Ensure all user inputs are properly validated

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Python on Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/python)

---

## 🚨 Important Notes

- **Model Files**: If your model files are large (>50MB), you may need to host them externally
- **Database**: Consider upgrading to a hosted database for production
- **Monitoring**: Set up proper logging and monitoring for production use
- **Testing**: Always test your deployment thoroughly before going live

Happy deploying! 🎉