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

<<<<<<< HEAD
export interface ScheduleSlot {
  dayOfWeek: "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
  startTime: string; // Format: "HH:mm"
  durationMinutes: number;
}

=======
>>>>>>> c151e30da634bad24b09f75cff13da27b4540bef
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
<<<<<<< HEAD
  endDate: string; // Required for class creation
  capacity: number;
  weeklyScheduleSlots: ScheduleSlot[]; // New format instead of schedulePattern
  status?: string; // Auto set to "Active" when creating new class
=======
  endDate?: string; // Backend may auto-calculate when schedule pattern and program data are available.
  capacity: number;
  schedulePattern?: string; // RRULE format: "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=8;BYMINUTE=30;DURATION=60"
  status?: string; // Auto set to "Planned" when creating new class
>>>>>>> c151e30da634bad24b09f75cff13da27b4540bef
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
<<<<<<< HEAD
  weeklyScheduleSlots?: ScheduleSlot[] | null;
  schedulePattern?: string | null; // Kept for backward compatibility
=======
  schedulePattern?: string | null;
>>>>>>> c151e30da634bad24b09f75cff13da27b4540bef
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
