import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Filter as FilterIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchAudioSegments, setCurrentPlaying, setIsPlaying, setFilter, clearError } from '../../store/slices/audioSegmentsSlice';
import Header from '../../components/UserSide/Header';
import FilterPanel from '../../components/UserSide/FilterPanel';
import SegmentCard from '../../components/UserSide/SegmentCard';
import SegmentShimmer from '../../components/UserSide/SegmentShimmer';
import SummaryModal from './SummaryModal';
import TranscriptionModal from './TranscriptionModal';
import AudioPlayer from './AudioPlayer';
import { formatDateForDisplay, formatTimeDisplay } from '../../utils/formatters'
import useTranscriptionPolling from '../../hooks/useTranscriptionPolling';
import { openTrimmer } from '../../store/slices/audioTrimmerSlice';
import AudioTrimmer from './AudioTrimmer';
import CompactAudioEditor from '../../components/UserSide/CompactAudioEditor';
import TimePagination from '../../components/UserSide/TimePagination';
import PieChartModal from '../../components/UserSide/PieChartModal';
import PieChartTrigger from '../../components/UserSide/PieChartTrigger';
import MergeAudioTrigger from '../../components/UserSide/MergeAudioTrigger';
import StatusToggleTrigger from '../../components/UserSide/StatusToggleTrigger';
import Toast from '../../components/UserSide/Toast';
import { audioManagementApi } from '../../services/audioManagementApi';

const AudioSegmentsPage = () => {
  const navigate = useNavigate();
  const { channelId: channelIdFromParams } = useParams();
  // Prioritize localStorage channelId if it differs from URL params (channel was switched)
  const storedChannelId = localStorage.getItem("channelId");
  const channelId = storedChannelId && storedChannelId !== channelIdFromParams ? storedChannelId : (channelIdFromParams || storedChannelId);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get('date');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const daypart = searchParams.get('daypart');
  
  const [localSearchText, setLocalSearchText] = useState('');
  const [localSearchIn, setLocalSearchIn] = useState('transcription');

  const { isOpen: isTrimmerOpen } = useSelector((state) => state.audioTrimmer);
  const [isCompactEditorOpen, setIsCompactEditorOpen] = useState(false);
  const [compactEditorSegment, setCompactEditorSegment] = useState(null);

  const [showPieChartModal, setShowPieChartModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Multi-select state for merging segments
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [mergeError, setMergeError] = useState(null);
  
  // Status toggle state
  const [isStatusToggleMode, setIsStatusToggleMode] = useState(false);
  const [statusSelectedSegmentIds, setStatusSelectedSegmentIds] = useState(new Set());
  const [showStatusToggleOptions, setShowStatusToggleOptions] = useState(false);
  
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [isFabHovered, setIsFabHovered] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusMessageType, setStatusMessageType] = useState('success');
  const [errorToast, setErrorToast] = useState(null);
  const [showToggleAllConfirm, setShowToggleAllConfirm] = useState(false);
  const [showConversionConfirm, setShowConversionConfirm] = useState(false);
  const [pendingConversion, setPendingConversion] = useState(null); // 'activeToInactive' or 'inactiveToActive'
  
  const handleTrimClick = (segment) => {
    dispatch(openTrimmer(segment));
  };

  const handleCompactEditClick = (segment) => {
    setCompactEditorSegment(segment);
    setIsCompactEditorOpen(true);
  };
  
  const channelName = searchParams.get("name"); 

  useEffect(() => {
    if (channelName) {
      localStorage.setItem("channelName", channelName);
    }

    if (channelId) {
      localStorage.setItem("channelId", channelId);
    }
  }, [channelName, channelId]);
  
  const dispatch = useDispatch();
  useTranscriptionPolling();
  
  const { 
    segments, 
    channelInfo, 
    loading, 
    error, 
    currentPlayingId,
    isPlaying,
    filters,
    pagination,
    availablePages
  } = useSelector((state) => state.audioSegments);

  // Track the current channel ID from localStorage to detect changes
  // This ensures we always use the most up-to-date channel ID, even when switching channels
  const [currentChannelId, setCurrentChannelId] = useState(channelId);

  // Update currentChannelId when channelId from params changes or when localStorage changes
  useEffect(() => {
    const storedChannelId = localStorage.getItem('channelId');
    if (storedChannelId) {
      setCurrentChannelId(storedChannelId);
    } else {
      setCurrentChannelId(channelId);
    }
  }, [channelId]);

  // Listen for channel changes and refetch data
  useEffect(() => {
    const handleChannelChange = (event) => {
      const newChannel = event.detail;
      const newChannelId = newChannel?.id || localStorage.getItem('channelId');
      const newChannelName = newChannel?.name || localStorage.getItem('channelName');
      
      // Always refetch when channel change event is received, even if it's the same channel
      // This ensures data is refreshed when switching back to the original channel
      if (newChannelId && newChannelId !== channelIdFromParams) {
        // Update the tracked channel ID
        setCurrentChannelId(newChannelId);
        
        // Update URL to reflect the new channel ID while preserving all search params
        const currentParams = new URLSearchParams(searchParams);
        
        // Preserve all existing query parameters
        const newParams = new URLSearchParams();
        currentParams.forEach((value, key) => {
          newParams.set(key, value);
        });
        
        // Update channel name if provided
        if (newChannelName) {
          newParams.set('name', encodeURIComponent(newChannelName));
        }
        
        // Navigate to new URL with updated channel ID, preserving all query params
        navigate(`/channels/${newChannelId}/segments?${newParams.toString()}`, { replace: true });
        
        // Refetch audio segments with current filters
        const filtersToUse = filters;
        if ((filtersToUse.startDate && filtersToUse.endDate) || filtersToUse.date) {
          dispatch(fetchAudioSegments({ 
            channelId: newChannelId, 
            date: filtersToUse.date,
            startDate: filtersToUse.startDate,
            endDate: filtersToUse.endDate,
            startTime: filtersToUse.startTime,
            endTime: filtersToUse.endTime,
            daypart: filtersToUse.daypart,
            searchText: filtersToUse.searchText,
            searchIn: filtersToUse.searchIn,
            shiftId: filtersToUse.shiftId,
            predefinedFilterId: filtersToUse.predefinedFilterId,
            duration: filtersToUse.duration,
            showFlaggedOnly: filtersToUse.showFlaggedOnly || false,
            status: filtersToUse.status,
            recognition_status: filtersToUse.recognition_status,
            has_content: filtersToUse.has_content,
            page: 1
          }));
        }
      }
    };

    window.addEventListener('channelChanged', handleChannelChange);
    return () => {
      window.removeEventListener('channelChanged', handleChannelChange);
    };
  }, [filters, dispatch, navigate, searchParams, channelIdFromParams]);

  const currentPage = pagination?.current_page || 1;
  const totalPages = pagination?.total_pages || 0;
  
  // Track if we've already auto-switched pages to avoid infinite loops
  const hasAutoSwitchedPage = useRef(false);
  
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [localStartTime, setLocalStartTime] = useState(filters.startTime?.substring(0, 5) || '');
  const [localEndTime, setLocalEndTime] = useState(filters.endTime?.substring(0, 5) || '');

  const daypartOptions = [
    { value: 'none', label: 'None', startTime: '', endTime: '' },
    { value: 'morning', label: 'Morning (06:00–10:00)', startTime: '06:00:00', endTime: '10:00:00' },
    { value: 'midday', label: 'Midday (10:00–15:00)', startTime: '10:00:00', endTime: '15:00:00' },
    { value: 'afternoon', label: 'Afternoon (15:00–19:00)', startTime: '15:00:00', endTime: '19:00:00' },
    { value: 'evening', label: 'Evening (19:00–00:00)', startTime: '19:00:00', endTime: '23:59:59' },
    { value: 'overnight', label: 'Overnight (00:00–06:00)', startTime: '00:00:00', endTime: '06:00:00' },
    { value: 'weekend', label: 'Weekend (Saturday & Sunday)', startTime: '00:00:00', endTime: '23:59:59' }
  ];

  // No frontend filtering - segments come filtered from API
  const filteredSegments = segments;

  const formatShortDate = (date) => {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };


  const isInitialLoad = useRef(true);
  const lastFilters = useRef(null);
  const hasInitialFiltersSet = useRef(false);

// Simplified useEffect for initial load
 useEffect(() => {
  if (isInitialLoad.current) {
    isInitialLoad.current = false;
    
    const today = new Date().toLocaleDateString('en-CA'); 
    
    setSearchParams({
      date: today,
      searchIn: 'transcription'
    });

    // Store current filters to detect changes
    lastFilters.current = {
      date: today,
      startDate: today,
      endDate: today,
      startTime: '00:00:00',
      endTime: '23:59:59',
      daypart: 'none',
      searchText: '',
      searchIn: 'transcription',
      shiftId: null,
      predefinedFilterId: null 
    };

    dispatch(setFilter(lastFilters.current));

    setLocalStartTime('');
    setLocalEndTime('');
    setLocalSearchText('');
    setLocalSearchIn('transcription');
    
    // Set hasInitialFiltersSet to true after initial setup
    hasInitialFiltersSet.current = true;
    
    // Make only ONE API call on initial load
    dispatch(fetchAudioSegments({ 
      channelId, 
      date: today,
      startTime: '00:00:00',
      endTime: '23:59:59',
      daypart: 'none',
      shiftId: null,
      predefinedFilterId: null,
      duration: null,
      showFlaggedOnly: false,
      status: filters.status,
      recognition_status: filters.recognition_status,
      has_content: filters.has_content,
      page: 1
    }));
  }
}, [channelId]);


  
// Simplified filter change handler
 useEffect(() => {
    if (!isInitialLoad.current) {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.startTime) params.startTime = filters.startTime;
      if (filters.endTime) params.endTime = filters.endTime;
      if (filters.daypart && filters.daypart !== 'none') params.daypart = filters.daypart;
      if (filters.searchText) params.searchText = filters.searchText;
      if (filters.searchIn) params.searchIn = filters.searchIn;
      
      setSearchParams(params);
    }
  }, [filters.date, filters.startDate, filters.endDate, filters.startTime, filters.endTime, filters.daypart, filters.searchText, filters.searchIn]);

  useEffect(() => {
    setLocalStartTime(filters.startTime?.substring(0, 5) || '');
    setLocalEndTime(filters.endTime?.substring(0, 5) || '');
    setLocalSearchText(filters.searchText || '');
    setLocalSearchIn(filters.searchIn || 'transcription');
  }, [filters]);

  const handleFilterChange = (newFilters = null) => {
    const filtersToUse = newFilters || filters;
    
    // Reset auto-switch flag when filters change
    hasAutoSwitchedPage.current = false;
    
    if ((filtersToUse.startDate && filtersToUse.endDate) || filtersToUse.date) {
      console.log('Making API call with filters:', filtersToUse);
      
      dispatch(fetchAudioSegments({ 
        channelId, 
        date: filtersToUse.date,
        startDate: filtersToUse.startDate,
        endDate: filtersToUse.endDate,
        startTime: filtersToUse.startTime,
        endTime: filtersToUse.endTime,
        daypart: filtersToUse.daypart,
        searchText: filtersToUse.searchText,
        searchIn: filtersToUse.searchIn,
        shiftId: filtersToUse.shiftId,
        predefinedFilterId: filtersToUse.predefinedFilterId,
        duration: filtersToUse.duration,
        showFlaggedOnly: filtersToUse.showFlaggedOnly || false,
        status: filtersToUse.status,
        recognition_status: filtersToUse.recognition_status,
        has_content: filtersToUse.has_content,
        page: 1
      }));
    }
  };

useEffect(() => {
  console.log('🔄 useEffect [filters] triggered - Syncing local state:');
  console.log('  - filters.startTime:', filters.startTime);
  console.log('  - filters.endTime:', filters.endTime);
  console.log('  - filters.searchText:', filters.searchText);
  console.log('  - filters.searchIn:', filters.searchIn);
  
  // Sync local time state with Redux filters
  setLocalStartTime(filters.startTime?.substring(0, 5) || '');
  setLocalEndTime(filters.endTime?.substring(0, 5) || '');
  setLocalSearchText(filters.searchText || '');
  setLocalSearchIn(filters.searchIn || 'transcription');
}, [filters]); 

// Add this useEffect for search-specific changes
 useEffect(() => {
    if (hasInitialFiltersSet.current && (filters.searchText || (filters.searchIn && filters.searchIn !== 'transcription'))) {
      console.log('Search filter changed:', {
        searchText: filters.searchText,
        searchIn: filters.searchIn
      });
      
      dispatch(fetchAudioSegments({ 
        channelId, 
        date: filters.date,
        startDate: filters.startDate,
        endDate: filters.endDate,
        startTime: filters.startTime,
        endTime: filters.endTime,
        daypart: filters.daypart,
        searchText: filters.searchText,
        searchIn: filters.searchIn,
        shiftId: filters.shiftId,
        predefinedFilterId: filters.predefinedFilterId,
        duration: filters.duration,
        showFlaggedOnly: filters.showFlaggedOnly || false,
        status: filters.status,
        recognition_status: filters.recognition_status,
        has_content: filters.has_content,
        page: 1
      }));
    }
  }, [filters.searchText, filters.searchIn, channelId]);

  // Auto-switch to a page with data if current page has no segments
  useEffect(() => {
    // Only check after initial load and when not loading
    if (!hasInitialFiltersSet.current || loading) {
      return;
    }

    // If current page has no segments
    if (segments.length === 0 && pagination?.available_pages) {
      // Find pages with data
      const pagesWithData = pagination.available_pages.filter(page => page.has_data);
      
      // If there are pages with data and current page is not one of them
      if (pagesWithData.length > 0) {
        const currentPageHasData = pagesWithData.some(page => page.page === currentPage);
        
        if (!currentPageHasData && !hasAutoSwitchedPage.current) {
          // Switch to the first page with data
          const firstPageWithData = pagesWithData[0].page;
          console.log(`🔄 Auto-switching from page ${currentPage} (no data) to page ${firstPageWithData} (has data)`);
          
          hasAutoSwitchedPage.current = true;
          
          dispatch(fetchAudioSegments({ 
            channelId, 
            date: filters.date,
            startDate: filters.startDate,
            endDate: filters.endDate,
            startTime: filters.startTime,
            endTime: filters.endTime,
            daypart: filters.daypart,
            searchText: filters.searchText,
            searchIn: filters.searchIn,
            shiftId: filters.shiftId,
            predefinedFilterId: filters.predefinedFilterId,
            duration: filters.duration,
            showFlaggedOnly: filters.showFlaggedOnly || false,
            status: filters.status,
            recognition_status: filters.recognition_status,
            has_content: filters.has_content,
            page: firstPageWithData
          }));
        }
      }
    } else if (segments.length > 0) {
      // Reset the flag when we have segments
      hasAutoSwitchedPage.current = false;
    }
  }, [segments.length, pagination, currentPage, loading, channelId, filters, dispatch]);

  const handlePageChange = (pageNumber) => {
  console.log('Page change requested to:', pageNumber);
  
  // Reset auto-switch flag when user manually changes page
  hasAutoSwitchedPage.current = false;
  
  // Use the unified fetchAudioSegments with page parameter
  dispatch(fetchAudioSegments({ 
    channelId, 
    date: filters.date,
    startDate: filters.startDate,
    endDate: filters.endDate,
    startTime: filters.startTime,
    endTime: filters.endTime,
    daypart: filters.daypart,
    searchText: filters.searchText,
    searchIn: filters.searchIn,
    shiftId: filters.shiftId,  // Add shiftId parameter
    predefinedFilterId: filters.predefinedFilterId,
    duration: filters.duration,
    showFlaggedOnly: filters.showFlaggedOnly || false,
    status: filters.status,
    recognition_status: filters.recognition_status,
    has_content: filters.has_content,
    page: pageNumber  // Pass the page number directly
  }));
};


useEffect(() => {
  if (!isInitialLoad.current && hasInitialFiltersSet.current) {
    // Check if time filters have actually changed
    const timeFiltersChanged = 
      filters.startTime !== lastFilters.current?.startTime || 
      filters.endTime !== lastFilters.current?.endTime;
    
    if (timeFiltersChanged && (filters.startTime || filters.endTime)) {
      console.log('Time filters changed, triggering API call:', {
        startTime: filters.startTime,
        endTime: filters.endTime
      });
      
      dispatch(fetchAudioSegments({ 
        channelId, 
        date: filters.date,
        startDate: filters.startDate,
        endDate: filters.endDate,
        startTime: filters.startTime,
        endTime: filters.endTime,
        daypart: filters.daypart,
        searchText: filters.searchText,
        searchIn: filters.searchIn,
        shiftId: filters.shiftId,
        predefinedFilterId: filters.predefinedFilterId,
        duration: filters.duration,
        showFlaggedOnly: filters.showFlaggedOnly || false,
        status: filters.status,
        recognition_status: filters.recognition_status,
        has_content: filters.has_content,
        page: 1
      }));
      
      // Update last filters
      lastFilters.current = { ...filters };
    }
  }
  }, [filters.startTime, filters.endTime, channelId]);

  // Handle errors with toast instead of replacing entire UI
  useEffect(() => {
    if (error) {
      // Check if error is about flag_seconds configuration
      if (error.includes('flag_seconds') || error.includes('Cannot filter flagged segments')) {
        // Automatically uncheck showFlaggedOnly
        dispatch(setFilter({ showFlaggedOnly: false }));
        setErrorToast('This shift does not have flag duration configured. Flagged filter has been disabled.');
        
        // Refetch data without showFlaggedOnly
        dispatch(fetchAudioSegments({ 
          channelId, 
          date: filters.date,
          startDate: filters.startDate,
          endDate: filters.endDate,
          startTime: filters.startTime,
          endTime: filters.endTime,
          daypart: filters.daypart,
          searchText: filters.searchText,
          searchIn: filters.searchIn,
          shiftId: filters.shiftId,
          predefinedFilterId: filters.predefinedFilterId,
          duration: filters.duration,
          showFlaggedOnly: false,
          status: filters.status,
          recognition_status: filters.recognition_status,
          has_content: filters.has_content,
          page: currentPage
        }));
      } else {
        setErrorToast(error);
      }
      // Clear error after showing toast
      dispatch(clearError());
    }
  }, [error, dispatch, channelId, filters, currentPage]);

const handleSearch = () => {
    console.log('🔍 Search button clicked - Current state:');
    console.log('  - localSearchText:', localSearchText);
    console.log('  - localSearchIn:', localSearchIn);
    
    const newFilters = {
      searchText: localSearchText,
      searchIn: localSearchIn,
      startTime: filters.startTime,
      endTime: filters.endTime,
      shiftId: filters.shiftId,
      daypart: filters.daypart
    };
    
    console.log('  - newFilters:', newFilters);
    
    dispatch(setFilter(newFilters));
    handleSearchWithPagination({ ...filters, ...newFilters });
  };

  const handleClearSearch = () => {
    setLocalSearchText('');
    setLocalSearchIn('transcription');
    
    const newFilters = {
      searchText: '',
      searchIn: 'transcription',
      startTime: filters.startTime,
      endTime: filters.endTime,
      shiftId: filters.shiftId,
      daypart: filters.daypart
    };
    
    dispatch(setFilter(newFilters));
    handleFilterChange({ ...filters, ...newFilters });
  };

  const handleToggleActiveStatusClick = () => {
    setShowStatusToggleOptions(true);
  };

  const handleToggleAllStatus = () => {
    setShowStatusToggleOptions(false);
    
    if (filteredSegments.length === 0) {
      setStatusMessage('No segments available to update.');
      setStatusMessageType('success');
      return;
    }

    // Check if status filter is 'all' - show modal with two options
    const currentStatus = filters.status || 'all';
    if (currentStatus === 'all') {
      // Show modal with two options for "all status" filter
      setShowToggleAllConfirm(true);
    } else if (currentStatus === 'active') {
      // For "active" filter, show confirmation modal to convert to inactive
      const activeSegmentIds = filteredSegments
        .filter(segment => segment.is_active)
        .map(segment => segment.id);

      if (activeSegmentIds.length === 0) {
        setStatusMessage('No active segments available to convert.');
        setStatusMessageType('success');
        return;
      }

      setPendingConversion('activeToInactive');
      setShowToggleAllConfirm(true);
    } else if (currentStatus === 'inactive') {
      // For "inactive" filter, show confirmation modal to convert to active
      const inactiveSegmentIds = filteredSegments
        .filter(segment => !segment.is_active)
        .map(segment => segment.id);

      if (inactiveSegmentIds.length === 0) {
        setStatusMessage('No inactive segments available to convert.');
        setStatusMessageType('success');
        return;
      }

      setPendingConversion('inactiveToActive');
      setShowToggleAllConfirm(true);
    }
  };

  const handleConfirmToggleAll = async () => {
    setShowToggleAllConfirm(false);

    const activeSegmentIds = filteredSegments
      .filter(segment => segment.is_active)
      .map(segment => segment.id);

    const inactiveSegmentIds = filteredSegments
      .filter(segment => !segment.is_active)
      .map(segment => segment.id);

    if (activeSegmentIds.length === 0 && inactiveSegmentIds.length === 0) {
      setStatusMessage('No segments available to update.');
      setStatusMessageType('success');
      return;
    }

    await updateSegmentStatuses(activeSegmentIds, inactiveSegmentIds);
  };

  const handleConvertActiveToInactive = () => {
    const activeSegmentIds = filteredSegments
      .filter(segment => segment.is_active)
      .map(segment => segment.id);

    if (activeSegmentIds.length === 0) {
      setStatusMessage('No active segments available to convert.');
      setStatusMessageType('success');
      setShowToggleAllConfirm(false);
      return;
    }

    // Show confirmation modal
    setPendingConversion('activeToInactive');
    setShowToggleAllConfirm(false);
    setShowConversionConfirm(true);
  };

  const handleConvertInactiveToActive = () => {
    const inactiveSegmentIds = filteredSegments
      .filter(segment => !segment.is_active)
      .map(segment => segment.id);

    if (inactiveSegmentIds.length === 0) {
      setStatusMessage('No inactive segments available to convert.');
      setStatusMessageType('success');
      setShowToggleAllConfirm(false);
      return;
    }

    // Show confirmation modal
    setPendingConversion('inactiveToActive');
    setShowToggleAllConfirm(false);
    setShowConversionConfirm(true);
  };

  const handleConfirmConversion = async () => {
    setShowConversionConfirm(false);

    if (pendingConversion === 'activeToInactive') {
      const activeSegmentIds = filteredSegments
        .filter(segment => segment.is_active)
        .map(segment => segment.id);

      if (activeSegmentIds.length > 0) {
        await updateSegmentStatuses(activeSegmentIds, []);
      }
    } else if (pendingConversion === 'inactiveToActive') {
      const inactiveSegmentIds = filteredSegments
        .filter(segment => !segment.is_active)
        .map(segment => segment.id);

      if (inactiveSegmentIds.length > 0) {
        await updateSegmentStatuses([], inactiveSegmentIds);
      }
    }

    setPendingConversion(null);
  };

  const handleCancelConversion = () => {
    setShowConversionConfirm(false);
    setPendingConversion(null);
  };

  const handleCancelToggleAll = () => {
    setShowToggleAllConfirm(false);
    setPendingConversion(null);
  };

  const handleSelectSegmentsForStatus = () => {
    setShowStatusToggleOptions(false);
    setIsStatusToggleMode(true);
    setStatusSelectedSegmentIds(new Set());
    // Exit merge mode if active
    if (isMergeMode) {
      setIsMergeMode(false);
      setSelectedSegmentIds(new Set());
    }
  };

  const handleStatusSegmentSelect = (segmentId) => {
    const newSelected = new Set(statusSelectedSegmentIds);
    if (newSelected.has(segmentId)) {
      newSelected.delete(segmentId);
    } else {
      newSelected.add(segmentId);
    }
    setStatusSelectedSegmentIds(newSelected);
  };

  const handleToggleSelectedStatus = async () => {
    if (statusSelectedSegmentIds.size === 0) {
      setStatusMessage('Please select at least one segment to update.');
      setStatusMessageType('error');
      return;
    }

    const selectedSegments = filteredSegments.filter(s => statusSelectedSegmentIds.has(s.id));
    const activeSegmentIds = selectedSegments
      .filter(segment => segment.is_active)
      .map(segment => segment.id);

    const inactiveSegmentIds = selectedSegments
      .filter(segment => !segment.is_active)
      .map(segment => segment.id);

    await updateSegmentStatuses(activeSegmentIds, inactiveSegmentIds);
    
    // Reset selection mode
    setIsStatusToggleMode(false);
    setStatusSelectedSegmentIds(new Set());
  };

  const updateSegmentStatuses = async (activeSegmentIds, inactiveSegmentIds) => {
    setIsStatusUpdating(true);

    try {
      const requests = [];

      if (inactiveSegmentIds.length > 0) {
        requests.push(audioManagementApi.updateSegmentActiveStatus(inactiveSegmentIds, true));
      }

      if (activeSegmentIds.length > 0) {
        requests.push(audioManagementApi.updateSegmentActiveStatus(activeSegmentIds, false));
      }

      await Promise.all(requests);

      dispatch(fetchAudioSegments({ 
        channelId, 
        date: filters.date,
        startDate: filters.startDate,
        endDate: filters.endDate,
        startTime: filters.startTime,
        endTime: filters.endTime,
        daypart: filters.daypart,
        searchText: filters.searchText,
        searchIn: filters.searchIn,
        shiftId: filters.shiftId,
        predefinedFilterId: filters.predefinedFilterId,
        duration: filters.duration,
        showFlaggedOnly: filters.showFlaggedOnly || false,
        status: filters.status,
        recognition_status: filters.recognition_status,
        has_content: filters.has_content,
        page: currentPage
      }));

      setStatusMessage('Segment statuses updated successfully.');
      setStatusMessageType('success');
    } catch (error) {
      console.error('Error updating segment statuses:', error);

      let errorMessage = 'Failed to update segment statuses. Please try again.';

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setStatusMessage(errorMessage);
      setStatusMessageType('error');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handlePlayPauseAudio = (segmentId) => {
    if (currentPlayingId === segmentId) {
      dispatch(setIsPlaying(!isPlaying));
    } else {
      dispatch(setCurrentPlaying(segmentId));
      dispatch(setIsPlaying(true));
    }
  };

const handleDaypartChange = (selectedDaypart) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (selectedDaypart === 'none') {
      const newFilters = {
        daypart: 'none', 
        startTime: '', 
        endTime: '',
      };
      dispatch(setFilter(newFilters));
      handleFilterChange({ ...filters, ...newFilters });
    } else {
      const daypart = daypartOptions.find(opt => opt.value === selectedDaypart);
      const newFilters = {
        daypart: selectedDaypart, 
        startTime: daypart.startTime, 
        endTime: daypart.endTime,
        date: today,
        startDate: null,
        endDate: null
      };
      dispatch(setFilter(newFilters));
      handleFilterChange({ ...filters, ...newFilters });
    }
  };

 const handleSearchWithCustomTime = () => {
    const newFilters = {
      startTime: localStartTime ? localStartTime + ':00' : '',
      endTime: localEndTime ? localEndTime + ':00' : '',
      daypart: 'none',
      duration: filters.duration || null,
    };
    dispatch(setFilter(newFilters));
    handleFilterChange({ ...filters, ...newFilters });
  };

  const handleDateSelect = (selectedDate) => {
    const newFilters = {
      date: selectedDate,
      startDate: null,
      endDate: null,
      daypart: 'none'
    };
    dispatch(setFilter(newFilters));
    handleFilterChange({ ...filters, ...newFilters });
  };

 const handleDateRangeSelect = (start, end) => {
    const newFilters = {
      startDate: start,
      endDate: end,
      date: null,
      daypart: 'none'
    };
    dispatch(setFilter(newFilters));
    handleFilterChange({ ...filters, ...newFilters });
  };

 const handleResetFilters = () => {
    const today = new Date().toLocaleDateString('en-CA');
    const defaultStartTime = '00:00:00';
    const defaultEndTime = '23:59:59';
    
    const newFilters = {
      date: today, 
      startDate: today, 
      endDate: today,
      startTime: defaultStartTime, 
      endTime: defaultEndTime, 
      daypart: 'none', 
      status: null, 
      recognition_status: null,
      has_content: null,
      searchText: '',
      searchIn: 'transcription',
      shiftId: null,
      predefinedFilterId: null,
      duration: null
    };
    
    dispatch(setFilter(newFilters));
    setLocalStartTime('');
    setLocalEndTime('');
    setLocalSearchText('');
    setLocalSearchIn('transcription');
    setSearchParams({ 
      date: today,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      searchIn: 'transcription'
    });
    
    handleFilterChange(newFilters);
  };

  const handleSummaryClick = (segment) => {
    setSelectedSegment(segment);
    setShowSummaryModal(true);
  };

  const handleTranscriptionClick = (segment) => {
    setSelectedSegment(segment);
    setShowTranscriptionModal(true);
  };

  // Multi-select handlers
  const handleToggleMergeMode = () => {
    setIsMergeMode(!isMergeMode);
    if (isMergeMode) {
      setSelectedSegmentIds(new Set());
    }
    setMergeError(null);
    // Exit status toggle mode if active
    if (isStatusToggleMode) {
      setIsStatusToggleMode(false);
      setStatusSelectedSegmentIds(new Set());
    }
    // Close status toggle options if open
    setShowStatusToggleOptions(false);
  };

  const handleCancelStatusToggleMode = () => {
    setIsStatusToggleMode(false);
    setStatusSelectedSegmentIds(new Set());
  };

  const handleSegmentSelect = (segmentId) => {
    const newSelected = new Set(selectedSegmentIds);
    if (newSelected.has(segmentId)) {
      newSelected.delete(segmentId);
    } else {
      newSelected.add(segmentId);
    }
    setSelectedSegmentIds(newSelected);
  };

  const handleMergeSegments = async () => {
    if (selectedSegmentIds.size < 2) {
      setMergeError('Please select at least 2 segments to merge');
      return;
    }

    setIsMerging(true);
    setMergeError(null);
    
    try {
      const segmentIdsArray = Array.from(selectedSegmentIds);
      const response = await audioManagementApi.mergeSegments(segmentIdsArray);
      
      // Reset selection and merge mode
      setSelectedSegmentIds(new Set());
      setIsMergeMode(false);
      setMergeError(null);
      
      // Check if merge was successful and get the merged segment
      if (response?.data?.success && response?.data?.data?.segments?.length > 0) {
        const mergedSegment = response.data.data.segments[0];
        
        // Open AudioTrimmer with the merged segment
        dispatch(openTrimmer(mergedSegment));
      }
      
      // Refresh segments
      dispatch(fetchAudioSegments({ 
        channelId, 
        date: filters.date,
        startDate: filters.startDate,
        endDate: filters.endDate,
        startTime: filters.startTime,
        endTime: filters.endTime,
        daypart: filters.daypart,
        searchText: filters.searchText,
        searchIn: filters.searchIn,
        shiftId: filters.shiftId,
        predefinedFilterId: filters.predefinedFilterId,
        duration: filters.duration,
        showFlaggedOnly: filters.showFlaggedOnly || false,
        status: filters.status,
        recognition_status: filters.recognition_status,
        has_content: filters.has_content,
        page: currentPage
      }));
    } catch (error) {
      console.error('Error merging segments:', error);
      
      // Extract error message from API response
      let errorMessage = 'Failed to merge segments. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for error message
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMergeError(errorMessage);
    } finally {
      setIsMerging(false);
    }
  };

  const handleFabToggle = () => {
    setIsFabExpanded((prev) => {
      const next = !prev;

      if (prev && !next) {
        if (isMergeMode) {
          setIsMergeMode(false);
        }
        if (selectedSegmentIds.size > 0) {
          setSelectedSegmentIds(new Set());
        }
        // Clear status toggle mode and selection when hiding
        if (isStatusToggleMode) {
          setIsStatusToggleMode(false);
        }
        if (statusSelectedSegmentIds.size > 0) {
          setStatusSelectedSegmentIds(new Set());
        }
        setMergeError(null);
      }

      return next;
    });
  };

if (loading && segments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          channelInfo={channelInfo} 
          channelName={channelName}
          filters={filters} 
          formatTimeDisplay={() => formatTimeDisplay(filters, daypartOptions)}
          localSearchText={localSearchText}
          setLocalSearchText={setLocalSearchText}
          localSearchIn={localSearchIn}
          setLocalSearchIn={setLocalSearchIn}
          handleSearch={handleSearch}
          handleClearSearch={handleClearSearch}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
          {[...Array(3)].map((_, i) => (
            <SegmentShimmer key={i} />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="fixed right-8 z-50"
        style={{ top: 'calc(4rem + 1.5rem + 1.5rem + 1.5rem + 1.5rem + 1.5rem + 2rem)' }}
      >
        <div className="relative flex flex-col items-end space-y-3">
          {isFabExpanded && (
            <>
              <PieChartTrigger
                onClick={() => setShowPieChartModal(true)}
                inline
              />
              <MergeAudioTrigger
                onClick={handleToggleMergeMode}
                isMergeMode={isMergeMode}
                selectedCount={selectedSegmentIds.size}
                inline
              />
              <div className="relative">
                {isStatusToggleMode && statusSelectedSegmentIds.size > 0 && (
                  <div className="absolute right-0 bottom-full flex flex-col space-y-3 mb-3">
                    <button
                      onClick={handleToggleSelectedStatus}
                      disabled={isStatusUpdating}
                      className={`
                        flex items-center justify-center w-12 h-12 rounded-full shadow-lg
                        transition-all duration-300 transform hover:scale-110
                        ${isStatusUpdating
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 shadow-xl'
                        }
                      `}
                      title="Toggle Selected Segments Status"
                    >
                      {isStatusUpdating ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={handleCancelStatusToggleMode}
                      className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-300 transform hover:scale-110"
                      title="Cancel"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <StatusToggleTrigger
                  onClick={handleToggleActiveStatusClick}
                  inline
                  isLoading={isStatusUpdating}
                />
                {showStatusToggleOptions && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowStatusToggleOptions(false)}
                    ></div>
                    <div className="absolute right-16 top-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px]">
                      <div className="py-1">
                        <button
                          onClick={handleToggleAllStatus}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Toggle All Segments
                        </button>
                        <button
                          onClick={handleSelectSegmentsForStatus}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Select Segments
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
          <div className="relative">
            <button
              onClick={handleFabToggle}
              onMouseEnter={() => setIsFabHovered(true)}
              onMouseLeave={() => setIsFabHovered(false)}
              className={`
                flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-gray-300 text-gray-700
                shadow-lg transition-all duration-300 transform hover:scale-110 hover:bg-gray-50
              `}
            >
              <ChevronLeft
                className={`
                  w-5 h-5 transition-transform duration-300
                  ${isFabExpanded ? 'transform rotate-180' : ''}
                `}
              />
            </button>
            {isFabHovered && (
              <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                <div className="bg-gray-900 text-white text-sm py-2 px-3 rounded-lg whitespace-nowrap shadow-lg">
                  {isFabExpanded ? 'Hide' : 'More'}
                  <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1">
                    <div className="w-3 h-3 bg-gray-900 transform rotate-45"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isMergeMode && selectedSegmentIds.size >= 2 && (
        <div
          className="fixed right-8 z-40"
          style={{ top: 'calc(4rem + 1.5rem + 7rem + 1.5rem + 1.5rem + 1.5rem + 1.5rem + 0.5rem)' }}
        >
          <button
            onClick={handleMergeSegments}
            disabled={isMerging}
            className={`
              flex items-center justify-center w-12 h-12 rounded-full shadow-lg
              transition-all duration-300 transform hover:scale-110
              ${isMerging
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 shadow-xl'
              }
            `}
            title="Merge Selected Segments"
          >
            {isMerging ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      )}
      {mergeError && (
        <Toast 
          message={mergeError} 
          onClose={() => setMergeError(null)}
          type="error"
        />
      )}
      {statusMessage && (
        <Toast 
          message={statusMessage} 
          onClose={() => setStatusMessage(null)}
          type={statusMessageType}
        />
      )}
      {errorToast && (
        <Toast 
          message={errorToast} 
          onClose={() => setErrorToast(null)}
          type="error"
        />
      )}
      <Header 
        channelInfo={channelInfo} 
        channelName={channelName}
        filters={filters} 
        formatTimeDisplay={() => formatTimeDisplay(filters, daypartOptions)}
        localSearchText={localSearchText}
        setLocalSearchText={setLocalSearchText}
        localSearchIn={localSearchIn}
        setLocalSearchIn={setLocalSearchIn}
        handleSearch={handleSearch}
        handleClearSearch={handleClearSearch}
      />
      
      <div className="flex pt-16">
        {/* Sidebar Toggle - Visible when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            aria-label="Open filters"
            title="Open filters"
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-2 top-[4.5rem] z-50 bg-white border border-gray-300 shadow-sm hover:shadow-md text-gray-700 rounded-full p-2 transition-all"
          >
            <FilterIcon className="w-4 h-4" />
          </button>
        )}

        {/* Amazon-style Left Sidebar Filters - Compact & Transparent */}
        <div className={`w-64 bg-transparent p-4 fixed left-0 top-16 bottom-0 overflow-y-auto no-scrollbar z-40 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Collapse Button */}
          <div className="flex justify-end mb-2">
            <button
              aria-label="Collapse filters"
              title="Close filters"
              onClick={() => setIsSidebarOpen(false)}
              className="bg-white border border-gray-300 shadow-sm hover:shadow-md text-gray-700 rounded-full p-2 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-6">
            {/* Status Filter - Amazon Style */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Status</h3>
              <div className="space-y-2">
                {[
                  { value: null, label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ].map((option) => {
                  return (
                    <label 
                      key={option.value || 'all'} 
                      className="flex items-center text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value || 'all'}
                        checked={filters.status === option.value}
                        onChange={(e) => {
                          const newStatus = e.target.value === 'all' ? null : e.target.value;
                          const newFilters = { ...filters, status: newStatus };
                          dispatch(setFilter({ status: newStatus }));
                          handleFilterChange(newFilters);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Recognition Filter - Amazon Style */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Recognition</h3>
              <div className="space-y-2">
                {[
                  { value: null, label: 'All Recognition' },
                  { value: 'recognized', label: 'Recognized' },
                  { value: 'unrecognized', label: 'Unrecognized' }
                ].map((option) => {
                  return (
                    <label 
                      key={option.value || 'all'} 
                      className="flex items-center text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="recognition"
                        value={option.value || 'all'}
                        checked={filters.recognition_status === option.value}
                        onChange={(e) => {
                          const newRecognitionStatus = e.target.value === 'all' ? null : e.target.value;
                          const newFilters = { ...filters, recognition_status: newRecognitionStatus };
                          dispatch(setFilter({ recognition_status: newRecognitionStatus }));
                          handleFilterChange(newFilters);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Content Filter - Amazon Style */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Content</h3>
              <div className="space-y-2">
                {[
                  { value: null, label: 'All Content' },
                  { value: true, label: 'With Content' },
                  { value: false, label: 'No Content' }
                ].map((option) => {
                  return (
                    <label 
                      key={option.value === null ? 'all' : option.value.toString()} 
                      className="flex items-center text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="content"
                        value={option.value === null ? 'all' : option.value.toString()}
                        checked={filters.has_content === option.value}
                        onChange={(e) => {
                          const newHasContent = e.target.value === 'all' ? null : e.target.value === 'true';
                          const newFilters = { ...filters, has_content: newHasContent };
                          dispatch(setFilter({ has_content: newHasContent }));
                          handleFilterChange(newFilters);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter Panel (Collapsible) - Compact */}
            <div className="border-b border-gray-200 pb-4">
              <FilterPanel
                filters={filters}
                dispatch={dispatch}
                segments={segments}
                channelId={channelId}
                fetchAudioSegments={fetchAudioSegments}
                handleDaypartChange={handleDaypartChange}
                handleSearchWithCustomTime={handleSearchWithCustomTime}
                localStartTime={localStartTime}
                localEndTime={localEndTime}
                setLocalStartTime={setLocalStartTime}
                setLocalEndTime={setLocalEndTime}
                handleResetFilters={handleResetFilters}
                isInHeader={false}
                compact={true}
                // Search props
                localSearchText={localSearchText}
                setLocalSearchText={setLocalSearchText}
                localSearchIn={localSearchIn}
                setLocalSearchIn={setLocalSearchIn}
                handleSearch={handleSearch}
                handleClearSearch={handleClearSearch}
                // Date handlers
                handleDateSelect={handleDateSelect}
                handleDateRangeSelect={handleDateRangeSelect}
              />
            </div>
          </div>
        </div>

        {/* Main Content - Takes remaining width */}
        <main className={`flex-1 p-6 min-w-0 z-30 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* Show pagination if we have pages with data in Redux */}
          {totalPages > 1 && (
            <div className="mb-6 flex justify-center">
              <TimePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                availablePages={pagination?.available_pages || []}
              />
            </div>
          )}

          {/* Show current page info */}
          {pagination && (
            <div className="mb-4 text-sm text-gray-600 bg-white rounded-lg p-3 shadow-sm">
              {(() => {
                const currentPageData = pagination.available_pages?.find(page => page.page === currentPage);
                const pagesWithData = pagination.available_pages?.filter(page => page.has_data) || [];
                const currentPageIndex = pagesWithData.findIndex(page => page.page === currentPage) + 1;
                const isShowFlaggedOnly = filters.showFlaggedOnly || false;
                
                return (
                  <div className="flex items-center space-x-4">
                    {!isShowFlaggedOnly && (
                      <>
                        <span className="font-medium">Time slot {currentPageIndex} of {pagesWithData.length}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>Showing {filteredSegments.length} segments</span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Segments Grid */}
          <div className={`space-y-4 ${currentPlayingId ? 'pb-56' : ''}`}>
            {loading ? (
              // Show shimmer loaders for all expected segments when loading
              Array.from({ length: 10 }).map((_, i) => (
                <SegmentShimmer key={`shimmer-${i}`} />
              ))
            ) : (
              filteredSegments.map((segment) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                currentPlayingId={currentPlayingId}
                isPlaying={isPlaying}
                handlePlayPauseAudio={handlePlayPauseAudio}
                handleSummaryClick={handleSummaryClick}
                handleTranscriptionClick={handleTranscriptionClick}
                handleTrimClick={handleTrimClick}
                handleCompactEditClick={handleCompactEditClick}
                isMergeMode={isMergeMode}
                isSelected={selectedSegmentIds.has(segment.id)}
                onSelect={() => handleSegmentSelect(segment.id)}
                isStatusToggleMode={isStatusToggleMode}
                isStatusSelected={statusSelectedSegmentIds.has(segment.id)}
                onStatusSelect={() => handleStatusSegmentSelect(segment.id)}
              />
            ))
            )}
          </div>

          {!loading && segments.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg font-medium mb-2">No audio segments found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or search criteria</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Keep all your existing modals and players */}
      <PieChartModal 
        isOpen={showPieChartModal}
        onClose={() => setShowPieChartModal(false)}
      />

      {currentPlayingId && (
        <div className={`fixed bottom-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50 transition-all duration-300 ${isSidebarOpen ? 'left-64 right-0' : 'left-0 right-0'}`}>
          {segments.find(s => s.id === currentPlayingId) ? (
            <AudioPlayer 
              segment={segments.find(s => s.id === currentPlayingId)} 
              onClose={() => dispatch(setCurrentPlaying(null))}
            />
          ) : (
            <div className="text-center py-2">
              <p className="text-gray-500">Audio segment no longer available</p>
              <button 
                onClick={() => dispatch(setCurrentPlaying(null))}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Close Player
              </button>
            </div>
          )}
        </div>
      )}

      {isTrimmerOpen && <AudioTrimmer />}

      {isCompactEditorOpen && (
        <CompactAudioEditor
          isOpen={isCompactEditorOpen}
          onClose={() => { setIsCompactEditorOpen(false); setCompactEditorSegment(null); }}
          segment={compactEditorSegment}
        />
      )}

      {showSummaryModal && selectedSegment && (
        <SummaryModal 
          summary={selectedSegment.analysis?.summary} 
          onClose={() => setShowSummaryModal(false)}
        />
      )}

      {showTranscriptionModal && selectedSegment && (
        <TranscriptionModal 
          transcription={selectedSegment.transcription?.transcript} 
          onClose={() => setShowTranscriptionModal(false)}
        />
      )}

      {/* Toggle All Segments Confirmation Modal */}
      {showToggleAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={handleCancelToggleAll}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-md relative z-[101] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const currentStatus = filters.status || 'all';
              const activeSegmentIds = filteredSegments
                .filter(segment => segment.is_active)
                .map(segment => segment.id);
              const inactiveSegmentIds = filteredSegments
                .filter(segment => !segment.is_active)
                .map(segment => segment.id);

              // Show two options when status filter is "all"
              if (currentStatus === 'all') {
                return (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Convert All Segments Status</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose an option to convert segments in the current view:
                      </p>
                    </div>
                    <div className="space-y-3 mb-4">
                      <button 
                        onClick={handleConvertActiveToInactive}
                        disabled={activeSegmentIds.length === 0 || isStatusUpdating}
                        className="w-full px-4 py-3 border-2 border-blue-500 rounded-md text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 text-left"
                      >
                        <div className="font-medium">Convert All Active to Inactive</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {activeSegmentIds.length} active segment{activeSegmentIds.length !== 1 ? 's' : ''} will become inactive
                        </div>
                      </button>
                      <button 
                        onClick={handleConvertInactiveToActive}
                        disabled={inactiveSegmentIds.length === 0 || isStatusUpdating}
                        className="w-full px-4 py-3 border-2 border-green-500 rounded-md text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 text-left"
                      >
                        <div className="font-medium">Convert All Inactive to Active</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {inactiveSegmentIds.length} inactive segment{inactiveSegmentIds.length !== 1 ? 's' : ''} will become active
                        </div>
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        onClick={handleCancelToggleAll}
                        disabled={isStatusUpdating}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                );
              } else if (currentStatus === 'active') {
                // Show confirmation for converting active to inactive
                return (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Convert Active Segments to Inactive</h3>
                      <p className="text-sm text-gray-600">
                        Are you sure you want to convert <strong>{activeSegmentIds.length}</strong> active segment{activeSegmentIds.length !== 1 ? 's' : ''} to inactive?
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        This action will change the status of all active segments in the current view to inactive.
                      </p>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={handleCancelToggleAll}
                        disabled={isStatusUpdating}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={async () => {
                          setShowToggleAllConfirm(false);
                          if (activeSegmentIds.length > 0) {
                            await updateSegmentStatuses(activeSegmentIds, []);
                          }
                        }}
                        disabled={isStatusUpdating}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isStatusUpdating ? 'Converting...' : 'Yes, Convert'}
                      </button>
                    </div>
                  </>
                );
              } else if (currentStatus === 'inactive') {
                // Show confirmation for converting inactive to active
                return (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Convert Inactive Segments to Active</h3>
                      <p className="text-sm text-gray-600">
                        Are you sure you want to convert <strong>{inactiveSegmentIds.length}</strong> inactive segment{inactiveSegmentIds.length !== 1 ? 's' : ''} to active?
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        This action will change the status of all inactive segments in the current view to active.
                      </p>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={handleCancelToggleAll}
                        disabled={isStatusUpdating}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={async () => {
                          setShowToggleAllConfirm(false);
                          if (inactiveSegmentIds.length > 0) {
                            await updateSegmentStatuses([], inactiveSegmentIds);
                          }
                        }}
                        disabled={isStatusUpdating}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isStatusUpdating ? 'Converting...' : 'Yes, Convert'}
                      </button>
                    </div>
                  </>
                );
              }
            })()}
          </div>
        </div>
      )}

      {/* Conversion Confirmation Modal */}
      {showConversionConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={handleCancelConversion}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-md relative z-[101] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const activeSegmentIds = filteredSegments
                .filter(segment => segment.is_active)
                .map(segment => segment.id);
              const inactiveSegmentIds = filteredSegments
                .filter(segment => !segment.is_active)
                .map(segment => segment.id);

              if (pendingConversion === 'activeToInactive') {
                return (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Conversion</h3>
                      <p className="text-sm text-gray-600">
                        Are you sure you want to convert <strong>{activeSegmentIds.length}</strong> active segment{activeSegmentIds.length !== 1 ? 's' : ''} to inactive?
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        This action will change the status of all active segments in the current view to inactive.
                      </p>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={handleCancelConversion}
                        disabled={isStatusUpdating}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleConfirmConversion}
                        disabled={isStatusUpdating}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isStatusUpdating ? 'Converting...' : 'Yes, Convert'}
                      </button>
                    </div>
                  </>
                );
              } else if (pendingConversion === 'inactiveToActive') {
                return (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Conversion</h3>
                      <p className="text-sm text-gray-600">
                        Are you sure you want to convert <strong>{inactiveSegmentIds.length}</strong> inactive segment{inactiveSegmentIds.length !== 1 ? 's' : ''} to active?
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        This action will change the status of all inactive segments in the current view to active.
                      </p>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={handleCancelConversion}
                        disabled={isStatusUpdating}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleConfirmConversion}
                        disabled={isStatusUpdating}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isStatusUpdating ? 'Converting...' : 'Yes, Convert'}
                      </button>
                    </div>
                  </>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioSegmentsPage;