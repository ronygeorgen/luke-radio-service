// store/slices/audioTrimmerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

// Async thunk for trimming audio
export const trimAudioSegment = createAsyncThunk(
  'audioTrimmer/trimAudioSegment',
  async ({ segment, split_segments, is_active }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const accessToken = state.auth.accessToken;

      if (!accessToken) {
        throw new Error('No access token available');
      }

      // ✅ Get channel_id from localStorage
      const channelId = localStorage.getItem("channelId");
      if (!channelId) {
        throw new Error('No channelId found in localStorage');
      }

      const payload = {
        channel_id: Number(channelId), // make sure it's numeric
        segment_id: segment.id,
        is_active: is_active,
        split_segments: split_segments
      };

      const response = await axiosInstance.post('/segments/create', payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  isOpen: false,
  currentSegment: null,
  isLoading: false,
  error: null,
  trimResult: null
};

const audioTrimmerSlice = createSlice({
  name: 'audioTrimmer',
  initialState,
  reducers: {
    openTrimmer: (state, action) => {
      state.isOpen = true;
      state.currentSegment = action.payload;
      state.error = null;
      state.trimResult = null;
    },
    closeTrimmer: (state) => {
      state.isOpen = false;
      state.currentSegment = null;
      state.error = null;
      state.trimResult = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearResult: (state) => {
      state.trimResult = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(trimAudioSegment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.trimResult = null;
      })
      .addCase(trimAudioSegment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trimResult = action.payload;
        state.error = null;
      })
      .addCase(trimAudioSegment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.trimResult = null;
      });
  }
});

export const { openTrimmer, closeTrimmer, clearError, clearResult } = audioTrimmerSlice.actions;
export default audioTrimmerSlice.reducer;