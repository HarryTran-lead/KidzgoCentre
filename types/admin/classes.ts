export type ClassRow = {
  id: string; // UUID for API calls
  code: string; // Display code like "TS12"
  name: string;
  sub: string;
  teacher: string;
  branch: string;
  current: number;
  capacity: number;
  schedule: string;
  status: "Đang học" | "Sắp khai giảng" | "Đã kết thúc";
};

export interface CreateClassRequest {
  branchId: string;
  programId: string;
  code: string;
  title: string;
  mainTeacherId: string;
  assistantTeacherId?: string;
  startDate: string; // ISO date format: "2026-03-24"
  endDate: string; // ISO date format: "2026-03-24"
  capacity: number;
  schedulePattern: string; // RRULE format: "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=8;BYMINUTE=30;DURATION=60"
}

export interface Class {
  id: string;
  code?: string | null;
  title?: string | null;
  programId?: string | null;
  branchId?: string | null;
  mainTeacherId?: string | null;
  assistantTeacherId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
  schedulePattern?: string | null;
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
  progress: number;
  teacher: string;
  assistantTeacher: string;
  description: string;
  startDate: string;
  endDate: string;
  totalLessons: number;
  completedLessons: number;
}