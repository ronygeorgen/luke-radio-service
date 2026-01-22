// SimpleChannelSelectionModal.js
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Radio } from 'lucide-react';

const SimpleChannelSelectionModal = ({ 
  isOpen, 
  onClose, 
  onChannelSelect,
  channels,
  title = "Select a Channel",
  description = "Please choose a channel to continue",
  headerBg,
  headerText,
  headerBorder
}) => {
  // Only use dark theme if explicitly provided (from Dashboard V2)
  // Otherwise use default light theme
  const isDarkTheme = headerText === 'text-white' && headerBg && headerBorder;
  
  // Helper function to truncate URL
  const truncateUrl = (url, maxLength = 40) => {
    if (!url) return '';
    if (url.length <= maxLength) return url;
    
    // Show first part and last part with ellipsis
    const start = url.substring(0, 25);
    const end = url.substring(url.length - 15);
    return `${start}...${end}`;
  };

  const handleChannelSelect = (channel) => {
    // Store the correct ID (internal id) in localStorage
    localStorage.setItem('channelId', channel.id);
    localStorage.setItem('channelName', channel.name);
    // Store timezone from channel object, fallback to Melbourne if not available
    const channelTimezone = channel?.timezone || 'Australia/Melbourne';
    localStorage.setItem('channelTimezone', channelTimezone);
    
    // Call the callback with channel info
    onChannelSelect(channel);
    
    // Close modal
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`${isDarkTheme ? `bg-gradient-to-br ${headerBg} ${headerBorder}` : 'bg-white'} rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden relative border ${isDarkTheme && headerBorder ? headerBorder : 'border-gray-200'}`}
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme && headerBorder ? headerBorder : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${isDarkTheme ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-xl flex items-center justify-center`}>
              <Radio className={`w-5 h-5 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
              <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${isDarkTheme ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <X className={`w-5 h-5 ${isDarkTheme ? 'text-gray-300' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {channels.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Radio className={`w-12 h-12 ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'} mx-auto mb-4`} />
                <h3 className={`text-lg font-medium mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>No channels available</h3>
                <p className={isDarkTheme ? 'text-gray-400 mb-4' : 'text-gray-600 mb-4'}>
                  You don't have access to any channels yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`text-left p-4 border-2 rounded-xl transition-all duration-200 group ${
                    isDarkTheme 
                      ? `border-gray-600 hover:border-blue-500 hover:bg-gray-700/50` 
                      : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isDarkTheme 
                        ? 'bg-blue-500/20 group-hover:bg-blue-500/30' 
                        : 'bg-blue-100 group-hover:bg-blue-200'
                    }`}>
                      <Radio className={`w-5 h-5 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{channel.name}</h3>
                      {channel.channelType === 'podcast' ? (
                        channel.rssUrl && (
                          <p className={`text-xs mt-1 truncate ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} title={channel.rssUrl}>
                            RSS URL: {truncateUrl(channel.rssUrl)}
                          </p>
                        )
                      ) : (
                        channel.channelId && (
                          <p className={`text-xs mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Channel ID: {channel.channelId}</p>
                        )
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end p-6 border-t ${isDarkTheme && headerBorder ? headerBorder : 'border-gray-200'} ${isDarkTheme ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 border rounded-lg font-medium transition-colors ${
              isDarkTheme 
                ? `border-gray-600 text-gray-200 hover:bg-gray-700/50` 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SimpleChannelSelectionModal;