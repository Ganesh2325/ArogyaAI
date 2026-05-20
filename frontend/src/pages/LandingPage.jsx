import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Shield, Zap, ArrowRight, Play, Heart, Users, CheckCircle,
  AlertTriangle, Lock, Search, FileText, ChevronDown, PhoneCall
} from 'lucide-react';
import '../styles/theme.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      {/* 1. HEADER / NAVBAR */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="logo">
            <Activity className="icon-teal" size={28} />
            <span>Arogya<span className="text-gradient">AI</span></span>
          </div>
          <div className="nav-links">
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
            <a href="#safety">Safety</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-actions">
            <button onClick={() => navigate('/login')} className="btn-login">Login</button>
            <button onClick={() => navigate('/signup')} className="btn-primary-small">Get Started</button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="hero-section section-padding">
        <div className="container grid-2">
          <div className="hero-text">
            <div className="badge-modern">
              <Shield size={16} />
              <span>AI-Powered Medical Triage</span>
            </div>
            <h1>
              Intelligent Guidance <br />
              For <span className="text-gradient">Your Health</span>
            </h1>
            <p className="hero-sub">
              ArogyaAI analyzes your symptoms using advanced medical logic to provide personalized
              insights and recommend the right next steps—instantly and securely.
            </p>

            <div className="hero-highlights">
              <div className="highlight-item">
                <div className="h-icon"><Zap size={18} /></div>
                <span><strong>Smart Symptom Analysis:</strong> AI understands your symptoms and context</span>
              </div>
              <div className="highlight-item">
                <div className="h-icon"><Activity size={18} /></div>
                <span><strong>Personalized Recommendations:</strong> Guidance based on medical reasoning</span>
              </div>
              <div className="highlight-item">
                <div className="h-icon"><Lock size={18} /></div>
                <span><strong>Private & Secure:</strong> Your data is encrypted and confidential</span>
              </div>
            </div>

            <div className="hero-ctas">
              <button onClick={() => navigate('/signup')} className="btn-primary">
                Start Symptom Check <ArrowRight size={20} />
              </button>
            </div>
            <p className="disclaimer-hero"><span style={{ color: 'black', fontweight: 'bold' }}>This is not a medical diagnosis. Consult a licensed doctor.</span></p>
          </div>

          <div className="hero-visual">
            <div className="visual-composition">
              <img src="/doctor.png" alt="Professional Doctor" className="doctor-img" />
              <img src="/mockup.png" alt="Symptom Checker App" className="mockup-img" />

              <div className="trust-badge badge-1 glass-effect">
                <Zap size={20} className="icon-teal" />
                <div>
                  <strong>Trusted AI</strong>
                  <span>Technology</span>
                </div>
              </div>
              <div className="trust-badge badge-2 glass-effect">
                <Shield size={20} className="icon-blue" />
                <div>
                  <strong>Evidence-Based</strong>
                  <span>Medical Logic</span>
                </div>
              </div>
              <div className="trust-badge badge-3 glass-effect">
                <Heart size={20} className="icon-red" />
                <div>
                  <strong>Built For</strong>
                  <span>Your Safety</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="how-it-works section-padding">
        <div className="container text-center">
          <h2 className="section-title">How ArogyaAI Works</h2>
          <p className="section-sub">From symptoms to clear guidance in under a minute.</p>

          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">01</div>
              <div className="step-icon-box"><Search size={32} /></div>
              <h3>Describe Your Symptoms</h3>
              <p>Enter your symptoms in natural language—just like chatting with a doctor.</p>
            </div>
            <div className="step-item">
              <div className="step-number">02</div>
              <div className="step-icon-box"><BotIcon /></div>
              <h3>AI Understands & Asks</h3>
              <p>Our AI analyzes your input and asks smart follow-up questions to understand severity.</p>
            </div>
            <div className="step-item">
              <div className="step-number">03</div>
              <div className="step-icon-box"><Activity size={32} /></div>
              <h3>Medical Logic Engine</h3>
              <p>Your inputs are processed through clinical decision rules and red-flag detection.</p>
            </div>
            <div className="step-item">
              <div className="step-number">04</div>
              <div className="step-icon-box"><FileText size={32} /></div>
              <h3>Get Instant Guidance</h3>
              <p>Receive risk levels, possible conditions, and recommended next steps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE AROGYA AI */}
      <section className="why-choose section-padding">
        <div className="container">
          <h2 className="section-title text-center">Why Choose ArogyaAI?</h2>
          <div className="features-horizontal">
            <div className="feature-small">
              <div className="fs-icon"><CheckCircle size={24} /></div>
              <div>
                <h4>Accurate</h4>
                <p>Advanced AI + medical knowledge</p>
              </div>
            </div>
            <div className="feature-small">
              <div className="fs-icon"><Zap size={24} /></div>
              <div>
                <h4>Fast</h4>
                <p>Results in seconds</p>
              </div>
            </div>
            <div className="feature-small">
              <div className="fs-icon"><UserIcon /></div>
              <div>
                <h4>Personalized</h4>
                <p>Tailored to user symptoms</p>
              </div>
            </div>
            <div className="feature-small">
              <div className="fs-icon"><Shield size={24} /></div>
              <div>
                <h4>Safe & Reliable</h4>
                <p>Built with clinical safeguards</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURES */}
      <section id="features" className="features-grid-section section-padding">
        <div className="container">
          <h2 className="section-title text-center">Powerful Features Designed for Your Health</h2>
          <div className="features-layout">
            <FeatureBox title="AI Symptom Analysis" desc="Understands natural language and converts it into structured medical insights." icon={<Search />} />
            <FeatureBox title="Smart Triage System" desc="Categorizes your condition into Emergency, Primary Care, or Self-Care." icon={<Zap />} />
            <FeatureBox title="Red-Flag Detection" desc="Instantly identifies critical symptoms like chest pain or breathing difficulty." icon={<AlertTriangle />} accent="red" />
            <FeatureBox title="Condition Probability" desc="Shows likely conditions with confidence levels based on your symptoms." icon={<Activity />} />
            <FeatureBox title="Private & Secure" desc="Your data is encrypted and handled with strict privacy standards." icon={<Lock />} />
            <FeatureBox title="Instant Medical Report" desc="Download a structured summary to share with a doctor." icon={<FileText />} />
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="faq-section section-padding">
        <div className="container">
          <h2 className="section-title text-center" style={{ textAlign: "center" }}>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <FAQItem q="Is ArogyaAI a real doctor?" a="No. ArogyaAI is a decision-support tool designed to guide you. It does not replace professional medical advice." />
            <FAQItem q="How accurate is the symptom analysis?" a="The system combines AI with medical logic and safety rules. While highly informative, it should be used as a preliminary guide." />
            <FAQItem q="What should I do in an emergency?" a="If you experience severe symptoms (chest pain, breathing issues, etc.), seek immediate medical attention or call emergency services." />
            <FAQItem q="Is my data safe?" a="Yes. All data is encrypted and handled securely. We prioritize privacy and do not misuse your information." />
            <FAQItem q="Can I use this without creating an account?" a="Yes. Basic symptom checks can be performed without login." />
            <FAQItem q="Does it work for all diseases?" a="The system covers common conditions and symptoms but is not a substitute for comprehensive medical diagnosis." />
          </div>
        </div>
      </section>

      {/* 9. SAFETY / EMERGENCY STRIP */}
      <section className="emergency-strip">
        <div className="container strip-content">
          <div className="strip-text">
            <Shield className="icon-white" size={32} />
            <div>
              <h3>Your Health. Our Priority.</h3>
              <p>ArogyaAI supports—not replaces—professional medical care</p>
            </div>
          </div>
          <button className="btn-emergency">
            <PhoneCall size={20} /> Call Emergency (911)
          </button>
        </div>
      </section>

      <style jsx>{`
        .landing-wrapper {
          background: white;
        }

        /* Navbar */
        .navbar {
          height: 90px;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          z-index: 1000;
          border-bottom: none; /* Removed border as requested */
        }
        .nav-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .logo { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.5rem; color: var(--text-heading); }
        .nav-links { display: flex; gap: 32px; }
        .nav-links a { text-decoration: none; color: var(--text-body); font-weight: 500; font-size: 0.95rem; transition: var(--transition); }
        .nav-links a:hover { color: var(--primary-teal); }
        .nav-actions { display: flex; gap: 15px; align-items: center; }
        .btn-login { background: var(--primary-blue); color: white; border: none; font-weight: 600; padding: 10px 20px; border-radius: 100px; cursor: pointer; }
        .btn-primary-small { background: var(--primary-teal); color: white; border: none; padding: 10px 20px; border-radius: 100px; font-weight: 600; cursor: pointer; }

        /* Hero */
        .hero-section { 
          background: radial-gradient(circle at 80% 20%, #f8fafc 0%, white 100%); 
          min-height: 90vh;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .hero-text {
          text-align: left; /* Proper alignment */
          padding-right: 40px;
        }
        .badge-modern { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: #f0fdfa; color: var(--primary-teal); border-radius: 100px; font-size: 0.85rem; font-weight: 600; margin-bottom: 24px; border: 1px solid rgba(13, 148, 136, 0.1); }
        h1 { font-size: 4.5rem; line-height: 1.05; margin-bottom: 24px; letter-spacing: -0.03em; }
        .hero-sub { font-size: 1.25rem; color: var(--text-muted); margin-bottom: 32px; max-width: 600px; line-height: 1.6; }
        .hero-highlights { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
        .highlight-item { display: flex; gap: 12px; align-items: flex-start; }
        .h-icon { color: var(--primary-teal); margin-top: 4px; }
        .hero-ctas { display: flex; gap: 20px; margin-bottom: 20px; }
        .disclaimer-hero { font-size: 0.85rem; color: var(--text-muted); font-style: italic; }

        /* Hero Visual */
        .visual-composition { position: relative; padding: 0; display: flex; justify-content: flex-end; }
        .doctor-img { width: 90%; border-radius: var(--radius-lg); box-shadow: var(--shadow-medium); object-fit: cover; }
        .mockup-img { position: absolute; bottom: -20px; left: -10%; width: 55%; border-radius: 30px; box-shadow: 20px 20px 60px rgba(0,0,0,0.1); border: 12px solid white; }
        .trust-badge { position: absolute; padding: 14px 20px; display: flex; align-items: center; gap: 12px; border-radius: 18px; min-width: 180px; z-index: 10; }
        .glass-effect { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5); box-shadow: var(--shadow-medium); }
        .badge-1 { top: 10%; right: -5%; }
        .badge-2 { bottom: 15%; right: 5%; }
        .badge-3 { bottom: 10%; left: -15%; }
        .trust-badge strong { display: block; font-size: 0.9rem; color: var(--text-heading); }
        .trust-badge span { font-size: 0.8rem; color: var(--text-muted); }

        /* Stats */
        .stats-section { padding: 60px 0; background: white; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
        .stat-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .stat-value { font-size: 2.25rem; font-weight: 800; color: var(--text-heading); }
        .stat-label { color: var(--text-muted); font-weight: 500; }

        /* How It Works */
        .section-title { font-size: 2.5rem; margin-bottom: 12px; }
        .section-sub { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 60px; }
        .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; position: relative; }
        .step-item { position: relative; padding: 0 15px; }
        .step-number { font-size: 4rem; font-weight: 900; color: #f1f5f9; position: absolute; top: -30px; left: 0; z-index: -1; }
        .step-icon-box { width: 70px; height: 70px; background: white; box-shadow: var(--shadow-soft); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; color: var(--primary-teal); }
        .step-item h3 { font-size: 1.25rem; margin-bottom: 12px; }
        .step-item p { font-size: 0.95rem; color: var(--text-muted); }

        /* Why Choose */
        .features-horizontal { display: flex; justify-content: center; gap: 40px; background: #f8fafc; padding: 40px; border-radius: var(--radius-lg); }
        .feature-small { display: flex; gap: 15px; align-items: center; }
        .fs-icon { color: var(--primary-teal); }
        .feature-small h4 { font-size: 1.1rem; margin-bottom: 2px; }
        .feature-small p { font-size: 0.85rem; color: var(--text-muted); }

        /* Feature Grid */
        .features-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; margin-top: 50px; }
        .feature-box { padding: 32px; background: white; border-radius: var(--radius-md); box-shadow: var(--shadow-soft); transition: var(--transition); border: 1px solid transparent; }
        .feature-box:hover { transform: translateY(-5px); box-shadow: var(--shadow-medium); border-color: #e2e8f0; }
        .fb-icon { width: 50px; height: 50px; border-radius: 12px; background: #f0fdfa; color: var(--primary-teal); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .fb-icon.red { background: #fef2f2; color: #ef4444; }
        .feature-box h4 { font-size: 1.2rem; margin-bottom: 10px; }
        .feature-box p { font-size: 0.95rem; color: var(--text-muted); }

        /* Safety */
        .safety-grid { margin-top: 40px; }
        .safety-card { padding: 24px; border-bottom: 1px solid #f1f5f9; }
        .safety-card h4 { margin-bottom: 8px; color: var(--text-heading); }
        .medical-disclaimer { margin-top: 60px; padding: 30px; display: flex; gap: 20px; align-items: center; border-radius: var(--radius-md); border-left: 6px solid var(--accent-caution); }

        /* FAQ */
        .faq-grid { max-width: 800px; margin: 40px auto 0; display: flex; flex-direction: column; gap: 16px; }
        .faq-item { padding: 24px; background: white; border-radius: 16px; border: 1px solid #f1f5f9; cursor: pointer; transition: var(--transition); }
        .faq-item:hover { background: #f8fafc; }
        .faq-question { display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: var(--text-heading); }
        .faq-answer { margin-top: 12px; font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; }

        /* Emergency Strip */
        .emergency-strip { background: var(--accent-emergency); color: white; padding: 40px 0; }
        .strip-content { display: flex; justify-content: space-between; align-items: center; }
        .strip-text { display: flex; gap: 24px; align-items: center; }
        .strip-text h3 { color: white; margin-bottom: 4px; }
        .strip-text p { color: rgba(255,255,255,0.8); }
        .btn-emergency { background: white; color: var(--accent-emergency); padding: 14px 28px; border-radius: 100px; font-weight: 700; border: none; cursor: pointer; display: flex; gap: 10px; align-items: center; transition: var(--transition); }
        .btn-emergency:hover { transform: scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }

        /* Helpers */
        .icon-teal { color: var(--primary-teal); }
        .icon-blue { color: var(--primary-blue); }
        .icon-red { color: #ef4444; }
        .icon-green { color: #10b981; }
        .icon-yellow { color: #f59e0b; }
        .icon-white { color: white; }

        @media (max-width: 968px) {
          h1 { font-size: 2.75rem; }
          .mockup-img { left: 0; width: 40%; }
          .steps-grid { grid-template-columns: 1fr; }
          .features-horizontal { flex-direction: column; gap: 20px; }
          .strip-content { flex-direction: column; gap: 30px; text-align: center; }
          .strip-text { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

const FeatureBox = ({ title, desc, icon, accent }) => (
  <div className="feature-box">
    <div className={`fb-icon ${accent === 'red' ? 'red' : ''}`}>{icon}</div>
    <h4>{title}</h4>
    <p>{desc}</p>
  </div>
);

const SafetyCard = ({ title, desc }) => (
  <div className="safety-card">
    <h4>{title}</h4>
    <p>{desc}</p>
  </div>
);

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="faq-item" onClick={() => setOpen(!open)}>
      <div className="faq-question">
        <span>{q}</span>
        <ChevronDown size={20} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
      </div>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  );
};

const BotIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8"></path>
    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
    <path d="M2 14h2"></path>
    <path d="M20 14h2"></path>
    <path d="M15 13v2"></path>
    <path d="M9 13v2"></path>
  </svg>
);

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export default LandingPage;
