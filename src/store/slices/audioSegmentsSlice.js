import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';
import { convertLocalToUTC } from '../../utils/dateTimeUtils';

// audioSegmentsSlice.js
export const fetchAudioSegments = createAsyncThunk(
  'audioSegments/fetchAudioSegments',
  async ({ channelId, date, startTime, endTime, daypart }, { rejectWithValue }) => {
    try {
      let startDatetime = null;
      let endDatetime = null;
      
      if (date) {
        if (daypart === 'weekend') {
          // Special handling for weekend - you might need to adjust this
          // based on how your backend expects weekend queries
          const dateObj = new Date(date);
          const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
          
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            // It's a weekend day
            startDatetime = convertLocalToUTC(date, '00:00:00');
            endDatetime = convertLocalToUTC(date, '23:59:59');
          }
        } else if (startTime && endTime) {
          startDatetime = convertLocalToUTC(date, startTime);
          endDatetime = convertLocalToUTC(date, endTime);
        } else {
          startDatetime = convertLocalToUTC(date, '00:00:00');
          endDatetime = convertLocalToUTC(date, '23:59:59');
        }
      }
      
      const params = { 
        channel_id: channelId
      };
      
      if (startDatetime) params.start_datetime = startDatetime;
      if (endDatetime) params.end_datetime = endDatetime;
      
      const response = await axiosInstance.get('/audio_segments', {
        params
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const transcribeAudioSegment = createAsyncThunk(
  'audioSegments/transcribeAudioSegment',
  async (segmentId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/transcribe_and_analyze', {
        segment_id: segmentId
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// audioSegmentsSlice.js
const audioSegmentsSlice = createSlice({
  name: 'audioSegments',
  initialState: {
    segments: [],
    channelInfo: null,
    totals: {},
    loading: false,
    error: null,
    currentPlayingId: null,
    isPlaying: false,
    filters: {
      status: 'all',
      recognition: 'all',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      daypart: 'none'
    },
    transcriptionLoading: {}, // Track loading state per segment
    transcriptionErrors: {}, // Track errors per segment
    transcriptionStatus: {} // Track status per segment
  },
  reducers: {
    setCurrentPlaying: (state, action) => {
      state.currentPlayingId = action.payload;
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTranscriptionError: (state, action) => {
      const segmentId = action.payload;
      delete state.transcriptionErrors[segmentId];
    },
    resetTranscriptionState: (state, action) => {
      const segmentId = action.payload;
      delete state.transcriptionLoading[segmentId];
      delete state.transcriptionErrors[segmentId];
      delete state.transcriptionStatus[segmentId];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAudioSegments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAudioSegments.fulfilled, (state, action) => {
        state.loading = false;
        state.segments = action.payload.data.segments;
        state.channelInfo = action.payload.data.channel_info;
        
        const segments = action.payload.data.segments;
        const unrecognizedSegments = segments.filter(s => !s.is_recognized);
        
        state.totals = {
          total: action.payload.data.total_segments,
          recognized: action.payload.data.total_recognized,
          unrecognized: action.payload.data.total_unrecognized,
          unrecognizedWithContent: unrecognizedSegments.filter(s => 
            s.analysis?.summary || s.transcription?.transcript
          ).length,
          unrecognizedWithoutContent: unrecognizedSegments.filter(s => 
            !s.analysis?.summary && !s.transcription?.transcript
          ).length,
          withTranscription: action.payload.data.total_with_transcription,
          withAnalysis: action.payload.data.total_with_analysis
        };
      })
      .addCase(fetchAudioSegments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch audio segments';
      })
      // Transcription cases
      .addCase(transcribeAudioSegment.pending, (state, action) => {
        const segmentId = action.meta.arg;
        state.transcriptionLoading[segmentId] = true;
        state.transcriptionErrors[segmentId] = null;
      })
      .addCase(transcribeAudioSegment.fulfilled, (state, action) => {
        const segmentId = action.meta.arg;
        state.transcriptionLoading[segmentId] = false;
        
        if (action.payload.success) {
          if (action.payload.data?.transcription || action.payload.data?.analysis) {
            // Update the segment with new data - FIXED STRUCTURE
            const segmentIndex = state.segments.findIndex(s => s.id === segmentId);
            if (segmentIndex !== -1) {
              const updatedSegment = { ...state.segments[segmentIndex] };
              
              // Update transcription if available
              if (action.payload.data.transcription) {
                updatedSegment.transcription = {
                  id: action.payload.data.transcription.id,
                  transcript: action.payload.data.transcription.transcript,
                  created_at: action.payload.data.transcription.created_at,
                  rev_job_id: action.payload.data.transcription.rev_job_id
                };
              }
              
              // Update analysis if available
              if (action.payload.data.analysis) {
                updatedSegment.analysis = {
                  summary: action.payload.data.analysis.summary,
                  sentiment: action.payload.data.analysis.sentiment,
                  general_topics: action.payload.data.analysis.general_topics,
                  iab_topics: action.payload.data.analysis.iab_topics,
                  bucket_prompt: action.payload.data.analysis.bucket_prompt,
                  created_at: action.payload.data.analysis.created_at
                };
              }
              
              state.segments[segmentIndex] = updatedSegment;
            }
          } else {
            // Queue message
            state.transcriptionStatus[segmentId] = action.payload.message;
          }
        } else {
          state.transcriptionErrors[segmentId] = action.payload.error;
        }
      })
      .addCase(transcribeAudioSegment.rejected, (state, action) => {
        const segmentId = action.meta.arg;
        state.transcriptionLoading[segmentId] = false;
        state.transcriptionErrors[segmentId] = action.payload?.error || 'Failed to transcribe audio';
      });
  }
});

export const { 
  setCurrentPlaying, 
  setIsPlaying, 
  setFilter, 
  clearError, 
  clearTranscriptionError,
  resetTranscriptionState 
} = audioSegmentsSlice.actions;
export default audioSegmentsSlice.reducer;