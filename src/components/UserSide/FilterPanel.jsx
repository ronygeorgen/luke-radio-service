import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, RotateCcw, ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { setFilter, fetchShifts  } from '../../store/slices/audioSegmentsSlice';
import { fetchPredefinedFilters } from '../../store/slices/shiftManagementSlice';
import { useDispatch, useSelector } from 'react-redux';

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
  compact = false, // NEW: Compact mode for sidebar
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateButtonRef = useRef(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0, width: 0 });
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
    selecting: false
  });
  const [timeError, setTimeError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [localShiftId, setLocalShiftId] = useState(filters.shiftId || '');
  const [currentShiftId, setCurrentShiftId] = useState(filters.shiftId || '');
  const [currentPredefinedFilterId, setCurrentPredefinedFilterId] = useState(filters.predefinedFilterId || '');
  const filterRef = useRef(null);
  const calendarRef = useRef(null);

  const { shifts, shiftsLoading } = useSelector(state => state.audioSegments);
  const { predefinedFilters, loading: predefinedLoading } = useSelector(state => state.shiftManagement);
  const reduxDispatch = useDispatch();

  useEffect(() => {
    reduxDispatch(fetchShifts());
    reduxDispatch(fetchPredefinedFilters());
  }, [reduxDispatch]);

  // Simple shift time display - show raw times without conversion
  const formatShiftTime = (shift) => {
    const start = (shift.start_time || '').substring(0, 5); // "HH:MM"
    const end = (shift.end_time || '').substring(0, 5);     // "HH:MM"
    return `${start} - ${end}`;
  };

  // Update handleShiftChange to use raw times
  const handleShiftChange = (shiftId) => {
    console.log('🔄 Shift changed to:', shiftId);
    const normalizedId = shiftId ? String(shiftId) : '';
    setLocalShiftId(normalizedId);
    setCurrentShiftId(normalizedId);
    // When selecting a shift, clear any selected predefined filter locally
    setCurrentPredefinedFilterId('');

    const selectedShift = normalizedId
      ? shifts.find((shift) => String(shift.id) === normalizedId)
      : null;

    // Use raw times without conversion
    if (selectedShift) {
      const newLocalStart = (selectedShift.start_time || '').substring(0, 5);
      const newLocalEnd = (selectedShift.end_time || '').substring(0, 5);
      setLocalStartTime(newLocalStart);
      setLocalEndTime(newLocalEnd);
    }

    const newFilters = {
      shiftId: normalizedId || null,
      predefinedFilterId: null,
      date: filters.date,
      startDate: filters.startDate,
      endDate: filters.endDate,
      // Use raw shift times without conversion
      startTime: selectedShift ? selectedShift.start_time : filters.startTime,
      endTime: selectedShift ? selectedShift.end_time : filters.endTime,
      daypart: 'none'
    };

    dispatch(setFilter(newFilters));

    // Trigger API fetch immediately on selection or deselection
    if (fetchAudioSegments) {
      reduxDispatch(fetchAudioSegments({
        channelId,
        date: newFilters.date,
        startDate: newFilters.startDate,
        endDate: newFilters.endDate,
        startTime: newFilters.startTime,
        endTime: newFilters.endTime,
        daypart: newFilters.daypart,
        searchText: filters.searchText,
        searchIn: filters.searchIn,
        shiftId: newFilters.shiftId,
        predefinedFilterId: null,
        page: 1
      }));
    }
  };

  const handlePredefinedFilterChange = (predefinedId) => {
    const normalizedId = predefinedId ? String(predefinedId) : '';
    setCurrentPredefinedFilterId(normalizedId);
    // When selecting a predefined filter, clear any selected shift locally
    setCurrentShiftId('');

    const newFilters = {
      predefinedFilterId: normalizedId || null,
      shiftId: null,
      // Preserve existing date/time window; clear daypart for consistency
      date: filters.date,
      startDate: filters.startDate,
      endDate: filters.endDate,
      startTime: filters.startTime,
      endTime: filters.endTime,
      daypart: 'none'
    };
    dispatch(setFilter(newFilters));

    // Trigger API fetch immediately on selection or deselection
    if (fetchAudioSegments) {
      reduxDispatch(fetchAudioSegments({
        channelId,
        date: newFilters.date,
        startDate: newFilters.startDate,
        endDate: newFilters.endDate,
        startTime: newFilters.startTime,
        endTime: newFilters.endTime,
        daypart: newFilters.daypart,
        searchText: filters.searchText,
        searchIn: filters.searchIn,
        shiftId: null,
        predefinedFilterId: newFilters.predefinedFilterId,
        page: 1
      }));
    }
  };

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

  // Only sync local shift state with Redux state on initial load, not on every change
  useEffect(() => {
    if (!currentShiftId && filters.shiftId) {
      setCurrentShiftId(filters.shiftId);
    }
  }, [filters.shiftId, currentShiftId]);

  useEffect(() => {
    if (!currentPredefinedFilterId && filters.predefinedFilterId) {
      setCurrentPredefinedFilterId(filters.predefinedFilterId);
    }
  }, [filters.predefinedFilterId, currentPredefinedFilterId]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // No collapse/expand behavior

  // Position the calendar above all components using a portal
  useEffect(() => {
    const updatePosition = () => {
      if (showDatePicker && dateButtonRef.current) {
        const rect = dateButtonRef.current.getBoundingClientRect();
        setCalendarPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };

    updatePosition();
    if (showDatePicker) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showDatePicker]);

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
        reduxDispatch(fetchAudioSegments({ 
          channelId, 
          startDate: startDateUTC,  // Send UTC dates to API
          endDate: endDateUTC,
          startTime: filters.startTime,
          endTime: filters.endTime,
          daypart: 'none',
          searchText: filters.searchText,
          searchIn: filters.searchIn,
          shiftId: filters.shiftId,
          predefinedFilterId: filters.predefinedFilterId,
          page: 1
        }));
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

  // Compact Calendar component for sidebar
  const CompactDateRangeCalendar = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return (
      <div ref={calendarRef} className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-72 max-w-80">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronUp className="w-3 h-3 transform -rotate-90" />
          </button>
          
          <h3 className="font-semibold text-gray-700 text-sm">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronUp className="w-3 h-3 transform rotate-90" />
          </button>
        </div>
        
        <div className="mb-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
          {dateRange.selecting ? (
            `Select end date (after ${dateRange.start})`
          ) : (
            'Select start date'
          )}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
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
                  relative p-1 text-xs rounded transition-colors min-w-6 h-6
                  ${day.isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-50'}
                  ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                  ${isInRange && !isSelected ? 'bg-blue-100' : ''}
                  ${!day.isCurrentMonth ? 'text-gray-400' : ''}
                  ${isToday && !isSelected ? 'border border-blue-300' : ''}
                `}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600 flex-1 truncate mr-2">
            {dateRange.start && dateRange.end ? (
              `${dateRange.start} to ${dateRange.end}`
            ) : dateRange.start ? (
              `Start: ${dateRange.start}`
            ) : (
              'Select start date'
            )}
          </div>
          <button
            onClick={clearDateRange}
            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors whitespace-nowrap"
          >
            Clear
          </button>
        </div>
      </div>
    );
  };

  // COMPACT VERSION FOR SIDEBAR
  if (compact) {
    return (
      <div className="bg-transparent" ref={filterRef}>
        <div className="space-y-4 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            {/* Shifts Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Shift</label>
              <select
                value={currentShiftId}
                onChange={(e) => handleShiftChange(e.target.value || null)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Shifts</option>
                {shiftsLoading ? (
                  <option disabled>Loading shifts...</option>
                ) : (
                  shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({formatShiftTime(shift)})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Predefined Filters Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Predefined Filter</label>
              <select
                value={currentPredefinedFilterId}
                onChange={(e) => handlePredefinedFilterChange(e.target.value || null)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">None</option>
                {predefinedLoading ? (
                  <option disabled>Loading filters...</option>
                ) : (
                  predefinedFilters.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Date Range</label>
              <div className="relative">
                <button
                  ref={dateButtonRef}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-left flex justify-between items-center"
                >
                  <span className={dateRange.start ? 'text-gray-900' : 'text-gray-500 truncate'}>
                    {formatDateRangeDisplay()}
                  </span>
                  <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0 ml-2" />
                </button>
                {showDatePicker && createPortal(
                  (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/30" onClick={() => setShowDatePicker(false)} />
                      <div ref={calendarRef} className="relative z-[10001]">
                        <CompactDateRangeCalendar />
                      </div>
                    </div>
                  ),
                  document.body
                )}
              </div>
            </div>

            {/* Time inputs */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Time Range</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start</label>
                  <input
                    type="time"
                    value={localStartTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    onKeyDown={preventKeyboardInput}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End</label>
                  <input
                    type="time"
                    value={localEndTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    onKeyDown={preventKeyboardInput}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {timeError && (
              <div className="p-2 text-xs text-red-600 bg-red-50 rounded border border-red-200">
                {timeError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 bg-gray-200 text-gray-700 text-xs px-2 py-1.5 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSearchWithCustomTime}
                className="flex-1 bg-blue-500 text-white text-xs px-2 py-1.5 rounded hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
      </div>
    );
  }

// Compact version for header - Always open, single line
if (isInHeader) {
    return (
      <div className="bg-white border-t border-gray-200" ref={filterRef}>
        <div className="border-t border-gray-200 p-4 bg-white">
          {/* All filters in single line */}
          <div className="flex flex-row items-end gap-4 mb-4">
              {/* NEW: Shifts Dropdown */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Shift</label>
                <select
                  value={currentShiftId}
                  onChange={(e) => handleShiftChange(e.target.value || null)}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="">All Shifts</option>
                  {shiftsLoading ? (
                    <option disabled>Loading shifts...</option>
                  ) : (
                    shifts.map(shift => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} - {(shift.start_time || '').substring(0, 5)} - {(shift.end_time || '').substring(0, 5)} {shift.days_of_week ? `(${shift.days_of_week})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Predefined Filters Dropdown */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Predefined Filter</label>
                <select
                  value={currentPredefinedFilterId}
                  onChange={(e) => handlePredefinedFilterChange(e.target.value || null)}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="">None</option>
                  {predefinedLoading ? (
                    <option disabled>Loading filters...</option>
                  ) : (
                    predefinedFilters.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))
                  )}
                </select>
              </div>


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
                  {showDatePicker && createPortal(
                    (
                      <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/30" onClick={() => setShowDatePicker(false)} />
                        <div ref={calendarRef} className="relative z-[10001]">
                          <CompactDateRangeCalendar />
                        </div>
                      </div>
                    ),
                    document.body
                  )}
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
                onClick={handleSearchWithCustomTime}
                className="flex items-center px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
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

              {/* NEW: Shifts Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                <div className="relative">
                  <select
                    value={currentShiftId}
                    onChange={(e) => handleShiftChange(e.target.value || null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                  >
                    <option value="">All Shifts</option>
                    {shiftsLoading ? (
                      <option disabled>Loading shifts...</option>
                    ) : (
                      shifts.map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({formatShiftTime(shift)})
                        </option>
                      ))
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                
              </div>

              {/* Predefined Filters Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Predefined Filter</label>
                <div className="relative">
                  <select
                    value={currentPredefinedFilterId}
                    onChange={(e) => handlePredefinedFilterChange(e.target.value || null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                  >
                    <option value="">None</option>
                    {predefinedLoading ? (
                      <option disabled>Loading filters...</option>
                    ) : (
                      predefinedFilters.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
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

          <div className="flex items-center justify-center mt-8 pt-6 border-t border-gray-200 gap-4">
            <button
              onClick={handleResetFilters}
              className="flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow-sm transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </button>

            <button
              onClick={handleSearchWithCustomTime}
              className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all duration-200"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;