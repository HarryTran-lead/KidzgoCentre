"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";

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

const STUDENTS: Student[] = [
  {
    id: "ST001",
    name: "Nguyễn Văn A",
    cls: "IELTS A1",
    attendance: 92,
    makeup: 2,
    notes: "PH thích liên hệ Zalo",
    email: "nguyenvana@email.com",
    phone: "0901234567",
    status: "Active",
    joinDate: "01/09/2024",
  },
  {
    id: "ST002",
    name: "Trần Thị B",
    cls: "TOEIC",
    attendance: 85,
    makeup: 0,
    notes: "Cần nhắc bài tối T5",
    email: "tranthib@email.com",
    phone: "0902345678",
    status: "Active",
    joinDate: "15/08/2024",
  },
  {
    id: "ST003",
    name: "Lê Văn C",
    cls: "Cambridge Movers B",
    attendance: 78,
    makeup: 3,
    notes: "Học viên cần hỗ trợ thêm",
    email: "levanc@email.com",
    phone: "0903456789",
    status: "Active",
    joinDate: "20/09/2024",
  },
  {
    id: "ST004",
    name: "Phạm Thị D",
    cls: "IELTS A1",
    attendance: 95,
    makeup: 1,
    notes: "Xuất sắc, có thể đề xuất lớp nâng cao",
    email: "phamthid@email.com",
    phone: "0904567890",
    status: "Active",
    joinDate: "05/07/2024",
  },
  {
    id: "ST005",
    name: "Hoàng Văn E",
    cls: "Kids Tue",
    attendance: 88,
    makeup: 0,
    notes: "PH yêu cầu báo cáo hàng tuần",
    email: "hoangvane@email.com",
    phone: "0905678901",
    status: "Active",
    joinDate: "10/08/2024",
  },
  {
    id: "ST006",
    name: "Vũ Thị F",
    cls: "TOEIC",
    attendance: 70,
    makeup: 5,
    notes: "Cần theo dõi attendance",
    email: "vuthif@email.com",
    phone: "0906789012",
    status: "Active",
    joinDate: "25/09/2024",
  },
];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
  trend?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5 transition-all duration-300 hover:border-red-300 hover:shadow-lg cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-red-600 mb-3">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="flex items-center gap-2">
            {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
            {trend && (
              <div className="flex items-center gap-1 text-emerald-600 text-sm">
                <TrendingUp size={14} />
                {trend}
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${color} text-white shadow-lg`}>
          <Icon size={20} />
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
  const [classFilter, setClassFilter] = useState<string>("Tất cả");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<
    "name" | "cls" | "attendance" | "makeup" | "status" | "id" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const stats = useMemo(() => {
    const total = STUDENTS.length;
    const avgAttendance = Math.round(
      STUDENTS.reduce((sum, s) => sum + s.attendance, 0) / total
    );
    const totalMakeup = STUDENTS.reduce((sum, s) => sum + s.makeup, 0);
    const active = STUDENTS.filter((s) => s.status === "Active").length;
    return { total, avgAttendance, totalMakeup, active };
  }, []);

  const classOptions = useMemo(() => {
    const classes = Array.from(new Set(STUDENTS.map((s) => s.cls)));
    return ["Tất cả", ...classes];
  }, []);

  const statusOptions: ("Tất cả" | "Active" | "Inactive" | "Graduated")[] = [
    "Tất cả",
    "Active",
    "Inactive",
    "Graduated",
  ];

  const attendanceOptions = ["Tất cả", "≥90%", "80-89%", "70-79%", "<70%"];

  const filtered = useMemo(() => {
    return STUDENTS.filter((s) => {
      const matchesClass = classFilter === "Tất cả" || s.cls === classFilter;
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
  }, [classFilter, statusFilter, attendanceFilter, searchQuery]);

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
          return s.attendance.toString();
        case "makeup":
          return s.makeup.toString();
        case "status":
          return s.status ?? "";
        case "id":
        default:
          return s.id;
      }
    };

    copy.sort((a, b) => {
      const res = String(getVal(a)).localeCompare(String(getVal(b)), "vi", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? res : -res;
    });

    return copy;
  }, [filtered, sortKey, sortDir]);

  const visibleIds = useMemo(() => sortedStudents.map((s) => s.id), [sortedStudents]);
  const selectedVisibleCount = useMemo(
    () => visibleIds.filter((id) => selectedIds[id]).length,
    [visibleIds, selectedIds]
  );
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (allVisibleSelected) {
        visibleIds.forEach((id) => delete next[id]);
        return next;
      }
      visibleIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

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

  const addNote = () => alert("Thêm ghi chú mới — Demo");

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Hồ sơ học viên
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Zap size={14} className="text-red-500" />
                Tổng hợp thông tin lớp, attendance, MakeUpCredit và ghi chú quan trọng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={addNote}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-gradient-to-r from-white to-red-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <MessageSquare size={16} />
              Thêm ghi chú
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all cursor-pointer">
              <Plus size={16} /> Thêm học viên
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Tổng học viên"
            value={String(stats.total)}
            subtitle="Trong hệ thống"
            icon={Users}
            color="from-red-600 to-red-700"
            trend="+5 tháng này"
          />
          <StatCard
            title="Đang học"
            value={String(stats.active)}
            subtitle="Hoạt động"
            icon={CheckCircle2}
            color="from-emerald-500 to-teal-500"
            trend="Tỷ lệ cao"
          />
          <StatCard
            title="Điểm danh TB"
            value={`${stats.avgAttendance}%`}
            subtitle="Trung bình"
            icon={TrendingUp}
            color="from-blue-500 to-cyan-500"
            trend="Tốt"
          />
          <StatCard
            title="Số buổi học bù"
            value={String(stats.totalMakeup)}
            subtitle="Tổng số buổi học bù"
            icon={Calendar}
            color="from-purple-500 to-violet-500"
            trend="Cần xử lý"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã, tên, lớp, email, SĐT..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-red-300 bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 cursor-text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer"
              >
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s === "Active"
                    ? "Đang học"
                    : s === "Inactive"
                      ? "Tạm nghỉ"
                      : s === "Graduated"
                        ? "Đã tốt nghiệp"
                        : s}
                </option>
              ))}
            </select>

            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer"
            >
              {attendanceOptions.map((a) => (
                <option key={a} value={a}>
                  {a === "≥90%" ? "≥90%" : a === "80-89%" ? "80-89%" : a === "70-79%" ? "70-79%" : a === "<70%" ? "<70%" : a}
                </option>
              ))}
            </select>

            <button className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-gradient-to-r from-white to-red-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors cursor-pointer">
              <MoreVertical size={16} />
              Thêm lọc
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.slice(1).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "Tất cả" : status)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === status
                  ? status === "Active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : status === "Inactive"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status === "Active" && <CheckCircle2 size={12} />}
              {status === "Inactive" && <Clock size={12} />}
              {status === "Graduated" && <GraduationCap size={12} />}
              {status === "Active"
                ? "Đang học"
                : status === "Inactive"
                  ? "Tạm nghỉ"
                  : "Đã tốt nghiệp"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 overflow-hidden">
        <div className="p-5 border-b border-red-200 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách học viên
              <span className="ml-2 text-sm font-normal text-gray-500">({sortedStudents.length} học viên)</span>
            </h3>
            <div className="text-sm text-gray-500">Cập nhật: Hôm nay, 14:30</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100/30">
              <tr>
                <th className="py-3 px-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-1 hover:text-red-700 cursor-pointer"
                  >
                    Học viên
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "name" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("cls")}
                    className="inline-flex items-center gap-1 hover:text-red-700 cursor-pointer"
                  >
                    Lớp
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "cls" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("attendance")}
                    className="inline-flex items-center gap-1 hover:text-red-700 cursor-pointer"
                  >
                    Điểm danh
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "attendance" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("makeup")}
                    className="inline-flex items-center gap-1 hover:text-red-700 cursor-pointer"
                  >
                    Buổi bù
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "makeup" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-1 hover:text-red-700 cursor-pointer"
                  >
                    Trạng thái
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "status" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 tracking-wider">
                  Ghi chú
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {filtered.length > 0 ? (
                sortedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-4 align-top">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[student.id]}
                        onChange={() => toggleSelectOne(student.id)}
                        className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                        aria-label={`Chọn ${student.name}`}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} />
                        <div>
                          <div className="font-semibold text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{student.id}</span>
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
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                          <BookOpen size={14} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.cls}</div>
                          {student.joinDate && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Calendar size={10} />
                              {student.joinDate}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <AttendanceBadge attendance={student.attendance} />
                    </td>
                    <td className="py-4 px-6">
                      {student.makeup > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center text-white font-semibold text-xs">
                            {student.makeup}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">0 </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={student.status || "Active"} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-xs">
                        <div className="text-sm text-gray-700 line-clamp-2">{student.notes}</div>
                        {student.phone && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <span>{student.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="p-1.5 rounded-lg border border-red-300 bg-gradient-to-r from-white to-red-50 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
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
                  <td colSpan={8} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                      <Search size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không có học viên phù hợp</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-red-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-red-500" />
            <span>Hệ thống quản lý học viên • Dữ liệu được cập nhật tự động • Phiên bản 2.0</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Đang học</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Tạm nghỉ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Đã tốt nghiệp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}