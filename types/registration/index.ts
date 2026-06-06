export type RegistrationStatus =
  | "New"
  | "WaitingForClass"
  | "ClassAssigned"
  | "Studying"
  | "Paused"
  | "Completed"
  | "Cancelled";

export type CanonicalEntryType = "immediate" | "wait" | "retake";
export type LegacyEntryType = "Immediate" | "Wait" | "Makeup" | "Retake";
export type EntryType = CanonicalEntryType | LegacyEntryType;
export type RegistrationTrackType = "primary" | "secondary";

export interface WeeklyPatternEntry {
  dayOfWeeks: string[];
  startTime: string;
  durationMinutes: number;
}

export interface RegistrationStudySchedule {
  track?: RegistrationTrackType | null;
  classId?: string | null;
  className?: string | null;
  programId?: string | null;
  programName?: string | null;
  usesClassDefaultSchedule?: boolean | null;
  classSchedulePattern?: string | null;
  effectiveSchedulePattern?: string | null;
  classWeeklyScheduleSlots?: Array<{
    dayOfWeek?: string;
    dayCode?: string;
    startTime?: string;
    durationMinutes?: number;
  }>;
  weeklyPattern?: WeeklyPatternEntry[] | null;
  effectiveWeeklyPattern?: WeeklyPatternEntry[] | null;
  studyDayCodes?: string[];
  studyDays?: string[];
  studyDayDisplayNames?: string[];
  studyDaysSummary?: string | null;
}

export interface RegistrationFirstStudySession {
  track?: RegistrationTrackType | null;
  classId?: string | null;
  classEnrollmentId?: string | null;
  className?: string | null;
  sessionId?: string | null;
  plannedDatetime?: string | null;
  studyDate?: string | null;
}

export interface RegistrationRequest {
  studentProfileId: string;
  branchId: string;
  programId: string;
  levelId: string;
  tuitionPlanId: string;
  secondaryProgramId?: string | null;
  secondaryProgramSkillFocus?: string | null;
  secondaryLevelId?: string | null;
  secondaryLevelSkillFocus?: string | null;
  expectedStartDate?: string | null;
  preferredSchedule?: string | null;
  note?: string | null;
}

export interface UpdateRegistrationRequest {
  expectedStartDate?: string | null;
  preferredSchedule?: string | null;
  note?: string | null;
  tuitionPlanId?: string | null;
  levelId?: string | null;
  secondaryProgramId?: string | null;
  secondaryProgramSkillFocus?: string | null;
  secondaryLevelId?: string | null;
  secondaryLevelSkillFocus?: string | null;
  removeSecondaryProgram?: boolean | null;
  removeSecondaryLevel?: boolean | null;
}

export interface AssignClassRequest {
  classId?: string | null;
  entryType?: EntryType;
  track?: RegistrationTrackType;
  firstStudyDate?: string | null;
  sessionSelectionPattern?: string | null;
  weeklyPattern?: WeeklyPatternEntry[] | null;
}

export interface TransferBranchRequest {
  newBranchId: string;
  newClassId: string;
  effectiveDate: string;
  reason?: string | null;
  weeklyPattern: WeeklyPatternEntry[];
}

export interface Registration {
  id: string;
  studentProfileId: string;
  studentName: string | null;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  levelId?: string | null;
  levelName?: string | null;
  secondaryProgramId?: string | null;
  secondaryProgramName?: string | null;
  secondaryProgramSkillFocus?: string | null;
  secondaryLevelId?: string | null;
  secondaryLevelName?: string | null;
  secondaryLevelSkillFocus?: string | null;
  tuitionPlanId: string;
  tuitionPlanName: string;
  learningTicketTypeId?: string | null;
  learningTicketTypeCode?: string | null;
  learningTicketTypeName?: string | null;
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
  status: string;
  capacity: number;
  currentEnrollment: number;
  remainingSlots: number;
  startDate: string;
  endDate: string;
  startModuleId?: string | null;
  startModuleName?: string | null;
  startSessionIndex?: number | null;
  currentModuleId?: string | null;
  currentModuleName?: string | null;
  currentSessionIndex?: number | null;
  schedulePattern?: string | null;
  classSchedulePattern?: string | null;
  effectiveSchedulePattern?: string | null;
  scheduleText?: string | null;
  slotTypeId?: string | null;
  slotTypeCode?: string | null;
  slotTypeName?: string | null;
  weeklyScheduleSlots?: Array<{
    dayOfWeek?: string;
    dayCode?: string;
    startTime?: string;
    durationMinutes?: number;
  }>;
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
  levelId?: string | null;
  levelName?: string | null;
  secondaryProgramId?: string | null;
  secondaryProgramName?: string | null;
  secondaryProgramSkillFocus?: string | null;
  secondaryLevelId?: string | null;
  secondaryLevelName?: string | null;
  secondaryLevelSkillFocus?: string | null;
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

export interface RegistrationHistoryItem {
  id: string;
  registrationId?: string;
  actorUserId?: string | null;
  actorUserName?: string | null;
  actorProfileId?: string | null;
  actorProfileName?: string | null;
  action?: string | null;
  eventType?: string | null;
  title?: string | null;
  description?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  status?: RegistrationStatus | string | null;
  oldStatus?: RegistrationStatus | string | null;
  newStatus?: RegistrationStatus | string | null;
  oldClassName?: string | null;
  oldClassCode?: string | null;
  classId?: string | null;
  className?: string | null;
  classCode?: string | null;
  oldBranchName?: string | null;
  branchName?: string | null;
  newBranchName?: string | null;
  programName?: string | null;
  tuitionPlanName?: string | null;
  note?: string | null;
  reason?: string | null;
  dataBefore?: string | null;
  dataAfter?: string | null;
  details?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  timestamp?: string | null;
  changedAt?: string | null;
  changedByName?: string | null;
  actorName?: string | null;
  user?: string | null;
  role?: string | null;
  type?: string | null;
  reference?: string | null;
  ipAddress?: string | null;
  raw?: Record<string, string | null>;
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

export interface EnrollmentPaymentSetting {
  id: string | null;
  branchId: string | null;
  isFallbackToGlobal?: boolean;
  paymentMethod: string;
  accountName: string | null;
  accountNumber: string | null;
  bankName: string | null;
  bankCode: string | null;
  bankBin: string | null;
  vietQrTemplate: string;
  logoUrl: string | null;
  qrPreviewUrl: string | null;
  newStudentPolicyLines?: string[];
  reservationPolicyLines?: string[];
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export type EnrollmentPdfTrackResolved = "primary" | "secondary";
export type EnrollmentPdfFormTypeResolved = "newStudent" | "continuingStudent";

export interface EnrollmentPdfPreviewActiveFile {
  pdfUrl: string;
  generatedAt: string;
  generatedByName: string;
}

export interface EnrollmentPdfPreviewPayload {
  studentName: string;
  totalPayment: number;
  paymentQrUrl: string;
  [key: string]: any;
}

export interface EnrollmentPdfPreviewResponse {
  registrationId: string;
  trackResolved: EnrollmentPdfTrackResolved;
  formTypeResolved: EnrollmentPdfFormTypeResolved;
  warnings: string[];
  activePdf?: EnrollmentPdfPreviewActiveFile;
  preview: EnrollmentPdfPreviewPayload;
}

export interface PdfHistoryItem {
  pdfRecordId: string;
  pdfUrl: string;
  generatedAt: string;
  generatedByName: string;
  isActive: boolean;
  classCode: string;
}

export interface RegistrationImportActiveRequest {
  studentProfileId: string;
  branchId: string;
  programId: string;
  tuitionPlanId: string;
  actualStartDate: string;
  usedSessions: number;
  remainingSessions: number;
  expectedStartDate?: string | null;
  preferredSchedule?: string | null;
  note?: string | null;
  secondaryProgramId?: string | null;
  secondaryProgramSkillFocus?: string | null;
}

export type UpsertPaymentSettingRequest = Omit<
  EnrollmentPaymentSetting,
  "id" | "isFallbackToGlobal" | "qrPreviewUrl" | "createdAt" | "updatedAt" | "updatedBy"
>;
