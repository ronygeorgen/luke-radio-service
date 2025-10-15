// UserChannelsPage.jsx (updated)
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserChannels, selectUserChannels, selectUserChannelsLoading, selectUserChannelsError } from "../../store/slices/channelSlice";
import UserChannelCard from "./UserChannelCard";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/authSlice";
import { Calendar, BarChart3, FileText, Settings, Radio } from "lucide-react";
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

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                  <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Channels assigned to your account
                </p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-4">
              {/* Dashboard Quick Action */}
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="hidden sm:flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-all duration-200 group"
                title="Go to Dashboard"
              >
                <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Dashboard</span>
              </button>

              {/* Reports Quick Action */}
              <button
                onClick={() => handleNavigation('/reports')}
                className="hidden sm:flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl font-medium transition-all duration-200 group"
                title="View Reports"
              >
                <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Reports</span>
              </button>

              {/* Admin Panel Button - Only show if user is admin */}
              {user?.isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="hidden sm:flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-all duration-200 group"
                  title="Admin Panel"
                >
                  <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Admin</span>
                </button>
              )}

              {/* Divider */}
              <div className="h-8 w-px bg-gray-200"></div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 active:scale-95 transition-all duration-200 group"
              >
                <svg
                  className="w-5 h-5 group-hover:rotate-90 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 002 2h5a2 2 0 002-2V7a2 2 0 00-2-2h-5a2 2 0 00-2 2v1"
                  />
                </svg>
                <span className="text-sm">Logout</span>
              </button>
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
        channels={userChannels} // Pass the already loaded channels
        title="Select a Channel"
        description="Choose a channel to access the selected feature"
      />
    </div>
  );
};

export default UserChannelsPage;