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
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header desktop-only">
          <div className="logo-box">
            <ActivityIcon />
          </div>
          <h2>ArogyaAI</h2>
        </div>

        <div className="sidebar-scrollable">
          <nav className="nav-menu">
            {navItems.slice(0, 3).map(item => (
              <NavLink key={item.path} to={item.path} onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            ))}

            {navItems.slice(3, 6).map(item => (
              <NavLink key={item.path} to={item.path} onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
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
