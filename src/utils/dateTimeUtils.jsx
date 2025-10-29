// utils/dateTimeUtils.js
export const convertLocalToUTC = (dateString, timeString = '00:00:00') => {
  if (!dateString) return null;

  try {
    let resolvedTimezone = localStorage?.getItem('channelTimezone')?.trim() || 'Australia/Melbourne';

    // Use Intl to break down the date in target timezone
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: resolvedTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date(`${dateString}T${timeString}`));

    // Extract the values
    const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));

    // Construct a real Date object in that timezone
    const utcDate = new Date(
      Date.UTC(
        lookup.year,
        lookup.month - 1,
        lookup.day,
        lookup.hour,
        lookup.minute,
        lookup.second
      )
    );

    return utcDate.toISOString();
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