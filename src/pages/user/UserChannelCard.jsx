import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import UploadCustomAudioModal from '../../components/UploadCustomAudioModal';

const UserChannelCard = ({ channel }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const menuRef = useRef(null);

  // Helper function to truncate URL
  const truncateUrl = (url, maxLength = 40) => {
    if (!url) return '';
    if (url.length <= maxLength) return url;

    // Show first part and last part with ellipsis
    const start = url.substring(0, 25);
    const end = url.substring(url.length - 15);
    return `${start}...${end}`;
  };

  // Helper function to format date in a more readable format
  const formatReadableDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleClick = () => {
    // Persist selected channel details in localStorage
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
    navigate(
      `/channels/${channel.id}/segments?date=${today}&hour=0&name=${encodeURIComponent(channel.name)}`
    );
  };

  const handleMenuClick = (e) => {
    e.stopPropagation(); // Prevent card click
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDashboardV2Click = (e) => {
    e.stopPropagation(); // Prevent card click
    setIsMenuOpen(false);

    // Set channel in localStorage for Dashboard V2
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
      // No-op: localStorage might be unavailable
    }

    navigate('/dashboard');
  };

  const handleUploadCustomAudio = (e) => {
    e.stopPropagation(); // Prevent card click
    setIsMenuOpen(false);
    setIsUploadModalOpen(true);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative"
      onClick={handleClick}
    >
      {/* Three-dot menu button */}
      <div className="absolute top-4 right-4 z-10" ref={menuRef}>
        <button
          onClick={handleMenuClick}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="h-4 w-4 text-gray-600" />
        </button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={handleDashboardV2Click}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={handleUploadCustomAudio}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Custom Audio
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{channel.name}</h3>
            {channel.channelType === 'podcast' ? (
              <div className="space-y-1">
                {channel.rssUrl && (
                  <p className="text-sm text-gray-500 truncate" title={channel.rssUrl}>
                    <span className="font-medium text-gray-600">RSS URL:</span> {truncateUrl(channel.rssUrl)}
                  </p>
                )}
                {channel.rssStartDate && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-600">RSS Start Date:</span> {formatReadableDate(channel.rssStartDate)}
                  </p>
                )}
              </div>
            ) : (
              <>
                {channel.channelId && (
                  <p className="text-sm text-gray-500">Channel ID: {channel.channelId}</p>
                )}
                {channel.projectId && (
                  <p className="text-sm text-gray-500">Project ID: {channel.projectId}</p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Active
          </span>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View →
          </button>
        </div>
      </div>

      {/* Upload Custom Audio Modal - rendered in portal to prevent event bubbling */}
      {isUploadModalOpen && createPortal(
        <UploadCustomAudioModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          channelId={channel?.id}
        />,
        document.body
      )}
    </div>
  );
};

export default UserChannelCard;