export type CourseRow = {
  id: string;
  name: string;
  desc: string;
  level: string;
  duration: string;
  fee: string;
  classes: string;
  students: string;
  status: "Đang hoạt động" | "Tạm dừng" | "Đã kết thúc";
};

export interface CreateProgramRequest {
  branchId: string;
  name: string;
  level: string;
  totalSessions: number;
  defaultTuitionAmount: number;
  unitPriceSession: number;
  description: string;
}

export interface Program {
  id: string;
  code?: string | null;
  name: string;
  level: string;
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