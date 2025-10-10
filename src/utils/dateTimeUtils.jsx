// utils/dateTimeUtils.js
export const convertLocalToUTC = (dateString, timeString = '00:00:00') => {
  if (!dateString) return null;
  
  try {
    // Combine date and time in local timezone
    const localDateTime = `${dateString}T${timeString}`;
    const date = new Date(localDateTime);
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString, timeString);
      return null;
    }
    
    // Convert to UTC ISO string
    const utcString = date.toISOString();
    console.log('Date conversion - Local:', `${dateString}T${timeString}`, 'UTC:', utcString);
    return utcString;
  } catch (error) {
    console.error('Error converting date:', error);
    return null;
  }
};

// Alternative: If you need to handle timezone offsets manually
export const convertLocalToUTCManual = (dateString, timeString = '00:00:00') => {
  if (!dateString) return null;
  
  const localDateTime = `${dateString}T${timeString}`;
  const date = new Date(localDateTime);
  
  // Get timezone offset in minutes and convert to milliseconds
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  
  // Apply offset to get UTC time
  const utcDate = new Date(date.getTime() + timezoneOffset);
  
  return utcDate.toISOString();
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