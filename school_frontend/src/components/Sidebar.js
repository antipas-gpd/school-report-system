import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = {
  admin: [
    { label: 'Dashboard',  icon: '◈', path: '/dashboard' },
    { label: 'Students',   icon: '◉', path: '/students' },
    { label: 'Reports',    icon: '◎', path: '/reports' },
    { label: 'Users',      icon: '◍', path: '/users' },
  ],
  teacher: [
    { label: 'Dashboard',  icon: '◈', path: '/dashboard' },
    { label: 'Students',   icon: '◉', path: '/students' },
    { label: 'Marks',      icon: '◎', path: '/marks' },
    { label: 'Attendance', icon: '◌', path: '/attendance' },
  ],
  bursar: [
    { label: 'Dashboard',  icon: '◈', path: '/dashboard' },
    { label: 'Fees',       icon: '◎', path: '/fees' },
  ],
  parent: [
    { label: 'My Child',   icon: '◈', path: '/dashboard' },
  ],
};

const ROLE_LABELS = {
  admin:   'Headmaster',
  teacher: 'Teacher',
  bursar:  'Bursar',
  parent:  'Parent',
};

export default function Sidebar() {
  const { user, logout }  = useAuth();
  const { dark, toggle }  = useTheme();
  const navigate          = useNavigate();
  const { pathname }      = useLocation();

  if (!user) return null;

  const items = NAV_ITEMS[user.role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>🏫 SchoolReport</h2>
        <span>{ROLE_LABELS[user.role] || user.role}</span>
      </div>

      <nav className="sidebar-nav">
        {items.map(item => (
          <button
            key={item.path}
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: '.8rem', color: 'var(--text-3)', padding: '0 4px', marginBottom: 4 }}>
          {user.first_name || user.username}
        </div>
        <button className="theme-toggle" onClick={toggle}>
          {dark ? '☀ Light' : '◑ Dark'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
