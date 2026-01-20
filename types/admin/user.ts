import { ApiResponse } from "../apiResponse";

// ==================== Enums ====================

export type UserRole = "Admin" | "Parent" | "Staff" | "Teacher";

// ==================== Request Interfaces ====================

// Create User Request
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  branchId?: string;
}

// Update User Request
export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  userName?: string;
  phone?: string;
  branchId?: string;
  dateOfBirth?: string;
  address?: string;
  avatarUrl?: string;
  role?: UserRole;
  isActive?: boolean;
}

// Assign Branch Request
export interface AssignBranchRequest {
  branchId: string;
}

// Change User PIN Request (for Admin)
export interface ChangeUserPinRequest {
  newPin: string;
}

// Update User Status Request
export interface UpdateUserStatusRequest {
  isActive: boolean;
}

// Get All Users Query Params
export interface GetAllUsersParams {
  page?: number;
  limit?: number;
  pageNumber?: number; // Alternative pagination param from backend
  pageSize?: number;   // Alternative pagination param from backend
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  branchId?: string;
  sortBy?: "fullName" | "email" | "role" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

// ==================== Response Interfaces ====================

// User Entity
export interface User {
  id: string;
  email: string;
  userName: string;
  name: string;
  role: UserRole;
  branchId?: string;
  branchCode?: string;
  branchName?: string;
  branchAddress?: string;
  branchContactPhone?: string;
  branchContactEmail?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;

  // Additional info (may be included in detailed view)
  branch?: {
    id: string;
    code: string;
    name: string;
    address: string;
  };

  // Statistics for specific roles
  stats?: {
    // For Teachers
    totalClasses?: number;
    totalStudents?: number;

    // For Parents
    totalChildren?: number;

    // For Staff
    assignedTasks?: number;
  };

  // Profiles (for Parent role)
  profiles?: {
    id: string;
    profileType: "Parent" | "Student";
    displayName: string;
    isActive: boolean;
    createdAt: string;
    hasPinSetup?: boolean;
    avatarUrl?: string;
  }[];
}

// Get All Users Response
export interface GetAllUsersResponse {
  items: User[]; // Changed from 'users' to 'items' to match actual API response
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  // Pagination fields directly in response (alternative format)
  pageNumber?: number;
  totalCount?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  summary?: {
    totalAdmins: number;
    totalParents: number;
    totalStaff: number;
    totalTeachers: number;
    totalActive: number;
    totalInactive: number;
  };
}

// Get User By ID Response
export interface GetUserByIdResponse {
  user: User;
}

// Create User Response
export interface CreateUserResponse {
  user: User;
  message: string;
  credentials?: {
    email: string;
    temporaryPassword?: string;
  };
}

// Update User Response
export interface UpdateUserResponse {
  user: User;
  message: string;
}

// Delete User Response
export interface DeleteUserResponse {
  message: string;
}

// Assign Branch Response
export interface AssignBranchResponse {
  user: User;
  message: string;
}

// Change User PIN Response
export interface ChangeUserPinResponse {
  message: string;
  success: boolean;
}

// Update User Status Response
export interface UpdateUserStatusResponse {
  user: User;
  message: string;
}

// ==================== API Response Types ====================

export type GetAllUsersApiResponse = ApiResponse<GetAllUsersResponse>;
export type GetUserByIdApiResponse = ApiResponse<GetUserByIdResponse>;
export type CreateUserApiResponse = ApiResponse<CreateUserResponse>;
export type UpdateUserApiResponse = ApiResponse<UpdateUserResponse>;
export type DeleteUserApiResponse = ApiResponse<DeleteUserResponse>;
export type AssignBranchApiResponse = ApiResponse<AssignBranchResponse>;
export type ChangeUserPinApiResponse = ApiResponse<ChangeUserPinResponse>;
export type UpdateUserStatusApiResponse = ApiResponse<UpdateUserStatusResponse>;
