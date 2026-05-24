import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, HeartPulse, Stethoscope, ChevronRight, BarChart2, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import axios from 'axios';
import '../../styles/HealthAnalytics.css';

const HealthAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:8000/api/analytics/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <Activity size={48} className="spinner" />
        <p>Loading your health metrics...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Health Analytics</h2>
        <p>Your comprehensive health overview based on past consultations and symptom scans.</p>
      </div>

      <div className="overview-cards">
        <div className="metric-card">
          <div className="metric-icon blue"><Activity size={24} /></div>
          <div className="metric-content">
            <h4>Total Scans</h4>
            <h2>{data.overview.total_scans}</h2>
            <p>Lifetime symptom scans</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon red"><ShieldAlert size={24} /></div>
          <div className="metric-content">
            <h4>Active Risks</h4>
            <h2>{data.overview.active_risks}</h2>
            <p>High risk issues (Last 30 Days)</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green"><Stethoscope size={24} /></div>
          <div className="metric-content">
            <h4>Recent Consults</h4>
            <h2>{data.overview.recent_consultations}</h2>
            <p>Consultations (Last 30 Days)</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Risk Assessment Timeline</h3>
            <p>Your AI triage risk levels over the past 6 months.</p>
          </div>
          <div className="chart-wrapper line-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeline} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="Routine" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="High Risk" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Symptom Frequency</h3>
            <p>Most common symptoms identified.</p>
          </div>
          <div className="chart-wrapper radar-chart-wrapper">
            {data.symptoms && data.symptoms.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.symptoms}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                  <Radar name="Symptoms" dataKey="A" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.5} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <BarChart2 size={32} />
                <p>Not enough data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthAnalytics;
