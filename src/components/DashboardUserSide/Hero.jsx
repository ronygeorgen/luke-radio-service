import { BarChart3, Menu, Settings, Eye, EyeOff, Users, FileText, ArrowLeft, LogOut, Search, Layers, UserCog, Music, Plus, LifeBuoy, Clock, Filter, Flag, Ban } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setShowAllTopics } from '../../store/slices/dashboardSettingsSlice';
import { fetchShiftAnalytics } from '../../store/slices/shiftAnalyticsSlice';
import { useDashboard } from '../../hooks/useDashboard';
import { logout } from '../../store/slices/authSlice';
import SimpleChannelSelectionModal from '../../pages/user/SimpleChannelSelectionModal';
import { Radio } from 'lucide-react';
import ChannelSwitcher from '../ChannelSwitcher';


const Hero = ({ onToggleChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showAllTopics, dateRange, loadDashboardData } = useDashboard();
  const [isChannelSelectionOpen, setIsChannelSelectionOpen] = useState(false);
  const userChannels = [];
  const { user } = useSelector((state) => state.auth);

  const handleShowAllTopicsChange = async (checked) => {
    if (onToggleChange) onToggleChange(true);
    
    dispatch(setShowAllTopics(checked));

    if (dateRange.startDate && dateRange.endDate) {
      await loadDashboardData(dateRange.startDate, dateRange.endDate, checked);
      await dispatch(fetchShiftAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        showAllTopics: checked
      }));
    }
    
    if (onToggleChange) onToggleChange(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsDropdownOpen(false);
  };

  const handleChannelSelect = (channel) => {
    try {
      if (channel?.id) localStorage.setItem('channelId', String(channel.id));
      if (channel?.name) localStorage.setItem('channelName', channel.name);
      localStorage.setItem('channelTimezone', channel?.timezone || 'Australia/Melbourne');
    } catch (e) {}
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    navigate(`/channels/${channel.id}/segments?date=${today}&hour=0&name=${encodeURIComponent(channel.name)}`);
    setIsChannelSelectionOpen(false);
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40 h-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full space-x-4">

          {/* Dashboard Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              Radio Analytics Dashboard
            </h1>
            {(() => {
              const channelName = localStorage.getItem('channelName');
              return channelName ? (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {channelName}
                  </span>
                </div>
              ) : null;
            })()}
          </div>

          {/* Right Section - Toggle and Navigation */}
          <div className="flex items-center space-x-2">
            {/* Channel Switcher */}
            <ChannelSwitcher onChannelChange={async (channel) => {
              if (dateRange.startDate && dateRange.endDate) {
                await loadDashboardData(dateRange.startDate, dateRange.endDate, showAllTopics);
                await dispatch(fetchShiftAnalytics({
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                  showAllTopics: showAllTopics
                }));
              }
            }} />
            {/* Show All Topics Toggle */}
            <label className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showAllTopics}
                  onChange={(e) => handleShowAllTopicsChange(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${
                  showAllTopics ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                  showAllTopics ? 'transform translate-x-5' : ''
                }`} />
              </div>
              <span className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                {showAllTopics ? (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>All Topics</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Active Only</span>
                  </>
                )}
              </span>
            </label>

            {/* Navigation Dropdown - hamburger trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Dropdown Menu - EXACT SAME DESIGN AS BEFORE */}
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
                      <button onClick={() => { navigate('/dashboard'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                        Dashboard
                      </button>
                      <button onClick={() => { navigate('/dashboard-v2'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                        Dashboard V2
                      </button>
                      <button onClick={() => { navigate('/reports'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
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
                        <button onClick={() => { navigate('/dashboard/settings'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Settings className="w-4 h-4 mr-3 text-gray-500" />
                          Topic Settings
                        </button>
                        <button onClick={() => { navigate('/dashboard/shift-management'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Clock className="w-4 h-4 mr-3 text-gray-500" />
                          Shift Management
                        </button>
                        <button onClick={() => { navigate('/dashboard/predefined-filters'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Filter className="w-4 h-4 mr-3 text-gray-500" />
                          Predefined Filters
                        </button>
                        <button onClick={() => { navigate('/admin/audio'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Music className="w-4 h-4 mr-3 text-gray-500" />
                          Audio Management
                        </button>
                        <button onClick={() => { navigate('/admin/settings'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Layers className="w-4 h-4 mr-3 text-gray-500" />
                          General Settings
                        </button>
                        <button onClick={() => { navigate('/admin/users'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <UserCog className="w-4 h-4 mr-3 text-gray-500" />
                          User Management
                        </button>
                        <button onClick={() => { navigate('/admin/users'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Plus className="w-4 h-4 mr-3 text-gray-500" />
                          Create New User
                        </button>
                        <button onClick={() => { navigate('/admin/channels'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Layers className="w-4 h-4 mr-3 text-gray-500" />
                          Channel Settings
                        </button>
                        <button onClick={() => { navigate('/admin/channels'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Plus className="w-4 h-4 mr-3 text-gray-500" />
                          Onboard Channel
                        </button>
                        <button onClick={() => { navigate('/admin/custom-flags'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Flag className="w-4 h-4 mr-3 text-gray-500" />
                          Custom Flags
                        </button>
                        <button onClick={() => { navigate('/admin/content-type-deactivation'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Ban className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                          <span className="whitespace-nowrap">Content Type Deactivation</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button onClick={() => { handleLogout(); }} className="mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
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
  );
};

export default Hero;