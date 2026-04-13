"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  User,
  GraduationCap,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  MoreVertical,
  BookOpen,
  MessageSquare,
  ArrowUpDown,
  RefreshCcw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getStaffManagementStudents } from "@/lib/api/staffManagementService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

type Student = {
  id: string;
  name: string;
  cls: string;
  attendance: number;
  makeup: number;
  notes: string;
  email?: string;
  phone?: string;
  status?: "Active" | "Inactive" | "Graduated";
  joinDate?: string;
};

function StatCard({ title, value, icon: Icon, color, subtitle }: { title: string; value: string; icon: any; color: string; subtitle?: string }) {
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

function StatusBadge({ status }: { status: "Active" | "Inactive" | "Graduated" }) {
  const map = {
    Active: {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
      label: "Đang học",
    },
    Inactive: {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: Clock,
      label: "Tạm nghỉ",
    },
    Graduated: {
      cls: "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 border border-blue-200",
      icon: GraduationCap,
      label: "Đã tốt nghiệp",
    },
  };

  const cfg = map[status];
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} />
      <span>{cfg.label}</span>
    </span>
  );
}

function AttendanceBadge({ attendance }: { attendance: number }) {
  const getColor = () => {
    if (attendance >= 90) return "#22c55e";
    if (attendance >= 80) return "#3b82f6";
    if (attendance >= 70) return "#f59e0b";
    return "#ef4444";
  };

  const strokeColor = getColor();

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="14"
            stroke="#fee2e2"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="18"
            cy="18"
            r="14"
            stroke={strokeColor}
            strokeWidth="4"
            fill="none"
            strokeDasharray={2 * Math.PI * 14}
            strokeDashoffset={(1 - attendance / 100) * 2 * Math.PI * 14}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-semibold text-gray-900">
            {attendance}%
          </span>
        </div>
      </div>

    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white font-bold text-sm">
      {initials}
    </div>
  );
}

export default function Page() {
  const [classFilter, setClassFilter] = useState<string | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<
    "name" | "cls" | "attendance" | "makeup" | "status" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getStaffManagementStudents({ pageSize: 200 })
      .then((res: any) => {
        if (!alive) return;
        const raw = res?.data?.data?.items ?? res?.data?.data ?? res?.data ?? [];
        const list = (Array.isArray(raw) ? raw : []).map((s: any) => ({
          id: s.id ?? s.studentId ?? "",
          name: s.fullName ?? s.name ?? "",
          cls: s.className ?? s.cls ?? "",
          attendance: Number(s.attendanceRate ?? s.attendance ?? 0),
          makeup: Number(s.makeupSessions ?? s.makeup ?? 0),
          notes: s.notes ?? s.parentNotes ?? "",
          email: s.email ?? "",
          phone: s.phone ?? s.phoneNumber ?? "",
          status: s.status === "Inactive" ? "Inactive" as const : s.status === "Graduated" ? "Graduated" as const : "Active" as const,
          joinDate: s.joinDate ?? s.enrollmentDate ?? "",
        }));
        setStudents(list);
      })
      .catch(() => {})
      .finally(() => { 
        if (alive) {
          setLoading(false);
          setIsPageLoaded(true);
        }
      });
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const total = students.length;
    const avgAttendance = total > 0 ? Math.round(
      students.reduce((sum, s) => sum + s.attendance, 0) / total
    ) : 0;
    const totalMakeup = students.reduce((sum, s) => sum + s.makeup, 0);
    const active = students.filter((s) => s.status === "Active").length;
    return { total, avgAttendance, totalMakeup, active };
  }, [students]);

  const classOptions = useMemo(() => {
    const classes = Array.from(new Set(students.map((s) => s.cls).filter(Boolean)));
    return ["ALL", ...classes];
  }, [students]);

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

  const statusOptions: ("Tất cả" | "Active" | "Inactive" | "Graduated")[] = [
    "Tất cả",
    "Active",
    "Inactive",
    "Graduated",
  ];

  const attendanceOptions = ["Tất cả", "≥90%", "80-89%", "70-79%", "<70%"];

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = classFilter === "ALL" || s.cls === classFilter;
      const matchesStatus = statusFilter === "Tất cả" || s.status === statusFilter;
      
      let matchesAttendance = true;
      if (attendanceFilter !== "Tất cả") {
        if (attendanceFilter === "≥90%") matchesAttendance = s.attendance >= 90;
        else if (attendanceFilter === "80-89%") matchesAttendance = s.attendance >= 80 && s.attendance < 90;
        else if (attendanceFilter === "70-79%") matchesAttendance = s.attendance >= 70 && s.attendance < 80;
        else if (attendanceFilter === "<70%") matchesAttendance = s.attendance < 70;
      }

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.cls.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q);

      return matchesClass && matchesStatus && matchesAttendance && matchesSearch;
    });
  }, [students, classFilter, statusFilter, attendanceFilter, searchQuery]);

  const sortedStudents = useMemo(() => {
    const copy = [...filtered];
    if (!sortKey) return copy;

    const getVal = (s: Student) => {
      switch (sortKey) {
        case "name":
          return s.name;
        case "cls":
          return s.cls;
        case "attendance":
          return s.attendance;
        case "makeup":
          return s.makeup;
        case "status":
          return s.status ?? "";
        default:
          return s.id;
      }
    };

    copy.sort((a, b) => {
      const aVal = getVal(a);
      const bVal = getVal(b);

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      const res = String(aVal).localeCompare(String(bVal), "vi", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? res : -res;
    });

    return copy;
  }, [filtered, sortKey, sortDir]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [classFilter, statusFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = sortedStudents.slice(startIndex, endIndex);

  const renderPaginationNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages.map((page, idx) => (
      typeof page === 'string' ? (
        <span key={idx} className="px-2 py-1 text-gray-400">...</span>
      ) : (
        <button
          key={idx}
          onClick={() => setCurrentPage(page as number)}
          className={`h-8 w-8 rounded-lg transition-all text-sm font-medium cursor-pointer ${
            currentPage === page
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm'
              : 'border border-red-200 text-gray-700 hover:bg-red-50'
          }`}
        >
          {page}
        </button>
      )
    ));
  };

  const addNote = () => alert("Thêm ghi chú mới — Demo");

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className={`transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hồ sơ học viên
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Zap size={14} className="text-red-500" />
              Quản lý thông tin và theo dõi học viên
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Tổng học viên"
          value={String(stats.total)}
          subtitle="Trong hệ thống"
          icon={Users}
          color="from-red-600 to-red-700"
        />
        <StatCard
          title="Đang học"
          value={String(stats.active)}
          subtitle="Hoạt động"
          icon={CheckCircle2}
          color="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Điểm danh TB"
          value={`${stats.avgAttendance}%`}
          subtitle="Trung bình"
          icon={TrendingUp}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Buổi học bù"
          value={String(stats.totalMakeup)}
          subtitle="Tổng số"
          icon={Calendar}
          color="from-purple-500 to-violet-500"
        />
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo mã, tên, lớp..."
                className="h-10 w-full rounded-xl border border-red-200 bg-white pl-9 pr-9 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              {searchQuery.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Class Select Filter */}
          <div className="flex items-center gap-2">
            <Select value={classFilter} onValueChange={(val) => setClassFilter(val)}>
              <SelectTrigger className="w-56 border-red-200 focus:ring-red-200">
                <SelectValue placeholder="Tất cả lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả lớp</SelectItem>
                {classOptions.filter(c => c !== "ALL").map((classItem) => (
                  <SelectItem key={classItem} value={classItem}>
                    {classItem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách học viên</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{sortedStudents.length} học viên</span>
              <button
                onClick={() => setSearchQuery("")}
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
            <p className="text-gray-600">Đang tải danh sách học viên...</p>
          </div>
        )}

        {/* Table */}
        {!loading && (
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
                      Học viên
                      <ArrowUpDown size={14} className={sortKey === "name" ? "text-red-600" : "text-gray-400"} />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                      onClick={() => toggleSort("cls")}
                      type="button"
                    >
                      Lớp
                      <ArrowUpDown size={14} className={sortKey === "cls" ? "text-red-600" : "text-gray-400"} />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                      onClick={() => toggleSort("attendance")}
                      type="button"
                    >
                      Điểm danh
                      <ArrowUpDown size={14} className={sortKey === "attendance" ? "text-red-600" : "text-gray-400"} />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                      onClick={() => toggleSort("status")}
                      type="button"
                    >
                      Trạng thái
                      <ArrowUpDown size={14} className={sortKey === "status" ? "text-red-600" : "text-gray-400"} />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {sortedStudents.length > 0 ? (
                  currentStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar name={student.name} />
                          <div>
                            <div className="font-semibold text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs">{student.id}</span>
                              {student.email && (
                                <>
                                  <span>•</span>
                                  <span className="text-xs">{student.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">

                          <span className="text-sm font-medium text-gray-900">{student.cls}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <AttendanceBadge attendance={student.attendance} />
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={student.status || "Active"} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 transition-opacity duration-200">
                          <button
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                      <Search size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy học viên</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
                    {searchQuery.trim() !== "" && (
                      <button
                        onClick={() => setSearchQuery("")}
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

          {sortedStudents.length > 0 && (
            <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, sortedStudents.length)}</span> trong tổng số{" "}
                  <span className="font-semibold text-gray-900">{sortedStudents.length}</span> học viên
                </div>

                
                {/* Right: Pagination Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex items-center gap-1">
                    {renderPaginationNumbers()}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
          </>
        )}
      </div>
    </div>
  );
}