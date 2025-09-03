// src/utils/dateUtils.js
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Date(dateString).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options
  });
};

export const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

export const isToday = (dateString) => {
  const today = getToday();
  return dateString === today;
};

export const getDateRangeDisplay = (startDate, endDate) => {
  if (startDate === endDate) {
    return formatDate(startDate);
  }
  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
};