"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  Eye,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  Send,
  User,
  Calendar,
  FileCheck,
  ChevronRight,
  MoreVertical,
  Star,
  Zap,
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  ArrowRight,
  FileBarChart,
  Edit2,
  Printer,
  Share2,
  Mail,
  ArrowUpDown,
} from "lucide-react";

type ReportStatus = "Draft" | "Submitted" | "Approved" | "Rejected";

type Report = {
  id: string;
  className: string;
  teacher: string;
  status: ReportStatus;
  note: string;
  month?: string;
  submittedDate?: string;
  progress: number;
  studentCount: number;
  rating: number;
};

type Comment = {
  id: string;
  author: string;
  text: string;
  time: string;
  reportId?: string;
  avatarColor: string;
};

const REPORTS: Report[] = [
  {
    id: "RP-1001",
    className: "IELTS A1",
    teacher: "Lê Quốc Huy",
    status: "Draft",
    note: "Chờ GV chỉnh sửa",
    month: "10/2024",
    submittedDate: "08/10",
    progress: 65,
    studentCount: 12,
    rating: 4.2,
  },
  {
    id: "RP-1002",
    className: "Cambridge Movers B",
    teacher: "Trần Mỹ Linh",
    status: "Submitted",
    note: "Chờ staff duyệt",
    month: "10/2024",
    submittedDate: "09/10",
    progress: 85,
    studentCount: 15,
    rating: 4.8,
  },
  {
    id: "RP-1003",
    className: "Kids Tue",
    teacher: "Ngô Minh Phúc",
    status: "Approved",
    note: "Đã publish",
    month: "10/2024",
    submittedDate: "07/10",
    progress: 100,
    studentCount: 10,
    rating: 4.5,
  },
  {
    id: "RP-1004",
    className: "TOEIC Advanced",
    teacher: "Phạm Văn C",
    status: "Rejected",
    note: "Cần bổ sung nhận xét",
    month: "10/2024",
    submittedDate: "10/10",
    progress: 45,
    studentCount: 18,
    rating: 4.0,
  },
  {
    id: "RP-1005",
    className: "Business English",
    teacher: "Hoàng Thị D",
    status: "Submitted",
    note: "Chờ review chất lượng",
    month: "10/2024",
    submittedDate: "09/10",
    progress: 90,
    studentCount: 8,
    rating: 4.7,
  },
  {
    id: "RP-1006",
    className: "Academic Writing",
    teacher: "Vũ Văn E",
    status: "Draft",
    note: "Đang cập nhật điểm số",
    month: "10/2024",
    submittedDate: "06/10",
    progress: 55,
    studentCount: 14,
    rating: 4.3,
  },
];

const COMMENTS: Comment[] = [
  {
    id: "CM-01",
    author: "Staff",
    text: "Bổ sung nhận xét kỹ năng Speaking cho lớp IELTS A1.",
    time: "10/10 09:30",
    reportId: "RP-1001",
    avatarColor: "bg-gradient-to-r from-red-600 to-red-700",
  },
  {
    id: "CM-02",
    author: "GV Linh",
    text: "Đã cập nhật điểm mid-term, vui lòng duyệt lại.",
    time: "10/10 11:15",
    reportId: "RP-1002",
    avatarColor: "bg-gradient-to-r from-purple-500 to-indigo-500",
  },
  {
    id: "CM-03",
    author: "Quản lý",
    text: "Báo cáo TOEIC cần thêm phân tích điểm yếu học viên.",
    time: "10/10 14:20",
    reportId: "RP-1004",
    avatarColor: "bg-gradient-to-r from-blue-500 to-sky-500",
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
            {subtitle && (
              <div className="text-sm text-gray-600">{subtitle}</div>
            )}
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

function ProgressBar({ value, color = "pink" }: { value: number; color?: string }) {
  const colorClasses = {
    red: "bg-gradient-to-r from-red-500 to-red-600",
    blue: "bg-gradient-to-r from-blue-500 to-sky-500",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-500",
    amber: "bg-gradient-to-r from-amber-500 to-orange-500",
    purple: "bg-gradient-to-r from-purple-500 to-indigo-500",
  };

  return (
    <div className="h-2 rounded-full bg-red-100">
      <div 
        className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.red} transition-all duration-500`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const map: Record<ReportStatus, { cls: string; icon: any; label: string }> = {
    Draft: {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: FileText,
      label: "Bản nháp",
    },
    Submitted: {
      cls: "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 border border-blue-200",
      icon: Clock,
      label: "Đã nộp",
    },
    Approved: {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
      label: "Đã duyệt",
    },
    Rejected: {
      cls: "bg-gradient-to-r from-rose-50 to-red-50 text-red-700 border border-red-200",
      icon: AlertCircle,
      label: "Từ chối",
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

export default function Page() {
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<
    "className" | "teacher" | "status" | "month" | "submittedDate" | "id" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const draftAI = () => alert("Đã tạo bản nháp báo cáo (AI) — Demo");
  const publish = () => alert("Đã publish báo cáo — gửi Zalo + portal (giả lập)");

  const stats = useMemo(() => {
    const total = REPORTS.length;
    const drafts = REPORTS.filter((r) => r.status === "Draft").length;
    const submitted = REPORTS.filter((r) => r.status === "Submitted").length;
    const approved = REPORTS.filter((r) => r.status === "Approved").length;
    return { total, drafts, submitted, approved };
  }, []);

  const statusOptions: (ReportStatus | "Tất cả")[] = [
    "Tất cả",
    "Draft",
    "Submitted",
    "Approved",
    "Rejected",
  ];

  const filtered = useMemo(() => {
    return REPORTS.filter((r) => {
      const matchesStatus = statusFilter === "Tất cả" || r.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.className.toLowerCase().includes(q) ||
        r.teacher.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, searchQuery]);

  const sortedReports = useMemo(() => {
    const copy = [...filtered];
    if (!sortKey) return copy;

    const getVal = (r: Report) => {
      switch (sortKey) {
        case "className":
          return r.className;
        case "teacher":
          return r.teacher;
        case "status":
          return r.status;
        case "month":
          return r.month ?? "";
        case "submittedDate":
          return r.submittedDate ?? "";
        case "id":
        default:
          return r.id;
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

  const visibleIds = useMemo(() => sortedReports.map((r) => r.id), [sortedReports]);
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

  const selectedReport = useMemo(() => {
    return activeReport ? REPORTS.find(r => r.id === activeReport) : null;
  }, [activeReport]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <FileBarChart size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Báo cáo tháng (AI)
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Zap size={14} className="text-red-500" />
                Gom dữ liệu → tạo draft → GV chỉnh sửa → staff duyệt → publish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors cursor-pointer">
              <Download size={16} />
              Xuất báo cáo
            </button>
            <button
              onClick={draftAI}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
            >
              <Sparkles size={16} /> Tạo draft (AI)
            </button>
            <button
              onClick={publish}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
            >
              <Send size={16} /> Publish
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Tổng báo cáo"
            value={String(stats.total)}
            subtitle="Trong hệ thống"
            icon={FileText}
            color="from-red-600 to-red-700"
            trend="+2 tuần này"
          />
          <StatCard
            title="Bản nháp"
            value={String(stats.drafts)}
            subtitle="Chờ chỉnh sửa"
            icon={FileText}
            color="from-amber-500 to-orange-500"
            trend="Đã nhắc nhở"
          />
          <StatCard
            title="Đã nộp"
            value={String(stats.submitted)}
            subtitle="Chờ duyệt"
            icon={Clock}
            color="from-blue-500 to-cyan-500"
            trend="Xử lý ngay"
          />
          <StatCard
            title="Đã duyệt"
            value={String(stats.approved)}
            subtitle="Hoàn tất"
            icon={CheckCircle2}
            color="from-emerald-500 to-teal-500"
            trend="Đã publish"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo mã, lớp, giáo viên..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-red-200 bg-white focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s === "Draft"
                          ? "Bản nháp"
                          : s === "Submitted"
                            ? "Đã nộp"
                            : s === "Approved"
                              ? "Đã duyệt"
                              : s === "Rejected"
                                ? "Từ chối"
                                : s}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors cursor-pointer">
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
                      ? status === "Draft" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        status === "Submitted" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-rose-50 text-red-700 border-red-200"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {status === "Draft" && <FileText size={12} />}
                  {status === "Submitted" && <Clock size={12} />}
                  {status === "Approved" && <CheckCircle2 size={12} />}
                  {status === "Rejected" && <AlertCircle size={12} />}
                  {status === "Draft"
                    ? "Bản nháp"
                    : status === "Submitted"
                      ? "Đã nộp"
                      : status === "Approved"
                        ? "Đã duyệt"
                        : "Từ chối"}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table */}
          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 overflow-hidden">
            <div className="p-5 border-b border-red-200 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách báo cáo
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({sortedReports.length} báo cáo)
                  </span>
                </h3>
                <div className="text-sm text-gray-500">
                  Cập nhật: Hôm nay, 14:30
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-pink-100 bg-red-50/50">
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
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => toggleSort("className")}
                        className="inline-flex items-center gap-1 hover:text-red-700"
                      >
                        Báo cáo
                        <ArrowUpDown
                          size={14}
                          className={sortKey === "className" ? "text-red-600" : "text-gray-400"}
                        />
                      </button>
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => toggleSort("teacher")}
                        className="inline-flex items-center gap-1 hover:text-red-700"
                      >
                        Giáo viên
                        <ArrowUpDown
                          size={14}
                          className={sortKey === "teacher" ? "text-red-600" : "text-gray-400"}
                        />
                      </button>
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center gap-1 hover:text-red-700"
                      >
                        Trạng thái
                        <ArrowUpDown
                          size={14}
                          className={sortKey === "status" ? "text-red-600" : "text-gray-400"}
                        />
                      </button>
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {sortedReports.length > 0 ? (
                    sortedReports.map((report) => (
                      <tr 
                        key={report.id} 
                        className={`hover:bg-red-50/30 transition-colors group cursor-pointer ${activeReport === report.id ? 'bg-red-50' : ''}`}
                        onClick={() => setActiveReport(report.id)}
                      >
                        <td className="py-4 px-4 align-top">
                          <input
                            type="checkbox"
                            checked={!!selectedIds[report.id]}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectOne(report.id);
                            }}
                            className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                            aria-label={`Chọn ${report.className}`}
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white font-bold">
                              {report.className
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{report.className}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <span>{report.month}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 flex items-center justify-center text-white">
                              <User size={14} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{report.teacher}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Users size={10} />
                                {report.studentCount} học viên
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <StatusBadge status={report.status} />
                            <div className="text-xs text-gray-500">{report.note}</div>
                            {report.submittedDate && (
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar size={10} />
                                {report.submittedDate}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <button
                              className="p-1.5 rounded-lg border border-red-200 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Xem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveReport(report.id);
                              }}
                            >
                              <Eye size={14} />
                            </button>
                            {report.status === "Submitted" && (
                              <button
                                className="p-1.5 rounded-lg border border-red-200 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Duyệt"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ShieldCheck size={14} />
                              </button>
                            )}
                            {report.status === "Draft" && (
                              <button
                                className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                                title="Chỉnh sửa"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-100 flex items-center justify-center">
                          <Search size={24} className="text-red-400" />
                        </div>
                        <div className="text-gray-600 font-medium">Không có báo cáo phù hợp</div>
                        <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Details & Actions */}
        <div className="space-y-6">
          {/* Selected Report Preview */}
          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileBarChart size={20} className="text-red-600" />
                Xem trước báo cáo
              </h3>
              {selectedReport && (
                <StatusBadge status={selectedReport.status} />
              )}
            </div>
            
            {selectedReport ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-pink-100 bg-white">
                  <div className="font-bold text-gray-900 text-lg mb-2">{selectedReport.className}</div>
                  <div className="text-sm text-gray-600 mb-4">{selectedReport.id} • {selectedReport.month}</div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <div className="text-lg font-bold text-blue-700">{selectedReport.studentCount}</div>
                      <div className="text-xs text-blue-600">Học viên</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-50">
                      <div className="text-lg font-bold text-amber-700">{selectedReport.rating}</div>
                      <div className="text-xs text-amber-600 flex items-center justify-center gap-1">
                        {[1,2,3,4,5].map(i => (
                          <Star 
                            key={i} 
                            size={10} 
                            className={i <= Math.floor(selectedReport.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Giáo viên phụ trách</span>
                        <span className="font-semibold text-gray-900">{selectedReport.teacher}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Ngày nộp</span>
                        <span className="font-semibold text-gray-900">{selectedReport.submittedDate}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Tiến độ hoàn thành</span>
                        <span className="font-semibold text-gray-900">{selectedReport.progress}%</span>
                      </div>
                      <ProgressBar 
                        value={selectedReport.progress} 
                        color={selectedReport.progress >= 80 ? "emerald" : "blue"}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors cursor-pointer">
                    <Printer size={16} />
                    In báo cáo
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 text-sm font-medium text-white hover:shadow transition-all cursor-pointer">
                    <Share2 size={16} />
                    Chia sẻ
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-100 flex items-center justify-center">
                  <FileText size={24} className="text-red-400" />
                </div>
                <div className="text-gray-600 font-medium">Chọn một báo cáo</div>
                <div className="text-sm text-gray-500 mt-1">Nhấp vào báo cáo để xem chi tiết</div>
              </div>
            )}
          </div>

          {/* Progress Tracking */}
          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <FileCheck size={18} />
              </div>
              <h3 className="font-semibold text-gray-900">Tiến độ thu thập</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Báo cáo đã nhận</span>
                  <span className="font-semibold text-gray-900">12/18</span>
                </div>
                <ProgressBar value={66} color="pink" />
                <div className="text-xs text-gray-500 mt-2">
                  Còn thiếu: IELTS A1, TOEIC T3, Kids Tue
                </div>
              </div>
              
              <div className="pt-4 border-t border-pink-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span className="text-emerald-700">Đã gửi nhắc nhở</span>
                  </div>
                  <button className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments & Feedback */}
          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare size={20} className="text-amber-600" />
                Bình luận & phản hồi
              </h3>
              <span className="text-sm text-gray-500">{COMMENTS.length} mới</span>
            </div>
            
            <div className="space-y-3">
              {COMMENTS.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 rounded-xl border border-pink-100 bg-white hover:border-red-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${comment.avatarColor}`}>
                      {comment.author[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{comment.author}</span>
                        <span className="text-xs text-gray-400">{comment.time}</span>
                      </div>
                      <div className="text-sm text-gray-700">{comment.text}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors cursor-pointer">
                <MessageSquare size={16} />
                Thêm bình luận mới
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-red-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-red-500" />
            <span>Hệ thống báo cáo AI • Dữ liệu được cập nhật tự động • Phiên bản 2.5</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Đã duyệt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Đã nộp</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Bản nháp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}