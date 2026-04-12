"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Save,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  fetchSessionDetail,
  fetchAttendance,
  saveAttendance,
  updateAttendance,
} from "@/app/api/teacher/attendance";
import type {
  AttendanceStatus,
  Student,
  LessonDetail,
  AttendanceSummaryApi,
} from "@/types/teacher/attendance";

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const map = {
    present: {
      text: "Có mặt",
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    makeup: {
      text: "Học bù",
      cls: "bg-sky-50 text-sky-700 border border-sky-200",
    },
    absent: {
      text: "Vắng",
      cls: "bg-red-50 text-red-700 border border-red-200",
    },
    notMarked: {
      text: "Chưa điểm danh",
      cls: "bg-amber-50 text-amber-700 border border-amber-200",
    },
  } as const;
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${map[status].cls}`}
    >
      {map[status].text}
    </span>
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
          totalPages
        );
      } else {
        pages.push(
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Hiển thị{" "}
          <span className="font-semibold text-gray-900">{startItem}</span> -{" "}
          <span className="font-semibold text-gray-900">{endItem}</span>{" "}
          trong tổng số{" "}
          <span className="font-semibold text-gray-900">{totalItems}</span> học
          viên
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg border transition-all ${
              currentPage === 1
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-red-200 text-gray-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"
            }`}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-gray-400"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                      : "border border-red-200 hover:bg-red-50 text-gray-700"
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
            className={`p-2 rounded-lg border transition-all ${
              currentPage === totalPages
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-red-200 text-gray-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const lessonId = (params.id as string) || "";

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [attendanceSummary, setAttendanceSummary] =
    useState<AttendanceSummaryApi>(null);
  const [list, setList] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudents, setEditedStudents] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (!lessonId) {
          setError("Thiếu mã buổi dạy.");
          setLoading(false);
          return;
        }

        const [sessionDetail, attendance] = await Promise.all([
          fetchSessionDetail(lessonId, controller.signal),
          fetchAttendance(lessonId, controller.signal),
        ]);

        if (!controller.signal.aborted) {
          setLesson(sessionDetail.lesson);
          setAttendanceSummary(attendance.attendanceSummary);
          setList(attendance.students);
          setCurrentPage(1);
        }
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error(
          "Unexpected error when fetching session detail or attendance:",
          err
        );
        setError(
          err.message ||
            "Đã xảy ra lỗi khi tải dữ liệu buổi dạy. Vui lòng thử lại."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (lessonId) {
      fetchData();
    } else {
      setLoading(false);
      setError("Thiếu mã buổi dạy.");
    }

    return () => controller.abort();
  }, [lessonId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    return list.filter(
      (s) =>
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [list, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = isEditing
    ? editedStudents.slice(startIndex, endIndex)
    : filtered.slice(startIndex, endIndex);

  const handleStartEdit = useCallback(() => {
    setEditedStudents([...list]);
    setIsEditing(true);
    setSaveMsg(null);
  }, [list]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedStudents([]);
    setSaveMsg(null);
  }, []);

  const handleStatusChange = useCallback((studentId: string, newStatus: AttendanceStatus) => {
    setEditedStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  }, []);

  const handleNoteChange = useCallback((studentId: string, note: string) => {
    setEditedStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, note } : s))
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!lessonId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      // Check if any student has been marked already (update vs create)
      const anyMarked = list.some((s) => s.status && s.status !== "notMarked");
      await saveAttendance(lessonId, editedStudents, !anyMarked);
      // Refresh data
      const attendance = await fetchAttendance(lessonId);
      setList(attendance.students);
      setAttendanceSummary(attendance.attendanceSummary);
      setIsEditing(false);
      setEditedStudents([]);
      setSaveMsg({ type: "success", text: "Đã lưu điểm danh thành công" });
    } catch (err: any) {
      const msg = err?.message ?? "Có lỗi xảy ra khi lưu điểm danh";
      setSaveMsg({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [lessonId, editedStudents, list]);

  const totalStudentsCount = attendanceSummary?.totalStudents ?? list.length;
  const checkedCount =
    attendanceSummary?.totalStudents != null &&
    attendanceSummary?.notMarkedCount != null
      ? Math.max(
          0,
          attendanceSummary.totalStudents - attendanceSummary.notMarkedCount
        )
      : list.filter((s) => s.status && s.status !== "notMarked").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Đang tải thông tin buổi dạy...
          </h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Có lỗi xảy ra</h2>
          <p className="text-gray-600">{error}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => router.refresh()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition cursor-pointer"
            >
              Thử lại
            </button>
            <button
              onClick={() =>
                router.push(`/${locale}/portal/admin/schedule`)
              }
              className="px-5 py-2.5 rounded-xl bg-white border border-red-200 text-gray-800 hover:border-red-300 transition cursor-pointer"
            >
              Quay lại lịch dạy
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Không tìm thấy buổi học
          </h2>
          <p className="text-gray-600">
            Buổi học không tồn tại hoặc đã bị xoá.
          </p>
          <button
            onClick={() => router.push(`/${locale}/portal/admin/schedule`)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition cursor-pointer"
          >
            Quay lại lịch dạy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6">
      <div className={`flex items-center justify-between mb-6 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <button
          onClick={() => router.push(`/${locale}/portal/admin/schedule`)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition border-0 cursor-pointer"
        >
          <ArrowLeft size={20} />
          <span>Quay lại lịch dạy</span>
        </button>

        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition flex items-center gap-2 cursor-pointer">
            <Download size={16} /> Xuất danh sách
          </button>
        </div>
      </div>

      {/* Lesson Info */}
      <div className={`bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-6 shadow-sm mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl text-white shadow-lg">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {lesson.lesson}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-700 mt-2">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={16} className="text-red-600" />{" "}
                  {lesson.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={16} className="text-red-600" /> {lesson.time}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={16} className="text-red-600" /> {lesson.room}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={16} className="text-red-600" />{" "}
                  {lesson.students} HV
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {lesson.branch && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    {lesson.branch}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Tổng sĩ số</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalStudentsCount ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="text-sm text-emerald-700">Đã điểm danh</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            {checkedCount}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="text-sm text-amber-700">Chưa điểm danh</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {attendanceSummary
              ? attendanceSummary.notMarkedCount ?? 0
              : Math.max(0, totalStudentsCount - checkedCount)}
          </div>
        </div>
      </div>

      {/* Attendance list - read-only */}
      <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Danh sách học viên</h2>
              <p className="text-sm text-gray-600">
                {totalStudentsCount
                  ? `${checkedCount} / ${totalStudentsCount} học viên đã được điểm danh`
                  : "Chưa có dữ liệu điểm danh"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm học viên..."
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition text-sm placeholder:text-gray-400"
                />
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-semibold">
                <CheckCircle size={16} />
                Admin – có thể chỉnh sửa sau 24 giờ
              </span>
              {!isEditing ? (
                <button
                  onClick={handleStartEdit}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Edit3 size={16} /> Chỉnh sửa điểm danh
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition text-sm cursor-pointer disabled:opacity-50"
                  >
                    <X size={16} className="inline mr-1" /> Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg transition flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Lưu điểm danh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Save message */}
          {saveMsg && (
            <div className={`mx-6 mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
              saveMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-rose-50 border border-rose-200 text-rose-700"
            }`}>
              {saveMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {saveMsg.text}
            </div>
          )}
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">
                  Học viên
                </th>
                <th className="py-3 px-6 text-center text-sm font-semibold tracking-wide text-gray-700">
                  Đã vắng
                </th>
                <th className="py-3 px-6 text-center text-sm font-semibold tracking-wide text-gray-700">
                  Trạng thái
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">
                  Ghi chú
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center"
                  >
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                      <Users size={24} className="text-gray-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Chưa có danh sách học viên</div>
                    <div className="text-sm text-gray-500 mt-1">Dữ liệu điểm danh cho buổi dạy này chưa được cập nhật.</div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-center font-bold text-sm">
                          {student.studentName
                            .split(" ")
                            .map((w) => w[0])
                            .filter(Boolean)
                            .slice(-2)
                            .join("")
                            .toUpperCase() || "HV"}
                        </div>
                        <div className="font-semibold text-gray-900">
                          {student.studentName}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center">
                        <AbsencePie value={student.absenceRate} />
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      {isEditing ? (
                        <select
                          value={student.status ?? "notMarked"}
                          onChange={(e) => handleStatusChange(student.id, e.target.value as AttendanceStatus)}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
                        >
                          <option value="notMarked">Chưa điểm danh</option>
                          <option value="present">Có mặt</option>
                          <option value="absent">Vắng</option>
                          <option value="makeup">Học bù</option>
                        </select>
                      ) : student.status ? (
                        <StatusBadge status={student.status} />
                      ) : (
                        <span className="text-xs text-gray-500">
                          Chưa điểm danh
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={student.note ?? ""}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-red-300"
                        />
                      ) : (
                        student.note || (
                          <span className="text-gray-400">Không có ghi chú</span>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}