/**
 * Branch API Helper Functions
 * 
 * This file provides type-safe helper functions for branch API calls.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { BRANCH_ENDPOINTS } from '@/constants/apiURL';
import { get, post, put, del, patch } from '@/lib/axios';
import type {
  GetAllBranchesParams,
  GetAllBranchesApiResponse,
  GetBranchByIdApiResponse,
  CreateBranchRequest,
  CreateBranchApiResponse,
  UpdateBranchRequest,
  UpdateBranchApiResponse,
  DeleteBranchApiResponse,
  UpdateBranchStatusRequest,
  UpdateBranchStatusApiResponse,
} from '@/types/branch';

/**
 * Get all branches with optional filters and pagination
 */
export async function getAllBranches(params?: GetAllBranchesParams): Promise<GetAllBranchesApiResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  }

  const url = BRANCH_ENDPOINTS.GET_ALL;
  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
  
  return get<GetAllBranchesApiResponse>(fullUrl);
}

/**
 * Get branch by ID
 */
export async function getBranchById(id: string): Promise<GetBranchByIdApiResponse> {
  return get<GetBranchByIdApiResponse>(BRANCH_ENDPOINTS.GET_BY_ID(id));
}

/**
 * Create a new branch
 */
export async function createBranch(data: CreateBranchRequest): Promise<CreateBranchApiResponse> {
  return post<CreateBranchApiResponse>(BRANCH_ENDPOINTS.CREATE, data);
}

/**
 * Update an existing branch
 */
export async function updateBranch(id: string, data: UpdateBranchRequest): Promise<UpdateBranchApiResponse> {
  return put<UpdateBranchApiResponse>(BRANCH_ENDPOINTS.UPDATE(id), data);
}

/**
 * Delete a branch by ID
 */
export async function deleteBranch(id: string): Promise<DeleteBranchApiResponse> {
  return del<DeleteBranchApiResponse>(BRANCH_ENDPOINTS.DELETE(id));
}

/**
 * Update branch status (activate/deactivate)
 */
export async function updateBranchStatus(
  id: string, 
  data: UpdateBranchStatusRequest
): Promise<UpdateBranchStatusApiResponse> {
  return patch<UpdateBranchStatusApiResponse>(BRANCH_ENDPOINTS.UPDATE_STATUS(id), data);
}
