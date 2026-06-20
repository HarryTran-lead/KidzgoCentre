"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import {
  CalendarDays,
  ArrowRightLeft,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Download,
  BookOpen,
  Search,
  ChevronLeft,
  MapPin,
  TrendingUp,
  CheckCheckIcon,
  ArrowUpDown,
  ChevronUp,
  RefreshCcw,
  MessageSquareText,
  Filter,
  X,
  ChevronRight,
  Clock1,
  ClipboardPen,
  GraduationCap,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import {
  fetchSessions,
  fetchAttendance,
  fetchSessionDetail,
  saveAttendance,
  toISODateStart,
  toISODateEnd,
  mapSessionToLessonDetail,
} from "@/app/api/teacher/attendance";

import type { AttendanceStatus, LessonDetail, SessionApiItem, Student } from "@/types/teacher/attendance";
import type { SessionReportItem } from "@/types/teacher/sessionReport";
import { todayDateOnly } from "@/lib/datetime";
import {
  createSessionReport,
  enhanceSessionFeedback,
  fetchSessionReports,
  submitSessionReport,
  updateSessionReport,
} from "@/app/api/teacher/sessionReport";
import SessionNoteModal from "@/components/teacher/attendance/SessionNoteModal";
import {
  getClassLessonPlanSyllabus,
  getAllLessonPlanTemplates,
  getLessonPlanById,
  getSessionLessonPlanDocument,
  getLessonPlanTemplateById,
} from "@/lib/api/lessonPlanService";
import type { ClassLessonPlanSyllabusSession, LessonPlan, LessonPlanTemplate, SessionLessonPlanDocument } from "@/lib/api/lessonPlanService";
import { getTeachingLog, submitTeachingLog, updateTeachingLog } from "@/lib/api/sessionService";
import { getSyllabusById, getSyllabusDocument } from "@/lib/api/syllabusService";
import type { SyllabusDetail, SyllabusDocument } from "@/lib/api/syllabusService";
import { buildFileUrl } from "@/constants/apiURL";
import LessonPlanTemplateDocument from "@/components/lesson-plans/LessonPlanTemplateDocument";
import SyllabusDetailModalBody from "@/components/lesson-plans/SyllabusDetailModalBody";
import SyllabusSummaryPanel from "@/components/lesson-plans/SyllabusSummaryPanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/lightswind/resizable";
import type { TeachingLog, TeachingProgressStatus, TeachingType } from "@/types/admin/sessions";
import { cn } from "@/lib/utils";

type FilterField = {
  date: string;
  time: string;
  session: string;
  className: string;
  status: string;
};

type SessionCard = {
  id: string;
  sessionDate: string | null;
  className: string;
  classCode: string;
  room: string;
  teacher: string;
  date: string;
  time: string;
  status?: string | null;
  participationType?: string | null;
  branch?: string | null;
  students: number;
  color: string;
  raw: SessionApiItem;
};

type StudentRow = Student & {
  name: string;
  rowKey: string;
  studentId: string;
  studentCode?: string;
  email?: string;
  phone?: string;
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  absent: "Vắng mặt",
  makeup: "Học bù",
  notMarked: "Chưa điểm danh",
};

const STATUS_BUTTON_LABELS: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  absent: "Vắng",
  makeup: "Bù",
  notMarked: "Chưa",
};

const STATUS_STYLES: Record<AttendanceStatus, { active: string; hover: string }> = {
  present: {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    hover: "hover:bg-emerald-50",
  },
  absent: {
    active: "bg-red-50 text-red-700 border-red-200",
    hover: "hover:bg-red-50",
  },
  makeup: {
    active: "bg-sky-50 text-sky-700 border-sky-200",
    hover: "hover:bg-sky-50",
  },
  notMarked: {
    active: "bg-amber-50 text-amber-700 border-amber-200",
    hover: "hover:bg-amber-50",
  },
};

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  WithNotice24H: "Báo trước >= 24h",
  Under24H: "Báo trước < 24h",
  NoNotice: "Không báo trước",
  LongTerm: "Nghỉ dài hạn",
};

const SESSION_COLOR_POOL = [
  "from-red-600 to-red-700",
  "from-gray-600 to-gray-700",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-blue-500",
  "from-indigo-500 to-blue-500",
  "from-red-500 to-red-600",
];

const ZERO_GUID = "00000000-0000-0000-0000-000000000000";
const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TEACHING_TYPE_LABELS: Record<TeachingType, string> = {
  normal: "Dạy mới",
  review: "Ôn tập",
  test: "Kiểm tra",
  makeup: "Học bù",
  event: "Sự kiện",
  other: "Khác",
};

const TEACHING_TYPE_OPTIONS: { value: TeachingType; label: string }[] = [
  { value: "normal", label: TEACHING_TYPE_LABELS.normal },
  { value: "review", label: TEACHING_TYPE_LABELS.review },
  { value: "test", label: TEACHING_TYPE_LABELS.test },
  { value: "makeup", label: TEACHING_TYPE_LABELS.makeup },
  { value: "event", label: TEACHING_TYPE_LABELS.event },
  { value: "other", label: TEACHING_TYPE_LABELS.other },
];

const TEACHING_PROGRESS_LABELS: Record<TeachingProgressStatus, string> = {
  completed: "Hoàn thành",
  partial: "Dạy một phần",
  not_started: "Chưa dạy",
  skipped: "Bỏ qua",
};

const TEACHING_PROGRESS_OPTIONS: { value: TeachingProgressStatus; label: string; hint: string }[] = [
  {
    value: "completed",
    label: TEACHING_PROGRESS_LABELS.completed,
    hint: "Buổi học hoàn tất và sẽ consume lesson theo runtime progression.",
  },
  {
    value: "partial",
    label: TEACHING_PROGRESS_LABELS.partial,
    hint: "Buổi học chỉ dạy một phần, chưa consume lesson hiện tại.",
  },
  {
    value: "not_started",
    label: TEACHING_PROGRESS_LABELS.not_started,
    hint: "Chưa dạy nội dung planned của buổi này.",
  },
  {
    value: "skipped",
    label: TEACHING_PROGRESS_LABELS.skipped,
    hint: "Bỏ qua buổi học; teacher note là bắt buộc để giải thích lý do.",
  },
];

function normalizeGuidValue(value: unknown): string | null {
  const raw = String(value ?? "").trim().replace(/[{}]/g, "");
  if (!raw || raw === ZERO_GUID) return null;
  if (GUID_REGEX.test(raw)) return raw;
  return raw.length >= 8 ? raw : null;
}

function resolveSyllabusId(...values: unknown[]): string {
  for (const value of values) {
    const normalized = normalizeGuidValue(value);
    if (normalized) return normalized;
  }
  return "";
}

function normalizeTeachingType(value: unknown): TeachingType | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (
    normalized === "normal" ||
    normalized === "review" ||
    normalized === "test" ||
    normalized === "makeup" ||
    normalized === "event" ||
    normalized === "other"
  ) {
    return normalized;
  }

  return null;
}

function normalizeTeachingProgressStatus(value: unknown): TeachingProgressStatus | null {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");

  if (normalized === "completed") return "completed";
  if (normalized === "partial") return "partial";
  if (normalized === "not_started" || normalized === "planned") return "not_started";
  if (normalized === "skipped") return "skipped";

  return null;
}

function isTeachingLogReadOnlyStatus(value: unknown): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "approved" || normalized === "locked";
}

function getApiErrorCode(error: any): string | undefined {
  const payload = error?.response?.data ?? error?.data ?? null;
  const firstError = Array.isArray(payload?.errors) ? payload.errors[0] : null;

  return firstError?.code ?? payload?.code ?? payload?.errorCode ?? payload?.error?.code;
}

function getLocalIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateParam(value?: string | null): string | null {
  const normalized = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

function getSessionIsoDate(session?: SessionApiItem | null): string | null {
  const raw = session?.actualDatetime ?? session?.plannedDatetime ?? null;
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return getLocalIsoDate(parsed);
}

type SessionReportState = {
  reportId: string;
  feedback: string;
  status?: string;
};
const SESSION_REPORT_PAGE_SIZE = 100;
const SESSION_REPORT_MAX_PAGES = 20;

function getSessionReportTimestamp(report: SessionReportItem | any): number {
  const updatedAt = Date.parse(String(report?.updatedAt ?? ""));
  if (!Number.isNaN(updatedAt)) return updatedAt;

  const createdAt = Date.parse(String(report?.createdAt ?? ""));
  if (!Number.isNaN(createdAt)) return createdAt;

  return 0;
}

function translateSessionReportError(message?: string): string | null {
  if (!message) return null;
  const m = message.toLowerCase();
  if (m.includes("sessionreport.sessionnotended") || m.includes("session report can only be created")) {
    return "Chỉ có thể thao tác nhận xét sau khi buổi học đã kết thúc.";
  }
  if (m.includes("published")) return "Không thể chỉnh sửa nhận xét đã được xuất bản.";
  if (m.includes("review")) return "Nhận xét đang trong trạng thái chờ duyệt, không thể gửi lại.";
  if (m.includes("not found")) return "Không tìm thấy báo cáo buổi học.";
  if (m.includes("unauthorized") || m.includes("forbidden")) return "Bạn không có quyền thực hiện thao tác này.";
  return null;
}

type SyllabusLoadFailure = {
  status?: number;
  message?: string;
  detail?: string;
  title?: string;
};

function getTeachingSyllabusPermissionError(
  ...responses: SyllabusLoadFailure[]
): string | null {
  if (responses.some((response) => response.status === 403)) {
    return "Đã resolve được syllabusId nhưng backend đang chặn quyền đọc full syllabus cho teacher. BE cần mở quyền GET /api/syllabuses/{id} và GET /api/syllabuses/{id}/document cho token Teacher.";
  }

  if (responses.some((response) => response.status === 401)) {
    return "Phiên đăng nhập đã hết hạn hoặc token hiện tại không được phép tải full syllabus.";
  }

  return null;
}

function getTeachingSyllabusLoadError(
  ...responses: SyllabusLoadFailure[]
): string {
  const permissionError = getTeachingSyllabusPermissionError(...responses);
  if (permissionError) {
    return permissionError;
  }

  const backendMessage = responses
    .map((response) =>
      String(response.detail ?? response.message ?? response.title ?? "").trim()
    )
    .find(Boolean);

  return backendMessage || "Không tải được chi tiết syllabus đầy đủ cho buổi này.";
}

function mergeSyllabusDetailSources(
  fromDocument: SyllabusDetail | null,
  fromDetail: SyllabusDetail | null,
): SyllabusDetail | null {
  if (fromDocument && fromDetail) {
    return {
      ...fromDetail,
      ...fromDocument,
      programName: fromDetail.programName ?? fromDocument.programName,
      levelName: fromDetail.levelName ?? fromDocument.levelName,
      rawContentJson: fromDocument.rawContentJson ?? fromDetail.rawContentJson,
      units: Array.isArray(fromDetail.units) && fromDetail.units.length > 0 ? fromDetail.units : fromDocument.units,
      lessons: Array.isArray(fromDetail.lessons) && fromDetail.lessons.length > 0 ? fromDetail.lessons : fromDocument.lessons,
      resources: Array.isArray(fromDetail.resources) && fromDetail.resources.length > 0 ? fromDetail.resources : fromDocument.resources,
      sessionTemplates:
        Array.isArray(fromDetail.sessionTemplates) && fromDetail.sessionTemplates.length > 0
          ? fromDetail.sessionTemplates
          : fromDocument.sessionTemplates,
    };
  }

  return fromDocument ?? fromDetail;
}

async function loadAdminStyleSyllabusDetail(
  syllabusId: string,
): Promise<{ detail: SyllabusDetail | null; error: string | null }> {
  const [documentResponse, detailResponse] = await Promise.all([
    getSyllabusDocument(syllabusId),
    getSyllabusById(syllabusId),
  ]);

  const permissionError = getTeachingSyllabusPermissionError(
    documentResponse,
    detailResponse,
  );

  if (permissionError) {
    return { detail: null, error: permissionError };
  }

  const fromDocument =
    documentResponse.isSuccess && documentResponse.data
      ? mapSyllabusDocumentToDetail(documentResponse.data)
      : null;
  const fromDetail = detailResponse.isSuccess ? detailResponse.data : null;
  const detail = mergeSyllabusDetailSources(fromDocument, fromDetail);
  const documentWarning =
    detail && !fromDocument && !documentResponse.isSuccess
      ? getTeachingSyllabusLoadError(documentResponse)
      : null;

  return {
    detail,
    error: documentWarning ?? (detail ? null : getTeachingSyllabusLoadError(documentResponse, detailResponse)),
  };
}

function extractFirstLessonNumber(value: unknown): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const match = text.match(/\blesson\s*0*(\d+)\b/i);
  if (!match?.[1]) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getExpectedLessonNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const lessonNumber = extractFirstLessonNumber(value);
    if (lessonNumber != null) {
      return lessonNumber;
    }
  }

  return null;
}

function getLessonPlanTemplateMismatchReason(
  template: LessonPlanTemplate | null | undefined,
  expectedLessonNumber: number | null,
): string | null {
  if (!template) return null;

  const titleLessonNumber = extractFirstLessonNumber(template.title);
  const sourceFileLessonNumber = extractFirstLessonNumber(template.sourceFileName);

  if (
    titleLessonNumber != null &&
    sourceFileLessonNumber != null &&
    titleLessonNumber !== sourceFileLessonNumber
  ) {
    return `Template trả về không nhất quán: title là Lesson ${titleLessonNumber} nhưng source file là Lesson ${sourceFileLessonNumber}.`;
  }

  if (expectedLessonNumber != null) {
    if (titleLessonNumber != null && titleLessonNumber !== expectedLessonNumber) {
      return `Template trả về là Lesson ${titleLessonNumber} nhưng buổi hiện tại cần Lesson ${expectedLessonNumber}.`;
    }

    if (sourceFileLessonNumber != null && sourceFileLessonNumber !== expectedLessonNumber) {
      return `Source file của template là Lesson ${sourceFileLessonNumber} nhưng buổi hiện tại cần Lesson ${expectedLessonNumber}.`;
    }
  }

  return null;
}

function isCurriculumMappingMissingResponse(
  response:
    | {
        status?: number;
        title?: string;
        detail?: string;
        message?: string;
        raw?: unknown;
      }
    | null
    | undefined,
): boolean {
  if (!response || response.status !== 404) return false;

  const rawObject =
    response.raw && typeof response.raw === "object"
      ? (response.raw as {
          title?: unknown;
          detail?: unknown;
          errors?: Array<{ code?: unknown; description?: unknown }>;
        })
      : null;

  const rawErrors = Array.isArray(rawObject?.errors)
    ? rawObject.errors
        .map((item) => `${String(item?.code ?? "")} ${String(item?.description ?? "")}`.trim())
        .filter(Boolean)
        .join(" ")
    : "";

  const haystack = [
    response.title,
    response.detail,
    response.message,
    typeof rawObject?.title === "string" ? rawObject.title : "",
    typeof rawObject?.detail === "string" ? rawObject.detail : "",
    rawErrors,
  ]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

  return haystack.includes("curriculummappingmissing") || haystack.includes("curriculum mapping is missing");
}

function isLessonPlanDocumentEndpointUnavailable(
  response:
    | {
        status?: number;
        title?: string;
        detail?: string;
        message?: string;
        raw?: unknown;
      }
    | null
    | undefined,
): boolean {
  if (!response || response.status !== 404) return false;
  if (isCurriculumMappingMissingResponse(response)) return false;

  const title = String(response.title ?? "").trim().toLowerCase();
  const detail = String(response.detail ?? "").trim().toLowerCase();
  const message = String(response.message ?? "").trim().toLowerCase();

  if (title || detail) {
    return title === "not found" && !detail;
  }

  return !message || message === "not found" || message.includes("cannot get");
}

function getModuleTemplateMatchScore(
  template: LessonPlanTemplate,
  options: {
    sessionIndexInModule: number | null;
    expectedLessonNumber: number | null;
  },
): number {
  let score = template.isActive === false ? -1000 : 0;

  if (options.sessionIndexInModule != null) {
    if (template.sessionOrder != null && template.sessionOrder === options.sessionIndexInModule) {
      score += 100;
    }
    if (template.sessionIndex === options.sessionIndexInModule) {
      score += 80;
    }
    if (
      template.lessonOrderIndexInUnit != null &&
      template.lessonOrderIndexInUnit === options.sessionIndexInModule
    ) {
      score += 60;
    }
    if (template.orderIndexInUnit != null && template.orderIndexInUnit === options.sessionIndexInModule) {
      score += 40;
    }
    if (
      template.orderIndexInUnit != null &&
      template.orderIndexInUnit + 1 === options.sessionIndexInModule
    ) {
      score += 35;
    }
  }

  if (options.expectedLessonNumber != null) {
    if (extractFirstLessonNumber(template.title) === options.expectedLessonNumber) {
      score += 20;
    }
    if (extractFirstLessonNumber(template.sourceFileName) === options.expectedLessonNumber) {
      score += 20;
    }
  }

  if (template.syllabusContent || template.objectives || template.procedure) {
    score += 5;
  }

  return score;
}

function pickModuleLessonPlanTemplate(
  templates: LessonPlanTemplate[],
  options: {
    sessionIndexInModule: number | null;
    expectedLessonNumber: number | null;
  },
): LessonPlanTemplate | null {
  const ranked = templates
    .map((template) => ({
      template,
      score: getModuleTemplateMatchScore(template, options),
      updatedAt: Date.parse(String(template.updatedAt ?? template.createdAt ?? "")),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const bUpdatedAt = Number.isFinite(b.updatedAt) ? b.updatedAt : 0;
      const aUpdatedAt = Number.isFinite(a.updatedAt) ? a.updatedAt : 0;
      return bUpdatedAt - aUpdatedAt;
    });

  return ranked[0]?.template ?? null;
}

function enrichTeachingReportSessionWithTemplate(
  session: ClassLessonPlanSyllabusSession,
  template: LessonPlanTemplate | null | undefined,
): ClassLessonPlanSyllabusSession {
  if (!template) return session;

  return {
    ...session,
    templateId: session.templateId ?? template.id,
    templateTitle: session.templateTitle ?? template.title,
    templateSyllabusContent: session.templateSyllabusContent ?? template.syllabusContent ?? null,
  };
}

function pickSessionReportFromStudent(student: any, sessionId: string): SessionReportState {
  const directNote = String(
    student?.note ??
    student?.feedback ??
    student?.Feedback ??
    student?.comment ??
    student?.Comment ??
    student?.sessionReportFeedback ??
    "",
  ).trim();

  const directReportId = String(
    student?.sessionReportId ?? student?.reportId ?? student?.ReportId ?? "",
  ).trim();

  const singleReport = student?.sessionReport;
  const singleReportFeedback = String(
    singleReport?.feedback ?? singleReport?.Feedback ?? singleReport?.note ?? singleReport?.comment ?? "",
  ).trim();
  const singleReportId = String(singleReport?.id ?? singleReport?.reportId ?? singleReport?.Id ?? "").trim();
  const singleReportStatus = String(singleReport?.status ?? singleReport?.Status ?? "").trim();

  const reportList = Array.isArray(student?.sessionReports)
    ? student.sessionReports
    : Array.isArray(student?.SessionReports)
      ? student.SessionReports
      : [];

  const reportFromList = reportList.find((item: any) => {
    const reportSessionId = String(item?.sessionId ?? item?.SessionId ?? "").trim();
    return reportSessionId === sessionId;
  });

  const listFeedback = String(
    reportFromList?.feedback ?? reportFromList?.Feedback ?? reportFromList?.note ?? reportFromList?.comment ?? "",
  ).trim();
  const listReportId = String(
    reportFromList?.id ?? reportFromList?.reportId ?? reportFromList?.Id ?? "",
  ).trim();
  const listStatus = String(reportFromList?.status ?? reportFromList?.Status ?? "").trim();

  return {
    feedback: listFeedback || singleReportFeedback || directNote,
    reportId: listReportId || singleReportId || directReportId,
    status: listStatus || singleReportStatus || undefined,
  };
}
const buildSessionReportKey = (sessionId: string, studentId: string, rowKey: string): string => {
  const studentKey = studentId || rowKey;
  return `${sessionId}:${studentKey}`;
};

function getAbsenceTypeLabel(value?: string | null): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return ABSENCE_TYPE_LABELS[normalized] ?? normalized;
}

function getStatusButtonOrder(hasMakeupCredit?: boolean | null): AttendanceStatus[] {
  return hasMakeupCredit
    ? ["makeup", "present", "absent", "notMarked"]
    : ["present", "absent", "makeup", "notMarked"];
}

function normalizeAttendanceStatus(
  status: AttendanceStatus | null | undefined,
  hasMakeupCredit?: boolean | null,
): AttendanceStatus | null {
  if (hasMakeupCredit && (!status || status === "notMarked")) {
    return "absent";
  }
  return status ?? null;
}

function SortableHeader<T extends string>({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
}: {
  label: string;
  column: T;
  sortColumn: T | null;
  sortDirection: "asc" | "desc";
  onSort: (col: T) => void;
}) {
  const isActive = sortColumn === column;

  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-2 hover:text-red-600 transition-colors cursor-pointer text-left"
    >
      <span>{label}</span>
      <div className="flex flex-col">
        {isActive ? (
          sortDirection === "asc" ? (
            <ChevronUp size={14} className="text-red-600" />
          ) : (
            <ChevronUp size={14} className="text-red-600 rotate-180" />
          )
        ) : (
          <ArrowUpDown size={14} className="text-gray-400" />
        )}
      </div>
    </button>
  );
}

function StudentAvatar({ name }: { name: string }) {
  const safe = (name ?? "").trim() || "NA";
  const initials = safe
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-xs">
      {initials}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Trang <span className="font-semibold">{currentPage}</span> /{" "}
        <span className="font-semibold">{totalPages}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          ←
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${currentPage === page
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-transparent"
                : "border-gray-200 hover:bg-gray-50"
              }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          →
        </button>
      </div>
    </div>
  );
}

// --- Teaching report activity helpers ---
type TeachingActivityDraft = {
  time: string;
  book: string;
  skills: string;
  classwork: string;
  requiredMaterials: string;
  homeworkRequiredMaterials: string;
  extra: string;
};

type TeachingActivityErrors = Partial<Record<keyof TeachingActivityDraft, string>>;

function createEmptyTeachingActivity(): TeachingActivityDraft {
  return { time: "", book: "", skills: "", classwork: "", requiredMaterials: "", homeworkRequiredMaterials: "", extra: "" };
}

function parseTeachingJson(value?: string | null): Record<string, any> | null {
  if (!value || !value.trim()) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function getSourceDocumentLabel(sourceFileName?: string | null, sourceUrl?: string | null, fallback = "Mở/Tải source"): string {
  const preferredName = String(sourceFileName ?? "").trim();
  if (preferredName) return preferredName;

  const rawUrl = String(sourceUrl ?? "").trim();
  if (!rawUrl) return fallback;

  const normalizedPath = rawUrl.split(/[?#]/)[0] || rawUrl;
  const lastSegment = normalizedPath.split("/").filter(Boolean).pop() || fallback;

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

function mapSyllabusDocumentToDetail(doc: SyllabusDocument): SyllabusDetail {
  const sections = Array.isArray(doc.sections) ? doc.sections : [];
  const headingSection = sections.find((section) => (section.type ?? "").toLowerCase() === "heading");
  const findSectionContent = (titleMatcher: RegExp): string | null => {
    const matched = sections.find((section) => titleMatcher.test((section.title ?? "").toLowerCase()));
    if (!matched) return null;
    if (matched.content && matched.content.trim()) return matched.content.trim();
    return null;
  };

  return {
    id: doc.id,
    programId: doc.programId,
    levelId: doc.levelId,
    programName: null,
    levelName: null,
    code: doc.code,
    version: String(doc.version ?? ""),
    title: doc.title,
    isActive: (doc.status ?? "Draft") !== "Archived",
    edition: doc.edition ?? (headingSection?.content?.trim() || null),
    overview: findSectionContent(/overview|tong quan|what is/),
    overallObjectives: findSectionContent(/overall objectives|course objectives|muc tieu tong quat/),
    specificObjectives: findSectionContent(/specific objectives|muc tieu cu the/),
    ethicsAndAttitudes: findSectionContent(/ethics|attitudes|pham chat/),
    bookOverview: findSectionContent(/book overview|text books?|references|giao trinh/),
    totalPeriods: doc.summary?.totalPeriods ?? null,
    minutesPerPeriod: doc.summary?.minutesPerPeriod ?? null,
    totalLessons: doc.summary?.totalLessons ?? null,
    sourceFileName: doc.sourceFileName ?? null,
    attachmentUrl: doc.attachmentUrl ?? null,
    rawContentJson: JSON.stringify(doc),
    units: [],
    lessons: [],
    resources: [],
    sessionTemplates: [],
    unitCount: doc.summary?.totalUnits ?? null,
    sessionTemplateCount: doc.summary?.totalSessions ?? null,
    createdAt: null,
  };
}

type TeachingMaterialReference = {
  title: string;
  content: string;
};

type CurriculumRenderColumn = {
  key: string;
  label: string;
};

type CurriculumRenderCell = {
  columnKey: string;
  value: string;
  rowSpan?: number;
  colSpan?: number;
  align?: string;
  bold?: boolean;
};

type CurriculumRenderRow = {
  cells: CurriculumRenderCell[];
};

type CurriculumRenderModel = {
  columns: CurriculumRenderColumn[];
  rows: CurriculumRenderRow[];
};

type ProcedureRenderRow = {
  stage: string;
  step: string;
  details: string;
  mediaLinks: string[];
};

type LessonPlanFallbackSections = {
  objectives: string;
  languageContent: string;
  methodology: string;
  teacherMaterials: string;
  studentMaterials: string;
  procedure: string;
  homework: string;
  evaluation: string;
};

function extractTeachingMaterialsBlockFromPlainText(raw: string): string {
  const text = raw.trim();
  if (!text) return "";

  const lines = text.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => /^\s*Teaching Materials?:/i.test(line));
  if (startIndex < 0) return "";

  const collected: string[] = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    const current = lines[i];
    if (i > startIndex && /^\s*Note[s]?:/i.test(current)) break;
    collected.push(current);
  }

  return collected.join("\n").trim();
}

function normalizeTeachingMaterialValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter(Boolean)
      .join("\n");
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${normalizeTeachingMaterialValue(v)}`.trim())
      .filter((line) => line !== ":" && line !== "" && !line.endsWith(": "));
    return entries.join("\n").trim();
  }
  return "";
}

function extractTeachingMaterialReferences(value?: string | null): TeachingMaterialReference[] {
  const parsed = parseTeachingJson(value);
  if (!parsed) {
    const raw = String(value ?? "").trim();
    if (!raw) return [];

    const materialBlock = extractTeachingMaterialsBlockFromPlainText(raw);
    if (materialBlock) {
      return [{
        title: "Teaching materials",
        content: materialBlock,
      }];
    }

    const urls = Array.from(new Set(raw.match(/https?:\/\/\S+/g) || []));
    if (!urls.length) return [];

    return [{
      title: "Liên kết tài liệu",
      content: urls.join("\n"),
    }];
  }

  const refs: TeachingMaterialReference[] = [];
  const seen = new Set<string>();
  const push = (title: string, source: unknown) => {
    const content = normalizeTeachingMaterialValue(source);
    if (!content) return;
    const key = `${title}__${content}`;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push({ title, content });
  };

  push("Teaching materials", parsed.teachingMaterialsText ?? parsed.teachingMaterials ?? parsed.materials);
  push("Homework materials", parsed.homeworkMaterials ?? parsed.homeworkRequiredMaterials);

  const rawLinesText = Array.isArray(parsed.lines)
    ? parsed.lines
        .map((line: unknown) => (typeof line === "string" ? line : String(line ?? "")))
        .join("\n")
    : "";
  if (rawLinesText.trim()) {
    push("Teaching materials", extractTeachingMaterialsBlockFromPlainText(rawLinesText));
  }

  const activities = Array.isArray(parsed.activities) ? parsed.activities : [];
  activities.forEach((activity, index) => {
    if (!activity || typeof activity !== "object") return;
    const row = activity as Record<string, unknown>;
    push(`Dòng ${index + 1} - Materials`, row.requiredMaterials);
    push(`Dòng ${index + 1} - HW`, row.homeworkRequiredMaterials);
    push(`Dòng ${index + 1} - Extra`, row.extra);
  });

  return refs;
}

function renderTeachingMaterialContent(content: string) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const lines = content.split(/\r?\n/);

  return (
    <div className="mt-1 whitespace-pre-wrap break-words text-xs text-gray-700">
      {lines.map((line, lineIndex) => (
        <div key={`material-line-${lineIndex}`}>
          {line.split(urlPattern).map((part, partIndex) => {
            const isLink = /^https?:\/\/\S+$/i.test(part);
            if (!isLink) {
              return <span key={`material-part-${lineIndex}-${partIndex}`}>{part}</span>;
            }

            return (
              <a
                key={`material-link-${lineIndex}-${partIndex}`}
                href={buildFileUrl(part)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 hover:text-blue-700"
              >
                {part}
              </a>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function teachingActivityDraftsFromUnknown(value: unknown): TeachingActivityDraft[] {
  if (!Array.isArray(value) || !value.length) return [createEmptyTeachingActivity()];
  return value.map((item) => {
    const src = item && typeof item === "object" && !Array.isArray(item) ? (item as Record<string, any>) : {};
    const str = (obj: Record<string, any>, keys: string[]) => {
      for (const k of keys) { const v = obj[k]; if (typeof v === "string" && v.trim()) return v; }
      return "";
    };
    return {
      time: str(src, ["time"]),
      book: str(src, ["book"]),
      skills: str(src, ["skills"]),
      classwork: str(src, ["classwork"]),
      requiredMaterials: str(src, ["requiredMaterials"]),
      homeworkRequiredMaterials: str(src, ["homeworkRequiredMaterials"]),
      extra: str(src, ["extra"]),
    };
  });
}

function extractMaterialsFromPlainLessonText(raw: string): string {
  const text = raw.trim();
  if (!text) return "";

  const teacherMatch = text.match(/Materials\s+for\s+teacher([\s\S]*?)(?=Materials\s+for\s+students|Procedure|$)/i);
  const studentMatch = text.match(/Materials\s+for\s+students([\s\S]*?)(?=Procedure|Stages\s*\||$)/i);

  const teacherPart = String(teacherMatch?.[1] ?? "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[-•]\s*/g, "\n- ")
    .trim();
  const studentPart = String(studentMatch?.[1] ?? "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[-•]\s*/g, "\n- ")
    .trim();

  const parts: string[] = [];
  if (teacherPart) parts.push(`GV: ${teacherPart}`);
  if (studentPart) parts.push(`HS: ${studentPart}`);
  return parts.join("\n").trim();
}

function extractTeachingActivitiesFromPlainText(raw: string): TeachingActivityDraft[] {
  const text = raw.trim();
  if (!text) return [];

  const procedureAnchor = text.search(/Procedure|Stages\s*\|\s*Step\s*\|\s*Details/i);
  if (procedureAnchor < 0) return [];

  const procedureText = text.slice(procedureAnchor);
  const normalized = procedureText
    .replace(/\s+(\d{1,2})\s*\|/g, "\n$1 |")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  const rowRegex = /^\s*(\d{1,2})\s*\|\s*([^|\n]+?)\s*\|\s*([\s\S]*?)(?=^\s*\d{1,2}\s*\||$)/gm;
  const materials = extractMaterialsFromPlainLessonText(text);
  const rows: TeachingActivityDraft[] = [];

  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(normalized)) !== null) {
    const stageNo = String(match[1] ?? "").trim();
    const stepTitle = String(match[2] ?? "").replace(/\s+/g, " ").trim();
    const detailsRaw = String(match[3] ?? "").trim();
    const details = detailsRaw
      .replace(/\s{2,}/g, " ")
      .replace(/\s*[-•]\s*/g, "\n- ")
      .trim();

    if (!stepTitle && !details) continue;

    rows.push({
      time: stageNo ? `Bước ${stageNo}` : "",
      book: "",
      skills: "",
      classwork: [stepTitle, details].filter(Boolean).join("\n"),
      requiredMaterials: materials,
      homeworkRequiredMaterials: /homework/i.test(stepTitle) ? details : "",
      extra: "",
    });
  }

  return rows;
}

function extractTeachingActivitiesFromContent(content?: string | null): TeachingActivityDraft[] {
  const parsed = parseTeachingJson(content);
  if (parsed) {
    const candidates = [
      parsed.activities,
      parsed.activityRows,
      parsed.rows,
      parsed.items,
      parsed.content,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length) {
        return teachingActivityDraftsFromUnknown(candidate);
      }
    }

    if (
      typeof parsed === "object" &&
      (parsed.time || parsed.book || parsed.skills || parsed.classwork || parsed.requiredMaterials)
    ) {
      return teachingActivityDraftsFromUnknown([parsed]);
    }
  }

  const plainTextActivities = extractTeachingActivitiesFromPlainText(String(content ?? ""));
  if (plainTextActivities.length) {
    return plainTextActivities;
  }

  return [];
}

function normalizeCurriculumText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => normalizeCurriculumText(item)).filter(Boolean).join("\n").trim();
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const best = ["value", "text", "title", "name", "label", "content"]
      .map((key) => normalizeCurriculumText(obj[key]))
      .find(Boolean);
    return best || "";
  }
  return "";
}

function normCurriculumKey(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCurriculumTableObject(table: Record<string, unknown>): CurriculumRenderModel | null {
  const rawColumns = Array.isArray(table.columns) ? table.columns : [];
  const rawRows = Array.isArray(table.rows) ? table.rows : [];
  if (!rawRows.length) return null;

  const columns: CurriculumRenderColumn[] = rawColumns
    .map((column) => {
      if (!column || typeof column !== "object") return null;
      const obj = column as Record<string, unknown>;
      const key = normalizeCurriculumText(obj.key);
      if (!key) return null;
      return {
        key,
        label: normalizeCurriculumText(obj.label) || key,
      };
    })
    .filter((item): item is CurriculumRenderColumn => item != null);

  const rows: CurriculumRenderRow[] = rawRows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const rowObj = row as Record<string, unknown>;
      const rawCells = Array.isArray(rowObj.cells) ? rowObj.cells : [];
        const cells = rawCells.reduce<CurriculumRenderCell[]>((acc, cell) => {
          if (!cell || typeof cell !== "object") return acc;
          const cellObj = cell as Record<string, unknown>;
          const columnKey = normalizeCurriculumText(cellObj.columnKey || cellObj.key);
          if (!columnKey) return acc;
          const rowSpanValue = Number(cellObj.rowSpan);
          const colSpanValue = Number(cellObj.colSpan);
          acc.push({
            columnKey,
            value: normalizeCurriculumText(cellObj.value),
            rowSpan: Number.isFinite(rowSpanValue) && rowSpanValue > 1 ? rowSpanValue : undefined,
            colSpan: Number.isFinite(colSpanValue) && colSpanValue > 1 ? colSpanValue : undefined,
            align: normalizeCurriculumText(cellObj.align) || undefined,
            bold: typeof cellObj.bold === "boolean" ? cellObj.bold : undefined,
          });
          return acc;
        }, []);

      if (!cells.length) return null;
      return { cells };
    })
    .filter((item): item is CurriculumRenderRow => item != null);

  if (!rows.length) return null;

  const fallbackColumns = (() => {
    if (columns.length > 0) return columns;
    const firstRowKeys = rows[0]?.cells.map((cell) => cell.columnKey) || [];
    return firstRowKeys.map((key) => ({ key, label: key }));
  })();

  return {
    columns: fallbackColumns,
    rows,
  };
}

function tryParseJsonString(value: unknown): unknown {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  if (!(text.startsWith("{") || text.startsWith("["))) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractCurriculumModelDeepSearch(root: unknown): CurriculumRenderModel | null {
  const visited = new WeakSet<object>();
  const queue: unknown[] = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) continue;

    if (Array.isArray(node)) {
      for (const item of node) queue.push(item);
      continue;
    }

    if (typeof node !== "object") {
      const parsedFromString = tryParseJsonString(node);
      if (parsedFromString) queue.push(parsedFromString);
      continue;
    }

    if (visited.has(node as object)) continue;
    visited.add(node as object);

    const obj = node as Record<string, unknown>;

    if (Array.isArray(obj.rows) && (Array.isArray(obj.columns) || obj.rows.length > 0)) {
      const model = parseCurriculumTableObject(obj);
      if (model?.rows.length) return model;

      const modelFromRows = parseCurriculumRowsFromUnknown(obj.rows);
      if (modelFromRows?.rows.length) return modelFromRows;
    }

    for (const value of Object.values(obj)) {
      const parsedFromString = tryParseJsonString(value);
      if (parsedFromString) {
        queue.push(parsedFromString);
      }
      queue.push(value);
    }
  }

  return null;
}

function parseCurriculumRowsFromUnknown(value: unknown): CurriculumRenderModel | null {
  if (!Array.isArray(value) || !value.length) return null;

  const aliasColumns: CurriculumRenderColumn[] = [
    { key: "periods", label: "Periods" },
    { key: "topics", label: "Topics" },
    { key: "lessons", label: "Lessons" },
    { key: "contents", label: "Contents" },
    { key: "structures", label: "Structures" },
    { key: "studentsBook", label: "Students' book" },
    { key: "teachersBook", label: "Teacher's book" },
  ];

  const pickByAliases = (obj: Record<string, unknown>, aliases: string[]): string => {
    const aliasSet = new Set(aliases.map(normCurriculumKey));
    for (const [key, raw] of Object.entries(obj)) {
      if (!aliasSet.has(normCurriculumKey(key))) continue;
      const text = normalizeCurriculumText(raw);
      if (text) return text;
    }
    return "";
  };

  const rows: CurriculumRenderRow[] = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;

      const cells = [
        { columnKey: "periods", value: pickByAliases(obj, ["periods", "period", "periodRange", "sessionRange"]) },
        { columnKey: "topics", value: pickByAliases(obj, ["topics", "topic", "unit", "unitName", "sessionTopic"]) },
        { columnKey: "lessons", value: pickByAliases(obj, ["lessons", "lesson", "lessonNo", "lessonNumber", "sessionIndex", "sessionOrder"]) },
        { columnKey: "contents", value: pickByAliases(obj, ["contents", "content", "objective", "objectives", "activity"]) },
        { columnKey: "structures", value: pickByAliases(obj, ["structures", "structure", "languageFocus", "grammar", "pattern"]) },
        { columnKey: "studentsBook", value: pickByAliases(obj, ["studentsBook", "studentBook", "studentsbook", "pupilBook", "wbPage"]) },
        { columnKey: "teachersBook", value: pickByAliases(obj, ["teachersBook", "teacherBook", "teachersbook", "tbPage", "teacherPage"]) },
      ];

      const nonEmptyCount = cells.filter((cell) => cell.value.trim().length > 0).length;
      if (nonEmptyCount < 2) return null;

      return { cells };
    })
    .filter((item): item is CurriculumRenderRow => item != null);

  if (!rows.length) return null;
  return { columns: aliasColumns, rows };
}

function extractCurriculumModelFromContent(content?: string | null): CurriculumRenderModel | null {
  const parsed = parseTeachingJson(content);
  if (parsed && typeof parsed === "object") {
    const parsedObj = parsed as Record<string, unknown>;
    const candidateSectionLists = [
      parsedObj.sections,
      (parsedObj.document as Record<string, unknown> | undefined)?.sections,
    ];

    for (const sectionList of candidateSectionLists) {
      if (!Array.isArray(sectionList)) continue;
      for (const section of sectionList) {
        if (!section || typeof section !== "object") continue;
        const sectionObj = section as Record<string, unknown>;
        if (String(sectionObj.type || "").toLowerCase() !== "table") continue;
        const table = sectionObj.table;
        if (!table || typeof table !== "object") continue;
        const model = parseCurriculumTableObject(table as Record<string, unknown>);
        if (model?.rows.length) return model;
      }
    }

    const tableCandidates: unknown[] = [
      parsedObj.table,
      (parsedObj.document as Record<string, unknown> | undefined)?.table,
      (parsedObj.curriculum as Record<string, unknown> | undefined)?.table,
    ];
    for (const table of tableCandidates) {
      if (!table || typeof table !== "object") continue;
      const model = parseCurriculumTableObject(table as Record<string, unknown>);
      if (model?.rows.length) return model;
    }

    const rowCandidates: unknown[] = [
      parsedObj.rows,
      parsedObj.items,
      parsedObj.activities,
      (parsedObj.curriculum as Record<string, unknown> | undefined)?.rows,
      (parsedObj.document as Record<string, unknown> | undefined)?.rows,
    ];
    for (const rows of rowCandidates) {
      const model = parseCurriculumRowsFromUnknown(rows);
      if (model?.rows.length) return model;
    }

    const deepModel = extractCurriculumModelDeepSearch(parsed);
    if (deepModel?.rows.length) return deepModel;
  }

  const raw = String(content ?? "").trim();
  if (!raw) return null;

  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headerIndex = lines.findIndex((line) => /period/i.test(line) && /topic/i.test(line) && /lesson/i.test(line) && line.includes("|"));
  if (headerIndex < 0) return null;

  const headerCells = lines[headerIndex].split("|").map((part) => part.trim()).filter(Boolean);
  if (headerCells.length < 5) return null;

  const columns = headerCells.map((label, index) => ({ key: `col_${index}`, label }));
  const rows: CurriculumRenderRow[] = [];
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes("|")) continue;
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length < 5) continue;
    rows.push({
      cells: columns.map((column, index) => ({
        columnKey: column.key,
        value: parts[index] || "",
      })),
    });
  }

  if (!rows.length) return null;
  return { columns, rows };
}

function extractMediaLinksFromText(raw: string): string[] {
  const text = String(raw || "");
  if (!text.trim()) return [];
  const markdownImageMatches = Array.from(text.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi)).map((match) => match[1]);
  const urlMatches = Array.from(text.matchAll(/https?:\/\/[^\s)]+/gi)).map((match) => match[0]);
  const unique = Array.from(new Set([...markdownImageMatches, ...urlMatches]));
  return unique;
}

function extractProcedureRowsFromText(raw: string): ProcedureRenderRow[] {
  const text = String(raw || "").trim();
  if (!text) return [];

  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  const tableStart = normalized.search(/Stages\s*\|\s*Step\s*\|\s*Details/i);
  const source = tableStart >= 0 ? normalized.slice(tableStart) : normalized;
  const rowRegex = /^\s*(\d{1,2}|[IVX]+)?\s*\|\s*([^|\n]+?)\s*\|\s*([\s\S]*?)(?=^\s*(?:\d{1,2}|[IVX]+)?\s*\|\s*[^|\n]+?\s*\||$)/gim;

  const rows: ProcedureRenderRow[] = [];
  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(source)) !== null) {
    const stage = String(match[1] ?? "").trim();
    const step = String(match[2] ?? "").trim();
    const details = String(match[3] ?? "").trim();
    if (!step && !details) continue;
    rows.push({
      stage,
      step,
      details,
      mediaLinks: extractMediaLinksFromText(details),
    });
  }

  return rows;
}

function extractLessonPlanFallbackSections(raw: string): LessonPlanFallbackSections {
  const text = String(raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) {
    return {
      objectives: "",
      languageContent: "",
      methodology: "",
      teacherMaterials: "",
      studentMaterials: "",
      procedure: "",
      homework: "",
      evaluation: "",
    };
  }

  const pick = (startRegex: RegExp, endRegexes: RegExp[]): string => {
    const startMatch = startRegex.exec(text);
    if (!startMatch || startMatch.index < 0) return "";
    const from = startMatch.index + startMatch[0].length;
    const rest = text.slice(from);
    let end = rest.length;
    for (const regex of endRegexes) {
      regex.lastIndex = 0;
      const m = regex.exec(rest);
      if (m && m.index < end) end = m.index;
    }
    return rest.slice(0, end).trim();
  };

  const pickInline = (startRegex: RegExp, endRegexes: RegExp[]): string => {
    const startMatch = startRegex.exec(text);
    if (!startMatch || startMatch.index < 0) return "";
    const from = startMatch.index + startMatch[0].length;
    const rest = text.slice(from);
    let end = rest.length;
    for (const regex of endRegexes) {
      regex.lastIndex = 0;
      const m = regex.exec(rest);
      if (m && m.index < end) end = m.index;
    }
    return rest.slice(0, end).replace(/\s{2,}/g, " ").trim();
  };

  const sections = {
    objectives: pick(/(?:^|\n)\s*(?:A\.?\s*)?Objectives\s*:?/i, [/(?:^|\n)\s*(?:B\.?\s*)?Language\s*content\s*:?/im, /(?:^|\n)\s*(?:C\.?\s*)?Teaching\s*methodology\s*:?/im]),
    languageContent: pick(/(?:^|\n)\s*(?:B\.?\s*)?Language\s*content\s*:?/i, [/(?:^|\n)\s*(?:C\.?\s*)?Teaching\s*methodology\s*:?/im, /(?:^|\n)\s*(?:D\.?\s*)?Materials\s*for\s*teacher\s*:?/im]),
    methodology: pick(/(?:^|\n)\s*(?:C\.?\s*)?Teaching\s*methodology\s*:?/i, [/(?:^|\n)\s*(?:D\.?\s*)?Materials\s*for\s*teacher\s*:?/im, /(?:^|\n)\s*(?:E\.?\s*)?Materials\s*for\s*students\s*:?/im]),
    teacherMaterials: pick(/(?:^|\n)\s*(?:D\.?\s*)?Materials\s*for\s*teacher\s*:?/i, [/(?:^|\n)\s*(?:E\.?\s*)?Materials\s*for\s*students\s*:?/im, /(?:^|\n)\s*(?:F\.?\s*)?Procedure\s*:?/im]),
    studentMaterials: pick(/(?:^|\n)\s*(?:E\.?\s*)?Materials\s*for\s*students\s*:?/i, [/(?:^|\n)\s*(?:F\.?\s*)?Procedure\s*:?/im, /(?:^|\n)\s*Stages\s*\|\s*Step\s*\|\s*Details/im]),
    procedure: pick(/(?:^|\n)\s*(?:F\.?\s*)?Procedure\s*:?|(?:^|\n)\s*Stages\s*\|\s*Step\s*\|\s*Details/i, [/(?:^|\n)\s*(?:G\.?\s*)?Evaluation\s*:?/im, /(?:^|\n)\s*Homework\s*:?/im]),
    homework: pick(/(?:^|\n)\s*Homework\s*:?/i, [/(?:^|\n)\s*(?:G\.?\s*)?Evaluation\s*:?/im]),
    evaluation: pick(/(?:^|\n)\s*(?:G\.?\s*)?Evaluation\s*:?/i, []),
  };

  const hasStructuredSection = Object.values(sections).some((value) => value.trim().length > 0);
  if (hasStructuredSection) {
    return sections;
  }

  return {
    objectives: pickInline(/\bObjectives\b\s*:?/i, [/\bLanguage\s*content\b\s*:?/i, /\bTeaching\s*methodology\b\s*:?/i]),
    languageContent: pickInline(/\bLanguage\s*content\b\s*:?/i, [/\bTeaching\s*methodology\b\s*:?/i, /\bMaterials\s*for\s*teacher\b\s*:?/i]),
    methodology: pickInline(/\bTeaching\s*methodology\b\s*:?/i, [/\bMaterials\s*for\s*teacher\b\s*:?/i, /\bMaterials\s*for\s*students\b\s*:?/i]),
    teacherMaterials: pickInline(/\bMaterials\s*for\s*teacher\b\s*:?/i, [/\bMaterials\s*for\s*students\b\s*:?/i, /\bProcedure\b\s*:?/i, /\bStages\s*\|\s*Step\s*\|\s*Details\b/i]),
    studentMaterials: pickInline(/\bMaterials\s*for\s*students\b\s*:?/i, [/\bProcedure\b\s*:?/i, /\bStages\s*\|\s*Step\s*\|\s*Details\b/i]),
    procedure: pickInline(/\bProcedure\b\s*:?|\bStages\s*\|\s*Step\s*\|\s*Details\b/i, [/\bEvaluation\b\s*:?/i, /\bHomework\b\s*:?/i]),
    homework: pickInline(/\bHomework\b\s*:?/i, [/\bEvaluation\b\s*:?/i]),
    evaluation: pickInline(/\bEvaluation\b\s*:?/i, []),
  };
}

function activitiesToContentJson(activities: TeachingActivityDraft[], homework: string, notes: string): string {
  const cleanActivities = activities
    .filter((a) => Object.values(a).some((v) => v.trim()))
    .map((a) => {
      const obj: Record<string, string> = {};
      if (a.time.trim()) obj.time = a.time.trim();
      if (a.book.trim()) obj.book = a.book.trim();
      if (a.skills.trim()) obj.skills = a.skills.trim();
      if (a.classwork.trim()) obj.classwork = a.classwork.trim();
      if (a.requiredMaterials.trim()) obj.requiredMaterials = a.requiredMaterials.trim();
      if (a.homeworkRequiredMaterials.trim()) obj.homeworkRequiredMaterials = a.homeworkRequiredMaterials.trim();
      if (a.extra.trim()) obj.extra = a.extra.trim();
      return obj;
    });

  const result: Record<string, any> = {};
  if (cleanActivities.length) result.activities = cleanActivities;
  if (homework.trim()) result.homeworkNotes = homework.trim().split(/\r?\n/).filter(Boolean);
  if (notes.trim()) result.teacherNotes = notes.trim();
  return JSON.stringify(result);
}

function hasActivityContent(activity: TeachingActivityDraft): boolean {
  return Object.values(activity).some((v) => v.trim());
}

function mergeTeacherActivities(
  referenceActivities: TeachingActivityDraft[],
  actualActivities: TeachingActivityDraft[],
): TeachingActivityDraft[] {
  if (!referenceActivities.length && !actualActivities.length) {
    return [createEmptyTeachingActivity()];
  }

  if (!referenceActivities.length) {
    return actualActivities.length ? actualActivities : [createEmptyTeachingActivity()];
  }

  const mergedCount = Math.max(referenceActivities.length, actualActivities.length);

  return Array.from({ length: mergedCount }, (_, index) => {
    const reference = referenceActivities[index] ?? createEmptyTeachingActivity();
    const actual = actualActivities[index] ?? createEmptyTeachingActivity();

    return {
      time: actual.time || reference.time,
      book: actual.book || reference.book,
      skills: actual.skills || reference.skills,
      classwork: actual.classwork || reference.classwork,
      requiredMaterials:
        actual.requiredMaterials || reference.requiredMaterials,
      homeworkRequiredMaterials:
        actual.homeworkRequiredMaterials ||
        reference.homeworkRequiredMaterials,
      extra: actual.extra || reference.extra,
    };
  });
}

export default function TeacherAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = String(params?.locale ?? "");
  const requestedDate = normalizeDateParam(searchParams.get("date"));
  const requestedSessionId = String(searchParams.get("sessionId") ?? "").trim() || null;
  const requestedOpenLessonPlan = ["1", "true", "yes"].includes(
    String(searchParams.get("openLessonPlan") ?? "").trim().toLowerCase(),
  );
  const requestedTime = String(searchParams.get("time") ?? "").trim();
  const requestedClass = String(searchParams.get("class") ?? "").trim();
  const initialDate = requestedDate ?? getLocalIsoDate();
  const [sessions, setSessions] = useState<SessionApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(() => {
    return { from: initialDate, to: initialDate };
  });

  const [filters, setFilters] = useState<FilterField>({
    date: "",
    time: "",
    session: "",
    className: "",
    status: "",
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(requestedSessionId);
  const [enableDefaultSessionSelection, setEnableDefaultSessionSelection] = useState(false); // Changed to false

  const [attendanceList, setAttendanceList] = useState<StudentRow[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<{
    total: number;
    present: number;
    absent: number;
    makeup: number;
  } | null>(null);

  const [attendanceLoadingError, setAttendanceLoadingError] = useState<string | null>(null);
  const [hasAnyMarked, setHasAnyMarked] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | "ALL">("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<"student">("student");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const [sessionReports, setSessionReports] = useState<Record<string, SessionReportState>>({});
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<StudentRow | null>(null);
  const [noteModalError, setNoteModalError] = useState<string | null>(null);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isEnhancingNote, setIsEnhancingNote] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSavingAndSubmitting, setIsSavingAndSubmitting] = useState(false);
  const [expandedStatusRows, setExpandedStatusRows] = useState<Set<string>>(new Set());

  // Teaching report modal state
  const [teachingReportOpen, setTeachingReportOpen] = useState(false);
  const [teachingReportLoading, setTeachingReportLoading] = useState(false);
  const [teachingReportSubmitting, setTeachingReportSubmitting] = useState(false);
  const [teachingReportError, setTeachingReportError] = useState<string | null>(null);
  const [teachingReportDocument, setTeachingReportDocument] = useState<SessionLessonPlanDocument | null>(null);
  const [teachingLogRecord, setTeachingLogRecord] = useState<TeachingLog | null>(null);
  const [teachingReportTemplate, setTeachingReportTemplate] = useState<LessonPlanTemplate | null>(null);
  const [teachingReportSession, setTeachingReportSession] = useState<ClassLessonPlanSyllabusSession | null>(null);
  const [teachingReportSyllabusMetadata, setTeachingReportSyllabusMetadata] = useState<string | null>(null);
  const [teachingSyllabusDetail, setTeachingSyllabusDetail] = useState<SyllabusDetail | null>(null);
  const [, setTeachingSyllabusDetailLoading] = useState(false);
  const [teachingSyllabusDetailError, setTeachingSyllabusDetailError] = useState<string | null>(null);
  const [teachingActualContent, setTeachingActualContent] = useState("");
  const [teachingActualHomework, setTeachingActualHomework] = useState("");
  const [teachingTeacherNotes, setTeachingTeacherNotes] = useState("");
  const [teachingProgressStatus, setTeachingProgressStatus] = useState<TeachingProgressStatus>("completed");
  const [teachingActualTeachingType, setTeachingActualTeachingType] = useState<TeachingType>("normal");
  const [teachingActivityDrafts, setTeachingActivityDrafts] = useState<TeachingActivityDraft[]>([createEmptyTeachingActivity()]);
  const [teachingModalView, setTeachingModalView] = useState<"syllabus" | "lessonPlan" | "teachingLog">("teachingLog");
  const [teachingReferenceTab, setTeachingReferenceTab] = useState<"syllabus" | "planned" | "materials">("syllabus");
  const [teachingQuickReferenceView, setTeachingQuickReferenceView] = useState<"lessonPlan" | "syllabus">("lessonPlan");
  const [teachingSyllabusSummaryPopoverOpen, setTeachingSyllabusSummaryPopoverOpen] = useState(false);
  const [, setTeachingFullSyllabusOpen] = useState(false);
  const [teachingActivityErrors, setTeachingActivityErrors] = useState<Record<number, TeachingActivityErrors>>({});
  const [activeTeachingActivityIndex, setActiveTeachingActivityIndex] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const teachingActivityRowRefs = useRef<Record<number, HTMLElement | null>>({});
  const autoOpenedTeachingReportRef = useRef(false);
  const dedicatedLessonPlanEndpointUnavailableRef = useRef(false);
  const dedicatedLessonPlanEndpointWarnedRef = useRef(false);

  const recordsPerPage = 8;

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find((session: any) => String(session.id ?? session.sessionId ?? "") === selectedSessionId) ?? null;
  }, [sessions, selectedSessionId]);

  const selectedLesson = useMemo<LessonDetail | null>(() => {
    if (!selectedSession) return null;
    return mapSessionToLessonDetail(selectedSession);
  }, [selectedSession]);

  const teachingSyllabusId = resolveSyllabusId(
    teachingReportSession?.syllabusId,
    teachingReportDocument?.syllabusId,
    teachingReportTemplate?.syllabusId,
  );
  const shouldRenderAdminStyleSyllabus = teachingModalView === "syllabus";
  const teachingCurriculumLessonFilter = String(
    getExpectedLessonNumber(
      selectedLesson?.plannedLessonTitle,
      teachingReportTemplate?.title,
      teachingReportSession?.templateTitle,
      selectedLesson?.lesson,
      teachingReportTemplate?.sourceFileName,
    ) ?? "",
  ).trim();
  const shouldRenderSharedSyllabusBody = shouldRenderAdminStyleSyllabus && Boolean(teachingSyllabusDetail);
  const teachingModalTitle = shouldRenderAdminStyleSyllabus
    ? (
        teachingSyllabusDetail?.title ||
        teachingReportTemplate?.syllabusTitle ||
        teachingReportSession?.syllabusTitle ||
        teachingReportTemplate?.title ||
        "Syllabus"
      )
    : (selectedLesson?.plannedLessonTitle || teachingReportTemplate?.title || selectedLesson?.lesson || "Nội dung buổi học");

  const teachingModalEyebrow =
    teachingModalView === "syllabus"
      ? (shouldRenderAdminStyleSyllabus ? "Syllabus / Chi tiết chương trình" : "Syllabus / Khung buổi học")
      : teachingModalView === "lessonPlan"
        ? "Lesson Plan / Giáo án buổi học"
        : "Teaching Log / Nhật ký giảng dạy";

  const resolvedTeachingLogId = useMemo(() => {
    return (
      normalizeGuidValue(teachingLogRecord?.teachingLogId) ??
      normalizeGuidValue(teachingReportDocument?.teachingLogId) ??
      normalizeGuidValue(selectedLesson?.teachingLogId) ??
      null
    );
  }, [teachingLogRecord?.teachingLogId, teachingReportDocument?.teachingLogId, selectedLesson?.teachingLogId]);

  const resolvedTeachingLogStatus =
    teachingLogRecord?.teachingLogStatus ??
    teachingReportDocument?.teachingLogStatus ??
    selectedLesson?.teachingLogStatus ??
    null;

  const teachingLogReadOnly = useMemo(() => {
    return isTeachingLogReadOnlyStatus(resolvedTeachingLogStatus);
  }, [resolvedTeachingLogStatus]);

  const resolvedTeachingTemplateId = useMemo(() => {
    return (
      normalizeGuidValue(teachingLogRecord?.actualLessonPlanTemplateId) ??
      normalizeGuidValue(teachingReportDocument?.actualLessonPlanTemplateId) ??
      normalizeGuidValue(teachingReportDocument?.plannedLessonPlanTemplateId) ??
      normalizeGuidValue(teachingReportDocument?.lessonPlanTemplateId) ??
      normalizeGuidValue(teachingReportTemplate?.id) ??
      normalizeGuidValue(selectedLesson?.actualLessonPlanTemplateId) ??
      normalizeGuidValue(selectedLesson?.plannedLessonPlanTemplateId) ??
      normalizeGuidValue(selectedLesson?.lessonPlanTemplateId) ??
      null
    );
  }, [
    teachingLogRecord?.actualLessonPlanTemplateId,
    teachingReportDocument?.actualLessonPlanTemplateId,
    teachingReportDocument?.plannedLessonPlanTemplateId,
    teachingReportDocument?.lessonPlanTemplateId,
    teachingReportTemplate?.id,
    selectedLesson?.actualLessonPlanTemplateId,
    selectedLesson?.plannedLessonPlanTemplateId,
    selectedLesson?.lessonPlanTemplateId,
  ]);

  const teachingTemplateGuardMessage = useMemo(() => {
    if (!selectedSessionId || resolvedTeachingTemplateId) return null;

    return "Session này chưa có planned lesson template ở runtime. Vui lòng nhờ backend backfill plannedLessonPlanTemplateId hoặc lessonPlanTemplateId trước khi lưu teaching log.";
  }, [selectedSessionId, resolvedTeachingTemplateId]);

  const selectedTeachingProgressOption = useMemo(() => {
    return TEACHING_PROGRESS_OPTIONS.find((option) => option.value === teachingProgressStatus) ?? TEACHING_PROGRESS_OPTIONS[0];
  }, [teachingProgressStatus]);

  const activeTeachingActivity = useMemo(() => {
    return teachingActivityDrafts[activeTeachingActivityIndex] ?? createEmptyTeachingActivity();
  }, [teachingActivityDrafts, activeTeachingActivityIndex]);

  const activeTeachingActivityErrors = useMemo(() => {
    return teachingActivityErrors[activeTeachingActivityIndex] ?? {};
  }, [teachingActivityErrors, activeTeachingActivityIndex]);

  const isFirstTeachingActivity = activeTeachingActivityIndex <= 0;
  const isLastTeachingActivity = activeTeachingActivityIndex >= Math.max(0, teachingActivityDrafts.length - 1);

  const setActiveTeachingActivityField = useCallback((field: keyof TeachingActivityDraft, value: string) => {
    setTeachingActivityDrafts((prev) => {
      if (prev.length === 0) {
        return [{ ...createEmptyTeachingActivity(), [field]: value }];
      }

      const safeIndex = Math.max(0, Math.min(activeTeachingActivityIndex, prev.length - 1));
      const next = [...prev];
      next[safeIndex] = { ...next[safeIndex], [field]: value };
      return next;
    });
  }, [activeTeachingActivityIndex]);

  useEffect(() => {
    if (!teachingReportOpen || !shouldRenderAdminStyleSyllabus) return;

    if (!teachingSyllabusId) {
      setTeachingSyllabusDetail(null);
      setTeachingSyllabusDetailError("Buổi này chưa resolve được syllabusId để mở full syllabus như admin.");
      setTeachingSyllabusDetailLoading(false);
      return;
    }

    let cancelled = false;
    setTeachingSyllabusDetailLoading(true);
    setTeachingSyllabusDetailError(null);

    void loadAdminStyleSyllabusDetail(teachingSyllabusId)
      .then(({ detail, error }) => {
        if (cancelled) return;

        if (detail) {
          setTeachingSyllabusDetail(detail);
          setTeachingSyllabusDetailError(error);
          return;
        }

        if (error) {
          setTeachingSyllabusDetail(null);
          setTeachingSyllabusDetailError(error);
          return;
        }

        setTeachingSyllabusDetail(null);
        setTeachingSyllabusDetailError("Không tải được chi tiết syllabus đầy đủ cho buổi này.");
      })
      .catch((error) => {
        if (cancelled) return;
        setTeachingSyllabusDetail(null);

        const rawMessage = error instanceof Error ? error.message : "";
        setTeachingSyllabusDetailError(
          getTeachingSyllabusLoadError({ message: rawMessage }),
        );
      })
      .finally(() => {
        if (cancelled) return;
        setTeachingSyllabusDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldRenderAdminStyleSyllabus, teachingReportOpen, teachingSyllabusId]);

  const lessonPlanProcedureRows = useMemo(() => {
    const procedureSource =
      teachingReportTemplate?.procedure ||
      teachingReportSession?.plannedContent ||
      "";
    return extractProcedureRowsFromText(procedureSource);
  }, [teachingReportTemplate?.procedure, teachingReportSession?.plannedContent]);

  const lessonPlanMediaLinks = useMemo(() => {
    const merged = [
      ...extractMediaLinksFromText(teachingReportTemplate?.procedure || ""),
      ...extractMediaLinksFromText(teachingReportTemplate?.teacherMaterials || ""),
      ...extractMediaLinksFromText(teachingReportTemplate?.studentMaterials || ""),
      ...extractMediaLinksFromText(teachingReportSession?.plannedContent || ""),
    ];
    return Array.from(new Set(merged));
  }, [
    teachingReportTemplate?.procedure,
    teachingReportTemplate?.teacherMaterials,
    teachingReportTemplate?.studentMaterials,
    teachingReportSession?.plannedContent,
  ]);

  const lessonPlanFallbackSections = useMemo(() => {
    const source =
      teachingReportSession?.plannedContent ||
      "";
    return extractLessonPlanFallbackSections(source);
  }, [teachingReportSession?.plannedContent]);

  const syllabusSourceHref = useMemo(() => {
    return buildFileUrl(teachingSyllabusDetail?.attachmentUrl);
  }, [teachingSyllabusDetail?.attachmentUrl]);

  const syllabusSourceLabel = useMemo(() => {
    return getSourceDocumentLabel(
      teachingSyllabusDetail?.sourceFileName,
      teachingSyllabusDetail?.attachmentUrl,
      "Mở/Tải source syllabus",
    );
  }, [teachingSyllabusDetail?.attachmentUrl, teachingSyllabusDetail?.sourceFileName]);

  const renderTeachingSourceLink = useCallback((
    href: string,
    label: string,
    emptyMessage: string,
    tone: "blue" | "violet",
  ) => {
    if (href) {
      const toneClasses = tone === "blue"
        ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
        : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100";

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          className={`inline-flex max-w-[320px] items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${toneClasses}`}
        >
          <Download size={13} />
          <span className="truncate">{label}</span>
        </a>
      );
    }

    return (
      <div className="max-w-[320px] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <div className="font-semibold uppercase tracking-wide">Source file</div>
        <div className="mt-1 truncate font-medium">{label}</div>
        <div className="mt-1 text-[11px]">{emptyMessage}</div>
      </div>
    );
  }, []);

  const displayLessonPlanTemplate = useMemo<LessonPlanTemplate | null>(() => {
    if (teachingReportTemplate) return teachingReportTemplate;

    const fallbackSource =
      teachingReportSession?.plannedContent ||
      "";
    if (!fallbackSource.trim()) return null;

    const fallbackProcedureRows = extractProcedureRowsFromText(fallbackSource);
    const fallbackMediaLinks = extractMediaLinksFromText(fallbackSource);

    const fallbackProcedure =
      lessonPlanFallbackSections.procedure ||
      (fallbackProcedureRows.length ? fallbackSource : "");

    const safeSessionIndex =
      selectedLesson?.sessionIndexInModule ??
      teachingReportSession?.sessionIndexInModule ??
      null;

    return {
      id: `fallback-${selectedSessionId || "session"}`,
      title:
        selectedLesson?.plannedLessonTitle ||
        teachingReportSession?.templateTitle ||
        selectedLesson?.lesson ||
        "Nội dung buổi học",
      programName: selectedLesson?.course || undefined,
      moduleName: selectedLesson?.moduleName || teachingReportSession?.moduleName || undefined,
      lessonPlanUnitName: selectedLesson?.moduleName || teachingReportSession?.moduleName || undefined,
      sessionIndex: safeSessionIndex ?? 0,
      sessionOrder: safeSessionIndex,
      objectives: lessonPlanFallbackSections.objectives || null,
      languageContent: lessonPlanFallbackSections.languageContent || null,
      teachingMethodology: lessonPlanFallbackSections.methodology || null,
      teacherMaterials: lessonPlanFallbackSections.teacherMaterials || null,
      studentMaterials: lessonPlanFallbackSections.studentMaterials || null,
      procedure: fallbackProcedure || null,
      homework: lessonPlanFallbackSections.homework || null,
      evaluation: lessonPlanFallbackSections.evaluation || null,
      syllabusContent: fallbackSource,
      createdByName: selectedLesson?.teacher || undefined,
      attachment: fallbackMediaLinks[0] || null,
    };
  }, [
    teachingReportTemplate,
    teachingReportSession?.plannedContent,
    teachingReportSession?.templateTitle,
    teachingReportSession?.moduleName,
    teachingReportSession?.sessionIndexInModule,
    lessonPlanFallbackSections,
    selectedLesson?.plannedLessonTitle,
    selectedLesson?.lesson,
    selectedLesson?.course,
    selectedLesson?.moduleName,
    selectedLesson?.sessionIndexInModule,
    selectedLesson?.teacher,
    selectedSessionId,
  ]);

  const lessonPlanSourceHref = useMemo(() => {
    const candidates = [
      displayLessonPlanTemplate?.attachment,
      ...lessonPlanMediaLinks,
    ];

    for (const candidate of candidates) {
      const resolved = buildFileUrl(candidate);
      if (resolved) return resolved;
    }

    return "";
  }, [displayLessonPlanTemplate?.attachment, lessonPlanMediaLinks]);

  const lessonPlanSourceLabel = useMemo(() => {
    return getSourceDocumentLabel(
      displayLessonPlanTemplate?.sourceFileName,
      displayLessonPlanTemplate?.attachment || lessonPlanMediaLinks[0] || null,
      "Mở/Tải source giáo án",
    );
  }, [displayLessonPlanTemplate?.attachment, displayLessonPlanTemplate?.sourceFileName, lessonPlanMediaLinks]);

  const syllabusReferenceActivities = useMemo(() => {
    return extractTeachingActivitiesFromContent(teachingReportSession?.templateSyllabusContent);
  }, [teachingReportSession?.templateSyllabusContent]);

  const lessonPlanReferenceActivities = useMemo(() => {
    const normalizedMaterials = [
      displayLessonPlanTemplate?.teacherMaterials,
      displayLessonPlanTemplate?.studentMaterials,
    ]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join("\n");

    if (lessonPlanProcedureRows.length > 0) {
      return lessonPlanProcedureRows.map((row, index) => {
        const details = [row.step, row.details].filter(Boolean).join("\n").trim();
        const isHomeworkStep = /homework/i.test(`${row.step} ${row.details}`);

        return {
          time: row.stage ? `Bước ${row.stage}` : `Bước ${index + 1}`,
          book: "",
          skills: String(displayLessonPlanTemplate?.languageContent ?? "").trim(),
          classwork: details,
          requiredMaterials: normalizedMaterials,
          homeworkRequiredMaterials: isHomeworkStep
            ? row.details.trim()
            : String(displayLessonPlanTemplate?.homework ?? "").trim(),
          extra: "",
        } satisfies TeachingActivityDraft;
      });
    }

    const summaryBlocks = [
      displayLessonPlanTemplate?.objectives
        ? `Objectives:\n${String(displayLessonPlanTemplate.objectives).trim()}`
        : "",
      displayLessonPlanTemplate?.languageContent
        ? `Language content:\n${String(displayLessonPlanTemplate.languageContent).trim()}`
        : "",
      displayLessonPlanTemplate?.teachingMethodology
        ? `Methodology:\n${String(displayLessonPlanTemplate.teachingMethodology).trim()}`
        : "",
    ].filter(Boolean);

    if (!summaryBlocks.length && !normalizedMaterials && !String(displayLessonPlanTemplate?.homework ?? "").trim()) {
      return [] as TeachingActivityDraft[];
    }

    return [
      {
        time: "",
        book: "",
        skills: String(displayLessonPlanTemplate?.languageContent ?? "").trim(),
        classwork: summaryBlocks.join("\n\n"),
        requiredMaterials: normalizedMaterials,
        homeworkRequiredMaterials: String(displayLessonPlanTemplate?.homework ?? "").trim(),
        extra: "",
      },
    ];
  }, [displayLessonPlanTemplate, lessonPlanProcedureRows]);

  useEffect(() => {
    if (teachingActivityDrafts.length === 0) {
      setActiveTeachingActivityIndex(0);
      return;
    }

    if (activeTeachingActivityIndex >= teachingActivityDrafts.length) {
      setActiveTeachingActivityIndex(teachingActivityDrafts.length - 1);
    }
  }, [activeTeachingActivityIndex, teachingActivityDrafts.length]);

  const focusTeachingActivity = useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(index, teachingActivityDrafts.length - 1));
    setActiveTeachingActivityIndex(safeIndex);
    const row = teachingActivityRowRefs.current[safeIndex];
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [teachingActivityDrafts.length]);

  const mergeReferenceIntoTeachingActivity = useCallback((
    targetIndex: number,
    source: TeachingActivityDraft | undefined,
    emptyTitle: string,
    emptyDescription: string,
  ) => {
    if (!source) {
      toast({ title: emptyTitle, description: emptyDescription, variant: "warning" });
      return;
    }

    const safeIndex = Math.max(0, Math.min(targetIndex, Math.max(teachingActivityDrafts.length - 1, 0)));

    setTeachingActivityDrafts((prev) => {
      const next = [...prev];
      const current = next[safeIndex] ?? createEmptyTeachingActivity();
      next[safeIndex] = {
        ...current,
        time: source.time || current.time,
        book: source.book || current.book,
        skills: source.skills || current.skills,
        classwork: source.classwork || current.classwork,
        requiredMaterials: source.requiredMaterials || current.requiredMaterials,
        homeworkRequiredMaterials: source.homeworkRequiredMaterials || current.homeworkRequiredMaterials,
        extra: source.extra || current.extra,
      };
      return next;
    });

    setTeachingActivityErrors((prev) => {
      if (!prev[safeIndex]) return prev;
      const next = { ...prev };
      delete next[safeIndex];
      return next;
    });

    requestAnimationFrame(() => focusTeachingActivity(safeIndex));
  }, [focusTeachingActivity, teachingActivityDrafts.length]);

  const hasTeachingReferenceContent = Boolean(
    teachingReportSession?.templateSyllabusContent ||
    teachingReportSession?.plannedContent ||
    teachingReportSyllabusMetadata,
  );

  const teachingSummaryItems = [
    { label: "Course / Chương trình", value: teachingReportTemplate?.programName || teachingReportSession?.moduleName || selectedLesson?.course || null },
    { label: "Unit / Module", value: teachingReportTemplate?.lessonPlanUnitName || teachingReportTemplate?.moduleName || teachingReportSession?.moduleName || selectedLesson?.moduleName || null },
    { label: "Lesson / Buổi", value: teachingReportTemplate?.sessionOrder != null ? `Lesson ${teachingReportTemplate.sessionOrder}` : selectedLesson?.sessionIndexInModule != null ? `Lesson ${selectedLesson.sessionIndexInModule}` : null },
    { label: "Topic / Chủ điểm", value: selectedLesson?.plannedLessonTitle || teachingReportTemplate?.title || teachingReportSession?.templateTitle || selectedLesson?.lesson || null },
    { label: "Date / Ngày", value: selectedLesson?.date || null },
    { label: "Time / Giờ", value: selectedLesson?.time || null },
    { label: "Teacher / Giáo viên", value: selectedLesson?.teacher || teachingReportSession?.actualTeacherName || teachingReportSession?.plannedTeacherName || null },
    { label: "Room / Phòng", value: selectedLesson?.room || null },
  ];

  const renderTeachingModalViewSwitch = () => {
    const viewButtons = [
      {
        key: "syllabus",
        label: "Syllabus",
        icon: BookOpen,
        activeClassName: "border-blue-200 bg-blue-100 text-blue-700",
        idleClassName: "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
      },
      {
        key: "lessonPlan",
        label: "Giáo án",
        icon: GraduationCap,
        activeClassName: "border-violet-200 bg-violet-100 text-violet-700",
        idleClassName: "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
      },
      {
        key: "teachingLog",
        label: "Teaching log",
        icon: ClipboardPen,
        activeClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
        idleClassName: "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
      },
    ] as const;

    return (
      <div className="flex flex-wrap items-center gap-2">
        {viewButtons.map(({ key, label, icon: Icon, activeClassName, idleClassName }) => {
          const isActive = teachingModalView === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTeachingModalView(key)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${isActive ? activeClassName : idleClassName}`}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderTeachingLessonPlanContent = () => {
    if (displayLessonPlanTemplate) {
      return (
        <LessonPlanTemplateDocument
          template={displayLessonPlanTemplate}
          procedureRows={lessonPlanProcedureRows}
          mediaLinks={lessonPlanMediaLinks}
        />
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800">
          Chưa tải được lesson plan template đầy đủ từ template API.
          {teachingReportSession?.plannedContent
            ? " Đang hiển thị fallback từ plannedContent của buổi học (file lesson plan unit)."
            : " Buổi này chưa có file lesson plan unit khả dụng. Vui lòng kiểm tra mapping lesson plan theo unit."}
        </div>

        {lessonPlanFallbackSections.objectives ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Objectives / Mục tiêu</div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{lessonPlanFallbackSections.objectives}</div>
          </div>
        ) : null}

        {lessonPlanFallbackSections.languageContent ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Language Content / Nội dung ngôn ngữ</div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{lessonPlanFallbackSections.languageContent}</div>
          </div>
        ) : null}

        {lessonPlanFallbackSections.methodology ? (
          <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">Teaching Methodology / Phương pháp</div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{lessonPlanFallbackSections.methodology}</div>
          </div>
        ) : null}

        {(lessonPlanFallbackSections.teacherMaterials || lessonPlanFallbackSections.studentMaterials) ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Materials / Học liệu</div>
            {lessonPlanFallbackSections.teacherMaterials ? (
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap"><span className="font-semibold text-amber-700">Teacher: </span>{lessonPlanFallbackSections.teacherMaterials}</div>
            ) : null}
            {lessonPlanFallbackSections.studentMaterials ? (
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap"><span className="font-semibold text-amber-700">Students: </span>{lessonPlanFallbackSections.studentMaterials}</div>
            ) : null}
          </div>
        ) : null}

        {(!lessonPlanFallbackSections.objectives &&
          !lessonPlanFallbackSections.languageContent &&
          !lessonPlanFallbackSections.methodology &&
          !lessonPlanFallbackSections.teacherMaterials &&
          !lessonPlanFallbackSections.studentMaterials &&
          teachingReportSession?.plannedContent) ? (
          <div className="max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-600 whitespace-pre-wrap">
            {teachingReportSession?.plannedContent}
          </div>
        ) : null}
      </div>
    );
  };

  const renderTeachingReferenceTabs = () => {
    if (!hasTeachingReferenceContent) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
          <span>Dòng tham chiếu đang đối chiếu với activity hiện tại.</span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
            Activity #{activeTeachingActivityIndex + 1}
          </span>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Teacher nên xem nhanh theo thứ tự: <strong>Chủ điểm</strong> &rarr; <strong>Hoạt động</strong> &rarr; <strong>Học liệu</strong> &rarr; <strong>BTVN</strong>.
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTeachingReferenceTab("syllabus")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              teachingReferenceTab === "syllabus"
                ? "border-blue-200 bg-blue-100 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Khung syllabus
          </button>
          <button
            type="button"
            onClick={() => setTeachingReferenceTab("planned")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              teachingReferenceTab === "planned"
                ? "border-amber-200 bg-amber-100 text-amber-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Giáo án dự kiến
          </button>
          <button
            type="button"
            onClick={() => setTeachingReferenceTab("materials")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              teachingReferenceTab === "materials"
                ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Học liệu
          </button>
        </div>

        {teachingReferenceTab === "syllabus" && (() => {
          const syllabusActivities = syllabusReferenceActivities;
          if (!syllabusActivities.length && !teachingReportSession?.templateSyllabusContent) {
            return (
              <div className="rounded-lg border border-dashed border-blue-200 bg-white p-3 text-xs leading-5 text-gray-500">
                Buổi này chưa có khung syllabus chi tiết trong dữ liệu lớp. Bạn có thể xem phần <strong>Giáo án dự kiến</strong> hoặc đối chiếu metadata tổng quan ở panel bên phải.
              </div>
            );
          }
          return (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Khung syllabus chuẩn</div>
              {syllabusActivities.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-blue-200">
                  <table className="min-w-[800px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-blue-50 text-gray-700">
                        <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold">#</th>
                        <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold">Thời lượng</th>
                        <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold">Trang sách</th>
                        <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold">Kỹ năng</th>
                        <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold">Hoạt động</th>
                        <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold">Học liệu</th>
                        <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold">BTVN</th>
                        <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syllabusActivities.map((a, i) => (
                        <tr
                          key={i}
                          onClick={() => focusTeachingActivity(i)}
                          className={`align-top cursor-pointer transition-colors ${
                            activeTeachingActivityIndex === i ? "bg-blue-50/80" : "bg-white hover:bg-blue-50/40"
                          }`}
                        >
                          <td className="border border-blue-200 px-2 py-1.5 text-gray-500">{i + 1}</td>
                          <td className="border border-blue-200 px-2 py-1.5 whitespace-pre-wrap">{a.time || "-"}</td>
                          <td className="border border-blue-200 px-2 py-1.5 whitespace-pre-wrap">{a.book || "-"}</td>
                          <td className="border border-blue-200 px-2 py-1.5 whitespace-pre-wrap">{a.skills || "-"}</td>
                          <td className="border border-blue-200 px-2 py-1.5 whitespace-pre-wrap">{a.classwork || "-"}</td>
                          <td className="border border-blue-200 px-2 py-1.5 whitespace-pre-wrap">{a.requiredMaterials || "-"}</td>
                          <td className="border border-blue-200 px-2 py-1.5 whitespace-pre-wrap">{a.homeworkRequiredMaterials || "-"}</td>
                          <td className="border border-blue-200 px-2 py-1.5 whitespace-pre-wrap">{a.extra || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <LessonPlanTemplateDocument
                  template={{
                    id:
                      teachingReportTemplate?.id ??
                      teachingReportSession?.templateId ??
                      teachingReportSession?.sessionId ??
                      "syllabus-reference",
                    title:
                      teachingReportTemplate?.title ??
                      teachingReportSession?.templateTitle ??
                      selectedLesson?.plannedLessonTitle ??
                      "Syllabus chuẩn",
                    sessionIndex:
                      teachingReportTemplate?.sessionIndex ??
                      teachingReportSession?.sessionIndexInModule ??
                      teachingReportSession?.sessionIndex ??
                      selectedLesson?.sessionIndexInModule ??
                      0,
                    sessionOrder:
                      teachingReportTemplate?.sessionOrder ??
                      teachingReportSession?.sessionIndexInModule ??
                      teachingReportSession?.sessionIndex ??
                      selectedLesson?.sessionIndexInModule ??
                      null,
                    syllabusId: teachingReportSession?.syllabusId ?? teachingReportTemplate?.syllabusId ?? null,
                    syllabusCode: teachingReportSession?.syllabusCode ?? teachingReportTemplate?.syllabusCode ?? null,
                    syllabusVersion: teachingReportSession?.syllabusVersion ?? teachingReportTemplate?.syllabusVersion ?? null,
                    syllabusTitle: teachingReportSession?.syllabusTitle ?? teachingReportTemplate?.syllabusTitle ?? null,
                    moduleId: teachingReportSession?.moduleId ?? teachingReportTemplate?.moduleId ?? null,
                    moduleCode: teachingReportSession?.moduleCode ?? teachingReportTemplate?.moduleCode ?? null,
                    moduleName: teachingReportSession?.moduleName ?? teachingReportTemplate?.moduleName ?? null,
                    syllabusContent: teachingReportSession?.templateSyllabusContent ?? null,
                  }}
                />
              )}
            </div>
          );
        })()}

        {teachingReferenceTab === "planned" && (() => {
          const plannedActivities = extractTeachingActivitiesFromContent(teachingReportSession?.plannedContent);
          if (!plannedActivities.length && !teachingReportSession?.plannedContent) return null;
          return (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Giáo án dự kiến</div>
              {plannedActivities.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-amber-200">
                  <table className="min-w-[800px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-amber-50 text-gray-700">
                        <th className="border border-amber-200 px-2 py-1.5 text-left font-semibold">#</th>
                        <th className="border border-amber-200 px-2 py-1.5 text-left font-semibold">Thời lượng</th>
                        <th className="border border-amber-200 px-2 py-1.5 text-left font-semibold">Trang sách</th>
                        <th className="border border-amber-200 px-2 py-1.5 text-left font-semibold">Kỹ năng</th>
                        <th className="border border-amber-200 px-2 py-1.5 text-left font-semibold">Hoạt động</th>
                        <th className="border border-amber-200 px-2 py-1.5 text-left font-semibold">Học liệu</th>
                        <th className="border border-amber-200 px-2 py-1.5 text-left font-semibold">BTVN</th>
                        <th className="border border-amber-200 px-2 py-1.5 text-left font-semibold">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plannedActivities.map((a, i) => (
                        <tr
                          key={i}
                          onClick={() => focusTeachingActivity(i)}
                          className={`align-top cursor-pointer transition-colors ${
                            activeTeachingActivityIndex === i ? "bg-amber-50/90" : "bg-white hover:bg-amber-50/40"
                          }`}
                        >
                          <td className="border border-amber-200 px-2 py-1.5 text-gray-500">{i + 1}</td>
                          <td className="border border-amber-200 px-2 py-1.5 whitespace-pre-wrap">{a.time || "-"}</td>
                          <td className="border border-amber-200 px-2 py-1.5 whitespace-pre-wrap">{a.book || "-"}</td>
                          <td className="border border-amber-200 px-2 py-1.5 whitespace-pre-wrap">{a.skills || "-"}</td>
                          <td className="border border-amber-200 px-2 py-1.5 whitespace-pre-wrap">{a.classwork || "-"}</td>
                          <td className="border border-amber-200 px-2 py-1.5 whitespace-pre-wrap">{a.requiredMaterials || "-"}</td>
                          <td className="border border-amber-200 px-2 py-1.5 whitespace-pre-wrap">{a.homeworkRequiredMaterials || "-"}</td>
                          <td className="border border-amber-200 px-2 py-1.5 whitespace-pre-wrap">{a.extra || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="max-h-64 overflow-auto rounded-lg border border-amber-100 bg-white p-3 text-xs leading-5 text-gray-600 whitespace-pre-wrap">
                  {teachingReportSession?.plannedContent}
                </div>
              )}
            </div>
          );
        })()}

        {teachingReferenceTab === "materials" && (() => {
          const commonSyllabusMaterials = extractTeachingMaterialReferences(teachingReportSyllabusMetadata);
          const syllabusMaterials = extractTeachingMaterialReferences(teachingReportSession?.templateSyllabusContent);
          const plannedMaterials = extractTeachingMaterialReferences(teachingReportSession?.plannedContent);
          const hasAnyMaterials = commonSyllabusMaterials.length > 0 || syllabusMaterials.length > 0 || plannedMaterials.length > 0;

          return (
            <div className="space-y-4">
              {commonSyllabusMaterials.length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">Tài liệu chung từ syllabus</div>
                  <div className="space-y-2 rounded-lg border border-indigo-200 bg-white p-3">
                    {commonSyllabusMaterials.map((item, index) => (
                      <div key={`common-material-${index}`} className="rounded-md border border-indigo-100 bg-indigo-50/30 p-2.5">
                        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{item.title}</div>
                        {renderTeachingMaterialContent(item.content)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {syllabusMaterials.length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Tài liệu từ syllabus</div>
                  <div className="space-y-2 rounded-lg border border-blue-200 bg-white p-3">
                    {syllabusMaterials.map((item, index) => (
                      <div key={`syllabus-material-${index}`} className="rounded-md border border-blue-100 bg-blue-50/30 p-2.5">
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">{item.title}</div>
                        {renderTeachingMaterialContent(item.content)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plannedMaterials.length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Tài liệu từ giáo án dự kiến</div>
                  <div className="space-y-2 rounded-lg border border-amber-200 bg-white p-3">
                    {plannedMaterials.map((item, index) => (
                      <div key={`planned-material-${index}`} className="rounded-md border border-amber-100 bg-amber-50/30 p-2.5">
                        <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">{item.title}</div>
                        {renderTeachingMaterialContent(item.content)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!hasAnyMaterials && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-xs text-gray-500">
                  Chưa có tài liệu lesson plan cho buổi này.
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  const handleCopyFromSyllabusRow = useCallback((index: number) => {
    mergeReferenceIntoTeachingActivity(
      index,
      syllabusReferenceActivities[index],
      "Không có dòng syllabus tương ứng",
      "Dòng này chưa có dữ liệu trong khung syllabus.",
    );
  }, [mergeReferenceIntoTeachingActivity, syllabusReferenceActivities]);

  const handleInsertFromLessonPlanRow = useCallback((sourceIndex: number, targetIndex = activeTeachingActivityIndex) => {
    mergeReferenceIntoTeachingActivity(
      targetIndex,
      lessonPlanReferenceActivities[sourceIndex],
      "Không có dòng lesson plan tương ứng",
      "Giáo án chưa parse được dòng procedure phù hợp để chèn vào activity hiện tại.",
    );
  }, [activeTeachingActivityIndex, lessonPlanReferenceActivities, mergeReferenceIntoTeachingActivity]);

  const handleSessionSelect = useCallback((sessionId: string) => {
    setEnableDefaultSessionSelection(false);
    setSelectedSessionId(sessionId);
    setAttendanceList([]);
    setAttendanceSummary(null);
    setAttendanceLoadingError(null);
    setExpandedStatusRows(new Set());
    setCurrentPage(1);
  }, []);

  const fetchSessionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fromDate = dateRange.from ? new Date(`${dateRange.from}T00:00:00`) : new Date();
      const toDate = dateRange.to ? new Date(`${dateRange.to}T00:00:00`) : fromDate;

      const range = {
        from: toISODateStart(fromDate),
        to: toISODateEnd(toDate),
      };

      const result = await fetchSessions({
        from: range.from,
        to: range.to,
        pageNumber: 1,
        pageSize: 100,
      });

      setSessions(result.sessions ?? []);
    } catch (err: any) {
      console.error("Fetch sessions error:", err);
      setError(err.message || "Không thể tải danh sách buổi học.");
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    if (!requestedDate) return;

    setDateRange((prev) => {
      if (prev.from === requestedDate && prev.to === requestedDate) {
        return prev;
      }
      return { from: requestedDate, to: requestedDate };
    });
  }, [requestedDate]);

  // FIXED: Only auto-select when there's a sessionId from URL (click from schedule)
  useEffect(() => {
    // Only auto-select if there's a requestedSessionId from URL (when clicking from schedule)
    if (requestedSessionId && selectedSessionId !== requestedSessionId) {
      handleSessionSelect(requestedSessionId);
    }
  }, [requestedSessionId, selectedSessionId, handleSessionSelect]);

  const isSessionToday = useMemo(() => {
    const sessionDate = getSessionIsoDate(selectedSession ?? null);
    if (!sessionDate) return false;
    return sessionDate === getLocalIsoDate();
  }, [selectedSession]);

  const sessionCards = useMemo(() => {
    return sessions.map((session, index) => {
      const lesson = mapSessionToLessonDetail(session);
      return {
        id: lesson.id,
        sessionDate: getSessionIsoDate(session),
        className: lesson.lesson,
        classCode: lesson.course,
        room: lesson.room,
        teacher: lesson.teacher,
        date: lesson.date,
        time: lesson.time,
        status: lesson.status,
        participationType: lesson.participationType,
        branch: lesson.branch ?? null,
        students: lesson.students,
        color: session.color ?? SESSION_COLOR_POOL[index % SESSION_COLOR_POOL.length],
        raw: session,
      } satisfies SessionCard;
    });
  }, [sessions]);

  const filterSessions = useMemo(() => {
    const filterValue = (value: string) => value.trim().toLowerCase();
    const dateFilter = filterValue(filters.date);
    const timeFilter = filterValue(filters.time);
    const sessionFilter = filterValue(filters.session);
    const classFilter = filterValue(filters.className);
    const statusFilter = filterValue(filters.status);

    return sessionCards.filter((card) => {
      if (dateFilter && !card.date.toLowerCase().includes(dateFilter)) return false;
      if (timeFilter && !card.time.toLowerCase().includes(timeFilter)) return false;
      if (sessionFilter && !card.className.toLowerCase().includes(sessionFilter)) return false;
      if (
        classFilter &&
        !card.classCode.toLowerCase().includes(classFilter) &&
        !card.className.toLowerCase().includes(classFilter)
      ) {
        return false;
      }
      if (statusFilter && !String(card.status ?? "").toLowerCase().includes(statusFilter)) return false;
      return true;
    });
  }, [sessionCards, filters]);

  const handleFilterChange = (field: keyof FilterField, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      date: "",
      time: "",
      session: "",
      className: "",
      status: "",
    });
  };

  const handleChooseOtherSession = useCallback(() => {
    setEnableDefaultSessionSelection(false);
    setSelectedSessionId(null);
    setAttendanceList([]);
    setAttendanceSummary(null);
    setAttendanceLoadingError(null);
    setExpandedStatusRows(new Set());
    setCurrentPage(1);

    const nextParams = new URLSearchParams();
    if (dateRange.from) {
      nextParams.set("date", dateRange.from);
    }

    const query = nextParams.toString();
    router.replace(`/${locale}/portal/teacher/attendance${query ? `?${query}` : ""}`);
  }, [dateRange.from, locale, router]);

  const handleBackToSchedule = useCallback(() => {
    router.push(`/${locale}/portal/teacher/schedule`);
  }, [locale, router]);

  const refreshAttendance = useCallback(async () => {
    if (!selectedSessionId) return;

    setLoadingAttendance(true);
    setAttendanceLoadingError(null);

    try {
      const loadSessionReports = async () => {
        const collected: SessionReportItem[] = [];

        for (let pageNumber = 1; pageNumber <= SESSION_REPORT_MAX_PAGES; pageNumber += 1) {
          const pageItems = await fetchSessionReports({
            sessionId: selectedSessionId,
            pageNumber,
            pageSize: SESSION_REPORT_PAGE_SIZE,
          });

          if (!pageItems.length) break;

          collected.push(...pageItems);

          if (pageItems.length < SESSION_REPORT_PAGE_SIZE) break;
        }

        return collected;
      };

      const [result, reports] = await Promise.all([
        fetchAttendance(selectedSessionId),
        loadSessionReports().catch((err) => {
          console.warn("Fetch session reports warning:", err);
          return [] as SessionReportItem[];
        }),
      ]);
      const reportTimestampByStudentId: Record<string, number> = {};
      const reportsByStudentId = reports.reduce<Record<string, SessionReportState>>((acc, report) => {
        const reportSessionId = String(report?.sessionId ?? "").trim();
        if (reportSessionId && reportSessionId !== selectedSessionId) {
          return acc;
        }
        const reportStudentId = String(report?.studentProfileId ?? "").trim();
        if (!reportStudentId) {
          return acc;
        }
        const previousReport = acc[reportStudentId];
        const previousTs = reportTimestampByStudentId[reportStudentId] ?? -1;
        const currentTs = getSessionReportTimestamp(report);

        if (previousReport && previousTs > currentTs) {
          return acc;
        }
        acc[reportStudentId] = {
          reportId: String(report?.id ?? "").trim(),
          feedback: String(report?.feedback ?? "").trim(),
          status: String(report?.status ?? "").trim() || undefined,
        };
        reportTimestampByStudentId[reportStudentId] = currentTs;
        return acc;
      }, {});
      const nextSessionReports: Record<string, SessionReportState> = {};
      const students: StudentRow[] = (result.students ?? []).map((s: any, idx: number) => {
        const rawStudentId = String(s.studentProfileId ?? s.studentId ?? s.userId ?? s.id ?? "");
        const normalizedStudentId = rawStudentId.trim();
        const safeStudentId =
          normalizedStudentId &&
            normalizedStudentId !== ZERO_GUID &&
            GUID_REGEX.test(normalizedStudentId)
            ? normalizedStudentId
            : "";

        const email = String(s.email ?? s.mail ?? "").trim();
        const phone = String(s.phone ?? s.phoneNumber ?? "").trim();

        const rowKey =
          safeStudentId ||
          (email ? `email:${email.toLowerCase()}` : phone ? `phone:${phone}` : `row:${idx}`);

        const name = String(s.name ?? s.fullName ?? s.studentName ?? "").trim();

        const uniqueIdForUI = safeStudentId || rowKey;

        const persistedSessionReport = pickSessionReportFromStudent(s, selectedSessionId);
        const reportFromList = safeStudentId ? reportsByStudentId[safeStudentId] : undefined;

        const note = (reportFromList?.feedback || persistedSessionReport.feedback || "").trim();
        const reportId = String(reportFromList?.reportId || persistedSessionReport.reportId || "").trim();
        const reportStatus = String(reportFromList?.status || persistedSessionReport.status || "").trim();

        if (note || reportId) {
          const reportKey = buildSessionReportKey(selectedSessionId, safeStudentId, rowKey);
          nextSessionReports[reportKey] = {
            reportId,
            feedback: note,
            status: reportStatus || undefined,
          };
        }
        return {
          ...s,
          id: uniqueIdForUI,
          rowKey,
          studentId: safeStudentId || uniqueIdForUI,
          studentProfileId: safeStudentId || undefined,
          status: normalizeAttendanceStatus(s.status, s.hasMakeupCredit),
          name,
          email,
          phone,
          note,
          studentCode: String(s.studentCode ?? s.code ?? "").trim() || undefined,
        } as StudentRow;
      });

      setAttendanceList(students);
      setSessionReports(nextSessionReports);

      setHasAnyMarked(Boolean(result.hasAnyMarked));

      if (result.attendanceSummary) {
        const total = result.attendanceSummary.totalStudents ?? students.length;
        const present = result.attendanceSummary.presentCount ?? 0;
        const absent = result.attendanceSummary.absentCount ?? 0;
        const makeup = result.attendanceSummary.makeupCount ?? 0;
        setAttendanceSummary({ total, present, absent, makeup });
      } else {
        const total = students.length;
        const present = students.filter((s) => s.status === "present").length;
        const absent = students.filter((s) => s.status === "absent").length;
        setAttendanceSummary({ total, present, absent, makeup: 0 });
      }
    } catch (err: any) {
      console.error("Fetch attendance error:", err);
      setAttendanceLoadingError(err.message || "Không thể tải danh sách điểm danh.");
    } finally {
      setLoadingAttendance(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) return;
    refreshAttendance();
  }, [refreshAttendance, selectedSessionId]);

  const handleSort = (column: "student") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleStatusChange = (rowKey: string, status: AttendanceStatus) => {
    setAttendanceList((prev) => prev.map((r) => (r.rowKey === rowKey ? { ...r, status } : r)));
  };

  const handleExpandStatusRow = (rowKey: string) => {
    setExpandedStatusRows((prev) => {
      const next = new Set(prev);
      next.add(rowKey);
      return next;
    });
  };

  const handleOpenNoteModal = (record: StudentRow) => {
    setSelectedStudentForNote(record);
    setNoteModalError(null);
    setNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setSelectedStudentForNote(null);
    setNoteModalError(null);
  };

  const handleSubmitStudentNote = async (feedback: string) => {
    if (!selectedSessionId || !selectedStudentForNote) return;

    const normalizedFeedback = feedback.trim();
    const reportKey = buildSessionReportKey(
      selectedSessionId,
      selectedStudentForNote.studentId,
      selectedStudentForNote.rowKey,
    );
    const existingReport = sessionReports[reportKey];
    const existingReportId = String(existingReport?.reportId ?? "").trim();
    const studentProfileId = String(selectedStudentForNote.studentId ?? "").trim();
    const canSyncWithApi = GUID_REGEX.test(studentProfileId);

    try {
      setIsSubmittingNote(true);
      setNoteModalError(null);

      let reportId = existingReportId;
      let reportStatus = existingReport?.status;
      if (canSyncWithApi) {
        const report = existingReportId
          ? await updateSessionReport(existingReportId, { feedback: normalizedFeedback })
          : await createSessionReport({
            sessionId: selectedSessionId,
            studentProfileId,
            reportDate: todayDateOnly(),
            feedback: normalizedFeedback,
          });

        reportId = String(report?.id ?? existingReportId ?? "").trim();
        reportStatus = String(report?.status ?? "").trim() || reportStatus || "DRAFT";
      }

      setSessionReports((prev) => ({
        ...prev,
        [reportKey]: {
          reportId,
          feedback: normalizedFeedback,
          status: reportStatus,
        },
      }));

      setAttendanceList((prev) =>
        prev.map((r) =>
          r.rowKey === selectedStudentForNote.rowKey ? { ...r, note: normalizedFeedback || undefined } : r,
        ),
      );

      toast.success({ title: "Lưu nhận xét thành công", description: "Nhận xét buổi học đã được lưu.", duration: 3000 });
      handleCloseNoteModal();
    } catch (err: any) {
      console.error("Submit note error:", err);
      const msg = translateSessionReportError(err?.message) || "Không thể lưu nhận xét.";
      toast.destructive({ title: "Lỗi lưu nhận xét", description: msg, duration: 5000 });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleEnhanceStudentNote = async (draft: string) => {
    if (!selectedSessionId || !selectedStudentForNote) return null;

    const studentProfileId = String(selectedStudentForNote.studentId ?? "").trim();
    if (!GUID_REGEX.test(studentProfileId)) {
      throw new Error("Học sinh chưa có hồ sơ hợp lệ để AI hỗ trợ viết lại.");
    }

    setIsEnhancingNote(true);
    try {
      const result = await enhanceSessionFeedback({
        draft,
        sessionId: selectedSessionId,
        studentProfileId,
      });
      return result?.enhancedFeedback?.trim() || null;
    } finally {
      setIsEnhancingNote(false);
    }
  };

  const handleSubmitStudentNoteForReview = async () => {
    if (!selectedSessionId || !selectedStudentForNote) return;

    const reportKey = buildSessionReportKey(
      selectedSessionId,
      selectedStudentForNote.studentId,
      selectedStudentForNote.rowKey,
    );
    const existingReportId = String(sessionReports[reportKey]?.reportId ?? "").trim();
    if (!existingReportId) {
      toast.warning({ title: "Chưa lưu nhận xét", description: "Vui lòng lưu nhận xét trước khi gửi duyệt.", duration: 4000 });
      return;
    }

    try {
      setIsSubmittingReview(true);
      setNoteModalError(null);
      const updated = await submitSessionReport(existingReportId);
      const nextStatus = String(updated?.status ?? "").trim() || "REVIEW";

      setSessionReports((prev) => ({
        ...prev,
        [reportKey]: {
          ...(prev[reportKey] ?? { reportId: existingReportId, feedback: "" }),
          reportId: existingReportId,
          status: nextStatus,
        },
      }));

      toast.success({ title: "Gửi duyệt thành công", description: "Nhận xét đã được gửi để duyệt.", duration: 3000 });
      handleCloseNoteModal();
    } catch (err: any) {
      const msg = translateSessionReportError(err?.message) || "Không thể gửi nhận xét để duyệt.";
      toast.destructive({ title: "Lỗi gửi duyệt", description: msg, duration: 5000 });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSaveAndSubmitForReview = async (feedback: string) => {
    if (!selectedSessionId || !selectedStudentForNote) return;

    const normalizedFeedback = feedback.trim();
    if (!normalizedFeedback) return;

    const reportKey = buildSessionReportKey(
      selectedSessionId,
      selectedStudentForNote.studentId,
      selectedStudentForNote.rowKey,
    );
    const existingReport = sessionReports[reportKey];
    const existingReportId = String(existingReport?.reportId ?? "").trim();
    const studentProfileId = String(selectedStudentForNote.studentId ?? "").trim();
    const canSyncWithApi = GUID_REGEX.test(studentProfileId);

    try {
      setIsSavingAndSubmitting(true);

      let reportId = existingReportId;
      if (canSyncWithApi) {
        const saved = existingReportId
          ? await updateSessionReport(existingReportId, { feedback: normalizedFeedback })
          : await createSessionReport({
              sessionId: selectedSessionId,
              studentProfileId,
              reportDate: todayDateOnly(),
              feedback: normalizedFeedback,
            });
        reportId = String(saved?.id ?? existingReportId ?? "").trim();
      }

      if (!reportId) {
        toast.warning({ title: "Chưa lưu được nhận xét", description: "Vui lòng thử lại.", duration: 4000 });
        return;
      }

      const updated = await submitSessionReport(reportId);
      const nextStatus = String(updated?.status ?? "").trim() || "REVIEW";

      setSessionReports((prev) => ({
        ...prev,
        [reportKey]: { reportId, feedback: normalizedFeedback, status: nextStatus },
      }));
      setAttendanceList((prev) =>
        prev.map((r) =>
          r.rowKey === selectedStudentForNote.rowKey ? { ...r, note: normalizedFeedback } : r,
        ),
      );

      toast.success({ title: "Lưu và gửi duyệt thành công", description: "Nhận xét đã được lưu và gửi để duyệt.", duration: 3000 });
      handleCloseNoteModal();
    } catch (err: any) {
      const msg = translateSessionReportError(err?.message) || "Không thể lưu và gửi nhận xét.";
      toast.destructive({ title: "Lỗi lưu và gửi duyệt", description: msg, duration: 5000 });
    } finally {
      setIsSavingAndSubmitting(false);
    }
  };

  const syncSessionReportsWithAttendance = useCallback(async () => {
    if (!selectedSessionId) return;
    type ReportSyncResult = { reportKey: string; reportId: string; feedback: string; status: string };

    const reportSyncTasks = attendanceList
      .map((student) => {
        const studentProfileId = String(student.studentId ?? "").trim();
        if (!GUID_REGEX.test(studentProfileId)) return null;

        const reportKey = buildSessionReportKey(selectedSessionId, studentProfileId, student.rowKey);
        const existingReport = sessionReports[reportKey];
        const note = String(student.note ?? "").trim();
        const existingFeedback = String(existingReport?.feedback ?? "").trim();
        const existingReportId = String(existingReport?.reportId ?? "").trim();

        if (!note) return null;
        if (note === existingFeedback && existingReportId) return null;

        return async () => {
          if (!selectedSessionId) return null;
          let report: SessionReportItem | null = null;
          if (existingReportId) {
            report = await updateSessionReport(existingReportId, { feedback: note });
          } else {
            report = await createSessionReport({
              sessionId: selectedSessionId,
              studentProfileId,
              reportDate: todayDateOnly(),
              feedback: note,
            });
          }

          const reportId = String(report?.id ?? existingReportId ?? "").trim();
          const status = String(report?.status ?? "").trim() || existingReport?.status || "DRAFT";
          return { reportKey, reportId, feedback: note, status };
        };
      })
      .filter(
        (task): task is (() => Promise<ReportSyncResult | null>) =>
          task !== null,
      );

    if (!reportSyncTasks.length) return;

    const results = await Promise.allSettled(reportSyncTasks.map((task) => task()));
    const failedCount = results.filter((result) => result.status === "rejected").length;

    const successItems: ReportSyncResult[] = [];
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        successItems.push(result.value);
      }
    });

    if (successItems.length) {
      setSessionReports((prev) => {
        const next = { ...prev };
        successItems.forEach(({ reportKey, reportId, feedback, status }) => {
          next[reportKey] = { reportId, feedback, status };
        });
        return next;
      });
    }

    if (failedCount > 0) {
      throw new Error(`Có ${failedCount} note chưa đồng bộ lên session report. Vui lòng thử lưu lại.`);
    }
  }, [attendanceList, selectedSessionId, sessionReports]);
  const handleSaveAll = useCallback(async () => {
    if (!selectedSessionId) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      await saveAttendance(selectedSessionId, attendanceList, !hasAnyMarked);
      await syncSessionReportsWithAttendance();
      await refreshAttendance();

      toast.success({
        title: "Lưu điểm danh thành công",
        description: "Dữ liệu điểm danh đã được lưu lại.",
        duration: 4000,
      });
    } catch (err: any) {
      console.error("Save attendance error:", err);
      const rawMsg = err?.message || "";

      let displayMsg = rawMsg;
      if (rawMsg.includes("cannot mark attendance for future session")) {
        displayMsg = "Chưa đến ngày giờ học. Bạn chỉ có thể điểm danh khi buổi học đã diễn ra.";
      } else if (rawMsg.toLowerCase().includes("unauthorized") || rawMsg.toLowerCase().includes("401")) {
        displayMsg = "Bạn không có quyền thực hiện thao tác này.";
      } else if (displayMsg) {
        displayMsg = `Đã xảy ra lỗi: ${rawMsg}`;
      } else {
        displayMsg = "Không thể lưu điểm danh. Vui lòng thử lại.";
      }

      setSaveError(displayMsg);
      toast.destructive({
        title: "Lưu điểm danh thất bại",
        description: displayMsg,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [attendanceList, hasAnyMarked, refreshAttendance, selectedSessionId, syncSessionReportsWithAttendance]);
  const filteredRecords = useMemo(() => {
    let filtered = [...attendanceList];

    if (filterStatus !== "ALL") {
      filtered = filtered.filter((record) => record.status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((record) => {
        const name = (record.name ?? "").toLowerCase();
        const code = (record.studentCode ?? "").toLowerCase();
        const email = (record.email ?? "").toLowerCase();
        const phone = record.phone ?? "";
        return name.includes(query) || code.includes(query) || email.includes(query) || phone.includes(query);
      });
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "student") {
        comparison = (a.name ?? "").localeCompare(b.name ?? "");
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [attendanceList, filterStatus, searchQuery, sortColumn, sortDirection]);

  const handleToggleStudent = (rowKey: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedStudents.size === filteredRecords.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredRecords.map((r) => r.rowKey)));
    }
  };

  const isAllSelected = filteredRecords.length > 0 && selectedStudents.size === filteredRecords.length;
  const isIndeterminate = selectedStudents.size > 0 && selectedStudents.size < filteredRecords.length;

  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, sortColumn, sortDirection]);

  // --- Teaching Report handlers ---
  const handleOpenTeachingReport = useCallback(async (
    initialView: "syllabus" | "lessonPlan" | "teachingLog" = "teachingLog",
    options?: { openFullSyllabus?: boolean },
  ) => {
    if (!selectedSessionId || !selectedSession) return;

    const shouldOpenFullSyllabus = initialView === "syllabus" && options?.openFullSyllabus === true;

    setTeachingReportOpen(true);
    setTeachingReportLoading(true);
    setTeachingReportError(null);
    setTeachingReportDocument(null);
    setTeachingLogRecord(null);
    setTeachingReportTemplate(null);
    setTeachingReportSession(null);
    setTeachingReportSyllabusMetadata(null);
    setTeachingSyllabusDetail(null);
    setTeachingSyllabusDetailError(null);
    setTeachingSyllabusDetailLoading(false);
    setTeachingActualContent("");
    setTeachingActualHomework("");
    setTeachingTeacherNotes("");
    setTeachingProgressStatus("completed");
    setTeachingActualTeachingType("normal");
    setTeachingActivityDrafts([createEmptyTeachingActivity()]);
    setTeachingModalView(initialView);
    setTeachingReferenceTab("syllabus");
    setTeachingQuickReferenceView("lessonPlan");
    setTeachingSyllabusSummaryPopoverOpen(false);
    setTeachingFullSyllabusOpen(shouldOpenFullSyllabus);
    setTeachingActivityErrors({});
    setActiveTeachingActivityIndex(0);

    try {
      let dedicatedLessonPlanDoc: Awaited<ReturnType<typeof getSessionLessonPlanDocument>>["data"] = null;
      if (!dedicatedLessonPlanEndpointUnavailableRef.current) {
        const lessonPlanDocumentResp = await getSessionLessonPlanDocument(selectedSessionId);
        if (lessonPlanDocumentResp.isSuccess && lessonPlanDocumentResp.data) {
          dedicatedLessonPlanDoc = lessonPlanDocumentResp.data;
        } else if (isLessonPlanDocumentEndpointUnavailable(lessonPlanDocumentResp)) {
          // Dedicated endpoint is not available on this BE deployment yet.
          dedicatedLessonPlanEndpointUnavailableRef.current = true;
          if (!dedicatedLessonPlanEndpointWarnedRef.current) {
            dedicatedLessonPlanEndpointWarnedRef.current = true;
            toast({
              title: "Endpoint lesson-plan-document chưa sẵn sàng",
              description: "Hệ thống sẽ tự động dùng flow cũ (session + template) để hiển thị giáo án.",
              variant: "warning",
            });
          }
        }
      }

      let detailSession: any = null;
      try {
        const detailResp = await fetchSessionDetail(selectedSessionId);
        detailSession = (detailResp as any)?.session ?? detailResp ?? null;
      } catch {
        // Ignore detail fetch failures and continue with list/session data fallbacks.
      }

      // Try to get classId from session data (multiple fallback keys)
      let classId = String(
        detailSession?.classId ??
        detailSession?.ClassId ??
        detailSession?.class_id ??
        detailSession?.class?.id ??
        detailSession?.classInfo?.id ??
        (selectedSession as any)?.classId ??
        (selectedSession as any)?.ClassId ??
        (selectedSession as any)?.class_id ??
        (selectedSession as any)?.class?.id ??
        (selectedSession as any)?.classInfo?.id ??
        ""
      ).trim();

      // Fallback: fetch session detail to get classId (second attempt)
      if (!classId) {
        try {
          const detailResp = await fetchSessionDetail(selectedSessionId);
          detailSession = (detailResp as any)?.session ?? detailResp;
          classId = String(
            detailSession?.classId ?? detailSession?.ClassId ?? detailSession?.class_id ?? ""
          ).trim();
        } catch { /* ignore detail fetch error */ }
      }

      if (!classId) {
        setTeachingReportError(
          "Không tìm thấy thông tin lớp học (classId) cho buổi này. Backend cần trả classId trong session data."
        );
        setTeachingReportLoading(false);
        return;
      }

      // Load syllabus to find matching session
      const syllabusResp = await getClassLessonPlanSyllabus(classId);
      if (!syllabusResp.isSuccess || !syllabusResp.data) {
        setTeachingReportError("Không thể tải syllabus của lớp. Vui lòng thử lại.");
        setTeachingReportLoading(false);
        return;
      }

      const sessionId = selectedSessionId;
      const matchedSession = syllabusResp.data.sessions.find(
        (s) => s.sessionId === sessionId
      );

      if (!matchedSession) {
        setTeachingReportError(
          "Không tìm thấy session này trong syllabus của lớp. Vui lòng liên hệ Admin kiểm tra."
        );
        setTeachingReportLoading(false);
        return;
      }

      setTeachingReportSyllabusMetadata(syllabusResp.data.syllabusMetadata ?? null);

      const expectedLessonNumber = getExpectedLessonNumber(
        selectedLesson?.plannedLessonTitle,
        selectedLesson?.lesson,
        dedicatedLessonPlanDoc?.plannedLessonTitle,
        dedicatedLessonPlanDoc?.actualLessonTitle,
      );

      const dedicatedTemplateMismatchReason = getLessonPlanTemplateMismatchReason(
        dedicatedLessonPlanDoc?.document,
        expectedLessonNumber,
      );

      if (dedicatedTemplateMismatchReason) {
        dedicatedLessonPlanDoc = null;
        toast({
          title: "Lesson plan document trả sai buổi",
          description: `${dedicatedTemplateMismatchReason} FE tạm bỏ qua document này và dùng dữ liệu fallback của buổi hiện tại để tránh hiển thị nhầm giáo án.`,
          variant: "warning",
        });
      }

      const baseTeachingReportSession: ClassLessonPlanSyllabusSession = {
        ...matchedSession,
        syllabusId:
          dedicatedLessonPlanDoc?.syllabusId ??
          matchedSession.syllabusId ??
          syllabusResp.data.syllabusId ??
          null,
        syllabusCode:
          matchedSession.syllabusCode ??
          syllabusResp.data.syllabusCode ??
          null,
        syllabusVersion:
          matchedSession.syllabusVersion ??
          syllabusResp.data.syllabusVersion ??
          null,
        syllabusTitle:
          matchedSession.syllabusTitle ??
          syllabusResp.data.syllabusTitle ??
          null,
      };

      let resolvedTemplateForDisplay = dedicatedLessonPlanDoc?.document ?? null;
      if (resolvedTemplateForDisplay) {
        setTeachingReportTemplate(resolvedTemplateForDisplay);
      }

      setTeachingReportDocument(dedicatedLessonPlanDoc ?? null);
      setTeachingReportSession(
        enrichTeachingReportSessionWithTemplate(baseTeachingReportSession, resolvedTemplateForDisplay),
      );

      const normalizeTemplateId = (value: unknown): string | null => {
        const raw = String(value ?? "").trim().replace(/[{}]/g, "");
        if (!raw || raw === ZERO_GUID) return null;
        // Some APIs may return non-RFC GUID formatting; keep non-empty IDs and let API validate.
        if (GUID_REGEX.test(raw)) return raw;
        return raw.length >= 8 ? raw : null;
      };

      let resolvedTemplateId =
        normalizeTemplateId(resolvedTemplateForDisplay?.id) ??
        normalizeTemplateId(dedicatedLessonPlanDoc?.lessonPlanTemplateId) ??
        normalizeTemplateId(dedicatedLessonPlanDoc?.plannedLessonPlanTemplateId) ??
        normalizeTemplateId(dedicatedLessonPlanDoc?.actualLessonPlanTemplateId) ??
        normalizeTemplateId(detailSession?.lessonPlanTemplateId) ??
        normalizeTemplateId(detailSession?.plannedLessonPlanTemplateId) ??
        normalizeTemplateId(detailSession?.actualLessonPlanTemplateId) ??
        normalizeTemplateId((matchedSession as any)?.plannedLessonPlanTemplateId) ??
        normalizeTemplateId((matchedSession as any)?.actualLessonPlanTemplateId) ??
        normalizeTemplateId((matchedSession as any)?.lessonPlanTemplateId);
      const runtimeTemplateId = [
        dedicatedLessonPlanDoc?.lessonPlanTemplateId,
        dedicatedLessonPlanDoc?.plannedLessonPlanTemplateId,
        dedicatedLessonPlanDoc?.actualLessonPlanTemplateId,
        detailSession?.lessonPlanTemplateId,
        detailSession?.plannedLessonPlanTemplateId,
        detailSession?.actualLessonPlanTemplateId,
        detailSession?.lessonPlanTemplate?.id,
        detailSession?.plannedLessonPlanTemplate?.id,
        detailSession?.actualLessonPlanTemplate?.id,
        (selectedSession as any)?.lessonPlanTemplateId,
        (selectedSession as any)?.plannedLessonPlanTemplateId,
        (selectedSession as any)?.actualLessonPlanTemplateId,
        (selectedSession as any)?.lessonPlanTemplate?.id,
        (selectedSession as any)?.plannedLessonPlanTemplate?.id,
        (selectedSession as any)?.actualLessonPlanTemplate?.id,
        selectedLesson?.lessonPlanTemplateId,
        selectedLesson?.plannedLessonPlanTemplateId,
        selectedLesson?.actualLessonPlanTemplateId,
      ]
        .map((candidate) => normalizeTemplateId(candidate))
        .find((candidate) => Boolean(candidate)) ?? null;
      if (runtimeTemplateId) {
        resolvedTemplateId = runtimeTemplateId;
      }

      if (!resolvedTemplateForDisplay && !resolvedTemplateId) {
        const moduleIdForTemplateLookup = String(
          matchedSession.moduleId ??
          dedicatedLessonPlanDoc?.moduleId ??
          detailSession?.moduleId ??
          detailSession?.ModuleId ??
          (selectedSession as any)?.moduleId ??
          (selectedSession as any)?.ModuleId ??
          "",
        ).trim();
        const sessionIndexForTemplateLookup =
          matchedSession.sessionIndexInModule ??
          dedicatedLessonPlanDoc?.sessionIndexInModule ??
          selectedLesson?.sessionIndexInModule ??
          null;

        if (moduleIdForTemplateLookup && sessionIndexForTemplateLookup != null) {
          const templateListResp = await getAllLessonPlanTemplates({
            moduleId: moduleIdForTemplateLookup,
            pageNumber: 1,
            pageSize: 200,
          });

          if (templateListResp.isSuccess) {
            const templateCandidate = pickModuleLessonPlanTemplate(
              templateListResp.data.templates.items,
              {
                sessionIndexInModule: sessionIndexForTemplateLookup,
                expectedLessonNumber,
              },
            );

            const templateMismatchReason = getLessonPlanTemplateMismatchReason(
              templateCandidate,
              expectedLessonNumber,
            );

            if (!templateMismatchReason && templateCandidate) {
              resolvedTemplateForDisplay = templateCandidate;
              resolvedTemplateId = normalizeTemplateId(templateCandidate.id) ?? resolvedTemplateId;
              setTeachingReportTemplate(templateCandidate);
              setTeachingReportSession((prev) =>
                enrichTeachingReportSessionWithTemplate(prev ?? baseTeachingReportSession, templateCandidate),
              );
            }
          }
        }
      }

      const hasDedicatedTemplate = Boolean(resolvedTemplateForDisplay);

      // Initialize activity drafts from existing data
      const initDraftsFromContent = (content: string | null | undefined): TeachingActivityDraft[] => {
        const parsed = parseTeachingJson(content);
        if (parsed) {
          const candidates = [
            parsed.activities,
            parsed.activityRows,
            parsed.rows,
            parsed.items,
            parsed.content,
          ];

          for (const candidate of candidates) {
            if (Array.isArray(candidate) && candidate.length) {
              return teachingActivityDraftsFromUnknown(candidate);
            }
          }

          // Fallback for single-row object schemas.
          if (
            typeof parsed === "object" &&
            (parsed.time || parsed.book || parsed.skills || parsed.classwork || parsed.requiredMaterials)
          ) {
            return teachingActivityDraftsFromUnknown([parsed]);
          }
        }
        return [createEmptyTeachingActivity()];
      };

      const firstValidDrafts = (...draftSets: TeachingActivityDraft[][]): TeachingActivityDraft[] => {
        for (const drafts of draftSets) {
          if (drafts.some(hasActivityContent)) {
            return drafts;
          }
        }
        return [createEmptyTeachingActivity()];
      };

      const initHomeworkFromContent = (content: string | null | undefined): string => {
        const parsed = parseTeachingJson(content);
        if (parsed) {
          const hw =
            parsed.homeworkMaterials ??
            parsed.homeworkRequiredMaterials ??
            parsed.actualHomework ??
            parsed.homeworkNotes ??
            parsed.homeworkLabel ??
            "";
          if (Array.isArray(hw)) return hw.join("\n");
          return typeof hw === "string" ? hw : "";
        }
        return "";
      };

      const initNotesFromContent = (content: string | null | undefined): string => {
        const parsed = parseTeachingJson(content);
        if (parsed) {
          const n = parsed.teacherNotes ?? parsed.notes ?? parsed.extra ?? "";
          if (Array.isArray(n)) return n.join("\n");
          return typeof n === "string" ? n : "";
        }
        return "";
      };

      const buildTemplateReferenceDrafts = (
        template: LessonPlanTemplate | null | undefined,
      ): TeachingActivityDraft[] => {
        if (!template) return [];

        const normalizedMaterials = [template.teacherMaterials, template.studentMaterials]
          .map((value) => String(value ?? "").trim())
          .filter(Boolean)
          .join("\n");

        const procedureSource = String(
          template.procedure ?? template.syllabusContent ?? "",
        ).trim();
        const procedureRows = extractProcedureRowsFromText(procedureSource);

        if (procedureRows.length > 0) {
          return procedureRows.map((row) => {
            const details = [row.step, row.details].filter(Boolean).join("\n").trim();
            const isHomeworkStep = /homework/i.test(`${row.step} ${row.details}`);

            return {
              time: row.stage ? `Bước ${row.stage}` : "",
              book: "",
              skills: String(template.languageContent ?? "").trim(),
              classwork: details,
              requiredMaterials: normalizedMaterials,
              homeworkRequiredMaterials: isHomeworkStep
                ? row.details.trim()
                : String(template.homework ?? "").trim(),
              extra: "",
            } satisfies TeachingActivityDraft;
          });
        }

        const summaryBlocks = [
          template.objectives ? `Objectives:\n${String(template.objectives).trim()}` : "",
          template.languageContent ? `Language content:\n${String(template.languageContent).trim()}` : "",
          template.teachingMethodology ? `Methodology:\n${String(template.teachingMethodology).trim()}` : "",
        ].filter(Boolean);

        if (!summaryBlocks.length && !normalizedMaterials && !String(template.homework ?? "").trim()) {
          return [];
        }

        return [
          {
            time: "",
            book: "",
            skills: String(template.languageContent ?? "").trim(),
            classwork: summaryBlocks.join("\n\n"),
            requiredMaterials: normalizedMaterials,
            homeworkRequiredMaterials: String(template.homework ?? "").trim(),
            extra: "",
          },
        ];
      };

      const initHomeworkFromTemplate = (
        template: LessonPlanTemplate | null | undefined,
      ): string => {
        return String(template?.homework ?? "").trim();
      };

      const initNotesFromTemplate = (
        template: LessonPlanTemplate | null | undefined,
      ): string => {
        return String(template?.evaluation ?? "").trim();
      };

      let existingPlan: LessonPlan | null = null;
      if (matchedSession.lessonPlanId) {
        const planResp = await getLessonPlanById(matchedSession.lessonPlanId);
        if (planResp.isSuccess && planResp.data) {
          existingPlan = planResp.data;
          resolvedTemplateId = String(planResp.data.templateId ?? resolvedTemplateId ?? "").trim() || resolvedTemplateId;
        }
      }

      let existingTeachingLog: TeachingLog | null = null;
      try {
        const teachingLogResp = await getTeachingLog(sessionId);
        const teachingLogData = teachingLogResp?.data ?? null;

        if (teachingLogResp?.isSuccess !== false && teachingLogData) {
          existingTeachingLog = teachingLogData;
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          throw err;
        }
      }

      setTeachingLogRecord(existingTeachingLog);
      setTeachingProgressStatus(
        normalizeTeachingProgressStatus(
          existingTeachingLog?.progressStatus ??
          dedicatedLessonPlanDoc?.teachingProgressStatus ??
          detailSession?.teachingProgressStatus ??
          (selectedSession as any)?.teachingProgressStatus ??
          selectedLesson?.teachingProgressStatus,
        ) ?? "completed",
      );
      setTeachingActualTeachingType(
        normalizeTeachingType(
          existingTeachingLog?.actualTeachingType ??
          dedicatedLessonPlanDoc?.actualTeachingType ??
          detailSession?.actualTeachingType ??
          (selectedSession as any)?.actualTeachingType ??
          selectedLesson?.actualTeachingType,
        ) ?? "normal",
      );

      const actualContentSource =
        existingTeachingLog?.actualContent ??
        existingPlan?.actualContent ??
        matchedSession.actualContent ??
        detailSession?.actualContent ??
        "";
      const actualHomeworkSource =
        existingTeachingLog?.actualHomework ??
        existingPlan?.actualHomework ??
        matchedSession.actualHomework ??
        detailSession?.actualHomework ??
        "";
      const teacherNoteSource =
        existingTeachingLog?.teacherNote ??
        existingPlan?.teacherNotes ??
        matchedSession.teacherNotes ??
        detailSession?.teacherNote ??
        "";

      setTeachingActualContent(actualContentSource);

      const actualDrafts = initDraftsFromContent(actualContentSource);
      const plannedDrafts = initDraftsFromContent(matchedSession.plannedContent);
      const templateDrafts = initDraftsFromContent(matchedSession.templateSyllabusContent);
      const templateReferenceDrafts = buildTemplateReferenceDrafts(resolvedTemplateForDisplay);
      const referenceDrafts = firstValidDrafts(plannedDrafts, templateDrafts, templateReferenceDrafts);

      setTeachingActivityDrafts(
        actualDrafts.some(hasActivityContent)
          ? mergeTeacherActivities(referenceDrafts, actualDrafts)
          : referenceDrafts,
      );
      setTeachingActualHomework(
        actualHomeworkSource ||
        initHomeworkFromContent(actualContentSource) ||
        initHomeworkFromContent(matchedSession.plannedContent) ||
        initHomeworkFromContent(matchedSession.templateSyllabusContent) ||
        initHomeworkFromTemplate(resolvedTemplateForDisplay),
      );
      setTeachingTeacherNotes(
        teacherNoteSource ||
        initNotesFromContent(actualContentSource) ||
        initNotesFromContent(matchedSession.plannedContent) ||
        initNotesFromContent(matchedSession.templateSyllabusContent) ||
        initNotesFromTemplate(resolvedTemplateForDisplay),
      );

      if (!hasDedicatedTemplate && !resolvedTemplateForDisplay && resolvedTemplateId) {
        const templateResp = await getLessonPlanTemplateById(resolvedTemplateId);
        if (templateResp.isSuccess && templateResp.data) {
          const templateMismatchReason = getLessonPlanTemplateMismatchReason(
            templateResp.data,
            expectedLessonNumber,
          );

          if (templateMismatchReason) {
            toast({
              title: "Template lesson plan không khớp buổi hiện tại",
              description: `${templateMismatchReason} FE sẽ giữ fallback theo planned content của buổi thay vì render template sai.`,
              variant: "warning",
            });
          } else {
            resolvedTemplateForDisplay = templateResp.data;
            setTeachingReportTemplate(templateResp.data);
            setTeachingReportSession((prev) =>
              enrichTeachingReportSessionWithTemplate(prev ?? baseTeachingReportSession, templateResp.data),
            );

            const templateReferenceDrafts = buildTemplateReferenceDrafts(templateResp.data);
            if (templateReferenceDrafts.some(hasActivityContent)) {
              setTeachingActivityDrafts((prev) =>
                prev.some(hasActivityContent) ? prev : templateReferenceDrafts,
              );
            }

            const templateHomework = initHomeworkFromTemplate(templateResp.data);
            if (templateHomework) {
              setTeachingActualHomework((prev) => prev || templateHomework);
            }

            const templateNotes = initNotesFromTemplate(templateResp.data);
            if (templateNotes) {
              setTeachingTeacherNotes((prev) => prev || templateNotes);
            }
          }
        }
      }

      // Load the same canonical document+detail payload as the admin syllabus modal.
      const baseSyllabusId = resolveSyllabusId(baseTeachingReportSession?.syllabusId);
      if (shouldOpenFullSyllabus && baseSyllabusId) {
        try {
          const { detail, error } = await loadAdminStyleSyllabusDetail(baseSyllabusId);
          if (detail) {
            setTeachingSyllabusDetail(detail);
            setTeachingSyllabusDetailError(error);
          } else if (error) {
            setTeachingSyllabusDetailError(error);
          }
        } catch (err: any) {
          console.error("Error loading full syllabus detail:", err);
          setTeachingSyllabusDetailError(
            getTeachingSyllabusLoadError({ message: err?.message }),
          );
        }
      }
    } catch (err: any) {
      setTeachingReportError(err?.message || "Đã xảy ra lỗi khi tải thông tin giáo án.");
    } finally {
      setTeachingReportLoading(false);
    }
  }, [selectedSessionId, selectedSession, selectedLesson?.lessonPlanTemplateId, toast]);

  useEffect(() => {
    if (!requestedOpenLessonPlan) return;
    if (!selectedSessionId || !selectedSession) return;
    if (autoOpenedTeachingReportRef.current) return;
    if (teachingReportOpen || teachingReportLoading) return;

    autoOpenedTeachingReportRef.current = true;
    void handleOpenTeachingReport("lessonPlan");
  }, [
    requestedOpenLessonPlan,
    selectedSessionId,
    selectedSession,
    teachingReportOpen,
    teachingReportLoading,
                    handleOpenTeachingReport,
  ]);

  useEffect(() => {
    if (!teachingReportOpen) return;
    if (teachingModalView !== "syllabus") return;
    if (teachingSyllabusDetail) return;
    if (!teachingSyllabusId) return;

    const loadSyllabusDetail = async () => {
      try {
        const { detail, error } = await loadAdminStyleSyllabusDetail(teachingSyllabusId);
        if (detail) {
          setTeachingSyllabusDetail(detail);
          setTeachingSyllabusDetailError(error);
        } else if (error) {
          setTeachingSyllabusDetailError(error);
        }
      } catch (err: any) {
        console.error("Error loading syllabus detail:", err);
        setTeachingSyllabusDetailError(
          getTeachingSyllabusLoadError({ message: err?.message }),
        );
      }
    };

    void loadSyllabusDetail();
  }, [teachingReportOpen, teachingModalView, teachingSyllabusId, teachingSyllabusDetail]);

  const handleSubmitTeachingReport = useCallback(async () => {
    if (!selectedSessionId) return;
    if (teachingTemplateGuardMessage) {
      return;
    }
    if (teachingLogReadOnly) {
      setTeachingReportError("Teaching log đã được phê duyệt hoặc khóa. Bạn chỉ có thể xem ở chế độ read-only.");
      return;
    }

    // Check if at least one activity has content
    const hasActivities = teachingActivityDrafts.some((a) =>
      Object.values(a).some((v) => v.trim())
    );
    if (!hasActivities) {
      setTeachingReportError("Vui lòng nhập ít nhất 1 activity trong teaching log.");
      return;
    }

    const nextErrors: Record<number, TeachingActivityErrors> = {};
    let firstInvalidRow = -1;
    teachingActivityDrafts.forEach((activity, index) => {
      if (!hasActivityContent(activity)) return;

      const rowErrors: TeachingActivityErrors = {};
      if (!activity.time.trim()) rowErrors.time = "Bắt buộc";
      if (!activity.classwork.trim()) rowErrors.classwork = "Bắt buộc";
      if (!activity.requiredMaterials.trim()) rowErrors.requiredMaterials = "Bắt buộc";
      if (!activity.homeworkRequiredMaterials.trim()) rowErrors.homeworkRequiredMaterials = "Bắt buộc";

      if (Object.keys(rowErrors).length > 0) {
        nextErrors[index] = rowErrors;
        if (firstInvalidRow < 0) firstInvalidRow = index;
      }
    });

    if (firstInvalidRow >= 0) {
      setTeachingActivityErrors(nextErrors);
      setTeachingReportError("Vui lòng điền đầy đủ các trường bắt buộc trong Teaching log.");
      requestAnimationFrame(() => {
        const rowNode = teachingActivityRowRefs.current[firstInvalidRow];
        rowNode?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    if (teachingProgressStatus === "skipped" && !teachingTeacherNotes.trim()) {
      setTeachingReportError("Khi chọn bỏ qua buổi học, vui lòng nhập teacher note để giải thích lý do.");
      return;
    }

    setTeachingActivityErrors({});

    setTeachingReportSubmitting(true);
    setTeachingReportError(null);

    try {
      const actualContentJson = activitiesToContentJson(
        teachingActivityDrafts,
        teachingActualHomework,
        teachingTeacherNotes,
      );

      const payload = {
        actualLessonPlanTemplateId: resolvedTeachingTemplateId,
        actualTeachingType: teachingActualTeachingType,
        progressStatus: teachingProgressStatus,
        actualContent: actualContentJson || null,
        actualHomework: teachingActualHomework.trim() || null,
        teacherNote: teachingTeacherNotes.trim() || null,
      };

      let resp;

      try {
        resp = resolvedTeachingLogId
          ? await updateTeachingLog(selectedSessionId, payload)
          : await submitTeachingLog(selectedSessionId, payload);
      } catch (err: any) {
        const errorCode = getApiErrorCode(err);

        if (errorCode === "Session.MissingLessonTemplateForTeachingLog") {
          setTeachingReportError(
            teachingTemplateGuardMessage ||
              "Session này chưa có planned lesson template ở runtime. Vui lòng nhờ backend backfill plannedLessonPlanTemplateId hoặc lessonPlanTemplateId trước khi lưu teaching log.",
          );
          return;
        }

        if (!resolvedTeachingLogId && (err?.response?.status === 409 || errorCode === "Session.TeachingLogAlreadyExists")) {
          resp = await updateTeachingLog(selectedSessionId, payload);
        } else if (resolvedTeachingLogId && (err?.response?.status === 404 || errorCode === "Session.TeachingLogNotFound")) {
          resp = await submitTeachingLog(selectedSessionId, payload);
        } else {
          throw err;
        }
      }

      if (!resp || resp.isSuccess === false || resp.success === false) {
        setTeachingReportError(resp.message || "Không thể lưu teaching log của buổi học.");
        return;
      }

      const reloadResults = await Promise.allSettled([
        getSessionLessonPlanDocument(selectedSessionId),
        getTeachingLog(selectedSessionId),
        fetchSessionDetail(selectedSessionId),
        fetchSessionData(),
      ]);

      const refreshedDocumentResp = reloadResults[0];
      const refreshedTeachingLogResp = reloadResults[1];

      if (refreshedDocumentResp.status === "fulfilled" && refreshedDocumentResp.value.isSuccess) {
        setTeachingReportDocument(refreshedDocumentResp.value.data);
      }

      if (refreshedTeachingLogResp.status === "fulfilled") {
        const refreshedTeachingLog = refreshedTeachingLogResp.value?.data ?? null;
        if (refreshedTeachingLog) {
          setTeachingLogRecord(refreshedTeachingLog);
          setTeachingProgressStatus(
            normalizeTeachingProgressStatus(refreshedTeachingLog.progressStatus) ?? teachingProgressStatus,
          );
          setTeachingActualTeachingType(
            normalizeTeachingType(refreshedTeachingLog.actualTeachingType) ?? teachingActualTeachingType,
          );
        }
      }

      toast({
        title: "Đã lưu teaching log",
        description: resolvedTeachingLogId
          ? "Teaching log của buổi học đã được cập nhật và runtime session đã được reload."
          : "Teaching log của buổi học đã được tạo và runtime session đã được reload.",
        variant: "success",
      });

      setTeachingReportOpen(false);
    } catch (err: any) {
      setTeachingReportError(err?.message || "Không thể lưu teaching log của buổi học.");
    } finally {
      setTeachingReportSubmitting(false);
    }
  }, [
    fetchSessionData,
    resolvedTeachingLogId,
    resolvedTeachingTemplateId,
    selectedSessionId,
    teachingTemplateGuardMessage,
    teachingActualHomework,
    teachingActualTeachingType,
    teachingActivityDrafts,
    teachingLogReadOnly,
    teachingProgressStatus,
    teachingTeacherNotes,
  ]);

  const handleCloseTeachingReport = useCallback(() => {
    setTeachingReportOpen(false);
    setTeachingReportError(null);
    setTeachingSyllabusDetail(null);
    setTeachingSyllabusDetailError(null);
    setTeachingSyllabusDetailLoading(false);
    setTeachingActivityErrors({});
    setTeachingModalView("teachingLog");
    setTeachingFullSyllabusOpen(false);
  }, []);

  const stats = useMemo(() => {
    if (attendanceList.length > 0) {
      const total = attendanceList.length;
      const present = attendanceList.filter((student) => student.status === "present").length;
      const absent = attendanceList.filter((student) => student.status === "absent").length;
      const makeup = attendanceList.filter((student) => student.status === "makeup").length;
      return { total, present, absent, makeup };
    }

    if (!attendanceSummary) return null;
    return attendanceSummary;
  }, [attendanceList, attendanceSummary]);

  const handleExportAttendance = useCallback(() => {
    if (!filteredRecords.length) return;

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = [
      "Hoc vien",
      "Ma hoc vien",
      "Trang thai",
      "Loai vang",
      "Co credit hoc bu",
      "Ghi chu",
    ];

    const rows = filteredRecords.map((record) => [
      record.name ?? "",
      record.studentCode ?? "",
      record.status ? STATUS_LABELS[record.status] : "",
      getAbsenceTypeLabel(record.absenceType) ?? "",
      record.hasMakeupCredit ? "Co" : "Khong",
      record.note ?? "",
    ]);

    const csv = [header, ...rows].map((row) => row.map((cell) => escapeCsv(String(cell ?? ""))).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sessionCode = selectedLesson?.lesson?.trim() || selectedSessionId || "attendance";

    link.href = url;
    link.download = `${sessionCode.replace(/[\\/:*?"<>|]+/g, "-")}-attendance.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredRecords, selectedLesson?.lesson, selectedSessionId]);

  return (
    <div className="min-h-screen bg-gray-50 p-2 space-y-6">
      <div className={`flex flex-col gap-4 transition-all duration-500 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <CheckCheckIcon size={25} />
            </div>
            <div>
              <h1 className="text-2xl md:text-2xl font-bold text-gray-900">
                Điểm danh lớp học
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2 ">
                <Sparkles size={14} className="text-red-600" />
                Quản lý chuyên cần và sắp xếp buổi bù
              </p>
            </div>
          </div>
          {selectedSessionId && (
            <button
              onClick={handleChooseOtherSession}
              className="px-4 py-2 border border-gray-400 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-gray-50 whitespace-nowrap hover:scale-105"
            >
              <ChevronLeft size={16} />
              <span>Buổi khác</span>
            </button>
          )}
        </div>
      </div>

      {!selectedSessionId && (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-6 shadow-sm overflow-hidden">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays size={20} className="text-red-600" />
              Buổi học theo khoảng ngày
            </h3>
            <p className="text-sm text-gray-600 mt-1">Chọn buổi học để điểm danh ngay</p>
          </div>

          {/* Date range picker */}
          <div className="px-4 py-4 bg-white rounded-xl border border-gray-200 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <CalendarDays size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300"
                  />
                </div>
                <ArrowRightLeft size={16} className="text-gray-400" />
                <div className="relative flex-1">
                  <CalendarDays size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-red-600" />
                <span className="text-sm font-semibold text-gray-800">Lọc nâng cao</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
                <input
                  value={filters.date}
                  onChange={(e) => handleFilterChange("date", e.target.value)}
                  placeholder="Ngày"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300"
                />
                <input
                  value={filters.time}
                  onChange={(e) => handleFilterChange("time", e.target.value)}
                  placeholder="Giờ"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300"
                />
                <input
                  value={filters.session}
                  onChange={(e) => handleFilterChange("session", e.target.value)}
                  placeholder="Buổi học"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300"
                />
                <input
                  value={filters.className}
                  onChange={(e) => handleFilterChange("className", e.target.value)}
                  placeholder="Lớp"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300"
                />
                <input
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  placeholder="Trạng thái"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300"
                />
              </div>
              {(filters.date || filters.time || filters.session || filters.className || filters.status) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors font-medium"
                >
                  <X size={14} />
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {/* Session list */}
          <div>
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-3"></div>
                <p className="text-gray-500">Đang tải danh sách buổi học...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl">
                  <AlertCircle size={16} />
                  {error}
                </div>
              </div>
            )}

              {!loading && !error && filterSessions.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <CalendarDays size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500">Không có buổi học phù hợp bộ lọc</p>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filterSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionSelect(session.id)}
                    className={`group relative p-6 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer overflow-hidden ${session.id === selectedSessionId
                        ? "border-red-400 bg-gradient-to-br from-red-100 via-red-50 to-red-100 shadow-2xl shadow-red-300/40 scale-105"
                        : "border-gray-200 hover:border-red-400 hover:shadow-xl hover:shadow-red-200/40 hover:bg-red-50 hover:scale-102"
                      }`}
                  >
                    {/* Animated background accent */}
                    <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-8 transition-all duration-500 ${session.id === selectedSessionId ? 'bg-red-400 opacity-10' : 'bg-red-300'}`}></div>
                    

                    {/* Status indicator */}
                    <div className="absolute top-4 right-4">
                      <div className={`w-3.5 h-3.5 rounded-full ${session.id === selectedSessionId ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/70' : 'bg-gray-300'}`}></div>
                    </div>

                    {/* Header with icon and title */}
                    <div className="flex items-start gap-3 mb-4 relative z-10">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-red-100 to-red-50 shadow-md shadow-red-200/50 group-hover:shadow-lg group-hover:shadow-red-300/60 group-hover:scale-110 transition-all duration-300 border border-red-200">
                        <BookOpen size={20} className="text-red-700 font-bold" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 line-clamp-1 text-base">{session.className}</div>
                        <div className="text-xs text-gray-500 mt-1 font-medium">{session.date}</div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-gray-200 via-gray-300 to-transparent my-3"></div>

                    {/* Details section */}
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center gap-2.5 text-sm text-gray-700 font-semibold">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200/50">
                          <Clock size={14} className="text-blue-600 font-bold" strokeWidth={2} />
                        </div>
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-gray-700 font-semibold">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200/50">
                          <MapPin size={14} className="text-purple-600 font-bold" strokeWidth={2} />
                        </div>
                        <span className="line-clamp-1">{session.room}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-gray-700 font-semibold">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200/50">
                          <Users size={14} className="text-emerald-600 font-bold" strokeWidth={2} />
                        </div>
                        <span>{session.students} học viên</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedSessionId && selectedLesson && (
          <>
            {/* Class Info Card */}
            <div className={`relative overflow-hidden bg-gradient-to-br from-red-50 via-red-50/40 to-white rounded-2xl border border-red-100 shadow-sm mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              {/* Decorative accent bar */}

              <div className="flex flex-col gap-5 p-6">
                {/* Row 1: Class Info */}
                <div className="flex items-center gap-5">
                  <div className="flex-1">
                    {/* <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-0.5">{selectedLesson.course}</div> */}
                    <h2 className="text-2xl font-bold text-gray-900">{selectedLesson.lesson}</h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <div className="p-1 rounded-md bg-red-100">
                          <CalendarDays size={14} className="text-red-600" />
                        </div>
                        <span className="font-medium text-gray-800">{selectedLesson.date}</span>
                        <div className="p-1 rounded-md bg-red-100">
                          <Clock1 size={14} className="text-red-600" />
                        </div>
                        <span>{selectedLesson.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <div className="p-1 rounded-md bg-red-100">
                          <MapPin size={14} className="text-red-600" />
                        </div>
                        <span>{selectedLesson.room}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <div className="p-1 rounded-md bg-red-100">
                          <Users size={14} className="text-red-600" />
                        </div>
                        <span>{selectedLesson.students || stats?.total || 0} HV</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: All Buttons on One Row */}
                <div className="border-t border-gray-200 pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <button
                    onClick={handleBackToSchedule}
                    className="px-3 py-1.5 border border-gray-400 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-gray-50 whitespace-nowrap"
                  >
                    <CalendarDays size={14} />
                    <span>Lịch giảng dạy</span>
                  </button>

                  <button
                    onClick={() => { void handleOpenTeachingReport("syllabus", { openFullSyllabus: true }); }}
                    className="px-3 py-1.5 border border-blue-400 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all hover:shadow-sm text-sm text-blue-600 cursor-pointer bg-blue-50 whitespace-nowrap"
                  >
                    <BookOpen size={14} />
                    <span>Syllabus</span>
                  </button>

                  <button
                    onClick={() => { void handleOpenTeachingReport("lessonPlan"); }}
                    className="px-3 py-1.5 border border-violet-400 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all hover:shadow-sm text-sm text-violet-600 cursor-pointer bg-violet-50 whitespace-nowrap"
                  >
                    <GraduationCap size={14} />
                    <span>Xem giáo án</span>
                  </button>

                  <button
                    onClick={() => { void handleOpenTeachingReport("teachingLog"); }}
                    className="px-3 py-1.5 border border-emerald-400 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all hover:shadow-sm text-sm text-emerald-600 cursor-pointer bg-emerald-50 whitespace-nowrap"
                  >
                    <ClipboardPen size={14} />
                    <span>Xem teaching log</span>
                  </button>

                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving || !isSessionToday}
                    title={!isSessionToday ? "Chỉ có thể điểm danh trong ngày học" : undefined}
                    className={`px-3 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all text-sm whitespace-nowrap ${isSaving || !isSessionToday
                      ? "bg-gray-200 text-gray-500 border border-gray-400 cursor-not-allowed"
                      : "bg-red-50 text-red-600 border border-red-400 hover:shadow-sm cursor-pointer"
                      }`}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        <span>Lưu thay đổi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Not-today banner */}
            {!isSessionToday && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span className="text-base">⚠️</span>
                <span>Chỉ có thể điểm danh trong ngày học. Buổi này không phải hôm nay nên không thể chỉnh sửa.</span>
              </div>
            )}

            {/* Stats Cards */}
            <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102 cursor-pointer">
                <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700"></div>
                <div className="relative flex items-center justify-between gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm flex-shrink-0">
                    <Users size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-600 truncate">Tổng học viên</div>
                    <div className="text-xl font-bold text-gray-900 leading-tight">{stats?.total || 0}</div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102 cursor-pointer">
                <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="relative flex items-center justify-between gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm flex-shrink-0">
                    <CheckCircle size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-600 truncate">Có mặt</div>
                    <div className="text-xl font-bold text-gray-900 leading-tight">{stats?.present || 0}</div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102 cursor-pointer">
                <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-amber-500 to-orange-500"></div>
                <div className="relative flex items-center justify-between gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm flex-shrink-0">
                    <Clock size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-600 truncate">Vắng mặt</div>
                    <div className="text-xl font-bold text-gray-900 leading-tight">{stats?.absent || 0}</div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102 cursor-pointer">
                <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                <div className="relative flex items-center justify-between gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm flex-shrink-0">
                    <TrendingUp size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-600 truncate">Tỷ lệ chuyên cần</div>
                    <div className="text-xl font-bold text-gray-900 leading-tight">
                      {stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      {/* Main Content */}
      {selectedSessionId ? (
        <div className={` transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {/* Student Table */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white to-red-50/30 rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">Danh sách học viên</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm học viên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition bg-white"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | "ALL")}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="present">Có mặt</option>
                      <option value="absent">Vắng mặt</option>
                      <option value="makeup">Học bù</option>
                      <option value="notMarked">Chưa điểm danh</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleExportAttendance}
                      disabled={!filteredRecords.length}
                      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">Xuất</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 w-12">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            ref={selectAllRef}
                            checked={isAllSelected}
                            onChange={handleToggleAll}
                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                        <SortableHeader
                          label="Học viên"
                          column="student"
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Tiến độ</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Ghi chú</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {paginatedRecords.map((record) => {
                      const absenceTypeLabel = getAbsenceTypeLabel(record.absenceType);
                      const shouldCollapseStatus = Boolean(record.hasMakeupCredit) && !expandedStatusRows.has(record.rowKey);

                      return (
                        <tr
                          key={record.rowKey}
                          className="hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-100/50 transition-colors border-b border-gray-100"
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(record.rowKey)}
                              onChange={() => handleToggleStudent(record.rowKey)}
                              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <StudentAvatar name={record.name ?? ""} />
                              <div>
                                <div className="font-semibold text-gray-900">{record.name?.trim() || "(Chưa có tên)"}</div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  {record.phone ? <span>{record.phone}</span> : null}
                                  {record.track ? (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-700">
                                      {String(record.track).toLowerCase() === "secondary" ? "Học phụ" : "Chính thức"}
                                    </span>
                                  ) : null}
                                  {record.isMakeup ? (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                                      Học bù
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              {shouldCollapseStatus ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                                    Nghỉ có bù
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleExpandStatusRow(record.rowKey)}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                                  >
                                    Sửa
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                  {getStatusButtonOrder(record.hasMakeupCredit).map((status) => {
                                    const isActive = record.status === status;
                                    const isSuggestedMakeup =
                                      status === "makeup" && Boolean(record.hasMakeupCredit) && !isActive;
                                    const isLockedByMakeup = (Boolean(record.isMakeup) || record.status === "makeup") && status !== "makeup";
                                    const isLocked = isLockedByMakeup || !isSessionToday;

                                    return (
                                      <button
                                        key={status}
                                        onClick={() => !isLocked && handleStatusChange(record.rowKey, status)}
                                        disabled={isLocked}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                          isLocked
                                            ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                                            : isActive
                                              ? `cursor-pointer ${STATUS_STYLES[status].active}`
                                              : isSuggestedMakeup
                                                ? "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer"
                                                : `border-gray-200 text-gray-600 ${STATUS_STYLES[status].hover} cursor-pointer`
                                        }`}
                                      >
                                        {STATUS_BUTTON_LABELS[status]}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {((record.hasMakeupCredit && !shouldCollapseStatus) || absenceTypeLabel) ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  {record.hasMakeupCredit && !shouldCollapseStatus ? (
                                    <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                                      Có credit bù
                                    </span>
                                  ) : null}
                                  {absenceTypeLabel ? (
                                    <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">
                                      {absenceTypeLabel}
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}

                            </div>
                          </td>

                          <td className="px-4 py-4">
                            {record.studentProfileId ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/${locale}/portal/teacher/program-progressions`)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                              >
                                <TrendingUp size={13} />
                                Xem tiến độ
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">–</span>
                            )}
                          </td>

                          <td className="px-4 py-4 max-w-xs">
                            <div className="flex flex-col gap-2">
                              {record.note ? (
                                <div className="flex items-center gap-1 text-amber-600 text-sm">
                                  <AlertCircle size={14} />
                                  <span className="truncate">{record.note}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">Không có</span>
                              )}

                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenNoteModal(record)}
                                title="Thêm nhận xét buổi học"
                                className={`px-2.5 py-1.5 rounded-lg border transition text-xs font-semibold inline-flex items-center gap-1 ${record.note
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-pointer"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                                  }`}
                              >
                                <MessageSquareText size={14} />
                                Note
                              </button>

                              {record.note ? (
                                <button
                                  onClick={() => handleOpenNoteModal(record)}
                                  className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition cursor-pointer"
                                >
                                  Edit
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredRecords.length === 0 && !loadingAttendance && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-3">
                      <Users size={24} className="text-red-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Không tìm thấy học viên nào</p>
                  </div>
                )}

                {loadingAttendance && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-200 border-t-red-600"></div>
                    </div>
                    <p className="text-gray-500 font-medium">Đang tải danh sách học viên...</p>
                  </div>
                )}

                {attendanceLoadingError && <div className="text-center py-6 text-red-600">{attendanceLoadingError}</div>}

                {saveError && <div className="text-center py-4 text-red-600">{saveError}</div>}

                {totalPages > 1 && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                )}
              </div>
            </div>
          </div>

          {/* Modal Note */}
          <SessionNoteModal
            open={noteModalOpen}
            studentName={selectedStudentForNote?.name || "Học sinh"}
            sessionLabel={selectedLesson ? `${selectedLesson.lesson} • ${selectedLesson.date} • ${selectedLesson.time}` : undefined}
            initialFeedback={
              selectedStudentForNote && selectedSessionId
                ? sessionReports[
                  buildSessionReportKey(selectedSessionId, selectedStudentForNote.studentId, selectedStudentForNote.rowKey)
                ]?.feedback ??
                selectedStudentForNote.note ??
                ""
                : ""
            }
            canEdit={Boolean(
              selectedStudentForNote &&
              selectedSessionId &&
              sessionReports[
                buildSessionReportKey(selectedSessionId, selectedStudentForNote.studentId, selectedStudentForNote.rowKey)
              ]?.reportId,
            )}
            isSubmitting={isSubmittingNote}
            isEnhancing={isEnhancingNote}
            canSubmitForReview={Boolean(
              selectedStudentForNote &&
              selectedSessionId &&
              sessionReports[
                buildSessionReportKey(selectedSessionId, selectedStudentForNote.studentId, selectedStudentForNote.rowKey)
              ]?.reportId &&
              String(
                sessionReports[
                  buildSessionReportKey(selectedSessionId, selectedStudentForNote.studentId, selectedStudentForNote.rowKey)
                ]?.status ?? "",
              ).toUpperCase() !== "REVIEW",
            )}
            isSubmittingForReview={isSubmittingReview}
            isSavingAndSubmitting={isSavingAndSubmitting}
            error={noteModalError}
            onClose={handleCloseNoteModal}
            onSubmit={handleSubmitStudentNote}
            onEnhance={handleEnhanceStudentNote}
            onSubmitForReview={handleSubmitStudentNoteForReview}
            onSaveAndSubmit={handleSaveAndSubmitForReview}
          />

          {/* Teaching Report Modal */}
          {teachingReportOpen && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseTeachingReport} />
              <div className="relative flex h-[72vh] min-h-[560px] max-h-[calc(100vh-2rem)] w-[78vw] min-w-[720px] max-w-[calc(100vw-2rem)] resize flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
                {/* Header - Always show */}
                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-red-200 bg-gradient-to-r from-red-600 to-red-700 text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg p-1.5 bg-white/15">
                      <GraduationCap size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-red-100">{teachingModalEyebrow}</div>
                      <div className="text-sm font-bold line-clamp-1 text-white">
                        {teachingModalTitle}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseTeachingReport}
                    className="rounded-lg p-1.5 transition cursor-pointer text-red-100 hover:bg-white/10 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                {teachingReportLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-600">
                    <Loader2 size={20} className="mr-3 animate-spin text-emerald-600" />
                    Đang tải thông tin giáo án...
                  </div>
                ) : shouldRenderSharedSyllabusBody ? (
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {selectedLesson?.moduleName && (
                        <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">
                          {selectedLesson.moduleName}
                        </span>
                      )}
                      {selectedLesson?.sessionIndexInModule != null && (
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-600">
                          Buổi {selectedLesson.sessionIndexInModule} trong module
                        </span>
                      )}
                      {selectedLesson?.teachingLogStatus && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                          Log: {selectedLesson.teachingLogStatus}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-red-50/40 px-4 py-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Workspace liên thông</div>
                        <div className="text-sm ">Teacher có thể đổi view hoặc vừa nhập teaching log vừa xem syllabus và lesson plan trong cùng modal.</div>
                      </div>
                      {renderTeachingModalViewSwitch()}
                    </div>

                    {teachingSyllabusDetailError ? (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{teachingSyllabusDetailError}</span>
                      </div>
                    ) : null}

                    <div className="border border-red-100 rounded-xl overflow-hidden">
                      <SyllabusDetailModalBody
                        detail={teachingSyllabusDetail}
                        enableCurriculumLessonFilter={Boolean(teachingCurriculumLessonFilter)}
                        defaultCurriculumLesson={teachingCurriculumLessonFilter}
                        defaultCurriculumPeriodValues={[
                          selectedLesson?.sessionIndexInModule,
                          teachingReportTemplate?.sessionOrder,
                          teachingReportSession?.sessionIndexInModule,
                        ]}
                        defaultCurriculumTopicValues={[
                          selectedLesson?.plannedLessonTitle,
                          teachingReportTemplate?.title,
                          teachingReportSession?.templateTitle,
                          selectedLesson?.lesson,
                          selectedLesson?.moduleName,
                          teachingReportSession?.moduleName,
                        ]}
                        curriculumLessonFilterLabel="Lọc theo buổi"
                        collapseSupplementaryContent
                        hideCurriculumLessonSelect
                        supplementaryContentToggleLabel="Xem thông tin chung"
                        hideHeader={true}
                        onClose={handleCloseTeachingReport}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {selectedLesson?.moduleName && (
                        <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">
                          {selectedLesson.moduleName}
                        </span>
                      )}
                      {selectedLesson?.sessionIndexInModule != null && (
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-600">
                          Buổi {selectedLesson.sessionIndexInModule} trong module
                        </span>
                      )}
                      {selectedLesson?.teachingLogStatus && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                          Log: {selectedLesson.teachingLogStatus}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-red-50/40 px-4 py-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Workspace liên thông</div>
                        <div className="text-sm ">Teacher có thể đổi view hoặc vừa nhập teaching log vừa xem syllabus và lesson plan trong cùng modal.</div>
                      </div>
                      {renderTeachingModalViewSwitch()}
                    </div>

                    {(teachingModalView === "lessonPlan" || teachingModalView === "syllabus") && (
                    <div className="space-y-6">
                      <SyllabusSummaryPanel
                        description="Bản đồ nhanh để teacher xác định nội dung buổi học và đối chiếu khi cập nhật teaching log."
                        items={teachingSummaryItems}
                        horizontal={true}
                      />

                      <section id="teaching-lesson-plan" className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
                        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                {teachingModalView === "lessonPlan"
                                  ? "Lesson Plan / Giáo án"
                                  : "Syllabus / Buổi hiện tại"}
                              </div>
                              <h3 className="mt-1 text-lg font-bold text-gray-900">
                                {teachingModalView === "lessonPlan"
                                  ? (teachingReportTemplate?.title || teachingReportSession?.templateTitle || selectedLesson?.plannedLessonTitle || selectedLesson?.lesson || "Nội dung buổi học")
                                  : (teachingReportSession?.templateTitle || selectedLesson?.plannedLessonTitle || selectedLesson?.lesson || "Syllabus tham khảo")}
                              </h3>
                              <p className="mt-1 text-sm text-gray-600">
                                {teachingModalView === "lessonPlan"
                                  ? "Nội dung chuẩn để teacher đối chiếu buổi học với kế hoạch giảng dạy."
                                  : "Khung syllabus chuẩn cho đúng buổi học này. Nếu cần đối chiếu cả curriculum, dùng nút Xem toàn bộ chương trình trong modal."}
                              </p>
                            </div>

                            {teachingModalView === "lessonPlan"
                              ? renderTeachingSourceLink(
                                  lessonPlanSourceHref,
                                  lessonPlanSourceLabel,
                                  "Lesson plan này chưa có attachment URL tải trực tiếp; FE đang giữ file name để đối chiếu.",
                                  "violet",
                                )
                              : renderTeachingSourceLink(
                                  syllabusSourceHref,
                                  syllabusSourceLabel,
                                  "Syllabus này chưa có attachment URL tải trực tiếp; FE đang giữ file name để đối chiếu.",
                                  "blue",
                                )}
                          </div>
                        </div>

                        <div className="space-y-4 p-5">
                          {teachingModalView === "lessonPlan" ? (
                            renderTeachingLessonPlanContent()
                          ) : null}

                          {teachingModalView === "syllabus" && hasTeachingReferenceContent ? (
                            <div id="teaching-reference-source" className="rounded-xl border border-gray-200 bg-gray-50/60">
                              <div className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                                Nguồn tham khảo buổi học (Syllabus + Giáo án dự kiến)
                              </div>
                              <div className="space-y-4 border-t border-gray-200 p-4">
                                {renderTeachingReferenceTabs()}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </section>
                    </div>
                    )}

                    {teachingModalView === "teachingLog" && (
                    <ResizablePanelGroup
                      direction="horizontal"
                      autoSaveId="teacher-attendance-teaching-log-layout"
                      className="min-h-[700px] gap-4"
                    >
                    <ResizablePanel defaultSize={56} minSize={38}>
                    <section id="teaching-log-section" className="h-full rounded-2xl border border-red-100 bg-white shadow-sm">
                      <div className="border-b border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Nhật ký giảng dạy</div>
                        <h3 className="mt-1 text-lg font-bold text-gray-900">Ghi nhận thực tế sau buổi học</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Điền nhanh nội dung đã dạy, học liệu, BTVN và ghi chú chính.
                        </p>
                      </div>

                      <div className="space-y-5 p-5">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700">Progress Status / Tiến độ *</label>
                              <select
                                value={teachingProgressStatus}
                                onChange={(e) => setTeachingProgressStatus(e.target.value as TeachingProgressStatus)}
                                disabled={teachingLogReadOnly}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                              >
                                {TEACHING_PROGRESS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                              <p className="mt-1.5 text-xs text-gray-500">{selectedTeachingProgressOption.hint}</p>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700">Actual Teaching Type / Hình thức dạy</label>
                              <select
                                value={teachingActualTeachingType}
                                onChange={(e) => setTeachingActualTeachingType(e.target.value as TeachingType)}
                                disabled={teachingLogReadOnly}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                              >
                                {TEACHING_TYPE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                              <p className="mt-1.5 text-xs text-gray-500">Chọn loại buổi học thực tế để backend map đúng runtime progression.</p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 font-semibold text-blue-700">
                              {resolvedTeachingLogStatus ? `Log: ${resolvedTeachingLogStatus}` : (resolvedTeachingLogId ? "Chế độ chỉnh sửa" : "Chế độ tạo mới")}
                            </span>
                            <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
                              Tiến độ: {TEACHING_PROGRESS_LABELS[teachingProgressStatus]}
                            </span>
                            <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 font-semibold text-violet-700">
                              Hình thức: {TEACHING_TYPE_LABELS[teachingActualTeachingType]}
                            </span>
                            {teachingLogRecord?.updatedAt ? (
                              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-600">
                                Cập nhật: {new Date(teachingLogRecord.updatedAt).toLocaleString("vi-VN")}
                              </span>
                            ) : null}
                          </div>

                          {teachingLogReadOnly ? (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                              Teaching log đang ở trạng thái {resolvedTeachingLogStatus || "khóa"}. FE chỉ cho phép xem read-only và không gửi cập nhật mới.
                            </div>
                          ) : null}

                          {teachingTemplateGuardMessage ? (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                              {teachingTemplateGuardMessage}
                            </div>
                          ) : null}
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="text-sm font-medium text-gray-700">
                              Hoạt động đã dạy <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => focusTeachingActivity(activeTeachingActivityIndex - 1)}
                                disabled={isFirstTeachingActivity}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <ChevronLeft size={14} />
                                Trước
                              </button>
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                {activeTeachingActivityIndex + 1}/{Math.max(1, teachingActivityDrafts.length)}
                              </span>
                              <button
                                type="button"
                                onClick={() => focusTeachingActivity(activeTeachingActivityIndex + 1)}
                                disabled={isLastTeachingActivity}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Sau
                                <ChevronRight size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTeachingActivityDrafts((prev) => [...prev, createEmptyTeachingActivity()]);
                                  setActiveTeachingActivityIndex(teachingActivityDrafts.length);
                                }}
                                disabled={teachingLogReadOnly}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Plus size={14} />
                                Thêm activity
                              </button>
                            </div>
                          </div>

                          <p className="mb-3 text-xs text-gray-500">
                            Chỉ hiển thị một activity tại một thời điểm để teacher nhập nhanh và tập trung.
                          </p>

                          <div
                            ref={(node) => { teachingActivityRowRefs.current[activeTeachingActivityIndex] = node; }}
                            className="rounded-xl border border-emerald-300 bg-emerald-50/40 p-3 shadow-sm"
                          >
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-700">Hoạt động #{activeTeachingActivityIndex + 1}</p>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleInsertFromLessonPlanRow(activeTeachingActivityIndex, activeTeachingActivityIndex)}
                                  disabled={teachingLogReadOnly}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                  title="Chèn dữ liệu từ Lesson Plan"
                                >
                                  <GraduationCap size={13} />
                                  <span>Chèn giáo án</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyFromSyllabusRow(activeTeachingActivityIndex)}
                                  disabled={teachingLogReadOnly}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                  title="Sao chép từ Khung syllabus"
                                >
                                  <ArrowRightLeft size={13} />
                                  <span>Sao chép syllabus</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...teachingActivityDrafts];
                                    updated.splice(activeTeachingActivityIndex + 1, 0, { ...activeTeachingActivity });
                                    setTeachingActivityDrafts(updated);
                                    setActiveTeachingActivityIndex(activeTeachingActivityIndex + 1);
                                  }}
                                  disabled={teachingLogReadOnly}
                                  className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                  title="Nhân bản activity"
                                >
                                  <Copy size={13} />
                                </button>
                                {teachingActivityDrafts.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTeachingActivityDrafts((prev) => prev.filter((_, i) => i !== activeTeachingActivityIndex));
                                      setActiveTeachingActivityIndex((prev) => Math.max(0, Math.min(prev, teachingActivityDrafts.length - 2)));
                                    }}
                                    disabled={teachingLogReadOnly}
                                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Xóa activity"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Thời lượng *</label>
                                <input
                                  value={activeTeachingActivity.time}
                                  onChange={(e) => setActiveTeachingActivityField("time", e.target.value)}
                                  readOnly={teachingLogReadOnly}
                                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 ${
                                    activeTeachingActivityErrors.time ? "border-red-300 bg-red-50 focus:ring-red-200" : "border-gray-200 bg-white focus:ring-red-100"
                                  }`}
                                  placeholder="5 phút"
                                />
                                {activeTeachingActivityErrors.time ? <p className="mt-1 text-[11px] text-red-600">{activeTeachingActivityErrors.time}</p> : null}
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Hoạt động *</label>
                                <textarea
                                  value={activeTeachingActivity.classwork}
                                  onChange={(e) => setActiveTeachingActivityField("classwork", e.target.value)}
                                  readOnly={teachingLogReadOnly}
                                  rows={2}
                                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 ${
                                    activeTeachingActivityErrors.classwork ? "border-red-300 bg-red-50 focus:ring-red-200" : "border-gray-200 bg-white focus:ring-red-100"
                                  }`}
                                  placeholder="Mô tả hoạt động chính"
                                />
                                {activeTeachingActivityErrors.classwork ? <p className="mt-1 text-[11px] text-red-600">{activeTeachingActivityErrors.classwork}</p> : null}
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Học liệu *</label>
                                <textarea
                                  value={activeTeachingActivity.requiredMaterials}
                                  onChange={(e) => setActiveTeachingActivityField("requiredMaterials", e.target.value)}
                                  readOnly={teachingLogReadOnly}
                                  rows={2}
                                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 ${
                                    activeTeachingActivityErrors.requiredMaterials ? "border-red-300 bg-red-50 focus:ring-red-200" : "border-gray-200 bg-white focus:ring-red-100"
                                  }`}
                                  placeholder="Flashcards, projector..."
                                />
                                {activeTeachingActivityErrors.requiredMaterials ? <p className="mt-1 text-[11px] text-red-600">{activeTeachingActivityErrors.requiredMaterials}</p> : null}
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">BTVN *</label>
                                <textarea
                                  value={activeTeachingActivity.homeworkRequiredMaterials}
                                  onChange={(e) => setActiveTeachingActivityField("homeworkRequiredMaterials", e.target.value)}
                                  readOnly={teachingLogReadOnly}
                                  rows={2}
                                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 ${
                                    activeTeachingActivityErrors.homeworkRequiredMaterials ? "border-red-300 bg-red-50 focus:ring-red-200" : "border-gray-200 bg-white focus:ring-red-100"
                                  }`}
                                  placeholder="Bài tập về nhà"
                                />
                                {activeTeachingActivityErrors.homeworkRequiredMaterials ? <p className="mt-1 text-[11px] text-red-600">{activeTeachingActivityErrors.homeworkRequiredMaterials}</p> : null}
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Trang sách / Kỹ năng</label>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <input
                                    value={activeTeachingActivity.book}
                                    onChange={(e) => setActiveTeachingActivityField("book", e.target.value)}
                                    readOnly={teachingLogReadOnly}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
                                    placeholder="Student's Book p.6"
                                  />
                                  <input
                                    value={activeTeachingActivity.skills}
                                    onChange={(e) => setActiveTeachingActivityField("skills", e.target.value)}
                                    readOnly={teachingLogReadOnly}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
                                    placeholder="Speaking & Reading"
                                  />
                                </div>
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Ghi chú</label>
                                <textarea
                                  value={activeTeachingActivity.extra}
                                  onChange={(e) => setActiveTeachingActivityField("extra", e.target.value)}
                                  readOnly={teachingLogReadOnly}
                                  rows={2}
                                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 read-only:bg-gray-50"
                                  placeholder="Ghi chú thêm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">Homework Assigned / Bài tập giao</label>
                          <textarea
                            value={teachingActualHomework}
                            onChange={(e) => setTeachingActualHomework(e.target.value)}
                            readOnly={teachingLogReadOnly}
                            rows={2}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
                            placeholder="VD: Ex 1, 2, 3 page 7; học thuộc vocabulary của Unit 1"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">Teacher Note / Evaluation / Ghi chú và đánh giá</label>
                          <textarea
                            value={teachingTeacherNotes}
                            onChange={(e) => setTeachingTeacherNotes(e.target.value)}
                            readOnly={teachingLogReadOnly}
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
                            placeholder="VD: Một số học sinh nhầm mouse/mice; cần thêm 5 phút cho speaking ở buổi sau"
                          />
                        </div>

                        {teachingReportError ? (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {teachingReportError}
                          </div>
                        ) : null}
                      </div>
                    </section>
                    </ResizablePanel>
                    <ResizableHandle withHandle className="bg-gray-200/80" />
                    <ResizablePanel defaultSize={44} minSize={28}>
                    <aside className="h-full space-y-4">
                      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Tài liệu tham chiếu</div>
                            <div className="text-xs text-gray-600">Giữ một khung tham chiếu duy nhất khi nhập teaching log.</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setTeachingSyllabusSummaryPopoverOpen((prev) => !prev)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                              >
                                <Search size={13} />
                                Tóm tắt syllabus
                              </button>
                              {teachingSyllabusSummaryPopoverOpen ? (
                                <div className="absolute right-0 top-10 z-20 w-[320px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                                  <SyllabusSummaryPanel
                                    description="Bản đồ nhanh để teacher xác định nội dung buổi học và đối chiếu khi cập nhật teaching log."
                                    items={teachingSummaryItems}
                                  />
                                </div>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => setTeachingQuickReferenceView("lessonPlan")}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold cursor-pointer ${
                                teachingQuickReferenceView === "lessonPlan"
                                  ? "border-violet-200 bg-violet-100 text-violet-700"
                                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <GraduationCap size={13} />
                              Giáo án
                            </button>
                            <button
                              type="button"
                              onClick={() => setTeachingQuickReferenceView("syllabus")}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold cursor-pointer ${
                                teachingQuickReferenceView === "syllabus"
                                  ? "border-blue-200 bg-blue-100 text-blue-700"
                                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <BookOpen size={13} />
                              Syllabus
                            </button>
                            <button
                              type="button"
                              onClick={() => setTeachingModalView(teachingQuickReferenceView)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                              Mở riêng
                            </button>
                          </div>
                        </div>

                        <div className="max-h-[620px] overflow-auto p-4">
                          {teachingQuickReferenceView === "lessonPlan" ? (
                            <div className="space-y-4">
                              {lessonPlanReferenceActivities.length > 0 ? (
                                <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3">
                                  <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                      <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">Procedure tham chiếu</div>
                                      <div className="text-[11px] text-gray-600">Chèn nhanh vào activity đang nhập.</div>
                                    </div>
                                    <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                      Activity #{activeTeachingActivityIndex + 1}
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {lessonPlanReferenceActivities.map((reference, index) => (
                                      <div
                                        key={`lesson-plan-reference-${index}`}
                                        onClick={() => focusTeachingActivity(index)}
                                        className={`rounded-lg border p-2.5 cursor-pointer transition-colors ${
                                          activeTeachingActivityIndex === index
                                            ? "border-violet-300 bg-white shadow-sm"
                                            : "border-violet-100 bg-white/80 hover:bg-white"
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0 flex-1">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                                              {reference.time || `Mục ${index + 1}`}
                                            </div>
                                            <div className="mt-1 whitespace-pre-wrap text-xs leading-5 text-gray-700">
                                              {reference.classwork || reference.skills || "Không có mô tả chi tiết."}
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleInsertFromLessonPlanRow(index);
                                            }}
                                            disabled={teachingLogReadOnly}
                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                            title="Chèn vào activity hiện tại"
                                          >
                                            <ArrowRightLeft size={12} />
                                            Chèn
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {renderTeachingLessonPlanContent()}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {hasTeachingReferenceContent ? renderTeachingReferenceTabs() : (
                                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
                                  Chưa có dữ liệu syllabus tham chiếu cho buổi này.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </aside>
                    </ResizablePanel>
                    </ResizablePanelGroup>
                    )}
                  </div>
                )}

                {/* Footer Actions - sticky bottom */}
                {!teachingReportLoading && (
                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4 bg-white">
                    <button
                      type="button"
                      onClick={handleCloseTeachingReport}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    {teachingModalView === "teachingLog" && (
                      <button
                        type="button"
                        onClick={handleSubmitTeachingReport}
                        disabled={teachingReportSubmitting || !selectedSessionId || teachingLogReadOnly || Boolean(teachingTemplateGuardMessage)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {teachingReportSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                        {teachingLogReadOnly
                          ? "Teaching Log đã khóa"
                          : teachingTemplateGuardMessage
                            ? "Thiếu planned template"
                            : "Lưu Teaching Log"}
                      </button>
                    )}
                  </div>
                )}
                <div aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 rounded-sm border-b-2 border-r-2 border-gray-300/80" />
              </div>
            </div>,
          document.body)}
        </div>
      ) : null}
    </div>
  );
}
