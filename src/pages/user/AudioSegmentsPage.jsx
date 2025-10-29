import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Filter as FilterIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchAudioSegments, setCurrentPlaying, setIsPlaying, setFilter } from '../../store/slices/audioSegmentsSlice';
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

const AudioSegmentsPage = () => {
  const { channelId: channelIdFromParams } = useParams();
  const channelId = channelIdFromParams || localStorage.getItem("channelId");
  
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

  const currentPage = pagination?.current_page || 1;
  const totalPages = pagination?.total_pages || 0;  
  
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

  // Calculate counts for recognition filters
  const recognizedCount = segments.filter(s => s.is_recognized).length;
  const unrecognizedCount = segments.filter(s => !s.is_recognized).length;
  const unrecognizedWithContentCount = segments.filter(s => !s.is_recognized && (s.analysis?.summary || s.transcription?.transcript)).length;
  const unrecognizedWithoutContentCount = segments.filter(s => !s.is_recognized && !s.analysis?.summary && !s.transcription?.transcript).length;

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
      shiftId: null 
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
        page: 1
      }));
    }
  }, [filters.searchText, filters.searchIn, channelId]);

  const handlePageChange = (pageNumber) => {
  console.log('Page change requested to:', pageNumber);
  
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
        page: 1
      }));
      
      // Update last filters
      lastFilters.current = { ...filters };
    }
  }
}, [filters.startTime, filters.endTime, channelId]);



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

  // Filter segments (client-side filtering for status and recognition)
  const filteredSegments = segments.filter(segment => {
    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active' && !segment.is_active) return false;
      if (filters.status === 'inactive' && segment.is_active) return false;
    }
    
    // Recognition filter
    if (filters.recognition !== 'all') {
      const hasContent = segment.analysis?.summary || segment.transcription?.transcript;
      
      switch (filters.recognition) {
        case 'recognized':
          if (!segment.is_recognized) return false;
          break;
        case 'unrecognized':
          if (segment.is_recognized) return false;
          break;
        case 'unrecognized_with_content':
          if (segment.is_recognized || !hasContent) return false;
          break;
        case 'unrecognized_without_content':
          if (segment.is_recognized || hasContent) return false;
          break;
        default:
          break;
      }
    }
    
    return true;
  });

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
      status: 'active', 
      recognition: 'unrecognized',
      searchText: '',
      searchIn: 'transcription',
      shiftId: null
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PieChartTrigger onClick={() => setShowPieChartModal(true)} />
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
            className="fixed left-2 top-[4.5rem] z-40 bg-white border border-gray-300 shadow-sm hover:shadow-md text-gray-700 rounded-full p-2 transition-all"
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
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center text-sm text-gray-700 hover:text-gray-900 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={(filters.status || 'all') === option.value}
                      onChange={(e) => dispatch(setFilter({ status: e.target.value }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Recognition Filter - Amazon Style */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Recognition</h3>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Recognition' },
                  { value: 'recognized', label: `Recognized (${recognizedCount})` },
                  { value: 'unrecognized', label: `Unrecognized (${unrecognizedCount})` },
                  { value: 'unrecognized_with_content', label: `With Content (${unrecognizedWithContentCount})` },
                  { value: 'unrecognized_without_content', label: `No Content (${unrecognizedWithoutContentCount})` }
                ].map((option) => (
                  <label key={option.value} className="flex items-center text-sm text-gray-700 hover:text-gray-900 cursor-pointer">
                    <input
                      type="radio"
                      name="recognition"
                      value={option.value}
                      checked={(filters.recognition || 'all') === option.value}
                      onChange={(e) => dispatch(setFilter({ recognition: e.target.value }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2">{option.label}</span>
                  </label>
                ))}
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
                
                return (
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">Time slot {currentPageIndex} of {pagesWithData.length}</span>
                    <span>•</span>
                    <span>Showing {filteredSegments.length} segments</span>
                    <span>•</span>
                    <span>{currentPageData?.segment_count || 0} segments in this time slot</span>
                  </div>
                );
              })()}
            </div>
          )}

          {loading && segments.length > 0 && (
            <div className="mb-6">
              <SegmentShimmer />
              <SegmentShimmer />
            </div>
          )}

          {/* Segments Grid */}
          <div className="space-y-4">
            {filteredSegments.map((segment) => (
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
              />
            ))}
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
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50">
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
    </div>
  );
};

export default AudioSegmentsPage;