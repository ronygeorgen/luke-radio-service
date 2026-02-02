import React, { useState, useEffect } from 'react';
import { Radio, ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchUserChannels, selectUserChannels } from '../store/slices/channelSlice';
import SimpleChannelSelectionModal from '../pages/user/SimpleChannelSelectionModal';

const ChannelSwitcher = ({ onChannelChange, className, style, headerBg, headerText, headerBorder, showReportFolders = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userChannels = useSelector(selectUserChannels);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Helper function to decode URL-encoded channel name
  const decodeChannelName = (name) => {
    if (!name) return '';
    try {
      // Decode URL-encoded strings (handles %20, %2520, etc.)
      return decodeURIComponent(name);
    } catch (e) {
      // If decoding fails, return original
      return name;
    }
  };

  const [currentChannelId, setCurrentChannelId] = useState(() => localStorage.getItem('channelId') || '');
  const [currentChannelName, setCurrentChannelName] = useState(() => decodeChannelName(localStorage.getItem('channelName') || ''));

  useEffect(() => {
    // Fetch user channels if not already loaded
    if (userChannels.length === 0) {
      dispatch(fetchUserChannels());
    }
  }, [dispatch, userChannels.length]);

  // Sync with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newChannelId = localStorage.getItem('channelId') || '';
      const newChannelName = decodeChannelName(localStorage.getItem('channelName') || '');
      if (newChannelId !== currentChannelId) {
        setCurrentChannelId(newChannelId);
        setCurrentChannelName(newChannelName);
      } else if (newChannelName !== currentChannelName) {
        // Also update if channel name changes (even if ID is same)
        setCurrentChannelName(newChannelName);
      }
    };

    // Check for changes periodically (localStorage events don't fire in same tab)
    const interval = setInterval(handleStorageChange, 100);
    
    // Also listen to storage events (for cross-tab updates)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentChannelId]);

  const handleChannelSelect = (channel) => {
    try {
      if (channel?.id) {
        const channelIdStr = String(channel.id);
        localStorage.setItem('channelId', channelIdStr);
        setCurrentChannelId(channelIdStr);
      }
      if (channel?.name) {
        localStorage.setItem('channelName', channel.name);
        setCurrentChannelName(channel.name);
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

  const handleFolderSelect = (folder, channel) => {
    handleChannelSelect(channel);
    // Stay on Dashboard V2 and show dashboard for this report folder (API uses report_folder_id, not channel_id).
    // Preserve hideUI so PDF/screenshot mode is not lost.
    const hideUI = searchParams.get('hideUI');
    const query = new URLSearchParams({ report_folder_id: folder.id });
    if (hideUI === 'true') query.set('hideUI', 'true');
    navigate(`/dashboard-v2?${query.toString()}`);
  };

  if (userChannels.length === 0) {
    return null; // Don't show switcher if no channels available
  }

  const defaultClassName = "flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md";
  const buttonClassName = className || defaultClassName;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={buttonClassName}
        style={style}
        title="Switch Channel"
      >
        <Radio className="w-4 h-4" />
        <span className="max-w-[150px] truncate">
          {currentChannelName || 'Select Channel'}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      <SimpleChannelSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChannelSelect={handleChannelSelect}
        onFolderSelect={showReportFolders ? handleFolderSelect : undefined}
        showReportFolders={showReportFolders}
        channels={userChannels}
        title="Switch Channel"
        description="Select a channel to switch to"
        headerBg={headerBg}
        headerText={headerText}
        headerBorder={headerBorder}
      />
    </>
  );
};

export default ChannelSwitcher;

