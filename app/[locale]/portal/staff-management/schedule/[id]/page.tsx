"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/store/authToken";
import { updateAdminSession } from "@/app/api/admin/sessions";
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
  ArrowLeftRight,
  Calendar,
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

/* ===== Helpers ===== */
type Period = "MORNING" | "AFTERNOON" | "EVENING";
const PERIOD_TIME_RANGES: Record<Period, string> = {
  MORNING: "08:00 - 11:00",
  AFTERNOON: "14:00 - 17:00",
  EVENING: "18:30 - 21:00",
};
const PERIODS: { key: Period; label: string }[] = [
  { key: "MORNING", label: "S\u00e1ng" },
  { key: "AFTERNOON", label: "Chi\u1ec1u" },
  { key: "EVENING", label: "T\u1ed1i" },
];

type SelectOption = { id: string; label: string };

/* ===== Sub-components ===== */
function StatusBadge({ status }: { status: AttendanceStatus }) {
  const map = {
    present: { text: "C\u00f3 m\u1eb7t", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    makeup: { text: "H\u1ecdc b\u00f9", cls: "bg-sky-50 text-sky-700 border border-sky-200" },
    absent: { text: "V\u1eafng", cls: "bg-red-50 text-red-700 border border-red-200" },
    notMarked: { text: "Ch\u01b0a \u0111i\u1ec3m danh", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  } as const;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status].cls}`}>
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
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={4} className="text-gray-200" fill="transparent" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={4} className="text-red-600" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-red-600">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}

function Pagination({
  currentPage, totalPages, totalItems, itemsPerPage, onPageChange,
}: {
  currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number; onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage <= 3) pages.push(2, 3, 4, "...", totalPages);
      else if (currentPage >= totalPages - 2) pages.push("...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
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
          Hi\u1ec3n th\u1ecb <span className="font-semibold text-gray-900">{startItem}</span> - <span className="font-semibold text-gray-900">{endItem}</span> trong t\u1ed5ng s\u1ed1 <span className="font-semibold text-gray-900">{totalItems}</span> h\u1ecdc vi\u00ean
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`p-2 rounded-lg border transition-all ${currentPage === 1 ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-red-200 text-gray-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"}`}>
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === "...") return <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>;
              return (
                <button key={page} onClick={() => onPageChange(page as number)} className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentPage === page ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md" : "border border-red-200 hover:bg-red-50 text-gray-700"}`}>
                  {page}
                </button>
              );
            })}
          </div>
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`p-2 rounded-lg border transition-all ${currentPage === totalPages ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-red-200 text-gray-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"}`}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== CHANGE ROOM MODAL =================== */
function ChangeRoomModal({
  isOpen, onClose, currentRoom, onConfirm,
}: {
  isOpen: boolean; onClose: () => void; currentRoom: string;
  onConfirm: (roomId: string, roomName: string) => Promise<void>;
}) {
  const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedRoomId("");
    setError(null);
    const token = getAccessToken();
    if (!token) return;
    fetch(`/api/classrooms?pageNumber=1&pageSize=200`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const items: Record<string, unknown>[] = json?.data?.classrooms?.items ?? json?.data?.items ?? json?.data ?? (Array.isArray(json) ? json : []);
        setRoomOptions(items.map((r) => ({ id: String(r?.id ?? ""), label: String(r?.name ?? "Ph\u00f2ng") })).filter((r: SelectOption) => r.id));
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };
    if (isOpen) { document.addEventListener("mousedown", handleClickOutside); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("mousedown", handleClickOutside); document.body.style.overflow = "unset"; };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!selectedRoomId) return;
    setIsSubmitting(true); setError(null);
    try {
      const roomName = roomOptions.find((r) => r.id === selectedRoomId)?.label ?? "";
      await onConfirm(selectedRoomId, roomName);
      onClose();
    } catch (err: unknown) { setError((err as Error)?.message ?? "\u0110\u1ed5i ph\u00f2ng th\u1ea5t b\u1ea1i."); }
    finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-white/10"><ArrowLeftRight size={20} className="text-white" /></div><h2 className="text-lg font-bold text-white">{"\u0110\u1ed5i ph\u00f2ng h\u1ecdc"}</h2></div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer"><X size={20} className="text-white" /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">{"Ph\u00f2ng hi\u1ec7n t\u1ea1i:"} <span className="font-semibold">{currentRoom || "Ch\u01b0a c\u00f3"}</span></div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">{"Ch\u1ecdn ph\u00f2ng m\u1edbi"}</label>
            <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="">{"Ch\u1ecdn ph\u00f2ng"}</option>
              {roomOptions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 cursor-pointer">{"H\u1ee7y"}</button>
          <button onClick={handleSubmit} disabled={!selectedRoomId || isSubmitting} className="px-5 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? "\u0110ang x\u1eed l\u00fd..." : "X\u00e1c nh\u1eadn \u0111\u1ed5i ph\u00f2ng"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== CHANGE TEACHER MODAL =================== */
function ChangeTeacherModal({
  isOpen, onClose, currentTeacher, currentAssistant, onConfirm,
}: {
  isOpen: boolean; onClose: () => void; currentTeacher: string; currentAssistant?: string;
  onConfirm: (teacherId: string, teacherName: string, assistantId: string, assistantName: string) => Promise<void>;
}) {
  const [teacherOptions, setTeacherOptions] = useState<SelectOption[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedAssistantId, setSelectedAssistantId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTeacherId(""); setSelectedAssistantId(""); setError(null);
    const token = getAccessToken();
    if (!token) return;
    fetch(`/api/admin/users?pageNumber=1&pageSize=200&role=Teacher`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const items: Record<string, unknown>[] = json?.data?.items ?? json?.data?.users ?? json?.data ?? (Array.isArray(json) ? json : []);
        setTeacherOptions(items.map((u) => ({ id: String(u?.id ?? ""), label: String(u?.name ?? u?.fullName ?? u?.email ?? "Teacher") })).filter((t: SelectOption) => t.id));
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };
    if (isOpen) { document.addEventListener("mousedown", handleClickOutside); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("mousedown", handleClickOutside); document.body.style.overflow = "unset"; };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!selectedTeacherId) return;
    setIsSubmitting(true); setError(null);
    try {
      const teacherName = teacherOptions.find((t) => t.id === selectedTeacherId)?.label ?? "";
      const assistantName = teacherOptions.find((t) => t.id === selectedAssistantId)?.label ?? "";
      await onConfirm(selectedTeacherId, teacherName, selectedAssistantId, assistantName);
      onClose();
    } catch (err: unknown) { setError((err as Error)?.message ?? "\u0110\u1ed5i gi\u00e1o vi\u00ean th\u1ea5t b\u1ea1i."); }
    finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-white/10"><Users size={20} className="text-white" /></div><h2 className="text-lg font-bold text-white">{"\u0110\u1ed5i gi\u00e1o vi\u00ean"}</h2></div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer"><X size={20} className="text-white" /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-gray-50 p-3 space-y-1">
            <div className="text-sm text-gray-600">{"GV ch\u00ednh hi\u1ec7n t\u1ea1i:"} <span className="font-semibold">{currentTeacher || "Ch\u01b0a c\u00f3"}</span></div>
            {currentAssistant && <div className="text-sm text-gray-600">{"GV ph\u1ee5 hi\u1ec7n t\u1ea1i:"} <span className="font-semibold">{currentAssistant}</span></div>}
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">{"Gi\u00e1o vi\u00ean ch\u00ednh m\u1edbi *"}</label>
            <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">{"Ch\u1ecdn gi\u00e1o vi\u00ean ch\u00ednh"}</option>
              {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">{"Gi\u00e1o vi\u00ean ph\u1ee5 (t\u00f9y ch\u1ecdn)"}</label>
            <select value={selectedAssistantId} onChange={(e) => setSelectedAssistantId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">{"Kh\u00f4ng c\u00f3"}</option>
              {teacherOptions.filter((t) => t.id !== selectedTeacherId).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 cursor-pointer">{"H\u1ee7y"}</button>
          <button onClick={handleSubmit} disabled={!selectedTeacherId || isSubmitting} className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? "\u0110ang x\u1eed l\u00fd..." : "X\u00e1c nh\u1eadn \u0111\u1ed5i GV"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== CHANGE SCHEDULE MODAL =================== */
function ChangeScheduleModal({
  isOpen, onClose, currentDate, currentTime, onConfirm,
}: {
  isOpen: boolean; onClose: () => void; currentDate: string; currentTime: string;
  onConfirm: (newDate: string, newTime: string) => Promise<void>;
}) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setNewDate(currentDate);
    setNewTime(currentTime);
  }, [isOpen, currentDate, currentTime]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };
    if (isOpen) { document.addEventListener("mousedown", handleClickOutside); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("mousedown", handleClickOutside); document.body.style.overflow = "unset"; };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!newDate || !newTime) return;
    setIsSubmitting(true); setError(null);
    try {
      await onConfirm(newDate, newTime);
      onClose();
    } catch (err: unknown) { setError((err as Error)?.message ?? "\u0110\u1ed5i l\u1ecbch th\u1ea5t b\u1ea1i."); }
    finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-white/10"><Calendar size={20} className="text-white" /></div><h2 className="text-lg font-bold text-white">{"\u0110\u1ed5i l\u1ecbch l\u1edbp h\u1ecdc"}</h2></div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer"><X size={20} className="text-white" /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
            {"L\u1ecbch hi\u1ec7n t\u1ea1i:"} <span className="font-semibold">{currentDate} \u2022 {currentTime}</span>
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">{"Ng\u00e0y m\u1edbi"}</label>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">{"Ca h\u1ecdc"}</label>
            <div className="grid grid-cols-3 gap-2">
              {PERIODS.map((p) => (
                <button key={p.key} type="button" onClick={() => setNewTime(PERIOD_TIME_RANGES[p.key])}
                  className={`px-2 py-2 rounded-xl border text-sm font-semibold cursor-pointer ${newTime === PERIOD_TIME_RANGES[p.key] ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">{"Th\u1eddi gian chi ti\u1ebft"}</label>
            <input type="text" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="VD: 08:00 - 10:00" />
          </div>
        </div>
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 cursor-pointer">{"H\u1ee7y"}</button>
          <button onClick={handleSubmit} disabled={!newDate || !newTime || isSubmitting} className="px-5 py-2 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? "\u0110ang x\u1eed l\u00fd..." : "X\u00e1c nh\u1eadn \u0111\u1ed5i l\u1ecbch"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== MAIN PAGE ===== */
export default function StaffSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const lessonId = (params.id as string) || "";

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummaryApi>(null);
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
  const itemsPerPage = 10;

  // Swap modals
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => { setIsPageLoaded(true); }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        if (!lessonId) { setError("Thi\u1ebfu m\u00e3 bu\u1ed5i d\u1ea1y."); setLoading(false); return; }

        // Fetch session detail (required)
        const sessionDetail = await fetchSessionDetail(lessonId, controller.signal);
        if (controller.signal.aborted) return;
        setLesson(sessionDetail.lesson);

        // Fetch attendance (optional — don't block page if it fails)
        try {
          const attendance = await fetchAttendance(lessonId, controller.signal);
          if (!controller.signal.aborted) {
            setAttendanceSummary(attendance.attendanceSummary);
            setList(attendance.students);
            setCurrentPage(1);
          }
        } catch {
          // Attendance not available — show page with empty student list
          if (!controller.signal.aborted) {
            setAttendanceSummary(null);
            setList([]);
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError((err as Error).message || "\u0110\u00e3 x\u1ea3y ra l\u1ed7i khi t\u1ea3i d\u1eef li\u1ec7u bu\u1ed5i d\u1ea1y.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    if (lessonId) fetchData();
    else { setLoading(false); setError("Thi\u1ebfu m\u00e3 bu\u1ed5i d\u1ea1y."); }
    return () => controller.abort();
  }, [lessonId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    return list.filter((s) => s.studentName.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()));
  }, [list, search]);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = isEditing ? editedStudents.slice(startIndex, endIndex) : filtered.slice(startIndex, endIndex);

  const handleStartEdit = useCallback(() => { setEditedStudents([...list]); setIsEditing(true); setSaveMsg(null); }, [list]);
  const handleCancelEdit = useCallback(() => { setIsEditing(false); setEditedStudents([]); setSaveMsg(null); }, []);
  const handleStatusChange = useCallback((studentId: string, newStatus: AttendanceStatus) => {
    setEditedStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s)));
  }, []);
  const handleNoteChange = useCallback((studentId: string, note: string) => {
    setEditedStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, note } : s)));
  }, []);

  const handleSave = useCallback(async () => {
    if (!lessonId) return;
    setSaving(true); setSaveMsg(null);
    try {
      const anyMarked = list.some((s) => s.status && s.status !== "notMarked");
      await saveAttendance(lessonId, editedStudents, !anyMarked);
      const attendance = await fetchAttendance(lessonId);
      setList(attendance.students);
      setAttendanceSummary(attendance.attendanceSummary);
      setIsEditing(false);
      setEditedStudents([]);
      setSaveMsg({ type: "success", text: "\u0110\u00e3 l\u01b0u \u0111i\u1ec3m danh th\u00e0nh c\u00f4ng" });
    } catch (err: unknown) {
      setSaveMsg({ type: "error", text: (err as Error)?.message ?? "C\u00f3 l\u1ed7i x\u1ea3y ra khi l\u01b0u \u0111i\u1ec3m danh" });
    } finally { setSaving(false); }
  }, [lessonId, editedStudents, list]);

  // Swap handlers
  const handleChangeRoom = useCallback(async (roomId: string, roomName: string) => {
    await updateAdminSession(lessonId, { plannedRoomId: roomId });
    setLesson((prev) => prev ? { ...prev, room: roomName } : prev);
  }, [lessonId]);

  const handleChangeTeacher = useCallback(async (teacherId: string, teacherName: string, assistantId: string) => {
    const payload: Record<string, string> = { plannedTeacherId: teacherId };
    if (assistantId) payload.plannedAssistantId = assistantId;
    await updateAdminSession(lessonId, payload);
    setLesson((prev) => prev ? { ...prev, teacher: teacherName } : prev);
  }, [lessonId]);

  const handleChangeSchedule = useCallback(async (newDate: string, newTime: string) => {
    const [startTime] = newTime.split(" - ");
    const plannedDatetime = `${newDate}T${startTime.trim()}:00`;
    await updateAdminSession(lessonId, { plannedDatetime });
    const [y, m, d] = newDate.split("-");
    setLesson((prev) => prev ? { ...prev, date: `${d}/${m}/${y}`, time: newTime } : prev);
  }, [lessonId]);

  const totalStudentsCount = attendanceSummary?.totalStudents ?? list.length;
  const checkedCount = attendanceSummary?.totalStudents != null && attendanceSummary?.notMarkedCount != null
    ? Math.max(0, attendanceSummary.totalStudents - attendanceSummary.notMarkedCount)
    : list.filter((s) => s.status && s.status !== "notMarked").length;

  const backUrl = `/${locale}/portal/staff-management/schedule`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-red-600 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">{"\u0110ang t\u1ea3i th\u00f4ng tin bu\u1ed5i d\u1ea1y..."}</h2>
          <p className="text-gray-600">{"Vui l\u00f2ng ch\u1edd trong gi\u00e2y l\u00e1t."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">{"C\u00f3 l\u1ed7i x\u1ea3y ra"}</h2>
          <p className="text-gray-600">{error}</p>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => router.refresh()} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition cursor-pointer">{"Th\u1eed l\u1ea1i"}</button>
            <button onClick={() => router.push(backUrl)} className="px-5 py-2.5 rounded-xl bg-white border border-red-200 text-gray-800 hover:border-red-300 transition cursor-pointer">{"Quay l\u1ea1i l\u1ecbch d\u1ea1y"}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">{"Kh\u00f4ng t\u00ecm th\u1ea5y bu\u1ed5i h\u1ecdc"}</h2>
          <p className="text-gray-600">{"Bu\u1ed5i h\u1ecdc kh\u00f4ng t\u1ed3n t\u1ea1i ho\u1eb7c \u0111\u00e3 b\u1ecb xo\u00e1."}</p>
          <button onClick={() => router.push(backUrl)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition cursor-pointer">{"Quay l\u1ea1i l\u1ecbch d\u1ea1y"}</button>
        </div>
      </div>
    );
  }

  // Convert lesson.date (dd/mm/yyyy) to yyyy-mm-dd for the schedule modal
  const lessonDateISO = (() => {
    const parts = (lesson.date ?? "").split("/");
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : "";
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6">
      {/* Top Bar */}
      <div className={`flex items-center justify-between mb-6 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <button onClick={() => router.push(backUrl)} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition border-0 cursor-pointer">
          <ArrowLeft size={20} />
          <span>{"Quay l\u1ea1i l\u1ecbch d\u1ea1y"}</span>
        </button>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition flex items-center gap-2 cursor-pointer">
            <Download size={16} /> {"Xu\u1ea5t danh s\u00e1ch"}
          </button>
        </div>
      </div>

      {/* Lesson Info + Swap Buttons */}
      <div className={`bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-6 shadow-sm mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl text-white shadow-lg">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lesson.lesson}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-700 mt-2">
                <span className="inline-flex items-center gap-1"><CalendarClock size={16} className="text-red-600" /> {lesson.date}</span>
                <span className="inline-flex items-center gap-1"><Clock size={16} className="text-red-600" /> {lesson.time}</span>
                <span className="inline-flex items-center gap-1"><MapPin size={16} className="text-red-600" /> {lesson.room}</span>
                <span className="inline-flex items-center gap-1"><Users size={16} className="text-red-600" /> {lesson.students} HV</span>
              </div>
              {lesson.branch && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">{lesson.branch}</span>
                </div>
              )}
            </div>
          </div>
          {/* Swap buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowRoomModal(true)} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer">
              <ArrowLeftRight size={16} /> {"\u0110\u1ed5i ph\u00f2ng"}
            </button>
            <button onClick={() => setShowTeacherModal(true)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer">
              <Users size={16} /> {"\u0110\u1ed5i GV"}
            </button>
            <button onClick={() => setShowScheduleModal(true)} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer">
              <Calendar size={16} /> {"\u0110\u1ed5i l\u1ecbch"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">{"T\u1ed5ng s\u0129 s\u1ed1"}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalStudentsCount ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="text-sm text-emerald-700">{"\u0110\u00e3 \u0111i\u1ec3m danh"}</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{checkedCount}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="text-sm text-amber-700">{"Ch\u01b0a \u0111i\u1ec3m danh"}</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{attendanceSummary ? (attendanceSummary.notMarkedCount ?? 0) : Math.max(0, totalStudentsCount - checkedCount)}</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{"Danh s\u00e1ch h\u1ecdc vi\u00ean"}</h2>
              <p className="text-sm text-gray-600">
                {totalStudentsCount ? `${checkedCount} / ${totalStudentsCount} h\u1ecdc vi\u00ean \u0111\u00e3 \u0111\u01b0\u1ee3c \u0111i\u1ec3m danh` : "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u \u0111i\u1ec3m danh"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 justify-end">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={"T\u00ecm ki\u1ebfm h\u1ecdc vi\u00ean..."} className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition text-sm placeholder:text-gray-400" />
              </div>
              {!isEditing ? (
                <button onClick={handleStartEdit} className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition flex items-center gap-2 text-sm cursor-pointer">
                  <Edit3 size={16} /> {"Ch\u1ec9nh s\u1eeda \u0111i\u1ec3m danh"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleCancelEdit} disabled={saving} className="px-4 py-2 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition text-sm cursor-pointer disabled:opacity-50">
                    <X size={16} className="inline mr-1" /> {"H\u1ee7y"}
                  </button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg transition flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {"L\u01b0u \u0111i\u1ec3m danh"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {saveMsg && (
            <div className={`mx-6 mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${saveMsg.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-rose-50 border border-rose-200 text-rose-700"}`}>
              {saveMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {saveMsg.text}
            </div>
          )}
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">{"H\u1ecdc vi\u00ean"}</th>
                <th className="py-3 px-6 text-center text-sm font-semibold tracking-wide text-gray-700">{"\u0110\u00e3 v\u1eafng"}</th>
                <th className="py-3 px-6 text-center text-sm font-semibold tracking-wide text-gray-700">{"Tr\u1ea1ng th\u00e1i"}</th>
                <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">{"Ghi ch\u00fa"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                      <Users size={24} className="text-gray-400" />
                    </div>
                    <div className="text-gray-600 font-medium">{"Ch\u01b0a c\u00f3 danh s\u00e1ch h\u1ecdc vi\u00ean"}</div>
                    <div className="text-sm text-gray-500 mt-1">{"D\u1eef li\u1ec7u \u0111i\u1ec3m danh cho bu\u1ed5i d\u1ea1y n\u00e0y ch\u01b0a \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt."}</div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-center font-bold text-sm">
                          {student.studentName.split(" ").map((w) => w[0]).filter(Boolean).slice(-2).join("").toUpperCase() || "HV"}
                        </div>
                        <div className="font-semibold text-gray-900">{student.studentName}</div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center"><AbsencePie value={student.absenceRate} /></div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      {isEditing ? (
                        <select value={student.status ?? "notMarked"} onChange={(e) => handleStatusChange(student.id, e.target.value as AttendanceStatus)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-red-300 cursor-pointer">
                          <option value="notMarked">{`Ch\u01b0a \u0111i\u1ec3m danh`}</option>
                          <option value="present">{`C\u00f3 m\u1eb7t`}</option>
                          <option value="absent">{`V\u1eafng`}</option>
                          <option value="makeup">{`H\u1ecdc b\u00f9`}</option>
                        </select>
                      ) : student.status ? (
                        <StatusBadge status={student.status} />
                      ) : (
                        <span className="text-xs text-gray-500">{"Ch\u01b0a \u0111i\u1ec3m danh"}</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      {isEditing ? (
                        <input type="text" value={student.note ?? ""} onChange={(e) => handleNoteChange(student.id, e.target.value)} placeholder={"Ghi ch\u00fa..."} className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-red-300" />
                      ) : (
                        student.note || <span className="text-gray-400">{"Kh\u00f4ng c\u00f3 ghi ch\u00fa"}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        )}
      </div>

      {/* Swap Modals */}
      <ChangeRoomModal
        isOpen={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        currentRoom={lesson.room}
        onConfirm={handleChangeRoom}
      />
      <ChangeTeacherModal
        isOpen={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        currentTeacher={lesson.teacher}
        onConfirm={handleChangeTeacher}
      />
      <ChangeScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        currentDate={lessonDateISO}
        currentTime={lesson.time}
        onConfirm={handleChangeSchedule}
      />
    </div>
  );
}
