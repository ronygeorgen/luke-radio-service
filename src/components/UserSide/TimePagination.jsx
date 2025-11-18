import React, { useMemo } from 'react';

const TimePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  availablePages = []
}) => {

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
    <div className="flex flex-col items-center space-y-3 py-4 w-full">
      {/* Date Row */}
      <div className="flex items-center justify-center space-x-2 w-full overflow-x-auto">
        {uniqueDates.map((date) => {
          const isSelected = date.dateKey === selectedDate;
          const dateLabel = `${date.month}/${date.day}`;

          return (
            <button
              key={date.dateKey}
              onClick={() => handleDateClick(date.dateKey)}
              className={`px-4 py-2 rounded-lg text-white font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                isSelected
                  ? 'bg-teal-500'
                  : 'bg-pink-500 hover:bg-pink-600'
              }`}
            >
              {dateLabel}
            </button>
          );
        })}
      </div>

      {/* Hour Row */}
      <div className="flex items-center justify-center space-x-1 w-full overflow-x-auto">
        {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
          const isSelected = selectedHour === hour;
          const isAvailable = isHourAvailable(hour);
          // Only disable if no data is available - allow navigation to any hour with data
          const isUnavailable = !isAvailable;

          return (
            <button
              key={hour}
              onClick={() => !isUnavailable && handleHourClick(hour)}
              disabled={isUnavailable}
              className={`px-3 py-2 rounded-lg text-white font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                isSelected
                  ? 'bg-teal-500'
                  : isUnavailable
                  ? 'bg-gray-600 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {hour}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimePagination;