export type RegistrationStatus =
  | "New"
  | "WaitingForClass"
  | "ClassAssigned"
  | "Studying"
  | "Paused"
  | "Completed"
  | "Cancelled";

export type EntryType = "Immediate" | "Wait" | "Makeup" | "Retake";
export type RegistrationTrackType = "primary" | "secondary";

export interface RegistrationStudySchedule {
  track?: RegistrationTrackType | null;
  classId?: string | null;
  className?: string | null;
  programId?: string | null;
  programName?: string | null;
  usesClassDefaultSchedule?: boolean | null;
  classSchedulePattern?: string | null;
  effectiveSchedulePattern?: string | null;
  studyDayCodes?: string[];
  studyDays?: string[];
  studyDayDisplayNames?: string[];
  studyDaysSummary?: string | null;
}

export interface RegistrationFirstStudySession {
  track?: RegistrationTrackType | null;
  classId?: string | null;
  className?: string | null;
  sessionDate?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  studyDayCode?: string | null;
  studyDayName?: string | null;
}

export interface RegistrationRequest {
  studentProfileId: string;
  branchId: string;
  programId: string;
  tuitionPlanId: string;
  secondaryProgramId?: string | null;
  secondaryProgramSkillFocus?: string | null;
  expectedStartDate?: string | null;
  preferredSchedule?: string | null;
  note?: string | null;
}

export interface UpdateRegistrationRequest {
  expectedStartDate?: string | null;
  preferredSchedule?: string | null;
  note?: string | null;
  tuitionPlanId?: string | null;
  secondaryProgramId?: string | null;
  secondaryProgramSkillFocus?: string | null;
  removeSecondaryProgram?: boolean | null;
}

export interface AssignClassRequest {
  classId?: string | null;
  entryType?: EntryType;
  track?: RegistrationTrackType;
  firstStudyDate?: string | null;
  sessionSelectionPattern?: string | null;
}

export interface Registration {
  id: string;
  studentProfileId: string;
  studentName: string | null;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  secondaryProgramId?: string | null;
  secondaryProgramName?: string | null;
  secondaryProgramSkillFocus?: string | null;
  tuitionPlanId: string;
  tuitionPlanName: string;
  registrationDate: string;
  expectedStartDate: string;
  actualStartDate: string;
  preferredSchedule: string;
  note: string;
  status: RegistrationStatus;
  classId: string;
  className: string;
  secondaryClassId?: string | null;
  secondaryClassName?: string | null;
  secondaryEntryType?: EntryType | null;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  firstStudySession?: RegistrationFirstStudySession | null;
  actualStudySchedules?: RegistrationStudySchedule[];
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestedClass {
  id: string;
  code: string;
  title: string;
  status: "Planned" | "Ongoing" | "Completed" | "Cancelled";
  capacity: number;
  currentEnrollment: number;
  remainingSlots: number;
  startDate: string;
  endDate: string;
  schedulePattern: string;
  mainTeacherName: string;
  classroomName: string | null;
  isClassStarted: boolean;
}

export interface SuggestedClassBucket {
  registrationId: string;
  programName?: string | null;
  length?: number;
  suggestedClasses: SuggestedClass[];
  alternativeClasses: SuggestedClass[];
  secondaryProgramId?: string | null;
  secondaryProgramName?: string | null;
  secondaryProgramSkillFocus?: string | null;
  secondarySuggestedClasses: SuggestedClass[];
  secondaryAlternativeClasses: SuggestedClass[];
}

export interface RegistrationFilterParams {
  studentProfileId?: string;
  branchId?: string;
  programId?: string;
  status?: RegistrationStatus;
  classId?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface RegistrationPaginatedResponse {
  items: Registration[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface RegistrationActionResponse {
  isSuccess?: boolean;
  success?: boolean;
  message?: string;
  id?: string;
  registrationId?: string;
  originalRegistrationId?: string;
  newRegistrationId?: string;
  data?: {
    id?: string;
    registrationId?: string;
    originalRegistrationId?: string;
    newRegistrationId?: string;
    registration?: Registration;
    [key: string]: any;
  } | any;
}
