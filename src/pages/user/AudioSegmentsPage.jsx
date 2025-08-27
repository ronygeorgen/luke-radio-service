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

const AudioSegmentsPage = () => {
  const { channelId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  
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
    { value: 'weekend', label: 'Weekend (Saturday & Sunday full day)', startTime: '00:00:00', endTime: '23:59:59' }
  ];

  // Handler functions
  const handlePlayPauseAudio = (segmentId) => {
    if (currentPlayingId === segmentId) {
      dispatch(setIsPlaying(!isPlaying));
    } else {
      dispatch(setCurrentPlaying(segmentId));
      dispatch(setIsPlaying(true));
    }
  };

  const handleDaypartChange = (selectedDaypart) => {
    if (selectedDaypart === 'none') {
      dispatch(setFilter({ daypart: 'none', startTime: '', endTime: '' }));
      setLocalStartTime('');
      setLocalEndTime('');
    } else {
      const daypart = daypartOptions.find(opt => opt.value === selectedDaypart);
      dispatch(setFilter({ daypart: selectedDaypart, startTime: daypart.startTime, endTime: daypart.endTime }));
      setLocalStartTime(daypart.startTime.substring(0, 5));
      setLocalEndTime(daypart.endTime.substring(0, 5));
    }
    
    dispatch(fetchAudioSegments({ 
      channelId, 
      date: filters.date,
      startTime: selectedDaypart === 'none' ? '' : daypart.startTime,
      endTime: selectedDaypart === 'none' ? '' : daypart.endTime
    }));
  };

  const handleSearchWithCustomTime = () => {
    dispatch(setFilter({ 
      startTime: localStartTime ? localStartTime + ':00' : '',
      endTime: localEndTime ? localEndTime + ':00' : '',
      daypart: 'none'
    }));
    
    dispatch(fetchAudioSegments({ 
      channelId, 
      date: filters.date,
      startTime: localStartTime ? localStartTime + ':00' : '',
      endTime: localEndTime ? localEndTime + ':00' : ''
    }));
  };

  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    dispatch(setFilter({ date: today, startTime: '', endTime: '', daypart: 'none', status: 'all', recognition: 'all' }));
    setLocalStartTime('');
    setLocalEndTime('');
    setSearchParams({ date: today });
    dispatch(fetchAudioSegments({ channelId, date: today, startTime: '', endTime: '' }));
  };

  const handleSummaryClick = (segment) => {
    setSelectedSegment(segment);
    setShowSummaryModal(true);
  };

  const handleTranscriptionClick = (segment) => {
    setSelectedSegment(segment);
    setShowTranscriptionModal(true);
  };

  

  // Effects and other logic remain the same...

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        channelInfo={channelInfo} 
        filters={filters} 
        formatTimeDisplay={() => formatTimeDisplay(filters, daypartOptions)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        />

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
          />
        ))}
      </main>

      {/* Audio Player and Modals */}

      {/* Audio Player */}
      {currentPlayingId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-30">
          <AudioPlayer 
            segment={segments.find(s => s.id === currentPlayingId)} 
            onClose={() => dispatch(setCurrentPlaying(null))}
          />
        </div>
      )}

      {/* Modals */}
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



