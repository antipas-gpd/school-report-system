import api from './axios';

// ── Auth ──────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  me:    ()                   => api.get('/users/me/'),
};

// ── Users ─────────────────────────────────────────────────────────────
export const usersAPI = {
  list:   ()         => api.get('/users/'),
  create: (data)     => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id)       => api.delete(`/users/${id}/`),
};

// ── Students ──────────────────────────────────────────────────────────
export const studentsAPI = {
  list:   (search = '') => api.get(`/students/${search ? `?search=${search}` : ''}`),
  get:    (id)          => api.get(`/students/${id}/`),
  create: (data)        => api.post('/students/', data),
  update: (id, data)    => api.patch(`/students/${id}/`, data),
  delete: (id)          => api.delete(`/students/${id}/`),
};

// ── Subjects ──────────────────────────────────────────────────────────
export const subjectsAPI = {
  list:   () => api.get('/subjects/'),
  create: (data) => api.post('/subjects/', data),
};

// ── Marks ─────────────────────────────────────────────────────────────
export const marksAPI = {
  list:   (studentId, term) => api.get(`/marks/?student=${studentId}&term=${term}`),
  create: (data)            => api.post('/marks/', data),
  update: (id, data)        => api.patch(`/marks/${id}/`, data),
  delete: (id)              => api.delete(`/marks/${id}/`),
};

// ── Attendance ────────────────────────────────────────────────────────
export const attendanceAPI = {
  list:   (studentId) => api.get(`/attendance/?student=${studentId}`),
  create: (data)      => api.post('/attendance/', data),
  update: (id, data)  => api.patch(`/attendance/${id}/`, data),
};

// ── Fees ──────────────────────────────────────────────────────────────
export const feesAPI = {
  list:   ()         => api.get('/fees/'),
  get:    (id)       => api.get(`/fees/${id}/`),
  create: (data)     => api.post('/fees/', data),
  update: (id, data) => api.patch(`/fees/${id}/`, data),
};

// ── Reports ───────────────────────────────────────────────────────────
export const reportsAPI = {
  list:     ()              => api.get('/reports/'),
  generate: (studentId, term = 'Term 1') =>
    api.get(`/generate-report/${studentId}/?term=${encodeURIComponent(term)}`),
  approve:  (reportId)     => api.post(`/approve-report/${reportId}/`),
  comment:  (reportId, teacher_comment) =>
    api.patch(`/reports/${reportId}/comment/`, { teacher_comment }),
};
