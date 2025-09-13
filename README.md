# 🔬 Hackloop - AI-Powered Eye Disease Detection

An advanced web application for detecting eye diseases from fundus images using deep learning models, featuring color blindness testing and comprehensive medical analysis.

## 🌟 Features

- **Eye Disease Detection**: Detect 8 types of eye diseases from fundus images
- **Color Blindness Testing**: Ishihara plate-based color vision assessment
- **AI Explanations**: Explainable AI with heatmap visualizations
- **Medical Reports**: PDF report generation with detailed analysis
- **User Authentication**: Secure login and user management
- **Real-time Chat**: AI-powered medical chatbot assistance

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/hackloop)

### One-Click Deployment

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account and import the repository
3. Configure environment variables (see [Environment Variables](#environment-variables))
4. Deploy!

### Manual Deployment

1. **Fork/Clone this repository**
2. **Push to your GitHub account**
3. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
4. **Import your repository**
5. **Configure environment variables**
6. **Deploy**

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)




### Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hackloop.git
   cd hackloop
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
Hackloop/
├── frontend/              # Next.js React application
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   └── lib/              # Utility functions
├── backend/              # Flask API server
│   ├── app.py           # Main Flask application
│   ├── models.py        # Database models
│   └── auth_routes.py   # Authentication routes
├── api/                  # Vercel serverless functions
├── vercel.json          # Vercel deployment configuration
└── DEPLOYMENT_GUIDE.md  # Detailed deployment instructions
```

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: TailwindCSS
- **UI Components**: Radix UI + Custom components
- **Animations**: Framer Motion
- **Charts**: Recharts
- **TypeScript**: Full type safety

### Backend
- **Framework**: Flask (Python)
- **Database**: SQLAlchemy with SQLite/PostgreSQL
- **Authentication**: JWT with Flask-JWT-Extended
- **ML Models**: TensorFlow/Keras
- **Image Processing**: Pillow
- **API**: RESTful design

### Deployment
- **Platform**: Vercel (Full-stack)
- **Frontend**: Static generation
- **Backend**: Serverless functions
- **Database**: SQLite (dev) / PostgreSQL (prod)


## 📚 API Documentation

### Health Check
```http
GET /api/health
```

### Eye Disease Prediction
```http
POST /api/predict
Content-Type: multipart/form-data

Body:
- image: fundus image file
```

### Color Blindness Test
```http
POST /api/ishihara/test
Content-Type: application/json

Body:
{
  "responses": ["1", "2", "3", ...]
}
```

### Authentication
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

## 🎯 Supported Disease Classes

1. **Normal (N)** - Healthy retina
2. **Diabetes (D)** - Diabetic retinopathy
3. **Glaucoma (G)** - Glaucomatous changes
4. **Cataract (C)** - Lens opacity
5. **Age-related Macular Degeneration (A)** - AMD
6. **Hypertension (H)** - Hypertensive retinopathy
7. **Pathological Myopia (M)** - High myopia changes
8. **Other diseases (O)** - Other retinal conditions

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Secure configuration management

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, create an issue on GitHub or contact the development team.

---

**⚠️ Medical Disclaimer**: This application is for educational and research purposes only. Always consult qualified medical professionals for actual medical diagnosis and treatment.
