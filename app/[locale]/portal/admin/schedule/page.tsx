"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getAccessToken } from "@/lib/store/authToken";
import { getAllBranches } from "@/lib/api/branchService";
import { createAdminSession, fetchAdminSessions, updateSessionColor, updateClassColor } from "@/app/api/admin/sessions";
import { fetchAdminUsersByIds, fetchAdminClasses } from "@/app/api/admin/classes";
import type { CreateSessionRequest, ParticipationType, Session } from "@/types/admin/sessions";
import {
  CalendarRange,
  MapPin,
  Users,
  ArrowLeftRight,
  Clock3,
  PlusCircle,
  Download,
  Send,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Palette,
  X,
  Save,
  RotateCcw,
  Building2,
  FileText,
  AlertCircle,
  Tag,
  User,
  Bell,
  CalendarArrowDown,
  BookOpen
} from "lucide-react";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { useToast } from "@/hooks/use-toast";

type SlotType = "CLASS" | "MAKEUP" | "EVENT";
type Slot = {
  id: string;
  classId: string;
  title: string;
  type: SlotType;
  teacher: string;
  room: string;
  time: string;
  date: string;
  note?: string;
  color?: string;
};

const PERIOD_TIME_RANGES: Record<Period, string> = {
  MORNING: "08:00 - 11:00",
  AFTERNOON: "14:00 - 17:00",
  EVENING: "18:30 - 21:00",
};

/* =================== DATA từ backend (không dùng mock cứng) =================== */
// Ban đầu để rỗng, sau đó sẽ được lấp bởi dữ liệu lấy từ API (/api/sessions, /api/teacher/timetable, ...)
const SLOTS: Slot[] = [];

const DEFAULT_SESSION_COLOR = "#FEE2E2";

/* =================== MÀU RÕ RÀNG THEME ĐỎ TRẮNG ĐEN =================== */
const TYPE_META: Record<
  SlotType,
  { text: string; badge: string; chip: string; bar: string; defaultColor: string }
> = {
  CLASS: {
    text: "Lớp học",
    badge: "bg-red-600 text-white",
    chip: "bg-red-50 text-red-700 border border-red-200",
    bar: "border-l-4 border-red-500",
    defaultColor: "#FEE2E2"
  },
  MAKEUP: {
    text: "Buổi bù",
    badge: "bg-gray-700 text-white",
    chip: "bg-gray-100 text-gray-700 border border-gray-200",
    bar: "border-l-4 border-gray-500",
    defaultColor: "#E5E7EB"
  },
  EVENT: {
    text: "Sự kiện",
    badge: "bg-black/10 text-gray-800 border border-gray-200",
    chip: "bg-gray-100 text-gray-800 border border-gray-200",
    bar: "border-l-4 border-gray-400",
    defaultColor: "#E5E7EB"
  },
};

/* =================== COLOR OPTIONS - Theme Đỏ Đen Trắng =================== */
const COLOR_OPTIONS = [
  { name: 'Đỏ nhạt', value: '#FEE2E2' },
  { name: 'Xanh nhạt', value: '#DCEBFF' },
  { name: 'Hồng nhạt', value: '#FDE2FF' },
  { name: 'Xanh lá nhạt', value: '#EEF7B9' },
  { name: 'Tím nhạt', value: '#E6D9FF' },
  { name: 'Tím pastel', value: '#E9D5FF' },
  { name: 'Cam nhạt', value: '#FFE8CC' },
  { name: 'Vàng nhạt', value: '#FFF7CC' },
  { name: 'Xanh mint', value: '#D1FAE5' },
  { name: 'Xanh cyan', value: '#CFFAFE' },
  { name: 'Lam pastel', value: '#DBEAFE' },
  { name: 'Tím oải hương', value: '#EDE9FE' },
  { name: 'Hồng đào', value: '#FBCFE8' },
  { name: 'Kem chanh', value: '#ECFCCB' },
  { name: 'Cam đào', value: '#FED7AA' },
  { name: 'Xám bạc', value: '#E5E7EB' },
  { name: 'Be sáng', value: '#FAE8D4' },
  { name: 'Xanh ngọc nhạt', value: '#CCFBF1' },
  { name: 'Xanh trời nhạt', value: '#E0F2FE' },
  { name: 'Hồng phấn', value: '#FCE7F3' },
];

const AUTO_CLASS_COLORS = COLOR_OPTIONS.map((item) => item.value);

const LEGACY_COLOR_TO_HEX: Record<string, string> = {
  "bg-gradient-to-r from-red-600 to-red-700": "#FEE2E2",
  "bg-gradient-to-r from-red-500 to-red-600": "#FEE2E2",
  "bg-gradient-to-r from-gray-600 to-gray-700": "#E5E7EB",
  "bg-gradient-to-r from-gray-500 to-gray-600": "#E5E7EB",
  "bg-gradient-to-r from-gray-700 to-gray-800": "#D1D5DB",
  "bg-gradient-to-r from-gray-200 to-gray-300": "#F3F4F6",
  "bg-gradient-to-r from-red-600 to-gray-600": "#FECACA",
  "bg-gradient-to-r from-blue-500 to-sky-500": "#DCEBFF",
};

function normalizeSessionColor(color?: string | null): string {
  if (!color) return DEFAULT_SESSION_COLOR;
  const parsed = parseCustomColorInput(color);
  return parsed ?? DEFAULT_SESSION_COLOR;
}

function parseCustomColorInput(input?: string | null): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  const legacy = LEGACY_COLOR_TO_HEX[raw];
  if (legacy) return legacy;

  const hexMatch = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    if (hexMatch[1].length === 3) {
      const [r, g, b] = hexMatch[1].split("");
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    return raw.toUpperCase();
  }

  const rgbMatch = raw.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, Number(rgbMatch[1])));
    const g = Math.max(0, Math.min(255, Number(rgbMatch[2])));
    const b = Math.max(0, Math.min(255, Number(rgbMatch[3])));
    const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return null;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getAutoClassColor(classId?: string | null): string {
  const key = (classId ?? "").trim();
  if (!key) return DEFAULT_SESSION_COLOR;
  return AUTO_CLASS_COLORS[hashString(key) % AUTO_CLASS_COLORS.length];
}

function resolveSlotColor(color: string | null | undefined, classId: string | null | undefined, type: SlotType): string {
  if (color && color.trim()) {
    return normalizeSessionColor(color);
  }
  if (type === "CLASS") {
    return getAutoClassColor(classId);
  }
  return TYPE_META[type].defaultColor;
}

function isSameColor(a?: string | null, b?: string | null): boolean {
  return normalizeSessionColor(a) === normalizeSessionColor(b);
}

/* ===== Components ===== */
function TypeBadge({ type }: { type: SlotType }) {
  const { text, badge } = TYPE_META[type];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{text}</span>;
}

/* =================== CREATE SCHEDULE MODAL =================== */
interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateSessionRequest, display: { title: string; room: string; teacher: string; color: string }) => Promise<void>;
  prefillDate?: string; // yyyy-mm-dd
  prefillTime?: string; // "HH:mm - HH:mm"
}

interface ScheduleFormData {
  branchId: string;
  type: SlotType;
  classId: string;
  teacherId: string;
  roomId: string;
  assistantId: string;
  date: string;
  time: string;
  period: Period;
  color: string;
  note: string;
  sendNotification: boolean;
  participationType: ParticipationType;
}

const initialFormData: ScheduleFormData = {
  branchId: "",
  type: "CLASS",
  classId: "",
  teacherId: "",
  roomId: "",
  assistantId: "",
  date: "",
  time: "",
  period: "EVENING",
  color: DEFAULT_SESSION_COLOR,
  note: "",
  sendNotification: true,
  participationType: "OFFLINE",
};

type SelectOption = { id: string; label: string };

function CreateScheduleModal({ isOpen, onClose, onSave, prefillDate, prefillTime }: CreateScheduleModalProps) {
  const [formData, setFormData] = useState<ScheduleFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ScheduleFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [branchOptions, setBranchOptions] = useState<SelectOption[]>([]);
  const [classOptions, setClassOptions] = useState<SelectOption[]>([]);
  const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<SelectOption[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  const findLabel = (options: SelectOption[], id: string) =>
    options.find((o) => o.id === id)?.label ?? "";

  const buildPlannedDatetimeISO = (dateISO: string, timeRange: string) => {
    const [start] = timeRange.split(" - ");
    const startTime = (start || "00:00").trim();

    if (!dateISO) return "";

    // Giữ nguyên giờ người dùng chọn, tránh bị lệch do timezone của trình duyệt.
    // Tạo chuỗi ISO có kèm offset múi giờ hiện tại (vd: +07:00 cho Việt Nam).
    const offsetMinutes = new Date().getTimezoneOffset(); // ví dụ: -420 cho UTC+7
    const sign = offsetMinutes <= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(abs / 60)).padStart(2, "0");
    const offsetMins = String(abs % 60).padStart(2, "0");

    return `${dateISO}T${startTime}:00${sign}${offsetHours}:${offsetMins}`;
  };

  const computeDurationMinutes = (timeRange: string) => {
    try {
      const [start, end] = timeRange.split(" - ").map((s) => s.trim());
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);
      return Number.isFinite(duration) && duration > 0 ? duration : 60;
    } catch {
      return 60;
    }
  };

  const fetchSelectData = async (branchId?: string) => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const authHeaders = { Authorization: `Bearer ${token}` };

      const branchQuery = branchId ? `&branchId=${encodeURIComponent(branchId)}` : "";

      const [classesRes, roomsRes, teachersRes] = await Promise.all([
        fetch(`/api/classes?pageNumber=1&pageSize=200${branchQuery}`, { headers: authHeaders }),
        fetch(`/api/classrooms?pageNumber=1&pageSize=200${branchQuery}`, { headers: authHeaders }),
        fetch(`/api/admin/users?pageNumber=1&pageSize=200&role=Teacher${branchQuery}`, { headers: authHeaders }),
      ]);

      const [classesJson, roomsJson, teachersJson] = await Promise.all([
        classesRes.ok ? classesRes.json() : Promise.resolve(null),
        roomsRes.ok ? roomsRes.json() : Promise.resolve(null),
        teachersRes.ok ? teachersRes.json() : Promise.resolve(null),
      ]);

      const classesItems: any[] =
        (classesJson?.data?.classes?.items as any[]) ??
        (classesJson?.data?.items as any[]) ??
        (classesJson?.data as any[]) ??
        (Array.isArray(classesJson) ? classesJson : []);

      const roomsItems: any[] =
        (roomsJson?.data?.classrooms?.items as any[]) ??
        (roomsJson?.data?.items as any[]) ??
        (roomsJson?.data as any[]) ??
        (Array.isArray(roomsJson) ? roomsJson : []);

      const teachersItems: any[] =
        (teachersJson?.data?.items as any[]) ??
        (teachersJson?.data?.users as any[]) ??
        (teachersJson?.data as any[]) ??
        (Array.isArray(teachersJson) ? teachersJson : []);

      setClassOptions(
        classesItems
          .map((c) => ({
            id: String(c?.id ?? c?.classId ?? c?.code ?? ""),
            label: String(c?.title ?? c?.name ?? c?.classTitle ?? c?.code ?? "Lớp học"),
          }))
          .filter((c) => c.id)
      );

      setRoomOptions(
        roomsItems
          .map((r) => ({
            id: String(r?.id ?? r?.roomId ?? r?.name ?? ""),
            label: String(r?.name ?? r?.roomName ?? r?.title ?? "Phòng"),
          }))
          .filter((r) => r.id)
      );

      setTeacherOptions(
        teachersItems
          .map((u) => ({
            id: String(u?.id ?? ""),
            label: String(u?.name ?? u?.fullName ?? u?.username ?? u?.email ?? "Teacher"),
          }))
          .filter((t) => t.id)
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
      setSubmitError(null);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Load danh sách chi nhánh khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await getAllBranches({ page: 1, limit: 100 });
        if (cancelled) return;

        const branches: any[] = res?.data?.branches ?? res?.data ?? [];
        setBranchOptions(
          branches
            .map((b) => ({
              id: String(b?.id ?? ""),
              label: String(b?.name ?? b?.code ?? "Chi nhánh"),
            }))
            .filter((b) => b.id)
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load branches for schedule modal:", err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Reset form mỗi lần mở modal, prefill ngày / giờ
  useEffect(() => {
    if (!isOpen) return;

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    setFormData((prev) => ({
      ...initialFormData,
      branchId: prev.branchId || "",
      date: prefillDate ?? formattedDate,
      time: prefillTime ?? prev.time,
    }));
    setErrors({});
  }, [isOpen, prefillDate, prefillTime]);

  // Khi đổi chi nhánh -> load lại lớp, phòng, giáo viên theo chi nhánh
  useEffect(() => {
    if (!isOpen) return;

    const branchId = formData.branchId;
    if (!branchId) {
      setClassOptions([]);
      setRoomOptions([]);
      setTeacherOptions([]);
      return;
    }

    fetchSelectData(branchId);
  }, [isOpen, formData.branchId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ScheduleFormData, string>> = {};

    if (!formData.branchId) newErrors.branchId = "Chi nhánh là bắt buộc";
    if (!formData.classId) newErrors.classId = "Lớp học là bắt buộc";
    if (!formData.teacherId) newErrors.teacherId = "Giáo viên là bắt buộc";
    if (!formData.roomId) newErrors.roomId = "Phòng học là bắt buộc";
    if (!formData.date) newErrors.date = "Ngày là bắt buộc";
    if (!formData.time.trim()) newErrors.time = "Thời gian là bắt buộc";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const plannedDatetime = buildPlannedDatetimeISO(formData.date, formData.time);
      const durationMinutes = computeDurationMinutes(formData.time);

      await onSave(
        {
          classId: formData.classId,
          plannedDatetime,
          durationMinutes,
          plannedRoomId: formData.roomId,
          plannedTeacherId: formData.teacherId,
          plannedAssistantId: formData.assistantId || undefined,
          participationType: formData.participationType,
        } as CreateSessionRequest,
        {
          title: findLabel(classOptions, formData.classId) || "Buổi học",
          room: findLabel(roomOptions, formData.roomId) || "Phòng",
          teacher: findLabel(teacherOptions, formData.teacherId) || "Giáo viên",
          color: normalizeSessionColor(formData.color),
        }
      );
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message ?? "Tạo lịch thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ScheduleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <CalendarDays size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Tạo lịch mới</h2>
                <p className="text-sm text-red-100">Thêm lịch học, buổi bù hoặc sự kiện mới</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {submitError}
              </div>
            )}

            {/* Row 0: Chi nhánh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Building2 size={16} className="text-red-600" />
                  Chi nhánh *
                </label>
                <div className="relative">
                  <select
                    value={formData.branchId}
                    onChange={(e) => handleChange("branchId", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${errors.branchId ? "border-red-500" : "border-gray-200"
                      }`}
                  >
                    <option value="">Chọn chi nhánh</option>
                    {branchOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.branchId && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.branchId}
                  </p>
                )}
              </div>
            </div>

            {/* Row 1: Lớp học & Loại */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Tag size={16} className="text-red-600" />
                  Lớp học *
                </label>
                <div className="relative">
                  <select
                    value={formData.classId}
                    onChange={(e) => handleChange("classId", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${errors.classId ? "border-red-500" : "border-gray-200"
                      }`}
                  >
                    <option value="">Chọn lớp học</option>
                    {classOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {errors.classId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.classId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.classId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Calendar size={16} className="text-red-600" />
                  Loại lịch
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "CLASS" as const, label: "Lớp học", color: "bg-red-50 text-red-800 border-red-300" },
                    { value: "MAKEUP" as const, label: "Buổi bù", color: "bg-rose-50 text-rose-800 border-rose-300" },
                    { value: "EVENT" as const, label: "Sự kiện", color: "bg-gray-100 text-gray-800 border-gray-200" },
                  ]).map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange("type", type.value)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${formData.type === type.value
                        ? `${type.color}`
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Giáo viên & Phòng học */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <User size={16} className="text-red-600" />
                  Giáo viên *
                </label>
                <div className="relative">
                  <select
                    value={formData.teacherId}
                    onChange={(e) => handleChange("teacherId", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${errors.teacherId ? "border-red-500" : "border-gray-200"
                      }`}
                  >
                    <option value="">Chọn giáo viên</option>
                    {teacherOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {errors.teacherId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.teacherId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.teacherId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Building2 size={16} className="text-red-600" />
                  Phòng học *
                </label>
                <div className="relative">
                  <select
                    value={formData.roomId}
                    onChange={(e) => handleChange("roomId", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 ${errors.roomId ? "border-red-500" : "border-gray-200"
                      }`}
                  >
                    <option value="">Chọn phòng học</option>
                    {roomOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {errors.roomId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.roomId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.roomId}</p>}
              </div>
            </div>

            {/* Row 3: Ngày & Ca học */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Calendar size={16} className="text-red-600" />
                  Ngày *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${errors.date ? "border-red-500" : "border-gray-200"
                      }`}
                  />
                  {errors.date && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.date && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.date}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Clock3 size={16} className="text-red-600" />
                  Ca học
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "MORNING" as const, label: "Sáng", time: PERIOD_TIME_RANGES.MORNING },
                    { value: "AFTERNOON" as const, label: "Chiều", time: PERIOD_TIME_RANGES.AFTERNOON },
                    { value: "EVENING" as const, label: "Tối", time: PERIOD_TIME_RANGES.EVENING },
                  ]).map((period) => (
                    <button
                      key={period.value}
                      type="button"
                      onClick={() => {
                        handleChange("period", period.value);
                        handleChange("time", period.time);
                      }}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center ${formData.period === period.value
                        ? "bg-gradient-to-r from-red-50 to-red-100 border-red-300 text-red-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <span>{period.label}</span>
                      <span className="text-xs font-normal mt-0.5">{period.time}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Thời gian chi tiết */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Clock3 size={16} className="text-red-600" />
                Thời gian chi tiết *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${errors.time ? "border-red-500" : "border-gray-200"
                    }`}
                  placeholder="VD: 18:30 - 20:00"
                />
                {errors.time && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.time && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.time}</p>}
              <p className="text-xs text-gray-500">Nhập theo định dạng HH:MM - HH:MM</p>
            </div>

            {/* Row 5: Màu sắc */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Palette size={16} className="text-red-600" />
                Màu sắc hiển thị
              </label>
              <div className="grid grid-cols-8">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange("color", normalizeSessionColor(color.value))}
                    className={`h-8 w-8 rounded-lg cursor-pointer border-2 ${isSameColor(formData.color, color.value) ? 'border-white ring-2 ring-red-500' : 'border-gray-300'
                      } hover:scale-110 transition-all`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <input
                  type="color"
                  value={normalizeSessionColor(formData.color)}
                  onChange={(e) => handleChange("color", normalizeSessionColor(e.target.value))}
                  className="h-9 w-14 rounded-lg border border-gray-300 bg-white cursor-pointer"
                  title="Tự chọn màu"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  onBlur={() => {
                    const parsed = parseCustomColorInput(formData.color);
                    if (parsed) handleChange("color", parsed);
                  }}
                  className="h-9 min-w-[170px] flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800"
                  placeholder="#AABBCC hoặc rgb(170, 187, 204)"
                />
              </div>
            </div>

            {/* Row 6: Ghi chú */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <FileText size={16} className="text-red-600" />
                Ghi chú
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleChange("note", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                placeholder="VD: Bù cho 03/12, Mang theo tài liệu, Chủ đề hôm nay..."
              />
            </div>

            {/* Row 8: Gửi thông báo */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.sendNotification ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
                  <Bell size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Gửi thông báo</div>
                  <div className="text-xs text-gray-600">Thông báo cho giáo viên và học viên</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange("sendNotification", !formData.sendNotification)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.sendNotification ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.sendNotification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(initialFormData);
                  const today = new Date();
                  const formattedDate = today.toISOString().split('T')[0];
                  setFormData(prev => ({ ...prev, date: formattedDate }));
                  setErrors({});
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
                Đặt lại
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              >
                <Save size={16} />
                {isSubmitting ? "Đang tạo..." : "Tạo lịch"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  lessonId,
  currentColor,
  onColorChange
}: {
  lessonId: string;
  currentColor: string;
  onColorChange: (lessonId: string, color: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [customColor, setCustomColor] = useState(normalizeSessionColor(currentColor));
  const [previewColor, setPreviewColor] = useState(normalizeSessionColor(currentColor));
  const pickerRef = useRef<HTMLDivElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    setCustomColor(normalizeSessionColor(currentColor));
    setPreviewColor(normalizeSessionColor(currentColor));
  }, [currentColor]);

  const commitColor = (color: string) => {
    const normalized = normalizeSessionColor(color);
    if (normalized !== normalizeSessionColor(currentColor)) {
      onColorChange(lessonId, normalized);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        // Commit the preview color when closing by clicking outside
        if (previewColor !== normalizeSessionColor(currentColor)) {
          commitColor(previewColor);
        }
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker, previewColor, currentColor]);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowPicker(!showPicker);
        }}
        className="text-xs bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg px-2 py-1 transition-colors cursor-pointer flex items-center gap-1 border border-gray-200"
        title="Đổi màu"
      >
        <Palette size={12} className="text-gray-800" />
      </button>
      {showPicker && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-[100] w-[230px]">
          <div className="text-[10px] font-semibold text-gray-800 mb-1.5 px-1">Chọn màu</div>
          <div className="grid grid-cols-4 gap-1.5">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={(e) => {
                  e.stopPropagation();
                  committedRef.current = true;
                  onColorChange(lessonId, normalizeSessionColor(color.value));
                  setShowPicker(false);
                }}
                className={`w-6 h-6 rounded-md border-2 ${isSameColor(currentColor, color.value) ? 'border-white ring-1 ring-red-500' : 'border-gray-300'} hover:scale-110 transition-all cursor-pointer`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              value={normalizeSessionColor(previewColor)}
              onChange={(e) => {
                // Only update local preview while dragging — no API call
                const picked = normalizeSessionColor(e.target.value);
                setPreviewColor(picked);
                setCustomColor(picked);
              }}
              onBlur={() => {
                // Commit when the native color picker closes
                commitColor(previewColor);
              }}
              className="h-8 w-12 rounded border border-gray-300 bg-white cursor-pointer"
              title="Tự chọn màu"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const parsed = parseCustomColorInput(customColor);
                  if (parsed) {
                    setCustomColor(parsed);
                    setPreviewColor(parsed);
                    commitColor(parsed);
                  }
                }
              }}
              onBlur={() => {
                const parsed = parseCustomColorInput(customColor);
                if (parsed) {
                  setCustomColor(parsed);
                  setPreviewColor(parsed);
                  commitColor(parsed);
                }
              }}
              className="h-8 flex-1 rounded border border-gray-300 px-2 text-[11px]"
              placeholder="#AABBCC hoặc rgb(1,2,3)"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Helpers ===== */
function parseVNDate(dateStr: string) {
  const [d, m, y] = dateStr.split("/").map(Number);
  return new Date(y, m - 1, d);
}
function startMinutes(timeRange: string) {
  const [start] = timeRange.split(" - ");
  const [h, m] = start.split(":").map(Number);
  return h * 60 + m;
}
function keyYMD(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function addDays(d: Date, n: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}
function startOfWeek(date: Date) {
  const dow = (date.getDay() + 6) % 7; // Mon=0..Sun=6
  const monday = new Date(date);
  monday.setDate(date.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

type Period = "MORNING" | "AFTERNOON" | "EVENING";
const PERIODS: { key: Period; label: string }[] = [
  { key: "MORNING", label: "Sáng" },
  { key: "AFTERNOON", label: "Chiều" },
  { key: "EVENING", label: "Tối" },
];
function getPeriod(timeRange: string): Period {
  const [start] = timeRange.split(" - ");
  const [h] = start.split(":").map(Number);
  if (h < 12) return "MORNING";
  if (h < 18) return "AFTERNOON";
  return "EVENING";
}

/* =================== GO TO DATE BUTTON =================== */
function GoToDateButton({ onSelect }: { onSelect: (date: Date) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedDate) return;
    const date = new Date(selectedDate);
    onSelect(date);
    setIsOpen(false);
    setSelectedDate("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedDate("");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer text-gray-700 flex items-center gap-2"
        title="Đi đến ngày"
      >
        <CalendarArrowDown size={16} />
        <span className="hidden sm:inline">Đi đến</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-100 min-w-[280px]">
          <div className="text-sm font-semibold text-gray-800 mb-3">
            Chọn ngày để xem tuần
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 text-sm mb-3"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedDate("");
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedDate}
              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xem tuần
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =================== WEEK TIMETABLE =================== */
function WeekTimetable({
  items,
  weekCursor,
  setWeekCursor,
  onColorChange,
  onCellClick,
  onSlotClick,
}: {
  items: Slot[];
  weekCursor: Date;
  setWeekCursor: (d: Date) => void;
  onColorChange?: (lessonId: string, color: string) => void;
  onCellClick?: (date: Date, period: Period) => void;
  onSlotClick?: (slotId: string) => void;
}) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekCursor, i)), [weekCursor]);

  const grouped = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const s of items) {
      const d = parseVNDate(s.date);
      const k = `${keyYMD(d)}|${getPeriod(s.time)}`;
      (map[k] ||= []).push(s);
    }
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => startMinutes(a.time) - startMinutes(b.time))
    );
    return map;
  }, [items]);

  const rangeText = `${days[0].toLocaleDateString("vi-VN")} – ${days[6].toLocaleDateString("vi-VN")}`;
  const todayKey = keyYMD(new Date());

  const getLightColor = (colorValue: string | undefined) => {
    if (!colorValue) return "#FEF2F2";
    if (colorValue.startsWith("#")) {
      // Hex alpha suffix for a soft background while keeping the selected hue
      return `${colorValue}33`;
    }
    // Backward compatibility for legacy Tailwind class values
    return "#FEF2F2";
  };

  const modeDot = (room: string) =>
    room.toLowerCase().includes("online") ? "bg-red-600" : "bg-gray-700";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
        <div className="flex items-center gap-4">
          <div className={`relative p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg`}>
            <CalendarDays size={24} />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-red-600">
                {days[0].getDate()}
              </span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">Lịch tuần</div>
            <div className="text-gray-700">{rangeText}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setWeekCursor(addDays(weekCursor, -7))}
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <div className="min-w-[220px] text-center text-sm font-semibold text-gray-700">
            Tuần từ {days[0].getDate()}/{days[0].getMonth() + 1} đến {days[6].getDate()}/{days[6].getMonth() + 1}
          </div>
          <button
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setWeekCursor(addDays(weekCursor, +7))}
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>
          <button
            className="ml-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer text-gray-700"
            onClick={() => setWeekCursor(startOfWeek(new Date()))}
          >
            Tuần này
          </button>
          <GoToDateButton onSelect={(date) => setWeekCursor(startOfWeek(date))} />
        </div>
      </div>

      <div className="grid grid-cols-8 border-t border-gray-200 bg-gradient-to-r from-red-50 to-gray-100 text-sm font-semibold text-gray-700">
        <div className="px-4 py-3">Ca / Ngày</div>
        {days.map((d) => {
          const key = keyYMD(d);
          const isToday = key === todayKey;
          const dow = d.toLocaleDateString("vi-VN", { weekday: "long" });
          return (
            <div
              key={key}
              className={`px-4 py-3 border-l border-gray-200 ${isToday ? "bg-gradient-to-r from-red-100 to-red-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="capitalize">{dow}</span>
                <span className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold ${isToday
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200"
                  }`}>
                  {d.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {PERIODS.map((p, rowIdx) => (
        <div key={p.key} className="grid grid-cols-8 border-t border-gray-200">
          <div className="px-4 py-4 text-sm font-semibold text-gray-800 bg-gradient-to-r from-red-50 to-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg">{p.label}</span>
              {p.key === "MORNING" && <span className="text-xs text-gray-600 mt-1">7:00-12:00</span>}
              {p.key === "AFTERNOON" && <span className="text-xs text-gray-600 mt-1">12:00-18:00</span>}
              {p.key === "EVENING" && <span className="text-xs text-gray-600 mt-1">18:00-22:00</span>}
            </div>
          </div>

          {days.map((d) => {
            const k = `${keyYMD(d)}|${p.key}`;
            const evts = grouped[k] || [];
            return (
              <div
                key={k}
                className={`min-h-[130px] p-3 ${rowIdx % 2
                  ? "bg-white"
                  : "bg-gray-50"
                  } border-l border-gray-200`}
              >
                <div className="space-y-2">
                  {evts.map((s) => {
                    const slotColor = resolveSlotColor(s.color, s.classId, s.type);
                    const lightColor = getLightColor(slotColor);
                    return (
                      <div
                        key={s.id}
                        className="rounded-xl text-xs transition-all duration-200 hover:shadow-md cursor-pointer border border-gray-200 relative"
                        style={{ backgroundColor: lightColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSlotClick) onSlotClick(s.id);
                        }}
                      >
                        <div className="h-1.5 w-full rounded-t-xl overflow-hidden" style={{ backgroundColor: slotColor }} />
                        <div className="p-2.5">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slotColor }} />
                              <span className="font-semibold text-gray-900 truncate">{s.title}</span>
                            </div>

                            <div className="text-[11px] text-gray-700 mb-1">{s.time}</div>
                            <div className="text-[11px] text-gray-600 flex items-center gap-1">
                              <MapPin size={10} />
                              <span className="truncate">{s.room}</span>
                            </div>
                            {s.teacher && s.teacher.trim() && (
                              <div className="text-[10px] text-gray-700 mb-1 flex items-center gap-1">
                                <User size={9} className="text-gray-600 flex-shrink-0" />
                                <span className="truncate font-medium">{s.teacher}</span>
                              </div>
                            )}
                          </div>
                          {onColorChange && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <ColorPicker
                                lessonId={s.id}
                                currentColor={slotColor}
                                onColorChange={onColorChange}
                              />
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    );
                  })}
                  {evts.length === 0 && (
                    <div
                      className="text-[13px] text-gray-500 italic text-center py-4 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCellClick) {
                          onCellClick(d, p.key);
                        }
                      }}
                    >
                      Trống
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* =================== PAGE =================== */
export default function AdminSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  // Get classId and date from URL params
  const classIdFromUrl = searchParams.get("classId") ?? undefined;
  const dateFromUrl = searchParams.get("date") ?? undefined;

  // Branch filter hook
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  const { toast } = useToast();

  const [filter, setFilter] = useState<SlotType | "ALL">("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [classOptions, setClassOptions] = useState<{ id: string; name: string }[]>([]);
  const [slots, setSlots] = useState<Slot[]>(SLOTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [pendingColorChange, setPendingColorChange] = useState<{
    lessonId: string;
    classTitle: string;
    classId: string;
    newColor: string;
    sessionCount: number;
  } | null>(null);

  const list = useMemo(() => {
    let result = slots;
    if (filter !== "ALL") {
      result = result.filter((slot) => slot.type === filter);
    }
    if (classFilter !== "ALL") {
      result = result.filter((slot) => slot.classId === classFilter);
    }
    return result;
  }, [filter, classFilter, slots]);

  // Luôn bắt đầu từ tuần hiện tại khi reload trang, 
  // nhưng nếu có date từ URL thì bắt đầu từ ngày đó
  const getInitialWeekCursor = () => {
    if (dateFromUrl) {
      // Parse date format: "YYYY-MM-DD"
      const dateParts = dateFromUrl.split("-");
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return startOfWeek(date);
        }
      }
    }
    return startOfWeek(new Date());
  };

  const [weekCursor, setWeekCursor] = useState<Date>(getInitialWeekCursor);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // Load danh sách lớp học cho filter
  useEffect(() => {
    if (!isLoaded) return;

    async function loadClasses() {
      try {
        const classes = await fetchAdminClasses({ branchId: selectedBranchId ?? undefined });
        setClassOptions(
          classes.map((c: any) => ({
            id: c.id,
            name: c.name || c.code || "Lớp học",
          }))
        );
      } catch (err) {
        console.error("Failed to load classes for filter:", err);
      }
    }

    loadClasses();
  }, [selectedBranchId, isLoaded]);

  // Set class filter from URL if provided
  useEffect(() => {
    if (classIdFromUrl) {
      setClassFilter(classIdFromUrl || "ALL");
    }
  }, [classIdFromUrl]);

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => {
      const da = parseVNDate(a.date).getTime();
      const db = parseVNDate(b.date).getTime();
      if (da !== db) return da - db;
      return startMinutes(a.time) - startMinutes(b.time);
    });
  }, [list]);

  // Called when user picks a color — show confirm modal instead of applying immediately
  const handleColorChange = (lessonId: string, newColor: string) => {
    const targetSlot = slots.find(s => s.id === lessonId);
    if (!targetSlot) return;
    const targetClassId = targetSlot.classId;
    const sessionCount = slots.filter(s => s.classId === targetClassId && targetClassId).length;
    setPendingColorChange({
      lessonId,
      classTitle: targetSlot.title,
      classId: targetClassId,
      newColor,
      sessionCount,
    });
  };

  // Called when user confirms the modal
  const applyColorChange = async () => {
    if (!pendingColorChange) return;
    const { classId, newColor } = pendingColorChange;
    setPendingColorChange(null);

    const sameClassIds = slots
      .filter(s => s.classId === classId && !!classId)
      .map(s => s.id)
      .filter((id, i, arr) => arr.indexOf(id) === i);

    const originalColors = new Map<string, string | undefined>(slots.map(s => [s.id, s.color]));

    // Update UI immediately
    setSlots(prev => prev.map(slot =>
      slot.classId === classId ? { ...slot, color: newColor } : slot
    ));

    // Single API call updates ALL sessions of this class in DB (past + future)
    try {
      await updateClassColor(classId, newColor);
      toast.success({
        title: "Đã lưu màu",
        description: "Màu đã được đồng bộ cho toàn bộ lịch của lớp.",
      });
    } catch (err) {
      // Revert UI
      setSlots(prev => prev.map(slot =>
        sameClassIds.includes(slot.id)
          ? { ...slot, color: originalColors.get(slot.id) }
          : slot
      ));
      toast.destructive({
        title: "Lưu màu thất bại",
        description: "Không thể cập nhật màu lên máy chủ. Vui lòng thử lại.",
      });
    }
  };

  const handleCellClick = (date: Date, period: Period) => {
    setSelectedDate(date);
    setSelectedPeriod(period);
    setIsCreateModalOpen(true);
  };

  const handleSlotClick = (slotId: string) => {
    if (!slotId) return;
    router.push(`/${locale}/portal/admin/schedule/${slotId}`);
  };

  const formatVNDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };

  // Helper để parse ISO string thành Date object mà không bị ảnh hưởng bởi timezone
  const parseISODate = (isoString: string): Date => {
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      // Parse trực tiếp các thành phần và tạo Date
      return new Date(
        parseInt(match[1]),
        parseInt(match[2]) - 1,
        parseInt(match[3]),
        parseInt(match[4]),
        parseInt(match[5]),
        parseInt(match[6])
      );
    }
    return new Date(isoString);
  };

  const formatTimeRangeFromISO = (plannedDatetimeISO: string, durationMinutes: number) => {
    // Parse trực tiếp từ ISO string để tránh vấn đề timezone
    const start = parseISODate(plannedDatetimeISO);

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const sh = String(start.getHours()).padStart(2, "0");
    const sm = String(start.getMinutes()).padStart(2, "0");
    const eh = String(end.getHours()).padStart(2, "0");
    const em = String(end.getMinutes()).padStart(2, "0");
    return `${sh}:${sm} - ${eh}:${em}`;
  };

  const handleCreateSchedule = async (
    payload: CreateSessionRequest,
    display: { title: string; room: string; teacher: string; color: string }
  ) => {
    const created: Session = await createAdminSession(payload);

    const plannedDatetime = created.plannedDatetime || payload.plannedDatetime;
    const durationMinutes =
      typeof created.durationMinutes === "number" && created.durationMinutes > 0
        ? created.durationMinutes
        : payload.durationMinutes;

    const startDate = new Date(plannedDatetime);
    const newSlot: Slot = {
      id: created.id,
      classId: String(created.classId ?? payload.classId ?? ""),
      title: String(created.classTitle ?? created.className ?? display.title),
      type: "CLASS",
      teacher: String(created.plannedTeacherName ?? created.teacherName ?? display.teacher),
      room: String(created.plannedRoomName ?? created.roomName ?? display.room),
      date: formatVNDate(startDate),
      time: formatTimeRangeFromISO(plannedDatetime, durationMinutes),
      color: display.color,
      note: created.participationType ? `Participation: ${created.participationType}` : undefined,
    };

    setSlots((prev) => [...prev, newSlot]);
    setIsCreateModalOpen(false);
    setSelectedDate(null);
    setSelectedPeriod(null);

    // Persist the chosen color to backend
    if (created.id && display.color) {
      updateSessionColor(created.id, display.color).catch(err =>
        console.error("Lỗi lưu màu session mới:", err)
      );
    }
  };

  // Load lịch dạy thực tế từ API sessions khi mở trang (admin xem lịch giáo viên)
  useEffect(() => {
    if (!isLoaded) return;

    const loadInitialSchedule = async () => {
      try {
        const branchId = getBranchQueryParam();

        // Tính ngày bắt đầu và kết thúc của tuần hiện tại
        const weekStart = new Date(weekCursor);
        const weekEnd = new Date(weekCursor);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Dùng local date để tránh lệch múi giờ UTC+7
        const toLocalDateStr = (d: Date) => {
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${d.getFullYear()}-${mm}-${dd}`;
        };
        const fromDate = toLocalDateStr(weekStart);
        const toDate = toLocalDateStr(weekEnd);

        const sessions = await fetchAdminSessions({
          branchId,
          classId: classFilter !== "ALL" ? classFilter : undefined,
          from: fromDate,
          to: toDate,
          pageNumber: 1,
          pageSize: 200,
        });

        // Collect ALL teacher IDs (both with and without names) to ensure we get all teacher names
        const teacherIdsToFetch = new Set<string>();
        sessions.forEach((s: Session) => {
          const teacherId = s.plannedTeacherId ?? s.actualTeacherId;
          if (teacherId) {
            teacherIdsToFetch.add(String(teacherId));
          }
        });

        // Fetch teacher names for all teacher IDs
        let teacherNameMap = new Map<string, string>();
        if (teacherIdsToFetch.size > 0) {
          try {
            teacherNameMap = await fetchAdminUsersByIds(Array.from(teacherIdsToFetch));
          } catch (err) {
            console.error("Failed to fetch teacher names:", err);
          }
        }

        const mappedSlots: Slot[] = sessions.map((s: Session): Slot => {
          const planned = parseISODate(s.plannedDatetime);
          const durationMinutes =
            typeof s.durationMinutes === "number" && s.durationMinutes > 0
              ? s.durationMinutes
              : 60;

          // Get teacher name: prioritize API response, then fetched map, then empty
          let teacherName = (s.plannedTeacherName ?? s.teacherName ?? "").trim();
          const teacherId = s.plannedTeacherId ?? s.actualTeacherId;

          // If no teacher name from API, try to get from fetched map
          if (!teacherName && teacherId) {
            const fetchedName = teacherNameMap.get(String(teacherId));
            if (fetchedName && fetchedName.trim()) {
              teacherName = fetchedName.trim();
            }
          }

          return {
            id: s.id,
            classId: String(s.classId ?? ""),
            title: String(s.classTitle ?? s.className ?? "Buổi học"),
            type: "CLASS",
            teacher: teacherName.trim(),
            room: String(s.plannedRoomName ?? s.roomName ?? ""),
            date: formatVNDate(planned),
            time: formatTimeRangeFromISO(s.plannedDatetime, durationMinutes),
            note: s.participationType ?? "",
            color: resolveSlotColor(s.color, String(s.classId ?? ""), "CLASS"),
          };
        }).filter((slot) => slot.id);

        setSlots(mappedSlots);
      } catch (err) {
        console.error("Không thể tải lịch từ API:", err);
      }
    };

    loadInitialSchedule();
  }, [selectedBranchId, isLoaded, weekCursor, classFilter]);

  const stats = useMemo(() => {
    const total = slots.length;
    const byType = {
      CLASS: slots.filter(s => s.type === "CLASS").length,
      MAKEUP: slots.filter(s => s.type === "MAKEUP").length,
      EVENT: slots.filter(s => s.type === "EVENT").length,
    };
    return { total, byType };
  }, [slots]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 space-y-6">
        {/* Header */}
        <div className={`flex flex-wrap items-center justify-between gap-3 mb-8 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <CalendarDays size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Lịch chung toàn hệ thống
              </h1>
              <p className="text-sm text-gray-700 mt-1">
                Quản lý và theo dõi lịch học theo tuần với 3 ca Sáng – Chiều – Tối
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer text-gray-700">
                <Download size={16} /> Xuất lịch
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <PlusCircle size={16} /> Tạo lịch mới
              </button>
            </div>
          </div>
        </div>

        {/* Branch Filter Indicator */}
        {selectedBranchId && (
          <div className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Building2 size={16} className="text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              Đang lọc theo chi nhánh đã chọn
            </span>
          </div>
        )}

        {/* Bộ lọc */}
        <div className={`rounded-2xl border border-gray-200 bg-white p-4 flex flex-wrap gap-2 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Filter Lớp học */}
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-red-600" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
            >
              <option value="ALL">Tất cả lớp</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-l border-gray-200 mx-2"></div>

          {["ALL", "CLASS", "MAKEUP", "EVENT"].map((item) => {
            const isActive = filter === item;
            const meta = item === "ALL"
              ? { text: "Tất cả", badge: "bg-gradient-to-r from-red-700 to-red-900" }
              : TYPE_META[item as SlotType];

            return (
              <button
                key={item}
                onClick={() => setFilter(item as typeof filter)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${isActive
                  ? `${meta.badge} text-white shadow-md`
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <span>{item === "ALL" ? "Tất cả" : meta.text}</span>
                {item !== "ALL" && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-gray-100 text-gray-700"
                    }`}>
                    {stats.byType[item as SlotType]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Thời khoá biểu theo tuần */}
        <div className={`transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <WeekTimetable
            items={sortedList}
            weekCursor={weekCursor}
            setWeekCursor={setWeekCursor}
            onColorChange={handleColorChange}
            onCellClick={handleCellClick}
            onSlotClick={handleSlotClick}
          />
        </div>

        {/* Footer note
        <div className={`rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 space-y-3 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-r from-red-600 to-red-700 rounded-full"></div>
            Ghi chú quản lý
          </div>
          <p className="text-sm text-gray-700">
            • Các buổi bù sẽ được tổng hợp và gửi báo cáo cuối tháng cho bộ phận tài chính<br />
            • Nhấn vào biểu tượng <Palette size={12} className="inline ml-1" /> để đổi màu phân biệt các khóa học<br />
            • Lịch học có thể xuất file Excel/PDF bằng nút "Xuất lịch"
          </p>
        </div> */}
      </div>

      {/* Create Schedule Modal */}
      <CreateScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedDate(null);
          setSelectedPeriod(null);
        }}
        onSave={handleCreateSchedule}
        prefillDate={selectedDate ? keyYMD(selectedDate) : undefined}
        prefillTime={
          selectedPeriod
            ? selectedPeriod === "MORNING"
              ? PERIOD_TIME_RANGES.MORNING
              : selectedPeriod === "AFTERNOON"
                ? PERIOD_TIME_RANGES.AFTERNOON
                : PERIOD_TIME_RANGES.EVENING
            : undefined
        }
      />

      {/* Color Change Confirmation Modal */}
      {pendingColorChange && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setPendingColorChange(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 w-[320px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex-shrink-0 border border-gray-200" style={{ backgroundColor: pendingColorChange.newColor }} />
              <div>
                <div className="font-semibold text-gray-900 text-sm">Đổi màu lớp học</div>
                <div className="text-xs text-gray-500 mt-0.5">{pendingColorChange.classTitle}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Màu sẽ được áp dụng cho <span className="font-semibold text-gray-900">{pendingColorChange.sessionCount} buổi học</span> hiển thị trong tuần này của lớp này.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingColorChange(null)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Huỷ
              </button>
              <button
                onClick={applyColorChange}
                className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:shadow-md transition-all cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}