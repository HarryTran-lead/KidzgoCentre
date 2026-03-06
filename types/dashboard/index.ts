import { ApiResponse } from '../apiResponse';

// ==================== Status Breakdown ====================

export interface StatusBreakdownItem {
  status: string;
  count: number;
  percentage: number;
}

// ==================== Dashboard: Attendance ====================

export interface DashboardAttendance {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
  totalAttendanceRecords: number;
  uniqueSessionCount: number;
  presentRate: number;
  absentRate: number;
  makeupRate: number;
  statusBreakdown: StatusBreakdownItem[];
}

// ==================== Dashboard: Homework ====================

export interface DashboardHomework {
  total: number;
  pending: number;
  submitted: number;
  graded: number;
  overdue: number;
  totalHomeworkSubmissions: number;
  assignedCount: number;
  submittedCount: number;
  gradedCount: number;
  lateCount: number;
  missingCount: number;
  overdueCount: number;
  submissionRate: number;
  gradedRate: number;
  statusBreakdown: StatusBreakdownItem[];
}

// ==================== Dashboard: Leave ====================

export interface DashboardLeave {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  approvalRate: number;
  statusBreakdown: StatusBreakdownItem[];
}

// ==================== Dashboard: Makeup Credits ====================

export interface DashboardMakeupCredits {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  totalCreditsIssued: number;
  usedCreditsCount: number;
  availableCreditsCount: number;
  expiredCreditsCount: number;
  utilizationRate: number;
  statusBreakdown: StatusBreakdownItem[];
}

// ==================== Dashboard: Students ====================

export interface DashboardStudents {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newStudentsThisMonth: number;
  newStudentsInSelectedRange: number;
  activeStudentRate: number;
}

// ==================== Dashboard: Enrollments ====================

export interface DashboardEnrollments {
  total: number;
  active: number;
  paused: number;
  dropped: number;
  newThisMonth: number;
  totalEnrollments: number;
  activeEnrollments: number;
  pausedEnrollments: number;
  droppedEnrollments: number;
  newEnrollmentsThisMonth: number;
  newEnrollmentsInSelectedRange: number;
  activeEnrollmentRate: number;
  statusBreakdown: StatusBreakdownItem[];
}

// ==================== Dashboard: Leads ====================

export interface DashboardLeads {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  enrolled: number;
  noShow: number;
  lost: number;
  conversionRate: number;
  totalTouchCount: number;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  enrolledLeads: number;
  lostLeads: number;
  noShowLeads: number;
  qualificationRate: number;
  statusBreakdown: StatusBreakdownItem[];
}

// ==================== Dashboard: Placement Tests ====================

export interface DashboardPlacementTests {
  total: number;
  scheduled: number;
  completed: number;
  noShow: number;
  enrolled: number;
  totalTests: number;
  scheduledTests: number;
  completedTests: number;
  noShowTests: number;
  cancelledTests: number;
  completionRate: number;
  noShowRate: number;
  statusBreakdown: StatusBreakdownItem[];
}

// ==================== Dashboard: Finance ====================

export interface DashboardFinance {
  totalRevenue: number;
  monthRevenue: number;
  payOSRevenue: number;
  cashRevenue: number;
  outstandingDebt: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalBilledAmount: number;
  totalCollectedAmount: number;
  collectedInSelectedRange: number;
  totalOutstandingAmount: number;
  collectionRate: number;
  invoiceStatusBreakdown: StatusBreakdownItem[];
}

// ==================== Dashboard: Human Resources ====================

export interface DashboardHumanResources {
  totalStaff: number;
  totalWorkHours: number;
  totalPayroll: number;
  payrollProcessed: number;
  payrollPending: number;
  teacherCount: number;
  managementStaffCount: number;
  accountantStaffCount: number;
  adminCount: number;
  averageWorkHoursPerStaff: number;
  payrollPaidInSelectedRange: number;
  payrollRunApprovedOrPaidCount: number;
  payrollRunDraftCount: number;
  payrollRunStatusBreakdown: StatusBreakdownItem[];
}

// ==================== API Response Types: New Dashboard ====================

/** GET /api/dashboard/overall */
export interface DashboardOverallResponse {
  attendance: DashboardAttendance;
  homework: DashboardHomework;
  leave: DashboardLeave;
  makeupCredits: DashboardMakeupCredits;
  students: DashboardStudents;
  enrollments: DashboardEnrollments;
  leads: DashboardLeads;
  placementTests: DashboardPlacementTests;
  finance: DashboardFinance;
  humanResources: DashboardHumanResources;
}

/** GET /api/dashboard/student */
export type DashboardStudentResponse = DashboardStudents;

/** GET /api/dashboard/academic */
export interface DashboardAcademicResponse {
  attendance: DashboardAttendance;
  homework: DashboardHomework;
  leave: DashboardLeave;
  makeupCredits: DashboardMakeupCredits;
}

/** GET /api/dashboard/finance */
export type DashboardFinanceResponse = DashboardFinance;

/** GET /api/dashboard/hr */
export type DashboardHRResponse = DashboardHumanResources;

/** GET /api/dashboard/leads */
export interface DashboardLeadsResponse {
  leads: DashboardLeads;
  placementTests: DashboardPlacementTests;
}

// ==================== Dashboard Query Params ====================

export interface DashboardQueryParams {
  branchId?: string;
  fromDate?: string;
  toDate?: string;
}

// ==================== API Response Wrappers ====================

export type DashboardOverallApiResponse = ApiResponse<DashboardOverallResponse>;
export type DashboardStudentApiResponse = ApiResponse<DashboardStudentResponse>;
export type DashboardAcademicApiResponse = ApiResponse<DashboardAcademicResponse>;
export type DashboardFinanceApiResponse = ApiResponse<DashboardFinanceResponse>;
export type DashboardHRApiResponse = ApiResponse<DashboardHRResponse>;
export type DashboardLeadsApiResponse = ApiResponse<DashboardLeadsResponse>;

// ==================== Legacy: Dashboard Statistics (kept for backward compat) ====================

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

// ==================== Legacy: Summary DTOs ====================

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

// ==================== Legacy: Admin Overview Response ====================

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

// ==================== Legacy: Query Params ====================

export interface AdminOverviewParams {
  branchId?: string;
  classId?: string;
  studentProfileId?: string;
  programId?: string;
  fromDate?: string;
  toDate?: string;
}

// ==================== Legacy: API Response Types ====================

export type AdminOverviewApiResponse = ApiResponse<AdminOverviewResponse>;

