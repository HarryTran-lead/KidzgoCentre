import { ADMIN_ENDPOINTS, MODULE_ENDPOINTS } from "@/constants/apiURL";
import { get, post, put } from "@/lib/axios";
import { uploadFile, isUploadSuccess } from "@/lib/api/fileService";
import { getAccessToken } from "@/lib/store/authToken";

type ApiLikeResponse = {
  success?: boolean;
  isSuccess?: boolean;
  data?: unknown;
  message?: string;
};

type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
  error?: string;
  message?: string;
};

type PaginatedItems<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export interface ServiceResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
  status?: number;
  title?: string;
  detail?: string;
  raw?: unknown;
}

export interface LessonPlanTemplate {
  id: string;
  syllabusId?: string | null;
  syllabusCode?: string | null;
  syllabusVersion?: string | null;
  syllabusTitle?: string | null;
  programId?: string;
  programName?: string;
  levelId?: string;
  levelName?: string;
  /** @deprecated backend now returns levelId/levelName; kept for display fallback */
  level?: string;
  title: string;
  sessionIndex: number;
  moduleId?: string | null;
  moduleCode?: string | null;
  moduleName?: string | null;
  moduleOrderIndex?: number | null;
  // Unit (real entity from BE — do NOT parse from title anymore)
  lessonPlanUnitId?: string | null;
  lessonPlanUnitName?: string | null;
  unitOrderIndex?: number | null;
  unitNumber?: string | null;
  unitTitle?: string | null;
  orderIndexInUnit?: number | null;
  lessonOrderIndexInUnit?: number | null;
  sessionOrder?: number | null;
  syllabusMetadata?: string | null;
  syllabusContent?: string | null;
  // Full content fields
  objectives?: string | null;
  languageContent?: string | null;
  vocabulary?: string | null;
  grammar?: string | null;
  teachingMethodology?: string | null;
  teacherMaterials?: string | null;
  studentMaterials?: string | null;
  procedure?: string | null;
  evaluation?: string | null;
  homework?: string | null;
  teacherNote?: string | null;
  sourceFileName?: string | null;
  attachment?: string | null;
  isActive?: boolean;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
  usedCount?: number;
}

export interface GetLessonPlanTemplatesParams {
  syllabusId?: string;
  moduleId?: string;
  title?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface UpdateLessonPlanTemplateRequest {
  moduleId?: string | null;
  level?: string | null;
  title?: string | null;
  sessionIndex?: number | null;
  sessionOrder?: number | null;
  syllabusMetadata?: string | null;
  syllabusContent?: string | null;
  // Full content fields
  objectives?: string | null;
  languageContent?: string | null;
  vocabulary?: string | null;
  grammar?: string | null;
  teachingMethodology?: string | null;
  teacherMaterials?: string | null;
  studentMaterials?: string | null;
  procedure?: string | null;
  evaluation?: string | null;
  homework?: string | null;
  teacherNote?: string | null;
  sourceFileName?: string | null;
  attachment?: string | null;
  isActive?: boolean | null;
}

export interface ImportedModuleSummary {
  moduleId: string;
  moduleName?: string;
  importedSessions: number;
}

/** @deprecated Use ImportedModuleSummary */
export type ImportedProgramSummary = ImportedModuleSummary;

export interface ImportLessonPlanTemplatesRequest {
  file: File;
  moduleId?: string;
  programId?: string | null;
  level?: string | null;
  overwriteExisting?: boolean;
}

export interface ImportLessonPlanTemplatesResult {
  importedCount: number;
  modules: ImportedModuleSummary[];
  programs?: { programId: string; programName?: string; importedSessions: number }[];
}

export interface ImportLessonPlanTemplateWordResult {
  lessonPlanTemplateId: string;
  sessionTemplateId: string | null;
  sessionIndex: number;
  lessonPlanUnitId: string | null;
  orderIndexInUnit: number | null;
  created: boolean;
  title: string;
}

export interface ReorderLessonPlanTemplateSessionOrderItem {
  id: string;
  sessionOrder: number;
}

export interface LessonPlan {
  id: string;
  classId: string;
  classCode?: string;
  classTitle?: string;
  sessionId: string;
  sessionTitle?: string;
  sessionDate?: string;
  templateId?: string | null;
  templateTitle?: string;
  templateLevel?: string;
  templateSessionIndex?: number;
  plannedContent?: string | null;
  actualContent?: string | null;
  actualHomework?: string | null;
  teacherNotes?: string | null;
  // Phase 2 fields
  completionPercent?: number | null;
  carryForwardContent?: string | null;
  submittedBy?: string | null;
  submittedByName?: string | null;
  submittedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLessonPlanRequest {
  classId: string;
  sessionId: string;
  templateId?: string | null;
  plannedContent?: string | null;
  actualContent?: string | null;
  actualHomework?: string | null;
  teacherNotes?: string | null;
  // Phase 2 fields
  completionPercent?: number | null;
  carryForwardContent?: string | null;
}

export interface UpdateLessonPlanRequest {
  templateId?: string | null;
  plannedContent?: string | null;
  actualContent?: string | null;
  actualHomework?: string | null;
  teacherNotes?: string | null;
  // Phase 2 fields
  completionPercent?: number | null;
  carryForwardContent?: string | null;
}

export interface ClassLessonPlanSyllabusSession {
  sessionId: string;
  sessionIndex: number;
  sessionIndexInModule?: number | null;
  syllabusId?: string | null;
  syllabusCode?: string | null;
  syllabusVersion?: string | null;
  syllabusTitle?: string | null;
  sessionDate?: string | null;
  plannedTeacherId?: string | null;
  plannedTeacherName?: string | null;
  actualTeacherId?: string | null;
  actualTeacherName?: string | null;
  lessonPlanId?: string | null;
  templateId?: string | null;
  templateTitle?: string | null;
  templateSyllabusContent?: string | null;
  plannedContent?: string | null;
  actualContent?: string | null;
  actualHomework?: string | null;
  teacherNotes?: string | null;
  completionPercent?: number | null;
  carryForwardContent?: string | null;
  moduleId?: string | null;
  moduleCode?: string | null;
  moduleName?: string | null;
  canEdit: boolean;
}

export interface ClassLessonPlanSyllabus {
  classId: string;
  classCode?: string;
  classTitle?: string;
  programId?: string;
  programName?: string;
  levelId?: string;
  levelName?: string;
  syllabusId?: string | null;
  syllabusCode?: string | null;
  syllabusVersion?: string | null;
  syllabusTitle?: string | null;
  syllabusMetadata?: string | null;
  sessions: ClassLessonPlanSyllabusSession[];
}

export interface SessionLessonPlanDocument {
  sessionId: string;
  classId?: string | null;
  syllabusId?: string | null;
  moduleId?: string | null;
  moduleName?: string | null;
  sessionIndexInModule?: number | null;
  lessonPlanTemplateId?: string | null;
  plannedLessonPlanTemplateId?: string | null;
  actualLessonPlanTemplateId?: string | null;
  plannedLessonTitle?: string | null;
  actualLessonTitle?: string | null;
  teachingLogId?: string | null;
  teachingLogStatus?: string | null;
  teachingProgressStatus?: string | null;
  actualTeachingType?: string | null;
  document: LessonPlanTemplate | null;
}

export interface LessonPlanFileUploadResponse {
  url: string;
  fileName: string;
  size: number;
  folder: string;
  resourceType?: string;
}

export type LessonPlanUploadKind = "template" | "materials" | "media";

function isSuccess(response: ApiLikeResponse | undefined) {
  if (!response) return false;
  if (typeof response.isSuccess === "boolean") return response.isSuccess;
  if (typeof response.success === "boolean") return response.success;
  return true;
}

function unwrapData<T = unknown>(response: ApiLikeResponse | undefined): T | undefined {
  return response?.data as T | undefined;
}

function numberOr(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numberFromUnknown(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function stringOr(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function booleanOr(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeDateString(value: unknown) {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^0001-01-01([t\s].*)?$/i.test(trimmed)) return undefined;
  if (trimmed.toLowerCase() === "null") return undefined;

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime()) && parsed.getUTCFullYear() <= 1) {
    return undefined;
  }

  return trimmed;
}

function dateOr(...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeDateString(value);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function normalizeNullableString(...values: unknown[]) {
  const value = stringOr(...values);
  return value || null;
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function pickTextFromObject(obj: Record<string, unknown> | null, keys: string[]) {
  if (!obj) return "";
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (Array.isArray(value)) {
      const flattened = value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .join("\n");
      if (flattened) return flattened;
    }
  }
  return "";
}

function paginationFromCandidates<T>(root: any, candidates: string[]): PaginatedItems<T> {
  for (const candidate of candidates) {
    const container = root?.[candidate];
    if (container) {
      const items = Array.isArray(container?.items)
        ? (container.items as T[])
        : Array.isArray(container)
          ? (container as T[])
          : [];

      return {
        items,
        pageNumber: numberOr(container?.pageNumber, numberOr(root?.pageNumber, 1)),
        pageSize: numberOr(container?.pageSize, numberOr(root?.pageSize, items.length || 10)),
        totalCount: numberOr(container?.totalCount, items.length),
        totalPages: numberOr(
          container?.totalPages,
          Math.max(1, Math.ceil(numberOr(container?.totalCount, items.length) / Math.max(1, numberOr(container?.pageSize, items.length || 10))))
        ),
      };
    }
  }

  const items = Array.isArray(root?.items) ? (root.items as T[]) : Array.isArray(root) ? (root as T[]) : [];
  const pageSize = numberOr(root?.pageSize, items.length || 10);
  const totalCount = numberOr(root?.totalCount, items.length);

  return {
    items,
    pageNumber: numberOr(root?.pageNumber, 1),
    pageSize,
    totalCount,
    totalPages: numberOr(root?.totalPages, Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)))),
  };
}

function buildQuery<T extends object>(params?: T) {
  const query = new URLSearchParams();

  if (!params) return query.toString();

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.append(key, String(value));
  });

  return query.toString();
}

function normalizeTemplate(item: any): LessonPlanTemplate {
  const syllabus = item?.syllabus ?? item?.Syllabus;
  const metadataObject = parseJsonObject(item?.syllabusMetadata ?? item?.SyllabusMetadata);
  const contentObject = parseJsonObject(
    item?.syllabusContent ??
      item?.SyllabusContent ??
      item?.contentJson ??
      item?.ContentJson ??
      item?.rawContentJson ??
      item?.RawContentJson
  );

  return {
    id: stringOr(item?.id, item?.Id),
    syllabusId:
      normalizeNullableString(
        item?.syllabusId,
        item?.SyllabusId,
        syllabus?.id,
        syllabus?.Id,
        syllabus?.syllabusId,
        syllabus?.SyllabusId,
      ) ?? undefined,
    syllabusCode:
      normalizeNullableString(
        item?.syllabusCode,
        item?.SyllabusCode,
        syllabus?.code,
        syllabus?.Code,
        syllabus?.syllabusCode,
        syllabus?.SyllabusCode,
      ) ?? null,
    syllabusVersion:
      normalizeNullableString(
        item?.syllabusVersion,
        item?.SyllabusVersion,
        syllabus?.version,
        syllabus?.Version,
        syllabus?.syllabusVersion,
        syllabus?.SyllabusVersion,
      ) ?? null,
    syllabusTitle:
      normalizeNullableString(
        item?.syllabusTitle,
        item?.SyllabusTitle,
        syllabus?.title,
        syllabus?.Title,
        syllabus?.syllabusTitle,
        syllabus?.SyllabusTitle,
      ) ?? null,
    programId: stringOr(item?.programId, item?.ProgramId, syllabus?.programId, syllabus?.ProgramId) || undefined,
    programName: stringOr(item?.programName, item?.ProgramName, syllabus?.programName, syllabus?.ProgramName) || undefined,
    levelId: stringOr(item?.levelId, item?.LevelId, syllabus?.levelId, syllabus?.LevelId) || undefined,
    levelName: stringOr(item?.levelName, item?.LevelName, syllabus?.levelName, syllabus?.LevelName) || undefined,
    level: stringOr(item?.levelName, item?.LevelName, item?.level) || undefined,
    moduleCode: stringOr(item?.moduleCode, item?.ModuleCode) || undefined,
    moduleName: stringOr(item?.moduleName, item?.ModuleName) || undefined,
    moduleId: stringOr(item?.moduleId, item?.ModuleId) || undefined,
    moduleOrderIndex:
      numberFromUnknown(
        item?.moduleOrderIndex,
        item?.moduleOrder,
        item?.module?.orderIndex,
        item?.ModuleOrderIndex,
      ) ?? null,
    lessonPlanUnitId: normalizeNullableString(item?.lessonPlanUnitId),
    lessonPlanUnitName: normalizeNullableString(item?.lessonPlanUnitName),
    unitOrderIndex:
      numberFromUnknown(item?.unitOrderIndex, item?.UnitOrderIndex) ?? null,
    unitNumber:
      normalizeNullableString(item?.unitNumber, item?.UnitNumber) ?? null,
    unitTitle:
      normalizeNullableString(item?.unitTitle, item?.UnitTitle) ?? null,
    orderIndexInUnit: numberFromUnknown(item?.orderIndexInUnit) ?? null,
    lessonOrderIndexInUnit:
      numberFromUnknown(item?.lessonOrderIndexInUnit, item?.LessonOrderIndexInUnit) ?? null,
    sessionOrder:
      numberFromUnknown(item?.sessionOrder, item?.SessionOrder) ?? null,
    title: stringOr(item?.title, item?.name, `Session ${numberOr(numberFromUnknown(item?.sessionIndex), 0)}`),
    sessionIndex: numberOr(numberFromUnknown(item?.sessionIndex)),
    syllabusMetadata: normalizeNullableString(item?.syllabusMetadata, item?.SyllabusMetadata),
    syllabusContent: normalizeNullableString(
      item?.syllabusContent,
      item?.SyllabusContent,
      item?.contentJson,
      item?.ContentJson,
      item?.rawContentJson,
      item?.RawContentJson
    ),
    objectives: normalizeNullableString(
      item?.objectives,
      item?.Objectives,
      item?.objective,
      item?.Objective,
      pickTextFromObject(contentObject, ["objectives", "objective", "learningObjectives"])
    ),
    languageContent: normalizeNullableString(
      item?.languageContent,
      item?.LanguageContent,
      item?.language,
      pickTextFromObject(contentObject, ["languageContent", "language", "languageFocus", "language_targets"])
    ),
    vocabulary: normalizeNullableString(
      item?.vocabulary,
      item?.Vocabulary,
      pickTextFromObject(contentObject, ["vocabulary", "vocab", "newWords"])
    ),
    grammar: normalizeNullableString(
      item?.grammar,
      item?.Grammar,
      pickTextFromObject(contentObject, ["grammar", "grammarFocus"])
    ),
    teachingMethodology: normalizeNullableString(
      item?.teachingMethodology,
      item?.TeachingMethodology,
      item?.methodology,
      item?.Methodology,
      pickTextFromObject(contentObject, ["teachingMethodology", "methodology", "approach", "teachingMethod"])
    ),
    teacherMaterials: normalizeNullableString(
      item?.teacherMaterials,
      item?.TeacherMaterials,
      pickTextFromObject(contentObject, ["teacherMaterials", "materialsForTeacher"]),
      pickTextFromObject(metadataObject, ["teachingMaterials", "teacherMaterials"])
    ),
    studentMaterials: normalizeNullableString(
      item?.studentMaterials,
      item?.StudentMaterials,
      pickTextFromObject(contentObject, ["studentMaterials", "materialsForStudents", "studentResources"])
    ),
    procedure: normalizeNullableString(
      item?.procedure,
      item?.Procedure,
      pickTextFromObject(contentObject, ["procedure", "teachingProcedure", "stages", "activities"])
    ),
    evaluation: normalizeNullableString(
      item?.evaluation,
      item?.Evaluation,
      pickTextFromObject(contentObject, ["evaluation", "assessment", "checking"])
    ),
    homework: normalizeNullableString(
      item?.homework,
      item?.Homework,
      pickTextFromObject(contentObject, ["homework", "homeworkTasks", "homeworkMaterials"])
    ),
    teacherNote: normalizeNullableString(
      item?.teacherNote,
      item?.TeacherNote,
      item?.teacherNotes,
      item?.TeacherNotes,
      pickTextFromObject(contentObject, ["teacherNote", "teacherNotes", "note", "notes"])
    ),
    sourceFileName: normalizeNullableString(item?.sourceFileName),
    attachment: normalizeNullableString(item?.attachment, item?.attachmentUrl, item?.fileUrl, item?.file?.url, item?.file?.path),
    isActive: typeof item?.isActive === "boolean" ? item.isActive : undefined,
    createdBy: stringOr(item?.createdBy) || undefined,
    createdByName:
      stringOr(item?.createdByName, item?.creatorName, item?.createdByUser?.fullName, item?.createdByUser?.name) || undefined,
    createdAt: dateOr(item?.createdAt),
    updatedAt: dateOr(item?.updatedAt, item?.modifiedAt, item?.lastUpdatedAt),
    usedCount: numberFromUnknown(item?.usedCount),
  };
}

function normalizeLessonPlan(item: any): LessonPlan {
  const session = item?.session ?? item?.classSession ?? item?.timetableSession;
  const lessonClass = item?.class ?? item?.classroom;
  const template = item?.template ?? item?.lessonPlanTemplate ?? item?.linkedTemplate;
  const teachingLog = item?.teachingLog ?? item?.TeachingLog ?? session?.teachingLog ?? session?.TeachingLog;
  const submittedByUser =
    item?.submittedByUser ??
    item?.submittedByProfile ??
    item?.submittedByNavigation ??
    item?.submittedByAccount;
  const createdByUser =
    item?.createdByUser ??
    item?.createdByProfile ??
    item?.teacher ??
    item?.teacherProfile;

  return {
    id: stringOr(item?.id),
    classId: stringOr(item?.classId, lessonClass?.id),
    classCode: stringOr(item?.classCode, lessonClass?.classCode, lessonClass?.code) || undefined,
    classTitle:
      stringOr(item?.classTitle, item?.className, lessonClass?.classTitle, lessonClass?.title, lessonClass?.name) || undefined,
    sessionId: stringOr(item?.sessionId, session?.id),
    sessionTitle:
      stringOr(item?.sessionTitle, item?.sessionName, session?.sessionTitle, session?.title, session?.name) || undefined,
    sessionDate: dateOr(
      item?.sessionDate,
      item?.plannedDatetime,
      item?.plannedDateTime,
      item?.actualDatetime,
      session?.sessionDate,
      session?.plannedDatetime,
      session?.plannedDateTime,
      session?.actualDatetime
    ),
    templateId: normalizeNullableString(item?.templateId, template?.id),
    templateTitle: stringOr(item?.templateTitle, template?.title, template?.name) || undefined,
    templateLevel: stringOr(item?.templateLevel, template?.level) || undefined,
    templateSessionIndex: numberFromUnknown(item?.templateSessionIndex, template?.sessionIndex),
    plannedContent: normalizeNullableString(item?.plannedContent, item?.planContent, item?.expectedContent),
    actualContent: normalizeNullableString(
      item?.actualContent,
      item?.realContent,
      item?.deliveredContent,
      teachingLog?.actualContent,
      teachingLog?.ActualContent,
      teachingLog?.realContent,
      teachingLog?.deliveredContent,
    ),
    actualHomework: normalizeNullableString(
      item?.actualHomework,
      item?.homework,
      item?.actualHomeWork,
      teachingLog?.actualHomework,
      teachingLog?.ActualHomework,
      teachingLog?.homework,
      teachingLog?.actualHomeWork,
    ),
    teacherNotes: normalizeNullableString(
      item?.teacherNotes,
      item?.teacherNote,
      item?.note,
      item?.notes,
      teachingLog?.teacherNotes,
      teachingLog?.TeacherNotes,
      teachingLog?.teacherNote,
      teachingLog?.TeacherNote,
      teachingLog?.note,
      teachingLog?.notes,
    ),
    submittedBy: normalizeNullableString(
      item?.submittedBy,
      item?.submittedById,
      teachingLog?.submittedBy,
      teachingLog?.SubmittedBy,
      submittedByUser?.id,
      item?.updatedBy,
      item?.createdBy,
    ),
    submittedByName:
      normalizeNullableString(
        item?.submittedByName,
        item?.submittedByUserName,
        submittedByUser?.fullName,
        submittedByUser?.name,
        item?.updatedByName,
        item?.createdByName,
        createdByUser?.fullName,
        createdByUser?.name,
        item?.teacherName
      ),
    submittedAt: dateOr(item?.submittedAt, item?.submissionDate, item?.submissionAt, teachingLog?.submittedAt, teachingLog?.SubmittedAt) || null,
    createdAt: dateOr(item?.createdAt),
    updatedAt: dateOr(item?.updatedAt, item?.modifiedAt, item?.lastUpdatedAt, teachingLog?.updatedAt, teachingLog?.UpdatedAt),
  };
}

function normalizeSyllabusSession(item: any): ClassLessonPlanSyllabusSession {
  const template = item?.template ?? item?.Template ?? item?.lessonPlanTemplate ?? item?.LessonPlanTemplate ?? item?.linkedTemplate ?? item?.LinkedTemplate;
  const lessonPlan = item?.lessonPlan ?? item?.LessonPlan ?? item?.plan ?? item?.Plan;
  const teachingLog = item?.teachingLog ?? item?.TeachingLog ?? lessonPlan?.teachingLog ?? lessonPlan?.TeachingLog;
  const syllabus = item?.syllabus ?? item?.Syllabus ?? template?.syllabus ?? template?.Syllabus;

  return {
    sessionId: stringOr(item?.sessionId, item?.id, item?.SessionId, item?.Id),
    sessionIndex: numberOr(numberFromUnknown(item?.sessionIndex, item?.SessionIndex, item?.index, item?.order)),
    sessionIndexInModule: numberFromUnknown(item?.sessionIndexInModule, item?.SessionIndexInModule) ?? null,
    syllabusId: normalizeNullableString(
      item?.syllabusId,
      item?.SyllabusId,
      syllabus?.id,
      syllabus?.Id,
      syllabus?.syllabusId,
      syllabus?.SyllabusId,
      template?.syllabusId,
      template?.SyllabusId,
      template?.syllabus?.id,
      template?.syllabus?.syllabusId,
      template?.syllabus?.Id,
      template?.syllabus?.SyllabusId,
      template?.Syllabus?.id,
      template?.Syllabus?.Id,
      template?.Syllabus?.syllabusId,
      template?.Syllabus?.SyllabusId,
    ),
    syllabusCode: normalizeNullableString(
      item?.syllabusCode,
      item?.SyllabusCode,
      syllabus?.code,
      syllabus?.Code,
      syllabus?.syllabusCode,
      syllabus?.SyllabusCode,
      template?.syllabusCode,
      template?.SyllabusCode,
      template?.syllabus?.code,
      template?.syllabus?.syllabusCode,
      template?.syllabus?.Code,
      template?.syllabus?.SyllabusCode,
      template?.Syllabus?.code,
      template?.Syllabus?.Code,
      template?.Syllabus?.syllabusCode,
      template?.Syllabus?.SyllabusCode,
    ),
    syllabusVersion: normalizeNullableString(
      item?.syllabusVersion,
      item?.SyllabusVersion,
      syllabus?.version,
      syllabus?.Version,
      syllabus?.syllabusVersion,
      syllabus?.SyllabusVersion,
      template?.syllabusVersion,
      template?.SyllabusVersion,
      template?.syllabus?.version,
      template?.syllabus?.syllabusVersion,
      template?.syllabus?.Version,
      template?.syllabus?.SyllabusVersion,
      template?.Syllabus?.version,
      template?.Syllabus?.Version,
      template?.Syllabus?.syllabusVersion,
      template?.Syllabus?.SyllabusVersion,
    ),
    syllabusTitle: normalizeNullableString(
      item?.syllabusTitle,
      item?.SyllabusTitle,
      syllabus?.title,
      syllabus?.Title,
      syllabus?.syllabusTitle,
      syllabus?.SyllabusTitle,
      template?.syllabusTitle,
      template?.SyllabusTitle,
      template?.syllabus?.title,
      template?.syllabus?.syllabusTitle,
      template?.syllabus?.Title,
      template?.syllabus?.SyllabusTitle,
      template?.Syllabus?.title,
      template?.Syllabus?.Title,
      template?.Syllabus?.syllabusTitle,
      template?.Syllabus?.SyllabusTitle,
    ),
    sessionDate: dateOr(item?.sessionDate, item?.SessionDate, item?.plannedDatetime, item?.plannedDateTime, item?.actualDatetime) || null,
    plannedTeacherId: normalizeNullableString(item?.plannedTeacherId, item?.PlannedTeacherId),
    plannedTeacherName: normalizeNullableString(item?.plannedTeacherName, item?.PlannedTeacherName),
    actualTeacherId: normalizeNullableString(item?.actualTeacherId, item?.ActualTeacherId),
    actualTeacherName: normalizeNullableString(item?.actualTeacherName, item?.ActualTeacherName),
    lessonPlanId: normalizeNullableString(item?.lessonPlanId, item?.LessonPlanId, item?.lessonPlan?.id),
    templateId: normalizeNullableString(
      item?.templateId,
      item?.TemplateId,
      item?.lessonPlanTemplateId,
      item?.LessonPlanTemplateId,
      item?.plannedLessonPlanTemplateId,
      item?.PlannedLessonPlanTemplateId,
      template?.id,
    ),
    templateTitle: normalizeNullableString(
      item?.templateTitle,
      item?.TemplateTitle,
      item?.plannedLessonTitle,
      item?.PlannedLessonTitle,
      template?.title,
      template?.name,
    ),
    templateSyllabusContent: normalizeNullableString(
      item?.templateSyllabusContent,
      item?.TemplateSyllabusContent,
      item?.syllabusContent,
      template?.syllabusContent
    ),
    plannedContent: normalizeNullableString(
      item?.plannedContent,
      item?.PlannedContent,
      item?.planContent,
      lessonPlan?.plannedContent,
      lessonPlan?.PlannedContent,
      lessonPlan?.planContent,
      lessonPlan?.expectedContent
    ),
    actualContent: normalizeNullableString(
      item?.actualContent,
      item?.ActualContent,
      item?.teachingLogActualContent,
      item?.TeachingLogActualContent,
      item?.realContent,
      teachingLog?.actualContent,
      teachingLog?.ActualContent,
      teachingLog?.realContent,
      teachingLog?.deliveredContent,
      lessonPlan?.actualContent,
      lessonPlan?.ActualContent,
      lessonPlan?.realContent,
      lessonPlan?.deliveredContent
    ),
    actualHomework: normalizeNullableString(
      item?.actualHomework,
      item?.ActualHomework,
      item?.teachingLogActualHomework,
      item?.TeachingLogActualHomework,
      item?.homework,
      teachingLog?.actualHomework,
      teachingLog?.ActualHomework,
      teachingLog?.homework,
      teachingLog?.actualHomeWork,
      lessonPlan?.actualHomework,
      lessonPlan?.ActualHomework,
      lessonPlan?.homework,
      lessonPlan?.actualHomeWork
    ),
    teacherNotes: normalizeNullableString(
      item?.teacherNote,
      item?.TeacherNote,
      item?.teacherNotes,
      item?.TeacherNotes,
      item?.teachingLogTeacherNote,
      item?.TeachingLogTeacherNote,
      item?.notes,
      teachingLog?.teacherNote,
      teachingLog?.TeacherNote,
      teachingLog?.teacherNotes,
      teachingLog?.TeacherNotes,
      teachingLog?.notes,
      teachingLog?.note,
      lessonPlan?.teacherNotes,
      lessonPlan?.TeacherNotes,
      lessonPlan?.teacherNote,
      lessonPlan?.note,
      lessonPlan?.notes
    ),
    completionPercent: numberFromUnknown(item?.completionPercent, item?.CompletionPercent, lessonPlan?.completionPercent) ?? null,
    carryForwardContent: normalizeNullableString(item?.carryForwardContent, item?.CarryForwardContent, lessonPlan?.carryForwardContent),
    moduleId: normalizeNullableString(item?.moduleId, item?.ModuleId),
    moduleCode: normalizeNullableString(item?.moduleCode, item?.ModuleCode),
    moduleName: normalizeNullableString(item?.moduleName, item?.ModuleName),
    canEdit: booleanOr(item?.canEdit ?? item?.CanEdit, false),
  };
}

function normalizeSyllabus(data: any): ClassLessonPlanSyllabus {
  const syllabus = data?.syllabus ?? data?.Syllabus ?? data?.linkedSyllabus ?? data?.LinkedSyllabus ?? data?.classSyllabus ?? data?.ClassSyllabus;
  const sessionsRaw = Array.isArray(data?.sessions) ? data.sessions : Array.isArray(data?.Sessions) ? data.Sessions : [];
  const normalizedSessions = sessionsRaw.map(normalizeSyllabusSession);
  const syllabusId = normalizeNullableString(data?.syllabusId, data?.SyllabusId, syllabus?.id, syllabus?.Id, syllabus?.syllabusId, syllabus?.SyllabusId);
  const syllabusCode = normalizeNullableString(data?.syllabusCode, data?.SyllabusCode, syllabus?.code, syllabus?.Code, syllabus?.syllabusCode, syllabus?.SyllabusCode);
  const syllabusVersion = normalizeNullableString(data?.syllabusVersion, data?.SyllabusVersion, syllabus?.version, syllabus?.Version, syllabus?.syllabusVersion, syllabus?.SyllabusVersion);
  const syllabusTitle = normalizeNullableString(data?.syllabusTitle, data?.SyllabusTitle, syllabus?.title, syllabus?.Title, syllabus?.syllabusTitle, syllabus?.SyllabusTitle);

  const anchorSession =
    normalizedSessions.find(
      (session: ClassLessonPlanSyllabusSession) =>
        session.sessionIndex === 1 &&
        (session.syllabusId || session.syllabusCode || session.syllabusVersion || session.syllabusTitle)
    ) ||
    normalizedSessions.find(
      (session: ClassLessonPlanSyllabusSession) =>
        session.syllabusId || session.syllabusCode || session.syllabusVersion || session.syllabusTitle
    );

  const sessions = anchorSession
    ? normalizedSessions.map((session: ClassLessonPlanSyllabusSession) => ({
        ...session,
        syllabusId: session.syllabusId ?? syllabusId ?? anchorSession.syllabusId ?? null,
        syllabusCode: session.syllabusCode ?? syllabusCode ?? anchorSession.syllabusCode ?? null,
        syllabusVersion: session.syllabusVersion ?? syllabusVersion ?? anchorSession.syllabusVersion ?? null,
        syllabusTitle: session.syllabusTitle ?? syllabusTitle ?? anchorSession.syllabusTitle ?? null,
      }))
    : normalizedSessions;

  return {
    classId: stringOr(data?.classId, data?.ClassId),
    classCode: stringOr(data?.classCode, data?.ClassCode) || undefined,
    classTitle: stringOr(data?.classTitle, data?.ClassTitle, data?.className, data?.ClassName) || undefined,
    programId: stringOr(data?.programId, data?.ProgramId, syllabus?.programId, syllabus?.ProgramId) || undefined,
    programName: stringOr(data?.programName, data?.ProgramName, syllabus?.programName, syllabus?.ProgramName) || undefined,
    levelId: stringOr(data?.levelId, data?.LevelId, syllabus?.levelId, syllabus?.LevelId) || undefined,
    levelName: stringOr(data?.levelName, data?.LevelName, syllabus?.levelName, syllabus?.LevelName) || undefined,
    syllabusId,
    syllabusCode,
    syllabusVersion,
    syllabusTitle,
    syllabusMetadata: normalizeNullableString(data?.syllabusMetadata, data?.SyllabusMetadata),
    sessions,
  };
}

function normalizeSessionLessonPlanDocument(data: any): SessionLessonPlanDocument {
  const documentPayload = data?.document ?? data?.lessonPlanTemplate ?? data?.template ?? null;
  const document = documentPayload ? normalizeTemplate(documentPayload) : null;

  return {
    sessionId: stringOr(data?.sessionId, data?.id),
    classId: normalizeNullableString(data?.classId),
    syllabusId: normalizeNullableString(
      data?.syllabusId,
      data?.SyllabusId,
      document?.syllabusId,
    ),
    moduleId: normalizeNullableString(data?.moduleId),
    moduleName: normalizeNullableString(data?.moduleName),
    sessionIndexInModule: numberFromUnknown(data?.sessionIndexInModule) ?? null,
    lessonPlanTemplateId: normalizeNullableString(data?.lessonPlanTemplateId),
    plannedLessonPlanTemplateId: normalizeNullableString(data?.plannedLessonPlanTemplateId),
    actualLessonPlanTemplateId: normalizeNullableString(data?.actualLessonPlanTemplateId),
    plannedLessonTitle: normalizeNullableString(data?.plannedLessonTitle),
    actualLessonTitle: normalizeNullableString(data?.actualLessonTitle),
    teachingLogId: normalizeNullableString(data?.teachingLogId),
    teachingLogStatus: normalizeNullableString(data?.teachingLogStatus),
    teachingProgressStatus: normalizeNullableString(data?.teachingProgressStatus),
    actualTeachingType: normalizeNullableString(data?.actualTeachingType),
    document,
  };
}

function normalizeImportedModule(item: any): ImportedModuleSummary {
  return {
    moduleId: stringOr(item?.moduleId, item?.programId),
    moduleName: stringOr(item?.moduleName, item?.programName) || undefined,
    importedSessions: numberOr(numberFromUnknown(item?.importedSessions)),
  };
}

function extractErrorInfo(error: any) {
  const payload = (error?.response?.data || error?.data || {}) as ProblemDetails;
  const status = error?.response?.status ?? payload?.status;
  const title = payload?.title;
  const detail = payload?.detail;
  const message = stringOr(detail, payload?.error, payload?.message, title, error?.message, "Request failed");

  return {
    isSuccess: false as const,
    message,
    status,
    title,
    detail,
    raw: error?.response?.data ?? error,
  };
}

function formatImportErrors(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return "";

  const normalized = value
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      if (typeof item === "object") {
        const row = (item as { row?: number }).row;
        const detail = stringOr(
          (item as { detail?: string }).detail,
          (item as { message?: string }).message,
          (item as { error?: string }).error
        );
        if (!detail) return "";
        if (typeof row === "number" && Number.isFinite(row)) {
          return `Row ${row}: ${detail}`;
        }
        return detail;
      }
      return "";
    })
    .filter(Boolean);

  if (!normalized.length) return "";
  return normalized.slice(0, 5).join(" | ");
}

function successResponse<T>(data: T, response: ApiLikeResponse): ServiceResponse<T> {
  return {
    isSuccess: isSuccess(response),
    data,
    message: response?.message,
    raw: response,
  };
}

function errorResponse<T>(fallback: T, error: any): ServiceResponse<T> {
  return {
    ...extractErrorInfo(error),
    data: fallback,
  };
}

export async function getAllLessonPlanTemplates(
  params?: GetLessonPlanTemplatesParams
): Promise<ServiceResponse<{ templates: PaginatedItems<LessonPlanTemplate> }>> {
  try {
    const query = buildQuery(params);
    const url = `${ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES}${query ? `?${query}` : ""}`;
    const response = await get<ApiLikeResponse>(url);
    const data = unwrapData<any>(response);
    const pagination = paginationFromCandidates<any>(data, [
      "templates",
      "Templates",
      "lessonPlanTemplates",
      "LessonPlanTemplates",
    ]);

    return successResponse(
      {
        templates: {
          ...pagination,
          items: pagination.items.map(normalizeTemplate),
        },
      },
      response
    );
  } catch (error) {
    return errorResponse(
      {
        templates: {
          items: [],
          pageNumber: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 1,
        },
      },
      error
    );
  }
}

export async function getLessonPlanTemplateById(id: string): Promise<ServiceResponse<LessonPlanTemplate | null>> {
  try {
    const response = await get<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id));
    const data = unwrapData<any>(response);
    const item = data?.lessonPlanTemplate ?? data?.template ?? data;

    return successResponse(item ? normalizeTemplate(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function updateLessonPlanTemplate(
  id: string,
  data: UpdateLessonPlanTemplateRequest
): Promise<ServiceResponse<LessonPlanTemplate | null>> {
  try {
    const response = await put<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id), data);
    const responseData = unwrapData<any>(response);
    const item = responseData?.lessonPlanTemplate ?? responseData?.template ?? responseData;

    return successResponse(item ? normalizeTemplate(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function deleteLessonPlanTemplate(id: string): Promise<ServiceResponse<null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chua dang nhap." };
  try {
    const res = await fetch(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { isSuccess: false, data: null, message: String(json?.message ?? res.status) };
    return { isSuccess: true, data: null };
  } catch (error) {
    return { isSuccess: false, data: null, message: String(error) };
  }
}

export async function importLessonPlanTemplates(
  payload: ImportLessonPlanTemplatesRequest
): Promise<ServiceResponse<ImportLessonPlanTemplatesResult | null>> {
  const token = getAccessToken();

  if (!token) {
    return {
      isSuccess: false,
      data: null,
      message: "Chua dang nhap.",
    };
  }

  try {
    const query = new URLSearchParams();

    if (payload.moduleId) query.append("moduleId", payload.moduleId);
    if (payload.overwriteExisting !== undefined) {
      query.append("overwriteExisting", String(payload.overwriteExisting));
    }

    const url = `${ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_IMPORT}${query.toString() ? `?${query.toString()}` : ""}`;
    const formData = new FormData();
    formData.append("file", payload.file);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const importErrors = formatImportErrors(data?.errors ?? data?.data?.errors);
      return {
        isSuccess: false,
        data: null,
        message: stringOr(importErrors, data?.detail, data?.error, data?.message, data?.title, "Import file that bai."),
        status: typeof data?.status === "number" ? data.status : response.status,
        title: stringOr(data?.title) || undefined,
        detail: stringOr(data?.detail) || undefined,
        raw: data,
      };
    }

    const payloadData = data?.data ?? data;

    return {
      isSuccess: true,
      data: {
        importedCount: numberOr(numberFromUnknown(payloadData?.importedCount)),
        modules: Array.isArray(payloadData?.modules) ? payloadData.modules.map(normalizeImportedModule) : [],
      },
      message: data?.message,
      raw: data,
    };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function importLessonPlanTemplateWord(
  moduleId: string,
  file: File,
  options?: { lessonPlanUnitId?: string | null; sessionIndexOverride?: number | null }
): Promise<ServiceResponse<ImportLessonPlanTemplateWordResult | null>> {
  const token = getAccessToken();

  if (!token) {
    return {
      isSuccess: false,
      data: null,
      message: "Chua dang nhap.",
    };
  }

  try {
    const query = new URLSearchParams({ moduleId });
    if (options?.lessonPlanUnitId) query.append("lessonPlanUnitId", options.lessonPlanUnitId);
    if (options?.sessionIndexOverride != null) query.append("sessionIndexOverride", String(options.sessionIndexOverride));
    const url = `${ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_IMPORT_WORD}?${query.toString()}`;
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        isSuccess: false,
        data: null,
        message: stringOr(data?.detail, data?.error, data?.message, data?.title, "Import Word that bai."),
        status: typeof data?.status === "number" ? data.status : response.status,
        title: stringOr(data?.title) || undefined,
        detail: stringOr(data?.detail) || undefined,
        raw: data,
      };
    }

    const payloadData = data?.data ?? data;

    return {
      isSuccess: true,
      data: {
        lessonPlanTemplateId: stringOr(payloadData?.lessonPlanTemplateId),
        sessionTemplateId: stringOr(payloadData?.sessionTemplateId) || null,
        sessionIndex: numberOr(numberFromUnknown(payloadData?.sessionIndex)),
        lessonPlanUnitId: stringOr(payloadData?.lessonPlanUnitId) || null,
        orderIndexInUnit: typeof payloadData?.orderIndexInUnit === "number" ? payloadData.orderIndexInUnit : null,
        created: payloadData?.created === true,
        title: stringOr(payloadData?.title),
      },
      message: data?.message,
      raw: data,
    };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function getClassLessonPlanSyllabus(
  classId: string
): Promise<ServiceResponse<ClassLessonPlanSyllabus | null>> {
  try {
    const response = await get<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLANS_CLASS_SYLLABUS(classId));
    const data = unwrapData<any>(response);

    return successResponse(data ? normalizeSyllabus(data) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function getSessionLessonPlanDocument(
  sessionId: string
): Promise<ServiceResponse<SessionLessonPlanDocument | null>> {
  try {
    const response = await get<ApiLikeResponse>(`/api/sessions/${sessionId}/lesson-plan-document`);
    const data = unwrapData<any>(response);

    return successResponse(data ? normalizeSessionLessonPlanDocument(data) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function getLessonPlanById(id: string): Promise<ServiceResponse<LessonPlan | null>> {
  try {
    const response = await get<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLANS_BY_ID(id));
    const data = unwrapData<any>(response);
    const item = data?.lessonPlan ?? data?.plan ?? data;

    return successResponse(item ? normalizeLessonPlan(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function createLessonPlan(data: CreateLessonPlanRequest): Promise<ServiceResponse<LessonPlan | null>> {
  try {
    const response = await post<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLANS, data);
    const responseData = unwrapData<any>(response);
    const item = responseData?.lessonPlan ?? responseData?.plan ?? responseData;

    return successResponse(item ? normalizeLessonPlan(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function updateLessonPlan(
  id: string,
  data: UpdateLessonPlanRequest
): Promise<ServiceResponse<LessonPlan | null>> {
  try {
    const response = await put<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLANS_BY_ID(id), data);
    const responseData = unwrapData<any>(response);
    const item = responseData?.lessonPlan ?? responseData?.plan ?? responseData;

    return successResponse(item ? normalizeLessonPlan(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function uploadLessonPlanFile(
  kind: LessonPlanUploadKind,
  file: File,
  options?: { isVideo?: boolean }
): Promise<LessonPlanFileUploadResponse> {
  const folder =
    kind === "template"
      ? "lesson-plan/template"
      : kind === "materials"
        ? "lesson-plan/materials"
        : "lesson-plan/media";
  const resourceType = kind === "media" && booleanOr(options?.isVideo, false) ? "video" : "auto";
  const uploadResponse = await uploadFile(file, folder, resourceType);

  if (!isUploadSuccess(uploadResponse)) {
    throw new Error(stringOr(uploadResponse?.error, uploadResponse?.detail, uploadResponse?.title, "Tai file len that bai."));
  }

  return {
    url: stringOr(uploadResponse?.url),
    fileName: stringOr(uploadResponse?.fileName),
    size: numberOr(uploadResponse?.size),
    folder: stringOr(uploadResponse?.folder),
    resourceType,
  };
}

// ─── Lesson Plan Units ────────────────────────────────────────────────────────

export interface LessonPlanUnit {
  id: string;
  moduleId: string;
  name: string;
  orderIndex: number;
  lessonCount: number;
  isActive: boolean;
}

export interface CreateLessonPlanUnitRequest {
  name: string;
}

export interface UpdateLessonPlanUnitRequest {
  name?: string;
  isActive?: boolean;
}

export interface ReorderItem {
  id: string;
  orderIndex: number;
}

export interface ReorderLessonItem {
  id: string;
  orderIndexInUnit: number;
}

export interface MoveLessonToUnitRequest {
  lessonPlanUnitId: string | null;
  orderIndexInUnit?: number | null;
}

function normalizeLessonPlanUnit(item: any): LessonPlanUnit {
  return {
    id: stringOr(item?.id),
    moduleId: stringOr(item?.moduleId),
    name: stringOr(item?.name),
    orderIndex: numberOr(numberFromUnknown(item?.orderIndex)),
    lessonCount: numberOr(numberFromUnknown(item?.lessonCount)),
    isActive: typeof item?.isActive === "boolean" ? item.isActive : true,
  };
}

export async function getLessonPlanUnits(
  moduleId: string,
): Promise<ServiceResponse<LessonPlanUnit[]>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: [], message: "Chua dang nhap." };
  try {
    const res = await fetch(MODULE_ENDPOINTS.LESSON_PLAN_UNITS(moduleId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { isSuccess: false, data: [], message: String(json?.message ?? res.status) };
    const items: any[] = json?.data?.items ?? json?.data ?? json?.items ?? (Array.isArray(json) ? json : []);
    return { isSuccess: true, data: items.map(normalizeLessonPlanUnit) };
  } catch (error) {
    return { isSuccess: false, data: [], message: String(error) };
  }
}

export async function createLessonPlanUnit(
  moduleId: string,
  body: CreateLessonPlanUnitRequest,
): Promise<ServiceResponse<LessonPlanUnit | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chua dang nhap." };
  try {
    const res = await fetch(MODULE_ENDPOINTS.LESSON_PLAN_UNITS(moduleId), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { isSuccess: false, data: null, message: String(json?.message ?? res.status) };
    return { isSuccess: true, data: normalizeLessonPlanUnit(json?.data ?? json) };
  } catch (error) {
    return { isSuccess: false, data: null, message: String(error) };
  }
}

export async function updateLessonPlanUnit(
  unitId: string,
  body: UpdateLessonPlanUnitRequest,
): Promise<ServiceResponse<LessonPlanUnit | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chua dang nhap." };
  try {
    const res = await fetch(ADMIN_ENDPOINTS.LESSON_PLAN_UNITS_BY_ID(unitId), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { isSuccess: false, data: null, message: String(json?.message ?? res.status) };
    return { isSuccess: true, data: normalizeLessonPlanUnit(json?.data ?? json) };
  } catch (error) {
    return { isSuccess: false, data: null, message: String(error) };
  }
}

export async function deleteLessonPlanUnit(
  unitId: string,
): Promise<ServiceResponse<null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chua dang nhap." };
  try {
    const res = await fetch(ADMIN_ENDPOINTS.LESSON_PLAN_UNITS_BY_ID(unitId), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { isSuccess: false, data: null, message: String(json?.message ?? res.status) };
    return { isSuccess: true, data: null };
  } catch (error) {
    return { isSuccess: false, data: null, message: String(error) };
  }
}

export async function reorderLessonPlanUnits(
  moduleId: string,
  items: ReorderItem[],
): Promise<ServiceResponse<null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chua dang nhap." };
  try {
    const res = await fetch(MODULE_ENDPOINTS.LESSON_PLAN_UNITS_REORDER(moduleId), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { isSuccess: false, data: null, message: String(json?.message ?? res.status) };
    return { isSuccess: true, data: null };
  } catch (error) {
    return { isSuccess: false, data: null, message: String(error) };
  }
}

export async function moveLessonToUnit(
  templateId: string,
  body: MoveLessonToUnitRequest,
): Promise<ServiceResponse<null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chua dang nhap." };
  try {
    const res = await fetch(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_UNIT(templateId), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { isSuccess: false, data: null, message: String(json?.message ?? res.status) };
    return { isSuccess: true, data: null };
  } catch (error) {
    return { isSuccess: false, data: null, message: String(error) };
  }
}

export async function reorderLessonPlanTemplateSessionOrders(
  levelId: string,
  items: ReorderLessonPlanTemplateSessionOrderItem[],
): Promise<ServiceResponse<null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chua dang nhap." };
  try {
    const res = await fetch(ADMIN_ENDPOINTS.LEVELS_LESSON_PLAN_TEMPLATES_SESSION_ORDERS(levelId), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { isSuccess: false, data: null, message: String(json?.message ?? res.status) };
    return { isSuccess: true, data: null };
  } catch (error) {
    return { isSuccess: false, data: null, message: String(error) };
  }
}

export async function reorderLessonsInUnit(
  unitId: string,
  items: ReorderLessonItem[],
): Promise<ServiceResponse<null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chua dang nhap." };
  try {
    const res = await fetch(ADMIN_ENDPOINTS.LESSON_PLAN_UNITS_REORDER_LESSONS(unitId), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { isSuccess: false, data: null, message: String(json?.message ?? res.status) };
    return { isSuccess: true, data: null };
  } catch (error) {
    return { isSuccess: false, data: null, message: String(error) };
  }
}
