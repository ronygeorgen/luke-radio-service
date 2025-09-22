// components/UserSide/Header.jsx
import React, { useState } from "react";
import { formatDateForDisplay } from "../../utils/formatters";
import FilterPanel from "../../components/UserSide/FilterPanel";
import { useNavigate } from "react-router-dom";
import { Settings, ArrowLeft, FileText, BarChart3 } from "lucide-react";
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
  // ADD THESE NEW PROPS:
  handleDateSelect,
  handleDateRangeSelect
}) => {
  const navigate = useNavigate();
  const savedChannelName = localStorage.getItem("channelName");
  const [showDropdown, setShowDropdown] = useState(false);

  // Safe formatting function
  const safeFormatDate = (dateString) => {
    if (!dateString) return 'Select date';
    return formatDateForDisplay(dateString);
  };


  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Row: Settings Dropdown */}
        <div className="flex items-center justify-between py-2">
          <a
            href="/channels"
            className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </a>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/reports");
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Go to Reports
                  </button>
                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </button>
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
            )}
          </div>
        </div>

        {/* Rest of the header remains the same */}
        {/* Channel Info Row */}
        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {savedChannelName || "Channel"}
            </h1>
            <p className="text-xs text-gray-500">
              {safeFormatDate(filters.date)} • {formatTimeDisplay()}
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center space-x-2">
            <select
              value={localSearchIn}
              onChange={(e) => setLocalSearchIn(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
            >
              <option value="transcription">Transcription</option>
              <option value="general_topics">General Topics</option>
              <option value="iab_topics">IAB Topics</option>
              <option value="bucket_prompt">Bucket Prompt</option>
            </select>
            <input
              type="text"
              value={localSearchText}
              onChange={(e) => setLocalSearchText(e.target.value)}
              placeholder="Search..."
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Search
            </button>
            {localSearchText && (
              <button
                onClick={handleClearSearch}
                className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
              >
                Clear
              </button>
            )}
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
            // NEW: Date handlers
            handleDateSelect={handleDateSelect}
            handleDateRangeSelect={handleDateRangeSelect}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;