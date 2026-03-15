"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Users,
  User,
  CalendarClock,
  MapPin,
  Mail,
  Phone,
  Search,
  Download,
  Share2,
  MoreVertical,
  CheckCircle,
  Award,
  TrendingUp,
  FileText,
  MessageSquare,
  Eye,
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  Clock,
  Calendar,
  Building2,
  GraduationCap,
  Tag,
  AlertCircle,
  Sparkles,
  Target,
  BarChart3,
  Layers,
} from "lucide-react";
import { fetchAndMapAdminClassDetail, fetchAdminClassStudents, type Student } from "@/app/api/admin/classes";
import type { ClassDetail, Track } from "@/types/admin/classes";
import clsx from "clsx";

// Component hiển thị lịch học giống bên classes/page.tsx
function ScheduleDisplay({ schedule }: { schedule: string }) {
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
    <div className="flex flex-col gap-1.5">
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

function TrackBadge({ track }: { track: Track }) {
  const trackColors = {
    IELTS: "bg-gradient-to-r from-red-600 to-red-700 text-white border-0",
    TOEIC: "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-0",
    Business: "bg-gradient-to-r from-gray-800 to-gray-900 text-white border-0",
  };

  return (
    <span className={clsx("px-3 py-1.5 rounded-full text-xs font-semibold shadow-md", trackColors[track])}>
      {track}
    </span>
  );
}

function StudentAvatar({ name, status }: { name: string; status?: string }) {
  const initials = name
    .split(" ")
    .map(word => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white font-bold text-sm shadow-lg">
        {initials}
      </div>
      {status && (
        <div className={clsx(
          "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white",
          status === "active" ? "bg-green-500" : "bg-gray-400"
        )} />
      )}
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subvalue, 
  color = "red",
  progress
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  subvalue?: string;
  color?: "red" | "amber" | "blue" | "green" | "gray";
  progress?: number;
}) {
  const colorClasses = {
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      gradient: "from-red-600 to-red-700",
      light: "from-red-50 to-red-100"
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      gradient: "from-amber-600 to-amber-700",
      light: "from-amber-50 to-amber-100"
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      gradient: "from-blue-600 to-blue-700",
      light: "from-blue-50 to-blue-100"
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      gradient: "from-green-600 to-green-700",
      light: "from-green-50 to-green-100"
    },
    gray: {
      bg: "bg-gray-50",
      text: "text-gray-600",
      gradient: "from-gray-600 to-gray-700",
      light: "from-gray-50 to-gray-100"
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-3">
        <div className={clsx("p-3 rounded-xl", colorClasses[color].bg)}>
          <Icon size={20} className={colorClasses[color].text} />
        </div>
        {progress !== undefined && (
          <span className="text-xs font-medium text-gray-500">Tiến độ</span>
        )}
      </div>
      <div>
        <div className="text-sm text-gray-600 mb-1">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {subvalue && <span className="text-sm text-gray-500">{subvalue}</span>}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full bg-gradient-to-r", colorClasses[color].gradient)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, className }: { icon: any; label: string; value: string; className?: string }) {
  return (
    <div className={clsx("flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100", className)}>
      <div className="p-2 bg-red-100 rounded-lg">
        <Icon size={18} className="text-red-600" />
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 3) {
        pages.push(2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push("...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5">
      <div className="text-sm text-gray-600">
        Hiển thị <span className="font-semibold text-gray-900">{startItem}</span> -{" "}
        <span className="font-semibold text-gray-900">{endItem}</span>{" "}
        trong tổng số <span className="font-semibold text-gray-900">{totalItems}</span> học viên
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={clsx(
            "p-2 rounded-lg border transition-all cursor-pointer",
            currentPage === 1
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-red-200 hover:bg-red-50 text-gray-700"
          )}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={clsx(
                  "min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  currentPage === page
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                    : "border border-red-200 hover:bg-red-50 text-gray-700"
                )}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={clsx(
            "p-2 rounded-lg border transition-all cursor-pointer",
            currentPage === totalPages
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-red-200 hover:bg-red-50 text-gray-700"
          )}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const locale = params.locale as string;
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    async function loadClassDetail() {
      try {
        setLoading(true);
        setError(null);

        // Fetch and map class detail
        const classDetail = await fetchAndMapAdminClassDetail(classId);

        // Fetch students from enrollments API
        let students: Student[] = [];
        try {
          const apiStudents = await fetchAdminClassStudents(classId, {
            pageNumber: 1,
            pageSize: 100,
            status: "Active",
          });
          students = apiStudents;
        } catch (err) {
          console.error("Failed to fetch students:", err);
          // Continue without students, don't fail the whole page
          students = [];
        }

        setClassData(classDetail);
        setAllStudents(students);
      } catch (err: any) {
        console.error("Unexpected error when fetching class detail:", err);
        setError(err.message || "Đã xảy ra lỗi khi tải thông tin lớp học.");
        setClassData(null);
        setAllStudents([]);
      } finally {
        setLoading(false);
      }
    }

    if (classId) {
      loadClassDetail();
    }
  }, [classId]);

  const filteredStudents = allStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Handle checkbox selection
  const handleSelectAll = () => {
    if (selectedStudents.length === paginatedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(paginatedStudents.map(s => s.id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  if (loading || !classData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang tải thông tin lớp học...</h2>
          {error && <p className="text-gray-600 mb-4">{error}</p>}
          {!error && <p className="text-gray-600 mb-4">Vui lòng chờ trong giây lát.</p>}
          {error && (
            <button
              onClick={() => router.push(`/${locale}/portal/admin/classes`)}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all cursor-pointer"
            >
              Quay lại danh sách lớp
            </button>
          )}
        </div>
      </div>
    );
  }

  const avgAttendance =
    allStudents.length > 0
      ? Math.round(allStudents.reduce((sum, s) => sum + s.attendance, 0) / allStudents.length)
      : 0;
  const avgProgress =
    allStudents.length > 0
      ? Math.round(allStudents.reduce((sum, s) => sum + s.progress, 0) / allStudents.length)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header với hiệu ứng gradient */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <button
          onClick={() => router.push(`/${locale}/portal/admin/classes`)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-all hover:gap-3 cursor-pointer group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại danh sách lớp</span>
        </button>

        {/* Class Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">

          
          <div className="p-6 lg:p-8">
            {/* Main Info Row */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
              {/* Left: Class Info */}
              <div className="flex items-start gap-5">
                <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-200">
                  <GraduationCap size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{classData.name}</h1>
                    <TrackBadge track={classData.track} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700">
                      <Tag size={14} className="text-red-500" />
                      <span className="font-medium">Mã lớp:</span>
                      <span className="font-semibold">{classData.code}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700">
                      <Users size={14} className="text-red-500" />
                      <span className="font-medium">Sĩ số:</span>
                      <span className="font-semibold">{classData.students} học viên</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right: Action Buttons */}
              <div className="flex items-center gap-3">
                <button className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md group">
                  <Share2 size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Chia sẻ</span>
                </button>
                <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap">
                  <Download size={16} />
                  <span className="hidden sm:inline">Xuất danh sách</span>
                </button>
              </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Schedule Card */}
              <div className="sm:col-span-2 bg-gradient-to-br from-gray-50 to-red-50/30 rounded-xl border border-gray-100 p-4 hover:border-red-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <CalendarClock size={18} className="text-red-600" />
                  </div>
                  <span className="font-semibold text-gray-800">Lịch học</span>
                </div>
                <ScheduleDisplay schedule={classData.schedule} />
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-red-400" />
                    <span>Bắt đầu:</span>
                    <span className="font-medium text-gray-700">{classData.startDate ? new Date(classData.startDate).toLocaleDateString('vi-VN') : '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-orange-400" />
                    <span>Kết thúc:</span>
                    <span className="font-medium text-gray-700">{classData.endDate ? new Date(classData.endDate).toLocaleDateString('vi-VN') : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Room Card */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin size={18} className="text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Phòng học</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{classData.room}</div>
              </div>
              
              {/* Branch Card */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 hover:border-purple-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 size={18} className="text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Chi nhánh</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{classData.branch}</div>
              </div>
            </div>

            {/* Teacher & Assistant Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50/50 to-white rounded-xl border border-red-100 hover:border-red-200 hover:shadow-md transition-all duration-200">
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                  <User size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">Giáo viên chính</div>
                  <div className="font-bold text-gray-900 text-lg truncate">{classData.teacher}</div>
                </div>
              </div>
              
              {classData.assistantTeacher && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50/50 to-white rounded-xl border border-amber-100 hover:border-amber-200 hover:shadow-md transition-all duration-200">
                  <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-md">
                    <User size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">Giáo viên trợ giảng</div>
                    <div className="font-bold text-gray-900 text-lg truncate">{classData.assistantTeacher}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {classData.description && (
              <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-red-500" />
                  Mô tả khóa học
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{classData.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - Modern Design */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <StatCard 
          icon={Target}
          label="Tiến độ khóa học" 
          value={`${classData.progress}%`}
          progress={classData.progress}
          color="red"
        />
        
        <StatCard 
          icon={CheckCircle}
          label="Chuyên cần trung bình" 
          value={`${avgAttendance}%`}
          color="green"
        />
        
        <StatCard 
          icon={BarChart3}
          label="Tiến bộ trung bình" 
          value={`${avgProgress}%`}
          color="blue"
        />
        
        <StatCard 
          icon={Layers}
          label="Buổi học" 
          value={`${classData.completedLessons}/${classData.totalLessons}`}
          subvalue="đã hoàn thành"
          progress={Math.round((classData.completedLessons / classData.totalLessons) * 100)}
          color="amber"
        />
      </div>

      {/* Students List */}
      <div className={`bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Danh sách học viên</h2>
                <p className="text-xs text-gray-500">
                  {filteredStudents.length} / {allStudents.length} học viên
                </p>
              </div>
              {selectedStudents.length > 0 && (
                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  {selectedStudents.length} đã chọn
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm học viên..."
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 w-64"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>

              {/* Add Student */}
              <button
                onClick={() => router.push(`/${locale}/portal/admin/students?classId=${classId}`)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} />
                Thêm học viên
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedStudents.length > 0 && selectedStudents.length === paginatedStudents.length}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-200 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Học viên</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Liên hệ</th>
                <th className="py-3 px-6 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Chuyên cần</th>
                <th className="py-3 px-6 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Thành tích</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Hoạt động</th>
                <th className="py-3 px-6 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-200 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={student.name} status={student.status} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">ID: {student.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{student.email || "Chưa có"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{student.phone || "Chưa có"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
                        <CheckCircle size={14} className="text-green-600" />
                        <span className="text-sm font-semibold text-green-700">{student.attendance}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
                        <Star size={14} className="text-amber-600 fill-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">{student.stars}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className={clsx(
                          "w-2 h-2 rounded-full animate-pulse",
                          student.status === "active" ? "bg-green-500" : "bg-gray-400"
                        )} />
                        <span className="text-sm text-gray-700">{student.lastActive || "Chưa có"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer" title="Nhắn tin">
                          <MessageSquare size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-600 cursor-pointer" title="Xem chi tiết">
                          <Eye size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-800 cursor-pointer" title="Tùy chọn">
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                      <Search size={24} className="text-gray-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy học viên</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc thêm học viên mới</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredStudents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Empty State - when no students at all */}
        {allStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-gradient-to-r from-red-100 to-red-200 rounded-2xl mb-4">
              <Users size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có học viên</h3>
            <p className="text-gray-600 mb-4">Lớp học này chưa có học viên đăng ký</p>
            <button
              onClick={() => router.push(`/${locale}/portal/admin/students?classId=${classId}`)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus size={16} />
              Thêm học viên
            </button>
          </div>
        )}
      </div>
    </div>
  );
}