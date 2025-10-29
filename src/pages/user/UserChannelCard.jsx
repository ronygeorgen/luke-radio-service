import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserChannelCard = ({ channel }) => {
  const navigate = useNavigate();

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

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
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
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{channel.name}</h3>
            <p className="text-sm text-gray-500">Channel ID: {channel.channelId}</p>
            <p className="text-sm text-gray-500">Project ID: {channel.projectId}</p>
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
    </div>
  );
};

export default UserChannelCard;