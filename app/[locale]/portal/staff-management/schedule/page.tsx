"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { getAccessToken } from "@/lib/store/authToken";
import { getAllBranches } from "@/lib/api/branchService";
import {
  changeSessionRoom,
  changeSessionTeacher,
  createAdminSession,
  fetchAdminSessions,
  updateSessionColor,
  updateClassColor,
  updateAdminSession,
} from "@/app/api/admin/sessions";
import { fetchAdminUsersByIds, fetchAdminClasses } from "@/app/api/admin/classes";
import type { CreateSessionRequest, ParticipationType, SectionType, Session } from "@/types/admin/sessions";
import { SECTION_TYPE_OPTIONS } from "@/types/admin/sessions";
import {
  CalendarRange,
  MapPin,
  Users,
  ArrowLeftRight,
  Clock3,
  PlusCircle,
  Download,
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
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import ConfirmModal from "@/components/ConfirmModal";
import SessionBulkChangeModal from "@/components/portal/schedule/SessionBulkChangeModal";
import AdminBranchSelectField from "@/components/admin/common/AdminBranchSelectField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

type SlotType = "CLASS" | "MAKEUP" | "EVENT";
type Slot = {
  id: string;
  classId: string;
  title: string;
  type: SlotType;
  teacher: string;
  teacherId?: string;
  assistantId?: string;
  assistantName?: string;
  room: string;
  roomId?: string;
  time: string;
  date: string;
  note?: string;
  color?: string;
  conflict?: boolean;
  branch?: string;
  branchId?: string;
  plannedDatetime?: string;
  durationMinutes?: number;
};

const PERIOD_TIME_RANGES: Record<Period, string> = {
  MORNING: "08:00 - 11:00",
  AFTERNOON: "14:00 - 17:00",
  EVENING: "18:30 - 21:00",
};

const DEFAULT_SESSION_COLOR = "#FEE2E2";

const TYPE_META: Record<
  SlotType,
  { text: string; badge: string; chip: string; bar: string; defaultColor: string }
> = {
  CLASS: {
    text: "Lớp học",
    badge: "bg-red-600 text-white",
    chip: "bg-red-50 text-red-700 border border-red-200",
    bar: "border-l-4 border-red-400",
    defaultColor: "#FEE2E2",
  },
  MAKEUP: {
    text: "Buổi bù",
    badge: "bg-gray-700 text-white",
    chip: "bg-gray-100 text-gray-700 border border-gray-200",
    bar: "border-l-4 border-gray-400",
    defaultColor: "#E5E7EB",
  },
  EVENT: {
    text: "Sự kiện",
    badge: "bg-black/10 text-gray-800 border border-gray-200",
    chip: "bg-gray-100 text-gray-800 border border-gray-200",
    bar: "border-l-4 border-gray-400",
    defaultColor: "#FFE8CC",
  },
};

const COLOR_OPTIONS = [
  { name: "Đỏ nhạt", value: "#FEE2E2" },
  { name: "Xanh nhạt", value: "#DCEBFF" },
  { name: "Hồng nhạt", value: "#FDE2FF" },
  { name: "Xanh lá nhạt", value: "#EEF7B9" },
  { name: "Tím nhạt", value: "#E6D9FF" },
  { name: "Tím pastel", value: "#E9D5FF" },
  { name: "Cam nhạt", value: "#FFE8CC" },
  { name: "Vàng nhạt", value: "#FFF7CC" },
  { name: "Xanh mint", value: "#D1FAE5" },
  { name: "Xanh cyan", value: "#CFFAFE" },
  { name: "Lam pastel", value: "#DBEAFE" },
  { name: "Tím oải hương", value: "#EDE9FE" },
  { name: "Hồng đào", value: "#FBCFE8" },
  { name: "Kem chanh", value: "#ECFCCB" },
  { name: "Cam đào", value: "#FED7AA" },
  { name: "Xám bạc", value: "#E5E7EB" },
  { name: "Be sáng", value: "#FAE8D4" },
  { name: "Xanh ngọc nhạt", value: "#CCFBF1" },
  { name: "Xanh trời nhạt", value: "#E0F2FE" },
  { name: "Hồng phấn", value: "#FCE7F3" },
];

const AUTO_CLASS_COLORS = COLOR_OPTIONS.map((c) => c.value);

const LEGACY_COLOR_TO_HEX: Record<string, string> = {
  "bg-gradient-to-r from-red-600 to-red-700": "#FEE2E2",
  "bg-gradient-to-r from-red-500 to-red-600": "#FEE2E2",
  "bg-gradient-to-r from-gray-600 to-gray-700": "#E5E7EB",
  "bg-gradient-to-r from-gray-500 to-gray-600": "#E5E7EB",
  "bg-gradient-to-r from-gray-700 to-gray-800": "#D1D5DB",
  "bg-gradient-to-r from-gray-200 to-gray-300": "#F3F4F6",
  "bg-gradient-to-r from-red-600 to-gray-600": "#FECACA",
  "bg-gradient-to-r from-blue-500 to-sky-500": "#DCEBFF",
  "bg-gradient-to-r from-amber-500 to-orange-500": "#FFE8CC",
};

/* ===== Color Helpers ===== */
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
  const rgbMatch = raw.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i
  );
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

function resolveSlotColor(
  color: string | null | undefined,
  classId: string | null | undefined,
  type: SlotType
): string {
  if (color && color.trim()) return normalizeSessionColor(color);
  if (type === "CLASS") return getAutoClassColor(classId);
  return TYPE_META[type].defaultColor;
}

function isSameColor(a?: string | null, b?: string | null): boolean {
  return normalizeSessionColor(a) === normalizeSessionColor(b);
}

/* ===== Shared Components ===== */
function TypeBadge({ type }: { type: SlotType }) {
  const { text, badge } = TYPE_META[type];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>
      {text}
    </span>
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
  const dow = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

type Period = "MORNING" | "AFTERNOON" | "EVENING";
type ClassOptionSource = { id: string; name?: string | null; code?: string | null };
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

/* =================== COLOR PICKER =================== */
function ColorPicker({
  lessonId,
  currentColor,
  onColorChange,
}: {
  lessonId: string;
  currentColor: string;
  onColorChange: (lessonId: string, color: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [customColor, setCustomColor] = useState(normalizeSessionColor(currentColor));
  const [previewColor, setPreviewColor] = useState(normalizeSessionColor(currentColor));
  const pickerRef = useRef<HTMLDivElement>(null);

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
        if (previewColor !== normalizeSessionColor(currentColor)) {
          commitColor(previewColor);
        }
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
                  onColorChange(lessonId, normalizeSessionColor(color.value));
                  setShowPicker(false);
                }}
                className={`w-6 h-6 rounded-md border-2 ${
                  isSameColor(currentColor, color.value)
                    ? "border-white ring-1 ring-red-500"
                    : "border-gray-300"
                } hover:scale-110 transition-all cursor-pointer`}
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
                const picked = normalizeSessionColor(e.target.value);
                setPreviewColor(picked);
                setCustomColor(picked);
              }}
              onBlur={() => commitColor(previewColor)}
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
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedDate) return;
    const date = new Date(selectedDate);
    onSelect(date);
    setIsOpen(false);
    setSelectedDate("");
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
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-[100] min-w-[280px]">
          <div className="text-sm font-semibold text-gray-800 mb-3">Chọn ngày để xem tuần</div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              else if (e.key === "Escape") {
                setIsOpen(false);
                setSelectedDate("");
              }
            }}
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

/* =================== CREATE SCHEDULE MODAL =================== */
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
  sectionType: SectionType;
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
  participationType: "Main",
  sectionType: "Normal",
};

type SelectOption = { id: string; label: string };

function CreateScheduleModal({
  isOpen,
  onClose,
  onSave,
  prefillDate,
  prefillTime,
  forcedBranchId,
  forcedBranchName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload: CreateSessionRequest,
    display: { title: string; room: string; teacher: string; color: string }
  ) => Promise<void>;
  prefillDate?: string;
  prefillTime?: string;
  forcedBranchId?: string;
  forcedBranchName?: string;
}) {
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
    const offsetMinutes = new Date().getTimezoneOffset();
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
      const duration = eh * 60 + em - (sh * 60 + sm);
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
        classesJson?.data?.classes?.items ?? classesJson?.data?.items ?? classesJson?.data ?? (Array.isArray(classesJson) ? classesJson : []);
      const roomsItems: any[] =
        roomsJson?.data?.classrooms?.items ?? roomsJson?.data?.items ?? roomsJson?.data ?? (Array.isArray(roomsJson) ? roomsJson : []);
      const teachersItems: any[] =
        teachersJson?.data?.items ?? teachersJson?.data?.users ?? teachersJson?.data ?? (Array.isArray(teachersJson) ? teachersJson : []);
      setClassOptions(
        classesItems
          .map((c) => ({ id: String(c?.id ?? ""), label: String(c?.title ?? c?.name ?? c?.code ?? "Lớp học") }))
          .filter((c) => c.id)
      );
      setRoomOptions(
        roomsItems
          .map((r) => ({ id: String(r?.id ?? ""), label: String(r?.name ?? r?.title ?? "Phòng") }))
          .filter((r) => r.id)
      );
      setTeacherOptions(
        teachersItems
          .map((u) => ({ id: String(u?.id ?? ""), label: String(u?.name ?? u?.fullName ?? u?.email ?? "Teacher") }))
          .filter((t) => t.id)
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
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

  useEffect(() => {
    if (!isOpen) return;
    if (forcedBranchId) {
      setBranchOptions([{ id: forcedBranchId, label: forcedBranchName || "Chi nhánh hiện tại" }]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getAllBranches({ page: 1, limit: 100 });
        if (cancelled) return;
        const branches: any[] = res?.data?.branches ?? res?.data ?? [];
        setBranchOptions(
          branches.map((b) => ({ id: String(b?.id ?? ""), label: String(b?.name ?? "Chi nhánh") })).filter((b) => b.id)
        );
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [forcedBranchId, forcedBranchName, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date();
    const formatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setFormData((prev) => ({
      ...initialFormData,
      branchId: forcedBranchId || prev.branchId || "",
      date: prefillDate ?? formatted,
      time: prefillTime ?? prev.time,
    }));
    setErrors({});
  }, [forcedBranchId, isOpen, prefillDate, prefillTime]);

  useEffect(() => {
    if (!isOpen) return;
    if (!formData.branchId) {
      setClassOptions([]);
      setRoomOptions([]);
      setTeacherOptions([]);
      return;
    }
    fetchSelectData(formData.branchId);
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

  const handleChange = (field: keyof ScheduleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSave(
        {
          classId: formData.classId,
          plannedDatetime: buildPlannedDatetimeISO(formData.date, formData.time),
          durationMinutes: computeDurationMinutes(formData.time),
          plannedRoomId: formData.roomId,
          plannedTeacherId: formData.teacherId,
          plannedAssistantId: formData.assistantId || null,
          participationType: formData.participationType,
          sectionType: formData.sectionType,
          slotTypeId: null,
        },
        {
          title: findLabel(classOptions, formData.classId) || "Buổi học",
          room: findLabel(roomOptions, formData.roomId) || "Phòng",
          teacher: findLabel(teacherOptions, formData.teacherId) || "Giáo viên",
          color: normalizeSessionColor(formData.color),
        }
      );
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message ?? "Tạo lịch thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <CalendarDays size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Tạo lịch mới</h2>
                <p className="text-sm text-red-100">Thêm lịch học, buổi bù hoặc sự kiện mới</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer">
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{submitError}</div>
            )}

            {/* Row 0: Chi nhánh & Lớp học */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdminBranchSelectField
                isOpen={isOpen}
                value={formData.branchId}
                options={branchOptions.map((branch) => ({ id: branch.id, label: branch.label }))}
                onValueChange={(value) => handleChange("branchId", value)}
                error={errors.branchId}
                disabled={Boolean(forcedBranchId)}
                placeholder="Vui lòng chọn chi nhánh"
                dataField="branchId"
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Tag size={16} className="text-red-600" />
                  Lớp học <span className="text-red-600">*</span>
                </label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => handleChange("classId", value)}
                >
                  <SelectTrigger className={`w-full rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${errors.classId ? "border-red-500" : "border-gray-200"}`}>
                    <SelectValue placeholder="Chọn lớp học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Chọn lớp học</SelectItem>
                    {classOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.classId}</p>}
              </div>
            </div>

            {/* Row 1: Giáo viên & Phòng học */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <User size={16} className="text-red-600" />
                  Giáo viên <span className="text-red-600">*</span>
                </label>
                <Select
                  value={formData.teacherId}
                  onValueChange={(value) => handleChange("teacherId", value)}
                >
                  <SelectTrigger className={`w-full rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${errors.teacherId ? "border-red-500" : "border-gray-200"}`}>
                    <SelectValue placeholder="Chọn giáo viên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Chọn giáo viên</SelectItem>
                    {teacherOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.teacherId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.teacherId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Building2 size={16} className="text-red-600" />
                  Phòng học <span className="text-red-600">*</span>
                </label>
                <Select
                  value={formData.roomId}
                  onValueChange={(value) => handleChange("roomId", value)}
                >
                  <SelectTrigger className={`w-full rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${errors.roomId ? "border-red-500" : "border-gray-200"}`}>
                    <SelectValue placeholder="Chọn phòng học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Chọn phòng học</SelectItem>
                    {roomOptions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roomId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.roomId}</p>}
              </div>
            </div>

            {/* Row 2: Giáo viên phụ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <User size={16} className="text-gray-500" />
                  Giáo viên phụ (tùy chọn)
                </label>
                <Select
                  value={formData.assistantId}
                  onValueChange={(value) => handleChange("assistantId", value)}
                >
                  <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                    <SelectValue placeholder="Không có" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không có</SelectItem>
                    {teacherOptions.filter((t) => t.id !== formData.teacherId).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Ngày & Loại lịch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Calendar size={16} className="text-red-600" />
                  Ngày <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${errors.date ? "border-red-500" : "border-gray-200"}`}
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
                      className={`px-3 py-2.5 cursor-pointer rounded-xl border text-sm font-semibold transition-all ${formData.type === type.value
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

            {/* Row 4: Ca học */}
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
                    className={`px-3 py-2.5 cursor-pointer rounded-xl border text-sm font-semibold transition-all flex flex-col items-center ${formData.period === period.value
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

            {/* Row 5: Thời gian chi tiết */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Clock3 size={16} className="text-red-600" />
                Thời gian chi tiết <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${errors.time ? "border-red-500" : "border-gray-200"}`}
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

            {/* Row 6: Màu sắc */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Palette size={16} className="text-red-600" />
                Màu sắc hiển thị
              </label>
              <div className="grid grid-cols-10 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange("color", normalizeSessionColor(color.value))}
                    className={`h-8 w-8 rounded-lg cursor-pointer border-2 ${isSameColor(formData.color, color.value) ? 'border-white ring-2 ring-red-500' : 'border-gray-300'} hover:scale-110 transition-all`}
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

            {/* Row 7: Loại buổi học */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Tag size={16} className="text-red-600" />
                Loại buổi học
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SECTION_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange("sectionType", opt.value)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${formData.sectionType === opt.value
                      ? "bg-red-50 text-red-800 border-red-300"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 8: Ghi chú */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <FileText size={16} className="text-red-600" />
                Ghi chú
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleChange("note", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none overflow-hidden"
                placeholder="VD: Bù cho 03/12, Mang theo tài liệu, Chủ đề hôm nay..."
                style={{ minHeight: '120px' }}
              />
            </div>

            {/* Gui thong bao */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.sendNotification ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-500"}`}>
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.sendNotification ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.sendNotification ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </form>
        </div>

        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
              Hủy
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(
                    forcedBranchId
                      ? { ...initialFormData, branchId: forcedBranchId }
                      : initialFormData,
                  );
                  const today = new Date();
                  const formattedDate = today.toISOString().split('T')[0];
                  setFormData(prev => ({ ...prev, date: formattedDate }));
                  setErrors({});
                }}
                className="inline-flex text-sm items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                Đặt lại
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                disabled={isSubmitting}
                className={`inline-flex text-sm items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
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

function BulkUpdateByClassModal(props: {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  onSuccess: () => void;
}) {
  return <SessionBulkChangeModal {...props} />;
}

/* =================== CHANGE ROOM MODAL =================== */
function ChangeRoomModal({
  isOpen,
  onClose,
  slot,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  onConfirm: (sessionId: string, roomId: string, roomName: string) => Promise<void>;
}) {
  const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !slot) return;
    setSelectedRoomId(slot?.roomId ?? "");
    setError(null);
    setIsCheckingAvailability(true);

    const token = getAccessToken();
    if (!token) {
      setIsCheckingAvailability(false);
      return;
    }

    const scheduledAt = slot.plannedDatetime;
    const durationMinutes = slot.durationMinutes && slot.durationMinutes > 0 ? slot.durationMinutes : 60;

    const loadFallbackRooms = () => {
      fetch(`/api/classrooms?pageNumber=1&pageSize=200`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => (response.ok ? response.json() : null))
        .then((json) => {
          const items: Array<Record<string, unknown>> =
            json?.data?.classrooms?.items ?? json?.data?.items ?? json?.data ?? (Array.isArray(json) ? json : []);
          setRoomOptions(
            items
              .map((room) => ({ id: String(room?.id ?? ""), label: String(room?.name ?? "Phòng") }))
              .filter((room) => room.id)
          );
        })
        .catch(() => setRoomOptions([]))
        .finally(() => setIsCheckingAvailability(false));
    };

    if (scheduledAt) {
      const params = new URLSearchParams({
        scheduledAt,
        durationMinutes: String(durationMinutes),
        includeUnavailable: "true",
      });
      if (slot.branchId) params.set("branchId", slot.branchId);
      if (slot.id) params.set("excludeSessionId", slot.id);

      fetch(`/api/sessions/availability?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((json) => {
          const data = json?.data ?? json;
          const rooms: Array<{ roomId: string; name?: string; isAvailable: boolean }> =
            data?.rooms ?? [];
          if (rooms.length === 0) { loadFallbackRooms(); return; }
          const available = rooms
            .filter((room) => room.isAvailable || String(room.roomId) === slot.roomId)
            .map((room) => ({ id: String(room.roomId), label: String(room.name ?? "Phòng") }))
            .filter((room) => room.id);
          setRoomOptions(available);
          setIsCheckingAvailability(false);
        })
        .catch(() => loadFallbackRooms());
    } else {
      loadFallbackRooms();
    }
  }, [isOpen, slot]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!slot || !selectedRoomId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const roomName = roomOptions.find((r) => r.id === selectedRoomId)?.label ?? "";
      await onConfirm(slot.id, selectedRoomId, roomName);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Đổi phòng thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !slot) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10">
                <ArrowLeftRight size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Đổi phòng học</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-gray-50 p-3 space-y-1">
            <div className="text-sm font-semibold text-gray-900">{slot.title}</div>
            <div className="text-xs text-gray-600">{slot.date} • {slot.time}</div>
            <div className="text-xs text-gray-600">Phòng hiện tại: <span className="font-semibold">{slot.room || "Chưa có"}</span></div>
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Chọn phòng mới</label>
            <div className="text-xs text-gray-500">Chỉ hiển thị phòng đang rảnh theo khung giờ của buổi học này.</div>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Chọn phòng</option>
              {roomOptions.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            {!isCheckingAvailability && roomOptions.length === 0 && (
              <div className="text-xs text-amber-700">Không có phòng rảnh ở khung giờ này.</div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 cursor-pointer">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRoomId || isSubmitting}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đổi phòng"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== CHANGE TEACHER MODAL =================== */
function ChangeTeacherModal({
  isOpen,
  onClose,
  slot,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  onConfirm: (sessionId: string, teacherId: string, teacherName: string, assistantId: string, assistantName: string) => Promise<void>;
}) {
  const [teacherOptions, setTeacherOptions] = useState<SelectOption[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedAssistantId, setSelectedAssistantId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !slot) return;
    setSelectedTeacherId(slot?.teacherId ?? "");
    setSelectedAssistantId(slot?.assistantId ?? "");
    setError(null);
    setIsCheckingAvailability(true);

    const token = getAccessToken();
    if (!token) {
      setIsCheckingAvailability(false);
      return;
    }

    const scheduledAt = slot.plannedDatetime;
    const durationMinutes = slot.durationMinutes && slot.durationMinutes > 0 ? slot.durationMinutes : 60;

    const loadFallbackTeachers = () => {
      fetch(`/api/admin/users?pageNumber=1&pageSize=200&role=Teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((json) => {
          const items: Array<Record<string, unknown>> =
            json?.data?.items ?? json?.data?.users ?? json?.data ?? (Array.isArray(json) ? json : []);
          setTeacherOptions(
            items
              .map((teacher) => ({
                id: String(teacher?.id ?? ""),
                label: String(teacher?.name ?? teacher?.fullName ?? teacher?.email ?? "Teacher"),
              }))
              .filter((teacher) => teacher.id)
          );
        })
        .catch(() => setTeacherOptions([]))
        .finally(() => setIsCheckingAvailability(false));
    };

    if (scheduledAt) {
      const params = new URLSearchParams({
        scheduledAt,
        durationMinutes: String(durationMinutes),
        includeUnavailable: "true",
      });
      if (slot.branchId) params.set("branchId", slot.branchId);
      if (slot.id) params.set("excludeSessionId", slot.id);

      fetch(`/api/sessions/availability?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((json) => {
          const data = json?.data ?? json;
          const teachers: Array<{ userId: string; name?: string; isAvailable: boolean }> =
            data?.teachers ?? [];
          if (teachers.length === 0) { loadFallbackTeachers(); return; }
          const available = teachers
            .filter(
              (teacher) =>
                teacher.isAvailable ||
                String(teacher.userId) === slot.teacherId ||
                String(teacher.userId) === slot.assistantId
            )
            .map((teacher) => ({ id: String(teacher.userId), label: String(teacher.name ?? "Giáo viên") }))
            .filter((teacher) => teacher.id);
          setTeacherOptions(available);
          setIsCheckingAvailability(false);
        })
        .catch(() => loadFallbackTeachers());
    } else {
      loadFallbackTeachers();
    }
  }, [isOpen, slot]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!slot || !selectedTeacherId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const teacherName = teacherOptions.find((t) => t.id === selectedTeacherId)?.label ?? "";
      const assistantName = teacherOptions.find((t) => t.id === selectedAssistantId)?.label ?? "";
      await onConfirm(slot.id, selectedTeacherId, teacherName, selectedAssistantId, assistantName);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Đổi giáo viên thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !slot) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10">
                <Users size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Đổi giáo viên</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-gray-50 p-3 space-y-1">
            <div className="text-sm font-semibold text-gray-900">{slot.title}</div>
            <div className="text-xs text-gray-600">{slot.date} • {slot.time}</div>
            <div className="text-xs text-gray-600">GV chính hiện tại: <span className="font-semibold">{slot.teacher || "Chưa có"}</span></div>
            {slot.assistantName && (
              <div className="text-xs text-gray-600">GV phụ hiện tại: <span className="font-semibold">{slot.assistantName}</span></div>
            )}
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Giáo viên chính mới *</label>
            <div className="text-xs text-gray-500">Chỉ hiển thị giáo viên đang rảnh theo khung giờ của buổi học này.</div>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="">Chọn giáo viên chính</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            {!isCheckingAvailability && teacherOptions.length === 0 && (
              <div className="text-xs text-amber-700">Không có giáo viên rảnh ở khung giờ này.</div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Giáo viên phụ (tùy chọn)</label>
            <select
              value={selectedAssistantId}
              onChange={(e) => setSelectedAssistantId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="">Không có</option>
              {teacherOptions.filter((t) => t.id !== selectedTeacherId).map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 cursor-pointer">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTeacherId || isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đổi GV"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== CHANGE SCHEDULE MODAL =================== */
function ChangeScheduleModal({
  isOpen,
  onClose,
  slot,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  onConfirm: (sessionId: string, newDate: string, newTime: string, newDateVN: string) => Promise<void>;
}) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !slot) return;
    setError(null);
    const [d, m, y] = slot.date.split("/");
    setNewDate(`${y}-${m}-${d}`);
    setNewTime(slot.time);
  }, [isOpen, slot]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!slot || !newDate || !newTime) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const [y, m, d] = newDate.split("-");
      const newDateVN = `${d}/${m}/${y}`;
      await onConfirm(slot.id, newDate, newTime, newDateVN);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Đổi lịch thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !slot) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10">
                <Calendar size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Đổi lịch lớp học</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-gray-50 p-3 space-y-1">
            <div className="text-sm font-semibold text-gray-900">{slot.title}</div>
            <div className="text-xs text-gray-600">Lịch hiện tại: {slot.date} • {slot.time}</div>
            <div className="text-xs text-gray-600">Phòng: {slot.room} • GV: {slot.teacher}</div>
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Ngày mới</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Ca học</label>
            <div className="grid grid-cols-3 gap-2">
              {(["MORNING", "AFTERNOON", "EVENING"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewTime(PERIOD_TIME_RANGES[p])}
                  className={`px-2 py-2 rounded-xl border text-sm font-semibold ${
                    newTime === PERIOD_TIME_RANGES[p]
                      ? "bg-amber-50 border-amber-300 text-amber-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {PERIODS.find((pp) => pp.key === p)?.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Thời gian chi tiết</label>
            <input
              type="text"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="VD: 08:00 - 10:00"
            />
          </div>
        </div>
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 cursor-pointer">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newDate || !newTime || isSubmitting}
            className="px-5 py-2 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đổi lịch"}
          </button>
        </div>
      </div>
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
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekCursor, i)),
    [weekCursor]
  );

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
    if (colorValue.startsWith("#")) return `${colorValue}33`;
    return "#FEF2F2";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center rounded-t-2xl justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
        <div className="flex items-center gap-4">
          <div className="relative p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
            <CalendarDays size={24} />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-red-600">{days[0].getDate()}</span>
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">Lịch tuần</div>
            <div className="text-gray-700 text-sm font-medium">{rangeText}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setWeekCursor(addDays(weekCursor, -7))}>
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <div className="min-w-[220px] text-center text-sm font-semibold text-gray-700">
            Tuần từ {days[0].getDate()}/{days[0].getMonth() + 1} đến {days[6].getDate()}/{days[6].getMonth() + 1}
          </div>
          <button className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setWeekCursor(addDays(weekCursor, 7))}>
            <ChevronRight size={18} className="text-gray-700" />
          </button>
          <button className="ml-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer text-gray-700" onClick={() => setWeekCursor(startOfWeek(new Date()))}>
            Tuần này
          </button>
          <GoToDateButton onSelect={(d) => setWeekCursor(startOfWeek(d))} />
        </div>
      </div>

      <div className="grid grid-cols-8  border-t border-gray-200 bg-gradient-to-r from-red-50 to-gray-100 text-sm font-semibold text-gray-700">
        <div className="px-4 py-3">Ca / Ngày</div>
        {days.map((d) => {
          const key = keyYMD(d);
          const isToday = key === todayKey;
          const dow = d.toLocaleDateString("vi-VN", { weekday: "long" });
          return (
            <div key={key} className={`px-4 py-3 border-l border-gray-200 ${isToday ? "bg-gradient-to-r from-red-100 to-red-200" : ""}`}>
              <div className="flex flex-col items-center gap-1">
                <span className="capitalize">{dow}</span>
                <span
                  className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold ${
                    isToday ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md" : "bg-white text-gray-700 border border-gray-200"
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {PERIODS.map((p, rowIdx) => (
        <div key={p.key} className="grid grid-cols-8 border-t border-gray-200">
          <div className="px-4 py-4 text-sm font-semibold  text-gray-800 bg-gradient-to-r from-red-50 to-gray-100 flex items-center justify-center">
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
                className={`min-h-[130px]  p-3 ${rowIdx % 2 ? "bg-white" : "bg-gray-50"} border-l border-gray-200`}
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
                                <ColorPicker lessonId={s.id} currentColor={slotColor} onColorChange={onColorChange} />
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
                        if (onCellClick) onCellClick(d, p.key);
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

/* =================== MAIN PAGE =================== */
export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const classIdFromUrl = searchParams.get("classId") ?? undefined;
  const dateFromUrl = searchParams.get("date") ?? undefined;

  const { isLoaded } = useBranchFilter();
  const { user: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  const staffBranchId = String(currentUser?.branchId || "");
  const staffBranchName = currentUser?.branchName || "Chi nhánh hiện tại";
  const [filter, setFilter] = useState<SlotType | "ALL">("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [classOptions, setClassOptions] = useState<{ id: string; name: string }[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Swap modals
  const [changeRoomSlot, setChangeRoomSlot] = useState<Slot | null>(null);
  const [changeTeacherSlot, setChangeTeacherSlot] = useState<Slot | null>(null);
  const [changeScheduleSlot, setChangeScheduleSlot] = useState<Slot | null>(null);

  const list = useMemo(() => {
    let result = slots;
    if (filter !== "ALL") result = result.filter((s) => s.type === filter);
    if (classFilter !== "ALL") result = result.filter((s) => s.classId === classFilter);
    return result;
  }, [filter, classFilter, slots]);

  const getInitialWeekCursor = () => {
    if (dateFromUrl) {
      const dateParts = dateFromUrl.split("-");
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return startOfWeek(date);
      }
    }
    return startOfWeek(new Date());
  };

  const [weekCursor, setWeekCursor] = useState<Date>(getInitialWeekCursor);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsPageLoaded(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  // Load class list for filter
  useEffect(() => {
    if (isCurrentUserLoading || !isLoaded) return;
    let cancelled = false;

    (async () => {
      if (!staffBranchId) {
        if (!cancelled) setClassOptions([]);
        return;
      }

      try {
        const classes = await fetchAdminClasses({ branchId: staffBranchId });
        if (!cancelled) {
          setClassOptions(
            (classes as ClassOptionSource[]).map((c) => ({
              id: c.id,
              name: c.name || c.code || "Lớp học",
            })),
          );
        }
      } catch {
        if (!cancelled) setClassOptions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isCurrentUserLoading, isLoaded, staffBranchId]);

  // Set class filter from URL
  useEffect(() => {
    if (!classIdFromUrl) return;

    const timeoutId = window.setTimeout(() => {
      setClassFilter(classIdFromUrl || "ALL");
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [classIdFromUrl]);

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => {
      const da = parseVNDate(a.date).getTime();
      const db = parseVNDate(b.date).getTime();
      if (da !== db) return da - db;
      return startMinutes(a.time) - startMinutes(b.time);
    });
  }, [list]);

  const formatVNDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
  };

  const parseISODate = (isoString: string): Date => {
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
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
    const start = parseISODate(plannedDatetimeISO);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const sh = String(start.getHours()).padStart(2, "0");
    const sm = String(start.getMinutes()).padStart(2, "0");
    const eh = String(end.getHours()).padStart(2, "0");
    const em = String(end.getMinutes()).padStart(2, "0");
    return `${sh}:${sm} - ${eh}:${em}`;
  };

  // Handle create session
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
    const startDate = parseISODate(plannedDatetime);
    const newSlot: Slot = {
      id: created.id,
      classId: String(created.classId ?? payload.classId ?? ""),
      title: String(created.classTitle ?? created.className ?? display.title),
      type: "CLASS",
      teacher: String(created.plannedTeacherName ?? created.teacherName ?? display.teacher),
      teacherId: created.plannedTeacherId ?? undefined,
      assistantId: created.plannedAssistantId ?? undefined,
      assistantName: created.plannedAssistantName ?? created.assistantName ?? undefined,
      room: String(created.plannedRoomName ?? created.roomName ?? display.room),
      roomId: created.plannedRoomId ?? undefined,
      date: formatVNDate(startDate),
      time: formatTimeRangeFromISO(plannedDatetime, durationMinutes),
      color: display.color,
      plannedDatetime,
      durationMinutes,
    };
    setSlots((prev) => [...prev, newSlot]);
    setIsCreateModalOpen(false);
    setSelectedDate(null);
    setSelectedPeriod(null);
    if (created.id && display.color) {
      updateSessionColor(created.id, display.color).catch(() => {});
    }
  };

  // Load sessions from API
  useEffect(() => {
    if (isCurrentUserLoading || !isLoaded) return;
    let cancelled = false;

    const loadInitialSchedule = async () => {
      if (!staffBranchId) {
        if (!cancelled) setSlots([]);
        return;
      }

      try {
        const weekStart = new Date(weekCursor);
        const weekEnd = new Date(weekCursor);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const toLocalDateStr = (d: Date) => {
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${d.getFullYear()}-${mm}-${dd}`;
        };
        const fromDate = toLocalDateStr(weekStart);
        const toDate = toLocalDateStr(weekEnd);

        const sessions = await fetchAdminSessions({
          branchId: staffBranchId,
          classId: classFilter !== "ALL" ? classFilter : undefined,
          from: fromDate,
          to: toDate,
          pageNumber: 1,
          pageSize: 200,
        });

        // Resolve teacher names
        const teacherIdsToFetch = new Set<string>();
        sessions.forEach((s: Session) => {
          const teacherId = s.plannedTeacherId ?? s.actualTeacherId;
          if (teacherId) teacherIdsToFetch.add(String(teacherId));
        });

        let teacherNameMap = new Map<string, string>();
        if (teacherIdsToFetch.size > 0) {
          try {
            teacherNameMap = await fetchAdminUsersByIds(Array.from(teacherIdsToFetch));
          } catch {}
        }

        const mappedSlots: Slot[] = sessions
          .map((s: Session): Slot => {
            const planned = parseISODate(s.plannedDatetime);
            const durationMinutes =
              typeof s.durationMinutes === "number" && s.durationMinutes > 0 ? s.durationMinutes : 60;

            let teacherName = (s.plannedTeacherName ?? s.teacherName ?? "").trim();
            const teacherId = s.plannedTeacherId ?? s.actualTeacherId;
            if (!teacherName && teacherId) {
              const fetched = teacherNameMap.get(String(teacherId));
              if (fetched?.trim()) teacherName = fetched.trim();
            }

            return {
              id: s.id,
              classId: String(s.classId ?? ""),
              title: String(s.classTitle ?? s.className ?? "Buổi học"),
              type: "CLASS",
              teacher: teacherName.trim(),
              teacherId: s.plannedTeacherId ?? undefined,
              assistantId: s.plannedAssistantId ?? s.actualAssistantId ?? undefined,
              assistantName: s.plannedAssistantName ?? s.assistantName ?? s.actualAssistantName ?? undefined,
              room: String(s.plannedRoomName ?? s.roomName ?? ""),
              roomId: s.plannedRoomId ?? undefined,
              date: formatVNDate(planned),
              time: formatTimeRangeFromISO(s.plannedDatetime, durationMinutes),
              note: s.participationType ?? "",
              color: resolveSlotColor(s.color, String(s.classId ?? ""), "CLASS"),
              branch: s.branchName ?? undefined,
              branchId: s.branchId ?? undefined,
              plannedDatetime: s.plannedDatetime,
              durationMinutes,
            };
          })
          .filter((slot) => slot.id);

        if (!cancelled) setSlots(mappedSlots);
      } catch (err) {
        console.error("Không thể tải lịch từ API:", err);
      }
    };

    loadInitialSchedule();

    return () => {
      cancelled = true;
    };
  }, [isCurrentUserLoading, isLoaded, staffBranchId, weekCursor, classFilter, refreshTick]);

  const stats = useMemo(() => {
    const total = slots.length;
    const byType = {
      CLASS: slots.filter((s) => s.type === "CLASS").length,
      MAKEUP: slots.filter((s) => s.type === "MAKEUP").length,
      EVENT: slots.filter((s) => s.type === "EVENT").length,
    };
    return { total, byType };
  }, [slots]);

  // Apply color directly — no confirmation needed
  const handleColorChange = async (lessonId: string, newColor: string) => {
    const targetSlot = slots.find((s) => s.id === lessonId);
    if (!targetSlot) return;
    const classId = targetSlot.classId;

    const sameClassIds = slots.filter((s) => s.classId === classId && !!classId).map((s) => s.id);
    if (!sameClassIds.includes(lessonId)) sameClassIds.push(lessonId);
    const originalColors = new Map<string, string | undefined>(slots.map(s => [s.id, s.color]));

    setSlots((prev) =>
      prev.map((slot) => (sameClassIds.includes(slot.id) ? { ...slot, color: newColor } : slot))
    );

    if (classId) {
      try {
        await updateClassColor(classId, newColor);
      } catch {
        // Fallback: update per session
        for (const sid of sameClassIds) {
          updateSessionColor(sid, newColor).catch(() => {});
        }
      }
    } else {
      // Revert on failure if no classId
      setSlots((prev) =>
        prev.map((slot) => (sameClassIds.includes(slot.id) ? { ...slot, color: originalColors.get(slot.id) } : slot))
      );
    }
  };

  const handleCellClick = (date: Date, period: Period) => {
    setSelectedDate(date);
    setSelectedPeriod(period);
    setIsCreateModalOpen(true);
  };

  const handleSlotClick = (slotId: string) => {
    router.push(`/${locale}/portal/staff-management/schedule/${slotId}`);
  };

  // Swap handlers
  const handleChangeRoom = async (sessionId: string, roomId: string, roomName: string) => {
    await changeSessionRoom({ sessionId, roomId });
    setSlots((prev) => prev.map((s) => (s.id === sessionId ? { ...s, room: roomName, roomId } : s)));
    toast({ title: "Đổi phòng thành công", description: `Đã chuyển sang phòng: ${roomName}` });
  };

  const handleChangeTeacher = async (
    sessionId: string,
    teacherId: string,
    teacherName: string,
    assistantId: string,
    assistantName: string
  ) => {
    await changeSessionTeacher({ sessionId, teacherId, role: "MainTeacher" });
    if (assistantId) {
      await changeSessionTeacher({ sessionId, teacherId: assistantId, role: "Assistant" });
    }
    setSlots((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, teacher: teacherName, teacherId, assistantId: assistantId || undefined, assistantName: assistantName || undefined }
          : s
      )
    );
    toast({ title: "Đổi giáo viên thành công", description: `GV chính: ${teacherName}${assistantName ? ` • GV phụ: ${assistantName}` : ""}` });
  };

  const handleChangeSchedule = async (sessionId: string, newDate: string, newTime: string, newDateVN: string) => {
    const [start] = newTime.split(" - ");
    const startTime = (start || "00:00").trim();
    const offsetMinutes = new Date().getTimezoneOffset();
    const sign = offsetMinutes <= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const offsetH = String(Math.floor(abs / 60)).padStart(2, "0");
    const offsetM = String(abs % 60).padStart(2, "0");
    const plannedDatetime = `${newDate}T${startTime}:00${sign}${offsetH}:${offsetM}`;

    const [s, e] = newTime.split(" - ").map((t) => t.trim());
    const [sh, sm] = s.split(":").map(Number);
    const [eh, em] = e.split(":").map(Number);
    const durationMinutes = eh * 60 + em - (sh * 60 + sm);

    await updateAdminSession(sessionId, { plannedDatetime, durationMinutes: durationMinutes > 0 ? durationMinutes : 60 });
    setSlots((prev) =>
      prev.map((sl) => (sl.id === sessionId ? { ...sl, date: newDateVN, time: newTime, plannedDatetime, durationMinutes } : sl))
    );
    toast({ title: "Đổi lịch thành công", description: `Lịch mới: ${newDateVN} • ${newTime}` });
  };

  // Build prefill for create modal
  const prefillDate = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : undefined;
  const prefillTime = selectedPeriod ? PERIOD_TIME_RANGES[selectedPeriod] : undefined;

  const getLightColor = (colorValue: string | undefined) => {
    if (!colorValue) return "#FEF2F2";
    if (colorValue.startsWith("#")) return `${colorValue}33`;
    return "#FEF2F2";
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-2 space-y-6">
        {/* Header */}
        <div className={`flex flex-wrap items-center justify-between gap-3 mb-8 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <CalendarDays size={25} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-2xl font-bold text-gray-900">Điều phối lịch, lớp, phòng</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles size={14} className="text-red-600" />
                Tạo/đổi ca, gán giáo viên chính &amp; phụ, đổi phòng học, xử lý xung đột lịch
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <PlusCircle size={16} /> Tạo lịch mới
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-4 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-linear-to-r from-red-600 to-red-700"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-cyan-600 grid place-items-center">
                <Clock3 className="text-white" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng số ca</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-linear-to-r from-red-600 to-red-700"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 to-pink-600 grid place-items-center">
                <Clock3 className="text-white" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Lớp học</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.byType.CLASS}</div>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-linear-to-r from-red-600 to-red-700"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-600 to-yellow-600 grid place-items-center">
                <Clock3 className="text-white" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Buổi bù</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.byType.MAKEUP}</div>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-linear-to-r from-red-600 to-red-700"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-600 grid place-items-center">
                <Clock3 className="text-white" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Sự kiện</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.byType.EVENT}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bộ lọc */}
        <div className={`rounded-2xl border border-gray-200 bg-white p-4 flex flex-nowrap gap-2 overflow-x-auto transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {/* Filter Lớp học */}
          <div className="flex items-center gap-2">
            <Select value={classFilter} onValueChange={(value) => setClassFilter(value)}>
              <SelectTrigger className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium min-w-[180px]">
                <SelectValue placeholder="Tất cả lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả lớp</SelectItem>
                {classOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => setIsBulkUpdateModalOpen(true)}
              disabled={classFilter === "ALL"}
              className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed min-w-[210px]"
              title={classFilter === "ALL" ? "Chọn 1 lớp để cập nhật hàng loạt" : "Cập nhật hàng loạt theo lớp"}
            >
              Đổi gv, phòng hàng loạt
            </button>
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
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{item === "ALL" ? "Tất cả" : meta.text}</span>
                {item !== "ALL" && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-gray-100 text-gray-700"}`}>
                    {stats.byType[item as SlotType]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Week Timetable */}
        <div className={`transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <WeekTimetable
            items={sortedList}
            weekCursor={weekCursor}
            setWeekCursor={setWeekCursor}
            onColorChange={handleColorChange}
            onCellClick={handleCellClick}
            onSlotClick={handleSlotClick}
          />
        </div>

      </div>

      {/* Create Modal */}
      <CreateScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedDate(null);
          setSelectedPeriod(null);
        }}
        onSave={handleCreateSchedule}
        prefillDate={prefillDate}
        prefillTime={prefillTime}
        forcedBranchId={staffBranchId || undefined}
        forcedBranchName={staffBranchName}
      />

      {/* Swap Modals */}
      <ChangeRoomModal
        isOpen={!!changeRoomSlot}
        onClose={() => setChangeRoomSlot(null)}
        slot={changeRoomSlot}
        onConfirm={handleChangeRoom}
      />
      <ChangeTeacherModal
        isOpen={!!changeTeacherSlot}
        onClose={() => setChangeTeacherSlot(null)}
        slot={changeTeacherSlot}
        onConfirm={handleChangeTeacher}
      />
      <ChangeScheduleModal
        isOpen={!!changeScheduleSlot}
        onClose={() => setChangeScheduleSlot(null)}
        slot={changeScheduleSlot}
        onConfirm={handleChangeSchedule}
      />

      <BulkUpdateByClassModal
        isOpen={isBulkUpdateModalOpen && classFilter !== "ALL"}
        onClose={() => setIsBulkUpdateModalOpen(false)}
        classId={classFilter === "ALL" ? "" : classFilter}
        className={classOptions.find((c) => c.id === classFilter)?.name ?? "Lớp học"}
        onSuccess={() => {
          setRefreshTick((v) => v + 1);
        }}
      />
    </>
  );
}
