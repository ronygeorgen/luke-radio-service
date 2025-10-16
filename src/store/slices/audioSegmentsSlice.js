import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';
import { convertLocalToUTC } from '../../utils/dateTimeUtils';

// audioSegmentsSlice.js - Update the fetchAudioSegments thunk
export const fetchShifts = createAsyncThunk(
  'audioSegments/fetchShifts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/shift-analysis/shifts/', {
        params: {
          is_active: true
        }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Replace both fetchAudioSegmentsWithFilter and fetchAudioSegmentsForPage with this:
export const fetchAudioSegments = createAsyncThunk(
  'audioSegments/fetchAudioSegments',
  async ({ 
    channelId, 
    date, 
    startTime, 
    endTime, 
    daypart, 
    searchText, 
    searchIn, 
    startDate, 
    endDate,
    page = 1,
    shiftId = null
  }, { rejectWithValue }) => {
    try {
      let startDatetime = null;
      let endDatetime = null;
      
      console.log('API Request - Received params:', {
        channelId, date, startTime, endTime, startDate, endDate, daypart, page, shiftId
      });

      // Handle date range with specific time
      if (startDate && endDate && startTime && endTime) {
        startDatetime = convertLocalToUTC(startDate, startTime);
        endDatetime = convertLocalToUTC(endDate, endTime);
      }
      // Handle date range without specific time (entire days)
      else if (startDate && endDate) {
        startDatetime = convertLocalToUTC(startDate, '00:00:00');
        endDatetime = convertLocalToUTC(endDate, '23:59:59');
      }
      // Handle single date with specific time
      else if (date && startTime && endTime) {
        startDatetime = convertLocalToUTC(date, startTime);
        endDatetime = convertLocalToUTC(date, endTime);
      }
      // Handle single date without specific time (entire day)
      else if (date && (!startTime || !endTime)) {
        startDatetime = convertLocalToUTC(date, '00:00:00');
        endDatetime = convertLocalToUTC(date, '23:59:59');
      }
      else if (date) {
        let useDate = date;
        
        if (daypart === 'weekend') {
          const dateObj = new Date(useDate);
          const dayOfWeek = dateObj.getDay();
          
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            startDatetime = convertLocalToUTC(useDate, '00:00:00');
            endDatetime = convertLocalToUTC(useDate, '23:59:59');
          }
        } else if (daypart !== 'none') {
          const daypartTimes = {
            'morning': { start: '06:00:00', end: '10:00:00' },
            'midday': { start: '10:00:00', end: '15:00:00' },
            'afternoon': { start: '15:00:00', end: '19:00:00' },
            'evening': { start: '19:00:00', end: '23:59:59' },
            'overnight': { start: '00:00:00', end: '06:00:00' },
            'weekend': { start: '00:00:00', end: '23:59:59' }
          };
          
          const times = daypartTimes[daypart];
          if (times) {
            startDatetime = convertLocalToUTC(useDate, times.start);
            endDatetime = convertLocalToUTC(useDate, times.end);
          }
        } else {
          startDatetime = convertLocalToUTC(useDate, '00:00:00');
          endDatetime = convertLocalToUTC(useDate, '23:59:59');
        }
      }
      
      const params = { 
        channel_id: channelId
      };
      
      if (startDatetime) params.start_datetime = startDatetime;
      if (endDatetime) params.end_datetime = endDatetime;
      
      // Add page parameter to API call
      if (page) params.page = page;
      
      // Add shift_id parameter to API call
      if (shiftId) params.shift_id = shiftId;
      
      console.log('API Request - Final params:', params);
      
      // Search validation
      if (searchText && searchIn) {
        params.search_text = searchText;
        params.search_in = searchIn;
      }
      
      const response = await axiosInstance.get('/audio_segments', {
        params
      });
      console.log('API Response:', response.data);
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

// Update the fetchPieChartData async thunk
export const fetchPieChartData = createAsyncThunk(
  'audioSegments/fetchPieChartData',
  async ({ channelId, date, startTime, endTime, daypart, startDate, endDate }, { rejectWithValue }) => {
    try {
      let startDatetime = null;
      let endDatetime = null;
      
      console.log('Pie Chart API - Received params:', {
        channelId, date, startTime, endTime, startDate, endDate, daypart
      });

      // Handle date range with specific time
      if (startDate && endDate && startTime && endTime) {
        startDatetime = convertLocalToUTC(startDate, startTime);
        endDatetime = convertLocalToUTC(endDate, endTime);
      }
      // Handle date range without specific time (entire days)
      else if (startDate && endDate) {
        startDatetime = convertLocalToUTC(startDate, '00:00:00');
        endDatetime = convertLocalToUTC(endDate, '23:59:59');
      }
      // Handle single date with specific time
      else if (date && startTime && endTime) {
        startDatetime = convertLocalToUTC(date, startTime);
        endDatetime = convertLocalToUTC(date, endTime);
      }
      // Handle single date without specific time (entire day)
      else if (date && (!startTime || !endTime)) {
        startDatetime = convertLocalToUTC(date, '00:00:00');
        endDatetime = convertLocalToUTC(date, '23:59:59');
      }
      // Handle daypart logic
      else if (date) {
        let useDate = date;
        
        if (daypart === 'weekend') {
          const dateObj = new Date(useDate);
          const dayOfWeek = dateObj.getDay();
          
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            startDatetime = convertLocalToUTC(useDate, '00:00:00');
            endDatetime = convertLocalToUTC(useDate, '23:59:59');
          }
        } else if (daypart !== 'none') {
          const daypartTimes = {
            'morning': { start: '06:00:00', end: '10:00:00' },
            'midday': { start: '10:00:00', end: '15:00:00' },
            'afternoon': { start: '15:00:00', end: '19:00:00' },
            'evening': { start: '19:00:00', end: '23:59:59' },
            'overnight': { start: '00:00:00', end: '06:00:00' },
            'weekend': { start: '00:00:00', end: '23:59:59' }
          };
          
          const times = daypartTimes[daypart];
          if (times) {
            startDatetime = convertLocalToUTC(useDate, times.start);
            endDatetime = convertLocalToUTC(useDate, times.end);
          }
        } else {
          // Fallback for single date without daypart
          startDatetime = convertLocalToUTC(useDate, '00:00:00');
          endDatetime = convertLocalToUTC(useDate, '23:59:59');
        }
      }
      
      
      
      const params = { 
        channel_id: channelId
      };
      
      // These are REQUIRED parameters
      if (startDatetime) params.start_datetime = startDatetime;
      if (endDatetime) params.end_datetime = endDatetime;
      
      console.log('Pie Chart API - Final params:', params);
      
      const response = await axiosInstance.get('/pie_chart', {
        params
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
    pagination: null,
    availablePages: null,
    loading: false,
    error: null,
    shifts: [],
    shiftsLoading: false,
    shiftsError: null,
    pieChartData: [],
    pieChartLoading: false,
    pieChartError: null,
    currentPlayingId: null,
    isPlaying: false,
    filters: {
      status: 'all',
      recognition: 'all',
      date: new Date().toISOString().split('T')[0],
      startDate: null, // NEW: for date range
      endDate: null,   // NEW: for date range
      startTime: '',
      endTime: '',
      daypart: 'none',
      searchText: '',  // NEW: search text
      searchIn: 'transcription', // NEW: search category
      shiftId: null, 
    },
    transcriptionLoading: {}, // Track loading state per segment
    transcriptionErrors: {}, // Track errors per segment
    transcriptionStatus: {}, // Track status per segment
    transcriptionPolling: {}, 
    nextPollTime: {} 
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
    },
    startTranscriptionPolling: (state, action) => {
      const { segmentId, nextPollSeconds = 120 } = action.payload;
      state.transcriptionPolling[segmentId] = true;
      state.nextPollTime[segmentId] = Date.now() + (nextPollSeconds * 1000);
    },
    stopTranscriptionPolling: (state, action) => {
      const segmentId = action.payload;
      delete state.transcriptionPolling[segmentId];
      delete state.nextPollTime[segmentId];
    },
    updatePollingCountdown: (state, action) => {
      const { segmentId, secondsRemaining } = action.payload;
      if (state.nextPollTime[segmentId]) {
        state.nextPollTime[segmentId] = Date.now() + (secondsRemaining * 1000);
      }
    },
    clearAllPolling: (state) => {
      state.transcriptionPolling = {};
      state.nextPollTime = {};
    }
  },
  extraReducers: (builder) => {
    builder
    // Add shifts cases
      .addCase(fetchShifts.pending, (state) => {
        state.shiftsLoading = true;
      })
      .addCase(fetchShifts.fulfilled, (state, action) => {
        state.shiftsLoading = false;
        state.shifts = action.payload;
      })
      .addCase(fetchShifts.rejected, (state, action) => {
        state.shiftsLoading = false;
        state.shiftsError = action.payload || 'Failed to fetch shifts';
      })
      .addCase(fetchAudioSegments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAudioSegments.fulfilled, (state, action) => {
        state.loading = false;
        state.segments = action.payload.data?.segments || [];
        state.channelInfo = action.payload.data?.channel_info || null;
        state.pagination = action.payload.pagination;

        console.log('🔍 API Response - Full pagination:', action.payload.pagination);
        
        // Always update availablePages with the full pagination data
        if (action.payload.pagination) {
          state.availablePages = action.payload.pagination;
          console.log('✅ Updated availablePages:', state.availablePages);
        }
        
        const segments = action.payload.data?.segments || [];
        const unrecognizedSegments = segments.filter(s => !s.is_recognized);
        
        state.totals = {
          total: action.payload.data?.total_segments || 0,
          recognized: action.payload.data?.total_recognized || 0,
          unrecognized: action.payload.data?.total_unrecognized || 0,
          unrecognizedWithContent: unrecognizedSegments.filter(s => 
            s.analysis?.summary || s.transcription?.transcript
          ).length,
          unrecognizedWithoutContent: unrecognizedSegments.filter(s => 
            !s.analysis?.summary && !s.transcription?.transcript
          ).length,
          withTranscription: action.payload.data?.total_with_transcription || 0,
          withAnalysis: action.payload.data?.total_with_analysis || 0
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
            // Update the segment with new data
            const segmentIndex = state.segments.findIndex(s => s.id === segmentId);
            if (segmentIndex !== -1) {
              const updatedSegment = { ...state.segments[segmentIndex] };
              
              if (action.payload.data.transcription) {
                updatedSegment.transcription = {
                  id: action.payload.data.transcription.id,
                  transcript: action.payload.data.transcription.transcript,
                  created_at: action.payload.data.transcription.created_at,
                  rev_job_id: action.payload.data.transcription.rev_job_id
                };
              }
              
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
              // Stop polling since we got the data
              delete state.transcriptionPolling[segmentId];
              delete state.nextPollTime[segmentId];
            }
          } else if (action.payload.data?.status === 'queued' || action.payload.data?.status === 'recently_queued') {
            // Start polling for queued segments
            const secondsRemaining = action.payload.data.seconds_remaining || action.payload.seconds_remaining || 120;
            state.transcriptionStatus[segmentId] = action.payload.message;
            state.transcriptionPolling[segmentId] = true;
            state.nextPollTime[segmentId] = Date.now() + (secondsRemaining * 1000);
          } else {
            // Other success messages
            state.transcriptionStatus[segmentId] = action.payload.message;
          }
        } else {
          state.transcriptionErrors[segmentId] = action.payload.error;
          if (action.payload.seconds_remaining) {
            // Start polling for rate-limited requests
            state.transcriptionPolling[segmentId] = true;
            state.nextPollTime[segmentId] = Date.now() + (action.payload.seconds_remaining * 1000);
          }
        }
      })
      .addCase(transcribeAudioSegment.rejected, (state, action) => {
        const segmentId = action.meta.arg;
        state.transcriptionLoading[segmentId] = false;
        state.transcriptionErrors[segmentId] = action.payload?.error || 'Failed to transcribe audio';
      })
      // Pie Chart cases
    .addCase(fetchPieChartData.pending, (state) => {
      state.pieChartLoading = true;
      state.pieChartError = null;
    })
    .addCase(fetchPieChartData.fulfilled, (state, action) => {
      state.pieChartLoading = false;
      state.pieChartData = action.payload.data || [];
    })
    .addCase(fetchPieChartData.rejected, (state, action) => {
      state.pieChartLoading = false;
      state.pieChartError = action.payload || 'Failed to fetch pie chart data';
    })
  }
});

export const { 
  setCurrentPlaying, 
  setIsPlaying, 
  setFilter, 
  clearError, 
  clearTranscriptionError,
  resetTranscriptionState,
  startTranscriptionPolling,
  stopTranscriptionPolling,
  updatePollingCountdown,
  clearAllPolling
} = audioSegmentsSlice.actions;
export default audioSegmentsSlice.reducer;