import { randomUUID } from "crypto";

export type ProfileType = "Student" | "Parent";

export type Profile = {
  id: string;
  displayName: string;
  profileType: ProfileType;
  email?: string | null;
};

export type Branch = {
  id: string;
  code: string;
  name: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
};

export type UserRecord = {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  role: string;
  branchId: string;
  branch: Branch;
  profiles: Profile[];
  selectedProfileId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  password: string;
  parentPin: string;
};

export type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

const ACCESS_TOKEN_TTL_SECONDS = 3600;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

const BRANCH: Branch = {
  id: "branch-hn-001",
  code: "HN001",
  name: "Chi nhánh Hà Nội",
  address: "123 Đường ABC",
  contactPhone: "0123456789",
  contactEmail: "hanoi@kidzgo.com",
  isActive: true,
};

const USER_PROFILES: Profile[] = [
  {
    id: "profile-student-01",
    displayName: "Test Student 01",
    profileType: "Student",
  },
  {
    id: "profile-parent-01",
    displayName: "Test Parent 01",
    profileType: "Parent",
    email: "parent@kidzgo.com",
  },
];

const USERS = new Map<string, UserRecord>([
  [
    "user-admin-01",
    {
      id: "user-admin-01",
      userName: "admin@kidzgo.vn",
      fullName: "Admin User",
      email: "admin@kidzgo.vn",
      role: "ADMIN",
      branchId: BRANCH.id,
      branch: BRANCH,
      profiles: USER_PROFILES,
      selectedProfileId: null,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      password: "admin123",
      parentPin: "1234",
    },
  ],
  [
    "user-manager-01",
    {
      id: "user-manager-01",
      userName: "manager@kidzgo.vn",
      fullName: "Manager User",
      email: "manager@kidzgo.vn",
      role: "STAFF_MANAGER",
      branchId: BRANCH.id,
      branch: BRANCH,
      profiles: USER_PROFILES,
      selectedProfileId: null,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      password: "manager123",
      parentPin: "1234",
    },
  ],
  [
    "user-accountant-01",
    {
      id: "user-accountant-01",
      userName: "accountant@kidzgo.vn",
      fullName: "Accountant User",
      email: "accountant@kidzgo.vn",
      role: "STAFF_ACCOUNTANT",
      branchId: BRANCH.id,
      branch: BRANCH,
      profiles: USER_PROFILES,
      selectedProfileId: null,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      password: "accountant123",
      parentPin: "1234",
    },
  ],
  [
    "user-teacher-01",
    {
      id: "user-teacher-01",
      userName: "teacher@kidzgo.vn",
      fullName: "Teacher User",
      email: "teacher@kidzgo.vn",
      role: "TEACHER",
      branchId: BRANCH.id,
      branch: BRANCH,
      profiles: USER_PROFILES,
      selectedProfileId: null,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      password: "teacher123",
      parentPin: "1234",
    },
  ],
  [
    "user-parent-01",
    {
      id: "user-parent-01",
      userName: "parent@kidzgo.vn",
      fullName: "Parent User",
      email: "parent@kidzgo.vn",
      role: "PARENT",
      branchId: BRANCH.id,
      branch: BRANCH,
      profiles: USER_PROFILES,
      selectedProfileId: null,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      password: "parent123",
      parentPin: "1234",
    },
  ],
  [
    "user-student-01",
    {
      id: "user-student-01",
      userName: "student@kidzgo.vn",
      fullName: "Student User",
      email: "student@kidzgo.vn",
      role: "STUDENT",
      branchId: BRANCH.id,
      branch: BRANCH,
      profiles: USER_PROFILES,
      selectedProfileId: null,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      password: "student123",
      parentPin: "1234",
    },
  ],
]);

const ACCESS_TOKENS = new Map<string, { userId: string; expiresAt: number }>();
const REFRESH_TOKENS = new Map<string, { userId: string; expiresAt: number }>();

function nowTimestamp() {
  return Date.now();
}

function createToken(prefix: string) {
  return `${prefix}.${randomUUID()}`;
}

export function authenticateUser(email: string, password: string): UserRecord | null {
  const normalizedEmail = email.trim().toLowerCase();
  for (const user of USERS.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      if (user.password !== password) {
        return null;
      }
      return user;
    }
  }
  return null;
}

export function findUserByEmail(email: string): UserRecord | null {
  const normalizedEmail = email.trim().toLowerCase();
  for (const user of USERS.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      return user;
    }
  }
  return null;
}

export function issueTokens(userId: string): TokenBundle {
  const accessToken = createToken("access");
  const refreshToken = createToken("refresh");
  ACCESS_TOKENS.set(accessToken, {
    userId,
    expiresAt: nowTimestamp() + ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
  REFRESH_TOKENS.set(refreshToken, {
    userId,
    expiresAt: nowTimestamp() + REFRESH_TOKEN_TTL_SECONDS * 1000,
  });

  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export function rotateRefreshToken(refreshToken: string): TokenBundle | null {
  const record = REFRESH_TOKENS.get(refreshToken);
  if (!record) {
    return null;
  }
  if (record.expiresAt < nowTimestamp()) {
    REFRESH_TOKENS.delete(refreshToken);
    return null;
  }

  REFRESH_TOKENS.delete(refreshToken);
  return issueTokens(record.userId);
}

export function getUserByAccessToken(token: string | null): UserRecord | null {
  if (!token) {
    return null;
  }
  const record = ACCESS_TOKENS.get(token);
  if (!record) {
    return null;
  }
  if (record.expiresAt < nowTimestamp()) {
    ACCESS_TOKENS.delete(token);
    return null;
  }
  return USERS.get(record.userId) ?? null;
}

export function revokeUserTokens(userId: string) {
  for (const [token, record] of ACCESS_TOKENS.entries()) {
    if (record.userId === userId) {
      ACCESS_TOKENS.delete(token);
    }
  }
  for (const [token, record] of REFRESH_TOKENS.entries()) {
    if (record.userId === userId) {
      REFRESH_TOKENS.delete(token);
    }
  }
}

export function updatePassword(userId: string, newPassword: string) {
  const user = USERS.get(userId);
  if (!user) {
    return null;
  }
  const updatedAt = new Date().toISOString();
  user.password = newPassword;
  user.updatedAt = updatedAt;
  return user;
}

export function updateParentPin(userId: string, newPin: string) {
  const user = USERS.get(userId);
  if (!user) {
    return null;
  }
  const updatedAt = new Date().toISOString();
  user.parentPin = newPin;
  user.updatedAt = updatedAt;
  return user;
}

export function selectProfile(userId: string, profileId: string) {
  const user = USERS.get(userId);
  if (!user) {
    return null;
  }
  user.selectedProfileId = profileId;
  user.updatedAt = new Date().toISOString();
  return user;
}

export function findProfile(user: UserRecord, profileId: string) {
  return user.profiles.find((profile) => profile.id === profileId) ?? null;
}

export function getAccessTokenFromHeader(authorization: string | null): string | null {
  if (!authorization) {
    return null;
  }
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

export const AUTH_EXPIRES_IN = ACCESS_TOKEN_TTL_SECONDS;