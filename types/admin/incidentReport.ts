export type IncidentReportCategory =
  | "Classroom"
  | "Student"
  | "TeachingMaterial"
  | "TeachingSchedule"
  | "Equipment"
  | "System"
  | "Academic"
  | "Finance"
  | "Operations"
  | "ParentStudentFeedback"
  | "Other";

export type IncidentReportStatus =
  | "Open"
  | "InProgress"
  | "Resolved"
  | "Closed"
  | "Rejected";

export type IncidentReportCommentType =
  | "AdditionalInfo"
  | "Evidence"
  | "ProcessingNote";

export interface IncidentReportDto {
  id: string;
  openedByUserId: string;
  openedByUserName: string;
  branchId: string;
  branchName: string;
  classId: string | null;
  classCode: string | null;
  classTitle: string | null;
  category: IncidentReportCategory;
  subject: string;
  message: string;
  status: IncidentReportStatus;
  assignedToUserId: string | null;
  assignedToUserName: string | null;
  evidenceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface IncidentReportCommentDto {
  id: string;
  commenterUserId: string;
  commenterUserName: string;
  message: string;
  attachmentUrl: string | null;
  commentType: IncidentReportCommentType;
  createdAt: string;
}

export interface IncidentReportDetailDto extends IncidentReportDto {
  comments: IncidentReportCommentDto[];
}

export interface CreateIncidentReportPayload {
  branchId: string;
  classId?: string | null;
  category: IncidentReportCategory;
  subject: string;
  message: string;
  evidenceUrl?: string | null;
}

export interface AddIncidentCommentPayload {
  message: string;
  attachmentUrl?: string | null;
  commentType: IncidentReportCommentType;
}

export interface AssignIncidentPayload {
  assignedToUserId: string;
}

export interface UpdateIncidentStatusPayload {
  status: IncidentReportStatus;
}

export interface IncidentReportListQuery {
  branchId?: string;
  openedByUserId?: string;
  assignedToUserId?: string;
  classId?: string;
  category?: IncidentReportCategory;
  status?: IncidentReportStatus;
  keyword?: string;
  createdFrom?: string;
  createdTo?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface IncidentReportListResponse {
  isSuccess: boolean;
  data: {
    incidentReports: {
      items: IncidentReportDto[];
      pageNumber: number;
      totalPages: number;
      totalCount: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
  };
}

export interface IncidentReportDetailResponse {
  isSuccess: boolean;
  data: IncidentReportDetailDto;
}

export interface IncidentReportCommentResponse {
  isSuccess: boolean;
  data: IncidentReportCommentDto;
}

export interface IncidentReportStatisticsResponse {
  isSuccess: boolean;
  data: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    rejected: number;
    unassigned: number;
    byStatus: { status: IncidentReportStatus; count: number }[];
    byCategory: { category: IncidentReportCategory; count: number }[];
  };
}
