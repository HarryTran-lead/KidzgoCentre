// Interface dùng chung cho các mảng thống kê trạng thái (statusBreakdown)
export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

// ---------------------------------------------------------
// CÁC INTERFACE CHO TỪNG MODULE TRONG SUMMARY
// ---------------------------------------------------------

export interface AttendanceSummary {
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
  statusBreakdown: StatusBreakdown[];
}

export interface HomeworkSummary {
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
  statusBreakdown: StatusBreakdown[];
}

export interface LeaveSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  approvalRate: number;
  statusBreakdown: StatusBreakdown[];
}

export interface MakeupCreditsSummary {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  totalCreditsIssued: number;
  usedCreditsCount: number;
  availableCreditsCount: number;
  expiredCreditsCount: number;
  utilizationRate: number;
  statusBreakdown: StatusBreakdown[];
}

export interface StudentsSummary {
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

export interface EnrollmentsSummary {
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
  statusBreakdown: StatusBreakdown[];
}

export interface LeadsSummary {
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
  statusBreakdown: StatusBreakdown[];
}

export interface PlacementTestsSummary {
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
  statusBreakdown: StatusBreakdown[];
}

export interface FinanceSummary {
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
  invoiceStatusBreakdown: StatusBreakdown[];
}

export interface HumanResourcesSummary {
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
  payrollRunStatusBreakdown: StatusBreakdown[];
}

// ---------------------------------------------------------
// CÁC INTERFACE BAO NGOÀI (ROOT & DATA)
// ---------------------------------------------------------

export interface BranchSummary {
  branchId: string;
  branchName: string;
  totalStudents: number;
  totalRevenue: number;
  attendanceRate: number;
  activeClasses: number;
}

export interface StudentDistribution {
  branchId: string;
  branchName: string;
  studentCount: number;
}

export interface DashboardSummaryData {
  attendance: AttendanceSummary;
  homework: HomeworkSummary;
  leave: LeaveSummary;
  makeupCredits: MakeupCreditsSummary;
  students: StudentsSummary;
  enrollments: EnrollmentsSummary;
  leads: LeadsSummary;
  placementTests: PlacementTestsSummary;
  finance: FinanceSummary;
  humanResources: HumanResourcesSummary;
}

export interface DashboardData {
  branchSummaries: BranchSummary[];
  revenueTrend: any[]; // Bạn có thể update type cụ thể nếu mảng này trả về dữ liệu thật
  studentDistribution: StudentDistribution[];
  attendanceTrend: any[]; // Tương tự như revenueTrend
  summary: DashboardSummaryData;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

// ---------------------------------------------------------
// BACKWARD-COMPAT TYPES FOR EXISTING ADMIN DASHBOARD FLOW
// ---------------------------------------------------------

export type StatusBreakdownItem = StatusBreakdown;

export interface DashboardQueryParams {
  branchId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AdminOverviewParams {
  branchId?: string;
  classId?: string;
  studentProfileId?: string;
  programId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface DashboardApiResponse<T> {
  isSuccess?: boolean;
  success?: boolean;
  message?: string;
  data: T;
}

export type DashboardOverallResponse = DashboardSummaryData;
export type DashboardStudentResponse = StudentsSummary;
export interface DashboardAcademicResponse {
  attendance: AttendanceSummary;
  homework: HomeworkSummary;
  leave: LeaveSummary;
  makeupCredits: MakeupCreditsSummary;
}
export type DashboardFinanceResponse = FinanceSummary;
export type DashboardHRResponse = HumanResourcesSummary;
export interface DashboardLeadsResponse {
  leads: LeadsSummary;
  placementTests: PlacementTestsSummary;
}

export type DashboardOverallApiResponse = DashboardApiResponse<
  DashboardSummaryData | DashboardData
>;
export type DashboardStudentApiResponse = DashboardApiResponse<DashboardStudentResponse>;
export type DashboardAcademicApiResponse = DashboardApiResponse<DashboardAcademicResponse>;
export type DashboardFinanceApiResponse = DashboardApiResponse<DashboardFinanceResponse>;
export type DashboardHRApiResponse = DashboardApiResponse<DashboardHRResponse>;
export type DashboardLeadsApiResponse = DashboardApiResponse<DashboardLeadsResponse>;
export type AdminOverviewApiResponse = DashboardApiResponse<any>;