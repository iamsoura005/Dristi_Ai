# 👁️ Dristi AI
<div align="center">

![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=28&duration=3000&pause=1000&color=00D4FF&center=true&vCenter=true&width=600&lines=Advanced+Eye+Disease+Detection;AI-Powered+Medical+Analysis;Color+Blindness+Testing;Explainable+AI+with+Heatmaps)

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="700">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/iamsoura005/Dristi_Ai)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)
[![GitHub Stars](https://img.shields.io/github/stars/iamsoura005/Dristi_Ai?style=for-the-badge&color=yellow)](https://github.com/iamsoura005/Dristi_Ai/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/iamsoura005/Dristi_Ai?style=for-the-badge&color=blue)](https://github.com/iamsoura005/Dristi_Ai/network)

</div>

## 🌟 What is Dristi AI?

**Dristi AI** is a cutting-edge web application that revolutionizes eye healthcare through artificial intelligence. Named after the Sanskrit word for "vision," our platform combines advanced deep learning models with intuitive user experience to provide comprehensive eye disease detection and analysis.

<div align="center">

```mermaid
graph TD
    A[📸 Upload Fundus Image] --> B[🧠 AI Analysis]
    B --> C[🔍 Disease Detection]
    B --> D[🎨 Heatmap Generation]
    C --> E[📄 Medical Report]
    D --> E
    E --> F[💬 AI Consultation]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#fff3e0
    style D fill:#f1f8e9
    style E fill:#fce4ec
    style F fill:#e8f5e8
```

</div>

## ✨ Features That Set Us Apart

<table>
<tr>
<td width="50%">

### 🎯 Core Capabilities
- **🔬 8 Eye Disease Detection**
  - Normal, Diabetes, Glaucoma, Cataract
  - AMD, Hypertension, Myopia, Others
- **🌈 Color Blindness Testing**
  - Ishihara plate-based assessment
- **🧠 Explainable AI**
  - Heatmap visualizations
- **📋 Medical Reports**
  - PDF generation with analysis

</td>
<td width="50%">

### 🛠️ Advanced Features  
- **🔐 User Authentication**
  - Secure login system
- **💬 AI Chatbot**
  - Real-time medical assistance
- **📊 Analytics Dashboard**
  - Comprehensive health insights  
- **🌐 Cross-Platform**
  - Web, mobile responsive

</td>
</tr>
</table>

## 🚀 Quick Start

<div align="center">

### Option 1: Deploy with Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/iamsoura005/Dristi_Ai)

### Option 2: Local Development

</div>

```bash
# 📥 Clone the repository
git clone https://github.com/iamsoura005/Dristi_Ai.git
cd Dristi_Ai

# 🔧 Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

# 🎨 Frontend Setup (New Terminal)
cd frontend
npm install
npm run dev

# 🌐 Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

## 🏗️ Architecture

<div align="center">

```
🏠 Dristi AI Architecture
┌─────────────────────────────────────────────────────────┐
│                    🌐 Frontend (Next.js)                │
├─────────────────────────────────────────────────────────┤
│  📱 React Components  │  🎨 TailwindCSS  │  ⚡ Framer   │
│  🔄 State Management  │  📊 Recharts     │  🔧 TypeScript│
├─────────────────────────────────────────────────────────┤
│                    🔗 API Layer                         │
├─────────────────────────────────────────────────────────┤
│                   ⚙️ Backend (Flask)                    │
├─────────────────────────────────────────────────────────┤
│  🧠 ML Models  │  🗃️ Database   │  🔐 Authentication    │
│  🖼️ Image Proc │  📄 PDF Gen    │  💬 Chat System      │
└─────────────────────────────────────────────────────────┘
```

</div>

## 🛠️ Tech Stack

<div align="center">

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Backend
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

### Deployment
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

## 📊 API Endpoints

<details>
<summary>🔍 <strong>Click to expand API documentation</strong></summary>

### 🏥 Medical Analysis
```http
POST /api/predict
Content-Type: multipart/form-data
Body: image (fundus image file)
```

### 🌈 Color Blindness Test
```http
POST /api/ishihara/test
Content-Type: application/json
Body: {"responses": ["1", "2", "3", ...]}
```

### 🔐 Authentication
```http
POST /api/auth/register
POST /api/auth/login  
POST /api/auth/logout
```

### 🔍 Health Check
```http
GET /api/health
```

</details>

## 🎯 Supported Eye Conditions

<div align="center">

| 🏥 Condition | 📝 Code | 🔍 Description |
|--------------|---------|----------------|
| ✅ Normal | N | Healthy retina |
| 🩸 Diabetes | D | Diabetic retinopathy |
| 👁️ Glaucoma | G | Glaucomatous changes |
| 🌫️ Cataract | C | Lens opacity |
| 🎯 AMD | A | Age-related Macular Degeneration |
| 💓 Hypertension | H | Hypertensive retinopathy |
| 🔍 Myopia | M | Pathological myopia changes |
| 🔬 Others | O | Other retinal conditions |

</div>

## 🔒 Security Features

- 🛡️ **JWT Authentication**: Secure token-based auth
- 🧹 **Input Validation**: Comprehensive sanitization  
- 🌐 **CORS Configuration**: Secure cross-origin requests
- ⚙️ **Environment Variables**: Secure config management
- 🔐 **Data Encryption**: Protected user information

## 🤝 Contributing

We love contributions! Here's how you can help make Dristi AI even better:

<div align="center">

```mermaid
gitGraph
    commit id: "🍴 Fork"
    branch feature
    checkout feature
    commit id: "✨ Feature"
    commit id: "🧪 Test"
    checkout main
    merge feature
    commit id: "🚀 Deploy"
```

</div>

1. 🍴 **Fork** the repository
2. 🌿 **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. 💾 **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. 📤 **Push** to the branch (`git push origin feature/AmazingFeature`)
5. 🔄 **Open** a Pull Request

<div align="center">

### 🌟 Contributors

[![Contributors](https://contrib.rocks/image?repo=iamsoura005/Dristi_Ai)](https://github.com/iamsoura005/Dristi_Ai/graphs/contributors)

</div>

## 📈 Project Stats

<div align="center">

![GitHub repo size](https://img.shields.io/github/repo-size/iamsoura005/Dristi_Ai?style=for-the-badge&color=orange)
![GitHub last commit](https://img.shields.io/github/last-commit/iamsoura005/Dristi_Ai?style=for-the-badge&color=green)
![GitHub issues](https://img.shields.io/github/issues/iamsoura005/Dristi_Ai?style=for-the-badge&color=red)
![GitHub pull requests](https://img.shields.io/github/issues-pr/iamsoura005/Dristi_Ai?style=for-the-badge&color=blue)

</div>

## 🎖️ Achievements

<div align="center">

[![Hackathon Winner](https://img.shields.io/badge/🏆%20Hackathon-Winner-gold?style=for-the-badge)](https://github.com/iamsoura005/Dristi_Ai)
[![AI Innovation](https://img.shields.io/badge/🧠%20AI-Innovation-purple?style=for-the-badge)](https://github.com/iamsoura005/Dristi_Ai)
[![Healthcare Tech](https://img.shields.io/badge/🏥%20Healthcare-Technology-teal?style=for-the-badge)](https://github.com/iamsoura005/Dristi_Ai)

</div>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">

---

### 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=iamsoura005/Dristi_Ai&type=Timeline)](https://star-history.com/#iamsoura005/Dristi_Ai&Timeline)

---

<img src="https://user-images.githubusercontent.com/74038190/212284087-bbe7e430-757e-4901-90bf-4cd2ce3e1852.gif" width="100">

**Made with ❤️ for better eye healthcare**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/iamsoura005/Dristi_Ai)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:contact@dristiai.com)

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="900">

</div>
