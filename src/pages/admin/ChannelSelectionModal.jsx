// ChannelSelectionModal.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserChannels, clearUserChannelsError } from '../../store/slices/channelSlice';
import { X, Radio } from 'lucide-react';

const ChannelSelectionModal = ({ 
  isOpen, 
  onClose, 
  onChannelSelect,
  title = "Select a Channel",
  description = "Please choose a channel to continue"
}) => {
  const dispatch = useDispatch();
  const { userChannels, userChannelsLoading, userChannelsError } = useSelector((state) => state.channels);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUserChannels());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (userChannelsError) {
      dispatch(clearUserChannelsError());
    }
  }, [userChannelsError, dispatch]);

  const handleChannelSelect = (channel) => {
    // Store the correct ID (internal id) in localStorage
    localStorage.setItem('channelId', channel.id); // This is the internal ID (1)
    localStorage.setItem('channelName', channel.name);
    
    // Call the callback with channel info
    onChannelSelect(channel);
    
    // Close modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Radio className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600 text-sm mt-1">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {userChannelsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your channels...</p>
              </div>
            </div>
          ) : userChannelsError ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-md mx-auto">
                <p className="text-red-700 font-medium">Error loading channels</p>
                <p className="text-red-600 text-sm mt-1">{userChannelsError}</p>
                <button
                  onClick={() => dispatch(fetchUserChannels())}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : userChannels.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No channels available</h3>
                <p className="text-gray-600 mb-4">
                  You don't have access to any channels yet. Please contact your administrator.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {userChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className="text-left p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Radio className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{channel.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">Channel ID: {channel.channelId}</p>
                      {channel.assignedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned: {new Date(channel.assignedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelSelectionModal;