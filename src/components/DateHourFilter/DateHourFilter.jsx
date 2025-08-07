import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDateFilter, setHourFilter } from '../../store/slices/audioSegmentsSlice';

const DateHourFilter = () => {
  const dispatch = useDispatch();
  const { date, hour } = useSelector((state) => state.audioSegments.filters);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(date);

  const handleDateChange = (e) => {
    const newDate = e.target.value.replace(/-/g, '');
    setSelectedDate(newDate);
    dispatch(setDateFilter(newDate));
    setShowDatePicker(false);
  };

  const handleHourChange = (newHour) => {
    dispatch(setHourFilter(newHour.toString()));
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {formatDateForDisplay(date) || 'Select Date'}
          </button>
          {showDatePicker && (
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              <input
                type="date"
                value={formatDateForDisplay(selectedDate)}
                onChange={handleDateChange}
                className="p-2"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 24 }, (_, i) => i).map((h) => (
            <button
              key={h}
              onClick={() => handleHourChange(h)}
              className={`px-3 py-1 rounded-md ${
                hour === h.toString()
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {h.toString().padStart(2, '0')}:00
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DateHourFilter;