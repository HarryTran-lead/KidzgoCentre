/**
 * Middleware Utilities
 * 
 * Helper functions for authentication and authorization in middleware
 */

import type { NextRequest } from "next/server";

/**
 * Extract token from request (cookie or header)
 */
export function extractToken(request: NextRequest): string | null {
  // Try cookie first (preferred for middleware)
  const tokenFromCookie = request.cookies.get("kidzgo.accessToken")?.value;
  if (tokenFromCookie) return tokenFromCookie;
  
  // Try Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Decode JWT payload without verification
 * Note: For production, use proper JWT verification library
 */
export function decodeJWT(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(payload: Record<string, any>): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Extract user info from JWT payload
 */
export function extractUserInfo(payload: Record<string, any>): {
  userId: string;
  role: string;
  email?: string;
} | null {
  const userId = payload.sub || payload.userId || payload.id || payload.user_id;
  const role = payload.role || payload.userRole || payload.user_role;
  
  if (!userId || !role) return null;
  
  return {
    userId,
    role,
    email: payload.email,
  };
}

/**
 * Normalize role to standard format
 */
export function normalizeRole(role: string): string {
  const normalized = role.toUpperCase().trim();
  
  const roleMap: Record<string, string> = {
    ADMIN: "ADMIN",
    ADMINISTRATOR: "ADMIN",
    
    ACCOUNTANT: "STAFF_ACCOUNTANT",
    ACCOUNTING: "STAFF_ACCOUNTANT",
    STAFF_ACCOUNTANT: "STAFF_ACCOUNTANT",
    
    MANAGER: "STAFF_MANAGER",
    MANAGEMENT: "STAFF_MANAGER",
    STAFF_MANAGER: "STAFF_MANAGER",
    STAFF_MANAGEMENT: "STAFF_MANAGER",
    STAFF: "STAFF_MANAGER",
    
    TEACHER: "TEACHER",
    INSTRUCTOR: "TEACHER",
    
    STUDENT: "STUDENT",
    USER: "STUDENT",
    LEARNER: "STUDENT",
    
    PARENT: "PARENT",
    GUARDIAN: "PARENT",
  };
  
  return roleMap[normalized] || normalized;
}

/**
 * Check if user has access to a path based on their role
 */
export function hasRoleAccess(
  userRole: string,
  requiredRoles: string[]
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  
  const normalizedUserRole = normalizeRole(userRole);
  
  return requiredRoles.some(
    (role) => normalizeRole(role) === normalizedUserRole || role === userRole
  );
}

/**
 * Get default portal path for a role
 */
export function getDefaultPortalPath(role: string): string {
  const normalized = normalizeRole(role);
  
  const pathMap: Record<string, string> = {
    ADMIN: "/portal/admin",
    STAFF_ACCOUNTANT: "/portal/staff-accountant",
    STAFF_MANAGER: "/portal/staff-management",
    TEACHER: "/portal/teacher",
    STUDENT: "/portal/student",
    PARENT: "/portal/parent",
  };
  
  return pathMap[normalized] || "/portal/student";
}

/**
 * Remove locale prefix from pathname
 * Example: /en/portal/admin -> /portal/admin
 */
export function removeLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");
}

/**
 * Check if path matches a pattern
 */
export function pathMatches(pathname: string, pattern: string): boolean {
  const normalizedPath = removeLocalePrefix(pathname);
  
  if (pattern === "/") {
    return normalizedPath === "/" || normalizedPath === "";
  }
  
  return normalizedPath.startsWith(pattern);
}
