// utils/dateTimeUtils.js
export const convertLocalToUTC = (dateString, timeString = '00:00') => {
  if (!dateString) return null;

  const tz = ((typeof localStorage !== 'undefined' && localStorage.getItem('channelTimezone')) || 'UTC').trim();

  // Normalize to HH:mm:ss
  const normalizeTime = (t) => {
    const parts = String(t || '00:00').split(':');
    if (parts.length === 2) return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}:00`;
    if (parts.length === 3) return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}:${parts[2].padStart(2,'0')}`;
    return '00:00:00';
  };

  const safeTime = normalizeTime(timeString);

  const [y, m, d] = dateString.split('-').map(Number);
  const [hh, mm, ss] = safeTime.split(':').map(Number);

  // Initial UTC guess for desired wall time
  const initialGuess = new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0));

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const partsToObj = (date) => Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
  const apparent = partsToObj(initialGuess);

  // The wall time produced by formatting the guess in tz, expressed as a UTC timestamp
  const apparentUTC = Date.UTC(+apparent.year, +apparent.month - 1, +apparent.day, +apparent.hour, +apparent.minute, +apparent.second);
  // The desired wall time (same clock time/date), expressed as if it were UTC
  const desiredUTC = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);

  // Shift the instant so the wall time in tz matches the desired wall time
  const corrected = new Date(initialGuess.getTime() + (desiredUTC - apparentUTC));

  // Full ISO with milliseconds and Z
  return corrected.toISOString();
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