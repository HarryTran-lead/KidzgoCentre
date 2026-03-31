/**
 * Teacher Attendance Types
 * 
 * Type definitions for teacher attendance related data structures
 */

export type AttendanceStatus = "present" | "absent" | "makeup" | "notMarked";
export type AttendanceRawStatus = "Present" | "Absent" | "Makeup" | "NotMarked";

export type Student = {
  id: string;
  studentName: string;
  status: AttendanceStatus | null;
  absenceRate: number;
  note?: string;
  absenceType?: string | null;
  hasMakeupCredit?: boolean | null;
  studentProfileId?: string;
  attendanceId?: string;
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
  sessionId?: string | null;
  studentProfileId?: string | null;
  studentName?: string | null;
  attendanceStatus?: AttendanceRawStatus | null;
  absenceType?: string | null;
  hasMakeupCredit?: boolean | null;
  note?: string | null;
  markedAt?: string | null;
};

export type StudentAttendanceHistoryItem = {
  id?: string | null;
  sessionId?: string | null;
  sessionDateTime?: string | null;
  sessionName?: string | null;
  date?: string | null;
  startTime?: string | null;
  className?: string | null;
  attendanceStatus?: AttendanceRawStatus | null;
  absenceType?: string | null;
  note?: string | null;
  markedAt?: string | null;
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
  isSuccess?: boolean;
  success?: boolean;
  data?: {
    sessionId?: string | null;
    sessionName?: string | null;
    date?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    summary?: AttendanceSummaryApi;
    attendanceSummary?: AttendanceSummaryApi;
    attendances?: AttendanceItemApi[];
    students?: AttendanceItemApi[];
    items?: AttendanceItemApi[];
    results?: AttendanceItemApi[];
  } | AttendanceItemApi[] | AttendanceItemApi;
  message?: string;
};

export type StudentAttendanceHistoryApiResponse = {
  isSuccess?: boolean;
  success?: boolean;
  data?: {
    items?: StudentAttendanceHistoryItem[];
    pageNumber?: number;
    pageSize?: number;
    totalPages?: number;
    totalCount?: number;
    hasPreviousPage?: boolean;
    hasNextPage?: boolean;
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
  attendanceStatus: number;
  note?: string;
};

export type UpdateAttendanceRequest = {
  attendanceStatus: number;
  note?: string;
};

export type FetchAttendanceResult = {
  students: Student[];
  attendanceSummary: AttendanceSummaryApi;
  hasAnyMarked: boolean;
};

export type FetchStudentAttendanceHistoryParams = {
  pageNumber?: number;
  pageSize?: number;
};

export type FetchStudentAttendanceHistoryResult = {
  items: StudentAttendanceHistoryItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
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
