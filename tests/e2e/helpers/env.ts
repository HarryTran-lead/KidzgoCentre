export type RoleKey =
  | "admin"
  | "staff"
  | "teacher"
  | "parent"
  | "student"
  | "accountant";

export type Credentials = {
  email: string;
  password: string;
};

const fallbackAccounts: Record<RoleKey, Credentials> = {
  admin: {
    email: "admin@gmail.com",
    password: "123456",
  },
  staff: {
    email: "staffq9@gmail.com",
    password: "123456",
  },
  teacher: {
    email: "teacher2@gmail.com",
    password: "123456",
  },
  parent: {
    email: "thinhtdse182756@fpt.edu.vn",
    password: "123456",
  },
  student: {
    email: process.env.E2E_STUDENT_EMAIL || "",
    password: process.env.E2E_STUDENT_PASSWORD || "",
  },
  accountant: {
    email: process.env.E2E_ACCOUNTANT_EMAIL || "",
    password: process.env.E2E_ACCOUNTANT_PASSWORD || "",
  },
};

const envMap: Record<RoleKey, { email: string; password: string }> = {
  admin: {
    email: "E2E_ADMIN_EMAIL",
    password: "E2E_ADMIN_PASSWORD",
  },
  staff: {
    email: "E2E_STAFF_EMAIL",
    password: "E2E_STAFF_PASSWORD",
  },
  teacher: {
    email: "E2E_TEACHER_EMAIL",
    password: "E2E_TEACHER_PASSWORD",
  },
  parent: {
    email: "E2E_PARENT_EMAIL",
    password: "E2E_PARENT_PASSWORD",
  },
  student: {
    email: "E2E_STUDENT_EMAIL",
    password: "E2E_STUDENT_PASSWORD",
  },
  accountant: {
    email: "E2E_ACCOUNTANT_EMAIL",
    password: "E2E_ACCOUNTANT_PASSWORD",
  },
};

export function getCredentials(role: RoleKey): Credentials {
  const envVars = envMap[role];
  const email = process.env[envVars.email] || fallbackAccounts[role].email;
  const password = process.env[envVars.password] || fallbackAccounts[role].password;
  return { email, password };
}

export function hasCredentials(role: RoleKey): boolean {
  const creds = getCredentials(role);
  return Boolean(creds.email && creds.password);
}
