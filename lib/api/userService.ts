/**
 * User Management API Helper Functions
 * 
 * This file provides type-safe helper functions for user management API calls.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { USER_ENDPOINTS } from '@/constants/apiURL';
import { get, post, put, del, patch } from '@/lib/axios';
import type {
  GetAllUsersParams,
  GetAllUsersApiResponse,
  GetUserByIdApiResponse,
  CreateUserRequest,
  CreateUserApiResponse,
  UpdateUserRequest,
  UpdateUserApiResponse,
  DeleteUserApiResponse,
  AssignBranchRequest,
  AssignBranchApiResponse,
  ChangeUserPinRequest,
  ChangeUserPinApiResponse,
  UpdateUserStatusRequest,
  UpdateUserStatusApiResponse,
} from '@/types/admin/user';

/**
 * Get all users with optional filters and pagination
 */
export async function getAllUsers(params?: GetAllUsersParams): Promise<GetAllUsersApiResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    // Support both page/limit and pageNumber/pageSize
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    else if (params.page) queryParams.append('page', params.page.toString());
    
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    else if (params.limit) queryParams.append('limit', params.limit.toString());
    
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  }

  const url = USER_ENDPOINTS.GET_ALL;
  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
  
  return get<GetAllUsersApiResponse>(fullUrl);
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<GetUserByIdApiResponse> {
  return get<GetUserByIdApiResponse>(USER_ENDPOINTS.GET_BY_ID(id));
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserRequest): Promise<CreateUserApiResponse> {
  return post<CreateUserApiResponse>(USER_ENDPOINTS.CREATE, data);
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, data: UpdateUserRequest): Promise<UpdateUserApiResponse> {
  return put<UpdateUserApiResponse>(USER_ENDPOINTS.UPDATE(id), data);
}

/**
 * Delete a user by ID
 */
export async function deleteUser(id: string): Promise<DeleteUserApiResponse> {
  return del<DeleteUserApiResponse>(USER_ENDPOINTS.DELETE(id));
}

/**
 * Assign a branch to a user
 */
export async function assignBranchToUser(
  id: string, 
  data: AssignBranchRequest
): Promise<AssignBranchApiResponse> {
  return patch<AssignBranchApiResponse>(USER_ENDPOINTS.ASSIGN_BRANCH(id), data);
}

/**
 * Change user PIN (for Admin to reset user's PIN)
 */
export async function changeUserPin(
  userId: string,
  data: ChangeUserPinRequest
): Promise<ChangeUserPinApiResponse> {
  return put<ChangeUserPinApiResponse>(USER_ENDPOINTS.CHANGE_PIN(userId), data);
}

/**
 * Update user status (activate/deactivate)
 */
export async function updateUserStatus(
  id: string, 
  data: UpdateUserStatusRequest
): Promise<UpdateUserStatusApiResponse> {
  return patch<UpdateUserStatusApiResponse>(USER_ENDPOINTS.UPDATE_STATUS(id), data);
}

// ==================== Additional Utility Functions ====================

/**
 * Get users by role
 */
export async function getUsersByRole(
  role: 'Admin' | 'Parent' | 'Staff' | 'Teacher',
  params?: Omit<GetAllUsersParams, 'role'>
): Promise<GetAllUsersApiResponse> {
  return getAllUsers({ ...params, role });
}

/**
 * Get active users only
 */
export async function getActiveUsers(
  params?: Omit<GetAllUsersParams, 'isActive'>
): Promise<GetAllUsersApiResponse> {
  return getAllUsers({ ...params, isActive: true });
}

/**
 * Get users by branch
 */
export async function getUsersByBranch(
  branchId: string,
  params?: Omit<GetAllUsersParams, 'branchId'>
): Promise<GetAllUsersApiResponse> {
  return getAllUsers({ ...params, branchId });
}

/**
 * Activate a user
 */
export async function activateUser(id: string): Promise<UpdateUserStatusApiResponse> {
  return updateUserStatus(id, { isActive: true });
}

/**
 * Deactivate a user
 */
export async function deactivateUser(id: string): Promise<UpdateUserStatusApiResponse> {
  return updateUserStatus(id, { isActive: false });
}
