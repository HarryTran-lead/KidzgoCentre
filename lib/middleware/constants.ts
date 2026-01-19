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
  "/portal/admin": ["Admin"],
  "/portal/staff-accountant": ["Staff_Accountant"],
  "/portal/staff-management": ["Staff_Manager"],
  "/portal/teacher": ["Teacher"],
  "/portal/student": ["Student"],
  "/portal/parent": ["Parent"],
} as const;

/**
 * Default redirect paths for each role after login
 */
export const ROLE_DEFAULT_PATHS: Record<string, string> = {
  Admin: "/portal/admin",
  Staff_Accountant: "/portal/staff-accountant",
  Staff_Manager: "/portal/staff-management",
  Teacher: "/portal/teacher",
  Student: "/portal/student",
  Parent: "/portal/parent",
} as const;

/**
 * Paths that redirect to portal based on user role
 */
export const ROLE_REDIRECT_PATHS = [
  "/portal",
  "/dashboard",
] as const;
