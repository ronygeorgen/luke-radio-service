// components/UserSide/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { formatDateForDisplay } from "../../utils/formatters";
import FilterPanel from "../../components/UserSide/FilterPanel";
import { useNavigate } from "react-router-dom";
import { Settings, ArrowLeft, FileText, BarChart3, ChevronDown } from "lucide-react";
import { useDispatch } from 'react-redux';
import { logout } from "../../store/slices/authSlice";

const Header = ({
  channelInfo,
  channelName,
  filters,
  formatTimeDisplay,
  dispatch,
  segments,
  channelId,
  fetchAudioSegments,
  handleDaypartChange,
  handleSearchWithCustomTime,
  localStartTime,
  localEndTime,
  setLocalStartTime,
  setLocalEndTime,
  handleResetFilters,
  // Search props
  localSearchText,
  setLocalSearchText,
  localSearchIn,
  setLocalSearchIn,
  handleSearch,
  handleClearSearch,
  // Date handlers
  handleDateSelect,
  handleDateRangeSelect,
  setFilter 
}) => {
  const navigate = useNavigate();
  const reduxDispatch = useDispatch();
  const savedChannelName = localStorage.getItem("channelName");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Safe formatting function
  const safeFormatDate = (dateString) => {
    if (!dateString) return 'Select date';
    return formatDateForDisplay(dateString);
  };

  // Calculate counts for recognition filters
  const recognizedCount = segments.filter(s => s.is_recognized).length;
  const unrecognizedCount = segments.filter(s => !s.is_recognized).length;
  const unrecognizedWithContentCount = segments.filter(s => !s.is_recognized && (s.analysis?.summary || s.transcription?.transcript)).length;
  const unrecognizedWithoutContentCount = segments.filter(s => !s.is_recognized && !s.analysis?.summary && !s.transcription?.transcript).length;

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
    <header className="bg-gradient-to-r from-white to-gray-50 shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Row: Navigation and Settings */}
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => navigate("/user-channels")}
            className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md group"
            aria-label="Navigate back to channels page"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back to Channels</span>
          </button>

          {/* Settings Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 backdrop-blur-sm">
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                  >
                    <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigate("/reports");
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                  >
                    <FileText className="w-4 h-4 mr-3 text-gray-500" />
                    Reports
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 mr-3"
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
            )}
          </div>
        </div>

        {/* Channel Info Row */}
        <div className="flex items-center justify-between py-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {savedChannelName || "Channel"}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {/* <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {safeFormatDate(filters.date)}
              </span> */}
              {/* <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTimeDisplay()}
              </span> */}
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex items-end space-x-4">
            {/* Status Filter */}
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => dispatch(setFilter({ status: e.target.value }))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Recognition Filter */}
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Recognition</label>
              <select
                value={filters.recognition || 'all'}
                onChange={(e) => dispatch(setFilter({ recognition: e.target.value }))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md min-w-[140px]"
              >
                <option value="all">All Recognition</option>
                <option value="recognized">Recognized ({recognizedCount})</option>
                <option value="unrecognized">Unrecognized ({unrecognizedCount})</option>
                <option value="unrecognized_with_content">
                  Unrecognized with Content ({unrecognizedWithContentCount})
                </option>
                <option value="unrecognized_without_content">
                  Unrecognized without Content ({unrecognizedWithoutContentCount})
                </option>
              </select>
            </div>

            {/* Search Bar */}
            <div className="flex items-end space-x-3">
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Search In</label>
                <select
                  value={localSearchIn}
                  onChange={(e) => setLocalSearchIn(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md min-w-[140px]"
                >
                  <option value="transcription">Transcription</option>
                  <option value="general_topics">General Topics</option>
                  <option value="iab_topics">IAB Topics</option>
                  <option value="bucket_prompt">Bucket Prompt</option>
                  <option value="summary">Summary</option>
                  <option value="title">Title</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Search</label>
                <input
                  type="text"
                  value={localSearchText}
                  onChange={(e) => setLocalSearchText(e.target.value)}
                  placeholder="Enter search term..."
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md min-w-[200px]"
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => {
                    handleSearch();
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-w-[120px]"
                >
                  Apply Filters
                </button>
              </div>
              {localSearchText && (
                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleClearSearch}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="pb-2">
          <FilterPanel
            filters={filters}
            dispatch={dispatch}
            segments={segments}
            channelId={channelId}
            fetchAudioSegments={fetchAudioSegments}
            handleDaypartChange={handleDaypartChange}
            handleSearchWithCustomTime={handleSearchWithCustomTime}
            localStartTime={localStartTime}
            localEndTime={localEndTime}
            setLocalStartTime={setLocalStartTime}
            setLocalEndTime={setLocalEndTime}
            handleResetFilters={handleResetFilters}
            isInHeader={true}
            // Search props
            localSearchText={localSearchText}
            setLocalSearchText={setLocalSearchText}
            localSearchIn={localSearchIn}
            setLocalSearchIn={setLocalSearchIn}
            handleSearch={handleSearch}
            handleClearSearch={handleClearSearch}
            // Date handlers
            handleDateSelect={handleDateSelect}
            handleDateRangeSelect={handleDateRangeSelect}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;