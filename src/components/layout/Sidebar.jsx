import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  UploadCloud, 
  FileText, 
  User, 
  LogOut, 
  Sun, 
  Moon, 
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, theme, toggleTheme, sidebarState, setSidebarMinimized, setSidebarExpanded, setSidebarHidden } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleToggleMinimize = () => {
    if (sidebarState === 'expanded') {
      setSidebarMinimized();
    } else if (sidebarState === 'minimized') {
      setSidebarExpanded();
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    const first = user.first_name ? user.first_name[0] : '';
    const last = user.last_name ? user.last_name[0] : '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <aside className={`sidebar sidebar-${sidebarState}`}>
      <div className="sidebar-brand">
        <BrainCircuit size={28} className="brand-icon" />
        {sidebarState !== 'hidden' && (
          <>
            <span className="brand-text">Doc-Sense AI</span>
            <button 
              className="sidebar-toggle-btn minimize-btn"
              onClick={handleToggleMinimize}
              title={sidebarState === 'expanded' ? 'Minimize sidebar' : 'Expand sidebar'}
              aria-label="Toggle sidebar size"
              aria-pressed={sidebarState === 'minimized'}
            >
              {sidebarState === 'expanded' ? (
                <ChevronLeft size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <UploadCloud size={20} />
          <span>Upload PDF</span>
        </NavLink>

        <NavLink 
          to="/documents" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={20} />
          <span>My Documents</span>
        </NavLink>

        <NavLink 
          to="/profile" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Profile & Security</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? (
            <>
              <Sun size={18} />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={18} />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {user && (
          <div className="user-profile-summary">
            <div className="user-avatar">{getInitials()}</div>
            <div className="user-info">
              <div className="user-name">{user.first_name} {user.last_name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>

        {sidebarState !== 'hidden' && (
          <button 
            className="hide-sidebar-btn"
            onClick={() => setSidebarHidden()}
            title="Hide sidebar"
            aria-label="Hide sidebar"
          >
            <X size={18} />
            <span>Hide Sidebar</span>
          </button>
        )}
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          background-color: var(--bg-sidebar);
          color: var(--sidebar-text);
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border-color);
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 100;
          transition: width var(--sidebar-transition-duration) ease, transform var(--sidebar-transition-duration) ease;
          overflow: hidden;
        }

        .sidebar.sidebar-minimized {
          width: var(--sidebar-minimized-width);
        }

        .sidebar.sidebar-hidden {
          transform: translateX(-100%);
          position: fixed;
          left: 0;
          width: var(--sidebar-width);
          z-index: 999;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
        }

        .sidebar-brand {
          padding: 2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .brand-icon {
          color: var(--accent-color);
        }

        .brand-text {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: -0.5px;
          color: #ffffff;
        }

        .sidebar.sidebar-minimized .brand-text {
          display: none;
        }

        .sidebar-toggle-btn.minimize-btn {
          background: transparent;
          border: none;
          color: var(--sidebar-text-muted);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          margin-left: auto;
          transition: all var(--transition-fast);
        }

        .sidebar-toggle-btn.minimize-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .sidebar-toggle-btn.minimize-btn:focus {
          outline: 2px solid var(--accent-color);
          outline-offset: 2px;
        }

        .sidebar-nav {
          padding: 1.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .sidebar.sidebar-minimized .sidebar-nav {
          padding: 1rem 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 1rem;
          color: var(--sidebar-text-muted);
          text-decoration: none;
          border-radius: var(--border-radius-md);
          font-size: 0.9rem;
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .sidebar.sidebar-minimized .nav-item {
          justify-content: center;
          padding: 0.75rem 0.5rem;
        }

        .sidebar.sidebar-minimized .nav-item span {
          display: none;
        }

        .nav-item:hover {
          color: #ffffff;
          background-color: var(--sidebar-hover-bg);
        }

        .nav-item:focus {
          outline: 2px solid var(--accent-color);
          outline-offset: -2px;
        }

        .nav-item.active {
          color: #ffffff;
          background-color: var(--sidebar-active-bg);
          border-left: 3px solid var(--accent-color);
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }

        .sidebar.sidebar-minimized .nav-item.active {
          border-left: none;
          border-radius: var(--border-radius-md);
        }

        .sidebar-footer {
          padding: 1rem 0.75rem 1.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .theme-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.625rem 1rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--border-radius-md);
          color: var(--sidebar-text-muted);
          font-size: 0.85rem;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .sidebar.sidebar-minimized .theme-toggle-btn {
          justify-content: center;
          padding: 0.625rem;
          width: 100%;
        }

        .sidebar.sidebar-minimized .theme-toggle-btn span {
          display: none;
        }

        .theme-toggle-btn:hover {
          color: #ffffff;
          background-color: var(--sidebar-hover-bg);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .theme-toggle-btn:focus {
          outline: 2px solid var(--accent-color);
          outline-offset: 2px;
        }

        .user-profile-summary {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.5rem;
          background-color: rgba(255, 255, 255, 0.02);
          border-radius: var(--border-radius-lg);
        }

        .sidebar.sidebar-minimized .user-profile-summary {
          justify-content: center;
          padding: 0.5rem;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--accent-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .sidebar.sidebar-minimized .user-info {
          display: none;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--sidebar-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          text-align: left;
          border-radius: var(--border-radius-md);
          transition: all var(--transition-fast);
        }

        .sidebar.sidebar-minimized .logout-btn {
          justify-content: center;
          padding: 0.75rem 0.5rem;
        }

        .sidebar.sidebar-minimized .logout-btn span {
          display: none;
        }

        .logout-btn:hover {
          background-color: rgba(239, 68, 68, 0.08);
        }

        .logout-btn:focus {
          outline: 2px solid var(--accent-color);
          outline-offset: -2px;
        }

        .hide-sidebar-btn {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.625rem 1rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--border-radius-md);
          color: var(--sidebar-text-muted);
          font-size: 0.85rem;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .sidebar.sidebar-minimized .hide-sidebar-btn {
          justify-content: center;
          padding: 0.625rem;
        }

        .sidebar.sidebar-minimized .hide-sidebar-btn span {
          display: none;
        }

        .hide-sidebar-btn:hover {
          color: #ffffff;
          background-color: var(--sidebar-hover-bg);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .hide-sidebar-btn:focus {
          outline: 2px solid var(--accent-color);
          outline-offset: 2px;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
