import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi } from '../../services/dashboardApi';

// Async thunk for fetching shift analytics data
export const fetchShiftAnalytics = createAsyncThunk(
  'shiftAnalytics/fetchData',
  async ({ startDate, endDate, showAllTopics = false }, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getShiftAnalytics(startDate, endDate, showAllTopics);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch shift analytics');
    }
  }
);

const shiftAnalyticsSlice = createSlice({
  name: 'shiftAnalytics',
  initialState: {
    data: null,
    loading: false,
    error: null,
    lastFetchParams: null
  },
  reducers: {
    clearShiftAnalytics: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.lastFetchParams = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShiftAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShiftAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastFetchParams = action.meta.arg;
      })
      .addCase(fetchShiftAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearShiftAnalytics } = shiftAnalyticsSlice.actions;
export default shiftAnalyticsSlice.reducer;