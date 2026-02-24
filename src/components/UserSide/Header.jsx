// components/UserSide/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { formatDateForDisplay } from "../../utils/formatters";
import { useNavigate } from "react-router-dom";
import { Menu, Settings, ArrowLeft, FileText, BarChart3, Search, Layers, UserCog, Music, Plus, LifeBuoy, Clock, Filter, Radio, Flag, Ban, Upload } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../store/slices/authSlice";
import { fetchUserChannels, selectUserChannels } from "../../store/slices/channelSlice";
import { fetchContentTypePrompt } from "../../store/slices/audioSegmentsSlice";
import ChannelSwitcher from '../ChannelSwitcher';
import SimpleChannelSelectionModal from '../../pages/user/SimpleChannelSelectionModal';
import ACRCustomFileUploadModal from '../ACRCustomFileUploadModal';

const Header = ({
  channelInfo,
  channelName,
  filters,
  formatTimeDisplay,
  localSearchText,
  setLocalSearchText,
  localSearchIn,
  setLocalSearchIn,
  handleSearch,
  handleClearSearch,
}) => {
  const navigate = useNavigate();
  const reduxDispatch = useDispatch();
  const savedChannelName = localStorage.getItem("channelName");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isChannelSelectionOpen, setIsChannelSelectionOpen] = useState(false);
  const [pendingACRUpload, setPendingACRUpload] = useState(false);
  const userChannels = useSelector(selectUserChannels);
  const { user } = useSelector((state) => state.auth);
  const { contentTypePrompt } = useSelector((state) => state.audioSegments);

  // Fetch content type prompt data on mount to get search_in options
  useEffect(() => {
    reduxDispatch(fetchContentTypePrompt());
  }, [reduxDispatch]);
  const handleChannelSelect = (channel) => {
    if (pendingACRUpload && channel) {
      try {
        if (channel?.id) localStorage.setItem('channelId', String(channel.id));
        if (channel?.name) localStorage.setItem('channelName', channel.name);
        localStorage.setItem('channelTimezone', channel?.timezone || 'Australia/Melbourne');
      } catch (e) {}
      setPendingACRUpload(false);
      setIsChannelSelectionOpen(false);
      setIsUploadModalOpen(true);
      return;
    }
    try {
      if (channel?.id) localStorage.setItem('channelId', String(channel.id));
      if (channel?.name) localStorage.setItem('channelName', channel.name);
      localStorage.setItem('channelTimezone', channel?.timezone || 'Australia/Melbourne');
    } catch (e) { }
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    navigate(`/channels/${channel.id}/segments?date=${today}&hour=0&name=${encodeURIComponent(channel.name)}`);
    setIsChannelSelectionOpen(false);
  };

  // Safe formatting function
  const safeFormatDate = (dateString) => {
    if (!dateString) return 'Select date';
    return formatDateForDisplay(dateString);
  };

  const handleLogout = () => {
    reduxDispatch(logout());
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40 h-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full">

          {/* Single Row: Back Button, Channel Info, Search, and Navigation */}
          <div className="flex items-center justify-between h-full space-x-4">

            {/* Channel Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {savedChannelName || "Channel"}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTimeDisplay()}
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <ChannelSwitcher onChannelChange={(channel) => {
                // Trigger a custom event that AudioSegmentsPage can listen to
                window.dispatchEvent(new CustomEvent('channelChanged', { detail: channel }));
              }} />
              <div className="flex flex-col">
                <select
                  value={localSearchIn}
                  onChange={(e) => setLocalSearchIn(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {contentTypePrompt?.searchInOptions && contentTypePrompt.searchInOptions.length > 0 ? (
                    contentTypePrompt.searchInOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    // Fallback to default options if API hasn't loaded yet
                    <>
                      <option value="transcription">Transcription</option>
                      <option value="general_topics">General Topics</option>
                      <option value="iab_topics">IAB Topics</option>
                      <option value="bucket_prompt">Bucket Prompt</option>
                      <option value="summary">Summary</option>
                      <option value="title">Title</option>
                    </>
                  )}
                </select>
              </div>
              <div className="flex flex-col">
                <input
                  type="text"
                  value={localSearchText}
                  onChange={(e) => setLocalSearchText(e.target.value)}
                  placeholder="Search..."
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-48"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex flex-col">
                <button
                  onClick={handleSearch}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {localSearchText && (
                <div className="flex flex-col">
                  <button
                    onClick={handleClearSearch}
                    className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Dropdown - hamburger trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Dropdown Menu - EXACT SAME DESIGN AS BEFORE */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50 backdrop-blur-sm">
                  <div className={`grid ${user?.isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-2 px-2`}>
                    <div>
                      <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Channels</div>
                      <button
                        onClick={() => { navigate('/user-channels'); setIsDropdownOpen(false); }}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <Radio className="w-4 h-4 mr-3 text-gray-500" />
                        My Channels
                      </button>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          const channelId = localStorage.getItem('channelId');
                          const channelName = localStorage.getItem('channelName');
                          if (channelId && channelName) {
                            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            navigate(`/channels/${channelId}/segments?date=${today}&hour=0&name=${encodeURIComponent(channelName)}`);
                          } else {
                            navigate('/user-channels');
                          }
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <Search className="w-4 h-4 mr-3 text-gray-500" />
                        Search
                      </button>
                      <button onClick={() => { navigate("/dashboard"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                        Dashboard
                      </button>
                      <button onClick={() => { navigate("/reports"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <FileText className="w-4 h-4 mr-3 text-gray-500" />
                        Reports
                      </button>
                      <button onClick={() => { window.open('https://forms.clickup.com/9003066468/f/8c9zt34-21136/O2BX6CH5IROJJDHYMW', '_blank', 'noopener,noreferrer'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <LifeBuoy className="w-4 h-4 mr-3 text-gray-500" />
                        Support Ticket
                      </button>
                    </div>
                    {user?.isAdmin && (
                      <div>
                        <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Settings</div>
                        <button
                          onClick={() => {
                            const channelId = localStorage.getItem('channelId');
                            if (channelId) {
                              setIsUploadModalOpen(true);
                            } else {
                              setPendingACRUpload(true);
                              setIsChannelSelectionOpen(true);
                              reduxDispatch(fetchUserChannels());
                            }
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <Upload className="w-4 h-4 mr-3 text-gray-500" />
                          ACR Custom File Upload
                        </button>
                        <button onClick={() => { navigate("/dashboard/settings"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Settings className="w-4 h-4 mr-3 text-gray-500" />
                          Topic Settings
                        </button>
                        <button onClick={() => navigate('/dashboard/shift-management')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Clock className="w-4 h-4 mr-3 text-gray-500" />
                          Shift Management
                        </button>
                        <button onClick={() => navigate('/dashboard/predefined-filters')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Filter className="w-4 h-4 mr-3 text-gray-500" />
                          Predefined Filters
                        </button>
                        <button onClick={() => { navigate("/admin/audio"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Music className="w-4 h-4 mr-3 text-gray-500" />
                          Audio Management
                        </button>
                        <button onClick={() => { navigate("/admin/settings"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Layers className="w-4 h-4 mr-3 text-gray-500" />
                          General Settings
                        </button>
                        <button onClick={() => { navigate("/admin/users"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <UserCog className="w-4 h-4 mr-3 text-gray-500" />
                          User Management
                        </button>
                        <button onClick={() => { navigate("/admin/users"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Plus className="w-4 h-4 mr-3 text-gray-500" />
                          Create New User
                        </button>
                        <button onClick={() => { navigate("/admin/channels"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Layers className="w-4 h-4 mr-3 text-gray-500" />
                          Channel Managment
                        </button>
                        <button onClick={() => { navigate("/admin/channels"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Plus className="w-4 h-4 mr-3 text-gray-500" />
                          Onboard Channel
                        </button>
                        <button onClick={() => { navigate("/admin/custom-flags"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Flag className="w-4 h-4 mr-3 text-gray-500" />
                          Custom Flags
                        </button>
                        <button onClick={() => { navigate("/admin/content-type-deactivation"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Ban className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                          <span className="whitespace-nowrap">Content Type Deactivation</span>
                        </button>
                      </div>
                    )}
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

      {/* Channel selection for ACR when no channel selected */}
      <SimpleChannelSelectionModal
        isOpen={isChannelSelectionOpen}
        onClose={() => { setIsChannelSelectionOpen(false); setPendingACRUpload(false); }}
        onChannelSelect={handleChannelSelect}
        channels={userChannels}
        title="Select a Channel"
        description="Choose a channel for ACR Custom File Upload"
      />

      {/* ACR Custom File Upload Modal (hamburger menu only) */}
      <ACRCustomFileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        channelId={localStorage.getItem('channelId')}
      />
    </>
  );
};

export default Header;