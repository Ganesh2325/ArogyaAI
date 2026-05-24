import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, MessageSquare, Camera, MapPin, BarChart2,
  Clock, Pill, AlertTriangle, FileText, Users,
  Brain, TrendingUp, Bell, LogOut, Menu, X
} from 'lucide-react';
import '../styles/DashboardLayout.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'AI Consultation', icon: MessageSquare, path: '/chat' },
    { name: 'Symptom Scanner', icon: Camera, path: '/scanner' },
    { name: 'Health Analytics', icon: BarChart2, path: '/analytics' },
    { name: 'Risk Prediction', icon: TrendingUp, path: '/risks' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="logo-box">
          <ActivityIcon />
        </div>
        <h2>ArogyaAI</h2>
        <button className="menu-toggle-btn" onClick={toggleSidebar}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="collapse-btn desktop-only" onClick={handleToggleCollapse} title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
            <Menu size={18} />
          </button>
          <div className="logo-box">
            <ActivityIcon />
          </div>
          <h2 className="sidebar-logo-text">ArogyaAI</h2>
          <button className="mobile-close-btn mobile-only" onClick={closeSidebar} title="Close Menu">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-scrollable">
          <nav className="nav-menu">
            {navItems.map(item => (
              <NavLink key={item.path} to={item.path} onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={18} className="nav-icon" />
                <span className="nav-label">{item.name}</span>
                <span className="tooltip">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item logout-btn">
            <LogOut size={18} className="nav-icon" />
            <span className="nav-label">Logout</span>
            <span className="tooltip">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

export default DashboardLayout;
