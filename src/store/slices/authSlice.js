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

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axiosInstance.post('/accounts/token/refresh/', {
        refresh: refreshToken
      });
      
      const { access } = response.data;
      localStorage.setItem('accessToken', access);
      
      return { accessToken: access };
    } catch (error) {
      // Clear tokens if refresh fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
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
      
      // Verify token is still valid by making a simple request
      // or just decode and check expiry
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const isExpired = tokenPayload.exp * 1000 < Date.now();
      
      if (isExpired) {
        // Token expired, try to refresh
        return await dispatch(refreshToken()).unwrap();
      }
      
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
  magicLinkData: null // Stores data from magic link verification
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