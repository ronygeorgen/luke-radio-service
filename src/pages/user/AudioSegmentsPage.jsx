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

  const [localSearchText, setLocalSearchText] = useState('');
  const [localSearchIn, setLocalSearchIn] = useState('transcription');

  const { isOpen: isTrimmerOpen } = useSelector((state) => state.audioTrimmer);
  
  const handleTrimClick = (segment) => {
    dispatch(openTrimmer(segment));
  };
  
  const channelName = searchParams.get("name"); 
  useEffect(() => {
    if (channelName) {
      localStorage.setItem("channelName", channelName);
      console.log("Channel name saved:", channelName);
    }

    if (channelId) {
    localStorage.setItem("channelId", channelId);
    console.log("Channel ID saved:", channelId);
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
    filters  
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

  const generatePaginationData = () => {
    console.log('Generating pagination data with filters:', filters);
    
    // Reset if no date filters
    if (!filters.date && !filters.startDate && !filters.endDate) {
      setTotalPages(0);
      setPageLabels([]);
      setCurrentPage(0);
      return;
    }

    // Date range pagination takes priority (daily with hours)
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      
      // Handle invalid dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid date range');
        setTotalPages(0);
        setPageLabels([]);
        setCurrentPage(0);
        return;
      }
      
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      const pages = [];
      const labels = [];
      let pageIndex = 0;

      for (let day = 0; day < days; day++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + day);
        const dateStr = currentDate.toISOString().split('T')[0];
        const formattedDate = formatDateForDisplay(dateStr);
        
        for (let hour = 0; hour < 24; hour++) {
          pages.push(pageIndex);
          labels.push(`${formattedDate} ${hour}-${hour + 1}`);
          pageIndex++;
        }
      }
      
      setTotalPages(pages.length);
      setPageLabels(labels);
      
      // Calculate current page based on current filters
      if (filters.date && filters.startTime) {
        const currentDate = new Date(filters.date);
        const rangeStart = new Date(filters.startDate);
        const dayDiff = Math.floor((currentDate - rangeStart) / (1000 * 60 * 60 * 24));
        const hour = parseInt(filters.startTime.split(':')[0]);
        const calculatedPage = (dayDiff * 24) + hour;
        setCurrentPage(calculatedPage);
      } else {
        setCurrentPage(0);
      }
      
      console.log('Date range pagination generated:', pages.length, 'pages');
    }
    // Single day pagination (hourly)
    else if (filters.date && !filters.startDate && !filters.endDate) {
      const pages = [];
      const labels = [];
      
      for (let i = 0; i < 24; i++) {
        pages.push(i);
        labels.push(`${i}-${i + 1}`);
      }
      
      setTotalPages(pages.length);
      setPageLabels(labels);
      
      // Set current page based on startTime
      if (filters.startTime) {
        const hour = parseInt(filters.startTime.split(':')[0]);
        setCurrentPage(hour);
      } else {
        setCurrentPage(0);
      }
      
      console.log('Single day pagination generated:', pages.length, 'pages');
    } else {
      // Reset if we have partial date range
      setTotalPages(0);
      setPageLabels([]);
      setCurrentPage(0);
    }
  };

  useEffect(() => {
    generatePaginationData();
  }, [filters.date, filters.startDate, filters.endDate, filters.startTime, filters.endTime]);



const handlePageChange = (pageIndex) => {
  setCurrentPage(pageIndex);
  
  if (filters.date && !filters.startDate && !filters.endDate) {
    // Single day - update time filters
    const startTime = `${pageIndex.toString().padStart(2, '0')}:00:00`;
    const endTime = `${(pageIndex + 1).toString().padStart(2, '0')}:00:00`;
    
    dispatch(setFilter({ 
      startTime,
      endTime,
      daypart: 'none'
    }));
  } else if (filters.startDate && filters.endDate) {
    // Date range - calculate which date and hour this page represents
    const start = new Date(filters.startDate);
    const totalHoursPerDay = 24;
    const dayIndex = Math.floor(pageIndex / totalHoursPerDay);
    const hourIndex = pageIndex % totalHoursPerDay;
    
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + dayIndex);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    const startTime = `${hourIndex.toString().padStart(2, '0')}:00:00`;
    const endTime = `${(hourIndex + 1).toString().padStart(2, '0')}:00:00`;
    
    // IMPORTANT: Keep the original date range in filters for pagination context
    // but use the specific date and time for the API call
    dispatch(setFilter({ 
      date: dateStr,           // Specific date for this page
      startDate: filters.startDate, // Keep original start date range
      endDate: filters.endDate,     // Keep original end date range  
      startTime,
      endTime,
      daypart: 'none'
    }));
  }
};

  // Initialize with URL params or defaults
  useEffect(() => {
    let initialDate = searchParams.get('date');
    
    // If date is in YYYYMMDD format, convert to YYYY-MM-DD
    if (initialDate && /^\d{8}$/.test(initialDate)) {
      const year = initialDate.substring(0, 4);
      const month = initialDate.substring(4, 6);
      const day = initialDate.substring(6, 8);
      initialDate = `${year}-${month}-${day}`;
    } else if (!initialDate) {
      initialDate = new Date().toISOString().split('T')[0];
    }

    const initialStartTime = startTime || '';
    const initialEndTime = endTime || '';
    const initialDaypart = daypart || 'none';

    dispatch(setFilter({ 
      date: initialDate,
      startTime: initialStartTime,
      endTime: initialEndTime,
      daypart: initialDaypart,
      status: 'all',
      recognition: 'all'
    }));
    
    setLocalStartTime(initialStartTime.substring(0, 5));
    setLocalEndTime(initialEndTime.substring(0, 5));
    
    // Initial fetch
    dispatch(fetchAudioSegments({ 
      channelId, 
      date: initialDate,
      startTime: initialStartTime,
      endTime: initialEndTime,
      daypart: initialDaypart
    }));
  }, [channelId]);

  // Fetch data when filters change (only for date and daypart)
useEffect(() => {
  // Only fetch if we have a date or date range
  if (filters.date || (filters.startDate && filters.endDate)) {
    dispatch(fetchAudioSegments({ 
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
  // Update local time inputs when filter changes
  setLocalStartTime(filters.startTime?.substring(0, 5) || '');
  setLocalEndTime(filters.endTime?.substring(0, 5) || '');
  
  // Update local search state when filter changes
  setLocalSearchText(filters.searchText || '');
  setLocalSearchIn(filters.searchIn || 'transcription');
}, [filters]);

  const handleSearch = () => {
    dispatch(setFilter({ 
      searchText: localSearchText,
      searchIn: localSearchIn
    }));
  };

  // Add clear search handler
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

  // Handler functions
  const handlePlayPauseAudio = (segmentId) => {
    if (currentPlayingId === segmentId) {
      dispatch(setIsPlaying(!isPlaying));
    } else {
      dispatch(setCurrentPlaying(segmentId));
      dispatch(setIsPlaying(true));
    }
  };

  // Update handleDaypartChange to properly update the date
  const handleDaypartChange = (selectedDaypart) => {
  const currentDate = new Date().toISOString().split('T')[0];
  
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
      date: currentDate, // Force current date
      startDate: null,   // Clear date range
      endDate: null      // Clear date range
    }));
  }
};

// Update handleSearchWithCustomTime
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
    startDate: null,     // Clear date range
    endDate: null,       // Clear date range
    startTime: '',       // Clear time filters
    endTime: '',         // Clear time filters
    daypart: 'none'      // Clear daypart filter
  }));
};

// Add handler for date range selection
const handleDateRangeSelect = (start, end) => {
  dispatch(setFilter({ 
    startDate: start,
    endDate: end,
    date: null,          // Clear single date
    startTime: '',       // Clear time filters
    endTime: '',         // Clear time filters
    daypart: 'none'      // Clear daypart filter
  }));
};
  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    dispatch(setFilter({ 
      date: today, 
      startDate: null, 
      endDate: null,
      startTime: '', 
      endTime: '', 
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
    setSearchParams({ date: today });
    dispatch(fetchAudioSegments({ 
      channelId, 
      date: today, 
      startTime: '', 
      endTime: '', 
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
          formatTimeDisplay={() => formatTimeDisplay(filters, daypartOptions)} // UPDATED
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
          // ADD THESE TO BOTH HEADER CALLS:
          localSearchText={localSearchText}
          setLocalSearchText={setLocalSearchText}
          localSearchIn={localSearchIn}
          setLocalSearchIn={setLocalSearchIn}
          handleSearch={handleSearch}
          handleClearSearch={handleClearSearch}
          handleDateSelect={handleDateSelect}
          handleDateRangeSelect={handleDateRangeSelect}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-32 mt-28"> {/* Added pt-32 to account for fixed header height */}
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
      <Header 
        channelInfo={channelInfo} 
        channelName={channelName}
        filters={filters} 
        formatTimeDisplay={() => formatTimeDisplay(filters, daypartOptions)} // UPDATED
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
        // ADD THESE TO BOTH HEADER CALLS:
        localSearchText={localSearchText}
        setLocalSearchText={setLocalSearchText}
        localSearchIn={localSearchIn}
        setLocalSearchIn={setLocalSearchIn}
        handleSearch={handleSearch}
        handleClearSearch={handleClearSearch}
        handleDateSelect={handleDateSelect}
        handleDateRangeSelect={handleDateRangeSelect}
      />

      
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-32 mt-28"> {/* Added pt-32 to account for fixed header height */}

        {totalPages > 1 && (
        <div className="mb-6">
          <TimePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageLabels={pageLabels}
          />
        </div>
      )}
        {/* Loading and segments rendering */}
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
      </main>

      {/* Audio Player and Modals */}
      {currentPlayingId && (
  <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-30">
    {console.log("🎧 Current Playing ID:", currentPlayingId)}
    {console.log("🎧 Segment passed to AudioPlayer:", segments.find(s => s.id === currentPlayingId))}
    
    {/* Add this check - if segment is not found, don't render AudioPlayer */}
    {segments.find(s => s.id === currentPlayingId) ? (
      <AudioPlayer 
        segment={segments.find(s => s.id === currentPlayingId)} 
        onClose={() => dispatch(setCurrentPlaying(null))}
      />
    ) : (
      // Auto-close the audio player when segment is not found
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