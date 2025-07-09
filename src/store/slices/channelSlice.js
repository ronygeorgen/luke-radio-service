import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dummyChannels } from '../../data/dummyData';

// Async thunks
export const fetchChannels = createAsyncThunk(
  'channels/fetchChannels',
  async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(dummyChannels), 500);
    });
  }
);

export const addChannel = createAsyncThunk(
  'channels/addChannel',
  async (channelData) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newChannel = {
          id: Date.now().toString(),
          ...channelData,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        resolve(newChannel);
      }, 300);
    });
  }
);

export const deleteChannel = createAsyncThunk(
  'channels/deleteChannel',
  async (channelId) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(channelId), 300);
    });
  }
);

export const toggleChannel = createAsyncThunk(
  'channels/toggleChannel',
  async (channelId) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(channelId), 200);
    });
  }
);

const channelSlice = createSlice({
  name: 'channels',
  initialState: {
    channels: [],
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
      // Fetch channels
      .addCase(fetchChannels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.loading = false;
        state.channels = action.payload;
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add channel
      .addCase(addChannel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addChannel.fulfilled, (state, action) => {
        state.loading = false;
        state.channels.push(action.payload);
      })
      .addCase(addChannel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete channel
      .addCase(deleteChannel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteChannel.fulfilled, (state, action) => {
        state.loading = false;
        state.channels = state.channels.filter(
          (channel) => channel.id !== action.payload
        );
      })
      .addCase(deleteChannel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Toggle channel
      .addCase(toggleChannel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleChannel.fulfilled, (state, action) => {
        state.loading = false;
        const channel = state.channels.find(
          (channel) => channel.id === action.payload
        );
        if (channel) {
          channel.isActive = !channel.isActive;
        }
      })
      .addCase(toggleChannel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError } = channelSlice.actions;
export default channelSlice.reducer;