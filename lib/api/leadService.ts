/**
 * Lead API Helper Functions
 * 
 * This file provides type-safe helper functions for lead API calls.
 * Public endpoints don't require authentication.
 * Authenticated endpoints call Next.js API Routes with automatic token injection.
 */

import { LEAD_ENDPOINTS } from '@/constants/apiURL';
import { get, post, put, patch } from '@/lib/axios';
import type {
  CreateLeadPublicRequest,
  CreateLeadPublicApiResponse,
  CreateLeadRequest,
  CreateLeadApiResponse,
  GetAllLeadsParams,
  GetAllLeadsApiResponse,
  GetLeadByIdApiResponse,
  UpdateLeadRequest,
  UpdateLeadApiResponse,
  AssignLeadRequest,
  AssignLeadApiResponse,
  UpdateLeadStatusRequest,
  UpdateLeadStatusApiResponse,
  AddLeadNoteRequest,
  AddLeadNoteApiResponse,
  GetLeadActivitiesApiResponse,
  GetLeadSLAApiResponse,
} from '@/types/lead';

/**
 * Create a new lead (Public endpoint - no authentication required)
 * This is used by customers to submit contact/inquiry forms
 */
export async function createLeadPublic(data: CreateLeadPublicRequest): Promise<CreateLeadPublicApiResponse> {
  return post<CreateLeadPublicApiResponse>(LEAD_ENDPOINTS.CREATE_PUBLIC, data);
}

/**
 * Create a new lead (Authenticated endpoint)
 * Used by staff to manually create leads
 */
export async function createLead(data: CreateLeadRequest): Promise<CreateLeadApiResponse> {
  return post<CreateLeadApiResponse>(LEAD_ENDPOINTS.CREATE, data);
}

/**
 * Get all leads with optional filters and pagination
 */
export async function getAllLeads(params?: GetAllLeadsParams): Promise<GetAllLeadsApiResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.status) queryParams.append('status', params.status);
    if (params.source) queryParams.append('source', params.source);
    if (params.ownerStaffId) queryParams.append('ownerStaffId', params.ownerStaffId);
    if (params.branchPreference) queryParams.append('branchPreference', params.branchPreference);
  }

  const url = LEAD_ENDPOINTS.GET_ALL;
  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
  
  return get<GetAllLeadsApiResponse>(fullUrl);
}

/**
 * Get lead by ID
 */
export async function getLeadById(id: string): Promise<GetLeadByIdApiResponse> {
  return get<GetLeadByIdApiResponse>(LEAD_ENDPOINTS.GET_BY_ID(id));
}

/**
 * Update a lead
 */
export async function updateLead(id: string, data: UpdateLeadRequest): Promise<UpdateLeadApiResponse> {
  return put<UpdateLeadApiResponse>(LEAD_ENDPOINTS.UPDATE(id), data);
}

/**
 * Assign a lead to a user
 */
export async function assignLead(id: string, data: AssignLeadRequest): Promise<AssignLeadApiResponse> {
  return post<AssignLeadApiResponse>(LEAD_ENDPOINTS.ASSIGN(id), data);
}

/**
 * Update lead status
 */
export async function updateLeadStatus(id: string, data: UpdateLeadStatusRequest): Promise<UpdateLeadStatusApiResponse> {
  return patch<UpdateLeadStatusApiResponse>(LEAD_ENDPOINTS.UPDATE_STATUS(id), data);
}

/**
 * Add a note to a lead
 */
export async function addLeadNote(id: string, data: AddLeadNoteRequest): Promise<AddLeadNoteApiResponse> {
  return post<AddLeadNoteApiResponse>(LEAD_ENDPOINTS.ADD_NOTE(id), data);
}

/**
 * Get lead activities
 */
export async function getLeadActivities(id: string): Promise<GetLeadActivitiesApiResponse> {
  return get<GetLeadActivitiesApiResponse>(LEAD_ENDPOINTS.GET_ACTIVITIES(id));
}

/**
 * Get lead SLA information
 */
export async function getLeadSLA(id: string): Promise<GetLeadSLAApiResponse> {
  return get<GetLeadSLAApiResponse>(LEAD_ENDPOINTS.GET_SLA(id));
}
