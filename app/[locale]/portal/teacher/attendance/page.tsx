"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";

import {
  fetchSessions,
  fetchAttendance,
  saveAttendance,
  toISODateStart,
  toISODateEnd,
  mapSessionToLessonDetail,
} from "@/app/api/teacher/attendance";

import type { AttendanceStatus, LessonDetail, SessionApiItem, Student } from "@/types/teacher/attendance";
import type { SessionReportItem } from "@/types/teacher/sessionReport";
import {
  createSessionReport,
  enhanceSessionFeedback,
  fetchSessionReports,
  submitSessionReport,
  updateSessionReport,
} from "@/app/api/teacher/sessionReport";
import SessionNoteModal from "@/components/teacher/attendance/SessionNoteModal";

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
            className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${
              currentPage === page
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

export default function TeacherAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = String(params?.locale ?? "");
  const requestedDate = normalizeDateParam(searchParams.get("date"));
  const requestedSessionId = String(searchParams.get("sessionId") ?? "").trim() || null;
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
  const [sortColumn, setSortColumn] = useState<"student" | "studentCode">("student");
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
  const [expandedStatusRows, setExpandedStatusRows] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const recordsPerPage = 8;

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

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find((session: any) => String(session.id ?? session.sessionId ?? "") === selectedSessionId) ?? null;
  }, [sessions, selectedSessionId]);

  const selectedLesson = useMemo<LessonDetail | null>(() => {
    if (!selectedSession) return null;
    return mapSessionToLessonDetail(selectedSession);
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
        color: SESSION_COLOR_POOL[index % SESSION_COLOR_POOL.length],
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
          studentCode: String(s.studentCode ?? s.code ?? safeStudentId ?? s.id ?? "").trim(),
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

  const handleSort = (column: "student" | "studentCode") => {
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
              reportDate: new Date().toISOString().slice(0, 10),
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

      handleCloseNoteModal();
    } catch (err: any) {
      console.error("Submit note error:", err);
      setNoteModalError(err.message || "Không thể lưu nhận xét.");
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
      setNoteModalError("Vui lòng lưu nhận xét trước khi gửi duyệt.");
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

      handleCloseNoteModal();
    } catch (err: any) {
      setNoteModalError(err?.message || "Không thể gửi nhận xét để duyệt.");
    } finally {
      setIsSubmittingReview(false);
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
              reportDate: new Date().toISOString().slice(0, 10),
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
    } catch (err: any) {
      console.error("Save attendance error:", err);
      setSaveError(err.message || "Không thể lưu điểm danh.");
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
      } else {
        comparison = (a.studentCode ?? "").localeCompare(b.studentCode ?? "");
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50/20 to-white p-4 md:p-6">
      {/* Header */}
      <div className={`mb-6 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <CheckCheckIcon size={24} className="text-white" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Điểm danh lớp học
            </h1>
            <p className="text-gray-600 mt-1 text-sm">Quản lý chuyên cần và sắp xếp buổi bù</p>
          </div>
        </div>

        {!selectedSessionId && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-6">
            {/* Header section */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <CalendarDays size={20} className="text-red-600" />
                    Buổi học theo khoảng ngày
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Chọn buổi học để điểm danh ngay</p>
                </div>
                <button
                  onClick={fetchSessionData}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-red-300 transition-all cursor-pointer shadow-sm"
                >
                  <RefreshCcw size={14} className="text-red-600" />
                  Làm mới
                </button>
              </div>
            </div>

            {/* Date range picker */}
            <div className="px-6 py-4 bg-white border-b border-gray-100">
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
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Lọc nâng cao</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
                  <input
                    value={filters.date}
                    onChange={(e) => handleFilterChange("date", e.target.value)}
                    placeholder="Ngày"
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300"
                  />
                  <input
                    value={filters.time}
                    onChange={(e) => handleFilterChange("time", e.target.value)}
                    placeholder="Giờ"
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300"
                  />
                  <input
                    value={filters.session}
                    onChange={(e) => handleFilterChange("session", e.target.value)}
                    placeholder="Buổi học"
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300"
                  />
                  <input
                    value={filters.className}
                    onChange={(e) => handleFilterChange("className", e.target.value)}
                    placeholder="Lớp"
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300"
                  />
                  <input
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    placeholder="Trạng thái"
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300"
                  />
                </div>
                {(filters.date || filters.time || filters.session || filters.className || filters.status) && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <X size={14} />
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>

            {/* Session list */}
            <div className="px-6 py-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionSelect(session.id)}
                    className={`group relative p-5 rounded-xl border-2 text-left transition-all duration-300 cursor-pointer ${
                      session.id === selectedSessionId
                        ? "border-red-400 bg-gradient-to-r from-red-50 to-red-100/50 shadow-lg shadow-red-100/50"
                        : "border-gray-200 hover:border-red-300 hover:shadow-md hover:bg-red-50/30"
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      <div className={`w-2 h-2 rounded-full ${session.id === selectedSessionId ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    </div>
                    
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${session.color} shadow-md group-hover:scale-110 transition-transform`}>
                        <BookOpen size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 line-clamp-1">{session.className}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{session.date}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock size={12} className="text-gray-400" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin size={12} className="text-gray-400" />
                        <span className="line-clamp-1">{session.room}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users size={12} className="text-gray-400" />
                        <span>{session.students} học viên</span>
                      </div>
                    </div>

                    {session.status && (
                      <div className="mt-3">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                          {session.status}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedSessionId && selectedLesson && (
          <>
            {/* Class Info Card */}
            <div className={`bg-gradient-to-br from-white via-gray-50/30 to-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedLesson.lesson}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={16} className="text-red-600" />
                          <span className="font-medium">{selectedLesson.date}</span>
                          <span>•</span>
                          <span>{selectedLesson.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={16} className="text-red-600" />
                          <span>{selectedLesson.room}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedLesson.status && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {selectedLesson.status}
                          </span>
                        )}
                        {selectedLesson.participationType && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {selectedLesson.participationType}
                          </span>
                        )}
                        {selectedLesson.branch && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            {selectedLesson.branch}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToSchedule}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <CalendarDays size={16} />
                    Lịch giảng dạy
                  </button>

                  <button
                    onClick={handleChooseOtherSession}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    Buổi khác
                  </button>

                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                      isSaving
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Tổng học viên</div>
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Users size={20} className="text-gray-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats?.total || 0}</div>
              </div>

              <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Có mặt</div>
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CheckCircle size={20} className="text-emerald-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-600">{stats?.present || 0}</div>
              </div>

              <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Vắng mặt</div>
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Clock size={20} className="text-amber-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-amber-600">{stats?.absent || 0}</div>
              </div>

              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Tỷ lệ chuyên cần</div>
                  <div className="p-2 rounded-lg bg-gray-100">
                    <TrendingUp size={20} className="text-gray-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      {selectedSessionId ? (
        <div className={` transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {/* Student Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-bold text-gray-900">Danh sách học viên</h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm học viên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:border-red-300"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | "ALL")}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
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
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <Download size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200">
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
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                        <SortableHeader
                          label="Mã HV"
                          column="studentCode"
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
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
                                      {String(record.track).toLowerCase() === "secondary" ? "Secondary" : "Primary"}
                                    </span>
                                  ) : null}
                                  {record.isMakeup ? (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                                      Makeup
                                    </span>
                                  ) : null}
                                  {record.registrationId ? (
                                    <span className="truncate" title={record.registrationId}>
                                      Reg: {record.registrationId}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-900 font-medium">{record.studentCode}</td>

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

                                    return (
                                      <button
                                        key={status}
                                        onClick={() => handleStatusChange(record.rowKey, status)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                          isActive
                                            ? STATUS_STYLES[status].active
                                            : isSuggestedMakeup
                                              ? "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
                                              : `border-gray-200 text-gray-600 ${STATUS_STYLES[status].hover}`
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
                                className={`px-2.5 py-1.5 rounded-lg border transition text-xs font-semibold inline-flex items-center gap-1 ${
                                  record.note
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
                  <div className="text-center py-12 text-gray-500">Không tìm thấy học viên nào</div>
                )}

                {loadingAttendance && <div className="text-center py-12 text-gray-500">Đang tải danh sách học viên...</div>}

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
            error={noteModalError}
            onClose={handleCloseNoteModal}
            onSubmit={handleSubmitStudentNote}
            onEnhance={handleEnhanceStudentNote}
            onSubmitForReview={handleSubmitStudentNoteForReview}
          />
        </div>
      ) : null}
    </div>
  );
}