import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  if (loading) return null;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">🐕</span>
          <span className="navbar-logo-text">
            Dog<span className="gradient-text">food</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="navbar-links">
          <Link to="/events" className={`navbar-link${isActive('/events') ? ' active' : ''}`}>
            Events
          </Link>
          {user && (
            <Link to="/dashboard" className={`navbar-link${isActive('/dashboard') ? ' active' : ''}`}>
              Dashboard
            </Link>
          )}
        </div>

        {/* Auth section */}
        <div className="navbar-auth">
          {user ? (
            <div className="navbar-user">
              <div className="navbar-user-info" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="navbar-avatar">
                  {user.firstName?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                </div>
                <span className="navbar-username">{user.firstName ?? user.email}</span>
                <span className="navbar-chevron">{menuOpen ? '▲' : '▼'}</span>
              </div>
              {menuOpen && (
                <div className="navbar-dropdown animate-slide-down">
                  <div className="navbar-dropdown-header">
                    <p className="navbar-dropdown-name">{user.firstName} {user.lastName}</p>
                    <p className="navbar-dropdown-email">{user.email}</p>
                    <span className={`badge badge-${getRoleBadge(user.role)}`}>{user.role}</span>
                  </div>
                  <div className="navbar-dropdown-divider" />
                  <Link to="/dashboard" className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
                    📊 Dashboard
                  </Link>
                  <button className="navbar-dropdown-item navbar-dropdown-logout" onClick={handleLogout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth-btns">
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10, 12, 20, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          height: 64px;
          gap: 32px;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--text-primary);
          text-decoration: none;
          flex-shrink: 0;
        }
        .navbar-logo-icon { font-size: 1.4rem; }
        .navbar-links {
          display: flex;
          gap: 4px;
          flex: 1;
        }
        .navbar-link {
          padding: 6px 14px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          transition: all var(--transition);
          text-decoration: none;
        }
        .navbar-link:hover, .navbar-link.active {
          color: var(--text-primary);
          background: rgba(99,102,241,0.1);
        }
        .navbar-link.active { color: var(--accent-hover); }
        .navbar-auth { margin-left: auto; position: relative; }
        .navbar-auth-btns { display: flex; gap: 8px; }
        .navbar-user { position: relative; }
        .navbar-user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--transition);
          border: 1px solid transparent;
        }
        .navbar-user-info:hover {
          background: var(--bg-elevated);
          border-color: var(--border);
        }
        .navbar-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-purple));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.85rem; color: white;
          flex-shrink: 0;
        }
        .navbar-username { font-size: 0.9rem; font-weight: 500; }
        .navbar-chevron { font-size: 0.6rem; color: var(--text-muted); }
        .navbar-dropdown {
          position: absolute;
          right: 0; top: calc(100% + 8px);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          min-width: 220px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .navbar-dropdown-header { padding: 14px 16px; }
        .navbar-dropdown-name { font-weight: 600; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 2px; }
        .navbar-dropdown-email { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; }
        .navbar-dropdown-divider { height: 1px; background: var(--border); }
        .navbar-dropdown-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 11px 16px;
          color: var(--text-secondary); font-size: 0.9rem;
          background: none; border: none; cursor: pointer;
          font-family: var(--font-sans);
          text-decoration: none;
          transition: background var(--transition), color var(--transition);
        }
        .navbar-dropdown-item:hover { background: rgba(99,102,241,0.08); color: var(--text-primary); }
        .navbar-dropdown-logout { color: var(--accent-red); }
        .navbar-dropdown-logout:hover { background: rgba(239,68,68,0.08); }
      `}</style>
    </nav>
  );
}

function getRoleBadge(role: string): string {
  const map: Record<string, string> = {
    ADMIN: 'red',
    ORGANIZER: 'purple',
    JUDGE: 'orange',
    PARTICIPANT: 'blue',
    VISITOR: 'gray',
  };
  return map[role] ?? 'gray';
}
