export type ParticipationType = "OFFLINE" | "ONLINE";
export type ChangeTeacherRole = "MainTeacher" | "Assistant";
export type SectionType = "Normal" | "Review" | "Makeup" | "Remedial" | "Assessment";

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  Normal: "Buổi học thường",
  Review: "Ôn tập",
  Makeup: "Học bù",
  Remedial: "Phụ đạo",
  Assessment: "Kiểm tra",
};

export const SECTION_TYPE_OPTIONS: { value: SectionType; label: string }[] = [
  { value: "Normal", label: "Buổi học thường" },
  { value: "Review", label: "Ôn tập" },
  { value: "Makeup", label: "Học bù" },
  { value: "Remedial", label: "Phụ đạo" },
  { value: "Assessment", label: "Kiểm tra" },
];

export interface CreateSessionRequest {
  classId: string;
  plannedDatetime: string; // ISO datetime
  durationMinutes: number;
  plannedRoomId: string;
  plannedTeacherId: string;
  plannedAssistantId?: string;
  participationType: ParticipationType | string;
  sectionType?: SectionType | string;
}

export interface Session {
  id: string;
  classId?: string | null;
  classTitle?: string | null;
  className?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  plannedDatetime: string;
  durationMinutes: number;
  actualDatetime?: string | null;
  plannedRoomName?: string | null;
  roomName?: string | null;
  plannedRoomId?: string | null;
  actualRoomId?: string | null;
  actualRoomName?: string | null;
  plannedTeacherName?: string | null;
  teacherName?: string | null;
  plannedTeacherId?: string | null;
  actualTeacherId?: string | null;
  actualTeacherName?: string | null;
  plannedAssistantName?: string | null;
  assistantName?: string | null;
  plannedAssistantId?: string | null;
  actualAssistantId?: string | null;
  actualAssistantName?: string | null;
  participationType?: string | null;
  sectionType?: SectionType | string | null;
  status?: string | null;
  color?: string | null;
}

export interface SessionChangeRoomRequest {
  sessionId?: string;
  sessionIds?: string[];
  roomId: string;
}

export interface SessionChangeTeacherRequest {
  sessionId?: string;
  sessionIds?: string[];
  teacherId: string;
  role: ChangeTeacherRole;
}

export interface SessionChangeResult {
  updatedSessionsCount: number;
  updatedSessionIds: string[];
  skippedSessionIds: string[];
  errors: string[];
}

export interface CreateSessionResponse {
  session: Session;
}

export interface GetSessionsParams {
  classId?: string;
  branchId?: string;
  status?: string;
  from?: string; // ISO datetime
  to?: string;   // ISO datetime
  pageNumber?: number;
  pageSize?: number;
}

export interface UpdateSessionsByClassRequest {
  classId: string;
  sessionIds?: string[];
  filterByStatus?: string[];
  fromDate?: string;
  plannedRoomId?: string;
  plannedTeacherId?: string;
  plannedAssistantId?: string;
  sectionType?: SectionType | string;
}

export interface UpdateSessionsByClassResult {
  updatedSessionsCount: number;
  updatedSessionIds: string[];
  skippedSessionIds: string[];
  errors: string[];
}

