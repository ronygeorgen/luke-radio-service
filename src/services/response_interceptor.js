import axios from "axios";
import { axiosInstance, BASE_URL } from "./api";
import { store } from "../store/store";
import { refreshToken, logout } from "../store/slices/authSlice";


axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Dispatch refreshToken and wait for the result
          const result = await store.dispatch(refreshToken());
          
          if (refreshToken.fulfilled.match(result)) {
            const newAccessToken = result.payload.accessToken;
            
            // Update Authorization header and retry original request
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          } else {
            // Refresh failed, logout user only if refresh token is invalid
            console.log('Refresh token invalid, logging out');
            store.dispatch(logout());
            window.location.href = '/user-login';
            return Promise.reject(error);
          }
        } catch (refreshError) {
          console.error('Refresh token invalid, logging out');
          store.dispatch(logout());
          window.location.href = '/user-login';
          return Promise.reject(refreshError);
        }
      }
      
      // For other errors or if already retried, just reject
      return Promise.reject(error);
    }
);