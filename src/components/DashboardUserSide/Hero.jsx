import { BarChart3, Settings, ChevronDown, Eye, EyeOff, Users, FileText, ArrowLeft, LogOut } from 'lucide-react';
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
              <span>Settings</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                <div className="py-1">

                  <button
                    onClick={() => {
                      navigate('/reports');
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-3 text-gray-500" />
                    Reports
                  </button>
                  <button
                    onClick={() => {
                      navigate('/user-channels');
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-3 text-gray-500" />
                    My Channels
                  </button>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 002 2h5a2 2 0 002-2V7a2 2 0 00-2-2h-5a2 2 0 00-2 2v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;