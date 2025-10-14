// FilterPanel.jsx - Update the date range handlers
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, Calendar, Filter, RotateCcw, X } from 'lucide-react';
import { setFilter } from '../../store/slices/audioSegmentsSlice';

const FilterPanel = ({ 
  filters, 
  dispatch, 
  segments, 
  channelId, 
  handleDaypartChange, 
  handleSearchWithCustomTime,
  localStartTime,
  localEndTime,
  setLocalStartTime,
  setLocalEndTime,
  handleResetFilters,
  isInHeader = false,
  localSearchText,
  setLocalSearchText,
  localSearchIn,
  setLocalSearchIn,
  handleSearch,
  handleClearSearch,
  handleDateSelect,
  handleDateRangeSelect,
  fetchAudioSegments={fetchAudioSegments}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const filterRef = useRef(null);

  const daypartOptions = [
    { value: 'none', label: 'None', startTime: '', endTime: '' },
    { value: 'morning', label: 'Morning (06:00–10:00)', startTime: '06:00:00', endTime: '10:00:00' },
    { value: 'midday', label: 'Midday (10:00–15:00)', startTime: '10:00:00', endTime: '15:00:00' },
    { value: 'afternoon', label: 'Afternoon (15:00–19:00)', startTime: '15:00:00', endTime: '19:00:00' },
    { value: 'evening', label: 'Evening (19:00–00:00)', startTime: '19:00:00', endTime: '23:59:59' },
    { value: 'overnight', label: 'Overnight (00:00–06:00)', startTime: '00:00:00', endTime: '06:00:00' },
    { value: 'weekend', label: 'Weekend (Saturday & Sunday)', startTime: '00:00:00', endTime: '23:59:59' }
  ];

useEffect(() => {
  // Convert "14:30:00" to "14:30" for time inputs
  setLocalStartTime(filters.startTime?.substring(0, 5) || '');
  setLocalEndTime(filters.endTime?.substring(0, 5) || '');
}, [filters.startTime, filters.endTime]);

  // Close filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFilters = () => setIsExpanded(!isExpanded);

  // Calculate counts for recognition filters
  const recognizedCount = segments.filter(s => s.is_recognized).length;
  const unrecognizedCount = segments.filter(s => !s.is_recognized).length;
  const unrecognizedWithContentCount = segments.filter(s => !s.is_recognized && (s.analysis?.summary || s.transcription?.transcript)).length;
  const unrecognizedWithoutContentCount = segments.filter(s => !s.is_recognized && !s.analysis?.summary && !s.transcription?.transcript).length;

// Handler for date range selection
const handleDateRangeSelection = (startDate, endDate) => {
  console.log('Date range selected in FilterPanel:', startDate, 'to', endDate);
  
  if (handleDateRangeSelect) {
    handleDateRangeSelect(startDate, endDate);
  } else {
    // ✅ PRESERVE both Redux state AND local state
    dispatch(setFilter({ 
      startDate: startDate,
      endDate: endDate,
      date: null,
      // Don't clear startTime and endTime - they stay in Redux state
      daypart: 'none'
    }));
    
    // ✅ Don't reset localStartTime and localEndTime - they stay as they are
    
    // Trigger API call with page 1
    if (fetchAudioSegments) {
      fetchAudioSegments({ 
        channelId, 
        startDate: startDate,
        endDate: endDate,
        startTime: filters.startTime, // Use current startTime
        endTime: filters.endTime,     // Use current endTime
        daypart: 'none',
        page: 1
      });
    }
  }
};

  // Handler for start date range selection
  const handleStartDateRange = (startDate) => {
    console.log('Start date changed:', startDate);
    handleDateRangeSelection(startDate, filters.endDate);
  };

  // Handler for end date range selection
  const handleEndDateRange = (endDate) => {
    console.log('End date changed:', endDate);
    handleDateRangeSelection(filters.startDate, endDate);
  };

  // Handler for single date selection
const handleSingleDateSelect = (date) => {
  console.log('Single date selected:', date);
  if (handleDateSelect) {
    handleDateSelect(date);
  } else {
    // ✅ PRESERVE both Redux state AND local state
    dispatch(setFilter({ 
      date: date,
      startDate: null,
      endDate: null,
      // Don't clear startTime and endTime - they stay in Redux state
      daypart: 'none'
    }));
    
    // ✅ Don't reset localStartTime and localEndTime - they stay as they are
    
    // Trigger API call with page 1
    if (fetchAudioSegments) {
      fetchAudioSegments({ 
        channelId, 
        date: date,
        startTime: filters.startTime, // Use current startTime
        endTime: filters.endTime,     // Use current endTime
        daypart: 'none',
        page: 1
      });
    }
  }
};

  // Compact version for header
  if (isInHeader) {
    return (
      <div className="bg-white border-t border-gray-200" ref={filterRef}>
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
          onClick={toggleFilters}
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>

        {isExpanded && (
          <div className="border-t border-gray-200 p-4 bg-white">
            {/* All Date & Time Filters in Single Line */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleStartDateRange(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  max={new Date().toLocaleDateString('en-CA')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleEndDateRange(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  max={new Date().toLocaleDateString('en-CA')}
                />
              </div>
              {/* <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Time of Day</label>
                <select
                  value={filters.daypart || 'none'}
                  onChange={(e) => handleDaypartChange(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {daypartOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label.length > 15 ? option.label.substring(0, 15) + '...' : option.label}
                    </option>
                  ))}
                </select>
              </div> */}
              <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
  <input
    type="time"
    value={localStartTime}
    onChange={(e) => setLocalStartTime(e.target.value)}
    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
  />
</div>

<div>
  <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
  <input
    type="time"
    value={localEndTime}
    onChange={(e) => setLocalEndTime(e.target.value)}
    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
  />
</div>

{/* Add Apply Time Button in compact view */}
<div className="flex flex-col justify-end">
  <button
    onClick={() => {
      if (localStartTime || localEndTime) {
        const newFilters = {
          startTime: localStartTime ? localStartTime + ':00' : '',
          endTime: localEndTime ? localEndTime + ':00' : '',
          daypart: 'none',
        };
        
        dispatch(setFilter(newFilters));
        
        const updatedFilters = { ...filters, ...newFilters };
        if (fetchAudioSegments) {
          fetchAudioSegments({ 
            channelId, 
            date: filters.date,
            startDate: filters.startDate,
            endDate: filters.endDate,
            startTime: newFilters.startTime,
            endTime: newFilters.endTime,
            daypart: 'none',
            searchText: filters.searchText,
            searchIn: filters.searchIn,
            page: 1
          });
        }
      }
    }}
    disabled={!localStartTime && !localEndTime}
    className="w-full p-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
  >
    Apply Time
  </button>
</div>
            </div>

            {/* Single Date Filter */}
            {/* <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Single Date (Optional)</label>
              <input
                type="date"
                value={filters.date || ''}
                onChange={(e) => handleSingleDateSelect(e.target.value)}
                className="w-full md:w-1/3 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                max={new Date().toLocaleDateString('en-CA')}
              />
            </div> */}

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleResetFilters}
                className="flex items-center px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </button>

              <button
                onClick={toggleFilters}
                className="flex items-center px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original expanded version (for when not in header)
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6" ref={filterRef}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={toggleFilters}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-blue-600">Filter Parameters</h2>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-6">
          <div className="grid grid-cols-1 gap-8">
            {/* Date & Time Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Date & Time</h3>
              </div>

              {/* All Date & Time Filters in Single Line */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range & Time</label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => handleStartDateRange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        max={new Date().toLocaleDateString('en-CA')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => handleEndDateRange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        max={new Date().toLocaleDateString('en-CA')}
                      />
                    </div>
                    {/* <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Time of Day</label>
                      <select
                        value={filters.daypart || 'none'}
                        onChange={(e) => handleDaypartChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        {daypartOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div> */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={localStartTime}
                        onChange={(e) => setLocalStartTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                      <input
                        type="time"
                        value={localEndTime}
                        onChange={(e) => setLocalEndTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {/* Add Apply Time Button */}
                    <div className="flex flex-col justify-end">
                      <button
                        onClick={() => {
                          if (localStartTime || localEndTime) {
                            const newFilters = {
                              startTime: localStartTime ? localStartTime + ':00' : '',
                              endTime: localEndTime ? localEndTime + ':00' : '',
                              daypart: 'none',
                            };
                            
                            // Update Redux state
                            dispatch(setFilter(newFilters));
                            
                            // Trigger API call
                            const updatedFilters = { ...filters, ...newFilters };
                            if (fetchAudioSegments) {
                              fetchAudioSegments({ 
                                channelId, 
                                date: filters.date,
                                startDate: filters.startDate,
                                endDate: filters.endDate,
                                startTime: newFilters.startTime,
                                endTime: newFilters.endTime,
                                daypart: 'none',
                                searchText: filters.searchText,
                                searchIn: filters.searchIn,
                                page: 1
                              });
                            }
                          }
                        }}
                        disabled={!localStartTime && !localEndTime}
                        className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply Time
                      </button>
                    </div>
                  </div>
                </div>

                {/* Single Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Single Date (Optional)</label>
                  <input
                    type="date"
                    value={filters.date || ''}
                    onChange={(e) => handleSingleDateSelect(e.target.value)}
                    className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    max={new Date().toLocaleDateString('en-CA')}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleResetFilters}
              className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all duration-200 mr-4"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </button>

            <button
              onClick={toggleFilters}
              className="flex items-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all duration-200"
            >
              <X className="w-4 h-4 mr-2" />
              Close Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;