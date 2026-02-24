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
  // Ensure BASE_URL ends with /api if it doesn't already
  const baseUrl = BASE_URL || '';
  const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  return `${apiBase}${endpoint}`;
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
  GET_ALL: "/api/profiles",
   GET_CLASSES: () => `/api/students/classes`,

} as const;
export const STUDENT_CLASS_ENDPOINTS = {
  GET_BY_TOKEN: "/api/students/classes",
} as const;
export const BACKEND_STUDENT_ENDPOINTS = {
GET_ALL: () => `/profiles`,
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
  GET_ALL_PUBLIC: '/api/branches/all', // For all roles (staff, teacher, etc.)
  GET_BY_ID: (id: string) => `/api/branches/${id}`,
  CREATE: '/api/branches',
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

// Admin Endpoints (client-side -> Next.js API Routes)
export const ADMIN_ENDPOINTS = {
  CLASSES: '/api/classes',
  CLASSES_STATUS: (id: string) => `/api/classes/${id}/status`,
  PROGRAMS: '/api/programs',
  CLASSROOMS: '/api/classrooms',
  CLASSROOMS_TOGGLE_STATUS: (id: string) => `/api/classrooms/${id}/toggle-status`,
  SESSIONS: '/api/sessions',
} as const;

// Lead Endpoints (Client-side → Next.js API Routes)
export const LEAD_ENDPOINTS = {
  // Public endpoint - no authentication required
  CREATE_PUBLIC: '/api/leads/public',
  
  // Authenticated endpoints
  GET_ALL: '/api/leads',
  GET_BY_ID: (id: string) => `/api/leads/${id}`,
  CREATE: '/api/leads',
  UPDATE: (id: string) => `/api/leads/${id}`,
  ASSIGN: (id: string) => `/api/leads/${id}/assign`,
  SELF_ASSIGN: (id: string) => `/api/leads/${id}/self-assign`,
  UPDATE_STATUS: (id: string) => `/api/leads/${id}/status`,
  ADD_NOTE: (id: string) => `/api/leads/${id}/notes`,
  GET_ACTIVITIES: (id: string) => `/api/leads/${id}/activities`,
  GET_SLA: (id: string) => `/api/leads/${id}/sla`,
  
  // Children endpoints
  GET_CHILDREN: (leadId: string) => `/api/leads/${leadId}/children`,
  CREATE_CHILD: (leadId: string) => `/api/leads/${leadId}/children`,
  UPDATE_CHILD: (leadId: string, childId: string) => `/api/leads/${leadId}/children/${childId}`,
  DELETE_CHILD: (leadId: string, childId: string) => `/api/leads/${leadId}/children/${childId}`,
} as const;

// Backend Lead Endpoints (Next.js API Routes → Backend API)
export const BACKEND_LEAD_ENDPOINTS = {
  CREATE_PUBLIC: '/leads/public',
  GET_ALL: '/leads',
  GET_BY_ID: (id: string) => `/leads/${id}`,
  CREATE: '/leads',
  UPDATE: (id: string) => `/leads/${id}`,
  ASSIGN: (id: string) => `/leads/${id}/assign`,
  SELF_ASSIGN: (id: string) => `/leads/${id}/self-assign`,
  UPDATE_STATUS: (id: string) => `/leads/${id}/status`,
  ADD_NOTE: (id: string) => `/leads/${id}/notes`,
  GET_ACTIVITIES: (id: string) => `/leads/${id}/activities`,
  GET_SLA: (id: string) => `/leads/${id}/sla`,
  
  // Children endpoints
  GET_CHILDREN: (leadId: string) => `/leads/${leadId}/children`,
  CREATE_CHILD: (leadId: string) => `/leads/${leadId}/children`,
  UPDATE_CHILD: (leadId: string, childId: string) => `/leads/${leadId}/children/${childId}`,
  DELETE_CHILD: (leadId: string, childId: string) => `/leads/${leadId}/children/${childId}`,
} as const;

// Placement Test Endpoints (Client-side → Next.js API Routes)
export const PLACEMENT_TEST_ENDPOINTS = {
  GET_ALL: '/api/placement-tests',
  GET_BY_ID: (id: string) => `/api/placement-tests/${id}`,
  CREATE: '/api/placement-tests',
  UPDATE: (id: string) => `/api/placement-tests/${id}`,
  CANCEL: (id: string) => `/api/placement-tests/${id}/cancel`,
  NO_SHOW: (id: string) => `/api/placement-tests/${id}/no-show`,
  UPDATE_RESULTS: (id: string) => `/api/placement-tests/${id}/results`,
  ADD_NOTE: (id: string) => `/api/placement-tests/${id}/notes`,
  CONVERT_TO_ENROLLED: (id: string) => `/api/placement-tests/${id}/convert-to-enrolled`,
} as const;

// Backend Placement Test Endpoints (Next.js API Routes → Backend API)
export const BACKEND_PLACEMENT_TEST_ENDPOINTS = {
  GET_ALL: '/placement-tests',
  GET_BY_ID: (id: string) => `/placement-tests/${id}`,
  CREATE: '/placement-tests',
  UPDATE: (id: string) => `/placement-tests/${id}`,
  CANCEL: (id: string) => `/placement-tests/${id}/cancel`,
  NO_SHOW: (id: string) => `/placement-tests/${id}/no-show`,
  UPDATE_RESULTS: (id: string) => `/placement-tests/${id}/results`,
  ADD_NOTE: (id: string) => `/placement-tests/${id}/notes`,
  CONVERT_TO_ENROLLED: (id: string) => `/placement-tests/${id}/convert-to-enrolled`,
} as const;

// Enrollment Endpoints (Client-side → Next.js API Routes)
export const ENROLLMENT_ENDPOINTS = {
  GET_ALL: '/api/enrollments',
  GET_BY_ID: (id: string) => `/api/enrollments/${id}`,
  CREATE: '/api/enrollments',
  UPDATE: (id: string) => `/api/enrollments/${id}`,
  PAUSE: (id: string) => `/api/enrollments/${id}/pause`,
  DROP: (id: string) => `/api/enrollments/${id}/drop`,
  REACTIVATE: (id: string) => `/api/enrollments/${id}/reactivate`,
  ASSIGN_TUITION_PLAN: (id: string) => `/api/enrollments/${id}/assign-tuition-plan`,
  STUDENT_HISTORY: (studentProfileId: string) => `/api/enrollments/student/${studentProfileId}/history`,
} as const;

// Backend Enrollment Endpoints (Next.js API Routes → Backend API)
export const BACKEND_ENROLLMENT_ENDPOINTS = {
  GET_ALL: '/enrollments',
  GET_BY_ID: (id: string) => `/enrollments/${id}`,
  CREATE: '/enrollments',
  UPDATE: (id: string) => `/enrollments/${id}`,
  PAUSE: (id: string) => `/enrollments/${id}/pause`,
  DROP: (id: string) => `/enrollments/${id}/drop`,
  REACTIVATE: (id: string) => `/enrollments/${id}/reactivate`,
  ASSIGN_TUITION_PLAN: (id: string) => `/enrollments/${id}/assign-tuition-plan`,
  STUDENT_HISTORY: (studentProfileId: string) => `/enrollments/student/${studentProfileId}/history`,
} as const;

// Profile Management Endpoints (Client-side → Next.js API Routes)
export const PROFILE_ENDPOINTS = {
  GET_ALL: '/api/profiles',
  GET_BY_ID: (id: string) => `/api/profiles/${id}`,
  CREATE: '/api/profiles',
  UPDATE: (id: string) => `/api/profiles/${id}`,
  DELETE: (id: string) => `/api/profiles/${id}`,
  LINK: '/api/profiles/link',
  UNLINK: '/api/profiles/unlink',
} as const;

// Backend Profile Endpoints (Next.js API Routes → Backend API)
export const BACKEND_PROFILE_ENDPOINTS = {
  GET_ALL: '/profiles',
  GET_BY_ID: (id: string) => `/profiles/${id}`,
  CREATE: '/profiles',
  UPDATE: (id: string) => `/profiles/${id}`,
  DELETE: (id: string) => `/profiles/${id}`,
  LINK: '/profiles/link',
  UNLINK: '/profiles/unlink',
} as const;

// Backend Admin Endpoints (Next.js API Routes → Backend API)
// Note: buildApiUrl automatically adds /api prefix, so endpoints here should NOT include /api
export const BACKEND_ADMIN_ENDPOINTS = {
  CLASSES: '/classes',
  CLASSES_BY_ID: (id: string) => `/classes/${id}`,
  CLASSES_STATUS: (id: string) => `/classes/${id}/status`,
  PROGRAMS: '/programs',
  PROGRAMS_BY_ID: (id: string) => `/programs/${id}`,
  PROGRAMS_TOGGLE_STATUS: (id: string) => `/programs/${id}/toggle-status`,
  CLASSROOMS: '/classrooms',
  CLASSROOMS_BY_ID: (id: string) => `/classrooms/${id}`,
  CLASSROOMS_TOGGLE_STATUS: (id: string) => `/classrooms/${id}/toggle-status`,
  SESSIONS: '/sessions',
} as const;

