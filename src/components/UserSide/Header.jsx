import React from 'react';
import { formatDateForDisplay } from '../../utils/formatters';
import FilterPanel from '../../components/UserSide/FilterPanel';

const Header = ({ 
  channelInfo, 
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
  handleResetFilters
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="flex items-center py-2">
          <a href="/reports" className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Channels
          </a>
        </div>

        {/* Compact Header Content */}
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{channelInfo?.channel_name || 'Channel'}</h1>
            <p className="text-xs text-gray-600 mt-1">
              {formatDateForDisplay(filters.date)} • {formatTimeDisplay()}
            </p>
          </div>
        </div>
        
        {/* Filters Panel */}
        <div className="pb-4">
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