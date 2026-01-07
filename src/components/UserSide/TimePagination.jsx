import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

const TimePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  availablePages = []
}) => {
  const dateScrollRef = useRef(null);
  const hourScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollHourLeft, setCanScrollHourLeft] = useState(false);
  const [canScrollHourRight, setCanScrollHourRight] = useState(false);

  // Parse date and hour from timestamp
  const parseDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    try {
      const [datePart, timePartWithOffset] = dateTimeString.split("T");
      const [timePart] = timePartWithOffset.split(/[+-]/);
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour] = timePart.split(":").map(Number);
      return { year, month, day, hour, dateKey: `${year}-${month}-${day}` };
    } catch (error) {
      return null;
    }
  };

  // Get current page data
  const currentPageData = availablePages.find(page => page.page === currentPage);
  const currentDateTime = currentPageData ? parseDateTime(currentPageData.start_time) : null;
  const selectedDate = currentDateTime ? currentDateTime.dateKey : null;
  const selectedHour = currentDateTime ? currentDateTime.hour : null;

  // Extract unique dates from available pages
  const uniqueDates = useMemo(() => {
    const dateMap = new Map();
    availablePages
      .filter(page => page.has_data)
      .forEach(page => {
        const dt = parseDateTime(page.start_time);
        if (dt) {
          const dateKey = dt.dateKey;
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, {
              dateKey,
              month: dt.month,
              day: dt.day,
              year: dt.year,
              pages: []
            });
          }
          dateMap.get(dateKey).pages.push(page);
        }
      });
    return Array.from(dateMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
  }, [availablePages]);

  // Get available hours for selected date
  const availableHoursForDate = useMemo(() => {
    if (!selectedDate) return new Set();
    const dateData = uniqueDates.find(d => d.dateKey === selectedDate);
    if (!dateData) return new Set();
    const hours = new Set();
    dateData.pages.forEach(page => {
      const dt = parseDateTime(page.start_time);
      if (dt) hours.add(dt.hour);
    });
    return hours;
  }, [selectedDate, uniqueDates]);

  // Check scroll position for date row
  const checkDateScroll = () => {
    if (dateScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = dateScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Check scroll position for hour row
  const checkHourScroll = () => {
    if (hourScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = hourScrollRef.current;
      setCanScrollHourLeft(scrollLeft > 0);
      setCanScrollHourRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkDateScroll();
    checkHourScroll();
    const dateScroll = dateScrollRef.current;
    const hourScroll = hourScrollRef.current;

    if (dateScroll) {
      dateScroll.addEventListener('scroll', checkDateScroll);
      window.addEventListener('resize', checkDateScroll);
    }
    if (hourScroll) {
      hourScroll.addEventListener('scroll', checkHourScroll);
      window.addEventListener('resize', checkHourScroll);
    }

    return () => {
      if (dateScroll) {
        dateScroll.removeEventListener('scroll', checkDateScroll);
        window.removeEventListener('resize', checkDateScroll);
      }
      if (hourScroll) {
        hourScroll.removeEventListener('scroll', checkHourScroll);
        window.removeEventListener('resize', checkHourScroll);
      }
    };
  }, [uniqueDates, availablePages]);

  // Scroll date row
  const scrollDateRow = (direction) => {
    if (dateScrollRef.current) {
      const scrollAmount = 200;
      dateScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Scroll hour row
  const scrollHourRow = (direction) => {
    if (hourScrollRef.current) {
      const scrollAmount = 200;
      hourScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Handle date selection
  const handleDateClick = (dateKey) => {
    const dateData = uniqueDates.find(d => d.dateKey === dateKey);
    if (dateData && dateData.pages.length > 0) {
      // Select the first page for this date
      onPageChange(dateData.pages[0].page);
    }
  };

  // Handle hour selection
  const handleHourClick = (hour) => {
    if (!selectedDate) return;
    const dateData = uniqueDates.find(d => d.dateKey === selectedDate);
    if (!dateData) return;

    // Find page with matching hour
    const matchingPage = dateData.pages.find(page => {
      const dt = parseDateTime(page.start_time);
      return dt && dt.hour === hour;
    });

    if (matchingPage) {
      onPageChange(matchingPage.page);
    }
  };

  // Check if hour is available
  const isHourAvailable = (hour) => {
    return availableHoursForDate.has(hour);
  };

  return (
    <div className="flex flex-col items-center space-y-4 py-4 w-full">
      {/* Date Row with Navigation */}
      <div className="w-full relative">
        <div className="flex items-center gap-2">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollDateRow('left')}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              aria-label="Scroll dates left"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* Date Buttons Container */}
          <div
            ref={dateScrollRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-thin"
          >
            {uniqueDates.map((date) => {
              const isSelected = date.dateKey === selectedDate;
              const dateLabel = `${date.month}/${date.day}`;

              return (
                <button
                  type="button"
                  key={date.dateKey}
                  onClick={() => handleDateClick(date.dateKey)}
                  className={`
                    flex-shrink-0 w-16 h-8 flex items-center justify-center
                    rounded-lg font-medium text-xs transition-all duration-200
                    ${isSelected
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md scale-105'
                      : 'text-white shadow-sm'
                    }
                  `}
                  style={!isSelected ? {
                    backgroundColor: '#E1007B',
                    borderColor: '#C1006A',
                    borderWidth: '1px'
                  } : {}}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#C1006A';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#E1007B';
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-white'}`} />
                    <span>{dateLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollDateRow('right')}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              aria-label="Scroll dates right"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Hour Row with Navigation */}
      <div className="w-full relative">
        <div className="flex items-center gap-1">
          {/* Left Arrow */}
          {canScrollHourLeft && (
            <button
              type="button"
              onClick={() => scrollHourRow('left')}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              aria-label="Scroll hours left"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}

          {/* Hour Buttons Container */}
          <div
            ref={hourScrollRef}
            className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar"
          >
            {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
              const isSelected = selectedHour === hour;
              const isAvailable = isHourAvailable(hour);
              const isUnavailable = !isAvailable;

              return (
                <button
                  type="button"
                  key={hour}
                  onClick={() => !isUnavailable && handleHourClick(hour)}
                  disabled={isUnavailable}
                  className={`
                    flex-shrink-0 w-10 h-7 flex items-center justify-center
                    rounded-lg font-medium text-xs transition-all duration-200
                    ${isSelected
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md scale-105'
                      : isUnavailable
                        ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-blue-600 border border-blue-700 text-white hover:bg-blue-700 shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center gap-0.5">
                    <Clock className={`w-2.5 h-2.5 ${isSelected ? 'text-white' : isUnavailable ? 'text-gray-400' : 'text-white'}`} />
                    <span>{hour.toString().padStart(2, '0')}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Arrow */}
          {canScrollHourRight && (
            <button
              type="button"
              onClick={() => scrollHourRow('right')}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              aria-label="Scroll hours right"
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default TimePagination;