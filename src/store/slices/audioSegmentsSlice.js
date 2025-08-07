import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

export const fetchAudioSegments = createAsyncThunk(
  'audioSegments/fetchAudioSegments',
  async ({ channelId, date, hour }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/separated_audio_segments?channel_id=${channelId}&date=${date}&hour=${hour}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

const audioSegmentsSlice = createSlice({
  name: 'audioSegments',
  initialState: {
    data: {
      recognized: [],
      unrecognized: [],
      channel_info: null,
    },
    loading: false,
    error: null,
    filters: {
      date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
      hour: '0',
      showRecognized: true,
      showUnrecognized: true,
    },
  },
  reducers: {
    setDateFilter: (state, action) => {
      state.filters.date = action.payload;
    },
    setHourFilter: (state, action) => {
      state.filters.hour = action.payload;
    },
    toggleRecognizedFilter: (state) => {
      state.filters.showRecognized = !state.filters.showRecognized;
    },
    toggleUnrecognizedFilter: (state) => {
      state.filters.showUnrecognized = !state.filters.showUnrecognized;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAudioSegments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAudioSegments.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.data.channel_info = action.payload.channel_info;
      })
      .addCase(fetchAudioSegments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch audio segments';
      });
  },
});

export const {
  setDateFilter,
  setHourFilter,
  toggleRecognizedFilter,
  toggleUnrecognizedFilter,
  clearError,
} = audioSegmentsSlice.actions;

export default audioSegmentsSlice.reducer;