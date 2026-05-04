export type ClassRow = {
  id: string; 
  code: string; 
  name: string;
  sub: string;
  teacher: string;
  branch: string;
  current: number;
  capacity: number;
  schedule: string;
  startDate?: string;
  status: "Đang học" | "Sắp khai giảng" | "Đã kết thúc";
};

export interface ScheduleSlot {
  dayOfWeek: "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
  startTime: string; // Format: "HH:mm"
  durationMinutes: number;
}

export interface CreateClassRequest {
  branchId: string;
  programId: string;
  code: string;
  title: string;
  description?: string;
  mainTeacherId?: string;
  assistantTeacherId?: string;
  roomId?: string;
  startDate: string; // ISO date format: "2026-03-24"
  endDate: string; // Required for class creation
  capacity: number;
  weeklyScheduleSlots: ScheduleSlot[]; // New format instead of schedulePattern
  status?: string; // Auto set to "Active" when creating new class
}

export interface Class {
  id: string;
  code?: string | null;
  title?: string | null;
  description?: string | null;
  programId?: string | null;
  branchId?: string | null;
  mainTeacherId?: string | null;
  assistantTeacherId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
  weeklyScheduleSlots?: ScheduleSlot[] | null;
  schedulePattern?: string | null; // Kept for backward compatibility
  status?: string | null;
}

export interface CreateClassResponse {
  class: Class;
}

export type Track = "IELTS" | "TOEIC" | "Business";

export interface ClassDetail {
  id: string;
  name: string;
  code: string;
  track: Track;
  students: number;
  schedule: string;
  room: string;
  branch: string;
  program: string;
  programId: string;
  totalSessions: number;
  progress: number;
  teacher: string;
  assistantTeacher: string;
  description: string;
  startDate: string;
  endDate: string;
  completedLessons: number;
}