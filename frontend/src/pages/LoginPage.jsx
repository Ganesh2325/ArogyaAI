import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Activity, Shield, Bot, MapPin, ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/login', formData);
      setSuccess(true);
      // Store token
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <div className="login-layout">
      {/* Left Branding Panel (52%) */}
      <div className="branding-panel">
        <div className="branding-content">
          <button onClick={() => navigate('/')} className="back-btn-inline">
            <ArrowLeft size={18} /> Back to Home
          </button>

          <h1 className="hero-headline">Welcome Back To ArogyaAI</h1>
          <p className="hero-subtext">
            Continue your secure health journey with AI-powered clinical guidance and intelligent symptom analysis.
          </p>

          <div className="trust-badges">
            <div className="badge-item">
              <div className="badge-icon-wrap bg-blue-light"><Shield size={24} className="icon-blue" /></div>
              <span>HIPAA Inspired Security</span>
            </div>
            <div className="badge-item">
              <div className="badge-icon-wrap bg-teal-light"><Bot size={24} className="icon-teal" /></div>
              <span>AI Medical Assistant</span>
            </div>
            <div className="badge-item">
              <div className="badge-icon-wrap bg-cyan-light"><MapPin size={24} className="icon-cyan" /></div>
              <span>Smart Care Recommendations</span>
            </div>
          </div>

          <div className="illustration-wrapper">
            <img src="/login-illustration.png" alt="Healthcare Illustration" className="medical-illustration" />
          </div>
        </div>
      </div>

      {/* Right Form Panel (48%) */}
      <div className="form-panel">
        <div className="form-card">

          <div className="form-header">
            <div className="mobile-logo-container">
              <Activity className="brand-icon" size={28} />
              <span className="brand-name">Arogya<span className="brand-accent">AI</span></span>
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to access your consultations and health insights.</p>
          </div>

          {successMessage && <div className="success-alert">{successMessage}</div>}
          {error && <div className="error-alert shake-animation">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">

            <div className="input-field">
              <label>Email Address</label>
              <div className="input-wrapper">
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
              <div className="input-wrapper">
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className={`submit-btn ${loading ? 'loading' : ''} ${success ? 'success' : ''}`} disabled={loading || success}>
              {loading ? <span className="spinner"></span> : (success ? 'Signed In' : 'Sign In Securely')}
            </button>
          </form>

          <p className="signup-link">
            New to ArogyaAI? <Link to="/signup">Create New Account</Link>
          </p>

        </div>
      </div>

      <style jsx>{`
        /* Colors */
        :root {
          --primary-blue: #2563EB;
          --medical-teal: #14B8A6;
          --soft-cyan: #38BDF8;
          --bg-light: #F8FAFC;
          --text-dark: #0F172A;
          --text-secondary: #64748B;
          --white: #FFFFFF;
        }

        .login-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-light);
          font-family: 'Inter', sans-serif;
        }

        /* LEFT SIDE */
        .branding-panel {
          flex: 0 0 52%;
          background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
          padding: 60px 80px;
          display: flex;
          flex-direction: column;
          justify-content: center; /* Center vertically */
          position: relative;
          overflow: hidden;
        }

        .back-btn-inline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(0,0,0,0.05);
          padding: 12px 20px;
          border-radius: 100px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
          margin-bottom: 40px;
        }

        .back-btn-inline:hover {
          background: var(--white);
          color: var(--primary-blue);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .branding-content {
          max-width: 600px;
          position: relative;
          z-index: 2;
          margin: 0 auto;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px; /* Logo -> Headline: 40px */
        }

        .mobile-logo-container {
           display: none;
           align-items: center;
           justify-content: center;
           gap: 12px;
           margin-bottom: 24px;
        }

        .brand-icon { color: var(--primary-blue); }
        
        .brand-name {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-dark);
          letter-spacing: -0.5px;
        }

        .brand-accent { color: var(--medical-teal); }

        .hero-headline {
          font-size: 60px; /* 56-64px requested */
          font-weight: 800;
          color: var(--text-dark);
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 24px; /* Headline -> Description: 24px */
        }

        .hero-subtext {
          font-size: 20px; /* 20px requested */
          color: var(--text-secondary);
          line-height: 1.7; /* line-height 1.7 requested */
          margin-bottom: 32px; /* Description -> Features: 32px */
        }

        .trust-badges {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px; /* Features -> Illustration: 40px */
        }

        .badge-item {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 18px; /* 18px requested */
          font-weight: 600;
          color: var(--text-dark);
        }

        .badge-icon-wrap {
           width: 48px;
           height: 48px;
           border-radius: 12px;
           display: flex;
           align-items: center;
           justify-content: center;
        }

        .bg-blue-light { background: #eff6ff; }
        .bg-teal-light { background: #f0fdfa; }
        .bg-cyan-light { background: #f0f9ff; }
        
        .icon-blue { color: var(--primary-blue); }
        .icon-teal { color: var(--medical-teal); }
        .icon-cyan { color: var(--soft-cyan); }

        .illustration-wrapper {
          position: relative;
          width: 100%;
          max-width: 460px; /* Target: 420-480px */
          border-radius: 24px;
          overflow: hidden;
          background: transparent;
        }

        .medical-illustration {
          width: 100%;
          max-height: 340px; /* max-height 340px requested */
          object-fit: contain;
          display: block;
        }

        /* RIGHT SIDE */
        .form-panel {
          flex: 0 0 48%;
          display: flex;
          align-items: center;
          justify-content: center; /* Centers vertically to match branding-panel */
          padding: 48px;
          background: var(--bg-light);
        }

        .form-card {
          width: 100%;
          max-width: 520px; /* 520px requested */
          background: var(--white);
          border-radius: 24px; /* 24px radius requested */
          padding: 48px 40px; /* 48px top/bottom, 40px left/right requested */
          box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.05), 0 12px 24px -8px rgba(0, 0, 0, 0.02); /* very soft premium shadow */
          border: 1px solid rgba(0,0,0,0.02);
        }

        .form-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .form-header h2 {
          font-size: 40px; /* 40px requested */
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .form-header p {
          color: var(--text-secondary);
          font-size: 18px; /* 18px requested */
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px; /* Spacing between fields 20px requested */
        }

        .input-field {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-field label {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-dark);
          margin-left: 4px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 20px;
          color: #94A3B8;
          transition: color 0.3s;
        }

        .input-wrapper input {
          width: 100%;
          height: 60px; /* 60px height requested */
          padding: 0 16px;
          border-radius: 14px; /* 14px radius requested */
          border: 1px solid #E2E8F0;
          background: var(--bg-light);
          font-size: 16px;
          color: var(--text-dark);
          transition: all 0.3s ease;
        }

        .input-wrapper input::placeholder { color: #94A3B8; }

        .input-wrapper input:focus {
          outline: none;
          border-color: var(--primary-blue);
          background: var(--white);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .input-wrapper input:focus + .input-icon,
        .input-wrapper input:focus ~ .input-icon {
          color: var(--primary-blue);
        }

        .submit-btn {
          height: 60px; /* 60px height requested */
          width: 100%;
          border-radius: 16px; /* 16px radius requested */
          border: none;
          background: linear-gradient(135deg, var(--primary-blue) 0%, #1d4ed8 100%);
          color: var(--white);
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 12px;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.25);
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(37, 99, 235, 0.35);
        }

        .submit-btn:active { transform: translateY(0); }

        .submit-btn.loading {
           opacity: 0.8;
           cursor: not-allowed;
           transform: none;
        }

        .submit-btn.success { background: var(--medical-teal); }

        .spinner {
           width: 24px;
           height: 24px;
           border: 3px solid rgba(255,255,255,0.3);
           border-radius: 50%;
           border-top-color: white;
           animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
           to { transform: rotate(360deg); }
        }

        .signup-link {
          text-align: center;
          margin-top: 32px;
          font-size: 16px;
          color: var(--text-secondary);
        }

        .signup-link a {
          color: var(--primary-blue);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .signup-link a:hover { color: var(--medical-teal); }

        .error-alert {
          background: #FEF2F2;
          color: #DC2626;
          padding: 16px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 500;
          text-align: center;
          margin-bottom: 24px;
          border: 1px solid #FEE2E2;
        }

        .success-alert {
          background: #F0FDFA;
          color: var(--medical-teal);
          padding: 16px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 500;
          text-align: center;
          margin-bottom: 24px;
          border: 1px solid #CCFBF1;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .shake-animation {
           animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes shake {
           10%, 90% { transform: translate3d(-1px, 0, 0); }
           20%, 80% { transform: translate3d(2px, 0, 0); }
           30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
           40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .login-layout { flex-direction: column; }
          .branding-panel {
            flex: none;
            padding: 60px 24px;
            align-items: center;
            text-align: center;
          }
          .back-btn-inline { margin-bottom: 24px; }
          .logo-container { justify-content: center; }
          .trust-badges { align-items: center; }
          .form-panel {
            flex: none;
            padding: 32px 24px;
            margin-top: -48px;
            z-index: 10;
          }
          .form-card {
             padding: 40px 32px;
             max-width: 90%;
             margin: 0 auto;
          }
          .mobile-logo-container { display: flex; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
