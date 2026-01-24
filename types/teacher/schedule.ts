/**
 * Teacher Schedule Types
 * 
 * Type definitions for teacher schedule related data structures
 */

export type Track = "IELTS" | "TOEIC" | "Business";

export type Lesson = {
  id: string;
  course: string;
  time: string;
  room: string;
  students: number;
  track: Track;
  color: string;
  duration: number; // minutes
  teacher?: string;
};

export type DaySchedule = {
  date: string; // yyyy-mm-dd
  dow: string;  // Thứ 2, Thứ 3, ...
  day: number;
  month: string;
  lessons: Lesson[];
};

export type TimetableApiItem = {
  id?: string | null;
  sessionId?: string | null;
  timetableId?: string | null;
  plannedDatetime?: string | null;
  durationMinutes?: number | null;
  classTitle?: string | null;
  className?: string | null;
  courseName?: string | null;
  subjectName?: string | null;
  plannedRoomName?: string | null;
  actualRoomName?: string | null;
  roomName?: string | null;
  room?: string | null;
  plannedTeacherName?: string | null;
  actualTeacherName?: string | null;
  teacherName?: string | null;
  teacherFullName?: string | null;
  classCode?: string | null;
  track?: string | null;
  program?: string | null;
  programName?: string | null;
  trackName?: string | null;
  students?: number | null;
  studentCount?: number | null;
  totalStudents?: number | null;
  total_students?: number | null;
  startTime?: string | null;
  start_time?: string | null;
  start?: string | null;
  startAt?: string | null;
  beginTime?: string | null;
  start_datetime?: string | null;
  endTime?: string | null;
  end_time?: string | null;
  end?: string | null;
  endAt?: string | null;
  finishTime?: string | null;
  end_datetime?: string | null;
  time?: string | null;
};

export type TimetableApiResponse = {
  success?: boolean;
  data?: {
    sessions?: TimetableApiItem[];
  } | TimetableApiItem[];
  message?: string;
};

export type FetchTimetableParams = {
  from: string; // ISO datetime string
  to: string;   // ISO datetime string
};

export type FetchTimetableResult = {
  weekData: DaySchedule[];
};
