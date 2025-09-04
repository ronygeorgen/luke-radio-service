import { Outlet } from 'react-router-dom';
import { Settings, Layers } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

const AdminLayout = () => {
    const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-1">Manage your channels and system settings</p>
            </div>
              <button
                onClick={() => navigate("/user-channels")}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 
                          text-white rounded-lg font-medium shadow-md 
                          hover:from-blue-600 hover:to-blue-700 
                          focus:outline-none focus:ring-2 focus:ring-offset-1 
                          focus:ring-blue-500 transition"
              >
                Switch to Channels
            </button>
          </div>
          
          <div className="flex space-x-8 border-b border-gray-200">
            <NavLink
              to="/admin/channels"
              className={({ isActive }) =>
                `flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <Layers className="h-5 w-5" />
              <span>Channel Onboard</span>
            </NavLink>
            
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <Settings className="h-5 w-5" />
              <span>General Settings</span>
            </NavLink>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;