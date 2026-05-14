"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardPen,
  Clock3,
  Eye,
  FilePlus2,
  FileText,
  FolderOpen,
  GraduationCap,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BASE_URL, buildFileUrl } from "@/constants/apiURL";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import { getAllClasses } from "@/lib/api/classService";
import {
  ClassLessonPlanSyllabus,
  ClassLessonPlanSyllabusSession,
  createLessonPlan,
  createLessonPlanTemplate,
  getAllLessonPlanTemplates,
  getClassLessonPlanSyllabus,
  getLessonPlanById,
  getLessonPlanTemplateById,
  importLessonPlanTemplates,
  LessonPlan,
  LessonPlanTemplate,
  updateLessonPlan,
  updateLessonPlanTemplate,
  uploadLessonPlanFile,
} from "@/lib/api/lessonPlanService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import { getTeacherClasses } from "@/lib/api/teacherService";

type WorkspaceScope = "teacher" | "staff-management" | "admin";
type ActiveTab = "templates" | "plans";
type TemplateStatusFilter = "all" | "active" | "inactive" | "withAttachment";
type PlanStatusFilter = "all" | "editable" | "hasPlan" | "missingPlan" | "withTemplate" | "reported" | "notReported";

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
  | { type: "template"; loading: boolean; item: LessonPlanTemplate | null; error?: string }
  | { type: "plan"; loading: boolean; item: LessonPlan | null; error?: string }
  | null;

type DetailModalState = Exclude<DetailState, null>;



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
    subtitle: "Theo dõi syllabus của lớp, tạo giáo án theo từng buổi và cập nhật nội dung dạy thực tế.",
    planSubtitle: "Syllabus theo lớp của bạn",
  },
  "staff-management": {
    title: "Không gian quản lý giáo án",
    subtitle: "Quản lý syllabus chuẩn, nhập mẫu giáo án và rà soát giáo án theo từng lớp.",
    planSubtitle: "Syllabus theo lớp toàn trung tâm",
  },
  admin: {
    title: "Không gian quản lý giáo án",
    subtitle: "Quản trị mẫu giáo án và đồng bộ luồng giáo án theo contract backend mới.",
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

function formatDate(value?: string | null, withTime = false, fallback = "Chưa cập nhật") {
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
    item?.title || item?.name || item?.classTitle || item?.code || item?.classCode || "Lớp học";
  const hint = [item?.code || item?.classCode, item?.programName, item?.level]
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

function extractMessage(result: { message?: string; detail?: string; title?: string } | null | undefined, fallback: string) {
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
  if (typeof parsed === "object") return Object.keys(parsed as Record<string, unknown>).length > 0;
  return true;
}

function isTrivialPlannedContent(value?: string | null) {
  const text = value?.trim();
  if (!text) return true;

  const parsed = parseJsonContent(text);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return false;

  const objectValue = parsed as Record<string, unknown>;
  const keys = Object.keys(objectValue);
  const allowedKeys = new Set(["sessionIndex", "activities"]);
  const hasOnlySkeletonKeys = keys.every((key) => allowedKeys.has(key));
  const hasEmptyActivities = Array.isArray(objectValue.activities) && objectValue.activities.length === 0;

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
  excludeId?: string
): number {
  const indices = templates
    .filter((t) => t.programId === programId && t.id !== excludeId && t.sessionIndex != null)
    .map((t) => t.sessionIndex!);
  if (indices.length === 0) return 1;
  return Math.max(...indices) + 1;
}

function pickSharedProgramTemplate(
  templates: LessonPlanTemplate[],
  programId?: string | null
): LessonPlanTemplate | undefined {
  if (!programId) return undefined;

  const inProgram = templates.filter((item) => item.programId === programId);
  if (!inProgram.length) return undefined;

  const active = inProgram.filter((item) => getTemplateStatus(item) === "active");
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

function pickStringValue(
  obj: Record<string, unknown> | null,
  keys: string[]
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
      if (MATERIAL_SECTION_RE.test(line) || line.startsWith("+ ") || /^https?:\/\//i.test(line)) {
        materialLines.push(line);
        mode = "materials";
      } else {
        generalInformation = generalInformation ? `${generalInformation}\n${line}` : line;
      }
    } else if (mode === "materials") {
      materialLines.push(line);
    } else if (mode === "note") {
      note = note ? `${note}\n${line}` : line;
    }
    // mode === "none": skip header lines like "LINES", "SYLLABUS - COURSE TEMPLATE"
  }

  const hasContent = day || duration || generalInformation || materialLines.length || note;
  if (!hasContent) return null;

  return { day, duration, generalInformation, teachingMaterialsText: materialLines.join("\n"), note };
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
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join("\n");
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

function parseTeachingMaterialLine(line: string, index: number): TeachingMaterialDraft {
  const normalized = line.replace(/^\+\s*/, "").trim();
  const colonIndex = normalized.indexOf(":");
  if (colonIndex < 0) {
    return {
      title: `Tài liệu ${index + 1}`,
      resource: normalized,
    };
  }

  const title = normalized.slice(0, colonIndex).trim() || `Tài liệu ${index + 1}`;
  const resource = normalized.slice(colonIndex + 1).trim();
  return {
    title,
    resource,
  };
}

function parseTeachingMaterialsTextToDrafts(text: string): TeachingMaterialDraft[] {
  const lines = textareaToLines(text);
  if (!lines.length) return [createEmptyTeachingMaterial()];
  return lines.map((line, index) => parseTeachingMaterialLine(line, index));
}

function stringifyTeachingMaterialDrafts(items: TeachingMaterialDraft[]): string {
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

function removeEmptyDeep(obj: Record<string, unknown>): Record<string, unknown> {
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

type TemplateActivityPresetKey = "warmup" | "reading" | "speaking" | "writing" | "listening" | "review";

const TEMPLATE_ACTIVITY_PRESETS: { key: TemplateActivityPresetKey; label: string }[] = [
  { key: "warmup", label: "Warm Up" },
  { key: "reading", label: "Reading" },
  { key: "speaking", label: "Speaking" },
  { key: "writing", label: "Writing" },
  { key: "listening", label: "Listening" },
  { key: "review", label: "Review" },
];

function createPresetTemplateActivity(preset: TemplateActivityPresetKey): TemplateActivityDraft {
  const base = createEmptyTemplateActivity();
  switch (preset) {
    case "warmup":
      return { ...base, time: "5 mins", skills: "Warm Up", classwork: "WARM UP\nHomework Correction" };
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
  if (!Array.isArray(value) || value.length === 0) return [createEmptyTemplateActivity()];
  return value.map((item) => {
if (typeof item !== "object" || !item) return createEmptyTemplateActivity();
    const obj = item as Record<string, unknown>;
    return {
      time: typeof obj.time === "string" ? obj.time : "",
      book: typeof obj.book === "string" ? obj.book : "",
      skills: typeof obj.skills === "string" ? obj.skills : "",
      classwork: typeof obj.classwork === "string" ? obj.classwork : "",
      requiredMaterials: typeof obj.requiredMaterials === "string" ? obj.requiredMaterials : "",
      homeworkRequiredMaterials: typeof obj.homeworkRequiredMaterials === "string" ? obj.homeworkRequiredMaterials : "",
      extra: typeof obj.extra === "string" ? obj.extra : "",
    };
  });
}

function stringifyPrettyJson(value: unknown): string {
  if (!value || (typeof value === "object" && Object.keys(value as object).length === 0)) return "";
  return JSON.stringify(value, null, 2);
}

function prettifyJsonText(value?: string | null): string {
  const text = value?.trim();
  if (!text) return "";
  const parsed = parseJsonContent(text);
  return parsed ? JSON.stringify(parsed, null, 2) : text;
}

function linesFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string" && v.trim()).map(String);
  if (typeof value === "string" && value.trim()) return value.split("\n").filter(Boolean);
  return [];
}

function flattenUnknownToLines(value: unknown, prefix = ""): string[] {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenUnknownToLines(item, prefix));
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
      flattenUnknownToLines(nested, prefix ? `${prefix}.${key}` : key)
    );
  }

  const text = String(value).trim();
  if (!text) return [];
  return [prefix ? `${prefix}: ${text}` : text];
}

const URL_IN_TEXT_REGEX = /(https?:\/\/[^\s<>"']+)/gi;

function stripTrailingPunctuation(value: string): { clean: string; trailing: string } {
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
      </a>
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

function getSessionDisplay(session: Pick<ClassLessonPlanSyllabusSession, "sessionIndex" | "sessionDate">) {
  return `Buổi ${session.sessionIndex}${normalizeDateValue(session.sessionDate) ? ` • ${formatDate(session.sessionDate, true)}` : ""}`;
}

function getClassDisplay(syllabus: ClassLessonPlanSyllabus | null) {
  if (!syllabus) return "Chưa chọn lớp";
  return syllabus.classTitle || syllabus.classCode || "Lớp học";
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
      value: String(templates.filter((item) => getTemplateStatus(item) === "active").length),
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
      value: String(templates.reduce((sum, item) => sum + (item.usedCount || 0), 0)),
      subtitle: "Số lần gắn vào giáo án",
      icon: ShieldCheck,
      color: "from-amber-500 to-orange-500",
    },
  ];
}

function getPlanStats(syllabus: ClassLessonPlanSyllabus | null) {
  const sessions = syllabus?.sessions || [];

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

export function LessonPlanWorkspace({ scope }: { scope: WorkspaceScope }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(scope === "teacher" ? "plans" : "templates");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [templates, setTemplates] = useState<LessonPlanTemplate[]>([]);
  const [classSyllabus, setClassSyllabus] = useState<ClassLessonPlanSyllabus | null>(null);
  const [programOptions, setProgramOptions] = useState<Option[]>([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [templateStatusFilter, setTemplateStatusFilter] = useState<TemplateStatusFilter>("all");
  const [planStatusFilter, setPlanStatusFilter] = useState<PlanStatusFilter>("all");
  const [selectedProgramId, setSelectedProgramId] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("");

  const [templateModal, setTemplateModal] = useState<TemplateModalState>(null);
  const [planModal, setPlanModal] = useState<PlanModalState>(null);
  const [detailState, setDetailState] = useState<DetailState>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const scopeCopy = COPY[scope];
  const isTeacher = scope === "teacher";
  const templatesAvailable = !isTeacher;

  const templateMap = useMemo(() => {
    return new Map(templates.map((item) => [item.id, item]));
  }, [templates]);

  const sharedProgramTemplate = useMemo(
    () => pickSharedProgramTemplate(templates, classSyllabus?.programId),
    [classSyllabus?.programId, templates]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveTab(scope === "teacher" ? "plans" : "templates");
    }, 0);
    return () => clearTimeout(timer);
  }, [scope]);

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
        }))
    );
  };

  const loadClasses = async () => {
    if (isTeacher) {
      const response = await getTeacherClasses({ pageNumber: 1, pageSize: 100 });
      const responseData = response?.data as { classes?: { items?: ClassOptionSource[] } | ClassOptionSource[] } | undefined;
      const source = Array.isArray(response?.data?.classes?.items)
        ? response.data.classes.items
        : Array.isArray(responseData?.classes)
          ? responseData.classes
          : [];

      const options = source.map(buildClassOption).filter((item: Option) => item.id);
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

    const options = source.map(buildClassOption).filter((item: Option) => item.id);
    setClassOptions(options);
  };

  const loadTemplates = async () => {
    if (!templatesAvailable) {
      setTemplates([]);
      return;
    }

    const response = await getAllLessonPlanTemplates({ pageNumber: 1, pageSize: 200 });
    if (!response.isSuccess) {
      throw new Error(extractMessage(response, "Không thể tải danh sách template."));
    }

    setTemplates(response.data.templates.items);
  };

  const loadClassSyllabus = async (classId: string) => {
    if (!classId) {
      setClassSyllabus(null);
      return;
    }

    const response = await getClassLessonPlanSyllabus(classId);
    if (!response.isSuccess) {
      throw new Error(extractMessage(response, "Không thể tải syllabus của lớp."));
    }

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
    const rejected = results.find((item) => item.status === "rejected") as PromiseRejectedResult | undefined;

    if (rejected) {
      toast({
        title: "Không thể tải dữ liệu",
        description: rejected.reason?.message || "Đã xảy ra lỗi khi đồng bộ dữ liệu giáo án.",
        variant: "destructive",
      });
    }

    setLoading(false);
    setRefreshing(false);
    setIsLoaded(true);
  };

  const refreshWorkspaceRef = useRef(refreshWorkspace);

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
        if (selectedProgramId !== "all" && item.programId !== selectedProgramId) {
          return false;
        }

        if (templateStatusFilter === "active" && getTemplateStatus(item) !== "active") {
          return false;
        }

        if (templateStatusFilter === "inactive" && getTemplateStatus(item) !== "inactive") {
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
  }, [searchQuery, selectedProgramId, templateStatusFilter, templates]);

  const filteredSessions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const sessions = classSyllabus?.sessions || [];

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
  }, [classSyllabus, planStatusFilter, searchQuery, sharedProgramTemplate?.id]);

  const stats = useMemo(() => {
return activeTab === "templates" && templatesAvailable
      ? getTemplateStats(templates)
      : getPlanStats(classSyllabus);
  }, [activeTab, classSyllabus, templates, templatesAvailable]);

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

    setDetailState({ type: "plan", loading: false, item: response.data });
  };

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

    setPlanModal({ mode: "edit", session, plan: response.data });
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
    file: File | null
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
      title: templateModal?.mode === "edit" ? "Đã cập nhật template" : "Đã tạo template",
      description: "Dữ liệu template đã được đồng bộ thành công.",
      variant: "success",
    });

    setTemplateModal(null);
    await loadTemplates();
  };

  const handleImportSubmit = async (payload: {
    file: File;
    programId?: string;
    level?: string;
    overwriteExisting: boolean;
  }) => {
    const response = await importLessonPlanTemplates({
      file: payload.file,
      programId: payload.programId,
      level: payload.level,
      overwriteExisting: payload.overwriteExisting,
    });

    if (!response.isSuccess || !response.data) {
      throw new Error(extractMessage(response, "Không thể import syllabus."));
    }

    const importedPrograms = response.data.programs
      .map((item) => `${item.programName || item.programId}: ${item.importedSessions}`)
      .join(" • ");

    toast({
      title: "Nhập syllabus thành công",
      description:
        importedPrograms || `Đã nhập ${response.data.importedCount} mẫu buổi học.`,
      variant: "success",
    });

    setShowImportModal(false);
    await loadTemplates();
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
            templateId: isTeacher ? (payload.templateId ?? planModal.plan.templateId ?? null) : (payload.templateId ?? null),
plannedContent: isTeacher ? (planModal.plan.plannedContent ?? null) : (payload.plannedContent ?? null),
            actualContent: payload.actualContent ?? null,
            actualHomework: payload.actualHomework ?? null,
            teacherNotes: payload.teacherNotes ?? null,
          })
        : await createLessonPlan({
            classId: classSyllabus.classId,
            sessionId: payload.session.sessionId,
            templateId: isTeacher ? (payload.templateId ?? payload.session.templateId ?? null) : (payload.templateId ?? null),
            plannedContent: isTeacher ? null : (payload.plannedContent ?? null),
            actualContent: payload.actualContent ?? null,
            actualHomework: payload.actualHomework ?? null,
            teacherNotes: payload.teacherNotes ?? null,
          });

    if (!response.isSuccess) {
      throw new Error(extractMessage(response, "Không thể lưu giáo án."));
    }

    toast({
      title: planModal?.mode === "edit" ? "Đã cập nhật giáo án" : "Đã tạo giáo án",
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

    return templates.filter((item) => item.programId === classSyllabus.programId);
  }, [classSyllabus, templates]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/40 to-white p-2 space-y-6">
      <div className={cn("flex flex-col gap-4 transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <BookOpenCheck size={25} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{scopeCopy.title}</h1>
              <p className="mt-1 max-w-3xl text-sm text-gray-600">{scopeCopy.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refreshWorkspace(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 cursor-pointer"
            >
              <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
              Làm mới
            </button>

            {templatesAvailable && activeTab === "templates" ? (
              <>
                <button
                  type="button"
onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 cursor-pointer"
                >
                  <Upload size={16} />
                  Nhập syllabus
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateModal({ mode: "create" })}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg cursor-pointer"
                >
                  <Plus size={16} />
                  Tạo mẫu giáo án
                </button>
              </>
            ) : null}
          </div>
        </div>

      </div>

      {templatesAvailable ? (
        <div className={cn("inline-flex rounded-2xl border border-red-200 bg-white p-1 transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")}>
          <TabButton active={activeTab === "templates"} label="Mẫu giáo án" onClick={() => setActiveTab("templates")} />
          <TabButton active={activeTab === "plans"} label="Giáo án lớp" onClick={() => setActiveTab("plans")} />
        </div>
      ) : null}
<div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")}>
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
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        programOptions={programOptions}
        classOptions={classOptions}
      />

      <div className={cn("rounded-2xl border border-red-200 bg-white shadow-sm transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")}>
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
          />
        ) : (
          <SyllabusView
            scope={scope}
            syllabus={classSyllabus}
            items={filteredSessions}
            templateMap={templateMap}
            sharedTemplate={sharedProgramTemplate}
            onCreate={(session) => setPlanModal({ mode: "create", session })}
            onEdit={openPlanEditor}
            onOpenPlanDetail={(lessonPlanId) => openPlanDetail(lessonPlanId)}
            onOpenTemplateDetail={templatesAvailable ? openTemplateDetail : undefined}
          />
        )}
      </div>

      {templateModal ? (
        <TemplateFormModal
          initialValue={templateModal.mode === "edit" ? templateModal.item : null}
          programOptions={programOptions}
          existingTemplates={templates}
          defaultProgramId={templateModal.mode === "create" && selectedProgramId !== "all" ? selectedProgramId : undefined}
          onClose={() => setTemplateModal(null)}
          onSubmit={handleTemplateSubmit}
        />
      ) : null}

      {showImportModal ? (
        <ImportTemplateModal
          programOptions={programOptions}
          onClose={() => setShowImportModal(false)}
          onSubmit={handleImportSubmit}
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
  selectedClassId,
  onClassChange,
  programOptions,
  classOptions,
  activeTab,
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
  selectedClassId: string;
  onClassChange: (id: string) => void;
  programOptions: Option[];
  classOptions: Option[];
  activeTab: ActiveTab;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
      <div className="space-y-4">
        {/* Status Filter Tabs - Templates */}
        {activeTab === "templates" && templatesAvailable && (
          <div className="flex text-sm flex-wrap gap-2 pb-4 border-b border-red-200">
            {(["all", "active", "inactive", "withAttachment"] as const).map((status) => {
              const labels: Record<typeof status, string> = {
                all: "Tất cả trạng thái",
                active: "Đang hoạt động",
                inactive: "Tạm ẩn",
                withAttachment: "Có file đính kèm",
              };

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
                  {labels[status]}
                </button>
              );
            })}
          </div>
        )}

        {/* Status Filter Tabs - Plans */}
        {activeTab === "plans" && (
          <div className="flex text-sm flex-wrap gap-2 pb-4 border-b border-red-200">
            {(["all", "editable", "hasPlan", "missingPlan", "reported", "notReported"] as const).map((status) => {
              const labels: Record<typeof status, string> = {
                all: "Tất cả buổi học",
                editable: "Có thể chỉnh sửa",
                hasPlan: "Đã có giáo án",
                missingPlan: "Chưa có giáo án",
                reported: "Đã báo cáo",
                notReported: "Chưa báo cáo",
              };

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
                  {labels[status]}
                </button>
              );
            })}
          </div>
        )}

        {/* Search Box */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={activeTab === "templates" ? "Tìm theo tên mẫu giáo án, chương trình..." : "Tìm theo buổi học, giáo viên..."}
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "templates" && templatesAvailable ? (
              <>
                <Select value={selectedProgramId} onValueChange={onProgramChange}>
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

function TemplateTable({
  items,
  onOpenAttachment,
  onOpenDetail,
  onEdit,
}: {
  items: LessonPlanTemplate[];
  onOpenAttachment: (url?: string | null) => void;
  onOpenDetail: (item: LessonPlanTemplate) => void;
  onEdit: (item: LessonPlanTemplate) => void;
}) {
  if (!items.length) {
    return <EmptyState title="Chưa có mẫu giáo án phù hợp" subtitle="Thử đổi bộ lọc hoặc nhập syllabus để tạo dữ liệu mới." />;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Danh sách mẫu giáo án</h2>
          <span className="text-sm text-gray-600">{items.length} mẫu</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Tên mẫu</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Chương trình</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Buổi học</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Nguồn</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Trạng thái</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-red-50/40">
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                  <div className="mt-1 text-sm text-gray-500">Cấp độ {item.level || "-"}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <div>{item.programName || item.programId}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.createdByName || "Không rõ người tạo"}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{item.sessionIndex === 1 ? "Template chung (neo Buổi 1)" : `Buổi ${item.sessionIndex || "-"}`}</td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                  <div>{item.sourceFileName || "Tạo thủ công"}</div>
                  {item.attachment ? (
                    <button
                      type="button"
                      onClick={() => onOpenAttachment(item.attachment)}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                    >
                      <Paperclip size={11} />
                      Mở file
                    </button>
                  ) : null}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-nowrap gap-1">
                      <StatusBadge kind={getTemplateStatus(item) === "active" ? "success" : "muted"}>
                        <div className="flex items-center gap-0.5">
                          {getTemplateStatus(item) === "active" ? (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Đang hoạt động</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={14} />
                              <span>Tạm ẩn</span>
                            </>
                          )}
                        </div>
                      </StatusBadge>
                      {item.attachment ? (
                        <StatusBadge kind="info">
                          <div className="flex items-center gap-0.5">
                            <Paperclip size={14} />
                            <span>Có attachment</span>
                          </div>
                        </StatusBadge>
                      ) : null}
                    </div>
                    {(item.usedCount || 0) > 0 ? (
                      <StatusBadge kind="warning">
                        <div className="flex items-center gap-0.5">
                          <ShieldCheck size={14} />
                          <span>Dùng {item.usedCount} lần</span>
                        </div>
                      </StatusBadge>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex justify-end items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(item)}
                      className="text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="text-gray-500 hover:text-amber-600 transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Modern SyllabusView Component
function SyllabusView({
  scope,
  syllabus,
  items,
  templateMap,
  sharedTemplate,
  onCreate,
  onEdit,
  onOpenPlanDetail,
  onOpenTemplateDetail,
}: {
  scope: WorkspaceScope;
  syllabus: ClassLessonPlanSyllabus | null;
  items: ClassLessonPlanSyllabusSession[];
  templateMap: Map<string, LessonPlanTemplate>;
  sharedTemplate?: LessonPlanTemplate;
  onCreate: (session: ClassLessonPlanSyllabusSession) => void;
  onEdit: (session: ClassLessonPlanSyllabusSession) => void;
  onOpenPlanDetail: (lessonPlanId: string) => void;
  onOpenTemplateDetail?: (templateId: string) => void;
}) {
  if (!syllabus) {
    return <EmptyState title="Chưa có syllabus" subtitle="Chọn một lớp để tải read model syllabus từ backend." />;
  }

  if (!items.length) {
    return <EmptyState title="Không có session phù hợp" subtitle="Thử đổi bộ lọc hoặc kiểm tra lớp này đã có session chưa." />;
  }

  return (
    <div className="space-y-5">
      {/* Modern Class Header Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-600 to-red-700 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                <GraduationCap size={20} className="text-white" />
              </div>
              <span className="text-sm font-medium text-red-100">Giáo án lớp học</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {syllabus.classCode || "Lớp chưa có mã"}
              </h3>
              {syllabus.classTitle && (
                <p className="mt-1 text-base text-red-100">{syllabus.classTitle}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {syllabus.programName && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <BookOpenCheck size={12} />
                  {syllabus.programName}
                </span>
              )}
<span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <CalendarDays size={12} />
                {items.length} buổi học
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <FileText size={12} />
                {items.filter((s) => s.lessonPlanId).length}/{items.length} có giáo án
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl bg-white/15 px-4 py-2 backdrop-blur-sm">
              <div className="text-xs font-medium text-red-100">Quyền truy cập</div>
              <div className="text-sm font-semibold text-white">
                {scope === "teacher" ? "Giáo viên" : "Quản lý"}
              </div>
            </div>
          </div>
        </div>

        {syllabus.syllabusMetadata ? (
          <details className="relative mt-5 group">
            <summary className="cursor-pointer rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20">
              📋 Xem thông tin chung của syllabus
            </summary>
            <div className="mt-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <StructuredContent value={syllabus.syllabusMetadata} placeholder="Chưa có metadata." />
            </div>
          </details>
        ) : null}
      </div>

      {/* Session Cards Grid */}
      <div className="grid gap-5">
        {items.map((session) => {
          const linkedTemplate = session.templateId ? templateMap.get(session.templateId) : undefined;
          const resolvedTemplate = linkedTemplate || (session.templateId ? undefined : sharedTemplate);
          const hasTemplate = Boolean(session.templateId || session.templateSyllabusContent || resolvedTemplate?.syllabusContent);
          const hasReport = Boolean(session.actualContent);
          const isEditable = session.canEdit;
          const hasPlan = Boolean(session.lessonPlanId);
          const normalizedPlannedContent = !isTrivialPlannedContent(session.plannedContent) && hasDisplayablePayload(session.plannedContent)
            ? session.plannedContent
            : null;
          const plannedContentFallback = session.templateSyllabusContent || resolvedTemplate?.syllabusContent || null;
          const plannedContentDisplay = normalizedPlannedContent || plannedContentFallback;
          const plannedContentSubtitle = normalizedPlannedContent
            ? "Giáo án sẽ được tạo hoặc cập nhật"
            : plannedContentFallback
              ? "Đang tham chiếu từ syllabus chuẩn"
              : "Giáo án sẽ được tạo hoặc cập nhật";

          return (
            <div
              key={session.sessionId}
              className={cn(
                "group rounded-2xl border transition-all duration-300 hover:shadow-lg",
                hasReport
                  ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white"
                  : "border-red-100 bg-white hover:border-red-200"
              )}
            >
              {/* Session Header */}
              <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                    <span className="text-lg font-bold text-white">{session.sessionIndex}</span>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
Buổi {session.sessionIndex}
                    </h4>
                    {normalizeDateValue(session.sessionDate) && (
                      <p className="text-sm text-gray-500">
                        {formatDate(session.sessionDate, true)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {isEditable && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <Pencil size={11} />
                        Có thể sửa
                      </span>
                    )}
                    {hasPlan && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <FileText size={11} />
                        Có giáo án
                      </span>
                    )}
                    {hasTemplate && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                        <FolderOpen size={11} />
                        {session.templateId ? "Có template" : "Template chung"}
                      </span>
                    )}
                    {hasReport && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <ClipboardPen size={11} />
                        Đã báo cáo
                      </span>
                    )}
                    {!hasReport && hasPlan && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <Clock3 size={11} />
                        Chưa báo cáo
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {resolvedTemplate?.id && onOpenTemplateDetail && (
                    <button
                      type="button"
                      onClick={() => onOpenTemplateDetail(resolvedTemplate.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-all hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                    >
                      <FolderOpen size="16" />
                      Xem template
                    </button>
                  )}
                  
                  {hasPlan ? (
                    <button
                      type="button"
                      onClick={() => onOpenPlanDetail(session.lessonPlanId!)}
className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye size="16" />
                      Chi tiết
                    </button>
                  ) : null}
                  {session.canEdit ? (
                    scope === "teacher" ? (
                      <button
                        type="button"
                        onClick={() => (session.lessonPlanId ? onEdit(session) : onCreate(session))}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white hover:shadow-lg cursor-pointer",
                          hasReport
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-700"
                            : "bg-gradient-to-r from-red-600 to-red-700"
                        )}
                      >
                        <ClipboardPen size={15} />
                        {hasReport ? "Cập nhật giáo án" : "Điền giáo án"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => (session.lessonPlanId ? onEdit(session) : onCreate(session))}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 text-sm font-semibold text-white hover:shadow-lg cursor-pointer"
                      >
                        {session.lessonPlanId ? <Pencil size={15} /> : <FilePlus2 size={15} />}
                        {session.lessonPlanId ? "Sửa giáo án" : "Tạo giáo án"}
                      </button>
                    )
                  ) : null}
                  {!session.canEdit && (session.actualContent || session.actualHomework || session.teacherNotes) ? (
                    <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                      <CheckCircle2 size={15} />
                      Đã báo cáo
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Teacher Info */}
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-3">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-red-100 p-1">
                      <Users size="14" className="text-red-600" />
                    </div>
                    <span className="text-gray-600">Giáo viên dự kiến:</span>
                    <span className="font-medium text-gray-900">{session.plannedTeacherName || "-"}</span>
                  </div>
{session.actualTeacherName && (
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-emerald-100 p-1">
                        <Users size="14" className="text-emerald-600" />
                      </div>
                      <span className="text-gray-600">Giáo viên thực tế:</span>
                      <span className="font-medium text-gray-900">{session.actualTeacherName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Grid */}
              <div className="p-6">
                <div className="grid gap-5 lg:grid-cols-2">
                  {(session.templateTitle || resolvedTemplate?.title || session.templateSyllabusContent || resolvedTemplate?.syllabusContent) && (
                    <ContentCard
                      title="Syllabus chuẩn"
                      subtitle={
                        session.templateTitle ||
                        (session.templateId
                          ? resolvedTemplate?.title
                          : `${resolvedTemplate?.title || "Template chung"} • áp dụng toàn bộ buổi`) ||
                        "Nội dung template"
                      }
                      icon={<FolderOpen size="16" />}
                      gradient="from-purple-50 to-white"
                      borderColor="purple"
                    >
                      <StructuredContent 
                        value={session.templateSyllabusContent || resolvedTemplate?.syllabusContent} 
                        placeholder="Chưa có nội dung template." 
                      />
                    </ContentCard>
                  )}

                  <ContentCard
                    title="Giáo án dự kiến"
                    subtitle={plannedContentSubtitle}
                    icon={<FileText size="16" />}
                    gradient="from-red-50 to-white"
                    borderColor="red"
                  >
                    <StructuredContent 
                      value={plannedContentDisplay} 
                      placeholder="Chưa có nội dung dự kiến." 
                    />
                  </ContentCard>

                  <ContentCard
                    title={hasReport ? "Báo cáo buổi dạy" : "Nội dung thực tế"}
                    subtitle={
                      hasReport && session.actualTeacherName
                        ? `Giáo viên: ${session.actualTeacherName}`
                        : "Nội dung đã dạy thực tế"
                    }
                    icon={<ClipboardPen size="16" />}
                    gradient={hasReport ? "from-emerald-50 to-white" : "from-gray-50 to-white"}
                    borderColor={hasReport ? "emerald" : "gray"}
                    badge={hasReport ? { text: "Đã báo cáo", color: "emerald" } : undefined}
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
                      icon={<Paperclip size="16" />}
                      gradient="from-amber-50 to-white"
                      borderColor="amber"
                    >
                      <div className="space-y-3">
                        {session.actualHomework && (
                          <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                              Bài tập về nhà
                            </div>
                            <StructuredContent value={session.actualHomework} placeholder="" />
                          </div>
                        )}
                        {session.teacherNotes && (
                          <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                              Ghi chú giáo viên
                            </div>
                            <StructuredContent value={session.teacherNotes} placeholder="" />
                          </div>
                        )}
                      </div>
                    </ContentCard>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
    <div className={cn(
      "rounded-xl border bg-gradient-to-br p-4 transition-all duration-200 hover:shadow-md",
      borderColors[borderColor],
      gradient
    )}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "rounded-lg p-1.5",
            borderColor === "red" && "bg-red-100 text-red-600",
            borderColor === "purple" && "bg-purple-100 text-purple-600",
            borderColor === "emerald" && "bg-emerald-100 text-emerald-600",
            borderColor === "amber" && "bg-amber-100 text-amber-600",
            borderColor === "gray" && "bg-gray-100 text-gray-600"
          )}>
            {icon}
          </div>
          <div>
<h5 className="font-semibold text-gray-900">{title}</h5>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            badgeColors[badge.color]
          )}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {children}
      </div>
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
    file: File | null
  ) => Promise<void>;
}) {
  const metadataSeed = asObject(parseJsonContent(initialValue?.syllabusMetadata));
  const contentSeed = asObject(parseJsonContent(initialValue?.syllabusContent));
  const parsedMetadataLinesObject = parseMetadataFromLinesObject(metadataSeed);
  // Fallback: if stored as plain text (non-JSON), attempt structured parse.
  // Also try to extract metadata from syllabusContent when syllabusMetadata is absent
  // (some templates were imported with all data in syllabusContent).
  const parsedRawMetadata = !metadataSeed
    ? (initialValue?.syllabusMetadata ? parsePlainMetadataText(initialValue.syllabusMetadata) : null)
      ?? (!contentSeed && initialValue?.syllabusContent ? parsePlainMetadataText(initialValue.syllabusContent) : null)
    : null;
  // rawContent is non-null only when syllabusContent is plain text AND parsePlainMetadataText
  // couldn't extract structured metadata from it (i.e., it's genuinely unstructured content).
  const rawContent = !contentSeed && initialValue?.syllabusContent?.trim() && !parsedRawMetadata
    ? initialValue.syllabusContent.trim()
    : null;
  const initialProgramId = initialValue?.programId || defaultProgramId || "";
  const isEdit = Boolean(initialValue);

  const [programId, setProgramId] = useState(initialProgramId);
  const [level, setLevel] = useState(initialValue?.level || "");
  const [title, setTitle] = useState(initialValue?.title || "");
  const [sessionIndex, setSessionIndex] = useState(initialValue?.sessionIndex || 1);

  // Metadata fields
  const [dayLabel, setDayLabel] = useState(
    pickStringValue(metadataSeed, ["day", "days", "scheduleDays"]) || parsedMetadataLinesObject?.day || parsedRawMetadata?.day || ""
  );
  const [durationLabel, setDurationLabel] = useState(
    pickStringValue(metadataSeed, ["duration"]) || parsedMetadataLinesObject?.duration || parsedRawMetadata?.duration || ""
  );
  const [generalInformation, setGeneralInformation] = useState(
    pickStringValue(metadataSeed, ["generalInformation", "generalInfo", "description"]) || parsedMetadataLinesObject?.generalInformation || parsedRawMetadata?.generalInformation || ""
  );
  const initialTeachingMaterialsText =
    linesToTextarea(metadataSeed?.teachingMaterials) ||
    parsedMetadataLinesObject?.teachingMaterialsText ||
    parsedRawMetadata?.teachingMaterialsText ||
    "";
  const [teachingMaterialDrafts, setTeachingMaterialDrafts] = useState<TeachingMaterialDraft[]>(
    () => parseTeachingMaterialsTextToDrafts(initialTeachingMaterialsText)
  );
  const [teachingMaterialsText, setTeachingMaterialsText] = useState(() => stringifyTeachingMaterialDrafts(parseTeachingMaterialsTextToDrafts(initialTeachingMaterialsText)));
  const [sheetNote, setSheetNote] = useState(
    pickStringValue(metadataSeed, ["note"]) || linesToTextarea(metadataSeed?.note) || parsedMetadataLinesObject?.note || parsedRawMetadata?.note || ""
  );

  // Content fields
  const [teacherName, setTeacherName] = useState(pickStringValue(contentSeed, ["teacherName"]));
  const [homeworkLabel, setHomeworkLabel] = useState(pickStringValue(contentSeed, ["homeworkLabel"]) || "HOMEWORK");
  const [homeworkMaterialsText, setHomeworkMaterialsText] = useState(linesToTextarea(contentSeed?.homeworkMaterials));
const [homeworkNotesText, setHomeworkNotesText] = useState(linesToTextarea(contentSeed?.homeworkNotes));
  const [activities, setActivities] = useState<TemplateActivityDraft[]>(
    rawContent ? [{ ...createEmptyTemplateActivity(), classwork: rawContent }] : activityDraftsFromUnknown(contentSeed?.activities)
  );

  // File/meta
  const [sourceFileName, setSourceFileName] = useState(initialValue?.sourceFileName || "");
  const [attachment, setAttachment] = useState(initialValue?.attachment || "");
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingMaterialIndex, setUploadingMaterialIndex] = useState<number | null>(null);
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
  }, [dayLabel, durationLabel, generalInformation, sheetNote, teachingMaterialsText]);

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
        })
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
  }, [activities, homeworkLabel, homeworkMaterialsText, homeworkNotesText, sessionIndex, teacherName, title]);

  const updateActivity = (index: number, key: keyof TemplateActivityDraft, value: string) => {
    setActivities((current) =>
      current.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const addActivity = () => setActivities((current) => [...current, createEmptyTemplateActivity()]);

  const addTeachingMaterial = () => {
    setTeachingMaterialDrafts((current) => [...current, createEmptyTeachingMaterial()]);
  };

  const updateTeachingMaterial = (index: number, patch: Partial<TeachingMaterialDraft>) => {
    setTeachingMaterialDrafts((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const removeTeachingMaterial = (index: number) => {
    setTeachingMaterialDrafts((current) =>
      current.length <= 1
        ? [createEmptyTeachingMaterial()]
        : current.filter((_, i) => i !== index)
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
if (current.length === 1 && isActivityDraftEmpty(current[0])) return [nextActivity];
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
      current.length <= 1 ? [createEmptyTemplateActivity()] : current.filter((_, i) => i !== index)
    );
  };

  const handleReset = () => {
    setProgramId(initialProgramId);
    setLevel(initialValue?.level || "");
    setTitle(initialValue?.title || "");
    setSessionIndex(initialValue?.sessionIndex || 1);
    setDayLabel(pickStringValue(metadataSeed, ["day", "days", "scheduleDays"]) || parsedMetadataLinesObject?.day || parsedRawMetadata?.day || "");
    setDurationLabel(pickStringValue(metadataSeed, ["duration"]) || parsedMetadataLinesObject?.duration || parsedRawMetadata?.duration || "");
    setGeneralInformation(pickStringValue(metadataSeed, ["generalInformation", "generalInfo", "description"]) || parsedMetadataLinesObject?.generalInformation || parsedRawMetadata?.generalInformation || "");
    const nextTeachingMaterialsText =
      linesToTextarea(metadataSeed?.teachingMaterials) ||
      parsedMetadataLinesObject?.teachingMaterialsText ||
      parsedRawMetadata?.teachingMaterialsText ||
      "";
    setTeachingMaterialDrafts(parseTeachingMaterialsTextToDrafts(nextTeachingMaterialsText));
    setTeachingMaterialsText(stringifyTeachingMaterialDrafts(parseTeachingMaterialsTextToDrafts(nextTeachingMaterialsText)));
    setSheetNote(pickStringValue(metadataSeed, ["note"]) || linesToTextarea(metadataSeed?.note) || parsedMetadataLinesObject?.note || parsedRawMetadata?.note || "");
    setTeacherName(pickStringValue(contentSeed, ["teacherName"]));
    setHomeworkLabel(pickStringValue(contentSeed, ["homeworkLabel"]) || "HOMEWORK");
    setHomeworkMaterialsText(linesToTextarea(contentSeed?.homeworkMaterials));
    setHomeworkNotesText(linesToTextarea(contentSeed?.homeworkNotes));
    setActivities(rawContent ? [{ ...createEmptyTemplateActivity(), classwork: rawContent }] : activityDraftsFromUnknown(contentSeed?.activities));
    setSourceFileName(initialValue?.sourceFileName || "");
    setAttachment(initialValue?.attachment || "");
    setIsActive(initialValue?.isActive ?? true);
    setSelectedFile(null);
    setError(null);
  };

  useEffect(() => {
    setTeachingMaterialsText(stringifyTeachingMaterialDrafts(teachingMaterialDrafts));
  }, [teachingMaterialDrafts]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!programId.trim()) { setError("Vui lòng chọn chương trình."); return; }
    if (!level.trim()) { setError("Vui lòng nhập level."); return; }
    if (!title.trim()) { setError("Vui lòng nhập tiêu đề."); return; }
    const effectiveSessionIndex = isEdit ? sessionIndex : 1;
    if (effectiveSessionIndex <= 0) { setError("Session index phải lớn hơn 0."); return; }

    const duplicated = existingTemplates.find(
      (item) =>
        item.programId === programId &&
        item.sessionIndex === effectiveSessionIndex &&
        item.id !== initialValue?.id
    );

    if (duplicated) {
      setError(
        `Program này đã có template dùng chung ở Buổi ${effectiveSessionIndex} (${duplicated.title}). Vui lòng cập nhật template hiện có.`
      );
      return;
    }

    const shouldKeepLegacyPlainMetadata = Boolean(parsedRawMetadata && !metadataSeed);
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
        selectedFile
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
      icon={FolderOpen}
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Chương trình">
            <select
              value={programId}
              onChange={(event) => setProgramId(event.target.value)}
              disabled={isEdit}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:bg-gray-50"
            >
              <option value="">Chọn chương trình</option>
              {programOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
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
              Template này dùng chung cho toàn bộ buổi của chương trình và được neo tại Buổi 1.
            </div>
          </Field>
        </div>

        {/* Metadata chung */}
        <div className="rounded-2xl border border-gray-200 bg-red-50/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-red-700">Thông tin chung của Syllabus</div>
            <StatusBadge kind="info">syllabusMetadata</StatusBadge>
          </div>

          {/* Reference panel: show original plain text when it was not stored as JSON.
              Source may be syllabusMetadata or syllabusContent (when metadata was absent). */}
          {(() => {
            const refText = (!metadataSeed && initialValue?.syllabusMetadata)
              ? initialValue.syllabusMetadata
              : (!contentSeed && !metadataSeed && initialValue?.syllabusContent)
                ? initialValue.syllabusContent
                : null;
            return refText ? (
              <details className="rounded-xl border border-amber-300 bg-amber-50">
                <summary className="cursor-pointer select-none px-4 py-2 text-xs font-semibold text-amber-800">
                  📋 Dữ liệu gốc (plain text) — các trường bên dưới đã được tự động điền từ đây
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
            <p className="mb-2 text-xs text-gray-500">Nhập theo bảng 2 cột: Tên tài liệu và Link hoặc file.</p>
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
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold w-1/3">Tên tài liệu</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Link hoặc file</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachingMaterialDrafts.map((item, index) => (
                      <tr key={`material-draft-${index}`} className="align-top">
                        <td className="border border-gray-200 p-2">
                          <div className="mb-1 text-xs font-semibold text-gray-500">#{index + 1}</div>
                          <input
                            value={item.title}
                            onChange={(event) => updateTeachingMaterial(index, { title: event.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                            placeholder="Ví dụ: Handbook for Reading"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <textarea
                            value={item.resource}
                            onChange={(event) => updateTeachingMaterial(index, { resource: event.target.value })}
                            rows={2}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                            placeholder="Nhập link https://... hoặc ghi Đã gửi file"
                          />
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                                {uploadingMaterialIndex === index ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Upload size={12} />
                                )}
                                {uploadingMaterialIndex === index ? "Đang tải..." : "Tải file"}
                                <input
                                  type="file"
                                  className="hidden"
                                  disabled={uploadingMaterialIndex !== null}
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] || null;
                                    void uploadTeachingMaterial(index, file);
                                    event.currentTarget.value = "";
                                  }}
                                />
                              </label>
                              {extractFirstHttpUrl(item.resource) && (
                                <a
                                  href={buildFileUrl(extractFirstHttpUrl(item.resource))}
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
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-gray-600">Xem dữ liệu text tương thích backend</summary>
                <div className="border-t border-gray-200 px-3 py-2">
                  <textarea
                    value={teachingMaterialsText}
                    onChange={(event) => setTeachingMaterialsText(event.target.value)}
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
            <div className="text-sm font-semibold text-blue-700">Nội dung session</div>
            <StatusBadge kind="info">syllabusContent</StatusBadge>
          </div>

          {/* Reference panel: show original plain text syllabusContent when not JSON */}
          {initialValue?.syllabusContent && !contentSeed ? (
            <details className="rounded-xl border border-blue-300 bg-blue-50">
              <summary className="cursor-pointer select-none px-4 py-2 text-xs font-semibold text-blue-800">
                📋 Dữ liệu gốc (plain text) — tham khảo để điền vào form bên dưới
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
            <div className="text-sm font-semibold text-amber-800">Homework block</div>
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
                  onChange={(event) => setHomeworkMaterialsText(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder={"Pages 80,81,82\nVideo repeat"}
                />
              </Field>

              <Field label="Extra / Note">
                <textarea
                  value={homeworkNotesText}
                  onChange={(event) => setHomeworkNotesText(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder={"1. Quay video đọc bài...\n2. Chụp phần bài làm..."}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-blue-700">Activities</div>
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
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">#</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Time</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Book</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Skills</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Classwork</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Required Materials</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Homework Materials</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Extra / Note</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => (
                    <tr key={index} className="align-top">
                      <td className="border border-gray-300 px-3 py-3 font-semibold text-gray-600">{index + 1}</td>
                      <td className="border border-gray-300 p-1.5">
                        <input
                          value={activity.time}
                          onChange={(event) => updateActivity(index, "time", event.target.value)}
                          className="w-20 rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="5 mins"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <input
                          value={activity.book}
onChange={(event) => updateActivity(index, "book", event.target.value)}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="B1 DESTINATION"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <input
                          value={activity.skills}
                          onChange={(event) => updateActivity(index, "skills", event.target.value)}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="Speaking"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.classwork}
                          onChange={(event) => updateActivity(index, "classwork", event.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder={"WARM UP\nHomework Correction"}
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.requiredMaterials}
                          onChange={(event) => updateActivity(index, "requiredMaterials", event.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="page 101,102"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.homeworkRequiredMaterials}
                          onChange={(event) => updateActivity(index, "homeworkRequiredMaterials", event.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="HOMEWORK"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.extra}
                          onChange={(event) => updateActivity(index, "extra", event.target.value)}
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
            <span>{selectedFile ? selectedFile.name : "Chọn file để upload vào attachment"}</span>
            <input
              type="file"
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </label>
        </Field>

        {isEdit ? (
<Field label="Trạng thái">
            <div className="grid grid-cols-2 gap-3">
              <ToggleButton active={isActive} onClick={() => setIsActive(true)} label="Đang hoạt động" />
              <ToggleButton active={!isActive} onClick={() => setIsActive(false)} label="Tạm ẩn" />
            </div>
          </Field>
        ) : null}

        {error ? <ErrorBox message={error} /> : null}

        <ModalActions
          onClose={onClose}
          onReset={handleReset}
          submitting={submitting}
          submitLabel={isEdit ? "Lưu template" : "Tạo template"}
          showReset={true}
        />
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
      setError("Định dạng file không hợp lệ. Chỉ hỗ trợ .xlsx, .xls hoặc .csv.");
      return;
    }

    if (getFileExtension(file.name) === "csv" && !programId) {
      setError("Import CSV bắt buộc chọn chương trình để map đúng mẫu giáo án.");
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
        icon={Upload}
      onClose={onClose}
      widthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-900">
          <div className="font-semibold">Trước khi import, vui lòng kiểm tra</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-blue-800">
            <li>Định dạng hợp lệ: .xlsx, .xls hoặc .csv</li>
            <li>Nếu import file .csv: bắt buộc chọn chương trình</li>
            <li>Bật "Cập nhật dữ liệu đã có" nếu muốn ghi đè session đã tồn tại</li>
          </ul>
        </div>

        <Field label="File giáo án">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50/60 px-4 py-4 text-sm text-gray-700 hover:bg-red-50">
            <Upload size={16} className="text-red-600" />
            <span>{file ? file.name : "Chọn file .xlsx/.xls/.csv để bắt đầu import"}</span>
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
            <select
              value={programId}
              onChange={(event) => setProgramId(event.target.value)}
className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Không chọn (backend tự map nếu có thể)</option>
              {programOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
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

function parseStarterActivities(refContent: string | null | undefined): StarterSheet | null {
  if (!refContent?.trim()) return null;
  const parsed = parseJsonContent(refContent);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.activities) || obj.activities.length === 0) return null;
  const activities = obj.activities
    .map((item) => asObject(item))
    .filter((item): item is StarterActivity => Boolean(item));
  if (!activities.length) return null;
  return { ...obj, activities };
}

function toPlannerActivityDraft(activity: StarterActivity): PlannerActivityDraft {
  return {
    time: typeof activity.time === "string" ? activity.time : "",
    book: typeof activity.book === "string" ? activity.book : "",
    skills: typeof activity.skills === "string" ? activity.skills : "",
    classwork: typeof activity.classwork === "string" ? activity.classwork : "",
    requiredMaterials: typeof activity.requiredMaterials === "string" ? activity.requiredMaterials : "",
    homeworkRequiredMaterials: typeof activity.homeworkRequiredMaterials === "string" ? activity.homeworkRequiredMaterials : "",
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

  const resolvedTemplateId = initialValue?.templateId || session.templateId || sharedTemplate?.id || "";
  const initialPlannedContent = (() => {
    if (initialValue?.plannedContent) return prettifyJsonText(initialValue.plannedContent);
    if (session.plannedContent) return prettifyJsonText(session.plannedContent);
    if (isTeacher) return prettifyJsonText(session.templateSyllabusContent || sharedTemplate?.syllabusContent || "");
    return "";
  })();
  const [templateId, setTemplateId] = useState(resolvedTemplateId);
  const [plannedContent, setPlannedContent] = useState(initialPlannedContent);
  const [showPlannedJsonEditor, setShowPlannedJsonEditor] = useState(() => !isTrivialPlannedContent(initialPlannedContent));
  const [actualContent, setActualContent] = useState(initialValue?.actualContent || session.actualContent || "");
  const [actualHomework, setActualHomework] = useState(initialValue?.actualHomework || session.actualHomework || "");
  const [teacherNotes, setTeacherNotes] = useState(initialValue?.teacherNotes || session.teacherNotes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templateOptions.find((item) => item.id === templateId),
    [templateId, templateOptions]
  );
  const templateRefContent =
    session.templateSyllabusContent ||
    selectedTemplate?.syllabusContent ||
    sharedTemplate?.syllabusContent ||
    "";

  const refContent = templateRefContent || session.plannedContent || initialValue?.plannedContent;

  // Parse starter activities for structured editing (teacher only)
  const starterData = useMemo(() => {
    if (!isTeacher) return null;
    // If editing an existing plan, try to parse actualContent first (teacher may have saved structured data before)
    const existingActual = initialValue?.actualContent || session.actualContent;
    const existingParsed = parseStarterActivities(existingActual);
    if (existingParsed) return existingParsed;
    return parseStarterActivities(refContent);
  }, [isTeacher, refContent, initialValue?.actualContent, session.actualContent]);

  const plannerStarter = useMemo(() => {
    if (isTeacher) return null;
    return parseStarterActivities(initialValue?.plannedContent || session.plannedContent || templateRefContent);
  }, [initialValue?.plannedContent, isTeacher, session.plannedContent, templateRefContent]);

  const [plannerTitle, setPlannerTitle] = useState(() =>
    pickStringValue(plannerStarter, ["title"]) || pickStringValue(starterData, ["title"])
  );
  const [plannerTeacherName, setPlannerTeacherName] = useState(() =>
    pickStringValue(plannerStarter, ["teacherName"])
  );
  const [plannerHomeworkLabel, setPlannerHomeworkLabel] = useState(() =>
    pickStringValue(plannerStarter, ["homeworkLabel"]) || "HOMEWORK"
  );
  const [plannerActivities, setPlannerActivities] = useState<PlannerActivityDraft[]>(() => {
    if (!plannerStarter) return [createEmptyPlannerActivity()];
    return plannerStarter.activities.map(toPlannerActivityDraft);
  });
  const [plannerHomeworkMaterialsText, setPlannerHomeworkMaterialsText] = useState(() =>
    plannerStarter ? linesToTextarea(plannerStarter.homeworkMaterials) : ""
  );
  const [plannerHomeworkNotesText, setPlannerHomeworkNotesText] = useState(() =>
    plannerStarter ? linesToTextarea(plannerStarter.homeworkNotes) : ""
  );

  useEffect(() => {
    if (isTeacher) return;
    setPlannerTitle(pickStringValue(plannerStarter, ["title"]));
    setPlannerTeacherName(pickStringValue(plannerStarter, ["teacherName"]));
    setPlannerHomeworkLabel(pickStringValue(plannerStarter, ["homeworkLabel"]) || "HOMEWORK");
    setPlannerActivities(
      plannerStarter?.activities.length
        ? plannerStarter.activities.map(toPlannerActivityDraft)
        : [createEmptyPlannerActivity()]
    );
    setPlannerHomeworkMaterialsText(plannerStarter ? linesToTextarea(plannerStarter.homeworkMaterials) : "");
    setPlannerHomeworkNotesText(plannerStarter ? linesToTextarea(plannerStarter.homeworkNotes) : "");
  }, [isTeacher, plannerStarter, templateId]);

  const [editableActivities, setEditableActivities] = useState<TemplateActivityDraft[]>(() => {
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
      requiredMaterials: typeof a.requiredMaterials === "string" ? a.requiredMaterials : "",
      homeworkRequiredMaterials: typeof a.homeworkRequiredMaterials === "string" ? a.homeworkRequiredMaterials : "",
      extra: typeof a.extra === "string" ? a.extra : "",
    }));
  });

  const [editableHomeworkMaterialsText, setEditableHomeworkMaterialsText] = useState(() => {
    if (!starterData) return "";
    return linesToTextarea(starterData.homeworkMaterials);
  });

  const [editableHomeworkNotesText, setEditableHomeworkNotesText] = useState(() => {
    if (!starterData) return "";
    return linesToTextarea(starterData.homeworkNotes);
  });

  const hasStructuredStarter = isTeacher && starterData !== null;
  const hasStructuredPlanner = !isTeacher && plannerStarter !== null;

  const updateEditableActivity = (
    index: number,
    field: "time" | "book" | "skills" | "classwork" | "requiredMaterials" | "homeworkRequiredMaterials" | "extra",
    value: string
  ) => {
    setEditableActivities((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
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
    setEditableActivities((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const buildStructuredActualContent = (): string => {
    if (!starterData) return actualContent;
    const newActivities = editableActivities
      .map((activity, i) => {
        const base = starterData.activities[i] || {};
        return removeEmptyDeep({
          ...base,
          time: activity.time?.trim() || (typeof base.time === "string" ? base.time : ""),
          book: activity.book?.trim() || (typeof base.book === "string" ? base.book : ""),
          skills: activity.skills?.trim() || (typeof base.skills === "string" ? base.skills : ""),
          classwork: activity.classwork?.trim() || (typeof base.classwork === "string" ? base.classwork : ""),
          requiredMaterials: activity.requiredMaterials?.trim() || (typeof base.requiredMaterials === "string" ? base.requiredMaterials : ""),
          homeworkRequiredMaterials:
            activity.homeworkRequiredMaterials?.trim() ||
            (typeof base.homeworkRequiredMaterials === "string" ? base.homeworkRequiredMaterials : ""),
          extra: activity.extra?.trim() || (typeof base.extra === "string" ? base.extra : ""),
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
      2
    );
  };

  const updatePlannerActivity = (
    index: number,
    key: keyof PlannerActivityDraft,
    value: string
  ) => {
    setPlannerActivities((current) => current.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addPlannerActivity = () => {
    setPlannerActivities((current) => [...current, createEmptyPlannerActivity()]);
  };

  const removePlannerActivity = (index: number) => {
    setPlannerActivities((current) =>
      current.length <= 1 ? [createEmptyPlannerActivity()] : current.filter((_, i) => i !== index)
    );
  };

  const buildStructuredPlannedContent = (): string | null => {
    if (!plannerStarter) {
      return plannedContent.trim() || null;
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
        })
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

    const finalActualContent = hasStructuredStarter ? buildStructuredActualContent() : actualContent.trim();
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

  return (
    <ModalFrame
      title={isTeacher ? (isEdit ? "Cập nhật giáo án" : "Điền giáo án buổi dạy") : (isEdit ? "Cập nhật giáo án" : "Tạo giáo án")}
      icon={isTeacher ? ClipboardPen : FilePlus2}
      onClose={onClose}
      widthClass={hasStructuredStarter || hasStructuredPlanner ? "max-w-6xl" : "max-w-4xl"}
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard
            icon={Users}
            label="Lớp học"
            value={classSyllabus?.classTitle || classSyllabus?.classCode || classSyllabus?.classId || "-"}
          />
          <InfoCard icon={CalendarDays} label="Buổi học" value={getSessionDisplay(session)} />
        </div>

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
                      Giáo án chuẩn: chỉ sửa được {TEACHER_EDITABLE_FIELDS.classwork}, {TEACHER_EDITABLE_FIELDS.requiredMaterials}, {TEACHER_EDITABLE_FIELDS.homeworkRequiredMaterials}, {TEACHER_EDITABLE_FIELDS.extra}
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
                  const summaryKeys = ["sessionIndex", "title", "dateLabel", "teacherName"] as const;
                  const hasSummary = summaryKeys.some((k) => starterData![k] !== undefined && starterData![k] !== null && starterData![k] !== "");
                  if (!hasSummary) return null;
                  return (
                    <div className="flex flex-wrap gap-2">
                      {summaryKeys.map((k) =>
                        starterData![k] ? (
                          <StatusBadge key={k} kind="muted">{k}: {String(starterData![k])}</StatusBadge>
                        ) : null
                      )}
                    </div>
                  );
                })()}

                {/* Activities table with editable cells */}
                <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
                  <div className="border-b border-gray-300 bg-amber-50 px-4 py-3 text-sm font-bold uppercase tracking-wide text-gray-900">
                    Activities
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[980px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-red-50 text-gray-700">
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Time</th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Book</th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Skills</th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold min-w-[200px]">
                            <span className="inline-flex items-center gap-1">Classwork <Pencil size={11} className="text-emerald-600" /></span>
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold min-w-[180px]">
                            <span className="inline-flex items-center gap-1">Required Materials <Pencil size={11} className="text-emerald-600" /></span>
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold min-w-[180px]">
                            <span className="inline-flex items-center gap-1">Homework Materials <Pencil size={11} className="text-emerald-600" /></span>
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Extra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editableActivities.map((activity, index) => (
                          <tr key={index} className="align-top">
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.time ?? ""}
                                onChange={(e) => updateEditableActivity(index, "time", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Time"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.book ?? ""}
                                onChange={(e) => updateEditableActivity(index, "book", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Book"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.skills ?? ""}
                                onChange={(e) => updateEditableActivity(index, "skills", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Skills"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={editableActivities[index]?.classwork ?? ""}
                                onChange={(e) => updateEditableActivity(index, "classwork", e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Nhập classwork..."
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={editableActivities[index]?.requiredMaterials ?? ""}
                                onChange={(e) => updateEditableActivity(index, "requiredMaterials", e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Nhập required materials..."
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={editableActivities[index]?.homeworkRequiredMaterials ?? ""}
                                onChange={(e) => updateEditableActivity(index, "homeworkRequiredMaterials", e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Nhập homework materials..."
                              />
                            </td>
                            <td className="border border-gray-300 bg-gray-50 px-2 py-1.5 text-center">
                              <textarea
                                value={editableActivities[index]?.extra ?? ""}
                                onChange={(e) => updateEditableActivity(index, "extra", e.target.value)}
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
                  {(starterData!.homeworkLabel || linesFromUnknown(starterData!.homeworkMaterials).length || linesFromUnknown(starterData!.homeworkNotes).length) ? (
                    <div className="border-t border-gray-300 bg-amber-50/40 p-4">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Homework block (teacher được chỉnh Required materials + Extra/Note)</div>
                      <div className="grid gap-3 lg:grid-cols-3">
                        <div className="rounded-xl border border-gray-300 bg-white p-3">
                          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Label</div>
                          <SheetCellValue value={starterData!.homeworkLabel} />
                        </div>
                        <div className="rounded-xl border border-gray-300 bg-white p-3">
                          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Required materials</div>
                          <textarea
                            value={editableHomeworkMaterialsText}
                            onChange={(e) => setEditableHomeworkMaterialsText(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            placeholder="Nhập homework required materials..."
                          />
                        </div>
                        <div className="rounded-xl border border-gray-300 bg-white p-3">
                          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Extra / Note</div>
                          <textarea
                            value={editableHomeworkNotesText}
                            onChange={(e) => setEditableHomeworkNotesText(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            placeholder="Nhập extra / note cho homework..."
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Notes (read-only) */}
                  {Array.isArray(starterData!.notes) && starterData!.notes.length > 0 ? (
                    <div className="border-t border-gray-300 bg-white px-4 py-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes (chỉ đọc)</div>
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
                    <span className="text-sm font-semibold text-blue-700">Nội dung giáo án Admin đã soạn</span>
                    <span className="ml-auto rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-xs text-blue-600">Chỉ đọc</span>
                  </div>
                  <div className="mt-3 max-h-56 overflow-y-auto">
                    <StructuredContent value={refContent} placeholder="Chưa có nội dung chuẩn." />
                  </div>
                </div>

                <Field label="Nội dung dạy thực tế *">
                  <p className="mb-2 text-xs text-gray-500">Mô tả chi tiết nội dung bạn đã dạy trong buổi học hôm nay.</p>
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
                  <p className="mb-2 text-xs text-gray-500">Mô tả chi tiết nội dung bạn đã dạy trong buổi học hôm nay.</p>
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
            <Field label="Template áp dụng cho buổi này (khuyến nghị chọn)">
              <select
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">Không chọn: hệ thống tự tìm theo Program + Buổi học</option>
                {templateOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} • Level {item.level} • {item.sessionIndex === 1 ? "Template chung" : `Buổi ${item.sessionIndex}`}
                  </option>
                ))}
              </select>
            </Field>

            {hasStructuredPlanner ? (
              <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-blue-700">Sửa trực tiếp trên bảng syllabus</div>
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
                      onChange={(event) => setPlannerTeacherName(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Teacher"
                    />
                  </Field>
                  <Field label="Homework label">
                    <input
                      value={plannerHomeworkLabel}
                      onChange={(event) => setPlannerHomeworkLabel(event.target.value)}
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
                          <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Time</th>
                          <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Book</th>
                          <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Skills</th>
                          <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Classwork</th>
                          <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Required materials</th>
                          <th className="border border-gray-300 bg-blue-100 px-3 py-2 text-left font-semibold">Homework materials</th>
                          <th className="border border-gray-300 bg-blue-100 px-3 py-2 text-left font-semibold">Extra / Note</th>
                          <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-semibold">Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plannerActivities.map((activity, index) => (
                          <tr key={`planner-${index}`} className="align-top">
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.time}
                                onChange={(event) => updatePlannerActivity(index, "time", event.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="10 mins"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.book}
                                onChange={(event) => updatePlannerActivity(index, "book", event.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Warm Up"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <input
                                value={activity.skills}
                                onChange={(event) => updatePlannerActivity(index, "skills", event.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Speaking / Reading"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={activity.classwork}
                                onChange={(event) => updatePlannerActivity(index, "classwork", event.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Classwork"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={activity.requiredMaterials}
                                onChange={(event) => updatePlannerActivity(index, "requiredMaterials", event.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Required materials"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={activity.homeworkRequiredMaterials}
                                onChange={(event) => updatePlannerActivity(index, "homeworkRequiredMaterials", event.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Homework materials"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5">
                              <textarea
                                value={activity.extra}
                                onChange={(event) => updatePlannerActivity(index, "extra", event.target.value)}
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
                      onChange={(event) => setPlannerHomeworkMaterialsText(event.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </Field>
                  <Field label="Homework notes (block)">
                    <textarea
                      value={plannerHomeworkNotesText}
                      onChange={(event) => setPlannerHomeworkNotesText(event.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="text-sm font-semibold text-gray-800">Tùy chọn nâng cao (JSON)</div>
                <p className="text-xs text-gray-500">
                  Phần này chỉ dùng khi bạn muốn ghi đè cấu trúc kế hoạch riêng cho buổi này. Nếu không chắc, hãy để hệ thống tự lấy từ template.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPlannedJsonEditor((current) => !current)}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  {showPlannedJsonEditor ? "Ẩn chỉnh sửa JSON" : "Hiện chỉnh sửa JSON"}
                </button>

                {showPlannedJsonEditor ? (
                  <>
                    <textarea
                      value={plannedContent}
                      onChange={(event) => setPlannedContent(event.target.value)}
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
                  </>
                ) : null}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nội dung dạy thực tế (không bắt buộc)">
                <textarea
                  value={actualContent}
                  onChange={(event) => setActualContent(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Ví dụ: Dạy Unit 4, luyện speaking theo cặp, chữa bài workbook..."
                />
              </Field>
              <Field label="Bài tập về nhà (không bắt buộc)">
                <textarea
                  value={actualHomework}
                  onChange={(event) => setActualHomework(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Bài tập về nhà"
                />
              </Field>
            </div>

            <Field label="Ghi chú nội bộ">
              <textarea
                value={teacherNotes}
                onChange={(event) => setTeacherNotes(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: Lớp thiếu 2 bạn, cần gửi bổ sung tài liệu qua nhóm..."
              />
            </Field>
          </>
        )}

        {error ? <ErrorBox message={error} /> : null}

        <ModalActions
          onClose={onClose}
          submitting={submitting}
          submitLabel={isTeacher ? "Lưu nội dung buổi dạy" : (isEdit ? "Lưu giáo án" : "Tạo giáo án")}
          showReset={false}
        />
      </form>
    </ModalFrame>
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
  const title = state.type === "template" ? "Chi tiết mẫu giáo án" : "Chi tiết giáo án";
  const hasTemplateMetadata = state.type === "template" && state.item
    ? hasDisplayablePayload(state.item.syllabusMetadata)
    : false;
  const hasTemplateContent = state.type === "template" && state.item
    ? hasDisplayablePayload(state.item.syllabusContent)
    : false;

  if (state.loading) {
    return (
      <ModalFrame title={title} icon={state.type === "template" ? FolderOpen : FileText} onClose={onClose} widthClass="max-w-5xl">
        <div className="flex items-center justify-center py-16 text-gray-600">
          <Loader2 size={20} className="mr-3 animate-spin text-red-600" />
          Đang tải chi tiết...
        </div>
      </ModalFrame>
    );
  }

  if (state.error) {
    return (
      <ModalFrame title={title} icon={state.type === "template" ? FolderOpen : FileText} onClose={onClose} widthClass="max-w-5xl">
        <div className="p-6">
<ErrorBox message={state.error} />
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame title={title} icon={state.type === "template" ? FolderOpen : FileText} onClose={onClose} widthClass="max-w-5xl">
      <div className="space-y-5 p-6">
        {state.type === "template" && state.item ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard icon={BookOpenCheck} label="Chương trình" value={state.item.programName || state.item.programId || "-"} />
              <InfoCard icon={GraduationCap} label="Cấp độ / Buổi" value={`Cấp độ ${state.item.level || "-"} • Buổi ${state.item.sessionIndex || "-"}`} />
              <InfoCard icon={Users} label="Người tạo" value={state.item.createdByName || "-"} />
              <InfoCard icon={Clock3} label="Thời gian" value={formatDate(state.item.updatedAt || state.item.createdAt, true)} />
            </div>

            <ContentPanel title="Tiêu đề" value={state.item.title} accent="text-red-700" />
            {hasTemplateMetadata ? (
              <ContentPanel
                title="Thông tin chung của syllabus"
                subtitle="Áp dụng cho toàn bộ buổi học: Ngày học, Thời lượng, Thông tin chung, Tài liệu giảng dạy, Ghi chú"
                value={state.item.syllabusMetadata}
                accent="text-blue-700"
              />
            ) : null}
            {hasTemplateContent ? (
              <ContentPanel
                title="Nội dung buổi học mẫu"
                subtitle="Khung nội dung cho buổi này: activities, homework, teacher block"
                value={state.item.syllabusContent}
                accent="text-emerald-700"
              />
            ) : null}
            {!hasTemplateMetadata && !hasTemplateContent ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Mẫu giáo án này chưa có dữ liệu syllabus chi tiết.
              </div>
            ) : null}
            <ContentPanel title="File nguồn import" value={state.item.sourceFileName} accent="text-amber-700" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-red-600">Attachment</div>
                {state.item.attachment ? (
                  <button
                    type="button"
                    onClick={() => onOpenAttachment(state.item!.attachment)}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                  >
                    <Paperclip size={12} />
                    Mở file
                  </button>
                ) : null}
              </div>
              <div className="text-sm text-gray-700">{state.item.attachment || "Chưa có file đính kèm"}</div>
            </div>
          </>
        ) : state.type === "plan" && state.item ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard icon={Users} label="Lớp học" value={state.item.classTitle || state.item.classCode || state.item.classId || "-"} />
              <InfoCard icon={CalendarDays} label="Buổi học" value={state.item.sessionTitle || formatDate(state.item.sessionDate, true)} />
              <InfoCard icon={ShieldCheck} label="Người cập nhật" value={state.item.submittedByName || "-"} />
              <InfoCard icon={Clock3} label="Thời gian" value={formatDate(state.item.updatedAt || state.item.createdAt || state.item.submittedAt, true)} />
            </div>
<div className="grid gap-4 xl:grid-cols-2">
              <ContentPanel title="plannedContent" value={state.item.plannedContent} accent="text-red-700" />
              <ContentPanel title="actualContent" value={state.item.actualContent} accent="text-emerald-700" />
              <ContentPanel title="actualHomework" value={state.item.actualHomework} accent="text-amber-700" />
              <ContentPanel title="teacherNotes" value={state.item.teacherNotes} accent="text-gray-700" />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 text-sm font-semibold text-red-600">Template liên kết</div>
              {state.item.templateId ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <div>{linkedTemplate?.title || state.item.templateTitle || "Template đã gắn"}</div>
                  <div className="text-gray-500">
                    {state.item.templateLevel || linkedTemplate?.level ? `Level ${state.item.templateLevel || linkedTemplate?.level}` : "Không có level"}
                    {state.item.templateSessionIndex || linkedTemplate?.sessionIndex
                      ? ` • Buổi ${state.item.templateSessionIndex || linkedTemplate?.sessionIndex}`
                      : ""}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Giáo án này chưa gắn mẫu giáo án.</div>
              )}
            </div>
          </>
        ) : (
          <EmptyState title="Không có dữ liệu chi tiết" subtitle="Backend không trả về bản ghi phù hợp." />
        )}

        <div className="flex items-center justify-end border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
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
    <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
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
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
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
        active ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-700"
      )}
    >
      {label}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{message}</div>;
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
        active ? "bg-gradient-to-r from-red-600 to-red-700 text-white" : "text-gray-600 hover:bg-red-50"
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
          : "border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600"
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
return <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-medium", classes)}>{children}</span>;
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
        <span className={cn("w-10 h-10 rounded-xl bg-gradient-to-br grid place-items-center text-white", color)}>
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
  icon: Icon,
  onClose,
  children,
  widthClass = "max-w-3xl",
}: {
  title: string;
  icon: LucideIcon;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={cn("my-8 w-full rounded-2xl border border-gray-200 bg-white shadow-2xl", widthClass)} onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 text-white shadow-lg">
                <Icon size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
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
    </div>
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
      {subtitle ? <div className="mt-1 text-xs text-gray-500">{subtitle}</div> : null}
      <div className="mt-3">
        <StructuredContent value={value} placeholder="Chưa có nội dung." />
      </div>
    </div>
  );
}

function SpreadsheetList({ value, empty = "-" }: { value: unknown; empty?: string }) {
  const items = linesFromUnknown(value);

  if (!items.length) {
    return <div className="text-sm text-gray-400">{empty}</div>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="whitespace-pre-wrap text-sm text-gray-700">
          {renderLinkifiedText(item)}
        </div>
      ))}
    </div>
  );
}

function SheetCellValue({ value, empty = "-" }: { value: unknown; empty?: string }) {
  if (Array.isArray(value)) {
    return <SpreadsheetList value={value} empty={empty} />;
  }

  if (value && typeof value === "object") {
    const flattened = flattenUnknownToLines(value);
    return <SpreadsheetList value={flattened} empty={empty} />;
  }

  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (!text) {
    return <div className="text-sm text-gray-400">{empty}</div>;
  }

  return <div className="whitespace-pre-wrap text-sm text-gray-700">{renderLinkifiedText(text)}</div>;
}

function isMetadataSheetObject(objectValue: Record<string, unknown>) {
  return ["day", "days", "scheduleDays", "duration", "generalInformation", "generalInfo", "teachingMaterials", "note", "lines"].some(
    (key) => objectValue[key] !== undefined && objectValue[key] !== null
  );
}

function isSessionSheetObject(objectValue: Record<string, unknown>) {
  const hasSessionCoreField = ["sessionIndex", "title", "dateLabel", "teacherName", "homeworkLabel", "homeworkMaterials", "homeworkNotes"].some(
    (key) => objectValue[key] !== undefined && objectValue[key] !== null && String(objectValue[key]).trim() !== ""
  );
  const hasNonEmptyActivities =
    Array.isArray(objectValue.activities) &&
    objectValue.activities.some((item) => asObject(item) !== null && Object.keys(asObject(item) || {}).length > 0);

  return (
    hasSessionCoreField || hasNonEmptyActivities
  );
}

function MetadataSheetView({ objectValue }: { objectValue: Record<string, unknown> }) {
  const parsedFromLines = parseMetadataFromLinesObject(objectValue);
  const sheetTitle = pickStringValue(objectValue, ["title", "sheetTitle"]) || "SYLLABUS";
  const day = pickStringValue(objectValue, ["day", "days", "scheduleDays"]) || parsedFromLines?.day || "";
  const duration = pickStringValue(objectValue, ["duration"]) || parsedFromLines?.duration || "";
  const generalInformation =
    pickStringValue(objectValue, ["generalInformation", "generalInfo", "description"]) || parsedFromLines?.generalInformation || "";
  const teachingMaterials = linesToTextarea(objectValue.teachingMaterials) || parsedFromLines?.teachingMaterialsText || "";
const note = pickStringValue(objectValue, ["note"]) || parsedFromLines?.note || "";
  const extraEntries = Object.entries(objectValue).filter(
    ([key]) =>
      !["title", "sheetTitle", "day", "days", "scheduleDays", "duration", "generalInformation", "generalInfo", "description", "teachingMaterials", "note", "lines"].includes(
        key
      )
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
              <th className="w-48 border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">Day</th>
              <td className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={day} />
              </td>
              <th className="w-48 border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">Duration</th>
              <td className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={duration} />
              </td>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">General information</th>
              <td colSpan={3} className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={generalInformation} />
              </td>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">Teaching materials</th>
              <td colSpan={3} className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={teachingMaterials} />
              </td>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">Note</th>
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

function SessionSheetView({ objectValue }: { objectValue: Record<string, unknown> }) {
  const activities = Array.isArray(objectValue.activities)
    ? objectValue.activities.filter((item): item is Record<string, unknown> => asObject(item) !== null)
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
      ].includes(key)
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
              <th rowSpan={2} className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Period</th>
              <th rowSpan={2} className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Date</th>
              <th rowSpan={2} className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Teacher</th>
              <th rowSpan={2} className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Time</th>
              <th rowSpan={2} className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Book</th>
              <th rowSpan={2} className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Skills</th>
              <th colSpan={2} className="border border-gray-300 bg-amber-100 px-3 py-2 text-center font-semibold">Content</th>
              <th colSpan={2} className="border border-gray-300 bg-blue-100 px-3 py-2 text-center font-semibold">Homework</th>
            </tr>
            <tr className="text-gray-700">
              <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Classwork</th>
              <th className="border border-gray-300 bg-amber-100 px-3 py-2 text-left font-semibold">Required materials</th>
              <th className="border border-gray-300 bg-blue-100 px-3 py-2 text-left font-semibold">Required materials</th>
              <th className="border border-gray-300 bg-blue-100 px-3 py-2 text-left font-semibold">Extra / Note</th>
            </tr>
          </thead>
          <tbody>
            {activities.length ? (
              activities.map((activity: Record<string, unknown>, index: number) => {
                const classworkText = String(activity.classwork ?? "").toUpperCase();
                const isBreaktime = classworkText.includes("BREAKTIME") || classworkText.includes("BREAK TIME");

                return (
                <tr
                  key={`activity-${index}`}
                  className={cn("align-top", isBreaktime ? "bg-gray-100 font-semibold text-gray-800" : "bg-white")}
                >
                  {index === 0 ? (
                    <td rowSpan={rowSpan} className="border border-gray-300 bg-gray-50 px-3 py-2 align-middle text-center">
                      <SheetCellValue value={objectValue.sessionIndex} />
                    </td>
                  ) : null}
                  {index === 0 ? (
                    <td rowSpan={rowSpan} className="border border-gray-300 bg-gray-50 px-3 py-2 align-middle text-center">
                      <SheetCellValue value={objectValue.dateLabel} />
                    </td>
                  ) : null}
                  {index === 0 ? (
                    <td rowSpan={rowSpan} className="border border-gray-300 bg-gray-50 px-3 py-2 align-middle">
                      <SheetCellValue value={objectValue.teacherName} />
                    </td>
                  ) : null}
                  <td className="h-12 border border-gray-300 px-3 py-2 align-middle"><SheetCellValue value={activity.time} /></td>
                  <td className="h-12 border border-gray-300 px-3 py-2 align-middle"><SheetCellValue value={activity.book} /></td>
                  <td className="h-12 border border-gray-300 px-3 py-2 align-middle"><SheetCellValue value={activity.skills} /></td>
                  <td className={cn("h-12 border border-gray-300 bg-amber-50/40 px-3 py-2 align-middle", isBreaktime ? "text-center" : "") }>
                    <SheetCellValue value={activity.classwork} />
                  </td>
                  <td className="h-12 border border-gray-300 bg-amber-50/40 px-3 py-2 align-middle"><SheetCellValue value={activity.requiredMaterials} /></td>
                  <td className="h-12 border border-gray-300 bg-blue-50/40 px-3 py-2 align-middle"><SheetCellValue value={activity.homeworkRequiredMaterials} /></td>
                  <td className="h-12 border border-gray-300 bg-blue-50/40 px-3 py-2 align-middle"><SheetCellValue value={activity.extra} /></td>
                </tr>
              );
              })
            ) : (
              <tr>
                <td className="border border-gray-300 px-3 py-4 text-center text-sm text-gray-400" colSpan={10}>
                  Chưa có activity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {notes.length ? (
        <div className="border-t border-gray-300 bg-white px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</div>
          <SpreadsheetList value={notes} />
        </div>
      ) : null}

      {objectValue.homeworkLabel || linesFromUnknown(objectValue.homeworkMaterials).length || linesFromUnknown(objectValue.homeworkNotes).length ? (
        <div className="border-t border-gray-300 bg-amber-50/40 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Homework block</div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-300 bg-white p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Label</div>
              <SheetCellValue value={objectValue.homeworkLabel} />
            </div>
            <div className="rounded-xl border border-gray-300 bg-white p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Required materials</div>
              <SheetCellValue value={objectValue.homeworkMaterials} />
            </div>
            <div className="rounded-xl border border-gray-300 bg-white p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</div>
              <SheetCellValue value={objectValue.homeworkNotes} />
            </div>
          </div>
        </div>
      ) : null}

      {extraEntries.length ? (
        <div className="border-t border-gray-300 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {extraEntries.map(([key, extraValue]) => (
              <div key={key} className="rounded-xl border border-gray-300 bg-gray-50 p-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{key}</div>
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
    return <div className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{renderLinkifiedText(value)}</div>;
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
    ? objectValue.activities.filter((item): item is Record<string, unknown> => asObject(item) !== null)
    : [];
  const notes = Array.isArray(objectValue.notes) ? objectValue.notes : [];
  const summaryKeys = ["sessionIndex", "title", "dateLabel", "teacherName"];
  const extraEntries = Object.entries(objectValue).filter(
    ([key]) => !summaryKeys.includes(key) && key !== "activities" && key !== "notes"
  );
  const renderStructuredValue = (entry: unknown) => {
    if (Array.isArray(entry)) {
      return (
        <div className="space-y-1">
          {entry.map((item: unknown, index: number) => (
            <div key={`${String(item)}-${index}`} className="whitespace-pre-wrap text-sm text-gray-700">
              {String(item)}
            </div>
          ))}
        </div>
      );
    }

    if (entry && typeof entry === "object") {
      return <SpreadsheetList value={flattenUnknownToLines(entry)} empty="-" />;
    }

    return <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{renderLinkifiedText(String(entry ?? "-"))}</div>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {summaryKeys.map((key) =>
          objectValue[key] !== undefined && objectValue[key] !== null && objectValue[key] !== "" ? (
            <StatusBadge key={key} kind="muted">
              {key}: {String(objectValue[key])}
            </StatusBadge>
          ) : null
        )}
      </div>

      {notes.length ? (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</div>
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
<div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Activities</div>
          {activities.map((activity: Record<string, unknown>, index: number) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(activity || {}).map(([key, activityValue]) => (
                  <div key={key}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{key}</div>
                    <div className="mt-1">
                      <SheetCellValue value={activityValue} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {extraEntries.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {extraEntries.map(([key, extraValue]) => (
            <div key={key} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{key}</div>
              <div className="mt-1">{renderStructuredValue(extraValue)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default LessonPlanWorkspace;