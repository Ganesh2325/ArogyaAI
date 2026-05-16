# 🩺 ArogyaAI: Advanced AI Health Assistant

ArogyaAI is a premium, medical-grade conversational AI triage system designed to provide sophisticated health guidance and risk assessment. Built with a focus on clinical accuracy and high-trust UX, it helps users understand their symptoms and guides them toward appropriate medical actions.

---

## 🌟 Key Features

### 🧠 Advanced AI Triage
* **Conversational Analysis**: Natural language symptom extraction using Google Gemini AI.
* **Clinical Reasoning**: Deep analysis of symptoms, potential causes, and severity.
* **24/7 Reliability**: Robust fallback logic ensures the system works even when external APIs are under high demand.

### 🎨 Premium Medical UX
* **Distraction-Free Chat**: A modern, full-screen conversational interface inspired by ChatGPT/Gemini.
* **High Readability**: Strictly follows a "Black Text on Light Background" design system for clinical trustworthiness.
* **Interactive Results**: Inline triage summaries and a detailed Results Dashboard for deep insights.

### 📁 Smart Attachments
* **Medical Document Upload**: Support for uploading prescriptions, lab reports, and symptom photos for AI analysis.

---

## 🛠️ Technology Stack

### Frontend
* **React (Vite)**: High-performance user interface.
* **Tailwind CSS**: Modern, responsive styling.
* **Lucide React**: Professional medical-grade iconography.

### Backend
* **Laravel 11**: Robust PHP framework for business logic.
* **MySQL/SQLite**: Secure data persistence for consultation history.
* **Google Gemini API**: State-of-the-art LLM for medical reasoning.

---

## 🚀 Quick Start

### 1. Prerequisites
* PHP 8.2+ & Composer
* Node.js 18+ & npm
* Google Gemini API Key

### 2. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
# Configure your GEMINI_API_KEY in .env
php artisan migrate
php artisan serve
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## ⚠️ Medical Disclaimer

**ArogyaAI is for informational purposes only.**
It provides preliminary health guidance and is NOT a substitute for professional medical diagnosis, advice, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

**In case of an emergency, call your local emergency services (911) immediately.**

---

## 👨‍💻 Developed By
Developed with a commitment to making healthcare guidance accessible and intelligent.
