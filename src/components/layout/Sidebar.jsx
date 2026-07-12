import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  UploadCloud,
  FileText,
  FolderKanban,
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
  const {
    user,
    logout,
    theme,
    toggleTheme,
    sidebarState,
    setSidebarMinimized,
    setSidebarExpanded,
    setSidebarHidden
  } = useAuth();
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
        <span className="brand-icon-wrap" aria-hidden="true">
          <BrainCircuit size={25} className="brand-icon" />
        </span>
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
              {sidebarState === 'expanded' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UploadCloud size={20} />
          <span>Upload PDF</span>
        </NavLink>

        <NavLink to="/documents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>My Documents</span>
        </NavLink>

        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FolderKanban size={20} />
          <span>Projects</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={20} />
          <span>Profile &amp; Security</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
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
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          flex-direction: column;
          width: var(--sidebar-width);
          height: 100vh;
          overflow: hidden;
          color: var(--sidebar-text);
          background: var(--bg-sidebar);
          border-right: 1px solid var(--sidebar-border);
          box-shadow: var(--shadow-sm);
          transition: width var(--sidebar-transition-duration) ease, transform var(--sidebar-transition-duration) ease;
        }

        .sidebar.sidebar-minimized { width: var(--sidebar-minimized-width); }

        .sidebar.sidebar-hidden {
          position: fixed;
          left: 0;
          z-index: 999;
          width: var(--sidebar-width);
          transform: translateX(-100%);
          box-shadow: var(--shadow-lg);
        }

        .sidebar-brand {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-height: 88px;
          padding: 1.25rem 1rem 1.25rem 1.25rem;
          border-bottom: 1px solid var(--sidebar-border);
        }

        .brand-icon-wrap {
          display: grid;
          flex: 0 0 auto;
          width: 46px;
          height: 46px;
          place-items: center;
          color: var(--accent-color);
          background: var(--accent-light);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
        }

        .brand-icon { color: inherit; }

        .brand-text {
          min-width: 0;
          color: var(--sidebar-text);
          font-family: var(--font-display);
          font-size: 1.22rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }

        .sidebar-toggle-btn,
        .theme-toggle-btn,
        .logout-btn,
        .hide-sidebar-btn {
          min-width: 44px;
          min-height: 44px;
          font-family: var(--font-sans);
        }

        .sidebar-toggle-btn.minimize-btn {
          display: grid;
          flex: 0 0 auto;
          width: 44px;
          height: 44px;
          margin-left: auto;
          padding: 0;
          place-items: center;
          color: var(--sidebar-text-muted);
          background: var(--sidebar-user-bg);
          border: 1px solid var(--sidebar-control-border);
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sidebar-toggle-btn.minimize-btn:hover {
          color: var(--sidebar-text);
          background: var(--sidebar-hover-bg);
          border-color: var(--sidebar-control-border-hover);
        }

        .sidebar-nav {
          position: relative;
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 0.45rem;
          padding: 1.25rem 0.9rem;
        }

        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          min-height: 48px;
          padding: 0.78rem 0.95rem;
          overflow: hidden;
          color: var(--sidebar-text-muted);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--border-radius-md);
          font-size: 0.92rem;
          font-weight: 600;
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .nav-item svg { flex: 0 0 auto; }

        .nav-item:hover {
          color: var(--sidebar-text);
          background: var(--sidebar-hover-bg);
          border-color: var(--sidebar-border);
        }

        .nav-item.active {
          color: var(--sidebar-text);
          background: var(--sidebar-active-bg);
          border-color: var(--sidebar-control-border);
        }

        .sidebar-footer {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          padding: 1rem 0.9rem 1.1rem;
          border-top: 1px solid var(--sidebar-border);
        }

        .theme-toggle-btn,
        .logout-btn,
        .hide-sidebar-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.65rem 0.85rem;
          color: var(--sidebar-text-muted);
          background: var(--sidebar-user-bg);
          border: 1px solid var(--sidebar-control-border);
          border-radius: var(--border-radius-md);
          font-size: 0.84rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .theme-toggle-btn:hover,
        .hide-sidebar-btn:hover {
          color: var(--sidebar-text);
          background: var(--sidebar-hover-bg);
          border-color: var(--sidebar-control-border-hover);
        }

        .user-profile-summary {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-height: 58px;
          padding: 0.55rem;
          background: var(--sidebar-user-bg);
          border: 1px solid var(--sidebar-border);
          border-radius: var(--border-radius-lg);
        }

        .user-avatar {
          display: grid;
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          place-items: center;
          color: var(--accent-color);
          background: var(--accent-light);
          border-radius: 50%;
          font-size: 0.84rem;
          font-weight: 700;
        }

        .user-info {
          display: flex;
          min-width: 0;
          flex-direction: column;
        }

        .user-name,
        .user-email {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-name {
          color: var(--sidebar-text);
          font-size: 0.84rem;
          font-weight: 700;
        }

        .user-email {
          color: var(--sidebar-text-muted);
          font-size: 0.7rem;
        }

        .logout-btn {
          color: var(--danger-color);
          background: transparent;
          border-color: transparent;
        }

        .logout-btn:hover {
          background: var(--danger-light);
          border-color: var(--danger-light);
        }

        .sidebar.sidebar-minimized .brand-text,
        .sidebar.sidebar-minimized .nav-item span,
        .sidebar.sidebar-minimized .theme-toggle-btn span,
        .sidebar.sidebar-minimized .user-info,
        .sidebar.sidebar-minimized .logout-btn span,
        .sidebar.sidebar-minimized .hide-sidebar-btn span,
        .sidebar.sidebar-minimized .minimize-btn {
          display: none;
        }

        .sidebar.sidebar-minimized .sidebar-brand,
        .sidebar.sidebar-minimized .nav-item,
        .sidebar.sidebar-minimized .theme-toggle-btn,
        .sidebar.sidebar-minimized .user-profile-summary,
        .sidebar.sidebar-minimized .logout-btn,
        .sidebar.sidebar-minimized .hide-sidebar-btn {
          justify-content: center;
        }

        .sidebar.sidebar-minimized .sidebar-brand { padding-inline: 0; }
        .sidebar.sidebar-minimized .sidebar-nav { padding-inline: 0.7rem; }
        .sidebar.sidebar-minimized .nav-item { padding-inline: 0.5rem; }
        .sidebar.sidebar-minimized .sidebar-footer { padding-inline: 0.7rem; }

        @media (max-width: 767px) {
          .sidebar {
            position: fixed;
            left: 0;
            width: 74px;
            box-shadow: var(--shadow-md);
          }

          .sidebar-brand { justify-content: center; padding-inline: 0; }
          .sidebar .brand-text,
          .sidebar .minimize-btn,
          .sidebar .nav-item span,
          .sidebar .theme-toggle-btn span,
          .sidebar .user-info,
          .sidebar .logout-btn span,
          .sidebar .hide-sidebar-btn span { display: none; }
          .sidebar .sidebar-nav,
          .sidebar .sidebar-footer { padding-inline: 0.65rem; }
          .sidebar .nav-item,
          .sidebar .theme-toggle-btn,
          .sidebar .user-profile-summary,
          .sidebar .logout-btn,
          .sidebar .hide-sidebar-btn { justify-content: center; padding-inline: 0.5rem; }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
