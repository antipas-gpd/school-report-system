import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const [form, setForm]     = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login }           = useAuth();
  const { dark, toggle }    = useTheme();
  const navigate            = useNavigate();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <button className="theme-toggle" onClick={toggle}>
          {dark ? '☀ Light' : '◑ Dark'}
        </button>
      </div>

      <div className="login-card">
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🏫</div>
          <h1>Welcome back</h1>
          <p>Sign in to SchoolReport</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              name="username"
              value={form.username}
              onChange={handle}
              placeholder="Enter username"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              name="password"
              type="password"
              value={form.password}
              onChange={handle}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="divider" />
        <div style={{ fontSize: '.8rem', color: 'var(--text-3)' }}>
          <strong style={{ color: 'var(--text-2)' }}>Demo accounts</strong><br />
          headmaster / Admin123! &nbsp;·&nbsp; ms_johnson / Teacher123!<br />
          bursar_kate / Bursar123! &nbsp;·&nbsp; parent_alice / Parent123!
        </div>
      </div>
    </div>
  );
}
