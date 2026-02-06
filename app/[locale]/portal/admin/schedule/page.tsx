"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/store/authToken";
import { getAllBranches } from "@/lib/api/branchService";
import { createAdminSession, fetchAdminSessions } from "@/app/api/admin/sessions";
import { fetchAdminUsersByIds } from "@/app/api/admin/classes";
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
  Bell
} from "lucide-react";
import { useBranchFilter } from "@/hooks/useBranchFilter";

type SlotType = "CLASS" | "MAKEUP" | "EVENT";
type Slot = {
  id: string;
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

/* =================== MÀU RÕ RÀNG THEO LOẠI =================== */
const TYPE_META: Record<
  SlotType,
  { text: string; badge: string; chip: string; bar: string; defaultColor: string }
> = {
  CLASS: {
    text: "Lớp học",
    badge: "bg-indigo-600 text-white",
    chip: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    bar: "border-l-4 border-indigo-400",
    defaultColor: "bg-gradient-to-r from-indigo-500 to-blue-500"
  },
  MAKEUP: {
    text: "Buổi bù",
    badge: "bg-rose-600 text-white",
    chip: "bg-rose-50 text-rose-700 border border-rose-200",
    bar: "border-l-4 border-rose-400",
    defaultColor: "bg-gradient-to-r from-fuchsia-500 to-purple-500"
  },
  EVENT: {
    text: "Sự kiện",
    badge: "bg-amber-500 text-white",
    chip: "bg-amber-50 text-amber-700 border border-amber-200",
    bar: "border-l-4 border-amber-400",
    defaultColor: "bg-gradient-to-r from-amber-500 to-orange-500"
  },
};

/* =================== COLOR OPTIONS =================== */
const COLOR_OPTIONS = [
  { name: 'Pink', value: 'bg-gradient-to-r from-pink-500 to-rose-500' },
  { name: 'Purple', value: 'bg-gradient-to-r from-fuchsia-500 to-purple-500' },
  { name: 'Amber', value: 'bg-gradient-to-r from-amber-500 to-orange-500' },
  { name: 'Emerald', value: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { name: 'Blue', value: 'bg-gradient-to-r from-blue-500 to-sky-500' },
  { name: 'Indigo', value: 'bg-gradient-to-r from-indigo-500 to-blue-500' },
  { name: 'Rose', value: 'bg-gradient-to-r from-rose-500 to-pink-600' },
  { name: 'Violet', value: 'bg-gradient-to-r from-violet-500 to-purple-600' },
];

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
  color: "bg-gradient-to-r from-pink-500 to-rose-500",
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
          color: formData.color,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <CalendarDays size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Tạo lịch mới</h2>
                <p className="text-sm text-pink-100">Thêm lịch học, buổi bù hoặc sự kiện mới</p>
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
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {submitError}
              </div>
            )}

            {/* Row 0: Chi nhánh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 size={16} className="text-pink-500" />
                  Chi nhánh *
                </label>
                <div className="relative">
                  <select
                    value={formData.branchId}
                    onChange={(e) => handleChange("branchId", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all ${
                      errors.branchId ? "border-rose-500" : "border-pink-200"
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
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.branchId && (
                  <p className="text-sm text-rose-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.branchId}
                  </p>
                )}
              </div>
            </div>

            {/* Row 1: Lớp học & Loại */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-pink-500" />
                  Lớp học *
                </label>
                <div className="relative">
                  <select
                    value={formData.classId}
                    onChange={(e) => handleChange("classId", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all ${errors.classId ? "border-rose-500" : "border-pink-200"
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
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.classId && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.classId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-pink-500" />
                  Loại lịch
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "CLASS" as const, label: "Lớp học", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
                    { value: "MAKEUP" as const, label: "Buổi bù", color: "bg-rose-100 text-rose-700 border-rose-300" },
                    { value: "EVENT" as const, label: "Sự kiện", color: "bg-amber-100 text-amber-700 border-amber-300" },
                  ]).map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange("type", type.value)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${formData.type === type.value
                        ? `${type.color}`
                        : "bg-white border-pink-200 text-gray-600 hover:bg-pink-50"
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
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User size={16} className="text-pink-500" />
                  Giáo viên *
                </label>
                <div className="relative">
                  <select
                    value={formData.teacherId}
                    onChange={(e) => handleChange("teacherId", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all ${errors.teacherId ? "border-rose-500" : "border-pink-200"
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
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.teacherId && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.teacherId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 size={16} className="text-pink-500" />
                  Phòng học *
                </label>
                <div className="relative">
                  <select
                    value={formData.roomId}
                    onChange={(e) => handleChange("roomId", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 ${errors.roomId ? "border-rose-500" : "border-pink-200"
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
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.roomId && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.roomId}</p>}
              </div>
            </div>

            {/* Row 3: Ngày & Ca học */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-pink-500" />
                  Ngày *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all ${errors.date ? "border-rose-500" : "border-pink-200"
                      }`}
                  />
                  {errors.date && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.date && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.date}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock3 size={16} className="text-pink-500" />
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
                        ? "bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300 text-pink-700"
                        : "bg-white border-pink-200 text-gray-600 hover:bg-pink-50"
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
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock3 size={16} className="text-pink-500" />
                Thời gian chi tiết *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all ${errors.time ? "border-rose-500" : "border-pink-200"
                    }`}
                  placeholder="VD: 18:30 - 20:00"
                />
                {errors.time && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-rose-500" />
                  </div>
                )}
              </div>
              {errors.time && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.time}</p>}
              <p className="text-xs text-gray-500">Nhập theo định dạng HH:MM - HH:MM</p>
            </div>

            {/* Row 5: Màu sắc */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Palette size={16} className="text-pink-500" />
                Màu sắc hiển thị
              </label>
              <div className="grid grid-cols-8">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange("color", color.value)}
                    className={`h-8 w-8 rounded-lg cursor-pointer ${color.value} border-2 ${formData.color === color.value ? 'border-white ring-2 ring-pink-500' : 'border-transparent'
                      } hover:scale-110 transition-all`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Row 6: Ghi chú */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText size={16} className="text-pink-500" />
                Ghi chú
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleChange("note", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
                placeholder="VD: Bù cho 03/12, Mang theo tài liệu, Chủ đề hôm nay..."
              />
            </div>

            {/* Row 8: Gửi thông báo */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50/50 to-rose-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.sendNotification ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <Bell size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Gửi thông báo</div>
                  <div className="text-xs text-gray-500">Thông báo cho giáo viên và học viên</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange("sendNotification", !formData.sendNotification)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.sendNotification ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-300'
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
        <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-pink-300 text-pink-600 font-semibold hover:bg-pink-50 transition-colors cursor-pointer"
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-pink-300 text-pink-600 font-semibold hover:bg-pink-50 transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
                Đặt lại
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all cursor-pointer ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""
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
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowPicker(!showPicker);
        }}
        className="text-xs bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg px-2 py-1 transition-colors cursor-pointer flex items-center gap-1 border border-pink-200"
        title="Đổi màu"
      >
        <Palette size={12} className="text-gray-700" />
      </button>
      {showPicker && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-pink-200 p-1.5 z-50 overflow-hidden w-[140px]">
          <div className="text-[10px] font-semibold text-gray-700 mb-1.5 px-1">Chọn màu</div>
          <div className="grid grid-cols-4 gap-1.5">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onColorChange(lessonId, color.value);
                  setShowPicker(false);
                }}
                className={`w-6 h-6 rounded-md ${color.value} border-2 ${currentColor === color.value ? 'border-white ring-1 ring-pink-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
                title={color.name}
              />
            ))}
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

  const getLightColor = (colorClass: string | undefined) => {
    const defaultLight = "bg-gradient-to-br from-pink-100 to-rose-100";
    if (!colorClass) return defaultLight;

    return colorClass
      .replace('from-pink-500 to-rose-500', 'from-pink-100 to-rose-100')
      .replace('from-rose-500 to-pink-600', 'from-rose-100 to-pink-100')
      .replace('from-fuchsia-500 to-purple-500', 'from-fuchsia-100 to-purple-100')
      .replace('from-blue-500 to-sky-500', 'from-blue-100 to-sky-100')
      .replace('from-emerald-500 to-teal-500', 'from-emerald-100 to-teal-100')
      .replace('from-amber-500 to-orange-500', 'from-amber-100 to-orange-100')
      .replace('from-indigo-500 to-blue-500', 'from-indigo-100 to-blue-100')
      .replace('from-violet-500 to-purple-600', 'from-violet-100 to-purple-100')
      .replace('from-gray-500 to-slate-500', 'from-gray-100 to-slate-100');
  };

  const modeDot = (room: string) =>
    room.toLowerCase().includes("online") ? "bg-emerald-500" : "bg-sky-500";

  return (
    <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-pink-200 bg-gradient-to-r from-pink-500/10 to-rose-500/10">
        <div className="flex items-center gap-4">
          <div className={`relative p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg`}>
            <CalendarDays size={24} />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-pink-600">
                {days[0].getDate()}
              </span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">Lịch tuần</div>
            <div className="text-gray-600">{rangeText}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors cursor-pointer"
            onClick={() => setWeekCursor(addDays(weekCursor, -7))}
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="min-w-[220px] text-center text-sm font-semibold text-gray-700">
            Tuần từ {days[0].getDate()}/{days[0].getMonth() + 1} đến {days[6].getDate()}/{days[6].getMonth() + 1}
          </div>
          <button
            className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors cursor-pointer"
            onClick={() => setWeekCursor(addDays(weekCursor, +7))}
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
          <button
            className="ml-2 rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm hover:bg-pink-50 transition-colors cursor-pointer text-gray-700"
            onClick={() => setWeekCursor(startOfWeek(new Date()))}
          >
            Tuần này
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 text-sm font-semibold text-gray-700">
        <div className="px-4 py-3">Ca / Ngày</div>
        {days.map((d) => {
          const key = keyYMD(d);
          const isToday = key === todayKey;
          const dow = d.toLocaleDateString("vi-VN", { weekday: "long" });
          return (
            <div
              key={key}
              className={`px-4 py-3 border-l border-pink-200 ${isToday ? "bg-gradient-to-r from-pink-500/10 to-rose-500/10" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="capitalize">{dow}</span>
                <span className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold ${isToday
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  : "bg-white text-gray-700 border border-pink-200"
                  }`}>
                  {d.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {PERIODS.map((p, rowIdx) => (
        <div key={p.key} className="grid grid-cols-8 border-t border-pink-100">
          <div className="px-4 py-4 text-sm font-semibold text-gray-700 bg-gradient-to-r from-pink-500/5 to-rose-500/5 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg">{p.label}</span>
              {p.key === "MORNING" && <span className="text-xs text-gray-500 mt-1">7:00-12:00</span>}
              {p.key === "AFTERNOON" && <span className="text-xs text-gray-500 mt-1">12:00-18:00</span>}
              {p.key === "EVENING" && <span className="text-xs text-gray-500 mt-1">18:00-22:00</span>}
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
                  : "bg-pink-50/30"
                  } border-l border-pink-100`}
              >
                <div className="space-y-2">
                  {evts.map((s) => {
                    const lightColor = getLightColor(s.color);
                    return (
                      <div
                        key={s.id}
                        className={`rounded-xl p-2.5 text-xs transition-all duration-200 hover:shadow-md cursor-pointer border border-pink-200 ${lightColor}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSlotClick) onSlotClick(s.id);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`h-2 w-2 rounded-full ${modeDot(s.room)}`} />
                              <span className="font-semibold text-gray-900 truncate">{s.title}</span>
                            </div>
                            
                            <div className="text-[11px] text-gray-600 mb-1">{s.time}</div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1">
                              <MapPin size={10} />
                              <span className="truncate">{s.room}</span>
                            </div>
                            {s.teacher && s.teacher.trim() && (
                              <div className="text-[10px] text-gray-600 mb-1 flex items-center gap-1">
                                <User size={9} className="text-gray-500 flex-shrink-0" />
                                <span className="truncate font-medium">{s.teacher}</span>
                              </div>
                            )}
                          </div>
                          {onColorChange && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <ColorPicker
                                lessonId={s.id}
                                currentColor={s.color || TYPE_META[s.type].defaultColor}
                                onColorChange={onColorChange}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {evts.length === 0 && (
                    <div
                      className="text-[13px] text-gray-400 italic text-center py-4 hover:bg-pink-50 rounded-lg cursor-pointer transition-colors"
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
  const locale = params.locale as string;

  // Branch filter hook
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();

  const [filter, setFilter] = useState<SlotType | "ALL">("ALL");
  const [slots, setSlots] = useState<Slot[]>(SLOTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  const list = useMemo(() => {
    if (filter === "ALL") return slots;
    return slots.filter((slot) => slot.type === filter);
  }, [filter, slots]);

  // Luôn bắt đầu từ tuần hiện tại khi reload trang
  const [weekCursor, setWeekCursor] = useState<Date>(() => startOfWeek(new Date()));

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => {
      const da = parseVNDate(a.date).getTime();
      const db = parseVNDate(b.date).getTime();
      if (da !== db) return da - db;
      return startMinutes(a.time) - startMinutes(b.time);
    });
  }, [list]);

  const handleColorChange = (lessonId: string, newColor: string) => {
    setSlots(prev => prev.map(slot =>
      slot.id === lessonId
        ? { ...slot, color: newColor }
        : slot
    ));
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

  const formatTimeRangeFromISO = (plannedDatetimeISO: string, durationMinutes: number) => {
    const start = new Date(plannedDatetimeISO);
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
  };

  // Load lịch dạy thực tế từ API sessions khi mở trang (admin xem lịch giáo viên)
  useEffect(() => {
    if (!isLoaded) return;

    const loadInitialSchedule = async () => {
      try {
        const branchId = getBranchQueryParam();
        console.log("📅 Fetching schedule for branch:", branchId || "All branches");

        const sessions = await fetchAdminSessions({
          branchId,
          pageNumber: 1,
          pageSize: 200,
        });

        console.log("✅ Loaded", sessions.length, "sessions");

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
          const planned = new Date(s.plannedDatetime);
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
          
          // Debug log for missing teacher names
          if (!teacherName && teacherId) {
            console.warn(`Missing teacher name for session ${s.id}, teacherId: ${teacherId}`);
          }

          return {
            id: s.id,
            title: String(s.classTitle ?? s.className ?? "Buổi học"),
            type: "CLASS",
            teacher: teacherName.trim(),
            room: String(s.plannedRoomName ?? s.roomName ?? ""),
            date: formatVNDate(planned),
            time: formatTimeRangeFromISO(planned.toISOString(), durationMinutes),
            note: s.participationType ?? "",
            color: TYPE_META.CLASS.defaultColor,
          };
        }).filter((slot) => slot.id);

        if (mappedSlots.length) {
          setSlots(mappedSlots);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error("Không thể tải lịch từ API:", err);
      }
    };

    loadInitialSchedule();
  }, [selectedBranchId, isLoaded]);

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
      <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
              <CalendarDays size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Lịch chung toàn hệ thống
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Quản lý và theo dõi lịch học theo tuần với 3 ca Sáng – Chiều – Tối
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
                <Download size={16} /> Xuất lịch
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <PlusCircle size={16} /> Tạo lịch mới
              </button>
            </div>
          </div>
        </div>

        {/* Branch Filter Indicator */}
        {selectedBranchId && (
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl">
            <Building2 size={16} className="text-pink-600" />
            <span className="text-sm text-pink-700 font-medium">
              Đang lọc theo chi nhánh đã chọn
            </span>
          </div>
        )}

        {/* Bộ lọc */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 flex flex-wrap gap-2">
          {["ALL", "CLASS", "MAKEUP", "EVENT"].map((item) => {
            const isActive = filter === item;
            const meta = item === "ALL"
              ? { text: "Tất cả", badge: "bg-gradient-to-r from-pink-500 to-rose-500" }
              : TYPE_META[item as SlotType];

            return (
              <button
                key={item}
                onClick={() => setFilter(item as typeof filter)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${isActive
                  ? `${meta.badge} text-white shadow-md`
                  : "bg-white border border-pink-200 text-gray-600 hover:bg-pink-50"
                  }`}
              >
                <span>{item === "ALL" ? "Tất cả" : meta.text}</span>
                {item !== "ALL" && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-gray-100"
                    }`}>
                    {stats.byType[item as SlotType]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Thời khoá biểu theo tuần */}
        <WeekTimetable
          items={sortedList}
          weekCursor={weekCursor}
          setWeekCursor={setWeekCursor}
          onColorChange={handleColorChange}
          onCellClick={handleCellClick}
          onSlotClick={handleSlotClick}
        />

        {/* Legend (Chú thích) */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">Chú thích:</div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-600">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-sky-500"></div>
              <span className="text-sm text-gray-600">Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-6 rounded bg-gradient-to-r from-pink-500 to-rose-500"></div>
              <span className="text-sm text-gray-600">PRE-IELTS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-6 rounded bg-gradient-to-r from-blue-500 to-sky-500"></div>
              <span className="text-sm text-gray-600">TOEFL/General</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-6 rounded bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              <span className="text-sm text-gray-600">IELTS Foundation</span>
            </div>
          </div>
        </div>

        {/* Danh sách thẻ chi tiết */}
        <div className="space-y-4">
          <div className="text-lg font-semibold text-gray-900">Chi tiết lịch tháng 12</div>
          {sortedList.map((slot) => {
            const lightColor = slot.color
              ? slot.color
                .replace('from-pink-500 to-rose-500', 'from-pink-100 to-rose-100')
                .replace('from-rose-500 to-pink-600', 'from-rose-100 to-pink-100')
                .replace('from-fuchsia-500 to-purple-500', 'from-fuchsia-100 to-purple-100')
                .replace('from-blue-500 to-sky-500', 'from-blue-100 to-sky-100')
                .replace('from-emerald-500 to-teal-500', 'from-emerald-100 to-teal-100')
                .replace('from-amber-500 to-orange-500', 'from-amber-100 to-orange-100')
                .replace('from-indigo-500 to-blue-500', 'from-indigo-100 to-blue-100')
                .replace('from-violet-500 to-purple-600', 'from-violet-100 to-purple-100')
                .replace('from-gray-500 to-slate-500', 'from-gray-100 to-slate-100')
              : "bg-gradient-to-br from-pink-50 to-rose-50";

            return (
              <div
                key={slot.id}
                onClick={() => handleSlotClick(slot.id)}
                className={`rounded-2xl border border-pink-200 p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between hover:shadow-md transition-all cursor-pointer ${lightColor}`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <TypeBadge type={slot.type} />
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">{slot.title}</span>
                      <ColorPicker
                        lessonId={slot.id}
                        currentColor={slot.color || TYPE_META[slot.type].defaultColor}
                        onColorChange={handleColorChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                      <CalendarRange size={16} className="text-pink-500" /> {slot.date}
                    </div>
                    <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                      <Clock3 size={16} className="text-pink-500" /> {slot.time}
                    </div>
                    <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                      <Users size={16} className="text-pink-500" /> {slot.teacher}
                    </div>
                    <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                      <MapPin size={16} className="text-pink-500" /> {slot.room}
                    </div>
                  </div>
                  {slot.note && (
                    <div className="text-xs text-gray-500 bg-white/50 rounded-lg p-2 inline-block">
                      📝 {slot.note}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {slot.type === "MAKEUP" ? (
                    <button className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer">
                      <ArrowLeftRight size={16} /> Phân bổ buổi bù
                    </button>
                  ) : null}
                  <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white hover:shadow-md transition-colors cursor-pointer">
                    <Send size={16} /> Gửi thông báo
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-5 space-y-3">
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></div>
            Ghi chú quản lý
          </div>
          <p className="text-sm text-gray-600">
            • Các buổi bù sẽ được tổng hợp và gửi báo cáo cuối tháng cho bộ phận tài chính<br />
            • Nhấn vào biểu tượng <Palette size={12} className="inline ml-1" /> để đổi màu phân biệt các khóa học<br />
            • Lịch học có thể xuất file Excel/PDF bằng nút "Xuất lịch"
          </p>
        </div>
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
    </>
  );
}