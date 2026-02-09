import React, { useState, useRef, useEffect } from 'react';
import { Menu, Settings, BarChart3, FileText, Search, LifeBuoy, Music, Layers, UserCog, Plus, Clock, Filter, LogOut, Radio, Flag, Ban, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import UploadCustomAudioModal from '../UploadCustomAudioModal';

const CommonHeader = ({ title, subtitle, children }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const channelName = localStorage.getItem('channelName');

  const handleLogout = () => {
    dispatch(logout());
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigation = (path) => {
    // Don't require channel for /admin/channels page
    if (path.includes('/admin/channels')) {
      navigate(path);
      setIsDropdownOpen(false);
      return;
    }

    const channelId = localStorage.getItem('channelId');
    if (!channelId) {
      // If no channel ID, navigate to user channels to select one
      navigate('/user-channels');
      setIsDropdownOpen(false);
      return;
    }

    navigate(path);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <header className="sw-header">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full space-x-4">

            {/* Page Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {title}
              </h1>
              {channelName && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {channelName}
                  </span>
                </div>
              )}
            </div>

            {/* Right Section - Additional Content and Navigation */}
            <div className="flex items-center space-x-2">
              {/* Custom Children Content */}
              {children && (
                <div className="flex items-center space-x-3 mr-4">
                  {children}
                </div>
              )}

              {/* Navigation Dropdown - hamburger trigger */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="sw-header-btn"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Dropdown Menu - EXACT SAME DESIGN AS WEBSITE HEADER */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50 backdrop-blur-sm">
                    <div className={`grid ${user?.isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-2 px-2`}>
                      <div>
                        <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Channels</div>

                        <button
                          onClick={() => { navigate('/user-channels'); setIsDropdownOpen(false); }}
                          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <Radio className="w-4 h-4 mr-3 text-gray-500" />
                          My Channels
                        </button>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            const channelId = localStorage.getItem('channelId');
                            const channelName = localStorage.getItem('channelName');
                            if (channelId && channelName) {
                              const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
                              navigate(`/channels/${channelId}/segments?date=${today}&hour=0&name=${encodeURIComponent(channelName)}`);
                            } else {
                              navigate('/user-channels');
                            }
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <Search className="w-4 h-4 mr-3 text-gray-500" />
                          Search
                        </button>
                        <button onClick={() => handleNavigation('/dashboard')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                          Dashboard
                        </button>

                        <button onClick={() => handleNavigation('/reports')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <FileText className="w-4 h-4 mr-3 text-gray-500" />
                          Reports
                        </button>
                        <button onClick={() => { window.open('https://forms.clickup.com/9003066468/f/8c9zt34-21136/O2BX6CH5IROJJDHYMW', '_blank', 'noopener,noreferrer'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <LifeBuoy className="w-4 h-4 mr-3 text-gray-500" />
                          Support Ticket
                        </button>
                      </div>
                      {user?.isAdmin && (
                        <div>
                          <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Settings</div>
                          <button
                            onClick={() => {
                              setIsUploadModalOpen(true);
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          >
                            <Upload className="w-4 h-4 mr-3 text-gray-500" />
                            Upload Custom Audio
                          </button>
                          <button onClick={() => handleNavigation('/dashboard/settings')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Settings className="w-4 h-4 mr-3 text-gray-500" />
                            Topic Settings
                          </button>
                          <button onClick={() => handleNavigation('/dashboard/shift-management')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Clock className="w-4 h-4 mr-3 text-gray-500" />
                            Shift Management
                          </button>
                          <button onClick={() => handleNavigation('/dashboard/predefined-filters')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Filter className="w-4 h-4 mr-3 text-gray-500" />
                            Predefined Filters
                          </button>
                          <button onClick={() => handleNavigation('/admin/audio')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Music className="w-4 h-4 mr-3 text-gray-500" />
                            Audio Management
                          </button>
                          <button onClick={() => handleNavigation('/admin/settings')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Layers className="w-4 h-4 mr-3 text-gray-500" />
                            General Settings
                          </button>
                          <button onClick={() => handleNavigation('/admin/users')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <UserCog className="w-4 h-4 mr-3 text-gray-500" />
                            User Management
                          </button>
                          <button onClick={() => handleNavigation('/admin/users')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Plus className="w-4 h-4 mr-3 text-gray-500" />
                            Create New User
                          </button>
                          <button onClick={() => handleNavigation('/admin/channels')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Layers className="w-4 h-4 mr-3 text-gray-500" />
                            Channel Managment
                          </button>
                          <button onClick={() => handleNavigation('/admin/channels')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Plus className="w-4 h-4 mr-3 text-gray-500" />
                            Onboard Channel
                          </button>
                          <button onClick={() => handleNavigation('/admin/custom-flags')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Flag className="w-4 h-4 mr-3 text-gray-500" />
                            Custom Flags
                          </button>
                          <button onClick={() => handleNavigation('/admin/content-type-deactivation')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Ban className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                            <span className="whitespace-nowrap">Content Type Deactivation</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button onClick={handleLogout} className="mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 002 2h5a2 2 0 002-2V7a2 2 0 00-2-2h-5a2 2 0 00-2 2v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Upload Custom Audio Modal */}
      <UploadCustomAudioModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </>
  );
};

export default CommonHeader;