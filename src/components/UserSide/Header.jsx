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
}) => {
  const navigate = useNavigate();

  
  const savedChannelName = localStorage.getItem("channelName");
  

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
              {formatDateForDisplay(filters.date)} • {formatTimeDisplay()}
            </p>
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
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
