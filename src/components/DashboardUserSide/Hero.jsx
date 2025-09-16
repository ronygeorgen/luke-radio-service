import { BarChart3, Settings, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setShowAllTopics } from '../../store/slices/dashboardSettingsSlice';
import { fetchShiftAnalytics } from '../../store/slices/shiftAnalyticsSlice';
import { useDashboard } from '../../hooks/useDashboard';

const Hero = ({ onToggleChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const { showAllTopics, dateRange, loadDashboardData } = useDashboard();

  const handleShowAllTopicsChange = async (checked) => {
    // Notify parent component that a toggle change is happening
    if (onToggleChange) onToggleChange(true);
    
    dispatch(setShowAllTopics(checked));

    // Refetch dashboard data with the new showAllTopics setting
    if (dateRange.startDate && dateRange.endDate) {
      await loadDashboardData(dateRange.startDate, dateRange.endDate, checked);
      
      await dispatch(fetchShiftAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        showAllTopics: checked
      }));
    }
    
    // Notify parent component that toggle change is complete
    if (onToggleChange) onToggleChange(false);
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 mb-8 text-white relative">
      <div className="flex items-center justify-between">
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
        
        <div className="flex items-center space-x-6">
          {/* Show All Topics Toggle */}
          <label className="flex items-center space-x-3 bg-white bg-opacity-20 px-4 py-2 rounded-lg cursor-pointer hover:bg-opacity-30 transition-colors">
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
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                <Link
                  to="/dashboard/settings"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Topic Settings
                </Link>
                <Link
                  to="/user-channels"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Switch to Channels
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default Hero;