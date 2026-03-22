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
  isMakeup?: boolean | null;
  totalSessions: number;
  defaultTuitionAmount: number;
  unitPriceSession: number;
  description?: string | null;
  branchId?: string | null;
  isActive?: boolean | null;
}

export interface CreateProgramResponse {
  program: Program;
}