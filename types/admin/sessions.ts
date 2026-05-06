export type ParticipationType = "OFFLINE" | "ONLINE";
export type ChangeTeacherRole = "MainTeacher" | "Assistant";

export interface CreateSessionRequest {
  classId: string;
  plannedDatetime: string; // ISO datetime
  durationMinutes: number;
  plannedRoomId: string;
  plannedTeacherId: string;
  plannedAssistantId?: string;
  participationType: ParticipationType | string;
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
}

export interface UpdateSessionsByClassResult {
  updatedSessionsCount: number;
  updatedSessionIds: string[];
  skippedSessionIds: string[];
  errors: string[];
}

