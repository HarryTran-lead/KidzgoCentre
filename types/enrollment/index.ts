/**
 * Enrollment Types
 * 
 * Type definitions for enrollment management
 */

export type EnrollmentStatus = "Active" | "Paused" | "Dropped";

export interface Enrollment {
  id: string;
  classId: string;
  classCode?: string;
  classTitle?: string;
  studentProfileId: string;
  studentName?: string;
  enrollDate: string;
  status: EnrollmentStatus;
  tuitionPlanId?: string;
  tuitionPlanName?: string;
  programName?: string;
  schedulePattern?: string;
  capacity?: number;
  mainTeacherName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEnrollmentRequest {
  classId: string;
  studentProfileId: string;
  enrollDate: string;
  tuitionPlanId?: string;
}

export interface UpdateEnrollmentRequest {
  classId?: string;
  studentProfileId?: string;
  enrollDate?: string;
  tuitionPlanId?: string;
}

export interface AssignTuitionPlanRequest {
  tuitionPlanId: string;
}

export interface EnrollmentFilterParams {
  classId?: string;
  studentProfileId?: string;
  status?: EnrollmentStatus;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}

export interface EnrollmentPaginatedResponse {
  items: Enrollment[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface EnrollmentHistoryItem {
  id: string;
  classId: string;
  classCode?: string;
  classTitle?: string;
  enrollDate: string;
  status: EnrollmentStatus;
  programName?: string;
  mainTeacherName?: string;
  createdAt?: string;
  updatedAt?: string;
}
