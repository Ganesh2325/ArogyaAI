import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Activity, ArrowLeft } from 'lucide-react';
import '../styles/theme.css';

import axios from 'axios';
import { useLocation } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/login', formData);
      console.log('Login success:', response.data);
      // Store token
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Redirect to chat
      navigate('/chat');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button onClick={() => navigate('/')} className="back-btn">
          <ArrowLeft size={18} /> <span>Back</span>
        </button>
        <div className="auth-header">
          <div className="icon-box">
            <Activity className="icon-blue" size={32} />
          </div>
          <h2>Welcome Back</h2>
          <p>Securely access your healthcare profile.</p>
          {successMessage && <div className="success-alert">{successMessage}</div>}
          {error && <div className="error-alert">{error}</div>}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-field">
            <label>Email Address</label>
            <div className="input-group">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="input-field">
            <label>Password</label>
            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? 'Logging In...' : 'Log In'} <LogIn size={20} />
          </button>
        </form>

        <div className="auth-footer">
          <p>New to ArogyaAI? <Link to="/signup" className="accent-link">Create Account</Link></p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff; /* Pure white background */
          padding: 40px 20px;
        }

        .auth-card {
          width: 100%;
          max-width: 480px;
          padding: 60px 50px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          background: #ffffff;
          border: 1px solid #e2e8f0; /* Subtle border */
          border-radius: 20px;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.04);
        }

        .auth-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .icon-box {
          width: 60px;
          height: 60px;
          background: #f0f9ff;
          color: #2563eb;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-header h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a; /* Black/Dark Navy text */
          margin: 0;
        }

        .auth-header p {
          color: #64748b;
          font-size: 1rem;
          margin: 0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-field label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #334155;
          margin-left: 2px;
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: #94a3b8;
        }

        input {
          width: 100%;
          padding: 14px 14px 14px 48px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #0f172a;
          font-size: 1rem;
          transition: all 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .auth-btn {
          width: 100%;
          justify-content: center;
          padding: 16px;
          font-size: 1.1rem;
          margin-top: 10px;
          gap: 12px;
          background: #2563eb; /* Primary Blue */
        }

        .auth-footer {
          text-align: center;
          font-size: 1rem;
          color: #64748b;
          border-top: 1px solid #f1f5f9;
          padding-top: 30px;
        }

        .accent-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 700;
        }

        .accent-link:hover {
          text-decoration: underline;
        }

        .icon-blue { color: #2563eb; }

        .back-btn {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .back-btn:hover {
          color: #2563eb;
          background: #f1f5f9;
        }

        .auth-card {
          position: relative;
        }

        .error-alert {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          width: 100%;
          border: 1px solid #fee2e2;
          margin-top: 10px;
        }

        .success-alert {
          background: #f0fdf4;
          color: #16a34a;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          width: 100%;
          border: 1px solid #dcfce7;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
