"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { updateAdminSession, changeSessionSectionType } from "@/app/api/admin/sessions";
import { SECTION_TYPE_LABELS, SECTION_TYPE_OPTIONS } from "@/types/admin/sessions";
import type { SectionType } from "@/types/admin/sessions";
import { useToast } from "@/hooks/use-toast";
import { getAccessToken } from "@/lib/store/authToken";
import { getLessonPlanTemplateById } from "@/lib/api/lessonPlanService";
import type { LessonPlanTemplate } from "@/lib/api/lessonPlanService";
import LessonPlanTemplateDocument from "@/components/lesson-plans/LessonPlanTemplateDocument";
import SyllabusSummaryPanel from "@/components/lesson-plans/SyllabusSummaryPanel";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Save,
  X,
  Loader2,
  AlertCircle,
  GraduationCap,
  ClipboardList,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
  fetchSessionDetail,
  fetchAttendance,
  saveAttendance,
} from "@/app/api/teacher/attendance";
import type {
  AttendanceStatus,
  Student,
  LessonDetail,
  AttendanceSummaryApi,
} from "@/types/teacher/attendance";

type TeachingLogData = {
  teachingLogId?: string | null;
  sessionId?: string | null;
  plannedLessonPlanTemplateId?: string | null;
  plannedLessonTitle?: string | null;
  actualLessonPlanTemplateId?: string | null;
  actualLessonTitle?: string | null;
  teachingLogStatus?: string | null;
  progressStatus?: string | null;
  actualTeachingType?: string | null;
  actualContent?: string | null;
  actualHomework?: string | null;
  teacherNote?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  activities?: TeachingLogActivity[];
};

type TeachingLogActivity = {
  time: string | null;
  book: string | null;
  skills: string | null;
  classwork: string | null;
  requiredMaterials: string | null;
  homeworkRequiredMaterials: string | null;
  extra: string | null;
};

function pickFirstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function normalizeTeachingLogActivities(value: unknown): TeachingLogActivity[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((activity) => {
      if (!activity || typeof activity !== "object" || Array.isArray(activity)) {
        return null;
      }

      const item = activity as Record<string, unknown>;
      return {
        time: pickFirstNonEmptyString(item.time, item.Time, item.duration),
        book: pickFirstNonEmptyString(item.book, item.Book, item.page),
        skills: pickFirstNonEmptyString(item.skills, item.Skills, item.skill),
        classwork: pickFirstNonEmptyString(
          item.classwork,
          item.Classwork,
          item.completedActivities,
          item.actualContent,
        ),
        requiredMaterials: pickFirstNonEmptyString(
          item.requiredMaterials,
          item.RequiredMaterials,
          item.materials,
        ),
        homeworkRequiredMaterials: pickFirstNonEmptyString(
          item.homeworkRequiredMaterials,
          item.HomeworkRequiredMaterials,
          item.homeworkMaterials,
        ),
        extra: pickFirstNonEmptyString(item.extra, item.Extra, item.note, item.notes),
      };
    })
    .filter((activity): activity is TeachingLogActivity => {
      if (!activity) return false;
      return Object.values(activity).some((value) => String(value ?? "").trim());
    });
}

function parseJsonObject(input: unknown): Record<string, any> | null {
  if (!input) return null;
  if (typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, any>;
  }
  if (typeof input !== "string") return null;
  const text = input.trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, any>)
      : null;
  } catch {
    return null;
  }
}

function normalizeTeachingLog(raw: any): TeachingLogData | null {
  if (!raw || typeof raw !== "object") return null;

  const contentObject = parseJsonObject(
    raw?.actualContent ?? raw?.ActualContent ?? raw?.realContent ?? raw?.deliveredContent,
  );
  const activities = normalizeTeachingLogActivities(contentObject?.activities);

  const activityText = activities.length
    ? activities
        .map((activity) =>
          [
            activity.classwork,
            activity.requiredMaterials,
            activity.homeworkRequiredMaterials,
            activity.extra,
          ]
            .filter((value) => typeof value === "string" && value.trim())
            .map((value) => String(value).trim())
            .join("\n"),
        )
        .filter(Boolean)
        .join("\n\n")
    : "";

  const homeworkFromContent = Array.isArray(contentObject?.homeworkNotes)
    ? contentObject.homeworkNotes.join("\n")
    : typeof contentObject?.homeworkNotes === "string"
      ? contentObject.homeworkNotes
      : null;

  const notesFromContent = pickFirstNonEmptyString(
    contentObject?.teacherNotes,
    contentObject?.teacherNote,
    contentObject?.notes,
    contentObject?.note,
  );

  return {
    teachingLogId: pickFirstNonEmptyString(raw?.teachingLogId, raw?.id, raw?.teachingLogID),
    sessionId: pickFirstNonEmptyString(raw?.sessionId, raw?.SessionId),
    plannedLessonPlanTemplateId: pickFirstNonEmptyString(raw?.plannedLessonPlanTemplateId, raw?.PlannedLessonPlanTemplateId),
    plannedLessonTitle: pickFirstNonEmptyString(raw?.plannedLessonTitle, raw?.PlannedLessonTitle),
    actualLessonPlanTemplateId: pickFirstNonEmptyString(raw?.actualLessonPlanTemplateId, raw?.ActualLessonPlanTemplateId),
    actualLessonTitle: pickFirstNonEmptyString(raw?.actualLessonTitle, raw?.ActualLessonTitle),
    teachingLogStatus: pickFirstNonEmptyString(raw?.teachingLogStatus, raw?.TeachingLogStatus, raw?.status),
    progressStatus: pickFirstNonEmptyString(raw?.progressStatus, raw?.ProgressStatus),
    actualTeachingType: pickFirstNonEmptyString(raw?.actualTeachingType, raw?.ActualTeachingType),
    actualContent: pickFirstNonEmptyString(
      raw?.actualContent,
      raw?.ActualContent,
      raw?.realContent,
      raw?.deliveredContent,
      activityText,
    ),
    actualHomework: pickFirstNonEmptyString(
      raw?.actualHomework,
      raw?.ActualHomework,
      raw?.homework,
      raw?.actualHomeWork,
      homeworkFromContent,
    ),
    teacherNote: pickFirstNonEmptyString(
      raw?.teacherNote,
      raw?.TeacherNote,
      raw?.teacherNotes,
      raw?.TeacherNotes,
      raw?.notes,
      raw?.note,
      notesFromContent,
    ),
    submittedBy: pickFirstNonEmptyString(raw?.submittedBy, raw?.SubmittedBy),
    submittedAt: pickFirstNonEmptyString(raw?.submittedAt, raw?.SubmittedAt),
    updatedAt: pickFirstNonEmptyString(raw?.updatedAt, raw?.UpdatedAt),
    activities,
  };
}

async function fetchTeachingLog(sessionId: string): Promise<TeachingLogData | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`/api/sessions/${sessionId}/teaching-log`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const payload = json?.data?.teachingLog ?? json?.teachingLog ?? json?.data ?? json;
    return normalizeTeachingLog(payload);
  } catch {
    return null;
  }
}

const PROGRESS_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: "Hoàn thành", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  partial: { label: "Dạy một phần", color: "text-amber-700 bg-amber-50 border-amber-200" },
  not_started: { label: "Chưa dạy", color: "text-gray-600 bg-gray-50 border-gray-200" },
  skipped: { label: "Bỏ qua", color: "text-red-600 bg-red-50 border-red-200" },
};

const TEACHING_TYPE_LABELS: Record<string, string> = {
  normal: "Dạy mới", review: "Ôn tập", test: "Kiểm tra",
  makeup: "Học bù", event: "Sự kiện", other: "Khác",
};

function formatTeachingLogDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function TeachingLogDetails({
  teachingLog,
  lesson,
  progressInfo,
}: {
  teachingLog: TeachingLogData;
  lesson: LessonDetail;
  progressInfo: { label: string; color: string } | null;
}) {
  const activities =
    teachingLog.activities?.length
      ? teachingLog.activities
      : normalizeTeachingLogActivities(parseJsonObject(teachingLog.actualContent)?.activities);
  const submittedAt = formatTeachingLogDate(teachingLog.submittedAt || teachingLog.updatedAt);
  const actualContentFallback = activities.length ? null : teachingLog.actualContent;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {progressInfo && (
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${progressInfo.color}`}>
              {progressInfo.label}
            </span>
          )}
          {teachingLog.actualTeachingType && (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {TEACHING_TYPE_LABELS[teachingLog.actualTeachingType.toLowerCase()] ?? teachingLog.actualTeachingType}
            </span>
          )}
          {teachingLog.teachingLogStatus && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              {teachingLog.teachingLogStatus}
            </span>
          )}
        </div>

        {teachingLog.actualLessonTitle && teachingLog.actualLessonTitle !== lesson.plannedLessonTitle && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
              Actual Lesson / Bài thực tế dạy
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">
              {teachingLog.actualLessonTitle}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            <ClipboardList size={14} className="text-red-600" />
            Completed Activities / Nội dung đã dạy
          </div>

          {activities.length ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="hidden grid-cols-[4rem_5rem_6rem_1fr] border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 md:grid">
                <div className="border-r border-slate-200 px-3 py-2">Time</div>
                <div className="border-r border-slate-200 px-3 py-2">Book</div>
                <div className="border-r border-slate-200 px-3 py-2">Skills</div>
                <div className="px-3 py-2">Nội dung</div>
              </div>

              <div className="divide-y divide-slate-100">
                {activities.map((activity, index) => (
                  <div
                    key={`teaching-log-activity-${index}`}
                    className="grid gap-3 bg-white px-3 py-3 text-sm md:grid-cols-[4rem_5rem_6rem_1fr] md:gap-0 md:px-0 md:py-0"
                  >
                    <div className="font-semibold text-red-600 md:border-r md:border-slate-100 md:px-3 md:py-3">
                      {activity.time || "-"}
                    </div>
                    <div className="text-slate-700 md:border-r md:border-slate-100 md:px-3 md:py-3">
                      <span className="md:hidden text-xs font-semibold text-slate-500">Book: </span>
                      {activity.book || "-"}
                    </div>
                    <div className="text-slate-700 md:border-r md:border-slate-100 md:px-3 md:py-3">
                      <span className="md:hidden text-xs font-semibold text-slate-500">Skills: </span>
                      {activity.skills || "-"}
                    </div>
                    <div className="space-y-2 text-slate-700 md:px-3 md:py-3">
                      {activity.classwork && (
                        <p className="whitespace-pre-wrap leading-6">{activity.classwork}</p>
                      )}
                      {activity.requiredMaterials && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                          <span className="font-semibold">Học liệu: </span>
                          {activity.requiredMaterials}
                        </div>
                      )}
                      {activity.homeworkRequiredMaterials && (
                        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          <span className="font-semibold">BTVN: </span>
                          {activity.homeworkRequiredMaterials}
                        </div>
                      )}
                      {activity.extra && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <span className="font-semibold">Ghi chú: </span>
                          {activity.extra}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : actualContentFallback ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
              {actualContentFallback}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Chưa có nội dung đã dạy.
            </div>
          )}
        </div>

        {(teachingLog.actualHomework || teachingLog.teacherNote) && (
          <div className="grid gap-3 md:grid-cols-2">
            {teachingLog.actualHomework && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Homework Assigned / Bài tập giao
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {teachingLog.actualHomework}
                </p>
              </div>
            )}
            {teachingLog.teacherNote && (
              <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-violet-700">
                  Teacher Note / Ghi chú giáo viên
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {teachingLog.teacherNote}
                </p>
              </div>
            )}
          </div>
        )}

        {submittedAt && (
          <div className="border-t border-slate-100 pt-3 text-xs text-slate-400">
            Nộp lúc: {submittedAt}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lesson Plan Drawer ────────────────────────────────────────────────────────
function LessonPlanDrawer({
  sessionId,
  lesson,
  onClose,
}: {
  sessionId: string;
  lesson: LessonDetail;
  onClose: () => void;
}) {
  const [teachingLog, setTeachingLog] = useState<TeachingLogData | null>(null);
  const [template, setTemplate] = useState<LessonPlanTemplate | null>(null);
  const [loadingLog, setLoadingLog] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingLog(true);
    setLogError(null);
    fetchTeachingLog(sessionId).then((log) => {
      if (cancelled) return;
      setTeachingLog(log);
      setLoadingLog(false);
    }).catch(() => {
      if (!cancelled) { setLogError("Không thể tải teaching log."); setLoadingLog(false); }
    });
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    const templateId = lesson.lessonPlanTemplateId;
    if (!templateId) return;
    let cancelled = false;
    setLoadingTemplate(true);
    getLessonPlanTemplateById(templateId).then((res) => {
      if (!cancelled) { setTemplate(res.data ?? null); setLoadingTemplate(false); }
    }).catch(() => {
      if (!cancelled) setLoadingTemplate(false);
    });
    return () => { cancelled = true; };
  }, [lesson.lessonPlanTemplateId]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
  }, [onClose]);

  const progressInfo = teachingLog?.progressStatus
    ? PROGRESS_STATUS_LABELS[teachingLog.progressStatus.toLowerCase()] ?? null
    : null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={drawerRef}
        className="relative flex w-full max-w-6xl max-h-[90vh] flex-col bg-white shadow-2xl overflow-hidden rounded-2xl"
        style={{ animation: "scaleIn 0.18s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-red-50 to-white px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-red-100 p-1.5">
              <GraduationCap size={18} className="text-red-600" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lesson Plan / Giáo án buổi học</div>
              <div className="text-sm font-bold text-gray-900 line-clamp-1">
                {lesson.plannedLessonTitle ?? lesson.lesson}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* Curriculum info row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {lesson.moduleName && (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">
                {lesson.moduleName}
              </span>
            )}
            {lesson.sessionIndexInModule != null && (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-600">
                Buổi {lesson.sessionIndexInModule} trong module
              </span>
            )}
            {lesson.teachingLogStatus && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                Log: {lesson.teachingLogStatus}
              </span>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_320px]">
            <section className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  <FileText size={13} /> Lesson Plan / Giáo án
                </div>
                <p className="mt-2 text-sm text-gray-600">Nội dung chuẩn để admin đối chiếu buổi học với kế hoạch giảng dạy.</p>
              </div>

              <div className="p-5">
                {loadingTemplate ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                    <Loader2 size={14} className="animate-spin" /> Đang tải lesson plan...
                  </div>
                ) : !lesson.lessonPlanTemplateId ? (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Buổi này chưa được gắn lesson plan template từ curriculum.
                  </div>
                ) : !template ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Không thể tải nội dung lesson plan.
                  </div>
                ) : (
                  <LessonPlanTemplateDocument template={template} />
                )}
              </div>
            </section>

            <aside>
              <SyllabusSummaryPanel
                description="Bản đồ nhanh để admin xác định buổi học đang nằm ở đâu trong chương trình."
                items={[
                  { label: "Course / Chương trình", value: template?.programName || lesson.course || null },
                  { label: "Unit / Module", value: template?.lessonPlanUnitName || lesson.moduleName || null },
                  { label: "Lesson / Buổi", value: template?.sessionOrder != null ? `Lesson ${template.sessionOrder}` : lesson.sessionIndexInModule != null ? `Lesson ${lesson.sessionIndexInModule}` : null },
                  { label: "Topic / Chủ điểm", value: lesson.plannedLessonTitle || template?.title || lesson.lesson || null },
                  { label: "Date / Ngày", value: lesson.date || null },
                  { label: "Time / Giờ", value: lesson.time || null },
                  { label: "Teacher / Giáo viên", value: lesson.teacher || null },
                  { label: "Room / Phòng", value: lesson.room || null },
                ]}
              />
            </aside>
          </div>

          {/* ── Teaching Log ───────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                <ClipboardList size={13} /> Teaching Log / Nhật ký giảng dạy
              </div>
              <p className="mt-2 text-sm text-gray-600">Dữ liệu thực tế sau buổi học để admin đối chiếu với lesson plan chuẩn.</p>
            </div>
            <div className="p-5">
            {loadingLog ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                <Loader2 size={14} className="animate-spin" /> Đang tải teaching log...
              </div>
            ) : logError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{logError}</div>
            ) : !teachingLog || !teachingLog.teachingLogId ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <AlertCircle size={14} className="text-gray-400" />
                Chưa có teaching log cho buổi này.
              </div>
            ) : (
              <TeachingLogDetails
                teachingLog={teachingLog}
                lesson={lesson}
                progressInfo={progressInfo}
              />
            )}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function buildSessionUpdateSchedule(lesson: LessonDetail | null): { plannedDatetime: string; durationMinutes: number } | null {
  if (!lesson) return null;

  const dateParts = String(lesson.date ?? "").split("/").map((part) => part.trim());
  if (dateParts.length !== 3) return null;
  const [dd, mm, yyyy] = dateParts;
  if (!dd || !mm || !yyyy) return null;
  const dateIso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;

  const [startRaw = "", endRaw = ""] = String(lesson.time ?? "").split("-").map((part) => part.trim());
  if (!/^\d{1,2}:\d{2}$/.test(startRaw)) return null;
  const [startHour, startMinute] = startRaw.split(":").map(Number);
  if ([startHour, startMinute].some((value) => Number.isNaN(value))) return null;

  let durationMinutes = 60;
  if (/^\d{1,2}:\d{2}$/.test(endRaw)) {
    const [endHour, endMinute] = endRaw.split(":").map(Number);
    const diff = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    if (Number.isFinite(diff) && diff > 0) {
      durationMinutes = diff;
    }
  }

  const startTime = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;
  return {
    plannedDatetime: `${dateIso}T${startTime}:00`,
    durationMinutes,
  };
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const map = {
    present: {
      text: "Có mặt",
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    makeup: {
      text: "Học bù",
      cls: "bg-sky-50 text-sky-700 border border-sky-200",
    },
    absent: {
      text: "Vắng",
      cls: "bg-red-50 text-red-700 border border-red-200",
    },
    notMarked: {
      text: "Chưa điểm danh",
      cls: "bg-amber-50 text-amber-700 border border-amber-200",
    },
  } as const;
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${map[status].cls}`}
    >
      {map[status].text}
    </span>
  );
}

function AbsencePie({ value }: { value: number }) {
  const size = 32;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative w-8 h-8">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={4}
          className="text-gray-200"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={4}
          className="text-red-600"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-red-600">
          {Math.round(clamped)}%
        </span>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 3) {
        pages.push(2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Hiển thị{" "}
          <span className="font-semibold text-gray-900">{startItem}</span> -{" "}
          <span className="font-semibold text-gray-900">{endItem}</span>{" "}
          trong tổng số{" "}
          <span className="font-semibold text-gray-900">{totalItems}</span> học
          viên
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg border transition-all ${
              currentPage === 1
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-red-200 text-gray-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"
            }`}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-gray-400"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                      : "border border-red-200 hover:bg-red-50 text-gray-700"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg border transition-all ${
              currentPage === totalPages
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-red-200 text-gray-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const lessonId = (params.id as string) || "";

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [attendanceSummary, setAttendanceSummary] =
    useState<AttendanceSummaryApi>(null);
  const [list, setList] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudents, setEditedStudents] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingSectionType, setIsUpdatingSectionType] = useState(false);
  const [pendingSectionType, setPendingSectionType] = useState<SectionType>("Normal");
  const [showLessonPlanDrawer, setShowLessonPlanDrawer] = useState(false);
  const { toast } = useToast();
  const itemsPerPage = 10;

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    setPendingSectionType((lesson?.sectionType as SectionType) ?? "Normal");
  }, [lesson?.sectionType]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (!lessonId) {
          setError("Thiếu mã buổi dạy.");
          setLoading(false);
          return;
        }

        const [sessionDetail, attendance] = await Promise.all([
          fetchSessionDetail(lessonId, controller.signal),
          fetchAttendance(lessonId, controller.signal),
        ]);

        if (!controller.signal.aborted) {
          setLesson(sessionDetail.lesson);
          setAttendanceSummary(attendance.attendanceSummary);
          setList(attendance.students);
          setCurrentPage(1);
        }
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error(
          "Unexpected error when fetching session detail or attendance:",
          err
        );
        setError(
          err.message ||
            "Đã xảy ra lỗi khi tải dữ liệu buổi dạy. Vui lòng thử lại."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (lessonId) {
      fetchData();
    } else {
      setLoading(false);
      setError("Thiếu mã buổi dạy.");
    }

    return () => controller.abort();
  }, [lessonId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    return list.filter(
      (s) =>
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [list, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = isEditing
    ? editedStudents.slice(startIndex, endIndex)
    : filtered.slice(startIndex, endIndex);

  const handleStartEdit = useCallback(() => {
    setEditedStudents([...list]);
    setIsEditing(true);
    setSaveMsg(null);
  }, [list]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedStudents([]);
    setSaveMsg(null);
  }, []);

  const handleStatusChange = useCallback((studentId: string, newStatus: AttendanceStatus) => {
    setEditedStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  }, []);

  const handleNoteChange = useCallback((studentId: string, note: string) => {
    setEditedStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, note } : s))
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!lessonId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      // Check if any student has been marked already (update vs create)
      const anyMarked = list.some((s) => s.status && s.status !== "notMarked");
      await saveAttendance(lessonId, editedStudents, !anyMarked);
      // Refresh data
      const attendance = await fetchAttendance(lessonId);
      setList(attendance.students);
      setAttendanceSummary(attendance.attendanceSummary);
      setIsEditing(false);
      setEditedStudents([]);
      setSaveMsg({ type: "success", text: "Đã lưu điểm danh thành công" });
    } catch (err: any) {
      const msg = err?.message ?? "Có lỗi xảy ra khi lưu điểm danh";
      setSaveMsg({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [lessonId, editedStudents, list]);

  const handleSectionTypeSave = useCallback(async () => {
    if (!lessonId) return;
    if ((lesson?.sectionType ?? "Normal") === pendingSectionType) return;

    try {
      setIsUpdatingSectionType(true);

      await changeSessionSectionType({ sessionId: lessonId, sectionType: pendingSectionType });
      setLesson((prev) => (prev ? { ...prev, sectionType: pendingSectionType } : prev));
      toast({ title: "Cập nhật thành công", description: `Đã đổi loại buổi học sang "${SECTION_TYPE_LABELS[pendingSectionType]}".`, variant: "success" });
    } catch (err: any) {
      toast({
        title: "Không thể cập nhật",
        description: err?.message || "Không thể đổi loại buổi học. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSectionType(false);
    }
  }, [lesson, lesson?.sectionType, lessonId, pendingSectionType]);

  const totalStudentsCount = attendanceSummary?.totalStudents ?? list.length;
  const checkedCount =
    attendanceSummary?.totalStudents != null &&
    attendanceSummary?.notMarkedCount != null
      ? Math.max(
          0,
          attendanceSummary.totalStudents - attendanceSummary.notMarkedCount
        )
      : list.filter((s) => s.status && s.status !== "notMarked").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Đang tải thông tin buổi dạy...
          </h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Có lỗi xảy ra</h2>
          <p className="text-gray-600">{error}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => router.refresh()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition cursor-pointer"
            >
              Thử lại
            </button>
            <button
              onClick={() =>
                router.push(`/${locale}/portal/admin/schedule`)
              }
              className="px-5 py-2.5 rounded-xl bg-white border border-red-200 text-gray-800 hover:border-red-300 transition cursor-pointer"
            >
              Quay lại lịch dạy
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Không tìm thấy buổi học
          </h2>
          <p className="text-gray-600">
            Buổi học không tồn tại hoặc đã bị xoá.
          </p>
          <button
            onClick={() => router.push(`/${locale}/portal/admin/schedule`)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition cursor-pointer"
          >
            Quay lại lịch dạy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6">
      <div className={`flex items-center justify-between mb-6 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <button
          onClick={() => router.push(`/${locale}/portal/admin/schedule`)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition border-0 cursor-pointer"
        >
          <ArrowLeft size={20} />
          <span>Quay lại lịch dạy</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLessonPlanDrawer(true)}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <GraduationCap size={16} /> Xem giáo án
          </button>
          <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition flex items-center gap-2 cursor-pointer">
            <Download size={16} /> Xuất danh sách
          </button>
        </div>
      </div>

      {/* Lesson Info */}
      <div className={`bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-6 shadow-sm mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl text-white shadow-lg">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {lesson.lesson}
              </h1>
              {/* Curriculum info */}
              {(lesson.plannedLessonTitle || lesson.moduleName || lesson.sessionIndexInModule != null) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {lesson.moduleName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                      <BookOpen size={12} /> {lesson.moduleName}
                    </span>
                  )}
                  {lesson.plannedLessonTitle && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {lesson.plannedLessonTitle}
                    </span>
                  )}
                  {lesson.sessionIndexInModule != null && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500">
                      Buổi {lesson.sessionIndexInModule} trong module
                    </span>
                  )}
                </div>
              )}
              {!lesson.plannedLessonTitle && !lesson.moduleName && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle size={12} /> Chưa có giáo án curriculum cho buổi này
                </p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-gray-700 mt-2">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={16} className="text-red-600" />{" "}
                  {lesson.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={16} className="text-red-600" /> {lesson.time}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={16} className="text-red-600" /> {lesson.room}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={16} className="text-red-600" />{" "}
                  {lesson.students} HV
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {lesson.branch && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    {lesson.branch}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Loại buổi học</div>
                <div className="flex flex-wrap gap-2">
                  {SECTION_TYPE_OPTIONS.map((opt) => {
                    const isActive = pendingSectionType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isUpdatingSectionType}
                        onClick={() => {
                          setPendingSectionType(opt.value);
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          isActive
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {(lesson.sectionType ?? "Normal") !== pendingSectionType ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <span className="text-xs text-amber-800">
                      Đổi sang <strong>{SECTION_TYPE_LABELS[pendingSectionType]}</strong>?
                    </span>
                    <button
                      type="button"
                      disabled={isUpdatingSectionType}
                      onClick={handleSectionTypeSave}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingSectionType ? "Đang cập nhật..." : "Xác nhận"}
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingSectionType}
                      onClick={() => { setPendingSectionType((lesson.sectionType as SectionType) ?? "Normal"); }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Loại hiện tại: {lesson.sectionType ?? "Normal"}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Tổng sĩ số</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalStudentsCount ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="text-sm text-emerald-700">Đã điểm danh</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            {checkedCount}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="text-sm text-amber-700">Chưa điểm danh</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {attendanceSummary
              ? attendanceSummary.notMarkedCount ?? 0
              : Math.max(0, totalStudentsCount - checkedCount)}
          </div>
        </div>
      </div>

      {/* Attendance list - read-only */}
      <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Danh sách học viên</h2>
              <p className="text-sm text-gray-600">
                {totalStudentsCount
                  ? `${checkedCount} / ${totalStudentsCount} học viên đã được điểm danh`
                  : "Chưa có dữ liệu điểm danh"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm học viên..."
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition text-sm placeholder:text-gray-400"
                />
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-semibold">
                <CheckCircle size={16} />
                Admin – có thể chỉnh sửa sau 24 giờ
              </span>
              {!isEditing ? (
                <button
                  onClick={handleStartEdit}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Edit3 size={16} /> Chỉnh sửa điểm danh
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition text-sm cursor-pointer disabled:opacity-50"
                  >
                    <X size={16} className="inline mr-1" /> Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg transition flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Lưu điểm danh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Save message */}
          {saveMsg && (
            <div className={`mx-6 mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
              saveMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-rose-50 border border-rose-200 text-rose-700"
            }`}>
              {saveMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {saveMsg.text}
            </div>
          )}
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">
                  Học viên
                </th>
                <th className="py-3 px-6 text-center text-sm font-semibold tracking-wide text-gray-700">
                  Đã vắng
                </th>
                <th className="py-3 px-6 text-center text-sm font-semibold tracking-wide text-gray-700">
                  Trạng thái
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">
                  Ghi chú
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center"
                  >
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                      <Users size={24} className="text-gray-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Chưa có danh sách học viên</div>
                    <div className="text-sm text-gray-500 mt-1">Dữ liệu điểm danh cho buổi dạy này chưa được cập nhật.</div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-center font-bold text-sm">
                          {student.studentName
                            .split(" ")
                            .map((w) => w[0])
                            .filter(Boolean)
                            .slice(-2)
                            .join("")
                            .toUpperCase() || "HV"}
                        </div>
                        <div className="font-semibold text-gray-900">
                          {student.studentName}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center">
                        <AbsencePie value={student.absenceRate} />
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      {isEditing ? (
                        <select
                          value={student.status ?? "notMarked"}
                          onChange={(e) => handleStatusChange(student.id, e.target.value as AttendanceStatus)}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
                        >
                          <option value="notMarked">Chưa điểm danh</option>
                          <option value="present">Có mặt</option>
                          <option value="absent">Vắng</option>
                          <option value="makeup">Học bù</option>
                        </select>
                      ) : student.status ? (
                        <StatusBadge status={student.status} />
                      ) : (
                        <span className="text-xs text-gray-500">
                          Chưa điểm danh
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={student.note ?? ""}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-red-300"
                        />
                      ) : (
                        student.note || (
                          <span className="text-gray-400">Không có ghi chú</span>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Lesson Plan Drawer */}
      {showLessonPlanDrawer && lesson && (
        <LessonPlanDrawer
          sessionId={lessonId}
          lesson={lesson}
          onClose={() => setShowLessonPlanDrawer(false)}
        />
      )}
    </div>
  );
}
