"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardPen,
  Clock3,
  Eye,
  FilePlus2,
  FileText,
  FolderOpen,
  GraduationCap,
  GripVertical,
  Layers,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
  Zap,
  CheckCircle,
  Tag,
  Lightbulb,
  ListChecks,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BASE_URL, buildFileUrl } from "@/constants/apiURL";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { getAllClasses, getClassById } from "@/lib/api/classService";
import {
  ClassLessonPlanSyllabus,
  ClassLessonPlanSyllabusSession,
  createLessonPlan,
  createLessonPlanTemplate,
  getAllLessonPlanTemplates,
  getClassLessonPlanSyllabus,
  getLessonPlanById,
  getLessonPlanTemplateById,
  LessonPlan,
  LessonPlanTemplate,
  LessonPlanUnit,
  updateLessonPlan,
  updateLessonPlanTemplate,
  uploadLessonPlanFile,
  getLessonPlanUnits,
  createLessonPlanUnit,
  updateLessonPlanUnit,
  deleteLessonPlanUnit,
  reorderLessonPlanUnits,
  reorderLessonsInUnit,
  importLessonPlanTemplateWord,
  reorderLessonPlanTemplateSessionOrders,
  getSessionLessonPlanDocument,
  SessionLessonPlanDocument,
} from "@/lib/api/lessonPlanService";
import { hardDeleteLessonPlanTemplate } from "@/lib/api/hardDeleteService";
import {
  getBranchSyllabusAssignments,
  getSyllabusById,
  getSyllabuses,
  getUnitLessonPlans,
  SyllabusDetail,
  SyllabusListItem,
} from "@/lib/api/syllabusService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import LessonPlanTemplateDocument from "@/components/lesson-plans/LessonPlanTemplateDocument";
import { getTeacherClasses } from "@/lib/api/teacherService";
import { getTeachingLog } from "@/lib/api/sessionService";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import type { ClassApiDetail } from "@/types/admin/classes";

type WorkspaceScope = "teacher" | "staff-management" | "admin";
type WorkspacePresentation = "workspace" | "session-page";
type ActiveTab = "templates" | "plans";
type WorkspaceLockedTab = ActiveTab | null;
type TemplateStatusFilter = "all" | "active" | "inactive" | "withAttachment";
type PlanStatusFilter =
  | "all"
  | "editable"
  | "hasPlan"
  | "missingPlan"
  | "withTemplate"
  | "reported"
  | "notReported";
type SessionContentModalKind = "syllabus" | "planned" | "actual";

type Option = {
  id: string;
  label: string;
  hint?: string;
};

type ClassOptionSource = {
  id?: string | number | null;
  title?: string | null;
  name?: string | null;
  classTitle?: string | null;
  code?: string | null;
  classCode?: string | null;
  programName?: string | null;
  level?: string | null;
};

type TemplateModalState =
  | { mode: "create" }
  | { mode: "edit"; item: LessonPlanTemplate }
  | null;

type PlanModalState =
  | { mode: "create"; session: ClassLessonPlanSyllabusSession }
  | { mode: "edit"; session: ClassLessonPlanSyllabusSession; plan: LessonPlan }
  | null;

type DetailState =
  | {
      type: "template";
      loading: boolean;
      item: LessonPlanTemplate | null;
      error?: string;
    }
  | {
      type: "plan";
      loading: boolean;
      item: LessonPlan | null;
      error?: string;
    }
  | {
      type: "session-document";
      loading: boolean;
      item: SessionLessonPlanDocument | null;
      fallbackTemplate: LessonPlanTemplate | null;
      fallbackContent?: string | null;
      error?: string;
    }
  | null;

type DetailModalState = Exclude<DetailState, null>;
type SessionDocumentDetailState = Extract<
  DetailModalState,
  { type: "session-document" }
>;

const COPY: Record<
  WorkspaceScope,
  {
    title: string;
    subtitle: string;
    planSubtitle: string;
  }
> = {
  teacher: {
    title: "Giáo án theo lớp",
    subtitle:
      "Theo dõi syllabus của lớp, tạo giáo án theo từng buổi và cập nhật nội dung dạy thực tế.",
    planSubtitle: "Syllabus theo lớp của bạn",
  },
  "staff-management": {
    title: "Không gian quản lý giáo án",
    subtitle:
      "Quản lý syllabus chuẩn, nhập mẫu giáo án và rà soát giáo án theo từng lớp.",
    planSubtitle: "Syllabus theo lớp toàn trung tâm",
  },
  admin: {
    title: "Không gian quản lý giáo án",
    subtitle:
      "Quản trị mẫu giáo án và đồng bộ luồng giáo án theo contract backend mới.",
    planSubtitle: "Syllabus theo lớp toàn hệ thống",
  },
};

const BACKEND_ROOT_URL = BASE_URL.replace(/\/api\/?$/, "");

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
function normalizeDateValue(value?: string | null) {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^0001-01-01([t\s].*)?$/i.test(trimmed)) return undefined;
  if (trimmed.toLowerCase() === "null") return undefined;

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime()) && date.getUTCFullYear() <= 1) {
    return undefined;
  }

  return trimmed;
}

function formatDate(
  value?: string | null,
  withTime = false,
  fallback = "Chưa cập nhật",
) {
  const normalized = normalizeDateValue(value);
  if (!normalized) return fallback;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  });
}

function resolveAttachmentUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${BACKEND_ROOT_URL}${url}`;
  return `${BACKEND_ROOT_URL}/${url}`;
}

function buildClassOption(item: ClassOptionSource): Option {
  const label =
    item?.title ||
    item?.name ||
    item?.classTitle ||
    item?.code ||
    item?.classCode ||
    "Lớp học";
  const hint =
    [item?.code || item?.classCode, item?.programName, item?.level]
      .filter(Boolean)
      .join(" • ") || undefined;

  return {
    id: String(item?.id || ""),
    label,
    hint,
  };
}

function getTemplateStatus(item: LessonPlanTemplate) {
  return item.isActive === false ? "inactive" : "active";
}

function extractMessage(
  result:
    | { message?: string; detail?: string; title?: string }
    | null
    | undefined,
  fallback: string,
) {
  return result?.message || result?.detail || result?.title || fallback;
}

function parseJsonContent(value?: string | null) {
  if (!value || !value.trim()) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function hasDisplayablePayload(value?: string | null) {
  const text = value?.trim();
  if (!text) return false;

  const parsed = parseJsonContent(text);
  if (!parsed) return true;
  if (Array.isArray(parsed)) return parsed.length > 0;
  if (typeof parsed === "object")
    return Object.keys(parsed as Record<string, unknown>).length > 0;
  return true;
}

function isTrivialPlannedContent(value?: string | null) {
  const text = value?.trim();
  if (!text) return true;

  const parsed = parseJsonContent(text);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
    return false;

  const objectValue = parsed as Record<string, unknown>;
  const keys = Object.keys(objectValue);
  const allowedKeys = new Set(["sessionIndex", "activities"]);
  const hasOnlySkeletonKeys = keys.every((key) => allowedKeys.has(key));
  const hasEmptyActivities =
    Array.isArray(objectValue.activities) &&
    objectValue.activities.length === 0;

  return hasOnlySkeletonKeys && hasEmptyActivities;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  if (index < 0) return "";
  return fileName.slice(index + 1).toLowerCase();
}

function isSupportedSyllabusFile(fileName: string) {
  const extension = getFileExtension(fileName);
  return extension === "xlsx" || extension === "xls" || extension === "csv";
}

function getTemplateDisplayTitle(item: LessonPlanTemplate) {
  const sourceFileName = item.sourceFileName?.trim();
  if (sourceFileName) return sourceFileName;
  return item.title;
}

function getTemplateDisplaySubtitle(item: LessonPlanTemplate) {
  const sourceFileName = item.sourceFileName?.trim();
  const title = item.title?.trim();

  if (!sourceFileName) return "Tạo thủ công";
  if (title && title !== sourceFileName) return `Tiêu đề hệ thống: ${title}`;
  return "Nguồn từ file";
}

function compareLessonsByBeOrder(a: LessonPlanTemplate, b: LessonPlanTemplate) {
  const aHasOrder = typeof a.orderIndexInUnit === "number";
  const bHasOrder = typeof b.orderIndexInUnit === "number";

  if (aHasOrder && bHasOrder) {
    return (a.orderIndexInUnit as number) - (b.orderIndexInUnit as number);
  }

  if (aHasOrder) return -1;
  if (bHasOrder) return 1;

  const aIdx = a.sessionIndex ?? Number.MAX_SAFE_INTEGER;
  const bIdx = b.sessionIndex ?? Number.MAX_SAFE_INTEGER;
  return aIdx - bIdx;
}

const TEACHER_EDITABLE_FIELDS = {
  classwork: "Classwork",
  requiredMaterials: "Required materials",
  homeworkRequiredMaterials: "Homework required materials",
  extra: "Extra / Note",
  homeworkMaterials: "Homework required materials (block)",
  homeworkNotes: "Homework extra / note (block)",
} as const;

function getSuggestedNextSessionIndex(
  templates: LessonPlanTemplate[],
  programId: string,
  excludeId?: string,
): number {
  const indices = templates
    .filter(
      (t) =>
        t.programId === programId &&
        t.id !== excludeId &&
        t.sessionIndex != null,
    )
    .map((t) => t.sessionIndex!);
  if (indices.length === 0) return 1;
  return Math.max(...indices) + 1;
}

function pickSharedProgramTemplate(
  templates: LessonPlanTemplate[],
  programId?: string | null,
): LessonPlanTemplate | undefined {
  if (!programId) return undefined;

  const inProgram = templates.filter((item) => item.programId === programId);
  if (!inProgram.length) return undefined;

  const active = inProgram.filter(
    (item) => getTemplateStatus(item) === "active",
  );
  const source = active.length ? active : inProgram;

  return [...source].sort((a, b) => {
    const aAnchor = a.sessionIndex === 1 ? 0 : 1;
    const bAnchor = b.sessionIndex === 1 ? 0 : 1;
    if (aAnchor !== bAnchor) return aAnchor - bAnchor;

    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  })[0];
}

function hasStructuredTemplateContent(
  template?: LessonPlanTemplate | null,
): boolean {
  if (!template) return false;

  return Boolean(
    template.objectives ||
      template.languageContent ||
      template.vocabulary ||
      template.grammar ||
      template.teachingMethodology ||
      template.teacherMaterials ||
      template.studentMaterials ||
      template.procedure ||
      template.evaluation ||
      template.homework,
  );
}

function mergeTemplateWithContentFallback(
  template: LessonPlanTemplate,
  fallback?: LessonPlanTemplate,
): LessonPlanTemplate {
  if (!fallback) return template;

  return {
    ...fallback,
    ...template,
    syllabusMetadata:
      template.syllabusMetadata ?? fallback.syllabusMetadata ?? null,
    syllabusContent: template.syllabusContent ?? fallback.syllabusContent ?? null,
    objectives: template.objectives ?? fallback.objectives ?? null,
    languageContent:
      template.languageContent ?? fallback.languageContent ?? null,
    vocabulary: template.vocabulary ?? fallback.vocabulary ?? null,
    grammar: template.grammar ?? fallback.grammar ?? null,
    teachingMethodology:
      template.teachingMethodology ?? fallback.teachingMethodology ?? null,
    teacherMaterials:
      template.teacherMaterials ?? fallback.teacherMaterials ?? null,
    studentMaterials:
      template.studentMaterials ?? fallback.studentMaterials ?? null,
    procedure: template.procedure ?? fallback.procedure ?? null,
    evaluation: template.evaluation ?? fallback.evaluation ?? null,
    homework: template.homework ?? fallback.homework ?? null,
    teacherNote: template.teacherNote ?? fallback.teacherNote ?? null,
    sourceFileName: template.sourceFileName ?? fallback.sourceFileName ?? null,
    attachment: template.attachment ?? fallback.attachment ?? null,
    createdBy: template.createdBy ?? fallback.createdBy,
    createdByName: template.createdByName ?? fallback.createdByName,
    createdAt: template.createdAt ?? fallback.createdAt,
    updatedAt: template.updatedAt ?? fallback.updatedAt,
    usedCount: template.usedCount ?? fallback.usedCount,
  };
}

function hasSessionTemplateLinkage(
  session: Pick<
    ClassLessonPlanSyllabusSession,
    | "templateId"
    | "templateTitle"
    | "templateSyllabusContent"
    | "plannedContent"
    | "moduleId"
    | "sessionIndexInModule"
  >,
): boolean {
  return Boolean(
    session.templateId ||
      session.templateTitle ||
      session.templateSyllabusContent ||
      session.plannedContent ||
      session.moduleId ||
      session.sessionIndexInModule != null,
  );
}

function pickSessionFallbackTemplate(
  templates: LessonPlanTemplate[],
  session: Pick<
    ClassLessonPlanSyllabusSession,
    "moduleId" | "sessionIndexInModule" | "syllabusId"
  >,
  sharedTemplate?: LessonPlanTemplate,
): LessonPlanTemplate | undefined {
  const moduleId = session.moduleId?.trim();
  const syllabusId = session.syllabusId?.trim();

  if (moduleId) {
    const moduleTemplates = templates.filter((item) => {
      if (item.moduleId?.trim() !== moduleId) return false;
      if (!syllabusId) return true;
      return item.syllabusId?.trim() === syllabusId;
    });

    if (moduleTemplates.length) {
      const sessionOrder = session.sessionIndexInModule;
      if (sessionOrder != null) {
        const exactCandidates = moduleTemplates.filter((item) => {
          if (item.sessionOrder != null && item.sessionOrder === sessionOrder) {
            return true;
          }
          if (item.sessionIndex != null && item.sessionIndex === sessionOrder) {
            return true;
          }
          if (
            item.lessonOrderIndexInUnit != null &&
            item.lessonOrderIndexInUnit === sessionOrder
          ) {
            return true;
          }
          if (
            item.orderIndexInUnit != null &&
            (item.orderIndexInUnit === sessionOrder ||
              item.orderIndexInUnit + 1 === sessionOrder)
          ) {
            return true;
          }
          return false;
        });

        if (exactCandidates.length) {
          return [...exactCandidates].sort(compareLessonsByBeOrder)[0];
        }
      }

      return [...moduleTemplates].sort(compareLessonsByBeOrder)[0];
    }
  }

  return sharedTemplate;
}

function extractLessonPlanSections(
  content: string | null | undefined,
  template?: LessonPlanTemplate | null,
) {
  const rawContent = String(content ?? template?.syllabusContent ?? "").trim();
  const contentObj = asObject(parseJsonContent(rawContent));

  return {
    rawContent,
    objectives:
      pickStringValue(contentObj, ["objectives", "objective", "learningObjectives"]) ||
      String(template?.objectives ?? "").trim(),
    languageContent:
      pickStringValue(contentObj, ["languageContent", "language", "languageFocus"]) ||
      String(template?.languageContent ?? "").trim(),
    vocabulary:
      pickStringValue(contentObj, ["vocabulary", "vocab", "newWords"]) ||
      String(template?.vocabulary ?? "").trim(),
    grammar:
      pickStringValue(contentObj, ["grammar", "grammarFocus"]) ||
      String(template?.grammar ?? "").trim(),
    methodology:
      pickStringValue(contentObj, [
        "teachingMethodology",
        "methodology",
        "teachingMethod",
        "approach",
      ]) || String(template?.teachingMethodology ?? "").trim(),
    teacherMaterials:
      pickStringValue(contentObj, ["teacherMaterials", "materialsForTeacher"]) ||
      String(template?.teacherMaterials ?? "").trim(),
    studentMaterials:
      pickStringValue(contentObj, [
        "studentMaterials",
        "materialsForStudents",
        "studentResources",
      ]) || String(template?.studentMaterials ?? "").trim(),
    procedure:
      pickStringValue(contentObj, ["procedure", "teachingProcedure", "activities"]) ||
      String(template?.procedure ?? "").trim(),
    evaluation:
      pickStringValue(contentObj, ["evaluation", "assessment", "checking"]) ||
      String(template?.evaluation ?? "").trim(),
    homework:
      pickStringValue(contentObj, ["homework", "homeworkTasks", "homeworkNotes"]) ||
      String(template?.homework ?? "").trim(),
  };
}

function pickStringValue(
  obj: Record<string, unknown> | null,
  keys: string[],
): string {
  if (!obj) return "";
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/**
 * Parses plain-text syllabusMetadata (e.g. imported from Excel) that uses
 * labelled-section format:
 *   Day: ___15/04___
 *   (Duration: ___1h30___ )
 *   General information: ...
 *   Teaching Materials: ...
 *   Note: ...
 */
function parsePlainMetadataText(text: string): {
  day: string;
  duration: string;
  generalInformation: string;
  teachingMaterialsText: string;
  note: string;
} | null {
  if (!text.trim()) return null;

  const lines = text.split("\n").map((l) => l.trim());

  let day = "";
  let duration = "";
  let generalInformation = "";
  const materialLines: string[] = [];
  let note = "";

  type Mode = "none" | "general" | "materials" | "note";
  let mode: Mode = "none";

  // Headers that start a new "materials" block
  const MATERIAL_SECTION_RE =
    /^(teaching materials?|grapeseed|heinemann|course book|workbook|other materials?|handbook for reading)/i;

  for (const line of lines) {
    if (!line) continue;

    // Duration: "(Duration: ___1h30___ )" or "Duration: 1h30"
    const durationMatch = line.match(/^\(?Duration:\s*(.+?)\)?\s*$/i);
    if (durationMatch) {
      duration = durationMatch[1].replace(/_+/g, "").trim();
      mode = "none";
      continue;
    }

    // Day: "Day: ___15/04___"
    const dayMatch = line.match(/^Days?:\s*(.+)/i);
    if (dayMatch) {
      day = dayMatch[1].replace(/_+/g, "").trim();
      mode = "none";
      continue;
    }

    // General information section
    const genMatch = line.match(/^General information[s]?:\s*(.*)/i);
    if (genMatch) {
      generalInformation = genMatch[1].trim();
      mode = "general";
      continue;
    }

    // Note section (last)
    const noteMatch = line.match(/^Note[s]?:\s*(.*)/i);
    if (noteMatch) {
      note = noteMatch[1].trim();
      mode = "note";
      continue;
    }

    // Teaching Materials and similar headers → materials section
    const matHeaderMatch = line.match(/^Teaching Materials?:\s*(.*)/i);
    if (matHeaderMatch) {
      const rest = matHeaderMatch[1].trim();
      if (rest) materialLines.push(`Teaching Materials: ${rest}`);
      mode = "materials";
      continue;
    }

    // Depending on current mode
    if (mode === "general") {
      // If line looks like start of a known materials subsection, switch mode
      if (
        MATERIAL_SECTION_RE.test(line) ||
        line.startsWith("+ ") ||
        /^https?:\/\//i.test(line)
      ) {
        materialLines.push(line);
        mode = "materials";
      } else {
        generalInformation = generalInformation
          ? `${generalInformation}\n${line}`
          : line;
      }
    } else if (mode === "materials") {
      materialLines.push(line);
    } else if (mode === "note") {
      note = note ? `${note}\n${line}` : line;
    }
    // mode === "none": skip header lines like "LINES", "SYLLABUS - COURSE TEMPLATE"
  }

  const hasContent =
    day || duration || generalInformation || materialLines.length || note;
  if (!hasContent) return null;

  return {
    day,
    duration,
    generalInformation,
    teachingMaterialsText: materialLines.join("\n"),
    note,
  };
}

function parseMetadataFromLinesObject(obj: Record<string, unknown> | null) {
  if (!obj) return null;
  if (!Array.isArray(obj.lines)) return null;

  const linesText = linesToTextarea(obj.lines);
  if (!linesText.trim()) return null;

  return parsePlainMetadataText(linesText);
}

function buildPlainMetadataText(input: {
  day: string;
  duration: string;
  generalInformation: string;
  teachingMaterialsText: string;
  note: string;
}): string {
  const lines: string[] = ["LINES", "SYLLABUS - COURSE TEMPLATE"];

  if (input.duration.trim()) {
    lines.push(`(Duration: ${input.duration.trim()} )`);
  }

  if (input.day.trim()) {
    lines.push(`Day: ${input.day.trim()}`);
  }

  if (input.generalInformation.trim()) {
    lines.push(`General information: ${input.generalInformation.trim()}`);
  }

  const teachingMaterialsLines = textareaToLines(input.teachingMaterialsText);
  if (teachingMaterialsLines.length) {
    lines.push(`Teaching Materials: ${teachingMaterialsLines[0]}`);
    if (teachingMaterialsLines.length > 1) {
      lines.push(...teachingMaterialsLines.slice(1));
    }
  }

  if (input.note.trim()) {
    lines.push(`Note: ${input.note.trim()}`);
  }

  return lines.join("\n");
}

function linesToTextarea(value: unknown): string {
  if (Array.isArray(value))
    return value.filter((v) => typeof v === "string").join("\n");
  if (typeof value === "string") return value;
  return "";
}

function textareaToLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type TeachingMaterialDraft = {
  title: string;
  resource: string;
};

function createEmptyTeachingMaterial(): TeachingMaterialDraft {
  return {
    title: "",
    resource: "",
  };
}

function parseTeachingMaterialLine(
  line: string,
  index: number,
): TeachingMaterialDraft {
  const normalized = line.replace(/^\+\s*/, "").trim();
  const colonIndex = normalized.indexOf(":");
  if (colonIndex < 0) {
    return {
      title: `Tài liệu ${index + 1}`,
      resource: normalized,
    };
  }

  const title =
    normalized.slice(0, colonIndex).trim() || `Tài liệu ${index + 1}`;
  const resource = normalized.slice(colonIndex + 1).trim();
  return {
    title,
    resource,
  };
}

function parseTeachingMaterialsTextToDrafts(
  text: string,
): TeachingMaterialDraft[] {
  const lines = textareaToLines(text);
  if (!lines.length) return [createEmptyTeachingMaterial()];
  return lines.map((line, index) => parseTeachingMaterialLine(line, index));
}

function stringifyTeachingMaterialDrafts(
  items: TeachingMaterialDraft[],
): string {
  return items
    .map((item) => {
      const title = item.title.trim();
      const resource = item.resource.trim();
      if (!title && !resource) return "";
      if (!title) return resource;
      if (!resource) return title;
      return `${title}: ${resource}`;
    })
    .filter(Boolean)
    .join("\n");
}

function extractFirstHttpUrl(text: string): string {
  const match = text.match(/https?:\/\/\S+/i);
  return match?.[0] || "";
}

function removeEmptyDeep(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      const cleaned = removeEmptyDeep(value as Record<string, unknown>);
      if (Object.keys(cleaned).length > 0) result[key] = cleaned;
    } else {
      result[key] = value;
    }
  }
  return result;
}

interface TemplateActivityDraft {
  time: string;
  book: string;
  skills: string;
  classwork: string;
  requiredMaterials: string;
  homeworkRequiredMaterials: string;
  extra: string;
}

function createEmptyTemplateActivity(): TemplateActivityDraft {
  return {
    time: "",
    book: "",
    skills: "",
    classwork: "",
    requiredMaterials: "",
    homeworkRequiredMaterials: "",
    extra: "",
  };
}

function isActivityDraftEmpty(draft: TemplateActivityDraft): boolean {
  return Object.values(draft).every((v) => !v.trim());
}

type TemplateActivityPresetKey =
  | "warmup"
  | "reading"
  | "speaking"
  | "writing"
  | "listening"
  | "review";

const TEMPLATE_ACTIVITY_PRESETS: {
  key: TemplateActivityPresetKey;
  label: string;
}[] = [
  { key: "warmup", label: "Warm Up" },
  { key: "reading", label: "Reading" },
  { key: "speaking", label: "Speaking" },
  { key: "writing", label: "Writing" },
  { key: "listening", label: "Listening" },
  { key: "review", label: "Review" },
];

function createPresetTemplateActivity(
  preset: TemplateActivityPresetKey,
): TemplateActivityDraft {
  const base = createEmptyTemplateActivity();
  switch (preset) {
    case "warmup":
      return {
        ...base,
        time: "5 mins",
        skills: "Warm Up",
        classwork: "WARM UP\nHomework Correction",
      };
    case "reading":
      return { ...base, time: "15 mins", skills: "Reading" };
    case "speaking":
      return { ...base, time: "15 mins", skills: "Speaking" };
    case "writing":
      return { ...base, time: "15 mins", skills: "Writing" };
    case "listening":
      return { ...base, time: "15 mins", skills: "Listening" };
    case "review":
      return { ...base, time: "10 mins", skills: "Review" };
    default:
      return base;
  }
}

function activityDraftsFromUnknown(value: unknown): TemplateActivityDraft[] {
  if (!Array.isArray(value) || value.length === 0)
    return [createEmptyTemplateActivity()];
  return value.map((item) => {
    if (typeof item !== "object" || !item) return createEmptyTemplateActivity();
    const obj = item as Record<string, unknown>;
    return {
      time: typeof obj.time === "string" ? obj.time : "",
      book: typeof obj.book === "string" ? obj.book : "",
      skills: typeof obj.skills === "string" ? obj.skills : "",
      classwork: typeof obj.classwork === "string" ? obj.classwork : "",
      requiredMaterials:
        typeof obj.requiredMaterials === "string" ? obj.requiredMaterials : "",
      homeworkRequiredMaterials:
        typeof obj.homeworkRequiredMaterials === "string"
          ? obj.homeworkRequiredMaterials
          : "",
      extra: typeof obj.extra === "string" ? obj.extra : "",
    };
  });
}

function stringifyPrettyJson(value: unknown): string {
  if (
    !value ||
    (typeof value === "object" && Object.keys(value as object).length === 0)
  )
    return "";
  return JSON.stringify(value, null, 2);
}

function prettifyJsonText(value?: string | null): string {
  const text = value?.trim();
  if (!text) return "";
  const parsed = parseJsonContent(text);
  return parsed ? JSON.stringify(parsed, null, 2) : text;
}

function linesFromUnknown(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((v) => typeof v === "string" && v.trim()).map(String);
  if (typeof value === "string" && value.trim())
    return value.split("\n").filter(Boolean);
  return [];
}

function flattenUnknownToLines(value: unknown, prefix = ""): string[] {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenUnknownToLines(item, prefix));
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, nested]) =>
        flattenUnknownToLines(nested, prefix ? `${prefix}.${key}` : key),
    );
  }

  const text = String(value).trim();
  if (!text) return [];
  return [prefix ? `${prefix}: ${text}` : text];
}

const URL_IN_TEXT_REGEX = /(https?:\/\/[^\s<>"']+)/gi;

function stripTrailingPunctuation(value: string): {
  clean: string;
  trailing: string;
} {
  const clean = value.replace(/[),.;!?]+$/g, "");
  return {
    clean,
    trailing: value.slice(clean.length),
  };
}

function renderLinkifiedText(text: string) {
  const source = text || "";
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  URL_IN_TEXT_REGEX.lastIndex = 0;

  for (const match of source.matchAll(URL_IN_TEXT_REGEX)) {
    const rawUrl = match[0];
    const index = match.index ?? 0;
    const { clean, trailing } = stripTrailingPunctuation(rawUrl);

    if (index > cursor) {
      nodes.push(source.slice(cursor, index));
    }

    nodes.push(
      <a
        key={`url-${index}-${clean}`}
        href={buildFileUrl(clean)}
        target="_blank"
        rel="noreferrer"
        className="my-1 block w-fit max-w-full rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-700 underline underline-offset-2 break-all hover:bg-blue-100 hover:text-blue-900"
      >
        {clean}
      </a>,
    );

    if (trailing) {
      nodes.push(trailing);
    }

    cursor = index + rawUrl.length;
  }

  if (cursor < source.length) {
    nodes.push(source.slice(cursor));
  }

  return nodes.length ? nodes : [source];
}

function getSessionDisplay(
  session: Pick<ClassLessonPlanSyllabusSession, "sessionIndex" | "sessionDate">,
) {
  return `Buổi ${session.sessionIndex}${normalizeDateValue(session.sessionDate) ? ` • ${formatDate(session.sessionDate, true)}` : ""}`;
}

function getModuleSessionDisplayIndex(
  session: Pick<
    ClassLessonPlanSyllabusSession,
    "sessionIndex" | "sessionIndexInModule"
  >,
) {
  return session.sessionIndexInModule ?? session.sessionIndex;
}

function getClassDisplay(syllabus: ClassLessonPlanSyllabus | null) {
  if (!syllabus) return "Chưa chọn lớp";
  return syllabus.classTitle || syllabus.classCode || "Lớp học";
}

type CurriculumTableRow = {
  periods: string;
  topics: string;
  lessons: string;
  contents: string;
  structures: string;
  studentsBook: string;
  teachersBook: string;
};

function normalizeCurriculumTableText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.replace(/\u0000/g, "").trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeCurriculumTableText(item))
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return (
      ["text", "value", "name", "title", "label", "content"]
        .map((key) => normalizeCurriculumTableText(obj[key]))
        .find(Boolean) || ""
    );
  }
  return "";
}

function extractCurriculumRowsFromSyllabusDetail(
  detail?: SyllabusDetail | null,
): CurriculumTableRow[] {
  if (!detail) return [];

  const rowFromSessionTemplate = (item: unknown): CurriculumTableRow | null => {
    if (!item || typeof item !== "object") return null;
    const obj = item as Record<string, unknown>;
    const row: CurriculumTableRow = {
      periods:
        normalizeCurriculumTableText(obj.sessionIndexInModule) ||
        normalizeCurriculumTableText(obj.sessionIndex) ||
        normalizeCurriculumTableText(obj.curriculumSessionIndex),
      topics:
        normalizeCurriculumTableText(obj.unitName) ||
        normalizeCurriculumTableText(obj.sessionTopic) ||
        normalizeCurriculumTableText(obj.topic) ||
        normalizeCurriculumTableText(obj.moduleName),
      lessons:
        normalizeCurriculumTableText(obj.lessonNumber) ||
        normalizeCurriculumTableText(obj.sessionOrder) ||
        normalizeCurriculumTableText(obj.orderIndexInUnit),
      contents:
        normalizeCurriculumTableText(obj.sessionTitle) ||
        normalizeCurriculumTableText(obj.title) ||
        normalizeCurriculumTableText(obj.content),
      structures:
        normalizeCurriculumTableText(obj.structure) ||
        normalizeCurriculumTableText(obj.languageFocus),
      studentsBook:
        normalizeCurriculumTableText(obj.studentBookPage) ||
        normalizeCurriculumTableText(obj.studentsBook),
      teachersBook:
        normalizeCurriculumTableText(obj.teacherBookPage) ||
        normalizeCurriculumTableText(obj.teachersBook),
    };

    const nonEmptyCount = Object.values(row).filter(
      (value) => value.trim().length > 0,
    ).length;
    return nonEmptyCount >= 2 ? row : null;
  };

  const normKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "");
  const pickByAliases = (obj: Record<string, unknown>, aliases: string[]) => {
    const aliasSet = new Set(aliases.map(normKey));
    for (const [key, value] of Object.entries(obj)) {
      if (!aliasSet.has(normKey(key))) continue;
      const text = normalizeCurriculumTableText(value);
      if (text) return text;
    }
    return "";
  };

  const rowFromRawObject = (
    obj: Record<string, unknown>,
  ): CurriculumTableRow | null => {
    const row: CurriculumTableRow = {
      periods: pickByAliases(obj, [
        "periods",
        "period",
        "periodRange",
        "sessionRange",
        "week",
        "time",
      ]),
      topics: pickByAliases(obj, [
        "topics",
        "topic",
        "unit",
        "unitName",
        "sessionTopic",
      ]),
      lessons: pickByAliases(obj, [
        "lessons",
        "lesson",
        "lessonNo",
        "lessonNumber",
        "sessionNo",
        "sessionIndex",
        "sessionOrder",
      ]),
      contents: pickByAliases(obj, [
        "contents",
        "content",
        "objective",
        "objectives",
        "goals",
        "skills",
        "activity",
      ]),
      structures: pickByAliases(obj, [
        "structures",
        "structure",
        "languageFocus",
        "grammar",
        "pattern",
      ]),
      studentsBook: pickByAliases(obj, [
        "studentsBook",
        "studentBook",
        "studentsbook",
        "pupils",
        "pupilBook",
        "wbPage",
        "wbPages",
      ]),
      teachersBook: pickByAliases(obj, [
        "teachersBook",
        "teacherBook",
        "teachersbook",
        "tbPage",
        "tbPages",
        "teacherPage",
      ]),
    };

    const nonEmptyCount = Object.values(row).filter(
      (value) => value.trim().length > 0,
    ).length;
    const hasSignal = Boolean(
      row.periods ||
      row.topics ||
      row.lessons ||
      row.contents ||
      row.structures,
    );
    return nonEmptyCount >= 2 && hasSignal ? row : null;
  };

  const rawRows: CurriculumTableRow[] = [];
  const rawParsed = parseJsonContent(detail.rawContentJson);
  if (rawParsed && typeof rawParsed === "object") {
    const visited = new WeakSet<object>();
    const walk = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      if (visited.has(node as object)) return;
      visited.add(node as object);

      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }

      const obj = node as Record<string, unknown>;
      const row = rowFromRawObject(obj);
      if (row) rawRows.push(row);
      Object.values(obj).forEach(walk);
    };
    walk(rawParsed);
  }

  const sessionTemplateRows = Array.isArray(detail.sessionTemplates)
    ? detail.sessionTemplates
        .map((item) => rowFromSessionTemplate(item))
        .filter((row): row is CurriculumTableRow => row != null)
    : [];

  const source = rawRows.length > 0 ? rawRows : sessionTemplateRows;
  const seen = new Set<string>();
  return source
    .filter((row) => {
      const signature = [
        row.periods,
        row.topics,
        row.lessons,
        row.contents,
        row.structures,
        row.studentsBook,
        row.teachersBook,
      ]
        .map((value) => value.replace(/\s+/g, " ").trim())
        .join("|");
      if (!signature || seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .slice(0, 400);
}

function getTemplateStats(templates: LessonPlanTemplate[]) {
  return [
    {
      title: "Tổng template",
      value: String(templates.length),
      subtitle: "Syllabus chuẩn theo program",
      icon: FolderOpen,
      color: "from-red-600 to-red-700",
    },
    {
      title: "Đang hoạt động",
      value: String(
        templates.filter((item) => getTemplateStatus(item) === "active").length,
      ),
      subtitle: "Sẵn sàng áp dụng",
      icon: CheckCircle2,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Có file đính kèm",
      value: String(templates.filter((item) => item.attachment).length),
      subtitle: "Có attachment tham chiếu",
      icon: Paperclip,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Lượt áp dụng",
      value: String(
        templates.reduce((sum, item) => sum + (item.usedCount || 0), 0),
      ),
      subtitle: "Số lần gắn vào giáo án",
      icon: ShieldCheck,
      color: "from-amber-500 to-orange-500",
    },
  ];
}

function getPlanStats(
  syllabus: ClassLessonPlanSyllabus | null,
  sessionSource?: ClassLessonPlanSyllabusSession[],
) {
  const sessions = sessionSource ?? syllabus?.sessions ?? [];

  return [
    {
      title: "Tổng session",
      value: String(sessions.length),
      subtitle: getClassDisplay(syllabus),
      icon: CalendarDays,
      color: "from-red-600 to-red-700",
    },
    {
      title: "Đã có giáo án",
      value: String(sessions.filter((item) => item.lessonPlanId).length),
      subtitle: "Session đã được tạo bản ghi",
      icon: FileText,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Có thể chỉnh sửa",
      value: String(sessions.filter((item) => item.canEdit).length),
      subtitle: "Theo quyền hiện tại",
      icon: Pencil,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Đã báo cáo",
      value: String(sessions.filter((item) => item.actualContent).length),
      subtitle: "Giáo viên đã báo cáo nội dung dạy",
      icon: ClipboardPen,
      color: "from-violet-500 to-purple-500",
    },
  ];
}

function getSyllabusSummaryItems(
  syllabus: ClassLessonPlanSyllabus | null,
  sessionSource?: ClassLessonPlanSyllabusSession[],
) {
  const sessions = sessionSource ?? syllabus?.sessions ?? [];

  return [
    {
      label: "Lớp",
      value: syllabus?.classTitle || syllabus?.classCode || "Chưa chọn",
    },
    { label: "Chương trình", value: syllabus?.programName || "-" },
    { label: "Thông tin syllabus", value: syllabus?.syllabusMetadata || "-" },
    { label: "Tổng buổi", value: sessions.length },
    {
      label: "Đã có giáo án",
      value: sessions.filter((item) => item.lessonPlanId).length,
    },
    {
      label: "Đã báo cáo",
      value: sessions.filter((item) => item.actualContent).length,
    },
  ];
}

function getTemplateModuleSessionOrder(
  template: Pick<
    LessonPlanTemplate,
    | "sessionOrder"
    | "sessionIndex"
    | "lessonOrderIndexInUnit"
    | "orderIndexInUnit"
  >,
): number | null {
  const candidates = [
    template.sessionOrder,
    template.sessionIndex,
    template.lessonOrderIndexInUnit,
    template.orderIndexInUnit != null ? template.orderIndexInUnit + 1 : null,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
}

export function LessonPlanWorkspace({
  scope,
  presentation = "workspace",
  forcedTab = null,
}: {
  scope: WorkspaceScope;
  presentation?: WorkspacePresentation;
  forcedTab?: WorkspaceLockedTab;
}) {
  const searchParams = useSearchParams();
  const requestedProgramId = searchParams?.get("programId")?.trim() || "";
  const requestedSyllabusId = searchParams?.get("syllabusId")?.trim() || "";
  const requestedModuleId = searchParams?.get("moduleId")?.trim() || "";
  const requestedClassId = searchParams?.get("classId")?.trim() || "";
  const requestedSessionId = searchParams?.get("sessionId")?.trim() || "";
  const defaultTab: ActiveTab =
    forcedTab ?? (scope === "teacher" ? "plans" : "templates");
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    defaultTab,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [templates, setTemplates] = useState<LessonPlanTemplate[]>([]);
  const [classSyllabus, setClassSyllabus] =
    useState<ClassLessonPlanSyllabus | null>(null);
  const [classDetail, setClassDetail] = useState<ClassApiDetail | null>(null);
  const [programOptions, setProgramOptions] = useState<Option[]>([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [syllabusOptions, setSyllabusOptions] = useState<SyllabusListItem[]>(
    [],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [templateStatusFilter, setTemplateStatusFilter] =
    useState<TemplateStatusFilter>("all");
  const [planStatusFilter, setPlanStatusFilter] =
    useState<PlanStatusFilter>("all");
  const [selectedProgramId, setSelectedProgramId] = useState(
    requestedProgramId || "all",
  );
  const [selectedSyllabusId, setSelectedSyllabusId] = useState(
    requestedSyllabusId || "all",
  );
  const [selectedModuleId, setSelectedModuleId] = useState(
    requestedModuleId || "all",
  );
  const [selectedClassId, setSelectedClassId] = useState(requestedClassId);

  const [templateModal, setTemplateModal] = useState<TemplateModalState>(null);
  const [planModal, setPlanModal] = useState<PlanModalState>(null);
  const [detailState, setDetailState] = useState<DetailState>(null);
  const [sessionDetailId, setSessionDetailId] = useState<string | null>(null);
  const [focusedSyllabusDetail, setFocusedSyllabusDetail] =
    useState<SyllabusDetail | null>(null);
  const [focusedSyllabusLoading, setFocusedSyllabusLoading] = useState(false);
  const [focusedSyllabusError, setFocusedSyllabusError] = useState<
    string | null
  >(null);
  const scopeCopy = COPY[scope];
  const isTeacher = scope === "teacher";
  const isSessionPage = presentation === "session-page";
  const templatesAvailable = !isTeacher;
  const { selectedBranchId, isLoaded: branchFilterLoaded } = useBranchFilter();
  const headerCopy =
    scope === "admin" && forcedTab === "templates"
      ? {
          title: "Mẫu giáo án chuẩn",
          subtitle:
            "Quản lý template chuẩn theo syllabus để tái sử dụng thống nhất trên toàn hệ thống.",
          planSubtitle: scopeCopy.planSubtitle,
        }
      : scope === "admin" && forcedTab === "plans"
        ? {
            title: "Giáo án lớp",
            subtitle:
              "Theo dõi và rà soát giáo án vận hành theo lớp, buổi học và tình trạng báo cáo.",
            planSubtitle: scopeCopy.planSubtitle,
          }
        : scopeCopy;

  const templateMap = useMemo(() => {
    return new Map(templates.map((item) => [item.id, item]));
  }, [templates]);

  const syllabusMap = useMemo(() => {
    return new Map(syllabusOptions.map((item) => [item.id, item]));
  }, [syllabusOptions]);

  const filteredSyllabusOptions = useMemo(() => {
    if (selectedProgramId === "all") {
      return syllabusOptions;
    }
    return syllabusOptions.filter(
      (item) => item.programId === selectedProgramId,
    );
  }, [selectedProgramId, syllabusOptions]);

  const filteredModuleOptions = useMemo(() => {
    if (selectedSyllabusId === "all") {
      return [] as Option[];
    }

    const moduleMap = new Map<string, Option>();

    for (const item of templates) {
      const moduleId = item.moduleId?.trim();
      if (!moduleId) continue;
      if (item.syllabusId !== selectedSyllabusId) continue;
      if (selectedProgramId !== "all" && item.programId !== selectedProgramId) {
        continue;
      }
      if (moduleMap.has(moduleId)) continue;

      const moduleName =
        item.moduleName?.trim() || item.moduleCode?.trim() || "Chưa rõ module";
      const hint = [
        item.moduleCode &&
        item.moduleName &&
        item.moduleCode !== item.moduleName
          ? item.moduleCode
          : null,
        item.syllabusCode && item.syllabusVersion
          ? `${item.syllabusCode} ${item.syllabusVersion}`
          : item.syllabusTitle,
      ]
        .filter((value): value is string => Boolean(value && value.trim()))
        .join(" • ");

      moduleMap.set(moduleId, {
        id: moduleId,
        label: moduleName,
        hint: hint || undefined,
      });
    }

    return Array.from(moduleMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "vi"),
    );
  }, [selectedProgramId, selectedSyllabusId, templates]);

  const effectiveSelectedModuleId = useMemo(() => {
    if (selectedSyllabusId === "all") {
      return "all";
    }

    return filteredModuleOptions.some((item) => item.id === selectedModuleId)
      ? selectedModuleId
      : "all";
  }, [filteredModuleOptions, selectedModuleId, selectedSyllabusId]);

  const handleSyllabusFilterChange = useCallback((nextSyllabusId: string) => {
    setSelectedSyllabusId(nextSyllabusId);
    setSelectedModuleId("all");
  }, []);

  const sharedProgramTemplate = useMemo(
    () => pickSharedProgramTemplate(templates, classSyllabus?.programId),
    [classSyllabus?.programId, templates],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveTab(defaultTab);
    }, 0);
    return () => clearTimeout(timer);
  }, [defaultTab]);

  useEffect(() => {
    if (requestedProgramId && requestedProgramId !== selectedProgramId) {
      setSelectedProgramId(requestedProgramId);
    }
  }, [requestedProgramId, selectedProgramId]);

  useEffect(() => {
    if (!requestedSyllabusId) return;
    if (!syllabusOptions.some((item) => item.id === requestedSyllabusId))
      return;
    if (requestedSyllabusId !== selectedSyllabusId) {
      setSelectedSyllabusId(requestedSyllabusId);
    }
  }, [requestedSyllabusId, selectedSyllabusId, syllabusOptions]);

  useEffect(() => {
    if (!requestedClassId) return;
    if (!classOptions.some((item) => item.id === requestedClassId)) return;
    if (requestedClassId !== selectedClassId) {
      setSelectedClassId(requestedClassId);
    }
  }, [classOptions, requestedClassId, selectedClassId]);

  useEffect(() => {
    if (selectedSyllabusId === "all") return;
    const syllabus = syllabusMap.get(selectedSyllabusId);
    if (!syllabus) return;
    if (selectedProgramId !== syllabus.programId) {
      setSelectedProgramId(syllabus.programId);
    }
  }, [selectedProgramId, selectedSyllabusId, syllabusMap]);

  useEffect(() => {
    if (selectedSyllabusId === "all") return;
    const syllabus = syllabusMap.get(selectedSyllabusId);
    if (!syllabus) {
      setSelectedSyllabusId("all");
      return;
    }
    if (
      selectedProgramId !== "all" &&
      syllabus.programId !== selectedProgramId
    ) {
      setSelectedSyllabusId("all");
    }
  }, [selectedProgramId, selectedSyllabusId, syllabusMap]);

  const loadPrograms = async () => {
    if (!templatesAvailable) {
      setProgramOptions([]);
      return;
    }

    const items = await getAllProgramsForDropdown();
    setProgramOptions(
      items
        .filter((item) => item.id && item.name)
        .map((item) => ({
          id: item.id,
          label: item.name,
          hint: item.code || undefined,
        })),
    );
  };

  const loadClasses = async () => {
    if (isTeacher) {
      const response = await getTeacherClasses({
        pageNumber: 1,
        pageSize: 100,
      });
      const responseData = response?.data as
        | { classes?: { items?: ClassOptionSource[] } | ClassOptionSource[] }
        | undefined;
      const source = Array.isArray(response?.data?.classes?.items)
        ? response.data.classes.items
        : Array.isArray(responseData?.classes)
          ? responseData.classes
          : [];

      const options = source
        .map(buildClassOption)
        .filter((item: Option) => item.id);
      setClassOptions(options);
      return;
    }

    const response = await getAllClasses({ pageNumber: 1, pageSize: 100 });
    const source = Array.isArray(response?.data?.classes?.items)
      ? response.data.classes.items
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.data?.classes)
          ? response.data.classes
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

    const options = source
      .map(buildClassOption)
      .filter((item: Option) => item.id);
    setClassOptions(options);
  };

  const loadTemplates = async () => {
    if (!templatesAvailable) {
      setTemplates([]);
      return;
    }

    let allowedBranchSyllabusIds: Set<string> | null = null;
    if (selectedBranchId) {
      const branchAssignmentsResponse = await getBranchSyllabusAssignments(selectedBranchId);
      if (!branchAssignmentsResponse.isSuccess) {
        throw new Error(
          extractMessage(branchAssignmentsResponse, "Không thể tải assignment syllabus theo chi nhánh."),
        );
      }

      allowedBranchSyllabusIds = new Set(
        branchAssignmentsResponse.data
          .filter((item) => item.isActive)
          .map((item) => item.syllabusId)
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0),
      );

      if (allowedBranchSyllabusIds.size === 0) {
        setSyllabusOptions([]);
        setTemplates([]);
        return;
      }
    }

    const shouldIncludeSyllabusId = (syllabusId?: string | null) => {
      const normalized = (syllabusId || "").trim();
      if (!normalized) return false;
      if (!allowedBranchSyllabusIds) return true;
      return allowedBranchSyllabusIds.has(normalized);
    };

    const response = await getAllLessonPlanTemplates({
      pageNumber: 1,
      pageSize: 200,
    });
    if (!response.isSuccess) {
      throw new Error(
        extractMessage(response, "Không thể tải danh sách template."),
      );
    }

    const legacyItems = response.data.templates.items;
    let syllabusCatalog: SyllabusListItem[] = [];
    const syllabusIdSet = new Set(
      legacyItems
        .map((item) => item.syllabusId)
        .filter((id): id is string => shouldIncludeSyllabusId(id)),
    );

    const legacyLooksIncomplete =
      legacyItems.length > 0 &&
      (response.data.templates.totalCount > legacyItems.length ||
        legacyItems.some(
          (item) =>
            typeof item.syllabusId !== "string" ||
            item.syllabusId.trim().length === 0,
        ));

    const syllabusResponse = await getSyllabuses({
      pageNumber: 1,
      pageSize: 200,
    });

    if (syllabusResponse.isSuccess) {
      const visibleSyllabuses = allowedBranchSyllabusIds
        ? syllabusResponse.data.items.filter((item) => allowedBranchSyllabusIds.has(item.id))
        : syllabusResponse.data.items;
      syllabusCatalog = visibleSyllabuses;
      setSyllabusOptions(visibleSyllabuses);
      for (const syllabus of visibleSyllabuses) {
        if (syllabus.id) {
          syllabusIdSet.add(syllabus.id);
        }
      }
    } else if (legacyLooksIncomplete) {
      throw new Error(
        extractMessage(syllabusResponse, "Không thể tải danh sách syllabus."),
      );
    } else if (allowedBranchSyllabusIds) {
      setSyllabusOptions([]);
    }

    if (selectedSyllabusId !== "all" && shouldIncludeSyllabusId(selectedSyllabusId)) {
      syllabusIdSet.add(selectedSyllabusId);
    }
    if (requestedSyllabusId && shouldIncludeSyllabusId(requestedSyllabusId)) {
      syllabusIdSet.add(requestedSyllabusId);
    }

    const syllabusMetaMap = new Map(
      (syllabusCatalog.length ? syllabusCatalog : syllabusOptions).map(
        (item) => [item.id, item],
      ),
    );

    const syllabusIds = Array.from(syllabusIdSet);

    if (syllabusIds.length === 0) {
      setTemplates(legacyItems);
      return;
    }

    const unitPlanResults = await Promise.all(
      syllabusIds.map(async (syllabusId) => {
        const unitRes = await getUnitLessonPlans(syllabusId);
        return unitRes.isSuccess && unitRes.data
          ? { syllabusId, data: unitRes.data }
          : null;
      }),
    );

    const flattened: LessonPlanTemplate[] = [];
    const resolvedSyllabusIds = new Set<string>();
    for (const result of unitPlanResults) {
      if (!result) continue;

      const { syllabusId, data } = result;
      const syllabusMeta = syllabusMetaMap.get(syllabusId);
      resolvedSyllabusIds.add(syllabusId);
      for (const [moduleIndex, moduleGroup] of (data.groups ?? []).entries()) {
        for (const [unitIndex, unitGroup] of (
          moduleGroup.units ?? []
        ).entries()) {
          for (const [lessonIndex, lesson] of (
            unitGroup.lessons ?? []
          ).entries()) {
            // Trust the nested API hierarchy first; item-level module/unit fields can lag behind.
            flattened.push({
              id: lesson.lessonPlanTemplateId,
              syllabusId,
              syllabusCode: syllabusMeta?.code ?? null,
              syllabusVersion: syllabusMeta?.version ?? null,
              syllabusTitle: syllabusMeta?.title ?? null,
              programId: data.programId,
              programName: data.programName ?? undefined,
              levelId: data.levelId,
              levelName: data.levelName ?? undefined,
              title: lesson.title ?? lesson.sessionTitle ?? "Untitled Lesson",
              sessionIndex: lesson.sessionIndex ?? lesson.sessionOrder ?? 0,
              moduleId: moduleGroup.moduleId ?? lesson.moduleId,
              moduleCode: moduleGroup.moduleCode,
              moduleName: moduleGroup.moduleName,
              moduleOrderIndex:
                moduleGroup.moduleOrderIndex ??
                moduleGroup.moduleOrder ??
                lesson.moduleOrderIndex ??
                moduleIndex,
              lessonPlanUnitId:
                unitGroup.unitId ??
                lesson.unitId ??
                lesson.lessonPlanUnitId ??
                null,
              lessonPlanUnitName:
                unitGroup.unitName ||
                [unitGroup.unitNumber, unitGroup.unitTitle]
                  .filter((part) => typeof part === "string" && part.trim())
                  .join(": "),
              unitOrderIndex:
                unitGroup.unitOrderIndex ??
                unitGroup.orderIndex ??
                lesson.unitOrderIndex ??
                unitIndex,
              unitNumber: lesson.unitNumber ?? unitGroup.unitNumber ?? null,
              unitTitle: lesson.unitTitle ?? unitGroup.unitTitle ?? null,
              orderIndexInUnit:
                lesson.lessonOrderIndexInUnit ??
                lesson.orderIndexInUnit ??
                lessonIndex,
              lessonOrderIndexInUnit:
                lesson.lessonOrderIndexInUnit ??
                lesson.orderIndexInUnit ??
                lessonIndex,
              sessionOrder: lesson.sessionOrder ?? null,
              sourceFileName: lesson.sourceFileName ?? null,
              isActive: lesson.isActive,
              createdAt: lesson.createdAt,
              updatedAt: lesson.updatedAt,
            });
          }
        }
      }

      for (const lesson of data.orphanLessons ?? []) {
        flattened.push({
          id: lesson.lessonPlanTemplateId,
          syllabusId,
          syllabusCode: syllabusMeta?.code ?? null,
          syllabusVersion: syllabusMeta?.version ?? null,
          syllabusTitle: syllabusMeta?.title ?? null,
          programId: data.programId,
          programName: data.programName ?? undefined,
          levelId: data.levelId,
          levelName: data.levelName ?? undefined,
          title: lesson.title ?? lesson.sessionTitle ?? "Untitled Lesson",
          sessionIndex: lesson.sessionIndex ?? lesson.sessionOrder ?? 0,
          moduleId: lesson.moduleId ?? null,
          moduleName: null,
          moduleOrderIndex: lesson.moduleOrderIndex ?? null,
          lessonPlanUnitId: null,
          lessonPlanUnitName: null,
          unitOrderIndex: null,
          unitNumber: null,
          unitTitle: null,
          orderIndexInUnit:
            lesson.lessonOrderIndexInUnit ?? lesson.orderIndexInUnit ?? null,
          lessonOrderIndexInUnit:
            lesson.lessonOrderIndexInUnit ?? lesson.orderIndexInUnit ?? null,
          sessionOrder: lesson.sessionOrder ?? null,
          sourceFileName: lesson.sourceFileName ?? null,
          isActive: lesson.isActive,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
        });
      }
    }

    const legacyById = new Map(
      legacyItems
        .filter((item) => item.id)
        .map((item) => [item.id, item] as const),
    );
    const merged = new Map<string, LessonPlanTemplate>();
    for (const item of flattened) {
      if (item.id) {
        merged.set(
          item.id,
          mergeTemplateWithContentFallback(item, legacyById.get(item.id)),
        );
      }
    }

    for (const item of legacyItems) {
      if (item.id && merged.has(item.id)) {
        merged.set(
          item.id,
          mergeTemplateWithContentFallback(merged.get(item.id)!, item),
        );
        continue;
      }

      const legacySyllabusMeta = item.syllabusId
        ? syllabusMetaMap.get(item.syllabusId)
        : undefined;
      const legacySyllabusId = item.syllabusId?.trim();
      const shouldKeepLegacy =
        !legacySyllabusId || !resolvedSyllabusIds.has(legacySyllabusId);
      if (shouldKeepLegacy && item.id && !merged.has(item.id)) {
        merged.set(item.id, {
          ...item,
          syllabusCode: item.syllabusCode ?? legacySyllabusMeta?.code ?? null,
          syllabusVersion:
            item.syllabusVersion ?? legacySyllabusMeta?.version ?? null,
          syllabusTitle:
            item.syllabusTitle ?? legacySyllabusMeta?.title ?? null,
        });
      }
    }

    const finalTemplates = merged.size > 0 ? Array.from(merged.values()) : legacyItems;
    const visibleTemplates = allowedBranchSyllabusIds
      ? finalTemplates.filter((item) => shouldIncludeSyllabusId(item.syllabusId))
      : finalTemplates;
    setTemplates(visibleTemplates);
  };

  const loadClassSyllabus = async (classId: string) => {
    if (!classId) {
      setClassSyllabus(null);
      setClassDetail(null);
      return;
    }

    const [response, classDetailResult] = await Promise.all([
      getClassLessonPlanSyllabus(classId),
      getClassById(classId)
        .then((result) =>
          result?.isSuccess !== false && result?.success !== false
            ? result.data ?? null
            : null,
        )
        .catch(() => null),
    ]);

    if (!response.isSuccess) {
      throw new Error(
        extractMessage(response, "Không thể tải syllabus của lớp."),
      );
    }

    setClassDetail(classDetailResult);
    setClassSyllabus(response.data);

  };

  const refreshWorkspace = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    const tasks: Promise<void>[] = [loadClasses()];
    if (templatesAvailable) {
      tasks.push(loadPrograms(), loadTemplates());
    }

    const results = await Promise.allSettled(tasks);
    const rejected = results.find((item) => item.status === "rejected") as
      | PromiseRejectedResult
      | undefined;

    if (rejected) {
      toast({
        title: "Không thể tải dữ liệu",
        description:
          rejected.reason?.message ||
          "Đã xảy ra lỗi khi đồng bộ dữ liệu giáo án.",
        variant: "destructive",
      });
    }

    setLoading(false);
    setRefreshing(false);
    setIsLoaded(true);
  };

  const refreshWorkspaceRef = useRef(refreshWorkspace);
  const autoOpenedSessionDetailRef = useRef("");
  const warnedMissingSessionRef = useRef("");

  useEffect(() => {
    refreshWorkspaceRef.current = refreshWorkspace;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshWorkspaceRef.current();
    }, 0);
    return () => clearTimeout(timer);
  }, [scope]);

  useEffect(() => {
    if (!templatesAvailable) return;
    if (!branchFilterLoaded) return;

    const timer = setTimeout(() => {
      void refreshWorkspaceRef.current(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [branchFilterLoaded, selectedBranchId, templatesAvailable]);

  useEffect(() => {
    if (!classOptions.length) {
      return;
    }

    const exists = classOptions.some((item) => item.id === selectedClassId);
    if (!selectedClassId || !exists) {
      const timer = setTimeout(() => {
        setSelectedClassId(classOptions[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [classOptions, selectedClassId]);

  useEffect(() => {
    if ((isTeacher || activeTab === "plans") && selectedClassId) {
      const loadingTimer = setTimeout(() => {
        setLoading(true);
      }, 0);
      const requestTimer = setTimeout(() => {
        void loadClassSyllabus(selectedClassId)
          .catch((error: unknown) => {
            setClassSyllabus(null);
            toast({
              title: "Không thể tải syllabus",
              description: toErrorMessage(error, "Vui lòng thử lại sau."),
              variant: "destructive",
            });
          })
          .finally(() => {
            setLoading(false);
            setRefreshing(false);
            setIsLoaded(true);
          });
      }, 0);

      return () => {
        clearTimeout(loadingTimer);
        clearTimeout(requestTimer);
      };
    }
  }, [activeTab, isTeacher, selectedClassId]);

  const filteredTemplates = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return templates
      .filter((item) => {
        if (
          selectedProgramId !== "all" &&
          item.programId !== selectedProgramId
        ) {
          return false;
        }

        if (
          selectedSyllabusId !== "all" &&
          item.syllabusId !== selectedSyllabusId
        ) {
          return false;
        }

        if (
          effectiveSelectedModuleId !== "all" &&
          item.moduleId !== effectiveSelectedModuleId
        ) {
          return false;
        }

        if (
          templateStatusFilter === "active" &&
          getTemplateStatus(item) !== "active"
        ) {
          return false;
        }

        if (
          templateStatusFilter === "inactive" &&
          getTemplateStatus(item) !== "inactive"
        ) {
          return false;
        }

        if (templateStatusFilter === "withAttachment" && !item.attachment) {
          return false;
        }

        if (!keyword) return true;

        return [
          item.title,
          item.programName,
          item.level,
          item.sessionIndex?.toString(),
          item.createdByName,
          item.sourceFileName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      })
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [
    effectiveSelectedModuleId,
    searchQuery,
    selectedProgramId,
    selectedSyllabusId,
    templateStatusFilter,
    templates,
  ]);

  const templateStatsSource = useMemo(() => {
    return templates.filter((item) => {
      if (selectedProgramId !== "all" && item.programId !== selectedProgramId) {
        return false;
      }
      if (
        selectedSyllabusId !== "all" &&
        item.syllabusId !== selectedSyllabusId
      ) {
        return false;
      }
      if (
        effectiveSelectedModuleId !== "all" &&
        item.moduleId !== effectiveSelectedModuleId
      ) {
        return false;
      }
      if (
        templateStatusFilter === "active" &&
        getTemplateStatus(item) !== "active"
      ) {
        return false;
      }
      if (
        templateStatusFilter === "inactive" &&
        getTemplateStatus(item) !== "inactive"
      ) {
        return false;
      }
      if (templateStatusFilter === "withAttachment" && !item.attachment) {
        return false;
      }
      return true;
    });
  }, [
    effectiveSelectedModuleId,
    selectedProgramId,
    selectedSyllabusId,
    templateStatusFilter,
    templates,
  ]);

  const planTargetSyllabusId = useMemo(() => {
    if (selectedSyllabusId !== "all") return selectedSyllabusId;
    return requestedSyllabusId || classDetail?.syllabusId || classSyllabus?.syllabusId || "";
  }, [
    classDetail?.syllabusId,
    classSyllabus?.syllabusId,
    requestedSyllabusId,
    selectedSyllabusId,
  ]);

  const planTargetModuleId = useMemo(() => {
    if (effectiveSelectedModuleId !== "all") return effectiveSelectedModuleId;
    if (requestedModuleId) return requestedModuleId;

    const activeModule = classDetail?.moduleProgresses?.find(
      (item) => item.status?.toLowerCase() === "active",
    );
    if (classDetail?.currentModuleId) return classDetail.currentModuleId;
    if (activeModule?.moduleId) return activeModule.moduleId;
    if (classDetail?.startModuleId) return classDetail.startModuleId;

    const moduleIds = new Set(
      (classSyllabus?.sessions ?? [])
        .map((session) => session.moduleId?.trim())
        .filter((value): value is string => Boolean(value)),
    );

    return moduleIds.size === 1 ? Array.from(moduleIds)[0] : "";
  }, [
    classDetail?.currentModuleId,
    classDetail?.moduleProgresses,
    classDetail?.startModuleId,
    classSyllabus?.sessions,
    effectiveSelectedModuleId,
    requestedModuleId,
  ]);

  const planTargetModuleProgress = useMemo(() => {
    if (!planTargetModuleId) return null;
    return (
      classDetail?.moduleProgresses?.find(
        (item) => item.moduleId === planTargetModuleId,
      ) ?? null
    );
  }, [classDetail?.moduleProgresses, planTargetModuleId]);

  const planModuleTemplates = useMemo(() => {
    if (!planTargetModuleId) return [] as LessonPlanTemplate[];

    return templates
      .filter((template) => {
        if (template.moduleId !== planTargetModuleId) return false;
        if (planTargetSyllabusId && template.syllabusId !== planTargetSyllabusId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aOrder = getTemplateModuleSessionOrder(a) ?? a.sessionIndex ?? 0;
        const bOrder = getTemplateModuleSessionOrder(b) ?? b.sessionIndex ?? 0;
        return aOrder - bOrder;
      });
  }, [planTargetModuleId, planTargetSyllabusId, templates]);

  const planModuleSessionOrders = useMemo(() => {
    const orders = planModuleTemplates
      .map(getTemplateModuleSessionOrder)
      .filter((value): value is number => value != null);

    return new Set(orders);
  }, [planModuleTemplates]);

  const planBaseSessions = useMemo(() => {
    const sessions = classSyllabus?.sessions ?? [];
    if (!sessions.length) return [];

    const sortBySchedule = (
      items: ClassLessonPlanSyllabusSession[],
    ): ClassLessonPlanSyllabusSession[] =>
      [...items].sort((a, b) => {
        const aTime = normalizeDateValue(a.sessionDate)
          ? new Date(a.sessionDate!).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bTime = normalizeDateValue(b.sessionDate)
          ? new Date(b.sessionDate!).getTime()
          : Number.MAX_SAFE_INTEGER;
        if (aTime !== bTime) return aTime - bTime;
        return a.sessionIndex - b.sessionIndex;
      });

    const sortByModuleOrder = (
      items: ClassLessonPlanSyllabusSession[],
    ): ClassLessonPlanSyllabusSession[] =>
      [...items].sort((a, b) => {
        const aOrder = getModuleSessionDisplayIndex(a);
        const bOrder = getModuleSessionDisplayIndex(b);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.sessionIndex - b.sessionIndex;
      });

    const templateBySessionOrder = new Map<number, LessonPlanTemplate>();
    for (const template of planModuleTemplates) {
      const sessionOrder = getTemplateModuleSessionOrder(template);
      if (sessionOrder == null || templateBySessionOrder.has(sessionOrder)) {
        continue;
      }
      templateBySessionOrder.set(sessionOrder, template);
    }

    const enrichSessionWithModuleTemplate = (
      session: ClassLessonPlanSyllabusSession,
      inferredSessionOrder?: number,
    ): ClassLessonPlanSyllabusSession => {
      const sessionOrder =
        inferredSessionOrder ?? session.sessionIndexInModule ?? session.sessionIndex;
      const template = templateBySessionOrder.get(sessionOrder);
      const moduleProgress = planTargetModuleProgress;
      if (!template && !planTargetModuleId) return session;

      return {
        ...session,
        syllabusId: session.syllabusId ?? template?.syllabusId ?? planTargetSyllabusId ?? classDetail?.syllabusId ?? null,
        syllabusCode: session.syllabusCode ?? template?.syllabusCode ?? classDetail?.syllabusCode ?? null,
        syllabusVersion: session.syllabusVersion ?? template?.syllabusVersion ?? classDetail?.syllabusVersion ?? null,
        syllabusTitle: session.syllabusTitle ?? template?.syllabusTitle ?? classDetail?.syllabusTitle ?? null,
        moduleId: session.moduleId ?? template?.moduleId ?? planTargetModuleId ?? null,
        moduleCode: session.moduleCode ?? template?.moduleCode ?? null,
        moduleName:
          session.moduleName ??
          template?.moduleName ??
          moduleProgress?.moduleName ??
          classDetail?.currentModuleName ??
          classDetail?.startModuleName ??
          null,
        sessionIndexInModule: sessionOrder,
        templateId: session.templateId ?? template?.id ?? null,
        templateTitle: session.templateTitle ?? template?.title ?? null,
        templateSyllabusContent:
          session.templateSyllabusContent ?? template?.syllabusContent ?? null,
        plannedContent: session.plannedContent ?? template?.syllabusContent ?? null,
      };
    };

    if (planTargetModuleId) {
      const moduleSessionLimit =
        planModuleSessionOrders.size ||
        planTargetModuleProgress?.requiredSessions ||
        classDetail?.totalSessions ||
        0;

      const explicitModuleSessions = sessions
        .filter((session) => {
          const sessionOrder =
            session.moduleId === planTargetModuleId
              ? session.sessionIndexInModule ?? session.sessionIndex
              : session.sessionIndex;
          if (session.moduleId === planTargetModuleId) {
            return planModuleSessionOrders.size
              ? planModuleSessionOrders.has(sessionOrder)
              : true;
          }

          if (!planModuleSessionOrders.has(sessionOrder)) return false;
          if (
            planTargetSyllabusId &&
            session.syllabusId &&
            session.syllabusId !== planTargetSyllabusId
          ) {
            return false;
          }

          return !session.moduleId;
        });

      const sourceSessions = explicitModuleSessions.length
        ? explicitModuleSessions
        : moduleSessionLimit > 0
          ? sortBySchedule(sessions).slice(0, moduleSessionLimit)
          : [];

      const moduleSessions = sortBySchedule(sourceSessions)
        .slice(0, moduleSessionLimit || undefined)
        .map((session, index) =>
          enrichSessionWithModuleTemplate(session, index + 1),
        );

      if (moduleSessions.length) {
        return sortByModuleOrder(moduleSessions);
      }
    }

    const linkedSessions = sessions.filter(hasSessionTemplateLinkage);
    return linkedSessions.length ? sortByModuleOrder(linkedSessions) : sessions;
  }, [
    classDetail?.currentModuleName,
    classDetail?.startModuleName,
    classDetail?.syllabusCode,
    classDetail?.syllabusId,
    classDetail?.syllabusTitle,
    classDetail?.syllabusVersion,
    classDetail?.totalSessions,
    classSyllabus?.sessions,
    planModuleTemplates,
    planModuleSessionOrders,
    planTargetModuleId,
    planTargetModuleProgress,
    planTargetSyllabusId,
  ]);

  const filteredSessions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const sessions = planBaseSessions;

    return sessions.filter((item) => {
      if (planStatusFilter === "editable" && !item.canEdit) {
        return false;
      }

      if (planStatusFilter === "hasPlan" && !item.lessonPlanId) {
        return false;
      }

      if (planStatusFilter === "missingPlan" && item.lessonPlanId) {
        return false;
      }

      if (
        planStatusFilter === "withTemplate" &&
        !item.templateId &&
        !item.templateSyllabusContent &&
        !sharedProgramTemplate?.id
      ) {
        return false;
      }

      if (planStatusFilter === "reported" && !item.actualContent) {
        return false;
      }

      if (planStatusFilter === "notReported" && item.actualContent) {
        return false;
      }

      if (!keyword) return true;

      return [
        item.sessionIndex?.toString(),
        item.templateTitle,
        item.plannedTeacherName,
        item.actualTeacherName,
        item.actualContent,
        item.actualHomework,
        item.teacherNotes,
        item.plannedContent,
        item.templateSyllabusContent,
        formatDate(item.sessionDate, true, ""),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [planBaseSessions, planStatusFilter, searchQuery, sharedProgramTemplate?.id]);

  useEffect(() => {
    if (!sessionDetailId) return;
    if (filteredSessions.some((session) => session.sessionId === sessionDetailId)) {
      return;
    }
    setSessionDetailId(null);
  }, [filteredSessions, sessionDetailId]);

  const stats = useMemo(() => {
    return activeTab === "templates" && templatesAvailable
      ? getTemplateStats(templateStatsSource)
      : getPlanStats(classSyllabus, planBaseSessions);
  }, [
    activeTab,
    classSyllabus,
    planBaseSessions,
    templateStatsSource,
    templatesAvailable,
  ]);

  const openAttachment = (url?: string | null) => {
    const resolvedUrl = resolveAttachmentUrl(url);
    if (!resolvedUrl || typeof window === "undefined") return;
    window.open(resolvedUrl, "_blank", "noopener,noreferrer");
  };

  const openTemplateDetail = async (templateId: string) => {
    setDetailState({ type: "template", loading: true, item: null });

    const response = await getLessonPlanTemplateById(templateId);
    if (!response.isSuccess || !response.data) {
      setDetailState({
        type: "template",
        loading: false,
        item: null,
        error: extractMessage(response, "Không thể tải chi tiết template."),
      });
      return;
    }

    setDetailState({ type: "template", loading: false, item: response.data });
  };

  const getTeachingLogOrNull = async (sessionId: string) => {
    try {
      const response = await getTeachingLog(sessionId);
      if (response.isSuccess === false || response.success === false) {
        return null;
      }

      return response.data ?? null;
    } catch {
      return null;
    }
  };

  const mergeTeachingLogIntoPlan = (plan: LessonPlan, teachingLog: Awaited<ReturnType<typeof getTeachingLogOrNull>>) => {
    if (!teachingLog) return plan;

    return {
      ...plan,
      actualContent: plan.actualContent ?? teachingLog.actualContent ?? null,
      actualHomework: plan.actualHomework ?? teachingLog.actualHomework ?? null,
      teacherNotes: plan.teacherNotes ?? teachingLog.teacherNote ?? null,
      submittedBy: plan.submittedBy ?? teachingLog.submittedBy ?? null,
      submittedAt: plan.submittedAt ?? teachingLog.submittedAt ?? null,
      updatedAt: plan.updatedAt ?? teachingLog.updatedAt ?? plan.updatedAt,
    };
  };

  const hydratePlanWithTeachingLog = async (plan: LessonPlan) => {
    const sessionId = String(plan.sessionId ?? "").trim();
    if (!sessionId) return plan;
    if (plan.actualContent && plan.actualHomework && plan.teacherNotes) {
      return plan;
    }

    const teachingLog = await getTeachingLogOrNull(sessionId);
    return mergeTeachingLogIntoPlan(plan, teachingLog);
  };

  const openPlanDetail = async (lessonPlanId: string) => {
    setDetailState({ type: "plan", loading: true, item: null });

    const response = await getLessonPlanById(lessonPlanId);
    if (!response.isSuccess || !response.data) {
      setDetailState({
        type: "plan",
        loading: false,
        item: null,
        error: extractMessage(response, "Không thể tải chi tiết giáo án."),
      });
      return;
    }

    const hydratedPlan = await hydratePlanWithTeachingLog(response.data);
    setDetailState({ type: "plan", loading: false, item: hydratedPlan });
  };

  const openSessionSyllabusDetail = useCallback(
    async (session: ClassLessonPlanSyllabusSession) => {
      setDetailState({
        type: "session-document",
        loading: true,
        item: null,
        fallbackTemplate: null,
        fallbackContent:
          session.plannedContent || session.templateSyllabusContent || null,
      });

      const localTemplate =
        (session.templateId ? templateMap.get(session.templateId) : null) ??
        pickSessionFallbackTemplate(Array.from(templateMap.values()), session) ??
        null;

      if (localTemplate) {
        const sessionOrder =
          session.sessionIndexInModule ??
          getTemplateModuleSessionOrder(localTemplate) ??
          session.sessionIndex;

        setDetailState({
          type: "session-document",
          loading: false,
          item: {
            sessionId: session.sessionId,
            classId: classSyllabus?.classId ?? null,
            syllabusId: session.syllabusId ?? localTemplate.syllabusId ?? null,
            moduleId: session.moduleId ?? localTemplate.moduleId ?? null,
            moduleName: session.moduleName ?? localTemplate.moduleName ?? null,
            sessionIndexInModule: sessionOrder,
            lessonPlanTemplateId: localTemplate.id,
            plannedLessonPlanTemplateId: localTemplate.id,
            actualLessonPlanTemplateId: null,
            plannedLessonTitle: session.templateTitle ?? localTemplate.title,
            actualLessonTitle: null,
            teachingLogId: null,
            teachingLogStatus: null,
            teachingProgressStatus: null,
            actualTeachingType: null,
            document: localTemplate,
          },
          fallbackTemplate: localTemplate,
          fallbackContent:
            session.plannedContent ||
            session.templateSyllabusContent ||
            localTemplate.syllabusContent ||
            null,
        });
        return;
      }

      let fallbackTemplate: LessonPlanTemplate | null = null;
      let dedicatedDocument: SessionLessonPlanDocument | null = null;

      const canLoadDedicatedDocument = Boolean(session.templateId);

      if (!canLoadDedicatedDocument) {
        setDetailState({
          type: "session-document",
          loading: false,
          item: null,
          fallbackTemplate: null,
          fallbackContent:
            session.plannedContent || session.templateSyllabusContent || null,
        });
        return;
      }

      const documentResponse = await getSessionLessonPlanDocument(
        session.sessionId,
      );
      if (documentResponse.isSuccess) {
        dedicatedDocument = documentResponse.data;
      } else if (documentResponse.status && documentResponse.status !== 404) {
        setDetailState({
          type: "session-document",
          loading: false,
          item: null,
          fallbackTemplate: null,
          fallbackContent:
            session.plannedContent || session.templateSyllabusContent || null,
          error: extractMessage(
            documentResponse,
            "Không thể tải syllabus theo buổi.",
          ),
        });
        return;
      }

      const resolvedTemplateId =
        dedicatedDocument?.lessonPlanTemplateId ||
        dedicatedDocument?.plannedLessonPlanTemplateId ||
        dedicatedDocument?.actualLessonPlanTemplateId ||
        session.templateId ||
        null;

      if (!dedicatedDocument?.document && resolvedTemplateId) {
        const templateResponse =
          await getLessonPlanTemplateById(resolvedTemplateId);
        if (templateResponse.isSuccess && templateResponse.data) {
          fallbackTemplate = templateResponse.data;
        }
      }

      if (!dedicatedDocument?.document && !fallbackTemplate) {
        fallbackTemplate = templateMap.get(resolvedTemplateId || "") || null;
      }

      setDetailState({
        type: "session-document",
        loading: false,
        item: dedicatedDocument,
        fallbackTemplate,
        fallbackContent:
          session.plannedContent || session.templateSyllabusContent || null,
      });
    },
    [classSyllabus?.classId, templateMap],
  );

  useEffect(() => {
    if (!requestedSessionId || !classSyllabus?.sessions.length) return;
    if (autoOpenedSessionDetailRef.current === requestedSessionId) return;

    const matchedSession = classSyllabus.sessions.find(
      (session) => session.sessionId === requestedSessionId,
    );

    if (!matchedSession) {
      if (warnedMissingSessionRef.current === requestedSessionId) return;
      warnedMissingSessionRef.current = requestedSessionId;
      toast({
        title: "Không tìm thấy buổi học trong syllabus lớp",
        description:
          "Buổi được chọn không còn nằm trong syllabus hiện tại của lớp này.",
        variant: "warning",
      });
      return;
    }

    autoOpenedSessionDetailRef.current = requestedSessionId;
    warnedMissingSessionRef.current = "";
    void openSessionSyllabusDetail(matchedSession);
  }, [classSyllabus, openSessionSyllabusDetail, requestedSessionId]);

  const openTemplateEditor = async (template: LessonPlanTemplate) => {
    const response = await getLessonPlanTemplateById(template.id);
    if (!response.isSuccess || !response.data) {
      toast({
        title: "Không thể mở template",
        description: extractMessage(response, "Vui lòng thử lại sau."),
        variant: "destructive",
      });
      return;
    }

    setTemplateModal({ mode: "edit", item: response.data });
  };

  const openPlanEditor = async (session: ClassLessonPlanSyllabusSession) => {
    if (!session.lessonPlanId) {
      setPlanModal({ mode: "create", session });
      return;
    }

    const response = await getLessonPlanById(session.lessonPlanId);
    if (!response.isSuccess || !response.data) {
      toast({
        title: "Không thể mở giáo án",
        description: extractMessage(response, "Vui lòng thử lại sau."),
        variant: "destructive",
      });
      return;
    }

    const hydratedPlan = await hydratePlanWithTeachingLog(response.data);
    setPlanModal({ mode: "edit", session, plan: hydratedPlan });
  };

  const handleTemplateSubmit = async (
    payload: {
      programId: string;
      level: string;
      title: string;
      sessionIndex: number;
      syllabusMetadata?: string | null;
      syllabusContent?: string | null;
      sourceFileName?: string | null;
      attachment?: string | null;
      isActive?: boolean;
    },
    file: File | null,
  ) => {
    let attachment = payload.attachment || null;

    if (file) {
      const uploaded = await uploadLessonPlanFile("template", file);
      attachment = uploaded.url;
    }

    const response =
      templateModal?.mode === "edit"
        ? await updateLessonPlanTemplate(templateModal.item.id, {
            level: payload.level,
            title: payload.title,
            sessionIndex: payload.sessionIndex,
            syllabusMetadata: payload.syllabusMetadata ?? null,
            syllabusContent: payload.syllabusContent ?? null,
            // Preserve new content fields — the edit form doesn't have
            // inputs for these yet, so we pass through the original values
            // to prevent them from being wiped on a full PUT.
            objectives: templateModal.item.objectives ?? null,
            languageContent: templateModal.item.languageContent ?? null,
            vocabulary: templateModal.item.vocabulary ?? null,
            grammar: templateModal.item.grammar ?? null,
            teachingMethodology: templateModal.item.teachingMethodology ?? null,
            teacherMaterials: templateModal.item.teacherMaterials ?? null,
            studentMaterials: templateModal.item.studentMaterials ?? null,
            procedure: templateModal.item.procedure ?? null,
            evaluation: templateModal.item.evaluation ?? null,
            homework: templateModal.item.homework ?? null,
            teacherNote: templateModal.item.teacherNote ?? null,
            sourceFileName: payload.sourceFileName ?? null,
            attachment,
            isActive: payload.isActive ?? true,
          })
        : await createLessonPlanTemplate({
            programId: payload.programId,
            level: payload.level,
            title: payload.title,
            sessionIndex: payload.sessionIndex,
            syllabusMetadata: payload.syllabusMetadata ?? null,
            syllabusContent: payload.syllabusContent ?? null,
            sourceFileName: payload.sourceFileName ?? null,
            attachment,
          });

    if (!response.isSuccess) {
      throw new Error(extractMessage(response, "Không thể lưu mẫu giáo án."));
    }

    toast({
      title:
        templateModal?.mode === "edit"
          ? "Đã cập nhật template"
          : "Đã tạo template",
      description: "Dữ liệu template đã được đồng bộ thành công.",
      variant: "success",
    });

    setTemplateModal(null);
    await loadTemplates();
  };

  const openSyllabusWorkspace = () => {
    if (typeof window === "undefined") return;
    const locale = window.location.pathname.split("/")[1] || "vi";
    if (scope === "teacher") {
      const query = new URLSearchParams();
      const targetSyllabusId =
        focusedSyllabusId ||
        (selectedSyllabusId !== "all" ? selectedSyllabusId : "") ||
        classSyllabus?.syllabusId ||
        requestedSyllabusId ||
        "";
      const targetClassId =
        selectedClassId || classSyllabus?.classId || requestedClassId || "";

      if (targetClassId) query.set("classId", targetClassId);
      if (targetSyllabusId) query.set("syllabusId", targetSyllabusId);
      if (effectiveSelectedModuleId !== "all") {
        query.set("moduleId", effectiveSelectedModuleId);
      }

      const target = `/${locale}/portal/teacher/subjects${query.size ? `?${query.toString()}` : ""}`;
      window.location.href = target;
      return;
    }

    const portalScope =
      scope === "staff-management" ? "staff-management" : "admin";
    window.location.href = `/${locale}/portal/${portalScope}/syllabuses`;
  };

  const handlePlanSubmit = async (payload: {
    session: ClassLessonPlanSyllabusSession;
    templateId?: string | null;
    plannedContent?: string | null;
    actualContent?: string | null;
    actualHomework?: string | null;
    teacherNotes?: string | null;
  }) => {
    if (!classSyllabus?.classId) {
      throw new Error("Chưa có thông tin lớp để lưu giáo án.");
    }

    const response =
      planModal?.mode === "edit"
        ? await updateLessonPlan(planModal.plan.id, {
            templateId: isTeacher
              ? (payload.templateId ?? planModal.plan.templateId ?? null)
              : (payload.templateId ?? null),
            plannedContent: isTeacher
              ? (planModal.plan.plannedContent ?? null)
              : (payload.plannedContent ?? null),
            actualContent: payload.actualContent ?? null,
            actualHomework: payload.actualHomework ?? null,
            teacherNotes: payload.teacherNotes ?? null,
          })
        : await createLessonPlan({
            classId: classSyllabus.classId,
            sessionId: payload.session.sessionId,
            templateId: isTeacher
              ? (payload.templateId ?? payload.session.templateId ?? null)
              : (payload.templateId ?? null),
            plannedContent: isTeacher ? null : (payload.plannedContent ?? null),
            actualContent: payload.actualContent ?? null,
            actualHomework: payload.actualHomework ?? null,
            teacherNotes: payload.teacherNotes ?? null,
          });

    if (!response.isSuccess) {
      throw new Error(extractMessage(response, "Không thể lưu giáo án."));
    }

    toast({
      title:
        planModal?.mode === "edit" ? "Đã cập nhật giáo án" : "Đã tạo giáo án",
      description: "Dữ liệu của buổi học đã được làm mới theo backend mới.",
      variant: "success",
    });

    setPlanModal(null);
    await loadClassSyllabus(classSyllabus.classId);

    if (templatesAvailable) {
      await loadTemplates();
    }
  };

  const templateOptions = useMemo(() => {
    if (!classSyllabus?.programId) {
      return templates;
    }

    return templates.filter(
      (item) => item.programId === classSyllabus.programId,
    );
  }, [classSyllabus, templates]);

  const focusedSession = useMemo(
    () =>
      requestedSessionId
        ? (classSyllabus?.sessions.find(
            (session) => session.sessionId === requestedSessionId,
          ) ?? null)
        : null,
    [classSyllabus, requestedSessionId],
  );

  const focusedSessionDetailState =
    detailState?.type === "session-document" ? detailState : null;
  const focusedSyllabusId =
    focusedSessionDetailState?.item?.syllabusId ||
    focusedSessionDetailState?.item?.document?.syllabusId ||
    focusedSessionDetailState?.fallbackTemplate?.syllabusId ||
    requestedSyllabusId ||
    "";
  const focusedCurriculumRows = useMemo(
    () => extractCurriculumRowsFromSyllabusDetail(focusedSyllabusDetail),
    [focusedSyllabusDetail],
  );

  useEffect(() => {
    if (!isSessionPage) return;
    if (!focusedSyllabusId) {
      setFocusedSyllabusDetail(null);
      setFocusedSyllabusError(null);
      setFocusedSyllabusLoading(false);
      return;
    }

    let cancelled = false;
    setFocusedSyllabusLoading(true);
    setFocusedSyllabusError(null);

    void getSyllabusById(focusedSyllabusId)
      .then((response) => {
        if (cancelled) return;
        if (!response.isSuccess || !response.data) {
          setFocusedSyllabusDetail(null);
          setFocusedSyllabusError(
            extractMessage(response, "Không thể tải curriculum của syllabus."),
          );
          return;
        }

        setFocusedSyllabusDetail(response.data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setFocusedSyllabusDetail(null);
        setFocusedSyllabusError(
          toErrorMessage(error, "Không thể tải curriculum của syllabus."),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setFocusedSyllabusLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [focusedSyllabusId, isSessionPage]);

  if (isSessionPage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/40 to-white p-2 space-y-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                Syllabus theo buổi
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {focusedSession?.templateTitle ||
                  getSessionDisplay(
                    focusedSession || { sessionIndex: 0, sessionDate: null },
                  )}
              </h1>
              <p className="text-sm text-gray-600">
                Trang cố định cho syllabus của đúng buổi học được mở từ
                attendance. Không hiển thị popup trên trang này.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refreshWorkspace(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 cursor-pointer"
            >
              <RefreshCw
                size={16}
                className={cn(refreshing && "animate-spin")}
              />
              Làm mới
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              icon={Users}
              label="Lớp học"
              value={getClassDisplay(classSyllabus)}
            />
            <InfoCard
              icon={CalendarDays}
              label="Buổi học"
              value={
                focusedSession
                  ? getSessionDisplay(focusedSession)
                  : "Đang xác định buổi học"
              }
            />
            <InfoCard
              icon={Layers}
              label="Module"
              value={
                focusedSessionDetailState?.item?.moduleName ||
                focusedSessionDetailState?.item?.moduleId ||
                focusedSession?.moduleName ||
                "-"
              }
            />
            <InfoCard
              icon={ShieldCheck}
              label="Teaching log"
              value={focusedSessionDetailState?.item?.teachingLogStatus || "-"}
            />
          </div>

          <div className="rounded-2xl border border-red-200 bg-white shadow-sm">
            <div className="border-b border-red-100 bg-gradient-to-r from-red-50 to-white px-6 py-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                Session syllabus detail
              </div>
              <h2 className="mt-1 text-lg font-bold text-gray-900">
                {focusedSession?.templateTitle ||
                  focusedSession?.plannedContent ||
                  "Nội dung syllabus theo buổi"}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Toàn bộ nội dung bên dưới là syllabus đã resolve cho buổi này,
                render trực tiếp trong trang riêng.
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-600">
                  <Loader2
                    size={20}
                    className="mr-3 animate-spin text-red-600"
                  />
                  Đang tải syllabus buổi học...
                </div>
              ) : !requestedSessionId ? (
                <EmptyState
                  title="Thiếu sessionId"
                  subtitle="Trang này cần sessionId để mở đúng syllabus theo buổi."
                />
              ) : !classSyllabus ? (
                <EmptyState
                  title="Chưa tải được syllabus lớp"
                  subtitle="Không có dữ liệu class syllabus để resolve syllabus theo buổi."
                />
              ) : !focusedSession ? (
                <EmptyState
                  title="Không tìm thấy buổi học"
                  subtitle="Buổi được chọn không tồn tại trong syllabus hiện tại của lớp này."
                />
              ) : !focusedSessionDetailState ? (
                <div className="flex items-center justify-center py-16 text-gray-600">
                  <Loader2
                    size={20}
                    className="mr-3 animate-spin text-red-600"
                  />
                  Đang mở syllabus của buổi này...
                </div>
              ) : focusedSessionDetailState.loading ? (
                <div className="flex items-center justify-center py-16 text-gray-600">
                  <Loader2
                    size={20}
                    className="mr-3 animate-spin text-red-600"
                  />
                  Đang tải chi tiết syllabus...
                </div>
              ) : focusedSessionDetailState.error ? (
                <ErrorBox message={focusedSessionDetailState.error} />
              ) : (
                <div className="space-y-6">
                  <SessionDocumentDetailContent
                    state={focusedSessionDetailState}
                  />
                  <SessionCurriculumTable
                    rows={focusedCurriculumRows}
                    currentRowIndex={
                      focusedSession ? focusedSession.sessionIndex - 1 : -1
                    }
                    loading={focusedSyllabusLoading}
                    error={focusedSyllabusError}
                    syllabusTitle={
                      focusedSyllabusDetail?.title ||
                      focusedSessionDetailState.item?.document?.syllabusTitle ||
                      focusedSessionDetailState.fallbackTemplate
                        ?.syllabusTitle ||
                      "Syllabus hiện tại"
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50  p-2 space-y-6">
      <div
        className={cn(
          "flex flex-col gap-4 transition-all duration-500",
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <BookOpenCheck size={25} />
            </div>
            <div>
              <h1 className="text-2xl md:text-2xl font-bold text-gray-900">
                {headerCopy.title}
              </h1>
              <p
                className="text-gray-600 mt-1 flex items-center gap-2
"
              >
                <Sparkles size={14} className="text-red-600" />
                {headerCopy.subtitle}
              </p>
              {templatesAvailable && activeTab === "templates" ? (
                <button
                  type="button"
                  onClick={openSyllabusWorkspace}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-red-600 transition-colors hover:text-red-700 cursor-pointer"
                >
                  <BookOpenCheck size={14} />
                  Mở trang syllabus để thêm hoặc chỉnh dữ liệu nguồn
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {templatesAvailable && activeTab === "templates" ? (
              <button
                type="button"
                onClick={() => setTemplateModal({ mode: "create" })}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg cursor-pointer"
              >
                <Plus size={16} />
                Tạo mẫu giáo án
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => refreshWorkspace(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 cursor-pointer"
            >
              <RefreshCw
                size={16}
                className={cn(refreshing && "animate-spin")}
              />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {templatesAvailable && !forcedTab ? (
        <div
          className={cn(
            "inline-flex rounded-2xl border border-red-200 bg-white p-1 transition-all duration-500",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
          )}
        >
          <TabButton
            active={activeTab === "templates"}
            label="Mẫu giáo án"
            onClick={() => setActiveTab("templates")}
          />
          <TabButton
            active={activeTab === "plans"}
            label="Giáo án lớp"
            onClick={() => setActiveTab("plans")}
          />
        </div>
      ) : null}
      <div
        className={cn(
          "grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-500",
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        )}
      >
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      <FilterBar
        activeTab={activeTab}
        templatesAvailable={templatesAvailable}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        templateStatusFilter={templateStatusFilter}
        onTemplateStatusFilterChange={setTemplateStatusFilter}
        planStatusFilter={planStatusFilter}
        onPlanStatusFilterChange={setPlanStatusFilter}
        selectedProgramId={selectedProgramId}
        onProgramChange={setSelectedProgramId}
        selectedSyllabusId={selectedSyllabusId}
        onSyllabusChange={handleSyllabusFilterChange}
        selectedModuleId={effectiveSelectedModuleId}
        onModuleChange={setSelectedModuleId}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        programOptions={programOptions}
        syllabusOptions={filteredSyllabusOptions}
        moduleOptions={filteredModuleOptions}
        classOptions={classOptions}
        templates={templates}
        classSyllabus={classSyllabus}
        planSessions={planBaseSessions}
      />

      {activeTab === "plans" && classSyllabus ? (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              {/* Header with subtle accent line */}
              <div className="relative">
                <div className="absolute -left-5 top-0 h-6 w-1 rounded-full bg-red-500" />
                <div className="text-sm font-medium uppercase tracking-wide text-red-600">
                  Syllabus tổng & chi tiết
                </div>
                <h2 className="mt-2 text-2xl font-bold text-gray-900 leading-tight">
                  {classSyllabus.classTitle ||
                    classSyllabus.classCode ||
                    "Syllabus lớp học"}
                </h2>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-2xl">
                Dòng bên trái là syllabus tổng; chọn từng buổi ở bảng bên dưới
                để xem syllabus/session detail tương ứng.
              </p>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={openSyllabusWorkspace}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-red-300 hover:bg-red-50 hover:shadow-sm cursor-pointer whitespace-nowrap group"
            >
              <BookOpenCheck
                size={16}
                className="text-red-500 group-hover:scale-105 transition-transform"
              />
              <span>Mở trang syllabus</span>
            </button>
          </div>

          {/* Syllabus metadata tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(() => {
              const items = getSyllabusSummaryItems(
                classSyllabus,
                planBaseSessions,
              );
              
              const getBadgeStyle = (label: string) => {
                const labelLower = label.toLowerCase();
                if (labelLower.includes("lớp")) return { bg: "bg-gradient-to-r from-blue-50 to-blue-100", border: "border-blue-300", text: "text-blue-700", icon: "Users" };
                if (labelLower.includes("chương trình")) return { bg: "bg-gradient-to-r from-purple-50 to-purple-100", border: "border-purple-300", text: "text-purple-700", icon: "Layers" };
                if (labelLower.includes("thông tin") || labelLower.includes("syllabus")) return { bg: "bg-gradient-to-r from-green-50 to-green-100", border: "border-green-300", text: "text-green-700", icon: "BookOpenCheck" };
                if (labelLower.includes("tổng") || labelLower.includes("buổi")) return { bg: "bg-gradient-to-r from-orange-50 to-orange-100", border: "border-orange-300", text: "text-orange-700", icon: "Zap" };
                if (labelLower.includes("giáo án")) return { bg: "bg-gradient-to-r from-cyan-50 to-cyan-100", border: "border-cyan-300", text: "text-cyan-700", icon: "CheckCircle" };
                if (labelLower.includes("báo cáo")) return { bg: "bg-gradient-to-r from-emerald-50 to-emerald-100", border: "border-emerald-300", text: "text-emerald-700", icon: "CheckCircle" };
                return { bg: "bg-gradient-to-r from-gray-50 to-gray-100", border: "border-gray-300", text: "text-gray-700", icon: "Tag" };
              };
              
              return items
                .filter((item) => {
                  const value = item.value;
                  if (value === null || value === undefined) return false;
                  if (typeof value === "string")
                    return value.trim().length > 0;
                  return true;
                })
                .map((item) => {
                  const style = getBadgeStyle(item.label);
                  return (
                    <span
                      key={item.label}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border shadow-sm transition-all hover:shadow-md ${style.bg} ${style.border} ${style.text}`}
                    >
                      <span className="flex-shrink-0">
                        {style.icon === "Users" && <Users size={14} />}
                        {style.icon === "Layers" && <Layers size={14} />}
                        {style.icon === "BookOpenCheck" && <BookOpenCheck size={14} />}
                        {style.icon === "Zap" && <Zap size={14} />}
                        {style.icon === "CheckCircle" && <CheckCircle size={14} />}
                        {style.icon === "Tag" && <Tag size={14} />}
                      </span>
                      <span>
                        {item.label}:
                      </span>
                      <span className="font-bold">{item.value}</span>
                    </span>
                  );
                });
            })()}
          </div>

          {/* Session Number Grid */}
          {filteredSessions.length > 0 && (
            <div className="mt-6 border-t border-red-100 pt-5">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Danh sách buổi học
                </h3>
                <span className="text-xs text-gray-400">
                  {filteredSessions.length} buổi
                </span>
              </div>

              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 xl:grid-cols-16">
                {filteredSessions.map((session) => {
                  const hasPlan = Boolean(session.lessonPlanId);
                  const hasReport = Boolean(session.actualContent);
                  const isActive = sessionDetailId === session.sessionId;
                  const displaySessionIndex = getModuleSessionDisplayIndex(session);

                  let buttonClasses =
                    "relative flex h-10 items-center justify-center rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer shadow-md ";

                  if (isActive) {
                    buttonClasses +=
                      "bg-gradient-to-r from-red-600 to-red-500 text-white border border-red-700 hover:from-red-700 hover:to-red-600 hover:scale-105 ring-2 ring-red-400 ring-offset-2";
                  } else if (hasReport) {
                    buttonClasses +=
                      "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border border-emerald-700 hover:from-emerald-600 hover:to-emerald-700 hover:scale-105 hover:shadow-lg";
                  } else if (hasPlan) {
                    buttonClasses +=
                      "bg-gradient-to-br from-blue-500 to-blue-600 text-white border border-blue-700 hover:from-blue-600 hover:to-blue-700 hover:scale-105 hover:shadow-lg";
                  } else {
                    buttonClasses +=
                      "bg-white text-gray-500 border-2 border-gray-300 hover:border-red-500 hover:text-red-600 hover:bg-red-50 hover:scale-105 hover:shadow-md";
                  }

                  return (
                    <button
                      key={session.sessionId}
                      type="button"
                      onClick={() => setSessionDetailId(session.sessionId)}
                      className={buttonClasses}
                      title={`Buổi ${displaySessionIndex}${hasPlan ? " - Có giáo án" : ""}${hasReport ? " - Đã báo cáo" : ""}`}
                    >
                      <span>{displaySessionIndex}</span>
                      {hasReport && !isActive && (
                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-yellow-300 ring-1 ring-white shadow-sm" />
                      )}
                      {hasPlan && !hasReport && !isActive && (
                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-cyan-300 ring-1 ring-white shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-4 pt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-500">Đã báo cáo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  <span className="text-gray-500">Có giáo án</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <span className="text-gray-500">Chưa chuẩn bị</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-2xl border border-red-200 bg-white shadow-sm transition-all duration-500",
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        )}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-600">
            <Loader2 size={20} className="mr-3 animate-spin text-red-600" />
            Đang tải dữ liệu giáo án...
          </div>
        ) : activeTab === "templates" && templatesAvailable ? (
          <TemplateTable
            items={filteredTemplates}
            onOpenAttachment={openAttachment}
            onOpenDetail={(item) => openTemplateDetail(item.id)}
            onEdit={openTemplateEditor}
            onRefresh={() => refreshWorkspace(true)}
          />
        ) : (
          <SyllabusView
            scope={scope}
            syllabus={classSyllabus}
            items={filteredSessions}
            templateMap={templateMap}
            sharedTemplate={sharedProgramTemplate}
            onOpenSessionSyllabus={openSessionSyllabusDetail}
            onCreate={(session) => setPlanModal({ mode: "create", session })}
            onEdit={openPlanEditor}
            onOpenPlanDetail={(lessonPlanId) => openPlanDetail(lessonPlanId)}
            onOpenTemplateDetail={
              templatesAvailable ? openTemplateDetail : undefined
            }
            selectedSessionId={sessionDetailId}
          />
        )}
      </div>

      {templateModal ? (
        <TemplateFormModal
          initialValue={
            templateModal.mode === "edit" ? templateModal.item : null
          }
          programOptions={programOptions}
          existingTemplates={templates}
          defaultProgramId={
            templateModal.mode === "create" && selectedProgramId !== "all"
              ? selectedProgramId
              : undefined
          }
          onClose={() => setTemplateModal(null)}
          onSubmit={handleTemplateSubmit}
        />
      ) : null}

      {planModal ? (
        <PlanFormModal
          scope={scope}
          classSyllabus={classSyllabus}
          session={planModal.session}
          initialValue={planModal.mode === "edit" ? planModal.plan : null}
          templateOptions={templateOptions}
          sharedTemplate={sharedProgramTemplate}
          onClose={() => setPlanModal(null)}
          onSubmit={handlePlanSubmit}
        />
      ) : null}

      {detailState ? (
        <DetailModal
          state={detailState}
          linkedTemplate={
            detailState.type === "plan" && detailState.item?.templateId
              ? templateMap.get(detailState.item.templateId)
              : undefined
          }
          onClose={() => setDetailState(null)}
          onOpenAttachment={openAttachment}
        />
      ) : null}
    </div>
  );
}

function FilterBar({
  templatesAvailable,
  searchQuery,
  onSearchChange,
  templateStatusFilter,
  onTemplateStatusFilterChange,
  planStatusFilter,
  onPlanStatusFilterChange,
  selectedProgramId,
  onProgramChange,
  selectedSyllabusId,
  onSyllabusChange,
  selectedModuleId,
  onModuleChange,
  selectedClassId,
  onClassChange,
  programOptions,
  syllabusOptions,
  moduleOptions,
  classOptions,
  activeTab,
  templates,
  classSyllabus,
  planSessions,
}: {
  templatesAvailable: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  templateStatusFilter: TemplateStatusFilter;
  onTemplateStatusFilterChange: (filter: TemplateStatusFilter) => void;
  planStatusFilter: PlanStatusFilter;
  onPlanStatusFilterChange: (filter: PlanStatusFilter) => void;
  selectedProgramId: string;
  onProgramChange: (id: string) => void;
  selectedSyllabusId: string;
  onSyllabusChange: (id: string) => void;
  selectedModuleId: string;
  onModuleChange: (id: string) => void;
  selectedClassId: string;
  onClassChange: (id: string) => void;
  programOptions: Option[];
  syllabusOptions: SyllabusListItem[];
  moduleOptions: Option[];
  classOptions: Option[];
  activeTab: ActiveTab;
  templates: LessonPlanTemplate[];
  classSyllabus: ClassLessonPlanSyllabus | null;
  planSessions?: ClassLessonPlanSyllabusSession[];
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
      <div className="space-y-4">
        {/* Status Filter Tabs - Templates */}
        {activeTab === "templates" && templatesAvailable && (
          <div className="flex text-sm flex-wrap gap-2 pb-4 border-b border-red-200">
            {(["all", "active", "inactive", "withAttachment"] as const).map(
              (status) => {
                const labels: Record<typeof status, string> = {
                  all: "Tất cả trạng thái",
                  active: "Đang hoạt động",
                  inactive: "Tạm ẩn",
                  withAttachment: "Có file đính kèm",
                };

                const getTemplateCount = (filterStatus: typeof status) => {
                  return templates.filter((item) => {
                    if (
                      selectedProgramId !== "all" &&
                      item.programId !== selectedProgramId
                    ) {
                      return false;
                    }
                    if (
                      filterStatus === "active" &&
                      getTemplateStatus(item) !== "active"
                    ) {
                      return false;
                    }
                    if (
                      filterStatus === "inactive" &&
                      getTemplateStatus(item) !== "inactive"
                    ) {
                      return false;
                    }
                    if (filterStatus === "withAttachment" && !item.attachment) {
                      return false;
                    }
                    return true;
                  }).length;
                };

                const count = getTemplateCount(status);
                const isActive = templateStatusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => onTemplateStatusFilterChange(status)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                        : "bg-white border-red-200 text-gray-700 hover:bg-red-50"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {labels[status]}
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isActive
                            ? "bg-white/30 text-white"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {count}
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>
        )}

        {/* Status Filter Tabs - Plans */}
        {activeTab === "plans" && (
          <div className="flex text-sm flex-wrap gap-2 pb-4 border-b border-red-200">
            {(
              [
                "all",
                "editable",
                "hasPlan",
                "missingPlan",
                "reported",
                "notReported",
              ] as const
            ).map((status) => {
              const labels: Record<typeof status, string> = {
                all: "Tất cả buổi học",
                editable: "Có thể chỉnh sửa",
                hasPlan: "Đã có giáo án",
                missingPlan: "Chưa có giáo án",
                reported: "Đã báo cáo",
                notReported: "Chưa báo cáo",
              };

              const getPlanCount = (filterStatus: typeof status) => {
                const sessions = planSessions ?? classSyllabus?.sessions ?? [];
                return sessions.filter((item) => {
                  if (filterStatus === "editable" && !item.canEdit) {
                    return false;
                  }
                  if (filterStatus === "hasPlan" && !item.lessonPlanId) {
                    return false;
                  }
                  if (filterStatus === "missingPlan" && item.lessonPlanId) {
                    return false;
                  }
                  if (filterStatus === "reported" && !item.actualContent) {
                    return false;
                  }
                  if (filterStatus === "notReported" && item.actualContent) {
                    return false;
                  }
                  return true;
                }).length;
              };

              const count = getPlanCount(status);
              const isActive = planStatusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => onPlanStatusFilterChange(status)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                      : "bg-white border-red-200 text-gray-700 hover:bg-red-50"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {labels[status]}
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-white/30 text-white"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search Box */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={
                activeTab === "templates"
                  ? "Tìm theo tên mẫu giáo án, chương trình..."
                  : "Tìm theo buổi học, giáo viên..."
              }
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "templates" && templatesAvailable ? (
              <>
                <Select
                  value={selectedProgramId}
                  onValueChange={onProgramChange}
                >
                  <SelectTrigger className="w-auto min-w-[150px] rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chương trình</SelectItem>
                    {programOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedSyllabusId}
                  onValueChange={onSyllabusChange}
                >
                  <SelectTrigger className="w-auto min-w-[220px] rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả syllabus</SelectItem>
                    {syllabusOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {`${item.code} ${item.version} · ${item.title}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSyllabusId !== "all" ? (
                  <Select
                    value={selectedModuleId}
                    onValueChange={onModuleChange}
                  >
                    <SelectTrigger className="w-auto min-w-[190px] rounded-xl h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả module</SelectItem>
                      {moduleOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </>
            ) : (
              <>
                <Select value={selectedClassId} onValueChange={onClassChange}>
                  <SelectTrigger className="w-auto min-w-[170px] rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SortableUnitRow ──────────────────────────────────────────────────────────

function SortableUnitRow({
  unit,
  onRename,
  onDelete,
  saving,
}: {
  unit: LessonPlanUnit;
  onRename: (unitId: string, name: string) => void;
  onDelete: (unit: LessonPlanUnit) => void;
  saving: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: unit.id });
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(unit.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftName(unit.name);
  }, [unit.name]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  function commit() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== unit.name) onRename(unit.id, trimmed);
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-sm"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
        title="Kéo để sắp xếp"
      >
        <GripVertical size={15} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraftName(unit.name);
              setEditing(false);
            }
          }}
          className="flex-1 text-sm border-b border-red-400 outline-none bg-transparent py-0.5"
        />
      ) : (
        <span className="flex-1 text-sm text-gray-800 truncate">
          {unit.name}
        </span>
      )}

      <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
        {unit.lessonCount} bài
      </span>

      {saving === unit.id ? (
        <Loader2
          size={13}
          className="animate-spin text-gray-400 flex-shrink-0"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-gray-400 hover:text-amber-600 transition-colors flex-shrink-0 cursor-pointer"
            title="Đổi tên"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(unit)}
            disabled={unit.lessonCount > 0}
            className="text-gray-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0 cursor-pointer"
            title={
              unit.lessonCount > 0
                ? `Không thể xóa: còn ${unit.lessonCount} bài`
                : "Xóa unit"
            }
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}

// ─── UnitManagerPanel ─────────────────────────────────────────────────────────

function UnitManagerPanel({
  moduleId,
  moduleName,
  isOpen,
  onClose,
  onChanged,
}: {
  moduleId: string;
  moduleName: string;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [units, setUnits] = useState<LessonPlanUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const newInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getLessonPlanUnits(moduleId);
    if (res.isSuccess) setUnits(res.data ?? []);
    setLoading(false);
  }, [moduleId]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = units.findIndex((u) => u.id === active.id);
    const newIndex = units.findIndex((u) => u.id === over.id);
    const reordered = arrayMove(units, oldIndex, newIndex).map((u, i) => ({
      ...u,
      orderIndex: i,
    }));
    setUnits(reordered);
    await reorderLessonPlanUnits(
      moduleId,
      reordered.map((u) => ({ id: u.id, orderIndex: u.orderIndex })),
    );
    onChanged();
  }

  async function handleRename(unitId: string, name: string) {
    setSaving(unitId);
    const res = await updateLessonPlanUnit(unitId, { name });
    if (res.isSuccess) {
      setUnits((prev) =>
        prev.map((u) => (u.id === unitId ? { ...u, name } : u)),
      );
      onChanged();
    } else {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: res.message ?? "Không thể đổi tên.",
      });
    }
    setSaving(null);
  }

  async function handleDelete(unit: LessonPlanUnit) {
    setSaving(unit.id);
    const res = await deleteLessonPlanUnit(unit.id);
    if (res.isSuccess) {
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
      onChanged();
    } else {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: res.message ?? "Không thể xóa unit.",
      });
    }
    setSaving(null);
  }

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    const res = await createLessonPlanUnit(moduleId, { name: trimmed });
    if (res.isSuccess && res.data) {
      setUnits((prev) => [...prev, res.data!]);
      setNewName("");
      onChanged();
      newInputRef.current?.focus();
    } else {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: res.message ?? "Không thể tạo unit.",
      });
    }
    setCreating(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
          <Settings2 size={17} className="text-red-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">Quản lý Unit</p>
            <p className="text-sm font-bold text-gray-900 truncate">
              {moduleName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : units.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              Chưa có unit nào.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={units.map((u) => u.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {units.map((unit) => (
                    <SortableUnitRow
                      key={unit.id}
                      unit={unit}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      saving={saving}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Footer — create new unit */}
        <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
          <input
            ref={newInputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            placeholder="Tên unit mới (vd: UNIT 5: NATURE)"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-400"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {creating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Tạo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SortableLessonRow ────────────────────────────────────────────────────────

function SortableLessonRow({
  item,
  onOpenAttachment,
  onOpenDetail,
  onEdit,
  onDelete,
  isReal,
  onSessionOrderChange,
}: {
  item: LessonPlanTemplate;
  onOpenAttachment: (url?: string | null) => void;
  onOpenDetail: (item: LessonPlanTemplate) => void;
  onEdit: (item: LessonPlanTemplate) => void;
  onDelete: (item: LessonPlanTemplate) => void;
  isReal: boolean;
  onSessionOrderChange: (
    item: LessonPlanTemplate,
    newOrder: number,
  ) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [editingSession, setEditingSession] = useState(false);
  const [sessionInput, setSessionInput] = useState("");
  const sessionInputRef = useRef<HTMLInputElement>(null);

  function startEditSession() {
    setSessionInput(String(item.sessionOrder ?? item.sessionIndex ?? ""));
    setEditingSession(true);
    setTimeout(() => sessionInputRef.current?.select(), 0);
  }

  async function commitSessionEdit() {
    setEditingSession(false);
    const newOrder = parseInt(sessionInput, 10);
    const current = item.sessionOrder ?? item.sessionIndex;
    if (!isNaN(newOrder) && newOrder > 0 && newOrder !== current) {
      await onSessionOrderChange(item, newOrder);
    }
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="hover:bg-red-50/30 transition-colors"
    >
      <td className="pl-16 pr-4 py-3">
        <div className="flex items-center gap-2">
          {isReal && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 flex-shrink-0 touch-none"
              title="Kéo để sắp xếp"
            >
              <GripVertical size={13} />
            </button>
          )}
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center">
            <BookOpenCheck size={13} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {getTemplateDisplayTitle(item)}
            </div>
            <div className="mt-0.5 text-xs text-gray-400">
              {getTemplateDisplaySubtitle(item)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <CalendarDays size={13} className="text-red-500" />
          {editingSession ? (
            <input
              ref={sessionInputRef}
              type="number"
              min={1}
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              onBlur={commitSessionEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingSession(false);
              }}
              className="w-12 text-sm text-center border border-blue-400 rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
          ) : (
            <span
              className="cursor-pointer hover:text-blue-600 hover:underline decoration-dashed underline-offset-2"
              title="Click để đổi số buổi"
              onClick={startEditSession}
            >
              Buổi {item.sessionOrder ?? item.sessionIndex ?? "-"}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge
            kind={getTemplateStatus(item) === "active" ? "success" : "muted"}
          >
            <div className="flex items-center gap-0.5">
              {getTemplateStatus(item) === "active" ? (
                <>
                  <CheckCircle2 size={12} />
                  <span>Hoạt động</span>
                </>
              ) : (
                <>
                  <XCircle size={12} />
                  <span>Tạm ẩn</span>
                </>
              )}
            </div>
          </StatusBadge>
          {item.attachment && (
            <StatusBadge kind="info">
              <div className="flex items-center gap-0.5">
                <Paperclip size={12} />
                <span>File</span>
              </div>
            </StatusBadge>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="flex justify-end items-center gap-2.5">
          {item.attachment && (
            <button
              type="button"
              onClick={() => onOpenAttachment(item.attachment)}
              className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
              title="Mở file"
            >
              <Paperclip size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenDetail(item)}
            className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={14} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="text-gray-400 hover:text-amber-600 transition-colors cursor-pointer"
            title="Chỉnh sửa"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
            title="Xóa lesson"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── SortableModuleAccordionItem ────────────────────────────────────
function SortableModuleAccordionItem({
  moduleKey,
  moduleName,
  moduleCode,
  totalItems,
  unitCount,
  orphanCount,
  modIdx,
  isOpen,
  onToggle,
  children,
}: {
  moduleKey: string;
  moduleName: string;
  moduleCode: string | null;
  totalItems: number;
  unitCount: number;
  orphanCount: number;
  modIdx: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: moduleKey });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-stretch bg-red-50/40 hover:bg-red-50 transition-colors border-l-2 border-red-200">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="px-2 flex items-center cursor-grab active:cursor-grabbing text-red-200 hover:text-red-400 flex-shrink-0 touch-none"
          title="Kéo để sắp xếp module"
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 pr-5 py-3 text-left cursor-pointer"
        >
          <ChevronRight
            size={14}
            className={cn(
              "flex-shrink-0 transition-transform text-red-400",
              isOpen && "rotate-90",
            )}
          />
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex-shrink-0">
            {modIdx + 1}
          </span>
          <span className="text-sm font-semibold text-gray-800">
            {moduleName}
          </span>
          {moduleCode && (
            <span className="text-xs text-gray-400 font-mono">
              ({moduleCode})
            </span>
          )}
          <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
            {totalItems} mẫu · {unitCount} unit
            {orphanCount > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="text-orange-400">
                  {orphanCount} chưa phân unit
                </span>
              </>
            )}
          </span>
        </button>
      </div>
      {children}
    </div>
  );
}

// ─── SortableUnitAccordionItem ─────────────────────────────────────────────
function SortableUnitAccordionItem({
  unitGroup,
  moduleKey,
  isOpen,
  onToggle,
  onChanged,
  onImportWord,
  importing,
  children,
}: {
  unitGroup: {
    unitKey: string;
    displayName: string;
    isLegacy: boolean;
    items: { id: string }[];
  };
  moduleKey: string;
  isOpen: boolean;
  onToggle: () => void;
  onChanged: () => Promise<void>;
  onImportWord: (unitKey: string, moduleKey: string) => void;
  importing: boolean;
  children: React.ReactNode;
}) {
  const isReal = !unitGroup.isLegacy;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: unitGroup.unitKey,
    disabled: !isReal,
  });
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(unitGroup.displayName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftName(unitGroup.displayName);
  }, [unitGroup.displayName]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  async function commitRename() {
    const trimmed = draftName.trim();
    setEditing(false);
    if (!trimmed || trimmed === unitGroup.displayName) return;
    setSaving(true);
    try {
      await updateLessonPlanUnit(unitGroup.unitKey, { name: trimmed });
      await onChanged();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (unitGroup.items.length > 0) return;
    setSaving(true);
    try {
      await deleteLessonPlanUnit(unitGroup.unitKey);
      await onChanged();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 pl-14 pr-4 py-2.5 bg-white hover:bg-orange-50/40 transition-colors border-l-2 border-orange-200">
        {isReal ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 flex-shrink-0 touch-none"
            title="Kéo để sắp xếp"
          >
            <GripVertical size={13} />
          </button>
        ) : (
          <div className="w-[13px] flex-shrink-0" />
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          <ChevronRight
            size={12}
            className={cn(
              "flex-shrink-0 transition-transform text-orange-400",
              isOpen && "rotate-90",
            )}
          />
          <BookOpenCheck size={14} className="text-orange-500 flex-shrink-0" />
          {editing ? (
            <input
              ref={inputRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                }
                if (e.key === "Escape") {
                  setDraftName(unitGroup.displayName);
                  setEditing(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-sm border-b border-red-400 outline-none bg-transparent py-0.5"
            />
          ) : (
            <>
              <span className="text-sm font-medium text-gray-700 truncate">
                {unitGroup.displayName}
              </span>
              {unitGroup.isLegacy && (
                <span className="text-[10px] text-orange-400 italic whitespace-nowrap ml-1">
                  (chưa đồng bộ)
                </span>
              )}
            </>
          )}
        </button>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {unitGroup.items.length} bài
          </span>
          {saving ? (
            <Loader2 size={12} className="animate-spin text-gray-400" />
          ) : isReal ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-gray-300 hover:text-amber-600 transition-colors cursor-pointer"
                title="Đổi tên"
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={unitGroup.items.length > 0}
                className="text-gray-200 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title={
                  unitGroup.items.length > 0
                    ? `Còn ${unitGroup.items.length} bài, không thể xóa`
                    : "Xóa unit"
                }
              >
                <Trash2 size={12} />
              </button>
              <button
                type="button"
                onClick={() => onImportWord(unitGroup.unitKey, moduleKey)}
                disabled={importing}
                className="text-gray-200 hover:text-blue-500 disabled:opacity-40 transition-colors cursor-pointer"
                title="Import Word vào unit này"
              >
                {importing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
              </button>
            </>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function TemplateTable({
  items,
  onOpenAttachment,
  onOpenDetail,
  onEdit,
  onRefresh,
}: {
  items: LessonPlanTemplate[];
  onOpenAttachment: (url?: string | null) => void;
  onOpenDetail: (item: LessonPlanTemplate) => void;
  onEdit: (item: LessonPlanTemplate) => void;
  onRefresh: () => void;
}) {
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // Delete / Import-Word state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LessonPlanTemplate | null>(
    null,
  );
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [importTarget, setImportTarget] = useState<{
    unitKey: string;
    moduleKey: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Session order reorder state (keyed by levelKey)
  const [reorderingLevelId, setReorderingLevelId] = useState<string | null>(
    null,
  );

  function handleDeleteLesson(item: LessonPlanTemplate) {
    setDeleteTarget(item);
    setDeleteConfirmText("");
  }

  async function confirmHardDeleteLesson() {
    if (!deleteTarget) return;
    if (deleteConfirmText.trim().toUpperCase() !== "XOA") {
      toast({
        variant: "destructive",
        title: "Chưa xác nhận xóa",
        description: 'Vui lòng nhập "XOA" để xác nhận xóa vĩnh viễn.',
      });
      return;
    }

    setDeletingId(deleteTarget.id);
    try {
      const result = await hardDeleteLessonPlanTemplate(deleteTarget.id);
      toast({
        title: "Đã xóa vĩnh viễn",
        description: `Đã xóa ${result.deletedLessonPlanCount ?? 0} lesson plan liên quan.`,
      });
      setDeleteTarget(null);
      setDeleteConfirmText("");
      onRefresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xóa vĩnh viễn thất bại",
        description:
          error instanceof Error
            ? error.message
            : "Không thể xóa lesson plan template.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSessionOrderChange(
    item: LessonPlanTemplate,
    newOrder: number,
  ) {
    // Find the level this lesson belongs to so we can reorder the full level batch
    const levelGroup =
      levelGroups.find(
        (lg) =>
          lg.levelId === item.levelId &&
          lg.syllabusId === (item.syllabusId ?? null),
      ) ?? levelGroups.find((lg) => lg.levelId === item.levelId);
    if (!levelGroup?.levelId) {
      // No level context — fall back to individual update
      await updateLessonPlanTemplate(item.id, { sessionOrder: newOrder });
      onRefresh();
      return;
    }
    // Collect all lessons in current display order for this level
    const modKeys = localModuleOrder[levelGroup.levelKey];
    const orderedMods = modKeys
      ? (modKeys
          .map((k) => levelGroup.modules.find((m) => m.moduleKey === k))
          .filter(Boolean) as ModuleGroup[])
      : levelGroup.modules;
    const allLessons: LessonPlanTemplate[] = [];
    for (const mod of orderedMods) {
      const uKeys = localUnitOrder[mod.moduleKey];
      const orderedUnits = uKeys
        ? (uKeys
            .map((k) => mod.units.find((u) => u.unitKey === k))
            .filter(Boolean) as UnitGroup[])
        : mod.units;
      for (const unit of orderedUnits) {
        const overrideIds = localLessonOrder[unit.unitKey];
        const unitItems = overrideIds
          ? (overrideIds
              .map((id) => unit.items.find((it) => it.id === id))
              .filter(Boolean) as LessonPlanTemplate[])
          : unit.items;
        allLessons.push(...unitItems);
      }
      allLessons.push(...mod.orphans);
    }
    // Remove item from current position, insert at target slot, renumber 1…N
    const withoutItem = allLessons.filter((l) => l.id !== item.id);
    const clampedOrder = Math.max(
      1,
      Math.min(newOrder, withoutItem.length + 1),
    );
    withoutItem.splice(clampedOrder - 1, 0, item);
    const sessionItems = withoutItem.map((l, i) => ({
      id: l.id,
      sessionOrder: i + 1,
    }));
    await reorderLessonPlanTemplateSessionOrders(
      levelGroup.levelId,
      sessionItems,
    );
    onRefresh();
  }

  function handleImportWordClick(unitKey: string, moduleKey: string) {
    setImportTarget({ unitKey, moduleKey });
    fileInputRef.current?.click();
  }

  async function handleReorderSessionOrders(levelGroup: LevelGroup) {
    if (!levelGroup.levelId) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không tìm thấy levelId để cập nhật thứ tự.",
      });
      return;
    }
    setReorderingLevelId(levelGroup.levelKey);
    // Collect all lessons in current display order (module → unit → lesson)
    const overrideModuleKeys = localModuleOrder[levelGroup.levelKey];
    const displayedModules = overrideModuleKeys
      ? (overrideModuleKeys
          .map((k) => levelGroup.modules.find((m) => m.moduleKey === k))
          .filter(Boolean) as ModuleGroup[])
      : levelGroup.modules;
    const items: { id: string; sessionOrder: number }[] = [];
    let order = 1;
    for (const mod of displayedModules) {
      const overrideUnitKeys = localUnitOrder[mod.moduleKey];
      const displayedUnits = overrideUnitKeys
        ? (overrideUnitKeys
            .map((k) => mod.units.find((u) => u.unitKey === k))
            .filter(Boolean) as UnitGroup[])
        : mod.units;
      for (const unit of displayedUnits) {
        const overrideIds = localLessonOrder[unit.unitKey];
        const displayedItems = overrideIds
          ? (overrideIds
              .map((id) => unit.items.find((it) => it.id === id))
              .filter(Boolean) as LessonPlanTemplate[])
          : unit.items;
        for (const lesson of displayedItems) {
          items.push({ id: lesson.id, sessionOrder: order++ });
        }
      }
      for (const orphan of mod.orphans) {
        items.push({ id: orphan.id, sessionOrder: order++ });
      }
    }
    const res = await reorderLessonPlanTemplateSessionOrders(
      levelGroup.levelId,
      items,
    );
    setReorderingLevelId(null);
    if (res.isSuccess) {
      toast({
        title: "Đã cập nhật thứ tự buổi",
        description: `${items.length} mẫu trong cấp độ ${levelGroup.levelName}`,
      });
      onRefresh();
    } else {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật thứ tự",
        description: res.message ?? "Không thể cập nhật thứ tự buổi.",
      });
    }
  }

  // Local module order overrides keyed by levelKey → ordered moduleKeys (optimistic DnD)
  const [localModuleOrder, setLocalModuleOrder] = useState<
    Record<string, string[]>
  >({});
  // Local unit order overrides keyed by moduleKey → ordered unitKeys (optimistic DnD)
  const [localUnitOrder, setLocalUnitOrder] = useState<
    Record<string, string[]>
  >({});
  // Local lesson order overrides keyed by unitKey → ordered item IDs
  const [localLessonOrder, setLocalLessonOrder] = useState<
    Record<string, string[]>
  >({});
  // Real BE unit order map: moduleId → LessonPlanUnit[] (sorted by orderIndex)
  const [moduleUnitsMap, setModuleUnitsMap] = useState<
    Record<string, LessonPlanUnit[]>
  >({});

  // Load real unit orderIndex from BE for every module in items
  useEffect(() => {
    const moduleIds = [
      ...new Set(items.filter((i) => i.moduleId).map((i) => i.moduleId!)),
    ];
    if (moduleIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        moduleIds.map(async (id) => ({
          id,
          units: (await getLessonPlanUnits(id)).data,
        })),
      );
      if (cancelled) return;
      const map: Record<string, LessonPlanUnit[]> = {};
      for (const r of results) {
        if (r.status === "fulfilled") map[r.value.id] = r.value.units;
      }
      setModuleUnitsMap(map);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const lessonSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const toggleSet = (
    set: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    key: string,
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  type UnitGroup = {
    unitKey: string;
    displayName: string;
    isLegacy: boolean;
    items: LessonPlanTemplate[];
  };
  type ModuleGroup = {
    moduleKey: string;
    moduleName: string;
    moduleCode: string | null;
    moduleOrderIndex: number | null;
    units: UnitGroup[];
    orphans: LessonPlanTemplate[];
    totalItems: number;
  };
  type LevelGroup = {
    levelKey: string;
    levelId: string | null;
    levelName: string;
    programName: string;
    syllabusId: string | null;
    syllabusCode: string | null;
    syllabusVersion: string | null;
    syllabusTitle: string | null;
    modules: ModuleGroup[];
    totalItems: number;
  };

  const getUnitFirstSessionIndex = useCallback((unit: UnitGroup) => {
    const sessionIndexes = unit.items
      .map((item) => item.sessionIndex)
      .filter((value): value is number => typeof value === "number");

    return sessionIndexes.length
      ? Math.min(...sessionIndexes)
      : Number.MAX_SAFE_INTEGER;
  }, []);

  const getUnitNumberFromText = useCallback((...values: Array<unknown>) => {
    for (const value of values) {
      const text = String(value ?? "").trim();
      if (!text) continue;
      if (/^\d+$/.test(text)) return Number(text);
      const match = text.match(/\bunit\s*0*(\d+)\b/i);
      if (match) return Number(match[1]);
    }
    return Number.MAX_SAFE_INTEGER;
  }, []);

  const getUnitNaturalNumber = useCallback(
    (unit: UnitGroup) =>
      getUnitNumberFromText(
        unit.displayName,
        ...unit.items.flatMap((item) => [
          item.unitNumber,
          item.unitTitle,
          item.lessonPlanUnitName,
          item.title,
          item.sourceFileName,
        ]),
      ),
    [getUnitNumberFromText],
  );

  const levelGroups = useMemo<LevelGroup[]>(() => {
    const sorted = [...items].sort((a, b) => {
      const aModOrd = a.moduleOrderIndex ?? Number.MAX_SAFE_INTEGER;
      const bModOrd = b.moduleOrderIndex ?? Number.MAX_SAFE_INTEGER;
      if (aModOrd !== bModOrd) return aModOrd - bModOrd;
      const aIdx = a.sessionIndex ?? Number.MAX_SAFE_INTEGER;
      const bIdx = b.sessionIndex ?? Number.MAX_SAFE_INTEGER;
      return aIdx - bIdx;
    });
    const levelMap = new Map<string, LevelGroup>();
    for (const item of sorted) {
      const levelKey = `${item.syllabusId ?? ""}__${item.programId ?? ""}__${item.levelId ?? item.level ?? ""}`;
      const moduleKey = item.moduleId ?? `${levelKey}__nomod`;
      const beUnits = moduleUnitsMap[moduleKey] ?? [];
      const realUnitId = item.lessonPlanUnitId;
      const beUnitName = realUnitId
        ? (beUnits.find((u) => u.id === realUnitId)?.name ?? null)
        : null;
      const unitKey = realUnitId ?? "";
      const unitName =
        (item.lessonPlanUnitName ?? beUnitName ?? "").trim() || null;
      const isLegacy = false;
      if (!levelMap.has(levelKey)) {
        levelMap.set(levelKey, {
          levelKey,
          levelId: item.levelId ?? null,
          levelName: item.levelName || item.level || "Chưa xác định cấp độ",
          programName: item.programName || "",
          syllabusId: item.syllabusId ?? null,
          syllabusCode: item.syllabusCode ?? null,
          syllabusVersion: item.syllabusVersion ?? null,
          syllabusTitle: item.syllabusTitle ?? null,
          modules: [],
          totalItems: 0,
        });
      }
      const level = levelMap.get(levelKey)!;
      let mod = level.modules.find((m) => m.moduleKey === moduleKey);
      if (!mod) {
        mod = {
          moduleKey,
          moduleName: item.moduleName || "Chưa phân module",
          moduleCode: item.moduleCode ?? null,
          moduleOrderIndex: item.moduleOrderIndex ?? null,
          units: [],
          orphans: [],
          totalItems: 0,
        };
        level.modules.push(mod);
      } else if (
        mod.moduleOrderIndex == null &&
        item.moduleOrderIndex != null
      ) {
        mod.moduleOrderIndex = item.moduleOrderIndex;
      }
      if (!realUnitId || !unitName) {
        // No authoritative unit id/name from BE -> orphan.
        mod.orphans.push(item);
      } else {
        let unit = mod.units.find((u) => u.unitKey === unitKey);
        if (!unit) {
          unit = { unitKey, displayName: unitName, isLegacy, items: [] };
          mod.units.push(unit);
        }
        unit.items.push(item);
      }
      mod.totalItems += 1;
      level.totalItems += 1;
    }
    // Sort modules within each level alphabetically by moduleCode (then moduleName)
    for (const level of levelMap.values()) {
      level.modules.sort((a, b) => {
        const aOrd = a.moduleOrderIndex ?? Number.MAX_SAFE_INTEGER;
        const bOrd = b.moduleOrderIndex ?? Number.MAX_SAFE_INTEGER;
        if (aOrd !== bOrd) return aOrd - bOrd;
        const aKey = (a.moduleCode ?? a.moduleName).toUpperCase();
        const bKey = (b.moduleCode ?? b.moduleName).toUpperCase();
        return aKey.localeCompare(bKey);
      });
    }
    // Sort unit groups by lesson flow first; fallback to persisted BE order.
    for (const level of levelMap.values()) {
      for (const mod of level.modules) {
        mod.units.sort((a, b) => {
          const aFirstSession = getUnitFirstSessionIndex(a);
          const bFirstSession = getUnitFirstSessionIndex(b);
          if (aFirstSession !== bFirstSession) {
            return aFirstSession - bFirstSession;
          }

          const aNaturalUnitNumber = getUnitNaturalNumber(a);
          const bNaturalUnitNumber = getUnitNaturalNumber(b);
          if (aNaturalUnitNumber !== bNaturalUnitNumber) {
            return aNaturalUnitNumber - bNaturalUnitNumber;
          }

          const aOrder =
            a.items.find((item) => typeof item.unitOrderIndex === "number")
              ?.unitOrderIndex ?? Number.MAX_SAFE_INTEGER;
          const bOrder =
            b.items.find((item) => typeof item.unitOrderIndex === "number")
              ?.unitOrderIndex ?? Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) return aOrder - bOrder;

          const beUnits = moduleUnitsMap[mod.moduleKey] ?? [];
          const aBeOrder =
            beUnits.find((u) => u.id === a.unitKey)?.orderIndex ??
            Number.MAX_SAFE_INTEGER;
          const bBeOrder =
            beUnits.find((u) => u.id === b.unitKey)?.orderIndex ??
            Number.MAX_SAFE_INTEGER;
          return aBeOrder - bBeOrder;
        });

        for (const unit of mod.units) {
          unit.items.sort(compareLessonsByBeOrder);
        }
        mod.orphans.sort((a, b) => {
          const aIdx = a.sessionIndex ?? Number.MAX_SAFE_INTEGER;
          const bIdx = b.sessionIndex ?? Number.MAX_SAFE_INTEGER;
          return aIdx - bIdx;
        });
      }
    }
    return Array.from(levelMap.values());
  }, [getUnitFirstSessionIndex, getUnitNaturalNumber, items, moduleUnitsMap]);

  if (!items.length) {
    return (
      <EmptyState
        title="Chưa có mẫu giáo án phù hợp"
        subtitle="Thử đổi bộ lọc hoặc nhập syllabus để tạo dữ liệu mới."
      />
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".doc,.docx"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !importTarget) return;
          setImporting(true);
          const res = await importLessonPlanTemplateWord(
            importTarget.moduleKey,
            file,
            { lessonPlanUnitId: importTarget.unitKey },
          );
          if (res.isSuccess && res.data?.lessonPlanTemplateId) {
            toast({
              title: "Import thành công",
              description: res.data.title ?? "Đã thêm bài vào unit.",
            });
            onRefresh();
          } else {
            toast({
              variant: "destructive",
              title: "Lỗi import Word",
              description: res.message ?? "Import thất bại.",
            });
          }
          setImporting(false);
          setImportTarget(null);
        }}
      />
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Danh sách mẫu giáo án</h2>
          <span className="text-sm text-gray-500">
            {items.length} mẫu · {levelGroups.length} cấp độ
          </span>
        </div>

        {/* Accordion */}
        <div className="divide-y divide-gray-100">
          {levelGroups.map((levelGroup) => {
            const isLevelOpen = expandedLevels.has(levelGroup.levelKey);
            return (
              <div key={levelGroup.levelKey}>
                {/* Level row */}
                <button
                  type="button"
                  onClick={() =>
                    toggleSet(
                      expandedLevels,
                      setExpandedLevels,
                      levelGroup.levelKey,
                    )
                  }
                  className="w-full flex items-center gap-3 px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left cursor-pointer"
                >
                  <ChevronRight
                    size={16}
                    className={cn(
                      "flex-shrink-0 transition-transform text-gray-400",
                      isLevelOpen && "rotate-90",
                    )}
                  />
                  <GraduationCap
                    size={17}
                    className="text-red-600 flex-shrink-0"
                  />
                  <span className="font-semibold text-gray-800 text-sm">
                    {levelGroup.levelName}
                  </span>
                  {levelGroup.programName && (
                    <span className="text-xs text-gray-400 font-normal">
                      · {levelGroup.programName}
                    </span>
                  )}
                  {(levelGroup.syllabusCode || levelGroup.syllabusVersion) && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                      <span>{levelGroup.syllabusCode || "Syllabus"}</span>
                      {levelGroup.syllabusVersion ? (
                        <span className="text-red-500">
                          {levelGroup.syllabusVersion}
                        </span>
                      ) : null}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-3 text-xs text-gray-400 font-medium whitespace-nowrap">
                    {levelGroup.levelId && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorderSessionOrders(levelGroup);
                        }}
                        className={`flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors ${reorderingLevelId === levelGroup.levelKey ? "opacity-50 pointer-events-none" : ""}`}
                        title="Cập nhật số thứ tự buổi cố định theo thứ tự hiện tại"
                      >
                        {reorderingLevelId === levelGroup.levelKey ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        Cập nhật thứ tự buổi
                      </span>
                    )}
                    {levelGroup.totalItems} mẫu · {levelGroup.modules.length}{" "}
                    module
                  </span>
                </button>

                {isLevelOpen && (
                  <div className="divide-y divide-gray-100">
                    <DndContext
                      sensors={lessonSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event;
                        if (!over || active.id === over.id) return;
                        const overrideKeys =
                          localModuleOrder[levelGroup.levelKey];
                        const currentKeys =
                          overrideKeys ??
                          levelGroup.modules.map((m) => m.moduleKey);
                        const oldIdx = currentKeys.indexOf(String(active.id));
                        const newIdx = currentKeys.indexOf(String(over.id));
                        if (oldIdx < 0 || newIdx < 0) return;
                        setLocalModuleOrder((prev) => ({
                          ...prev,
                          [levelGroup.levelKey]: arrayMove(
                            currentKeys,
                            oldIdx,
                            newIdx,
                          ),
                        }));
                      }}
                    >
                      <SortableContext
                        items={levelGroup.modules.map((m) => m.moduleKey)}
                        strategy={verticalListSortingStrategy}
                      >
                        {(() => {
                          const overrideKeys =
                            localModuleOrder[levelGroup.levelKey];
                          const displayedModules = overrideKeys
                            ? (overrideKeys
                                .map((k) =>
                                  levelGroup.modules.find(
                                    (m) => m.moduleKey === k,
                                  ),
                                )
                                .filter(Boolean) as typeof levelGroup.modules)
                            : levelGroup.modules;
                          return displayedModules.map((mod, modIdx) => {
                            const isModOpen = expandedModules.has(
                              mod.moduleKey,
                            );
                            return (
                              <SortableModuleAccordionItem
                                key={mod.moduleKey}
                                moduleKey={mod.moduleKey}
                                moduleName={mod.moduleName}
                                moduleCode={mod.moduleCode}
                                totalItems={mod.totalItems}
                                unitCount={mod.units.length}
                                orphanCount={mod.orphans.length}
                                modIdx={modIdx}
                                isOpen={isModOpen}
                                onToggle={() =>
                                  toggleSet(
                                    expandedModules,
                                    setExpandedModules,
                                    mod.moduleKey,
                                  )
                                }
                              >
                                {isModOpen && (
                                  <div className="divide-y divide-gray-50 border-l-2 border-red-100">
                                    <DndContext
                                      sensors={lessonSensors}
                                      collisionDetection={closestCenter}
                                      onDragEnd={async (event) => {
                                        const { active, over } = event;
                                        if (!over || active.id === over.id)
                                          return;
                                        const overrideKeys =
                                          localUnitOrder[mod.moduleKey];
                                        const currentKeys =
                                          overrideKeys ??
                                          mod.units.map((u) => u.unitKey);
                                        const oldIdx = currentKeys.indexOf(
                                          String(active.id),
                                        );
                                        const newIdx = currentKeys.indexOf(
                                          String(over.id),
                                        );
                                        if (oldIdx < 0 || newIdx < 0) return;
                                        const reorderedKeys = arrayMove(
                                          currentKeys,
                                          oldIdx,
                                          newIdx,
                                        );
                                        setLocalUnitOrder((prev) => ({
                                          ...prev,
                                          [mod.moduleKey]: reorderedKeys,
                                        }));
                                        const realItems = reorderedKeys
                                          .filter(
                                            (k) => !k.includes("__title__"),
                                          )
                                          .map((k, i) => ({
                                            id: k,
                                            orderIndex: i,
                                          }));
                                        if (realItems.length > 0) {
                                          await reorderLessonPlanUnits(
                                            mod.moduleKey,
                                            realItems,
                                          );
                                          const res = await getLessonPlanUnits(
                                            mod.moduleKey,
                                          );
                                          if (res.isSuccess)
                                            setModuleUnitsMap((prev) => ({
                                              ...prev,
                                              [mod.moduleKey]: res.data,
                                            }));
                                        }
                                      }}
                                    >
                                      <SortableContext
                                        items={mod.units.map((u) => u.unitKey)}
                                        strategy={verticalListSortingStrategy}
                                      >
                                        {(() => {
                                          const overrideKeys =
                                            localUnitOrder[mod.moduleKey];
                                          const displayedUnits = overrideKeys
                                            ? (overrideKeys
                                                .map((k) =>
                                                  mod.units.find(
                                                    (u) => u.unitKey === k,
                                                  ),
                                                )
                                                .filter(
                                                  Boolean,
                                                ) as typeof mod.units)
                                            : mod.units;
                                          return displayedUnits.map(
                                            (unitGroup) => {
                                              const isUnitOpen =
                                                expandedUnits.has(
                                                  unitGroup.unitKey,
                                                );
                                              return (
                                                <SortableUnitAccordionItem
                                                  key={unitGroup.unitKey}
                                                  unitGroup={unitGroup}
                                                  moduleKey={mod.moduleKey}
                                                  isOpen={isUnitOpen}
                                                  onToggle={() =>
                                                    toggleSet(
                                                      expandedUnits,
                                                      setExpandedUnits,
                                                      unitGroup.unitKey,
                                                    )
                                                  }
                                                  onChanged={async () => {
                                                    const res =
                                                      await getLessonPlanUnits(
                                                        mod.moduleKey,
                                                      );
                                                    if (res.isSuccess)
                                                      setModuleUnitsMap(
                                                        (prev) => ({
                                                          ...prev,
                                                          [mod.moduleKey]:
                                                            res.data,
                                                        }),
                                                      );
                                                  }}
                                                  onImportWord={
                                                    handleImportWordClick
                                                  }
                                                  importing={
                                                    importTarget?.unitKey ===
                                                      unitGroup.unitKey &&
                                                    importing
                                                  }
                                                >
                                                  {isUnitOpen &&
                                                    (() => {
                                                      const overrideIds =
                                                        localLessonOrder[
                                                          unitGroup.unitKey
                                                        ];
                                                      const displayItems =
                                                        overrideIds
                                                          ? (overrideIds
                                                              .map((id) =>
                                                                unitGroup.items.find(
                                                                  (it) =>
                                                                    it.id ===
                                                                    id,
                                                                ),
                                                              )
                                                              .filter(
                                                                Boolean,
                                                              ) as typeof unitGroup.items)
                                                          : unitGroup.items;
                                                      const isReal =
                                                        !unitGroup.isLegacy;

                                                      async function handleLessonDragEnd(
                                                        event: DragEndEvent,
                                                      ) {
                                                        const { active, over } =
                                                          event;
                                                        if (
                                                          !over ||
                                                          active.id === over.id
                                                        )
                                                          return;
                                                        const oldIdx =
                                                          displayItems.findIndex(
                                                            (it) =>
                                                              it.id ===
                                                              active.id,
                                                          );
                                                        const newIdx =
                                                          displayItems.findIndex(
                                                            (it) =>
                                                              it.id === over.id,
                                                          );
                                                        const reordered =
                                                          arrayMove(
                                                            displayItems,
                                                            oldIdx,
                                                            newIdx,
                                                          );
                                                        setLocalLessonOrder(
                                                          (prev) => ({
                                                            ...prev,
                                                            [unitGroup.unitKey]:
                                                              reordered.map(
                                                                (it) => it.id,
                                                              ),
                                                          }),
                                                        );
                                                        await reorderLessonsInUnit(
                                                          unitGroup.unitKey,
                                                          reordered.map(
                                                            (it, i) => ({
                                                              id: it.id,
                                                              orderIndexInUnit:
                                                                i,
                                                            }),
                                                          ),
                                                        );
                                                        // Auto-update sessionOrder across entire level (silent)
                                                        if (
                                                          levelGroup.levelId
                                                        ) {
                                                          const modKeys =
                                                            localModuleOrder[
                                                              levelGroup
                                                                .levelKey
                                                            ];
                                                          const orderedMods =
                                                            modKeys
                                                              ? (modKeys
                                                                  .map((k) =>
                                                                    levelGroup.modules.find(
                                                                      (m) =>
                                                                        m.moduleKey ===
                                                                        k,
                                                                    ),
                                                                  )
                                                                  .filter(
                                                                    Boolean,
                                                                  ) as typeof levelGroup.modules)
                                                              : levelGroup.modules;
                                                          const sessionItems: {
                                                            id: string;
                                                            sessionOrder: number;
                                                          }[] = [];
                                                          let order = 1;
                                                          for (const m of orderedMods) {
                                                            const uKeys =
                                                              localUnitOrder[
                                                                m.moduleKey
                                                              ];
                                                            const orderedUnits =
                                                              uKeys
                                                                ? (uKeys
                                                                    .map((k) =>
                                                                      m.units.find(
                                                                        (u) =>
                                                                          u.unitKey ===
                                                                          k,
                                                                      ),
                                                                    )
                                                                    .filter(
                                                                      Boolean,
                                                                    ) as typeof m.units)
                                                                : m.units;
                                                            for (const u of orderedUnits) {
                                                              const isThisUnit =
                                                                u.unitKey ===
                                                                unitGroup.unitKey;
                                                              const unitItems =
                                                                isThisUnit
                                                                  ? reordered
                                                                  : localLessonOrder[
                                                                        u
                                                                          .unitKey
                                                                      ]
                                                                    ? (localLessonOrder[
                                                                        u
                                                                          .unitKey
                                                                      ]
                                                                        .map(
                                                                          (
                                                                            id,
                                                                          ) =>
                                                                            u.items.find(
                                                                              (
                                                                                it,
                                                                              ) =>
                                                                                it.id ===
                                                                                id,
                                                                            ),
                                                                        )
                                                                        .filter(
                                                                          Boolean,
                                                                        ) as typeof u.items)
                                                                    : u.items;
                                                              for (const lesson of unitItems) {
                                                                sessionItems.push(
                                                                  {
                                                                    id: lesson.id,
                                                                    sessionOrder:
                                                                      order++,
                                                                  },
                                                                );
                                                              }
                                                            }
                                                            for (const orphan of m.orphans) {
                                                              sessionItems.push(
                                                                {
                                                                  id: orphan.id,
                                                                  sessionOrder:
                                                                    order++,
                                                                },
                                                              );
                                                            }
                                                          }
                                                          await reorderLessonPlanTemplateSessionOrders(
                                                            levelGroup.levelId,
                                                            sessionItems,
                                                          );
                                                          onRefresh();
                                                        }
                                                      }

                                                      return (
                                                        <div className="overflow-x-auto border-l-2 border-orange-100">
                                                          <DndContext
                                                            sensors={
                                                              lessonSensors
                                                            }
                                                            collisionDetection={
                                                              closestCenter
                                                            }
                                                            onDragEnd={
                                                              handleLessonDragEnd
                                                            }
                                                          >
                                                            <SortableContext
                                                              items={displayItems.map(
                                                                (it) => it.id,
                                                              )}
                                                              strategy={
                                                                verticalListSortingStrategy
                                                              }
                                                            >
                                                              <table className="w-full">
                                                                <tbody className="divide-y divide-gray-50">
                                                                  {displayItems.map(
                                                                    (item) => (
                                                                      <SortableLessonRow
                                                                        key={
                                                                          item.id
                                                                        }
                                                                        item={
                                                                          item
                                                                        }
                                                                        onOpenAttachment={
                                                                          onOpenAttachment
                                                                        }
                                                                        onOpenDetail={
                                                                          onOpenDetail
                                                                        }
                                                                        onEdit={
                                                                          onEdit
                                                                        }
                                                                        onDelete={
                                                                          handleDeleteLesson
                                                                        }
                                                                        isReal={
                                                                          isReal
                                                                        }
                                                                        onSessionOrderChange={
                                                                          handleSessionOrderChange
                                                                        }
                                                                      />
                                                                    ),
                                                                  )}
                                                                </tbody>
                                                              </table>
                                                            </SortableContext>
                                                          </DndContext>
                                                        </div>
                                                      );
                                                    })()}
                                                </SortableUnitAccordionItem>
                                              );
                                            },
                                          );
                                        })()}
                                      </SortableContext>
                                    </DndContext>
                                    {/* Orphan lessons — not yet assigned to a unit */}
                                    {mod.orphans.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-2 pl-14 pr-5 py-2 bg-orange-50/50 border-l-2 border-orange-300 text-xs text-orange-600 font-medium">
                                          <BookOpenCheck
                                            size={12}
                                            className="flex-shrink-0"
                                          />
                                          Chưa phân unit ({mod.orphans.length}{" "}
                                          bài)
                                        </div>
                                        <div className="overflow-x-auto border-l-2 border-orange-100">
                                          <table className="w-full">
                                            <tbody className="divide-y divide-gray-50">
                                              {mod.orphans.map((item) => (
                                                <tr
                                                  key={item.id}
                                                  className="hover:bg-orange-50/30 transition-colors"
                                                >
                                                  <td className="pl-16 pr-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-orange-400 flex items-center justify-center">
                                                        <BookOpenCheck
                                                          size={13}
                                                          className="text-white"
                                                        />
                                                      </div>
                                                      <div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                          {getTemplateDisplayTitle(
                                                            item,
                                                          )}
                                                        </div>
                                                        <div className="mt-0.5 text-xs text-gray-400">
                                                          {getTemplateDisplaySubtitle(
                                                            item,
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                      <CalendarDays
                                                        size={13}
                                                        className="text-orange-400"
                                                      />
                                                      <span>
                                                        Buổi{" "}
                                                        {item.sessionOrder ??
                                                          item.sessionIndex ??
                                                          "-"}
                                                      </span>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <div className="flex justify-end items-center gap-2.5">
                                                      {item.attachment && (
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            onOpenAttachment(
                                                              item.attachment,
                                                            )
                                                          }
                                                          className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                                                          title="Mở file"
                                                        >
                                                          <Paperclip
                                                            size={14}
                                                          />
                                                        </button>
                                                      )}
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          onOpenDetail(item)
                                                        }
                                                        className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                                        title="Xem chi tiết"
                                                      >
                                                        <Eye size={14} />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          onEdit(item)
                                                        }
                                                        className="text-gray-400 hover:text-amber-600 transition-colors cursor-pointer"
                                                        title="Chỉnh sửa"
                                                      >
                                                        <Pencil size={14} />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          handleDeleteLesson(
                                                            item,
                                                          )
                                                        }
                                                        className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                                        title="Xóa lesson"
                                                      >
                                                        <Trash2 size={14} />
                                                      </button>
                                                    </div>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </SortableModuleAccordionItem>
                            );
                          });
                        })()}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-red-600 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      Xóa vĩnh viễn lesson plan template
                    </h3>
                    <p className="text-sm text-red-50">
                      Thao tác này không thể hoàn tác.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (deletingId) return;
                    setDeleteTarget(null);
                    setDeleteConfirmText("");
                  }}
                  className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Backend sẽ xóa template này và xóa luôn các lesson plan thực tế
                đang reference template đó.
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">
                  {getTemplateDisplayTitle(deleteTarget)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {getTemplateDisplaySubtitle(deleteTarget)}
                </p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">
                  Nhập <span className="font-bold text-red-600">XOA</span> để
                  xác nhận
                </span>
                <input
                  value={deleteConfirmText}
                  onChange={(event) =>
                    setDeleteConfirmText(event.target.value)
                  }
                  placeholder="XOA"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold uppercase outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  autoFocus
                />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (deletingId) return;
                    setDeleteTarget(null);
                    setDeleteConfirmText("");
                  }}
                  className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  disabled={Boolean(deletingId)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmHardDeleteLesson}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    Boolean(deletingId) ||
                    deleteConfirmText.trim().toUpperCase() !== "XOA"
                  }
                >
                  {deletingId === deleteTarget.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Modern SyllabusView Component
function SyllabusView({
  scope,
  syllabus,
  items,
  templateMap,
  sharedTemplate,
  onOpenSessionSyllabus,
  onCreate,
  onEdit,
  onOpenPlanDetail,
  onOpenTemplateDetail,
  selectedSessionId,
}: {
  scope: WorkspaceScope;
  syllabus: ClassLessonPlanSyllabus | null;
  items: ClassLessonPlanSyllabusSession[];
  templateMap: Map<string, LessonPlanTemplate>;
  sharedTemplate?: LessonPlanTemplate;
  onOpenSessionSyllabus: (session: ClassLessonPlanSyllabusSession) => void;
  onCreate: (session: ClassLessonPlanSyllabusSession) => void;
  onEdit: (session: ClassLessonPlanSyllabusSession) => void;
  onOpenPlanDetail: (lessonPlanId: string) => void;
  onOpenTemplateDetail?: (templateId: string) => void;
  selectedSessionId?: string | null;
}) {
  if (!syllabus) {
    return (
      <EmptyState
        title="Chưa có syllabus"
        subtitle="Chọn một lớp để tải read model syllabus từ backend."
      />
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        title="Không có session phù hợp"
        subtitle="Thử đổi bộ lọc hoặc kiểm tra lớp này đã có session chưa."
      />
    );
  }

  const selectedSession = selectedSessionId
    ? items.find((s) => s.sessionId === selectedSessionId)
    : null;
  const linkedSessionIndices = items
    .filter((session) => hasSessionTemplateLinkage(session))
    .map(getModuleSessionDisplayIndex)
    .filter((index): index is number => Number.isFinite(index));
  const lastLinkedSessionIndex = linkedSessionIndices.length
    ? Math.max(...linkedSessionIndices)
    : null;

  return (
    <div className="space-y-5">
      {/* Session Detail Card - Only show if a session is selected */}
      {selectedSession && (
        <SessionDetailCard
          scope={scope}
          session={selectedSession}
          templateMap={templateMap}
          sharedTemplate={sharedTemplate}
          onOpenSessionSyllabus={onOpenSessionSyllabus}
          onCreate={onCreate}
          onEdit={onEdit}
          onOpenPlanDetail={onOpenPlanDetail}
          onOpenTemplateDetail={onOpenTemplateDetail}
          lastLinkedSessionIndex={lastLinkedSessionIndex}
        />
      )}
    </div>
  );
}

// Session Detail Card Component
function SessionDetailCard({
  scope,
  session,
  templateMap,
  sharedTemplate,
  onOpenSessionSyllabus,
  onCreate,
  onEdit,
  onOpenPlanDetail,
  onOpenTemplateDetail,
  lastLinkedSessionIndex,
}: {
  scope: WorkspaceScope;
  session: ClassLessonPlanSyllabusSession;
  templateMap: Map<string, LessonPlanTemplate>;
  sharedTemplate?: LessonPlanTemplate;
  onOpenSessionSyllabus: (session: ClassLessonPlanSyllabusSession) => void;
  onCreate: (session: ClassLessonPlanSyllabusSession) => void;
  onEdit: (session: ClassLessonPlanSyllabusSession) => void;
  onOpenPlanDetail: (lessonPlanId: string) => void;
  onOpenTemplateDetail?: (templateId: string) => void;
  lastLinkedSessionIndex?: number | null;
}) {
  const hasTemplateLinkage = hasSessionTemplateLinkage(session);
  const allowSharedTemplateFallback = Boolean(
    !session.templateId &&
      sharedTemplate?.id &&
      (session.templateTitle ||
        session.templateSyllabusContent ||
        session.plannedContent),
  );
  const linkedTemplate = session.templateId
    ? templateMap.get(session.templateId)
    : undefined;
  const fallbackTemplate = hasTemplateLinkage
    ? pickSessionFallbackTemplate(
        Array.from(templateMap.values()),
        session,
        allowSharedTemplateFallback ? sharedTemplate : undefined,
      )
    : undefined;
  const resolvedTemplate =
    linkedTemplate ||
    fallbackTemplate;
  const isSharedTemplateFallback = Boolean(
    !session.templateId &&
      fallbackTemplate?.id &&
      sharedTemplate?.id &&
      fallbackTemplate.id === sharedTemplate.id,
  );
  const templateBadgeLabel =
    session.templateId || !isSharedTemplateFallback
      ? "Có template"
      : "Template chung";
  const templateSubtitle =
    session.templateId || !isSharedTemplateFallback
      ? resolvedTemplate?.title
      : `${resolvedTemplate?.title || "Template chung"} • áp dụng toàn bộ buổi`;
  const templateHasStructuredContent = hasStructuredTemplateContent(
    resolvedTemplate,
  );
  const hasTemplate = Boolean(
    session.templateId ||
    session.templateSyllabusContent ||
    resolvedTemplate?.syllabusContent ||
    templateHasStructuredContent,
  );
  const hasReport = Boolean(session.actualContent);
  const isEditable = session.canEdit;
  const hasPlan = Boolean(session.lessonPlanId);
  const normalizedPlannedContent =
    !isTrivialPlannedContent(session.plannedContent) &&
    hasDisplayablePayload(session.plannedContent)
      ? session.plannedContent
      : null;
  const plannedContentFallback =
    session.templateSyllabusContent ||
    resolvedTemplate?.syllabusContent ||
    null;
  const plannedContentDisplay =
    normalizedPlannedContent || plannedContentFallback;
  const canDisplayPlannedContent = Boolean(
    plannedContentDisplay ||
      (!normalizedPlannedContent && templateHasStructuredContent),
  );
  const plannedContentSubtitle = normalizedPlannedContent
    ? "Giáo án sẽ được tạo hoặc cập nhật"
    : plannedContentFallback
      ? "Đang tham chiếu từ syllabus chuẩn"
      : "Giáo án sẽ được tạo hoặc cập nhật";
  const showMissingLinkageNotice =
    !hasReport &&
    !hasTemplate &&
    !canDisplayPlannedContent &&
    !hasTemplateLinkage;
  const displaySessionIndex = getModuleSessionDisplayIndex(session);
  const [contentModal, setContentModal] =
    useState<SessionContentModalKind | null>(null);
  const linkageCoverageMessage =
    lastLinkedSessionIndex && lastLinkedSessionIndex > 0
      ? `Dữ liệu lớp hiện mới có curriculum/lesson-plan linkage tới buổi ${lastLinkedSessionIndex}, nên buổi ${displaySessionIndex} chưa resolve được nội dung.`
      : "Backend chưa trả curriculum/lesson-plan linkage cho buổi này.";

  return (
    <div
      className={cn(
        "group rounded-3xl transition-all duration-300 overflow-hidden",
        hasReport
          ? "bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 shadow-lg hover:shadow-xl"
          : "bg-gradient-to-br from-white via-red-50/20 to-white shadow-md hover:shadow-xl",
      )}
    >


      {/* Session Header */}
      <div className="flex flex-col gap-5 border-b border-gray-100/50 px-7 py-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: Session Info & Badges */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-4">
            {/* Session Number Badge */}
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg ring-2 ring-red-500/20">
              <span className="text-xl font-bold text-white">
                {displaySessionIndex}
              </span>
            </div>

            {/* Session Title & Date */}
            <div className="pt-1">
              <h4 className="text-2xl font-bold text-gray-900">
                Buổi {displaySessionIndex}
              </h4>
              {normalizeDateValue(session.sessionDate) && (
                <p className="mt-1 text-sm font-medium text-gray-500 flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-gray-400" />
                  {formatDate(session.sessionDate, true)}
                </p>
              )}
            </div>
          </div>

          {/* Status Badges - Horizontal scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {isEditable && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 ring-1 ring-emerald-400/20">
                <Pencil size={12} />
                Có thể sửa
              </span>
            )}
            {hasReport && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 ring-1 ring-emerald-400/20">
                <CheckCircle2 size={12} />
                Đã báo cáo
              </span>
            )}
            {hasPlan && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200/60 ring-1 ring-blue-400/20">
                <FileText size={12} />
                Có giáo án
              </span>
            )}
            {hasTemplate && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-100 to-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 border border-purple-200/60 ring-1 ring-purple-400/20">
                <FolderOpen size={12} />
                {templateBadgeLabel}
              </span>
            )}
            {!hasReport && hasPlan && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200/60 ring-1 ring-amber-400/20">
                <Clock3 size={12} />
                Chưa báo cáo
              </span>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => onOpenSessionSyllabus(session)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300/60 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-md cursor-pointer"
          >
            <BookOpenCheck size="16" />
            Xem syllabus
          </button>

          {resolvedTemplate?.id && onOpenTemplateDetail && (
            <button
              type="button"
              onClick={() => onOpenTemplateDetail(resolvedTemplate.id)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300/60 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow-md cursor-pointer"
            >
              <FolderOpen size="16" />
              Template
            </button>
          )}

          {hasPlan ? (
            <button
              type="button"
              onClick={() => onOpenPlanDetail(session.lessonPlanId!)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300/60 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md cursor-pointer"
            >
              <Eye size="16" />
              Chi tiết
            </button>
          ) : null}

          {session.canEdit && (
            scope === "teacher" ? (
              <button
                type="button"
                onClick={() =>
                  session.lessonPlanId ? onEdit(session) : onCreate(session)
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer transition-all border border-transparent",
                  hasReport
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800",
                )}
              >
                <ClipboardPen size={15} />
                {hasReport ? "Cập nhật" : "Điền giáo án"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  session.lessonPlanId ? onEdit(session) : onCreate(session)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:from-red-700 hover:to-red-800 cursor-pointer transition-all border border-transparent"
              >
                {session.lessonPlanId ? (
                  <Pencil size={15} />
                ) : (
                  <FilePlus2 size={15} />
                )}
                {session.lessonPlanId ? "Sửa" : "Tạo"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Teacher Info - Modern Bar */}
      <div className="border-b border-gray-100/50 bg-gradient-to-r from-gray-50/60 to-transparent px-7 py-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-red-100 to-red-50 p-2 ring-1 ring-red-200/50">
              <Users size="15" className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500  tracking-wide">Giáo viên dự kiến</p>
              <p className="font-semibold text-gray-900">
                {session.plannedTeacherName || "—"}
              </p>
            </div>
          </div>
          {session.actualTeacherName && (
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 p-2 ring-1 ring-emerald-200/50">
                <Users size="15" className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500  tracking-wide">Giáo viên thực tế</p>
                <p className="font-semibold text-gray-900">
                  {session.actualTeacherName}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-7">
        <div className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setContentModal("syllabus")}
            className="group rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 transition group-hover:scale-105">
              <BookOpenCheck size={20} />
            </div>
            <div className="text-base font-bold text-gray-900">
              Syllabus chuẩn
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Xem khung syllabus của buổi học.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setContentModal("planned")}
            className="group rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700 transition group-hover:scale-105">
              <FileText size={20} />
            </div>
            <div className="text-base font-bold text-gray-900">
              Giáo án dự kiến
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Xem nội dung giáo án sẽ dùng cho buổi này.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setContentModal("actual")}
            className="group rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition group-hover:scale-105">
              <ClipboardPen size={20} />
            </div>
            <div className="text-base font-bold text-gray-900">
              Nội dung thực tế
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Xem báo cáo nội dung đã dạy thực tế.
            </div>
          </button>
        </div>
      </div>

      <div className="hidden">
        <div className="grid gap-5 lg:grid-cols-2">
          {(session.templateTitle ||
            resolvedTemplate?.title ||
            session.templateSyllabusContent ||
            resolvedTemplate?.syllabusContent ||
            templateHasStructuredContent) && (
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col ">
              {/* Title Header */}
              <div className="text-center px-8 py-4 bg-gradient-to-r from-purple-50 to-purple-50/50 border-b border-purple-200">
                <h3 className="text-lg font-bold text-gray-900">Syllabus chuẩn</h3>
              </div>

              {/* Document header */}
              <div className="px-8 pt-5 pb-5 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
                <div className="flex justify-between text-[11px] text-gray-400 font-mono mb-4 pb-3 border-b border-dashed border-gray-300">
                  <div className="space-y-1">
                    <div>Date of preparation: ......./......../20......</div>
                    <div>Date of teaching:&nbsp;&nbsp;&nbsp;&nbsp;......./......../20......</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div>Teacher: <span className="font-sans font-medium text-gray-600">..............</span></div>
                    <div>Class: ..............</div>
                  </div>
                </div>
                {(session.templateTitle || resolvedTemplate?.title) && (
                  <div className="text-center space-y-1.5 py-1">
                    <div className="text-sm font-bold tracking-[0.18em] text-purple-600">
                      {session.templateTitle || resolvedTemplate?.title}
                    </div>
                    <p className="text-sm text-gray-500">{templateSubtitle}</p>
                  </div>
                )}
              </div>

              {/* Content Sections */}
              <div className="divide-y divide-gray-100">
                {(() => {
                  const {
                    rawContent: syllabusContent,
                    objectives,
                    languageContent,
                    vocabulary,
                    grammar,
                    methodology,
                    teacherMaterials,
                    studentMaterials,
                    procedure,
                    evaluation,
                    homework,
                  } = extractLessonPlanSections(
                    session.templateSyllabusContent ||
                      resolvedTemplate?.syllabusContent ||
                      "",
                    resolvedTemplate,
                  );

                  return (
                    <>
                      {/* A. Objectives */}
                      {objectives && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-emerald-50/70 border-r border-emerald-100">
                            <span className="text-sm font-extrabold text-emerald-700">A</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold tracking-[0.15em] text-emerald-700 mb-2">Objectives</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(objectives)}</div>
                          </div>
                        </div>
                      )}

                      {/* B. Language content */}
                      {(languageContent || vocabulary || grammar) && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-blue-50/70 border-r border-blue-100">
                            <span className="text-sm font-extrabold text-blue-700">B</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold tracking-[0.15em] text-blue-700 mb-2">Language content</div>
                            {languageContent && <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6 mb-2">{formatDetailsText(languageContent)}</div>}
                            {vocabulary && <div className="text-sm text-gray-700 mb-1 whitespace-pre-wrap"><span className="font-semibold text-blue-600">Vocabulary: </span>{formatDetailsText(vocabulary)}</div>}
                            {grammar && <div className="text-sm text-gray-700 whitespace-pre-wrap"><span className="font-semibold text-blue-600">Grammar: </span>{formatDetailsText(grammar)}</div>}
                          </div>
                        </div>
                      )}

                      {/* C. Teaching methodology */}
                      {methodology && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-orange-50/70 border-r border-orange-100">
                            <span className="text-sm font-extrabold text-orange-700">C</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold tracking-[0.15em] text-orange-700 mb-2">Teaching methodology</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(methodology)}</div>
                          </div>
                        </div>
                      )}

                      {/* D. Materials for teacher */}
                      {teacherMaterials && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-amber-50/70 border-r border-amber-100">
                            <span className="text-sm font-extrabold text-amber-700">D</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700 mb-2">Materials for teacher</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(teacherMaterials)}</div>
                          </div>
                        </div>
                      )}

                      {/* E. Materials for students */}
                      {studentMaterials && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-yellow-50/70 border-r border-yellow-100">
                            <span className="text-sm font-extrabold text-yellow-600">E</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-yellow-700 mb-2">Materials for students</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(studentMaterials)}</div>
                          </div>
                        </div>
                      )}

                      {/* F. Procedure */}
                      {procedure && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-teal-50/70 border-r border-teal-100">
                            <span className="text-sm font-extrabold text-teal-700">F</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700 mb-3">Procedure</div>
                            {(() => {
                              const rows = parseProcedureRows(procedure);
                              if (rows.length === 0) {
                                return (
                                  <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{procedure}</div>
                                );
                              }
                              return (
                                <div className="rounded-xl border border-teal-200 overflow-hidden">
                                  <div className="grid grid-cols-[3rem_10rem_1fr] bg-teal-50 border-b border-teal-200 text-[11px] font-semibold text-teal-700">
                                    <div className="px-2 py-2 text-center border-r border-teal-200">Stages</div>
                                    <div className="px-3 py-2 text-center border-r border-teal-200">Step</div>
                                    <div className="px-3 py-2 text-left">Details</div>
                                  </div>
                                  <div className="divide-y divide-gray-100">
                                    {rows.map((row, i) => (
                                      <div key={i} className={cn("grid grid-cols-[3rem_10rem_1fr]", i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                                        <div className="px-2 py-3 text-center text-sm font-bold text-gray-600 border-r border-gray-100 flex items-start justify-center pt-3">{row.stage}</div>
                                        <div className="px-3 py-3 text-sm font-semibold text-gray-700 border-r border-gray-100 leading-5">{row.step}</div>
                                        <div className="px-3 py-3 text-sm text-gray-700 leading-6 whitespace-pre-wrap">{formatDetailsText(row.details)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* G. Evaluation */}
                      {evaluation && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-red-50/70 border-r border-red-100">
                            <span className="text-sm font-extrabold text-red-700">G</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-700 mb-2">Evaluation</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(evaluation)}</div>
                          </div>
                        </div>
                      )}

                      {/* H. Homework */}
                      {homework && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-pink-50/70 border-r border-pink-100">
                            <span className="text-sm font-extrabold text-pink-700">H</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-pink-700 mb-2">Homework</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(homework)}</div>
                          </div>
                        </div>
                      )}

                      {/* Fallback for unstructured content */}
                      {!objectives && !languageContent && !vocabulary && !grammar && !methodology && !teacherMaterials && !studentMaterials && !procedure && !evaluation && !homework && (
                        (() => {
                          // Parse plain text content for sections using keyword positions
                          const parseContentSections = (text: string) => {
                            const sections: Record<string, string> = {};
                            
                            // Define section keywords and their order
                            const sectionKeywords = [
                              { key: 'objectives', keywords: ['objectives', 'by the end of the lesson'] },
                              { key: 'language', keywords: ['language content:', 'vocabulary:', 'grammar:'] },
                              { key: 'methodology', keywords: ['teaching methodology', 'methodology'] },
                              { key: 'teacherMaterials', keywords: ['materials for teacher'] },
                              { key: 'studentMaterials', keywords: ['materials for students', 'materials for student'] },
                              { key: 'procedure', keywords: ['procedure', 'stages |', 'stage'] },
                              { key: 'evaluation', keywords: ['evaluation', 'assessment'] }
                            ];
                            
                            // Find all section positions
                            const sectionPositions: Array<{key: string; start: number; keyword: string}> = [];
                            
                            for (const section of sectionKeywords) {
                              for (const keyword of section.keywords) {
                                const index = text.toLowerCase().indexOf(keyword.toLowerCase());
                                if (index !== -1) {
                                  sectionPositions.push({key: section.key, start: index, keyword});
                                  break; // Use first matching keyword
                                }
                              }
                            }
                            
                            // Sort by position
                            sectionPositions.sort((a, b) => a.start - b.start);
                            
                            // Extract content for each section
                            for (let i = 0; i < sectionPositions.length; i++) {
                              const current = sectionPositions[i];
                              const next = sectionPositions[i + 1];
                              const endPos = next ? next.start : text.length;
                              const content = text.substring(current.start, endPos).trim();
                              
                              // Remove the keyword from the beginning
                              const cleanedContent = content.replace(new RegExp(`^${current.keyword}[:\\s]*`, 'i'), '').trim();
                              
                              if (cleanedContent) {
                                sections[current.key] = cleanedContent;
                              }
                            }
                            
                            return sections;
                          };
                          
                          const parsedSections = parseContentSections(syllabusContent);
                          const hasAnySections = Object.values(parsedSections).some(v => v.trim());
                          
                          if (hasAnySections) {
                            return (
                              <>
                                {parsedSections.objectives && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-emerald-50/70 border-r border-emerald-100">
                                      <span className="text-sm font-extrabold text-emerald-700">A</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold tracking-[0.15em] text-emerald-700 mb-2">Objectives</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.objectives)}</div>
                                    </div>
                                  </div>
                                )}

                                {parsedSections.language && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-blue-50/70 border-r border-blue-100">
                                      <span className="text-sm font-extrabold text-blue-700">B</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold tracking-[0.15em] text-blue-700 mb-2">Language content</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.language)}</div>
                                    </div>
                                  </div>
                                )}

                                {parsedSections.methodology && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-orange-50/70 border-r border-orange-100">
                                      <span className="text-sm font-extrabold text-orange-700">C</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold tracking-[0.15em] text-orange-700 mb-2">Teaching methodology</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.methodology)}</div>
                                    </div>
                                  </div>
                                )}

                                {parsedSections.teacherMaterials && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-amber-50/70 border-r border-amber-100">
                                      <span className="text-sm font-extrabold text-amber-700">D</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700 mb-2">Materials for teacher</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.teacherMaterials)}</div>
                                    </div>
                                  </div>
                                )}

                                {parsedSections.studentMaterials && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-yellow-50/70 border-r border-yellow-100">
                                      <span className="text-sm font-extrabold text-yellow-600">E</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-yellow-700 mb-2">Materials for students</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.studentMaterials)}</div>
                                    </div>
                                  </div>
                                )}

                                {parsedSections.procedure && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-teal-50/70 border-r border-teal-100">
                                      <span className="text-sm font-extrabold text-teal-700">F</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700 mb-3">Procedure</div>
                                      {(() => {
                                        const rows = parseProcedureRows(parsedSections.procedure);
                                        if (rows.length === 0) {
                                          return (
                                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{parsedSections.procedure}</div>
                                          );
                                        }
                                        return (
                                          <div className="rounded-xl border border-teal-200 overflow-hidden">
                                            <div className="grid grid-cols-[3rem_10rem_1fr] bg-teal-50 border-b border-teal-200 text-[11px] font-semibold text-teal-700">
                                              <div className="px-2 py-2 text-center border-r border-teal-200">Stages</div>
                                              <div className="px-3 py-2 text-center border-r border-teal-200">Step</div>
                                              <div className="px-3 py-2 text-left">Details</div>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                              {rows.map((row, i) => (
                                                <div key={i} className={cn("grid grid-cols-[3rem_10rem_1fr]", i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                                                  <div className="px-2 py-3 text-center text-sm font-bold text-gray-600 border-r border-gray-100 flex items-start justify-center pt-3">{row.stage}</div>
                                                  <div className="px-3 py-3 text-sm font-semibold text-gray-700 border-r border-gray-100 leading-5">{row.step}</div>
                                                  <div className="px-3 py-3 text-sm text-gray-700 leading-6 whitespace-pre-wrap">{formatDetailsText(row.details)}</div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {parsedSections.evaluation && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-red-50/70 border-r border-red-100">
                                      <span className="text-sm font-extrabold text-red-700">G</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-700 mb-2">Evaluation</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.evaluation)}</div>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          } else {
                            return (
                              <div className="px-6 py-4">
                                <div className="text-sm text-gray-700 leading-6">
                                  {syllabusContent || 'Chưa có nội dung template.'}
                                </div>
                              </div>
                            );
                          }
                        })()
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Document-style Planned Content Card */}
          {canDisplayPlannedContent ? (
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col ">
              {/* Title Header */}
              <div className="text-center px-8 py-4 bg-gradient-to-r from-red-50 to-red-50/50 border-b border-red-200">
                <h3 className="text-lg font-bold text-gray-900">Giáo án Dự kiến</h3>
              </div>

              {/* Document header */}
              <div className="px-8 pt-5 pb-5 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
                <div className="flex justify-between text-[11px] text-gray-400 font-mono mb-4 pb-3 border-b border-dashed border-gray-300">
                  <div className="space-y-1">
                    <div>Date of preparation: ......./......../20......</div>
                    <div>Date of teaching:&nbsp;&nbsp;&nbsp;&nbsp;......./......../20......</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div>Teacher: <span className="font-sans font-medium text-gray-600">..............</span></div>
                    <div>Class: ..............</div>
                  </div>
                </div>
                {(session.templateTitle || resolvedTemplate?.title) && (
                  <div className="text-center space-y-1.5 py-1">
                    <div className="text-sm font-bold tracking-[0.18em] text-red-600">
                      {session.templateTitle || resolvedTemplate?.title}
                    </div>
                    <p className="text-sm text-gray-500">{plannedContentSubtitle}</p>
                  </div>
                )}
              </div>

              {/* Content Sections */}
              <div className="divide-y divide-gray-100">
                {(() => {
                  const {
                    rawContent: plannedRawContent,
                    objectives,
                    languageContent,
                    vocabulary,
                    grammar,
                    methodology,
                    teacherMaterials,
                    studentMaterials,
                    procedure,
                    evaluation,
                    homework,
                  } = extractLessonPlanSections(
                    plannedContentDisplay,
                    normalizedPlannedContent ? null : resolvedTemplate,
                  );

                  return (
                    <>
                      {/* A. Objectives */}
                      {objectives && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-emerald-50/70 border-r border-emerald-100">
                            <span className="text-sm font-extrabold text-emerald-700">A</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold tracking-[0.15em] text-emerald-700 mb-2">Objectives</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(objectives)}</div>
                          </div>
                        </div>
                      )}

                      {/* B. Language content */}
                      {(languageContent || vocabulary || grammar) && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-blue-50/70 border-r border-blue-100">
                            <span className="text-sm font-extrabold text-blue-700">B</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold tracking-[0.15em] text-blue-700 mb-2">Language content</div>
                            {languageContent && <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6 mb-2">{formatDetailsText(languageContent)}</div>}
                            {vocabulary && <div className="text-sm text-gray-700 mb-1 whitespace-pre-wrap"><span className="font-semibold text-blue-600">Vocabulary: </span>{formatDetailsText(vocabulary)}</div>}
                            {grammar && <div className="text-sm text-gray-700 whitespace-pre-wrap"><span className="font-semibold text-blue-600">Grammar: </span>{formatDetailsText(grammar)}</div>}
                          </div>
                        </div>
                      )}

                      {/* C. Teaching methodology */}
                      {methodology && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-orange-50/70 border-r border-orange-100">
                            <span className="text-sm font-extrabold text-orange-700">C</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold tracking-[0.15em] text-orange-700 mb-2">Teaching methodology</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(methodology)}</div>
                          </div>
                        </div>
                      )}

                      {/* D. Materials for teacher */}
                      {teacherMaterials && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-amber-50/70 border-r border-amber-100">
                            <span className="text-sm font-extrabold text-amber-700">D</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700 mb-2">Materials for teacher</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(teacherMaterials)}</div>
                          </div>
                        </div>
                      )}

                      {/* E. Materials for students */}
                      {studentMaterials && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-yellow-50/70 border-r border-yellow-100">
                            <span className="text-sm font-extrabold text-yellow-600">E</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-yellow-700 mb-2">Materials for students</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(studentMaterials)}</div>
                          </div>
                        </div>
                      )}

                      {/* F. Procedure */}
                      {procedure && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-teal-50/70 border-r border-teal-100">
                            <span className="text-sm font-extrabold text-teal-700">F</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700 mb-3">Procedure</div>
                            {(() => {
                              const rows = parseProcedureRows(procedure);
                              if (rows.length === 0) {
                                return (
                                  <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{procedure}</div>
                                );
                              }
                              return (
                                <div className="rounded-xl border border-teal-200 overflow-hidden">
                                  <div className="grid grid-cols-[3rem_10rem_1fr] bg-teal-50 border-b border-teal-200 text-[11px] font-semibold text-teal-700">
                                    <div className="px-2 py-2 text-center border-r border-teal-200">Stages</div>
                                    <div className="px-3 py-2 text-center border-r border-teal-200">Step</div>
                                    <div className="px-3 py-2 text-left">Details</div>
                                  </div>
                                  <div className="divide-y divide-gray-100">
                                    {rows.map((row, i) => (
                                      <div key={i} className={cn("grid grid-cols-[3rem_10rem_1fr]", i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                                        <div className="px-2 py-3 text-center text-sm font-bold text-gray-600 border-r border-gray-100 flex items-start justify-center pt-3">{row.stage}</div>
                                        <div className="px-3 py-3 text-sm font-semibold text-gray-700 border-r border-gray-100 leading-5">{row.step}</div>
                                        <div className="px-3 py-3 text-sm text-gray-700 leading-6 whitespace-pre-wrap">{formatDetailsText(row.details)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* G. Evaluation */}
                      {evaluation && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-red-50/70 border-r border-red-100">
                            <span className="text-sm font-extrabold text-red-700">G</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-700 mb-2">Evaluation</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(evaluation)}</div>
                          </div>
                        </div>
                      )}

                      {/* H. Homework */}
                      {homework && (
                        <div className="flex">
                          <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-pink-50/70 border-r border-pink-100">
                            <span className="text-sm font-extrabold text-pink-700">H</span>
                          </div>
                          <div className="flex-1 px-6 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-pink-700 mb-2">Homework</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(homework)}</div>
                          </div>
                        </div>
                      )}

                      {/* Fallback for unstructured content */}
                      {!objectives && !languageContent && !vocabulary && !grammar && !methodology && !teacherMaterials && !studentMaterials && !procedure && !evaluation && !homework && (
                        (() => {
                          // Parse plain text content for sections using keyword positions
                          const parseContentSections = (text: string) => {
                            const sections: Record<string, string> = {};
                            
                            // Define section keywords and their order
                            const sectionKeywords = [
                              { key: 'objectives', keywords: ['objectives', 'by the end of the lesson'] },
                              { key: 'language', keywords: ['language content:', 'vocabulary:', 'grammar:'] },
                              { key: 'methodology', keywords: ['teaching methodology', 'methodology'] },
                              { key: 'teacherMaterials', keywords: ['materials for teacher'] },
                              { key: 'studentMaterials', keywords: ['materials for students', 'materials for student'] },
                              { key: 'procedure', keywords: ['procedure', 'stages |', 'stage'] },
                              { key: 'evaluation', keywords: ['evaluation', 'assessment'] }
                            ];
                            
                            // Find all section positions
                            const sectionPositions: Array<{key: string; start: number; keyword: string}> = [];
                            
                            for (const section of sectionKeywords) {
                              for (const keyword of section.keywords) {
                                const index = text.toLowerCase().indexOf(keyword.toLowerCase());
                                if (index !== -1) {
                                  sectionPositions.push({key: section.key, start: index, keyword});
                                  break; // Use first matching keyword
                                }
                              }
                            }
                            
                            // Sort by position
                            sectionPositions.sort((a, b) => a.start - b.start);
                            
                            // Extract content for each section
                            for (let i = 0; i < sectionPositions.length; i++) {
                              const current = sectionPositions[i];
                              const next = sectionPositions[i + 1];
                              const endPos = next ? next.start : text.length;
                              const content = text.substring(current.start, endPos).trim();
                              
                              // Remove the keyword from the beginning
                              const cleanedContent = content.replace(new RegExp(`^${current.keyword}[:\\s]*`, 'i'), '').trim();
                              
                              if (cleanedContent) {
                                sections[current.key] = cleanedContent;
                              }
                            }
                            
                            return sections;
                          };
                          
                          const parsedSections = parseContentSections(plannedRawContent);
                          const hasAnySections = Object.values(parsedSections).some(v => v.trim());
                          
                          if (hasAnySections) {
                            return (
                              <>
                                {parsedSections.objectives && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-emerald-50/70 border-r border-emerald-100">
                                      <span className="text-sm font-extrabold text-emerald-700">A</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold tracking-[0.15em] text-emerald-700 mb-2">Objectives</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.objectives)}</div>
                                    </div>
                                  </div>
                                )}

                                {parsedSections.language && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-blue-50/70 border-r border-blue-100">
                                      <span className="text-sm font-extrabold text-blue-700">B</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold tracking-[0.15em] text-blue-700 mb-2">Language content</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.language)}</div>
                                    </div>
                                  </div>
                                )}

                                {parsedSections.methodology && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-orange-50/70 border-r border-orange-100">
                                      <span className="text-sm font-extrabold text-orange-700">C</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold tracking-[0.15em] text-orange-700 mb-2">Teaching methodology</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.methodology)}</div>
                                    </div>
                                  </div>
                                )}

                                {parsedSections.teacherMaterials && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-amber-50/70 border-r border-amber-100">
                                      <span className="text-sm font-extrabold text-amber-700">D</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700 mb-2">Materials for teacher</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.teacherMaterials)}</div>
                                    </div>
                                  </div>
                                )}

                                {parsedSections.studentMaterials && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-yellow-50/70 border-r border-yellow-100">
                                      <span className="text-sm font-extrabold text-yellow-600">E</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-yellow-700 mb-2">Materials for students</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.studentMaterials)}</div>
                                    </div>
                                  </div>
                                )}

                                {parsedSections.procedure && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-teal-50/70 border-r border-teal-100">
                                      <span className="text-sm font-extrabold text-teal-700">F</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700 mb-3">Procedure</div>
                                      {(() => {
                                        const rows = parseProcedureRows(parsedSections.procedure);
                                        if (rows.length === 0) {
                                          return (
                                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{parsedSections.procedure}</div>
                                          );
                                        }
                                        return (
                                          <div className="rounded-xl border border-teal-200 overflow-hidden">
                                            <div className="grid grid-cols-[3rem_10rem_1fr] bg-teal-50 border-b border-teal-200 text-[11px] font-semibold text-teal-700">
                                              <div className="px-2 py-2 text-center border-r border-teal-200">Stages</div>
                                              <div className="px-3 py-2 text-center border-r border-teal-200">Step</div>
                                              <div className="px-3 py-2 text-left">Details</div>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                              {rows.map((row, i) => (
                                                <div key={i} className={cn("grid grid-cols-[3rem_10rem_1fr]", i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                                                  <div className="px-2 py-3 text-center text-sm font-bold text-gray-600 border-r border-gray-100 flex items-start justify-center pt-3">{row.stage}</div>
                                                  <div className="px-3 py-3 text-sm font-semibold text-gray-700 border-r border-gray-100 leading-5">{row.step}</div>
                                                  <div className="px-3 py-3 text-sm text-gray-700 leading-6 whitespace-pre-wrap">{formatDetailsText(row.details)}</div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {parsedSections.evaluation && (
                                  <div className="flex">
                                    <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-red-50/70 border-r border-red-100">
                                      <span className="text-sm font-extrabold text-red-700">G</span>
                                    </div>
                                    <div className="flex-1 px-6 py-4">
                                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-700 mb-2">Evaluation</div>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{formatDetailsText(parsedSections.evaluation)}</div>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          }
                          
                          // If no sections detected, show as plain text
                          return (
                            <div className="px-8 py-6">
                              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{plannedContentDisplay}</div>
                            </div>
                          );
                        })()
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <ContentCard
              title="Giáo án dự kiến"
              subtitle={plannedContentSubtitle}
              icon={<FileText size="18" />}
              gradient="from-red-50/80 to-white"
              borderColor="red"
            >
              <StructuredContent
                value={plannedContentDisplay}
                placeholder="Chưa có nội dung dự kiến."
              />
            </ContentCard>
          )}

          {showMissingLinkageNotice ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900 shadow-sm lg:col-span-2">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                  <XCircle size={16} />
                </div>
                <div>
                  <div className="font-semibold">
                    Buổi này chưa được backend gắn module hoặc template.
                  </div>
                  <p className="mt-1 leading-6 text-amber-800">
                    {linkageCoverageMessage}
                  </p>
                  <p className="mt-1 leading-6 text-amber-800">
                    Payload hiện tại của session không có moduleId, sessionIndexInModule,
                    templateId hay plannedContent, nên FE không thể xác định đúng syllabus
                    hoặc giáo án cho buổi này.
                  </p>
                  <p className="mt-2 text-xs text-amber-700">
                    Session ID: {session.sessionId}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <ContentCard
            title={hasReport ? "Báo cáo buổi dạy" : "Nội dung thực tế"}
            subtitle={
              hasReport && session.actualTeacherName
                ? `Giáo viên: ${session.actualTeacherName}`
                : "Nội dung đã dạy thực tế"
            }
            icon={<ClipboardPen size="18" />}
            gradient={
              hasReport ? "from-emerald-50/80 to-white" : "from-gray-50/80 to-white"
            }
            borderColor={hasReport ? "emerald" : "gray"}
            badge={
              hasReport ? { text: "Đã báo cáo", color: "emerald" } : undefined
            }
          >
            <StructuredContent
              value={session.actualContent}
              placeholder="Chưa có nội dung thực tế."
            />
          </ContentCard>

          {(session.actualHomework || session.teacherNotes) && (
            <ContentCard
              title="Bài tập & Ghi chú"
              subtitle="Sau buổi học"
              icon={<Paperclip size="18" />}
              gradient="from-amber-50/80 to-white"
              borderColor="amber"
            >
              <div className="space-y-4">
                {session.actualHomework && (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-widest text-amber-700 uppercase">
                      <ListChecks size={14} className="text-amber-600" />
                      Bài tập về nhà
                    </div>
                    <StructuredContent
                      value={session.actualHomework}
                      placeholder=""
                    />
                  </div>
                )}
                {session.teacherNotes && (
                  <div className={session.actualHomework ? "border-t border-amber-200/50 pt-4" : ""}>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-widest text-amber-700 uppercase">
                      <Lightbulb size={14} className="text-amber-600" />
                      Ghi chú giáo viên
                    </div>
                    <StructuredContent
                      value={session.teacherNotes}
                      placeholder=""
                    />
                  </div>
                )}
              </div>
            </ContentCard>
          )}
        </div>
      </div>
      {contentModal ? (
        <SessionContentModal
          kind={contentModal}
          session={session}
          resolvedTemplate={resolvedTemplate}
          templateSubtitle={templateSubtitle}
          plannedContentDisplay={plannedContentDisplay}
          plannedContentSubtitle={plannedContentSubtitle}
          hasReport={hasReport}
          onClose={() => setContentModal(null)}
        />
      ) : null}
    </div>
  );
}

function SessionContentModal({
  kind,
  session,
  resolvedTemplate,
  templateSubtitle,
  plannedContentDisplay,
  plannedContentSubtitle,
  hasReport,
  onClose,
}: {
  kind: SessionContentModalKind;
  session: ClassLessonPlanSyllabusSession;
  resolvedTemplate?: LessonPlanTemplate;
  templateSubtitle?: string;
  plannedContentDisplay?: string | null;
  plannedContentSubtitle?: string;
  hasReport: boolean;
  onClose: () => void;
}) {
  const displaySessionIndex = getModuleSessionDisplayIndex(session);
  const modalConfig: Record<
    SessionContentModalKind,
    { title: string; subtitle: string; icon: LucideIcon }
  > = {
    syllabus: {
      title: "Syllabus chuẩn",
      subtitle: `Buổi ${displaySessionIndex} • ${templateSubtitle || "Khung syllabus chuẩn"}`,
      icon: BookOpenCheck,
    },
    planned: {
      title: "Giáo án dự kiến",
      subtitle: `Buổi ${displaySessionIndex} • ${plannedContentSubtitle || "Nội dung dự kiến"}`,
      icon: FileText,
    },
    actual: {
      title: "Nội dung thực tế",
      subtitle: hasReport
        ? `Buổi ${displaySessionIndex} • Đã báo cáo`
        : `Buổi ${displaySessionIndex} • Chưa có báo cáo`,
      icon: ClipboardPen,
    },
  };
  const config = modalConfig[kind];
  const syllabusTemplateForDisplay = resolvedTemplate
    ? {
        ...resolvedTemplate,
        syllabusContent:
          resolvedTemplate.syllabusContent ??
          session.templateSyllabusContent ??
          null,
      }
    : null;
  const plannedTemplateForDisplay = plannedContentDisplay?.trim()
    ? {
        ...(resolvedTemplate ?? {}),
        id: resolvedTemplate?.id ?? session.templateId ?? session.sessionId,
        title:
          session.templateTitle ??
          resolvedTemplate?.title ??
          `Buổi ${displaySessionIndex}`,
        sessionIndex:
          resolvedTemplate?.sessionIndex ??
          session.sessionIndexInModule ??
          session.sessionIndex ??
          displaySessionIndex,
        syllabusId: resolvedTemplate?.syllabusId ?? session.syllabusId ?? null,
        syllabusCode: resolvedTemplate?.syllabusCode ?? session.syllabusCode ?? null,
        syllabusVersion:
          resolvedTemplate?.syllabusVersion ?? session.syllabusVersion ?? null,
        syllabusTitle:
          resolvedTemplate?.syllabusTitle ?? session.syllabusTitle ?? null,
        moduleId: resolvedTemplate?.moduleId ?? session.moduleId ?? null,
        moduleCode: resolvedTemplate?.moduleCode ?? session.moduleCode ?? null,
        moduleName: resolvedTemplate?.moduleName ?? session.moduleName ?? null,
        syllabusContent: plannedContentDisplay,
      }
    : resolvedTemplate && hasStructuredTemplateContent(resolvedTemplate)
      ? resolvedTemplate
      : null;

  return (
    <ModalFrame
      title={config.title}
      subtitle={config.subtitle}
      icon={config.icon}
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      <div className="max-h-[78vh] overflow-y-auto bg-gray-50 p-5">
        {kind === "syllabus" ? (
          syllabusTemplateForDisplay ? (
            <LessonPlanTemplateDocument template={syllabusTemplateForDisplay} />
          ) : (
            <ContentPanel
              title="Syllabus chuẩn"
              value={session.templateSyllabusContent}
              accent="text-purple-700"
            />
          )
        ) : null}

        {kind === "planned" ? (
          plannedTemplateForDisplay ? (
            <LessonPlanTemplateDocument template={plannedTemplateForDisplay} />
          ) : (
          <ContentPanel
            title="Giáo án dự kiến"
            subtitle={plannedContentSubtitle}
            value={plannedContentDisplay}
            accent="text-red-700"
          />
          )
        ) : null}

        {kind === "actual" ? (
          <div className="space-y-4">
            <ContentPanel
              title={hasReport ? "Báo cáo buổi dạy" : "Nội dung thực tế"}
              subtitle={
                hasReport && session.actualTeacherName
                  ? `Giáo viên: ${session.actualTeacherName}`
                  : "Nội dung đã dạy thực tế"
              }
              value={session.actualContent}
              accent={hasReport ? "text-emerald-700" : "text-gray-700"}
            />
            {session.actualHomework ? (
              <ContentPanel
                title="Bài tập về nhà"
                value={session.actualHomework}
                accent="text-amber-700"
              />
            ) : null}
            {session.teacherNotes ? (
              <ContentPanel
                title="Ghi chú giáo viên"
                value={session.teacherNotes}
                accent="text-amber-700"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </ModalFrame>
  );
}

// Content Card Component
function ContentCard({
  title,
  subtitle,
  icon,
  children,
  gradient,
  borderColor,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  gradient: string;
  borderColor: "red" | "purple" | "emerald" | "amber" | "gray";
  badge?: { text: string; color: "emerald" | "red" | "amber" };
}) {
  const borderColors = {
    red: "border-red-100 hover:border-red-200",
    purple: "border-purple-100 hover:border-purple-200",
    emerald: "border-emerald-100 hover:border-emerald-200",
    amber: "border-amber-100 hover:border-amber-200",
    gray: "border-gray-100 hover:border-gray-200",
  };

  const badgeColors = {
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br p-4 transition-all duration-200 hover:shadow-md",
        borderColors[borderColor],
        gradient,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-lg p-1.5",
              borderColor === "red" && "bg-red-100 text-red-600",
              borderColor === "purple" && "bg-purple-100 text-purple-600",
              borderColor === "emerald" && "bg-emerald-100 text-emerald-600",
              borderColor === "amber" && "bg-amber-100 text-amber-600",
              borderColor === "gray" && "bg-gray-100 text-gray-600",
            )}
          >
            {icon}
          </div>
          <div>
            <h5 className="font-semibold text-gray-900">{title}</h5>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              badgeColors[badge.color],
            )}
          >
            {badge.text}
          </span>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto">{children}</div>
    </div>
  );
}

function TemplateFormModal({
  initialValue,
  programOptions,
  existingTemplates,
  defaultProgramId,
  onClose,
  onSubmit,
}: {
  initialValue: LessonPlanTemplate | null;
  programOptions: Option[];
  existingTemplates: LessonPlanTemplate[];
  defaultProgramId?: string;
  onClose: () => void;
  onSubmit: (
    payload: {
      programId: string;
      level: string;
      title: string;
      sessionIndex: number;
      syllabusMetadata?: string | null;
      syllabusContent?: string | null;
      sourceFileName?: string | null;
      attachment?: string | null;
      isActive?: boolean;
    },
    file: File | null,
  ) => Promise<void>;
}) {
  const metadataSeed = asObject(
    parseJsonContent(initialValue?.syllabusMetadata),
  );
  const contentSeed = asObject(parseJsonContent(initialValue?.syllabusContent));
  const parsedMetadataLinesObject = parseMetadataFromLinesObject(metadataSeed);
  // Fallback: if stored as plain text (non-JSON), attempt structured parse.
  // Also try to extract metadata from syllabusContent when syllabusMetadata is absent
  // (some templates were imported with all data in syllabusContent).
  const parsedRawMetadata = !metadataSeed
    ? ((initialValue?.syllabusMetadata
        ? parsePlainMetadataText(initialValue.syllabusMetadata)
        : null) ??
      (!contentSeed && initialValue?.syllabusContent
        ? parsePlainMetadataText(initialValue.syllabusContent)
        : null))
    : null;
  // rawContent is non-null only when syllabusContent is plain text AND parsePlainMetadataText
  // couldn't extract structured metadata from it (i.e., it's genuinely unstructured content).
  const rawContent =
    !contentSeed && initialValue?.syllabusContent?.trim() && !parsedRawMetadata
      ? initialValue.syllabusContent.trim()
      : null;
  const initialProgramId = initialValue?.programId || defaultProgramId || "";
  const isEdit = Boolean(initialValue);

  const [programId, setProgramId] = useState(initialProgramId);
  const [level, setLevel] = useState(initialValue?.level || "");
  const [title, setTitle] = useState(initialValue?.title || "");
  const [sessionIndex, setSessionIndex] = useState(
    initialValue?.sessionIndex || 1,
  );

  // Metadata fields
  const [dayLabel, setDayLabel] = useState(
    pickStringValue(metadataSeed, ["day", "days", "scheduleDays"]) ||
      parsedMetadataLinesObject?.day ||
      parsedRawMetadata?.day ||
      "",
  );
  const [durationLabel, setDurationLabel] = useState(
    pickStringValue(metadataSeed, ["duration"]) ||
      parsedMetadataLinesObject?.duration ||
      parsedRawMetadata?.duration ||
      "",
  );
  const [generalInformation, setGeneralInformation] = useState(
    pickStringValue(metadataSeed, [
      "generalInformation",
      "generalInfo",
      "description",
    ]) ||
      parsedMetadataLinesObject?.generalInformation ||
      parsedRawMetadata?.generalInformation ||
      "",
  );
  const initialTeachingMaterialsText =
    linesToTextarea(metadataSeed?.teachingMaterials) ||
    parsedMetadataLinesObject?.teachingMaterialsText ||
    parsedRawMetadata?.teachingMaterialsText ||
    "";
  const [teachingMaterialDrafts, setTeachingMaterialDrafts] = useState<
    TeachingMaterialDraft[]
  >(() => parseTeachingMaterialsTextToDrafts(initialTeachingMaterialsText));
  const [teachingMaterialsText, setTeachingMaterialsText] = useState(() =>
    stringifyTeachingMaterialDrafts(
      parseTeachingMaterialsTextToDrafts(initialTeachingMaterialsText),
    ),
  );
  const [sheetNote, setSheetNote] = useState(
    pickStringValue(metadataSeed, ["note"]) ||
      linesToTextarea(metadataSeed?.note) ||
      parsedMetadataLinesObject?.note ||
      parsedRawMetadata?.note ||
      "",
  );

  // Content fields
  const [teacherName, setTeacherName] = useState(
    pickStringValue(contentSeed, ["teacherName"]),
  );
  const [homeworkLabel, setHomeworkLabel] = useState(
    pickStringValue(contentSeed, ["homeworkLabel"]) || "HOMEWORK",
  );
  const [homeworkMaterialsText, setHomeworkMaterialsText] = useState(
    linesToTextarea(contentSeed?.homeworkMaterials),
  );
  const [homeworkNotesText, setHomeworkNotesText] = useState(
    linesToTextarea(contentSeed?.homeworkNotes),
  );
  const [activities, setActivities] = useState<TemplateActivityDraft[]>(
    rawContent
      ? [{ ...createEmptyTemplateActivity(), classwork: rawContent }]
      : activityDraftsFromUnknown(contentSeed?.activities),
  );

  // File/meta
  const [sourceFileName, setSourceFileName] = useState(
    initialValue?.sourceFileName || "",
  );
  const [attachment, setAttachment] = useState(initialValue?.attachment || "");
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingMaterialIndex, setUploadingMaterialIndex] = useState<
    number | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatedMetadataObject = useMemo(() => {
    return removeEmptyDeep({
      day: dayLabel.trim(),
      duration: durationLabel.trim(),
      generalInformation: generalInformation.trim(),
      teachingMaterials: textareaToLines(teachingMaterialsText),
      note: sheetNote.trim(),
    });
  }, [
    dayLabel,
    durationLabel,
    generalInformation,
    sheetNote,
    teachingMaterialsText,
  ]);

  const generatedContentObject = useMemo(() => {
    const cleanedActivities = activities
      .map((item) =>
        removeEmptyDeep({
          time: item.time.trim(),
          book: item.book.trim(),
          skills: item.skills.trim(),
          classwork: item.classwork.trim(),
          requiredMaterials: item.requiredMaterials.trim(),
          homeworkRequiredMaterials: item.homeworkRequiredMaterials.trim(),
          extra: item.extra.trim(),
        }),
      )
      .filter((item) => Object.keys(item).length > 0);

    return removeEmptyDeep({
      sessionIndex,
      title: title.trim(),
      teacherName: teacherName.trim(),
      homeworkLabel: homeworkLabel.trim(),
      homeworkMaterials: textareaToLines(homeworkMaterialsText),
      homeworkNotes: textareaToLines(homeworkNotesText),
      activities: cleanedActivities,
    });
  }, [
    activities,
    homeworkLabel,
    homeworkMaterialsText,
    homeworkNotesText,
    sessionIndex,
    teacherName,
    title,
  ]);

  const updateActivity = (
    index: number,
    key: keyof TemplateActivityDraft,
    value: string,
  ) => {
    setActivities((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const addActivity = () =>
    setActivities((current) => [...current, createEmptyTemplateActivity()]);

  const addTeachingMaterial = () => {
    setTeachingMaterialDrafts((current) => [
      ...current,
      createEmptyTeachingMaterial(),
    ]);
  };

  const updateTeachingMaterial = (
    index: number,
    patch: Partial<TeachingMaterialDraft>,
  ) => {
    setTeachingMaterialDrafts((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const removeTeachingMaterial = (index: number) => {
    setTeachingMaterialDrafts((current) =>
      current.length <= 1
        ? [createEmptyTeachingMaterial()]
        : current.filter((_, i) => i !== index),
    );
  };

  const uploadTeachingMaterial = async (index: number, file: File | null) => {
    if (!file) return;

    try {
      setUploadingMaterialIndex(index);
      const uploaded = await uploadLessonPlanFile("materials", file);
      updateTeachingMaterial(index, { resource: uploaded.url });
    } catch (uploadError: unknown) {
      setError(toErrorMessage(uploadError, "Không thể tải file tài liệu lên."));
    } finally {
      setUploadingMaterialIndex(null);
    }
  };

  const addPresetActivity = (preset: TemplateActivityPresetKey) => {
    setActivities((current) => {
      const nextActivity = createPresetTemplateActivity(preset);
      if (current.length === 1 && isActivityDraftEmpty(current[0]))
        return [nextActivity];
      return [...current, nextActivity];
    });
  };

  const duplicateActivity = (index: number) => {
    setActivities((current) => {
      const source = current[index];
      if (!source) return current;
      const next = [...current];
      next.splice(index + 1, 0, { ...source });
      return next;
    });
  };

  const removeActivity = (index: number) => {
    setActivities((current) =>
      current.length <= 1
        ? [createEmptyTemplateActivity()]
        : current.filter((_, i) => i !== index),
    );
  };

  const handleReset = () => {
    setProgramId(initialProgramId);
    setLevel(initialValue?.level || "");
    setTitle(initialValue?.title || "");
    setSessionIndex(initialValue?.sessionIndex || 1);
    setDayLabel(
      pickStringValue(metadataSeed, ["day", "days", "scheduleDays"]) ||
        parsedMetadataLinesObject?.day ||
        parsedRawMetadata?.day ||
        "",
    );
    setDurationLabel(
      pickStringValue(metadataSeed, ["duration"]) ||
        parsedMetadataLinesObject?.duration ||
        parsedRawMetadata?.duration ||
        "",
    );
    setGeneralInformation(
      pickStringValue(metadataSeed, [
        "generalInformation",
        "generalInfo",
        "description",
      ]) ||
        parsedMetadataLinesObject?.generalInformation ||
        parsedRawMetadata?.generalInformation ||
        "",
    );
    const nextTeachingMaterialsText =
      linesToTextarea(metadataSeed?.teachingMaterials) ||
      parsedMetadataLinesObject?.teachingMaterialsText ||
      parsedRawMetadata?.teachingMaterialsText ||
      "";
    setTeachingMaterialDrafts(
      parseTeachingMaterialsTextToDrafts(nextTeachingMaterialsText),
    );
    setTeachingMaterialsText(
      stringifyTeachingMaterialDrafts(
        parseTeachingMaterialsTextToDrafts(nextTeachingMaterialsText),
      ),
    );
    setSheetNote(
      pickStringValue(metadataSeed, ["note"]) ||
        linesToTextarea(metadataSeed?.note) ||
        parsedMetadataLinesObject?.note ||
        parsedRawMetadata?.note ||
        "",
    );
    setTeacherName(pickStringValue(contentSeed, ["teacherName"]));
    setHomeworkLabel(
      pickStringValue(contentSeed, ["homeworkLabel"]) || "HOMEWORK",
    );
    setHomeworkMaterialsText(linesToTextarea(contentSeed?.homeworkMaterials));
    setHomeworkNotesText(linesToTextarea(contentSeed?.homeworkNotes));
    setActivities(
      rawContent
        ? [{ ...createEmptyTemplateActivity(), classwork: rawContent }]
        : activityDraftsFromUnknown(contentSeed?.activities),
    );
    setSourceFileName(initialValue?.sourceFileName || "");
    setAttachment(initialValue?.attachment || "");
    setIsActive(initialValue?.isActive ?? true);
    setSelectedFile(null);
    setError(null);
  };

  useEffect(() => {
    setTeachingMaterialsText(
      stringifyTeachingMaterialDrafts(teachingMaterialDrafts),
    );
  }, [teachingMaterialDrafts]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!programId.trim()) {
      setError("Vui lòng chọn chương trình.");
      return;
    }
    if (!level.trim()) {
      setError("Vui lòng nhập level.");
      return;
    }
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề.");
      return;
    }
    const effectiveSessionIndex = isEdit ? sessionIndex : 1;
    if (effectiveSessionIndex <= 0) {
      setError("Session index phải lớn hơn 0.");
      return;
    }

    // Duplicate check only applies to "shared" (non-unit) templates.
    // Unit-based templates can legitimately share (programId, sessionIndex)
    // across different units, so we skip the check for them.
    const isUnitTemplate = Boolean(initialValue?.lessonPlanUnitId);
    const duplicated = isUnitTemplate
      ? null
      : existingTemplates.find(
          (item) =>
            !item.lessonPlanUnitId &&
            item.programId === programId &&
            item.sessionIndex === effectiveSessionIndex &&
            item.id !== initialValue?.id,
        );

    if (duplicated) {
      setError(
        `Program này đã có template dùng chung ở Buổi ${effectiveSessionIndex} (${duplicated.title}). Vui lòng cập nhật template hiện có.`,
      );
      return;
    }

    const shouldKeepLegacyPlainMetadata = Boolean(
      parsedRawMetadata && !metadataSeed,
    );
    const metadataPayload = shouldKeepLegacyPlainMetadata
      ? buildPlainMetadataText({
          day: dayLabel,
          duration: durationLabel,
          generalInformation,
          teachingMaterialsText,
          note: sheetNote,
        })
      : stringifyPrettyJson(generatedMetadataObject);
    const contentPayload = stringifyPrettyJson(generatedContentObject);

    setSubmitting(true);
    try {
      await onSubmit(
        {
          programId,
          level: level.trim(),
          title: title.trim(),
          sessionIndex: effectiveSessionIndex,
          syllabusMetadata: metadataPayload || null,
          syllabusContent: contentPayload || null,
          sourceFileName: sourceFileName.trim() || null,
          attachment: attachment.trim() || null,
          isActive,
        },
        selectedFile,
      );
    } catch (submitError: unknown) {
      setError(toErrorMessage(submitError, "Không thể lưu template."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title={isEdit ? "Cập nhật template" : "Tạo template"}
      subtitle={
        isEdit
          ? "Chỉnh sửa mẫu giáo án hiện có"
          : "Tạo mậu giáo án mới cho chương trình"
      }
      icon={FolderOpen}
      onClose={onClose}
      widthClass="max-w-5xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
        <div className="flex-1 overflow-y-auto space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Chương trình">
              <Select
                value={programId}
                onValueChange={setProgramId}
                disabled={isEdit}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Chọn chương trình" />
                </SelectTrigger>
                <SelectContent>
                  {programOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Cấp độ">
              <input
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: Starters"
              />
            </Field>

            <Field label="Tiêu đề session">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: Warm Up"
              />
            </Field>

            <Field label="Phạm vi áp dụng">
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Template này dùng chung cho toàn bộ buổi của chương trình và
                được neo tại Buổi 1.
              </div>
            </Field>
          </div>

          {/* Metadata chung */}
          <div className="rounded-2xl border border-gray-200 bg-red-50/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-red-700">
                Thông tin chung của Syllabus
              </div>
              <StatusBadge kind="info">syllabusMetadata</StatusBadge>
            </div>

            {/* Reference panel: show original plain text when it was not stored as JSON.
              Source may be syllabusMetadata or syllabusContent (when metadata was absent). */}
            {(() => {
              const refText =
                !metadataSeed && initialValue?.syllabusMetadata
                  ? initialValue.syllabusMetadata
                  : !contentSeed &&
                      !metadataSeed &&
                      initialValue?.syllabusContent
                    ? initialValue.syllabusContent
                    : null;
              return refText ? (
                <details className="rounded-xl border border-amber-300 bg-amber-50">
                  <summary className="cursor-pointer select-none px-4 py-2 text-xs font-semibold text-amber-800">
                    📋 Dữ liệu gốc (plain text) — các trường bên dưới đã được tự
                    động điền từ đây
                  </summary>
                  <div className="whitespace-pre-wrap border-t border-amber-200 px-4 py-3 text-xs leading-6 text-amber-900 font-mono">
                    {refText}
                  </div>
                </details>
              ) : null;
            })()}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ngày học">
                <input
                  value={dayLabel}
                  onChange={(event) => setDayLabel(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Ví dụ: Monday and Saturday"
                />
              </Field>

              <Field label="Thời lượng">
                <input
                  value={durationLabel}
                  onChange={(event) => setDurationLabel(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Ví dụ: 11/07/2022 - 2022"
                />
              </Field>
            </div>

            <Field label="Thông tin chung">
              <textarea
                value={generalInformation}
                onChange={(event) => setGeneralInformation(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Nhập mô tả chung của syllabus"
              />
            </Field>

            <Field label="Tài liệu giảng dạy">
              <p className="mb-2 text-xs text-gray-500">
                Nhập theo bảng 2 cột: Tên tài liệu và Link hoặc file.
              </p>
              <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={addTeachingMaterial}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                  >
                    + Thêm tài liệu
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-[760px] w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700">
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold w-1/3">
                          Tên tài liệu
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Link hoặc file
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachingMaterialDrafts.map((item, index) => (
                        <tr
                          key={`material-draft-${index}`}
                          className="align-top"
                        >
                          <td className="border border-gray-200 p-2">
                            <div className="mb-1 text-xs font-semibold text-gray-500">
                              #{index + 1}
                            </div>
                            <input
                              value={item.title}
                              onChange={(event) =>
                                updateTeachingMaterial(index, {
                                  title: event.target.value,
                                })
                              }
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                              placeholder="Ví dụ: Handbook for Reading"
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <textarea
                              value={item.resource}
                              onChange={(event) =>
                                updateTeachingMaterial(index, {
                                  resource: event.target.value,
                                })
                              }
                              rows={2}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                              placeholder="Nhập link https://... hoặc ghi Đã gửi file"
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                                  {uploadingMaterialIndex === index ? (
                                    <Loader2
                                      size={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Upload size={12} />
                                  )}
                                  {uploadingMaterialIndex === index
                                    ? "Đang tải..."
                                    : "Tải file"}
                                  <input
                                    type="file"
                                    className="hidden"
                                    disabled={uploadingMaterialIndex !== null}
                                    onChange={(event) => {
                                      const file =
                                        event.target.files?.[0] || null;
                                      void uploadTeachingMaterial(index, file);
                                      event.currentTarget.value = "";
                                    }}
                                  />
                                </label>
                                {extractFirstHttpUrl(item.resource) && (
                                  <a
                                    href={buildFileUrl(
                                      extractFirstHttpUrl(item.resource),
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                  >
                                    <Paperclip size={12} />
                                    Mở link
                                  </a>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeTeachingMaterial(index)}
                                className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                Xóa dòng
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <details className="rounded-lg border border-gray-200 bg-gray-50">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-gray-600">
                    Xem dữ liệu text tương thích backend
                  </summary>
                  <div className="border-t border-gray-200 px-3 py-2">
                    <textarea
                      value={teachingMaterialsText}
                      onChange={(event) =>
                        setTeachingMaterialsText(event.target.value)
                      }
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                      placeholder="Hệ thống tự sinh từ danh sách Link/File ở trên"
                    />
                  </div>
                </details>
              </div>
            </Field>

            <Field label="Ghi chú">
              <textarea
                value={sheetNote}
                onChange={(event) => setSheetNote(event.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: Course book accounts for 80% of the lesson..."
              />
            </Field>
          </div>

          {/* Nội dung session */}
          <div className="rounded-2xl border border-gray-200 bg-blue-50/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-blue-700">
                Nội dung session
              </div>
              <StatusBadge kind="info">syllabusContent</StatusBadge>
            </div>

            {/* Reference panel: show original plain text syllabusContent when not JSON */}
            {initialValue?.syllabusContent && !contentSeed ? (
              <details className="rounded-xl border border-blue-300 bg-blue-50">
                <summary className="cursor-pointer select-none px-4 py-2 text-xs font-semibold text-blue-800">
                  📋 Dữ liệu gốc (plain text) — tham khảo để điền vào form bên
                  dưới
                </summary>
                <div className="whitespace-pre-wrap border-t border-blue-200 px-4 py-3 text-xs leading-6 text-blue-900 font-mono">
                  {initialValue.syllabusContent}
                </div>
              </details>
            ) : null}

            <Field label="Teacher">
              <input
                value={teacherName}
                onChange={(event) => setTeacherName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: Vietnamese Teacher"
              />
            </Field>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-4">
              <div className="text-sm font-semibold text-amber-800">
                Homework block
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Homework label">
                  <input
                    value={homeworkLabel}
                    onChange={(event) => setHomeworkLabel(event.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder="HOMEWORK"
                  />
                </Field>

                <Field label="Required materials">
                  <textarea
                    value={homeworkMaterialsText}
                    onChange={(event) =>
                      setHomeworkMaterialsText(event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder={"Pages 80,81,82\nVideo repeat"}
                  />
                </Field>

                <Field label="Extra / Note">
                  <textarea
                    value={homeworkNotesText}
                    onChange={(event) =>
                      setHomeworkNotesText(event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder={
                      "1. Quay video đọc bài...\n2. Chụp phần bài làm..."
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-blue-700">
                  Activities
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {TEMPLATE_ACTIVITY_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => addPresetActivity(preset.key)}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={addActivity}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                  >
                    <Plus size={14} />
                    Thêm trống
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-300">
                <table className="min-w-[1100px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-amber-50 text-gray-700">
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                        #
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                        Time
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                        Book
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                        Skills
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                        Classwork
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                        Required Materials
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                        Homework Materials
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                        Extra / Note
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity, index) => (
                      <tr key={index} className="align-top">
                        <td className="border border-gray-300 px-3 py-3 font-semibold text-gray-600">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 p-1.5">
                          <input
                            value={activity.time}
                            onChange={(event) =>
                              updateActivity(index, "time", event.target.value)
                            }
                            className="w-20 rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                            placeholder="5 mins"
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5">
                          <input
                            value={activity.book}
                            onChange={(event) =>
                              updateActivity(index, "book", event.target.value)
                            }
                            className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                            placeholder="B1 DESTINATION"
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5">
                          <input
                            value={activity.skills}
                            onChange={(event) =>
                              updateActivity(
                                index,
                                "skills",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                            placeholder="Speaking"
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5">
                          <textarea
                            value={activity.classwork}
                            onChange={(event) =>
                              updateActivity(
                                index,
                                "classwork",
                                event.target.value,
                              )
                            }
                            rows={2}
                            className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                            placeholder={"WARM UP\nHomework Correction"}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5">
                          <textarea
                            value={activity.requiredMaterials}
                            onChange={(event) =>
                              updateActivity(
                                index,
                                "requiredMaterials",
                                event.target.value,
                              )
                            }
                            rows={2}
                            className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                            placeholder="page 101,102"
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5">
                          <textarea
                            value={activity.homeworkRequiredMaterials}
                            onChange={(event) =>
                              updateActivity(
                                index,
                                "homeworkRequiredMaterials",
                                event.target.value,
                              )
                            }
                            rows={2}
                            className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                            placeholder="HOMEWORK"
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5">
                          <textarea
                            value={activity.extra}
                            onChange={(event) =>
                              updateActivity(index, "extra", event.target.value)
                            }
                            rows={2}
                            className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                            placeholder="Handbook 88,89"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => duplicateActivity(index)}
                              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 cursor-pointer"
                            >
                              Clone
                            </button>
                            <button
                              type="button"
                              onClick={() => removeActivity(index)}
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Source file name">
              <input
                value={sourceFileName}
                onChange={(event) => setSourceFileName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="syllabus_template_1_mau.xlsx"
              />
            </Field>

            <Field label="Attachment URL">
              <input
                value={attachment}
                onChange={(event) => setAttachment(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="https://..."
              />
            </Field>
          </div>

          <Field label="Tải file attachment">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50/60 px-4 py-3 text-sm text-gray-600 hover:bg-red-50">
              <Upload size={16} className="text-red-600" />
              <span>
                {selectedFile
                  ? selectedFile.name
                  : "Chọn file để upload vào attachment"}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] || null)
                }
              />
            </label>
          </Field>

          {isEdit ? (
            <Field label="Trạng thái">
              <div className="grid grid-cols-2 gap-3">
                <ToggleButton
                  active={isActive}
                  onClick={() => setIsActive(true)}
                  label="Đang hoạt động"
                />
                <ToggleButton
                  active={!isActive}
                  onClick={() => setIsActive(false)}
                  label="Tạm ẩn"
                />
              </div>
            </Field>
          ) : null}

          {error ? <ErrorBox message={error} /> : null}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Đặt lại
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderOpen size={14} />
                )}
                {isEdit ? "Lưu template" : "Tạo template"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </ModalFrame>
  );
}

function ImportTemplateModal({
  programOptions,
  onClose,
  onSubmit,
}: {
  programOptions: Option[];
  onClose: () => void;
  onSubmit: (payload: {
    file: File;
    programId?: string;
    level?: string;
    overwriteExisting: boolean;
  }) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [programId, setProgramId] = useState("");
  const [level, setLevel] = useState("");
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Vui lòng chọn file xlsx/xls/csv.");
      return;
    }

    if (!isSupportedSyllabusFile(file.name)) {
      setError(
        "Định dạng file không hợp lệ. Chỉ hỗ trợ .xlsx, .xls hoặc .csv.",
      );
      return;
    }

    if (getFileExtension(file.name) === "csv" && !programId) {
      setError(
        "Import CSV bắt buộc chọn chương trình để map đúng mẫu giáo án.",
      );
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        file,
        programId: programId || undefined,
        level: level.trim() || undefined,
        overwriteExisting,
      });
    } catch (submitError: unknown) {
      setError(toErrorMessage(submitError, "Không thể import syllabus."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title="Import mẫu giáo án (Syllabus)"
      subtitle="Nhập tẫu từ file xlsx, xls hoặc csv"
      icon={Upload}
      onClose={onClose}
      widthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-900">
          <div className="font-semibold">
            Trước khi import, vui lòng kiểm tra
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-blue-800">
            <li>Định dạng hợp lệ: .xlsx, .xls hoặc .csv</li>
            <li>Nếu import file .csv: bắt buộc chọn chương trình</li>
            <li>
              Bật "Cập nhật dữ liệu đã có" nếu muốn ghi đè session đã tồn tại
            </li>
          </ul>
        </div>

        <Field label="File giáo án">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50/60 px-4 py-4 text-sm text-gray-700 hover:bg-red-50">
            <Upload size={16} className="text-red-600" />
            <span>
              {file ? file.name : "Chọn file .xlsx/.xls/.csv để bắt đầu import"}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Program (bắt buộc khi import .csv)">
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="Không chọn (backend tự map nếu có thể)" />
              </SelectTrigger>
              <SelectContent>
                {programOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Level (không bắt buộc)">
            <input
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Ví dụ: Flyers, Movers..."
            />
          </Field>
        </div>

        <Field label="Cập nhật dữ liệu đã có?">
          <div className="grid grid-cols-2 gap-3">
            <ToggleButton
              active={overwriteExisting}
              onClick={() => setOverwriteExisting(true)}
              label="Có - ghi đè và cập nhật lại"
            />
            <ToggleButton
              active={!overwriteExisting}
              onClick={() => setOverwriteExisting(false)}
              label="Không - giữ nguyên dữ liệu cũ"
            />
          </div>
        </Field>

        {error ? <ErrorBox message={error} /> : null}

        <ModalActions
          onClose={onClose}
          submitting={submitting}
          submitLabel="Bắt đầu import"
          showReset={false}
        />
      </form>
    </ModalFrame>
  );
}

type StarterActivity = Record<string, unknown> & {
  time?: string;
  book?: string;
  skills?: string;
  classwork?: string;
  requiredMaterials?: string;
  homeworkRequiredMaterials?: string;
  extra?: string;
};

type StarterSheet = Record<string, unknown> & {
  activities: StarterActivity[];
};

type PlannerActivityDraft = {
  time: string;
  book: string;
  skills: string;
  classwork: string;
  requiredMaterials: string;
  homeworkRequiredMaterials: string;
  extra: string;
};

function parseStarterActivities(
  refContent: string | null | undefined,
): StarterSheet | null {
  if (!refContent?.trim()) return null;
  const parsed = parseJsonContent(refContent);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    return null;
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.activities) || obj.activities.length === 0)
    return null;
  const activities = obj.activities
    .map((item) => asObject(item))
    .filter((item): item is StarterActivity => Boolean(item));
  if (!activities.length) return null;
  return { ...obj, activities };
}

function toPlannerActivityDraft(
  activity: StarterActivity,
): PlannerActivityDraft {
  return {
    time: typeof activity.time === "string" ? activity.time : "",
    book: typeof activity.book === "string" ? activity.book : "",
    skills: typeof activity.skills === "string" ? activity.skills : "",
    classwork: typeof activity.classwork === "string" ? activity.classwork : "",
    requiredMaterials:
      typeof activity.requiredMaterials === "string"
        ? activity.requiredMaterials
        : "",
    homeworkRequiredMaterials:
      typeof activity.homeworkRequiredMaterials === "string"
        ? activity.homeworkRequiredMaterials
        : "",
    extra: typeof activity.extra === "string" ? activity.extra : "",
  };
}

function createEmptyPlannerActivity(): PlannerActivityDraft {
  return {
    time: "",
    book: "",
    skills: "",
    classwork: "",
    requiredMaterials: "",
    homeworkRequiredMaterials: "",
    extra: "",
  };
}

function PlanFormModal({
  scope,
  classSyllabus,
  session,
  initialValue,
  templateOptions,
  sharedTemplate,
  onClose,
  onSubmit,
}: {
  scope: WorkspaceScope;
  classSyllabus: ClassLessonPlanSyllabus | null;
  session: ClassLessonPlanSyllabusSession;
  initialValue: LessonPlan | null;
  templateOptions: LessonPlanTemplate[];
  sharedTemplate?: LessonPlanTemplate;
  onClose: () => void;
  onSubmit: (payload: {
    session: ClassLessonPlanSyllabusSession;
    templateId?: string | null;
    plannedContent?: string | null;
    actualContent?: string | null;
    actualHomework?: string | null;
    teacherNotes?: string | null;
  }) => Promise<void>;
}) {
  const isEdit = Boolean(initialValue);
  const isTeacher = scope === "teacher";

  const resolvedTemplateId =
    initialValue?.templateId || session.templateId || sharedTemplate?.id || "";
  const initialPlannedContent = (() => {
    if (!isTeacher) {
      const savedContent = initialValue?.plannedContent || session.plannedContent || "";
      return parseStarterActivities(savedContent)
        ? prettifyJsonText(savedContent)
        : "";
    }
    if (initialValue?.plannedContent)
      return prettifyJsonText(initialValue.plannedContent);
    if (session.plannedContent) return prettifyJsonText(session.plannedContent);
    if (isTeacher)
      return prettifyJsonText(
        session.templateSyllabusContent ||
          sharedTemplate?.syllabusContent ||
          "",
      );
    return "";
  })();
  const [templateId, setTemplateId] = useState(resolvedTemplateId);
  const [plannedContent, setPlannedContent] = useState(initialPlannedContent);
  const [showPlannedJsonEditor, setShowPlannedJsonEditor] = useState(
    () => !isTeacher && Boolean(parseStarterActivities(initialPlannedContent)),
  );
  const [actualContent, setActualContent] = useState(
    initialValue?.actualContent || session.actualContent || "",
  );
  const [actualHomework, setActualHomework] = useState(
    initialValue?.actualHomework || session.actualHomework || "",
  );
  const [teacherNotes, setTeacherNotes] = useState(
    initialValue?.teacherNotes || session.teacherNotes || "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templateOptions.find((item) => item.id === templateId),
    [templateId, templateOptions],
  );
  const templateRefContent =
    session.templateSyllabusContent ||
    selectedTemplate?.syllabusContent ||
    sharedTemplate?.syllabusContent ||
    "";

  const refContent =
    templateRefContent ||
    session.plannedContent ||
    initialValue?.plannedContent;

  // Parse starter activities for structured editing (teacher only)
  const starterData = useMemo(() => {
    if (!isTeacher) return null;
    // If editing an existing plan, try to parse actualContent first (teacher may have saved structured data before)
    const existingActual = initialValue?.actualContent || session.actualContent;
    const existingParsed = parseStarterActivities(existingActual);
    if (existingParsed) return existingParsed;
    return parseStarterActivities(refContent);
  }, [
    isTeacher,
    refContent,
    initialValue?.actualContent,
    session.actualContent,
  ]);

  const plannerStarter = useMemo(() => {
    if (isTeacher) return null;
    return parseStarterActivities(
      initialValue?.plannedContent ||
        session.plannedContent ||
        templateRefContent,
    );
  }, [
    initialValue?.plannedContent,
    isTeacher,
    session.plannedContent,
    templateRefContent,
  ]);

  const [plannerTitle, setPlannerTitle] = useState(
    () =>
      pickStringValue(plannerStarter, ["title"]) ||
      pickStringValue(starterData, ["title"]),
  );
  const [plannerTeacherName, setPlannerTeacherName] = useState(() =>
    pickStringValue(plannerStarter, ["teacherName"]),
  );
  const [plannerHomeworkLabel, setPlannerHomeworkLabel] = useState(
    () => pickStringValue(plannerStarter, ["homeworkLabel"]) || "HOMEWORK",
  );
  const [plannerActivities, setPlannerActivities] = useState<
    PlannerActivityDraft[]
  >(() => {
    if (!plannerStarter) return [createEmptyPlannerActivity()];
    return plannerStarter.activities.map(toPlannerActivityDraft);
  });
  const [plannerHomeworkMaterialsText, setPlannerHomeworkMaterialsText] =
    useState(() =>
      plannerStarter ? linesToTextarea(plannerStarter.homeworkMaterials) : "",
    );
  const [plannerHomeworkNotesText, setPlannerHomeworkNotesText] = useState(
    () => (plannerStarter ? linesToTextarea(plannerStarter.homeworkNotes) : ""),
  );

  useEffect(() => {
    if (isTeacher) return;
    setPlannerTitle(pickStringValue(plannerStarter, ["title"]));
    setPlannerTeacherName(pickStringValue(plannerStarter, ["teacherName"]));
    setPlannerHomeworkLabel(
      pickStringValue(plannerStarter, ["homeworkLabel"]) || "HOMEWORK",
    );
    setPlannerActivities(
      plannerStarter?.activities.length
        ? plannerStarter.activities.map(toPlannerActivityDraft)
        : [createEmptyPlannerActivity()],
    );
    setPlannerHomeworkMaterialsText(
      plannerStarter ? linesToTextarea(plannerStarter.homeworkMaterials) : "",
    );
    setPlannerHomeworkNotesText(
      plannerStarter ? linesToTextarea(plannerStarter.homeworkNotes) : "",
    );
  }, [isTeacher, plannerStarter, templateId]);

  const [editableActivities, setEditableActivities] = useState<
    TemplateActivityDraft[]
  >(() => {
    if (!starterData) return [];
    // If teacher previously saved structured actual content, use that
    const existingActual = initialValue?.actualContent || session.actualContent;
    const existingParsed = parseStarterActivities(existingActual);
    const source = existingParsed?.activities || starterData.activities;
    return source.map((a) => ({
      time: typeof a.time === "string" ? a.time : "",
      book: typeof a.book === "string" ? a.book : "",
      skills: typeof a.skills === "string" ? a.skills : "",
      classwork: typeof a.classwork === "string" ? a.classwork : "",
      requiredMaterials:
        typeof a.requiredMaterials === "string" ? a.requiredMaterials : "",
      homeworkRequiredMaterials:
        typeof a.homeworkRequiredMaterials === "string"
          ? a.homeworkRequiredMaterials
          : "",
      extra: typeof a.extra === "string" ? a.extra : "",
    }));
  });

  const [editableHomeworkMaterialsText, setEditableHomeworkMaterialsText] =
    useState(() => {
      if (!starterData) return "";
      return linesToTextarea(starterData.homeworkMaterials);
    });

  const [editableHomeworkNotesText, setEditableHomeworkNotesText] = useState(
    () => {
      if (!starterData) return "";
      return linesToTextarea(starterData.homeworkNotes);
    },
  );

  const hasStructuredStarter = isTeacher && starterData !== null;
  const hasStructuredPlanner = !isTeacher && plannerStarter !== null;

  const updateEditableActivity = (
    index: number,
    field:
      | "time"
      | "book"
      | "skills"
      | "classwork"
      | "requiredMaterials"
      | "homeworkRequiredMaterials"
      | "extra",
    value: string,
  ) => {
    setEditableActivities((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addTeacherActivity = () => {
    setEditableActivities((prev) => [
      ...prev,
      {
        time: "",
        book: "",
        skills: "",
        classwork: "",
        requiredMaterials: "",
        homeworkRequiredMaterials: "",
        extra: "",
      },
    ]);
  };

  const removeTeacherActivity = (index: number) => {
    setEditableActivities((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const buildStructuredActualContent = (): string => {
    if (!starterData) return actualContent;
    const newActivities = editableActivities
      .map((activity, i) => {
        const base = starterData.activities[i] || {};
        return removeEmptyDeep({
          ...base,
          time:
            activity.time?.trim() ||
            (typeof base.time === "string" ? base.time : ""),
          book:
            activity.book?.trim() ||
            (typeof base.book === "string" ? base.book : ""),
          skills:
            activity.skills?.trim() ||
            (typeof base.skills === "string" ? base.skills : ""),
          classwork:
            activity.classwork?.trim() ||
            (typeof base.classwork === "string" ? base.classwork : ""),
          requiredMaterials:
            activity.requiredMaterials?.trim() ||
            (typeof base.requiredMaterials === "string"
              ? base.requiredMaterials
              : ""),
          homeworkRequiredMaterials:
            activity.homeworkRequiredMaterials?.trim() ||
            (typeof base.homeworkRequiredMaterials === "string"
              ? base.homeworkRequiredMaterials
              : ""),
          extra:
            activity.extra?.trim() ||
            (typeof base.extra === "string" ? base.extra : ""),
        });
      })
      .filter((item) => Object.keys(item).length > 0);

    return JSON.stringify(
      {
        ...starterData,
        activities: newActivities,
        homeworkMaterials: textareaToLines(editableHomeworkMaterialsText),
        homeworkNotes: textareaToLines(editableHomeworkNotesText),
      },
      null,
      2,
    );
  };

  const updatePlannerActivity = (
    index: number,
    key: keyof PlannerActivityDraft,
    value: string,
  ) => {
    setPlannerActivities((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const addPlannerActivity = () => {
    setPlannerActivities((current) => [
      ...current,
      createEmptyPlannerActivity(),
    ]);
  };

  const removePlannerActivity = (index: number) => {
    setPlannerActivities((current) =>
      current.length <= 1
        ? [createEmptyPlannerActivity()]
        : current.filter((_, i) => i !== index),
    );
  };

  const buildStructuredPlannedContent = (): string | null => {
    if (!plannerStarter) {
      return null;
    }

    const cleanedActivities = plannerActivities
      .map((item) =>
        removeEmptyDeep({
          time: item.time.trim(),
          book: item.book.trim(),
          skills: item.skills.trim(),
          classwork: item.classwork.trim(),
          requiredMaterials: item.requiredMaterials.trim(),
          homeworkRequiredMaterials: item.homeworkRequiredMaterials.trim(),
          extra: item.extra.trim(),
        }),
      )
      .filter((item) => Object.keys(item).length > 0);

    const payload = removeEmptyDeep({
      ...plannerStarter,
      title: plannerTitle.trim() || pickStringValue(plannerStarter, ["title"]),
      teacherName: plannerTeacherName.trim(),
      homeworkLabel: plannerHomeworkLabel.trim(),
      homeworkMaterials: textareaToLines(plannerHomeworkMaterialsText),
      homeworkNotes: textareaToLines(plannerHomeworkNotesText),
      activities: cleanedActivities,
    });

    return stringifyPrettyJson(payload) || null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const finalActualContent = hasStructuredStarter
      ? buildStructuredActualContent()
      : actualContent.trim();
    const finalPlannedContent = isTeacher
      ? undefined
      : hasStructuredPlanner
        ? buildStructuredPlannedContent()
        : isTrivialPlannedContent(plannedContent)
          ? null
          : plannedContent.trim() || null;

    if (isTeacher && !finalActualContent) {
      setError("Vui lòng nhập nội dung dạy thực tế.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        session,
        templateId: templateId || null,
        plannedContent: finalPlannedContent,
        actualContent: finalActualContent || null,
        actualHomework: hasStructuredStarter
          ? editableHomeworkMaterialsText.trim() || null
          : actualHomework.trim() || null,
        teacherNotes: hasStructuredStarter
          ? editableHomeworkNotesText.trim() || null
          : teacherNotes.trim() || null,
      });
    } catch (submitError: unknown) {
      setError(toErrorMessage(submitError, "Không thể lưu giáo án."));
    } finally {
      setSubmitting(false);
    }
  };

  const subtitle = `${
    classSyllabus?.classCode || classSyllabus?.classTitle || "-"
  } • ${getSessionDisplay(session)}`;

  return (
    <ModalFrame
      title={
        isTeacher
          ? isEdit
            ? "Cập nhật giáo án"
            : "Điền giáo án buổi dạy"
          : isEdit
            ? "Cập nhật giáo án buổi học"
            : "Soạn giáo án cho buổi học"
      }
      subtitle={subtitle}
      icon={isTeacher ? ClipboardPen : FilePlus2}
      onClose={onClose}
      widthClass={
        hasStructuredStarter || hasStructuredPlanner ? "max-w-6xl" : "max-w-4xl"
      }
    >
      <div className="flex flex-col max-h-[80vh]">
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={Users}
              label="Lớp học"
              value={
                classSyllabus?.classTitle ||
                classSyllabus?.classCode ||
                classSyllabus?.classId ||
                "-"
              }
            />
            <InfoCard
              icon={CalendarDays}
              label="Buổi học"
              value={getSessionDisplay(session)}
            />
          </div>

          {!isTeacher ? (
            <div className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
              <div className="flex items-start gap-3">
                <BookOpenCheck size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Chuẩn bị nội dung giảng dạy cho riêng buổi này
                  </div>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Chọn mẫu giáo án, bổ sung nội dung dạy, bài tập và ghi chú nội bộ.
                    Sau khi lưu, giáo án này sẽ gắn với buổi học để giáo viên sử dụng.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isTeacher ? (
          <>
            {hasStructuredStarter ? (
              /* ── Structured activity editor: show full content, only classwork/requiredMaterials/homeworkRequiredMaterials editable ── */
              <div className="space-y-4">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpenCheck size={15} className="text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">
                        Giáo án chuẩn: chỉ sửa được{" "}
                        {TEACHER_EDITABLE_FIELDS.classwork},{" "}
                        {TEACHER_EDITABLE_FIELDS.requiredMaterials},{" "}
                        {TEACHER_EDITABLE_FIELDS.homeworkRequiredMaterials},{" "}
                        {TEACHER_EDITABLE_FIELDS.extra}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={addTeacherActivity}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <Plus size={12} />
                      Thêm dòng activity
                    </button>
                  </div>
                </div>

                {/* Summary badges */}
                {(() => {
                  const summaryKeys = [
                    "sessionIndex",
                    "title",
                    "dateLabel",
                    "teacherName",
                  ] as const;
                  const hasSummary = summaryKeys.some(
                    (k) =>
                      starterData![k] !== undefined &&
                      starterData![k] !== null &&
                      starterData![k] !== "",
                  );
                  if (!hasSummary) return null;
                  return (
                    <div className="flex flex-wrap gap-2">
                      {summaryKeys.map((k) =>
                        starterData![k] ? (
                          <StatusBadge key={k} kind="muted">
                            {k}: {String(starterData![k])}
                          </StatusBadge>
                        ) : null,
                      )}
                    </div>
                  );
                })()}

                {/* Activities table with editable cells */}
                <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
                  <div className="border-b border-gray-300 bg-amber-50 px-4 py-3 text-sm font-bold  tracking-wide text-gray-900">
                    Activities
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[980px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-red-50 text-gray-700">
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                            Time
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                            Book
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                            Skills
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold min-w-[200px]">
                            <span className="inline-flex items-center gap-1">
                              Classwork{" "}
                              <Pencil size={11} className="text-emerald-600" />
                            </span>
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold min-w-[180px]">
                            <span className="inline-flex items-center gap-1">
                              Required Materials{" "}
                              <Pencil size={11} className="text-emerald-600" />
                            </span>
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold min-w-[180px]">
                            <span className="inline-flex items-center gap-1">
                              Homework Materials{" "}
                              <Pencil size={11} className="text-emerald-600" />
                            </span>
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                            Extra
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {editableActivities.map((activity, index) => (
                          <tr key={index} className="align-top">
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.time ?? ""}
                                onChange={(e) =>
                                  updateEditableActivity(
                                    index,
                                    "time",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Time"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.book ?? ""}
                                onChange={(e) =>
                                  updateEditableActivity(
                                    index,
                                    "book",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Book"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.skills ?? ""}
                                onChange={(e) =>
                                  updateEditableActivity(
                                    index,
                                    "skills",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Skills"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={
                                  editableActivities[index]?.classwork ?? ""
                                }
                                onChange={(e) =>
                                  updateEditableActivity(
                                    index,
                                    "classwork",
                                    e.target.value,
                                  )
                                }
                                rows={3}
                                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Nhập classwork..."
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={
                                  editableActivities[index]
                                    ?.requiredMaterials ?? ""
                                }
                                onChange={(e) =>
                                  updateEditableActivity(
                                    index,
                                    "requiredMaterials",
                                    e.target.value,
                                  )
                                }
                                rows={3}
                                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Nhập required materials..."
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={
                                  editableActivities[index]
                                    ?.homeworkRequiredMaterials ?? ""
                                }
                                onChange={(e) =>
                                  updateEditableActivity(
                                    index,
                                    "homeworkRequiredMaterials",
                                    e.target.value,
                                  )
                                }
                                rows={3}
                                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Nhập homework materials..."
                              />
                            </td>
                            <td className="border border-gray-300 bg-gray-50 px-2 py-1.5 text-center">
                              <textarea
                                value={editableActivities[index]?.extra ?? ""}
                                onChange={(e) =>
                                  updateEditableActivity(
                                    index,
                                    "extra",
                                    e.target.value,
                                  )
                                }
                                rows={3}
                                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Nhập extra / note..."
                              />
                              <button
                                type="button"
                                onClick={() => removeTeacherActivity(index)}
                                disabled={editableActivities.length <= 1}
                                className="mt-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Xóa dòng
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Homework block (teacher editable) */}
                  {starterData!.homeworkLabel ||
                  linesFromUnknown(starterData!.homeworkMaterials).length ||
                  linesFromUnknown(starterData!.homeworkNotes).length ? (
                    <div className="border-t border-gray-300 bg-amber-50/40 p-4">
                      <div className="mb-3 text-xs font-semibold  tracking-wide text-gray-500">
                        Homework block (teacher được chỉnh Required materials +
                        Extra/Note)
                      </div>
                      <div className="grid gap-3 lg:grid-cols-3">
                        <div className="rounded-xl border border-gray-300 bg-white p-3">
                          <div className="mb-1 text-xs font-semibold  tracking-wide text-gray-500">
                            Label
                          </div>
                          <SheetCellValue value={starterData!.homeworkLabel} />
                        </div>
                        <div className="rounded-xl border border-gray-300 bg-white p-3">
                          <div className="mb-1 text-xs font-semibold  tracking-wide text-gray-500">
                            Required materials
                          </div>
                          <textarea
                            value={editableHomeworkMaterialsText}
                            onChange={(e) =>
                              setEditableHomeworkMaterialsText(e.target.value)
                            }
                            rows={4}
                            className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            placeholder="Nhập homework required materials..."
                          />
                        </div>
                        <div className="rounded-xl border border-gray-300 bg-white p-3">
                          <div className="mb-1 text-xs font-semibold  tracking-wide text-gray-500">
                            Extra / Note
                          </div>
                          <textarea
                            value={editableHomeworkNotesText}
                            onChange={(e) =>
                              setEditableHomeworkNotesText(e.target.value)
                            }
                            rows={4}
                            className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            placeholder="Nhập extra / note cho homework..."
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Notes (read-only) */}
                  {Array.isArray(starterData!.notes) &&
                  starterData!.notes.length > 0 ? (
                    <div className="border-t border-gray-300 bg-white px-4 py-3">
                      <div className="mb-2 text-xs font-semibold  tracking-wide text-gray-500">
                        Notes (chỉ đọc)
                      </div>
                      <SpreadsheetList value={starterData!.notes} />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : refContent ? (
              /* ── Fallback: show read-only content + freeform text fields ── */
              <>
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <BookOpenCheck size={15} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">
                      Nội dung giáo án Admin đã soạn
                    </span>
                    <span className="ml-auto rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-xs text-blue-600">
                      Chỉ đọc
                    </span>
                  </div>
                  <div className="mt-3 max-h-56 overflow-y-auto">
                    <StructuredContent
                      value={refContent}
                      placeholder="Chưa có nội dung chuẩn."
                    />
                  </div>
                </div>

                <Field label="Nội dung dạy thực tế *">
                  <p className="mb-2 text-xs text-gray-500">
                    Mô tả chi tiết nội dung bạn đã dạy trong buổi học hôm nay.
                  </p>
                  <textarea
                    value={actualContent}
                    onChange={(event) => setActualContent(event.target.value)}
                    rows={6}
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="VD: Hôm nay dạy Unit 3 - Animals, các bé học được tên các con vật, luyện phát âm..."
                  />
                </Field>

                <Field label="Bài tập về nhà">
                  <textarea
                    value={actualHomework}
                    onChange={(event) => setActualHomework(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="VD: Workbook trang 15-16, học thuộc từ vựng Unit 3..."
                  />
                </Field>

                <Field label="Ghi chú thêm">
                  <textarea
                    value={teacherNotes}
                    onChange={(event) => setTeacherNotes(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="VD: Bé An vắng mặt, cần gửi bài bù..."
                  />
                </Field>
              </>
            ) : (
              /* ── No starter at all: freeform entry ── */
              <>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                  Admin chưa soạn giáo án chuẩn cho buổi này.
                </div>

                <Field label="Nội dung dạy thực tế *">
                  <p className="mb-2 text-xs text-gray-500">
                    Mô tả chi tiết nội dung bạn đã dạy trong buổi học hôm nay.
                  </p>
                  <textarea
                    value={actualContent}
                    onChange={(event) => setActualContent(event.target.value)}
                    rows={6}
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="VD: Hôm nay dạy Unit 3 - Animals, các bé học được tên các con vật, luyện phát âm..."
                  />
                </Field>

                <Field label="Bài tập về nhà">
                  <textarea
                    value={actualHomework}
                    onChange={(event) => setActualHomework(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="VD: Workbook trang 15-16, học thuộc từ vựng Unit 3..."
                  />
                </Field>

                <Field label="Ghi chú thêm">
                  <textarea
                    value={teacherNotes}
                    onChange={(event) => setTeacherNotes(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="VD: Bé An vắng mặt, cần gửi bài bù..."
                  />
                </Field>
              </>
            )}
          </>
        ) : (
          <>
            <Field label="Mẫu giáo án">
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Để trống nếu muốn hệ thống tự chọn mẫu phù hợp" />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} • Level {item.level} •{" "}
                      {item.sessionIndex === 1
                        ? "Mẫu chung"
                        : `Buổi ${item.sessionIndex}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {hasStructuredPlanner ? (
              <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-blue-700">
                    Nội dung giáo án lấy từ mẫu
                  </div>
                  <button
                    type="button"
                    onClick={addPlannerActivity}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <Plus size={12} />
                    Thêm dòng activity
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Tiêu đề">
                    <input
                      value={plannerTitle}
                      onChange={(event) => setPlannerTitle(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Tiêu đề syllabus"
                    />
                  </Field>
                  <Field label="Giáo viên">
                    <input
                      value={plannerTeacherName}
                      onChange={(event) =>
                        setPlannerTeacherName(event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Teacher"
                    />
                  </Field>
                  <Field label="Homework label">
                    <input
                      value={plannerHomeworkLabel}
                      onChange={(event) =>
                        setPlannerHomeworkLabel(event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="HOMEWORK"
                    />
                  </Field>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-[1180px] border-collapse text-sm">
                      <thead>
                        <tr className="text-gray-700">
                          <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">
                            Time
                          </th>
                          <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">
                            Book
                          </th>
                          <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">
                            Skills
                          </th>
                          <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">
                            Classwork
                          </th>
                          <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">
                            Required materials
                          </th>
                          <th className="border border-gray-300 bg-blue-100 px-3 py-2 text-left font-semibold">
                            Homework materials
                          </th>
                          <th className="border border-gray-300 bg-blue-100 px-3 py-2 text-left font-semibold">
                            Extra / Note
                          </th>
                          <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-semibold">
                            Xóa
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plannerActivities.map((activity, index) => (
                          <tr key={`planner-${index}`} className="align-top">
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.time}
                                onChange={(event) =>
                                  updatePlannerActivity(
                                    index,
                                    "time",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="10 mins"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.book}
                                onChange={(event) =>
                                  updatePlannerActivity(
                                    index,
                                    "book",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Warm Up"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.skills}
                                onChange={(event) =>
                                  updatePlannerActivity(
                                    index,
                                    "skills",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Speaking / Reading"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={activity.classwork}
                                onChange={(event) =>
                                  updatePlannerActivity(
                                    index,
                                    "classwork",
                                    event.target.value,
                                  )
                                }
                                rows={2}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Classwork"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={activity.requiredMaterials}
                                onChange={(event) =>
                                  updatePlannerActivity(
                                    index,
                                    "requiredMaterials",
                                    event.target.value,
                                  )
                                }
                                rows={2}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Required materials"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={activity.homeworkRequiredMaterials}
                                onChange={(event) =>
                                  updatePlannerActivity(
                                    index,
                                    "homeworkRequiredMaterials",
                                    event.target.value,
                                  )
                                }
                                rows={2}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Homework materials"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={activity.extra}
                                onChange={(event) =>
                                  updatePlannerActivity(
                                    index,
                                    "extra",
                                    event.target.value,
                                  )
                                }
                                rows={2}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Extra / Note"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => removePlannerActivity(index)}
                                className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Homework materials (block)">
                    <textarea
                      value={plannerHomeworkMaterialsText}
                      onChange={(event) =>
                        setPlannerHomeworkMaterialsText(event.target.value)
                      }
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </Field>
                  <Field label="Homework notes (block)">
                    <textarea
                      value={plannerHomeworkNotesText}
                      onChange={(event) =>
                        setPlannerHomeworkNotesText(event.target.value)
                      }
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nội dung dạy cho buổi này">
                <textarea
                  value={actualContent}
                  onChange={(event) => setActualContent(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Ví dụ: Dạy Unit 4, luyện speaking theo cặp, chữa bài workbook... Có thể để trống nếu dùng nguyên mẫu."
                />
              </Field>
              <Field label="Bài tập giao về nhà">
                <textarea
                  value={actualHomework}
                  onChange={(event) => setActualHomework(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Ví dụ: Workbook trang 12-13, học từ vựng Unit 4..."
                />
              </Field>
            </div>

            <Field label="Ghi chú cho nội bộ trung tâm">
              <textarea
                value={teacherNotes}
                onChange={(event) => setTeacherNotes(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: Lớp thiếu 2 bạn, cần gửi bổ sung tài liệu qua nhóm..."
              />
            </Field>

            {!hasStructuredPlanner ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowPlannedJsonEditor((current) => !current)
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Settings2 size={13} />
                  {showPlannedJsonEditor
                    ? "Ẩn cấu trúc giáo án nâng cao"
                    : "Cấu trúc giáo án nâng cao"}
                </button>

                {showPlannedJsonEditor ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs leading-5 text-gray-500">
                      Chỉ dùng khi cần ghi đè cấu trúc giáo án bằng JSON. Nếu không
                      chắc, hãy để trống để hệ thống dùng mẫu đã chọn.
                    </p>
                    <textarea
                      value={plannedContent}
                      onChange={(event) =>
                        setPlannedContent(event.target.value)
                      }
                      rows={8}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                      placeholder='{"sessionIndex":1,"activities":[...]}'
                    />
                    {plannedContent ? (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setPlannedContent("")}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Xóa nội dung JSON
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}

        {error ? <ErrorBox message={error} /> : null}
        </form>

        <div className="flex-shrink-0 border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-5">
          <ModalActions
            onClose={onClose}
            submitting={submitting}
            submitLabel={
              isTeacher
                ? "Lưu nội dung buổi dạy"
                : isEdit
                  ? "Lưu thay đổi"
                  : "Lưu giáo án"
            }
            showReset={false}
          />
        </div>
      </div>
    </ModalFrame>
  );
}

function parseProcedureRows(
  text: string,
): { stage: string; step: string; details: string }[] {
  if (!text?.trim()) return [];
  // Strip the "Stages | Step | Details" header row emitted by Word export
  const cleaned = text
    .replace(/^\s*Stages\s*\|\s*Step\s*\|\s*Details\s*/i, "")
    .trim();
  const rows: { stage: string; step: string; details: string }[] = [];
  // Each row: {N} | {step text} | {details text until next N |}
  const rowRegex =
    /(\d+)\s*\|\s*([^|]+?)\s*\|\s*([\s\S]*?)(?=\s+\d+\s*\||\s*$)/g;
  let m: RegExpExecArray | null;
  let rowIndex = 0;
  while ((m = rowRegex.exec(cleaned)) !== null) {
    rows.push({ stage: String(rowIndex + 1), step: m[2].trim(), details: m[3].trim() });
    rowIndex++;
  }
  return rows;
}

/** Insert line breaks before Roman-numeral section markers (I., II., III. …) and numbered items */
function formatDetailsText(text: string): string {
  if (!text?.trim()) return text;
  return (
    text
      // newline before Roman numerals: I. II. III. IV. V. VI. VII. VIII. IX. X.
      .replace(
        /[ \t]+((?:I{1,3}|IV|VI{0,3}|IX|X{1,3}I{0,3}|X))\s*\.\s+/g,
        "\n$1. ",
      )
      // newline before numbered sub-items followed by uppercase or * or -
      .replace(/[ \t]+(\d+)\.\s+([A-Z*\-])/g, "\n$1. $2")
      // newline before bullet items starting with -
      .replace(/[ \t]+\-\s+/g, "\n- ")
      .trim()
  );
}

function DetailModal({
  state,
  linkedTemplate,
  onClose,
  onOpenAttachment,
}: {
  state: DetailModalState;
  linkedTemplate?: LessonPlanTemplate;
  onClose: () => void;
  onOpenAttachment: (url?: string | null) => void;
}) {
  const title =
    state.type === "template"
      ? "Chi tiết mẫu giáo án"
      : state.type === "session-document"
        ? "Syllabus theo buổi"
        : "Chi tiết giáo án";
  const subtitle =
    state.type === "template"
      ? "Xem thông tin mẫu giáo án đã tạo"
      : state.type === "session-document"
        ? "Xem lesson-plan document hoặc syllabus đã resolve cho từng buổi học"
        : "Xem thông tin giáo án của lớp học";
  const titleIcon =
    state.type === "template"
      ? FolderOpen
      : state.type === "session-document"
        ? BookOpenCheck
        : FileText;
  const hasTemplateMetadata =
    state.type === "template" && state.item
      ? hasDisplayablePayload(state.item.syllabusMetadata)
      : false;
  const hasTemplateContent =
    state.type === "template" && state.item
      ? hasDisplayablePayload(state.item.syllabusContent)
      : false;
  const templateMetadataObject =
    state.type === "template" && state.item
      ? asObject(parseJsonContent(state.item.syllabusMetadata))
      : null;
  const templateContentObject =
    state.type === "template" && state.item
      ? asObject(parseJsonContent(state.item.syllabusContent))
      : null;
  const fallbackActivityProcedureText =
    state.type === "template" && state.item
      ? (() => {
          const activities = activityDraftsFromUnknown(
            templateContentObject?.activities,
          ).filter(
            (item) =>
              item.time.trim() ||
              item.skills.trim() ||
              item.classwork.trim() ||
              item.requiredMaterials.trim() ||
              item.extra.trim(),
          );
          if (!activities.length) return "";
          return activities
            .map((item, index) => {
              const blocks = [
                item.time.trim() && `Time: ${item.time.trim()}`,
                item.skills.trim() && `Skills: ${item.skills.trim()}`,
                item.classwork.trim() && `Classwork:\n${item.classwork.trim()}`,
                item.requiredMaterials.trim() &&
                  `Required materials: ${item.requiredMaterials.trim()}`,
                item.homeworkRequiredMaterials.trim() &&
                  `Homework required materials: ${item.homeworkRequiredMaterials.trim()}`,
                item.extra.trim() && `Extra / Note: ${item.extra.trim()}`,
              ].filter(Boolean);
              return [`Stage ${index + 1}`, ...blocks].join("\n");
            })
            .join("\n\n");
        })()
      : "";

  const resolvedObjectives =
    state.type === "template" && state.item
      ? (state.item.objectives ??
        pickStringValue(templateContentObject, [
          "objectives",
          "objective",
          "learningObjectives",
        ]))
      : "";
  const resolvedLanguageContent =
    state.type === "template" && state.item
      ? (state.item.languageContent ??
        pickStringValue(templateContentObject, [
          "languageContent",
          "language",
          "languageFocus",
        ]))
      : "";
  const resolvedVocabulary =
    state.type === "template" && state.item
      ? (state.item.vocabulary ??
        pickStringValue(templateContentObject, [
          "vocabulary",
          "vocab",
          "newWords",
        ]))
      : "";
  const resolvedGrammar =
    state.type === "template" && state.item
      ? (state.item.grammar ??
        pickStringValue(templateContentObject, ["grammar", "grammarFocus"]))
      : "";
  const resolvedMethodology =
    state.type === "template" && state.item
      ? (state.item.teachingMethodology ??
        pickStringValue(templateContentObject, [
          "teachingMethodology",
          "methodology",
          "teachingMethod",
          "approach",
        ]))
      : "";
  const resolvedTeacherMaterials =
    state.type === "template" && state.item
      ? (state.item.teacherMaterials ??
        (pickStringValue(templateContentObject, [
          "teacherMaterials",
          "materialsForTeacher",
        ]) ||
          linesToTextarea(templateMetadataObject?.teachingMaterials)))
      : "";
  const resolvedStudentMaterials =
    state.type === "template" && state.item
      ? (state.item.studentMaterials ??
        pickStringValue(templateContentObject, [
          "studentMaterials",
          "materialsForStudents",
          "studentResources",
        ]))
      : "";
  const resolvedProcedure =
    state.type === "template" && state.item
      ? (state.item.procedure ??
        (pickStringValue(templateContentObject, [
          "procedure",
          "teachingProcedure",
        ]) ||
          fallbackActivityProcedureText))
      : "";
  const resolvedEvaluation =
    state.type === "template" && state.item
      ? (state.item.evaluation ??
        pickStringValue(templateContentObject, [
          "evaluation",
          "assessment",
          "checking",
        ]))
      : "";
  const resolvedHomework =
    state.type === "template" && state.item
      ? (state.item.homework ??
        pickStringValue(templateContentObject, [
          "homework",
          "homeworkTasks",
          "homeworkNotes",
        ]))
      : "";
  const resolvedTeacherNote =
    state.type === "template" && state.item
      ? (state.item.teacherNote ??
        pickStringValue(templateContentObject, [
          "teacherNote",
          "teacherNotes",
          "note",
          "notes",
        ]))
      : "";
  const structuredContentFields: {
    label: string;
    value: string;
    accent: string;
  }[] =
    state.type === "template" && state.item
      ? [
          {
            label: "Mục tiêu",
            value: resolvedObjectives ?? "",
            accent: "text-emerald-700",
          },
          {
            label: "Nội dung ngôn ngữ",
            value: resolvedLanguageContent ?? "",
            accent: "text-blue-700",
          },
          {
            label: "Từ vựng",
            value: resolvedVocabulary ?? "",
            accent: "text-violet-700",
          },
          {
            label: "Ngữ pháp",
            value: resolvedGrammar ?? "",
            accent: "text-indigo-700",
          },
          {
            label: "Phương pháp giảng dạy",
            value: resolvedMethodology ?? "",
            accent: "text-orange-700",
          },
          {
            label: "Tài liệu giáo viên",
            value: resolvedTeacherMaterials ?? "",
            accent: "text-amber-700",
          },
          {
            label: "Tài liệu học sinh",
            value: resolvedStudentMaterials ?? "",
            accent: "text-yellow-700",
          },
          {
            label: "Quy trình dạy học",
            value: resolvedProcedure ?? "",
            accent: "text-teal-700",
          },
          {
            label: "Đánh giá",
            value: resolvedEvaluation ?? "",
            accent: "text-red-700",
          },
          {
            label: "Bài tập về nhà",
            value: resolvedHomework ?? "",
            accent: "text-pink-700",
          },
          {
            label: "Ghi chú giáo viên",
            value: resolvedTeacherNote ?? "",
            accent: "text-gray-600",
          },
        ].filter((f) => f.value.trim())
      : [];
  const hasStructuredFields = structuredContentFields.length > 0;

  if (state.loading) {
    return (
      <ModalFrame
        title={title}
        subtitle={subtitle}
        icon={titleIcon}
        onClose={onClose}
        widthClass="max-w-5xl"
      >
        <div className="flex flex-col max-h-[80vh]">
          <div className="flex-1 overflow-y-auto flex items-center justify-center py-16 text-gray-600">
            <Loader2 size={20} className="mr-3 animate-spin text-red-600" />
            Đang tải chi tiết...
          </div>
          <div className="flex-shrink-0 border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </ModalFrame>
    );
  }

  if (state.error) {
    return (
      <ModalFrame
        title={title}
        subtitle={subtitle}
        icon={titleIcon}
        onClose={onClose}
        widthClass="max-w-5xl"
      >
        <div className="flex flex-col max-h-[80vh]">
          <div className="flex-1 overflow-y-auto p-6">
            <ErrorBox message={state.error} />
          </div>
          <div className="flex-shrink-0 border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame
      title={title}
      subtitle={subtitle}
      icon={titleIcon}
      onClose={onClose}
      widthClass="max-w-5xl"
    >
      <div className="flex flex-col max-h-[80vh]">
        <div className="flex-1 overflow-y-auto space-y-5 p-6">
          {state.type === "template" && state.item ? (
            <>
              {/* Document-style lesson plan */}
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                {/* Document header */}
                <div className="px-8 pt-5 pb-5 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono mb-4 pb-3 border-b border-dashed border-gray-300">
                    <div className="space-y-1">
                      <div>Date of preparation: ......./......../20......</div>
                      <div>
                        Date of
                        teaching:&nbsp;&nbsp;&nbsp;&nbsp;......./......../20......
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div>
                        Teacher:{" "}
                        <span className="font-sans font-medium text-gray-600">
                          {state.item.createdByName || "............"}
                        </span>
                      </div>
                      <div>Class: .............</div>
                    </div>
                  </div>
                  <div className="text-center space-y-1.5 py-1">
                    {(state.item.moduleName || state.item.moduleCode) && (
                      <div className="text-xs font-bold  tracking-[0.18em] text-red-600">
                        {state.item.moduleName || state.item.moduleCode}
                      </div>
                    )}
                    <h2 className="text-base font-bold text-gray-900">
                      {state.item.title}
                    </h2>
                    <div className="text-sm text-gray-500 flex items-center justify-center gap-3 flex-wrap">
                      <span>
                        Lesson{" "}
                        {state.item.sessionOrder ??
                          state.item.sessionIndex ??
                          "-"}
                      </span>
                      {state.item.levelName && (
                        <span>• {state.item.levelName}</span>
                      )}
                      {state.item.programName && (
                        <span className="text-gray-400">
                          • {state.item.programName}
                        </span>
                      )}
                    </div>
                    <div className="pt-1 flex items-center justify-center gap-3 text-xs text-gray-400">
                      <span>Tạo bởi {state.item.createdByName || "-"}</span>
                      <span>•</span>
                      <span>
                        {formatDate(
                          state.item.updatedAt || state.item.createdAt,
                          true,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sections A–H */}
                <div className="divide-y divide-gray-100">
                  {/* 0. Thông tin chung của Syllabus (mirrors the edit form section) */}
                  {(() => {
                    const rawMeta = state.item.syllabusMetadata;
                    if (!rawMeta?.trim()) return null;
                    // Try JSON first (saved by the edit form), then plain text
                    const jsonParsed = parseJsonContent(rawMeta) as Record<
                      string,
                      unknown
                    > | null;
                    const day: string = (jsonParsed?.day as string) || "";
                    const duration: string =
                      (jsonParsed?.duration as string) || "";
                    const generalInfo: string =
                      (jsonParsed?.generalInformation as string) || "";
                    const materials: string[] = Array.isArray(
                      jsonParsed?.teachingMaterials,
                    )
                      ? (jsonParsed!.teachingMaterials as unknown[])
                          .map(String)
                          .filter(Boolean)
                      : [];
                    const note: string = (jsonParsed?.note as string) || "";
                    // Fallback: parse plain text
                    const plain = !jsonParsed
                      ? parsePlainMetadataText(rawMeta)
                      : null;
                    const pDay = day || plain?.day || "";
                    const pDuration = duration || plain?.duration || "";
                    const pInfo =
                      generalInfo || plain?.generalInformation || "";
                    const pMaterials = materials.length
                      ? materials
                      : plain?.teachingMaterialsText
                        ? plain.teachingMaterialsText
                            .split("\n")
                            .filter(Boolean)
                        : [];
                    const pNote = note || plain?.note || "";
                    const hasMeta =
                      pDay || pDuration || pInfo || pMaterials.length || pNote;
                    if (!hasMeta) return null;
                    const materialItems = pMaterials.map((line) =>
                      parseTeachingMaterialLine(line, 0),
                    );
                    return (
                      <div className="px-8 py-5 bg-blue-50/40 border-b border-blue-100">
                        <div className="text-[10px] font-bold  tracking-[0.15em] text-blue-700 mb-4">
                          Thông tin chung của Syllabus
                        </div>
                        {(pDay || pDuration) && (
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            {pDay && (
                              <div>
                                <div className="text-[10px] font-semibold text-gray-500  tracking-wide mb-1">
                                  Ngày học
                                </div>
                                <div className="text-sm text-gray-700">
                                  {pDay}
                                </div>
                              </div>
                            )}
                            {pDuration && (
                              <div>
                                <div className="text-[10px] font-semibold text-gray-500  tracking-wide mb-1">
                                  Thời lượng
                                </div>
                                <div className="text-sm text-gray-700">
                                  {pDuration}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {pInfo && (
                          <div className="mb-3">
                            <div className="text-[10px] font-semibold text-gray-500  tracking-wide mb-1">
                              Thông tin chung
                            </div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">
                              {pInfo}
                            </div>
                          </div>
                        )}
                        {materialItems.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] font-semibold text-gray-500  tracking-wide mb-2">
                              Tài liệu giảng dạy
                            </div>
                            <div className="rounded-xl border border-blue-200 overflow-hidden">
                              <div className="grid grid-cols-[1fr_1fr] bg-blue-50 border-b border-blue-200 text-[11px] font-semibold text-blue-700">
                                <div className="px-3 py-2 border-r border-blue-200">
                                  Tên tài liệu
                                </div>
                                <div className="px-3 py-2">Link hoặc file</div>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {materialItems.map((mat, i) => (
                                  <div
                                    key={i}
                                    className="grid grid-cols-[1fr_1fr]"
                                  >
                                    <div className="px-3 py-2 text-sm text-gray-700 border-r border-gray-100 font-medium">
                                      {mat.title || `Tài liệu ${i + 1}`}
                                    </div>
                                    <div className="px-3 py-2 text-sm text-gray-600 break-all">
                                      {renderLinkifiedText(mat.resource)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {pNote && (
                          <div>
                            <div className="text-[10px] font-semibold text-gray-500  tracking-wide mb-1">
                              Ghi chú
                            </div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">
                              {pNote}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* A. Objectives */}
                  {resolvedObjectives && (
                    <div className="flex">
                      <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-emerald-50/70 border-r border-emerald-100">
                        <span className="text-sm font-extrabold text-emerald-700">
                          A
                        </span>
                      </div>
                      <div className="flex-1 px-6 py-4">
                        <div className="text-[10px] font-bold  tracking-[0.15em] text-emerald-700 mb-2">
                          Objectives
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">
                          {resolvedObjectives}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* B. Language content */}
                  {(resolvedLanguageContent ||
                    resolvedVocabulary ||
                    resolvedGrammar) && (
                    <div className="flex">
                      <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-blue-50/70 border-r border-blue-100">
                        <span className="text-sm font-extrabold text-blue-700">
                          B
                        </span>
                      </div>
                      <div className="flex-1 px-6 py-4">
                        <div className="text-[10px] font-bold  tracking-[0.15em] text-blue-700 mb-2">
                          Language content
                        </div>
                        {resolvedLanguageContent && (
                          <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6 mb-2">
                            {resolvedLanguageContent}
                          </div>
                        )}
                        {resolvedVocabulary && (
                          <div className="text-sm text-gray-700 mb-1">
                            <span className="font-semibold text-blue-600">
                              Vocabulary:{" "}
                            </span>
                            {resolvedVocabulary}
                          </div>
                        )}
                        {resolvedGrammar && (
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold text-blue-600">
                              Grammar:{" "}
                            </span>
                            {resolvedGrammar}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* C. Teaching methodology */}
                  {resolvedMethodology && (
                    <div className="flex">
                      <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-orange-50/70 border-r border-orange-100">
                        <span className="text-sm font-extrabold text-orange-700">
                          C
                        </span>
                      </div>
                      <div className="flex-1 px-6 py-4">
                        <div className="text-[10px] font-bold  tracking-[0.15em] text-orange-700 mb-2">
                          Teaching methodology
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">
                          {resolvedMethodology}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* D. Materials for teacher */}
                  {resolvedTeacherMaterials && (
                    <div className="flex">
                      <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-amber-50/70 border-r border-amber-100">
                        <span className="text-sm font-extrabold text-amber-700">
                          D
                        </span>
                      </div>
                      <div className="flex-1 px-6 py-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700 mb-2">
                          Materials for teacher
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">
                          {resolvedTeacherMaterials}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* E. Materials for students */}
                  {resolvedStudentMaterials && (
                    <div className="flex">
                      <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-yellow-50/70 border-r border-yellow-100">
                        <span className="text-sm font-extrabold text-yellow-600">
                          E
                        </span>
                      </div>
                      <div className="flex-1 px-6 py-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-yellow-700 mb-2">
                          Materials for students
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">
                          {resolvedStudentMaterials}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* F. Procedure */}
                  {resolvedProcedure && (
                    <div className="flex">
                      <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-teal-50/70 border-r border-teal-100">
                        <span className="text-sm font-extrabold text-teal-700">
                          F
                        </span>
                      </div>
                      <div className="flex-1 px-6 py-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700 mb-3">
                          Procedure
                        </div>
                        {(() => {
                          const rows = parseProcedureRows(resolvedProcedure);
                          if (rows.length === 0) {
                            return (
                              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">
                                {resolvedProcedure}
                              </div>
                            );
                          }
                          return (
                            <div className="rounded-xl border border-teal-200 overflow-hidden">
                              <div className="grid grid-cols-[3rem_10rem_1fr] bg-teal-50 border-b border-teal-200 text-[11px] font-semibold text-teal-700">
                                <div className="px-2 py-2 text-center border-r border-teal-200">
                                  Stages
                                </div>
                                <div className="px-3 py-2 text-center border-r border-teal-200">
                                  Step
                                </div>
                                <div className="px-3 py-2 text-left">
                                  Details
                                </div>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {rows.map((row, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "grid grid-cols-[3rem_10rem_1fr]",
                                      i % 2 === 0
                                        ? "bg-white"
                                        : "bg-gray-50/50",
                                    )}
                                  >
                                    <div className="px-2 py-3 text-center text-sm font-bold text-gray-600 border-r border-gray-100 flex items-start justify-center pt-3">
                                      {row.stage}
                                    </div>
                                    <div className="px-3 py-3 text-sm font-semibold text-gray-700 border-r border-gray-100 leading-5">
                                      {row.step}
                                    </div>
                                    <div className="px-3 py-3 text-sm text-gray-700 leading-6 whitespace-pre-wrap">
                                      {formatDetailsText(row.details)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* G. Evaluation */}
                  {resolvedEvaluation && (
                    <div className="flex">
                      <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-red-50/70 border-r border-red-100">
                        <span className="text-sm font-extrabold text-red-700">
                          G
                        </span>
                      </div>
                      <div className="flex-1 px-6 py-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-700 mb-2">
                          Evaluation
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">
                          {resolvedEvaluation}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* H. Homework */}
                  {resolvedHomework && (
                    <div className="flex">
                      <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 pb-4 bg-pink-50/70 border-r border-pink-100">
                        <span className="text-sm font-extrabold text-pink-700">
                          H
                        </span>
                      </div>
                      <div className="flex-1 px-6 py-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-pink-700 mb-2">
                          Homework
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">
                          {resolvedHomework}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Teacher note */}
                  {resolvedTeacherNote && (
                    <div className="px-8 py-4 bg-yellow-50/50 border-t border-yellow-100">
                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-yellow-700 mb-2">
                        Teacher Note
                      </div>
                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">
                        {resolvedTeacherNote}
                      </div>
                    </div>
                  )}

                  {/* Raw source reference: always available when syllabusContent exists */}
                  {hasTemplateContent && (
                    <div className="px-8 py-4 border-t border-gray-100 bg-slate-50/70">
                      <details>
                        <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.15em] text-slate-700">
                          Nội dung gốc từ file import
                        </summary>
                        <div className="mt-3 whitespace-pre-wrap text-sm text-gray-700 leading-6">
                          {state.item.syllabusContent}
                        </div>
                      </details>
                    </div>
                  )}
                  {!hasStructuredFields &&
                    !hasTemplateMetadata &&
                    !hasTemplateContent && (
                      <div className="px-8 py-4">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                  {state.item.syllabusContent || 'Chưa có nội dung dự kiến.'}
                        </div>
                      </div>
                    )}
                </div>

                {/* Footer */}
                {(state.item.sourceFileName || state.item.attachment) && (
                  <div className="px-8 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-4">
                    {state.item.sourceFileName && (
                      <div className="text-xs text-gray-500 flex-1 truncate">
                        <span className="font-medium">Nguồn:</span>{" "}
                        {state.item.sourceFileName}
                      </div>
                    )}
                    {state.item.attachment && (
                      <button
                        type="button"
                        onClick={() => onOpenAttachment(state.item!.attachment)}
                        className="ml-auto inline-flex flex-shrink-0 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                      >
                        <Paperclip size={12} />
                        Mở file đính kèm
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : state.type === "plan" && state.item ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={Users}
                  label="Lớp học"
                  value={
                    state.item.classTitle ||
                    state.item.classCode ||
                    state.item.classId ||
                    "-"
                  }
                />
                <InfoCard
                  icon={CalendarDays}
                  label="Buổi học"
                  value={
                    state.item.sessionTitle ||
                    formatDate(state.item.sessionDate, true)
                  }
                />
                <InfoCard
                  icon={ShieldCheck}
                  label="Người cập nhật"
                  value={state.item.submittedByName || "-"}
                />
                <InfoCard
                  icon={Clock3}
                  label="Thời gian"
                  value={formatDate(
                    state.item.updatedAt ||
                      state.item.createdAt ||
                      state.item.submittedAt,
                    true,
                  )}
                />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <ContentPanel
                  title="plannedContent"
                  value={state.item.plannedContent}
                  accent="text-red-700"
                />
                <ContentPanel
                  title="actualContent"
                  value={state.item.actualContent}
                  accent="text-emerald-700"
                />
                <ContentPanel
                  title="actualHomework"
                  value={state.item.actualHomework}
                  accent="text-amber-700"
                />
                <ContentPanel
                  title="teacherNotes"
                  value={state.item.teacherNotes}
                  accent="text-gray-700"
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="mb-3 text-sm font-semibold text-red-600">
                  Template liên kết
                </div>
                {state.item.templateId ? (
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>
                      {linkedTemplate?.title ||
                        state.item.templateTitle ||
                        "Template đã gắn"}
                    </div>
                    <div className="text-gray-500">
                      {state.item.templateLevel || linkedTemplate?.level
                        ? `Level ${state.item.templateLevel || linkedTemplate?.level}`
                        : "Không có level"}
                      {state.item.templateSessionIndex ||
                      linkedTemplate?.sessionIndex
                        ? ` • Buổi ${state.item.templateSessionIndex || linkedTemplate?.sessionIndex}`
                        : ""}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Giáo án này chưa gắn mẫu giáo án.
                  </div>
                )}
              </div>
            </>
          ) : state.type === "session-document" ? (
            <SessionDocumentDetailContent state={state} />
          ) : (
            <EmptyState
              title="Không có dữ liệu chi tiết"
              subtitle="Backend không trả về bản ghi phù hợp."
            />
          )}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}

function SessionDocumentDetailContent({
  state,
}: {
  state: SessionDocumentDetailState;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={CalendarDays}
          label="Buổi trong module"
          value={String(state.item?.sessionIndexInModule ?? "-")}
        />
        <InfoCard
          icon={Layers}
          label="Module"
          value={state.item?.moduleName || state.item?.moduleId || "-"}
        />
        <InfoCard
          icon={ShieldCheck}
          label="Trạng thái teaching log"
          value={state.item?.teachingLogStatus || "-"}
        />
        <InfoCard
          icon={CheckCircle2}
          label="Teaching progress"
          value={state.item?.teachingProgressStatus || "-"}
        />
      </div>

      {state.item?.document || state.fallbackTemplate ? (
        <LessonPlanTemplateDocument
          template={state.item?.document || state.fallbackTemplate!}
        />
      ) : state.fallbackContent?.trim() ? (
        <ContentPanel
          title="syllabusContent"
          value={state.fallbackContent}
          accent="text-red-700"
        />
      ) : (
        <EmptyState
          title="Buổi học chưa có syllabus chi tiết"
          subtitle="Backend chưa trả lesson-plan document và session này cũng chưa gắn template khả dụng."
        />
      )}
    </>
  );
}

function SessionCurriculumTable({
  rows,
  currentRowIndex,
  loading,
  error,
  syllabusTitle,
}: {
  rows: CurriculumTableRow[];
  currentRowIndex: number;
  loading: boolean;
  error: string | null;
  syllabusTitle: string;
}) {
  const hasHighlightedRow =
    currentRowIndex >= 0 && currentRowIndex < rows.length;

  return (
    <div className="rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-red-100 bg-gradient-to-r from-amber-50 to-white px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Curriculum của syllabus
            </div>
            <h3 className="mt-1 text-lg font-bold text-gray-900">
              {syllabusTitle}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Bảng curriculum đầy đủ của syllabus. Dòng đang tô là buổi hiện tại
              teacher đang mở.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
            {rows.length} dòng curriculum
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-600">
            <Loader2 size={20} className="mr-3 animate-spin text-amber-600" />
            Đang tải curriculum của syllabus...
          </div>
        ) : error ? (
          <ErrorBox message={error} />
        ) : !rows.length ? (
          <EmptyState
            title="Syllabus chưa có curriculum table"
            subtitle="API syllabus detail chưa trả sessionTemplates hoặc rawContentJson phù hợp để dựng bảng curriculum."
          />
        ) : (
          <div className="space-y-3">
            {hasHighlightedRow ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Đang đối chiếu theo dòng curriculum số{" "}
                <strong>{currentRowIndex + 1}</strong> của syllabus.
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-[1220px] w-full border-collapse text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      #
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Periods
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Topics
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Lessons
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Contents
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Structures
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Student's book
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Teacher's book
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => {
                    const isCurrentRow = rowIndex === currentRowIndex;

                    return (
                      <tr
                        key={`${row.periods}-${row.topics}-${row.lessons}-${rowIndex}`}
                        className={cn(
                          "align-top border-b border-gray-100",
                          isCurrentRow
                            ? "bg-emerald-50/70"
                            : rowIndex % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50/45",
                        )}
                      >
                        <td
                          className={cn(
                            "px-3 py-3 text-xs font-semibold text-gray-500",
                            isCurrentRow && "text-emerald-700",
                          )}
                        >
                          {rowIndex + 1}
                        </td>
                        <td className="px-3 py-3 whitespace-pre-wrap text-gray-700">
                          {row.periods || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-pre-wrap text-gray-700">
                          {row.topics || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-pre-wrap text-gray-700">
                          {row.lessons || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-pre-wrap text-gray-700">
                          {row.contents || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-pre-wrap text-gray-700">
                          {row.structures || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-pre-wrap text-gray-700">
                          {row.studentsBook || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-pre-wrap text-gray-700">
                          {row.teachersBook || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function ModalActions({
  onClose,
  onReset,
  submitting,
  submitLabel,
  showReset = false,
}: {
  onClose: () => void;
  onReset?: () => void;
  submitting: boolean;
  submitLabel: string;
  showReset?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
      >
        Hủy
      </button>
      <div className="flex gap-3">
        {showReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={submitting}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            Đặt lại
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors cursor-pointer",
        active
          ? "border-red-300 bg-red-50 text-red-700"
          : "border-gray-200 bg-white text-gray-700",
      )}
    >
      {label}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer",
        active
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
          : "text-gray-600 hover:bg-red-50",
      )}
    >
      {label}
    </button>
  );
}

function IconButton({
  children,
  label,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "warning";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "rounded-lg border p-2 transition-colors cursor-pointer",
        variant === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600",
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({
  kind,
  children,
}: {
  kind: "success" | "warning" | "muted" | "info";
  children: React.ReactNode;
}) {
  const classes =
    kind === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : kind === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : kind === "info"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-gray-50 text-gray-700";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
        classes,
      )}
    >
      {children}
    </span>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
      <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700"></div>
      <div className="relative flex items-center gap-3">
        <span
          className={cn(
            "w-10 h-10 rounded-xl bg-gradient-to-br grid place-items-center text-white",
            color,
          )}
        >
          <Icon size={18} />
        </span>
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-2xl font-extrabold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ModalFrame({
  title,
  subtitle,
  icon: Icon,
  onClose,
  children,
  widthClass = "max-w-3xl",
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "my-4 max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl",
          widthClass,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r rounded-t-2xl from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 text-white shadow-lg">
                <Icon size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-white/80 mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white transition hover:bg-white/20 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="py-14 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-red-100 to-red-200">
        <Search size={24} className="text-red-400" />
      </div>
      <div className="font-medium text-gray-700">{title}</div>
      <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-red-50/60 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-600">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function ContentPanel({
  title,
  subtitle,
  value,
  accent,
}: {
  title: string;
  subtitle?: string;
  value?: string | null;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className={cn("text-sm font-semibold", accent)}>{title}</div>
      {subtitle ? (
        <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
      ) : null}
      <div className="mt-3">
        <StructuredContent value={value} placeholder="Chưa có nội dung." />
      </div>
    </div>
  );
}

function SpreadsheetList({
  value,
  empty = "-",
}: {
  value: unknown;
  empty?: string;
}) {
  const items = linesFromUnknown(value);

  if (!items.length) {
    return <div className="text-sm text-gray-400">{empty}</div>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="whitespace-pre-wrap text-sm text-gray-700"
        >
          {renderLinkifiedText(item)}
        </div>
      ))}
    </div>
  );
}

function SheetCellValue({
  value,
  empty = "-",
}: {
  value: unknown;
  empty?: string;
}) {
  if (Array.isArray(value)) {
    return <SpreadsheetList value={value} empty={empty} />;
  }

  if (value && typeof value === "object") {
    const flattened = flattenUnknownToLines(value);
    return <SpreadsheetList value={flattened} empty={empty} />;
  }

  const text =
    typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (!text) {
    return <div className="text-sm text-gray-400">{empty}</div>;
  }

  return (
    <div className="whitespace-pre-wrap text-sm text-gray-700">
      {renderLinkifiedText(text)}
    </div>
  );
}

function isMetadataSheetObject(objectValue: Record<string, unknown>) {
  return [
    "day",
    "days",
    "scheduleDays",
    "duration",
    "generalInformation",
    "generalInfo",
    "teachingMaterials",
    "note",
    "lines",
  ].some((key) => objectValue[key] !== undefined && objectValue[key] !== null);
}

function isSessionSheetObject(objectValue: Record<string, unknown>) {
  const hasSessionCoreField = [
    "sessionIndex",
    "title",
    "dateLabel",
    "teacherName",
    "homeworkLabel",
    "homeworkMaterials",
    "homeworkNotes",
  ].some(
    (key) =>
      objectValue[key] !== undefined &&
      objectValue[key] !== null &&
      String(objectValue[key]).trim() !== "",
  );
  const hasNonEmptyActivities =
    Array.isArray(objectValue.activities) &&
    objectValue.activities.some(
      (item) =>
        asObject(item) !== null && Object.keys(asObject(item) || {}).length > 0,
    );

  return hasSessionCoreField || hasNonEmptyActivities;
}

function MetadataSheetView({
  objectValue,
}: {
  objectValue: Record<string, unknown>;
}) {
  const parsedFromLines = parseMetadataFromLinesObject(objectValue);
  const sheetTitle =
    pickStringValue(objectValue, ["title", "sheetTitle"]) || "SYLLABUS";
  const day =
    pickStringValue(objectValue, ["day", "days", "scheduleDays"]) ||
    parsedFromLines?.day ||
    "";
  const duration =
    pickStringValue(objectValue, ["duration"]) ||
    parsedFromLines?.duration ||
    "";
  const generalInformation =
    pickStringValue(objectValue, [
      "generalInformation",
      "generalInfo",
      "description",
    ]) ||
    parsedFromLines?.generalInformation ||
    "";
  const teachingMaterials =
    linesToTextarea(objectValue.teachingMaterials) ||
    parsedFromLines?.teachingMaterialsText ||
    "";
  const note =
    pickStringValue(objectValue, ["note"]) || parsedFromLines?.note || "";
  const extraEntries = Object.entries(objectValue).filter(
    ([key]) =>
      ![
        "title",
        "sheetTitle",
        "day",
        "days",
        "scheduleDays",
        "duration",
        "generalInformation",
        "generalInfo",
        "description",
        "teachingMaterials",
        "note",
        "lines",
      ].includes(key),
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
      <div className="border-b border-gray-300 bg-amber-50 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-gray-900">
        {sheetTitle}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <tbody>
            <tr>
              <th className="w-48 border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">
                Day
              </th>
              <td className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={day} />
              </td>
              <th className="w-48 border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">
                Duration
              </th>
              <td className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={duration} />
              </td>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">
                General information
              </th>
              <td colSpan={3} className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={generalInformation} />
              </td>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">
                Teaching materials
              </th>
              <td colSpan={3} className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={teachingMaterials} />
              </td>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">
                Note
              </th>
              <td colSpan={3} className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={note} />
              </td>
            </tr>
            {extraEntries.map(([key, extraValue]) => (
              <tr key={key}>
                <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold uppercase tracking-wide text-gray-700">
                  {key}
                </th>
                <td colSpan={3} className="border border-gray-300 px-3 py-2">
                  <SheetCellValue value={extraValue} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SessionSheetView({
  objectValue,
}: {
  objectValue: Record<string, unknown>;
}) {
  const activities = Array.isArray(objectValue.activities)
    ? objectValue.activities.filter(
        (item): item is Record<string, unknown> => asObject(item) !== null,
      )
    : [];
  const notes = Array.isArray(objectValue.notes) ? objectValue.notes : [];
  const extraEntries = Object.entries(objectValue).filter(
    ([key]) =>
      ![
        "sessionIndex",
        "title",
        "dateLabel",
        "teacherName",
        "notes",
        "homeworkLabel",
        "homeworkMaterials",
        "homeworkNotes",
        "activities",
      ].includes(key),
  );
  const rowSpan = Math.max(activities.length, 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
      <div className="border-b border-gray-300 bg-amber-50 px-4 py-3 text-sm font-bold uppercase tracking-wide text-gray-900">
        {pickStringValue(objectValue, ["title"]) || "Session sheet"}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="text-gray-700">
              <th
                rowSpan={2}
                className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold"
              >
                Period
              </th>
              <th
                rowSpan={2}
                className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold"
              >
                Date
              </th>
              <th
                rowSpan={2}
                className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold"
              >
                Teacher
              </th>
              <th
                rowSpan={2}
                className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold"
              >
                Time
              </th>
              <th
                rowSpan={2}
                className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold"
              >
                Book
              </th>
              <th
                rowSpan={2}
                className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold"
              >
                Skills
              </th>
              <th
                colSpan={2}
                className="border border-gray-300 bg-amber-100 px-3 py-2 text-center font-semibold"
              >
                Content
              </th>
              <th
                colSpan={2}
                className="border border-gray-300 bg-blue-100 px-3 py-2 text-center font-semibold"
              >
                Homework
              </th>
            </tr>
            <tr className="text-gray-700">
              <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">
                Classwork
              </th>
              <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">
                Required materials
              </th>
              <th className="border border-gray-300 bg-blue-100 px-3 py-2 text-left font-semibold">
                Required materials
              </th>
              <th className="border border-gray-300 bg-blue-100 px-3 py-2 text-left font-semibold">
                Extra / Note
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.length ? (
              activities.map(
                (activity: Record<string, unknown>, index: number) => {
                  const classworkText = String(
                    activity.classwork ?? "",
                  ).toUpperCase();
                  const isBreaktime =
                    classworkText.includes("BREAKTIME") ||
                    classworkText.includes("BREAK TIME");

                  return (
                    <tr
                      key={`activity-${index}`}
                      className={cn(
                        "align-top",
                        isBreaktime
                          ? "bg-gray-100 font-semibold text-gray-800"
                          : "bg-white",
                      )}
                    >
                      {index === 0 ? (
                        <td
                          rowSpan={rowSpan}
                          className="border border-gray-300 bg-gray-50 px-3 py-2 align-middle text-center"
                        >
                          <SheetCellValue value={objectValue.sessionIndex} />
                        </td>
                      ) : null}
                      {index === 0 ? (
                        <td
                          rowSpan={rowSpan}
                          className="border border-gray-300 bg-gray-50 px-3 py-2 align-middle text-center"
                        >
                          <SheetCellValue value={objectValue.dateLabel} />
                        </td>
                      ) : null}
                      {index === 0 ? (
                        <td
                          rowSpan={rowSpan}
                          className="border border-gray-300 bg-gray-50 px-3 py-2 align-middle"
                        >
                          <SheetCellValue value={objectValue.teacherName} />
                        </td>
                      ) : null}
                      <td className="h-12 border border-gray-300 px-3 py-2 align-middle">
                        <SheetCellValue value={activity.time} />
                      </td>
                      <td className="h-12 border border-gray-300 px-3 py-2 align-middle">
                        <SheetCellValue value={activity.book} />
                      </td>
                      <td className="h-12 border border-gray-300 px-3 py-2 align-middle">
                        <SheetCellValue value={activity.skills} />
                      </td>
                      <td
                        className={cn(
                          "h-12 border border-gray-300 bg-amber-50/40 px-3 py-2 align-middle",
                          isBreaktime ? "text-center" : "",
                        )}
                      >
                        <SheetCellValue value={activity.classwork} />
                      </td>
                      <td className="h-12 border border-gray-300 bg-amber-50/40 px-3 py-2 align-middle">
                        <SheetCellValue value={activity.requiredMaterials} />
                      </td>
                      <td className="h-12 border border-gray-300 bg-blue-50/40 px-3 py-2 align-middle">
                        <SheetCellValue
                          value={activity.homeworkRequiredMaterials}
                        />
                      </td>
                      <td className="h-12 border border-gray-300 bg-blue-50/40 px-3 py-2 align-middle">
                        <SheetCellValue value={activity.extra} />
                      </td>
                    </tr>
                  );
                },
              )
            ) : (
              <tr>
                <td
                  className="border border-gray-300 px-3 py-4 text-center text-sm text-gray-400"
                  colSpan={10}
                >
                  Chưa có activity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {notes.length ? (
        <div className="border-t border-gray-300 bg-white px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Notes
          </div>
          <SpreadsheetList value={notes} />
        </div>
      ) : null}

      {objectValue.homeworkLabel ||
      linesFromUnknown(objectValue.homeworkMaterials).length ||
      linesFromUnknown(objectValue.homeworkNotes).length ? (
        <div className="border-t border-gray-300 bg-amber-50/40 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Homework block
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-300 bg-white p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Label
              </div>
              <SheetCellValue value={objectValue.homeworkLabel} />
            </div>
            <div className="rounded-xl border border-gray-300 bg-white p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Required materials
              </div>
              <SheetCellValue value={objectValue.homeworkMaterials} />
            </div>
            <div className="rounded-xl border border-gray-300 bg-white p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Notes
              </div>
              <SheetCellValue value={objectValue.homeworkNotes} />
            </div>
          </div>
        </div>
      ) : null}

      {extraEntries.length ? (
        <div className="border-t border-gray-300 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {extraEntries.map(([key, extraValue]) => (
              <div
                key={key}
                className="rounded-xl border border-gray-300 bg-gray-50 p-3"
              >
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {key}
                </div>
                <SheetCellValue value={extraValue} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StructuredContent({
  value,
  placeholder,
}: {
  value?: string | null;
  placeholder: string;
}) {
  if (!value?.trim()) {
    return <div className="text-sm text-gray-500">{placeholder}</div>;
  }

  const parsed = parseJsonContent(value);

  if (!parsed) {
    return (
      <div className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
        {renderLinkifiedText(value)}
      </div>
    );
  }

  if (Array.isArray(parsed)) {
    return <SpreadsheetList value={parsed} empty={placeholder} />;
  }

  const objectValue = parsed as Record<string, unknown>;
  if (isMetadataSheetObject(objectValue)) {
    return <MetadataSheetView objectValue={objectValue} />;
  }

  if (isSessionSheetObject(objectValue)) {
    return <SessionSheetView objectValue={objectValue} />;
  }

  const activities = Array.isArray(objectValue.activities)
    ? objectValue.activities.filter(
        (item): item is Record<string, unknown> => asObject(item) !== null,
      )
    : [];
  const notes = Array.isArray(objectValue.notes) ? objectValue.notes : [];
  const summaryKeys = ["sessionIndex", "title", "dateLabel", "teacherName"];
  const extraEntries = Object.entries(objectValue).filter(
    ([key]) =>
      !summaryKeys.includes(key) && key !== "activities" && key !== "notes",
  );
  const renderStructuredValue = (entry: unknown) => {
    if (Array.isArray(entry)) {
      return (
        <div className="space-y-1">
          {entry.map((item: unknown, index: number) => (
            <div
              key={`${String(item)}-${index}`}
              className="whitespace-pre-wrap text-sm text-gray-700"
            >
              {String(item)}
            </div>
          ))}
        </div>
      );
    }

    if (entry && typeof entry === "object") {
      return <SpreadsheetList value={flattenUnknownToLines(entry)} empty="-" />;
    }

    return (
      <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
        {renderLinkifiedText(String(entry ?? "-"))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {summaryKeys.map((key) =>
          objectValue[key] !== undefined &&
          objectValue[key] !== null &&
          objectValue[key] !== "" ? (
            <StatusBadge key={key} kind="muted">
              {key}: {String(objectValue[key])}
            </StatusBadge>
          ) : null,
        )}
      </div>

      {notes.length ? (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Notes
          </div>
          <div className="flex flex-wrap gap-2">
            {notes.map((note: unknown, index: number) => (
              <StatusBadge key={`${String(note)}-${index}`} kind="warning">
                {String(note)}
              </StatusBadge>
            ))}
          </div>
        </div>
      ) : null}

      {activities.length ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Activities
          </div>
          {activities.map(
            (activity: Record<string, unknown>, index: number) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-gray-50 p-3"
              >
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(activity || {}).map(
                    ([key, activityValue]) => (
                      <div key={key}>
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {key}
                        </div>
                        <div className="mt-1">
                          <SheetCellValue value={activityValue} />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      ) : null}

      {extraEntries.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {extraEntries.map(([key, extraValue]) => (
            <div
              key={key}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {key}
              </div>
              <div className="mt-1">{renderStructuredValue(extraValue)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default LessonPlanWorkspace;
