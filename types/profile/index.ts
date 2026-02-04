/**
 * Profile Management Types
 * For Admin to manage Student and Parent profiles
 */

import { ApiResponse } from "../apiResponse";

// ==================== Enums ====================

export type ProfileType = "Parent" | "Student";

// ==================== Profile Interfaces ====================

export interface Profile {
  id: string;
  userId: string;
  profileType: ProfileType;
  displayName: string;
  userEmail?: string;
  pinHash?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParentProfile extends Profile {
  profileType: "Parent";
  linkedStudents?: StudentProfile[];
}

export interface StudentProfile extends Profile {
  profileType: "Student";
  parentProfileId?: string;
  parentProfile?: ParentProfile;
}

// ==================== Request Interfaces ====================

/**
 * Create Parent Profile Request
 * Creates a Parent profile linked to an existing user account
 */
export interface CreateParentAccountRequest {
  userId: string; // The user account ID used for login
  profileType: "Parent";
  displayName: string;
  pinHash: string; // PIN required for Parent
}

/**
 * Create Student Profile Request
 * Creates a Student profile linked to parent's user account
 */
export interface CreateStudentProfileRequest {
  userId: string; // Parent's user account ID (same as parent's userId)
  profileType: "Student";
  displayName: string;
  // No pinHash required for Student
}

/**
 * Link Student to Parent Request
 */
export interface LinkProfileRequest {
  parentProfileId: string;
  studentProfileId: string;
}

/**
 * Unlink Student from Parent Request
 */
export interface UnlinkProfileRequest {
  parentProfileId: string;
  studentProfileId: string;
}

/**
 * Update Profile Request
 */
export interface UpdateProfileRequest {
  displayName?: string;
  pinHash?: string;
  isActive?: boolean;
}

/**
 * Get All Students Query Params
 */
export interface GetAllStudentsParams {
  userId?: string; // Parent user ID to filter
  profileType?: ProfileType;
  isActive?: boolean;
  searchTerm?: string; // Search by display name
  branchId?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ==================== Response Interfaces ====================

/**
 * Create Profile Response
 */
export interface CreateProfileApiResponse extends ApiResponse<{
  id: string;
  userId: string;
  profileType: ProfileType;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}> {}

/**
 * Get Profile by ID Response
 */
export interface GetProfileByIdApiResponse extends ApiResponse<Profile> {}

/**
 * Get All Students Response
 */
export interface GetAllStudentsApiResponse extends ApiResponse<{
  items: Array<{
    id: string;
    userId: string;
    userEmail: string;
    profileType: ProfileType;
    displayName: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}> {}

/**
 * Update Profile Response
 */
export interface UpdateProfileApiResponse extends ApiResponse<Profile> {}

/**
 * Delete Profile Response
 */
export interface DeleteProfileApiResponse extends ApiResponse<null> {}

/**
 * Link Profiles Response
 */
export interface LinkProfilesApiResponse extends ApiResponse<{
  message: string;
  parentProfileId: string;
  studentProfileId: string;
}> {}

/**
 * Unlink Profiles Response
 */
export interface UnlinkProfilesApiResponse extends ApiResponse<{
  message: string;
  parentProfileId: string;
  studentProfileId: string;
}> {}
