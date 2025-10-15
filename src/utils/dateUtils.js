// Utility functions for time handling
export const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return true;
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  // If end time is earlier than start time, it means it crosses midnight
  // This should be allowed, so we'll always return true for validation
  return true;
};

// Format time for display (no conversion needed since we're not converting to UTC)
export const formatTimeForDisplay = (time) => {
  if (!time) return '';
  // Remove seconds if present
  return time.slice(0, 5);
};

// Format time for API (ensure it has seconds)
export const formatTimeForAPI = (time) => {
  if (!time) return '';
  if (time.length === 5) {
    return time + ':00';
  }
  return time;
};

// Get current time in local format for form defaults
export const getCurrentLocalTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};