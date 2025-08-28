// utils/dateTimeUtils.js
export const convertLocalToUTC = (dateString, timeString = '00:00:00') => {
  if (!dateString) return null;
  
  const localDateTime = new Date(`${dateString}T${timeString}`);
  return localDateTime.toISOString().split('.')[0]; // Remove milliseconds
};

export const getUTCDateTimeRange = (date, startTime, endTime) => {
  if (!date) return { startDatetime: null, endDatetime: null };
  
  let startDatetime, endDatetime;
  
  if (startTime && endTime) {
    // Specific time range
    startDatetime = convertLocalToUTC(date, startTime);
    endDatetime = convertLocalToUTC(date, endTime);
  } else {
    // Whole day
    startDatetime = convertLocalToUTC(date, '00:00:00');
    endDatetime = convertLocalToUTC(date, '23:59:59');
  }
  
  return { startDatetime, endDatetime };
};

export const formatDateTimeForDisplay = (date, time) => {
  if (!date) return '';
  
  if (time) {
    return `${date} ${time.substring(0, 5)}`;
  }
  
  return date;
};