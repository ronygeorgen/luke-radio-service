// FilterPanel.jsx - International/Timezone-safe version
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
  fetchAudioSegments = () => {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
    selecting: false
  });
  const [timeError, setTimeError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const filterRef = useRef(null);
  const calendarRef = useRef(null);

  const daypartOptions = [
    { value: 'none', label: 'None', startTime: '', endTime: '' },
    { value: 'morning', label: 'Morning (06:00–10:00)', startTime: '06:00:00', endTime: '10:00:00' },
    { value: 'midday', label: 'Midday (10:00–15:00)', startTime: '10:00:00', endTime: '15:00:00' },
    { value: 'afternoon', label: 'Afternoon (15:00–19:00)', startTime: '15:00:00', endTime: '19:00:00' },
    { value: 'evening', label: 'Evening (19:00–00:00)', startTime: '19:00:00', endTime: '23:59:59' },
    { value: 'overnight', label: 'Overnight (00:00–06:00)', startTime: '00:00:00', endTime: '06:00:00' },
    { value: 'weekend', label: 'Weekend (Saturday & Sunday)', startTime: '00:00:00', endTime: '23:59:59' }
  ];

  // Helper function to validate time range
  const validateTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return true; // Allow empty values
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    return end > start;
  };

  // Update start time with validation
  const handleStartTimeChange = (time) => {
    setLocalStartTime(time);
    setTimeError('');
    
    if (time && localEndTime) {
      if (!validateTimeRange(time, localEndTime)) {
        setTimeError('End time cannot be before start time');
      }
    }
  };

  // Update end time with validation
  const handleEndTimeChange = (time) => {
    setLocalEndTime(time);
    setTimeError('');
    
    if (time && localStartTime) {
      if (!validateTimeRange(localStartTime, time)) {
        setTimeError('End time cannot be before start time');
      }
    }
  };

  // Apply time with validation
  const handleApplyTime = () => {
    if (localStartTime && localEndTime) {
      if (!validateTimeRange(localStartTime, localEndTime)) {
        setTimeError('End time cannot be before start time');
        return; // Prevent applying invalid time range
      }
    }
    
    // Clear any existing error
    setTimeError('');
    
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
  };

  // Helper functions for timezone-safe date handling
  const convertLocalToUTCDateString = (localDate) => {
    // Convert local date to UTC date string (YYYY-MM-DD)
    const utcDate = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate()
    ));
    return utcDate.toISOString().split('T')[0];
  };

  const convertUTCToLocalDate = (utcDateString) => {
    // Convert UTC date string to local Date object for display
    if (!utcDateString) return null;
    const [year, month, day] = utcDateString.split('-').map(Number);
    // Create date in local timezone from UTC components
    return new Date(year, month - 1, day);
  };

  const getLocalDateString = (date) => {
    // For display only - get local date string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateString = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Initialize date range from filters (convert UTC to local for display)
  useEffect(() => {
    const startDate = filters.startDate ? convertUTCToLocalDate(filters.startDate) : null;
    const endDate = filters.endDate ? convertUTCToLocalDate(filters.endDate) : null;
    
    setDateRange({
      start: startDate ? getLocalDateString(startDate) : null,
      end: endDate ? getLocalDateString(endDate) : null,
      selecting: false
    });
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    setLocalStartTime(filters.startTime?.substring(0, 5) || '');
    setLocalEndTime(filters.endTime?.substring(0, 5) || '');
  }, [filters.startTime, filters.endTime]);

  // Close filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowDatePicker(false);
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

  // Date range selection handler - USING UTC DATES
  const handleDateRangeSelection = (startDateUTC, endDateUTC) => {
    console.log('UTC Date range selected:', startDateUTC, 'to', endDateUTC);
    
    if (handleDateRangeSelect) {
      handleDateRangeSelect(startDateUTC, endDateUTC);
    } else {
      dispatch(setFilter({ 
        startDate: startDateUTC,  // Store UTC dates in Redux
        endDate: endDateUTC,
        date: null,
        daypart: 'none'
      }));
      
      if (fetchAudioSegments) {
        fetchAudioSegments({ 
          channelId, 
          startDate: startDateUTC,  // Send UTC dates to API
          endDate: endDateUTC,
          startTime: filters.startTime,
          endTime: filters.endTime,
          daypart: 'none',
          page: 1
        });
      }
    }
  };

  // Calendar navigation functions
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Generate calendar days for current month/year
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: true
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(currentYear, currentMonth, i);
      days.push({
        date,
        isCurrentMonth: true,
        isDisabled: false
      });
    }
    
    return days;
  };

  // Check if date is in selected range
  const isDateInRange = (date) => {
    if (!dateRange.start || !dateRange.end) return false;
    
    const currentDate = getLocalDateString(date);
    const startDate = parseDateString(dateRange.start);
    const endDate = parseDateString(dateRange.end);
    const dateObj = parseDateString(currentDate);
    
    return dateObj >= startDate && dateObj <= endDate;
  };

  // Check if date is range start/end
  const isRangeStart = (date) => {
    const dateString = getLocalDateString(date);
    return dateString === dateRange.start;
  };

  const isRangeEnd = (date) => {
    const dateString = getLocalDateString(date);
    return dateString === dateRange.end;
  };

  // Calendar date selection - CONVERT TO UTC FOR BACKEND
  const handleDateClick = (date) => {
    const localDateString = getLocalDateString(date);
    const utcDateString = convertLocalToUTCDateString(date);
    
    if (!dateRange.start) {
      // First click
      setDateRange({
        start: localDateString,
        end: null,
        selecting: true
      });
    } else if (dateRange.selecting) {
      // Second click - complete selection
      let finalStartUTC = convertLocalToUTCDateString(parseDateString(dateRange.start));
      let finalEndUTC = utcDateString;
      
      // Ensure chronological order
      if (new Date(utcDateString) < new Date(finalStartUTC)) {
        finalStartUTC = utcDateString;
        finalEndUTC = convertLocalToUTCDateString(parseDateString(dateRange.start));
      }
      
      setDateRange({
        start: dateRange.start,
        end: localDateString,
        selecting: false
      });
      
      // Send UTC dates to backend
      handleDateRangeSelection(finalStartUTC, finalEndUTC);
    } else {
      // Start new selection
      setDateRange({
        start: localDateString,
        end: null,
        selecting: true
      });
    }
  };

  // Format date for display
  const formatDateRangeDisplay = () => {
    if (dateRange.start && dateRange.end) {
      return `${dateRange.start} to ${dateRange.end}`;
    } else if (dateRange.start) {
      return `${dateRange.start} - Select end date`;
    }
    return 'Select date range';
  };

  // Clear date range
  const clearDateRange = () => {
    setDateRange({ start: null, end: null, selecting: false });
    handleDateRangeSelection(null, null);
  };

  const preventKeyboardInput = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  // Get today's date in local format for the calendar
  const getTodayDateString = () => {
    return getLocalDateString(new Date());
  };

  // Calendar component
  const DateRangeCalendar = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return (
      <div ref={calendarRef} className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 min-w-80">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronUp className="w-4 h-4 transform -rotate-90" />
          </button>
          
          <h3 className="font-semibold text-gray-700">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronUp className="w-4 h-4 transform rotate-90" />
          </button>
        </div>
        
        <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
          {dateRange.selecting ? (
            `Click to select end date (after ${dateRange.start})`
          ) : (
            'Click to select start date'
          )}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays().map((day, index) => {
            const dateString = getLocalDateString(day.date);
            const isInRange = isDateInRange(day.date);
            const isStart = isRangeStart(day.date);
            const isEnd = isRangeEnd(day.date);
            const isSelected = isStart || isEnd;
            const isToday = dateString === getTodayDateString();
            
            return (
              <button
                key={index}
                onClick={() => !day.isDisabled && handleDateClick(day.date)}
                disabled={day.isDisabled}
                className={`
                  relative p-2 text-sm rounded transition-colors
                  ${day.isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-50'}
                  ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                  ${isInRange && !isSelected ? 'bg-blue-100' : ''}
                  ${!day.isCurrentMonth ? 'text-gray-400' : ''}
                  ${isToday && !isSelected ? 'border border-blue-300' : ''}
                `}
              >
                {day.date.getDate()}
                {isToday && !isSelected && (
                  <div className="absolute inset-0 border border-blue-400 rounded pointer-events-none"></div>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {dateRange.start && dateRange.end ? (
              `Selected: ${dateRange.start} to ${dateRange.end}`
            ) : dateRange.start ? (
              `Start: ${dateRange.start} - Click end date`
            ) : (
              'Click to select start date'
            )}
          </div>
          <button
            onClick={clearDateRange}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    );
  };

  // Compact version for header - All filters in single line
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
            {/* All filters in single line */}
            <div className="flex flex-row items-end gap-4 mb-4">
              {/* Date Range Picker */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                <div className="relative">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-left flex justify-between items-center"
                  >
                    <span className={dateRange.start ? 'text-gray-900' : 'text-gray-500'}>
                      {formatDateRangeDisplay()}
                    </span>
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </button>
                  {showDatePicker && <DateRangeCalendar />}
                </div>
              </div>

              {/* Time inputs */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={localStartTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  onKeyDown={preventKeyboardInput}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                <input
                  type="time"
                  value={localEndTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  onKeyDown={preventKeyboardInput}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Apply Time Button */}
              <div className="flex-1">
                <button
                  onClick={handleApplyTime}
                  disabled={(!localStartTime && !localEndTime) || !!timeError}
                  className="w-full p-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Time
                </button>
              </div>
            </div>

            {/* Error message */}
            {timeError && (
              <div className="mb-3 p-2 text-xs text-red-600 bg-red-50 rounded border border-red-200">
                {timeError}
              </div>
            )}

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

  // Original expanded version - All filters in single line for time section
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

              {/* Date Range Picker */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full md:w-auto p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left flex justify-between items-center min-w-64"
                    >
                      <span className={dateRange.start ? 'text-gray-900' : 'text-gray-500'}>
                        {formatDateRangeDisplay()}
                      </span>
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </button>
                    {showDatePicker && <DateRangeCalendar />}
                  </div>
                </div>

                {/* Time inputs in single line */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                  <div className="flex flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={localStartTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        onKeyDown={preventKeyboardInput}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                      <input
                        type="time"
                        value={localEndTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        onKeyDown={preventKeyboardInput}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {/* Apply Time Button */}
                    <div className="flex-1">
                      <button
                        onClick={handleApplyTime}
                        disabled={(!localStartTime && !localEndTime) || !!timeError}
                        className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply Time
                      </button>
                    </div>
                  </div>
                  
                  {/* Error message */}
                  {timeError && (
                    <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded border border-red-200">
                      {timeError}
                    </div>
                  )}
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