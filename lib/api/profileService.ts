/**
 * Profile Management API Helper Functions
 * 
 * This file provides type-safe helper functions for profile management API calls.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { get, post, put, del } from '@/lib/axios';
import { PROFILE_ENDPOINTS } from '@/constants/apiURL';
import type {
  CreateParentAccountRequest,
  CreateStudentProfileRequest,
  CreateProfileApiResponse,
  GetProfileByIdApiResponse,
  GetAllStudentsParams,
  GetAllStudentsApiResponse,
  UpdateProfileRequest,
  UpdateProfileApiResponse,
  DeleteProfileApiResponse,
  LinkProfileRequest,
  LinkProfilesApiResponse,
  UnlinkProfileRequest,
  UnlinkProfilesApiResponse,
} from '@/types/profile';



/**
 * Create Parent Account (User + Profile)
 * Step 1: Admin creates a Parent user account
 */
export async function createParentAccount(
  data: CreateParentAccountRequest
): Promise<CreateProfileApiResponse> {
  return post<CreateProfileApiResponse>(PROFILE_ENDPOINTS.CREATE, data);
}

/**
 * Create Student Profile (Profile only, no user account)
 * Step 2: Admin creates a Student profile
 */
export async function createStudentProfile(
  data: CreateStudentProfileRequest
): Promise<CreateProfileApiResponse> {
  return post<CreateProfileApiResponse>(PROFILE_ENDPOINTS.CREATE, data);
}

/**
 * Get all students with optional filters
 */
export async function getAllStudents(
  params?: GetAllStudentsParams
): Promise<GetAllStudentsApiResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.profileType) queryParams.append('profileType', params.profileType);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  }

  // Call Next.js API Route, not backend directly
  const url = params && Object.keys(params).length > 0
    ? `${PROFILE_ENDPOINTS.GET_ALL}?${queryParams.toString()}`
    : PROFILE_ENDPOINTS.GET_ALL;

  return get<GetAllStudentsApiResponse>(url);
}

/**
 * Get profile by ID
 */
export async function getProfileById(id: string): Promise<GetProfileByIdApiResponse> {
  return get<GetProfileByIdApiResponse>(PROFILE_ENDPOINTS.GET_BY_ID(id));
}

/**
 * Update profile
 */
export async function updateProfile(
  id: string,
  data: UpdateProfileRequest
): Promise<UpdateProfileApiResponse> {
  return put<UpdateProfileApiResponse>(PROFILE_ENDPOINTS.UPDATE(id), data);
}

/**
 * Delete profile
 */
export async function deleteProfile(id: string): Promise<DeleteProfileApiResponse> {
  return del<DeleteProfileApiResponse>(PROFILE_ENDPOINTS.DELETE(id));
}

/**
 * Link Student Profile to Parent Profile
 * Step 3: Admin links the Student profile to a Parent profile
 */
export async function linkStudentToParent(
  data: LinkProfileRequest
): Promise<LinkProfilesApiResponse> {
  return post<LinkProfilesApiResponse>(PROFILE_ENDPOINTS.LINK, data);
}

/**
 * Unlink Student Profile from Parent Profile
 */
export async function unlinkStudentFromParent(
  data: UnlinkProfileRequest
): Promise<UnlinkProfilesApiResponse> {
  return post<UnlinkProfilesApiResponse>(PROFILE_ENDPOINTS.UNLINK, data);
}
