"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Users,
  User,
  CalendarClock,
  MapPin,
  Search,
  Download,
  Share2,
  CheckCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Calendar,
  Building2,
  GraduationCap,
  Tag,
  Target,
  BarChart3,
  Layers,
} from "lucide-react";
import {
  fetchAndMapAdminClassDetail,
  fetchAdminClassStudents,
  type Student,
} from "@/app/api/admin/classes";
import { fetchAdminSessions } from "@/app/api/admin/sessions";
import type { ClassDetail, Track } from "@/types/admin/classes";
import type { Session } from "@/types/admin/sessions";
import { SECTION_TYPE_LABELS } from "@/types/admin/sessions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import clsx from "clsx";

type ParsedScheduleSegment = {
  dayPart: string;
  startTime: string;
  endTime: string;
};

function parseScheduleSegments(schedule: string): ParsedScheduleSegment[] {
  const text = String(schedule ?? "").trim();
  if (!text || text === "Chưa có lịch") {
    return [];
  }

  const segmentRegex =
    /(Thứ\s*[2-7](?:\s*,\s*[2-7])*(?:\s*&\s*CN)?|CN)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/g;
  const segments: ParsedScheduleSegment[] = [];
  let match: RegExpExecArray | null;

  while ((match = segmentRegex.exec(text)) !== null) {
    segments.push({
      dayPart: match[1],
      startTime: match[2],
      endTime: match[3],
    });
  }

  if (segments.length > 0) {
    return segments;
  }

  const singleMatch = text.match(
    /(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/,
  );
  if (!singleMatch) {
    return [];
  }

  return [
    {
      dayPart: singleMatch[1],
      startTime: singleMatch[2],
      endTime: singleMatch[3],
    },
  ];
}

// Component hiển thị lịch học giống bên classes/page.tsx
function ScheduleDisplay({ schedule }: { schedule: string }) {
  const segments = parseScheduleSegments(schedule);

  if (segments.length === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
        <Clock size={14} className="text-gray-400" />
        <span className="text-xs italic">Chưa có lịch</span>
      </div>
    );
  }

  // Day display configuration with better colors
  const dayConfig: Record<string, { label: string; bg: string; text: string }> =
    {
      "2": { label: "T2", bg: "bg-blue-100", text: "text-blue-700" },
      "3": { label: "T3", bg: "bg-indigo-100", text: "text-indigo-700" },
      "4": { label: "T4", bg: "bg-purple-100", text: "text-purple-700" },
      "5": { label: "T5", bg: "bg-pink-100", text: "text-pink-700" },
      "6": { label: "T6", bg: "bg-amber-100", text: "text-amber-700" },
      "7": { label: "T7", bg: "bg-orange-100", text: "text-orange-700" },
    };

  const sundayConfig = {
    label: "CN",
    bg: "bg-rose-100",
    text: "text-rose-700",
  };

  const parseDays = (dayPart: string) => {
    const dayNumbers: string[] = [];
    const hasSunday = dayPart.includes("CN");
    const thuMatch = dayPart.match(/Thứ\s*([\d,\s]+)/);
    if (thuMatch) {
      dayNumbers.push(
        ...thuMatch[1]
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      );
    }

    return [
      ...dayNumbers.map((day) => ({
        day,
        ...(dayConfig[day] || {
          label: `T${day}`,
          bg: "bg-gray-100",
          text: "text-gray-700",
        }),
      })),
      ...(hasSunday ? [{ day: "CN", ...sundayConfig }] : []),
    ];
  };

  return (
    <div className="flex flex-col gap-1.5">
      {segments.map((segment, index) => {
        const allDays = parseDays(segment.dayPart);
        const timeRange = `${segment.startTime} - ${segment.endTime}`;

        const startHour = parseInt(segment.startTime.split(":")[0], 10);
        const startMin = parseInt(segment.startTime.split(":")[1], 10);
        const endHour = parseInt(segment.endTime.split(":")[0], 10);
        const endMin = parseInt(segment.endTime.split(":")[1], 10);
        const durationHours =
          (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
        const durationText =
          durationHours === Math.floor(durationHours)
            ? `${durationHours}h`
            : `${durationHours.toFixed(1)}h`;

        return (
          <div
            key={`${segment.dayPart}-${segment.startTime}-${segment.endTime}-${index}`}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-1 flex-wrap">
              {allDays.map((dayInfo) => (
                <span
                  key={`${dayInfo.day}-${index}`}
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${dayInfo.bg} ${dayInfo.text} shadow-sm`}
                >
                  {dayInfo.label}
                </span>
              ))}
            </div>

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
      })}
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
    <span
      className={clsx(
        "px-3 py-1.5 rounded-full text-xs font-semibold shadow-md",
        trackColors[track],
      )}
    >
      {track}
    </span>
  );
}

function StudentAvatar({ name, status }: { name: string; status?: string }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white font-bold text-sm shadow-lg">
        {initials}
      </div>
      {status && (
        <div
          className={clsx(
            "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white",
            status === "active" ? "bg-green-500" : "bg-gray-400",
          )}
        />
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
  progress,
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
      bg: "from-red-600 to-red-700",
      text: "text-red-600",
      light: "from-red-50 to-red-100",
    },
    amber: {
      bg: "from-amber-600 to-amber-700",
      text: "text-amber-600",
      light: "from-amber-50 to-amber-100",
    },
    blue: {
      bg: "from-blue-600 to-blue-700",
      text: "text-blue-600",
      light: "from-blue-50 to-blue-100",
    },
    green: {
      bg: "from-green-600 to-green-700",
      text: "text-green-600",
      light: "from-green-50 to-green-100",
    },
    gray: {
      bg: "from-gray-600 to-gray-700",
      text: "text-gray-600",
      light: "from-gray-50 to-gray-100",
    },
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
      <div
        className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${colorClasses[color].bg}`}
      ></div>
      <div className="relative flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color].bg} text-white grid place-items-center flex-shrink-0 shadow-sm`}
        >
          <Icon size={20} />
        </div>
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {subvalue && (
              <span className="text-sm text-gray-500">{subvalue}</span>
            )}
          </div>
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full bg-gradient-to-r",
              colorClasses[color].bg,
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100",
        className,
      )}
    >
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
        pages.push(
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
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
        Hiển thị{" "}
        <span className="font-semibold text-gray-900">{startItem}</span> -{" "}
        <span className="font-semibold text-gray-900">{endItem}</span> trong
        tổng số{" "}
        <span className="font-semibold text-gray-900">{totalItems}</span> học
        viên
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={clsx(
            "p-2 rounded-lg border transition-all cursor-pointer",
            currentPage === 1
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-red-200 hover:bg-red-50 text-gray-700",
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
                    : "border border-red-200 hover:bg-red-50 text-gray-700",
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
              : "border-red-200 hover:bg-red-50 text-gray-700",
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
  const pathname = usePathname();
  const router = useRouter();
  const classId = params.id as string;
  const locale = params.locale as string;
  const isStaffManagementClassDetailPage = pathname.includes("/portal/staff-management/classes/");
  const classListPath = `/${locale}/portal/${isStaffManagementClassDetailPage ? "staff-management" : "admin"}/classes`;
  const { user: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  const staffBranchId = isStaffManagementClassDetailPage ? String(currentUser?.branchId || "") : "";
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
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
        if (
          isStaffManagementClassDetailPage &&
          staffBranchId &&
          classDetail.branchId &&
          classDetail.branchId !== staffBranchId
        ) {
          throw new Error("Bạn không có quyền xem lớp học ngoài chi nhánh của mình.");
        }

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

        // Fetch sessions for sectionType breakdown (non-blocking)
        let sessionList: Session[] = [];
        try {
          sessionList = await fetchAdminSessions({ classId, pageSize: 200 });
        } catch {
          sessionList = [];
        }

        setClassData(classDetail);
        setAllStudents(students);
        setSessions(sessionList);
      } catch (err: any) {
        console.error("Unexpected error when fetching class detail:", err);
        setError(err.message || "Đã xảy ra lỗi khi tải thông tin lớp học.");
        setClassData(null);
        setAllStudents([]);
      } finally {
        setLoading(false);
      }
    }

    if (isStaffManagementClassDetailPage && isCurrentUserLoading) return;
    if (isStaffManagementClassDetailPage && !staffBranchId) {
      setLoading(false);
      setError("Không xác định được chi nhánh của tài khoản staff.");
      setClassData(null);
      setAllStudents([]);
      return;
    }

    if (classId) {
      loadClassDetail();
    }
  }, [classId, isCurrentUserLoading, isStaffManagementClassDetailPage, staffBranchId]);

  const filteredStudents = allStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  if (loading || !classData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Đang tải thông tin lớp học...
          </h2>
          {error && <p className="text-gray-600 mb-4">{error}</p>}
          {!error && (
            <p className="text-gray-600 mb-4">Vui lòng chờ trong giây lát.</p>
          )}
          {error && (
            <button
              onClick={() => router.push(classListPath)}
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
      ? Math.round(
          allStudents.reduce((sum, s) => sum + s.attendance, 0) /
            allStudents.length,
        )
      : 0;
  const avgProgress =
    allStudents.length > 0
      ? Math.round(
          allStudents.reduce((sum, s) => sum + s.progress, 0) /
            allStudents.length,
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      {/* Header với hiệu ứng gradient */}
      <div
        className={`mb-8 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
      >
        <button
          onClick={() => router.push(classListPath)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 mb-6 transition-all hover:gap-3 cursor-pointer group"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Quay lại danh sách lớp</span>
        </button>

        {/* Class Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="p-6 lg:p-8">
            {/* Main Info Row */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
              {/* Left: Class Info */}
              <div className="flex items-start gap-5">
                <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-200">
                  <GraduationCap size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                      {classData.name}
                    </h1>
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
                      <span className="font-semibold">
                        {classData.students} học viên
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-gray-700">
                      <BookOpen size={14} className="text-blue-500" />
                      <span className="font-medium">Chương trình:</span>
                      <span className="font-semibold">{classData.program}</span>
                    </span>
                    {classData.levelName && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-lg text-gray-700">
                        <GraduationCap size={14} className="text-violet-500" />
                        <span className="font-medium">Trình độ:</span>
                        <span className="font-semibold">{classData.levelName}</span>
                      </span>
                    )}
                    {(classData.currentModuleName || classData.startModuleName) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg text-gray-700 max-w-full">
                        <Layers size={14} className="text-indigo-500" />
                        <span className="font-medium">Module:</span>
                        <span className="font-semibold truncate">
                          {classData.currentModuleName || classData.startModuleName}
                        </span>
                        {(classData.currentSessionIndex || classData.startSessionIndex) && (
                          <span className="text-gray-500">
                            • Buổi {classData.currentSessionIndex || classData.startSessionIndex}
                          </span>
                        )}
                        {classData.startModuleName &&
                          classData.currentModuleName &&
                          classData.startModuleName !== classData.currentModuleName && (
                            <span className="text-gray-500">
                              • Bắt đầu: {classData.startModuleName}
                            </span>
                          )}
                      </span>
                    )}
                    {(classData.syllabusCode ||
                      classData.syllabusVersion ||
                      classData.syllabusTitle) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg text-gray-700 max-w-full">
                        <Layers size={14} className="text-emerald-500" />
                        <span className="font-medium">Syllabus:</span>
                        <span className="font-semibold truncate">
                          {[
                            classData.syllabusCode,
                            classData.syllabusVersion,
                            classData.syllabusTitle,
                          ]
                            .filter(Boolean)
                            .join(" - ")}
                        </span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg text-gray-700">
                      <Calendar size={14} className="text-amber-500" />
                      <span className="font-medium">Số buổi:</span>
                      <span className="font-semibold">
                        {classData.totalSessions} buổi
                      </span>
                    </span>
                    {classData.slotTypeCode && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-gray-700">
                        <Layers size={14} className="text-blue-500" />
                        <span className="font-medium">Loại slot:</span>
                        <span className="font-semibold font-mono text-blue-700">{classData.slotTypeCode}</span>
                        {classData.slotTypeName && (
                          <span className="text-gray-500">— {classData.slotTypeName}</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-3">
                <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap">
                  <Download size={16} />
                  <span className="hidden sm:inline">Xuất danh sách</span>
                </button>
              </div>
            </div>

            {/* Info Cards Grid - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Left Column: Schedule Card */}
              <div className="lg:col-span-1 bg-gradient-to-br from-gray-50 to-red-50/30 rounded-xl border border-gray-100 p-4 hover:border-red-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <CalendarClock size={18} className="text-red-600" />
                  </div>
                  <span className="font-bold text-gray-800">Lịch học</span>
                </div>
                <ScheduleDisplay schedule={classData.schedule} />
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-red-400" />
                    <span>Bắt đầu:</span>
                    <span className="font-medium text-gray-700">
                      {classData.startDate
                        ? new Date(classData.startDate).toLocaleDateString(
                            "vi-VN",
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-orange-400" />
                    <span>Kết thúc:</span>
                    <span className="font-medium text-gray-700">
                      {classData.endDate
                        ? new Date(classData.endDate).toLocaleDateString(
                            "vi-VN",
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Room, Branch, Teacher */}
              <div className="lg:col-span-1 space-y-4 flex flex-col lg:min-h-full">
                {/* Room & Branch Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Room Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin size={18} className="text-blue-600" />
                      </div>
                      <div className="">
                        <div className=" text-gray-900 font-bold">
                          Phòng học
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          {classData.room}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branch Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 hover:border-purple-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Building2 size={18} className="text-purple-600" />
                      </div>
                      <div className="">
                        <div className="text-gray-900 font-bold">Chi nhánh</div>
                        <div className="text-sm font-medium text-gray-500">
                          {classData.branch}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teacher & Assistant Teacher Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Teacher Card */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50/50 to-white rounded-xl border border-red-100 hover:border-red-200 hover:shadow-md transition-all duration-200">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                      <User size={12} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 font-bold">
                        Giáo viên chính
                      </div>
                      <div className="text-sm font-medium text-gray-500">
                        {classData.teacher}
                      </div>
                    </div>
                  </div>

                  {/* Assistant Teacher Card */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50/50 to-white rounded-xl border border-amber-100 hover:border-amber-200 hover:shadow-md transition-all duration-200">
                    <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-md">
                      <User size={12} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 font-bold">
                        Giáo viên trợ giảng
                      </div>
                      <div className="text-sm font-medium text-gray-500">
                        {classData.assistantTeacher || "Không có"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {classData.description && (
              <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-red-500" />
                  Mô tả chương trình học
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {classData.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions SectionType Breakdown */}
      {sessions.length > 0 && (() => {
        const sectionCounts: Record<string, number> = {};
        sessions.forEach((s) => {
          const key = s.sectionType ?? "Normal";
          sectionCounts[key] = (sectionCounts[key] ?? 0) + 1;
        });
        const sectionColorMap: Record<string, { bg: string; text: string; dot: string }> = {
          Normal:     { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400" },
          Review:     { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400" },
          Makeup:     { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
          Remedial:   { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-400" },
          Assessment: { bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-400" },
        };
        return (
          <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 mb-4 transition-all duration-700 delay-150 ${
            isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CalendarClock size={16} className="text-red-500" />
                <span>Phân bổ loại buổi học</span>
                <span className="text-xs font-normal text-gray-400">({sessions.length} buổi)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(sectionCounts).map(([type, count]) => {
                  const colors = sectionColorMap[type] ?? { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" };
                  const label = SECTION_TYPE_LABELS[type as keyof typeof SECTION_TYPE_LABELS] ?? type;
                  return (
                    <span key={type} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {label}: <span className="font-bold">{count}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stats Cards - Modern Design */}
      {/* <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <StatCard
          icon={Target}
          label="Tiến độ chương trình học"
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
          value={`${classData.completedLessons}/${classData.totalSessions}`}
          subvalue="đã hoàn thành"
          progress={Math.round(
            (classData.completedLessons / classData.totalSessions) * 100,
          )}
          color="amber"
        />
      </div> */}

      {/* Students List */}
      <div
        className={`bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Danh sách học viên
                </h2>
                <p className="text-xs text-gray-500">
                  {filteredStudents.length} / {allStudents.length} học viên
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
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
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Học viên
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Hoạt động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <StudentAvatar
                          name={student.name}
                          status={student.status}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div
                          className={clsx(
                            "w-2 h-2 rounded-full animate-pulse",
                            student.status === "active"
                              ? "bg-green-500"
                              : "bg-gray-400",
                          )}
                        />
                        <span className="text-sm text-gray-700">
                          {student.lastActive || "Chưa có"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : allStudents.length > 0 ? (
                <tr>
                  <td colSpan={2} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                      <Search size={24} className="text-gray-400" />
                    </div>
                    <div className="text-gray-600 font-medium">
                      Không tìm thấy học viên
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Thử thay đổi bộ lọc hoặc thêm học viên mới
                    </div>
                  </td>
                </tr>
              ) : null}
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có học viên
            </h3>
            <p className="text-gray-600 mb-4">
              Lớp học này chưa có học viên đăng ký
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
