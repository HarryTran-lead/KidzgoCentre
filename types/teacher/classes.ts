/**
 * Teacher Classes Types
 * 
 * Type definitions for teacher classes related data structures
 */

export type Track = "IELTS" | "TOEIC" | "Business";

export type ClassItem = {
  id: string;
  name: string;
  code: string;
  track: Track;
  students: number;
  schedule: string;
  room: string;
  progress?: number;
  teacher?: string;
};

export type EnrollmentApiItem = {
  id?: string | null;
  classId?: string | null;
  classCode?: string | null;
  classTitle?: string | null;
  studentProfileId?: string | null;
  studentName?: string | null;
  enrollDate?: string | null;
  status?: string | null;
  programName?: string | null;
  schedulePattern?: string | null;
  capacity?: number | null;
  mainTeacherName?: string | null;
};

export type EnrollmentApiResponse = {
  success: boolean;
  data: {
    enrollments?: {
      items: EnrollmentApiItem[];
      totalPages?: number;
      totalCount?: number;
    };
    items?: EnrollmentApiItem[];
    totalPages?: number;
    totalCount?: number;
  } | EnrollmentApiItem[];
  message?: string;
};

export type FetchClassesParams = {
  pageNumber?: number;
  pageSize?: number;
};

export type FetchClassesResult = {
  classes: ClassItem[];
  totalPages?: number;
  totalCount?: number;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  attendance: number;
  progress: number;
  stars: number;
  lastActive: string;
  status: "active" | "inactive";
};

export type ClassDetail = {
  id: string;
  name: string;
  code: string;
  track: Track;
  students: number;
  schedule: string;
  room: string;
  progress: number;
  teacher: string;
  description: string;
  startDate: string;
  endDate: string;
  totalLessons: number;
  completedLessons: number;
};

export type FetchClassDetailParams = {
  classId: string;
  pageNumber?: number;
  pageSize?: number;
};

export type FetchClassDetailResult = {
  classDetail: ClassDetail;
  students: Student[];
};
