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
} from "lucide-react";
import { fetchAndMapAdminClassDetail, fetchAdminClassStudents, type Student } from "@/app/api/admin/classes";
import type { ClassDetail, Track } from "@/types/admin/classes";

function TrackBadge({ track }: { track: Track }) {
  const trackColors = {
    IELTS: "from-pink-500 to-purple-600",
    TOEIC: "from-rose-500 to-pink-600",
    Business: "from-fuchsia-500 to-purple-500",
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
    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg">
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
          className="text-rose-500"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-rose-600">
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
    <div className="flex items-center justify-between px-6 py-4 border-t border-pink-200 bg-white">
      <div className="text-sm text-gray-600">
        Hiển thị <span className="font-semibold text-gray-900">{startItem}</span> -{" "}
        <span className="font-semibold text-gray-900">{endItem}</span>{" "}
        trong tổng số <span className="font-semibold text-gray-900">{totalItems}</span> học viên
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-all ${currentPage === 1
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-pink-200 text-gray-700 hover:bg-pink-50 hover:border-pink-300 cursor-pointer"
            }`}
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentPage === page
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-pink-50 border border-pink-200"
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
          className={`p-2 rounded-lg border transition-all ${currentPage === totalPages
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-pink-200 text-gray-700 hover:bg-pink-50 hover:border-pink-300 cursor-pointer"
            }`}
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
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  if (loading || !classData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang tải thông tin lớp học...</h2>
          {error && <p className="text-gray-600 mb-4">{error}</p>}
          {!error && <p className="text-gray-600 mb-4">Vui lòng chờ trong giây lát.</p>}
          {error && (
            <button
              onClick={() => router.push(`/${locale}/portal/admin/classes`)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition-all cursor-pointer"
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
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/${locale}/portal/admin/classes`)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
          <span>Quay lại danh sách lớp</span>
        </button>

        <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
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
              <button className="px-4 py-2.5 rounded-xl border border-pink-200 bg-white text-gray-700 hover:bg-pink-50 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap">
                <Share2 size={16} />
                Chia sẻ
              </button>
              <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap">
                <Download size={16} />
                Xuất danh sách
              </button>
            </div>
          </div>

          <div>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-pink-100">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <CalendarClock size={18} className="text-pink-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Lịch học</div>
                  <div className="font-semibold text-gray-900">{classData.schedule}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-pink-100">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <MapPin size={18} className="text-pink-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phòng học</div>
                  <div className="font-semibold text-gray-900">{classData.room}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-pink-100">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Users size={18} className="text-pink-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Học viên</div>
                  <div className="font-semibold text-gray-900">{classData.students} người</div>
                </div>
              </div>
            </div>

            {/* Teacher Information */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-pink-100">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <User size={18} className="text-pink-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Giáo viên chính</div>
                  <div className="font-semibold text-gray-900">{classData.teacher}</div>
                </div>
              </div>
              {classData.assistantTeacher && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-pink-100">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <User size={18} className="text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Giáo viên trợ giảng</div>
                    <div className="font-semibold text-gray-900">{classData.assistantTeacher}</div>
                  </div>
                </div>
              )}
            </div>

            {classData.description && (
              <div className="p-4 bg-white rounded-xl border border-pink-100">
                <h3 className="font-semibold text-gray-900 mb-2">Mô tả khóa học</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{classData.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Tiến độ khóa học</div>
              <div className="text-2xl font-bold mt-2 text-gray-900">{classData.progress}%</div>
            </div>
            <div className="p-3 rounded-xl bg-pink-100">
              <TrendingUp size={24} className="text-pink-600" />
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000"
              style={{ width: `${classData.progress}%` }}
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
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
        <div className="p-6 border-b border-pink-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Danh sách học viên</h2>
              <p className="text-sm text-gray-600">
                {filteredStudents.length} / {allStudents.length} học viên
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm học viên..."
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-white border border-pink-200 rounded-xl p-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === "all"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                    : "text-gray-700 hover:bg-pink-50"
                    }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === "active"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                    : "text-gray-700 hover:bg-pink-50"
                    }`}
                >
                  Hoạt động
                </button>
                <button
                  onClick={() => setStatusFilter("inactive")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === "inactive"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                    : "text-gray-700 hover:bg-pink-50"
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
            <thead>
              <tr className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Học viên</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Liên hệ</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Đã vắng</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Thành tích</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hoạt động</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`border-b border-pink-100 transition-colors hover:bg-pink-50/50 ${index % 2 === 0 ? "bg-white" : "bg-pink-50/30"
                      }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={student.name} />
                        <div>
                          <div className="font-semibold text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">ID: {student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail size={14} className="text-gray-400" />
                          <span>{student.email || "Chưa có"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone size={14} className="text-gray-400" />
                          <span>{student.phone || "Chưa có"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <AbsencePie value={100 - student.attendance} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                        <Star size={14} className="text-amber-600 fill-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">{student.stars}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${student.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                          }`} />
                        <span className="text-sm text-gray-700">{student.lastActive || "Chưa có"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                          <MessageSquare size={18} />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4">
                      <Search size={32} className="text-pink-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy học viên</h3>
                    <p className="text-gray-600">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
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

        {/* Empty State */}
        {filteredStudents.length === 0 && allStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4">
              <Users size={32} className="text-pink-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có học viên</h3>
            <p className="text-gray-600">Lớp học này chưa có học viên đăng ký</p>
          </div>
        )}
      </div>
    </div>
  );
}
