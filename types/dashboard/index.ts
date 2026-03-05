import { ApiResponse } from '../apiResponse';

// ==================== Dashboard Statistics ====================

export interface DashboardStatistics {
  totalBranches: number;
  totalClasses: number;
  activeClasses: number;
  totalStudents: number;
  totalSessions: number;
  upcomingSessions: number;
  totalRevenue: number;
  pendingPayments: number;
  pendingReports: number;
  openTickets: number;
}

// ==================== Summary DTOs ====================

export interface BranchSummaryDto {
  id: string;
  code: string;
  name: string;
  classCount: number;
  studentCount: number;
}

export interface ClassSummaryDto {
  id: string;
  code: string;
  title: string;
  branchId: string;
  branchName: string;
  status: string;
  enrollmentCount: number;
  capacity: number;
}

export interface SessionSummaryDto {
  id: string;
  classId: string;
  classCode: string;
  plannedDatetime: string;
  status: string;
}

export interface StudentSummaryDto {
  profileId: string;
  displayName: string;
  branchId: string;
  branchName: string;
  activeEnrollments: number;
}

export interface EnrollmentSummaryDto {
  id: string;
  classCode: string;
  studentName: string;
  enrollDate: string;
  status: string;
}

export interface InvoiceSummaryDto {
  id: string;
  invoiceNumber: string;
  studentName: string;
  amount: number;
  paymentStatus: string;
  dueDate: string | null;
}

export interface ReportSummaryDto {
  id: string;
  studentName: string;
  classCode: string;
  status: string;
  reportMonth: string;
}

export interface TicketSummaryDto {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

// ==================== Admin Overview Response ====================

export interface AdminOverviewResponse {
  statistics: DashboardStatistics;
  branches: BranchSummaryDto[];
  classes: ClassSummaryDto[];
  upcomingSessions: SessionSummaryDto[];
  students: StudentSummaryDto[];
  recentEnrollments: EnrollmentSummaryDto[];
  pendingInvoices: InvoiceSummaryDto[];
  pendingReports: ReportSummaryDto[];
  openTickets: TicketSummaryDto[];
}

// ==================== Query Params ====================

export interface AdminOverviewParams {
  branchId?: string;
  classId?: string;
  studentProfileId?: string;
  programId?: string;
  fromDate?: string;
  toDate?: string;
}

// ==================== API Response Types ====================

export type AdminOverviewApiResponse = ApiResponse<AdminOverviewResponse>;
