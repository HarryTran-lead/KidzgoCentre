/**
 * Middleware Constants
 * 
 * Configuration for authentication and authorization rules
 */

/**
 * Public paths that don't require authentication
 */
export const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/contact",
  "/faqs",
  "/blogs",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
] as const;

/**
 * API routes that should be excluded from middleware checks
 */
export const API_ROUTES_WHITELIST = [
  "/api/auth/",
  "/api/public/",
] as const;

/**
 * Role-based access control mapping
 * Format: { path: allowedRoles[] }
 */
export const PROTECTED_ROUTES: Record<string, string[]> = {
  "/portal/admin": ["ADMIN"],
  "/portal/staff-accountant": ["STAFF_ACCOUNTANT"],
  "/portal/staff-management": ["STAFF_MANAGER"],
  "/portal/teacher": ["TEACHER"],
  "/portal/student": ["STUDENT"],
  "/portal/parent": ["PARENT"],
} as const;

/**
 * Default redirect paths for each role after login
 */
export const ROLE_DEFAULT_PATHS: Record<string, string> = {
  ADMIN: "/portal/admin",
  STAFF_ACCOUNTANT: "/portal/staff-accountant",
  STAFF_MANAGER: "/portal/staff-management",
  TEACHER: "/portal/teacher",
  STUDENT: "/portal/student",
  PARENT: "/portal/parent",
} as const;

/**
 * Paths that redirect to portal based on user role
 */
export const ROLE_REDIRECT_PATHS = [
  "/portal",
  "/dashboard",
] as const;
