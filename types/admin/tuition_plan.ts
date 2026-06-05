export interface CreateTuitionPlan {
  programId: string;
  levelId: string;
  syllabusId?: string | null;
  moduleIds?: string[];
  name: string;
  totalSessions: number;
  tuitionAmount: number;
  currency: string;
  learningTicketTypeId?: string | null;
}

export interface TuitionPlanModule {
  moduleId: string;
  moduleCode?: string | null;
  moduleName?: string | null;
  moduleOrder?: number | null;
  plannedSessionCount?: number | null;
}

export interface TuitionPlanResponseShape {
  id: string;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  levelId: string;
  levelName: string;
  syllabusId?: string | null;
  syllabusCode?: string | null;
  syllabusVersion?: string | number | null;
  syllabusTitle?: string | null;
  moduleIds: string[];
  modules: TuitionPlanModule[];
  /** @deprecated Use moduleIds/modules. Kept only for old callers. */
  moduleId?: string | null;
  /** @deprecated Use moduleIds/modules. Kept only for old callers. */
  moduleName?: string | null;
  name: string;
  totalSessions: number;
  tuitionAmount: number;
  unitPriceSession: number;
  currency: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  learningTicketTypeId?: string | null;
  learningTicketTypeCode?: string | null;
  learningTicketTypeName?: string | null;
}

export type CreateTuitionPlanResponse = TuitionPlanResponseShape;

export type TuitionPlan = TuitionPlanResponseShape;

export interface UpdateTuitionPlanRequest {
  programId?: string;
  levelId?: string;
  syllabusId?: string | null;
  moduleIds?: string[];
  name?: string;
  totalSessions?: number;
  tuitionAmount?: number;
  currency?: string;
  learningTicketTypeId?: string | null;
}

export interface TuitionPlanSyllabusMapping {
  id: string;
  syllabusId: string;
  syllabusCode: string;
  syllabusTitle: string;
  syllabusVersion: string;
  levelName: string;
  programName: string;
  isActive: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  createdAt: string;
}

export type UpdateTuitionPlanResponse = TuitionPlanResponseShape;
