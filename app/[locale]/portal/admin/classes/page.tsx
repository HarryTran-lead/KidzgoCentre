"use client";

import { useDeferredValue, useMemo, useState, useEffect, useRef } from "react";
import { todayDateOnly } from "@/lib/datetime";
import { useRouter, useParams } from "next/navigation";
import {
  Plus, Search, Users, Clock, Eye, Pencil,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  BookOpen, X, Calendar, Tag, User, GraduationCap, AlertCircle, Building2,
  Power, PowerOff, UserPlus, CalendarClock, RefreshCw, Check, Loader2,
  CalendarDays, CheckCircle
} from "lucide-react";
import clsx from "clsx";
import { 
  fetchAdminClasses, 
  createAdminClass, 
  fetchAdminClassStudents,
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
import { getAccessToken } from "@/lib/store/authToken";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import AdminBranchSelectField from "@/components/admin/common/AdminBranchSelectField";

/* ----------------------------- UI HELPERS ------------------------------ */
function StatusBadge({ value }: { value: ClassRow["status"] }) {
  const map: Record<ClassRow["status"], string> = {
    "Đang học": "bg-green-100 text-green-700 border border-green-200",
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
const PAGE_SIZE = 10;

type ScheduleDisplayProps = {
  schedule: string;
  classId?: string;
  startDate?: string;
};

function ScheduleDisplay({ schedule, classId, startDate }: ScheduleDisplayProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  // Format startDate to YYYY-MM-DD if it's in ISO format
  const formattedStartDate = startDate ? startDate.slice(0, 10) : undefined;
  
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
      
      {/* Icon button to go to schedule page */}
      {classId && formattedStartDate && (
        <button
          onClick={() => router.push(`/${locale}/portal/admin/schedule?classId=${classId}&date=${formattedStartDate}`)}
          className="mt-2 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          title="Xem lịch học"
        >
          <CalendarDays size={12} className=""/>
          <span>Xem lịch</span>
        </button>
      )}
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
function calculateTotalSessionsFromDateRange(startDate: string, endDate: string, schedule: string): number {
  if (!startDate || !endDate || !schedule) {
    return 0;
  }

  try {
    const dayMap: Record<string, number> = {
      "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6, "CN": 0,
    };

    const match = schedule.match(/(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
    if (!match) return 0;

    const dayPart = match[1];
    const daysInWeek: number[] = [];

    if (dayPart.includes("Thứ")) {
      const dayNumbers = dayPart.match(/\d+/g) || [];
      dayNumbers.forEach((d) => {
        if (dayMap[d] !== undefined) daysInWeek.push(dayMap[d]);
      });
      if (dayPart.includes("CN")) {
        daysInWeek.push(0);
      }
    } else if (dayPart === "CN") {
      daysInWeek.push(0);
    }

    if (daysInWeek.length === 0) return 0;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      if (daysInWeek.includes(current.getDay())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  } catch (error) {
    console.error("Error calculating total sessions from date range:", error);
    return 0;
  }
}

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

/* ----------------------------- TIME PICKER COMPONENT ------------------------------ */
function TimePicker({ 
  value, 
  onChange, 
  label 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  label: string;
}) {
  const [hours, setHours] = useState(() => {
    const [h] = value.split(':').map(Number);
    return isNaN(h) ? 18 : h;
  });
  const [minutes, setMinutes] = useState(() => {
    const [, m] = value.split(':').map(Number);
    return isNaN(m) ? 0 : m;
  });

  useEffect(() => {
    onChange(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  }, [hours, minutes, onChange]);

  const incrementHours = () => setHours(prev => (prev + 1) % 24);
  const decrementHours = () => setHours(prev => (prev - 1 + 24) % 24);
  const incrementMinutes = () => setMinutes(prev => (prev + 1) % 60);
  const decrementMinutes = () => setMinutes(prev => (prev - 1 + 60) % 60);

  return (
    <div className="space-y-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1">
        {/* Giờ */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementHours}
            className="w-14 h-8 rounded-t-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 cursor-pointer transition-colors"
          >
            ▲
          </button>
          <div className="w-14 h-12 bg-white border-x border-gray-200 flex items-center justify-center font-mono text-lg font-semibold text-gray-900">
            {hours.toString().padStart(2, '0')}
          </div>
          <button
            type="button"
            onClick={decrementHours}
            className="w-14 h-8 rounded-b-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 cursor-pointer transition-colors"
          >
            ▼
          </button>
        </div>

        <span className="text-xl font-bold text-gray-400 mx-1">:</span>

        {/* Phút */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementMinutes}
            className="w-14 h-8 rounded-t-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 cursor-pointer transition-colors"
          >
            ▲
          </button>
          <div className="w-14 h-12 bg-white border-x border-gray-200 flex items-center justify-center font-mono text-lg font-semibold text-gray-900">
            {minutes.toString().padStart(2, '0')}
          </div>
          <button
            type="button"
            onClick={decrementMinutes}
            className="w-14 h-8 rounded-b-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 cursor-pointer transition-colors"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
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
  onSubmit: (data: ClassFormData) => Promise<void>;
  mode?: "create" | "edit";
  initialData?: ClassFormData | null;
  currentClassId?: string | null;
  existingClassRows?: ClassRow[];
  currentEnrollmentCount?: number;
}

// Add Student Modal Component
interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  enrolledStudentIds: string[];
  classCapacity: number;
  currentEnrolled: number;
  toast: any;
  onEnrollmentSuccess?: (enrolledIds: string[]) => void;
}

interface StudentOption {
  id: string;
  name: string;
  code: string;
  profileId: string;
}

function AddStudentModal({ isOpen, onClose, classId, enrolledStudentIds, classCapacity, currentEnrolled, toast, onEnrollmentSuccess }: AddStudentModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const remainingSlots = Math.max(classCapacity - currentEnrolled, 0);

  // Fetch available students
  useEffect(() => {
    if (!isOpen) return;

    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const token = getAccessToken();
        // Fetch all users from admin/users API — students are embedded in Parent profiles
        const response = await fetch("/api/admin/users?pageNumber=1&pageSize=100", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("📚 Students API response:", data);

        let studentList: StudentOption[] = [];

        // Students are stored inside the "profiles" array of Parent users
        // Each Parent may have multiple profiles: Parent profile + Student profile(s)
        if (data.isSuccess && Array.isArray(data.data?.items)) {
          for (const user of data.data.items) {
            if (user.role === "Parent" && Array.isArray(user.profiles)) {
              for (const profile of user.profiles) {
                if (profile.profileType === "Student") {
                  studentList.push({
                    id: String(profile.id),        // profile ID = student ID
                    name: String(profile.displayName || "Học viên"),
                    code: String(user.username || ""),
                    profileId: String(profile.id),
                  });
                }
              }
            }
          }
        }

        console.log("📚 Final student list:", studentList);
        setStudents(studentList);
      } catch (error) {
        console.error("❌ Error fetching students:", error);
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
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

  if (!isOpen) return null;

  const filteredStudents = students.filter(s => 
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !enrolledStudentIds.includes(s.id) &&
    !enrolledStudentIds.includes(s.profileId)
  );

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      }

      if (prev.length >= remainingSlots) {
        toast.warning({
          title: "Không thể chọn thêm học viên",
          description: `Sĩ số còn lại của lớp chỉ là ${remainingSlots}.`,
        });
        return prev;
      }

      return [...prev, studentId];
    });
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) return;
    if (selectedStudents.length > remainingSlots) {
      toast.destructive({
        title: "Thêm học viên thất bại",
        description: `Không thể thêm vượt quá sĩ số còn lại (${remainingSlots}).`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAccessToken();
      
      // Lấy danh sách profileId của các học viên được chọn
      const selectedStudentProfiles = students.filter(s => selectedStudents.includes(s.id));
      
      // Gọi API cho mỗi học viên
      const enrollDate = todayDateOnly(); // Ngày hiện tại
      let successCount = 0;
      let failedStudents: string[] = [];
      
      for (const student of selectedStudentProfiles) {
        if (!student.profileId) continue;
        
        const response = await fetch("/api/enrollments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            classId,
            studentProfileId: student.profileId,
            enrollDate,
            tuitionPlanId: null, // Không bắt buộc
          }),
        });

        const data = await response.json();

        if (data.success || data.isSuccess) {
          successCount++;
        } else {
          failedStudents.push(student.name);
        }
      }

      if (successCount > 0) {
        toast.success({
          title: "Thêm học viên thành công",
          description: `Đã thêm ${successCount} học viên vào lớp.`,
        });
        
        // Cập nhật danh sách enrolled để lọc bỏ những student đã thêm
        const newEnrolledIds = selectedStudentProfiles
          .filter(s => s.profileId)
          .map(s => s.id);
        
        // Gọi callback để cập nhật danh sách enrolled ở parent
        if (onEnrollmentSuccess) {
          onEnrollmentSuccess(newEnrolledIds);
        }
        
        // Clear selected students để admin có thể tiếp tục thêm
        setSelectedStudents([]);
      }
      
      if (failedStudents.length > 0) {
        toast.destructive({
          title: "Thêm học viên thất bại",
          description: `Không thể thêm: ${failedStudents.join(", ")}`,
        });
      }
    } catch (error) {
      console.error("Error enrolling students:", error);
      toast.destructive({
        title: "Thêm học viên thất bại",
        description: "Đã xảy ra lỗi khi thêm học viên. Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <UserPlus size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Thêm học viên
                </h2>
                <p className="text-sm text-red-100">
                  Chọn học viên để thêm vào lớp
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

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm học viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300"
              />
            </div>
            {filteredStudents.length > 0 && (
              <button
                onClick={() => {
                  if (selectedStudents.length === filteredStudents.length) {
                    setSelectedStudents([]);
                  } else {
                    setSelectedStudents(filteredStudents.map(s => s.id));
                  }
                }}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            )}
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              <span className="ml-2 text-gray-500">Đang tải...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy học viên
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedStudents.includes(student.id)
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedStudents.includes(student.id)
                      ? "bg-red-500 border-red-500"
                      : "border-gray-300"
                  }`}>
                    {selectedStudents.includes(student.id) && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.code}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {/* Selected Students Preview */}
          {selectedStudents.length > 0 && (
            <div className="mb-4 p-3 bg-white rounded-xl border border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Đã chọn:</div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedStudents.slice(0, 4).map(studentId => {
                  const student = students.find(s => s.id === studentId);
                  if (!student) return null;
                  const initials = student.name.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase();
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-2 px-2 py-1.5 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold flex items-center justify-center">
                        {initials}
                      </div>
                      <span className="text-xs font-medium text-gray-800 max-w-[100px] truncate">{student.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStudent(student.id);
                        }}
                        className="w-4 h-4 rounded-full bg-gray-200 hover:bg-red-200 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X size={10} className="text-gray-500" />
                      </button>
                    </div>
                  );
                })}
                {selectedStudents.length > 4 && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-300 text-xs font-semibold text-gray-600">
                    +{selectedStudents.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}
          {(() => {
            const totalAfterAdd = currentEnrolled + selectedStudents.length;
            const isOverCapacity = totalAfterAdd > classCapacity;
            return (
              <div className="mb-4">
                {isOverCapacity ? (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                    <span className="text-sm text-red-700">
                      Vượt quá sĩ số! Lớp sẽ có <strong>{totalAfterAdd}</strong> học viên (tối đa {classCapacity})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-700">
                      Đã chọn <strong>{selectedStudents.length}</strong> / Sĩ số còn lại: <strong>{classCapacity - currentEnrolled}</strong> 
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Tổng: <span className="font-semibold">{selectedStudents.length}</span> học viên
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedStudents.length === 0 || isSubmitting || selectedStudents.length > remainingSlots}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Thêm vào lớp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ClassFormData {
  code: string;
  name: string;
  programId: string;
  branchId: string;
  mainTeacherId: string;
  assistantTeacherId: string;
  roomId: string;
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
  roomId: "",
  capacity: 30,
  schedule: "",
  status: "Sắp khai giảng",
  startDate: "",
  endDate: "",
  totalSessions: 0,
  description: "",
};

type ClassFormField = keyof ClassFormData;
type ClassFieldErrors = Partial<Record<ClassFormField, string>>;

class ClassFormSubmitError extends Error {
  fieldErrors: ClassFieldErrors;

  constructor(message: string, fieldErrors: ClassFieldErrors = {}) {
    super(message);
    this.name = "ClassFormSubmitError";
    this.fieldErrors = fieldErrors;
  }
}

const CLASS_FORM_FIELD_ORDER: ClassFormField[] = [
  "code",
  "name",
  "branchId",
  "programId",
  "mainTeacherId",
  "assistantTeacherId",
  "capacity",
  "startDate",
  "roomId",
  "schedule",
  "endDate",
];

function normalizeComparableText(value: string | number | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extractScheduleMeta(schedule: string) {
  const match = schedule.match(/(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
  if (!match) {
    return {
      days: [] as string[],
      startTime: "",
      endTime: "",
    };
  }

  const [, dayPart, startTime, endTime] = match;
  const days: string[] = [];

  if (dayPart.includes("Thứ")) {
    const dayNumbers = dayPart.match(/\d+/g) || [];
    days.push(...dayNumbers);
    if (dayPart.includes("CN")) {
      days.push("CN");
    }
  } else if (dayPart.includes("CN")) {
    days.push("CN");
  }

  return {
    days: Array.from(new Set(days)).sort(),
    startTime,
    endTime,
  };
}

function getClassFormErrorMessage(error: unknown): string {
  const err = error as
    | {
        message?: string;
        detail?: string;
        title?: string;
      }
    | undefined;

  return err?.message || err?.detail || err?.title || "Không thể lưu lớp học. Vui lòng thử lại.";
}

function buildClassSubmissionError(
  error: unknown,
  data: ClassFormData,
): ClassFormSubmitError {
  if (error instanceof ClassFormSubmitError) {
    return error;
  }

  const err = error as
    | {
        message?: string;
        detail?: string;
        title?: string;
        raw?: { errors?: Record<string, string[] | string> | Array<{ description?: string; code?: string }> };
      }
    | undefined;

  const rawMessage = getClassFormErrorMessage(error);
  const normalized = normalizeComparableText(`${err?.title || ""} ${err?.detail || ""} ${rawMessage}`);
  const fieldErrors: ClassFieldErrors = {};

  if (normalized.includes("codeexists") || normalized.includes("mã lớp") || normalized.includes("class code")) {
    fieldErrors.code = `mã lớp ${data.code.trim()} đã tồn tại`;
    return new ClassFormSubmitError(fieldErrors.code, fieldErrors);
  }

  if (
    normalized.includes("already exists")
    || normalized.includes("đã tồn tại")
    || normalized.includes("duplicate")
  ) {
    if (normalized.includes("title") || normalized.includes("name") || normalized.includes("lớp")) {
      fieldErrors.name = `lớp ${data.name.trim()} đã tồn tại`;
      fieldErrors.programId = `lớp ${data.name.trim()} đã tồn tại`;
      return new ClassFormSubmitError(fieldErrors.name, fieldErrors);
    }
  }

  if (normalized.includes("assistant") && normalized.includes("main")) {
    fieldErrors.assistantTeacherId = "giáo viên phụ và giáo viên chính không được trùng nhau";
    return new ClassFormSubmitError(fieldErrors.assistantTeacherId, fieldErrors);
  }

  if (
    normalized.includes("capacity")
    || normalized.includes("sĩ số")
    || normalized.includes("classfull")
  ) {
    fieldErrors.capacity = rawMessage;
    return new ClassFormSubmitError(rawMessage, fieldErrors);
  }

  if (normalized.includes("start date") || normalized.includes("ngày bắt đầu")) {
    fieldErrors.startDate = rawMessage;
    return new ClassFormSubmitError(rawMessage, fieldErrors);
  }

  if (normalized.includes("room") || normalized.includes("phòng")) {
    fieldErrors.roomId = rawMessage;
    return new ClassFormSubmitError(rawMessage, fieldErrors);
  }

  if (normalized.includes("schedule") || normalized.includes("rrule") || normalized.includes("khung giờ")) {
    fieldErrors.schedule = rawMessage;
    return new ClassFormSubmitError(rawMessage, fieldErrors);
  }

  return new ClassFormSubmitError(rawMessage);
}

function buildClassStatusErrorMessage(
  currentStatus: ClassRow["status"],
  error: unknown,
): string {
  const rawMessage = getClassFormErrorMessage(error);
  const normalized = normalizeComparableText(rawMessage);

  if (
    normalized.includes("invalid status transition")
    || normalized.includes("statusunchanged")
    || normalized.includes("không thể")
  ) {
    if (currentStatus === "Sắp khai giảng") {
      return "không thể chuyển trạng thái lớp từ sắp khai giảng sang đang học";
    }

    if (currentStatus === "Đang học") {
      return "không thể chuyển trạng thái lớp từ đang học sang kết thúc";
    }
  }

  return rawMessage;
}

function CreateClassModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  initialData,
  currentClassId = null,
  existingClassRows = [],
  currentEnrollmentCount = 0,
}: CreateClassModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ClassFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ClassFormData, string>>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const prevBranchIdRef = useRef<string>("");
  const [programOptions, setProgramOptions] = useState<SelectOption[]>([]);
  const [branchOptions, setBranchOptions] = useState<SelectOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<SelectOption[]>([]);
  const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
  const [allRooms, setAllRooms] = useState<{ id: string; name: string; capacity: number }[]>([]);
  const [existingClasses, setExistingClasses] = useState<{ id: string; name: string; schedule: string; roomId: string }[]>([]);
  const [roomConflictWarning, setRoomConflictWarning] = useState<string>("");
  const [conflictRoomIds, setConflictRoomIds] = useState<Set<string>>(new Set());
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // States mới cho UI chọn lịch học
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(2);
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSelectData = async () => {
    try {
      setLoadingOptions(true);
      const data = await fetchClassFormSelectData();
      // Chỉ update branch options, không reset program/teacher options
      // (sẽ được load lại khi user chọn branch)
      setBranchOptions(data.branches);
      // Giữ nguyên programOptions và teacherOptions nếu đã có
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
      setUseCustomTime(false);
      setStartTime("18:00");
      setEndTime("20:00");
      setRoomOptions([]);
      setAllRooms([]);
      setExistingClasses([]);
    }
  }, [isOpen]);

  // Cập nhật schedule string khi các lựa chọn thay đổi
  useEffect(() => {
    if (selectedDays.length > 0) {
      if (!useCustomTime && selectedTimeSlot) {
        const timeRange = TIME_SLOTS.find(t => t.value === selectedTimeSlot)?.timeRange || "";
        const dayString = formatDaysString(selectedDays);
        const schedule = `${dayString} (${timeRange})`;
        handleChange("schedule", schedule);
      } else if (useCustomTime) {
        const timeRange = `${startTime} - ${endTime}`;
        const dayString = formatDaysString(selectedDays);
        const schedule = `${dayString} (${timeRange})`;
        handleChange("schedule", schedule);
      }
    } else {
      handleChange("schedule", "");
    }
  }, [selectedDays, selectedTimeSlot, useCustomTime, startTime, endTime]);

  // Khi chọn chi nhánh -> load programs và giáo viên thuộc chi nhánh đó
  useEffect(() => {
    if (!isOpen) return;

    const branchId = formData.branchId;
    if (!branchId) {
      setProgramOptions([]);
      setTeacherOptions([]);
      setRoomOptions([]);
      setAllRooms([]);
      setExistingClasses([]);
      setFormData((prev) => ({
        ...prev,
        programId: "",
        mainTeacherId: "",
        assistantTeacherId: "",
        roomId: "",
      }));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingOptions(true);
        const [programs, teachers, rooms, existingClassesData] = await Promise.all([
          fetchProgramOptionsByBranch(branchId),
          fetchTeacherOptionsByBranch(branchId),
          fetchAdminRooms({ branchId }),
          fetchAdminClasses({ branchId }),
        ]);
        
        if (cancelled) return;
        
        // Lọc chỉ lấy các chương trình đang hoạt động
        const activePrograms = programs.filter((p: any) => p.status === "Đang hoạt động");
        setProgramOptions(activePrograms);
        setTeacherOptions(teachers);
        setAllRooms(rooms.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity })));
        
        // Lưu danh sách lớp hiện có để kiểm tra trùng lịch
        setExistingClasses(
          existingClassesData
            .filter((c: any) => c.id && c.schedule)
            .map((c: any) => ({
              id: c.id,
              name: c.name || c.sub || "Lớp học",
              schedule: c.schedule,
              roomId: c.roomId || "",
            }))
        );
        
        // Lọc phòng theo sĩ số hiện tại nếu có
        const currentCapacity = formData.capacity || 0;
        const filteredRooms = rooms.filter((r) => r.capacity >= currentCapacity).map((r) => ({ id: r.id, name: r.name }));
        setRoomOptions(filteredRooms);

        // Chỉ reset formData nếu branchId thực sự thay đổi (user chọn branch khác)
        // Không reset khi lần đầu load options từ initialData
        const branchChanged = prevBranchIdRef.current && prevBranchIdRef.current !== branchId;
        
        if (branchChanged) {
          const programIds = new Set(programs.map((p) => p.id));
          const teacherIds = new Set(teachers.map((t) => t.id));
          const roomIds = new Set(rooms.map((r) => r.id));
          
          setFormData((prev) => ({
            ...prev,
            programId: programIds.has(prev.programId) ? prev.programId : "",
            mainTeacherId: teacherIds.has(prev.mainTeacherId) ? prev.mainTeacherId : "",
            assistantTeacherId: teacherIds.has(prev.assistantTeacherId) ? prev.assistantTeacherId : "",
            roomId: roomIds.has(prev.roomId) ? prev.roomId : "",
          }));
        }
        
        // Cập nhật ref để track branchId
        prevBranchIdRef.current = branchId;
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load programs and teachers by branch:", err);
        setProgramOptions([]);
        setTeacherOptions([]);
        setRoomOptions([]);
        setAllRooms([]);
        setExistingClasses([]);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, formData.branchId]);

  // Lọc lại phòng học khi sĩ số thay đổi
  useEffect(() => {
    if (allRooms.length > 0) {
      const currentCapacity = formData.capacity || 0;
      const filteredRooms = allRooms.filter((r) => r.capacity >= currentCapacity).map((r) => ({ id: r.id, name: r.name }));
      setRoomOptions(filteredRooms);
      
      // Nếu phòng đang chọn không còn phù hợp với sĩ số mới -> reset
      const selectedRoom = filteredRooms.find((r) => r.id === formData.roomId);
      if (!selectedRoom && formData.roomId) {
        handleChange("roomId", "");
      }
    }
  }, [formData.capacity, allRooms]);

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
              // Parse start and end time for custom time
              const [start, end] = timeRange.split(' - ');
              setStartTime(start);
              setEndTime(end);
              setUseCustomTime(true);
            }
          }
        }
      } else {
        setFormData(initialFormData);
        setSelectedDays([]);
        setSelectedTimeSlot("");
        setSessionsPerWeek(2);
        setUseCustomTime(false);
        setStartTime("18:00");
        setEndTime("20:00");
        setRoomOptions([]);
        setAllRooms([]);
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  // Hàm kiểm tra trùng lịch phòng học
  const checkRoomScheduleConflict = (roomId: string, schedule: string): string[] => {
    if (!roomId || !schedule || existingClasses.length === 0) return [];

    const conflicts: string[] = [];
    
    // Parse schedule mới: "Thứ 2,4,6 (18:00 - 20:00)"
    const newScheduleMatch = schedule.match(/(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
    if (!newScheduleMatch) return [];

    const newDays = newScheduleMatch[1];
    const newStartTime = newScheduleMatch[2];
    const newEndTime = newScheduleMatch[3];

    // Parse các ngày trong tuần của schedule mới
    const newDayValues: string[] = [];
    if (newDays.includes("Thứ")) {
      const dayNumbers = newDays.match(/\d+/g) || [];
      newDayValues.push(...dayNumbers);
      if (newDays.includes("CN")) newDayValues.push("CN");
    } else if (newDays === "CN") {
      newDayValues.push("CN");
    }

    for (const cls of existingClasses) {
      // Chỉ kiểm tra các lớp cùng phòng
      if (cls.roomId !== roomId) continue;

      const existingScheduleMatch = cls.schedule.match(/(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
      if (!existingScheduleMatch) continue;

      const existingDays = existingScheduleMatch[1];
      const existingStartTime = existingScheduleMatch[2];
      const existingEndTime = existingScheduleMatch[3];

      // Parse các ngày của schedule hiện có
      const existingDayValues: string[] = [];
      if (existingDays.includes("Thứ")) {
        const dayNumbers = existingDays.match(/\d+/g) || [];
        existingDayValues.push(...dayNumbers);
        if (existingDays.includes("CN")) existingDayValues.push("CN");
      } else if (existingDays === "CN") {
        existingDayValues.push("CN");
      }

      // Kiểm tra xem có ngày trùng nhau không
      const commonDays = newDayValues.filter(d => existingDayValues.includes(d));
      if (commonDays.length === 0) continue;

      // Kiểm tra xem có giờ trùng nhau không
      if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
        conflicts.push(`${cls.name} (${cls.schedule})`);
      }
    }

    return conflicts;
  };

  // Kiểm tra trùng lịch phòng khi roomId hoặc schedule thay đổi
  useEffect(() => {
    if (formData.roomId && formData.schedule) {
      const conflicts = checkRoomScheduleConflict(formData.roomId, formData.schedule);
      if (conflicts.length > 0) {
        setRoomConflictWarning(`Cảnh báo: Phòng đã có lớp học ${conflicts.join(", ")}`);
      } else {
        setRoomConflictWarning("");
      }

      // Tìm các phòng bị trùng lịch
      const conflicts2 = new Set<string>();
      for (const room of allRooms) {
        const roomConflicts = checkRoomScheduleConflict(room.id, formData.schedule);
        if (roomConflicts.length > 0) {
          conflicts2.add(room.id);
        }
      }
      setConflictRoomIds(conflicts2);
    } else {
      setRoomConflictWarning("");
      // Tìm các phòng bị trùng khi không có room được chọn
      if (formData.schedule) {
        const conflicts2 = new Set<string>();
        for (const room of allRooms) {
          const roomConflicts = checkRoomScheduleConflict(room.id, formData.schedule);
          if (roomConflicts.length > 0) {
            conflicts2.add(room.id);
          }
        }
        setConflictRoomIds(conflicts2);
      } else {
        setConflictRoomIds(new Set());
      }
    }
  }, [formData.roomId, formData.schedule, existingClasses, allRooms]);

  const focusFirstInvalidField = (fieldErrors: ClassFieldErrors) => {
    const firstField = CLASS_FORM_FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!firstField) return;

    window.setTimeout(() => {
      const target = modalRef.current?.querySelector<HTMLElement>(`[data-field="${firstField}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = target.matches("input, select, textarea, button")
        ? target
        : target.querySelector<HTMLElement>("input, select, textarea, button");
      focusable?.focus();
    }, 50);
  };

  const collectValidationErrors = (): ClassFieldErrors => {
    const newErrors: ClassFieldErrors = {};
    const today = getTodayDateString();
    const selectedProgramName =
      programOptions.find((program) => program.id === formData.programId)?.name || "";
    const initialScheduleMeta = extractScheduleMeta(initialData?.schedule || "");
    const currentScheduleMeta = extractScheduleMeta(formData.schedule || "");

    if (!formData.code.trim()) newErrors.code = "mã lớp là bắt buộc";
    if (!formData.name.trim()) newErrors.name = "tên lớp là bắt buộc";
    if (!formData.programId) newErrors.programId = "chương trình là bắt buộc";
    if (!formData.branchId) newErrors.branchId = "chi nhánh là bắt buộc";
    if (!formData.mainTeacherId) newErrors.mainTeacherId = "giáo viên chính là bắt buộc";

    if (
      formData.mainTeacherId
      && formData.assistantTeacherId
      && formData.mainTeacherId === formData.assistantTeacherId
    ) {
      newErrors.assistantTeacherId = "giáo viên phụ và giáo viên chính không được trùng nhau";
    }

    if (formData.capacity <= 0) {
      newErrors.capacity = "sĩ số tối thiểu phải lớn hơn 0";
    }

    if (mode === "edit" && currentEnrollmentCount > 0 && formData.capacity < currentEnrollmentCount) {
      newErrors.capacity = "sỉ số mới không được nhỏ hơn sỉ số học sinh đã tham gia vào lớp";
    }

    if (!formData.startDate) {
      newErrors.startDate = "ngày bắt đầu là bắt buộc";
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "ngày kết thúc phải sau ngày bắt đầu";
    }

    if (formData.status === "Sắp khai giảng" && formData.startDate && formData.startDate < today) {
      newErrors.startDate = "không thể chọn ngày trong quá khứ";
    }

    if (selectedDays.length === 0) {
      newErrors.schedule = "vui lòng chọn ít nhất 1 ngày học";
    } else if (selectedDays.length < sessionsPerWeek) {
      newErrors.schedule = `cần chọn đủ ${sessionsPerWeek} buổi học mỗi tuần`;
    }

    if (!useCustomTime && !selectedTimeSlot) {
      newErrors.schedule = "vui lòng chọn khung giờ học";
    }

    if (useCustomTime && startTime >= endTime) {
      newErrors.schedule = "khung giờ học không hợp lệ";
    }

    const duplicatedCode = existingClassRows.some(
      (row) =>
        row.id !== currentClassId
        && normalizeComparableText(row.code) === normalizeComparableText(formData.code),
    );
    if (formData.code.trim() && duplicatedCode) {
      newErrors.code = `mã lớp ${formData.code.trim()} đã tồn tại`;
    }

    const duplicatedNameInProgram = existingClassRows.some(
      (row) =>
        row.id !== currentClassId
        && normalizeComparableText(row.name) === normalizeComparableText(formData.name)
        && normalizeComparableText(row.sub) === normalizeComparableText(selectedProgramName),
    );
    if (formData.name.trim() && selectedProgramName && duplicatedNameInProgram) {
      newErrors.name = `lớp ${formData.name.trim()} đã tồn tại`;
      newErrors.programId = `lớp ${formData.name.trim()} đã tồn tại`;
    }

    if (mode === "edit" && initialData?.status === "Đang học") {
      if (formData.startDate !== initialData.startDate) {
        newErrors.startDate = "không thể update ngày bắt đầu khi lớp đang học";
      }

      if (formData.roomId !== initialData.roomId) {
        newErrors.roomId = "không thể update phòng học khi lớp đang học";
      }

      const initialDays = initialScheduleMeta.days.join(",");
      const currentDays = currentScheduleMeta.days.join(",");
      if (initialDays !== currentDays) {
        newErrors.schedule = "không thể update số buổi học mỗi tuần khi lớp đang học";
      } else if (
        initialScheduleMeta.startTime !== currentScheduleMeta.startTime
        || initialScheduleMeta.endTime !== currentScheduleMeta.endTime
      ) {
        newErrors.schedule = "không thể update khung giờ học khi lớp đang học";
      }
    }

    return newErrors;
  };

  const validateForm = (): boolean => {
    const newErrors = collectValidationErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const newErrors = collectValidationErrors();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorMessage = CLASS_FORM_FIELD_ORDER.map((field) => newErrors[field]).find(Boolean);
      if (firstErrorMessage) {
        toast.destructive({
          title: mode === "edit" ? "Cập nhật lớp học thất bại" : "Tạo lớp học thất bại",
          description: firstErrorMessage,
        });
      }
      focusFirstInvalidField(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      if (error instanceof ClassFormSubmitError && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
        focusFirstInvalidField(error.fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleChange = (field: keyof ClassFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Khi thay đổi endDate hoặc schedule hoặc startDate -> tự tính totalSessions
      if (
        (field === "endDate" || field === "schedule" || field === "startDate") &&
        newData.startDate && newData.endDate && newData.schedule &&
        newData.endDate >= newData.startDate
      ) {
        const calculatedSessions = calculateTotalSessionsFromDateRange(
          newData.startDate,
          newData.endDate,
          newData.schedule
        );
        if (calculatedSessions > 0) {
          newData.totalSessions = calculatedSessions;
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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
                  Mã lớp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    data-field="code"
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
                  Tên lớp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    data-field="name"
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
              <AdminBranchSelectField
                isOpen={isOpen}
                mode={mode}
                value={formData.branchId}
                options={branchOptions.map((branch) => ({ id: branch.id, label: branch.name }))}
                onValueChange={(value) => handleChange("branchId", value)}
                error={errors.branchId}
                disabled={loadingOptions}
                placeholder={loadingOptions ? "Đang tải chi nhánh..." : "Vui lòng chọn chi nhánh"}
                dataField="branchId"
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-red-600" />
                  Chương trình <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.programId}
                  onValueChange={(val) => handleChange("programId", val)}
                  disabled={loadingOptions}
                >
                  <SelectTrigger
                    data-field="programId"
                    className={clsx(
                      "w-full",
                      errors.programId ? "border-red-500" : "border-gray-200"
                    )}
                  >
                    <SelectValue placeholder={loadingOptions ? "Đang tải..." : "Chọn chương trình"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.programId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.programId}</p>}
              </div>
            </div>

            {/* Row 2.5: Giáo viên chính & Giáo viên phụ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User size={16} className="text-red-600" />
                  Giáo viên chính <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.mainTeacherId}
                  onValueChange={(val) => handleChange("mainTeacherId", val)}
                  disabled={loadingOptions}
                >
                  <SelectTrigger
                    data-field="mainTeacherId"
                    className={clsx(
                      "w-full",
                      errors.mainTeacherId ? "border-red-500" : "border-gray-200"
                    )}
                  >
                    <SelectValue placeholder={loadingOptions ? "Đang tải..." : "Chọn giáo viên chính"} />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.mainTeacherId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.mainTeacherId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User size={16} className="text-red-600" />
                  Giáo viên phụ
                </label>
                <Select
                  value={formData.assistantTeacherId}
                  onValueChange={(val) => handleChange("assistantTeacherId", val)}
                  disabled={loadingOptions}
                >
                  <SelectTrigger
                    data-field="assistantTeacherId"
                    className={clsx(
                      "w-full",
                      errors.assistantTeacherId ? "border-red-500" : "border-gray-200"
                    )}
                  >
                    <SelectValue placeholder={loadingOptions ? "Đang tải..." : "Chọn giáo viên phụ (tùy chọn)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assistantTeacherId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.assistantTeacherId}</p>}
              </div>
            </div>

            {/* Row 3: Sĩ số */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users size={16} className="text-red-600" />
                Sĩ số tối đa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  data-field="capacity"
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
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    data-field="startDate"
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
                  Ngày kết thúc
                </label>
                <div className="relative">
                  <input
                    type="date"
                    data-field="endDate"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    min={formData.startDate || undefined}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                      errors.endDate ? "border-red-500" : "border-gray-200"
                    )}
                  />
                  {errors.endDate && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.endDate && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.endDate}</p>}
                <p className="text-xs text-gray-500">
                  {mode === "edit" ? "Chỉnh sửa ngày kết thúc để thay đổi số buổi học" : "Chọn ngày kết thúc để xác định số buổi học"}
                </p>
              </div>
            </div>

            {/* Row 5: Lịch học - UI MỚI */}
            <div data-field="schedule" className="p-5 bg-gradient-to-br from-gray-50 to-red-50/30 rounded-xl border-2 border-dashed border-gray-200">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                <Clock size={16} className="text-red-600" />
                Lịch học <span className="text-red-500">*</span>
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
              <div className="space-y-2 mt-4">
                <label className="text-sm text-gray-600 ">
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
                {errors.schedule && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.schedule}
                  </p>
                )}
              </div>

              {/* Chọn khung giờ */}
              <div className="space-y-2 mt-4">
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
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      <TimePicker 
                        value={startTime} 
                        onChange={setStartTime} 
                        label="Giờ bắt đầu"
                      />
                      <span className="text-gray-400 font-bold hidden md:block">→</span>
                      <TimePicker 
                        value={endTime} 
                        onChange={setEndTime} 
                        label="Giờ kết thúc"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Sử dụng các nút ▲▼ để điều chỉnh giờ và phút
                    </p>
                  </div>
                )}
              </div>

              {/* Chọn phòng học */}
              <div data-field="roomId" className="space-y-2 mt-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 size={16} className="text-red-600" />
                  Phòng học {formData.capacity > 0 && <span className="text-xs font-normal text-gray-500">(tối thiểu {formData.capacity} chỗ)</span>}
                </label>
                {formData.branchId ? (
                  allRooms.length > 0 ? (
                    roomOptions.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {roomOptions.map((room) => {
                          const hasConflict = conflictRoomIds.has(room.id);
                          const roomData = allRooms.find(r => r.id === room.id);
                          const capacity = roomData?.capacity || 0;
                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => handleChange("roomId", room.id)}
                              className={clsx(
                                "px-3 py-2.5 rounded-xl border text-sm transition-all cursor-pointer relative",
                                formData.roomId === room.id
                                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                                  : hasConflict
                                  ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-medium">{room.name}</span>
                                <span className={`text-xs mt-0.5 ${formData.roomId === room.id ? 'text-red-100' : 'text-gray-500'}`}>
                                  {capacity} chỗ
                                </span>
                                {hasConflict && (
                                  <span className="text-xs text-amber-600 mt-1">⚠️ Trùng lịch</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-amber-600 italic">Không có phòng nào đủ sức chứa cho {formData.capacity} học viên</p>
                    )
                  ) : (
                    <p className="text-sm text-gray-500 italic">Chi nhánh này chưa có phòng học nào</p>
                  )
                ) : (
                  <p className="text-sm text-gray-500 italic">Vui lòng chọn chi nhánh trước</p>
                )}
                {errors.roomId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.roomId}</p>}
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

              {/* Cảnh báo trùng lịch phòng */}
              {roomConflictWarning && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-xl">
                  <div className="flex items-start gap-2 text-sm text-amber-800">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{roomConflictWarning}</span>
                  </div>
                </div>
              )}
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
                    setUseCustomTime(false);
                    setStartTime("18:00");
                    setEndTime("20:00");
                    setRoomOptions([]);
                    setAllRooms([]);
                    setExistingClasses([]);
                    setConflictRoomIds(new Set());
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
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Đang lưu..." : mode === "edit" ? "Lưu thay đổi" : "Tạo lớp học"}
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
  const [schedulePatternFilter, setSchedulePatternFilter] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassCapacity, setSelectedClassCapacity] = useState<number>(0);
  const [selectedClassCurrent, setSelectedClassCurrent] = useState<number>(0);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<string[]>([]);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingInitialData, setEditingInitialData] = useState<ClassFormData | null>(null);
  const [editingCurrentEnrollmentCount, setEditingCurrentEnrollmentCount] = useState<number>(0);
  const [originalStatus, setOriginalStatus] = useState<ClassFormData["status"] | null>(null);
  const deferredSchedulePatternFilter = useDeferredValue(schedulePatternFilter.trim());

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

        const mapped = await fetchAdminClasses({
          branchId,
          schedulePattern: deferredSchedulePatternFilter || undefined,
        });
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
  }, [selectedBranchId, isLoaded, deferredSchedulePatternFilter]);

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
          [c.id, c.name, c.sub, c.teacher, c.branch, c.schedule].some((x) =>
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

  const reloadClassesByCurrentBranch = async () => {
    const branchId = getBranchQueryParam();
    return fetchAdminClasses({
      branchId,
      schedulePattern: deferredSchedulePatternFilter || undefined,
    });
  };

  const goPage = (nextPage: number) => {
    setPage(Math.min(totalPages, Math.max(1, nextPage)));
  };
  const handleCreateClass = async (data: ClassFormData) => {
    try {
      console.log("Creating class with data:", {
        ...data,
        totalSessions: data.totalSessions,
        schedule: data.schedule,
        startDate: data.startDate,
        endDate: data.endDate,
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
        roomId: data.roomId || undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        capacity: data.capacity,
        schedulePattern,
        status: "Planned",
      };

      console.log("Creating class with payload:", payload);

      const created = await createAdminClass(payload);

      if (created?.id) {
        try {
          console.log("Generating sessions for class:", created.id);
          await generateSessionsFromPattern({
            classId: created.id,
            roomId: data.roomId || undefined,
            onlyFutureSessions: true,
          });
          console.log("Sessions generated successfully");
        } catch (sessionErr: any) {
          console.error("Failed to generate sessions:", sessionErr);
        }
      }

      const updatedClasses = await reloadClassesByCurrentBranch();
      setClasses(updatedClasses);

      toast.success({
        title: "T\u1ea1o l\u1edbp h\u1ecdc th\u00e0nh c\u00f4ng",
        description: `L\u1edbp ${data.name} \u0111\u00e3 \u0111\u01b0\u1ee3c t\u1ea1o v\u1edbi ${data.totalSessions} bu\u1ed5i h\u1ecdc.`,
      });
    } catch (err: any) {
      console.error("Failed to create class:", err);
      const mappedError = buildClassSubmissionError(err, data);
      toast.destructive({
        title: "T\u1ea1o l\u1edbp h\u1ecdc th\u1ea5t b\u1ea1i",
        description: mappedError.message,
      });
      throw mappedError;
    }
  };

  const handleOpenEditClass = async (row: ClassRow) => {
    try {
      setIsEditModalOpen(true);
      setEditingClassId(row.id);
      setEditingInitialData(null);
      setEditingCurrentEnrollmentCount(row.current ?? 0);

      const detail: any = await fetchAdminClassDetail(row.id);

      const schedulePattern = (detail?.schedulePattern as string | undefined) ?? "";
      const schedule = schedulePattern ? parseRRULEToSchedule(schedulePattern) : "";

      const rawStatus: string = (detail?.status as string | undefined) ?? "";
      const normalized = rawStatus.toLowerCase();
      let status: ClassFormData["status"] = "S\u1eafp khai gi\u1ea3ng";
      if (normalized === "active" || normalized === "ongoing") status = "\u0110ang h\u1ecdc";
      else if (normalized === "closed" || normalized === "completed") status = "\u0110\u00e3 k\u1ebft th\u00fac";

      const formData: ClassFormData = {
        code: detail?.code ?? row.code ?? "",
        name: detail?.title ?? row.name ?? "",
        programId: String(detail?.programId ?? ""),
        branchId: String(detail?.branchId ?? ""),
        mainTeacherId: String(detail?.mainTeacherId ?? ""),
        assistantTeacherId: detail?.assistantTeacherId ? String(detail.assistantTeacherId) : "",
        roomId: String(detail?.roomId ?? ""),
        capacity: typeof detail?.capacity === "number" ? detail.capacity : row.capacity,
        schedule,
        status,
        startDate: (detail?.startDate as string | undefined)?.slice(0, 10) ?? "",
        endDate: (detail?.endDate as string | undefined)?.slice(0, 10) ?? "",
        totalSessions: detail?.totalSessions ?? 0,
        description: detail?.description ?? "",
      };

      setEditingInitialData(formData);
      setEditingCurrentEnrollmentCount(
        typeof detail?.currentEnrollmentCount === "number"
          ? detail.currentEnrollmentCount
          : row.current ?? 0
      );
      setOriginalStatus(status);
    } catch (err: any) {
      console.error("Failed to load class detail for edit:", err);
      toast.destructive({
        title: "Kh\u00f4ng th\u1ec3 t\u1ea3i l\u1edbp h\u1ecdc",
        description: err?.message || "Kh\u00f4ng th\u1ec3 t\u1ea3i th\u00f4ng tin l\u1edbp h\u1ecdc \u0111\u1ec3 ch\u1ec9nh s\u1eeda.",
      });
      setIsEditModalOpen(false);
      setEditingClassId(null);
      setEditingInitialData(null);
      setEditingCurrentEnrollmentCount(0);
      setOriginalStatus(null);
    }
  };

  const handleUpdateClass = async (data: ClassFormData) => {
    if (!editingClassId) return;

    try {
      const schedulePattern = convertScheduleToRRULE(data.schedule, data.startDate);

      const payload: CreateClassRequest = {
        branchId: data.branchId,
        programId: data.programId.trim(),
        code: data.code,
        title: data.name,
        mainTeacherId: data.mainTeacherId,
        assistantTeacherId: data.assistantTeacherId || undefined,
        roomId: data.roomId || undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        capacity: data.capacity,
        schedulePattern,
      };

      console.log("Updating class with payload:", payload);

      await updateAdminClass(editingClassId, payload);

      const updatedClasses = await reloadClassesByCurrentBranch();
      setClasses(updatedClasses);

      toast.success({
        title: "C\u1eadp nh\u1eadt l\u1edbp h\u1ecdc th\u00e0nh c\u00f4ng",
        description: `Th\u00f4ng tin l\u1edbp ${data.name} \u0111\u00e3 \u0111\u01b0\u1ee3c l\u01b0u.`,
      });
    } catch (err: any) {
      console.error("Failed to update class:", err);
      const mappedError = buildClassSubmissionError(err, data);
      toast.destructive({
        title: "C\u1eadp nh\u1eadt l\u1edbp h\u1ecdc th\u1ea5t b\u1ea1i",
        description: mappedError.message,
      });
      throw mappedError;
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
      const updatedClasses = await reloadClassesByCurrentBranch();
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
        description: buildClassStatusErrorMessage(row.status, err),
      });
    }
  };

  const handleAddStudent = async (classId: string) => {
    // Find the class to get capacity and current enrolled
    const classItem = classes.find(c => c.id === classId);
    const classCapacity = classItem?.capacity || 0;
    const currentEnrolled = classItem?.current || 0;
    
    // Open modal to add students
    setSelectedClassId(classId);
    setIsAddStudentModalOpen(true);
    setSelectedClassCapacity(classCapacity);
    setSelectedClassCurrent(currentEnrolled);
    
    try {
      const enrolledStudents = await fetchAdminClassStudents(classId);
      setEnrolledStudentIds(enrolledStudents.map((student) => student.id));
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
      setEnrolledStudentIds([]);
    }
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
              <input
                value={schedulePatternFilter}
                onChange={(e) => { setSchedulePatternFilter(e.target.value); setPage(1); }}
                placeholder="Lọc RRULE: BYDAY=MO, FREQ=WEEKLY..."
                className="h-10 min-w-[260px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
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
                        <ScheduleDisplay schedule={c.schedule} classId={c.id} startDate={c.startDate} />
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
                    <td colSpan={8} className="py-12 text-center">
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
        existingClassRows={classes}
      />
      {/* Edit Class Modal */}
      <CreateClassModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingClassId(null);
          setEditingInitialData(null);
          setEditingCurrentEnrollmentCount(0);
          setOriginalStatus(null);
        }}
        onSubmit={handleUpdateClass}
        mode="edit"
        initialData={editingInitialData}
        currentClassId={editingClassId}
        existingClassRows={classes}
        currentEnrollmentCount={editingCurrentEnrollmentCount}
      />
      {/* Add Student Modal */}
      {isAddStudentModalOpen && selectedClassId && (
        <AddStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => {
            setIsAddStudentModalOpen(false);
            setSelectedClassId(null);
          }}
          classId={selectedClassId || ""}
          enrolledStudentIds={enrolledStudentIds}
          classCapacity={selectedClassCapacity}
          currentEnrolled={selectedClassCurrent}
          toast={toast}
          onEnrollmentSuccess={(newEnrolledIds) => {
            // Cập nhật danh sách enrolled để lọc bỏ những student đã thêm
            setEnrolledStudentIds(prev => [...prev, ...newEnrolledIds]);
          }}
        />
      )}
    </>
  );
}