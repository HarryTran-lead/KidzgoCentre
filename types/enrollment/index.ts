/**
 * Enrollment Types
 * 
 * Type definitions for enrollment management
 */

export type EnrollmentStatus = "Active" | "Paused" | "Dropped";
export type EnrollmentTrack = "primary" | "secondary";

export type DayOfWeekCode =
  | "MO"
  | "TU"
  | "WE"
  | "TH"
  | "FR"
  | "SA"
  | "SU";

export interface WeeklyPatternEntry {
  dayOfWeeks: DayOfWeekCode[];
  startTime: string;
  durationMinutes: number;
}

export interface EnrollmentScheduleSegment {
  id: string;
  enrollmentId: string;
  classId?: string;
  programId?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  weeklyPattern?: WeeklyPatternEntry[] | null;
  activeWeeklyPattern?: WeeklyPatternEntry[] | null;
}

export interface Enrollment {
  id: string;
  classId: string;
  classCode?: string;
  classTitle?: string;
  programId?: string;
  studentProfileId: string;
  studentName?: string;
  enrollDate: string;
  status: EnrollmentStatus;
  tuitionPlanId?: string;
  tuitionPlanName?: string;
  track?: EnrollmentTrack;
  weeklyPattern?: WeeklyPatternEntry[];
  scheduleSegments?: EnrollmentScheduleSegment[];
  branchId?: string;
  branchName?: string;
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
  track?: EnrollmentTrack;
  weeklyPattern?: WeeklyPatternEntry[];
}

export interface UpdateEnrollmentRequest {
  enrollDate?: string;
  tuitionPlanId?: string;
  track?: EnrollmentTrack;
  weeklyPattern?: WeeklyPatternEntry[];
  clearWeeklyPattern?: boolean;
}

export interface AssignTuitionPlanRequest {
  tuitionPlanId: string;
}

export interface AddEnrollmentScheduleSegmentRequest {
  effectiveFrom: string;
  effectiveTo?: string | null;
  weeklyPattern?: WeeklyPatternEntry[];
  clearWeeklyPattern?: boolean;
}

export interface EnrollmentFilterParams {
  classId?: string;
  studentProfileId?: string;
  status?: EnrollmentStatus;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  branchId?: string;
}

export interface EnrollmentPaginatedResponse {
  items: Enrollment[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface EnrollmentHistoryPaginatedResponse {
  studentProfileId?: string;
  studentName?: string;
  enrollments: EnrollmentPaginatedResponse;
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
