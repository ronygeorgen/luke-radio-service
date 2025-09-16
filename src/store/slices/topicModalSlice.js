import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi } from '../../services/dashboardApi';

export const fetchAudioSegmentsByTopic = createAsyncThunk(
  'topicModal/fetchAudioSegments',
  async ({ topicName, startDate, endDate, showAllTopics }, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getAudioSegmentsByTopic(
        topicName, 
        startDate, 
        endDate, 
        showAllTopics
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  isOpen: false,
  topicName: '',
  audioSegments: [],
  loading: false,
  error: null
};

const topicModalSlice = createSlice({
  name: 'topicModal',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state.isOpen = true;
      state.topicName = action.payload;
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.topicName = '';
      state.audioSegments = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAudioSegmentsByTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAudioSegmentsByTopic.fulfilled, (state, action) => {
        state.loading = false;
        state.audioSegments = action.payload.audio_segments || [];
      })
      .addCase(fetchAudioSegmentsByTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { openModal, closeModal } = topicModalSlice.actions;
export default topicModalSlice.reducer;