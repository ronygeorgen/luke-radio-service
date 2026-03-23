import { axiosInstance } from "./api";
import { store } from "../store/store";
import { refreshToken, logout } from "../store/slices/authSlice";

/**
 * True when 401 is from JWT obtain (login) — invalid credentials, not "access token expired".
 * Must not run refresh + hard redirect or the login page will full-reload and lose the error UI.
 */
function isAuthTokenObtainRequest(config) {
  const url = String(config?.url || "").split("?")[0];
  const method = String(config?.method || "get").toLowerCase();
  if (method !== "post") return false;
  // POST .../accounts/token/ (obtain pair) — not .../accounts/token/refresh/
  const lower = url.toLowerCase();
  return lower.includes("/accounts/token") && !lower.includes("refresh");
}

/** True when the failed request is the refresh call itself — do not chain another refresh. */
function isAuthTokenRefreshRequest(config) {
  const url = String(config?.url || "");
  return url.includes("token/refresh") || url.includes("token/refresh/");
}

function redirectToLoginIfNeeded() {
  const path = window.location.pathname || "";
  if (path.includes("/user-login") || path.includes("/admin-login")) {
    // Already on a login screen — avoid full page reload (keeps React state / error message)
    return;
  }
  window.location.href = "/user-login";
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Wrong password / invalid login returns 401 — pass through to the form (no refresh, no reload)
    if (isAuthTokenObtainRequest(originalRequest)) {
      return Promise.reject(error);
    }

    // Refresh endpoint failed — do not call refreshToken() again
    if (isAuthTokenRefreshRequest(originalRequest)) {
      originalRequest._retry = true;
      store.dispatch(logout());
      redirectToLoginIfNeeded();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const result = await store.dispatch(refreshToken());

      if (refreshToken.fulfilled.match(result)) {
        const newAccessToken = result.payload.accessToken;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      }

      store.dispatch(logout());
      redirectToLoginIfNeeded();
      return Promise.reject(error);
    } catch (refreshError) {
      store.dispatch(logout());
      redirectToLoginIfNeeded();
      return Promise.reject(refreshError);
    }
  }
);
