// UserChannelsPage.jsx (updated)
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserChannels, selectUserChannels, selectUserChannelsLoading, selectUserChannelsError } from "../../store/slices/channelSlice";
import UserChannelCard from "./UserChannelCard";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/authSlice";
import { Calendar } from "lucide-react"; // Import Calendar icon for assigned date

const UserChannelsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Use the new selectors for user-specific channels
  const userChannels = useSelector(selectUserChannels);
  const loading = useSelector(selectUserChannelsLoading);
  const error = useSelector(selectUserChannelsError);

  useEffect(() => {
    dispatch(fetchUserChannels());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
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
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              My Assigned Channels
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Channels assigned to your account
            </p>
          </div>
          
          <div className="bg-white shadow-sm border-b border-gray-200 p-3 flex justify-end">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition duration-200 ease-in-out flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
    </div>
  );
};

export default UserChannelsPage;