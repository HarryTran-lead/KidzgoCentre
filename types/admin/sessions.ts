export type ParticipationType = "OFFLINE" | "ONLINE";

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
  plannedTeacherName?: string | null;
  teacherName?: string | null;
  plannedTeacherId?: string | null;
  actualTeacherId?: string | null;
  participationType?: string | null;
  status?: string | null;
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

