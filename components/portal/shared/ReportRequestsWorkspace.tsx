"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Plus, Search, FileText, Clock, CalendarClock, User, Users,
  BookOpen, X, ChevronLeft, ChevronRight, Send,
  CheckCircle2, Loader2, ExternalLink,
} from "lucide-react";
import {
  getReportRequests,
  createReportRequest,
  completeReportRequest,
  cancelReportRequest,
} from "@/lib/api/reportRequestService";
import { get } from "@/lib/axios";
import type {
  ReportRequestDto,
  ReportRequestType,
  ReportRequestStatus,
  ReportRequestPriority,
  CreateReportRequestPayload,
  ReportRequestListQuery,
} from "@/types/admin/reportRequest";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ConfirmModal from "@/components/ConfirmModal";

/* ───────────── helpers ───────────── */
function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function getErrMsg(err: unknown, fallback: string): string {
  const e = err as Record<string, Record<string, Record<string, string>>>;
  return e?.response?.data?.detail || e?.response?.data?.message || (err as Error)?.message || fallback;
}

const STATUS_MAP: Record<ReportRequestStatus, { label: string; color: string }> = {
  Requested: { label: "Chờ xử lý", color: "bg-amber-100 text-amber-700 border-amber-200" },
  InProgress: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700 border-blue-200" },
  Submitted: { label: "Đã gửi", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  Approved: { label: "Đã duyệt", color: "bg-green-100 text-green-700 border-green-200" },
  Rejected: { label: "Từ chối", color: "bg-red-100 text-red-700 border-red-200" },
  Cancelled: { label: "Đã hủy", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

const PRIORITY_MAP: Record<ReportRequestPriority, { label: string; color: string }> = {
  Low: { label: "Thấp", color: "bg-gray-100 text-gray-600 border-gray-200" },
  Normal: { label: "Bình thường", color: "bg-blue-50 text-blue-600 border-blue-200" },
  High: { label: "Cao", color: "bg-orange-100 text-orange-700 border-orange-200" },
  Urgent: { label: "Khẩn cấp", color: "bg-red-100 text-red-700 border-red-200" },
};

const TYPE_MAP: Record<ReportRequestType, string> = {
  Session: "Báo cáo buổi",
  Monthly: "Báo cáo tháng",
};

function StatusBadge({ status }: { status: ReportRequestStatus }) {
  const info = STATUS_MAP[status] ?? STATUS_MAP.Requested;
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", info.color)}>{info.label}</span>;
}

function PriorityBadge({ priority }: { priority: ReportRequestPriority }) {
  const info = PRIORITY_MAP[priority] ?? PRIORITY_MAP.Normal;
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", info.color)}>{info.label}</span>;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return iso; }
}
function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

const PAGE_SIZE = 10;
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

/* ───────────── Create Modal local types ───────────── */
interface ClassOption {
  id: string;
  code: string;
  title: string;
  mainTeacherId: string;
  mainTeacherName: string;
}
interface StudentOption { profileId: string; name: string; }
interface SessionOption { id: string; label: string; plannedDatetime: string; }

/* ───────────── Create Modal ───────────── */
function CreateRequestModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportRequestType>("Monthly");

  // class selector
  const [classList, setClassList] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassOption | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // teacher (auto-filled from class)
  const [assignedTeacherUserId, setAssignedTeacherUserId] = useState("");
  const [assignedTeacherName, setAssignedTeacherName] = useState("");

  // students (from enrollment)
  const [studentList, setStudentList] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // sessions (from class)
  const [sessionList, setSessionList] = useState<SessionOption[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionOption | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [priority, setPriority] = useState<ReportRequestPriority>("High");
  const [message, setMessage] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load classes on open
  useEffect(() => {
    if (!isOpen) return;
    setLoadingClasses(true);
    get<Record<string, unknown>>("/api/classes?pageSize=200&pageNumber=1")
      .then((res) => {
        const raw = res as Record<string, unknown>;
        const data = raw?.data as Record<string, unknown>;
        const items = ((data?.classes as Record<string, unknown>)?.items ?? data?.items) as Record<string, unknown>[] ?? [];
        setClassList(items.map((c) => ({
          id: (c.id as string) ?? "",
          code: (c.code as string) ?? (c.classCode as string) ?? "",
          title: (c.title as string) ?? (c.classTitle as string) ?? (c.name as string) ?? "",
          mainTeacherId: (c.mainTeacherId as string) ?? "",
          mainTeacherName: (c.mainTeacherName as string) ?? "",
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, [isOpen]);

  // Load students when class selected
  useEffect(() => {
    if (!selectedClass) { setStudentList([]); setSessionList([]); return; }
    setLoadingStudents(true);
    setSelectedStudent(null);
    get<Record<string, unknown>>(`/api/classes/${selectedClass.id}/students?pageNumber=1&pageSize=200`)
      .then((res) => {
        const raw = res as Record<string, unknown>;
        const data = raw?.data as Record<string, unknown>;
        const items = ((data?.students as Record<string, unknown>)?.items ?? data?.items) as Record<string, unknown>[] ?? [];
        setStudentList(items.map((e) => ({
          profileId: (e.studentProfileId as string) ?? "",
          name: (e.fullName as string) ?? (e.studentProfileId as string) ?? "",
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [selectedClass]);

  // Load sessions when class selected
  useEffect(() => {
    if (!selectedClass) { setSessionList([]); setSelectedSession(null); return; }
    setLoadingSessions(true);
    setSelectedSession(null);
    get<Record<string, unknown>>(`/api/sessions?classId=${selectedClass.id}&pageSize=200&pageNumber=1`)
      .then((res) => {
        const raw = res as Record<string, unknown>;
        const data = raw?.data as Record<string, unknown>;
        const items = ((data?.sessions as Record<string, unknown>)?.items ?? data?.items) as Record<string, unknown>[] ?? [];
        setSessionList(
          items
            .map((s) => ({
              id: (s.id as string) ?? "",
              plannedDatetime: (s.plannedDatetime as string) ?? (s.actualDatetime as string) ?? "",
              label: "",
            }))
            .filter((s) => s.id)
            .sort((a, b) => a.plannedDatetime.localeCompare(b.plannedDatetime))
            .map((s, i) => ({
              ...s,
              label: s.plannedDatetime
                ? `Buổi ${i + 1} – ${new Date(s.plannedDatetime).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                : `Buổi ${i + 1}`,
            }))
        );
      })
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, [selectedClass]);

  const handleSelectClass = (id: string) => {
    const c = classList.find((cl) => cl.id === id) ?? null;
    setSelectedClass(c);
    setAssignedTeacherUserId(c?.mainTeacherId ?? "");
    setAssignedTeacherName(c?.mainTeacherName ?? "");
    setSelectedStudent(null);
    setSelectedSession(null);
  };

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setReportType("Monthly");
      setSelectedClass(null);
      setAssignedTeacherUserId("");
      setAssignedTeacherName("");
      setStudentList([]);
      setSelectedStudent(null);
      setSessionList([]);
      setSelectedSession(null);
      setMonth(currentMonth);
      setYear(currentYear);
      setPriority("High");
      setMessage("");
      setDueAt("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (submitting) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", handler);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, submitting]);

  const handleSubmit = async () => {
    if (!selectedClass) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng chọn lớp học", type: "warning" });
      return;
    }
    if (!assignedTeacherUserId.trim()) {
      toast({ title: "Thiếu thông tin", description: "Lớp này chưa có giáo viên phụ trách", type: "warning" });
      return;
    }
    if (reportType === "Session" && !selectedSession) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng chọn buổi học", type: "warning" });
      return;
    }

    const payload: CreateReportRequestPayload = {
      reportType,
      assignedTeacherUserId: assignedTeacherUserId.trim(),
      priority,
      notificationChannel: "InApp",
    };
    if (selectedStudent) payload.targetStudentProfileId = selectedStudent.profileId;
    if (selectedClass) payload.targetClassId = selectedClass.id;
    if (reportType === "Session" && selectedSession) payload.targetSessionId = selectedSession.id;
    if (reportType === "Monthly") { payload.month = month; payload.year = year; }
    if (message.trim()) payload.message = message.trim();
    if (dueAt) payload.dueAt = `${dueAt}${dueAt.includes("T") ? "" : "T00:00:00"}+07:00`;

    try {
      setSubmitting(true);
      await createReportRequest(payload);
      toast({ title: "Thành công", description: "Đã tạo yêu cầu báo cáo và gửi thông báo cho giáo viên.", type: "success" });
      onCreated();
      onClose();
    } catch (err: unknown) {
      toast({ title: "Lỗi", description: getErrMsg(err, "Không thể tạo yêu cầu."), type: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20"> <Send size={24} className="text-white" /> </div>
              <div>
                <h2 className="text-xl font-bold text-white">Tạo yêu cầu báo cáo</h2>
                <p className="text-sm text-red-100">Giao việc ưu tiên cho giáo viên</p>
              </div>
            </div>
            <button onClick={onClose} disabled={submitting} className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"> <X size={24} className="text-white" /> </button>
          </div>
        </div>

        {/* body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Loại */}
          <div className="grid grid-cols-2 gap-3">
            {(["Monthly", "Session"] as ReportRequestType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setReportType(t)}
                className={cn(
                  "px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer",
                  reportType === t
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                {TYPE_MAP[t]}
              </button>
            ))}
          </div>

          {/* Class selector */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Lớp học *</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <select
                value={selectedClass?.id ?? ""}
                onChange={(e) => handleSelectClass(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 appearance-none"
              >
                <option value="">— Chọn lớp học —</option>
                {loadingClasses ? (
                  <option disabled>Đang tải danh sách lớp…</option>
                ) : (
                  classList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `[${c.code}] ` : ""}{c.title}{c.mainTeacherName ? ` · GV: ${c.mainTeacherName}` : ""}
                    </option>
                  ))
                )}
              </select>
              {loadingClasses && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin pointer-events-none" size={16} />}
            </div>
          </div>

          {/* Teacher (auto-filled, read-only) */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Giáo viên phụ trách</label>
            {selectedClass ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-200 bg-green-50">
                <User size={16} className="text-green-600 shrink-0" />
                <span className="text-sm text-green-800 font-medium flex-1">
                  {assignedTeacherName || "Chưa có thông tin giáo viên"}
                </span>
                <span className="text-xs text-green-500 bg-green-100 px-2 py-0.5 rounded-full">Tự động</span>
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400">
                Chọn lớp để tự động xác định giáo viên
              </div>
            )}
          </div>

          {/* Student selector */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Học sinh <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
            {!selectedClass ? (
              <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400">Chọn lớp trước để xem danh sách học sinh</div>
            ) : (
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <select
                  value={selectedStudent?.profileId ?? ""}
                  onChange={(e) => {
                    const found = studentList.find((s) => s.profileId === e.target.value);
                    setSelectedStudent(found ?? null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 appearance-none"
                >
                  <option value="">— Tất cả học sinh lớp này —</option>
                  {loadingStudents ? (
                    <option disabled>Đang tải danh sách học sinh…</option>
                  ) : (
                    studentList.map((s) => (
                      <option key={s.profileId} value={s.profileId}>{s.name}</option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Session (nếu type = Session) */}
          {reportType === "Session" && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Buổi học *</label>
              {!selectedClass ? (
                <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400">Chọn lớp trước để xem danh sách buổi học</div>
              ) : (
                <div className="relative">
                  <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  <select
                    value={selectedSession?.id ?? ""}
                    onChange={(e) => {
                      const found = sessionList.find((s) => s.id === e.target.value);
                      setSelectedSession(found ?? null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 appearance-none"
                  >
                    <option value="">— Chọn buổi học —</option>
                    {loadingSessions ? (
                      <option disabled>Đang tải danh sách buổi học…</option>
                    ) : (
                      sessionList.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))
                    )}
                  </select>
                  {loadingSessions && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin pointer-events-none" size={16} />}
                </div>
              )}
            </div>
          )}

          {/* Month/Year (nếu type = Monthly) */}
          {reportType === "Monthly" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Tháng *</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-200">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Năm *</label>
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              </div>
            </div>
          )}

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Độ ưu tiên</label>
            <div className="flex flex-wrap gap-2">
              {(["Low", "Normal", "High", "Urgent"] as ReportRequestPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                    priority === p ? PRIORITY_MAP[p].color : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  )}
                >
                  {PRIORITY_MAP[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Deadline gợi ý</label>
            <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Lời nhắn cho giáo viên</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} placeholder="VD: Ưu tiên làm báo cáo tháng cho bé này trước giúp Admin." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none" />
          </div>
        </div>

        {/* footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-4 flex justify-end gap-3">
          <button onClick={onClose} disabled={submitting} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer">Hủy</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all cursor-pointer disabled:opacity-70">
            {submitting ? "Đang tạo..." : "Tạo yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Detail Modal ───────────── */
function DetailModal({
  request,
  onClose,
  isAdmin,
  onComplete,
  onCancel,
}: {
  request: ReportRequestDto | null;
  onClose: () => void;
  isAdmin: boolean;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const router = useRouter();
  const params = useParams();
  if (!request) return null;

  const canComplete = request.status === "Requested" || request.status === "InProgress";
  const canCancel = isAdmin && request.status !== "Approved" && request.status !== "Cancelled";

  const goToSession = () => {
    const locale = params?.locale ?? "vi";
    const qs = new URLSearchParams();
    if (request.targetSessionId) qs.set("sessionId", request.targetSessionId);
    if (request.targetSessionDate) qs.set("date", request.targetSessionDate.slice(0, 10));
    router.push(`/${locale}/portal/teacher/attendance?${qs.toString()}`);
    onClose();
  };

  const goToMonthly = () => {
    const locale = params?.locale ?? "vi";
    const qs = new URLSearchParams();
    qs.set("tab", "monthly");
    if (request.targetClassId) qs.set("classId", request.targetClassId);
    if (request.targetStudentProfileId) qs.set("studentId", request.targetStudentProfileId);
    if (request.month) qs.set("month", String(request.month));
    if (request.year) qs.set("year", String(request.year));
    router.push(`/${locale}/portal/teacher/feedback?${qs.toString()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20"> <FileText size={24} className="text-white" /> </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chi tiết yêu cầu</h2>
                <p className="text-sm text-red-100">{TYPE_MAP[request.reportType]}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 cursor-pointer"> <X size={24} className="text-white" /> </button>
          </div>
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-600">{TYPE_MAP[request.reportType]}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow icon={User} label="Giáo viên" value={request.assignedTeacherName || "—"} />
            <InfoRow icon={User} label="Người tạo" value={request.requestedByName || "Admin"} />
            {request.targetStudentName && <InfoRow icon={Users} label="Học sinh" value={request.targetStudentName} />}
            {request.targetClassTitle && <InfoRow icon={BookOpen} label="Lớp" value={`${request.targetClassCode ?? ""} ${request.targetClassTitle}`} />}
            {request.month && <InfoRow icon={CalendarClock} label="Tháng/Năm" value={`${request.month}/${request.year}`} />}
            {request.targetSessionDate && <InfoRow icon={Clock} label="Buổi" value={formatDateTime(request.targetSessionDate)} />}
            {request.dueAt && <InfoRow icon={Clock} label="Deadline" value={formatDateTime(request.dueAt)} />}
            <InfoRow icon={Clock} label="Tạo lúc" value={formatDateTime(request.createdAt)} />
          </div>

          {request.message && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-semibold text-amber-700 mb-1">Lời nhắn</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">{request.message}</div>
            </div>
          )}

          {(request.linkedSessionReportId || request.linkedMonthlyReportId) && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              Báo cáo đã được liên kết
            </div>
          )}

          {!isAdmin && request.reportType === "Session" && request.targetSessionId && (
            <button
              onClick={goToSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg cursor-pointer text-sm transition-all"
            >
              <ExternalLink size={16} />
              Đi tới buổi học để viết báo cáo
            </button>
          )}

          {!isAdmin && request.reportType === "Monthly" && (
            <button
              onClick={goToMonthly}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:shadow-lg cursor-pointer text-sm transition-all"
            >
              <ExternalLink size={16} />
              {request.targetStudentProfileId
                ? `Đi tới báo cáo tháng của ${request.targetStudentName || "học sinh"}`
                : `Đi tới báo cáo tháng lớp ${request.targetClassCode || request.targetClassTitle || ""}`}
            </button>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-4 flex justify-end gap-3">
          {canCancel && (
            <button onClick={() => onCancel(request.id)} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer text-sm">Hủy yêu cầu</button>
          )}
          {canComplete && (
            <button onClick={() => onComplete(request.id)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg cursor-pointer text-sm">Đánh dấu hoàn tất</button>
          )}
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer text-sm">Đóng</button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={16} className="text-red-500 mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm text-gray-900 font-medium">{value}</div>
      </div>
    </div>
  );
}

/* ───────────── Main Component ───────────── */
export default function ReportRequestsWorkspace({ isAdmin = false }: { isAdmin?: boolean }) {
  const { toast } = useToast();
  useCurrentUser();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [items, setItems] = useState<ReportRequestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportRequestStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ReportRequestType | "ALL">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReportRequestDto | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => { setIsPageLoaded(true); }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const query: ReportRequestListQuery = { pageNumber: page, pageSize: PAGE_SIZE };
      if (statusFilter !== "ALL") query.status = statusFilter;
      if (typeFilter !== "ALL") query.reportType = typeFilter;

      const res = await getReportRequests(query);
      const data = res?.data?.reportRequests ?? (res as unknown as Record<string, unknown>)?.data;
      const list = data?.items ?? [];
      setItems(list);
      setTotalCount(data?.totalCount ?? list.length);
    } catch (err: unknown) {
      console.error("Failed to fetch report requests:", err);
      toast({ title: "Lỗi", description: "Không thể tải danh sách yêu cầu báo cáo.", type: "destructive" });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredItems = useMemo(() => {
    if (!q.trim()) return items;
    const kw = q.trim().toLowerCase();
    return items.filter((r) =>
      [r.assignedTeacherName, r.targetStudentName, r.targetClassTitle, r.targetClassCode, r.message, r.requestedByName]
        .some((v) => v?.toLowerCase().includes(kw))
    );
  }, [items, q]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleComplete = async (id: string) => {
    try {
      await completeReportRequest(id);
      toast({ title: "Thành công", description: "Đã đánh dấu yêu cầu hoàn tất.", type: "success" });
      setSelectedRequest(null);
      fetchData();
    } catch (err: unknown) {
      toast({ title: "Lỗi", description: getErrMsg(err, "Không thể hoàn tất yêu cầu."), type: "destructive" });
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      setIsCancelling(true);
      await cancelReportRequest(cancelTarget);
      toast({ title: "Đã hủy", description: "Yêu cầu báo cáo đã được hủy.", type: "success" });
      setShowCancelModal(false);
      setCancelTarget(null);
      setSelectedRequest(null);
      fetchData();
    } catch (err: unknown) {
      toast({ title: "Lỗi", description: getErrMsg(err, "Không thể hủy yêu cầu."), type: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const openCancel = (id: string) => {
    setCancelTarget(id);
    setShowCancelModal(true);
  };

  const stats = useMemo(() => ({
    total: totalCount,
    requested: items.filter((r) => r.status === "Requested").length,
    submitted: items.filter((r) => r.status === "Submitted").length,
    approved: items.filter((r) => r.status === "Approved").length,
  }), [items, totalCount]);

  return (
    <>
      <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
        {/* Header */}
        <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4")}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {isAdmin ? "Yêu cầu báo cáo" : "Yêu cầu báo cáo của tôi"}
              </h1>
              <p className="text-sm text-gray-600">
                {isAdmin ? "Giao việc ưu tiên cho giáo viên" : "Danh sách yêu cầu từ Admin"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95">
              <Plus size={18} /> Tạo yêu cầu
            </button>
          )}
        </div>

        {/* Stats */}
        <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-700 delay-100", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          {[
            { label: "Tổng", value: stats.total, icon: FileText, bg: "bg-red-100", fg: "text-red-600" },
            { label: "Chờ xử lý", value: stats.requested, icon: Clock, bg: "bg-amber-100", fg: "text-amber-600" },
            { label: "Đã gửi", value: stats.submitted, icon: Send, bg: "bg-indigo-100", fg: "text-indigo-600" },
            { label: "Đã duyệt", value: stats.approved, icon: CheckCircle2, bg: "bg-green-100", fg: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <span className={cn("w-10 h-10 rounded-xl grid place-items-center", s.bg)}>
                  <s.icon className={s.fg} size={18} />
                </span>
                <div>
                  <div className="text-sm text-gray-600">{s.label}</div>
                  <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={cn("rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên GV, học sinh, lớp..." className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as ReportRequestStatus | "ALL"); setPage(1); }} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Requested">Chờ xử lý</option>
              <option value="InProgress">Đang xử lý</option>
              <option value="Submitted">Đã gửi</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Từ chối</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as ReportRequestType | "ALL"); setPage(1); }} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200">
              <option value="ALL">Tất cả loại</option>
              <option value="Monthly">Báo cáo tháng</option>
              <option value="Session">Báo cáo buổi</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className={cn("rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-300", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách yêu cầu</h2>
              <span className="text-sm text-gray-600 font-medium">{totalCount} yêu cầu</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Loại</th>
                  {isAdmin && <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Giáo viên</th>}
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Mục tiêu</th>
                  <th className="py-3 px-6 text-center text-sm font-semibold text-gray-700">Ưu tiên</th>
                  <th className="py-3 px-6 text-center text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Deadline</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Tạo lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center">
                      <Loader2 size={32} className="mx-auto animate-spin text-red-500" />
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((r) => (
                    <tr key={r.id} onClick={() => setSelectedRequest(r)} className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200 cursor-pointer">
                      <td className="py-3 px-6 text-sm">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          {TYPE_MAP[r.reportType]}
                        </span>
                        {r.reportType === "Monthly" && r.month && (
                          <span className="ml-1 text-xs text-gray-500">{r.month}/{r.year}</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-6 text-sm text-gray-900">{r.assignedTeacherName || "—"}</td>
                      )}
                      <td className="py-3 px-6">
                        <div className="text-sm text-gray-900">{r.targetStudentName || r.targetClassTitle || "—"}</div>
                        {r.targetClassCode && <div className="text-xs text-gray-500">{r.targetClassCode}</div>}
                      </td>
                      <td className="py-3 px-6 text-center"><PriorityBadge priority={r.priority} /></td>
                      <td className="py-3 px-6 text-center"><StatusBadge status={r.status} /></td>
                      <td className="py-3 px-6 text-sm text-gray-600">{formatDate(r.dueAt)}</td>
                      <td className="py-3 px-6 text-sm text-gray-500">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                        <FileText size={24} className="text-gray-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Chưa có yêu cầu báo cáo nào</div>
                      {isAdmin && <div className="text-sm text-gray-500 mt-1">Nhấn &quot;Tạo yêu cầu&quot; để giao việc cho giáo viên</div>}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > PAGE_SIZE && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Trang <span className="font-semibold text-gray-900">{page}</span> / <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isAdmin && <CreateRequestModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={fetchData} />}

      <DetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        isAdmin={isAdmin}
        onComplete={handleComplete}
        onCancel={openCancel}
      />

      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelTarget(null); }}
        onConfirm={handleCancelConfirm}
        title="Xác nhận hủy yêu cầu"
        message="Bạn có chắc muốn hủy yêu cầu báo cáo này? Giáo viên sẽ không còn thấy yêu cầu."
        confirmText="Hủy yêu cầu"
        cancelText="Giữ lại"
        variant="warning"
        isLoading={isCancelling}
      />
    </>
  );
}
