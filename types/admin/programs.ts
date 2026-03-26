export type CourseRow = {
  id: string;
  name: string;
  desc: string;
  duration: string;
  fee: string;
  classes: string;
  students: string;
  status: "Đang hoạt động" | "Tạm dừng";
  branch?: string;
};

export interface CreateProgramRequest {
  branchId: string;
  name: string;
  code?: string;           
  isMakeup: boolean;
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
  totalSessions: number;
  defaultTuitionAmount: number;
  unitPriceSession: number;
  description?: string | null;
  branchId?: string | null;
  isActive?: boolean | null;
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
