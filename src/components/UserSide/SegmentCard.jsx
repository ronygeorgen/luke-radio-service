// components/UserSide/SegmentCard.jsx
import React, { useEffect } from 'react';
import CompactSegment from './CompactSegment';
import FullSegment from './FullSegment';
import { useSelector, useDispatch } from 'react-redux';
import { startTranscriptionPolling, stopTranscriptionPolling } from '../../store/slices/audioSegmentsSlice';

const SegmentCard = ({ 
  segment, 
  currentPlayingId, 
  isPlaying, 
  handlePlayPauseAudio, 
  handleSummaryClick, 
  handleTranscriptionClick,
  handleTrimClick  
}) => {
  const dispatch = useDispatch();
  
  // Use specific selectors to avoid object reference changes
  const isPolling = useSelector((state) => state.audioSegments.transcriptionPolling[segment.id]);
  const nextPollTime = useSelector((state) => state.audioSegments.nextPollTime[segment.id]);
  
  // Check if content is available
  const hasContent = 
    (segment.transcription?.transcript && segment.transcription.transcript !== "Empty") ||
    (segment.analysis?.summary && segment.analysis.summary !== "Empty");

  // Restart polling on component mount if it was previously polling and still valid
  useEffect(() => {
    if (isPolling && !hasContent && nextPollTime) {
      const now = Date.now();
      if (now < nextPollTime) {
        // Still valid, continue polling
        const secondsRemaining = Math.ceil((nextPollTime - now) / 1000);
        dispatch(startTranscriptionPolling({ 
          segmentId: segment.id, 
          nextPollSeconds: secondsRemaining 
        }));
      } else {
        // Time expired, poll immediately
        dispatch(startTranscriptionPolling({ 
          segmentId: segment.id, 
          nextPollSeconds: 0 
        }));
      }
    }
  }, []); // Empty dependency array to run only once on mount

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden mb-6 ${!segment.is_active ? 'opacity-70' : ''}`}>
      {hasContent ? (
        <FullSegment
          segment={segment}
          currentPlayingId={currentPlayingId}
          isPlaying={isPlaying}
          handlePlayPauseAudio={handlePlayPauseAudio}
          handleSummaryClick={handleSummaryClick}
          handleTranscriptionClick={handleTranscriptionClick}
          handleTrimClick={handleTrimClick}
        />
      ) : (
        <CompactSegment
          segment={segment}
          currentPlayingId={currentPlayingId}
          isPlaying={isPlaying}
          handlePlayPauseAudio={handlePlayPauseAudio}
          handleTrimClick={handleTrimClick}
        />
      )}
    </div>
  );
};

export default SegmentCard;