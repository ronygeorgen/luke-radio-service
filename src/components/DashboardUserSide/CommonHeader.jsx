import React, { useState } from 'react';
import { Settings, ArrowLeft, BarChart3, Users, ChevronDown, LogOut, FileText, Search, Layers, UserCog, Music, Plus, LifeBuoy } from 'lucide-react';
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
            {/* {showBackButton && (
              <Link
                to="/dashboard"
                className="flex items-center text-sm font-medium text-[#6C757D] hover:text-[#212529] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Back to Dashboard
              </Link>
            )} */}

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
                  <div className="absolute right-0 mt-1 w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 z-30">
                    <div className="py-3">
                      <div className="grid grid-cols-2 gap-2 px-2">
                        <div>
                          <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Channels</div>
                          <button onClick={() => handleNavigation('/user-channels')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <Search className="w-4 h-4 mr-3 text-gray-500" />
                            Search
                          </button>
                          <button onClick={() => handleNavigation('/dashboard')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                            Dashboard
                          </button>
                          <button onClick={() => handleNavigation(`/reports`)} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <FileText className="w-4 h-4 mr-3 text-gray-500" />
                            Reports
                          </button>
                          <button onClick={() => { window.open('https://forms.clickup.com/9003066468/f/8c9zt34-21136/O2BX6CH5IROJJDHYMW', '_blank', 'noopener,noreferrer'); setMenuOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <LifeBuoy className="w-4 h-4 mr-3 text-gray-500" />
                            Support Ticket
                          </button>
                        </div>
                        <div>
                          <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Settings</div>
                          <button onClick={() => handleNavigation('/dashboard/settings')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <Settings className="w-4 h-4 mr-3 text-gray-500" />
                            Topic Settings
                          </button>
                          <button onClick={() => handleNavigation('/admin/audio')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <Music className="w-4 h-4 mr-3 text-gray-500" />
                            Audio Management
                          </button>
                          <button onClick={() => handleNavigation('/admin/settings')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <Layers className="w-4 h-4 mr-3 text-gray-500" />
                            General Settings
                          </button>
                          <button onClick={() => handleNavigation('/admin/users')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <UserCog className="w-4 h-4 mr-3 text-gray-500" />
                            User Management
                          </button>
                          <button onClick={() => handleNavigation('/admin/users')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <Plus className="w-4 h-4 mr-3 text-gray-500" />
                            Create New User
                          </button>
                          <button onClick={() => handleNavigation('/admin/channels')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <Layers className="w-4 h-4 mr-3 text-gray-500" />
                            Channel Settings
                          </button>
                          <button onClick={() => handleNavigation('/admin/channels')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <Plus className="w-4 h-4 mr-3 text-gray-500" />
                            Onboard Channel
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button onClick={handleLogout} className="mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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