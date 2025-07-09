import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dummySettings, dummyBuckets } from '../../data/dummyData';

// Async thunks
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => resolve({ settings: dummySettings, buckets: dummyBuckets }), 500);
    });
  }
);

export const updateSetting = createAsyncThunk(
  'settings/updateSetting',
  async ({ key, value }) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => resolve({ key, value }), 300);
    });
  }
);

export const addBucket = createAsyncThunk(
  'settings/addBucket',
  async (bucketData) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newBucket = {
          id: Date.now().toString(),
          ...bucketData,
          createdAt: new Date().toISOString(),
        };
        resolve(newBucket);
      }, 300);
    });
  }
);

export const updateBucket = createAsyncThunk(
  'settings/updateBucket',
  async ({ id, name, value }) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => resolve({ id, name, value }), 300);
    });
  }
);

export const deleteBucket = createAsyncThunk(
  'settings/deleteBucket',
  async (bucketId) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(bucketId), 300);
    });
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    settings: {},
    buckets: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload.settings;
        state.buckets = action.payload.buckets;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update setting
      .addCase(updateSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSetting.fulfilled, (state, action) => {
        state.loading = false;
        const { key, value } = action.payload;
        state.settings[key] = value;
      })
      .addCase(updateSetting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add bucket
      .addCase(addBucket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBucket.fulfilled, (state, action) => {
        state.loading = false;
        state.buckets.push(action.payload);
      })
      .addCase(addBucket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update bucket
      .addCase(updateBucket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBucket.fulfilled, (state, action) => {
        state.loading = false;
        const { id, name, value } = action.payload;
        const bucket = state.buckets.find(bucket => bucket.id === id);
        if (bucket) {
          bucket.name = name;
          bucket.value = value;
        }
      })
      .addCase(updateBucket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete bucket
      .addCase(deleteBucket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBucket.fulfilled, (state, action) => {
        state.loading = false;
        state.buckets = state.buckets.filter(bucket => bucket.id !== action.payload);
      })
      .addCase(deleteBucket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError } = settingsSlice.actions;
export default settingsSlice.reducer;