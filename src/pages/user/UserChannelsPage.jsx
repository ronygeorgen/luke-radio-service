// UserChannelsPage.jsx (updated)
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserChannels, selectUserChannels, selectUserChannelsLoading, selectUserChannelsError } from "../../store/slices/channelSlice";
import UserChannelCard from "./UserChannelCard";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/authSlice";
import { Calendar, BarChart3, FileText, Settings, Radio, ChevronDown } from "lucide-react";
import SimpleChannelSelectionModal from "./SimpleChannelSelectionModal";

const UserChannelsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  // Use the new selectors for user-specific channels
  const userChannels = useSelector(selectUserChannels);
  const loading = useSelector(selectUserChannelsLoading);
  const error = useSelector(selectUserChannelsError);

  // State for channel selection modal
  const [isChannelSelectionOpen, setIsChannelSelectionOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    localStorage.removeItem("channelName");
    localStorage.removeItem("channelId");
    console.log("✅ Cleared channelName and channelId from localStorage");
    
    dispatch(fetchUserChannels());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
  };

  // Navigation handler that checks for channel selection
  const handleNavigation = (path) => {
    const channelId = localStorage.getItem('channelId');
    
    if (channelId) {
      // If channel ID exists, navigate directly
      navigate(path);
    } else {
      // If no channel ID, open channel selection modal
      setPendingNavigation(path);
      setIsChannelSelectionOpen(true);
    }
    setIsDropdownOpen(false);
  };

  // Handle channel selection from modal
  const handleChannelSelect = (channel) => {
    if (pendingNavigation) {
      let finalPath = pendingNavigation;
      
      // Replace :channelId with the actual internal ID
      if (finalPath.includes(':channelId')) {
        finalPath = finalPath.replace(':channelId', channel.id);
      }
      
      navigate(finalPath);
      setPendingNavigation(null);
    }
  };

  // Close channel selection modal
  const handleCloseChannelSelection = () => {
    setIsChannelSelectionOpen(false);
    setPendingNavigation(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full shadow-sm">
          <p className="text-sm text-red-700 font-medium text-center">{error}</p>
          <button
            onClick={() => dispatch(fetchUserChannels())}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Left Section - Title with Icon */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-20"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Radio className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  My Channels
                </h1>
                <p className="text-gray-600 mt-1 flex items-center text-sm">
                  Channels assigned to your account
                </p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-4">
              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                        onClick={() => handleNavigation('/dashboard')}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => handleNavigation('/reports')}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-3 text-gray-500" />
                        Reports
                      </button>
                      {/* Admin Panel Button - Only show if user is admin */}
                      {/* {user?.isAdmin && (
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
                        >
                          <Settings className="w-4 h-4 mr-3 text-gray-500" />
                          Admin Panel
                        </button>
                      )} */}
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsDropdownOpen(false);
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
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <p className="text-gray-600 text-center mb-8 text-base sm:text-lg">
          Select a channel to view its audio segments
        </p>

        {userChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12" />
            </div>
            <p className="text-gray-500 text-lg font-medium mb-2">No channels assigned</p>
            <p className="text-gray-400 text-sm text-center max-w-md">
              You haven't been assigned any channels yet. Please contact your administrator to get access to channels.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userChannels.map((channel) => (
              <UserChannelCard 
                key={channel.id} 
                channel={channel}
              />
            ))}
          </div>
        )}

        {/* Assigned channels info */}
        {userChannels.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Showing {userChannels.length} channel{userChannels.length !== 1 ? 's' : ''} assigned to your account
            </p>
          </div>
        )}
      </main>

      {/* Simple Channel Selection Modal */}
      <SimpleChannelSelectionModal
        isOpen={isChannelSelectionOpen}
        onClose={handleCloseChannelSelection}
        onChannelSelect={handleChannelSelect}
        channels={userChannels}
        title="Select a Channel"
        description="Choose a channel to access the selected feature"
      />
    </div>
  );
};

export default UserChannelsPage;