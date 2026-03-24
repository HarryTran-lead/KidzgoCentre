export interface CreateTuitionPlan {
  branchId: string;
  programId: string;
  name: string;
  totalSessions: number;
  tuitionAmount: number;
  unitPriceSession: number;
  currency: string;
}

export interface CreateTuitionPlanResponse {
  id: string;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  name: string;
  totalSessions: number;
  tuitionAmount: number;
  unitPriceSession: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TuitionPlan {
  id: string;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  name: string;
  totalSessions: number;
  tuitionAmount: number;
  unitPriceSession: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTuitionPlanRequest {
  branchId?: string;
  programId?: string;
  name?: string;
  totalSessions?: number;
  tuitionAmount?: number;
  unitPriceSession?: number;
  currency?: string;
}

export interface UpdateTuitionPlanResponse {
  id: string;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  name: string;
  totalSessions: number;
  tuitionAmount: number;
  unitPriceSession: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
