import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { parseApiSlotDate } from '../../utils/audioSegmentsApiHelpers';

const parseDateTimeOffset = (dateTimeString) => {
  if (!dateTimeString) return null;
  try {
    const d = new Date(dateTimeString);
    if (Number.isNaN(d.getTime())) return null;
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    };
  } catch {
    return null;
  }
};

const TimePagination = ({
  currentSlot = 0,
  slotDate = null,
  datesWithData = [],
  hours = [],
  onSlotChange,
}) => {
  const dateScrollRef = useRef(null);
  const hourScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollHourLeft, setCanScrollHourLeft] = useState(false);
  const [canScrollHourRight, setCanScrollHourRight] = useState(false);

  const selectedDateKey = parseApiSlotDate(slotDate);

  const uniqueDates = useMemo(() => {
    const dateMap = new Map();
    datesWithData.forEach((dateStr) => {
      const dt = parseDateTimeOffset(dateStr);
      if (!dt) return;
      if (!dateMap.has(dt.dateKey)) {
        dateMap.set(dt.dateKey, {
          dateKey: dt.dateKey,
          month: dt.month,
          day: dt.day,
          year: dt.year,
        });
      }
    });
    return Array.from(dateMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
  }, [datesWithData]);

  const checkDateScroll = () => {
    if (dateScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = dateScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

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
  }, [uniqueDates, hours]);

  const scrollDateRow = (direction) => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  const scrollHourRow = (direction) => {
    if (hourScrollRef.current) {
      hourScrollRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  const handleDateClick = (dateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const padded = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSlotChange({ slotCalendarDate: padded });
  };

  const handleHourClick = (hour) => {
    if (!selectedDateKey) return;
    onSlotChange({ slotCalendarDate: selectedDateKey, slotIndex: hour });
  };

  const isHourAvailable = (hour) => {
    const entry = hours.find((h) => h.slot === hour);
    return entry?.has_data === true;
  };

  if (uniqueDates.length === 0 && hours.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 w-full">
      {uniqueDates.length > 0 && (
        <div className="w-full relative">
          <div className="flex items-center gap-2">
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

            <div
              ref={dateScrollRef}
              className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-thin"
            >
              {uniqueDates.map((date) => {
                const isSelected = date.dateKey === selectedDateKey;
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
                    style={
                      !isSelected
                        ? {
                            backgroundColor: '#E1007B',
                            borderColor: '#C1006A',
                            borderWidth: '1px',
                          }
                        : {}
                    }
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#C1006A';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#E1007B';
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-white" />
                      <span>{dateLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>

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
      )}

      <div className="w-full relative">
        <div className="flex items-center gap-1">
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

          <div
            ref={hourScrollRef}
            className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar"
          >
            {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
              const isSelected = currentSlot === hour;
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
                    <Clock
                      className={`w-2.5 h-2.5 ${isSelected ? 'text-white' : isUnavailable ? 'text-gray-400' : 'text-white'}`}
                    />
                    <span>{hour.toString().padStart(2, '0')}</span>
                  </div>
                </button>
              );
            })}
          </div>

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
