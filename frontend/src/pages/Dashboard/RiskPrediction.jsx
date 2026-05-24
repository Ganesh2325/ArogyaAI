import React, { useState, useEffect } from 'react';
import { Shield, Activity, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import axios from 'axios';
import '../../styles/RiskPrediction.css';

const RiskPrediction = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchForecast(false);
  }, []);

  const fetchForecast = async (forceRefresh) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:8000/api/risk-prediction?refresh=${forceRefresh}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForecast(response.data);
    } catch (error) {
      console.error('Failed to fetch risk forecast', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  if (loading) {
    return (
      <div className="risk-loading">
        <div className="radar-spinner"></div>
        <h3>Scanning Health Patterns...</h3>
        <p>ArogyaAI is analyzing 6 months of your medical data.</p>
      </div>
    );
  }

  if (!forecast) return null;

  const scoreColor = getScoreColor(forecast.health_score);

  return (
    <div className="risk-container">
      <div className="risk-header">
        <div className="header-titles">
          <h2>Risk Prediction Engine</h2>
          <p>AI-driven long-term forecasting based on your holistic medical profile.</p>
        </div>
        <div className="header-actions">
          <span className="last-updated">Last Updated: {forecast.last_updated}</span>
          <button 
            className={`btn-refresh ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchForecast(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} /> {refreshing ? 'Regenerating...' : 'Refresh Forecast'}
          </button>
        </div>
      </div>

      <div className="risk-main-content">
        <div className="score-panel">
          <div className="score-ring" style={{ '--score-color': scoreColor, '--score-deg': `${(forecast.health_score / 100) * 360}deg` }}>
            <div className="score-inner">
              <span className="score-value" style={{ color: scoreColor }}>{forecast.health_score}</span>
              <span className="score-label">Health Score</span>
            </div>
          </div>
          
          <div className="score-status">
            {forecast.health_score >= 80 ? (
              <div className="status-badge optimal"><Shield size={16} /> Optimal Health</div>
            ) : forecast.health_score >= 60 ? (
              <div className="status-badge moderate"><AlertTriangle size={16} /> Moderate Risk Detected</div>
            ) : (
              <div className="status-badge critical"><Activity size={16} /> Critical Action Required</div>
            )}
          </div>
          
          {forecast.cached && (
            <div className="cache-notice">
              <Zap size={14} /> Loaded from secure cache to save API limits.
            </div>
          )}
        </div>

        <div className="analysis-panel">
          <div className="analysis-section breakdown-section">
            <div className="section-header">
              <TrendingUp size={20} className="icon-blue" />
              <h3>AI Risk Breakdown</h3>
            </div>
            <div className="markdown-box">
              <p>{forecast.forecast_data.breakdown}</p>
            </div>
          </div>

          <div className="analysis-section actions-section">
            <div className="section-header">
              <CheckCircle2 size={20} className="icon-green" />
              <h3>Recommended Preventative Actions</h3>
            </div>
            <div className="action-list">
              {forecast.forecast_data.preventative_actions.split('\n').map((action, idx) => {
                const cleanedAction = action.replace(/^[-*]\s*/, '').trim();
                if (!cleanedAction) return null;
                return (
                  <div key={idx} className="action-item">
                    <div className="action-bullet"></div>
                    <p>{cleanedAction}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskPrediction;
