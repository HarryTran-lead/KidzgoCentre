export type RegistrationStatus = "New" | "WaitingForClass" | "Studying" | "Paused" | "Completed" | "Cancelled";

export interface RegistrationRequest {
  studentProfileId: string;
  branchId: string;
  programId: string;
  tuitionPlanId: string;
  expectedStartDate?: string | null;
  preferredSchedule?: string | null;
  note?: string | null;
}

export interface UpdateRegistrationRequest {
  expectedStartDate?: string | null;
  preferredSchedule?: string | null;
  note?: string | null;
  tuitionPlanId?: string | null;
}

export interface AssignClassRequest {
  classId?: string | null;
  entryType?: "immediate" | "wait";
}

export interface Registration {
  id: string;
  studentProfileId: string;
  studentName: string | null;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  tuitionPlanId: string;
  tuitionPlanName: string;
  registrationDate: string;
  expectedStartDate: string;
  actualStartDate: string;
  preferredSchedule: string;
  note: string;
  status: RegistrationStatus;
  classId: string;
  className: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestedClass {
  id: string;
  code?: string;
  title?: string;
  programId?: string;
  programName?: string;
  branchId?: string;
  branchName?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  currentStudents?: number;
  availableSlots?: number;
  schedulePattern?: string;
  status?: RegistrationStatus;
}

export interface RegistrationFilterParams {
  studentProfileId?: string;
  branchId?: string;
  programId?: string;
  status?: RegistrationStatus;
  classId?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface RegistrationPaginatedResponse {
  items: Registration[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface RegistrationActionResponse {
  isSuccess?: boolean;
  success?: boolean;
  message?: string;
  data?: any;
}