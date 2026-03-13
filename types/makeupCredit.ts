import type { ApiResponse, ListData } from "./apiResponse";

export type MakeupCredit = {
  id: string;
  studentProfileId?: string;
  studentId?: string;
  studentName?: string;
  studentFullName?: string;
  classId?: string;
  className?: string;
  sourceSessionId?: string;
  usedSessionId?: string;
  status?: string;
  remainingCredits?: number;
  createdReason?: string;
  createdAt?: string;
  expiresAt?: string | null;
  sourceSessionDate?: string | null;
  [key: string]: unknown;
};

export type MakeupCreditStudent = {
  id?: string;
  studentProfileId?: string;
  studentId?: string;
  name?: string;
  fullName?: string;
  studentName?: string;
  studentFullName?: string;
  [key: string]: unknown;
};

export type MakeupSuggestion = {
  id?: string;
  sessionId?: string;
  targetSessionId?: string;
  classId?: string;
  classCode?: string;
  className?: string;
  classTitle?: string;
  programName?: string;
  programLevel?: number;
  plannedDatetime?: string;
  plannedEndDatetime?: string;
  branchId?: string;
  sessionDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
  session?: string;
  [key: string]: unknown;
};

export type MakeupAllocation = {
  id?: string;
  makeupCreditId?: string;
  studentProfileId?: string;
  targetSessionId?: string;
  classId?: string;
  allocatedAt?: string;
  usedAt?: string | null;
  createdAt?: string;
  [key: string]: unknown;
};

export type MakeupCreditsResponse = ApiResponse<ListData<MakeupCredit>>;
export type MakeupCreditResponse = ApiResponse<MakeupCredit>;
export type MakeupCreditStudentsResponse = ApiResponse<ListData<MakeupCreditStudent>>;
export type MakeupSuggestionsResponse = ApiResponse<ListData<MakeupSuggestion>>;
export type MakeupAllocationsResponse = ApiResponse<ListData<MakeupAllocation>>;
export type MakeupAllocationResponse = ApiResponse<MakeupAllocation>;
