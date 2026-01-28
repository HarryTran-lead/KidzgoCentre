"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  BookOpen,
  GraduationCap,
  Users,
  DollarSign,
  Eye,
  Pencil,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchAdminPrograms } from "@/app/api/admin/programs";
import type { CourseRow } from "@/types/admin/programs";

/* -------------------------- helpers -------------------------- */
function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

/* Tag nhỏ hiển thị trình độ (A1, A2, B1,...) */
function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    A1: "bg-blue-100 text-blue-700",
    A2: "bg-emerald-100 text-emerald-700",
    B1: "bg-amber-100 text-amber-700",
    B2: "bg-violet-100 text-violet-700",
    C1: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", map[level] || "bg-slate-100 text-slate-700")}>
      {level}
    </span>
  );
}

/* Trạng thái khoá học */
function StatusBadge({ value }: { value: "Đang hoạt động" | "Tạm dừng" | "Đã kết thúc" }) {
  const map: Record<string, string> = {
    "Đang hoạt động": "bg-emerald-100 text-emerald-700",
    "Tạm dừng": "bg-amber-100 text-amber-700",
    "Đã kết thúc": "bg-sky-100 text-sky-700",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
}

type SortField = "id" | "name" | "level" | "duration" | "fee" | "classes" | "status";
type SortDirection = "asc" | "desc" | null;
const PAGE_SIZE = 5;

/* --------------------------- API helpers --------------------------- */

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
    direction === "asc" ? <ArrowUp size={14} className="text-pink-500" /> : <ArrowDown size={14} className="text-pink-500" />
  ) : (
    <ArrowUpDown size={14} className="text-gray-400" />
  );
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-6 ${alignClass} text-sm font-semibold tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-pink-50 transition-colors`}
    >
      <span className="inline-flex items-center gap-2">{children}{icon}</span>
    </th>
  );
}

/* ------------------------------ page ------------------------------- */
export default function Page() {
  const [q, setQ] = useState("");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState<"ALL" | "A1" | "A2" | "B1" | "B2" | "C1">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Đang hoạt động" | "Tạm dừng" | "Đã kết thúc">("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Gọi API để lấy danh sách chương trình
  useEffect(() => {
    async function fetchPrograms() {
      try {
        setLoading(true);
        setError(null);

        const mapped = await fetchAdminPrograms();
        setCourses(mapped);
      } catch (err) {
        console.error("Unexpected error when fetching admin programs:", err);
        setError((err as Error)?.message || "Đã xảy ra lỗi khi tải danh sách khóa học.");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, []);

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter(c => c.status === "Đang hoạt động").length;
    // Hiện backend chưa trả số học viên & doanh thu -> tạm thời dùng mock
    const students = 0;
    const revenue = "0";

    return {
      total,
      active,
      students,
      revenue,
    };
  }, [courses]);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let filtered = !kw
      ? courses
      : courses.filter((c) =>
          [c.id, c.name, c.desc, c.level, c.fee].some((x) => x.toLowerCase().includes(kw))
        );

    if (levelFilter !== "ALL") {
      filtered = filtered.filter((c) => c.level === levelFilter);
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const getVal = (c: CourseRow) => {
          switch (sortField) {
            case "id": return c.id;
            case "name": return c.name;
            case "level": return c.level;
            case "duration": return c.duration;
            case "fee": return c.fee;
            case "classes": return c.classes;
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
  }, [q, sortField, sortDirection, courses, levelFilter, statusFilter]);

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

  const goPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="space-y-6 bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6 rounded-3xl">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg">
            <BookOpen className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Quản lý môn học
            </h1>
            <p className="text-sm text-gray-600">Quản lý chương trình học và khóa học</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg text-white font-semibold cursor-pointer"
        >
          <Plus size={18} /> Tạo khóa học mới
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-pink-100 grid place-items-center">
              <BookOpen className="text-pink-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tổng khóa học</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 grid place-items-center">
              <GraduationCap className="text-emerald-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Đang hoạt động</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.active}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-100 grid place-items-center">
              <Users className="text-amber-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tổng học viên</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.students}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-100 grid place-items-center">
              <DollarSign className="text-sky-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Doanh thu/tháng</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.revenue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-3xl min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" size={18} />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Tìm kiếm khóa học..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <select
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value as typeof levelFilter); setPage(1); }}
              className="h-10 rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="ALL">Tất cả trình độ</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
              className="h-10 rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Đang hoạt động">Đang hoạt động</option>
              <option value="Tạm dừng">Tạm dừng</option>
              <option value="Đã kết thúc">Đã kết thúc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách khóa học</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{rows.length} khóa học</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
              <tr>
                <SortableHeader field="id" currentField={sortField} direction={sortDirection} onSort={handleSort}>Mã khóa</SortableHeader>
                <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>Tên khóa học</SortableHeader>
                <SortableHeader field="level" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trình độ</SortableHeader>
                <SortableHeader field="duration" currentField={sortField} direction={sortDirection} onSort={handleSort}>Thời lượng</SortableHeader>
                <SortableHeader field="fee" currentField={sortField} direction={sortDirection} onSort={handleSort}>Học phí</SortableHeader>
                <SortableHeader field="classes" currentField={sortField} direction={sortDirection} onSort={handleSort}>Lớp học</SortableHeader>
                <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trạng thái</SortableHeader>
                <th className="py-3 px-6 text-right text-xs font-medium tracking-wide text-gray-700 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-pink-100">
              {pagedRows.length > 0 ? (
                pagedRows.map((c) => (
                  <tr
                    key={c.id}
                    className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-3 px-6 text-sm text-gray-900 whitespace-nowrap">{c.id}</td>

                    <td className="py-3 px-6">
                      <div className="text-sm text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 truncate">{c.desc}</div>
                    </td>

                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <LevelBadge level={c.level} />
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                        <Clock size={16} className="text-gray-400" />
                        <span className="truncate">{c.duration}</span>
                      </div>
                    </td>

                    <td className="py-3 px-6 text-gray-900 text-sm whitespace-nowrap">{c.fee}</td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{c.classes}</div>
                      <div className="text-xs text-gray-500">{c.students}</div>
                    </td>

                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <StatusBadge value={c.status} />
                    </td>

                    <td className="py-3 px-6">
                      <div className="flex items-center justify-end text-gray-700 gap-1 transition-opacity duration-200">
                        <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer" title="Xem">
                          <Eye size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer" title="Sửa">
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                      <Search size={24} className="text-pink-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy khóa học</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo khóa học mới</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Pagination */}
        {rows.length > 0 && (
          <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, rows.length)}</span>
                {' '}trong tổng số <span className="font-semibold text-gray-900">{rows.length}</span> khóa học
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                  onClick={() => goPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <div className="text-sm font-semibold text-gray-900 px-3">
                  {currentPage} / {totalPages}
                </div>
                <button
                  className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                  onClick={() => goPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Trang sau"
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
