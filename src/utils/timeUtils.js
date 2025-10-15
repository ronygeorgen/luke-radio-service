// Convert local time to UTC for API requests
export const localTimeToUTC = (localTime) => {
  if (!localTime) return '';
  
  const [hours, minutes, seconds] = localTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds || 0, 0);
  
  // Convert to UTC
  const utcHours = String(date.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
  const utcSeconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${utcHours}:${utcMinutes}:${utcSeconds}`;
};

// Convert UTC time to local time for display
export const utcToLocalTime = (utcTime) => {
  if (!utcTime) return '';
  
  const [hours, minutes, seconds] = utcTime.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, seconds || 0, 0);
  
  // Convert to local time
  const localHours = String(date.getHours()).padStart(2, '0');
  const localMinutes = String(date.getMinutes()).padStart(2, '0');
  const localSeconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${localHours}:${localMinutes}:${localSeconds}`;
};

// Get current time in local format for form defaults
export const getCurrentLocalTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};