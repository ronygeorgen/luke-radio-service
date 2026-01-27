// channelSlice.js (updated)
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

// New API: Fetch channels for specific user
export const fetchUserChannels = createAsyncThunk(
  'channels/fetchUserChannels',
  async () => {
    const response = await axiosInstance.get('/accounts/user/channels/');
    return response.data;
  }
);

export const addChannel = createAsyncThunk(
  'channels/addChannel',
  async (channelData, { rejectWithValue }) => {
    try {
      const channelType = channelData.channelType || 'broadcast';
      let payload = {
        channel_type: channelType,
        name: channelData.name || '',
        timezone: channelData.timezone
      };

      if (channelType === 'broadcast') {
        // Ensure channelId and projectId are valid integers
        const channelId = channelData.channelId != null ? parseInt(channelData.channelId, 10) : null;
        const projectId = channelData.projectId != null ? parseInt(channelData.projectId, 10) : null;
        
        if (isNaN(channelId) || channelId === null) {
          return rejectWithValue('Channel ID must be a valid number');
        }
        if (isNaN(projectId) || projectId === null) {
          return rejectWithValue('Project ID must be a valid number');
        }
        
        payload.channel_id = channelId;
        payload.project_id = projectId;
      } else if (channelType === 'podcast') {
        payload.rss_url = channelData.rssUrl || '';
        payload.rss_start_date = channelData.rssStartDate || '';
      }
      
      const response = await axiosInstance.post('/channels', payload);
      return response.data.channel;
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        return rejectWithValue(err.response.data.error);
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

export const updateChannel = createAsyncThunk(
  'channels/updateChannel',
  async (channelData) => {
    const channelType = channelData.channelType || 'broadcast';
    
    // Build payload based on channel type - only include appropriate fields
    let payload;
    
    if (channelType === 'broadcast') {
      // For broadcast channels, only include broadcast-specific fields
      payload = {
        id: channelData.id,
        channel_type: channelType,
        name: channelData.name || '',
        timezone: channelData.timezone,
        channel_id: channelData.channelId,
        project_id: channelData.projectId
      };
      // Explicitly do NOT include rss_url or rss_start_date for broadcast channels
    } else if (channelType === 'podcast') {
      // For podcast channels, only include podcast-specific fields
      payload = {
        id: channelData.id,
        channel_type: channelType,
        name: channelData.name || '',
        timezone: channelData.timezone
      };
      // Only include rss_start_date if it's provided (for editing)
      if (channelData.rssStartDate) {
        payload.rss_start_date = channelData.rssStartDate;
      }
      // Only include rss_url if it's provided (shouldn't happen when editing, but just in case)
      if (channelData.rssUrl) {
        payload.rss_url = channelData.rssUrl;
      }
      // Explicitly do NOT include channel_id or project_id for podcast channels
    } else {
      // Fallback
      payload = {
        id: channelData.id,
        channel_type: channelType,
        name: channelData.name || '',
        timezone: channelData.timezone
      };
    }

    const response = await axiosInstance.patch('/channels', payload);
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
    return channelId;
  }
);

export const reanalyzeRSS = createAsyncThunk(
  'channels/reanalyzeRSS',
  async (channelId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/channels/rss/reanalyze', {
        channel_id: channelId
      });
      return response.data;
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        return rejectWithValue(err.response.data.error);
      }
      return rejectWithValue(err.message || 'Failed to reanalyze RSS feed');
    }
  }
);

const channelSlice = createSlice({
  name: 'channels',
  initialState: {
    channels: [],
    userChannels: [], // New state for user-specific channels
    selectedChannel: null,
    loading: false,
    userChannelsLoading: false, // Separate loading state for user channels
    error: null,
    userChannelsError: null, // Separate error state for user channels
  },
  reducers: {
    setSelectedChannel: (state, action) => {
      state.selectedChannel = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearUserChannelsError: (state) => {
      state.userChannelsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all channels (admin)
      .addCase(fetchChannels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.loading = false;
        state.channels = action.payload.map(channel => ({
          id: channel.id.toString(),
          channelType: channel.channel_type || 'broadcast',
          channelId: channel.channel_id,
          projectId: channel.project_id,
          name: channel.name,
          timezone: channel.timezone,
          rssUrl: channel.rss_url || '',
          rssStartDate: channel.rss_start_date || '',
          createdAt: channel.created_at,
          isActive: !channel.is_deleted
        }));
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch user-specific channels
      .addCase(fetchUserChannels.pending, (state) => {
        state.userChannelsLoading = true;
        state.userChannelsError = null;
      })
      .addCase(fetchUserChannels.fulfilled, (state, action) => {
        state.userChannelsLoading = false;
        
        // Extract channels from the response
        const channels = action.payload.channels || [];
        
        state.userChannels = channels.map(channel => ({
          id: channel.id.toString(),
          channelType: channel.channel_type || 'broadcast',
          channelId: channel.channel_id,
          projectId: channel.project_id,
          name: channel.name,
          timezone: channel.timezone || 'Australia/Melbourne',
          rssUrl: channel.rss_url || '',
          rssStartDate: channel.rss_start_date || '',
          assignedAt: channel.assigned_at || null
        }));
      })
      .addCase(fetchUserChannels.rejected, (state, action) => {
        state.userChannelsLoading = false;
        state.userChannelsError = action.error.message;
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
          channelType: action.payload.channel_type || 'broadcast',
          channelId: action.payload.channel_id,
          projectId: action.payload.project_id,
          name: action.payload.name || '',
          timezone: action.payload.timezone,
          rssUrl: action.payload.rss_url || '',
          rssStartDate: action.payload.rss_start_date || '',
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
            channelType: action.payload.channel_type || 'broadcast',
            channelId: action.payload.channel_id,
            projectId: action.payload.project_id,
            name: action.payload.name || '',
            timezone: action.payload.timezone,
            rssUrl: action.payload.rss_url || '',
            rssStartDate: action.payload.rss_start_date || '',
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
export const selectUserChannels = (state) => state.channels.userChannels;
export const selectUserChannelsLoading = (state) => state.channels.userChannelsLoading;
export const selectUserChannelsError = (state) => state.channels.userChannelsError;

export const { clearError, setSelectedChannel, clearUserChannelsError } = channelSlice.actions;
export default channelSlice.reducer;