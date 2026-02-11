"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { createSessionReport, updateSessionReport } from "@/app/api/teacher/sessionReport";
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
  studentId: string; // id thật để save (nếu có)
  studentCode?: string;
  email?: string;
  phone?: string;
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  late: "Đi muộn",
  absent: "Vắng mặt",
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

type SessionReportState = {
  reportId: string;
  feedback: string;
};
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

  return {
    feedback: listFeedback || singleReportFeedback || directNote,
    reportId: listReportId || singleReportId || directReportId,
  };
}
const buildSessionReportKey = (sessionId: string, studentId: string, rowKey: string): string => {
  const studentKey = studentId || rowKey;
  return `${sessionId}:${studentKey}`;
};

// SortableHeader Component
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
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<SessionApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(() => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    return { from: iso, to: iso };
  });

  const [filters, setFilters] = useState<FilterField>({
    date: "",
    time: "",
    session: "",
    className: "",
    status: "",
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

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

  const recordsPerPage = 8;

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

  // Auto-select session from URL params
  useEffect(() => {
    if (!sessions.length) return;

    const sessionIdParam = searchParams.get("sessionId");
    const dateParam = searchParams.get("date");
    const timeParam = searchParams.get("time");
    const classParam = searchParams.get("class");

    if (dateParam && (dateParam !== dateRange.from || dateParam !== dateRange.to)) {
      setDateRange({ from: dateParam, to: dateParam });
    }

    if (sessionIdParam) {
      const matchingSession = sessions.find((session: any) => String(session.id ?? session.sessionId ?? "") === sessionIdParam);
      if (matchingSession) {
        handleSessionSelect(sessionIdParam);
      }
    } else if (timeParam && classParam) {
      const matchingSession = sessions.find((session: any) => {
        const lesson = mapSessionToLessonDetail(session);
        const [startTime] = lesson.time.split(" - ");
        return startTime === timeParam && lesson.course === classParam;
      });

      if (matchingSession) {
        const lesson = mapSessionToLessonDetail(matchingSession);
        handleSessionSelect(lesson.id);
      }
    } else {
      const firstSession = sessions[0];
      const lesson = mapSessionToLessonDetail(firstSession);
      handleSessionSelect(lesson.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, searchParams]);

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

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setAttendanceList([]);
    setAttendanceSummary(null);
    setAttendanceLoadingError(null);
    setCurrentPage(1);
  };

  const refreshAttendance = useCallback(async () => {
    if (!selectedSessionId) return;

    setLoadingAttendance(true);
    setAttendanceLoadingError(null);

    try {
      const result = await fetchAttendance(selectedSessionId);

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
        const note = persistedSessionReport.feedback;
        const reportId = persistedSessionReport.reportId;

        if (note) {
          const reportKey = buildSessionReportKey(selectedSessionId, safeStudentId, rowKey);
          nextSessionReports[reportKey] = {
            reportId,
            feedback: note,
          };
        }
        return {
          ...s,
          id: uniqueIdForUI,
          rowKey,
          // vẫn giữ fallback để saveAttendance không bị thiếu id
          studentId: safeStudentId || uniqueIdForUI,
          name,
          email,
          phone,
          note,
          studentCode: String(s.studentCode ?? s.code ?? safeStudentId ?? s.id ?? "").trim(),
        } as StudentRow;
      });

      setAttendanceList(students);
            setAttendanceList(students);

      setHasAnyMarked(Boolean(result.hasAnyMarked));

      if (result.attendanceSummary) {
        const total = result.attendanceSummary.totalStudents ?? students.length;
        const present = result.attendanceSummary.presentCount ?? 0;
        const absent = result.attendanceSummary.absentCount ?? 0;
        const makeup = result.attendanceSummary.makeupCount ?? 0;
        setAttendanceSummary({ total, present, absent, makeup });
      } else {
        const total = students.length;
        const present = students.filter((s) => s.status === "present" || s.status === "late").length;
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

    if (!feedback.trim()) {
      setNoteModalError("Vui lòng nhập nội dung nhận xét.");
      return;
    }

    // vì studentId có thể fallback => chỉ cho gửi nếu là GUID thật
    if (!selectedStudentForNote.studentId || !GUID_REGEX.test(selectedStudentForNote.studentId)) {
      setNoteModalError("Không tìm thấy StudentProfileId hợp lệ để gửi nhận xét.");
      return;
    }

    const reportKey = buildSessionReportKey(
      selectedSessionId,
      selectedStudentForNote.studentId,
      selectedStudentForNote.rowKey,
    );
    const existingReport = sessionReports[reportKey];

    try {
      setIsSubmittingNote(true);
      setNoteModalError(null);

      let report: SessionReportItem | null = null;

      if (existingReport?.reportId) {
        report = await updateSessionReport(existingReport.reportId, { feedback });
      } else {
        report = await createSessionReport({
          sessionId: selectedSessionId,
          studentProfileId: selectedStudentForNote.studentId,
          reportDate: new Date().toISOString().slice(0, 10),
          feedback,
        });
      }

      const reportId = String(report?.id ?? existingReport?.reportId ?? "").trim();

      setSessionReports((prev) => ({
        ...prev,
        [reportKey]: {
          reportId,
          feedback,
        },
      }));

      setAttendanceList((prev) =>
        prev.map((r) =>
          r.rowKey === selectedStudentForNote.rowKey ? { ...r, note: feedback.trim() } : r,
        ),
      );

      handleCloseNoteModal();
    } catch (err: any) {
      console.error("Save session report error:", err);
      setNoteModalError(err.message || "Không thể lưu nhận xét buổi học.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleSaveAll = useCallback(async () => {
    if (!selectedSessionId) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      await saveAttendance(selectedSessionId, attendanceList, !hasAnyMarked);
      await refreshAttendance();
    } catch (err: any) {
      console.error("Save attendance error:", err);
      setSaveError(err.message || "Không thể lưu điểm danh.");
    } finally {
      setIsSaving(false);
    }
  }, [attendanceList, hasAnyMarked, refreshAttendance, selectedSessionId]);

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

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, sortColumn, sortDirection]);

  const stats = useMemo(() => {
    if (!attendanceSummary) return null;
    return attendanceSummary;
  }, [attendanceSummary]);

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
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Buổi học theo khoảng ngày</h3>
                <p className="text-sm text-gray-500">Chọn buổi học để điểm danh ngay.</p>
              </div>
              <button
                onClick={fetchSessionData}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                <RefreshCcw size={14} />
                Làm mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
                <span className="text-gray-400 text-sm">→</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>

              <input
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                placeholder="Ngày"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <input
                value={filters.time}
                onChange={(e) => handleFilterChange("time", e.target.value)}
                placeholder="Giờ"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <input
                value={filters.session}
                onChange={(e) => handleFilterChange("session", e.target.value)}
                placeholder="Buổi học"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <input
                value={filters.className}
                onChange={(e) => handleFilterChange("className", e.target.value)}
                placeholder="Lớp"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <input
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                placeholder="Trạng thái"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            {loading && <div className="text-sm text-gray-500">Đang tải danh sách buổi học...</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}

            {!loading && !error && filterSessions.length === 0 && (
              <div className="text-sm text-gray-500">Không có buổi học phù hợp bộ lọc.</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filterSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionSelect(session.id)}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
                    session.id === selectedSessionId
                      ? "border-red-300 bg-gradient-to-r from-red-50 to-red-100"
                      : "border-gray-200 hover:border-red-200 hover:bg-red-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-1.5 rounded-md bg-gradient-to-r ${session.color}`}>
                      <CalendarDays size={14} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{session.className}</div>
                      <div className="text-xs text-gray-600">{session.date}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Clock size={12} />
                    {session.time}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <MapPin size={12} />
                    {session.room}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{session.students} học viên</div>
                </button>
              ))}
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
                    onClick={() => setSelectedSessionId(null)}
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
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Tỉ lệ chuyên cần</div>
                  <div className="p-2 rounded-lg bg-gray-100">
                    <TrendingUp size={20} className="text-gray-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats ? Math.round((stats.present / stats.total) * 100) : 0}%
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      {selectedSessionId ? (
        <div className={`grid lg:grid-cols-3 gap-6 transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
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
                      <option value="late">Đi muộn</option>
                      <option value="absent">Vắng mặt</option>
                    </select>
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Download size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200">
                    <tr>
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
                      const canSendNote = Boolean(record.studentId && GUID_REGEX.test(record.studentId));

                      return (
                        <tr
                          key={record.rowKey}
                          className="hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-100/50 transition-colors border-b border-gray-100"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <StudentAvatar name={record.name ?? ""} />
                              <div>
                                <div className="font-semibold text-gray-900">{record.name?.trim() || "(Chưa có tên)"}</div>
                                <div className="text-xs text-gray-500">{record.phone}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-900 font-medium">{record.studentCode}</td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {(["present", "late", "absent"] as AttendanceStatus[]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(record.rowKey, status)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                    record.status === status
                                      ? status === "present"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : status === "late"
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : "bg-red-50 text-red-700 border-red-200"
                                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  {STATUS_LABELS[status]}
                                </button>
                              ))}
                            </div>
                          </td>

                          <td className="px-4 py-4 max-w-xs">
                            {record.note ? (
                              <div className="flex items-center gap-1 text-amber-600 text-sm">
                                <AlertCircle size={14} />
                                <span className="truncate">{record.note}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Không có</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenNoteModal(record)}
                                title={canSendNote ? "Thêm nhận xét buổi học" : "Không có StudentProfileId hợp lệ"}
                                disabled={!canSendNote}
                                className={`px-2.5 py-1.5 rounded-lg border transition text-xs font-semibold inline-flex items-center gap-1 ${
                                  !canSendNote
                                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                    : record.note
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
                                  disabled={!canSendNote}
                                  className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Makeup Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg">
                  <ArrowRightLeft size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Buổi bù</h3>
                  <p className="text-sm text-gray-600">Đề xuất lịch bù</p>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
                  Tạo đề xuất buổi bù
                </button>
                <button className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:shadow-md transition cursor-pointer">
                  <span className="inline-flex items-center justify-center gap-2">
                    <Send size={16} /> Gửi đề xuất
                  </span>
                </button>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-4">Thống kê nhanh</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Tỉ lệ chuyên cần</span>
                    <span className="font-semibold text-emerald-600">
                      {stats ? Math.round((stats.present / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                      style={{ width: `${stats ? (stats.present / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {attendanceList.filter((r) => r.status === "absent").length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Vắng mặt</div>
                  </div>

                  <div>
                    <div className="text-lg font-bold text-amber-500">
                      {attendanceList.filter((r) => r.status === "late").length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Đi muộn</div>
                  </div>
                </div>
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
            error={noteModalError}
            onClose={handleCloseNoteModal}
            onSubmit={handleSubmitStudentNote}
          />
        </div>
      ) : null}
    </div>
  );
}