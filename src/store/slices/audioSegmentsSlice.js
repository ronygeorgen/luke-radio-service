import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

export const fetchAudioSegments = createAsyncThunk(
  'audioSegments/fetchAudioSegments',
  async ({ channelId, date, startTime, endTime }, { rejectWithValue }) => {
    try {
      const params = { 
        channel_id: channelId, 
        date 
      };
      
      // Only add time params if they exist
      if (startTime) params.start_time = startTime;
      if (endTime) params.end_time = endTime;
      
      const response = await axiosInstance.get('/audio_segments_with_transcription', {
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
    }
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
      });
  }
});

export const { setCurrentPlaying, setIsPlaying, setFilter, clearError } = audioSegmentsSlice.actions;
export default audioSegmentsSlice.reducer;