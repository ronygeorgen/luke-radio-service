import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import AdminLayout from './layouts/AdminLayout';
import ChannelsPage from './pages/admin/ChannelsPage';
import SettingsPage from './pages/admin/SettingsPage';
import UserChannelsPage from './pages/user/UserChannelsPage';
import UserAudioSegmentsPage from './pages/user/AudioSegmentsPage';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Admin Routes - nested under /admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="channels" replace />} />
              <Route path="channels" element={<ChannelsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* User Routes - not nested */}
            <Route path="/" element={<UserChannelsPage />} />
            <Route path="/user-channels" element={<UserChannelsPage />} />
            <Route path="/channels/:channelId/segments" element={<UserAudioSegmentsPage />} />

            {/* Default redirect - only needed if you want to redirect from other paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;