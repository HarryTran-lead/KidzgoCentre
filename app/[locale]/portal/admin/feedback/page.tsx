"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  Search, 
  CheckCircle2, 
  Download, 
  Send, 
  MessageSquare, 
  FileText,
  Calendar,
  Clock,
  Eye,
  MoreVertical,
  Upload,
  Bell,
  Check,
  AlertCircle,
  Mail,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

type Status = "PENDING" | "APPROVED" | "REJECTED";

type FeedbackReport = {
  id: string;
  className: string;
  month: string;
  teacher: string;
  totalStudents: number;
  status: Status;
  updatedAt: string;
  submittedBy: string;
  progress: number;
  color: string;
  submittedDate: string;
};

const REPORTS: FeedbackReport[] = [
  {
    id: "FB001",
    className: "IELTS Foundation - A1",
    month: "12/2024",
    teacher: "Cô Phương",
    totalStudents: 18,
    status: "PENDING",
    updatedAt: "05/12/2024 09:00",
    submittedBy: "Trần Văn A",
    progress: 75,
    color: "from-red-600 to-red-700",
    submittedDate: "04/12/2024"
  },
  {
    id: "FB002",
    className: "TOEIC Intermediate",
    month: "12/2024",
    teacher: "Thầy Minh",
    totalStudents: 15,
    status: "APPROVED",
    updatedAt: "04/12/2024 21:30",
    submittedBy: "Nguyễn Thị B",
    progress: 100,
    color: "from-emerald-500 to-teal-500",
    submittedDate: "03/12/2024"
  },
  {
    id: "FB003",
    className: "Kỹ năng sống cuối tuần",
    month: "11/2024",
    teacher: "Cô Lan",
    totalStudents: 12,
    status: "APPROVED",
    updatedAt: "28/11/2024 16:20",
    submittedBy: "Lê Văn C",
    progress: 100,
    color: "from-blue-500 to-cyan-500",
    submittedDate: "27/11/2024"
  },
  {
    id: "FB004",
    className: "Business English",
    month: "12/2024",
    teacher: "Thầy Tùng",
    totalStudents: 20,
    status: "REJECTED",
    updatedAt: "02/12/2024 14:15",
    submittedBy: "Phạm Thị D",
    progress: 60,
    color: "from-amber-500 to-orange-500",
    submittedDate: "01/12/2024"
  },
  {
    id: "FB005",
    className: "Kids English F1",
    month: "12/2024",
    teacher: "Cô Vi",
    totalStudents: 16,
    status: "PENDING",
    updatedAt: "03/12/2024 11:30",
    submittedBy: "Hoàng Văn E",
    progress: 85,
    color: "from-violet-500 to-purple-500",
    submittedDate: "02/12/2024"
  },
  {
    id: "FB006",
    className: "IELTS Speaking Club",
    month: "12/2024",
    teacher: "Thầy Hải",
    totalStudents: 25,
    status: "APPROVED",
    updatedAt: "01/12/2024 18:45",
    submittedBy: "Trần Thị F",
    progress: 100,
    color: "from-indigo-500 to-blue-500",
    submittedDate: "30/11/2024"
  },
];

const STATUS_INFO: Record<Status, { 
  text: string; 
  cls: string;
  bg: string;
  icon: React.ReactNode;
}> = {
  PENDING: { 
    text: "Chờ duyệt", 
    cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
    bg: "from-amber-400 to-orange-500",
    icon: <Clock size={14} />
  },
  APPROVED: { 
    text: "Đã duyệt", 
    cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
    bg: "from-emerald-400 to-teal-500",
    icon: <CheckCircle2 size={14} />
  },
  REJECTED: { 
    text: "Yêu cầu bổ sung", 
    cls: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200",
    bg: "from-rose-400 to-pink-500",
    icon: <AlertCircle size={14} />
  },
};

function StatusBadge({ status }: { status: Status }) {
  const { text, cls, icon } = STATUS_INFO[status];
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${cls}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color,
  trend,
  subtitle 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  color: string;
  trend?: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-20 w-20 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${color}`}></div>
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm`}>
              {icon}
            </div>
            {trend && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {trend}
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function ProgressPieChart({ progress, color }: { progress: number; color: string }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  // Extract color from gradient string (e.g., "from-amber-400 to-orange-500" -> "amber")
  const getColorClass = () => {
    if (color.includes('emerald')) return 'text-emerald-500';
    if (color.includes('amber')) return 'text-amber-500';
    if (color.includes('rose')) return 'text-rose-500';
    if (color.includes('blue')) return 'text-blue-500';
    if (color.includes('purple') || color.includes('violet')) return 'text-purple-500';
    if (color.includes('indigo')) return 'text-indigo-500';
    return 'text-red-600';
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12">
        <svg className="transform -rotate-90 w-12 h-12">
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-100"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-500 ${getColorClass()}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">{progress}%</span>
        </div>
      </div>

    </div>
  );
}

function ReportTableRow({ report }: { report: FeedbackReport }) {
  const statusInfo = STATUS_INFO[report.status];
  
  return (
    <tr className="group border-b border-red-100 hover:bg-red-50/50 transition-colors">
      <td className="px-4 py-4 align-top">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${report.color}`}></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{report.className}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Tháng {report.month}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span>{report.teacher}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-center align-top">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
          <span>{report.totalStudents} học viên</span>
        </div>
      </td>
      <td className="px-4 py-4 text-center align-top">
        <div className="flex justify-center">
          <ProgressPieChart progress={report.progress} color={statusInfo.bg} />
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="text-sm">
          <div className="font-medium text-gray-900">{report.submittedBy}</div>
          <div className="text-xs text-gray-500 mt-0.5">{report.submittedDate}</div>
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <StatusBadge status={report.status} />
      </td>
      <td className="px-4 py-4 align-top">
        <div className="text-xs text-gray-500 whitespace-nowrap">
          {report.updatedAt}
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex items-center justify-end gap-1">
          <button className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-red-600" title="Xem chi tiết">
            <Eye size={16} />
          </button>
          {report.status === "PENDING" && (
            <>
              <button className="p-2 rounded-lg hover:bg-emerald-50 transition-colors text-gray-500 hover:text-emerald-600" title="Duyệt">
                <Check size={16} />
              </button>
              <button className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-red-600" title="Từ chối">
                <AlertCircle size={16} />
              </button>
            </>
          )}
          <button className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-red-600" title="Gửi">
            <Send size={16} />
          </button>
          <button className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100" title="Thêm">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

type SortColumn = "className" | "teacher" | "totalStudents" | "progress" | "submittedBy" | "status" | "updatedAt" | null;
type SortDirection = "asc" | "desc";

export default function AdminFeedbackPage() {
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Tất cả");
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const stats = [
    {
      title: "Tổng báo cáo",
      value: "35",
      icon: <FileText size={20} />,
      color: "from-red-600 to-red-700",
      subtitle: "Tháng 12/2024",
      trend: "+12%"
    },
    {
      title: "Chờ duyệt",
      value: "12",
      icon: <Clock size={20} />,
      color: "from-amber-500 to-orange-500",
      subtitle: "Cần xử lý",
      trend: "+3"
    },
    {
      title: "Đã duyệt",
      value: "18",
      icon: <CheckCircle2 size={20} />,
      color: "from-emerald-500 to-teal-500",
      subtitle: "Đã gửi phụ huynh",
      trend: "+8"
    },
    {
      title: "Phản hồi",
      value: "42",
      icon: <MessageSquare size={20} />,
      color: "from-blue-500 to-cyan-500",
      subtitle: "Từ phụ huynh",
      trend: "+15"
    }
  ];

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const list = useMemo(() => {
    let result = REPORTS;
    
    if (status !== "ALL") {
      result = result.filter((item) => item.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((item) => 
        item.className.toLowerCase().includes(searchLower) ||
        item.teacher.toLowerCase().includes(searchLower) ||
        item.id.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedMonth !== "Tất cả") {
      result = result.filter((item) => item.month === selectedMonth);
    }
    
    // Sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sortColumn) {
          case "className":
            aValue = a.className.toLowerCase();
            bValue = b.className.toLowerCase();
            break;
          case "teacher":
            aValue = a.teacher.toLowerCase();
            bValue = b.teacher.toLowerCase();
            break;
          case "totalStudents":
            aValue = a.totalStudents;
            bValue = b.totalStudents;
            break;
          case "progress":
            aValue = a.progress;
            bValue = b.progress;
            break;
          case "submittedBy":
            aValue = a.submittedBy.toLowerCase();
            bValue = b.submittedBy.toLowerCase();
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          case "updatedAt":
            aValue = a.updatedAt;
            bValue = b.updatedAt;
            break;
          default:
            return 0;
        }
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          return sortDirection === "asc" 
            ? aValue - bValue
            : bValue - aValue;
        }
      });
    }
    
    return result;
  }, [status, search, selectedMonth, sortColumn, sortDirection]);

  const months = ["Tất cả", "12/2024", "11/2024", "10/2024"];
  const pendingCount = REPORTS.filter(r => r.status === "PENDING").length;
  const approvedCount = REPORTS.filter(r => r.status === "APPROVED").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <MessageSquare size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Quản lý Feedback
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Duyệt và gửi báo cáo học tập đến phụ huynh, đồng bộ qua Zalo & Email
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600">
              <Bell size={16} />
            </div>
            <div className="pl-10 pr-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 text-amber-700 text-sm font-medium">
              <span className="font-bold">{pendingCount}</span> báo cáo chờ duyệt
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <Upload size={16} /> Tải lên báo cáo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Filter Bar */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Tabs */}
            <div className="inline-flex rounded-xl border border-red-200 bg-white p-1">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((item) => {
                const count = item === "ALL" ? REPORTS.length : REPORTS.filter(r => r.status === item).length;
                return (
                  <button
                    key={item}
                    onClick={() => setStatus(item as typeof status)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      status === item 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm' 
                        : 'text-gray-700 hover:bg-red-50'
                    }`}
                  >
                    {item === "ALL" ? "Tất cả" : STATUS_INFO[item as Status].text}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      status === item ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo lớp, giáo viên..."
              className="h-10 w-72 rounded-xl border border-red-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[1200px]">
            <thead className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-red-100 transition-colors w-[320px]"
                  onClick={() => handleSort("className")}
                >
                  <div className="flex items-center gap-2">
                    Lớp học
                    {sortColumn === "className" ? (
                      sortDirection === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-red-100 transition-colors w-[180px]"
                  onClick={() => handleSort("teacher")}
                >
                  <div className="flex items-center gap-2">
                    Giáo viên
                    {sortColumn === "teacher" ? (
                      sortDirection === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-red-100 transition-colors w-[140px]"
                  onClick={() => handleSort("totalStudents")}
                >
                  <div className="flex items-center gap-2">
                    Học viên
                    {sortColumn === "totalStudents" ? (
                      sortDirection === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-red-100 transition-colors w-[120px]"
                  onClick={() => handleSort("progress")}
                >
                  <div className="flex items-center gap-2">
                    Tiến độ
                    {sortColumn === "progress" ? (
                      sortDirection === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-red-100 transition-colors w-[180px]"
                  onClick={() => handleSort("submittedBy")}
                >
                  <div className="flex items-center gap-2">
                    Người gửi
                    {sortColumn === "submittedBy" ? (
                      sortDirection === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-red-100 transition-colors w-[180px]"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-2">
                    Trạng thái
                    {sortColumn === "status" ? (
                      sortDirection === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-red-100 transition-colors w-[200px]"
                  onClick={() => handleSort("updatedAt")}
                >
                  <div className="flex items-center gap-2">
                    Cập nhật
                    {sortColumn === "updatedAt" ? (
                      sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-400" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-[160px]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-red-100">
              {list.length > 0 ? (
                list.map((report) => (
                  <ReportTableRow key={report.id} report={report} />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                      <Search size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy báo cáo phù hợp</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm khác</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className={`grid gap-6 lg:grid-cols-3 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Export Section */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <Download size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xuất báo cáo tổng hợp</h3>
                <p className="text-sm text-gray-600">Tải file Excel/PDF cho toàn bộ phụ huynh</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-2">
                  <FileText size={16} />
                  Excel tổng hợp
                </button>
                <button className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-2">
                  <FileText size={16} />
                  PDF từng lớp
                </button>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" />
                  <span>Tự động đóng dấu trung tâm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" />
                  <span>Định dạng chuẩn cho phụ huynh</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" />
                  <span>Export theo từng khối lớp</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Section */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gửi thông báo</h3>
                <p className="text-sm text-gray-600">Đồng bộ đến phụ huynh</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <Send size={16} />
                Gửi cho {approvedCount} lớp đã duyệt
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </button>
                <button className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors flex items-center gap-2">
                  <Zap size={16} />
                  Zalo OA
                </button>
              </div>
            </div>
          </div>

         
        </div>
      </div>

      {/* Legend */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-sm font-semibold text-gray-900 mb-3">Chú thích trạng thái</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <span className="text-sm text-gray-600">Chờ duyệt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <span className="text-sm text-gray-600">Đã duyệt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-rose-400 to-pink-500"></div>
            <span className="text-sm text-gray-600">Yêu cầu bổ sung</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
            <span className="text-sm text-gray-600">Đã gửi phụ huynh</span>
          </div>
        </div>
      </div>
    </div>
  );
}