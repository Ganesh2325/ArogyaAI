import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Plus, Activity, Settings, User, Bot,
  AlertTriangle, ArrowRight, RefreshCw, Paperclip,
  ChevronRight, HeartPulse, ShieldAlert, CheckCircle2,
  History, LogOut, MessageSquare, Info, Trash2,
  MapPin, Navigation, Phone, ExternalLink, ShieldCheck, FileText, AlertCircle, Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/theme.css';

const CITIES = [
  { name: 'Hyderabad (Jubilee Hills)', lat: 17.4374, lng: 78.4019 },
  { name: 'Bangalore (HSR Layout)', lat: 12.9141, lng: 77.6413 },
  { name: 'Mumbai (Bandra)', lat: 19.0596, lng: 72.8295 },
  { name: 'Delhi (Connaught Place)', lat: 28.6304, lng: 77.2177 },
  { name: 'Chennai (Nungambakkam)', lat: 13.0604, lng: 80.2496 }
];

const MEDICAL_KEYWORDS = [
  'Migraine', 'Stroke', 'Meningitis', 'Severe Headache', 'Emergency Care',
  'Hydration', 'Doctor Consultation', 'Risk Level', 'Emergency', 'Immediate Care',
  'Critical', 'Fever', 'Nausea', 'Vomiting', 'Pain', 'Symptom', 'Symptoms',
  'Blood Pressure', 'Heart Attack', 'Seizure', 'Concussion', 'Infection', 'Antibiotics'
];

const EMERGENCY_KEYWORDS = [
  'Emergency Warning', 'Seek Immediate Care', 'Critical Symptoms', 'Call Emergency Services', 'Seek immediate emergency care'
];

const cleanMarkdownSymbols = (text) => {
  if (!text) return '';
  return text; // Do not strip symbols, parser needs them
};

const renderFormattedText = (text) => {
  if (!text) return null;

  const lines = text.split('\n');
  let elements = [];
  let currentList = [];
  let currentSection = '';

  const formatBoldText = (lineText) => {
    let parts = [lineText];

    const splitByRegex = (regex) => {
      let newParts = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(regex);
          split.forEach((s, idx) => {
            if (idx % 2 === 1) {
              newParts.push(<strong className="important-text">{s}</strong>);
            } else if (s) {
              newParts.push(s);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    };

    splitByRegex(/\*\*(.*?)\*\*/g);

    const keywordsRegex = new RegExp(`\\b(${MEDICAL_KEYWORDS.join('|')})\\b`, 'gi');
    splitByRegex(keywordsRegex);

    return parts.map((part, i) => React.isValidElement(part) ? React.cloneElement(part, { key: i }) : part);
  };

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(<ul key={`list-${elements.length}`} className="insight-bullet-list">{currentList}</ul>);
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const isMarkdownHeading = /^#{1,3}\s/.test(trimmed);
    const isBoldHeading = /^(\*\*|__)(.+?)\1:?$/.test(trimmed);
    const isPlainHeading = trimmed.length > 2 && trimmed.length <= 60 && /^[A-Z]/.test(trimmed) && !/[.!?]$/.test(trimmed) && !trimmed.includes('**') && !trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.includes(':');

    if (isMarkdownHeading || isBoldHeading || isPlainHeading) {
      flushList();
      let headingText = trimmed;
      if (isMarkdownHeading) headingText = trimmed.replace(/^#{1,3}\s*/, '').replace(/[*#]/g, '');
      else if (isBoldHeading) headingText = trimmed.replace(/^(\*\*|__)(.+?)\1:?$/, '$2');

      if (headingText.toLowerCase().includes('follow-up') || headingText.toLowerCase().includes('follow up')) {
        currentSection = 'follow-up';
      } else if (isMarkdownHeading || (isPlainHeading && !isBoldHeading)) {
        currentSection = 'other';
      }

      if (isBoldHeading && (currentSection === 'follow-up' || headingText.endsWith('?'))) {
        elements.push(<p key={`p-${index}`} className="insight-paragraph" style={{ fontWeight: 'bold' }}>{headingText}</p>);
      } else {
        elements.push(<h3 key={`h-${index}`} className="insight-heading">{headingText}</h3>);
      }
    } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const cleanLine = trimmed.replace(/^[-*]\s*/, '');
      currentList.push(<li key={`li-${index}`}>• {formatBoldText(cleanLine)}</li>);
    } else {
      flushList();
      const cleanParagraph = trimmed.replace(/[*#]/g, '');
      elements.push(<p key={`p-${index}`} className="insight-paragraph">{formatBoldText(cleanParagraph)}</p>);
    }
  });

  flushList();
  return elements;
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [activeConsultationId, setActiveConsultationId] = useState(null);

  // Geolocation and map states
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Hyderabad (Jubilee Hills)');
  const [locationStatus, setLocationStatus] = useState('detecting');

  const [activeResult, setActiveResult] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const messagesEndRef = useRef(null);
  const settingsRef = useRef(null);
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const paneMapRef = useRef(null);

  // Fetch Geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setLocationStatus('allowed');
        },
        (error) => {
          console.log('Geolocation denied or failed. Falling back to preset Hyderabad.');
          setLat(17.4374);
          setLng(78.4019);
          setLocationStatus('denied');
        }
      );
    } else {
      setLat(17.4374);
      setLng(78.4019);
      setLocationStatus('denied');
    }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const response = await axios.get('http://localhost:8000/api/consultation/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.consultations);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  // Map display side effect
  useEffect(() => {
    if (!showPanel || !activeResult || !window.L) return;

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('pane-map');
      if (!mapContainer) return;

      if (paneMapRef.current) {
        paneMapRef.current.remove();
        paneMapRef.current = null;
      }

      const mapLat = activeResult.lat || lat || 17.4374;
      const mapLng = activeResult.lng || lng || 78.4019;

      const map = window.L.map('pane-map').setView([mapLat, mapLng], 14);
      paneMapRef.current = map;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const userIcon = window.L.divIcon({
        className: 'user-marker-pulse',
        html: '<div class="pulse-dot"></div>',
        iconSize: [20, 20]
      });
      window.L.marker([mapLat, mapLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b>')
        .openPopup();

      activeResult.nearby_hospitals?.forEach((h) => {
        if (!h.lat || !h.lng) return;
        const isER = h.emergency_available || h.type?.toLowerCase().includes('emergency');
        const markerColor = isER ? '#ef4444' : '#2563eb';

        const customIcon = window.L.divIcon({
          className: 'hospital-marker-custom',
          html: `<div style="background-color: ${markerColor};" class="marker-pin"><span>+</span></div>`,
          iconSize: [30, 30]
        });

        const popupHtml = `
          <div style="font-family: sans-serif; padding: 2px; min-width: 120px;">
            <h5 style="margin: 0; color: #0f172a; font-weight: 800;">${h.name}</h5>
            <span style="font-size: 0.7rem; color: #64748b;">${h.type}</span>
            <span style="font-size: 0.7rem; color: #2563eb; display: block; font-weight: 700;">📍 ${h.distance} away</span>
          </div>
        `;

        window.L.marker([h.lat, h.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(popupHtml);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [showPanel, activeResult]);

  const focusHospitalOnPaneMap = (hLat, hLng) => {
    if (paneMapRef.current && hLat && hLng) {
      paneMapRef.current.setView([hLat, hLng], 16, { animate: true });
    }
  };

  const handleCityChange = (cityName) => {
    const city = CITIES.find(c => c.name === cityName);
    if (city) {
      setLat(city.lat);
      setLng(city.lng);
      setSelectedCity(city.name);
      setLocationStatus('allowed');
    }
  };

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    setIsTyping(true);

    try {
      const token = localStorage.getItem('auth_token');
      let currentConsultationId = activeConsultationId;

      if (!currentConsultationId) {
        const startRes = await axios.post('http://localhost:8000/api/consultation/start', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        currentConsultationId = startRes.data.consultation.id;
        setActiveConsultationId(currentConsultationId);
      }

      const response = await axios.post('http://localhost:8000/api/consultation/message',
        {
          consultation_id: currentConsultationId,
          message: currentInput,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data.message;
      const memoryUsed = response.data.memory_used;

      const botMessage = {
        role: 'bot',
        text: cleanMarkdownSymbols(data.text),
        explanation: cleanMarkdownSymbols(data.text),
        follow_up: cleanMarkdownSymbols(data.follow_up || ''),
        triage: data.triage,
        data: data,
        memory_used: memoryUsed
      };

      setMessages(prev => [...prev, botMessage]);
      fetchHistory();
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        type: 'error',
        text: error.response?.data?.message || 'Something went wrong. Please try again.'
      }]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput('');
    setActiveConsultationId(null);
    setActiveResult(null);
    setShowPanel(false);
  };

  const deleteConsultation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this consultation?")) return;
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`http://localhost:8000/api/consultation/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (activeConsultationId === id) {
        startNewChat();
      }
      fetchHistory();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const loadConsultation = (cons) => {
    const pastMessages = cons.messages.map((m, index) => {
      const isBot = m.role === 'assistant';
      return {
        role: isBot ? 'bot' : 'user',
        text: cleanMarkdownSymbols(m.message),
        triage: m.triage_level,
        follow_up: m.follow_up_questions ? cleanMarkdownSymbols(m.follow_up_questions) : null,
        data: isBot ? {
          triage: m.triage_level,
          color_code: m.triage_level === 'EMERGENCY' ? 'RED' : 'GREEN',
          explanation: cleanMarkdownSymbols(m.message)
        } : null
      };
    });
    setMessages(pastMessages);
    setActiveConsultationId(cons.id);
    setActiveResult(null);
    setShowPanel(false);
  };

  return (
    <div className={`chat-layout ${showHistory ? 'has-sidebar' : ''}`}>
      {/* 1. SIDEBAR (History) */}
      <aside className={`history-sidebar ${showHistory ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn-wide" onClick={startNewChat}>
            <Plus size={18} /> New Consultation
          </button>
        </div>
        <div className="history-list">
          <div className="history-group">Recent History</div>
          {history.length === 0 ? (
            <div className="empty-history">No past consultations</div>
          ) : (
            history.map((cons) => (
              <div key={cons.id} className={`history-item-wrapper ${activeConsultationId === cons.id ? 'active' : ''}`}>
                <button className="history-item" onClick={() => loadConsultation(cons)}>
                  <MessageSquare size={16} />
                  <div className="history-item-content">
                    <span className="h-title">Clinical Assessment</span>
                    <span className="h-date">{new Date(cons.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
                <button className="delete-cons-btn" onClick={(e) => deleteConsultation(cons.id, e)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE WITH DUAL-PANE SPLIT */}
      <div className="main-content">
        <header className="chat-header">
          <div className="header-container">
            <div className="logo-section">
              <button className="sidebar-toggle" onClick={() => setShowHistory(!showHistory)}>
                <History size={20} />
              </button>
              <div className="logo-icon" onClick={startNewChat}><Activity size={22} /></div>
              <div className="logo-text" onClick={startNewChat}>
                <h1>ArogyaAI</h1>
                <span>Clinical Assistant</span>
              </div>
            </div>
          </div>
        </header>

        <div className="chat-workspace-split">
          {/* Left Pane: Chat list and composer */}
          <div className="chat-pane">
            <main className="chat-area">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <EmptyState setInput={setInput} />
                ) : (
                  <div className="message-list">
                    {messages.map((msg, index) => (
                      <MessageBubble
                        key={index}
                        message={msg}
                        onResultClick={(data) => {
                          setActiveResult(data);
                          setShowPanel(true);
                        }}
                      />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </main>

            <div className="composer-wrapper">
              <div className="composer-container">
                <form className="input-composer" onSubmit={handleSend}>
                  <button type="button" className="attachment-btn"></button>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="How are you feeling today?"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className={`send-btn-round ${input.trim() ? 'active' : ''}`}
                    disabled={!input.trim() || loading}
                  >
                    <ArrowRight size={20} />
                  </button>
                </form>
                <p className="medical-hint"><strong>ArogyaAI provides clinical guidance, not professional diagnosis.</strong></p>
              </div>
            </div>
          </div>

          {/* Right Pane: Slide-in Clinical Navigation Drawer */}
          <div className={`dashboard-pane ${showPanel && activeResult ? 'open' : ''}`}>
            {activeResult && (
              <div className="dashboard-pane-inner">
                <header className="pane-header">
                  <h3>Clinical Navigation Drawer</h3>
                  <button className="close-pane-btn" onClick={() => setShowPanel(false)}>✕</button>
                </header>

                <div className="dashboard-pane-body">
                  {/* 1. Leaflet Interactive Map */}
                  <div className="pane-map-section">
                    <div className="pane-section-header">
                      <MapPin size={16} className="icon-blue" />
                      <h4>Interactive Clinical Routing Map</h4>
                    </div>
                    <div className="pane-map-container-wrapper">
                      <div id="pane-map" style={{ height: '220px', width: '100%' }}></div>
                    </div>
                  </div>

                  {/* 2. Care Facilities Directory */}
                  <div className="pane-directory-section">
                    <div className="pane-section-header">
                      <ShieldCheck size={16} className="icon-blue" />
                      <h4>Nearby Recommended Care Facilities</h4>
                    </div>

                    {activeResult.nearby_hospitals && activeResult.nearby_hospitals.length > 0 ? (
                      <div className="pane-directory-list">
                        {activeResult.nearby_hospitals.map((h, i) => (
                          <div
                            key={i}
                            className={`pane-directory-card ${h.emergency_available ? 'has-er' : ''}`}
                            onClick={() => focusHospitalOnPaneMap(h.lat, h.lng)}
                          >
                            <div className="pane-dir-header">
                              <div>
                                <h5 className="pane-dir-name">{h.name}</h5>
                                <span className="pane-dir-type">{h.type}</span>
                              </div>
                              <span className="pane-dir-rating">⭐ {h.rating}</span>
                            </div>

                            <div className="pane-dir-details">
                              <span className="pane-dir-distance">📍 {h.distance}</span>
                              <span className={`pane-dir-status ${h.open_now ? 'open' : ''}`}>
                                {h.open_now ? 'ER Available' : 'Closed'}
                              </span>
                            </div>

                            <p className="pane-dir-address">{h.address}</p>

                            <div className="pane-dir-actions" onClick={(e) => e.stopPropagation()}>
                              <a href={`tel:${h.phone}`} className="pane-btn-action call">
                                <Phone size={10} /> Call Clinic
                              </a>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="pane-btn-action route"
                              >
                                <Navigation size={10} /> Get Route
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pane-no-facilities">
                        <AlertTriangle size={20} style={{ color: '#94a3b8', marginBottom: '4px' }} />
                        <p>No clinics detected nearby.</p>
                      </div>
                    )}
                  </div>

                  {/* 3. Clinical Insight */}
                  <div className="pane-insight-section">
                    <div className="pane-section-header">
                      <FileText size={16} className="icon-blue" />
                      <h4>ArogyaAI Clinical Insight</h4>
                    </div>
                    <div className="pane-explanation-body">
                      {renderFormattedText(activeResult.explanation || activeResult.message)}
                    </div>
                  </div>

                  <footer className="pane-medical-disclaimer">
                    <AlertCircle size={14} />
                    <p><strong>Clinical Disclaimer:</strong> AI assessment for informational purposes. If you have severe symptoms, go to the nearest ER immediately.</p>
                  </footer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .chat-layout { height: 100%; display: flex; background: #F9FAFB; overflow: hidden; }
        
        /* SIDEBAR */
        .history-sidebar {
          width: 280px;
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          margin-left: -280px;
        }
        .history-sidebar.open { margin-left: 0; }
        .sidebar-header { padding: 20px; }
        .new-chat-btn-wide {
          width: 100%;
          padding: 12px;
          border: 1px dashed #2563eb;
          background: #f0f9ff;
          color: #2563eb;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.2s;
        }
        .new-chat-btn-wide:hover { background: #e0f2fe; }
        
        .history-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
        .history-group { font-size: 0.75rem; font-weight: 800; color: #94a3b8; padding: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .history-item-wrapper { display: flex; align-items: stretch; margin-bottom: 4px; border-radius: 10px; transition: 0.2s; }
        .history-item-wrapper:hover { background: #f3f4f6; }
        .history-item-wrapper.active { background: #e0f2fe; }
        .history-item {
          flex: 1;
          padding: 12px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .delete-cons-btn {
          padding: 0 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          transition: 0.2s;
          display: flex;
          align-items: center;
        }
        .delete-cons-btn:hover { color: #ef4444; }
        .history-item-content { display: flex; flex-direction: column; }
        .h-title { font-weight: 700; font-size: 0.9rem; }
        .h-date { font-size: 0.75rem; opacity: 0.6; }
        
        .empty-history { padding: 20px; text-align: center; font-size: 0.85rem; color: #94a3b8; }
        .sidebar-footer { padding: 20px; border-top: 1px solid #f1f5f9; }
        .user-profile-small { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 0.9rem; }
        .avatar-small { width: 32px; height: 32px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

        /* MAIN CONTENT & SPLIT WORKSPACE */
        .main-content { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .chat-header { background: #ffffff; padding: 14px 24px; border-bottom: 1px solid #f1f5f9; }
        .header-container { display: flex; justify-content: space-between; align-items: center; }
        .logo-section { display: flex; align-items: center; gap: 14px; }
        .sidebar-toggle { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; }
        .sidebar-toggle:hover { background: #f1f5f9; color: #2563eb; }
        .logo-icon { width: 32px; height: 32px; background: #2563eb; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .logo-text h1 { font-size: 1.1rem; font-weight: 800; margin: 0; cursor: pointer; }
        .logo-text span { font-size: 0.7rem; font-weight: 600; color: #64748b; cursor: pointer; }

        .chat-workspace-split { flex: 1; display: flex; overflow: hidden; position: relative; }
        .chat-pane { flex: 1; display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .chat-area { flex: 1; overflow-y: auto; padding: 40px 0; }
        .messages-container { max-width: 820px; margin: 0 auto; padding: 0 20px; }
        .message-list { display: flex; flex-direction: column; gap: 32px; }

        .composer-wrapper { padding: 20px 0 30px; background: linear-gradient(180deg, rgba(249,250,251,0) 0%, #F9FAFB 30%); }
        .composer-container { max-width: 820px; margin: 0 auto; padding: 0 20px; }
        .input-composer { display: flex; align-items: flex-end; gap: 12px; background: #ffffff; padding: 12px 16px; border-radius: 20px; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05); }
        .input-composer:focus-within { border-color: #2563eb; box-shadow: 0 4px 25px -5px rgba(37,99,235,0.1); }
        textarea { flex: 1; border: none; font-size: 1rem; padding: 10px 0; resize: none; max-height: 200px; font-family: inherit; }
        textarea:focus { outline: none; }
        .send-btn-round { width: 42px; height: 42px; border-radius: 12px; background: #f3f4f6; color: #9ca3af; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
        .send-btn-round.active { background: #2563eb; color: white; }

        .medical-hint { text-align: center; font-size: 0.75rem; color: #000000; font-weight: 800; margin-top: 12px; }
        
        .settings-wrapper { position: relative; }
        .settings-dropdown { position: absolute; top: 100%; right: 0; margin-top: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 8px; min-width: 160px; z-index: 1000; }
        .dropdown-header { font-size: 0.7rem; font-weight: 800; color: #94a3b8; padding: 8px; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px; }
        .dropdown-item { width: 100%; padding: 10px; border: none; background: none; text-align: left; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; border-radius: 8px; }
        .dropdown-item:hover { background: #f8fafc; }
        .dropdown-item.logout { color: #ef4444; }
        .dropdown-item.logout:hover { background: #fef2f2; }

        /* DASHBOARD DRAWER PANEL */
        .dashboard-pane {
          width: 0;
          opacity: 0;
          background: #ffffff;
          border-left: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
        }
        .dashboard-pane.open {
          width: 450px;
          opacity: 1;
        }
        .dashboard-pane-inner {
          width: 450px;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .pane-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
        }
        .pane-header h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .close-pane-btn {
          background: #f1f5f9;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-weight: 800;
          color: #64748b;
          transition: 0.2s;
        }
        .close-pane-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }
        
        .dashboard-pane-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #f8fafc;
        }
        
        .pane-map-section, .pane-directory-section, .pane-insight-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        }
        
        .pane-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
        }
        .pane-section-header h4 {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        
        .pane-map-container-wrapper {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          z-index: 1;
        }
        
        /* DIRECTORY CARDS */
        .pane-directory-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 350px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .pane-directory-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pane-directory-card:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
          transform: translateY(-1px);
        }
        .pane-directory-card.has-er {
          border-left: 4px solid #ef4444;
        }
        .pane-dir-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .pane-dir-name {
          font-weight: 800;
          font-size: 0.85rem;
          color: #0f172a;
          margin: 0 0 2px 0;
          line-height: 1.2;
        }
        .pane-dir-type {
          font-size: 0.65rem;
          font-weight: 600;
          color: #64748b;
        }
        .pane-dir-rating {
          font-size: 0.65rem;
          font-weight: 800;
          color: #f59e0b;
        }
        .pane-dir-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
        }
        .pane-dir-distance {
          font-weight: 700;
          color: #2563eb;
        }
        .pane-dir-status {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 4px;
          background: #e2e8f0;
          color: #475569;
        }
        .pane-dir-status.open {
          background: #d1fae5;
          color: #10b981;
        }
        .pane-dir-address {
          font-size: 0.65rem;
          color: #64748b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pane-dir-actions {
          display: flex;
          gap: 6px;
          margin-top: 2px;
        }
        .pane-btn-action {
          flex: 1;
          text-align: center;
          padding: 5px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.65rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          transition: 0.15s;
          cursor: pointer;
        }
        .pane-btn-action.call {
          background: white;
          border: 1px solid #cbd5e1;
          color: #0f172a;
        }
        .pane-btn-action.call:hover { background: #f1f5f9; }
        .pane-btn-action.route {
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          color: #0369a1;
        }
        .pane-btn-action.route:hover { background: #bae6fd; }
        
        .pane-no-facilities {
          padding: 20px;
          text-align: center;
          color: #94a3b8;
          font-size: 0.8rem;
        }
        
        /* CLINICAL INSIGHT ELEMENTS */
        .pane-explanation-body {
          font-size: 0.9rem;
          line-height: 1.5;
          color: #334155;
        }
        
        .insight-heading {
          font-size: 20px;
          font-weight: 700;
          color: #0F172A;
          margin: 24px 0 16px 0;
        }
        .insight-heading:first-child {
          margin-top: 0;
        }
        .insight-paragraph {
          margin: 0 0 12px 0;
          font-weight: 400;
          font-size: 14px;
          color: #334155;
          line-height: 1.8;
        }
        .important-text {
          font-weight: 700;
          color: #0F172A;
        }
        .insight-bullet-list {
          margin: 0 0 24px 0;
          padding-left: 0;
          list-style-type: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .insight-bullet-list li {
          font-weight: 400;
          font-size: 14px;
          color: #334155;
          line-height: 1.8;
        }
        
        .pane-medical-disclaimer {
          padding: 12px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          gap: 8px;
          color: #64748b;
          font-size: 0.7rem;
          line-height: 1.4;
        }
        .pane-medical-disclaimer p { margin: 0; }
        
        /* GEOLOCATION CONTROLS BAR STYLES */
        .location-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .location-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
        }
        .location-dot-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: locationPulse 1.5s infinite alternate;
        }
        .location-dot-pulse.denied {
          background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
        }
        @keyframes locationPulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.1); opacity: 1; }
        }
        .city-override-select {
          border: none;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #0f172a;
          cursor: pointer;
        }
        .city-override-select:focus {
          outline: none;
          background: #e2e8f0;
        }

        /* SPECIALIST BUBBLE CARD */
        .specialist-bubble-card {
          margin-top: 14px;
          padding: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .specialist-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .specialist-next-steps {
          margin: 0;
          font-size: 0.85rem;
          color: #334155;
        }
        .specialist-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .spec-tag {
          padding: 4px 8px;
          background: #e0f2fe;
          color: #0369a1;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .pane-trigger-btn {
          width: 100%;
          padding: 10px;
          background: #000000;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: 0.2s;
        }
        .pane-trigger-btn:hover {
          background: #2563eb;
        }

        /* LEAFLET CUSTOM MARKERS */
        .user-marker-pulse {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-dot {
          width: 14px;
          height: 14px;
          background: #2563eb;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(37,99,235,0.7);
          animation: mapPulse 1.2s infinite alternate;
        }
        @keyframes mapPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 4px rgba(37,99,235,0.4); }
          100% { transform: scale(1.15); box-shadow: 0 0 12px rgba(37,99,235,0.8); }
        }

        .hospital-marker-custom {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .marker-pin {
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 13px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transform: rotate(-45deg);
        }
        .marker-pin span {
          transform: rotate(45deg);
          display: block;
        }
        
        .message-wrapper { display: flex; gap: 16px; width: 100%; }
        .message-wrapper.user { justify-content: flex-end; }
        .bot-avatar { width: 36px; height: 36px; background: #2563eb; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-top: 4px; flex-shrink: 0; }
        
        .bubble { padding: 24px; border-radius: 20px; max-width: 85%; line-height: 1.8; position: relative; }
        .text-body { font-size: 14px; line-height: 1.8; }
        .user-bubble {
          background: #2563eb;
          color: #ffffff;
          border-radius: 20px;
          font-weight: 400;
          padding: 14px 20px;
          font-size: 14px;
        }
        .user-bubble .insight-paragraph, 
        .user-bubble p, 
        .user-bubble span {
          color: #ffffff;
          font-weight: 400;
          font-size: 14px;
        }
        .bot-bubble { background: #ffffff; border: 1px solid #e5e7eb; color: #0F172A; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }

        .follow-up-bubble { margin-top: 24px; font-size: 13px; color: #1e293b; font-weight: 700; line-height: 1.6; }
        .follow-up-bubble ul { padding: 0; margin: 0; list-style-type: none; display: flex; flex-direction: column; gap: 6px; }
        .follow-up-bubble li { display: flex; gap: 8px; }
        .error-box { display: flex; align-items: center; gap: 10px; color: #ef4444; font-weight: 700; }
      `}</style>
    </div>
  );
};

const MessageBubble = ({ message, onResultClick }) => {
  const isUser = message.role === 'user';
  const triageLevel = message.triage || message.data?.triage;

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'bot'}`}>
      {!isUser && <div className="bot-avatar"><Bot size={20} /></div>}
      <div className={`bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
        {message.type === 'error' ? (
          <div className="error-box"><AlertTriangle size={18} /> {message.text}</div>
        ) : (
          <div className="message-content">
            <div className="text-body">
              {isUser ? message.text : renderFormattedText(message.text)}
            </div>

            {!isUser && message.memory_used && (
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Brain size={12} /> AI accessed conversation history
              </div>
            )}

            {!isUser && message.follow_up && (
              <div className="follow-up-bubble">
                {message.follow_up.split('\n').map((line, idx) => {
                  let trimmed = line.trim().replace(/\*\*/g, '');
                  if (!trimmed) return null;
                  if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
                    let text = trimmed.replace(/^[-*•]\s*/, '').trim();
                    if (!text.endsWith('?')) text += '?';
                    return (
                      <ul key={idx}>
                        <li><span>•</span> <strong>{text}</strong></li>
                      </ul>
                    );
                  }
                  return <div key={idx} style={{ marginBottom: "8px" }}>{trimmed}</div>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ setInput }) => (
  <div className="empty-state">
    <div className="welcome-badge">Medical Grade AI</div>
    <h1>How can I help you <br /><span>feel better?</span></h1>
    <div className="quick-prompts">
      <button onClick={() => setInput("I have a severe headache and nausea")}>Headache & Nausea</button>
      <button onClick={() => setInput("I'm feeling short of breath")}>Shortness of Breath</button>
      <button onClick={() => setInput("Persistent cough for 3 days")}>Persistent Cough</button>
    </div>
    <style jsx="true">{`
      .empty-state { text-align: center; padding: 60px 0; color: #000000; }
      .welcome-badge { display: inline-block; padding: 6px 14px; background: #f0f9ff; color: #2563eb; border-radius: 100px; font-size: 0.75rem; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; }
      h1 { font-size: 3rem; font-weight: 900; line-height: 1.1; margin-bottom: 20px; }
      h1 span { color: #2563eb; }
      p { font-size: 1.1rem; color: #64748b; max-width: 500px; margin: 0 auto 40px; }
      .quick-prompts { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
      .quick-prompts button { padding: 10px 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 100px; font-weight: 700; cursor: pointer; transition: 0.2s; }
      .quick-prompts button:hover { border-color: #2563eb; color: #2563eb; background: #f0f9ff; }
    `}</style>
  </div>
);

const TypingIndicator = () => (
  <div className="typing-indicator">
    <div className="bot-avatar"><Bot size={20} /></div>
    <div className="dots"><span></span><span></span><span></span></div>
    <span className="typing-text">ArogyaAI is analyzing...</span>
    <style jsx="true">{`
      .typing-indicator { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 700; margin-top: 12px; }
      .dots { display: flex; gap: 4px; }
      .dots span { width: 6px; height: 6px; background: #2563eb; border-radius: 50%; animation: bounce 1s infinite; }
      .dots span:nth-child(2) { animation-delay: 0.2s; }
      .dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      .typing-text { color: #64748b; }
    `}</style>
  </div>
);

export default ChatInterface;
