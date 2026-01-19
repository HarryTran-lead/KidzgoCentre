import { ApiResponse } from '../apiResponse';

// ==================== Request Interfaces ====================

// Create Branch Request
export interface CreateBranchRequest {
  code: string;
  name: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
  isActive?: boolean;
}

// Update Branch Request
export interface UpdateBranchRequest {
  code?: string;
  name?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  isActive?: boolean;
}

// Update Branch Status Request
export interface UpdateBranchStatusRequest {
  isActive: boolean;
}

// Get All Branches Query Params
export interface GetAllBranchesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// ==================== Response Interfaces ====================

// Branch Entity
export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  // Statistics (optional, may be included in detailed view)
  totalStudents?: number;
  totalTeachers?: number;
  totalClasses?: number;
}

// Get All Branches Response
export interface GetAllBranchesResponse {
  branches: Branch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get Branch By ID Response
export interface GetBranchByIdResponse {
  branch: Branch;
}

// Create Branch Response
export interface CreateBranchResponse {
  branch: Branch;
  message: string;
}

// Update Branch Response
export interface UpdateBranchResponse {
  branch: Branch;
  message: string;
}

// Delete Branch Response
export interface DeleteBranchResponse {
  message: string;
}

// Update Branch Status Response
export interface UpdateBranchStatusResponse {
  branch: Branch;
  message: string;
}

// ==================== API Response Types ====================

export type GetAllBranchesApiResponse = ApiResponse<GetAllBranchesResponse>;
export type GetBranchByIdApiResponse = ApiResponse<GetBranchByIdResponse>;
export type CreateBranchApiResponse = ApiResponse<CreateBranchResponse>;
export type UpdateBranchApiResponse = ApiResponse<UpdateBranchResponse>;
export type DeleteBranchApiResponse = ApiResponse<DeleteBranchResponse>;
export type UpdateBranchStatusApiResponse = ApiResponse<UpdateBranchStatusResponse>;
