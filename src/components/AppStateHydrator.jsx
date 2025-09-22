import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { startTranscriptionPolling } from '../store/slices/audioSegmentsSlice';
import { cleanupOldPollingData } from '../utils/pollingCleanup';
import { checkAuth } from '../store/slices/authSlice';

const AppStateHydrator = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check authentication first
    dispatch(checkAuth());
    
    // Then clean up old data and restore polling
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
            nextPollSeconds: 5
          }));
        }
      }
    });
  }, [dispatch]);

  return null;
};

export default AppStateHydrator;