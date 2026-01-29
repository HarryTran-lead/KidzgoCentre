// Base URL from environment variable
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Build full API URL for backend calls (from Next.js API Routes to Backend)
export const buildApiUrl = (endpoint: string): string => {
  return `${BASE_URL}${endpoint}`;
};

// Build client API URL (from browser to Next.js API Routes)
export const buildClientApiUrl = (endpoint: string): string => {
  return endpoint; // Just return the endpoint, will be relative to current domain
};

// Authentication Endpoints (Client-side → Next.js API Routes)
export const AUTH_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  CHANGE_PASSWORD: '/api/auth/change-password',
  GET_PROFILES: '/api/auth/profile',
  FORGET_PASSWORD: '/api/auth/forget-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_PARENT_PIN: '/api/auth/profile/verify-parent-pin',
  SELECT_STUDENT: '/api/auth/profile/select-student',
  CHANGE_PIN: '/api/auth/change-pin',
  REQUEST_PIN_RESET: '/api/auth/profile/request-pin-reset',
  
  // User
  ME: '/api/auth/me',
  LOGOUT: '/api/auth/logout',
} as const;

// Backend Auth Endpoints (Next.js API Routes → Backend API)
export const BACKEND_AUTH_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REFRESH_TOKEN: '/auth/refresh-token',
  CHANGE_PASSWORD: '/auth/change-password',
  GET_PROFILES: '/auth/profiles',
  FORGET_PASSWORD: '/auth/forget-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_PARENT_PIN: '/auth/profiles/verify-parent-pin',
  SELECT_STUDENT: '/auth/profiles/select-student',
  CHANGE_PIN: '/auth/change-pin',
  REQUEST_PIN_RESET: '/auth/profiles/request-pin-reset',
  
  // User
  ME: '/me',
  LOGOUT: '/me/logout',
} as const;

// Branch Endpoints (Client-side → Next.js API Routes)
export const BRANCH_ENDPOINTS = {
  // CRUD Operations
  GET_ALL: '/api/branches',
  GET_BY_ID: (id: string) => `/api/branches/${id}`,
  CREATE: '/api/branches/create',
  UPDATE: (id: string) => `/api/branches/${id}`,
  DELETE: (id: string) => `/api/branches/${id}`,
  UPDATE_STATUS: (id: string) => `/api/branches/${id}/status`,
} as const;

// Backend Branch Endpoints (Next.js API Routes → Backend API)
export const BACKEND_BRANCH_ENDPOINTS = {
  GET_ALL: '/branches',
  GET_BY_ID: (id: string) => `/branches/${id}`,
  CREATE: '/branches',
  UPDATE: (id: string) => `/branches/${id}`,
  DELETE: (id: string) => `/branches/${id}`,
  UPDATE_STATUS: (id: string) => `/branches/${id}/status`,
} as const;

// User Management Endpoints (Client-side → Next.js API Routes)
export const USER_ENDPOINTS = {
  // CRUD Operations
  GET_ALL: '/api/admin/users',
  GET_BY_ID: (id: string) => `/api/admin/users/${id}`,
  CREATE: '/api/admin/users',
  UPDATE: (id: string) => `/api/admin/users/${id}`,
  DELETE: (id: string) => `/api/admin/users/${id}`,
  UPDATE_STATUS: (id: string) => `/api/admin/users/${id}/status`,
  
  // User-specific Operations
  ASSIGN_BRANCH: (id: string) => `/api/admin/users/${id}/assign-branch`,
  CHANGE_PIN: (id: string) => `/api/admin/users/${id}/change-pin`,
} as const;

// Backend User Management Endpoints (Next.js API Routes → Backend API)
export const BACKEND_USER_ENDPOINTS = {
  GET_ALL: '/admin/users',
  GET_BY_ID: (id: string) => `/admin/users/${id}`,
  CREATE: '/admin/users',
  UPDATE: (id: string) => `/admin/users/${id}`,
  DELETE: (id: string) => `/admin/users/${id}`,
  UPDATE_STATUS: (id: string) => `/admin/users/${id}/status`,
  ASSIGN_BRANCH: (id: string) => `/admin/users/${id}/assign-branch`,
  CHANGE_PIN: (id: string) => `/admin/users/${id}/change-pin`,
} as const;

// Teacher Endpoints
export const TEACHER_ENDPOINTS = {
  ENROLLMENTS: '/api/enrollments',
  TIMETABLE: '/api/teacher/timetable',
  ATTENDANCE: '/api/attendance',
  ATTENDANCE_STUDENTS: '/api/attendance/students',
  SESSIONS: '/api/sessions',
} as const;

// Admin Endpoints (client-side -> Next.js API Routes)
export const ADMIN_ENDPOINTS = {
  CLASSES: '/api/classes',
  PROGRAMS: '/api/programs',
  CLASSROOMS: '/api/classrooms',
  SESSIONS: '/api/sessions',
} as const;