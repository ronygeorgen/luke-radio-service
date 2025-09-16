import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi } from '../../services/dashboardApi';

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async ({ startDate, endDate, showAllTopics = false }, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getDashboardStats(startDate, endDate, showAllTopics);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  stats: {
    totalTranscriptions: 0,
    avgSentimentScore: 0,
    uniqueTopics: 0,
    activeShifts: 0
  },
  topicsDistribution: [],
  topTopicsRanking: [],
  sentimentData: [],
  dateRange: {
    startDate: '',
    endDate: ''
  },
  loading: false,
  error: null
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        
        // Extract dashboard stats
        const dashboardStats = payload.dashboardStats || {};
        state.stats = {
          totalTranscriptions: dashboardStats.totalTranscriptions || 0,
          avgSentimentScore: dashboardStats.avgSentimentScore || 0,
          uniqueTopics: dashboardStats.uniqueTopics || 0,
          activeShifts: dashboardStats.activeShifts || 0
        };
        
        // Extract arrays from root level
        state.topicsDistribution = payload.topicsDistribution || [];
        state.sentimentData = payload.sentimentData || [];
        
        // Create topTopicsRanking from topicsDistribution
        const total = state.stats.totalTranscriptions || 1;
        state.topTopicsRanking = state.topicsDistribution.map((topic, index) => ({
          rank: index + 1,
          topic: topic.topic,
          count: topic.value,
          percentage: Math.round((topic.value / total) * 100),
          trend: 'stable'
        }));
        
        // Set date range
        state.dateRange = payload.dateRange || {
          startDate: action.meta.arg.startDate,
          endDate: action.meta.arg.endDate
        };
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, setDateRange } = dashboardSlice.actions;
export default dashboardSlice.reducer;