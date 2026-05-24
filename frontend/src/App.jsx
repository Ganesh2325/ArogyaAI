import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ChatInterface from './pages/ChatInterface';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/Dashboard/DashboardHome';
import SymptomScanner from './pages/Dashboard/SymptomScanner';
import HealthAnalytics from './pages/Dashboard/HealthAnalytics';
import RiskPrediction from './pages/Dashboard/RiskPrediction';
import './styles/theme.css';
const PlaceholderModule = ({ title }) => (
  <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B' }}>
    <h2 style={{ color: '#0F172A', marginBottom: '16px' }}>{title}</h2>
    <p>This module is currently under development.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Main Application Shell */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/scanner" element={<SymptomScanner />} />
          <Route path="/analytics" element={<HealthAnalytics />} />
          <Route path="/risks" element={<RiskPrediction />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
