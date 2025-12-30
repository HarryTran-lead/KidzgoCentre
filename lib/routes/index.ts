// @/lib/routes
export const EndPoint = {
  HOME: "/",
  LOGIN: "/auth/login/parent",
  LOGIN_STAFF: "/auth/login/management",
  FORGOTPASSWORD: "/auth/forgotpass",
  
  // HomePage
  CONTACT: "/contact",
  FAQS: "/faqs",
  BLOGS: "/blogs",

  // Portal
  ADMIN: "/portal/admin",
  STAFF_ACCOUNTANT: "/portal/staff-accountant",
  STAFF_MANAGER: "/portal/staff-management",
  TEACHER: "/portal/teacher",
  STUDENT: "/portal/student",
  PARENT: "/portal/parent",
} as const;
