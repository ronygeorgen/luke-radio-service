// contentTypeDeactivationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

// Async thunks
export const fetchContentTypeDeactivationRules = createAsyncThunk(
  'contentTypeDeactivation/fetchContentTypeDeactivationRules',
  async (params = {}) => {
    const { channelId, isActive, search, ordering } = params;
    const queryParams = new URLSearchParams();
    if (channelId) queryParams.append('channel_id', channelId);
    if (isActive !== undefined && isActive !== null) {
      queryParams.append('is_active', isActive);
    }
    if (search) queryParams.append('search', search);
    if (ordering) queryParams.append('ordering', ordering);
    
    const response = await axiosInstance.get(`/content-type-deactivation-rules/?${queryParams.toString()}`);
    return response.data;
  }
);

export const createContentTypeDeactivationRule = createAsyncThunk(
  'contentTypeDeactivation/createContentTypeDeactivationRule',
  async (ruleData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/content-type-deactivation-rules/', ruleData);
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

export const deleteContentTypeDeactivationRule = createAsyncThunk(
  'contentTypeDeactivation/deleteContentTypeDeactivationRule',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/content-type-deactivation-rules/${id}/`);
      return id;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

const contentTypeDeactivationSlice = createSlice({
  name: 'contentTypeDeactivation',
  initialState: {
    rules: [],
    loading: false,
    error: null,
    createLoading: false,
    createError: null,
    deleteLoading: false,
    deleteError: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.createError = null;
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rules
      .addCase(fetchContentTypeDeactivationRules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContentTypeDeactivationRules.fulfilled, (state, action) => {
        state.loading = false;
        state.rules = action.payload;
      })
      .addCase(fetchContentTypeDeactivationRules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create rule
      .addCase(createContentTypeDeactivationRule.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createContentTypeDeactivationRule.fulfilled, (state, action) => {
        state.createLoading = false;
        state.rules.push(action.payload);
      })
      .addCase(createContentTypeDeactivationRule.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || action.error.message;
      })
      // Delete rule
      .addCase(deleteContentTypeDeactivationRule.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteContentTypeDeactivationRule.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.rules = state.rules.filter(rule => rule.id !== action.payload);
      })
      .addCase(deleteContentTypeDeactivationRule.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || action.error.message;
      });
  },
});

export const { clearError } = contentTypeDeactivationSlice.actions;
export default contentTypeDeactivationSlice.reducer;

