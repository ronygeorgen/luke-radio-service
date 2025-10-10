// pages/user/AudioSegmentsPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchAudioSegmentsWithFilter, fetchAudioSegmentsForPage,  setCurrentPlaying, setIsPlaying, setFilter } from '../../store/slices/audioSegmentsSlice';
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

  const [currentPage, setCurrentPage] = useState(0);
  const [pageLabels, setPageLabels] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  // const [localAvailablePages, setLocalAvailablePages] = useState([]);

  const [localSearchText, setLocalSearchText] = useState('');
  const [localSearchIn, setLocalSearchIn] = useState('transcription');

  const { isOpen: isTrimmerOpen } = useSelector((state) => state.audioTrimmer);

  const [showPieChartModal, setShowPieChartModal] = useState(false);
  
  const handleTrimClick = (segment) => {
    dispatch(openTrimmer(segment));
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
  pagination,        // Current page data
  availablePages     // Original pagination from filter
} = useSelector((state) => state.audioSegments);
  
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

  const formatShortDate = (date) => {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

useEffect(() => {
  const today = new Date().toISOString().split('T')[0];
  
  // Set URL parameters for the entire day
  setSearchParams({
    date: today,
    searchIn: 'transcription'
  });

  dispatch(setFilter({ 
    date: today,
    startDate: null, // Clear date range initially
    endDate: null,   // Clear date range initially
    startTime: '', // Empty for entire day
    endTime: '',   // Empty for entire day
    daypart: 'none',
    status: 'all',
    recognition: 'all',
    searchText: '',
    searchIn: 'transcription'
  }));

  
  setLocalStartTime('');
  setLocalEndTime('');
  setLocalSearchText('');
  setLocalSearchIn('transcription');
  
  // Initial fetch for the entire day (single date)
  dispatch(fetchAudioSegmentsWithFilter({ 
    channelId, 
    date: today,
    startTime: '', // Empty for entire day
    endTime: '',   // Empty for entire day
    daypart: 'none'
  }));

  setCurrentPage(0);
}, [channelId]);



// Update the useEffect to use availablePages instead of pagination
useEffect(() => {
  console.log('🔄 Processing pagination data...');
  console.log('🔍 Available pages from Redux:', availablePages);
  console.log('🔍 Current page state:', currentPage);
  console.log('🔍 Pagination from API:', pagination);
  
  if (!availablePages || !availablePages.available_pages) {
    console.log('❌ No pagination data available');
    setTotalPages(0);
    setPageLabels([]);
    return;
  }

  // Filter pages that have data and create labels - use availablePages from Redux
  const pagesWithData = availablePages.available_pages.filter(page => page.has_data);
  console.log('📄 Pages with data:', pagesWithData);
  
  if (pagesWithData.length === 0) {
    console.log('❌ No pages with data found');
    setTotalPages(0);
    setPageLabels([]);
    return;
  }
  
  const labels = [];
  
  pagesWithData.forEach((page, index) => {
    const startTime = new Date(page.start_time);
    const endTime = new Date(page.end_time);
    
    // Format: "Oct 7, 18:30-19:30" in local time
    const startDateStr = startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDateStr = endTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const startTimeStr = startTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    const endTimeStr = endTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    let label;
    if (startDateStr === endDateStr) {
      label = `${startDateStr}, ${startTimeStr}-${endTimeStr}`;
    } else {
      label = `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
    }
    
    labels.push(label);
  });

  console.log('✅ Generated labels:', labels);

  setTotalPages(pagesWithData.length);
  setPageLabels(labels);
  
  // ONLY update current page if this is a filter change, not page navigation
  // Check if the pagination response has the same structure as our availablePages
  const isPageNavigationResponse = pagination?.available_pages?.length === 1;
  
  if (!isPageNavigationResponse) {
    // This is a filter change - update current page based on API response
    const currentPageFromAPI = pagination?.current_page || 1;
    console.log('🔍 Current page from API:', currentPageFromAPI);
    
    const currentPageData = pagesWithData.find(page => page.page === currentPageFromAPI);
    if (currentPageData) {
      const pageIndex = pagesWithData.indexOf(currentPageData);
      console.log('✅ Setting current page to:', pageIndex);
      setCurrentPage(pageIndex);
    } else {
      console.log('⚠️ Current page not found, defaulting to 0');
      setCurrentPage(0);
    }
  } else {
    console.log('🔄 Page navigation response - keeping current page:', currentPage);
    // Don't update current page for page navigation responses
  }
}, [availablePages, pagination]); // Only depend on Redux state

const handlePageChange = (pageIndex) => {
  console.log('Page change requested:', pageIndex);
  
  if (!availablePages || !availablePages.available_pages) {
    console.log('No available pages in Redux');
    return;
  }
  
  // Get pages with data from Redux availablePages
  const pagesWithData = availablePages.available_pages.filter(page => page.has_data);
  
  if (!pagesWithData[pageIndex]) {
    console.log('Page index not available:', pageIndex);
    return;
  }
  
  const pageData = pagesWithData[pageIndex];
  console.log('Page data for navigation:', pageData);
  
  setCurrentPage(pageIndex);
  
  // Use the exact UTC timestamps from the Redux availablePages
  const startDateTime = pageData.start_time; // "2025-10-07T01:00:00+00:00"
  const endDateTime = pageData.end_time;     // "2025-10-07T02:00:00+00:00"
  
  // Parse the UTC timestamps
  const startDateObj = new Date(startDateTime);
  const endDateObj = new Date(endDateTime);
  
  // Convert to local date string (YYYY-MM-DD)
  const localDateStr = startDateObj.toLocaleDateString('en-CA'); // "2025-10-07"
  
  // Convert to local time strings (HH:MM:SS)
  const startTimeStr = `${startDateObj.getHours().toString().padStart(2, '0')}:${startDateObj.getMinutes().toString().padStart(2, '0')}:${startDateObj.getSeconds().toString().padStart(2, '0')}`;
  const endTimeStr = `${endDateObj.getHours().toString().padStart(2, '0')}:${endDateObj.getMinutes().toString().padStart(2, '0')}:${endDateObj.getSeconds().toString().padStart(2, '0')}`;
  
  console.log('Making Page Navigation API call with:', {
    date: localDateStr,
    startTime: startTimeStr,
    endTime: endTimeStr,
    originalUTC: {
      start: startDateTime,
      end: endDateTime
    }
  });
  
  // Use page navigation API
  dispatch(fetchAudioSegmentsForPage({ 
    channelId, 
    date: localDateStr,
    startTime: startTimeStr,
    endTime: endTimeStr,
    searchText: filters.searchText,
    searchIn: filters.searchIn,
    startDate: filters.startDate,
    endDate: filters.endDate
  }));
};

  
useEffect(() => {
  // Only fetch if we have a date range OR a single date
  if ((filters.startDate && filters.endDate) || filters.date) {
    console.log('Fetching with filters:', {
      date: filters.date,
      startDate: filters.startDate,
      endDate: filters.endDate,
      startTime: filters.startTime,
      endTime: filters.endTime,
      daypart: filters.daypart
    });
    
    // Use filter API for filter changes
    dispatch(fetchAudioSegmentsWithFilter({ 
      channelId, 
      date: filters.date,
      startDate: filters.startDate,
      endDate: filters.endDate,
      startTime: filters.startTime,
      endTime: filters.endTime,
      daypart: filters.daypart,
      searchText: filters.searchText,
      searchIn: filters.searchIn
    }));
    
    // Update URL params
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
}, [filters.date, filters.startDate, filters.endDate, filters.startTime, filters.endTime, filters.daypart, filters.searchText, filters.searchIn, channelId]);


  useEffect(() => {
    setLocalStartTime(filters.startTime?.substring(0, 5) || '');
    setLocalEndTime(filters.endTime?.substring(0, 5) || '');
    setLocalSearchText(filters.searchText || '');
    setLocalSearchIn(filters.searchIn || 'transcription');
  }, [filters]);

  const handleSearch = () => {
    dispatch(setFilter({ 
      searchText: localSearchText,
      searchIn: localSearchIn
    }));
  };

  const handleClearSearch = () => {
    setLocalSearchText('');
    setLocalSearchIn('transcription');
    dispatch(setFilter({ 
      searchText: '',
      searchIn: 'transcription'
    }));
  };

  // Filter segments (client-side filtering for status and recognition)
const filteredSegments = segments.filter(segment => {
  console.log('Filtering segment:', {
    id: segment.id,
    is_active: segment.is_active,
    is_recognized: segment.is_recognized,
    hasContent: segment.analysis?.summary || segment.transcription?.transcript,
    statusFilter: filters.status,
    recognitionFilter: filters.recognition
  });

  // Status filter
  if (filters.status !== 'all') {
    if (filters.status === 'active' && !segment.is_active) {
      console.log('❌ Filtered out - status not active');
      return false;
    }
    if (filters.status === 'inactive' && segment.is_active) {
      console.log('❌ Filtered out - status not inactive');
      return false;
    }
  }
  
  // Recognition filter
  if (filters.recognition !== 'all') {
    const hasContent = segment.analysis?.summary || segment.transcription?.transcript;
    
    switch (filters.recognition) {
      case 'recognized':
        if (!segment.is_recognized) {
          console.log('❌ Filtered out - not recognized');
          return false;
        }
        break;
      case 'unrecognized':
        if (segment.is_recognized) {
          console.log('❌ Filtered out - not unrecognized');
          return false;
        }
        break;
      case 'unrecognized_with_content':
        if (segment.is_recognized || !hasContent) {
          console.log('❌ Filtered out - not unrecognized with content');
          return false;
        }
        break;
      case 'unrecognized_without_content':
        if (segment.is_recognized || hasContent) {
          console.log('❌ Filtered out - not unrecognized without content');
          return false;
        }
        break;
      default:
        break;
    }
  }
  
  console.log('✅ Segment passed filters');
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
      dispatch(setFilter({ 
        daypart: 'none', 
        startTime: '', 
        endTime: '',
      }));
    } else {
      const daypart = daypartOptions.find(opt => opt.value === selectedDaypart);
      dispatch(setFilter({ 
        daypart: selectedDaypart, 
        startTime: daypart.startTime, 
        endTime: daypart.endTime,
        date: today,
        startDate: null,
        endDate: null
      }));
    }
  };

  const handleSearchWithCustomTime = () => {
    dispatch(setFilter({ 
      startTime: localStartTime ? localStartTime + ':00' : '',
      endTime: localEndTime ? localEndTime + ':00' : '',
      daypart: 'none',
    }));
  };

  const handleDateSelect = (selectedDate) => {
    dispatch(setFilter({ 
      date: selectedDate,
      startDate: null,
      endDate: null,
      startTime: '',
      endTime: '',
      daypart: 'none'
    }));
  };

const handleDateRangeSelect = (start, end) => {
  console.log('Date range selected:', start, 'to', end);
  
  // For date range, fetch the entire range from start 00:00 to end 23:59
  dispatch(setFilter({ 
    startDate: start,
    endDate: end,
    date: null, // Clear single date when using range
    startTime: '', // Empty for entire day range
    endTime: '',   // Empty for entire day range
    daypart: 'none'
  }));

  const params = {
    startDate: start,
    endDate: end
  };
  setSearchParams(params);

  setCurrentPage(0);
};

 const handleResetFilters = () => {
  const today = new Date().toISOString().split('T')[0];
  const defaultStartTime = '00:00:00';
  const defaultEndTime = '01:00:00';
  
  dispatch(setFilter({ 
    date: today, 
    startDate: null, 
    endDate: null,
    startTime: defaultStartTime, 
    endTime: defaultEndTime, 
    daypart: 'none', 
    status: 'all', 
    recognition: 'all',
    searchText: '',
    searchIn: 'transcription'
  }));
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
  setCurrentPage(0);
  
  // Use filter API for reset
  dispatch(fetchAudioSegmentsWithFilter({ 
    channelId, 
    date: today, 
    startTime: defaultStartTime, 
    endTime: defaultEndTime, 
    daypart: 'none' 
  }));
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
          dispatch={dispatch}
          segments={segments}
          channelId={channelId}
          fetchAudioSegments={fetchAudioSegmentsWithFilter}
          handleDaypartChange={handleDaypartChange}
          handleSearchWithCustomTime={handleSearchWithCustomTime}
          localStartTime={localStartTime}
          localEndTime={localEndTime}
          setLocalStartTime={setLocalStartTime}
          setLocalEndTime={setLocalEndTime}
          handleResetFilters={handleResetFilters}
          localSearchText={localSearchText}
          setLocalSearchText={setLocalSearchText}
          localSearchIn={localSearchIn}
          setLocalSearchIn={setLocalSearchIn}
          handleSearch={handleSearch}
          handleClearSearch={handleClearSearch}
          handleDateSelect={handleDateSelect}
          handleDateRangeSelect={handleDateRangeSelect}
          setFilter={setFilter} 
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-32 mt-28">
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
        dispatch={dispatch}
        segments={filteredSegments} 
        // segments={segments}
        channelId={channelId}
        fetchAudioSegments={fetchAudioSegmentsWithFilter}
        handleDaypartChange={handleDaypartChange}
        handleSearchWithCustomTime={handleSearchWithCustomTime}
        localStartTime={localStartTime}
        localEndTime={localEndTime}
        setLocalStartTime={setLocalStartTime}
        setLocalEndTime={setLocalEndTime}
        handleResetFilters={handleResetFilters}
        localSearchText={localSearchText}
        setLocalSearchText={setLocalSearchText}
        localSearchIn={localSearchIn}
        setLocalSearchIn={setLocalSearchIn}
        handleSearch={handleSearch}
        handleClearSearch={handleClearSearch}
        handleDateSelect={handleDateSelect}
        handleDateRangeSelect={handleDateRangeSelect}
        setFilter={setFilter} 
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-32 mt-28">

{/* Show pagination if we have pages with data in Redux */}
  {totalPages > 1 && availablePages && availablePages.available_pages && (
    <div className="mb-6">
      <TimePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        pageLabels={pageLabels}
        availablePages={availablePages.available_pages.filter(page => page.has_data)}
      />
    </div>
  )}

        {/* Show current page info */}
  {availablePages && availablePages.available_pages && (
    <div className="mb-4 text-sm text-gray-600">
      Showing {availablePages.available_pages.filter(page => page.has_data)[currentPage]?.segment_count || 0} segments for {pageLabels[currentPage]}
    </div>
  )}

        {loading && segments.length > 0 && (
          <div className="mb-6">
            <SegmentShimmer />
            <SegmentShimmer />
          </div>
        )}

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
          />
        ))}

        {!loading && segments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No audio segments found for the selected time period.</p>
          </div>
        )}
      </main>

      <PieChartModal 
        isOpen={showPieChartModal}
        onClose={() => setShowPieChartModal(false)}
      />

      {currentPlayingId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-30">
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