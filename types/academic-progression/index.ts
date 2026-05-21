// Phase 2 — Academic Progression Types

// ─── Enums ────────────────────────────────────────────────────────────────────

export type StudentProgressStatus =
  | "NotStarted"
  | "InProgress"
  | "Completed"
  | "RemedialRequired";

export type AssessmentResult = "Pass" | "Fail" | "Pending";

export type PromotionDecisionOutcome = "Pass" | "Fail" | "RemedialRequired";

export type PromotionStatus = "Pending" | "Passed" | "Failed" | "RemedialRequired";

export type AssessmentStatus = "Passed" | "Failed" | "Pending";

// ─── Level ───────────────────────────────────────────────────────────────────

export interface LevelDto {
  id: string;
  programId: string;
  programName?: string;
  code: string;
  name: string;
  order: number;
  description?: string | null;
  isActive: boolean;
}

export interface CreateLevelRequest {
  programId: string;
  code: string;
  name: string;
  order: number;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateLevelRequest {
  code?: string;
  name?: string;
  order?: number;
  description?: string | null;
  isActive?: boolean;
}

export interface GetLevelsParams {
  programId?: string;
  isActive?: boolean;
  searchTerm?: string;
}

export type ModuleType = 'core' | 'revision' | 'test' | 'placement' | 'trial';

export type ClassModuleProgressStatus = 'skipped' | 'pending' | 'active' | 'completed';

// ─── Module ──────────────────────────────────────────────────────────────────

export interface ModuleDto {
  id: string;
  levelId: string;
  levelCode?: string;
  levelName?: string;
  code: string;
  name: string;
  order: number;
  orderIndex?: number;
  type?: ModuleType;
  description?: string | null;
  requiredSessions?: number;
  plannedSessionCount?: number;
  totalSessions?: number;
  lessonPlanCount?: number;
  isActive: boolean;
}

export interface CreateModuleRequest {
  levelId: string;
  code: string;
  name: string;
  order: number;
  type?: ModuleType;
  description?: string | null;
  plannedSessionCount?: number;
  totalSessions?: number;
  isActive?: boolean;
}

export interface UpdateModuleRequest {
  code?: string;
  name?: string;
  order?: number;
  type?: ModuleType;
  description?: string | null;
  plannedSessionCount?: number;
  totalSessions?: number;
  isActive?: boolean;
}

export interface GetModulesParams {
  levelId?: string;
  type?: ModuleType;
  isActive?: boolean;
  searchTerm?: string;
}

// ─── Class Module Progress ───────────────────────────────────────────────────

export interface ClassModuleProgressDto {
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  orderIndex: number;
  requiredSessions: number;
  completedSessions: number;
  status: ClassModuleProgressStatus;
}

export interface ClassModuleProgressDetailDto extends ClassModuleProgressDto {
  classId: string;
  className: string;
}

// ─── Student Progress ────────────────────────────────────────────────────────

export interface StudentProgressDto {
  id: string;
  studentProfileId: string;
  moduleId: string;
  moduleCode?: string;
  moduleName?: string;
  levelCode?: string;
  status: StudentProgressStatus;
  completionPercent: number;
  assessmentStatus?: AssessmentStatus | null;
  promotionStatus?: PromotionStatus | null;
  lastAssessmentId?: string | null;
  currentLessonPlanTemplateId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface UpdateStudentProgressRequest {
  studentProfileId: string;
  moduleId: string;
  currentLessonPlanTemplateId?: string | null;
  completionPercent: number;
}

export interface WeakModuleDto {
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  remedialCount: number;
  averageCompletionPercent: number;
}

export interface StudentProgressDashboardDto {
  inProgressStudents: number;
  completedStudents: number;
  remedialRequiredStudents: number;
  failedPromotions: number;
  weakModules: WeakModuleDto[];
}

// ─── Assessment ──────────────────────────────────────────────────────────────

export interface AssessmentDto {
  id: string;
  studentProfileId: string;
  studentName?: string;
  moduleId: string;
  moduleCode?: string;
  moduleName?: string;
  sessionId?: string | null;
  type: string;
  score: number;
  result: AssessmentResult;
  teacherComment?: string | null;
  assessedBy?: string | null;
  assessedByName?: string | null;
  assessedAt?: string | null;
  createdAt?: string;
}

export interface CreateAssessmentRequest {
  studentProfileId: string;
  moduleId: string;
  sessionId?: string | null;
  type: string;
  score: number;
  teacherComment?: string | null;
  assessedAt: string;
}

// ─── Teacher Evaluation ──────────────────────────────────────────────────────

export interface TeacherEvaluationDto {
  id: string;
  studentProfileId: string;
  studentName?: string;
  moduleId: string;
  moduleCode?: string;
  moduleName?: string;
  speaking: number;
  listening: number;
  reading: number;
  writing: number;
  participation: number;
  confidence: number;
  behavior: number;
  notes?: string | null;
  evaluatedBy?: string | null;
  evaluatedByName?: string | null;
  evaluatedAt?: string | null;
  createdAt?: string;
}

export interface CreateTeacherEvaluationRequest {
  studentProfileId: string;
  moduleId: string;
  speaking: number;
  listening: number;
  reading: number;
  writing: number;
  participation: number;
  confidence: number;
  behavior: number;
  notes?: string | null;
  evaluatedAt: string;
}

// ─── Promotion Decision ──────────────────────────────────────────────────────

export interface PromotionDecisionDto {
  id: string;
  studentProfileId: string;
  studentName?: string;
  moduleId: string;
  moduleCode?: string;
  moduleName?: string;
  decision: PromotionDecisionOutcome;
  reason?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
}

export interface CreatePromotionDecisionRequest {
  studentProfileId: string;
  moduleId: string;
  reason?: string | null;
  approvedAt: string;
}

// ─── Remedial Plan ───────────────────────────────────────────────────────────

export interface RemedialPlanDto {
  id: string;
  studentProfileId: string;
  studentName?: string;
  moduleId: string;
  moduleCode?: string;
  moduleName?: string;
  weakSkills?: string | null;
  recommendedSessionCount: number;
  notes?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string;
}

export interface CreateRemedialPlanRequest {
  studentProfileId: string;
  moduleId: string;
  weakSkills?: string | null;
  recommendedSessionCount: number;
  notes?: string | null;
}
