// app/teacher/classes/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  Users,
  CalendarClock,
  Eye,
  ChevronRight,
  BookOpen,
  Filter,
  Sparkles,
  Building2,
  GraduationCap,
  Clock,
  X,
  ArrowUpDown,
  AlertCircle,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { fetchTeacherClasses } from "@/app/api/teacher/classes";
import type { ClassItem, Track } from "@/types/teacher/classes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

/* ----------------------------- UI pieces ----------------------------- */
function TrackBadge({ track }: { track: Track }) {
  const trackColors = {
    IELTS: "from-red-600 to-red-700",
    TOEIC: "from-gray-600 to-gray-700",
    Business: "from-gray-800 to-gray-900",
  };

  return (
    <span
      className={`text-xs px-3 py-1.5 rounded-full bg-gradient-to-r ${trackColors[track]} text-white font-medium shadow-sm`}
    >
      {track}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium";
  
  if (status === "ACTIVE") {
    return (
      <span className={`${cls} bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200`}>
        <CheckCircle2 size={12} />
        Đang hoạt động
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span className={`${cls} bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200`}>
        <CheckCircle2 size={12} />
        Đã kết thúc
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className={`${cls} bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200`}>
        <Clock size={12} />
        Sắp khai giảng
      </span>
    );
  }
  return (
    <span className={`${cls} bg-gradient-to-r from-gray-50 to-slate-100 text-gray-700 border border-gray-200`}>
      {status || "N/A"}
    </span>
  );
}

function FilterChip({
  active,
  children,
  onClick,
  count,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer flex items-center gap-2",
        active
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
          : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
      ].join(" ")}
    >
      {children}
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-100'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function StatsCard({ title, value, icon: Icon, color, subtitle }: { title: string; value: string; icon: any; color: string; subtitle?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${color}`}></div>
      <div className="relative flex items-center justify-between gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-600 truncate">{title}</div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
          {subtitle && <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Tiến độ</span>
        <span className="font-semibold text-red-600">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

/* ----------------------------- Schedule Display Component ----------------------------- */
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
      if (key && value) parts[key] = value;
    });

    const freq = parts.FREQ || "";
    const byDay = parts.BYDAY || "";
    const byHour = parts.BYHOUR || "18";
    const byMinute = parts.BYMINUTE || "0";
    const duration = parseInt(parts.DURATION || "120", 10);

    if (freq !== "WEEKLY" || !byDay) {
      return "Chưa có lịch";
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
      if (hasSunday) dayString += " & CN";
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

function ScheduleDisplay({ schedule, classId, locale, router }: { schedule: string; classId?: string; locale?: string; router?: any }) {
  // Convert RRULE to readable format if needed
  const readableSchedule = schedule.includes("RRULE") 
    ? parseRRULEToSchedule(schedule)
    : schedule;

  if (!readableSchedule || readableSchedule === "Chưa có lịch") {
    return (
      <div className="text-xs text-gray-500">
        Chưa có lịch
      </div>
    );
  }

  // Parse schedule string format: "Thứ 2,5 (08:00 - 10:00)"
  const match = readableSchedule.match(/(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
  
  if (!match) {
    return (
      <div className="text-xs text-gray-700">
        {readableSchedule}
      </div>
    );
  }

  const [, dayPart, startTime, endTime] = match;
  
  // Parse days into array
  const dayNumbers: string[] = [];
  const hasSunday = dayPart.includes("CN");
  
  // Extract day numbers from "Thứ 2,5" or "Thứ 2,5 & CN"
  const thuMatch = dayPart.match(/Thứ\s*([\d,]+)/);
  if (thuMatch) {
    dayNumbers.push(...thuMatch[1].split(",").map(d => d.trim()));
  }
  
  // Day display configuration
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
    <div className="flex flex-col gap-1.5">
      {/* Days */}
      <div className="flex flex-wrap gap-1">
        {allDays.map(({ day, label, bg, text }) => (
          <span
            key={day}
            className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-semibold ${bg} ${text}`}
          >
            {label}
          </span>
        ))}
      </div>
      
      {/* Time */}
      <div className="flex items-center gap-1 text-xs text-gray-700">
        <Clock size={12} className="text-gray-400" />
        <span>{startTime} - {endTime}</span>
      </div>

      {/* Duration */}
      <div className="text-xs text-gray-500">
        {durationText}
      </div>

      {/* View Schedule Link */}
      {classId && locale && router && (
        <button
          onClick={() => router.push(`/${locale}/portal/teacher/classes/${classId}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 hover:from-blue-100 hover:to-cyan-100 hover:border-blue-300 transition-all cursor-pointer group"
        >
          <span>Xem lịch</span>
          <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}

/* ----------------------------- Page ----------------------------- */
export default function Page() {
  const [q, setQ] = useState("");
  const [track, setTrack] = useState<Track | "ALL">("ALL");
  const [selectedClass, setSelectedClass] = useState<string | "ALL">("ALL");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(100);
  const [sortKey, setSortKey] = useState<"name" | "students" | "progress" | "schedule" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Fetch classes from API
  useEffect(() => {
    async function fetchClasses() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchTeacherClasses({
          pageNumber,
          pageSize,
        });

        setClasses(result.classes);
      } catch (err: any) {
        console.error('Unexpected error when fetching classes:', err);
        setError(err.message || 'Đã xảy ra lỗi khi tải danh sách lớp học.');
        setClasses([]);
      } finally {
        setLoading(false);
        setIsPageLoaded(true);
      }
    }

    fetchClasses();
  }, [pageNumber, pageSize]);

  const toggleSort = (key: NonNullable<typeof sortKey>) => {
    setSortKey((prev) => {
      if (prev !== key) {
        setSortDir("asc");
        return key;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
  };

  const filteredAndSorted = useMemo(() => {
    let filtered = classes.filter((c) => {
      const okTrack = track === "ALL" || c.track === track;
      const okClass = selectedClass === "ALL" || c.id === selectedClass;
      const okQuery = q.trim()
        ? (c.name + c.code + (c.teacher || '')).toLowerCase().includes(q.toLowerCase())
        : true;
      return okTrack && okClass && okQuery;
    });

    if (sortKey) {
      filtered.sort((a, b) => {
        let aVal: any = "";
        let bVal: any = "";

        switch (sortKey) {
          case "name":
            aVal = a.name;
            bVal = b.name;
            break;
          case "students":
            aVal = a.students;
            bVal = b.students;
            break;
          case "progress":
            aVal = a.progress || 0;
            bVal = b.progress || 0;
            break;
          case "schedule":
            aVal = a.schedule;
            bVal = b.schedule;
            break;
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        const res = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? res : -res;
      });
    }

    return filtered;
  }, [classes, q, track, selectedClass, sortKey, sortDir]);

  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, c) => sum + c.students, 0);
  const averageProgress = classes.length > 0
    ? Math.round(classes.reduce((sum, c) => sum + (c.progress || 0), 0) / classes.length)
    : 0;

  const statsList = [
    { title: 'Tổng số lớp', value: `${totalClasses}`, icon: BookOpen, color: 'from-red-600 to-red-700', subtitle: 'Đang giảng dạy' },
    { title: 'Tổng học viên', value: `${totalStudents}`, icon: Users, color: 'from-red-500 to-red-600', subtitle: 'Đang theo học' },
    { title: 'Tiến độ TB', value: `${averageProgress}%`, icon: TrendingUp, color: 'from-emerald-500 to-emerald-600', subtitle: 'Hoàn thành' },
  ];

  const handleViewDetail = (classId: string) => {
    router.push(`/${locale}/portal/teacher/classes/${classId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className={`transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Lớp học của tôi
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              Quản lý và theo dõi các lớp được phân công
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-full">
            <Sparkles size={16} />
            <span>Đang dạy</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {statsList.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </div>

      {/* Filter Bar */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        {/* Search and Filter Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm kiếm theo tên lớp, mã lớp..."
                className="h-10 w-full rounded-xl border border-red-200 bg-white pl-9 pr-9 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              {q.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

          </div>

          {/* Class Select Filter */}
          <div className="flex items-center gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-56 border-red-200 focus:ring-red-200">
                <SelectValue placeholder="Tất cả lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả lớp</SelectItem>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name} ({classItem.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && !loading && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button
            onClick={() => {
              setPageNumber(1);
              setError(null);
            }}
            className="ml-auto px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 transition-colors text-rose-700 text-xs font-medium cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách lớp học</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{filteredAndSorted.length} lớp</span>
              <button
                onClick={() => {
                  setPageNumber(1);
                  setError(null);
                }}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-red-50 transition-colors cursor-pointer"
              >
                <RefreshCcw size={14} />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách lớp học...</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                  <tr>
                    <th className="py-3 px-6 text-left">
                      <button
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                        onClick={() => toggleSort("name")}
                        type="button"
                      >
                        Lớp học
                        <ArrowUpDown size={14} className={sortKey === "name" ? "text-red-600" : "text-gray-400"} />
                      </button>
                    </th>
                    <th className="py-3 px-6 text-left">
                      <span className="text-sm font-semibold text-gray-700">Mã lớp</span>
                    </th>
                    <th className="py-3 px-6 text-left">
                      <button
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                        onClick={() => toggleSort("students")}
                        type="button"
                      >
                        Học viên
                        <ArrowUpDown size={14} className={sortKey === "students" ? "text-red-600" : "text-gray-400"} />
                      </button>
                    </th>
                    <th className="py-3 px-6 text-left">
                      <button
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                        onClick={() => toggleSort("schedule")}
                        type="button"
                      >
                        Lịch học
                        <ArrowUpDown size={14} className={sortKey === "schedule" ? "text-red-600" : "text-gray-400"} />
                      </button>
                    </th>
                    <th className="py-3 px-6 text-left">
                      <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {filteredAndSorted.length > 0 ? (
                    filteredAndSorted.map((classItem) => (
                      <tr
                        key={classItem.id}
                        className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {classItem.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{classItem.name}</div>
                              
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                            {classItem.code}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{classItem.students}</span>
                            <span className="text-xs text-gray-500">học viên</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <ScheduleDisplay 
                            schedule={classItem.schedule} 
                            classId={classItem.id}
                            locale={locale}
                            router={router}
                          />
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleViewDetail(classItem.id)}
                            title="Xem chi tiết"
                            className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                          <Search size={24} className="text-red-400" />
                        </div>
                        <div className="text-gray-600 font-medium">Không tìm thấy lớp học</div>
                        <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
                        {(q.trim() !== "" || track !== "ALL") && (
                          <button
                            onClick={() => {
                              setQ("");
                              setTrack("ALL");
                            }}
                            className="mt-4 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            Xóa bộ lọc
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {filteredAndSorted.length > 0 && (
              <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Hiển thị <span className="font-semibold text-gray-900">1-{filteredAndSorted.length}</span>
                    {" "}trong tổng số <span className="font-semibold text-gray-900">{filteredAndSorted.length}</span> lớp học
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <Building2 size={12} />
                    <span>Tổng số học viên: <strong className="text-gray-900">{totalStudents}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}