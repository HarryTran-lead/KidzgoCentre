"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Plus, Search, MapPin, Users, Clock, Eye, Pencil,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  BookOpen, X, Calendar, Tag, User, GraduationCap, AlertCircle, Building2,
  Power, PowerOff, UserPlus, CalendarClock, RefreshCw
} from "lucide-react";
import clsx from "clsx";
import { 
  fetchAdminClasses, 
  createAdminClass, 
  fetchAdminUsersByIds,
  fetchAdminClassDetail,
  updateAdminClass,
  updateClassStatus
} from "@/app/api/admin/classes";
import { fetchAdminRooms } from "@/app/api/admin/rooms";
import { generateSessionsFromPattern } from "@/app/api/admin/sessions";
import { fetchClassFormSelectData, fetchTeacherOptionsByBranch, fetchProgramOptionsByBranch } from "@/app/api/admin/classFormData";
import type { ClassRow, CreateClassRequest } from "@/types/admin/classes";
import type { SelectOption } from "@/types/admin/classFormData";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { useToast } from "@/hooks/use-toast";

/* ----------------------------- UI HELPERS ------------------------------ */
function StatusBadge({ value }: { value: ClassRow["status"] }) {
  const map: Record<ClassRow["status"], string> = {
    "Đang học": "bg-red-100 text-red-700 border border-red-200",
    "Sắp khai giảng": "bg-amber-100 text-amber-700 border border-amber-200",
    "Đã kết thúc": "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
}

type SortField = "id" | "name" | "program" | "teacher" | "branch" | "capacity" | "schedule" | "status";
type SortDirection = "asc" | "desc" | null;
const PAGE_SIZE = 5;

type ScheduleDisplayProps = {
  schedule: string;
};

function ScheduleDisplay({ schedule }: ScheduleDisplayProps) {
  // Parse schedule string format: "Thứ 2,4,6 (18:00 - 20:00)" or "Thứ 2,4,6 & CN (18:00 - 20:00)"
  const match = schedule.match(/(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
  
  if (!match) {
    return (
      <div className="inline-flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
        <Clock size={14} className="text-gray-400" />
        <span className="text-xs italic">Chưa có lịch</span>
      </div>
    );
  }

  const [, dayPart, startTime, endTime] = match;
  
  // Parse days into array
  const dayNumbers: string[] = [];
  const hasSunday = dayPart.includes("CN");
  
  // Extract day numbers from "Thứ 2,4,6" or "Thứ 2,4,6 & CN"
  const thuMatch = dayPart.match(/Thứ\s*([\d,]+)/);
  if (thuMatch) {
    dayNumbers.push(...thuMatch[1].split(","));
  }
  
  // Day display configuration with better colors
  const dayConfig: Record<string, { label: string; bg: string; text: string; }> = {
    "2": { label: "T2", bg: "bg-blue-100", text: "text-blue-700" },
    "3": { label: "T3", bg: "bg-indigo-100", text: "text-indigo-700" },
    "4": { label: "T4", bg: "bg-purple-100", text: "text-purple-700" },
    "5": { label: "T5", bg: "bg-pink-100", text: "text-pink-700" },
    "6": { label: "T6", bg: "bg-amber-100", text: "text-amber-700" },
    "7": { label: "T7", bg: "bg-orange-100", text: "text-orange-700" },
  };
  
  const sundayConfig = { label: "CN", bg: "bg-rose-100", text: "text-rose-700" };

  // Combine all days for display
  const allDays = [
    ...dayNumbers.map(day => ({ 
      day, 
      ...(dayConfig[day] || { label: `T${day}`, bg: "bg-gray-100", text: "text-gray-700" })
    })),
    ...(hasSunday ? [{ day: "CN", ...sundayConfig }] : [])
  ];

  // Format time range
  const timeRange = `${startTime} - ${endTime}`;
  
  // Calculate duration in hours
  const startHour = parseInt(startTime.split(':')[0]);
  const startMin = parseInt(startTime.split(':')[1]);
  const endHour = parseInt(endTime.split(':')[0]);
  const endMin = parseInt(endTime.split(':')[1]);
  const durationHours = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
  const durationText = durationHours === Math.floor(durationHours) 
    ? `${durationHours}h` 
    : `${durationHours.toFixed(1)}h`;

  return (
    <div className="flex flex-col gap-1.5 min-w-[140px]">
      {/* Days row - colorful pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {allDays.map((dayInfo) => (
          <span
            key={dayInfo.day}
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${dayInfo.bg} ${dayInfo.text} shadow-sm`}
          >
            {dayInfo.label}
          </span>
        ))}
      </div>
      
      {/* Time row with duration */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md">
          <Clock size={12} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            {timeRange}
          </span>
        </div>
        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
          {durationText}
        </span>
      </div>
    </div>
  );
}

/**
 * Parse RRULE to human-readable schedule string
 */
function parseRRULEToSchedule(rrule: string): string {
  if (!rrule || !rrule.trim()) {
    return "Chưa có lịch";
  }

  try {
    // Remove RRULE: prefix if present
    const rule = rrule.replace(/^RRULE:/i, "");
    const parts: Record<string, string> = {};
    
    rule.split(";").forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        parts[key.toUpperCase()] = value;
      }
    });

    const freq = parts.FREQ || "";
    const byDay = parts.BYDAY || "";
    const byHour = parts.BYHOUR || "18";
    const byMinute = parts.BYMINUTE || "0";
    const duration = parseInt(parts.DURATION || "120", 10);

    if (freq !== "WEEKLY" || !byDay) {
      return rrule;
    }

    // Map RRULE days to Vietnamese
    const dayMap: Record<string, string> = {
      "MO": "Thứ 2",
      "TU": "Thứ 3",
      "WE": "Thứ 4",
      "TH": "Thứ 5",
      "FR": "Thứ 6",
      "SA": "Thứ 7",
      "SU": "CN",
    };

    // Parse days và sắp xếp theo thứ tự
    const days = byDay.split(",").map((d) => d.trim());
    const dayOrder = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
    days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    // Format days
    const vietnameseDays = days.map(d => dayMap[d] || d);
    
    // Nhóm các ngày Thứ
    const thuDays = vietnameseDays.filter(d => d.startsWith("Thứ")).map(d => d.replace("Thứ ", ""));
    const hasSunday = vietnameseDays.includes("CN");
    
    let dayString = "";
    if (thuDays.length > 0) {
      dayString = `Thứ ${thuDays.join(",")}`;
      if (hasSunday) {
        dayString += " & CN";
      }
    } else if (hasSunday) {
      dayString = "CN";
    } else {
      dayString = vietnameseDays.join(", ");
    }
    
    // Format time
    const hour = parseInt(byHour, 10);
    const minute = parseInt(byMinute, 10);
    const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    
    // Calculate end time
    const endMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;

    return `${dayString} (${startTime} - ${endTime})`;
  } catch (error) {
    console.error("Error parsing RRULE:", error);
    return rrule;
  }
}

function mapApiClassToRow(item: any): ClassRow {
  // Use UUID as id for API calls, code for display
  const id = String(item?.id ?? item?.classId ?? "");
  const code = String(item?.code ?? item?.classCode ?? "");
  const name = item?.title ?? item?.classTitle ?? "Lớp học";
  const sub = item?.programName ?? "";
  const teacher = item?.mainTeacherName ?? "Chưa phân công";
  // Ensure branchName is properly extracted
  const branch = String(item?.branchName ?? item?.branch?.name ?? "").trim() || "Chưa có chi nhánh";
  const current = item?.currentEnrollmentCount ?? 0;
  const capacity = item?.capacity ?? 0;
  const schedulePattern = (item?.schedulePattern as string | undefined) ?? "";
  // Convert RRULE to human-readable format
  const schedule = schedulePattern ? parseRRULEToSchedule(schedulePattern) : "Chưa có lịch";
  
  const rawStatus: string = (item?.status as string | undefined) ?? "";
  let status: ClassRow["status"] = "Sắp khai giảng";
  const normalized = rawStatus.toLowerCase();
  if (normalized === "active" || normalized === "ongoing") status = "Đang học";
  else if (normalized === "closed" || normalized === "completed") status = "Đã kết thúc";

  return {
    id,
    code,
    name,
    sub,
    teacher,
    branch,
    current,
    capacity,
    schedule,
    status,
  };
}

function SortableHeader({
  field,
  currentField,
  direction,
  onSort,
  children,
  align = "left",
}: {
  field: SortField;
  currentField: SortField | null;
  direction: SortDirection;
  onSort: (f: SortField) => void;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const isActive = currentField === field;
  const icon = isActive ? (
    direction === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
  ) : <ArrowUpDown size={14} className="text-gray-400" />;
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-6 ${alignClass} text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-red-50 transition-colors`}
    >
      <span className="inline-flex items-center gap-2">{children}{icon}</span>
    </th>
  );
}

/**
 * Tính ngày kết thúc dựa trên ngày bắt đầu, lịch học và số buổi học
 * Sử dụng thuật toán chính xác hơn để đếm đúng số buổi
 */
function calculateEndDate(startDate: string, schedule: string, totalSessions: number): string {
  if (!startDate || !schedule || totalSessions <= 0) {
    return "";
  }

  try {
    // Map ngày trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)
    const dayMap: Record<string, number> = {
      "2": 1, // Thứ 2
      "3": 2, // Thứ 3
      "4": 3, // Thứ 4
      "5": 4, // Thứ 5
      "6": 5, // Thứ 6
      "7": 6, // Thứ 7
      "CN": 0, // Chủ nhật
    };

    // Parse schedule
    const match = schedule.match(/(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
    if (!match) return "";

    const dayPart = match[1];
    const daysInWeek: number[] = [];

    // Parse các ngày trong tuần
    if (dayPart.includes("Thứ")) {
      // Lấy các số từ "Thứ 2,4,6"
      const dayNumbers = dayPart.match(/\d+/g) || [];
      dayNumbers.forEach((d) => {
        if (dayMap[d] !== undefined) daysInWeek.push(dayMap[d]);
      });
      
      // Kiểm tra có CN không
      if (dayPart.includes("CN")) {
        daysInWeek.push(0);
      }
    } else if (dayPart === "CN") {
      daysInWeek.push(0);
    }

    if (daysInWeek.length === 0) return "";

    // Sắp xếp các ngày trong tuần để dễ xử lý
    daysInWeek.sort((a, b) => a - b);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Đặt về đầu ngày để tránh lệch múi giờ
    
    let sessionsRemaining = totalSessions;
    let currentDate = new Date(start);
    
    // Nếu ngày bắt đầu không phải là ngày học, tìm ngày học đầu tiên
    while (!daysInWeek.includes(currentDate.getDay()) && sessionsRemaining > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Đếm số buổi học
    while (sessionsRemaining > 0) {
      const currentDayOfWeek = currentDate.getDay();
      
      if (daysInWeek.includes(currentDayOfWeek)) {
        sessionsRemaining--;
        if (sessionsRemaining > 0) {
          // Tìm ngày học tiếp theo
          let nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);
          
          while (!daysInWeek.includes(nextDate.getDay())) {
            nextDate.setDate(nextDate.getDate() + 1);
          }
          currentDate = nextDate;
        }
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Format ngày kết thúc
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error calculating end date:", error);
    return "";
  }
}

/* ----------------------------- CREATE CLASS MODAL ------------------------------ */

// Thêm interfaces mới
interface WeekDay {
  value: string;
  label: string;
  shortLabel: string;
}

interface TimeSlot {
  value: string;
  label: string;
  timeRange: string;
}

// Danh sách các ngày trong tuần
const WEEK_DAYS: WeekDay[] = [
  { value: "2", label: "Thứ 2", shortLabel: "T2" },
  { value: "3", label: "Thứ 3", shortLabel: "T3" },
  { value: "4", label: "Thứ 4", shortLabel: "T4" },
  { value: "5", label: "Thứ 5", shortLabel: "T5" },
  { value: "6", label: "Thứ 6", shortLabel: "T6" },
  { value: "7", label: "Thứ 7", shortLabel: "T7" },
  { value: "CN", label: "Chủ nhật", shortLabel: "CN" },
];

// Các khung giờ mẫu
const TIME_SLOTS: TimeSlot[] = [
  { value: "08:00-10:00", label: "Sáng (08:00 - 10:00)", timeRange: "08:00 - 10:00" },
  { value: "10:00-12:00", label: "Trưa (10:00 - 12:00)", timeRange: "10:00 - 12:00" },
  { value: "14:00-16:00", label: "Chiều (14:00 - 16:00)", timeRange: "14:00 - 16:00" },
  { value: "16:00-18:00", label: "Chiều tối (16:00 - 18:00)", timeRange: "16:00 - 18:00" },
  { value: "18:00-20:00", label: "Tối (18:00 - 20:00)", timeRange: "18:00 - 20:00" },
  { value: "19:30-21:30", label: "Tối muộn (19:30 - 21:30)", timeRange: "19:30 - 21:30" },
];

// Các tùy chọn số buổi/tuần
const SESSIONS_PER_WEEK_OPTIONS = [
  { value: 2, label: "2 buổi/tuần" },
  { value: 3, label: "3 buổi/tuần" },
];

/**
 * Convert schedule string to RRULE format
 */
function convertScheduleToRRULE(schedule: string, startDate: string): string {
  if (!schedule || !startDate) {
    return "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=18;BYMINUTE=0;DURATION=120";
  }

  try {
    // Parse schedule string format
    const match = schedule.match(/(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
    if (!match) {
      return "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=18;BYMINUTE=0;DURATION=120";
    }

    const [, dayPart, startTime, endTime] = match;
    
    // Map ngày Việt Nam sang RRULE
    const dayMap: Record<string, string> = {
      "2": "MO",
      "3": "TU",
      "4": "WE",
      "5": "TH",
      "6": "FR",
      "7": "SA",
      "CN": "SU",
    };

    const days: string[] = [];
    
    // Xử lý định dạng "Thứ 2,4,6" hoặc "Thứ 2,4,6 & CN"
    if (dayPart.includes("Thứ")) {
      const dayNumbers = dayPart.match(/\d+/g) || [];
      dayNumbers.forEach((d) => {
        if (dayMap[d]) days.push(dayMap[d]);
      });
      
      // Xử lý phần "& CN"
      if (dayPart.includes("CN")) {
        days.push("SU");
      }
    } else if (dayPart === "CN") {
      days.push("SU");
    }

    // Sắp xếp các ngày theo thứ tự (MO, TU, WE, TH, FR, SA, SU)
    const dayOrder = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
    days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    const byDay = days.length > 0 ? days.join(",") : "MO,WE,FR";

    // Parse thời gian
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Tính duration
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const durationMinutes = duration > 0 ? duration : 120;

    // Tạo RRULE
    return `RRULE:FREQ=WEEKLY;BYDAY=${byDay};BYHOUR=${startHour || 18};BYMINUTE=${startMinute || 0};DURATION=${durationMinutes}`;
  } catch (error) {
    console.error("Error converting schedule to RRULE:", error);
    return "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=18;BYMINUTE=0;DURATION=120";
  }
}

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClassFormData) => void;
  mode?: "create" | "edit";
  initialData?: ClassFormData | null;
}

interface ClassFormData {
  code: string;
  name: string;
  programId: string;
  branchId: string;
  mainTeacherId: string;
  assistantTeacherId: string;
  capacity: number;
  schedule: string;
  status: "Đang học" | "Sắp khai giảng" | "Đã kết thúc";
  startDate: string;
  endDate: string;
  totalSessions: number;
  description: string;
}

const initialFormData: ClassFormData = {
  code: "",
  name: "",
  programId: "",
  branchId: "",
  mainTeacherId: "",
  assistantTeacherId: "",
  capacity: 30,
  schedule: "",
  status: "Sắp khai giảng",
  startDate: "",
  endDate: "",
  totalSessions: 0,
  description: "",
};

function CreateClassModal({ isOpen, onClose, onSubmit, mode = "create", initialData }: CreateClassModalProps) {
  const [formData, setFormData] = useState<ClassFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ClassFormData, string>>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const [programOptions, setProgramOptions] = useState<SelectOption[]>([]);
  const [branchOptions, setBranchOptions] = useState<SelectOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<SelectOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // States mới cho UI chọn lịch học
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(2);
  const [customTimeRange, setCustomTimeRange] = useState<string>("");
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false);

  const fetchSelectData = async () => {
    try {
      setLoadingOptions(true);
      const data = await fetchClassFormSelectData();
      // Không load programs ngay, sẽ load theo branchId sau
      setProgramOptions([]);
      setBranchOptions(data.branches);
      setTeacherOptions([]);
    } catch (err) {
      console.error("Failed to fetch select data:", err);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Helper function to format days string
  const formatDaysString = (days: string[]): string => {
    const dayOrder = ["2", "3", "4", "5", "6", "7", "CN"];
    const sortedDays = [...days].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    const thuDays = sortedDays.filter(d => d !== "CN");
    const hasSunday = sortedDays.includes("CN");

    if (thuDays.length > 0) {
      return `Thứ ${thuDays.join(",")}${hasSunday ? " & CN" : ""}`;
    } else if (hasSunday) {
      return "CN";
    }
    return "";
  };

  // Hàm xử lý chọn/bỏ chọn ngày
  const toggleDay = (dayValue: string) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      } else {
        // Nếu số ngày đã chọn >= sessionsPerWeek, không cho chọn thêm
        if (prev.length >= sessionsPerWeek) {
          return prev;
        }
        return [...prev, dayValue];
      }
    });
  };

  // Hàm xử lý chọn số buổi/tuần
  const handleSessionsPerWeekChange = (value: number) => {
    setSessionsPerWeek(value);
    // Nếu số ngày đã chọn nhiều hơn sessionsPerWeek, cắt bớt
    if (selectedDays.length > value) {
      setSelectedDays(prev => prev.slice(0, value));
    }
  };

  // Reset các state khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedDays([]);
      setSelectedTimeSlot("");
      setSessionsPerWeek(2);
      setCustomTimeRange("");
      setUseCustomTime(false);
    }
  }, [isOpen]);

  // Cập nhật schedule string khi các lựa chọn thay đổi
  useEffect(() => {
    if (selectedDays.length > 0 && (selectedTimeSlot || (useCustomTime && customTimeRange))) {
      const timeRange = useCustomTime ? customTimeRange : (TIME_SLOTS.find(t => t.value === selectedTimeSlot)?.timeRange || "");
      const dayString = formatDaysString(selectedDays);
      const schedule = `${dayString} (${timeRange})`;
      handleChange("schedule", schedule);
    } else {
      handleChange("schedule", "");
    }
  }, [selectedDays, selectedTimeSlot, useCustomTime, customTimeRange]);

  // Khi chọn chi nhánh -> load programs và giáo viên thuộc chi nhánh đó
  useEffect(() => {
    if (!isOpen) return;

    const branchId = formData.branchId;
    if (!branchId) {
      setProgramOptions([]);
      setTeacherOptions([]);
      setFormData((prev) => ({
        ...prev,
        programId: "",
        mainTeacherId: "",
        assistantTeacherId: "",
      }));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingOptions(true);
        const [programs, teachers] = await Promise.all([
          fetchProgramOptionsByBranch(branchId),
          fetchTeacherOptionsByBranch(branchId),
        ]);
        
        if (cancelled) return;
        
        setProgramOptions(programs);
        setTeacherOptions(teachers);

        // Nếu program đang chọn không thuộc chi nhánh mới -> reset
        const programIds = new Set(programs.map((p) => p.id));
        const teacherIds = new Set(teachers.map((t) => t.id));
        
        setFormData((prev) => ({
          ...prev,
          programId: programIds.has(prev.programId) ? prev.programId : "",
          mainTeacherId: teacherIds.has(prev.mainTeacherId) ? prev.mainTeacherId : "",
          assistantTeacherId: teacherIds.has(prev.assistantTeacherId) ? prev.assistantTeacherId : "",
        }));
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load programs and teachers by branch:", err);
        setProgramOptions([]);
        setTeacherOptions([]);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, formData.branchId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
      fetchSelectData();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData(initialData);
        // Parse initial schedule để set selectedDays, time slot nếu có
        if (initialData.schedule) {
          const match = initialData.schedule.match(/(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
          if (match) {
            const dayPart = match[1];
            const timeRange = `${match[2]} - ${match[3]}`;
            
            // Parse days
            const days: string[] = [];
            if (dayPart.includes("Thứ")) {
              const dayNumbers = dayPart.match(/\d+/g) || [];
              days.push(...dayNumbers);
              if (dayPart.includes("CN")) {
                days.push("CN");
              }
            } else if (dayPart === "CN") {
              days.push("CN");
            }
            
            setSelectedDays(days);
            setSessionsPerWeek(days.length);
            
            // Try to match time slot
            const timeSlot = TIME_SLOTS.find(t => t.timeRange === timeRange);
            if (timeSlot) {
              setSelectedTimeSlot(timeSlot.value);
              setUseCustomTime(false);
            } else {
              setCustomTimeRange(timeRange);
              setUseCustomTime(true);
            }
          }
        }
      } else {
        setFormData(initialFormData);
        setSelectedDays([]);
        setSelectedTimeSlot("");
        setSessionsPerWeek(2);
        setCustomTimeRange("");
        setUseCustomTime(false);
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClassFormData, string>> = {};
    
    if (!formData.code.trim()) newErrors.code = "Mã lớp là bắt buộc";
    if (!formData.name.trim()) newErrors.name = "Tên lớp là bắt buộc";
    if (!formData.programId) newErrors.programId = "Chương trình là bắt buộc";
    if (!formData.branchId) newErrors.branchId = "Chi nhánh là bắt buộc";
    if (!formData.mainTeacherId) newErrors.mainTeacherId = "Giáo viên chính là bắt buộc";
    if (formData.capacity <= 0) newErrors.capacity = "Sĩ số phải lớn hơn 0";
    if (!formData.startDate) newErrors.startDate = "Ngày bắt đầu là bắt buộc";
    if (selectedDays.length === 0) newErrors.schedule = "Vui lòng chọn ít nhất 1 ngày học";
    if (!selectedTimeSlot && !useCustomTime) newErrors.schedule = "Vui lòng chọn khung giờ học";
    if (useCustomTime && !customTimeRange.trim()) newErrors.schedule = "Vui lòng nhập khung giờ học";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleChange = (field: keyof ClassFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Khi chọn program -> lấy totalSessions
      if (field === "programId" && value) {
        const selectedProgram = programOptions.find(p => p.id === value);
        if (selectedProgram) {
          newData.totalSessions = selectedProgram.totalSessions || 0;
          console.log(`Program selected: ${selectedProgram.name}, total sessions: ${newData.totalSessions}`);
        }
      }
      
      // Khi thay đổi startDate, schedule hoặc totalSessions -> tự tính endDate
      if ((field === "startDate" || field === "schedule" || field === "totalSessions" || field === "programId") && 
          newData.startDate && newData.schedule && newData.totalSessions > 0) {
        
        console.log(`Calculating end date: start=${newData.startDate}, schedule=${newData.schedule}, sessions=${newData.totalSessions}`);
        
        const calculatedEndDate = calculateEndDate(newData.startDate, newData.schedule, newData.totalSessions);
        if (calculatedEndDate) {
          newData.endDate = calculatedEndDate;
          console.log(`Calculated end date: ${calculatedEndDate}`);
        }
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <GraduationCap size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === "edit" ? "Cập nhật lớp học" : "Tạo lớp học mới"}
                </h2>
                <p className="text-sm text-red-100">
                  {mode === "edit" ? "Chỉnh sửa thông tin lớp học" : "Nhập thông tin chi tiết về lớp học mới"}
                </p>
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
            {/* Row 1: Mã lớp & Tên lớp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-red-600" />
                  Mã lớp *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleChange("code", e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                      errors.code ? "border-red-500" : "border-gray-200"
                    )}
                    placeholder="VD: TS12, TS19..."
                  />
                  {errors.code && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.code && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.code}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <BookOpen size={16} className="text-red-600" />
                  Tên lớp *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                      errors.name ? "border-red-500" : "border-gray-200"
                    )}
                    placeholder="VD: Lập trình Python cơ bản"
                  />
                  {errors.name && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
              </div>
            </div>

            {/* Row 2: Chi nhánh & Chương trình */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 size={16} className="text-red-600" />
                  Chi nhánh *
                </label>
                <div className="relative">
                  <select
                    value={formData.branchId}
                    onChange={(e) => handleChange("branchId", e.target.value)}
                    disabled={loadingOptions}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-red-300",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      errors.branchId ? "border-red-500" : "border-gray-200"
                    )}
                  >
                    <option value="">{loadingOptions ? "Đang tải..." : "Chọn chi nhánh"}</option>
                    {branchOptions.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.branchId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.branchId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-red-600" />
                  Chương trình *
                </label>
                <div className="relative">
                  <select
                    value={formData.programId}
                    onChange={(e) => handleChange("programId", e.target.value)}
                    disabled={loadingOptions}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-red-300",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      errors.programId ? "border-red-500" : "border-gray-200"
                    )}
                  >
                    <option value="">{loadingOptions ? "Đang tải..." : "Chọn chương trình"}</option>
                    {programOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.totalSessions || 0} buổi)</option>
                    ))}
                  </select>
                  {errors.programId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.programId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.programId}</p>}
              </div>
            </div>

            {/* Row 2.5: Giáo viên chính & Giáo viên phụ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User size={16} className="text-red-600" />
                  Giáo viên chính *
                </label>
                <div className="relative">
                  <select
                    value={formData.mainTeacherId}
                    onChange={(e) => handleChange("mainTeacherId", e.target.value)}
                    disabled={loadingOptions}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-red-300",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      errors.mainTeacherId ? "border-red-500" : "border-gray-200"
                    )}
                  >
                    <option value="">{loadingOptions ? "Đang tải..." : "Chọn giáo viên chính"}</option>
                    {teacherOptions.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {errors.mainTeacherId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.mainTeacherId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.mainTeacherId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User size={16} className="text-red-600" />
                  Giáo viên phụ
                </label>
                <select
                  value={formData.assistantTeacherId}
                  onChange={(e) => handleChange("assistantTeacherId", e.target.value)}
                  disabled={loadingOptions}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "border-gray-200"
                  )}
                >
                  <option value="">{loadingOptions ? "Đang tải..." : "Chọn giáo viên phụ (tùy chọn)"}</option>
                  {teacherOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Sĩ số */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users size={16} className="text-red-600" />
                Sĩ số tối đa *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.capacity}
                  onChange={(e) => handleChange("capacity", parseInt(e.target.value) || 0)}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.capacity ? "border-red-500" : "border-gray-200"
                  )}
                />
                {errors.capacity && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.capacity && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.capacity}</p>}
            </div>

            {/* Row 4: Ngày bắt đầu & Kết thúc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-red-600" />
                  Ngày bắt đầu *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                      errors.startDate ? "border-red-500" : "border-gray-200"
                    )}
                  />
                  {errors.startDate && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.startDate && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-red-600" />
                  Ngày kết thúc *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                      errors.endDate ? "border-red-500" : "border-gray-200"
                    )}
                    readOnly
                  />
                  {errors.endDate && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.endDate && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.endDate}</p>}
                <p className="text-xs text-gray-500">Tự động tính từ lịch học và số buổi</p>
              </div>
            </div>

            {/* Row 5: Lịch học - UI MỚI */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock size={16} className="text-red-600" />
                Lịch học *
              </label>

              {/* Chọn số buổi/tuần */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Số buổi học mỗi tuần</label>
                <div className="flex flex-wrap gap-2">
                  {SESSIONS_PER_WEEK_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSessionsPerWeekChange(option.value)}
                      className={clsx(
                        "px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer",
                        sessionsPerWeek === option.value
                          ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn các ngày trong tuần */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">
                  Chọn ngày học (tối đa {sessionsPerWeek} ngày) <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.value);
                    const isDisabled = !isSelected && selectedDays.length >= sessionsPerWeek;
                    
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        disabled={isDisabled}
                        className={clsx(
                          "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer",
                          "min-w-[80px]",
                          isSelected
                            ? day.value === "CN"
                              ? "bg-rose-100 border-rose-300 text-rose-700"
                              : "bg-blue-100 border-blue-300 text-blue-700"
                            : isDisabled
                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">{day.shortLabel}</span>
                          <span className="text-xs">{day.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedDays.length > 0 && (
                  <p className="text-xs text-green-600">
                    ✓ Đã chọn {selectedDays.length}/{sessionsPerWeek} ngày: {formatDaysString(selectedDays)}
                  </p>
                )}
                {selectedDays.length > 0 && selectedDays.length < sessionsPerWeek && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Chỉ chọn {selectedDays.length} ngày nhưng đã set {sessionsPerWeek} buổi/tuần. Lịch học sẽ bị gián đoạn.
                  </p>
                )}
                {errors.schedule && selectedDays.length === 0 && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> Vui lòng chọn ít nhất 1 ngày học
                  </p>
                )}
              </div>

              {/* Chọn khung giờ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">
                    Khung giờ học <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomTime(!useCustomTime)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                  >
                    {useCustomTime ? "Chọn khung giờ mẫu" : "Nhập giờ tùy chỉnh"}
                  </button>
                </div>

                {!useCustomTime ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot.value)}
                        className={clsx(
                          "px-3 py-2.5 rounded-xl border text-sm transition-all cursor-pointer",
                          selectedTimeSlot === slot.value
                            ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{slot.label.split(" ")[0]}</span>
                          <span className="text-xs">{slot.timeRange}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customTimeRange}
                      onChange={(e) => setCustomTimeRange(e.target.value)}
                      placeholder="VD: 18:00 - 20:00"
                      className={clsx(
                        "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300",
                        errors.schedule && useCustomTime && !customTimeRange ? "border-red-500" : "border-gray-200"
                      )}
                    />
                    <p className="text-xs text-gray-500">
                      Nhập theo định dạng HH:MM - HH:MM (ví dụ: 18:00 - 20:00)
                    </p>
                  </div>
                )}
              </div>

              {/* Preview lịch học */}
              {formData.schedule && (
                <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar size={16} className="text-red-600" />
                    <span className="font-medium">Lịch học đã chọn:</span>
                    <span className="text-red-700 font-semibold">{formData.schedule}</span>
                  </div>
                  {formData.totalSessions > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      ✓ Tổng số buổi: {formData.totalSessions} buổi
                      {formData.schedule && selectedDays.length > 0 && (
                        <span>
                          {' '}(~{Math.ceil(formData.totalSessions / selectedDays.length)} tuần)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 6: Trạng thái */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen size={16} className="text-red-600" />
                Trạng thái
              </label>
              <div className="flex gap-2">
                {(["Sắp khai giảng", "Đang học", "Đã kết thúc"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleChange("status", status)}
                    className={clsx(
                      "flex-1 px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer",
                      formData.status === status
                        ? status === "Sắp khai giảng"
                          ? "bg-amber-100 border-amber-300 text-amber-700"
                          : status === "Đang học"
                          ? "bg-red-100 border-red-300 text-red-700"
                          : "bg-gray-100 border-gray-300 text-gray-600"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 7: Mô tả */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen size={16} className="text-red-600" />
                Mô tả lớp học
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                placeholder="Mô tả chi tiết về lớp học..."
              />
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
                  if (mode === "edit" && initialData) {
                    setFormData(initialData);
                  } else {
                    setFormData(initialFormData);
                    setSelectedDays([]);
                    setSelectedTimeSlot("");
                    setSessionsPerWeek(2);
                    setCustomTimeRange("");
                    setUseCustomTime(false);
                  }
                  setErrors({});
                }}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {mode === "edit" ? "Khôi phục" : "Đặt lại"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
              >
                {mode === "edit" ? "Lưu thay đổi" : "Tạo lớp học"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- PAGE --------------------------------- */
export default function Page() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  
  // Branch filter hook
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ClassRow["status"]>("ALL");
  const [teacherFilter, setTeacherFilter] = useState<"ALL" | string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingInitialData, setEditingInitialData] = useState<ClassFormData | null>(null);
  const [originalStatus, setOriginalStatus] = useState<ClassFormData["status"] | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // Fetch classes with branch filter
  useEffect(() => {
    if (!isLoaded) return;

    async function fetchClasses() {
      try {
        setLoading(true);
        setError(null);

        const branchId = getBranchQueryParam();
        console.log("🎓 Fetching classes for branch:", branchId || "All branches");

        const mapped = await fetchAdminClasses({ branchId });
        setClasses(mapped);
        console.log("✅ Loaded", mapped.length, "classes");
      } catch (err) {
        console.error("Unexpected error when fetching admin classes:", err);
        setError((err as Error)?.message || "Đã xảy ra lỗi khi tải danh sách lớp học.");
        setClasses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClasses();
    setPage(1);
  }, [selectedBranchId, isLoaded]);

  const stats = useMemo(() => {
    const total = classes.length;
    const active = classes.filter(c => c.status === "Đang học").length;
    const upcoming = classes.filter(c => c.status === "Sắp khai giảng").length;
    const students = classes.reduce((sum, c) => sum + c.current, 0);
    const occupancy = classes.reduce((sum, c) => sum + c.capacity, 0);

    return {
      total,
      active,
      upcoming,
      students,
      occupancy: occupancy > 0 ? `${Math.round((students / occupancy) * 100)}%` : "0%",
    };
  }, [classes]);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let filtered = !kw
      ? classes
      : classes.filter((c) =>
          [c.id, c.name, c.sub, c.teacher, c.branch].some((x) =>
            x.toLowerCase().includes(kw)
          )
        );

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (teacherFilter !== "ALL") {
      filtered = filtered.filter((c) => c.teacher === teacherFilter);
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const getVal = (c: ClassRow) => {
          switch (sortField) {
            case "id": return c.id;
            case "name": return c.name;
            case "program": return c.sub;
            case "teacher": return c.teacher;
            case "branch": return c.branch;
            case "capacity": return `${c.current}/${c.capacity}`;
            case "schedule": return c.schedule;
            case "status": return c.status;
          }
        };
        const av = getVal(a);
        const bv = getVal(b);
        return sortDirection === "asc"
          ? av.localeCompare(bv, undefined, { numeric: true })
          : bv.localeCompare(av, undefined, { numeric: true });
      });
    }
    return filtered;
  }, [q, sortField, sortDirection, classes, statusFilter, teacherFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") { setSortField(null); setSortDirection(null); }
      else setSortDirection("asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  // Handle checkbox selection
  const handleSelectAll = () => {
    if (selectedClasses.length === pagedRows.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(pagedRows.map(c => c.id));
    }
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const goPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleCreateClass = async (data: ClassFormData) => {
    try {
      if (!data.programId || data.programId.trim() === "") {
        toast.warning({
          title: "Thiếu thông tin",
          description: "Vui lòng chọn chương trình học.",
        });
        return;
      }

      console.log("Creating class with data:", {
        ...data,
        totalSessions: data.totalSessions,
        schedule: data.schedule,
        startDate: data.startDate,
        endDate: data.endDate
      });
      
      const schedulePattern = convertScheduleToRRULE(data.schedule, data.startDate);
      console.log("Generated RRULE:", schedulePattern);

      const payload: CreateClassRequest = {
        branchId: data.branchId,
        programId: data.programId.trim(),
        code: data.code,
        title: data.name,
        mainTeacherId: data.mainTeacherId,
        assistantTeacherId: data.assistantTeacherId || undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        capacity: data.capacity,
        schedulePattern: schedulePattern,
      };

      console.log("Creating class with payload:", payload);

      const created = await createAdminClass(payload);

      // Sau khi tao lop thanh cong, tao cac session/lich hoc tu dong
      if (created?.id) {
        try {
          console.log("Generating sessions for class:", created.id);
          await generateSessionsFromPattern({
            classId: created.id,
            onlyFutureSessions: true,
          });
          console.log("Sessions generated successfully");
        } catch (sessionErr: any) {
          console.error("Failed to generate sessions:", sessionErr);
        }
      }

      const updatedClasses = await fetchAdminClasses();
      setClasses(updatedClasses);

      toast.success({
        title: "Tạo lớp học thành công",
        description: `Lớp ${data.name} đã được tạo với ${data.totalSessions} buổi học.`,
      });
    } catch (err: any) {
      console.error("Failed to create class:", err);
      const errorMessage = err?.message || "Không thể tạo lớp học. Vui lòng thử lại.";
      toast.destructive({
        title: "Tạo lớp học thất bại",
        description: errorMessage,
      });
    }
  };

  const handleOpenEditClass = async (row: ClassRow) => {
    try {
      setIsEditModalOpen(true);
      setEditingClassId(row.id);
      setEditingInitialData(null);

      const detail: any = await fetchAdminClassDetail(row.id);

      const schedulePattern = (detail?.schedulePattern as string | undefined) ?? "";
      const schedule = schedulePattern ? parseRRULEToSchedule(schedulePattern) : "";

      const rawStatus: string = (detail?.status as string | undefined) ?? "";
      const normalized = rawStatus.toLowerCase();
      let status: ClassFormData["status"] = "Sắp khai giảng";
      if (normalized === "active" || normalized === "ongoing") status = "Đang học";
      else if (normalized === "closed" || normalized === "completed") status = "Đã kết thúc";

      const formData: ClassFormData = {
        code: detail?.code ?? row.code ?? "",
        name: detail?.title ?? row.name ?? "",
        programId: String(detail?.programId ?? ""),
        branchId: String(detail?.branchId ?? ""),
        mainTeacherId: String(detail?.mainTeacherId ?? ""),
        assistantTeacherId: detail?.assistantTeacherId ? String(detail.assistantTeacherId) : "",
        capacity: typeof detail?.capacity === "number" ? detail.capacity : row.capacity,
        schedule,
        status,
        startDate: (detail?.startDate as string | undefined)?.slice(0, 10) ?? "",
        endDate: (detail?.endDate as string | undefined)?.slice(0, 10) ?? "",
        totalSessions: detail?.totalSessions ?? 0,
        description: detail?.description ?? "",
      };

      setEditingInitialData(formData);
      setOriginalStatus(status);
    } catch (err: any) {
      console.error("Failed to load class detail for edit:", err);
      alert(err?.message || "Không thể tải thông tin lớp học để chỉnh sửa.");
      setIsEditModalOpen(false);
      setEditingClassId(null);
      setEditingInitialData(null);
    }
  };

  const handleUpdateClass = async (data: ClassFormData) => {
    if (!editingClassId) return;
    try {
      if (!data.programId || data.programId.trim() === "") {
        toast.warning({
          title: "Thiếu thông tin",
          description: "Vui lòng chọn chương trình học.",
        });
        return;
      }

      const schedulePattern = convertScheduleToRRULE(data.schedule, data.startDate);

      const payload: CreateClassRequest = {
        branchId: data.branchId,
        programId: data.programId.trim(),
        code: data.code,
        title: data.name,
        mainTeacherId: data.mainTeacherId,
        assistantTeacherId: data.assistantTeacherId || undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        capacity: data.capacity,
        schedulePattern,
      };

      console.log("Updating class with payload:", payload);

      // Cập nhật thông tin lớp học
      await updateAdminClass(editingClassId, payload);

      // Nếu trạng thái thay đổi, gọi updateClassStatus API
      if (originalStatus && data.status !== originalStatus) {
        // Map UI status to API status
        const statusMap: Record<ClassFormData["status"], string> = {
          "Đang học": "Active",
          "Sắp khai giảng": "Planned",
          "Đã kết thúc": "Closed",
        };
        const apiStatus = statusMap[data.status] || "Planned";
        await updateClassStatus(editingClassId, apiStatus);
      }

      // Refresh danh sách
      const updatedClasses = await fetchAdminClasses();
      setClasses(updatedClasses);
      toast.success({
        title: "Cập nhật lớp học thành công",
        description: `Thông tin lớp ${data.name} đã được lưu.`,
      });
    } catch (err: any) {
      console.error("Failed to update class:", err);
      const errorMessage = err?.message || "Không thể cập nhật lớp học. Vui lòng thử lại.";
      toast.destructive({
        title: "Cập nhật lớp học thất bại",
        description: errorMessage,
      });
    } finally {
      setEditingClassId(null);
      setEditingInitialData(null);
      setOriginalStatus(null);
    }
  };

  const handleToggleStatus = async (row: ClassRow) => {
    try {
      // Xác định trạng thái mới dựa trên trạng thái hiện tại
      let newStatus: string;
      if (row.status === "Đang học") {
        // Nếu đang học -> chuyển sang đã kết thúc
        newStatus = "Closed";
      } else if (row.status === "Đã kết thúc") {
        // Nếu đã kết thúc -> chuyển sang sắp khai giảng
        newStatus = "Planned";
      } else {
        // Nếu sắp khai giảng -> chuyển sang đang học
        newStatus = "Active";
      }

      await updateClassStatus(row.id, newStatus);

      // Refresh danh sách
      const updatedClasses = await fetchAdminClasses();
      setClasses(updatedClasses);

      const statusMap: Record<string, string> = {
        "Active": "Đang học",
        "Planned": "Sắp khai giảng",
        "Closed": "Đã kết thúc",
      };
      const newStatusText = statusMap[newStatus] || newStatus;
      toast.success({
        title: "Cập nhật trạng thái thành công",
        description: `Lớp ${row.name} đã chuyển sang trạng thái "${newStatusText}".`,
      });
    } catch (err: any) {
      console.error("Failed to toggle class status:", err);
      toast.destructive({
        title: "Cập nhật trạng thái thất bại",
        description: err?.message || "Không thể cập nhật trạng thái lớp học. Vui lòng thử lại.",
      });
    }
  };

  const handleAddStudent = (classId: string) => {
    // Navigate to class detail page with students tab
    router.push(`/${locale}/portal/admin/classes/${classId}?tab=students`);
  };

  return (
    <>
      <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
        {/* Header */}
        <div className={`flex flex-wrap items-center gap-3 justify-between transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Quản lý lớp học</h1>
              <p className="text-sm text-gray-600">Quản lý thông tin lớp học và học viên</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
            type="button"
          >
            <Plus size={18} /> Tạo lớp học mới
          </button>
        </div>

        {/* Stats cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
                <Users className="text-red-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng lớp học</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
                <BookOpen className="text-red-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Đang học</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.active}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-100 grid place-items-center">
                <CalendarClock className="text-amber-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Sắp khai giảng</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.upcoming}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gray-100 grid place-items-center">
                <Users className="text-gray-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng học viên</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.students}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Filter Indicator */}
        {selectedBranchId && (
          <div className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl transition-all duration-700 delay-150 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Building2 size={16} className="text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              Đang lọc theo chi nhánh đã chọn
            </span>
          </div>
        )}

        {/* Search & Filters */}
        <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-3xl min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Tìm kiếm lớp học..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Đang học">Đang học</option>
                <option value="Sắp khai giảng">Sắp khai giảng</option>
                <option value="Đã kết thúc">Đã kết thúc</option>
              </select>
              <select
                value={teacherFilter}
                onChange={(e) => { setTeacherFilter(e.target.value as typeof teacherFilter); setPage(1); }}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="ALL">Tất cả giáo viên</option>
                {[...new Set(classes.map(c => c.teacher))].map((teacher) => (
                  <option key={teacher} value={teacher}>{teacher}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Table Header */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Danh sách lớp học</h2>
                {selectedClasses.length > 0 && (
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    {selectedClasses.length} đã chọn
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{rows.length} lớp học</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={pagedRows.length > 0 && selectedClasses.length === pagedRows.length}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-200 cursor-pointer"
                    />
                  </th>
                  <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>Tên lớp</SortableHeader>
                  <SortableHeader field="program" currentField={sortField} direction={sortDirection} onSort={handleSort}>Chương trình</SortableHeader>
                  <SortableHeader field="teacher" currentField={sortField} direction={sortDirection} onSort={handleSort}>Giáo viên</SortableHeader>
                  <SortableHeader field="branch" currentField={sortField} direction={sortDirection} onSort={handleSort}>Chi nhánh</SortableHeader>
                  <SortableHeader field="capacity" currentField={sortField} direction={sortDirection} onSort={handleSort}>Sĩ số</SortableHeader>
                  <SortableHeader field="schedule" currentField={sortField} direction={sortDirection} onSort={handleSort}>Lịch học</SortableHeader>
                  <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trạng thái</SortableHeader>
                  <th className="py-3 px-6 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedRows.length > 0 ? (
                  pagedRows.map((c) => (
                    <tr
                      key={c.id}
                      className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(c.id)}
                          onChange={() => handleSelectClass(c.id)}
                          className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-200 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900 font-medium truncate">{c.name}</div>
                        <div className="text-xs text-gray-500 truncate">{c.code || c.id}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900 truncate">{c.sub}</div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                          <span className="inline-block w-5 h-5 rounded-full bg-red-100 grid place-items-center">
                            <User size={13} className="text-red-600" />
                          </span>
                          <span className="truncate">{c.teacher}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="truncate">{c.branch}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                            <Users size={16} className={clsx(
                              c.current === c.capacity ? "text-red-400" : "text-gray-400"
                            )} />
                            <span className={clsx(
                              "font-medium",
                              c.current === c.capacity ? "text-red-600" : "text-gray-900"
                            )}>
                              {c.current}/{c.capacity}
                            </span>
                          </div>
                          {/* Hiển thị icon thêm học viên khi lớp chưa đầy */}
                          {c.current < c.capacity && (
                            <button
                              onClick={() => handleAddStudent(c.id)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors text-amber-600 hover:text-amber-700 cursor-pointer"
                              title="Thêm học viên"
                            >
                              <UserPlus size={14} />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <ScheduleDisplay schedule={c.schedule} />
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge value={c.status} />
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end text-gray-700 gap-1 transition-opacity duration-200">
                          <button 
                            onClick={() => router.push(`/${locale}/portal/admin/classes/${c.id}`)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer" 
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => handleOpenEditClass(c)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-800 cursor-pointer" 
                            title="Chỉnh sửa"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(c)}
                            className={clsx(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              c.status === "Đang học"
                                ? "hover:bg-red-50 text-gray-400 hover:text-red-600"
                                : c.status === "Sắp khai giảng"
                                ? "hover:bg-amber-50 text-gray-400 hover:text-amber-600"
                                : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            )}
                            title={
                              c.status === "Đang học" ? "Kết thúc lớp học" : 
                              c.status === "Sắp khai giảng" ? "Bắt đầu lớp học" : 
                              "Mở lại lớp học"
                            }
                          >
                            {c.status === "Đang học" ? (
                              <PowerOff size={14} />
                            ) : c.status === "Sắp khai giảng" ? (
                              <Power size={14} />
                            ) : (
                              <RefreshCw size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                        <Search size={24} className="text-gray-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Không tìm thấy lớp học</div>
                      <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo lớp học mới</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer - Pagination */}
          {rows.length > 0 && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, rows.length)}</span>
                  {' '}trong tổng số <span className="font-semibold text-gray-900">{rows.length}</span> lớp học
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages: (number | string)[] = [];
                      const maxVisible = 7;

                      if (totalPages <= maxVisible) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        if (currentPage <= 3) {
                          for (let i = 1; i <= 5; i++) pages.push(i);
                          pages.push("...");
                          pages.push(totalPages);
                        } else if (currentPage >= totalPages - 2) {
                          pages.push(1);
                          pages.push("...");
                          for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          pages.push("...");
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                          pages.push("...");
                          pages.push(totalPages);
                        }
                      }

                      return pages.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => typeof p === "number" && goPage(p)}
                          disabled={p === "..."}
                          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            p === currentPage
                              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                              : p === "..."
                              ? "cursor-default text-gray-400"
                              : "border border-red-200 hover:bg-red-50 text-gray-700"
                          }`}
                        >
                          {p}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    onClick={() => goPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateClass}
      />
      {/* Edit Class Modal */}
      <CreateClassModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingClassId(null);
          setEditingInitialData(null);
          setOriginalStatus(null);
        }}
        onSubmit={handleUpdateClass}
        mode="edit"
        initialData={editingInitialData}
      />
    </>
  );
}