import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';
import { convertLocalToUTC } from '../../utils/dateTimeUtils';

// audioSegmentsSlice.js - Update the fetchAudioSegments thunk
export const fetchShifts = createAsyncThunk(
  'audioSegments/fetchShifts',
  async (_, { rejectWithValue }) => {
    try {
      const channelId = localStorage.getItem('channelId');
      const params = {
        is_active: true
      };
      if (channelId) {
        params.channel = channelId;
      }
      const response = await axiosInstance.get('/shift-analysis/shifts/', {
        params
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
    shiftId = null,
    predefinedFilterId = null,
    duration = null,
    showFlaggedOnly = false,
    status = null,
    recognition_status = null,
    has_content = null
  }, { rejectWithValue }) => {
    try {
      let startDatetime = null;
      let endDatetime = null;

      console.log('API Request - Received params:', {
        channelId, date, startTime, endTime, startDate, endDate, daypart, page, shiftId, duration
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

      // Add either shift_id or predefined_filter_id to API call (mutually exclusive)
      if (predefinedFilterId) {
        params.predefined_filter_id = predefinedFilterId;
      } else if (shiftId) {
        params.shift_id = shiftId;
        // Add show_flagged_only parameter when shift is selected
        if (showFlaggedOnly) {
          params.show_flagged_only = true;
        }
      }

      console.log('API Request - Final params:', params);

      // Search validation
      if (searchText && searchIn) {
        params.search_text = searchText;
        params.search_in = searchIn;
      }

      // Add duration parameter if provided (must be a positive number)
      if (duration !== null && duration !== undefined && duration !== '' && !isNaN(duration) && duration > 0) {
        params.duration = duration;
        console.log('✅ Duration parameter added to API request:', duration);
      } else {
        console.log('ℹ️ No duration parameter (value was:', duration, ', type:', typeof duration, ')');
      }

      // Add status parameter if provided
      // status can be 'active', 'inactive', or null
      if (status !== null && status !== undefined) {
        if (status === 'active') {
          params.status = true;
        } else if (status === 'inactive') {
          params.status = false;
        }
      }

      // Add recognition_status parameter if provided
      if (recognition_status !== null && recognition_status !== undefined) {
        params.recognition_status = recognition_status;
      }

      // Add has_content parameter if provided
      // has_content can be true, false, or null
      if (has_content !== null && has_content !== undefined) {
        // Convert to boolean: handle both boolean and string values
        if (has_content === true || has_content === 'true') {
          params.has_content = true;
        } else if (has_content === false || has_content === 'false') {
          params.has_content = false;
        }
      }

      const response = await axiosInstance.get('/audio_segments', {
        params
      });
      console.log('API Response:', response.data);
      return response.data;
    } catch (err) {
      // Extract error message from response
      let errorMessage = 'Failed to fetch audio segments';
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);


// V2 API function for audio segments with new filter structure
export const fetchAudioSegmentsV2 = createAsyncThunk(
  'audioSegments/fetchAudioSegmentsV2',
  async ({
    channelId,
    startDatetime,
    endDatetime,
    page = 1,
    shiftId = null,
    predefinedFilterId = null,
    contentTypes = [], // Array of content type strings
    status = null, // 'active', 'inactive', or null
    searchText = null,
    searchIn = null
  }, { rejectWithValue }) => {
    try {
      console.log('📥 fetchAudioSegmentsV2 - Received parameters:', {
        channelId,
        startDatetime,
        endDatetime,
        page,
        shiftId,
        predefinedFilterId,
        contentTypes,
        status,
        searchText,
        searchIn
      });

      const params = {
        channel_id: channelId
      };

      if (startDatetime) params.start_datetime = startDatetime;
      if (endDatetime) params.end_datetime = endDatetime;
      if (page) params.page = page;

      // Add shift_id or predefined_filter_id (mutually exclusive)
      if (predefinedFilterId) {
        params.predefined_filter_id = predefinedFilterId;
      } else if (shiftId) {
        params.shift_id = shiftId;
      }

      // Add content_type parameters (can be multiple)
      // Only add content_type param if contentTypes is provided and has items
      // If contentTypes is null or empty array, don't add the parameter at all
      if (contentTypes !== null && contentTypes !== undefined && Array.isArray(contentTypes) && contentTypes.length > 0) {
        // For multiple params with same name, we need to pass them as an array
        // Axios will serialize them correctly
        params['content_type'] = contentTypes;
      }

      // Add status parameter if provided
      if (status !== null && status !== undefined) {
        params.status = status;
      }

      // Add search parameters
      if (searchText && searchIn) {
        params.search_text = searchText;
        params.search_in = searchIn;
      }

      console.log('V2 API Request - Final params:', params);

      // Handle multiple content_type params
      const config = {
        params: params
      };

      // If we have multiple content types, we need to serialize them properly
      if (contentTypes && contentTypes.length > 0) {
        // Use paramsSerializer to handle array params
        config.paramsSerializer = (params) => {
          const searchParams = new URLSearchParams();
          Object.keys(params).forEach(key => {
            if (key === 'content_type' && Array.isArray(params[key])) {
              params[key].forEach(value => {
                searchParams.append(key, value);
              });
            } else if (params[key] !== null && params[key] !== undefined) {
              searchParams.append(key, params[key]);
            }
          });
          return searchParams.toString();
        };
      }

      const response = await axiosInstance.get('/v2/audio-segments/', config);
      console.log('V2 API Response:', response.data);
      return response.data;
    } catch (err) {
      let errorMessage = 'Failed to fetch audio segments';
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch content type prompt data
export const fetchContentTypePrompt = createAsyncThunk(
  'audioSegments/fetchContentTypePrompt',
  async (_, { rejectWithValue }) => {
    try {
      // Check if baseURL already includes /api to avoid double /api in URL
      const baseURL = axiosInstance.defaults.baseURL || '';
      const endpoint = baseURL.endsWith('/api') || baseURL.includes('/api/')
        ? '/v2/filter/options/'
        : '/api/v2/filter/options/';

      console.log('Fetching content type prompt from:', endpoint);
      console.log('Base URL:', baseURL);

      const response = await axiosInstance.get(endpoint);
      console.log('Content Type Prompt Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching content type prompt:', err);
      console.error('Error URL:', err.config?.url);
      console.error('Full error:', err);
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
      status: null, // 'active', 'inactive', or null for 'all'
      recognition_status: null, // 'recognized', 'unrecognized', or null for 'all'
      has_content: null, // true, false, or null for 'all'
      date: new Date().toISOString().split('T')[0],
      startDate: null, // NEW: for date range
      endDate: null,   // NEW: for date range
      startTime: '',
      endTime: '',
      daypart: 'none',
      searchText: '',  // NEW: search text
      searchIn: 'transcription', // NEW: search category
      shiftId: null,
      predefinedFilterId: null,
      duration: null, // Duration filter in seconds
      showFlaggedOnly: false, // Show flagged only when shift is selected
      contentTypes: null, // V2: Array of selected content types
      onlyAnnouncers: true, // V2: Only Announcers toggle state (default: true)
      onlyActive: true, // V2: Only Active toggle state (default: true)
    },
    contentTypePrompt: {
      contentTypes: [],
      searchInOptions: [],
      loading: false,
      error: null
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
        // Store error message, but don't clear segments to prevent white screen
        state.error = action.payload || 'Failed to fetch audio segments';
        // Don't clear segments on error - keep existing data visible
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
      // V2 Audio Segments cases
      .addCase(fetchAudioSegmentsV2.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAudioSegmentsV2.fulfilled, (state, action) => {
        state.loading = false;
        state.segments = action.payload.data?.segments || [];
        state.channelInfo = action.payload.data?.channel_info || null;
        state.pagination = action.payload.pagination;

        console.log('🔍 V2 API Response - Full pagination:', action.payload.pagination);

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
      .addCase(fetchAudioSegmentsV2.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch audio segments';
      })
      // Content Type Prompt cases
      .addCase(fetchContentTypePrompt.pending, (state) => {
        state.contentTypePrompt.loading = true;
        state.contentTypePrompt.error = null;
      })
      .addCase(fetchContentTypePrompt.fulfilled, (state, action) => {
        state.contentTypePrompt.loading = false;
        if (action.payload.success && action.payload.data) {
          state.contentTypePrompt.contentTypes = action.payload.data.content_type_prompt || [];
          state.contentTypePrompt.searchInOptions = action.payload.data.search_in || [];
        }
      })
      .addCase(fetchContentTypePrompt.rejected, (state, action) => {
        state.contentTypePrompt.loading = false;
        state.contentTypePrompt.error = action.payload || 'Failed to fetch content type prompt data';
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