import React, { useEffect, useState } from 'react';
import { feesAPI, studentsAPI } from '../api/services';

export default function FeesPage() {
  const [fees,     setFees]     = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg,      setMsg]      = useState('');
  const [form, setForm] = useState({ student: '', total: '', paid: '', term: 'Term 1' });

  const load = async () => {
    setLoading(true);
    const [f, s] = await Promise.all([feesAPI.list(), studentsAPI.list()]);
    setFees(f.data.results || f.data);
    setStudents(s.data.results || s.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ student: '', total: '', paid: '', term: 'Term 1' });
    setShowForm(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({ student: f.student, total: f.total, paid: f.paid, term: f.term });
    setShowForm(true);
  };

  const submit = async e => {
    e.preventDefault();
    try {
      const payload = { ...form, student: parseInt(form.student), total: parseFloat(form.total), paid: parseFloat(form.paid) };
      if (editing) await feesAPI.update(editing.id, payload);
      else         await feesAPI.create(payload);
      setMsg(editing ? 'Fee updated!' : 'Fee created!');
      setShowForm(false);
      load();
    } catch (err) {
      setMsg('Error: ' + JSON.stringify(err.response?.data));
    }
  };

  const totalOwing = fees.reduce((acc, f) => acc + parseFloat(f.balance || 0), 0);
  const totalPaid  = fees.reduce((acc, f) => acc + parseFloat(f.paid || 0), 0);

  return (
    <>
      <div className="page-header">
        <h1>Fees</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Fee</button>
      </div>

      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg}</div>}

      <div className="card-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Collected</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>${totalPaid.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>${totalOwing.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fully Paid</div>
          <div className="stat-value">{fees.filter(f => f.is_fully_paid).length} / {fees.length}</div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 420 }}>
            <div className="page-header" style={{ marginBottom: 20 }}>
              <h2>{editing ? 'Update Fee' : 'Add Fee'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              {!editing && (
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select className="form-select" value={form.student}
                    onChange={e => setForm(f => ({ ...f, student: e.target.value }))} required>
                    <option value="">Select student…</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Term</label>
                <select className="form-select" value={form.term}
                  onChange={e => setForm(f => ({ ...f, term: e.target.value }))}>
                  <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Total Amount ($)</label>
                <input className="form-input" type="number" min="0" step="0.01" value={form.total}
                  onChange={e => setForm(f => ({ ...f, total: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount Paid ($)</label>
                <input className="form-input" type="number" min="0" step="0.01" value={form.paid}
                  onChange={e => setForm(f => ({ ...f, paid: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit">{editing ? 'Update' : 'Create'}</button>
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
              <tr>
                <th>Student</th>
                <th>Term</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fees.map(f => (
                <tr key={f.id}>
                  <td><strong>{f.student_name}</strong></td>
                  <td>{f.term}</td>
                  <td>${f.total}</td>
                  <td style={{ color: 'var(--success)' }}>${f.paid}</td>
                  <td style={{ color: parseFloat(f.balance) > 0 ? 'var(--danger)' : 'var(--text-2)' }}>
                    ${f.balance}
                  </td>
                  <td>
                    <span className={`badge ${f.is_fully_paid ? 'badge-green' : 'badge-red'}`}>
                      {f.is_fully_paid ? 'Paid' : 'Owing'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)}>Edit</button>
                  </td>
                </tr>
              ))}
              {fees.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty"><div className="empty-icon">💰</div><p>No fee records.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
