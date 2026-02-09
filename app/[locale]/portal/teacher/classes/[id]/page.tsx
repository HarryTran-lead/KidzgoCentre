"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Users,
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
} from "lucide-react";
import { fetchClassDetail } from "@/app/api/teacher/classes";
import type { Student, ClassDetail, Track } from "@/types/teacher/classes";

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

function StudentAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map(word => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-sm shadow-lg">
      {initials}
    </div>
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={4}
          className="text-gray-200"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={4}
          className="text-red-600"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-red-600">
          {Math.round(clamped)}%
        </span>
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
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // In the middle
        pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-gray-600">
        Hiển thị <span className="font-semibold text-gray-900">{startItem}</span> -{" "}
        <span className="font-semibold text-gray-900">{endItem}</span>{" "}
        trong tổng số <span className="font-semibold text-gray-900">{totalItems}</span> học viên
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors ${currentPage === 1 ? "" : "cursor-pointer"}`}
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} className="text-gray-600" />
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentPage === page
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors ${currentPage === totalPages ? "" : "cursor-pointer"}`}
          aria-label="Trang sau"
        >
          <ChevronRight size={16} className="text-gray-600" />
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
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;
  useEffect(() => {
    const controller = new AbortController();

    async function loadClassDetail() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchClassDetail(
          {
            classId,
            pageNumber: 1,
            pageSize: 100,
          },
          controller.signal
        );

        setClassData(result.classDetail);
        setAllStudents(result.students);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("Unexpected error when fetching class detail:", err);
        setError(err.message || "Đã xảy ra lỗi khi tải thông tin lớp học.");
        setClassData(null);
        setAllStudents([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setIsPageLoaded(true);
        }
      }
    }

    loadClassDetail();
    return () => controller.abort();
  }, [classId]);

  const filteredStudents = allStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Selection handlers
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allIds = paginatedStudents.map((s) => s.id);
    const allSelected = allIds.every((id) => selectedStudents.has(id));

    if (allSelected) {
      // Deselect all on current page
      setSelectedStudents((prev) => {
        const newSet = new Set(prev);
        allIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all on current page
      setSelectedStudents((prev) => {
        const newSet = new Set(prev);
        allIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  const isAllSelected = paginatedStudents.length > 0 && paginatedStudents.every((s) => selectedStudents.has(s.id));
  const isIndeterminate = paginatedStudents.some((s) => selectedStudents.has(s.id)) && !isAllSelected;

  // Set indeterminate state for select all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  if (loading || !classData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang tải thông tin lớp học...</h2>
          {error && <p className="text-gray-600 mb-4">{error}</p>}
          {!error && <p className="text-gray-600 mb-4">Vui lòng chờ trong giây lát.</p>}
          {error && (
            <button
              onClick={() => router.push(`/${locale}/portal/teacher/classes`)}
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
      {/* Header */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <button
          onClick={() => router.push(`/${locale}/portal/teacher/classes`)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
          <span>Quay lại danh sách lớp</span>
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
                <BookOpen size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
                  <TrackBadge track={classData.track} />
                </div>
                <p className="text-gray-600">Mã lớp: {classData.code}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap">
                <Share2 size={16} />
                Chia sẻ
              </button>
              <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap">
                <Download size={16} />
                Xuất danh sách
              </button>
            </div>
          </div>

          <div>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                <div className="p-2 bg-red-50 rounded-lg">
                  <CalendarClock size={18} className="text-red-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Lịch học</div>
                  <div className="font-semibold text-gray-900">{classData.schedule}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MapPin size={18} className="text-gray-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phòng học</div>
                  <div className="font-semibold text-gray-900">{classData.room}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Users size={18} className="text-gray-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Học viên</div>
                  <div className="font-semibold text-gray-900">{classData.students} người</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Mô tả khóa học</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{classData.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid md:grid-cols-4 gap-4 mb-8 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Tiến độ khóa học</div>
              <div className="text-2xl font-bold mt-2 text-gray-900">{classData.progress}%</div>
            </div>
            <div className="p-3 rounded-xl bg-red-50">
              <TrendingUp size={24} className="text-red-600" />
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full transition-all duration-1000"
              style={{ width: isPageLoaded ? `${classData.progress}%` : '0%' }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Chuyên cần TB</div>
              <div className="text-2xl font-bold mt-2 text-emerald-600">{avgAttendance}%</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Tiến bộ TB</div>
              <div className="text-2xl font-bold mt-2 text-blue-600">{avgProgress}%</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Award size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Buổi học</div>
              <div className="text-2xl font-bold mt-2 text-amber-600">
                {classData.completedLessons}/{classData.totalLessons}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-100">
              <FileText size={24} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Danh sách học viên</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-600">
                  {filteredStudents.length} / {allStudents.length} học viên
                </p>
                {selectedStudents.size > 0 && (
                  <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                    Đã chọn: {selectedStudents.size}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm học viên..."
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === "all"
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === "active"
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Hoạt động
                </button>
                <button
                  onClick={() => setStatusFilter("inactive")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === "inactive"
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Không hoạt động
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-12">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      ref={selectAllCheckboxRef}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
                    />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Học viên</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Liên hệ</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Đã vắng</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Thành tích</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hoạt động</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200 ${selectedStudents.has(student.id) ? "bg-red-50/50" : ""}`}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                          className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={student.name} />
                        <div>
                          <div className="text-sm text-gray-900 font-medium">{student.name}</div>
                          <div className="text-xs text-gray-500">ID: {student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Mail size={14} className="text-gray-400" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Phone size={14} className="text-gray-400" />
                          <span className="truncate">{student.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <AbsencePie value={100 - student.attendance} />
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                        <Star size={14} className="text-amber-600 fill-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">{student.stars}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${student.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                          }`} />
                        <span className="text-sm text-gray-700">{student.lastActive}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end text-gray-700 gap-1 transition-opacity duration-200">
                        <button 
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer" 
                          title="Nhắn tin"
                        >
                          <MessageSquare size={14} />
                        </button>
                        <button 
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-800 cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-800 cursor-pointer"
                          title="Thêm"
                        >
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
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredStudents.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

