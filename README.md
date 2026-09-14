# SmartTraffic AI - Data-Driven Traffic Volume Prediction Platform

> Advanced Smart City Traffic Intelligence, Analytics, and ML Prediction Engine for the I-94 Metro Interstate Corridor.

---

## 🚦 Project Overview

**SmartTraffic AI** is an enterprise-grade, data-driven traffic prediction system and analytics platform. Built on historical traffic volume data from the UCI Metro Interstate Traffic Volume dataset, the platform delivers real-time machine learning predictions, interactive traffic spatial visualizations, automated data cleaning pipelines, and customizable PDF intelligence reports.

---

## ✨ Key Features

- 📊 **Executive Dashboard**: Real-time traffic KPIs, peak congestion window analysis, dataset summary stats, and interactive density charts.
- 🔮 **Machine Learning Prediction Engine**: Predicts hourly traffic volume based on weather conditions (temperature, rain, snow, cloud coverage), hour of the day, day of the week, and holiday events.
- 🧹 **Automated Data Cleaning & Auditing**: Transparent records tracking, outlier removal, missing value imputations, and preprocessing metrics.
- 🗺️ **Interactive GIS Traffic Map**: Live spatial corridor monitoring with dynamic congestion color coding (Low, Moderate, Heavy, Severe).
- 🏆 **Model Management & Leaderboard**: Compare model performances (XGBoost, Random Forest, Linear Regression) with live active model switching.
- 📄 **Custom Reports & Exporting**: Generate comprehensive PDF and print-ready traffic intelligence reports.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4, Lucide Icons, Glassmorphism UX
- **Data Visualization**: Recharts, Leaflet / React-Leaflet
- **Animations**: Framer Motion, Three.js
- **State Management**: Zustand
- **Internationalization**: i18next (Multi-language support)

### **Backend**
- **Framework**: Python FastAPI
- **Database**: SQLite / SQLAlchemy ORM
- **Machine Learning**: Scikit-Learn, XGBoost, Joblib, Pandas, NumPy
- **Server**: Uvicorn ASGI Server

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone the Repository
```bash
git clone https://github.com/MahithaReddy28/Traffic_Prediction.git
cd Traffic_Prediction
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
# Activate virtual environment (Windows)
.\venv\Scripts\activate
# Activate virtual environment (macOS/Linux)
# source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt # or pip install fastapi uvicorn sqlalchemy scikit-learn xgboost pandas numpy joblib

# Start Backend Server
uvicorn backend.app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000` (Docs at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at `http://localhost:3000`.

---

## 📝 License

This project is licensed under the MIT License.
