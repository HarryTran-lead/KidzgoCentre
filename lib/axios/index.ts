/**
 * Axios Configuration with Interceptors
 * 
 * Centralized axios instance with request/response interceptors
 * for authentication, error handling, and logging.
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { buildApiUrl } from '@/constants/apiURL';
import { getAccessToken, setAccessToken, clearAccessToken, clearRefreshToken } from '@/lib/store/authToken';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ================= REQUEST INTERCEPTOR ================= */

axiosInstance.interceptors.request.use(
  (config) => {
    // Automatically attach access token if available
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/* ================= RESPONSE INTERCEPTOR ================= */

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Response Error]', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          buildApiUrl('/api/auth/refresh-token'),
          { refreshToken }
        );

        const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        clearAccessToken();
        clearRefreshToken();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn('[API] Access forbidden - insufficient permissions');
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.warn('[API] Resource not found');
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('[API] Server error occurred');
    }

    return Promise.reject(error);
  }
);

/* ================= CRUD METHODS ================= */

/**
 * GET request
 */
export async function get<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.get<T>(url, config);
  return response.data;
}

/**
 * POST request
 */
export async function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.post<T>(url, data, config);
  return response.data;
}

/**
 * PUT request
 */
export async function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.put<T>(url, data, config);
  return response.data;
}

/**
 * PATCH request
 */
export async function patch<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.patch<T>(url, data, config);
  return response.data;
}

/**
 * DELETE request
 */
export async function del<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.delete<T>(url, config);
  return response.data;
}

/**
 * Custom request with full control
 */
export async function request<T = any>(
  config: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.request<T>(config);
  return response.data;
}

// Export axios instance for advanced usage
export default axiosInstance;
