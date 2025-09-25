import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';

import AdminLayout from './layouts/AdminLayout';
import ChannelsPage from './pages/admin/ChannelsPage';
import SettingsPage from './pages/admin/SettingsPage';
import UserChannelsPage from './pages/user/UserChannelsPage';
import UserAudioSegmentsPage from './pages/user/AudioSegmentsPage';
import Dashboard from './components/DashboardUserSide/Dashboard';
import AppStateHydrator from './components/AppStateHydrator';
import DashboardSettingsPage from './components/DashboardUserSide/DashboardSettingsPage';
import ReportsPage from './pages/user/ReportsPage';
import ReportDetailPage from './pages/user/ReportDetailPage';
import AdminLogin from './pages/admin/AdminLogin';
import CreatePassword from './pages/user/Createpassword';
import UserLogin from './pages/user/UserLogin';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import LandingRedirect from './components/LandingRedirect';
import UserManagement from './pages/admin/UserManagement';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppStateHydrator />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/admin-login" element={
              <PublicRoute restricted>
                <AdminLogin />
              </PublicRoute>
            } />
            <Route path="/user-login" element={
              <PublicRoute restricted>
                <UserLogin />
              </PublicRoute>
            } />
            <Route path="/create-password" element={<CreatePassword />} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="channels" replace />} />
              <Route path="channels" element={<ChannelsPage />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Protected User Routes */}
            <Route path="/user-channels" element={
              <ProtectedRoute>
                <UserChannelsPage />
              </ProtectedRoute>
            } />
            <Route path="/channels/:channelId/segments" element={
              <ProtectedRoute>
                <UserAudioSegmentsPage />
              </ProtectedRoute>
            } />

            {/* Protected User Report Routes */}
            <Route path="/reports" element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="/reports/:id" element={
              <ProtectedRoute>
                <ReportDetailPage />
              </ProtectedRoute>
            } />

            {/* Protected User Dashboard Route */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute>
                <DashboardSettingsPage />
              </ProtectedRoute>
            } />

            {/* Public Landing Page */}
            <Route path="/" element={<LandingRedirect />} />

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;