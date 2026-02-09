/**
 * Teacher Attendance Types
 * 
 * Type definitions for teacher attendance related data structures
 */

export type AttendanceStatus = "present" | "late" | "absent";
export type AttendanceRawStatus = "Present" | "Late" | "Absent" | "NotMarked";

export type Student = {
  id: string;
  studentName: string;
  status: AttendanceStatus | null;
  absenceRate: number;
  note?: string;
};

export type LessonDetail = {
  id: string;
  course: string;
  lesson: string;
  date: string;
  time: string;
  room: string;
  teacher: string;
  students: number;
  branch?: string | null;
  status?: string | null;
  participationType?: string | null;
};

export type AttendanceSummaryApi = {
  totalStudents?: number;
  presentCount?: number;
  absentCount?: number;
  makeupCount?: number;
  notMarkedCount?: number;
} | null;

export type AttendanceItemApi = {
  id?: string | null;
  studentProfileId?: string | null;
  studentName?: string | null;
  attendanceStatus?: AttendanceRawStatus | null;
  absenceType?: string | null;
  hasMakeupCredit?: boolean | null;
  note?: string | null;
  comment?: string | null;
};

export type StudentAttendanceHistoryItem = {
  id?: string | null;
  sessionId?: string | null;
  sessionDateTime?: string | null;
  attendanceStatus?: AttendanceRawStatus | null;
  absenceType?: string | null;
  note?: string | null;
};

export type SessionApiItem = {
  id?: string | null;
  sessionId?: string | null;
  actualDatetime?: string | null;
  plannedDatetime?: string | null;
  durationMinutes?: number | null;
  classCode?: string | null;
  classTitle?: string | null;
  actualRoomName?: string | null;
  plannedRoomName?: string | null;
  actualTeacherName?: string | null;
  plannedTeacherName?: string | null;
  branchName?: string | null;
  status?: string | null;
  participationType?: string | null;
  attendanceSummary?: AttendanceSummaryApi;
};

export type AttendanceApiResponse = {
  success?: boolean;
  data?: AttendanceItemApi[] | { items?: AttendanceItemApi[] };
  message?: string;
};

export type StudentAttendanceHistoryApiResponse = {
  success?: boolean;
  data?: {
    items?: StudentAttendanceHistoryItem[];
    totalPages?: number;
    totalCount?: number;
  };
  message?: string;
};

export type SessionApiResponse = {
  success?: boolean;
  data?: {
    session?: SessionApiItem;
  } | SessionApiItem;
  message?: string;
};
export type SessionListApiResponse = {
  success?: boolean;
  data?: {
    items?: SessionApiItem[];
    totalCount?: number;
    totalPages?: number;
  } | SessionApiItem[];
  message?: string;
};

export type CreateAttendanceRequest = {
  studentProfileId: string;
  attendanceStatus: AttendanceRawStatus;
  comment?: string;
};

export type UpdateAttendanceRequest = {
  attendanceStatus: AttendanceRawStatus;
  comment?: string;
};

export type FetchAttendanceResult = {
  students: Student[];
  attendanceSummary: AttendanceSummaryApi;
  hasAnyMarked: boolean;
};
export type FetchSessionsParams = {
  classId?: string;
  branchId?: string;
  status?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type FetchSessionsResult = {
  sessions: SessionApiItem[];
  totalCount?: number;
  totalPages?: number;
};
export type FetchSessionResult = {
  lesson: LessonDetail;
  attendance: AttendanceSummaryApi;
};
