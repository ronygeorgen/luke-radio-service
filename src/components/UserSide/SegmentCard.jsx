// components/UserSide/SegmentCard.jsx
import React from 'react';
import CompactSegment from './CompactSegment';
import FullSegment from './FullSegment';
import { useSelector } from 'react-redux';

const SegmentCard = ({ 
  segment, 
  currentPlayingId, 
  isPlaying, 
  handlePlayPauseAudio, 
  handleSummaryClick, 
  handleTranscriptionClick 
}) => {
  const { transcriptionStatus } = useSelector((state) => state.audioSegments);
  
  // Check if content is available - updated to handle "Empty" values
  const hasContent = 
    (segment.transcription?.transcript && segment.transcription.transcript !== "Empty") ||
    (segment.analysis?.summary && segment.analysis.summary !== "Empty");
  
  const isTranscribing = transcriptionStatus[segment.id];

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
        />
      ) : (
        <CompactSegment
          segment={segment}
          currentPlayingId={currentPlayingId}
          isPlaying={isPlaying}
          handlePlayPauseAudio={handlePlayPauseAudio}
        />
      )}
    </div>
  );
};

export default SegmentCard;