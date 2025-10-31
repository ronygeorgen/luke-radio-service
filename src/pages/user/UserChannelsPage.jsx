// UserChannelsPage.jsx (updated)
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserChannels, selectUserChannels, selectUserChannelsLoading, selectUserChannelsError } from "../../store/slices/channelSlice";
import UserChannelCard from "./UserChannelCard";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/authSlice";
import { Calendar, BarChart3, FileText, Menu, Settings, Radio, Search, Layers, UserCog, Music, Plus, LifeBuoy, Clock, Filter } from "lucide-react";
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
    } else if (channel) {
      // Same behavior as UserChannelCard: set localStorage fields
      try {
        if (channel?.id) {
          localStorage.setItem("channelId", String(channel.id));
        }
        if (channel?.name) {
          localStorage.setItem("channelName", channel.name);
        }
        const channelTimezone = channel?.timezone || "Australia/Melbourne";
        localStorage.setItem("channelTimezone", channelTimezone);
      } catch (e) {
        // No-op: localStorage might be unavailable; navigation should still proceed
      }
      const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
      navigate(`/channels/${channel.id}/segments?date=${today}&hour=0&name=${encodeURIComponent(channel.name)}`);
      setIsChannelSelectionOpen(false);
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
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40 h-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full space-x-4">
            {/* Channel Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                My Channels
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {user?.email || 'User'}
                </span>
              </div>
            </div>

            {/* Navigation Dropdown - hamburger trigger */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Dropdown Menu - SAME DESIGN AS OTHER PAGES */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-2 px-2">
                    <div>
                      <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Channels</div>
                      <button
                        onClick={() => {
                          navigate('/user-channels');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <Radio className="w-4 h-4 mr-3 text-gray-500" />
                        My Channels
                      </button>
                      <button
                        onClick={() => {
                          setIsChannelSelectionOpen(true);
                          setIsDropdownOpen(false);
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
                    <div>
                      <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Settings</div>
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
                        Channel Settings
                      </button>
                      <button onClick={() => handleNavigation('/admin/channels')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <Plus className="w-4 h-4 mr-3 text-gray-500" />
                        Onboard Channel
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button onClick={() => { handleLogout(); setIsDropdownOpen(false); }} className="mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
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
      </header>

      {/* Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 pt-24">
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