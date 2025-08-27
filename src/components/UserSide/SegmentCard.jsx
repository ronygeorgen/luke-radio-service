import React from 'react';
import CompactSegment from './CompactSegment';
import FullSegment from './FullSegment';

const SegmentCard = ({ 
  segment, 
  currentPlayingId, 
  isPlaying, 
  handlePlayPauseAudio, 
  handleSummaryClick, 
  handleTranscriptionClick 
}) => {
  const hasContent = segment.analysis?.summary || segment.transcription?.transcript;

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