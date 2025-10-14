// pages/user/AudioSegmentsPage.jsx
import React, { useEffect, useState } from 'react';
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

  // const [currentPage, setCurrentPage] = useState(0);
  
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

  const formatShortDate = (date) => {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

// Simplified useEffect for initial load
useEffect(() => {
  const today = new Date().toLocaleDateString('en-CA'); 
  
  setSearchParams({
    date: today,
    searchIn: 'transcription'
  });

  dispatch(setFilter({ 
    date: today,
    startDate: today,
    endDate: today,
    startTime: '00:00',
    endTime: '23:59',
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
  
  // Initial fetch without page parameter (defaults to page 1)
  dispatch(fetchAudioSegments({ 
    channelId, 
    date: today,
    startTime: '',
    endTime: '',
    daypart: 'none'
  }));
}, [channelId]);



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
    page: pageNumber  // Pass the page number directly
  }));
};

  
// Simplified filter change handler
useEffect(() => {
  if ((filters.startDate && filters.endDate) || filters.date) {
    console.log('Fetching with filters:', filters);
    
    // COMMENT OUT or REMOVE this automatic API call
    // dispatch(fetchAudioSegments({ 
    //   channelId, 
    //   date: filters.date,
    //   startDate: filters.startDate,
    //   endDate: filters.endDate,
    //   startTime: filters.startTime,
    //   endTime: filters.endTime,
    //   daypart: filters.daypart,
    //   searchText: filters.searchText,
    //   searchIn: filters.searchIn,
    //   page: 1
    // }));
    
    // Keep only the URL param updates if needed
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
}, [filters.date, filters.startDate, filters.endDate, filters.startTime, filters.endTime, filters.daypart, channelId]);

useEffect(() => {
  // Sync local time state with Redux filters
  setLocalStartTime(filters.startTime?.substring(0, 5) || '');
  setLocalEndTime(filters.endTime?.substring(0, 5) || '');
  setLocalSearchText(filters.searchText || '');
  setLocalSearchIn(filters.searchIn || 'transcription');
}, [filters]); 

// Add this useEffect for search-specific changes
useEffect(() => {
  // Only trigger when search text or search category changes
  if (filters.searchText || (filters.searchIn && filters.searchIn !== 'transcription')) {
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
      page: 1  // Always reset to page 1 when searching
    }));
  }
}, [filters.searchText, filters.searchIn, channelId]);


  useEffect(() => {
    setLocalStartTime(filters.startTime?.substring(0, 5) || '');
    setLocalEndTime(filters.endTime?.substring(0, 5) || '');
    setLocalSearchText(filters.searchText || '');
    setLocalSearchIn(filters.searchIn || 'transcription');
  }, [filters]);

  // const handleSearch = () => {
  //   dispatch(setFilter({ 
  //     searchText: localSearchText,
  //     searchIn: localSearchIn
  //   }));
  // };

const handleSearch = () => {
  dispatch(setFilter({ 
    searchText: localSearchText,
    searchIn: localSearchIn
  }));
  
  // First, fetch page 1 to get the pagination data
  dispatch(fetchAudioSegments({ 
    channelId, 
    date: filters.date,
    startDate: filters.startDate,
    endDate: filters.endDate,
    startTime: filters.startTime,
    endTime: filters.endTime,
    daypart: filters.daypart,
    searchText: localSearchText,
    searchIn: localSearchIn,
    page: 1
  })).then((action) => {
    if (action.payload && action.payload.pagination) {
      const availablePages = action.payload.pagination.available_pages || [];
      
      // Find the first page that has segments in the current search
      // We need to check each page to see which one has the actual search results
      const findFirstPageWithSearchResults = async () => {
        for (const page of availablePages) {
          if (page.has_data) {
            try {
              // Fetch this specific page to check if it has segments
              const pageResult = await dispatch(fetchAudioSegments({
                channelId,
                date: filters.date,
                startDate: filters.startDate,
                endDate: filters.endDate,
                startTime: filters.startTime,
                endTime: filters.endTime,
                daypart: filters.daypart,
                searchText: localSearchText,
                searchIn: localSearchIn,
                page: page.page
              })).unwrap();
              
              // If this page has segments with the search results, use it
              if (pageResult.data.segments && pageResult.data.segments.length > 0) {
                console.log('Found search results on page:', page.page);
                return page.page;
              }
            } catch (error) {
              console.error('Error checking page:', page.page, error);
            }
          }
        }
        return 1; // Fallback to page 1
      };
      
      findFirstPageWithSearchResults().then(firstPageWithResults => {
        console.log('First page with search results:', firstPageWithResults);
        // The segments from the first page are already loaded, no need to fetch again
      });
    }
  });
};


const handleClearSearch = () => {
  setLocalSearchText('');
  setLocalSearchIn('transcription');
  
  // First update the filter to clear search
  dispatch(setFilter({ 
    searchText: '',
    searchIn: 'transcription'
  }));
  
  // Then fetch all segments without search filters
  dispatch(fetchAudioSegments({ 
    channelId, 
    date: filters.date,
    startDate: filters.startDate,
    endDate: filters.endDate,
    startTime: filters.startTime,
    endTime: filters.endTime,
    daypart: filters.daypart,
    searchText: '', // Clear search text
    searchIn: 'transcription', // Reset to default
    page: 1  // Reset to page 1 when clearing search
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
  // Use local date instead of UTC
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
  
  const defaultStartTime = '00:00:00';
  const defaultEndTime = '23:59:59';
  
  dispatch(setFilter({ 
    date: today, 
    startDate: today, 
    endDate: today,
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
  
  // Use the unified fetchAudioSegments
  dispatch(fetchAudioSegments({ 
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
          fetchAudioSegments={fetchAudioSegments}
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
        fetchAudioSegments={fetchAudioSegments}
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
{totalPages > 1 && (
  <div className="mb-6">
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
          <div className="mb-4 text-sm text-gray-600">
            {(() => {
              const currentPageData = pagination.available_pages?.find(page => page.page === currentPage);
              const pagesWithData = pagination.available_pages?.filter(page => page.has_data) || [];
              const currentPageIndex = pagesWithData.findIndex(page => page.page === currentPage) + 1;
              
              return (
                <>
                  Time slot {currentPageIndex} of {pagesWithData.length} • 
                  Showing {segments.length} segments • 
                  {currentPageData?.segment_count || 0} segments in this time slot
                </>
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