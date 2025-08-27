export const formatDateForDisplay = (dateString) => {
  if (dateString.includes('-')) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }
  
  try {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const isoDate = `${year}-${month}-${day}`;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(isoDate).toLocaleDateString(undefined, options);
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid Date';
  }
};

export const formatTimeDisplay = (filters, daypartOptions) => {
  if (filters.daypart && filters.daypart !== 'none') {
    const daypart = daypartOptions.find(opt => opt.value === filters.daypart);
    return daypart.label.split('(')[1].replace(')', '');
  }
  
  if (filters.startTime && filters.endTime) {
    return `${filters.startTime.substring(0, 5)}–${filters.endTime.substring(0, 5)}`;
  }
  
  return 'All day';
};