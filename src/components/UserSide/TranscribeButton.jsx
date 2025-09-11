// components/UserSide/TranscribeButton.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { transcribeAudioSegment, clearTranscriptionError, startTranscriptionPolling } from '../../store/slices/audioSegmentsSlice';

const TranscribeButton = ({ segmentId }) => {
  const dispatch = useDispatch();
  
  // Use more specific selectors to avoid object reference changes
  const isLoading = useSelector((state) => state.audioSegments.transcriptionLoading[segmentId]);
  const error = useSelector((state) => state.audioSegments.transcriptionErrors[segmentId]);
  const status = useSelector((state) => state.audioSegments.transcriptionStatus[segmentId]);
  const isPolling = useSelector((state) => state.audioSegments.transcriptionPolling[segmentId]);
  const nextPollTimestamp = useSelector((state) => state.audioSegments.nextPollTime[segmentId]);

  const [countdown, setCountdown] = useState(0);

  // Memoized countdown update function
  const updateCountdown = useCallback(() => {
    if (nextPollTimestamp) {
      const secondsRemaining = Math.max(0, Math.ceil((nextPollTimestamp - Date.now()) / 1000));
      setCountdown(secondsRemaining);
    } else {
      setCountdown(0);
    }
  }, [nextPollTimestamp]);

  // Calculate countdown
  useEffect(() => {
    updateCountdown(); // Initial update
    
    // Only set interval if we're actually polling and have a valid timestamp
    if (isPolling && nextPollTimestamp) {
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
    
    return () => {}; // Cleanup if no interval is set
  }, [isPolling, nextPollTimestamp, updateCountdown]);

  const handleTranscribe = () => {
    dispatch(transcribeAudioSegment(segmentId));
    // Start polling immediately
    dispatch(startTranscriptionPolling({ segmentId, nextPollSeconds: 120 }));
  };

  const handleClearError = () => {
    dispatch(clearTranscriptionError(segmentId));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center p-4">
        <div className="animate-pulse flex space-x-4 w-full">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <button
          onClick={handleClearError}
          className="text-sm text-red-800 hover:text-red-900 underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (isPolling) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-blue-600">
            {status || 'Checking transcription status...'}
          </p>
          {countdown > 0 && (
            <span className="text-sm font-medium text-blue-800">
              {countdown}s
            </span>
          )}
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${(countdown / 120) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  if (status) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-600 mb-2">{status}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button
        onClick={handleTranscribe}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
      >
        Transcribe Audio
      </button>
    </div>
  );
};

export default TranscribeButton;