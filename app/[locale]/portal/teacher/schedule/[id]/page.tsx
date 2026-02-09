"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import {
  fetchSessionDetail,
  fetchAttendance,
  saveAttendance,
} from "@/app/api/teacher/attendance";
import type {
  AttendanceStatus,
  Student,
  LessonDetail,
  AttendanceSummaryApi,
} from "@/types/teacher/attendance";

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const map = {
    present: { text: "Có mặt", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    late: { text: "Đi muộn", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    absent: { text: "Vắng", cls: "bg-red-50 text-red-700 border border-red-200" },
  } as const;
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status].cls}`}>{map[status].text}</span>;
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
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
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
            : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
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
          className={`p-2 rounded-lg border transition-all ${currentPage === totalPages
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
            }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function LessonAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const lessonId = (params.id as string) || "";

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummaryApi>(null);
  const [list, setList] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const itemsPerPage = 10;
  const selectAllRef = useRef<HTMLInputElement>(null);

  const loadAttendance = useCallback(
    async (signal?: AbortSignal) => {
      try {
        if (!lessonId) return;

        const result = await fetchAttendance(lessonId, signal);

        if (signal?.aborted) return;

        setList(result.students);
        setAttendanceSummary(result.attendanceSummary);
        setIsEditing(!result.hasAnyMarked);
        if (!result.hasAnyMarked) setLastSavedAt(null);
      } catch (err) {
        if (signal?.aborted) return;
        console.error("Unexpected error when fetching attendance:", err);
      }
    },
    [lessonId]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function fetchLesson() {
      try {
        setLoading(true);
        setError(null);

        if (!lessonId) {
          setError("Thiếu mã buổi dạy.");
          setLoading(false);
          return;
        }

        const result = await fetchSessionDetail(lessonId, controller.signal);
        
        if (!controller.signal.aborted) {
          setLesson(result.lesson);
          setAttendanceSummary(result.attendance);
          setSelected(new Set());
          setCurrentPage(1);
        }
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("Unexpected error when fetching session detail:", err);
        setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu buổi dạy.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (lessonId) {
      fetchLesson();
      loadAttendance(controller.signal);
    } else {
      setLoading(false);
      setError("Thiếu mã buổi dạy.");
    }

    return () => controller.abort();
  }, [lessonId, loadAttendance]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    return list.filter(
      (s) =>
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [list, search]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filtered.slice(startIndex, endIndex);
  console.log({paginatedStudents});
  
  

  const totalStudentsCount = attendanceSummary?.totalStudents ?? list.length;
  const checkedCount =
    attendanceSummary?.totalStudents != null && attendanceSummary?.notMarkedCount != null
      ? Math.max(0, attendanceSummary.totalStudents - attendanceSummary.notMarkedCount)
      : list.filter((s) => s.status === "present" || s.status === "late" || s.status === "absent").length;

  const updateStatus = (id: string, status: AttendanceStatus) => {
    if (!isEditing) return;
    setList((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const updateNote = (id: string, note: string) => {
    if (!isEditing) return;
    setList((prev) => prev.map((s) => (s.id === id ? { ...s, note } : s)));
  };

  // Chọn / bỏ chọn một học viên
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Chọn / bỏ chọn tất cả học viên đang lọc (chỉ trong trang hiện tại)
  const allVisibleIds = paginatedStudents.map((s) => s.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));
  const someSelected = allVisibleIds.some((id) => selected.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // Indeterminate state cho checkbox "chọn tất cả"
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = !allSelected && someSelected;
    }
  }, [allSelected, someSelected]);

  const handleSaveAttendance = useCallback(async () => {
    try {
      setSaving(true);
      setSaveError(null);

      await saveAttendance(lessonId, list, isEditing);
      await loadAttendance();
      setLastSavedAt(new Date());
      setIsEditing(false);
    } catch (err: any) {
      console.error("Unexpected error when saving attendance:", err);
      setSaveError(err.message || "Đã xảy ra lỗi khi lưu điểm danh.");
    } finally {
      setSaving(false);
    }
  }, [lessonId, list, loadAttendance, isEditing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Đang tải thông tin buổi dạy...</h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white p-6 flex items-center justify-center">
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
              onClick={() => router.push(`/${locale}/portal/teacher/schedule`)}
              className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 hover:border-gray-300 transition cursor-pointer"
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy buổi học</h2>
          <p className="text-gray-600">Buổi học không tồn tại hoặc đã bị xoá.</p>
          <button
            onClick={() => router.push(`/${locale}/portal/teacher/schedule`)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition cursor-pointer"
          >
            Quay lại lịch dạy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push(`/${locale}/portal/teacher/schedule`)}
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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl text-white shadow-lg">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="text-sm text-gray-600">{lesson.course}</div>
              <h1 className="text-2xl font-bold text-gray-900">{lesson.lesson}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-700 mt-2">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={16} className="text-red-600" /> {lesson.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={16} className="text-red-600" /> {lesson.time}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={16} className="text-red-600" /> {lesson.room}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={16} className="text-red-600" /> {lesson.students} HV
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {lesson.status && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {lesson.status}
                  </span>
                )}
                {lesson.participationType && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {lesson.participationType}
                  </span>
                )}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Tổng sĩ số</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalStudentsCount ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="text-sm text-emerald-700">Đã điểm danh</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{checkedCount}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="text-sm text-amber-700">Chưa điểm danh</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {attendanceSummary ? attendanceSummary.notMarkedCount ?? 0 : Math.max(0, totalStudentsCount - checkedCount)}
          </div>
        </div>
      </div>

      {/* Attendance list */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Điểm danh</h2>
            <p className="text-sm text-gray-600">
              {totalStudentsCount ? `${checkedCount} / ${totalStudentsCount} học viên đã điểm danh` : "Chưa có dữ liệu điểm danh"}
              {saveError && <span className="text-red-600 ml-3">{saveError}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm học viên..."
                className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition text-sm"
              />
            </div>
            {!isEditing ? (
              <>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold">
                  <CheckCircle size={16} />
                  Đã lưu điểm danh{lastSavedAt ? ` • ${lastSavedAt.toLocaleTimeString()}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-medium hover:border-gray-300 transition cursor-pointer"
                >
                  Chỉnh sửa
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium shadow-sm hover:shadow-lg transition-all cursor-pointer"
              >
                <CheckCircle size={16} />
                {saving ? "Đang lưu..." : "Lưu điểm danh"}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200">
                <th className="px-4 py-4 w-12">
                  <div className="flex items-center justify-center">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                    />
                  </div>
                </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Học viên</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Đã vắng</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                    Chưa có danh sách học viên cho buổi dạy này.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => (
                  <tr
                    key={student.id}
                    className={`border-b border-gray-100 transition hover:bg-gray-50/50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selected.has(student.id)}
                          onChange={() => toggleSelect(student.id)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
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
                        <div>
                          <div className="font-semibold text-gray-900">{student.studentName}</div>
                          <div className="text-xs text-gray-500">ID: {student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <AbsencePie value={student.absenceRate} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => updateStatus(student.id, "present")}
                          disabled={!isEditing}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer disabled:cursor-default ${
                            student.status === "present"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "border-gray-200 text-gray-600 hover:bg-emerald-50"
                          }`}
                        >
                          Có mặt
                        </button>
                        <button
                          onClick={() => updateStatus(student.id, "absent")}
                          disabled={!isEditing}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer disabled:cursor-default ${
                            student.status === "absent"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "border-gray-200 text-gray-600 hover:bg-red-50"
                          }`}
                        >
                          Vắng
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <input
                        value={student.note || ""}
                        onChange={(e) => updateNote(student.id, e.target.value)}
                        disabled={!isEditing}
                        placeholder="Thêm ghi chú..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-default"
                      />
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

