// lib/roles.ts
export const ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  TEACHER: "TEACHER",
  USER: "USER",
  STUDENT: "STUDENT",
} as const;

export type Role = keyof typeof ROLES;

// Danh sách roles hợp lệ
export const ALL_ROLES = Object.values(ROLES) as readonly string[];

/** Mỗi role được phép vào những prefix nào trong /portal */
export const ACCESS_MAP: Record<Role, readonly string[]> = {
  ADMIN:   ["/portal/admin", "/portal/staff", "/portal/teacher", "/portal/student"],
  STAFF:   ["/portal/staff"],
  TEACHER: ["/portal/teacher"],
  USER:    ["/portal/student"],
  STUDENT: ["/portal/student"],
};
