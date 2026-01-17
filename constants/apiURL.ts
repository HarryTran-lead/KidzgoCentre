// Base URL from environment variable
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${BASE_URL}${endpoint}`;
};

// Authentication Endpoints
export const AUTH_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  CHANGE_PASSWORD: '/api/auth/change-password',
  GET_PROFILES: '/api/auth/profiles',
  FORGET_PASSWORD: '/api/auth/forget-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_PARENT_PIN: '/api/auth/profiles/verify-parent-pin',
  SELECT_STUDENT: '/api/auth/profiles/select-student',
  CHANGE_PIN: '/api/auth/change-pin',
  REQUEST_PIN_RESET: '/api/auth/profiles/request-pin-reset',
  
  // User
  ME: '/api/me',
  LOGOUT: '/api/me/logout',
} as const;
