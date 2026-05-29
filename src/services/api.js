import axios from 'axios';

// Get API configuration from Vite environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const PRE_FIX = import.meta.env.VITE_PRE_FIX || '/api/v1';

const baseURL = `${API_URL}${PRE_FIX}`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and the request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if refreshing the token itself fails with 401
      if (originalRequest.url.includes('/token/generate-access-token') || originalRequest.url.includes('/user/sign-in')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        // Broadcast custom event for logout
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      try {
        // According to Frontend Integration Guide section 3.11:
        // POST /api/v1/token/generate-access-token with JSON body { "token": "<refresh_token>" }
        // Notice we must use axios directly rather than the api instance to avoid interceptor collision
        const response = await axios.post(`${baseURL}/token/generate-access-token`, {
          token: refreshToken,
        });

        if (response.data.success && response.data.data) {
          const { access_token, refresh_token } = response.data.data;
          
          localStorage.setItem('access_token', access_token);
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
          }

          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

          processQueue(null, access_token);
          isRefreshing = false;
          
          return api(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Clear tokens and notify application to log out/redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
