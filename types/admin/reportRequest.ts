export type ReportRequestType = "Session" | "Monthly";

export type ReportRequestStatus =
  | "Requested"
  | "InProgress"
  | "Submitted"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export type ReportRequestPriority = "Low" | "Normal" | "High" | "Urgent";

export interface ReportRequestDto {
  id: string;
  reportType: ReportRequestType;
  status: ReportRequestStatus;
  priority: ReportRequestPriority;
  assignedTeacherUserId: string;
  assignedTeacherName?: string | null;
  requestedByUserId: string;
  requestedByName?: string | null;
  targetStudentProfileId?: string | null;
  targetStudentName?: string | null;
  targetClassId?: string | null;
  targetClassCode?: string | null;
  targetClassTitle?: string | null;
  targetSessionId?: string | null;
  targetSessionDate?: string | null;
  month?: number | null;
  year?: number | null;
  message?: string | null;
  dueAt?: string | null;
  linkedSessionReportId?: string | null;
  linkedMonthlyReportId?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequestPayload {
  reportType: ReportRequestType;
  assignedTeacherUserId: string;
  targetStudentProfileId?: string | null;
  targetClassId?: string | null;
  targetSessionId?: string | null;
  month?: number | null;
  year?: number | null;
  priority?: ReportRequestPriority;
  message?: string | null;
  dueAt?: string | null;
  notificationChannel?: string;
}

export interface CompleteReportRequestPayload {
  linkedSessionReportId?: string | null;
  linkedMonthlyReportId?: string | null;
}

export interface ReportRequestListResponse {
  isSuccess: boolean;
  data: {
    reportRequests: {
      items: ReportRequestDto[];
      pageNumber: number;
      totalPages: number;
      totalCount: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
  };
}

export interface ReportRequestDetailResponse {
  isSuccess: boolean;
  data: ReportRequestDto;
}

export interface ReportRequestListQuery {
  reportType?: ReportRequestType;
  status?: ReportRequestStatus;
  priority?: ReportRequestPriority;
  assignedTeacherUserId?: string;
  targetStudentProfileId?: string;
  targetClassId?: string;
  month?: number;
  year?: number;
  pageNumber?: number;
  pageSize?: number;
}
