import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { studentsAPI, subjectsAPI, marksAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function MarksPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [students,  setStudents]  = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [marks,     setMarks]     = useState([]);
  const [selected,  setSelected]  = useState(searchParams.get('student') || '');
  const [term,      setTerm]      = useState('Term 1');
  const [loading,   setLoading]   = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [msg,       setMsg]       = useState('');
  const [form, setForm] = useState({ subject: '', score: '', term: 'Term 1' });

  useEffect(() => {
    Promise.all([studentsAPI.list(), subjectsAPI.list()])
      .then(([s, sub]) => {
        setStudents(s.data.results || s.data);
        setSubjects(sub.data.results || sub.data);
      });
  }, []);

  useEffect(() => {
    if (selected) loadMarks();
  }, [selected, term]);

  const loadMarks = async () => {
    setLoading(true);
    try {
      const res = await marksAPI.list(selected, term);
      setMarks(res.data.results || res.data);
    } finally {
      setLoading(false);
    }
  };

  const submit = async e => {
    e.preventDefault();
    try {
      await marksAPI.create({
        student: parseInt(selected),
        subject: parseInt(form.subject),
        score:   parseFloat(form.score),
        term:    form.term,
      });
      setMsg('Mark saved!');
      setShowForm(false);
      setForm({ subject: '', score: '', term: 'Term 1' });
      loadMarks();
    } catch (err) {
      setMsg('Error: ' + JSON.stringify(err.response?.data));
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this mark?')) return;
    await marksAPI.delete(id);
    loadMarks();
  };

  const gradeColor = g => ({ A: 'var(--success)', B: 'var(--accent)', C: 'var(--warning)', D: 'var(--danger)' }[g] || 'var(--text)');

  return (
    <>
      <div className="page-header">
        <h1>Marks</h1>
        {selected && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Mark</button>}
      </div>

      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg}</div>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select className="form-select" value={selected} onChange={e => setSelected(e.target.value)} style={{ minWidth: 200 }}>
          <option value="">Select student…</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.student_id})</option>)}
        </select>
        <select className="form-select" value={term} onChange={e => setTerm(e.target.value)}>
          <option>Term 1</option>
          <option>Term 2</option>
          <option>Term 3</option>
        </select>
      </div>

      {/* Add Mark Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <div className="page-header" style={{ marginBottom: 20 }}>
              <h2>Add Mark</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required>
                  <option value="">Select subject…</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Score (0–100)</label>
                <input className="form-input" type="number" min="0" max="100" step="0.5"
                  value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Term</label>
                <select className="form-select" value={form.term}
                  onChange={e => setForm(f => ({ ...f, term: e.target.value }))}>
                  <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit">Save Mark</button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!selected ? (
        <div className="empty"><div className="empty-icon">📝</div><p>Select a student to view marks.</p></div>
      ) : loading ? (
        <div className="spinner" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Term</th>
                <th>Recorded by</th>
                {user?.role !== 'parent' && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {marks.map(m => (
                <tr key={m.id}>
                  <td><strong>{m.subject_detail?.name}</strong></td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '.8rem', color: 'var(--text-2)' }}>
                    {m.subject_detail?.code}
                  </td>
                  <td>{m.score}</td>
                  <td><span style={{ color: gradeColor(m.grade), fontWeight: 700 }}>{m.grade}</span></td>
                  <td>{m.term}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: '.85rem' }}>{m.recorded_by_name}</td>
                  {user?.role !== 'parent' && (
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => del(m.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {marks.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty"><div className="empty-icon">📊</div><p>No marks for {term}.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
