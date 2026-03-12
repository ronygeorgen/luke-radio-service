// store/slices/userManagementSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

// Async thunks
export const fetchUsers = createAsyncThunk(
  'userManagement/fetchUsers',
  async () => {
    const response = await axiosInstance.get('/accounts/admin/list-users/');
    return response.data;
  }
);

export const assignChannelToUser = createAsyncThunk(
  'userManagement/assignChannelToUser',
  async ({ user_id, channel_id }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/accounts/admin/assign-channel/', {
        user_id: parseInt(user_id, 10),
        channel_id: parseInt(channel_id, 10)
      });
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Fetch channels assigned to a specific user (uses user_id param for admin context)
export const fetchUserAssignedChannels = createAsyncThunk(
  'userManagement/fetchUserAssignedChannels',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/accounts/user/channels/', {
        params: { user_id: userId }
      });
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Unassign channel from user
export const unassignChannelFromUser = createAsyncThunk(
  'userManagement/unassignChannelFromUser',
  async ({ user_id, channel_id }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/accounts/admin/unassign-channel/', {
        user_id: parseInt(user_id, 10),
        channel_id: parseInt(channel_id, 10)
      });
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'userManagement/deleteUser',
  async (user_id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/accounts/admin/delete-user/${user_id}/`);
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState: {
    users: [],
    loading: false,
    error: null,
    assignLoading: false,
    assignError: null,
    assignSuccess: false,
    userAssignedChannels: [],
    userAssignedChannelsLoading: false,
    userAssignedChannelsError: null,
    unassignLoading: null, // channel id being unassigned
    deleteLoading: false,
    deleteError: null,
    deleteSuccess: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAssignError: (state) => {
      state.assignError = null;
      state.assignSuccess = false;
    },
    resetAssignState: (state) => {
      state.assignLoading = false;
      state.assignError = null;
      state.assignSuccess = false;
    },
    clearUserAssignedChannels: (state) => {
      state.userAssignedChannels = [];
      state.userAssignedChannelsLoading = false;
      state.userAssignedChannelsError = null;
    },
    clearDeleteState: (state) => {
      state.deleteLoading = false;
      state.deleteError = null;
      state.deleteSuccess = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Assign channel to user
      .addCase(assignChannelToUser.pending, (state) => {
        state.assignLoading = true;
        state.assignError = null;
        state.assignSuccess = false;
      })
      .addCase(assignChannelToUser.fulfilled, (state, action) => {
        state.assignLoading = false;
        state.assignSuccess = true;
        // Update the user in the list if needed
        if (action.payload.user) {
          const index = state.users.findIndex(user => user.id === action.payload.user.id);
          if (index !== -1) {
            state.users[index] = action.payload.user;
          }
        }
      })
      .addCase(assignChannelToUser.rejected, (state, action) => {
        state.assignLoading = false;
        state.assignError = action.payload || action.error.message;
        state.assignSuccess = false;
      })
      // Fetch user assigned channels
      .addCase(fetchUserAssignedChannels.pending, (state) => {
        state.userAssignedChannelsLoading = true;
        state.userAssignedChannelsError = null;
      })
      .addCase(fetchUserAssignedChannels.fulfilled, (state, action) => {
        state.userAssignedChannelsLoading = false;
        const data = action.payload;
        const requestedUserId = action.meta.arg;

        // Handle both response formats:
        // Postman: [{ channel: {...}, assigned_at: "..." }]
        // Backend: { user: {...}, channels: [raw channel objects] }
        let rawChannels = Array.isArray(data) ? data : (data.channels || data.results || []);

        // If backend returns wrong user's data (ignores user_id param), filter to empty until backend is fixed
        if (data.user && data.user.id !== requestedUserId) {
          rawChannels = [];
        }

        state.userAssignedChannels = rawChannels.map((item) => {
          if (item.channel) return item; // Postman format
          return { channel: item, assigned_at: item.assigned_at || null }; // Normalize raw channel
        });
      })
      .addCase(fetchUserAssignedChannels.rejected, (state, action) => {
        state.userAssignedChannelsLoading = false;
        state.userAssignedChannelsError = action.payload || action.error.message;
        state.userAssignedChannels = [];
      })
      // Unassign channel from user
      .addCase(unassignChannelFromUser.pending, (state, action) => {
        state.unassignLoading = action.meta.arg.channel_id;
      })
      .addCase(unassignChannelFromUser.fulfilled, (state, action) => {
        state.unassignLoading = null;
        const channelId = action.meta.arg.channel_id;
        state.userAssignedChannels = state.userAssignedChannels.filter((item) => {
          const id = item.channel?.id ?? item.id;
          return Number(id) !== Number(channelId);
        });
      })
      .addCase(unassignChannelFromUser.rejected, (state, action) => {
        state.unassignLoading = null;
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.deleteSuccess = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteSuccess = action.payload.message || 'User deleted successfully';
        // Remove the user from the list
        state.users = state.users.filter(user => user.id !== action.meta.arg);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload?.message || action.payload || action.error.message;
        state.deleteSuccess = null;
      });
  },
});

export const { clearError, clearAssignError, resetAssignState, clearDeleteState, clearUserAssignedChannels } = userManagementSlice.actions;
export default userManagementSlice.reducer;