# Dristi AI - Eye Disease Detection System

## Setup Instructions

### Prerequisites
- Python 3.8+ (tested with Python 3.13)
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to the project directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment (recommended):**
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install flask flask-cors flask-jwt-extended flask-sqlalchemy flask-bcrypt python-dotenv flask-mail openai pillow
   ```

4. **Run the backend server:**
   ```bash
   python app.py
   ```

   The backend will start at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will start at `http://localhost:3000`

### Current Status

✅ **Backend**: Working in demo mode
- All API endpoints functional
- Authentication system working
- Database models configured
- Running without ML dependencies for demo purposes

✅ **Frontend**: Basic structure ready
- Next.js 15 with React 19
- TailwindCSS configured
- Component structure in place

⚠️ **ML Models**: Currently in demo mode
- No actual ML model files present
- Backend returns simulated predictions
- Ready for ML model integration when available

### API Endpoints

- `GET /health` - Backend health check
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /predict` - Eye disease prediction (demo mode)
- `POST /ishihara/test` - Color blindness test
- `GET /ishihara/plates` - Get test plates

### Development Notes

1. **ML Models**: To enable actual ML predictions, add the following files to the `backend/` directory:
   - `eye_disease_model.h5` - TensorFlow model for eye disease detection
   - Install additional dependencies: `numpy`, `tensorflow`, `opencv-python-headless`

2. **Environment Variables**: Create a `.env` file in the backend directory:
   ```
   SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret
   DATABASE_URL=sqlite:///hackloop_medical.db
   ```

3. **Database**: SQLite database will be created automatically on first run

### Deployment Cleaned Up

All unnecessary deployment files have been removed:
- ❌ Multiple deployment scripts
- ❌ Docker configurations
- ❌ Cloud platform configs
- ❌ Redundant requirement files

### Next Steps

1. **Add ML Models**: Place trained models in backend directory
2. **Install ML Dependencies**: Add numpy, tensorflow, opencv when ready
3. **Environment Setup**: Configure production environment variables
4. **Testing**: Add unit tests for critical components