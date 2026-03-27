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
  GET_ALL: "/api/profiles",
  GET_CLASSES: () => `/api/students/classes`,
} as const;

export const STUDENT_CLASS_ENDPOINTS = {
  GET_BY_TOKEN: "/api/students/classes",
} as const;

export const STUDENT_HOMEWORK_ENDPOINTS = {
  GET_MY_HOMEWORK: "/api/students/homework/my",
  GET_SUBMITTED: "/api/students/homework/submitted",
  GET_FEEDBACK_MY: "/api/students/homework/feedback/my",
  GET_BY_ID: (homeworkStudentId: string) => `/api/students/homework/${homeworkStudentId}`,
  SUBMIT: "/api/students/homework/submit",
  SUBMIT_MULTIPLE_CHOICE: "/api/students/homework/multiple-choice/submit",
} as const;

export const MISSION_ENDPOINTS = {
  BASE: "/api/missions",
  BY_ID: (id: string) => `/api/missions/${id}`,
  PROGRESS: (id: string) => `/api/missions/${id}/progress`,
} as const;

export const GAMIFICATION_ENDPOINTS = {
  STARS_ADD: "/api/gamification/stars/add",
  STARS_DEDUCT: "/api/gamification/stars/deduct",
  STARS_TRANSACTIONS: "/api/gamification/stars/transactions",
  STARS_BALANCE: "/api/gamification/stars/balance",
  STARS_BALANCE_ME: "/api/gamification/stars/balance/me",
  XP_ADD: "/api/gamification/xp/add",
  XP_DEDUCT: "/api/gamification/xp/deduct",
  LEVEL: "/api/gamification/level",
  LEVEL_ME: "/api/gamification/level/me",
  ATTENDANCE_STREAK: "/api/gamification/attendance-streak",
  ATTENDANCE_STREAK_CHECK_IN: "/api/gamification/attendance-streak/check-in",
  ATTENDANCE_STREAK_ME: "/api/gamification/attendance-streak/me",
  REWARD_STORE_ITEMS: "/api/gamification/reward-store/items",
  REWARD_STORE_ITEM_BY_ID: (id: string) => `/api/gamification/reward-store/items/${id}`,
  REWARD_STORE_ACTIVE: "/api/gamification/reward-store/items/active",
  REWARD_STORE_TOGGLE_STATUS: (id: string) =>
    `/api/gamification/reward-store/items/${id}/toggle-status`,
  REWARD_REDEMPTIONS: "/api/gamification/reward-redemptions",
  REWARD_REDEMPTION_BY_ID: (id: string) => `/api/gamification/reward-redemptions/${id}`,
  REWARD_REDEMPTIONS_ME: "/api/gamification/reward-redemptions/me",
  REWARD_REDEMPTION_APPROVE: (id: string) =>
    `/api/gamification/reward-redemptions/${id}/approve`,
  REWARD_REDEMPTION_CANCEL: (id: string) =>
    `/api/gamification/reward-redemptions/${id}/cancel`,
  REWARD_REDEMPTION_MARK_DELIVERED: (id: string) =>
    `/api/gamification/reward-redemptions/${id}/mark-delivered`,
  REWARD_REDEMPTION_CONFIRM_RECEIVED: (id: string) =>
    `/api/gamification/reward-redemptions/${id}/confirm-received`,
  REWARD_REDEMPTION_BATCH_DELIVER: "/api/gamification/reward-redemptions/batch-deliver",
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
  GET: "/api/makeup-credits",
  GET_ALL: "/api/makeup-credits/all",
  GET_BY_ID: (id: string) => `/api/makeup-credits/${id}`,
  SUGGESTIONS: (id: string) => `/api/makeup-credits/${id}/suggestions`,
  AVAILABLE_SESSIONS: (id: string) =>
    `/api/makeup-credits/${id}/parent/get-available-sessions`,
  USE: (id: string) => `/api/makeup-credits/${id}/use`,
  EXPIRE: (id: string) => `/api/makeup-credits/${id}/expire`,
  ALLOCATIONS: "/api/makeup-credits/allocations",
} as const;

export const SESSION_ENDPOINTS = {
  GET_BY_ID: (id: string) => `/api/sessions/${id}`,
} as const;

// Next API → Backend
export const BACKEND_SESSION_ENDPOINTS = {
  GET_ALL: '/sessions',
  GET_BY_ID: (id: string) => `/sessions/${id}`,
  CREATE: '/sessions',
  UPDATE: (id: string) => `/sessions/${id}`,
  DELETE: (id: string) => `/sessions/${id}`,
  GENERATE_FROM_PATTERN: '/sessions/generate-from-pattern',
} as const;

export const BACKEND_CLASS_ENDPOINTS = {
  GET_ALL: () => "/classes",
  GET_BY_ID: (id: string) => `/classes/${id}`,
} as const;

export const BACKEND_MAKEUP_CREDIT_ENDPOINTS = {
  STUDENTS: "/makeup-credits/students",
  GET: "/makeup-credits",
  GET_ALL: "/makeup-credits/all",
  GET_BY_ID: (id: string) => `/makeup-credits/${id}`,
  SUGGESTIONS: (id: string) => `/makeup-credits/${id}/suggestions`,
  AVAILABLE_SESSIONS: (id: string) =>
    `/makeup-credits/${id}/parent/get-available-sessions`,
  USE: (id: string) => `/makeup-credits/${id}/use`,
  EXPIRE: (id: string) => `/makeup-credits/${id}/expire`,
  ALLOCATIONS: "/makeup-credits/allocations",
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
  APPROVE_BULK: '/api/leave-requests/approve-bulk',
  REJECT: (id: string) => `/api/leave-requests/${id}/reject`,
  CANCEL: (id: string) => `/api/leave-requests/${id}/cancel`,
} as const;

export const BACKEND_LEAVE_REQUEST_ENDPOINTS = {
  GET_ALL: '/leave-requests',
  GET_BY_ID: (id: string) => `/leave-requests/${id}`,
  CREATE: '/leave-requests',
  APPROVE: (id: string) => `/leave-requests/${id}/approve`,
  APPROVE_BULK: '/leave-requests/approve-bulk',
  REJECT: (id: string) => `/leave-requests/${id}/reject`,
  CANCEL: (id: string) => `/leave-requests/${id}/cancel`,
} as const;

export const PAUSE_ENROLLMENT_ENDPOINTS = {
  GET_ALL: "/api/pause-enrollment-requests",
  GET_BY_ID: (id: string) => `/api/pause-enrollment-requests/${id}`,
  CREATE: "/api/pause-enrollment-requests",
  APPROVE: (id: string) => `/api/pause-enrollment-requests/${id}/approve`,
  APPROVE_BULK: "/api/pause-enrollment-requests/approve-bulk",
  REJECT: (id: string) => `/api/pause-enrollment-requests/${id}/reject`,
  CANCEL: (id: string) => `/api/pause-enrollment-requests/${id}/cancel`,
  OUTCOME: (id: string) => `/api/pause-enrollment-requests/${id}/outcome`,
} as const;

export const BACKEND_PAUSE_ENROLLMENT_ENDPOINTS = {
  GET_ALL: "/pause-enrollment-requests",
  GET_BY_ID: (id: string) => `/pause-enrollment-requests/${id}`,
  CREATE: "/pause-enrollment-requests",
  APPROVE: (id: string) => `/pause-enrollment-requests/${id}/approve`,
  APPROVE_BULK: "/pause-enrollment-requests/approve-bulk",
  REJECT: (id: string) => `/pause-enrollment-requests/${id}/reject`,
  CANCEL: (id: string) => `/pause-enrollment-requests/${id}/cancel`,
  OUTCOME: (id: string) => `/pause-enrollment-requests/${id}/outcome`,
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
  APPROVE: (id: string) => `/api/admin/users/${id}/approve`,
  APPROVE_PROFILES: '/api/admin/users/approve',
  PROFILE_REACTIVATE: (id: string) => `/api/admin/users/profile/${id}/reactivate`,
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
  APPROVE: (id: string) => `/admin/users/${id}/approve`,
  APPROVE_PROFILES: '/admin/users/approve',
  PROFILE_REACTIVATE: (id: string) => `/admin/users/profile/${id}/reactivate`,
} as const;

// Teacher Endpoints
export const TEACHER_ENDPOINTS = {
  CLASSES: '/api/teacher/classes',
  TIMETABLE: '/api/teacher/timetable',
  ENROLLMENTS: '/api/enrollments',
  ATTENDANCE: '/api/attendance',
  ATTENDANCE_STUDENTS: '/api/attendance/students',
  SESSIONS: '/api/sessions',
  SESSIONS_BY_ID: (id: string) => `/api/sessions/${id}`,
  HOMEWORK: '/api/homework',
  HOMEWORK_SUBMISSIONS: '/api/homework/submissions',
  SESSION_REPORTS: '/api/session-reports',
  SESSION_REPORT_BY_ID: (id: string) => `/api/session-reports/${id}`,
  SESSION_REPORT_SUBMIT: (id: string) => `/api/session-reports/${id}/submit`,
  SESSION_REPORT_APPROVE: (id: string) => `/api/session-reports/${id}/approve`,
  SESSION_REPORT_REJECT: (id: string) => `/api/session-reports/${id}/reject`,
  SESSION_REPORT_PUBLISH: (id: string) => `/api/session-reports/${id}/publish`,
  SESSION_REPORT_TEACHER_MONTHLY: (teacherUserId: string) =>
    `/api/session-reports/teachers/${teacherUserId}/monthly`,
  SESSION_REPORT_AI_ENHANCE_FEEDBACK: '/api/session-reports/ai/enhance-feedback',
} as const;

// Monthly Report Endpoints (Client-side → Next.js API Routes)
export const MONTHLY_REPORT_ENDPOINTS = {
  BASE: '/api/monthly-reports',
  JOBS: '/api/monthly-reports/jobs',
  JOB_BY_ID: (jobId: string) => `/api/monthly-reports/jobs/${jobId}`,
  AGGREGATE_JOB: (jobId: string) => `/api/monthly-reports/jobs/${jobId}/aggregate`,
  REPORT_BY_ID: (reportId: string) => `/api/monthly-reports/${reportId}`,
  GENERATE_DRAFT: (reportId: string) => `/api/monthly-reports/${reportId}/generate-draft`,
  UPDATE_DRAFT: (reportId: string) => `/api/monthly-reports/${reportId}/draft`,
  SUBMIT: (reportId: string) => `/api/monthly-reports/${reportId}/submit`,
  COMMENTS: (reportId: string) => `/api/monthly-reports/${reportId}/comments`,
  APPROVE: (reportId: string) => `/api/monthly-reports/${reportId}/approve`,
  REJECT: (reportId: string) => `/api/monthly-reports/${reportId}/reject`,
  PUBLISH: (reportId: string) => `/api/monthly-reports/${reportId}/publish`,
  GENERATE_PDF: (reportId: string) => `/api/monthly-reports/${reportId}/generate-pdf`,
} as const;

// Admin Endpoints (client-side -> Next.js API Routes)
export const ADMIN_ENDPOINTS = {
  CLASSES: '/api/classes',
  CLASSES_STATUS: (id: string) => `/api/classes/${id}/status`,
  PROGRAMS: '/api/programs',
  PROGRAMS_MONTHLY_LEAVE_LIMIT: (id: string) => `/api/programs/${id}/monthly-leave-limit`,
  REGISTRATIONS: '/api/registrations',
  TUITION_PLANS: '/api/tuition-plans',
  TUITION_PLANS_ACTIVE: '/api/tuition-plans/active',
  TUITION_PLANS_BY_ID: (id: string) => `/api/tuition-plans/${id}`,
  TUITION_PLANS_TOGGLE_STATUS: (id: string) => `/api/tuition-plans/${id}/toggle-status`,
  CLASSROOMS: '/api/classrooms',
  CLASSROOMS_TOGGLE_STATUS: (id: string) => `/api/classrooms/${id}/toggle-status`,
  SESSIONS: '/api/sessions',
  SESSIONS_GENERATE_FROM_PATTERN: '/api/sessions/generate-from-pattern',
  LESSON_PLAN_TEMPLATES: '/api/lesson-plan-templates',
  LESSON_PLAN_TEMPLATES_BY_ID: (id: string) => `/api/lesson-plan-templates/${id}`,
  LESSON_PLANS: '/api/lesson-plans',
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

// Registration Endpoints (Client-side -> Next.js API Routes)
export const REGISTRATION_ENDPOINTS = {
  GET_ALL: '/api/registrations',
  GET_BY_ID: (id: string) => `/api/registrations/${id}`,
  CREATE: '/api/registrations',
  UPDATE: (id: string) => `/api/registrations/${id}`,
  CANCEL: (id: string) => `/api/registrations/${id}/cancel`,
  SUGGEST_CLASSES: (id: string) => `/api/registrations/${id}/suggest-classes`,
  ASSIGN_CLASS: (id: string) => `/api/registrations/${id}/assign-class`,
  WAITING_LIST: '/api/registrations/waiting-list',
  TRANSFER_CLASS: (id: string) => `/api/registrations/${id}/transfer-class`,
  UPGRADE: (id: string) => `/api/registrations/${id}/upgrade`,
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

// Backend Registration Endpoints (Next.js API Routes -> Backend API)
export const BACKEND_REGISTRATION_ENDPOINTS = {
  GET_ALL: '/registrations',
  GET_BY_ID: (id: string) => `/registrations/${id}`,
  CREATE: '/registrations',
  UPDATE: (id: string) => `/registrations/${id}`,
  CANCEL: (id: string) => `/registrations/${id}/cancel`,
  SUGGEST_CLASSES: (id: string) => `/registrations/${id}/suggest-classes`,
  ASSIGN_CLASS: (id: string) => `/registrations/${id}/assign-class`,
  WAITING_LIST: '/registrations/waiting-list',
  TRANSFER_CLASS: (id: string) => `/registrations/${id}/transfer-class`,
  UPGRADE: (id: string) => `/registrations/${id}/upgrade`,
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
  REACTIVATE: (id: string) => `/api/profiles/${id}/reactivate`,
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
  REACTIVATE: (id: string) => `/profiles/${id}/reactivate`,
} as const;

// Backend Admin Endpoints (Next.js API Routes → Backend API)
export const BACKEND_ADMIN_ENDPOINTS = {
  CLASSES: '/classes',
  CLASSES_BY_ID: (id: string) => `/classes/${id}`,
  CLASSES_STATUS: (id: string) => `/classes/${id}/status`,
  PROGRAMS: '/programs',
  REGISTRATIONS: '/registrations',
  PROGRAMS_BY_ID: (id: string) => `/programs/${id}`,
  PROGRAMS_MONTHLY_LEAVE_LIMIT: (id: string) => `/programs/${id}/monthly-leave-limit`,
  PROGRAMS_TOGGLE_STATUS: (id: string) => `/programs/${id}/toggle-status`,
  TUITION_PLANS: '/tuition-plans',
  TUITION_PLANS_ACTIVE: '/tuition-plans/active',
  TUITION_PLANS_BY_ID: (id: string) => `/tuition-plans/${id}`,
  TUITION_PLANS_TOGGLE_STATUS: (id: string) => `/tuition-plans/${id}/toggle-status`,
  CLASSROOMS: '/classrooms',
  CLASSROOMS_BY_ID: (id: string) => `/classrooms/${id}`,
  CLASSROOMS_TOGGLE_STATUS: (id: string) => `/classrooms/${id}/toggle-status`,
  SESSIONS: '/sessions',
} as const;

// Blog Endpoints (Client-side → Next.js API Routes)
export const BLOG_ENDPOINTS = {
  // CRUD Operations
  GET_ALL: '/api/blogs',
  GET_BY_ID: (id: string) => `/api/blogs/${id}`,
  CREATE: '/api/blogs',
  UPDATE: (id: string) => `/api/blogs/${id}`,
  DELETE: (id: string) => `/api/blogs/${id}`,
  
  // Blog-specific Operations
  PUBLISH: (id: string) => `/api/blogs/${id}/publish`,
  UNPUBLISH: (id: string) => `/api/blogs/${id}/unpublish`,
  GET_PUBLISHED: '/api/blogs/published',
} as const;

// Backend Blog Endpoints (Next.js API Routes → Backend API)
export const BACKEND_BLOG_ENDPOINTS = {
  GET_ALL: '/blogs',
  GET_BY_ID: (id: string) => `/blogs/${id}`,
  CREATE: '/blogs',
  UPDATE: (id: string) => `/blogs/${id}`,
  DELETE: (id: string) => `/blogs/${id}`,
  PUBLISH: (id: string) => `/blogs/${id}/publish`,
  UNPUBLISH: (id: string) => `/blogs/${id}/unpublish`,
  GET_PUBLISHED: '/blogs/published',
} as const;
// Backend Monthly Report Endpoints (Next.js API Routes → Backend API)
export const BACKEND_MONTHLY_REPORT_ENDPOINTS = {
  BASE: '/monthly-reports',
  JOBS: '/monthly-reports/jobs',
  JOB_BY_ID: (jobId: string) => `/monthly-reports/jobs/${jobId}`,
  AGGREGATE_JOB: (jobId: string) => `/monthly-reports/jobs/${jobId}/aggregate`,
  REPORT_BY_ID: (reportId: string) => `/monthly-reports/${reportId}`,
  GENERATE_DRAFT: (reportId: string) => `/monthly-reports/${reportId}/generate-draft`,
  UPDATE_DRAFT: (reportId: string) => `/monthly-reports/${reportId}/draft`,
  SUBMIT: (reportId: string) => `/monthly-reports/${reportId}/submit`,
  COMMENTS: (reportId: string) => `/monthly-reports/${reportId}/comments`,
  APPROVE: (reportId: string) => `/monthly-reports/${reportId}/approve`,
  REJECT: (reportId: string) => `/monthly-reports/${reportId}/reject`,
  PUBLISH: (reportId: string) => `/monthly-reports/${reportId}/publish`,
  GENERATE_PDF: (reportId: string) => `/monthly-reports/${reportId}/generate-pdf`,
} as const;

// Backend Session Report Endpoints
export const BACKEND_SESSION_REPORT_ENDPOINTS = {
  BASE: '/session-reports',
  REPORT_BY_ID: (id: string) => `/session-reports/${id}`,
  SUBMIT: (id: string) => `/session-reports/${id}/submit`,
  APPROVE: (id: string) => `/session-reports/${id}/approve`,
  REJECT: (id: string) => `/session-reports/${id}/reject`,
  PUBLISH: (id: string) => `/session-reports/${id}/publish`,
  TEACHER_MONTHLY: (teacherUserId: string) =>
    `/session-reports/teachers/${teacherUserId}/monthly`,
  AI_ENHANCE_FEEDBACK: '/session-reports/ai/enhance-feedback',
} as const;

// Ticket Endpoints (Client-side → Next.js API Routes)
export const TICKET_ENDPOINTS = {
  GET_ALL: '/api/tickets',
  GET_BY_ID: (id: string) => `/api/tickets/${id}`,
  CREATE: '/api/tickets',
  ASSIGN: (id: string) => `/api/tickets/${id}/assign`,
  UPDATE_STATUS: (id: string) => `/api/tickets/${id}/status`,
  ADD_COMMENT: (id: string) => `/api/tickets/${id}/comments`,
  GET_HISTORY: (id: string) => `/api/tickets/${id}/history`,
  GET_SLA: (id: string) => `/api/tickets/${id}/sla`,
} as const;

// Backend Ticket Endpoints (Next.js API Routes → Backend API)
export const BACKEND_TICKET_ENDPOINTS = {
  GET_ALL: '/tickets',
  GET_BY_ID: (id: string) => `/tickets/${id}`,
  CREATE: '/tickets',
  ASSIGN: (id: string) => `/tickets/${id}/assign`,
  UPDATE_STATUS: (id: string) => `/tickets/${id}/status`,
  ADD_COMMENT: (id: string) => `/tickets/${id}/comments`,
  GET_HISTORY: (id: string) => `/tickets/${id}/history`,
  GET_SLA: (id: string) => `/tickets/${id}/sla`,
} as const;

// File Endpoints (Client-side → Next.js API Routes)
export const FILE_ENDPOINTS = {
  UPLOAD: '/api/files/upload',
  DELETE: '/api/files',
  TRANSFORM: '/api/files/transform',
} as const;

// Backend File Endpoints (Next.js API Routes → Backend API)
export const BACKEND_FILE_ENDPOINTS = {
  UPLOAD: '/files/upload',
  DELETE: '/files',
  TRANSFORM: '/files/transform',
} as const;

// Dashboard Overview Endpoints (Client-side → Next.js API Routes)
export const OVERVIEW_ENDPOINTS = {
  ADMIN: '/api/me/admin/overview',
} as const;

// Backend Dashboard Overview Endpoints (Next.js API Routes → Backend API)
export const BACKEND_OVERVIEW_ENDPOINTS = {
  ADMIN: '/me/admin/overview',
} as const;

// Dashboard Endpoints (Client-side → Next.js API Routes)
export const DASHBOARD_ENDPOINTS = {
  OVERALL: '/api/dashboard/overall',
  STUDENT: '/api/dashboard/student',
  ACADEMIC: '/api/dashboard/academic',
  FINANCE: '/api/dashboard/finance',
  HR: '/api/dashboard/hr',
  LEADS: '/api/dashboard/leads',
} as const;

// Backend Dashboard Endpoints (Next.js API Routes → Backend API)
export const BACKEND_DASHBOARD_ENDPOINTS = {
  OVERALL: '/dashboard/overall',
  STUDENT: '/dashboard/student',
  ACADEMIC: '/dashboard/academic',
  FINANCE: '/dashboard/finance',
  HR: '/dashboard/hr',
  LEADS: '/dashboard/leads',
} as const;

// Parent Endpoints (Client-side -> Next.js API Routes)
export const PARENT_ENDPOINTS = {
  TIMETABLE: "/api/parent/timetable",
  OVERVIEW: "/api/parent/overview",
} as const;

// Backend Parent Endpoints (Next.js API Routes -> Backend API)
export const BACKEND_PARENT_ENDPOINTS = {
  TIMETABLE: "/parent/timetable",
  OVERVIEW: "/parent/overview",
} as const;

export const NOTIFICATION_ENDPOINTS = {
  BASE: "/api/notifications",
  BROADCAST: "/api/notifications/broadcast",
  MARK_READ: (id: string) => `/api/notifications/${id}/read`,
  RETRY: (id: string) => `/api/notifications/${id}/retry`,
  DEVICE_TOKEN: "/api/notifications/device-token",
  TEMPLATES: "/api/notifications/templates",
  TEMPLATE_BY_ID: (id: string) => `/api/notifications/templates/${id}`,
} as const;

export const BACKEND_NOTIFICATION_ENDPOINTS = {
  BASE: "/notifications",
  BROADCAST: "/notifications/broadcast",
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  RETRY: (id: string) => `/notifications/${id}/retry`,
  DEVICE_TOKEN: "/notifications/device-token",
  TEMPLATES: "/notifications/templates",
  TEMPLATE_BY_ID: (id: string) => `/notifications/templates/${id}`,
} as const;
