import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, Target, Users, TrendingUp, Hand, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { dashboardApi } from '../../../services/dashboardApi';
import { convertUTCDateStringToLocal, convertLocalToUTC } from '../../../utils/dateTimeUtils';
import { fetchShifts } from '../../../store/slices/audioSegmentsSlice';

const OverallSummarySlide = () => {
  const dispatch = useDispatch();
  const { shifts, shiftsLoading } = useSelector(state => state.audioSegments);
  
  const [isVisible, setIsVisible] = useState(false);
  const [averageSentimentProgress, setAverageSentimentProgress] = useState(0);
  const [targetSentimentProgress, setTargetSentimentProgress] = useState(0);
  const [lowSentimentProgress, setLowSentimentProgress] = useState(0);
  const [highSentimentProgress, setHighSentimentProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  
  // Date range state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateButtonRef = useRef(null);
  const calendarRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
    selecting: false
  });
  
  // Shift state
  const [currentShiftId, setCurrentShiftId] = useState('');

  // Helper function to get default date range (last 7 days)
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

  // Initialize date range to last 7 days
  useEffect(() => {
    const defaultRange = getDefaultDateRange();
    setDateRange(defaultRange);
  }, []);

  // Fetch shifts on mount
  useEffect(() => {
    dispatch(fetchShifts());
  }, [dispatch]);

  // Helper functions for date handling (similar to FilterPanel)
  const convertLocalToUTCDateString = (localDate) => {
    const utcDate = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate()
    ));
    return utcDate.toISOString().split('T')[0];
  };

  const convertUTCToLocalDate = (utcDateString) => {
    if (!utcDateString) return null;
    const [year, month, day] = utcDateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getLocalDateString = (date) => {
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
    
    // Direct string comparison for dates (YYYY-MM-DD format)
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

  const clearDateRange = () => {
    const defaultRange = getDefaultDateRange();
    setDateRange(defaultRange);
    // Force calendar to update by resetting month/year if needed
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const getTodayDateString = () => {
    return getLocalDateString(new Date());
  };

  // Handle shift change
  const handleShiftChange = (shiftId) => {
    const normalizedId = shiftId ? String(shiftId) : '';
    setCurrentShiftId(normalizedId);
  };

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const channelId = localStorage.getItem('channelId');
        if (!channelId) {
          setError('Channel ID not found. Please select a channel first.');
          setLoading(false);
          return;
        }
        
        if (!dateRange.start || !dateRange.end) {
          setLoading(false);
          return;
        }
        
        const shiftId = currentShiftId ? parseInt(currentShiftId, 10) : null;
        
        // API will handle UTC conversion internally
        const data = await dashboardApi.getSummary(
          dateRange.start, 
          dateRange.end, 
          channelId, 
          shiftId
        );
        setSummaryData(data);
        
        // Reset and trigger animations with delay
        setIsVisible(false);
        setAverageSentimentProgress(0);
        setTargetSentimentProgress(0);
        setLowSentimentProgress(0);
        setHighSentimentProgress(0);
        
        const timer = setTimeout(() => {
          setIsVisible(true);
          
          // Animate progress bars from 0 to target values
          const animateProgress = (setter, target, duration = 1500) => {
            const startTime = Date.now();
            const animate = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min((elapsed / duration) * 100, 100);
              setter((target / 100) * progress);
              
              if (progress < 100) {
                requestAnimationFrame(animate);
              } else {
                setter(target);
              }
            };
            requestAnimationFrame(animate);
          };
          
          // Start animations with slight delays using real data
          const avgSentiment = data.average_sentiment || 0;
          const targetSentiment = data.target_sentiment_score || 0;
          const lowSentiment = data.low_sentiment || 0;
          const highSentiment = data.high_sentiment || 0;
          
          setTimeout(() => animateProgress(setAverageSentimentProgress, avgSentiment), 300);
          setTimeout(() => animateProgress(setTargetSentimentProgress, targetSentiment), 500);
          setTimeout(() => animateProgress(setLowSentimentProgress, lowSentiment), 700);
          setTimeout(() => animateProgress(setHighSentimentProgress, highSentiment), 900);
        }, 100);
        
        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Error fetching summary data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch summary data');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [dateRange.start, dateRange.end, currentShiftId]);

  // Process sentiment data for chart display
  const processSentimentData = () => {
    if (!summaryData?.per_day_average_sentiments) {
      return [];
    }
    
    // Color palette for months
    const monthColors = [
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#f97316', // Orange
      '#6366f1', // Indigo
      '#14b8a6', // Teal
      '#a855f7', // Violet
    ];
    
    // Convert dates from DD/MM/YYYY to local timezone and format for display
    const processedData = summaryData.per_day_average_sentiments.map((item) => {
      const localDate = convertUTCDateStringToLocal(item.date);
      if (!localDate) {
        // Fallback: try to parse the date directly
        const [day, month, year] = item.date.split('/');
        const dateObj = new Date(year, month - 1, day);
        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
        const monthIndex = dateObj.getMonth();
        
        return {
          month: monthName,
          monthIndex: monthIndex,
          monthFull: dateObj.toLocaleDateString('en-US', { month: 'long' }),
          value: item.average_sentiment,
          date: localDate || item.date,
          color: monthColors[monthIndex]
        };
      }
      
      // Parse the local date and format for display
      const [year, month, day] = localDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
      const monthIndex = dateObj.getMonth();
      
      return {
        month: monthName,
        monthIndex: monthIndex,
        monthFull: dateObj.toLocaleDateString('en-US', { month: 'long' }),
        value: item.average_sentiment,
        date: localDate,
        color: monthColors[monthIndex]
      };
    });
    
    // Sort by date
    return processedData.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      return 0;
    });
  };
  
  // Get unique months with their colors for legend
  const getMonthLegend = () => {
    const sentimentData = processSentimentData();
    const monthMap = new Map();
    
    sentimentData.forEach((item) => {
      if (!monthMap.has(item.monthFull)) {
        monthMap.set(item.monthFull, {
          name: item.monthFull,
          color: item.color,
          shortName: item.month
        });
      }
    });
    
    return Array.from(monthMap.values());
  };

  // Skeleton Loader Component
  const SummarySkeleton = () => (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-gray-700/50 rounded-lg mx-auto mb-8 animate-pulse"></div>
        
        {/* Filters Section Skeleton */}
        <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="h-4 w-20 bg-gray-600/50 rounded mb-2 animate-pulse"></div>
              <div className="h-10 w-full bg-gray-700/50 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="h-4 w-16 bg-gray-600/50 rounded mb-2 animate-pulse"></div>
              <div className="h-10 w-full bg-gray-700/50 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column Skeleton */}
          <div className="space-y-6">
            {/* Average Sentiment Skeleton */}
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="h-5 w-32 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <div className="w-48 h-48 rounded-full border-12 border-gray-700/50 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-12 bg-gray-600/50 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Target Skeleton */}
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="h-5 w-20 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <div className="w-48 h-48 rounded-full border-12 border-gray-700/50 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-12 bg-gray-600/50 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column Skeleton */}
          <div className="space-y-6">
            {/* Sentiment Analysis Chart Skeleton */}
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="h-5 w-36 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
              <div className="h-48 bg-gray-700/30 rounded-lg animate-pulse relative overflow-hidden">
                {/* Simulate chart lines */}
                <svg viewBox="0 0 400 200" className="w-full h-full opacity-20">
                  {[0, 20, 40, 60, 80, 100].map((val) => (
                    <line
                      key={val}
                      x1="40"
                      y1={180 - (val * 1.6)}
                      x2="380"
                      y2={180 - (val * 1.6)}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  ))}
                  <polyline
                    points="40,180 80,150 120,120 160,100 200,90 240,85 280,80 320,75 360,70 380,65"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
            
            {/* Low/High Sentiment Skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
                <div className="h-5 w-32 bg-gray-600/50 rounded mb-2 animate-pulse"></div>
                <div className="relative w-32 h-32 mx-auto">
                  <div className="w-32 h-32 rounded-full border-8 border-gray-700/50 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-8 bg-gray-600/50 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
                <div className="h-5 w-36 bg-gray-600/50 rounded mb-2 animate-pulse"></div>
                <div className="relative w-32 h-32 mx-auto">
                  <div className="w-32 h-32 rounded-full border-8 border-gray-700/50 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-8 bg-gray-600/50 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="space-y-6">
            {/* Total Talk Breaks Skeleton */}
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="h-5 w-32 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
              <div className="h-12 w-24 bg-gray-600/50 rounded mb-2 animate-pulse"></div>
              <div className="h-4 w-40 bg-gray-600/50 rounded mb-4 animate-pulse"></div>
              <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                <div className="h-2 w-3/4 bg-gray-600/50 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Segment Count Skeleton */}
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="h-5 w-28 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
              <div className="h-12 w-24 bg-gray-600/50 rounded mb-2 animate-pulse"></div>
              <div className="h-4 w-36 bg-gray-600/50 rounded mb-4 animate-pulse"></div>
              <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                <div className="h-2 w-2/3 bg-gray-600/50 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SummarySkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-white text-xl">No data available</div>
      </div>
    );
  }

  const sentimentData = processSentimentData();

  // Compact Date Range Calendar Component - Dark Theme
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
    <div className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Overall Summary</h2>
        
        {/* Filters Section - Outside Cards */}
        <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex flex-wrap items-end gap-4">
            {/* Date Range Picker */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-white mb-2">Date Range</label>
              <div className="relative">
                <button
                  ref={dateButtonRef}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full p-2 text-sm border border-white/30 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex justify-between items-center"
                >
                  <span className={dateRange.start ? 'text-white' : 'text-white/70'}>
                    {formatDateRangeDisplay()}
                  </span>
                  <Calendar className="w-4 h-4 text-white/70" />
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
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-white mb-2">Shift</label>
              <select
                value={currentShiftId}
                onChange={(e) => handleShiftChange(e.target.value || null)}
                className="w-full p-2 text-sm border border-white/30 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="" className="bg-gray-800 text-white">All Shifts</option>
                {shiftsLoading ? (
                  <option disabled className="bg-gray-800 text-white">Loading shifts...</option>
                ) : (
                  shifts.map(shift => (
                    <option key={shift.id} value={shift.id} className="bg-gray-800 text-white">
                      {shift.name} ({formatShiftTime(shift)})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Sentiment Overview */}
          <div 
            className="space-y-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
            }}
          >
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Average Sentiment</h3>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#14b8a6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(averageSentimentProgress / 100) * 502.4} 502.4`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    style={{ 
                      opacity: isVisible ? 1 : 0,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{Math.round(averageSentimentProgress)}%</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Target</h3>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#14b8a6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(targetSentimentProgress / 100) * 502.4} 502.4`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    style={{ 
                      opacity: isVisible ? 1 : 0,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{Math.round(targetSentimentProgress)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Sentiment Analysis */}
          <div 
            className="space-y-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
            }}
          >
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Sentiment Analysis</h3>
              </div>
              <div className="h-48 relative">
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  {/* Y-axis labels */}
                  {[0, 20, 40, 60, 80, 100].map((val) => (
                    <g key={val}>
                      <line
                        x1="40"
                        y1={180 - (val * 1.6)}
                        x2="380"
                        y2={180 - (val * 1.6)}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                      />
                      <text
                        x="35"
                        y={185 - (val * 1.6)}
                        textAnchor="end"
                        className="text-xs fill-gray-400"
                      >
                        {val}
                      </text>
                    </g>
                  ))}
                  {/* Animated Line chart */}
                  {sentimentData.length > 0 && (
                    <>
                  <polyline
                        points={sentimentData.map((item, index) => {
                          const x = 40 + (index * (340 / Math.max(sentimentData.length - 1, 1)));
                      const y = 180 - (item.value * 1.6);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                        stroke="#ffffff"
                    strokeWidth="3"
                    strokeDasharray={isVisible ? "1000" : "0"}
                    strokeDashoffset={isVisible ? "0" : "1000"}
                    className="transition-all duration-1500 ease-out"
                    style={{ opacity: isVisible ? 1 : 0 }}
                  />
                      {/* Data points with animation */}
                      {sentimentData.map((item, index) => {
                        const x = 40 + (index * (340 / Math.max(sentimentData.length - 1, 1)));
                        const y = 180 - (item.value * 1.6);
                        // Check if date range is more than 7 days
                        const isMoreThan7Days = dateRange.start && dateRange.end && 
                          (new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24) > 7;
                        
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill={isMoreThan7Days ? item.color : "#ffffff"}
                              className="transition-all duration-500"
                              style={{
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'scale(1)' : 'scale(0)',
                                transformOrigin: 'center',
                                transitionDelay: `${800 + index * 150}ms`,
                              }}
                            />
                            {/* Show colored spot on x-axis for more than 7 days, or month name for 7 days or less */}
                            {isMoreThan7Days ? (
                              <circle
                                cx={x}
                                cy="195"
                                r="3"
                                fill={item.color}
                                className="transition-all duration-500"
                                style={{
                                  opacity: isVisible ? 1 : 0,
                                  transitionDelay: `${1000 + index * 100}ms`,
                                }}
                              />
                            ) : (
                              <text
                                x={x}
                                y="195"
                                textAnchor="middle"
                                className="text-xs fill-gray-400 transition-opacity duration-500"
                                style={{
                                  opacity: isVisible ? 1 : 0,
                                  transitionDelay: `${1000 + index * 100}ms`,
                                }}
                              >
                                {item.month}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </>
                  )}
                </svg>
              </div>
              {/* Month legend - only show when date range is more than 7 days */}
              {dateRange.start && dateRange.end && 
               (new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24) > 7 &&
               sentimentData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="flex flex-wrap items-center gap-3 justify-center">
                    {getMonthLegend().map((month, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: month.color }}
                        />
                        <span className="text-xs text-gray-300">{month.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
                <h4 className="text-white font-semibold mb-2">Low Sentiment (&lt;70)</h4>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(lowSentimentProgress / 100) * 351.86} 351.86`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      style={{ 
                        opacity: isVisible ? 1 : 0,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(lowSentimentProgress)}%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
                <h4 className="text-white font-semibold mb-2">High Sentiment (95+)</h4>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(highSentimentProgress / 100) * 351.86} 351.86`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      style={{ 
                        opacity: isVisible ? 1 : 0,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(highSentimentProgress)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - KPIs */}
          <div 
            className="space-y-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 600ms, transform 0.8s ease-out 600ms',
            }}
          >
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Total Talk Breaks</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{summaryData.total_talk_break || 0}</div>
              <p className="text-gray-400 text-sm mb-4">Segment Count: {summaryData.segment_count || 0}</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div
                  className="bg-white h-2 rounded-full transition-all duration-1000 ease-out origin-left"
                  style={{ 
                    width: isVisible ? `${Math.min((summaryData.total_talk_break || 0) / 10, 100)}%` : '0%',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: '800ms',
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Hand className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Segment Count</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{summaryData.segment_count || 0}</div>
              <p className="text-gray-400 text-sm mb-4">Total segments analyzed</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out origin-left"
                  style={{ 
                    width: isVisible ? `${Math.min((summaryData.segment_count || 0) / 10, 100)}%` : '0%',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: '1000ms',
                  }}
                />
              </div>
            </div>

            {/* <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Active Shifts</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{dummyData.activeShifts.value}</div>
              <p className="text-gray-400 text-sm mb-4">{dummyData.activeShifts.change} from last month</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-1000 ease-out origin-left"
                  style={{ 
                    width: isVisible ? `${dummyData.activeShifts.progress}%` : '0%',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: '1200ms',
                  }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-2 text-right">{dummyData.activeShifts.progress}%</p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallSummarySlide;

