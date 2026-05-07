import {
  ADMIN_ENDPOINTS,
  CLASS_ENDPOINTS,
  ENROLLMENT_ENDPOINTS,
  PROGRAM_PROGRESSION_ENDPOINTS,
  REGISTRATION_ENDPOINTS,
  USER_ENDPOINTS,
} from "@/constants/apiURL";
import { buildQueryString } from "@/lib/api/queryString";
import type { QueryParams } from "@/lib/api/queryString";
import { get, post, put } from "@/lib/axios";
import type { ApiResponse } from "@/types/apiResponse";
import type {
  ProgramProgressionAvailabilityConflict,
  ProgramProgressionAssessment,
  ProgramProgressionAssessmentStatus,
  ProgramProgressionAssessmentQuery,
  ProgramProgressionAssessmentUpsertPayload,
  ProgramProgressionAvailableRoom,
  ProgramProgressionAvailableStudent,
  ProgramProgressionAvailableTeacher,
  ProgramProgressionApproveAssessmentPayload,
  ProgramProgressionApproveResult,
  ProgramProgressionBulkApprovePayload,
  ProgramProgressionBulkApproveResult,
  ProgramProgressionMyAssessmentSchedule,
  ProgramProgressionMyAssessmentScheduleQuery,
  ProgramProgressionPaginatedResult,
  ProgramProgressionMethod,
  ProgramProgressionRule,
  ProgramProgressionRuleQuery,
  ProgramProgressionRuleUpsertPayload,
  ProgramProgressionSchedule,
  ProgramProgressionScheduleAvailability,
  ProgramProgressionScheduleAvailabilityQuery,
  ProgramProgressionScheduleParticipant,
  ProgramProgressionScheduleParticipantStatus,
  ProgramProgressionScheduleQuery,
  ProgramProgressionScheduleStatus,
  ProgramProgressionScheduleUpsertPayload,
} from "@/types/program-progression";

type UnknownRecord = Record<string, unknown>;

type MaybeWrapped<T> = ApiResponse<T> | T;

function asQueryParams(value?: unknown): QueryParams | undefined {
  return (value ?? undefined) as QueryParams | undefined;
}

export interface ProgramProgressionLookupOption {
  id: string;
  name: string;
  subtitle?: string;
}

export interface ProgramProgressionScheduleContextOptions {
  classId: string;
  className?: string;
  branchId?: string;
  rooms: ProgramProgressionLookupOption[];
  teachers: ProgramProgressionLookupOption[];
  students: ProgramProgressionLookupOption[];
}

export interface ProgramProgressionAssessmentSourceOptions {
  scheduleParticipants: ProgramProgressionLookupOption[];
  sourceRegistrations: ProgramProgressionLookupOption[];
}

function unwrapData<T>(response: MaybeWrapped<T> | null | undefined): T | null {
  if (response == null) return null;
  const payload = response as UnknownRecord;
  if (Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data as T;
  }
  return response as T;
}

function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const casted = value as UnknownRecord;
    if (Array.isArray(casted.items)) return casted.items as T[];
  }
  return [];
}

function toPaginated<T>(value: unknown): ProgramProgressionPaginatedResult<T> {
  if (Array.isArray(value)) {
    const items = value as T[];
    return {
      items,
      pageNumber: 1,
      pageSize: items.length || 10,
      totalCount: items.length,
      totalPages: items.length > 0 ? 1 : 0,
    };
  }

  const data = (value && typeof value === "object" ? (value as UnknownRecord) : {}) as UnknownRecord;
  const items = parseArray<T>(data.items ?? data.data ?? data.assessments ?? data.schedules ?? []);

  return {
    items,
    pageNumber: Number(data.pageNumber ?? 1),
    pageSize: Number(data.pageSize ?? (items.length || 10)),
    totalCount: Number(data.totalCount ?? items.length),
    totalPages: Number(data.totalPages ?? (items.length > 0 ? 1 : 0)),
  };
}

function toStringSafe(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function parseNamedItems(value: unknown, key?: string): UnknownRecord[] {
  const data = unwrapData(value as MaybeWrapped<unknown>);

  if (Array.isArray(data)) return data as UnknownRecord[];
  if (!data || typeof data !== "object") return [];

  const record = data as UnknownRecord;
  if (key) {
    const scoped = record[key] as UnknownRecord | UnknownRecord[] | undefined;
    if (Array.isArray(scoped)) return scoped as UnknownRecord[];
    if (scoped && typeof scoped === "object") {
      if (Array.isArray((scoped as UnknownRecord).items)) {
        return (scoped as UnknownRecord).items as UnknownRecord[];
      }
    }
  }

  if (Array.isArray(record.items)) return record.items as UnknownRecord[];
  if (Array.isArray(record.data)) return record.data as UnknownRecord[];

  return [];
}

function sortAndUniqueOptions(options: ProgramProgressionLookupOption[]): ProgramProgressionLookupOption[] {
  const seen = new Set<string>();
  const deduped: ProgramProgressionLookupOption[] = [];

  for (const option of options) {
    const id = option.id.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    deduped.push({
      id,
      name: option.name.trim() || id,
      subtitle: option.subtitle?.trim() || undefined,
    });
  }

  return deduped.sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

function appendIfPresent(searchParams: URLSearchParams, key: string, value?: string | null): void {
  if (value && value.trim()) {
    searchParams.append(key, value.trim());
  }
}

function formatVietnameseDateTime(dateTime?: string): string {
  if (!dateTime) return "";
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseAvailabilityConflictItems(value: unknown): ProgramProgressionAvailabilityConflict[] {
  const items = parseArray<UnknownRecord>(value);
  return items.map((item) => ({
    type: toStringSafe(item.type, item.kind),
    title: toStringSafe(item.title, item.reason, item.description),
    startAt: toStringSafe(item.startAt, item.start, item.startTime) || undefined,
    endAt: toStringSafe(item.endAt, item.end, item.endTime) || undefined,
  }));
}

function normalizeStudentAvailability(value: unknown): ProgramProgressionAvailableStudent[] {
  const items = parseArray<UnknownRecord>(value);
  return items
    .map((item) => ({
      studentProfileId: toStringSafe(item.studentProfileId, item.profileId, item.studentId, item.id),
      studentName: toStringSafe(item.studentName, item.name, item.displayName),
      isAvailable: item.isAvailable !== false,
      conflicts: parseAvailabilityConflictItems(item.conflicts),
    }))
    .filter((item) => item.studentProfileId);
}

function normalizeTeacherAvailability(value: unknown): ProgramProgressionAvailableTeacher[] {
  const items = parseArray<UnknownRecord>(value);
  return items
    .map((item) => ({
      userId: toStringSafe(item.userId, item.teacherUserId, item.id),
      teacherName: toStringSafe(item.teacherName, item.name, item.fullName, item.displayName),
      isAvailable: item.isAvailable !== false,
      conflicts: parseAvailabilityConflictItems(item.conflicts),
    }))
    .filter((item) => item.userId);
}

function normalizeRoomAvailability(value: unknown): ProgramProgressionAvailableRoom[] {
  const items = parseArray<UnknownRecord>(value);
  return items
    .map((item) => ({
      roomId: toStringSafe(item.roomId, item.id),
      roomName: toStringSafe(item.roomName, item.name, item.title),
      capacity:
        typeof item.capacity === "number"
          ? item.capacity
          : Number.isNaN(Number(item.capacity))
          ? undefined
          : Number(item.capacity),
      isAvailable: item.isAvailable !== false,
      conflicts: parseAvailabilityConflictItems(item.conflicts),
    }))
    .filter((item) => item.roomId);
}

function normalizeScheduleAvailability(
  value: unknown
): ProgramProgressionScheduleAvailability | null {
  const payload = unwrapData(value as MaybeWrapped<unknown>);
  if (!payload || typeof payload !== "object") return null;

  const record = payload as UnknownRecord;

  const students = normalizeStudentAvailability(
    record.students ?? record.availableStudents ?? []
  );
  const teachers = normalizeTeacherAvailability(
    record.teachers ?? record.availableTeachers ?? []
  );
  const rooms = normalizeRoomAvailability(record.rooms ?? record.availableRooms ?? []);

  const explicitUnavailableStudents = normalizeStudentAvailability(
    record.unavailableStudents ?? []
  );
  const explicitUnavailableTeachers = normalizeTeacherAvailability(
    record.unavailableTeachers ?? []
  );
  const explicitUnavailableRooms = normalizeRoomAvailability(
    record.unavailableRooms ?? []
  );

  const availableStudents = students.filter((item) => item.isAvailable);
  const unavailableStudents =
    explicitUnavailableStudents.length > 0
      ? explicitUnavailableStudents
      : students.filter((item) => !item.isAvailable);

  const availableTeachers = teachers.filter((item) => item.isAvailable);
  const unavailableTeachers =
    explicitUnavailableTeachers.length > 0
      ? explicitUnavailableTeachers
      : teachers.filter((item) => !item.isAvailable);

  const availableRooms = rooms.filter((item) => item.isAvailable);
  const unavailableRooms =
    explicitUnavailableRooms.length > 0
      ? explicitUnavailableRooms
      : rooms.filter((item) => !item.isAvailable);

  return {
    scheduleExists:
      typeof record.scheduleExists === "boolean"
        ? record.scheduleExists
        : undefined,
    startAt: toStringSafe(record.startAt, record.start) || undefined,
    endAt: toStringSafe(record.endAt, record.end) || undefined,
    durationMinutes:
      typeof record.durationMinutes === "number"
        ? record.durationMinutes
        : Number.isNaN(Number(record.durationMinutes))
        ? undefined
        : Number(record.durationMinutes),
    availableStudents,
    availableTeachers,
    unavailableStudents,
    unavailableTeachers,
    availableRooms,
    unavailableRooms,
  };
}

const SCHEDULE_STATUS_BY_NUMBER: Record<number, ProgramProgressionScheduleStatus> = {
  0: "Scheduled",
  1: "Completed",
  2: "Cancelled",
};

const SCHEDULE_PARTICIPANT_STATUS_BY_NUMBER: Record<number, ProgramProgressionScheduleParticipantStatus> = {
  0: "Scheduled",
  1: "Completed",
  2: "NoShow",
  3: "Cancelled",
};

const ASSESSMENT_STATUS_BY_NUMBER: Record<number, ProgramProgressionAssessmentStatus> = {
  0: "Recorded",
  1: "Approved",
};

const ASSESSMENT_METHOD_BY_NUMBER: Record<number, ProgramProgressionMethod> = {
  0: "PassFail",
  1: "Shields",
  2: "CambridgeScale",
};

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toOptionalInteger(value: unknown): number | undefined {
  const parsed = toOptionalNumber(value);
  if (parsed == null) return undefined;
  return Math.trunc(parsed);
}

function normalizeScheduleStatus(value: unknown): ProgramProgressionScheduleStatus {
  const numeric = toOptionalInteger(value);
  if (numeric != null && SCHEDULE_STATUS_BY_NUMBER[numeric]) {
    return SCHEDULE_STATUS_BY_NUMBER[numeric];
  }

  const normalized = toStringSafe(value).toLowerCase();
  if (normalized === "completed") return "Completed";
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  return "Scheduled";
}

function normalizeParticipantStatus(value: unknown): ProgramProgressionScheduleParticipantStatus {
  const numeric = toOptionalInteger(value);
  if (numeric != null && SCHEDULE_PARTICIPANT_STATUS_BY_NUMBER[numeric]) {
    return SCHEDULE_PARTICIPANT_STATUS_BY_NUMBER[numeric];
  }

  const normalized = toStringSafe(value).toLowerCase();
  if (normalized === "completed") return "Completed";
  if (normalized === "noshow" || normalized === "no_show" || normalized === "no-show") {
    return "NoShow";
  }
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  return "Scheduled";
}

function normalizeAssessmentStatus(value: unknown): ProgramProgressionAssessmentStatus | null {
  if (value == null || value === "") return null;

  const numeric = toOptionalInteger(value);
  if (numeric != null && ASSESSMENT_STATUS_BY_NUMBER[numeric]) {
    return ASSESSMENT_STATUS_BY_NUMBER[numeric];
  }

  const normalized = toStringSafe(value).toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "recorded") return "Recorded";
  return null;
}

function normalizeAssessmentMethod(value: unknown): ProgramProgressionMethod | undefined {
  const numeric = toOptionalInteger(value);
  if (numeric != null && ASSESSMENT_METHOD_BY_NUMBER[numeric]) {
    return ASSESSMENT_METHOD_BY_NUMBER[numeric];
  }

  const normalized = toStringSafe(value).toLowerCase();
  if (normalized === "passfail" || normalized === "pass_fail" || normalized === "pass-fail") {
    return "PassFail";
  }
  if (normalized === "shields" || normalized === "shield") return "Shields";
  if (
    normalized === "cambridgescale" ||
    normalized === "cambridge_scale" ||
    normalized === "cambridge-scale"
  ) {
    return "CambridgeScale";
  }

  return undefined;
}

function toNullableNumber(value: unknown): number | null | undefined {
  if (value == null || value === "") return null;
  const parsed = toOptionalNumber(value);
  return parsed == null ? undefined : parsed;
}

function normalizeAssessmentItem(value: unknown): ProgramProgressionAssessment {
  const item = (value && typeof value === "object" ? (value as UnknownRecord) : {}) as UnknownRecord;

  return {
    id: toStringSafe(item.id, item.assessmentId),
    sourceRegistrationId: toStringSafe(item.sourceRegistrationId, item.registrationId) || null,
    scheduleParticipantId: toStringSafe(item.scheduleParticipantId, item.participantId) || null,
    studentProfileId: toStringSafe(item.studentProfileId, item.profileId, item.studentId),
    studentName: toStringSafe(item.studentName, item.displayName, item.studentProfileName) || undefined,
    sourceProgramId: toStringSafe(item.sourceProgramId, item.programId) || null,
    sourceProgramName: toStringSafe(item.sourceProgramName, item.programName) || null,
    method: normalizeAssessmentMethod(item.method),
    assessmentDate: toStringSafe(item.assessmentDate, item.recordedAt, item.createdAt) || undefined,
    passedInClass:
      typeof item.passedInClass === "boolean"
        ? item.passedInClass
        : item.passedInClass == null || item.passedInClass === ""
        ? null
        : undefined,
    listeningScore: toNullableNumber(item.listeningScore),
    speakingScore: toNullableNumber(item.speakingScore),
    readingWritingScore: toNullableNumber(item.readingWritingScore),
    readingScore: toNullableNumber(item.readingScore),
    writingScore: toNullableNumber(item.writingScore),
    overallScore: toNullableNumber(item.overallScore),
    status: normalizeAssessmentStatus(item.status) ?? "Recorded",
    isEligible: typeof item.isEligible === "boolean" ? item.isEligible : undefined,
    targetProgramId: toStringSafe(item.targetProgramId) || null,
    targetProgramName: toStringSafe(item.targetProgramName) || null,
    comment: toStringSafe(item.comment, item.notes) || null,
    attachmentUrls: parseArray<string>(item.attachmentUrls).filter(
      (url) => typeof url === "string" && url.trim().length > 0
    ),
    approvedBy: toStringSafe(item.approvedBy) || null,
    approvedByName:
      toStringSafe(
        item.approvedByName,
        item.approvedByFullName,
        (item.approvedByUser as UnknownRecord | undefined)?.name,
        (item.approvedByUser as UnknownRecord | undefined)?.fullName
      ) || null,
    approvedAt: toStringSafe(item.approvedAt) || null,
    approvalNote: toStringSafe(item.approvalNote) || null,
    createdBy: toStringSafe(item.createdBy, item.recordedBy) || undefined,
    createdByName:
      toStringSafe(
        item.createdByName,
        item.recordedByName,
        item.createdByFullName,
        item.recordedByFullName,
        (item.createdByUser as UnknownRecord | undefined)?.name,
        (item.createdByUser as UnknownRecord | undefined)?.fullName,
        (item.recordedByUser as UnknownRecord | undefined)?.name,
        (item.recordedByUser as UnknownRecord | undefined)?.fullName
      ) || undefined,
    createdAt: toStringSafe(item.createdAt) || undefined,
  };
}

function normalizeScheduleParticipant(value: unknown): ProgramProgressionScheduleParticipant {
  const item = (value && typeof value === "object" ? (value as UnknownRecord) : {}) as UnknownRecord;

  return {
    id: toStringSafe(item.id, item.scheduleParticipantId),
    studentProfileId: toStringSafe(item.studentProfileId, item.profileId, item.studentId),
    studentName: toStringSafe(item.studentName, item.displayName, item.studentProfileName),
    status: normalizeParticipantStatus(item.status),
    assessmentId: toStringSafe(item.assessmentId) || null,
    assessmentStatus: normalizeAssessmentStatus(item.assessmentStatus),
  };
}

function normalizeScheduleItem(value: unknown): ProgramProgressionSchedule {
  const item = (value && typeof value === "object" ? (value as UnknownRecord) : {}) as UnknownRecord;
  const participants = parseArray<UnknownRecord>(item.participants)
    .map((participant) => normalizeScheduleParticipant(participant))
    .filter((participant) => participant.id || participant.studentProfileId);

  const scheduledParticipantCount =
    toOptionalInteger(item.scheduledParticipantCount) ??
    toOptionalInteger(item.participantCount) ??
    participants.length;

  const completedParticipantCount =
    toOptionalInteger(item.completedParticipantCount) ??
    participants.filter((participant) => participant.status === "Completed").length;

  return {
    id: toStringSafe(item.id, item.scheduleId),
    sourceClassId: toStringSafe(item.sourceClassId, item.classId),
    sourceClassName:
      toStringSafe(item.sourceClassName, item.sourceClassTitle, item.classTitle, item.sourceClassCode) ||
      undefined,
    scheduledAt: toStringSafe(item.scheduledAt, item.startAt, item.startTime),
    durationMinutes: toOptionalInteger(item.durationMinutes),
    roomId: toStringSafe(item.roomId, item.classroomId) || null,
    roomName: toStringSafe(item.roomName, item.classroomName) || null,
    assignedTeacherUserId: toStringSafe(
      item.assignedTeacherUserId,
      item.teacherUserId,
      item.teacherId
    ) || null,
    assignedTeacherName:
      toStringSafe(item.assignedTeacherName, item.teacherName, item.teacherDisplayName) || null,
    status: normalizeScheduleStatus(item.status),
    notes: toStringSafe(item.notes, item.note) || null,
    participants,
    scheduledParticipantCount,
    completedParticipantCount,
  };
}

function normalizeMyAssessmentScheduleItem(value: unknown): ProgramProgressionMyAssessmentSchedule {
  const item = (value && typeof value === "object" ? (value as UnknownRecord) : {}) as UnknownRecord;
  const participantStatusRaw = item.participantStatus;

  return {
    id: toStringSafe(item.id, item.scheduleId),
    sourceClassName:
      toStringSafe(item.sourceClassName, item.sourceClassTitle, item.classTitle, item.sourceClassCode) ||
      undefined,
    scheduledAt: toStringSafe(item.scheduledAt, item.startAt, item.startTime),
    durationMinutes: toOptionalInteger(item.durationMinutes),
    roomName: toStringSafe(item.roomName, item.classroomName) || null,
    assignedTeacherName:
      toStringSafe(item.assignedTeacherName, item.teacherName, item.teacherDisplayName) || null,
    status: normalizeScheduleStatus(item.status),
    participantStatus:
      participantStatusRaw == null || participantStatusRaw === ""
        ? undefined
        : normalizeParticipantStatus(participantStatusRaw),
    assessmentStatus: normalizeAssessmentStatus(item.assessmentStatus),
  };
}

function normalizeRuleItem(value: unknown): ProgramProgressionRule {
  const item = (value && typeof value === "object" ? (value as UnknownRecord) : {}) as UnknownRecord;

  return {
    id: toStringSafe(item.id, item.ruleId),
    sourceProgramId: toStringSafe(item.sourceProgramId, item.programId),
    sourceProgramName:
      toStringSafe(item.sourceProgramName, item.programName, item.sourceProgramTitle) || undefined,
    targetProgramId: toStringSafe(item.targetProgramId) || null,
    targetProgramName: toStringSafe(item.targetProgramName, item.targetProgramTitle) || null,
    method: normalizeAssessmentMethod(item.method) ?? "PassFail",
    minimumShieldCount: toNullableNumber(item.minimumShieldCount),
    minimumSkillShieldCount: toNullableNumber(item.minimumSkillShieldCount),
    minimumOverallScore: toNullableNumber(item.minimumOverallScore),
    carryOverRemainingSessions:
      typeof item.carryOverRemainingSessions === "boolean"
        ? item.carryOverRemainingSessions
        : true,
    stopCurrentEnrollmentOnApproval:
      typeof item.stopCurrentEnrollmentOnApproval === "boolean"
        ? item.stopCurrentEnrollmentOnApproval
        : true,
    isActive: typeof item.isActive === "boolean" ? item.isActive : true,
    notes: toStringSafe(item.notes, item.note) || null,
    shieldMappings: parseArray<ProgramProgressionRule["shieldMappings"] extends (infer U)[] ? U : never>(
      item.shieldMappings
    ),
    classificationBands:
      parseArray<
        ProgramProgressionRule["classificationBands"] extends (infer U)[] ? U : never
      >(item.classificationBands),
  };
}

export async function getProgramProgressionRules(
  query?: ProgramProgressionRuleQuery
): Promise<ProgramProgressionRule[]> {
  const endpoint = `${PROGRAM_PROGRESSION_ENDPOINTS.RULES}${buildQueryString(asQueryParams(query))}`;
  const response = await get<MaybeWrapped<unknown>>(endpoint);
  const data = unwrapData(response);
  const record = (data && typeof data === "object" ? (data as UnknownRecord) : {}) as UnknownRecord;
  const items = parseArray<unknown>(record.rules ?? record.items ?? record.data ?? data);

  return items
    .map((item) => normalizeRuleItem(item))
    .filter((item) => Boolean(item.id) && Boolean(item.sourceProgramId));
}

export async function getProgramProgressionRuleById(
  id: string
): Promise<ProgramProgressionRule | null> {
  const response = await get<MaybeWrapped<ProgramProgressionRule>>(
    PROGRAM_PROGRESSION_ENDPOINTS.RULE_BY_ID(id)
  );
  return unwrapData(response);
}

export async function createProgramProgressionRule(
  payload: ProgramProgressionRuleUpsertPayload
): Promise<ProgramProgressionRule | null> {
  const response = await post<MaybeWrapped<ProgramProgressionRule>>(
    PROGRAM_PROGRESSION_ENDPOINTS.RULES,
    payload
  );
  return unwrapData(response);
}

export async function updateProgramProgressionRule(
  id: string,
  payload: ProgramProgressionRuleUpsertPayload
): Promise<ProgramProgressionRule | null> {
  const response = await put<MaybeWrapped<ProgramProgressionRule>>(
    PROGRAM_PROGRESSION_ENDPOINTS.RULE_BY_ID(id),
    payload
  );
  return unwrapData(response);
}

export async function getProgramProgressionScheduleAvailability(
  query: ProgramProgressionScheduleAvailabilityQuery
): Promise<ProgramProgressionScheduleAvailability | null> {
  const endpoint = `${PROGRAM_PROGRESSION_ENDPOINTS.SCHEDULES_AVAILABILITY}${buildQueryString(asQueryParams(query))}`;
  const response = await get<MaybeWrapped<ProgramProgressionScheduleAvailability>>(endpoint);
  return normalizeScheduleAvailability(response);
}

export async function getProgramProgressionSchedules(
  query?: ProgramProgressionScheduleQuery
): Promise<ProgramProgressionPaginatedResult<ProgramProgressionSchedule>> {
  const endpoint = `${PROGRAM_PROGRESSION_ENDPOINTS.SCHEDULES}${buildQueryString(asQueryParams(query))}`;
  const response = await get<MaybeWrapped<unknown>>(endpoint);
  const data = unwrapData(response);
  const container =
    data && typeof data === "object" && (data as UnknownRecord).schedules
      ? (data as UnknownRecord).schedules
      : data;
  const paginated = toPaginated<unknown>(container);

  return {
    ...paginated,
    items: paginated.items.map((item) => normalizeScheduleItem(item)),
  };
}

export async function getProgramProgressionScheduleById(
  id: string
): Promise<ProgramProgressionSchedule | null> {
  const response = await get<MaybeWrapped<ProgramProgressionSchedule>>(
    PROGRAM_PROGRESSION_ENDPOINTS.SCHEDULE_BY_ID(id)
  );
  return unwrapData(response);
}

export async function createProgramProgressionSchedule(
  payload: ProgramProgressionScheduleUpsertPayload
): Promise<ProgramProgressionSchedule | null> {
  const response = await post<MaybeWrapped<ProgramProgressionSchedule>>(
    PROGRAM_PROGRESSION_ENDPOINTS.SCHEDULES,
    payload
  );
  return unwrapData(response);
}

export async function updateProgramProgressionSchedule(
  id: string,
  payload: ProgramProgressionScheduleUpsertPayload
): Promise<ProgramProgressionSchedule | null> {
  const response = await put<MaybeWrapped<ProgramProgressionSchedule>>(
    PROGRAM_PROGRESSION_ENDPOINTS.SCHEDULE_BY_ID(id),
    payload
  );
  return unwrapData(response);
}

export async function cancelProgramProgressionSchedule(id: string): Promise<ProgramProgressionSchedule | null> {
  const response = await post<MaybeWrapped<ProgramProgressionSchedule>>(
    PROGRAM_PROGRESSION_ENDPOINTS.SCHEDULE_CANCEL(id),
    {}
  );
  return unwrapData(response);
}

export async function markProgramProgressionParticipantNoShow(
  participantId: string
): Promise<ProgramProgressionSchedule | null> {
  const response = await post<MaybeWrapped<ProgramProgressionSchedule>>(
    PROGRAM_PROGRESSION_ENDPOINTS.SCHEDULE_PARTICIPANT_NO_SHOW(participantId),
    {}
  );
  return unwrapData(response);
}

export async function getMyProgramProgressionAssessmentSchedules(
  query?: ProgramProgressionMyAssessmentScheduleQuery
): Promise<ProgramProgressionPaginatedResult<ProgramProgressionMyAssessmentSchedule>> {
  const endpoint = `${PROGRAM_PROGRESSION_ENDPOINTS.MY_ASSESSMENT_SCHEDULES}${buildQueryString(asQueryParams(query))}`;
  const response = await get<MaybeWrapped<unknown>>(endpoint);
  const data = unwrapData(response);
  const container =
    data && typeof data === "object" && (data as UnknownRecord).schedules
      ? (data as UnknownRecord).schedules
      : data;
  const paginated = toPaginated<unknown>(container);

  return {
    ...paginated,
    items: paginated.items.map((item) => normalizeMyAssessmentScheduleItem(item)),
  };
}

export async function getProgramProgressionAssessments(
  query?: ProgramProgressionAssessmentQuery
): Promise<ProgramProgressionPaginatedResult<ProgramProgressionAssessment>> {
  const endpoint = `${PROGRAM_PROGRESSION_ENDPOINTS.ASSESSMENTS}${buildQueryString(asQueryParams(query))}`;
  const response = await get<MaybeWrapped<unknown>>(endpoint);
  const data = unwrapData(response);
  const record = (data && typeof data === "object" ? (data as UnknownRecord) : {}) as UnknownRecord;

  const paginated = toPaginated<unknown>({
    items: record.assessments ?? record.items ?? record.data ?? data,
    pageNumber: record.pageNumber,
    pageSize: record.pageSize,
    totalCount: record.totalCount,
    totalPages: record.totalPages,
  });

  return {
    ...paginated,
    items: paginated.items
      .map((item) => normalizeAssessmentItem(item))
      .filter((item) => Boolean(item.id)),
  };
}

export async function getProgramProgressionAssessmentById(
  id: string
): Promise<ProgramProgressionAssessment | null> {
  const response = await get<MaybeWrapped<ProgramProgressionAssessment>>(
    PROGRAM_PROGRESSION_ENDPOINTS.ASSESSMENT_BY_ID(id)
  );
  return unwrapData(response);
}

export async function createProgramProgressionAssessment(
  payload: ProgramProgressionAssessmentUpsertPayload
): Promise<ProgramProgressionAssessment | null> {
  const response = await post<MaybeWrapped<ProgramProgressionAssessment>>(
    PROGRAM_PROGRESSION_ENDPOINTS.ASSESSMENTS,
    payload
  );
  return unwrapData(response);
}

export async function updateProgramProgressionAssessment(
  id: string,
  payload: ProgramProgressionAssessmentUpsertPayload
): Promise<ProgramProgressionAssessment | null> {
  const response = await put<MaybeWrapped<ProgramProgressionAssessment>>(
    PROGRAM_PROGRESSION_ENDPOINTS.ASSESSMENT_BY_ID(id),
    payload
  );
  return unwrapData(response);
}

export async function approveProgramProgressionAssessment(
  id: string,
  payload: ProgramProgressionApproveAssessmentPayload
): Promise<ProgramProgressionApproveResult | null> {
  const response = await post<MaybeWrapped<ProgramProgressionApproveResult>>(
    PROGRAM_PROGRESSION_ENDPOINTS.ASSESSMENT_APPROVE(id),
    payload
  );
  return unwrapData(response);
}

export async function bulkApproveProgramProgressionAssessments(
  payload: ProgramProgressionBulkApprovePayload
): Promise<ProgramProgressionBulkApproveResult | null> {
  const response = await post<MaybeWrapped<ProgramProgressionBulkApproveResult>>(
    PROGRAM_PROGRESSION_ENDPOINTS.ASSESSMENT_BULK_APPROVE,
    payload
  );
  return unwrapData(response);
}

export async function getProgramProgressionProgramOptions(params?: {
  branchId?: string;
  pageSize?: number;
}): Promise<ProgramProgressionLookupOption[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("pageNumber", "1");
  searchParams.set("pageSize", String(params?.pageSize ?? 200));
  appendIfPresent(searchParams, "branchId", params?.branchId);

  const endpoint = `${ADMIN_ENDPOINTS.PROGRAMS}?${searchParams.toString()}`;
  const response = await get<unknown>(endpoint);
  const items = parseNamedItems(response, "programs");

  const options = items.map((item) => {
    const id = toStringSafe(item.id, item.programId, item.program_id, item.code);
    const code = toStringSafe(item.code, item.programCode);
    const name = toStringSafe(item.name, item.programName, item.title, item.programTitle, code, id);

    return {
      id,
      name,
      subtitle: code && code !== name ? `Mã: ${code}` : undefined,
    } satisfies ProgramProgressionLookupOption;
  });

  return sortAndUniqueOptions(options);
}

export async function getProgramProgressionClassOptions(params?: {
  branchId?: string;
  pageSize?: number;
}): Promise<ProgramProgressionLookupOption[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("pageNumber", "1");
  searchParams.set("pageSize", String(params?.pageSize ?? 200));
  appendIfPresent(searchParams, "branchId", params?.branchId);

  const endpoint = `${CLASS_ENDPOINTS.GET_ALL}?${searchParams.toString()}`;
  const response = await get<unknown>(endpoint);
  const items = parseNamedItems(response, "classes");

  const options = items.map((item) => {
    const id = toStringSafe(item.id, item.classId, item.class_id, item.code);
    const code = toStringSafe(item.code, item.classCode);
    const name = toStringSafe(item.title, item.classTitle, item.name, code, id);
    const programName = toStringSafe(item.programName);

    return {
      id,
      name,
      subtitle: programName || (code && code !== name ? `Mã: ${code}` : undefined),
    } satisfies ProgramProgressionLookupOption;
  });

  return sortAndUniqueOptions(options);
}

export async function getProgramProgressionScheduleContextOptions(
  classId: string
): Promise<ProgramProgressionScheduleContextOptions> {
  const safeClassId = classId.trim();
  if (!safeClassId) {
    return {
      classId: "",
      rooms: [],
      teachers: [],
      students: [],
    };
  }

  const classResponse = await get<unknown>(CLASS_ENDPOINTS.GET_BY_ID(safeClassId));
  const classPayload = unwrapData(classResponse as MaybeWrapped<unknown>);
  const classData =
    classPayload && typeof classPayload === "object"
      ? (classPayload as UnknownRecord)
      : ({} as UnknownRecord);

  const className = toStringSafe(
    classData.title,
    classData.classTitle,
    classData.name,
    classData.code,
    classData.classCode,
    safeClassId
  );

  const branchId = toStringSafe(
    classData.branchId,
    (classData.branch as UnknownRecord | undefined)?.id,
    classData.branchID
  );

  const seedTeacherOptions: ProgramProgressionLookupOption[] = [];
  const mainTeacherId = toStringSafe(
    classData.mainTeacherId,
    classData.mainTeacherUserId,
    classData.teacherId
  );
  const mainTeacherName = toStringSafe(
    classData.mainTeacherName,
    (classData.mainTeacher as UnknownRecord | undefined)?.name,
    classData.teacherName
  );
  if (mainTeacherId) {
    seedTeacherOptions.push({ id: mainTeacherId, name: mainTeacherName || mainTeacherId });
  }

  const assistantTeacherId = toStringSafe(
    classData.assistantTeacherId,
    classData.assistantTeacherUserId
  );
  const assistantTeacherName = toStringSafe(
    classData.assistantTeacherName,
    (classData.assistantTeacher as UnknownRecord | undefined)?.name
  );
  if (assistantTeacherId) {
    seedTeacherOptions.push({
      id: assistantTeacherId,
      name: assistantTeacherName || assistantTeacherId,
    });
  }

  const seedRoomOptions: ProgramProgressionLookupOption[] = [];
  const classRoomId = toStringSafe(classData.roomId, classData.classroomId, classData.plannedRoomId);
  const classRoomName = toStringSafe(
    classData.roomName,
    classData.classroomName,
    classData.plannedRoomName
  );
  if (classRoomId) {
    seedRoomOptions.push({ id: classRoomId, name: classRoomName || classRoomId });
  }

  const commonParams = new URLSearchParams({ pageNumber: "1", pageSize: "200" });
  appendIfPresent(commonParams, "branchId", branchId || undefined);

  const teacherParams = new URLSearchParams(commonParams);
  teacherParams.append("role", "Teacher");

  const enrollmentParams = new URLSearchParams({
    classId: safeClassId,
    status: "Active",
    pageNumber: "1",
    pageSize: "200",
  });

  const [roomsResult, teachersResult, studentsResult] = await Promise.allSettled([
    get<unknown>(`${ADMIN_ENDPOINTS.CLASSROOMS}?${commonParams.toString()}`),
    get<unknown>(`${USER_ENDPOINTS.GET_ALL}?${teacherParams.toString()}`),
    get<unknown>(`${ENROLLMENT_ENDPOINTS.GET_ALL}?${enrollmentParams.toString()}`),
  ]);

  const rooms =
    roomsResult.status === "fulfilled"
      ? sortAndUniqueOptions([
          ...seedRoomOptions,
          ...parseNamedItems(roomsResult.value, "classrooms").map((item) => ({
            id: toStringSafe(item.id, item.roomId, item.classroomId),
            name: toStringSafe(item.name, item.roomName, item.title),
            subtitle: toStringSafe(item.branchName),
          })),
        ])
      : sortAndUniqueOptions(seedRoomOptions);

  const teachers =
    teachersResult.status === "fulfilled"
      ? sortAndUniqueOptions([
          ...seedTeacherOptions,
          ...parseNamedItems(teachersResult.value, "users").map((item) => ({
            id: toStringSafe(item.id),
            name: toStringSafe(item.name, item.fullName, item.username, item.email),
            subtitle: toStringSafe(item.email),
          })),
        ])
      : sortAndUniqueOptions(seedTeacherOptions);

  const students =
    studentsResult.status === "fulfilled"
      ? sortAndUniqueOptions(
          parseNamedItems(studentsResult.value, "enrollments").map((item) => ({
            id: toStringSafe(item.studentProfileId, item.profileId, item.studentId),
            name: toStringSafe(item.studentName, item.displayName, item.studentProfileName),
            subtitle: toStringSafe(item.studentCode, item.studentEmail),
          }))
        )
      : [];

  return {
    classId: safeClassId,
    className: className || undefined,
    branchId: branchId || undefined,
    rooms,
    teachers,
    students,
  };
}

export async function getProgramProgressionAssessmentSourceOptions(params?: {
  branchId?: string;
  pageSize?: number;
}): Promise<ProgramProgressionAssessmentSourceOptions> {
  const queryPageSize = params?.pageSize ?? 200;

  const schedulePromise = getProgramProgressionSchedules({
    pageNumber: 1,
    pageSize: queryPageSize,
  });

  const registrationSearchParams = new URLSearchParams();
  registrationSearchParams.set("pageNumber", "1");
  registrationSearchParams.set("pageSize", String(queryPageSize));
  appendIfPresent(registrationSearchParams, "branchId", params?.branchId);

  const registrationPromise = get<unknown>(
    `${REGISTRATION_ENDPOINTS.GET_ALL}?${registrationSearchParams.toString()}`
  );

  const [scheduleResult, registrationResult] = await Promise.allSettled([
    schedulePromise,
    registrationPromise,
  ]);

  const scheduleParticipants: ProgramProgressionLookupOption[] =
    scheduleResult.status === "fulfilled"
      ? sortAndUniqueOptions(
          scheduleResult.value.items.flatMap((schedule) => {
            const className = toStringSafe(schedule.sourceClassName, schedule.sourceClassId);
            const dateTimeLabel = formatVietnameseDateTime(schedule.scheduledAt);
            const subtitle = [className, dateTimeLabel].filter(Boolean).join(" • ");

            return (schedule.participants || []).map((participant) => ({
              id: toStringSafe(participant.id),
              name: toStringSafe(
                participant.studentName,
                participant.studentProfileId,
                participant.id
              ),
              subtitle: subtitle || undefined,
            }));
          })
        )
      : [];

  const sourceRegistrations: ProgramProgressionLookupOption[] =
    registrationResult.status === "fulfilled"
      ? (() => {
          const rawPayload = unwrapData(registrationResult.value as MaybeWrapped<unknown>);
          const fallbackItems =
            rawPayload && typeof rawPayload === "object"
              ? parseArray<UnknownRecord>((rawPayload as UnknownRecord).page)
              : [];
          const registrationItems = [
            ...parseNamedItems(registrationResult.value, "registrations"),
            ...fallbackItems,
          ];

          return sortAndUniqueOptions(
            registrationItems.map((item) => {
              const className = toStringSafe(item.className, item.classTitle, item.classCode);
              const programName = toStringSafe(item.programName);
              const status = toStringSafe(item.status);
              const subtitle = [className, programName, status].filter(Boolean).join(" • ");

              return {
                id: toStringSafe(item.id, item.registrationId),
                name: toStringSafe(
                  item.studentName,
                  item.studentProfileName,
                  item.displayName,
                  item.id
                ),
                subtitle: subtitle || undefined,
              };
            })
          );
        })()
      : [];

  return {
    scheduleParticipants,
    sourceRegistrations,
  };
}
