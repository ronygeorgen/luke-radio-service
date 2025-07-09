import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import AdminLayout from './layouts/AdminLayout';
import ChannelsPage from './pages/admin/ChannelsPage';
import SettingsPage from './pages/admin/SettingsPage';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/channels" replace />} />
              <Route path="channels" element={<ChannelsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;