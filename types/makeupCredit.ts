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
  className?: string;
  sessionDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
  session?: string;
  [key: string]: unknown;
};

export type MakeupCreditsResponse = ApiResponse<ListData<MakeupCredit>>;
export type MakeupCreditResponse = ApiResponse<MakeupCredit>;
export type MakeupCreditStudentsResponse = ApiResponse<ListData<MakeupCreditStudent>>;
export type MakeupSuggestionsResponse = ApiResponse<ListData<MakeupSuggestion>>;
