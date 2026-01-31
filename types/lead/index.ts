/**
 * Lead Types and Interfaces
 * Defines types for lead management system
 */

export interface Lead {
  id: string;
  source: string;
  campaign: string;
  contactName?: string;
  phone?: string;
  zaloId?: string;
  email?: string;
  company?: string;
  subject?: string;
  branchPreference?: string;
  branchPreferenceName?: string;
  programInterest?: string;
  notes?: string;
  status?: 'New' | 'Contacted' | 'BookedTest' | 'TestDone' | 'Enrolled' | 'Lost';
  ownerStaffId?: string;
  ownerStaffName?: string;
  firstResponseAt?: string;
  touchCount?: number;
  nextActionAt?: string;
  convertedStudentProfileId?: string;
  convertedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadNote {
  activityId: string;
  leadId: string;
  content: string;
  activityType: string;
  nextActionAt?: string;
  createdAt?: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: string;
  description: string;
  createdAt: string;
}

// Request Types
export interface CreateLeadPublicRequest {
  contactName: string;
  email: string;
  phone: string;
  zaloId?: string;
}

export interface CreateLeadRequest extends CreateLeadPublicRequest {
  status?: string;
  source?: string;
  assignedTo?: string;
}

export interface UpdateLeadRequest {
  contactName?: string;
  email?: string;
  phone?: string;
  zaloId?: string;
  source?: string;
  campaign?: string;
  company?: string;
  subject?: string;
  branchPreference?: string;
  programInterest?: string;
  notes?: string;
  status?: string;
}

export interface UpdateLeadStatusRequest {
  status: string;
}

export interface AssignLeadRequest {
  ownerStaffId: string;
}

export interface AddLeadNoteRequest {
  content: string;
  activityType: string;
  nextActionAt?: string;
}

export interface GetAllLeadsParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
  source?: string;
  ownerStaffId?: string;
  branchPreference?: string;
}

// Response Types
export interface CreateLeadPublicApiResponse {
  success: boolean;
  data: Lead;
  message?: string;
}

export interface CreateLeadApiResponse {
  success: boolean;
  data: Lead;
  message?: string;
}

export interface GetAllLeadsApiResponse {
  isSuccess: boolean;
  data: {
    leads: Lead[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  message?: string;
  status?: number;
}

export interface GetLeadByIdApiResponse {
  success: boolean;
  data: Lead;
  message?: string;
}

export interface UpdateLeadApiResponse {
  success: boolean;
  data: Lead;
  message?: string;
}

export interface UpdateLeadStatusApiResponse {
  success: boolean;
  data: Lead;
  message?: string;
}

export interface AssignLeadApiResponse {
  isSuccess: boolean;
  data: Lead;
  message?: string;
  status?: number;
}

export interface AddLeadNoteApiResponse {
  success: boolean;
  data: LeadNote;
  message?: string;
}

export interface GetLeadActivitiesApiResponse {
  success: boolean;
  data: LeadActivity[];
  message?: string;
}

export interface GetLeadSLAApiResponse {
  success: boolean;
  data: {
    leadId: string;
    responseTime?: number;
    resolutionTime?: number;
    slaStatus: string;
  };
  message?: string;
}
