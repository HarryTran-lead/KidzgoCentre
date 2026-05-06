export type ProgramProgressionMethod =
  | "PassFail"
  | "Shields"
  | "CambridgeScale";

export type ProgramProgressionScheduleStatus =
  | "Scheduled"
  | "Completed"
  | "Cancelled";

export type ProgramProgressionScheduleParticipantStatus =
  | "Scheduled"
  | "Completed"
  | "NoShow"
  | "Cancelled";

export type ProgramProgressionAssessmentStatus =
  | "Recorded"
  | "Approved";

export interface ProgramProgressionShieldMapping {
  skill?: string;
  sourceShieldId: string;
  sourceShieldName?: string;
  targetShieldId: string;
  targetShieldName?: string;
}

export interface ProgramProgressionClassificationBand {
  minimumScore: number;
  maximumScore?: number | null;
  label?: string;
  classification: string;
  targetProgramId: string;
}

export interface ProgramProgressionRule {
  id: string;
  sourceProgramId: string;
  sourceProgramName?: string;
  targetProgramId?: string | null;
  targetProgramName?: string | null;
  method: ProgramProgressionMethod;
  minimumShieldCount?: number | null;
  minimumSkillShieldCount?: number | null;
  minimumOverallScore?: number | null;
  carryOverRemainingSessions: boolean;
  stopCurrentEnrollmentOnApproval: boolean;
  isActive: boolean;
  notes?: string | null;
  shieldMappings?: ProgramProgressionShieldMapping[];
  classificationBands?: ProgramProgressionClassificationBand[];
}

export interface ProgramProgressionRuleUpsertPayload {
  sourceProgramId: string;
  targetProgramId?: string | null;
  method: ProgramProgressionMethod;
  minimumShieldCount?: number | null;
  minimumSkillShieldCount?: number | null;
  minimumOverallScore?: number | null;
  carryOverRemainingSessions?: boolean;
  stopCurrentEnrollmentOnApproval?: boolean;
  isActive?: boolean;
  notes?: string | null;
  shieldMappings?: ProgramProgressionShieldMapping[];
  classificationBands?: ProgramProgressionClassificationBand[];
}

export interface ProgramProgressionRuleQuery {
  sourceProgramId?: string;
  isActive?: boolean;
}

export interface ProgramProgressionAvailabilityConflict {
  type?: string;
  title?: string;
  startAt?: string;
  endAt?: string;
}

export interface ProgramProgressionAvailableStudent {
  studentProfileId: string;
  studentName: string;
  isAvailable: boolean;
  conflicts?: ProgramProgressionAvailabilityConflict[];
}

export interface ProgramProgressionAvailableTeacher {
  userId: string;
  teacherName: string;
  isAvailable: boolean;
  conflicts?: ProgramProgressionAvailabilityConflict[];
}

export interface ProgramProgressionAvailableRoom {
  roomId: string;
  roomName: string;
  capacity?: number;
  isAvailable: boolean;
  conflicts?: ProgramProgressionAvailabilityConflict[];
}

export interface ProgramProgressionScheduleAvailability {
  scheduleExists?: boolean;
  startAt?: string;
  endAt?: string;
  durationMinutes?: number;
  availableStudents: ProgramProgressionAvailableStudent[];
  availableTeachers: ProgramProgressionAvailableTeacher[];
  unavailableStudents: ProgramProgressionAvailableStudent[];
  unavailableTeachers: ProgramProgressionAvailableTeacher[];
  availableRooms?: ProgramProgressionAvailableRoom[];
  unavailableRooms?: ProgramProgressionAvailableRoom[];
}

export interface ProgramProgressionScheduleAvailabilityQuery {
  sourceClassId: string;
  scheduledAt: string;
  durationMinutes?: number;
  excludeScheduleId?: string;
  includeUnavailable?: boolean;
}

export interface ProgramProgressionScheduleParticipant {
  id: string;
  studentProfileId: string;
  studentName: string;
  status: ProgramProgressionScheduleParticipantStatus;
  assessmentId?: string | null;
  assessmentStatus?: ProgramProgressionAssessmentStatus | null;
}

export interface ProgramProgressionSchedule {
  id: string;
  sourceClassId: string;
  sourceClassName?: string;
  scheduledAt: string;
  durationMinutes?: number;
  roomId?: string | null;
  roomName?: string | null;
  assignedTeacherUserId?: string | null;
  assignedTeacherName?: string | null;
  status: ProgramProgressionScheduleStatus;
  notes?: string | null;
  participants?: ProgramProgressionScheduleParticipant[];
  scheduledParticipantCount?: number;
  completedParticipantCount?: number;
}

export interface ProgramProgressionScheduleQuery {
  sourceClassId?: string;
  studentProfileId?: string;
  assignedTeacherUserId?: string;
  status?: ProgramProgressionScheduleStatus;
  participantStatus?: ProgramProgressionScheduleParticipantStatus;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ProgramProgressionScheduleUpsertPayload {
  sourceClassId: string;
  scheduledAt: string;
  durationMinutes?: number;
  roomId?: string | null;
  assignedTeacherUserId?: string | null;
  notes?: string | null;
  studentProfileIds?: string[] | null;
}

export interface ProgramProgressionMyAssessmentSchedule {
  id: string;
  sourceClassName?: string;
  scheduledAt: string;
  durationMinutes?: number;
  roomName?: string | null;
  assignedTeacherName?: string | null;
  status: ProgramProgressionScheduleStatus;
  participantStatus?: ProgramProgressionScheduleParticipantStatus;
  assessmentStatus?: ProgramProgressionAssessmentStatus | null;
}

export interface ProgramProgressionMyAssessmentScheduleQuery {
  studentProfileId?: string;
  status?: ProgramProgressionScheduleStatus;
  participantStatus?: ProgramProgressionScheduleParticipantStatus;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ProgramProgressionAssessment {
  id: string;
  sourceRegistrationId?: string | null;
  scheduleParticipantId?: string | null;
  studentProfileId: string;
  studentName?: string;
  sourceProgramId?: string | null;
  sourceProgramName?: string | null;
  method?: ProgramProgressionMethod;
  assessmentDate?: string;
  passedInClass?: boolean | null;
  listeningScore?: number | null;
  speakingScore?: number | null;
  readingWritingScore?: number | null;
  readingScore?: number | null;
  writingScore?: number | null;
  overallScore?: number | null;
  status: ProgramProgressionAssessmentStatus;
  isEligible?: boolean;
  targetProgramId?: string | null;
  targetProgramName?: string | null;
  comment?: string | null;
  attachmentUrls?: string[];
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  approvalNote?: string | null;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
}

export interface ProgramProgressionAssessmentQuery {
  sourceRegistrationId?: string;
  studentProfileId?: string;
  sourceProgramId?: string;
  method?: ProgramProgressionMethod;
  status?: ProgramProgressionAssessmentStatus;
  isEligible?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface ProgramProgressionAssessmentUpsertPayload {
  sourceRegistrationId?: string;
  scheduleParticipantId?: string;
  assessmentDate?: string;
  passedInClass?: boolean | null;
  listeningScore?: number | null;
  speakingScore?: number | null;
  readingWritingScore?: number | null;
  readingScore?: number | null;
  writingScore?: number | null;
  comment?: string | null;
  attachmentUrls?: string[];
}

export interface ProgramProgressionApproveAssessmentPayload {
  tuitionPlanId?: string;
  approvalNote?: string;
}

export interface ProgramProgressionBulkApproveItem {
  assessmentId: string;
  tuitionPlanId?: string;
  approvalNote?: string;
}

export interface ProgramProgressionBulkApprovePayload {
  items: ProgramProgressionBulkApproveItem[];
}

export interface ProgramProgressionBulkApproveResultItem {
  assessmentId: string;
  success: boolean;
  newRegistrationId?: string;
  message?: string;
}

export interface ProgramProgressionBulkApproveResult {
  successCount: number;
  failureCount: number;
  results: ProgramProgressionBulkApproveResultItem[];
}

export interface ProgramProgressionApproveResult {
  assessmentId: string;
  status: ProgramProgressionAssessmentStatus;
  newRegistrationId?: string;
  targetProgramId?: string;
}

export interface ProgramProgressionPaginatedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ProgramProgressionValidationError {
  [field: string]: string[];
}

export interface ProgramProgressionApiProblem {
  title?: string;
  detail?: string;
  message?: string;
  code?: string;
  errors?: ProgramProgressionValidationError;
}
