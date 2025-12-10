import React, { useState, useEffect } from 'react';
import { Radio, ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserChannels, selectUserChannels } from '../store/slices/channelSlice';
import SimpleChannelSelectionModal from '../pages/user/SimpleChannelSelectionModal';

const ChannelSwitcher = ({ onChannelChange }) => {
  const dispatch = useDispatch();
  const userChannels = useSelector(selectUserChannels);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentChannelId = localStorage.getItem('channelId');
  const currentChannelName = localStorage.getItem('channelName');

  useEffect(() => {
    // Fetch user channels if not already loaded
    if (userChannels.length === 0) {
      dispatch(fetchUserChannels());
    }
  }, [dispatch, userChannels.length]);

  const handleChannelSelect = (channel) => {
    try {
      if (channel?.id) {
        localStorage.setItem('channelId', String(channel.id));
      }
      if (channel?.name) {
        localStorage.setItem('channelName', channel.name);
      }
      // Use timezone from channel object, fallback to Melbourne if not available
      const channelTimezone = channel?.timezone || 'Australia/Melbourne';
      localStorage.setItem('channelTimezone', channelTimezone);
    } catch (e) {
      console.error('Error saving channel to localStorage:', e);
    }

    setIsModalOpen(false);
    
    // Call the callback if provided (to refresh data on the page)
    if (onChannelChange) {
      onChannelChange(channel);
    }
  };

  if (userChannels.length === 0) {
    return null; // Don't show switcher if no channels available
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
        title="Switch Channel"
      >
        <Radio className="w-4 h-4 text-gray-500" />
        <span className="max-w-[150px] truncate">
          {currentChannelName || 'Select Channel'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      <SimpleChannelSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChannelSelect={handleChannelSelect}
        channels={userChannels}
        title="Switch Channel"
        description="Select a channel to switch to"
      />
    </>
  );
};

export default ChannelSwitcher;

