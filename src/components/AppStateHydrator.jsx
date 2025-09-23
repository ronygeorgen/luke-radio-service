import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { startTranscriptionPolling } from '../store/slices/audioSegmentsSlice';
import { cleanupOldPollingData } from '../utils/pollingCleanup';
import { checkAuth } from '../store/slices/authSlice';

const AppStateHydrator = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      // First check authentication
      const authResult = await dispatch(checkAuth());
      
      // Only start polling if user is authenticated
      if (checkAuth.fulfilled.match(authResult)) {
        const { transcriptionPolling, nextPollTime } = cleanupOldPollingData();
        
        Object.entries(transcriptionPolling).forEach(([segmentId, isPolling]) => {
          if (isPolling && nextPollTime[segmentId]) {
            const now = Date.now();
            const timeRemaining = nextPollTime[segmentId] - now;
            
            if (timeRemaining > 0) {
              const secondsRemaining = Math.ceil(timeRemaining / 1000);
              dispatch(startTranscriptionPolling({ 
                segmentId: parseInt(segmentId), 
                nextPollSeconds: secondsRemaining 
              }));
            } else {
              dispatch(startTranscriptionPolling({ 
                segmentId: parseInt(segmentId), 
                nextPollSeconds: 5
              }));
            }
          }
        });
      }
    };

    initializeApp();
  }, [dispatch]);

  return null;
};

export default AppStateHydrator;