import type { ApiResponse } from "@/types/apiResponse";

export type ReportsV3GenerateType = "parent" | "academic" | "internal";
export type ReportTemplateType = "parent" | "academic" | "class" | "branch" | "internal";
export type ReportPeriodType = "weekly" | "monthly" | "module" | "custom";
export type InsightType = "strength" | "weakness" | "risk" | "recommendation" | "note";
export type RiskSeverity = "low" | "medium" | "high";
export type RiskAlertStatus = "Open" | "Resolved" | "Ignored" | string;
export type RecommendationStatus = "Pending" | "Accepted" | "Rejected" | "Done" | string;
export type ReportShareStatus = "Sent" | "Failed" | "Viewed" | string;
export type ReportShareChannel = "app" | "email" | "zalo" | "sms";
export type RecommendationRole = "teacher" | "academic_manager" | "cs" | "admin";
export type StudentReportStatus = "Pending" | "Processing" | "Completed" | "Failed" | "Superseded" | string;
export type ReportRunStatus = "Pending" | "Processing" | "Completed" | "Failed" | string;

export interface ReportsV3Snapshot {
  student?: {
    id?: string;
    name?: string;
    branch?: string;
    class?: string;
  };
  academic_context?: {
    program?: string;
    level?: string;
    module?: string;
    syllabus?: string;
    syllabus_version?: string;
    type?: ReportPeriodType | string;
  };
  period?: {
    from?: string;
    to?: string;
    type?: ReportPeriodType | string;
  };
  attendance_summary?: {
    total_sections?: number;
    present?: number;
    late?: number;
    absent_with_notice?: number;
    absent_without_notice?: number;
    attendance_rate?: number;
  };
  ticket_summary?: {
    granted?: number;
    consumed?: number;
    remaining?: number;
    package_expiring?: boolean;
  };
  runtime_summary?: {
    normal_sections?: number;
    review_sections?: number;
    makeup_sections?: number;
    remedial_sections?: number;
    assessment_sections?: number;
  };
  learning_progress?: {
    completion_percent?: number;
    current_status?: string;
    promotion_status?: string;
    current_lesson?: string;
    expected_completion_percent?: number;
    remedial_status?: string;
  };
  assessment_summary?: {
    latest_score?: number | null;
    latest_result?: string;
    teacher_comment?: string;
  };
  teacher_evaluation?: {
    speaking?: number | null;
    listening?: number | null;
    reading?: number | null;
    writing?: number | null;
    participation?: number | null;
    confidence?: number | null;
    notes?: string;
  };
  strengths?: string[];
  weaknesses?: string[];
  risks?: string[];
  recommendations?: string[];
  parent_message?: string;
  internal_notes?: string;
}

export interface ReportInsightDto {
  id: string;
  studentReportId?: string;
  insightType: InsightType | string;
  content: string;
  confidenceScore?: number | null;
  sourceDataJson?: string | null;
  createdAt?: string;
}

export interface RiskAlertDto {
  id: string;
  studentId?: string;
  studentName?: string;
  classId?: string | null;
  className?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  riskType: string;
  severity: RiskSeverity | string;
  reason: string;
  source?: string | null;
  status: RiskAlertStatus;
  createdAt?: string;
  resolvedAt?: string | null;
}

export interface RecommendationDto {
  id: string;
  studentId?: string;
  studentName?: string;
  classId?: string | null;
  className?: string | null;
  recommendationType?: string | null;
  content: string;
  priority?: string | null;
  assignedRole: RecommendationRole | string;
  status: RecommendationStatus;
  createdAt?: string;
  completedAt?: string | null;
}

export interface ReportShareLogDto {
  id: string;
  studentReportId?: string;
  recipientName: string;
  recipientContact: string;
  channel: ReportShareChannel | string;
  status: ReportShareStatus;
  sentAt?: string;
  viewedAt?: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
}

export interface ReportPeriodDto {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  type: ReportPeriodType | string;
}

export interface ReportTemplateDto {
  id: string;
  code: string;
  name: string;
  type: ReportTemplateType | string;
  contentSchema?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface RiskRuleConfigDto {
  riskType: string;
  isActive: boolean;
  score: number;
  parametersJson?: string | null;
  updatedAt?: string;
}

export interface StudentReportListItemDto {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  className?: string;
  branchId?: string;
  branchName?: string;
  reportPeriodId?: string;
  reportType: ReportsV3GenerateType | string;
  status: StudentReportStatus;
  isParentPublished?: boolean;
  parentPublishedAt?: string | null;
  createdAt?: string;
}

export interface StudentReportDetailDto extends StudentReportListItemDto {
  reportPeriodName?: string;
  reportPeriodFrom?: string;
  reportPeriodTo?: string;
  summaryText?: string | null;
  snapshot?: ReportsV3Snapshot | null;
  insights?: ReportInsightDto[];
  risks?: RiskAlertDto[];
  recommendations?: RecommendationDto[];
  shareLogs?: ReportShareLogDto[];
}

export interface GenerateReportRequest {
  reportType: ReportsV3GenerateType;
  studentId: string;
  classId?: string | null;
  branchId?: string | null;
  periodId: string;
  idempotencyKey?: string;
}

export interface GenerateReportResponse {
  reportRunId: string;
  studentReportId: string;
  status: ReportRunStatus;
}

export interface PublishReportToParentResponse {
  reportId: string;
  isParentPublished: boolean;
  parentPublishedAt?: string | null;
  notificationsCreated?: number;
}

export interface ShareReportRequest {
  channel: ReportShareChannel;
  recipientName: string;
  recipientContact: string;
  providerMessageId?: string;
}

export interface ShareCallbackRequest {
  providerMessageId: string;
  status: "sent" | "failed" | "viewed";
  errorMessage?: string;
  viewedAt?: string | null;
}

export interface ParentReportViewResponse {
  reportId?: string;
  studentId?: string;
  reportType?: ReportsV3GenerateType | string;
  summaryText?: string | null;
  snapshot?: ReportsV3Snapshot | null;
  recommendations?: RecommendationDto[];
  createdAt?: string;
  isParentPublished?: boolean;
}

export interface ClassAcademicDashboardResponse {
  classId?: string;
  className?: string;
  branchId?: string;
  branchName?: string;
  periodId?: string | null;
  totalStudents?: number;
  riskStudents?: number;
  failedAssessments?: number;
  remedialRequired?: number;
  classPacing?: {
    reviewRatio?: number;
    curriculumDelayRisk?: boolean;
    actualProgress?: number;
    plannedProgress?: number;
  };
  riskAlerts?: RiskAlertDto[];
  recommendations?: RecommendationDto[];
  weakStudents?: Array<{
    studentId?: string;
    studentName?: string;
    reason?: string;
    severity?: RiskSeverity | string;
  }>;
}

export interface BranchDashboardResponse {
  branchId?: string;
  branchName?: string;
  totalActiveClasses?: number;
  totalActiveStudents?: number;
  riskStudents?: number;
  riskClasses?: number;
  delayedClasses?: number;
  packageExpiringCount?: number;
  assessmentFailCount?: number;
  lowAttendanceClasses?: number;
  curriculumDelayClasses?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export type ReportsV3ApiResponse<T> = ApiResponse<T>;
