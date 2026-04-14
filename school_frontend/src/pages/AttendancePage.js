import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { studentsAPI, attendanceAPI } from '../api/services';

export default function AttendancePage() {
  const [searchParams]  = useSearchParams();
  const [students,  setStudents]  = useState([]);
  const [records,   setRecords]   = useState([]);
  const [selected,  setSelected]  = useState(searchParams.get('student') || '');
  const [loading,   setLoading]   = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [msg,       setMsg]       = useState('');
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], is_present: true, note: '' });

  useEffect(() => {
    studentsAPI.list().then(r => setStudents(r.data.results || r.data));
  }, []);

  useEffect(() => {
    if (selected) loadRecords();
  }, [selected]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.list(selected);
      setRecords(res.data.results || res.data);
    } finally {
      setLoading(false);
    }
  };

  const submit = async e => {
    e.preventDefault();
    try {
      await attendanceAPI.create({
        student:    parseInt(selected),
        date:       form.date,
        is_present: form.is_present,
        note:       form.note,
      });
      setMsg('Attendance recorded!');
      setShowForm(false);
      loadRecords();
    } catch (err) {
      setMsg('Error: ' + JSON.stringify(err.response?.data));
    }
  };

  const total   = records.length;
  const present = records.filter(r => r.is_present).length;
  const pct     = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

  return (
    <>
      <div className="page-header">
        <h1>Attendance</h1>
        {selected && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Record</button>}
      </div>

      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg}</div>}

      <div style={{ marginBottom: 24 }}>
        <select className="form-select" value={selected} onChange={e => setSelected(e.target.value)} style={{ minWidth: 240 }}>
          <option value="">Select student…</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.student_id})</option>)}
        </select>
      </div>

      {selected && !loading && (
        <div className="card-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Days</div>
            <div className="stat-value">{total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Present</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{present}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Absent</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{total - present}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Attendance %</div>
            <div className="stat-value" style={{ color: pct >= 80 ? 'var(--success)' : 'var(--danger)' }}>
              {pct}%
            </div>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <div className="page-header" style={{ marginBottom: 20 }}>
              <h2>Record Attendance</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button"
                    className={`btn ${form.is_present ? 'btn-success' : 'btn-ghost'}`}
                    onClick={() => setForm(f => ({ ...f, is_present: true }))}>
                    ✓ Present
                  </button>
                  <button type="button"
                    className={`btn ${!form.is_present ? 'btn-danger' : 'btn-ghost'}`}
                    onClick={() => setForm(f => ({ ...f, is_present: false }))}>
                    ✕ Absent
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="form-input" value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Sick leave" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit">Save</button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!selected ? (
        <div className="empty"><div className="empty-icon">📅</div><p>Select a student to view attendance.</p></div>
      ) : loading ? (
        <div className="spinner" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Status</th><th>Note</th><th>Recorded by</th></tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>
                    <span className={`badge ${r.is_present ? 'badge-green' : 'badge-red'}`}>
                      {r.is_present ? 'Present' : 'Absent'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{r.note || '—'}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: '.85rem' }}>{r.recorded_by_name}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={4}>
                  <div className="empty"><div className="empty-icon">📅</div><p>No attendance records.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
