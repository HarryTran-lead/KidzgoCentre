export type CourseRow = {
  id: string;
  name: string;
  desc: string;
  duration: string;
  fee: string;
  classes: string;
  students: string;
  status: string;
  assignedBranchCount?: number;
  isMakeup?: boolean | null;
  isSupplementary?: boolean | null;
};

export interface CreateProgramRequest {
  name: string;
  code: string;
  isMakeup: boolean;
  isSupplementary: boolean;
}

export interface Program {
  id: string;
  code?: string | null;
  name: string;
  isMakeup?: boolean | null;
  isSupplementary?: boolean | null;
  totalSessions?: number | null;
  defaultTuitionAmount?: number | null;
  unitPriceSession?: number | null;
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
  branchAssignments?: BranchAssignment[] | null;
  assignedBranchCount?: number | null;
  maxLeavesPerMonth?: number | null;
  monthlyLeaveLimit?: number | null;
  leavePolicy?: ProgramLeavePolicy | null;
  programLeavePolicy?: ProgramLeavePolicy | null;
}

export interface BranchAssignment {
  branchId: string;
  branchName?: string | null;
  isActive?: boolean | null;
  defaultMakeupClassId?: string | null;
}

export interface AssignBranchResponse {
  id: string;
  programId: string;
  programName?: string | null;
  branchId: string;
  branchName?: string | null;
  isActive?: boolean | null;
  defaultMakeupClassId?: string | null;
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
