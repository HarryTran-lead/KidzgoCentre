export interface CreateTuitionPlan {
  programId: string;
  levelId: string;
  name: string;
  totalSessions: number;
  tuitionAmount: number;
  currency: string;
}

export interface TuitionPlanResponseShape {
  id: string;
  branchId?: string | null;
  branchName?: string | null;
  programId: string;
  programName: string;
  levelId: string;
  levelName: string;
  name: string;
  totalSessions: number;
  tuitionAmount: number;
  unitPriceSession: number;
  currency: string;
  status: "active" | "inactive";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateTuitionPlanResponse = TuitionPlanResponseShape;

export type TuitionPlan = TuitionPlanResponseShape;

export interface UpdateTuitionPlanRequest {
  programId?: string;
  levelId?: string;
  name?: string;
  totalSessions?: number;
  tuitionAmount?: number;
  currency?: string;
}

export type UpdateTuitionPlanResponse = TuitionPlanResponseShape;
