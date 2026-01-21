import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, RotateCcw, ChevronUp, ChevronDown, Search, X, ToggleLeft, ToggleRight, ArrowLeftRight } from 'lucide-react';
import { setFilter, fetchShifts, fetchContentTypePrompt } from '../../store/slices/audioSegmentsSlice';
import { fetchPredefinedFilters } from '../../store/slices/shiftManagementSlice';
import { useDispatch, useSelector } from 'react-redux';
import { convertLocalToUTC } from '../../utils/dateTimeUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const FilterPanelV2 = ({
  filters,
  dispatch,
  segments,
  channelId,
  handleDaypartChange,
  handleSearchWithCustomTime,
  localStartTime,
  localEndTime,
  setLocalStartTime,
  setLocalEndTime,
  handleResetFilters,
  isInHeader = false,
  compact = false,
  localSearchText,
  setLocalSearchText,
  localSearchIn,
  setLocalSearchIn,
  handleSearch,
  handleClearSearch,
  handleDateSelect,
  handleDateRangeSelect,
  fetchAudioSegments = () => { }
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateButtonRef = useRef(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0, width: 0 });
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
    selecting: false
  });
  const [timeError, setTimeError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [localShiftId, setLocalShiftId] = useState(filters.shiftId || '');
  const [currentShiftId, setCurrentShiftId] = useState(filters.shiftId || '');
  const [currentPredefinedFilterId, setCurrentPredefinedFilterId] = useState(filters.predefinedFilterId || '');
  const [localDuration, setLocalDuration] = useState(filters.duration || '');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(filters.showFlaggedOnly || false);
  const [isExpanded, setIsExpanded] = useState(false);
  const filterRef = useRef(null);
  const calendarRef = useRef(null);
  const originalTimesRef = useRef({ startTime: null, endTime: null });

  // V2 specific filter states
  // Initialize from Redux filters.status if available, otherwise default to true for onlyActive
  const getInitialStatus = () => {
    // Check if filters.status is set (from Redux)
    if (filters.status === 'active') return { onlyActive: false, activeStatus: 'active' };
    if (filters.status === 'inactive') return { onlyActive: false, activeStatus: 'inactive' };
    // Check if filters.onlyActive is explicitly set in Redux
    if (filters.onlyActive !== undefined) {
      return { onlyActive: filters.onlyActive, activeStatus: 'all' };
    }
    // Default to true for "Only Active" on initial load
    return { onlyActive: true, activeStatus: 'all' };
  };

  const [onlyActive, setOnlyActive] = useState(getInitialStatus().onlyActive);
  const [activeStatus, setActiveStatus] = useState(getInitialStatus().activeStatus);

  // Load filter state from localStorage on mount
  const loadFilterStateFromStorage = () => {
    try {
      const stored = localStorage.getItem('filterV2_contentTypes');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          onlyAnnouncers: parsed.onlyAnnouncers !== undefined ? parsed.onlyAnnouncers : true,
          selectedContentTypes: parsed.selectedContentTypes || []
        };
      }
    } catch (err) {
      console.error('Error loading filter state from localStorage:', err);
    }
    // Default to true for "Only Announcers" on initial load if no stored value
    // Check if Redux has a value first
    if (filters.onlyAnnouncers !== undefined) {
      return {
        onlyAnnouncers: filters.onlyAnnouncers,
        selectedContentTypes: []
      };
    }
    return {
      onlyAnnouncers: true,
      selectedContentTypes: []
    };
  };

  const initialFilterState = loadFilterStateFromStorage();
  const [onlyAnnouncers, setOnlyAnnouncers] = useState(initialFilterState.onlyAnnouncers);
  const [selectedContentTypes, setSelectedContentTypes] = useState(initialFilterState.selectedContentTypes);

  // Save filter state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('filterV2_contentTypes', JSON.stringify({
        onlyAnnouncers,
        selectedContentTypes
      }));
    } catch (err) {
      console.error('Error saving filter state to localStorage:', err);
    }
  }, [onlyAnnouncers, selectedContentTypes]);

  // Ref to track if we're manually updating status (to prevent useEffect from interfering)
  const isManuallyUpdatingStatus = useRef(false);
  // Ref to track if we're manually updating content types (to prevent sync useEffect from interfering)
  const isManuallyUpdatingContentTypes = useRef(false);

  const { shifts, shiftsLoading } = useSelector(state => state.audioSegments);
  const { predefinedFilters, loading: predefinedLoading } = useSelector(state => state.shiftManagement);
  const { contentTypePrompt } = useSelector(state => state.audioSegments);
  const reduxDispatch = useDispatch();

  // Debug: Log content type prompt data
  useEffect(() => {
    console.log('Content Type Prompt Data:', contentTypePrompt);
  }, [contentTypePrompt]);

  // Track the current channel ID to detect changes
  const [trackedChannelId, setTrackedChannelId] = useState(() => {
    return localStorage.getItem('channelId') || channelId;
  });

  // Fetch content type prompt data on mount
  useEffect(() => {
    reduxDispatch(fetchContentTypePrompt());
  }, [reduxDispatch]);

  // Update trackedChannelId when channelId prop changes or localStorage changes
  useEffect(() => {
    const storedChannelId = localStorage.getItem('channelId');
    const effectiveChannelId = storedChannelId || channelId;
    if (effectiveChannelId !== trackedChannelId) {
      setTrackedChannelId(effectiveChannelId);
    }
  }, [channelId, trackedChannelId]);

  // Fetch shifts and predefined filters when component mounts or channelId changes
  useEffect(() => {
    const effectiveChannelId = localStorage.getItem('channelId') || channelId;
    if (effectiveChannelId) {
      reduxDispatch(fetchShifts());
      reduxDispatch(fetchPredefinedFilters());
    }
  }, [reduxDispatch, channelId, trackedChannelId]);

  // Initialize defaults on mount - set onlyActive and onlyAnnouncers to true if not already set
  const hasInitializedDefaults = useRef(false);
  useEffect(() => {
    if (hasInitializedDefaults.current) return;
    
    // Check if this is the first load (no stored values in localStorage)
    const stored = localStorage.getItem('filterV2_contentTypes');
    let hasStoredValue = false;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        hasStoredValue = parsed.onlyAnnouncers !== undefined;
      } catch (e) {
        // Invalid stored value, treat as no stored value
      }
    }
    
    // Only set defaults if there's no stored value (first time load)
    // We respect Redux state if it exists, but if localStorage has no value, we set defaults
    if (!hasStoredValue) {
      console.log('🎯 Initializing V2 filter defaults: onlyActive=true, onlyAnnouncers=true');
      
      // Update local state (already set in useState, but ensure Redux matches)
      // Update Redux state with defaults only if not already set
      if (filters.onlyActive === undefined) {
        dispatch(setFilter({ onlyActive: true, status: 'active' }));
      }
      if (filters.onlyAnnouncers === undefined) {
        dispatch(setFilter({ onlyAnnouncers: true }));
      }
      
      hasInitializedDefaults.current = true;
    } else {
      hasInitializedDefaults.current = true;
    }
  }, []); // Run only once on mount

  // Listen for channel changes and refetch shifts/predefined filters
  useEffect(() => {
    const handleChannelChange = (event) => {
      const newChannel = event.detail;
      const newChannelId = newChannel?.id || localStorage.getItem('channelId');

      if (newChannelId) {
        reduxDispatch(fetchShifts());
        reduxDispatch(fetchPredefinedFilters());
        reduxDispatch(fetchContentTypePrompt());

        setCurrentShiftId('');
        setLocalShiftId('');
        setCurrentPredefinedFilterId('');
        setShowFlaggedOnly(false);

        // Clear content type filters when channel changes
        setOnlyAnnouncers(false);
        setSelectedContentTypes([]);
        // Clear status filters when channel changes
        setOnlyActive(false);
        setActiveStatus('all');
        // Clear Redux state
        dispatch(setFilter({ contentTypes: [], onlyAnnouncers: false, onlyActive: false, status: null }));
        // Clear localStorage for content type filters
        try {
          localStorage.removeItem('filterV2_contentTypes');
        } catch (err) {
          console.error('Error clearing filter state from localStorage:', err);
        }
      }
    };

    window.addEventListener('channelChanged', handleChannelChange);
    return () => {
      window.removeEventListener('channelChanged', handleChannelChange);
    };
  }, [reduxDispatch]);

  // Simple shift time display
  const formatShiftTime = (shift) => {
    const start = (shift.start_time || '').substring(0, 5);
    const end = (shift.end_time || '').substring(0, 5);
    return `${start} - ${end}`;
  };

  // Update handleShiftChange
  const handleShiftChange = (shiftId) => {
    console.log('🔄 Shift changed to:', shiftId);
    const normalizedId = shiftId ? String(shiftId) : '';
    const wasShiftSelected = currentShiftId && currentShiftId !== '';
    const isSelectingShift = normalizedId && normalizedId !== '';
    const isDeselectingShift = wasShiftSelected && !normalizedId;

    setLocalShiftId(normalizedId);
    setCurrentShiftId(normalizedId);
    setCurrentPredefinedFilterId('');
    if (!normalizedId) {
      setShowFlaggedOnly(false);
    }

    const selectedShift = normalizedId
      ? shifts.find((shift) => String(shift.id) === normalizedId)
      : null;

    if (isSelectingShift && !wasShiftSelected) {
      originalTimesRef.current = {
        startTime: filters.startTime || '',
        endTime: filters.endTime || ''
      };
      console.log('💾 Stored original times:', originalTimesRef.current);
    }

    if (selectedShift) {
      const newLocalStart = (selectedShift.start_time || '').substring(0, 5);
      const newLocalEnd = (selectedShift.end_time || '').substring(0, 5);
      setLocalStartTime(newLocalStart);
      setLocalEndTime(newLocalEnd);
    } else if (isDeselectingShift) {
      const restoredStartTime = originalTimesRef.current.startTime || '';
      const restoredEndTime = originalTimesRef.current.endTime || '';
      setLocalStartTime(restoredStartTime ? restoredStartTime.substring(0, 5) : '');
      setLocalEndTime(restoredEndTime ? restoredEndTime.substring(0, 5) : '');
      console.log('🔄 Restored original times:', { restoredStartTime, restoredEndTime });
    }

    let finalStartTime = '';
    let finalEndTime = '';

    if (selectedShift) {
      finalStartTime = selectedShift.start_time || '';
      finalEndTime = selectedShift.end_time || '';
    } else if (isDeselectingShift) {
      finalStartTime = originalTimesRef.current.startTime || '';
      finalEndTime = originalTimesRef.current.endTime || '';
    } else {
      finalStartTime = filters.startTime || '';
      finalEndTime = filters.endTime || '';
    }

    const newFilters = {
      shiftId: normalizedId || null,
      predefinedFilterId: null,
      date: filters.date,
      startDate: filters.startDate,
      endDate: filters.endDate,
      startTime: finalStartTime,
      endTime: finalEndTime,
      daypart: 'none',
      showFlaggedOnly: normalizedId ? showFlaggedOnly : false
    };

    dispatch(setFilter(newFilters));
    applyFiltersV2(newFilters, normalizedId);
  };

  const handlePredefinedFilterChange = (predefinedId) => {
    const normalizedId = predefinedId ? String(predefinedId) : '';
    setCurrentPredefinedFilterId(normalizedId);
    setCurrentShiftId('');
    setShowFlaggedOnly(false);

    const newFilters = {
      predefinedFilterId: normalizedId || null,
      shiftId: null,
      date: filters.date,
      startDate: filters.startDate,
      endDate: filters.endDate,
      startTime: filters.startTime,
      endTime: filters.endTime,
      daypart: 'none',
      showFlaggedOnly: false
    };
    dispatch(setFilter(newFilters));
    applyFiltersV2(newFilters, null);
  };

  // Helper function to validate time range
  const validateTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return true;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    return end > start;
  };

  const handleStartTimeChange = (time) => {
    setLocalStartTime(time);
    setTimeError('');

    if (time && localEndTime) {
      if (!validateTimeRange(time, localEndTime)) {
        setTimeError('End time cannot be before start time');
      }
    }
  };

  const handleEndTimeChange = (time) => {
    setLocalEndTime(time);
    setTimeError('');

    if (time && localStartTime) {
      if (!validateTimeRange(localStartTime, time)) {
        setTimeError('End time cannot be before start time');
      }
    }
  };

  // Helper functions for timezone-safe date handling
  const convertLocalToUTCDateString = (localDate) => {
    const utcDate = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate()
    ));
    return utcDate.toISOString().split('T')[0];
  };

  const convertUTCToLocalDate = (utcDateString) => {
    if (!utcDateString) return null;
    const [year, month, day] = utcDateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateString = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Initialize date range from filters
  useEffect(() => {
    const startDate = filters.startDate ? convertUTCToLocalDate(filters.startDate) : null;
    const endDate = filters.endDate ? convertUTCToLocalDate(filters.endDate) : null;

    setDateRange({
      start: startDate ? getLocalDateString(startDate) : null,
      end: endDate ? getLocalDateString(endDate) : null,
      selecting: false
    });
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    setLocalStartTime(filters.startTime?.substring(0, 5) || '');
    setLocalEndTime(filters.endTime?.substring(0, 5) || '');
    setLocalDuration(filters.duration || '');
    setShowFlaggedOnly(filters.showFlaggedOnly || false);

    if (!filters.shiftId && !originalTimesRef.current.startTime && !originalTimesRef.current.endTime) {
      originalTimesRef.current = {
        startTime: filters.startTime || '',
        endTime: filters.endTime || ''
      };
    }
  }, [filters.startTime, filters.endTime, filters.duration, filters.showFlaggedOnly, filters.shiftId]);

  useEffect(() => {
    if (filters.shiftId !== currentShiftId) {
      setCurrentShiftId(filters.shiftId || '');
      setLocalShiftId(filters.shiftId || '');
    }
  }, [filters.shiftId, currentShiftId]);

  useEffect(() => {
    if (filters.predefinedFilterId !== currentPredefinedFilterId) {
      setCurrentPredefinedFilterId(filters.predefinedFilterId || '');
    }
  }, [filters.predefinedFilterId, currentPredefinedFilterId]);

  // Sync onlyAnnouncers from Redux state
  useEffect(() => {
    // Skip sync if we're manually updating content types
    if (isManuallyUpdatingContentTypes.current) {
      return;
    }

    // Sync onlyAnnouncers from Redux to local state
    if (filters.onlyAnnouncers !== undefined && filters.onlyAnnouncers !== onlyAnnouncers) {
      setOnlyAnnouncers(filters.onlyAnnouncers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.onlyAnnouncers]);

  // Sync content types with Redux state
  // IMPORTANT: Don't sync when onlyAnnouncers is true to prevent "Announcer" item from appearing checked
  // When "Only Announcers" is selected, we track it via onlyAnnouncers state, not via Redux contentTypes
  useEffect(() => {
    // Skip sync if we're manually updating content types
    if (isManuallyUpdatingContentTypes.current) {
      return;
    }

    // Skip sync if "Only Announcers" is selected (check both local and Redux state)
    // This ensures the UI shows "Only Announcers" as selected, not "Announcer" as a checked item
    const isOnlyAnnouncersActive = onlyAnnouncers || filters.onlyAnnouncers;
    if (isOnlyAnnouncersActive) {
      // When onlyAnnouncers is true, ensure selectedContentTypes stays empty
      // This prevents any Redux contentTypes from syncing and showing "Announcer" as checked
      if (selectedContentTypes.length > 0) {
        setSelectedContentTypes([]);
      }
      // Also ensure onlyAnnouncers local state matches Redux
      if (filters.onlyAnnouncers && !onlyAnnouncers) {
        setOnlyAnnouncers(true);
      }
      return;
    }

    // Only sync from Redux when onlyAnnouncers is false
    if (filters.contentTypes && Array.isArray(filters.contentTypes)) {
      // Only update if different to avoid infinite loops
      const currentTypes = JSON.stringify([...selectedContentTypes].sort());
      const reduxTypes = JSON.stringify([...filters.contentTypes].sort());
      if (currentTypes !== reduxTypes) {
        console.log('🔄 Syncing content types from Redux:', filters.contentTypes);
        setSelectedContentTypes(filters.contentTypes);
      }
    } else if (filters.contentTypes === null || (Array.isArray(filters.contentTypes) && filters.contentTypes.length === 0)) {
      // If Redux has empty/null contentTypes and we have selected types, clear them
      if (selectedContentTypes.length > 0) {
        setSelectedContentTypes([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.contentTypes, onlyAnnouncers, filters.onlyAnnouncers]);

  // Sync onlyActive from Redux state
  useEffect(() => {
    // Skip sync if we're manually updating status
    if (isManuallyUpdatingStatus.current) {
      return;
    }

    // Sync onlyActive from Redux to local state
    if (filters.onlyActive !== undefined && filters.onlyActive !== onlyActive) {
      setOnlyActive(filters.onlyActive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.onlyActive]);

  // Sync status state with Redux filters.status (for V2) - only when status changes externally
  // IMPORTANT: This should NOT interfere when onlyActive is true, as "Only Active" mode takes precedence
  useEffect(() => {
    // Skip sync if we're manually updating status or if onlyActive is true (check both local and Redux state)
    const isOnlyActiveActive = onlyActive || filters.onlyActive;
    if (isManuallyUpdatingStatus.current || isOnlyActiveActive) {
      // When onlyActive is true, ensure activeStatus stays at 'all' to prevent UI confusion
      if (isOnlyActiveActive && activeStatus !== 'all') {
        setActiveStatus('all');
      }
      // Also ensure onlyActive local state matches Redux
      if (filters.onlyActive && !onlyActive) {
        setOnlyActive(true);
      }
      return;
    }

    // Only sync if filters.status changes and it's different from our current state
    // This prevents infinite loops by only updating when Redux state changes externally
    if (filters.status === 'active' || filters.status === 'inactive') {
      // If status is set in Redux, update local state
      if (activeStatus !== filters.status) {
        setActiveStatus(filters.status);
        setOnlyActive(false); // Ensure onlyActive is off when using specific status
      }
    } else if (filters.status === null) {
      // If status is null (all), reset to 'all'
      if (activeStatus !== 'all') {
        setActiveStatus('all');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, onlyActive, filters.onlyActive]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (showDatePicker && dateButtonRef.current) {
        const rect = dateButtonRef.current.getBoundingClientRect();
        setCalendarPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };

    updatePosition();
    if (showDatePicker) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showDatePicker]);

  // Date range selection handler
  const handleDateRangeSelection = (startDateUTC, endDateUTC) => {
    console.log('UTC Date range selected:', startDateUTC, 'to', endDateUTC);

    if (handleDateRangeSelect) {
      handleDateRangeSelect(startDateUTC, endDateUTC);
    } else {
      dispatch(setFilter({
        startDate: startDateUTC,
        endDate: endDateUTC,
        date: null,
        daypart: 'none'
      }));

      applyFiltersV2({
        ...filters,
        startDate: startDateUTC,
        endDate: endDateUTC,
        date: null,
        daypart: 'none'
      }, currentShiftId);
    }
  };

  // Calendar navigation functions
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay();

    const days = [];

    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: true
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(currentYear, currentMonth, i);
      days.push({
        date,
        isCurrentMonth: true,
        isDisabled: false
      });
    }

    return days;
  };

  const isDateInRange = (date) => {
    if (!dateRange.start || !dateRange.end) return false;

    const currentDate = getLocalDateString(date);
    const startDate = parseDateString(dateRange.start);
    const endDate = parseDateString(dateRange.end);
    const dateObj = parseDateString(currentDate);

    return dateObj >= startDate && dateObj <= endDate;
  };

  const isRangeStart = (date) => {
    const dateString = getLocalDateString(date);
    return dateString === dateRange.start;
  };

  const isRangeEnd = (date) => {
    const dateString = getLocalDateString(date);
    return dateString === dateRange.end;
  };

  const handleDateClick = (date) => {
    const localDateString = getLocalDateString(date);
    const utcDateString = convertLocalToUTCDateString(date);

    if (!dateRange.start) {
      setDateRange({
        start: localDateString,
        end: null,
        selecting: true
      });
    } else if (dateRange.selecting) {
      let finalStartUTC = convertLocalToUTCDateString(parseDateString(dateRange.start));
      let finalEndUTC = utcDateString;

      if (new Date(utcDateString) < new Date(finalStartUTC)) {
        finalStartUTC = utcDateString;
        finalEndUTC = convertLocalToUTCDateString(parseDateString(dateRange.start));
      }

      setDateRange({
        start: dateRange.start,
        end: localDateString,
        selecting: false
      });

      handleDateRangeSelection(finalStartUTC, finalEndUTC);
    } else {
      setDateRange({
        start: localDateString,
        end: null,
        selecting: true
      });
    }
  };

  const formatDateRangeDisplay = () => {
    if (dateRange.start && dateRange.end) {
      return `${dateRange.start} to ${dateRange.end}`;
    } else if (dateRange.start) {
      return `${dateRange.start} - Select end date`;
    }
    return 'Select date range';
  };

  const clearDateRange = () => {
    setDateRange({ start: null, end: null, selecting: false });
    handleDateRangeSelection(null, null);
  };

  const preventKeyboardInput = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  const getTodayDateString = () => {
    return getLocalDateString(new Date());
  };

  const handleShowFlaggedOnlyChange = (checked) => {
    setShowFlaggedOnly(checked);

    const newFilters = {
      ...filters,
      showFlaggedOnly: checked
    };

    dispatch(setFilter(newFilters));
    applyFiltersV2(newFilters, currentShiftId);
  };

  // V2 Filter handlers
  const handleOnlyActiveToggle = (checked) => {
    console.log('🔄 handleOnlyActiveToggle called with checked:', checked);
    console.log('📊 Current state before update:', { onlyActive, activeStatus, filtersStatus: filters.status });

    // Set flag to prevent useEffect from interfering
    isManuallyUpdatingStatus.current = true;

    const newOnlyActive = checked;
    // When turning on "Only Active", always set status to 'active' and reset activeStatus to 'all'
    // This ensures "Only Active" takes precedence and hides other status options immediately
    // When turning off, restore to the previous activeStatus (or 'all' if it was 'all')
    const newActiveStatus = checked ? 'all' : activeStatus;

    console.log('📝 Will update to:', { newOnlyActive, newActiveStatus });

    // Update state immediately - React will batch these updates
    // IMPORTANT: Set onlyActive first so the UI condition {!onlyActive && ...} works correctly
    setOnlyActive(newOnlyActive);
    setActiveStatus(newActiveStatus);

    // Update Redux filters.status to sync with other components
    // "Only Active" always means status='active' in the API, regardless of previous activeStatus value
    // This ensures that even if "Active" was selected before, "Only Active" will work correctly
    const statusForRedux = checked ? 'active' : (newActiveStatus === 'all' ? null : newActiveStatus);

    console.log('🔴 Setting Redux status to:', statusForRedux);
    // CRITICAL: Update Redux onlyActive flag to prevent stale state from showing in UI
    // This ensures the sync useEffect respects "Only Active" mode
    dispatch(setFilter({ status: statusForRedux, onlyActive: checked }));

    // Apply filters with the new state values
    // When onlyActive is true, status will be 'active' regardless of activeStatus
    applyFiltersV2WithStatusAndContentTypes(filters, currentShiftId, newOnlyActive, newActiveStatus, onlyAnnouncers, selectedContentTypes);

    // Reset flag after a short delay to allow state updates to complete
    setTimeout(() => {
      isManuallyUpdatingStatus.current = false;
      console.log('✅ State update complete, flag reset');
    }, 100);
  };

  const handleActiveStatusChange = (status) => {
    const newActiveStatus = status;
    const newOnlyActive = false; // Turn off only active when selecting specific status

    setActiveStatus(newActiveStatus);
    setOnlyActive(newOnlyActive);

    // Update Redux filters.status to sync with other components
    const statusForRedux = newActiveStatus === 'all' ? null : newActiveStatus;
    // Clear onlyActive flag in Redux when selecting specific status
    dispatch(setFilter({ status: statusForRedux, onlyActive: false }));

    // Apply filters with the new state values
    applyFiltersV2WithStatusAndContentTypes(filters, currentShiftId, newOnlyActive, newActiveStatus, onlyAnnouncers, selectedContentTypes);
  };

  const handleOnlyAnnouncersToggle = (checked) => {
    if (checked) {
      // When turning on "Only Announcers", first clear any selected content types (like clicking "All")
      // This ensures a clean transition and prevents UI confusion
      // Workflow: Set onlyAnnouncers first, then clear selected content types
      // This prevents "All" from showing as checked during the transition
      
      // Set flag FIRST to prevent sync useEffect from interfering
      isManuallyUpdatingContentTypes.current = true;
      
      // IMPORTANT: Update both states synchronously in the same event handler
      // React 18 automatically batches these updates, but we set onlyAnnouncers first
      // to ensure the UI condition {!onlyAnnouncers && ...} evaluates correctly
      // Set onlyAnnouncers to true FIRST - this ensures "All" toggle section is hidden immediately
      setOnlyAnnouncers(true);
      
      // Then clear selected content types (acts like clicking "All")
      // Since onlyAnnouncers is already true, the "All" toggle won't be visible/checked
      setSelectedContentTypes([]);
      
      // CRITICAL: Clear Redux contentTypes to prevent stale data from showing in UI
      // Even though we track "Only Announcers" via local state, we must clear Redux
      // to ensure the sync useEffect doesn't restore old content types after the timeout
      dispatch(setFilter({ contentTypes: [], onlyAnnouncers: true }));
      
      // Apply filters with onlyAnnouncers=true (this will send content_type=Announcer to API)
      applyFiltersV2WithContentTypes(filters, currentShiftId, true, []);
      
      // Reset flag after a short delay
      setTimeout(() => {
        isManuallyUpdatingContentTypes.current = false;
      }, 100);
    } else {
      // When turning off only announcers, apply filters with current selectedContentTypes
      setOnlyAnnouncers(false);
      // Clear onlyAnnouncers flag in Redux
      dispatch(setFilter({ onlyAnnouncers: false }));
      applyFiltersV2WithContentTypes(filters, currentShiftId, false, selectedContentTypes);
    }
  };

  const handleContentTypeToggle = (contentType, checked) => {
    // Set flag to prevent sync useEffect from interfering
    isManuallyUpdatingContentTypes.current = true;
    
    setOnlyAnnouncers(false); // Turn off only announcers when selecting specific content types
    
    // Calculate updated content types using functional update to ensure we have latest state
    setSelectedContentTypes(prev => {
      let updatedContentTypes;
      if (checked) {
        // Add the content type if it's not already in the list
        updatedContentTypes = prev.includes(contentType) ? prev : [...prev, contentType];
      } else {
        // Remove the content type
        updatedContentTypes = prev.filter(type => type !== contentType);
      }
      
      // Update Redux state immediately with the new content types
      dispatch(setFilter({ contentTypes: updatedContentTypes }));
      
      // Apply filters with the updated content types immediately
      // Use the calculated value directly to avoid race conditions
      applyFiltersV2WithContentTypes(filters, currentShiftId, false, updatedContentTypes);
      
      return updatedContentTypes;
    });
    
    // Reset flag after a short delay to allow state updates to complete
    setTimeout(() => {
      isManuallyUpdatingContentTypes.current = false;
    }, 100);
  };

  const handleAllContentTypesToggle = (checked) => {
    if (checked) {
      setSelectedContentTypes([]);
      setOnlyAnnouncers(false);
      // Clear content types in Redux
      dispatch(setFilter({ contentTypes: [] }));
      // Apply filters immediately - no content_type param should be added
      // Pass empty array to indicate "All" is selected
      applyFiltersV2WithContentTypes(filters, currentShiftId, false, []);
    }
  };

  // Helper function to determine status parameter
  const getStatusParam = (onlyActiveValue, activeStatusValue) => {
    if (onlyActiveValue) {
      return 'active'; // Only active
    } else if (activeStatusValue === 'active') {
      return 'active';
    } else if (activeStatusValue === 'inactive') {
      return 'inactive';
    }
    return null;
  };

  // Apply filters using V2 API with explicit status and content type parameters
  const applyFiltersV2WithStatusAndContentTypes = (filterState, shiftId, onlyActiveValue, activeStatusValue, onlyAnnouncersValue, selectedContentTypesValue) => {
    let startDatetime = null;
    let endDatetime = null;

    // Calculate datetime from date range and time
    if (filterState.startDate && filterState.endDate) {
      const startTime = filterState.startTime || '00:00:00';
      const endTime = filterState.endTime || '23:59:59';
      startDatetime = convertLocalToUTC(filterState.startDate, startTime);
      endDatetime = convertLocalToUTC(filterState.endDate, endTime);
    } else if (filterState.date) {
      const startTime = filterState.startTime || '00:00:00';
      const endTime = filterState.endTime || '23:59:59';
      startDatetime = convertLocalToUTC(filterState.date, startTime);
      endDatetime = convertLocalToUTC(filterState.date, endTime);
    }

    // Determine status - API expects 'active' or 'inactive' as strings
    const statusParam = getStatusParam(onlyActiveValue, activeStatusValue);

    // Determine content types for API call using explicit parameters
    // Rules:
    // 1. When "Only Announcers" is selected → content_type=Announcer (exact case, capital A)
    // 2. When "All" is selected → don't add content_type param at all (pass null or empty array)
    // 3. When specific content types are selected → add them as-is (exact strings, no lowercase conversion)
    let contentTypesParam = null; // null means don't add content_type param
    if (onlyAnnouncersValue) {
      // Filter to only "Announcer" content type (exact case as required by backend)
      contentTypesParam = ['Announcer'];
      console.log('📢 Only Announcers selected - using content_type=Announcer');
    } else if (selectedContentTypesValue && selectedContentTypesValue.length > 0) {
      // Use selected content types exactly as they are (no lowercase conversion)
      // Pass the exact strings from the API/UI without modification
      contentTypesParam = [...selectedContentTypesValue];
      console.log('📋 Selected content types:', contentTypesParam);
    } else {
      // "All" is selected - no content_type param will be added
      contentTypesParam = null; // Explicitly set to null to ensure no param is added
      console.log('🌐 All content types selected - no content_type param');
    }
    // If contentTypesParam is null or empty array, content_type won't be added to API call (handled in slice)

    // Get duration value
    let durationValue = null;
    if (localDuration && localDuration.toString().trim() !== '') {
      const parsed = parseInt(localDuration.toString().trim(), 10);
      if (!isNaN(parsed) && parsed > 0) {
        durationValue = parsed;
      }
    }

    if (fetchAudioSegments) {
      console.log('🚀 Calling V2 API with contentTypes:', contentTypesParam);
      console.log('📊 Full API params:', {
        channelId,
        startDatetime,
        endDatetime,
        page: 1,
        shiftId: shiftId || filterState.shiftId || null,
        predefinedFilterId: filterState.predefinedFilterId || null,
        contentTypes: contentTypesParam || [],
        status: statusParam,
        searchText: filterState.searchText || localSearchText || null,
        searchIn: filterState.searchIn || localSearchIn || null
      });

      // fetchAudioSegments prop should be fetchAudioSegmentsV2 function
      reduxDispatch(fetchAudioSegments({
        channelId,
        startDatetime,
        endDatetime,
        page: 1,
        shiftId: shiftId || filterState.shiftId || null,
        predefinedFilterId: filterState.predefinedFilterId || null,
        contentTypes: contentTypesParam || [], // Pass empty array if null to ensure no param is added
        status: statusParam,
        searchText: filterState.searchText || localSearchText || null,
        searchIn: filterState.searchIn || localSearchIn || null
      }));
    }
  };


  // Helper function to apply filters with explicit content type values
  // This avoids race conditions where state hasn't updated yet
  const applyFiltersV2WithContentTypes = (filterState, shiftId, onlyAnnouncersValue, selectedContentTypesValue) => {
    applyFiltersV2WithStatusAndContentTypes(filterState, shiftId, onlyActive, activeStatus, onlyAnnouncersValue, selectedContentTypesValue);
  };

  // Apply filters using V2 API (uses current state values)
  const applyFiltersV2 = (filterState, shiftId) => {
    applyFiltersV2WithStatusAndContentTypes(filterState, shiftId, onlyActive, activeStatus, onlyAnnouncers, selectedContentTypes);
  };

  // Wrapper function to handle Apply button click
  const handleApplyWithDuration = () => {
    let durationValue = null;

    if (localDuration && localDuration.toString().trim() !== '') {
      const parsed = parseInt(localDuration.toString().trim(), 10);
      if (!isNaN(parsed) && parsed > 0) {
        durationValue = parsed;
      }
    }

    const timeFilters = {
      startTime: localStartTime ? localStartTime + ':00' : '',
      endTime: localEndTime ? localEndTime + ':00' : '',
      daypart: 'none',
      duration: durationValue,
      showFlaggedOnly: currentShiftId ? showFlaggedOnly : false
    };

    dispatch(setFilter(timeFilters));

    const completeFilters = {
      ...filters,
      ...timeFilters
    };

    applyFiltersV2(completeFilters, currentShiftId);
  };

  // Compact Calendar component
  const CompactDateRangeCalendar = () => {
    const startDate = dateRange.start ? parseDateString(dateRange.start) : null;
    const endDate = dateRange.end ? parseDateString(dateRange.end) : null;
    
    // Local state for date selection before applying
    const [localStartDate, setLocalStartDate] = useState(startDate);
    const [localEndDate, setLocalEndDate] = useState(endDate);
    const prevShowDatePickerRef = useRef(showDatePicker);
    
    // Sync local state when modal opens (not on every change)
    useEffect(() => {
      // Only sync when modal transitions from closed to open
      if (showDatePicker && !prevShowDatePickerRef.current) {
        setLocalStartDate(startDate);
        setLocalEndDate(endDate);
      }
      prevShowDatePickerRef.current = showDatePicker;
    }, [showDatePicker]);
    
    const handleStartDateChange = (date) => {
      if (!date) {
        setLocalStartDate(null);
        setLocalEndDate(null);
        return;
      }
      
      // If end date exists and new start is after end, clear end date
      if (localEndDate && date > localEndDate) {
        setLocalStartDate(date);
        setLocalEndDate(null);
      } else {
        setLocalStartDate(date);
      }
    };
    
    const handleEndDateChange = (date) => {
      if (!date) {
        // If clearing end date, keep start date
        setLocalEndDate(null);
        return;
      }
      
      // Ensure end date is not before start date
      if (localStartDate && date < localStartDate) {
        // If end is before start, swap them
        const oldStart = localStartDate;
        setLocalStartDate(date);
        setLocalEndDate(oldStart);
      } else if (localStartDate) {
        setLocalEndDate(date);
      } else {
        // End date selected before start, set as start
        setLocalStartDate(date);
        setLocalEndDate(null);
      }
    };
    
    const handleApply = () => {
      if (localStartDate && localEndDate) {
        // Both dates selected, apply filter
        const finalStartUTC = convertLocalToUTCDateString(localStartDate);
        const finalEndUTC = convertLocalToUTCDateString(localEndDate);
        
        setDateRange({
          start: getLocalDateString(localStartDate),
          end: getLocalDateString(localEndDate),
          selecting: false
        });
        
        // Send UTC dates to backend
        handleDateRangeSelection(finalStartUTC, finalEndUTC);
        setShowDatePicker(false);
      }
    };
    
    const handleClear = () => {
      setLocalStartDate(null);
      setLocalEndDate(null);
      setDateRange({ start: null, end: null, selecting: false });
      handleDateRangeSelection(null, null);
    };
    
    return (
      <div ref={calendarRef} className="bg-white border border-gray-300 rounded-lg shadow-lg p-4" style={{ minWidth: '560px' }}>
        <style>{`
          .react-datepicker {
            font-family: inherit;
            border: none;
            box-shadow: none;
          }
          .react-datepicker__header {
            background-color: white;
            border-bottom: 1px solid #e5e7eb;
            padding-top: 0.75rem;
          }
          .react-datepicker__current-month {
            font-weight: 600;
            font-size: 0.875rem;
            color: #374151;
            margin-bottom: 0.5rem;
          }
          .react-datepicker__day-names {
            display: flex;
            justify-content: space-around;
            margin-bottom: 0.25rem;
          }
          .react-datepicker__day-name {
            color: #6b7280;
            font-size: 0.75rem;
            font-weight: 500;
            width: 2rem;
            line-height: 2rem;
          }
          .react-datepicker__month {
            margin: 0.5rem;
          }
          .react-datepicker__week {
            display: flex;
            justify-content: space-around;
          }
          .react-datepicker__day {
            width: 2rem;
            line-height: 2rem;
            margin: 0.125rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
          }
          .react-datepicker__day--selected {
            background-color: #3b82f6;
            color: white;
            font-weight: 600;
          }
          .react-datepicker__day:hover {
            background-color: #dbeafe;
            border-radius: 0.25rem;
          }
          .react-datepicker__day--keyboard-selected {
            background-color: #3b82f6;
            color: white;
          }
          .react-datepicker__day--disabled {
            color: #d1d5db;
            cursor: not-allowed;
          }
          .react-datepicker__navigation {
            top: 0.75rem;
          }
          .react-datepicker__year-dropdown-container,
          .react-datepicker__month-dropdown-container {
            margin: 0 0.25rem;
          }
          .react-datepicker__year-select,
          .react-datepicker__month-select {
            padding: 0.25rem 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            background-color: white;
            color: #374151;
          }
        `}</style>
        <div className="flex gap-4">
          {/* From Date Calendar */}
          <div className="flex-1">
            <div className="mb-2">
              <label className="text-sm font-medium text-gray-700">From Date</label>
            </div>
            <DatePicker
              selected={localStartDate}
              onChange={handleStartDateChange}
              inline
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              calendarStartDay={0}
              dateFormat="yyyy-MM-dd"
              fixedHeight
              maxDate={localEndDate || new Date()}
            />
          </div>
          
          {/* To Date Calendar */}
          <div className="flex-1">
            <div className="mb-2">
              <label className="text-sm font-medium text-gray-700">To Date</label>
            </div>
            <DatePicker
              selected={localEndDate}
              onChange={handleEndDateChange}
              inline
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              calendarStartDay={0}
              dateFormat="yyyy-MM-dd"
              fixedHeight
              minDate={localStartDate}
              maxDate={new Date()}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 flex-1 truncate mr-2">
            {localStartDate && localEndDate ? (
              `${getLocalDateString(localStartDate)} to ${getLocalDateString(localEndDate)}`
            ) : localStartDate ? (
              `From: ${getLocalDateString(localStartDate)}`
            ) : (
              'Select date range'
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors whitespace-nowrap"
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              disabled={!localStartDate || !localEndDate}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Toggle component for switches - matches the image design
  const ToggleSwitch = ({ checked, onChange, label }) => {
    return (
      <div className={`flex items-center justify-between py-2 px-3 rounded transition-colors hover:bg-gray-50`}>
        <span className={`text-sm text-gray-700`}>{label}</span>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-300'
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full transition-transform ${checked ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white'
              }`}
          />
        </button>
      </div>
    );
  };

  // COMPACT VERSION FOR SIDEBAR
  if (compact) {
    return (
      <div className="bg-transparent" ref={filterRef}>
        <div className="space-y-4 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          {/* Only Active Section */}
          <div className="space-y-2 border-b border-gray-200 pb-3">
            <ToggleSwitch
              checked={onlyActive}
              onChange={handleOnlyActiveToggle}
              label="Only Active"
            />
            {!onlyActive && (
              <div className="space-y-1 pl-4">
                <ToggleSwitch
                  checked={activeStatus === 'all'}
                  onChange={(checked) => {
                    if (checked) {
                      handleActiveStatusChange('all');
                    }
                  }}
                  label="All"
                />
                <ToggleSwitch
                  checked={activeStatus === 'active'}
                  onChange={(checked) => {
                    if (checked) {
                      handleActiveStatusChange('active');
                    }
                  }}
                  label="Active"
                />
                <ToggleSwitch
                  checked={activeStatus === 'inactive'}
                  onChange={(checked) => {
                    if (checked) {
                      handleActiveStatusChange('inactive');
                    }
                  }}
                  label="Inactive"
                />
              </div>
            )}
          </div>

          {/* Only Announcers Section */}
          <div className="space-y-2 border-b border-gray-200 pb-3">
            <ToggleSwitch
              checked={onlyAnnouncers}
              onChange={handleOnlyAnnouncersToggle}
              label="Only Announcers"
            />
            {!onlyAnnouncers && (
              <div className="space-y-1 pl-4">
                <ToggleSwitch
                  checked={selectedContentTypes.length === 0 && !onlyAnnouncers}
                  onChange={handleAllContentTypesToggle}
                  label="All"
                />
                {contentTypePrompt?.loading ? (
                  <div className="text-xs text-gray-500 py-2">Loading content types...</div>
                ) : contentTypePrompt?.contentTypes && contentTypePrompt.contentTypes.length > 0 ? (
                  contentTypePrompt.contentTypes.map((contentType) => (
                    <ToggleSwitch
                      key={contentType}
                      checked={selectedContentTypes.includes(contentType)}
                      onChange={(checked) => handleContentTypeToggle(contentType, checked)}
                      label={contentType}
                    />
                  ))
                ) : (
                  <div className="text-xs text-gray-500 py-2">No content types available</div>
                )}
              </div>
            )}
          </div>

          {/* Shifts Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">Shift</label>
            <select
              value={currentShiftId}
              onChange={(e) => handleShiftChange(e.target.value || null)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Shifts</option>
              {shiftsLoading ? (
                <option disabled>Loading shifts...</option>
              ) : (
                shifts.map(shift => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({formatShiftTime(shift)})
                  </option>
                ))
              )}
            </select>
            {currentShiftId && (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="showFlaggedOnly"
                  checked={showFlaggedOnly}
                  onChange={(e) => handleShowFlaggedOnlyChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showFlaggedOnly" className="text-xs text-gray-700 cursor-pointer">
                  Show Flagged Only
                </label>
              </div>
            )}
          </div>

          {/* Predefined Filters Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">Predefined Filter</label>
            <select
              value={currentPredefinedFilterId}
              onChange={(e) => handlePredefinedFilterChange(e.target.value || null)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">None</option>
              {predefinedLoading ? (
                <option disabled>Loading filters...</option>
              ) : (
                predefinedFilters.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date Range Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">Date Range</label>
            <div className="relative">
              <button
                ref={dateButtonRef}
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-left flex justify-between items-center"
              >
                <span className={dateRange.start ? 'text-gray-900' : 'text-gray-500 truncate'}>
                  {formatDateRangeDisplay()}
                </span>
                <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0 ml-2" />
              </button>
              {showDatePicker && createPortal(
                (
                  <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowDatePicker(false)} />
                    <div ref={calendarRef} className="relative z-[10001]">
                      <CompactDateRangeCalendar />
                    </div>
                  </div>
                ),
                document.body
              )}
            </div>
          </div>

          {/* Time inputs */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">Time Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start</label>
                <input
                  type="time"
                  value={localStartTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  onKeyDown={preventKeyboardInput}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End</label>
                <input
                  type="time"
                  value={localEndTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  onKeyDown={preventKeyboardInput}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {timeError && (
            <div className="p-2 text-xs text-red-600 bg-red-50 rounded border border-red-200">
              {timeError}
            </div>
          )}

          {/* Duration Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">Duration (seconds)</label>
            <input
              type="number"
              value={localDuration}
              onChange={(e) => setLocalDuration(e.target.value)}
              placeholder="Enter duration in seconds"
              min="0"
              step="1"
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleResetFilters}
              className="flex-1 bg-gray-200 text-gray-700 text-xs px-2 py-1.5 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApplyWithDuration}
              className="flex-1 bg-blue-500 text-white text-xs px-2 py-1.5 rounded hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Header version - similar structure but horizontal layout
  if (isInHeader) {
    return (
      <div className="bg-white border-t border-gray-200" ref={filterRef}>
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex flex-row items-end gap-4 mb-4">

            {/* Only Active Section - Compact */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <div className="space-y-1 border border-gray-300 rounded p-2 bg-white">
                <ToggleSwitch
                  checked={onlyActive}
                  onChange={handleOnlyActiveToggle}
                  label="Only Active"
                />
                {!onlyActive && (
                  <>
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <ToggleSwitch
                        checked={activeStatus === 'all'}
                        onChange={(checked) => {
                          if (checked) {
                            handleActiveStatusChange('all');
                          }
                        }}
                        label="All"
                      />
                      <ToggleSwitch
                        checked={activeStatus === 'active'}
                        onChange={(checked) => {
                          if (checked) {
                            handleActiveStatusChange('active');
                          }
                        }}
                        label="Active"
                      />
                      <ToggleSwitch
                        checked={activeStatus === 'inactive'}
                        onChange={(checked) => {
                          if (checked) {
                            handleActiveStatusChange('inactive');
                          }
                        }}
                        label="Inactive"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Only Announcers Section - Compact */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Content Type</label>
              <div className="space-y-1 border border-gray-300 rounded p-2 bg-white max-h-64 overflow-y-auto">
                <ToggleSwitch
                  checked={onlyAnnouncers}
                  onChange={handleOnlyAnnouncersToggle}
                  label="Only Announcers"
                />
                {!onlyAnnouncers && (
                  <>
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <ToggleSwitch
                        checked={selectedContentTypes.length === 0 && !onlyAnnouncers}
                        onChange={handleAllContentTypesToggle}
                        label="All"
                      />
                      {contentTypePrompt?.loading ? (
                        <div className="text-xs text-gray-500 py-2">Loading content types...</div>
                      ) : contentTypePrompt?.contentTypes && contentTypePrompt.contentTypes.length > 0 ? (
                        contentTypePrompt.contentTypes.map((contentType) => (
                          <ToggleSwitch
                            key={contentType}
                            checked={selectedContentTypes.includes(contentType)}
                            onChange={(checked) => handleContentTypeToggle(contentType, checked)}
                            label={contentType}
                          />
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 py-2">No content types available</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Shifts Dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Shift</label>
              <select
                value={currentShiftId}
                onChange={(e) => handleShiftChange(e.target.value || null)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">All Shifts</option>
                {shiftsLoading ? (
                  <option disabled>Loading shifts...</option>
                ) : (
                  shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} - {(shift.start_time || '').substring(0, 5)} - {(shift.end_time || '').substring(0, 5)}
                    </option>
                  ))
                )}
              </select>
              {currentShiftId && (
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="showFlaggedOnlyHeader"
                    checked={showFlaggedOnly}
                    onChange={(e) => handleShowFlaggedOnlyChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="showFlaggedOnlyHeader" className="text-xs text-gray-700 cursor-pointer">
                    Show Flagged Only
                  </label>
                </div>
              )}
            </div>

            {/* Predefined Filters Dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Predefined Filter</label>
              <select
                value={currentPredefinedFilterId}
                onChange={(e) => handlePredefinedFilterChange(e.target.value || null)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">None</option>
                {predefinedLoading ? (
                  <option disabled>Loading filters...</option>
                ) : (
                  predefinedFilters.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-left flex justify-between items-center"
                >
                  <span className={dateRange.start ? 'text-gray-900' : 'text-gray-500'}>
                    {formatDateRangeDisplay()}
                  </span>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </button>
                {showDatePicker && createPortal(
                  (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/30" onClick={() => setShowDatePicker(false)} />
                      <div ref={calendarRef} className="relative z-[10001]">
                        <CompactDateRangeCalendar />
                      </div>
                    </div>
                  ),
                  document.body
                )}
              </div>
            </div>

            {/* Time inputs */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
              <input
                type="time"
                value={localStartTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                onKeyDown={preventKeyboardInput}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
              <input
                type="time"
                value={localEndTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                onKeyDown={preventKeyboardInput}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (seconds)</label>
              <input
                type="number"
                value={localDuration}
                onChange={(e) => setLocalDuration(e.target.value)}
                placeholder="Enter duration"
                min="0"
                step="1"
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {timeError && (
            <div className="mb-3 p-2 text-xs text-red-600 bg-red-50 rounded border border-red-200">
              {timeError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleResetFilters}
              className="flex items-center px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </button>
            <button
              onClick={handleApplyWithDuration}
              className="flex items-center px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded version - similar to compact but with expand/collapse
  const toggleFilters = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6" ref={filterRef}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={toggleFilters}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-blue-600">Filter Parameters V2</h2>
        </div>
        <div className="flex items-center space-x-2">
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-6">
          <div className="grid grid-cols-1 gap-8">
            {/* Status & Content Type Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <FilterIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Status & Content Type</h3>
              </div>

              {/* Only Active Section */}
              <div className="border border-gray-300 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Status</h4>
                <ToggleSwitch
                  checked={onlyActive}
                  onChange={handleOnlyActiveToggle}
                  label="Only Active"
                />
                {!onlyActive && (
                  <div className="mt-2 space-y-1 pl-4 border-t border-gray-200 pt-2">
                    <ToggleSwitch
                      checked={activeStatus === 'all'}
                      onChange={(checked) => {
                        if (checked) {
                          handleActiveStatusChange('all');
                        }
                      }}
                      label="All"
                    />
                    <ToggleSwitch
                      checked={activeStatus === 'active'}
                      onChange={(checked) => {
                        if (checked) {
                          handleActiveStatusChange('active');
                        }
                      }}
                      label="Active"
                    />
                    <ToggleSwitch
                      checked={activeStatus === 'inactive'}
                      onChange={(checked) => {
                        if (checked) {
                          handleActiveStatusChange('inactive');
                        }
                      }}
                      label="Inactive"
                    />
                  </div>
                )}
              </div>

              {/* Only Announcers Section */}
              <div className="border border-gray-300 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Content Type</h4>
                <ToggleSwitch
                  checked={onlyAnnouncers}
                  onChange={handleOnlyAnnouncersToggle}
                  label="Only Announcers"
                />
                {!onlyAnnouncers && (
                  <div className="mt-2 space-y-1 pl-4 border-t border-gray-200 pt-2 max-h-64 overflow-y-auto">
                    <ToggleSwitch
                      checked={selectedContentTypes.length === 0 && !onlyAnnouncers}
                      onChange={handleAllContentTypesToggle}
                      label="All"
                    />
                    {contentTypePrompt.contentTypes.map((contentType) => (
                      <ToggleSwitch
                        key={contentType}
                        checked={selectedContentTypes.includes(contentType)}
                        onChange={(checked) => handleContentTypeToggle(contentType, checked)}
                        label={contentType}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date & Time Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Date & Time</h3>
              </div>

              {/* Shifts Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                <div className="relative">
                  <select
                    value={currentShiftId}
                    onChange={(e) => handleShiftChange(e.target.value || null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                  >
                    <option value="">All Shifts</option>
                    {shiftsLoading ? (
                      <option disabled>Loading shifts...</option>
                    ) : (
                      shifts.map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({formatShiftTime(shift)})
                        </option>
                      ))
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                {currentShiftId && (
                  <div className="flex items-center space-x-2 mt-3">
                    <input
                      type="checkbox"
                      id="showFlaggedOnlyExpanded"
                      checked={showFlaggedOnly}
                      onChange={(e) => handleShowFlaggedOnlyChange(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="showFlaggedOnlyExpanded" className="text-sm text-gray-700 cursor-pointer">
                      Show Flagged Only
                    </label>
                  </div>
                )}
              </div>

              {/* Predefined Filters Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Predefined Filter</label>
                <div className="relative">
                  <select
                    value={currentPredefinedFilterId}
                    onChange={(e) => handlePredefinedFilterChange(e.target.value || null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                  >
                    <option value="">None</option>
                    {predefinedLoading ? (
                      <option disabled>Loading filters...</option>
                    ) : (
                      predefinedFilters.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Date Range Picker */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full md:w-auto p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left flex justify-between items-center min-w-64"
                    >
                      <span className={dateRange.start ? 'text-gray-900' : 'text-gray-500'}>
                        {formatDateRangeDisplay()}
                      </span>
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </button>
                    {showDatePicker && createPortal(
                      (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDatePicker(false)} />
                          <div ref={calendarRef} className="relative z-[10001]">
                            <CompactDateRangeCalendar />
                          </div>
                        </div>
                      ),
                      document.body
                    )}
                  </div>
                </div>

                {/* Time inputs in single line */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                  <div className="flex flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={localStartTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        onKeyDown={preventKeyboardInput}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                      <input
                        type="time"
                        value={localEndTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        onKeyDown={preventKeyboardInput}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {timeError && (
                    <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded border border-red-200">
                      {timeError}
                    </div>
                  )}
                </div>

                {/* Duration Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
                  <input
                    type="number"
                    value={localDuration}
                    onChange={(e) => setLocalDuration(e.target.value)}
                    placeholder="Enter duration in seconds"
                    min="0"
                    step="1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center mt-8 pt-6 border-t border-gray-200 gap-4">
            <button
              onClick={handleResetFilters}
              className="flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow-sm transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </button>

            <button
              onClick={handleApplyWithDuration}
              className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all duration-200"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for the missing FilterIcon
const FilterIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export default FilterPanelV2;