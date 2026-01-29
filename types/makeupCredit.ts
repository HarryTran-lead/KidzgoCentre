import type { ApiResponse, ListData } from "./apiResponse";

export type MakeupCredit = {
  id: string;
  studentProfileId?: string;
  studentId?: string;
  studentName?: string;
  studentFullName?: string;
  classId?: string;
  className?: string;
  status?: string;
  remainingCredits?: number;
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
export type MakeupSuggestionsResponse = ApiResponse<ListData<MakeupSuggestion>>;