import React, { useState, useEffect } from 'react';
import { Activity, Clock, Heart, ArrowRight, Camera, MapPin, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../../styles/DashboardHome.css';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    user: { first_name: '', name: '' },
    health_metrics: { score: 85, risk_level: 'Low', status: 'Healthy', trend: 'Calculating...' },
    recent_consultation: null,
    insights: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get('http://localhost:8000/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const quickActions = [
    { name: 'Start Consultation', icon: Activity, path: '/chat', color: '#2563EB', bg: '#EFF6FF' },
    { name: 'Symptom Scanner', icon: Camera, path: '/scanner', color: '#8B5CF6', bg: '#F5F3FF' },
    { name: 'Analytics', icon: Activity, path: '/analytics', color: '#EF4444', bg: '#FEF2F2' },
  ];

  if (loading) {
    return (
      <div className="dashboard-home" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const { user, health_metrics, recent_consultation, insights } = data;

  return (
    <div className="dashboard-home">
      <header className="dash-header">
        <h1>Welcome back, {user.first_name || 'User'}</h1>
        <p>Here is your daily health overview.</p>
      </header>

      <div className="dash-grid">
        {/* Main Column */}
        <div className="dash-main-col">

          <div className="health-overview-card">
            <div className="card-header">
              <h3>Health Score</h3>
              <span className={`status-badge ${health_metrics.status.toLowerCase().replace(' ', '-')}`}>
                {health_metrics.status}
              </span>
            </div>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-number">{health_metrics.score}</span>
                <span className="score-max">/100</span>
              </div>
              <div className="score-details">
                <p className="detail-label">Risk Level</p>
                <p className={`detail-value ${health_metrics.risk_level === 'High' ? 'text-red' : health_metrics.risk_level === 'Medium' ? 'text-orange' : 'text-green'}`}>
                  {health_metrics.risk_level}
                </p>
                <p className="detail-label mt-2">Trend</p>
                <p className="detail-value text-blue">{health_metrics.trend}</p>
              </div>
            </div>
          </div>

          <div className="section-title-wrapper">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map((action, i) => (
              <div key={i} className="action-card" onClick={() => navigate(action.path)}>
                <div className="action-icon" style={{ backgroundColor: action.bg, color: action.color }}>
                  <action.icon size={24} />
                </div>
                <span className="action-name">{action.name}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Side Column */}
        <div className="dash-side-col">

          <div className="side-card">
            <div className="card-header">
              <h3>Recent Consultation</h3>
            </div>

            {recent_consultation ? (
              <div className="consultation-details">
                <div className="symptom-tag-container">
                  {recent_consultation.symptoms.split(',').map((s, i) => (
                    <span key={i} className="symptom-tag">{s.trim()}</span>
                  ))}
                </div>
                <div className="consult-risk">
                  <span className="label">Risk Category:</span>
                  <span className={`value ${recent_consultation.risk === 'High' || recent_consultation.risk === 'Emergency' ? 'text-red' : recent_consultation.risk === 'Medium' ? 'text-orange' : 'text-green'}`}>
                    {recent_consultation.risk}
                  </span>
                </div>
                <div className="consult-action">
                  <p>{recent_consultation.action}</p>
                </div>
                <button className="continue-btn" onClick={() => navigate('/chat')}>
                  New Consultation <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="consultation-details empty-state-dash">
                <p>You have no recent consultations.</p>
                <button className="continue-btn" onClick={() => navigate('/chat')} style={{ marginTop: '16px' }}>
                  Start Consultation <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="side-card insights-card">
            <div className="card-header">
              <h3>AI Health Insights</h3>
              <Heart size={16} className="text-blue" />
            </div>

            {insights && insights.length > 0 ? (
              <ul className="insights-list">
                {insights.map((insight, index) => (
                  <li key={index}>
                    <div className={`insight-dot ${insight.color}`}></div>
                    <p dangerouslySetInnerHTML={{ __html: insight.text }}></p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-insights">No insights available right now.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
