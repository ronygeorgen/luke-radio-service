import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password, isAdmin = false }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/accounts/token/', {
        email,
        password
      });
      
      const { access, refresh } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Decode token to get user info
      const tokenPayload = JSON.parse(atob(access.split('.')[1]));
      
      return {
        accessToken: access,
        refreshToken: refresh,
        user: {
          id: tokenPayload.user_id,
          email: tokenPayload.email,
          name: tokenPayload.name,
          isAdmin: tokenPayload.is_admin
        }
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const verifyMagicLink = createAsyncThunk(
  'auth/verifyMagicLink',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/accounts/auth/verify-magic-link/', {
        token
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const resendMagicLink = createAsyncThunk(
  'auth/resendMagicLink',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/accounts/auth/resend-magic-link/', {
        email
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const setPassword = createAsyncThunk(
  'auth/setPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/accounts/auth/set-password/', {
        token,
        password
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'auth/createUser',
  async ({ email, name }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/accounts/admin/create-user/', {
        email,
        name
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async ({ user_id, email, name, is_active }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/accounts/admin/update-user/${user_id}/`, {
        email,
        name,
        is_active
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const resendMagicLinkAdmin = createAsyncThunk(
  'auth/resendMagicLinkAdmin',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/accounts/auth/resend-magic-link/', {
        email
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log("refresh token starts working");
      
      
      const response = await axiosInstance.post('/accounts/token/refresh/', {
        refresh: refreshToken
      });
      
      const { access } = response.data;
      localStorage.setItem('accessToken', access);
      
      return { accessToken: access };
    } catch (error) {
      // Only clear tokens if it's an authentication error (refresh token invalid)
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Check if user is authenticated on app load
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!accessToken || !refreshToken) {
        throw new Error('No tokens found');
      }
      
      // Verify token is still valid
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const isExpired = tokenPayload.exp * 1000 < Date.now();
      
      if (isExpired) {
        // Token expired, try to refresh
        const refreshResult = await dispatch(refreshToken());
        if (refreshToken.fulfilled.match(refreshResult)) {
          // Get the new token payload after refresh
          const newAccessToken = refreshResult.payload.accessToken;
          const newTokenPayload = JSON.parse(atob(newAccessToken.split('.')[1]));
          
          return {
            accessToken: newAccessToken,
            refreshToken: localStorage.getItem('refreshToken'), // refresh token remains same
            user: {
              id: newTokenPayload.user_id,
              email: newTokenPayload.email,
              name: newTokenPayload.name,
              isAdmin: newTokenPayload.is_admin
            }
          };
        } else {
          // Refresh failed
          throw new Error('Token refresh failed');
        }
      }
      
      // Token is still valid
      return {
        accessToken,
        refreshToken,
        user: {
          id: tokenPayload.user_id,
          email: tokenPayload.email,
          name: tokenPayload.name,
          isAdmin: tokenPayload.is_admin
        }
      };
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  magicLinkData: null, // Stores data from magic link verification
  resendMagicLinkLoading: false, // Separate loading state for resend magic link
  updateUserLoading: false // Separate loading state for update user
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.magicLinkData = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('channelId');  
      localStorage.removeItem('channelName');
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMagicLinkData: (state) => {
      state.magicLinkData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Verify Magic Link
      .addCase(verifyMagicLink.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyMagicLink.fulfilled, (state, action) => {
        state.isLoading = false;
        state.magicLinkData = action.payload;
        state.error = null;
      })
      .addCase(verifyMagicLink.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.magicLinkData = null;
      })
      
      // Set Password
      .addCase(setPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.magicLinkData = null;
        state.error = null;
      })
      .addCase(setPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })
      
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.updateUserLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updateUserLoading = false;
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updateUserLoading = false;
        state.error = action.payload;
      })
      
      // Resend Magic Link
      .addCase(resendMagicLink.pending, (state) => {
        state.resendMagicLinkLoading = true;
        state.error = null;
      })
      .addCase(resendMagicLink.fulfilled, (state) => {
        state.resendMagicLinkLoading = false;
        state.error = null;
      })
      .addCase(resendMagicLink.rejected, (state, action) => {
        state.resendMagicLinkLoading = false;
        state.error = action.payload;
      })
      
      // Resend Magic Link Admin
      .addCase(resendMagicLinkAdmin.pending, (state) => {
        state.resendMagicLinkLoading = true;
        state.error = null;
      })
      .addCase(resendMagicLinkAdmin.fulfilled, (state) => {
        state.resendMagicLinkLoading = false;
        state.error = null;
      })
      .addCase(resendMagicLinkAdmin.rejected, (state, action) => {
        state.resendMagicLinkLoading = false;
        state.error = action.payload;
      })
      
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });
  }
});

export const { logout, clearError, clearMagicLinkData } = authSlice.actions;
export default authSlice.reducer;