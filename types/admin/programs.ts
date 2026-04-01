export type CourseRow = {
  id: string;
  name: string;
  desc: string;
  duration: string;
  fee: string;
  classes: string;
  students: string;
  status: string;
  branch?: string;
  isMakeup?: boolean | null;
  isSupplementary?: boolean | null;
};

export interface CreateProgramRequest {
  branchId: string;
  name: string;
  code?: string;
  isMakeup: boolean;
  isSupplementary: boolean;
  defaultMakeupClassId?: string | null;
  isActive?: boolean;
  totalSessions: number;
  defaultTuitionAmount: number;
  unitPriceSession: number;
  description: string;
}

export interface Program {
  id: string;
  code?: string | null;
  name: string;
  isMakeup?: boolean | null;
  isSupplementary?: boolean | null;
  totalSessions: number;
  defaultTuitionAmount: number;
  unitPriceSession: number;
  description?: string | null;
  branchId?: string | null;
  isActive?: boolean | null;
  defaultMakeupClassId?: string | null;
}

export interface ProgramLeavePolicy {
  maxLeavesPerMonth?: number | null;
}

export interface ProgramDetail extends Program {
  branchName?: string | null;
  status?: unknown;
  branch?: {
    id?: string | null;
    name?: string | null;
  } | null;
  maxLeavesPerMonth?: number | null;
  monthlyLeaveLimit?: number | null;
  leavePolicy?: ProgramLeavePolicy | null;
  programLeavePolicy?: ProgramLeavePolicy | null;
}

export interface UpdateProgramMonthlyLeaveLimitRequest {
  programId: string;
  maxLeavesPerMonth: number;
}

export interface UpdateProgramMonthlyLeaveLimitResponse {
  programId: string;
  maxLeavesPerMonth: number | null;
  raw?: unknown;
}

export interface CreateProgramResponse {
  program: Program;
}
