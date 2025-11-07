export const ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  TEACHER: "TEACHER",
  USER: "USER",
  STUDENT: "STUDENT",
  ACCOUNTANT: "ACCOUNTANT",
  MANAGEMENT: "MANAGEMENT",
} as const;

export type Role = keyof typeof ROLES;

export const ALL_ROLES = Object.values(ROLES) as readonly string[];

export const ACCESS_MAP: Record<Role, readonly string[]> = {
  ADMIN:      ["/portal/admin", "/portal/staff", "/portal/teacher", "/portal/student", "/portal/accountant", "/portal/management"],
  STAFF:      ["/portal/staff"],
  TEACHER:    ["/portal/teacher"],
  USER:       ["/portal/student"],
  STUDENT:    ["/portal/student"],
  ACCOUNTANT: ["/portal/accountant"],
  MANAGEMENT: ["/portal/management"],
};
