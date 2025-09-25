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

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState: {
    users: [],
    loading: false,
    error: null,
    assignLoading: false,
    assignError: null,
    assignSuccess: false
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
      });
  },
});

export const { clearError, clearAssignError, resetAssignState } = userManagementSlice.actions;
export default userManagementSlice.reducer;