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

    const payloadSegment = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const paddedPayload = payloadSegment.padEnd(
      Math.ceil(payloadSegment.length / 4) * 4,
      "="
    );

    const payload = JSON.parse(
      Buffer.from(paddedPayload, "base64").toString("utf-8")
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
  const userId =
    payload.sub ||
    payload.userId ||
    payload.UserId ||
    payload.id ||
    payload.user_id ||
    payload.nameid ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier"];

  const role =
    payload.role ||
    payload.Role ||
    payload.userRole ||
    payload.UserRole ||
    payload.user_role ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];

  if (!userId || !role) return null;

  return {
    userId: String(userId),
    role: String(role),
    email:
      payload.email ||
      payload.Email ||
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
  };
}

/**
 * Normalize role to standard format
 */
export function normalizeRole(role: string): string {
  const normalized = role.toUpperCase().trim();
  
  const roleMap: Record<string, string> = {
    ADMIN: "Admin",
    ADMINISTRATOR: "Admin",
    
    ACCOUNTANT: "Staff_Accountant",
    ACCOUNTING: "Staff_Accountant",
    STAFF_ACCOUNTANT: "Staff_Accountant",
    ACCOUNTANTSTAFF: "Staff_Accountant",
    
    MANAGER: "Staff_Manager",
    MANAGEMENT: "Staff_Manager",
    STAFF_MANAGER: "Staff_Manager",
    STAFF_MANAGEMENT: "Staff_Manager",
    MANAGEMENTSTAFF: "Staff_Manager",
    STAFF: "Staff_Manager",
    
    TEACHER: "Teacher",
    INSTRUCTOR: "Teacher",
    
    STUDENT: "Student",
    USER: "Student",
    LEARNER: "Student",
    
    PARENT: "Parent",
    GUARDIAN: "Parent",
  };
  
  return roleMap[normalized] || role;
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
    Admin: "/portal/admin",
    Staff_Accountant: "/portal/staff-accountant",
    Staff_Manager: "/portal/staff-management",
    Teacher: "/portal/teacher",
    Student: "/portal/student",
    Parent: "/portal/parent",
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
