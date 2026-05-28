import type {
  CreateClassRequest,
  ScheduleSlot,
  UpdateClassRequest,
} from "@/types/admin/classes";

export interface BuildClassPayloadInput {
  branchId: string;
  programId: string;
  syllabusId: string;
  levelId: string;
  startModuleId: string;
  startSessionIndex: number;
  code: string;
  name: string;
  description?: string | null;
  mainTeacherId?: string | null;
  assistantTeacherId?: string | null;
  roomId?: string | null;
  startDate: string;
  endDate?: string | null;
  capacity: number;
  sessionsToGenerate?: number | null;
  skipHolidays?: boolean;
  weeklyScheduleSlots: ScheduleSlot[];
  slotTypeId?: string | null;
}

function trimRequired(value: string): string {
  return String(value ?? "").trim();
}

function toNullableString(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function buildBasePayload(input: BuildClassPayloadInput) {
  const syllabusId = trimRequired(input.syllabusId);
  if (!syllabusId) {
    throw new Error("Syllabus is required");
  }

  return {
    branchId: trimRequired(input.branchId),
    programId: trimRequired(input.programId),
    syllabusId,
    levelId: trimRequired(input.levelId),
    startModuleId: trimRequired(input.startModuleId),
    startSessionIndex: input.startSessionIndex,
    code: trimRequired(input.code),
    name: input.name,
    title: input.name,
    description: toNullableString(input.description),
    mainTeacherId: toNullableString(input.mainTeacherId),
    assistantTeacherId: toNullableString(input.assistantTeacherId),
    roomId: toNullableString(input.roomId),
    startDate: trimRequired(input.startDate),
    endDate: toNullableString(input.endDate),
    capacity: input.capacity,
    weeklyScheduleSlots: input.weeklyScheduleSlots,
    slotTypeId: toNullableString(input.slotTypeId),
  };
}

export function buildCreateClassPayload(
  input: BuildClassPayloadInput,
): CreateClassRequest {
  return {
    ...buildBasePayload(input),
    sessionsToGenerate: input.sessionsToGenerate || 24,
    skipHolidays: input.skipHolidays ?? true,
  };
}

export function buildUpdateClassPayload(
  input: BuildClassPayloadInput,
): UpdateClassRequest {
  return buildBasePayload(input);
}