import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Plus, Activity, Settings, User, Bot,
  AlertTriangle, ArrowRight, RefreshCw, Paperclip,
  ChevronRight, HeartPulse, ShieldAlert, CheckCircle2,
  History, LogOut, MessageSquare, Info, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/theme.css';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [activeConsultationId, setActiveConsultationId] = useState(null);

  const messagesEndRef = useRef(null);
  const settingsRef = useRef(null);
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const response = await axios.get('http://localhost:8000/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('History error:', error);
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
      const response = await axios.post('http://localhost:8000/api/chat/send',
        {
          message: currentInput,
          consultation_id: activeConsultationId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;

      const botMessage = {
        role: 'bot',
        text: data.message,
        explanation: data.is_rejected ? null : (data.explanation || data.message),
        next_steps: data.next_steps,
        follow_up: data.follow_up,
        triage: data.triage,
        conditions: data.conditions,
        disclaimer: data.disclaimer,
        consultation_id: data.consultation_id,
        data: data
      };

      setMessages(prev => [...prev, botMessage]);
      if (!activeConsultationId && data.consultation_id) {
        setActiveConsultationId(data.consultation_id);
      }
      fetchHistory(); // Refresh history sidebar
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
  };

  const deleteConsultation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this consultation?")) return;
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`http://localhost:8000/api/chat/consultation/${id}`, {
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
    // Convert consultation history to messages
    const pastMessages = cons.messages.map((m, index) => {
      const isBot = m.sender === 'ai';
      const isLastBotMessage = isBot && index === cons.messages.length - 1;

      return {
        role: isBot ? 'bot' : 'user',
        text: m.message_text,
        // For the last bot message, reconstruct the triage data
        data: isLastBotMessage ? {
          triage: cons.triage_result,
          color_code: cons.triage_result === 'EMERGENCY' ? 'RED' : (cons.triage_result === 'PRIMARY_CARE' ? 'YELLOW' : 'GREEN'),
          next_steps: cons.triage_result === 'EMERGENCY' ? 'Seek immediate emergency care.' : 'Schedule an appointment.',
          conditions: cons.predictions.map(p => ({
            name: p.condition_name,
            probability: p.probability
          }))
        } : null
      };
    });
    setMessages(pastMessages);
    setActiveConsultationId(cons.id);
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
                    <span className="h-title">{cons.triage_result?.replace('_', ' ') || 'Consultation'}</span>
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
        <div className="sidebar-footer">
          <div className="user-profile-small">
            <div className="avatar-small"><User size={16} /></div>
            <span>{JSON.parse(localStorage.getItem('user') || '{}').name || 'User'}</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <div className="main-content">
        <header className="chat-header">
          <div className="header-container">
            <div className="logo-section">
              <button className="sidebar-toggle" onClick={() => setShowHistory(!showHistory)}>
                <History size={20} />
              </button>
              <div className="logo-icon" onClick={() => navigate('/chat')}><Activity size={22} /></div>
              <div className="logo-text" onClick={() => navigate('/chat')}>
                <h1>ArogyaAI</h1>
                <span>Clinical Assistant</span>
              </div>
            </div>
            <div className="header-actions">
              <div className="settings-wrapper" ref={settingsRef}>
                <button className="icon-btn" onClick={() => setShowSettings(!showSettings)}>
                  <Settings size={20} />
                </button>
                {showSettings && (
                  <div className="settings-dropdown">
                    <div className="dropdown-header">Settings</div>
                    <button className="dropdown-item logout" onClick={() => {
                      localStorage.removeItem('auth_token');
                      localStorage.removeItem('user');
                      navigate('/');
                    }}>
                      <LogOut size={18} /> <strong>Logout</strong>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="chat-area">
          <div className="messages-container">
            {messages.length === 0 ? (
              <EmptyState setInput={setInput} />
            ) : (
              <div className="message-list">
                {messages.map((msg, index) => (
                  <MessageBubble key={index} message={msg} onResultClick={(data) => navigate('/results', { state: data })} />
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
              <button type="button" className="attachment-btn"><Paperclip size={20} /></button>
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
            <p className="medical-hint">ArogyaAI provides clinical guidance, not professional diagnosis.</p>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .chat-layout { height: 100vh; display: flex; background: #F9FAFB; overflow: hidden; }
        
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
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: none;
          border: none;
          color: #000000;
          cursor: pointer;
          text-align: left;
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

        /* MAIN CONTENT */
        .main-content { flex: 1; display: flex; flex-direction: column; position: relative; }
        .chat-header { background: #ffffff; padding: 14px 24px; border-bottom: 1px solid #f1f5f9; }
        .header-container { display: flex; justify-content: space-between; align-items: center; }
        .logo-section { display: flex; align-items: center; gap: 14px; }
        .sidebar-toggle { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; }
        .sidebar-toggle:hover { background: #f1f5f9; color: #2563eb; }
        .logo-icon { width: 32px; height: 32px; background: #2563eb; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .logo-text h1 { font-size: 1.1rem; font-weight: 800; margin: 0; cursor: pointer; }
        .logo-text span { font-size: 0.7rem; font-weight: 600; color: #64748b; cursor: pointer; }

        .chat-area { flex: 1; overflow-y: auto; padding: 40px 0; }
        .messages-container { max-width: 800px; margin: 0 auto; padding: 0 20px; }
        .message-list { display: flex; flex-direction: column; gap: 32px; }

        .composer-wrapper { padding: 20px 0 30px; }
        .composer-container { max-width: 800px; margin: 0 auto; padding: 0 20px; }
        .input-composer { display: flex; align-items: flex-end; gap: 12px; background: #ffffff; padding: 12px 16px; border-radius: 20px; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05); }
        .input-composer:focus-within { border-color: #2563eb; box-shadow: 0 4px 25px -5px rgba(37,99,235,0.1); }
        textarea { flex: 1; border: none; font-size: 1rem; padding: 10px 0; resize: none; max-height: 200px; font-family: inherit; }
        textarea:focus { outline: none; }
        .send-btn-round { width: 42px; height: 42px; border-radius: 12px; background: #f3f4f6; color: #9ca3af; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
        .send-btn-round.active { background: #2563eb; color: white; }

        .medical-hint { text-align: center; font-size: 0.75rem; color: #64748b; margin-top: 12px; }
        
        .settings-wrapper { position: relative; }
        .settings-dropdown { position: absolute; top: 100%; right: 0; margin-top: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 8px; min-width: 160px; z-index: 1000; }
        .dropdown-header { font-size: 0.7rem; font-weight: 800; color: #94a3b8; padding: 8px; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px; }
        .dropdown-item { width: 100%; padding: 10px; border: none; background: none; text-align: left; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; border-radius: 8px; }
        .dropdown-item:hover { background: #f8fafc; }
        .dropdown-item.logout { color: #ef4444; }
        .dropdown-item.logout:hover { background: #fef2f2; }
      `}</style>
    </div>
  );
};

const MessageBubble = ({ message, onResultClick }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'bot'}`}>
      {!isUser && <div className="bot-avatar"><Bot size={20} /></div>}
      <div className={`bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
        {message.type === 'error' ? (
          <div className="error-box"><AlertTriangle size={18} /> {message.text}</div>
        ) : (
          <div className="message-content">
            <div className="text-body">{message.text}</div>


            {!isUser && message.follow_up && (
              <div className="follow-up-bubble">
                {message.follow_up}
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx="true">{`
        .message-wrapper { display: flex; gap: 16px; width: 100%; }
        .message-wrapper.user { justify-content: flex-end; }
        .bot-avatar { width: 36px; height: 36px; background: #2563eb; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-top: 4px; }
        
        .bubble { padding: 20px; border-radius: 20px; max-width: 85%; line-height: 1.6; position: relative; }
        .text-body { white-space: pre-wrap; }
        .user-bubble { background: #2563eb; color: white; border-bottom-right-radius: 4px; box-shadow: 0 4px 15px rgba(37,99,235,0.2); }
        .bot-bubble { background: #ffffff; border: 1px solid #e5e7eb; border-bottom-left-radius: 4px; color: #000000; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }

        .ai-explanation { margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 12px; border-left: 3px solid #2563eb; }
        .exp-header { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #2563eb; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        .ai-explanation p { font-size: 0.95rem; margin: 0; opacity: 0.8; }

        .follow-up-bubble { margin-top: 20px; padding: 12px 16px; background: #f0f9ff; color: #2563eb; border-radius: 14px; font-weight: 700; font-size: 0.95rem; border: 1px dashed #2563eb; }

        /* TRIAGE CARD */
        .triage-result-card { margin-top: 24px; padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; display: flex; flex-direction: column; gap: 20px; }
        
        .risk-meter-container { display: flex; flex-direction: column; gap: 10px; }
        .meter-header { display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 700; }
        .risk-text.red { color: #ef4444; }
        .risk-text.yellow { color: #f59e0b; }
        .risk-text.green { color: #10b981; }
        
        .meter-track { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
        .meter-fill { height: 100%; border-radius: 4px; transition: 0.5s; }
        .meter-fill.red { width: 100%; background: #ef4444; }
        .meter-fill.yellow { width: 60%; background: #f59e0b; }
        .meter-fill.green { width: 30%; background: #10b981; }

        .section-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 12px; }
        .prob-list { display: flex; flex-direction: column; gap: 12px; }
        .prob-info { display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 700; font-size: 0.9rem; }
        .prob-bar-bg { height: 6px; background: #f1f5f9; border-radius: 3px; }
        .prob-bar-fill { height: 100%; background: #2563eb; border-radius: 3px; opacity: 0.7; }

        .next-steps-box { padding: 16px; background: #fdf2f2; border-radius: 12px; }
        .step-label { font-size: 0.75rem; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-bottom: 4px; }
        .next-steps-box p { margin: 0; font-weight: 600; font-size: 0.95rem; }

        .report-btn { width: 100%; padding: 14px; background: #000000; color: #ffffff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.2s; }
        .report-btn:hover { background: #1a1a1a; transform: translateY(-2px); }
        .error-box { display: flex; align-items: center; gap: 10px; color: #ef4444; font-weight: 700; }
      `}</style>
    </div>
  );
};

const EmptyState = ({ setInput }) => (
  <div className="empty-state">
    <div className="welcome-badge">Medical Grade AI</div>
    <h1>How can I help you <br /><span>feel better?</span></h1>
    <p>Describe your symptoms in plain English. I'll analyze them and provide clinical guidance.</p>
    <div className="quick-prompts">
      <button onClick={() => setInput("I have a severe headache and nausea")}>Headache & Nausea</button>
      <button onClick={() => setInput("I'm feeling short of breath")}>Shortness of Breath</button>
      <button onClick={() => setInput("Persistent cough for 3 days")}>Persistent Cough</button>
    </div>
    <style jsx>{`
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
    <style jsx>{`
      .typing-indicator { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 700; }
      .dots { display: flex; gap: 4px; }
      .dots span { width: 6px; height: 6px; background: #2563eb; border-radius: 50%; animation: bounce 1s infinite; }
      .dots span:nth-child(2) { animation-delay: 0.2s; }
      .dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    `}</style>
  </div>
);

export default ChatInterface;
