import React, { useState } from 'react';
import { Settings, ArrowLeft, BarChart3, Users, ChevronDown, LogOut, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const CommonHeader = ({ title, subtitle, children, showBackButton = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const channelId = localStorage.getItem('channelId');
  const channelName = localStorage.getItem('channelName');

  const handleLogout = () => {
    dispatch(logout());
    setMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="bg-white border-b border-[#E9ECEF] sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Section - Navigation and Title */}
          <div className="flex items-center space-x-12">
            {/* Back Button */}
            {showBackButton && (
              <Link
                to="/dashboard"
                className="flex items-center text-sm font-medium text-[#6C757D] hover:text-[#212529] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Back to Dashboard
              </Link>
            )}

            {/* Title Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4B7DF5] to-[#3A63E0] rounded-2xl blur opacity-75"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#4B7DF5] to-[#3A63E0] rounded-2xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#212529] tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-gray-600 text-sm mt-0.5 font-medium">
                    {subtitle}
                  </p>
                )}
                {channelName && (
                  <div className="flex items-center text-sm text-[#6C757D] mt-0.5">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    {channelName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Settings Dropdown and Additional Content */}
          <div className="flex items-center space-x-3">
            {/* Custom Children Content */}
            {children && (
              <div className="flex items-center space-x-3 mr-4">
                {children}
              </div>
            )}

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-30">
                    <div className="py-2">
                      {/* Reports Button */}
                      <button
                        onClick={() => handleNavigation(`/reports`)}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-3 text-gray-500" />
                        Reports
                      </button>

                      {/* My Channels Button */}
                      <button
                        onClick={() => handleNavigation('/user-channels')}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        <Users className="w-4 h-4 mr-3 text-gray-500" />
                        My Channels
                      </button>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-1"></div>

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

 
    </div>
  );
};

export default CommonHeader;