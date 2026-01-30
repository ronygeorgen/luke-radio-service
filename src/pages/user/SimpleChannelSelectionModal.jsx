// SimpleChannelSelectionModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Radio, ArrowLeft, Search, FolderOpen, FileText, ChevronRight } from 'lucide-react';
import { axiosInstance } from '../../services/api';

const SimpleChannelSelectionModal = ({ 
  isOpen, 
  onClose, 
  onChannelSelect,
  onFolderSelect,
  showReportFolders = false,
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
  
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [folderSearch, setFolderSearch] = useState('');
  const [folders, setFolders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [foldersError, setFoldersError] = useState(null);

  const fetchReportFolders = useCallback(async (channelId, search = '') => {
    if (!channelId) return;
    setFoldersLoading(true);
    setFoldersError(null);
    try {
      const params = new URLSearchParams({ channel_id: channelId });
      if (search && search.trim()) params.append('search', search.trim());
      const response = await axiosInstance.get(`/report_folders?${params.toString()}`);
      if (response.data?.success && response.data?.data) {
        setFolders(response.data.data.folders || []);
        setTotalCount(response.data.data.total_count ?? 0);
      } else {
        setFolders([]);
        setTotalCount(0);
      }
    } catch (err) {
      setFoldersError(err.response?.data?.message || err.message || 'Failed to load folders');
      setFolders([]);
      setTotalCount(0);
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedChannel(null);
      setFolderSearch('');
      setFolders([]);
      setTotalCount(0);
      setFoldersError(null);
      return;
    }
    if (selectedChannel) {
      fetchReportFolders(selectedChannel.id, folderSearch);
    }
  }, [isOpen, selectedChannel, folderSearch, fetchReportFolders]);
  
  // Helper function to truncate URL
  const truncateUrl = (url, maxLength = 40) => {
    if (!url) return '';
    if (url.length <= maxLength) return url;
    
    // Show first part and last part with ellipsis
    const start = url.substring(0, 25);
    const end = url.substring(url.length - 15);
    return `${start}...${end}`;
  };

  const handleChannelClick = (channel) => {
    if (!showReportFolders) {
      handleChannelSelect(channel);
      return;
    }
    setSelectedChannel(channel);
    setFolderSearch('');
  };

  const handleBackToChannels = () => {
    setSelectedChannel(null);
    setFolderSearch('');
    setFolders([]);
    setFoldersError(null);
  };

  const handleChannelSelect = (channel) => {
    localStorage.setItem('channelId', channel.id);
    localStorage.setItem('channelName', channel.name);
    const channelTimezone = channel?.timezone || 'Australia/Melbourne';
    localStorage.setItem('channelTimezone', channelTimezone);
    onChannelSelect(channel);
    onClose();
  };

  const handleFolderClick = (folder) => {
    if (onFolderSelect) {
      onFolderSelect(folder, selectedChannel);
      onClose();
    }
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
            {selectedChannel ? (
              <button
                onClick={handleBackToChannels}
                className={`p-2 rounded-lg ${isDarkTheme ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} transition-colors`}
                title="Back to channels"
              >
                <ArrowLeft className={`w-5 h-5 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
            ) : null}
            <div className={`w-10 h-10 ${isDarkTheme ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {selectedChannel ? (
                <FolderOpen className={`w-5 h-5 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
              ) : (
                <Radio className={`w-5 h-5 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className={`text-xl font-bold truncate ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                {selectedChannel ? `Report folders — ${selectedChannel.name}` : title}
              </h2>
              <p className={`text-sm mt-1 truncate ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                {selectedChannel ? 'Search and open a folder or use this channel' : description}
              </p>
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
          {!selectedChannel ? (
            /* Channel list */
            channels.length === 0 ? (
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
                    onClick={() => handleChannelClick(channel)}
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
                      {showReportFolders && <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isDarkTheme ? 'text-gray-400' : 'text-gray-400'}`} />}
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            /* Folders view for selected channel */
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={folderSearch}
                    onChange={(e) => setFolderSearch(e.target.value)}
                    placeholder="Search report folders..."
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm ${
                      isDarkTheme 
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
                <button
                  onClick={() => handleChannelSelect(selectedChannel)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap ${
                    isDarkTheme 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  Use this channel
                </button>
              </div>

              {foldersError ? (
                <div className={`py-4 px-4 rounded-lg ${isDarkTheme ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                  {foldersError}
                </div>
              ) : foldersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent ${isDarkTheme ? 'border-blue-400' : 'border-blue-600'}`} />
                </div>
              ) : folders.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className={`w-12 h-12 mx-auto mb-3 ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>
                    {folderSearch.trim() ? 'No folders match your search.' : 'No report folders in this channel yet.'}
                  </p>
                </div>
              ) : (
                <>
                  <p className={`text-sm mb-3 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    {totalCount} folder{totalCount !== 1 ? 's' : ''} found
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleFolderClick(folder)}
                        className={`text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
                          isDarkTheme 
                            ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700/50' 
                            : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: folder.color ? `${folder.color}20` : (isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF') }}
                          >
                            <FolderOpen 
                              className="w-5 h-5 flex-shrink-0" 
                              style={{ color: folder.color || (isDarkTheme ? '#60A5FA' : '#2563EB') }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{folder.name}</h3>
                            {folder.description ? (
                              <p className={`text-xs mt-0.5 line-clamp-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{folder.description}</p>
                            ) : null}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                                {folder.saved_segments_count ?? 0} segment{(folder.saved_segments_count ?? 0) !== 1 ? 's' : ''}
                              </span>
                              {folder.is_public ? (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkTheme ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>Public</span>
                              ) : null}
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 flex-shrink-0 mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-400'}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
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