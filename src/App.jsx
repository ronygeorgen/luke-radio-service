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

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppStateHydrator /> {/* Move AppStateHydrator here */}
          <Routes>
            {/* Landing Page → Now UserChannelsPage */}
            <Route path="/" element={<UserChannelsPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="channels" replace />} />
              <Route path="channels" element={<ChannelsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* User Routes */}
            <Route path="/user-channels" element={<UserChannelsPage />} />
            <Route path="/channels/:channelId/segments" element={<UserAudioSegmentsPage />} />

            {/* Dashboard Route */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/settings" element={<DashboardSettingsPage />} />

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;