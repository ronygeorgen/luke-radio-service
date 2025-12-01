// customFlagSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

// Async thunks
export const fetchCustomFlags = createAsyncThunk(
  'customFlags/fetchCustomFlags',
  async () => {
    const response = await axiosInstance.get('/custom-flag/');
    return response.data;
  }
);

export const createCustomFlag = createAsyncThunk(
  'customFlags/createCustomFlag',
  async (flagData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/custom-flag/', flagData);
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

export const updateCustomFlag = createAsyncThunk(
  'customFlags/updateCustomFlag',
  async ({ id, flagData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/custom-flag/${id}/`, flagData);
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

export const deleteCustomFlag = createAsyncThunk(
  'customFlags/deleteCustomFlag',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/custom-flag/${id}/`);
      return id;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

const customFlagSlice = createSlice({
  name: 'customFlags',
  initialState: {
    flags: [],
    loading: false,
    error: null,
    createLoading: false,
    createError: null,
    updateLoading: false,
    updateError: null,
    deleteLoading: false,
    deleteError: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch custom flags
      .addCase(fetchCustomFlags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomFlags.fulfilled, (state, action) => {
        state.loading = false;
        state.flags = action.payload;
      })
      .addCase(fetchCustomFlags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create custom flag
      .addCase(createCustomFlag.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createCustomFlag.fulfilled, (state, action) => {
        state.createLoading = false;
        state.flags.push(action.payload);
      })
      .addCase(createCustomFlag.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || action.error.message;
      })
      // Update custom flag
      .addCase(updateCustomFlag.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateCustomFlag.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.flags.findIndex(flag => flag.id === action.payload.id);
        if (index !== -1) {
          state.flags[index] = action.payload;
        }
      })
      .addCase(updateCustomFlag.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || action.error.message;
      })
      // Delete custom flag
      .addCase(deleteCustomFlag.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteCustomFlag.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.flags = state.flags.filter(flag => flag.id !== action.payload);
      })
      .addCase(deleteCustomFlag.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || action.error.message;
      });
  },
});

export const { clearError } = customFlagSlice.actions;
export default customFlagSlice.reducer;

