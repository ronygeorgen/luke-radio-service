import axios from "axios";
import { axiosInstance, BASE_URL } from "./api";
import { store } from "../store/store";
import { refreshToken } from "../store/slices/authSlice";


axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Use Redux thunk to refresh token
          const result = await store.dispatch(refreshToken());
          
          if (refreshToken.fulfilled.match(result)) {
            const newAccessToken = result.payload.accessToken;
            
            // Update Authorization header and retry original request
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          } else {
            // Refresh failed, logout user
            store.dispatch(logout());
            window.location.href = '/user-login';
          }
        } catch (refreshError) {
          console.error('Refresh token invalid, logging out');
          store.dispatch(logout());
          window.location.href = '/user-login';
        }
      }
      
      return Promise.reject(error);
    }
);