import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronUp } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchShifts } from '../../store/slices/audioSegmentsSlice';

const DashboardV2Filters = ({ dateRange, setDateRange, currentShiftId, setCurrentShiftId, headerText, headerBg, headerBorder, hideShiftFilter = false, channelId }) => {
  const dispatch = useDispatch();
  const { shifts, shiftsLoading } = useSelector(state => state.audioSegments);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateButtonRef = useRef(null);
  const calendarRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Fetch shifts on mount and when channelId changes
  useEffect(() => {
    dispatch(fetchShifts());
  }, [dispatch, channelId]);

  // Helper functions for date handling
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayDateString = () => {
    return getLocalDateString(new Date());
  };

  // Format shift time
  const formatShiftTime = (shift) => {
    const start = (shift.start_time || '').substring(0, 5);
    const end = (shift.end_time || '').substring(0, 5);
    return `${start} - ${end}`;
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) && 
          dateButtonRef.current && !dateButtonRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calendar navigation
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

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: true
      });
    }
    
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
    return currentDate >= dateRange.start && currentDate <= dateRange.end;
  };

  const isRangeStart = (date) => {
    if (!dateRange.start) return false;
    const dateString = getLocalDateString(date);
    return dateString === dateRange.start;
  };

  const isRangeEnd = (date) => {
    if (!dateRange.end) return false;
    const dateString = getLocalDateString(date);
    return dateString === dateRange.end;
  };

  // Date selection handler
  const handleDateClick = (date) => {
    const localDateString = getLocalDateString(date);
    
    if (!dateRange.start) {
      setDateRange({
        start: localDateString,
        end: null,
        selecting: true
      });
    } else if (dateRange.selecting) {
      let finalStart = dateRange.start;
      let finalEnd = localDateString;
      
      // Ensure chronological order
      if (new Date(localDateString) < new Date(dateRange.start)) {
        finalStart = localDateString;
        finalEnd = dateRange.start;
      }
      
      setDateRange({
        start: finalStart,
        end: finalEnd,
        selecting: false
      });
    } else {
      setDateRange({
        start: localDateString,
        end: null,
        selecting: true
      });
    }
  };

  const formatDateRangeDisplay = () => {
    if (dateRange.start && dateRange.end) {
      return `${dateRange.start} to ${dateRange.end}`;
    } else if (dateRange.start) {
      return `${dateRange.start} - Select end date`;
    }
    return 'Select date range';
  };

  const getDefaultDateRange = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      start: formatDate(sevenDaysAgo),
      end: formatDate(today),
      selecting: false
    };
  };

  const clearDateRange = () => {
    const defaultRange = getDefaultDateRange();
    setDateRange(defaultRange);
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Handle shift change
  const handleShiftChange = (shiftId) => {
    const normalizedId = shiftId ? String(shiftId) : '';
    setCurrentShiftId(normalizedId);
  };

  // Compact Date Range Calendar Component
  const CompactDateRangeCalendar = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return (
      <div ref={calendarRef} className="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border border-gray-600 rounded-lg shadow-xl p-3 min-w-72 max-w-80">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-600 rounded transition-colors text-white"
          >
            <ChevronUp className="w-3 h-3 transform -rotate-90" />
          </button>
          
          <h3 className="font-semibold text-white text-sm">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-600 rounded transition-colors text-white"
          >
            <ChevronUp className="w-3 h-3 transform rotate-90" />
          </button>
        </div>
        
        <div className="mb-2 p-2 bg-blue-500/20 border border-blue-400/30 rounded text-xs text-blue-200">
          {dateRange.selecting ? (
            `Select end date (after ${dateRange.start})`
          ) : (
            'Select start date'
          )}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
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
                  ${day.isDisabled ? 'text-gray-600 cursor-not-allowed' : 'text-gray-200 hover:bg-gray-600'}
                  ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600 font-semibold' : ''}
                  ${isInRange && !isSelected ? 'bg-blue-500/30 text-white' : ''}
                  ${!day.isCurrentMonth ? 'text-gray-500' : ''}
                  ${isToday && !isSelected ? 'border-2 border-yellow-400' : ''}
                `}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-600">
          <div className="text-xs text-gray-300 flex-1 truncate mr-2">
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
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors whitespace-nowrap"
          >
            Clear
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase mb-2" style={{ color: headerText === 'text-white' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
        Filters
      </div>
      
      {/* Date Range Picker */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: headerText === 'text-white' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }}>
          Date Range
        </label>
        <div className="relative">
          <button
            ref={dateButtonRef}
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`w-full p-2 text-xs border rounded-lg text-left flex justify-between items-center transition-all ${
              headerText === 'text-white' 
                ? 'border-white/30 bg-white/10 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-white/15' 
                : 'border-gray-300 bg-white/80 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-white'
            }`}
          >
            <span className={dateRange.start ? '' : 'opacity-70'}>
              {formatDateRangeDisplay()}
            </span>
            <Calendar className={`w-3.5 h-3.5 ${headerText === 'text-white' ? 'text-white/70' : 'text-gray-500'}`} />
          </button>
          {showDatePicker && createPortal(
            (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/30" onClick={() => setShowDatePicker(false)} />
                <div className="relative z-[10001]">
                  <CompactDateRangeCalendar />
                </div>
              </div>
            ),
            document.body
          )}
        </div>
      </div>

      {/* Shift Filter */}
      {!hideShiftFilter && (
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: headerText === 'text-white' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }}>
            Shift
          </label>
          <select
            value={currentShiftId}
            onChange={(e) => handleShiftChange(e.target.value || null)}
            className={`w-full p-2 text-xs border rounded-lg appearance-none transition-all ${
              headerText === 'text-white'
                ? 'border-white/30 bg-white/10 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-white/15'
                : 'border-gray-300 bg-white/80 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-white'
            }`}
          >
            <option value="" style={{ backgroundColor: headerText === 'text-white' ? '#1f2937' : '#ffffff' }}>
              All Shifts
            </option>
            {shiftsLoading ? (
              <option disabled style={{ backgroundColor: headerText === 'text-white' ? '#1f2937' : '#ffffff' }}>
                Loading shifts...
              </option>
            ) : (
              shifts.map(shift => (
                <option key={shift.id} value={shift.id} style={{ backgroundColor: headerText === 'text-white' ? '#1f2937' : '#ffffff' }}>
                  {shift.name} ({formatShiftTime(shift)})
                </option>
              ))
            )}
          </select>
        </div>
      )}
    </div>
  );
};

export default DashboardV2Filters;

