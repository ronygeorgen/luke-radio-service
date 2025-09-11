// components/AppStateHydrator.jsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { startTranscriptionPolling } from '../store/slices/audioSegmentsSlice';
import { cleanupOldPollingData } from '../utils/pollingCleanup';

const AppStateHydrator = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Clean up old data first
    const { transcriptionPolling, nextPollTime } = cleanupOldPollingData();
    
    // For each polling segment, restore the polling state
    Object.entries(transcriptionPolling).forEach(([segmentId, isPolling]) => {
      if (isPolling && nextPollTime[segmentId]) {
        const now = Date.now();
        const timeRemaining = nextPollTime[segmentId] - now;
        
        if (timeRemaining > 0) {
          // If there's still time remaining, restart polling
          const secondsRemaining = Math.ceil(timeRemaining / 1000);
          dispatch(startTranscriptionPolling({ 
            segmentId: parseInt(segmentId), 
            nextPollSeconds: secondsRemaining 
          }));
        } else {
          // If time has expired, poll immediately
          dispatch(startTranscriptionPolling({ 
            segmentId: parseInt(segmentId), 
            nextPollSeconds: 0 
          }));
        }
      }
    });
  }, [dispatch]);

  return null;
};

export default AppStateHydrator;