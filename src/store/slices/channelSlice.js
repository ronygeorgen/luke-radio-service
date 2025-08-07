// channelSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

// Async thunks
export const fetchChannels = createAsyncThunk(
  'channels/fetchChannels',
  async () => {
    const response = await axiosInstance.get('/channels');
    return response.data.channels;
  }
);

export const addChannel = createAsyncThunk(
  'channels/addChannel',
  async (channelData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/channels', {
        channel_id: parseInt(channelData.channelId, 10),
        project_id: parseInt(channelData.projectId, 10),
        name: channelData.name || ''
      });
      return response.data.channel;
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        return rejectWithValue(err.response.data.error); // Use backend error message
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);


export const updateChannel = createAsyncThunk(
  'channels/updateChannel',
  async (channelData) => {
    const response = await axiosInstance.put('/channels', {
      id: channelData.id,
      channel_id: channelData.channelId,
      project_id: channelData.projectId,
      name: channelData.name || ''
    });
    return response.data.channel;
  }
);

export const deleteChannel = createAsyncThunk(
  'channels/deleteChannel',
  async (channelId) => {
    await axiosInstance.delete('/channels', {
      data: { id: channelId }
    });
    return channelId;
  }
);

export const toggleChannel = createAsyncThunk(
  'channels/toggleChannel',
  async (channelId) => {
    // Note: The API doesn't have a toggle endpoint, so we'll need to implement this
    // based on your actual API. For now, I'll just return the channelId
    return channelId;
  }
);

const channelSlice = createSlice({
  name: 'channels',
  initialState: {
    channels: [],
    selectedChannel: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedChannel: (state, action) => {
      state.selectedChannel = action.payload;
    },
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
        state.channels = action.payload.map(channel => ({
          id: channel.id.toString(),
          channelId: channel.channel_id,
          projectId: channel.project_id,
          name: channel.name,
          createdAt: channel.created_at,
          isActive: !channel.is_deleted
        }));
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
        state.channels.push({
          id: action.payload.id.toString(),
          channelId: action.payload.channel_id,
          projectId: action.payload.project_id,
          name: action.payload.name || '',
          createdAt: action.payload.created_at,
          isActive: !action.payload.is_deleted
        });
      })
      .addCase(addChannel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Update channel
      .addCase(updateChannel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateChannel.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.channels.findIndex(
          channel => channel.id === action.payload.id.toString()
        );
        if (index !== -1) {
          state.channels[index] = {
            id: action.payload.id.toString(),
            channelId: action.payload.channel_id,
            projectId: action.payload.project_id,
            name: action.payload.name || '',
            createdAt: action.payload.created_at,
            isActive: !action.payload.is_deleted
          };
        }
      })
      .addCase(updateChannel.rejected, (state, action) => {
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
          channel => channel.id !== action.payload.toString()
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
          channel => channel.id === action.payload.toString()
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

export const selectSelectedChannel = (state) => state.channels.selectedChannel;
export const { clearError, setSelectedChannel  } = channelSlice.actions;
export default channelSlice.reducer;