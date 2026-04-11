/**
 * Lead Types and Interfaces
 * Defines types for lead management system
 */

export enum ActivityType {
  Call = 'Call',
  Zalo = 'Zalo',
  Sms = 'Sms',
  Email = 'Email',
  Note = 'Note',
}

export enum LeadStatus {
  New = 'New',
  Contacted = 'Contacted',
  BookedTest = 'BookedTest',
  TestDone = 'TestDone',
  Enrolled = 'Enrolled',
  Lost = 'Lost',
}

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
  status?: LeadStatus;
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

export interface CreateNotePayload {
  content: string;
  activityType?: ActivityType; // Khuyên dùng mặc định là Note nếu user không chọn
  nextActionAt?: string;       // Chuỗi ISO 8601 (VD: 2026-04-11T15:00:00+07:00)
  clearNextAction?: boolean;   // Truyền true nếu muốn xoá lịch hẹn cũ (không đi kèm nextActionAt)
}

export interface NoteCreatedData {
  activityId: string;
  leadId: string;
  activityType: ActivityType;
  content: string;
  leadStatus: LeadStatus;      // Nhờ field này, FE biết ngay BE đã auto đổi status chưa
  firstResponseAt: string | null;
  nextActionAt: string | null; // Của activity này
  leadNextActionAt: string | null; // Của toàn bộ lead (dùng để update UI)
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  activityType: ActivityType;
  content: string;
  nextActionAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

// Child Types
export interface LeadChild {
  id: string;
  leadId: string;
  childName: string;
  dob?: string; // Date of birth in ISO format
  gender?: "Male" | "Female";
  programInterest?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Request Types
export interface CreateLeadPublicRequest {
  contactName: string;
  email: string;
  phone: string;
  zaloId?: string;
  branchPreference?: string;
}

export interface CreateLeadRequest extends CreateLeadPublicRequest {
  status?: string;
  source?: string;
  ownerStaffId?: string;
  assignedTo?: string; 
  children?: CreateLeadChildRequest[];
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
  activityType?: ActivityType;
  nextActionAt?: string;
  clearNextAction?: boolean;
}
// Child Request Types
export interface CreateLeadChildRequest {
  childName: string;
  dob?: string; // Date of birth in ISO format (e.g., "2026-03-24T22:22:24+07:00")
  gender?: "Male" | "Female";
  programInterest?: string;
  notes?: string;
}

export interface UpdateLeadChildRequest {
  childName?: string;
  dob?: string;
  gender?: "Male" | "Female";
  programInterest?: string;
  notes?: string;
}


export interface GetAllLeadsParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
  source?: string;
  ownerStaffId?: string;
  branchPreference?: string;
  branchId?: string; // Filter by branch ID
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
  data: NoteCreatedData;
  message?: string;
}

export interface GetLeadActivitiesApiResponse {
  success?: boolean;
  isSuccess?: boolean;
  data: ActivitiesResponseData;
  message?: string;
}

export interface ActivitiesResponseData {
  leadId: string;
  activities: ActivityItem[];
}
// Child Response Types
export interface GetLeadChildrenApiResponse {
  isSuccess: boolean;
  data: {
    children: LeadChild[];
  };
  message?: string;
}

export interface CreateLeadChildApiResponse {
  isSuccess: boolean;
  data: LeadChild;
  message?: string;
}

export interface UpdateLeadChildApiResponse {
  isSuccess: boolean;
  data: LeadChild;
  message?: string;
}

export interface DeleteLeadChildApiResponse {
  isSuccess: boolean;
  message?: string;
}
