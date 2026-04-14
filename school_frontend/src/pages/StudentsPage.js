import React, { useEffect, useState } from 'react';
import { studentsAPI, usersAPI } from '../api/services';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [parents,  setParents]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [msg,      setMsg]      = useState('');
  const [form, setForm] = useState({
    student_id: '', first_name: '', last_name: '',
    class_name: '', date_of_birth: '', parent: '',
  });

  const load = async (q = '') => {
    setLoading(true);
    const [s, u] = await Promise.all([studentsAPI.list(q), usersAPI.list()]);
    setStudents(s.data.results || s.data);
    setParents((u.data.results || u.data).filter(u => u.role === 'parent'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ student_id: '', first_name: '', last_name: '', class_name: '', date_of_birth: '', parent: '' });
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      student_id: s.student_id, first_name: s.first_name, last_name: s.last_name,
      class_name: s.class_name, date_of_birth: s.date_of_birth || '', parent: s.parent || '',
    });
    setShowForm(true);
  };

  const submit = async e => {
    e.preventDefault();
    try {
      const payload = { ...form, parent: form.parent || null };
      if (editing) await studentsAPI.update(editing.id, payload);
      else         await studentsAPI.create(payload);
      setMsg(editing ? 'Student updated!' : 'Student created!');
      setShowForm(false);
      load();
    } catch (err) {
      setMsg('Error: ' + JSON.stringify(err.response?.data));
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    await studentsAPI.delete(id);
    load();
  };

  return (
    <>
      <div className="page-header">
        <h1>Students</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ New Student</button>
      </div>

      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg}</div>}

      <div style={{ marginBottom: 20 }}>
        <input
          className="form-input"
          placeholder="Search students…"
          value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value); }}
          style={{ maxWidth: 320 }}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480 }}>
            <div className="page-header" style={{ marginBottom: 20 }}>
              <h2>{editing ? 'Edit Student' : 'New Student'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input className="form-input" value={form.student_id}
                    onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <input className="form-input" value={form.class_name}
                    onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))} required
                    placeholder="e.g. Grade 8A" />
                </div>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={form.date_of_birth}
                    onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent</label>
                  <select className="form-select" value={form.parent}
                    onChange={e => setForm(f => ({ ...f, parent: e.target.value }))}>
                    <option value="">— None —</option>
                    {parents.map(p => (
                      <option key={p.id} value={p.id}>{p.username} ({p.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary" type="submit">
                  {editing ? 'Save Changes' : 'Create Student'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="spinner" /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Parent</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '.8rem', color: 'var(--text-2)' }}>
                    {s.student_id}
                  </td>
                  <td><strong>{s.full_name}</strong></td>
                  <td>{s.class_name}</td>
                  <td>{s.parent_detail?.username || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: '.85rem' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(s.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty"><div className="empty-icon">👤</div><p>No students found.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
