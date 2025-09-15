import React from "react";
import { formatDateForDisplay } from "../../utils/formatters";
import FilterPanel from "../../components/UserSide/FilterPanel";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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

  // Safe formatting function
  const safeFormatDate = (dateString) => {
    if (!dateString) return 'Select date';
    return formatDateForDisplay(dateString);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Row: Back + Dashboard */}
        <div className="flex items-center justify-between py-2">
          <a
            href="/reports"
            className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </a>

          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 
                       text-white text-sm font-medium shadow-sm hover:from-blue-600 hover:to-blue-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition"
          >
            Switch to Dashboard
          </button>
        </div>

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

        {/* Filters Panel - PASS ALL THE PROPS INCLUDING NEW ONES */}
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