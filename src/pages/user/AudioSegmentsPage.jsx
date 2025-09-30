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