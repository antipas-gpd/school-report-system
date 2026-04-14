import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

import LoginPage      from './pages/LoginPage';
import DashboardPage  from './pages/DashboardPage';
import StudentsPage   from './pages/StudentsPage';
import MarksPage      from './pages/MarksPage';
import AttendancePage from './pages/AttendancePage';
import FeesPage       from './pages/FeesPage';
import ReportsPage    from './pages/ReportsPage';
import UsersPage      from './pages/UsersPage';

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/"      element={<Navigate to="/dashboard" replace />} />

            {/* Protected — all authenticated users */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout><DashboardPage /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Admin + Teacher */}
            <Route path="/students" element={
              <ProtectedRoute roles={['admin', 'teacher']}>
                <AppLayout><StudentsPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/marks" element={
              <ProtectedRoute roles={['admin', 'teacher']}>
                <AppLayout><MarksPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute roles={['admin', 'teacher']}>
                <AppLayout><AttendancePage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute roles={['admin', 'teacher']}>
                <AppLayout><ReportsPage /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Admin only */}
            <Route path="/users" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><UsersPage /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Bursar */}
            <Route path="/fees" element={
              <ProtectedRoute roles={['admin', 'bursar']}>
                <AppLayout><FeesPage /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
