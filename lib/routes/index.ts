// @/lib/routes
export const EndPoint = {
  HOME: "/",
  LOGIN: "/auth/login",
  FORGOTPASSWORD: "/auth/forgotpass",

  // Portal
  ADMIN: "/portal/admin",
  STAFF_ACCOUNTANT: "/portal/staff-accountant",
  STAFF_MANAGER: "/portal/staff-management",
  TEACHER: "/portal/teacher",
  STUDENT: "/portal/student",
} as const;
