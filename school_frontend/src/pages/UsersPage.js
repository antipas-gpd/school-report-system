import React, { useEffect, useState } from 'react';
import { usersAPI } from '../api/services';

const ROLES = ['admin', 'teacher', 'bursar', 'parent'];
const ROLE_LABELS = { admin: 'Admin', teacher: 'Teacher', bursar: 'Bursar', parent: 'Parent' };

export default function UsersPage() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg,      setMsg]      = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'teacher', first_name: '', last_name: '' });

  const load = () => {
    setLoading(true);
    usersAPI.list()
      .then(r => setUsers(r.data.results || r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    try {
      await usersAPI.create(form);
      setMsg('User created!');
      setShowForm(false);
      setForm({ username: '', email: '', password: '', role: 'teacher', first_name: '', last_name: '' });
      load();
    } catch (err) {
      setMsg('Error: ' + JSON.stringify(err.response?.data));
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await usersAPI.delete(id);
    load();
  };

  const roleBadge = role => {
    const map = { admin: 'badge-blue', teacher: 'badge-green', bursar: 'badge-yellow', parent: 'badge-gray' };
    return map[role] || 'badge-gray';
  };

  return (
    <>
      <div className="page-header">
        <h1>Users</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New User</button>
      </div>

      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg}</div>}

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480 }}>
            <div className="page-header" style={{ marginBottom: 20 }}>
              <h2>New User</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit">Create User</button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="spinner" /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.first_name} {u.last_name}</strong></td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '.85rem' }}>{u.username}</td>
                  <td style={{ color: 'var(--text-2)' }}>{u.email}</td>
                  <td><span className={`badge ${roleBadge(u.role)}`}>{ROLE_LABELS[u.role]}</span></td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => del(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
