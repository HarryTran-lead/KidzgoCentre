import { SESSION_ENDPOINTS } from "@/constants/apiURL";
import { get, post, put } from "@/lib/axios";
import type { ApiResponse } from "@/types/apiResponse";
import type {
  SessionDetail,
  SubmitTeachingLogRequest,
  SubmitTeachingLogResponse,
  TeachingLog,
} from "@/types/admin/sessions";

export type SourceSession = {
  id: string;
  classId: string;
  classCode?: string;
  classTitle?: string;
  branchName?: string;
  plannedDatetime?: string;
  actualDatetime?: string;
  durationMinutes?: number;
  moduleId?: string | null;
  lessonPlanTemplateId?: string | null;
  sessionIndexInModule?: number | null;
  teachingLogId?: string | null;
  teachingLogStatus?: string | null;
  teachingProgressStatus?: string | null;
  actualTeachingType?: string | null;
};

export type SessionByIdResponse = {
  isSuccess: boolean;
  data: {
    session: SessionDetail;
  };
};

export type SessionListResponse = {
  isSuccess: boolean;
  data: {
    sessions: {
      items: SourceSession[];
      pageNumber: number;
      pageSize: number;
      totalCount: number;
    };
  };
};

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  const objectValue = asObject(value);
  if (objectValue) return objectValue;
  if (typeof value !== 'string') return null;

  const text = value.trim();
  if (!text) return null;

  try {
    return asObject(JSON.parse(text));
  } catch {
    return null;
  }
}

function normalizeTeachingLogPayload(value: unknown): TeachingLog | null {
  const item = asObject(value);
  if (!item) return null;

  const contentObject = parseJsonObject(
    item['actualContent'] ??
      item['ActualContent'] ??
      item['realContent'] ??
      item['deliveredContent'],
  );

  const homeworkFromContent = contentObject?.['homeworkNotes'] ?? contentObject?.['actualHomework'] ?? contentObject?.['homework'];
  const teacherNoteFromContent =
    contentObject?.['teacherNotes'] ??
    contentObject?.['teacherNote'] ??
    contentObject?.['notes'] ??
    contentObject?.['note'];

  const normalizedHomework = Array.isArray(homeworkFromContent)
    ? homeworkFromContent
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
        .join('\n')
    : pickText(homeworkFromContent);

  const normalizedTeacherNote = Array.isArray(teacherNoteFromContent)
    ? teacherNoteFromContent
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
        .join('\n')
    : pickText(teacherNoteFromContent);

  return {
    teachingLogId: pickText(item['teachingLogId'], item['teachingLogID'], item['id']) ?? '',
    sessionId: pickText(item['sessionId'], item['SessionId']) ?? '',
    plannedLessonPlanTemplateId: pickText(item['plannedLessonPlanTemplateId'], item['PlannedLessonPlanTemplateId']),
    plannedLessonTitle: pickText(item['plannedLessonTitle'], item['PlannedLessonTitle']),
    actualLessonPlanTemplateId: pickText(item['actualLessonPlanTemplateId'], item['ActualLessonPlanTemplateId']),
    actualLessonTitle: pickText(item['actualLessonTitle'], item['ActualLessonTitle']),
    teachingLogStatus: pickText(item['teachingLogStatus'], item['TeachingLogStatus'], item['status']),
    progressStatus: pickText(item['progressStatus'], item['ProgressStatus']),
    actualTeachingType: pickText(item['actualTeachingType'], item['ActualTeachingType']),
    actualContent: pickText(item['actualContent'], item['ActualContent'], item['realContent'], item['deliveredContent']),
    actualHomework: pickText(
      item['actualHomework'],
      item['ActualHomework'],
      item['homework'],
      item['actualHomeWork'],
      normalizedHomework,
    ),
    teacherNote: pickText(
      item['teacherNote'],
      item['TeacherNote'],
      item['teacherNotes'],
      item['TeacherNotes'],
      item['note'],
      item['notes'],
      normalizedTeacherNote,
    ),
    submittedBy: pickText(item['submittedBy'], item['SubmittedBy']),
    submittedAt: pickText(item['submittedAt'], item['SubmittedAt']),
    updatedAt: pickText(item['updatedAt'], item['UpdatedAt']),
  };
}

export async function getSessionById(id: string): Promise<SessionByIdResponse> {
  return get<SessionByIdResponse>(SESSION_ENDPOINTS.GET_BY_ID(id));
}

export async function getAllSessions(params?: {
  classId?: string;
  branchId?: string;
  status?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<SessionListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.classId) queryParams.append('classId', params.classId);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.status) queryParams.append('status', params.status);
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  }

  const url = `${SESSION_ENDPOINTS.GET_ALL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return get<SessionListResponse>(url);
}

export async function getTeachingLog(sessionId: string): Promise<ApiResponse<TeachingLog>> {
  const response = await get<unknown>(SESSION_ENDPOINTS.TEACHING_LOG(sessionId));
  const envelope = asObject(response);
  const envelopeData = asObject(envelope?.data);
  const payload =
    envelopeData?.teachingLog ??
    envelope?.teachingLog ??
    envelope?.data ??
    response;
  const normalized = normalizeTeachingLogPayload(payload);

  if (envelope && ('data' in envelope || 'success' in envelope || 'isSuccess' in envelope || 'message' in envelope)) {
    return {
      ...(envelope as Omit<ApiResponse<TeachingLog>, 'data'>),
      data: (normalized ?? (payload as TeachingLog)),
    };
  }

  return {
    success: true,
    isSuccess: true,
    data: (normalized ?? (payload as TeachingLog)),
  };
}

export async function submitTeachingLog(
  sessionId: string,
  payload: SubmitTeachingLogRequest
): Promise<ApiResponse<SubmitTeachingLogResponse>> {
  return post<ApiResponse<SubmitTeachingLogResponse>>(
    SESSION_ENDPOINTS.TEACHING_LOG(sessionId),
    payload
  );
}

export async function updateTeachingLog(
  sessionId: string,
  payload: SubmitTeachingLogRequest
): Promise<ApiResponse<SubmitTeachingLogResponse>> {
  return put<ApiResponse<SubmitTeachingLogResponse>>(
    SESSION_ENDPOINTS.TEACHING_LOG(sessionId),
    payload
  );
}

