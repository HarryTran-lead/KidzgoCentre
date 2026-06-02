export interface CreateTuitionPlan {
  programId: string;
  levelId?: string | null;
  moduleId?: string | null;
  name: string;
  totalSessions: number;
  tuitionAmount: number;
  currency: string;
  learningTicketTypeId?: string | null;
}

export interface CreateTuitionPlanResponse {
  id: string;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  levelId: string;
  levelName: string;
  moduleId?: string | null;
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

export interface TuitionPlan {
  id: string;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  levelId: string;
  levelName: string;
  moduleId?: string | null;
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

export interface UpdateTuitionPlanRequest {
  programId?: string;
  levelId?: string | null;
  moduleId?: string | null;
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

export interface UpdateTuitionPlanResponse {
  id: string;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  levelId: string;
  levelName: string;
  moduleId?: string | null;
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
