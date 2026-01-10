"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  UserRound,
  Download,
  Share2,
  MoreVertical,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type AttendanceStatus = "present" | "late" | "absent";

type Student = {
  id: string;
  name: string;
  email: string;
  status: AttendanceStatus;
  absenceRate: number; // % vắng trong kỳ
  note?: string;
};

type LessonDetail = {
  id: string;
  course: string;
  lesson: string;
  date: string;
  time: string;
  room: string;
  teacher: string;
  students: number;
};

// Mock data theo id
const LESSONS: Record<string, LessonDetail> = {
  L1: {
    id: "L1",
    course: "IELTS Foundation - A1",
    lesson: "Unit 5 - Speaking: Daily routine",
    date: "Thứ 2, 06/10/2025",
    time: "08:00 - 10:00",
    room: "Phòng 301",
    teacher: "Nguyễn Văn A",
    students: 18,
  },
};

const ATTENDANCE: Record<string, Student[]> = {
  L1: [
    { id: "ST001", name: "Nguyễn Văn An", email: "an.nguyen@email.com", status: "present", absenceRate: 5 },
    { id: "ST002", name: "Trần Thị Bình", email: "binh.tran@email.com", status: "late", note: "Đến 08:15", absenceRate: 12 },
    { id: "ST003", name: "Lê Văn Cường", email: "cuong.le@email.com", status: "present", absenceRate: 8 },
    { id: "ST004", name: "Phạm Thị Dung", email: "dung.pham@email.com", status: "absent", note: "Nghỉ phép", absenceRate: 20 },
    { id: "ST005", name: "Hoàng Văn Em", email: "em.hoang@email.com", status: "present", absenceRate: 3 },
    { id: "ST006", name: "Vũ Thị Lan", email: "lan.vu@email.com", status: "present", absenceRate: 7 },
    { id: "ST007", name: "Nguyễn Thị Hoa", email: "hoa.nguyen@email.com", status: "late", note: "Đến 08:20", absenceRate: 15 },
    { id: "ST008", name: "Trần Văn Hùng", email: "hung.tran@email.com", status: "present", absenceRate: 4 },
    { id: "ST009", name: "Lê Thị Mai", email: "mai.le@email.com", status: "absent", note: "Xin phép", absenceRate: 18 },
    { id: "ST010", name: "Phạm Văn Nam", email: "nam.pham@email.com", status: "present", absenceRate: 6 },
    { id: "ST011", name: "Hoàng Thị Linh", email: "linh.hoang@email.com", status: "present", absenceRate: 2 },
    { id: "ST012", name: "Vũ Văn Long", email: "long.vu@email.com", status: "late", note: "Đến 08:10", absenceRate: 10 },
    { id: "ST013", name: "Nguyễn Thị Nga", email: "nga.nguyen@email.com", status: "present", absenceRate: 5 },
    { id: "ST014", name: "Trần Văn Oanh", email: "oanh.tran@email.com", status: "absent", note: "Nghỉ ốm", absenceRate: 25 },
    { id: "ST015", name: "Lê Thị Phương", email: "phuong.le@email.com", status: "present", absenceRate: 3 },
    { id: "ST016", name: "Phạm Văn Quang", email: "quang.pham@email.com", status: "present", absenceRate: 8 },
    { id: "ST017", name: "Hoàng Thị Quỳnh", email: "quynh.hoang@email.com", status: "late", note: "Đến 08:25", absenceRate: 14 },
    { id: "ST018", name: "Vũ Văn Sơn", email: "son.vu@email.com", status: "present", absenceRate: 6 },
    { id: "ST019", name: "Nguyễn Thị Tâm", email: "tam.nguyen@email.com", status: "present", absenceRate: 4 },
    { id: "ST020", name: "Trần Văn Tuấn", email: "tuan.tran@email.com", status: "absent", note: "Nghỉ phép", absenceRate: 22 },
    { id: "ST021", name: "Lê Thị Uyên", email: "uyen.le@email.com", status: "present", absenceRate: 7 },
    { id: "ST022", name: "Phạm Văn Vinh", email: "vinh.pham@email.com", status: "present", absenceRate: 5 },
    { id: "ST023", name: "Hoàng Thị Xuân", email: "xuan.hoang@email.com", status: "late", note: "Đến 08:18", absenceRate: 11 },
    { id: "ST024", name: "Vũ Văn Yên", email: "yen.vu@email.com", status: "present", absenceRate: 3 },
    { id: "ST025", name: "Nguyễn Thị Ánh", email: "anh.nguyen@email.com", status: "present", absenceRate: 9 },
  ],
};

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const map = {
    present: { text: "Có mặt", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    late: { text: "Đi muộn", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    absent: { text: "Vắng", cls: "bg-rose-50 text-rose-700 border border-rose-200" },
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

export default function LessonAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const lessonId = (params.id as string) || "L1";

  const lesson = LESSONS[lessonId];
  const students = ATTENDANCE[lessonId] || [];

  const [list, setList] = useState<Student[]>(students);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const selectAllRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
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

  const updateStatus = (id: string, status: AttendanceStatus) => {
    setList((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const updateNote = (id: string, note: string) => {
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

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy buổi học</h2>
          <p className="text-gray-600">Buổi học không tồn tại hoặc đã bị xoá.</p>
          <button
            onClick={() => router.push(`/${locale}/portal/teacher/schedule`)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg transition cursor-pointer"
          >
            Quay lại lịch dạy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push(`/${locale}/portal/teacher/schedule`)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition border-0 cursor-pointer"
        >
          <ArrowLeft size={20} />
          <span>Quay lại lịch dạy</span>
        </button>

        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg transition flex items-center gap-2 cursor-pointer">
            <Download size={16} /> Xuất danh sách
          </button>
        </div>
      </div>

      {/* Lesson Info */}
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white shadow-lg">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="text-sm text-gray-600">{lesson.course}</div>
              <h1 className="text-2xl font-bold text-gray-900">{lesson.lesson}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-700 mt-2">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={16} className="text-pink-500" /> {lesson.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={16} className="text-pink-500" /> {lesson.time}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={16} className="text-pink-500" /> {lesson.room}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={16} className="text-pink-500" /> {lesson.students} HV
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance list */}
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
        <div className="p-5 border-b border-pink-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Điểm danh</h2>
            <p className="text-sm text-gray-600">{filtered.length} / {list.length} học viên</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm học viên..."
                className="pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition text-sm"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium shadow-sm hover:shadow-lg transition-all cursor-pointer"
            >
              <CheckCircle size={16} />
              Lưu điểm danh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-200">
                <th className="px-4 py-4 w-12">
                  <div className="flex items-center justify-center">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 cursor-pointer"
                    />
                  </div>
                </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Học viên</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Đã vắng</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student, idx) => (
                <tr
                  key={student.id}
                  className={`border-b border-pink-100 transition hover:bg-pink-50/50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-pink-50/30"
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selected.has(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 cursor-pointer"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center font-bold text-sm">
                        {student.name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(-2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">ID: {student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{student.email}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <AbsencePie value={student.absenceRate} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => updateStatus(student.id, "present")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          student.status === "present"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "border-gray-200 text-gray-600 hover:bg-emerald-50"
                        }`}
                      >
                        Có mặt
                      </button>
                      <button
                        onClick={() => updateStatus(student.id, "late")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          student.status === "late"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "border-gray-200 text-gray-600 hover:bg-amber-50"
                        }`}
                      >
                        Đi muộn
                      </button>
                      <button
                        onClick={() => updateStatus(student.id, "absent")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          student.status === "absent"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "border-gray-200 text-gray-600 hover:bg-rose-50"
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
                      placeholder="Thêm ghi chú..."
                      className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white text-sm text-gray-800 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    />
                  </td>
                </tr>
              ))}
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

