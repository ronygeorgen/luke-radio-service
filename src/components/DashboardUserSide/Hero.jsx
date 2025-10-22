import { BarChart3, Settings, ChevronDown, Eye, EyeOff, Users, FileText, ArrowLeft, LogOut, Search, Layers, UserCog, Music, Plus, LifeBuoy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setShowAllTopics } from '../../store/slices/dashboardSettingsSlice';
import { fetchShiftAnalytics } from '../../store/slices/shiftAnalyticsSlice';
import { useDashboard } from '../../hooks/useDashboard';
import { logout } from '../../store/slices/authSlice';

const Hero = ({ onToggleChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showAllTopics, dateRange, loadDashboardData } = useDashboard();

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
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 mb-8 text-white relative">
      <div className="flex items-center justify-between">
        {/* Left Section - Back to Segments and Title */}
        <div className="flex items-center space-x-6">
          {/* Back to Segments */}
         {(() => {
            const channelId = localStorage.getItem('channelId');
            return channelId ? (
              <div className="relative group w-fit">
                <Link
                  to={`/channels/${channelId}/segments`}
                  className="flex items-center justify-center p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </Link>

                {/* Tooltip */}
                <span className="absolute left-10 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
                  Back to segments
                </span>
              </div>
            ) : null;
          })()}
          {/* Title Section */}
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Radio Analytics Dashboard</h1>
              <p className="text-blue-100 text-lg">
                Comprehensive insights into radio transcription data
              </p>
              {(() => {
                const channelName = localStorage.getItem('channelName');
                return channelName ? (
                  <p className="text-white/90 text-sm mt-1">
                    Channel: <span className="font-semibold">{channelName}</span>
                  </p>
                ) : null;
              })()}
            </div>
          </div>
        </div>
        
        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Topic Settings */}
          <Link
            to="/dashboard/settings"
            className="flex items-center space-x-2 px-2 py-2.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-medium transition-colors duration-200"
          >
            <Settings className="w-5 h-5" />
            <span>Topic Settings</span>
          </Link>

          {/* Show All Topics Toggle */}
          <label className="flex items-center space-x-3 bg-white bg-opacity-20 px-2 py-2 rounded-lg cursor-pointer hover:bg-opacity-30 transition-colors">
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={showAllTopics}
                onChange={(e) => handleShowAllTopicsChange(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${
                showAllTopics ? 'bg-green-400' : 'bg-gray-300'
              }`} />
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                showAllTopics ? 'transform translate-x-6' : ''
              }`} />
            </div>
            <span className="text-sm font-medium flex items-center space-x-2">
              {showAllTopics ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Showing All Topics</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Active Topics Only</span>
                </>
              )}
            </span>
          </label>

          {/* Settings Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-white bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Navigation</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50">
                <div className="grid grid-cols-2 gap-2 px-2">
                  <div>
                    <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Channels</div>
                    <button onClick={() => { navigate('/user-channels'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <Search className="w-4 h-4 mr-3 text-gray-500" />
                      Search
                    </button>
                    <button onClick={() => { navigate('/dashboard'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                      Dashboard
                    </button>
                    <button onClick={() => { navigate('/reports'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <FileText className="w-4 h-4 mr-3 text-gray-500" />
                      Reports
                    </button>
                    <button onClick={() => { window.open('https://forms.clickup.com/9003066468/f/8c9zt34-21136/O2BX6CH5IROJJDHYMW', '_blank', 'noopener,noreferrer'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <LifeBuoy className="w-4 h-4 mr-3 text-gray-500" />
                      Support Ticket
                    </button>
                  </div>
                  <div>
                    <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Settings</div>
                    <button onClick={() => { navigate('/dashboard/settings'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <Settings className="w-4 h-4 mr-3 text-gray-500" />
                      Topic Settings
                    </button>
                    <button onClick={() => { navigate('/admin/audio'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <Music className="w-4 h-4 mr-3 text-gray-500" />
                      Audio Management
                    </button>
                    <button onClick={() => { navigate('/admin/settings'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <Layers className="w-4 h-4 mr-3 text-gray-500" />
                      General Settings
                    </button>
                    <button onClick={() => { navigate('/admin/users'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <UserCog className="w-4 h-4 mr-3 text-gray-500" />
                      User Management
                    </button>
                    <button onClick={() => { navigate('/admin/users'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <Plus className="w-4 h-4 mr-3 text-gray-500" />
                      Create New User
                    </button>
                    <button onClick={() => { navigate('/admin/channels'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <Layers className="w-4 h-4 mr-3 text-gray-500" />
                      Channel Settings
                    </button>
                    <button onClick={() => { navigate('/admin/channels'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <Plus className="w-4 h-4 mr-3 text-gray-500" />
                      Onboard Channel
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <button onClick={() => { handleLogout(); }} className="mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
  );
};

export default Hero;