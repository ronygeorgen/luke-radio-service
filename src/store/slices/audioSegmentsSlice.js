import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';
import { convertLocalToUTC } from '../../utils/dateTimeUtils';

// audioSegmentsSlice.js - Update the fetchAudioSegments thunk
// In audioSegmentsSlice.js - Update the date range with time logic
export const fetchAudioSegmentsWithFilter = createAsyncThunk(
  'audioSegments/fetchAudioSegmentsWithFilter',
  async ({ channelId, date, startTime, endTime, daypart, searchText, searchIn, startDate, endDate }, { rejectWithValue }) => {
    try {
      let startDatetime = null;
      let endDatetime = null;
      
      console.log('Filter API Request - Received params:', {
        channelId, date, startTime, endTime, startDate, endDate, daypart
      });

      // Handle date range with specific time
      if (startDate && endDate && startTime && endTime) {
        // For date range WITH specific time, we want to apply the time filter to each day in the range
        // The API should handle pagination within this filtered range
        startDatetime = convertLocalToUTC(startDate, startTime);
        endDatetime = convertLocalToUTC(endDate, endTime);
        
        console.log('📅 Date Range with Time Filter:', {
          startDate, endDate, startTime, endTime,
          startDatetime, endDatetime
        });
      }
      // Handle date range without specific time (entire days)
      else if (startDate && endDate) {
        // For date range without time, fetch entire days
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
          // Default to entire day
          startDatetime = convertLocalToUTC(useDate, '00:00:00');
          endDatetime = convertLocalToUTC(useDate, '23:59:59');
        }
      }
      
      const params = { 
        channel_id: channelId
      };
      
      if (startDatetime) params.start_datetime = startDatetime;
      if (endDatetime) params.end_datetime = endDatetime;
      
      console.log('Filter API Request - Final params:', params);
      
      // Search validation
      if (searchText && searchIn) {
        params.search_text = searchText;
        params.search_in = searchIn;
      }
      
      const response = await axiosInstance.get('/audio_segments', {
        params
      });
      console.log('Filter API Response:', response.data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchAudioSegmentsForPage = createAsyncThunk(
  'audioSegments/fetchAudioSegmentsForPage',
  async ({ channelId, date, startTime, endTime, searchText, searchIn, startDate, endDate }, { rejectWithValue }) => {
    try {
      console.log('Page Navigation API Request - Received params:', {
        channelId, date, startTime, endTime, startDate, endDate
      });

      // For page navigation, we always have specific date and time
      const startDatetime = convertLocalToUTC(date, startTime);
      const endDatetime = convertLocalToUTC(date, endTime);
      
      const params = { 
        channel_id: channelId
      };
      
      if (startDatetime) params.start_datetime = startDatetime;
      if (endDatetime) params.end_datetime = endDatetime;
      
      console.log('Page Navigation API Request - Final params:', params);
      
      // Search validation
      if (searchText && searchIn) {
        params.search_text = searchText;
        params.search_in = searchIn;
      }
      
      const response = await axiosInstance.get('/audio_segments', {
        params
      });
      console.log('Page Navigation API Response:', response.data);
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
    page = 1  // Add page parameter with default value
  }, { rejectWithValue }) => {
    try {
      let startDatetime = null;
      let endDatetime = null;
      
      console.log('API Request - Received params:', {
        channelId, date, startTime, endTime, startDate, endDate, daypart, page
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

// export const fetchAudioSegments = createAsyncThunk(
//   'audioSegments/fetchAudioSegments',
//   async ({ channelId, date, startTime, endTime, daypart, searchText, searchIn, startDate, endDate }, { rejectWithValue }) => {
//     try {
//       let startDatetime = null;
//       let endDatetime = null;
      
//       console.log('API Request - Received params:', {
//         channelId, date, startTime, endTime, startDate, endDate, daypart
//       });

//       // Handle date range (startDate and endDate take priority)
//       if (startDate && endDate) {
//         // For date range, we need to handle the full range
//         // The pagination will handle the specific time slices
//         if (startTime && endTime) {
//           // If we have specific time from pagination, use that with the specific date
//           startDatetime = convertLocalToUTC(date, startTime);
//           endDatetime = convertLocalToUTC(date, endTime);
//         } else {
//           // For initial date range load, show the entire range
//           // The API will return pagination for the full range
//           startDatetime = convertLocalToUTC(startDate, '00:00:00');
//           endDatetime = convertLocalToUTC(endDate, '23:59:59');
//         }
//       }
//       // If we have a specific date with time (from pagination), use that
//       else if (date && startTime && endTime) {
//         startDatetime = convertLocalToUTC(date, startTime);
//         endDatetime = convertLocalToUTC(date, endTime);
//       }
//       else if (date) {
//         let useDate = date;
        
//         if (daypart === 'weekend') {
//           const dateObj = new Date(useDate);
//           const dayOfWeek = dateObj.getDay();
          
//           if (dayOfWeek === 0 || dayOfWeek === 6) {
//             startDatetime = convertLocalToUTC(useDate, '00:00:00');
//             endDatetime = convertLocalToUTC(useDate, '23:59:59');
//           }
//         } else if (startTime && endTime) {
//           startDatetime = convertLocalToUTC(useDate, startTime);
//           endDatetime = convertLocalToUTC(useDate, endTime);
//         } else if (daypart !== 'none') {
//           const daypartTimes = {
//             'morning': { start: '06:00:00', end: '10:00:00' },
//             'midday': { start: '10:00:00', end: '15:00:00' },
//             'afternoon': { start: '15:00:00', end: '19:00:00' },
//             'evening': { start: '19:00:00', end: '23:59:59' },
//             'overnight': { start: '00:00:00', end: '06:00:00' },
//             'weekend': { start: '00:00:00', end: '23:59:59' }
//           };
          
//           const times = daypartTimes[daypart];
//           if (times) {
//             startDatetime = convertLocalToUTC(useDate, times.start);
//             endDatetime = convertLocalToUTC(useDate, times.end);
//           }
//         } else {
//           startDatetime = convertLocalToUTC(useDate, '00:00:00');
//           endDatetime = convertLocalToUTC(useDate, '23:59:59');
//         }
//       }
      
//       const params = { 
//         channel_id: channelId
//       };
      
//       if (startDatetime) params.start_datetime = startDatetime;
//       if (endDatetime) params.end_datetime = endDatetime;
      
//       console.log('API Request - Final params:', params);
      
//       // Search validation
//       if (searchText && searchIn) {
//         params.search_text = searchText;
//         params.search_in = searchIn;
//       }
      
//       const response = await axiosInstance.get('/audio_segments', {
//         params
//       });
//       console.log('API Response:', response.data);
//       return response.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data || err.message);
//     }
//   }
// );

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
      
      // Use the same date/time logic as fetchAudioSegments
      if (date && startTime && endTime) {
        startDatetime = convertLocalToUTC(date, startTime);
        endDatetime = convertLocalToUTC(date, endTime);
      } else if (startDate && endDate) {
        // For date range with specific time (from pagination)
        if (startTime && endTime) {
          startDatetime = convertLocalToUTC(date, startTime); // Use the specific date from pagination
          endDatetime = convertLocalToUTC(date, endTime);
        } else {
          // For date range without specific time
          startDatetime = convertLocalToUTC(startDate, '00:00:00');
          endDatetime = convertLocalToUTC(endDate, '23:59:59');
        }
      } else if (date) {
        let useDate = date;
        
        if (daypart === 'weekend') {
          const dateObj = new Date(useDate);
          const dayOfWeek = dateObj.getDay();
          
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            startDatetime = convertLocalToUTC(useDate, '00:00:00');
            endDatetime = convertLocalToUTC(useDate, '23:59:59');
          }
        } else if (startTime && endTime) {
          startDatetime = convertLocalToUTC(useDate, startTime);
          endDatetime = convertLocalToUTC(useDate, endTime);
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
      if (endDatetime) params.end_datetime = endDatetime; // ADD THIS LINE
      
      console.log('Pie Chart API Request Params:', params);
      
      const response = await axiosInstance.get('/pie_chart', { // Make sure this matches your endpoint
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
      searchIn: 'transcription' // NEW: search category
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
      .addCase(fetchAudioSegments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAudioSegments.fulfilled, (state, action) => {
        state.loading = false;
        state.segments = action.payload.data.segments;
        state.channelInfo = action.payload.data.channel_info;
        state.pagination = action.payload.pagination;

        console.log('🔍 API Response - Full pagination:', action.payload.pagination);
        
        // Always update availablePages with the full pagination data
        if (action.payload.pagination) {
          state.availablePages = action.payload.pagination;
          console.log('✅ Updated availablePages:', state.availablePages);
        }
        
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