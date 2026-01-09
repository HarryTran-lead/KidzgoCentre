// Attendance Detail Types for Student Portal

export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED" | "MAKEUP" | "LATE" | "EARLY_LEAVE";
export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "MAKEUP_SESSION";
export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type CheckInMethod = "QR_CODE" | "TEACHER" | "AUTO_GPS";
export type AttitudeRating = "GOOD" | "FAIR" | "NEEDS_IMPROVEMENT";
export type MakeupSessionStatus = "SCHEDULED" | "COMPLETED";

export interface LeaveRequest {
  id: string;
  status: LeaveRequestStatus;
  sender: string;
  submittedAt: string;
  reason: string;
  parentNote?: string;
  attachments?: string[];
}

export interface MakeupSession {
  date: string;
  className: string;
  time: string;
  status: MakeupSessionStatus;
}

export interface MakeupInfo {
  hasCredit: boolean;
  creditUsed: boolean;
  makeupSession?: MakeupSession;
}

export interface LessonContent {
  unit: string;
  topic: string;
  objectives: string[];
  materials: string[];
}

export interface TeacherFeedback {
  comment: string;
  attitude: AttitudeRating;
  participation: number; // 1-5 scale
  suggestions?: string;
}

export interface AttendanceDetail {
  id: string;
  
  // Session Information
  className: string;
  subject: string;
  level: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  isOnline: boolean;
  teacher: string;
  sessionStatus: SessionStatus;
  
  // Attendance Status
  attendanceStatus: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  checkInMethod?: CheckInMethod;
  
  // Reason & Notes
  absenceReason?: string;
  parentNote?: string;
  teacherNote?: string;
  
  // Leave Request
  leaveRequest?: LeaveRequest;
  
  // Makeup
  makeupInfo?: MakeupInfo;
  
  // Class Content
  lesson: LessonContent;
  
  // Teacher Feedback
  feedback?: TeacherFeedback;
  
  // Homework
  homeworkSubmitted: boolean;
}

// Status Badge Configuration Types
export interface StatusBadgeConfig {
  text: string;
  color: string;
  icon?: any; // LucideIcon type
}

export type AttendanceStatusConfig = Record<AttendanceStatus, StatusBadgeConfig>;
export type SessionStatusConfig = Record<SessionStatus, Omit<StatusBadgeConfig, 'icon'>>;
export type LeaveRequestStatusConfig = Record<LeaveRequestStatus, Omit<StatusBadgeConfig, 'icon'>>;
