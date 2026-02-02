// Base URL from environment variable
export const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// (Optional) root base nếu BASE_URL đang là .../api
const ROOT_BASE_URL = BASE_URL.replace(/\/api\/?$/, "");

// Build full API URL for backend calls (from Next.js API Routes to Backend)
export const buildApiUrl = (endpoint: string): string => {
  // endpoint là absolute url thì return luôn
  if (/^https?:\/\//i.test(endpoint)) return endpoint;

  const ep = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Các endpoint dạng /GetAll/... nằm ở root, không có /api
  const base = ep.startsWith("/GetAll/") ? ROOT_BASE_URL : BASE_URL;

  return `${base}${ep}`;
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
  GET_PROFILES: '/api/auth/profiles',
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

export const STUDENT_ENDPOINTS = {
  GET_ALL: "/api/students",

} as const;
export const STUDENT_CLASS_ENDPOINTS = {
  GET_BY_TOKEN: "/api/students/classes",
} as const;
export const BACKEND_STUDENT_ENDPOINTS = {
GET_ALL: () => `/GetAll/Students`,
} as const;

export const CLASS_ENDPOINTS = {
  GET_ALL: "/api/classes",
  GET_BY_ID: (id: string) => `/api/classes/${id}`,
} as const;

export const MAKEUP_CREDIT_ENDPOINTS = {
    STUDENTS: "/api/makeup-credits/students",
  GET_ALL: "/api/makeup-credits/all",
    GET_BY_ID: (id: string) => `/api/makeup-credits/${id}`,
  SUGGESTIONS: (id: string) => `/api/makeup-credits/${id}/suggestions`,
  USE: (id: string) => `/api/makeup-credits/${id}/use`,
} as const;
export const SESSION_ENDPOINTS = {
  GET_BY_ID: (id: string) => `/api/sessions/${id}`,
} as const;

// Next API → Backend
export const BACKEND_SESSION_ENDPOINTS = {
  GET_BY_ID: (id: string) => `/sessions/${id}`, // nếu backend bạn khác path thì sửa chỗ này
} as const;
export const BACKEND_CLASS_ENDPOINTS = {
  
  GET_ALL: () => "/classes",
  GET_BY_ID: (id: string) => `/classes/${id}`,
} as const;

export const BACKEND_MAKEUP_CREDIT_ENDPOINTS = {
    STUDENTS: "/makeup-credits/students",

  GET_ALL: "/makeup-credits/all",
    GET_BY_ID: (id: string) => `/makeup-credits/${id}`,

  SUGGESTIONS: (id: string) => `/makeup-credits/${id}/suggestions`,
  USE: (id: string) => `/makeup-credits/${id}/use`,
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

// Leave Request Endpoints (Client-side → Next.js API Routes)
export const LEAVE_REQUEST_ENDPOINTS = {
  GET_ALL: '/api/leave-requests',
  GET_BY_ID: (id: string) => `/api/leave-requests/${id}`,
  CREATE: '/api/leave-requests',
  APPROVE: (id: string) => `/api/leave-requests/${id}/approve`,
  REJECT: (id: string) => `/api/leave-requests/${id}/reject`,
} as const;

export const BACKEND_LEAVE_REQUEST_ENDPOINTS = {
  GET_ALL: '/leave-requests',
  GET_BY_ID: (id: string) => `/leave-requests/${id}`,
  CREATE: '/leave-requests',
  APPROVE: (id: string) => `/leave-requests/${id}/approve`,
  REJECT: (id: string) => `/leave-requests/${id}/reject`,
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
