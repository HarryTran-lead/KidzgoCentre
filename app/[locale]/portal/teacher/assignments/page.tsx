"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  ClipboardList, 
  UploadCloud, 
  FileText, 
  Wand2, 
  Send, 
  TimerReset, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  MessageSquare,
  Filter,
  Search,
  ChevronDown,
  Sparkles,
  BarChart3,
  UserCheck,
  Calendar,
  FileCheck,
  Users,
  TrendingUp,
  Zap,
  ArrowUpDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

type SubmissionStatus = "PENDING" | "SUBMITTED" | "REVIEWED" | "OVERDUE";

type Submission = {
  id: string;
  student: string;
  studentId: string;
  className: string;
  turnIn: string;
  file: string;
  fileSize: string;
  fileType: string;
  status: SubmissionStatus;
  assignmentTitle: string;
  dueDate: string;
  note?: string;
  score?: number;
  color: string;
};

const SUBMISSIONS: Submission[] = [
  {
    id: "SB001",
    student: "Nguyễn Văn An",
    studentId: "HV001",
    className: "IELTS Foundation - A1",
    turnIn: "04/12/2024 19:10",
    file: "ielts-a1-writing-task1.docx",
    fileSize: "2.4 MB",
    fileType: "DOCX",
    status: "PENDING",
    assignmentTitle: "Writing Task 1 - Bar Chart",
    dueDate: "05/12/2024 23:59",
    color: "from-pink-500 to-rose-500"
  },
  {
    id: "SB002",
    student: "Trần Thị Bình",
    studentId: "HV002",
    className: "IELTS Foundation - A1",
    turnIn: "04/12/2024 18:45",
    file: "ielts-speaking-part2.mp3",
    fileSize: "5.2 MB",
    fileType: "MP3",
    status: "REVIEWED",
    assignmentTitle: "Speaking Part 2 - Describe a place",
    dueDate: "04/12/2024 20:00",
    note: "Phát âm tốt, cần bổ sung từ nối và ngữ điệu tự nhiên hơn",
    score: 8.5,
    color: "from-fuchsia-500 to-purple-500"
  },
  {
    id: "SB003",
    student: "Lê Văn Cường",
    studentId: "HV003",
    className: "TOEIC Intermediate",
    turnIn: "03/12/2024 21:05",
    file: "toeic-grammar-exercises.pdf",
    fileSize: "3.1 MB",
    fileType: "PDF",
    status: "SUBMITTED",
    assignmentTitle: "Grammar Practice Test",
    dueDate: "04/12/2024 23:59",
    color: "from-amber-500 to-orange-500"
  },
  {
    id: "SB004",
    student: "Phạm Thị Dung",
    studentId: "HV004",
    className: "Business English",
    turnIn: "01/12/2024 14:30",
    file: "business-email-draft.docx",
    fileSize: "1.8 MB",
    fileType: "DOCX",
    status: "OVERDUE",
    assignmentTitle: "Business Email Writing",
    dueDate: "30/11/2024 23:59",
    note: "Bài nộp muộn 1 ngày",
    color: "from-rose-500 to-pink-500"
  },
  {
    id: "SB005",
    student: "Hoàng Minh Đức",
    studentId: "HV005",
    className: "IELTS Foundation - A1",
    turnIn: "04/12/2024 20:15",
    file: "listening-practice.zip",
    fileSize: "12.5 MB",
    fileType: "ZIP",
    status: "PENDING",
    assignmentTitle: "Listening Comprehension",
    dueDate: "05/12/2024 23:59",
    color: "from-emerald-500 to-teal-500"
  },
  {
    id: "SB006",
    student: "Vũ Thị Lan",
    studentId: "HV006",
    className: "TOEIC Intermediate",
    turnIn: "02/12/2024 16:20",
    file: "reading-comprehension.pdf",
    fileSize: "4.3 MB",
    fileType: "PDF",
    status: "REVIEWED",
    assignmentTitle: "Reading Section Practice",
    dueDate: "03/12/2024 23:59",
    note: "Xuất sắc, đạt 9.5/10 điểm",
    score: 9.5,
    color: "from-blue-500 to-sky-500"
  },
];

const STATUS_CONFIG: Record<SubmissionStatus, {
  text: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  PENDING: {
    text: "Chờ chấm",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-gradient-to-r from-amber-50 to-orange-50",
    borderColor: "border-amber-200"
  },
  SUBMITTED: {
    text: "Đã gửi",
    icon: UploadCloud,
    color: "text-sky-600",
    bgColor: "bg-gradient-to-r from-sky-50 to-blue-50",
    borderColor: "border-sky-200"
  },
  REVIEWED: {
    text: "Đã phản hồi",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-gradient-to-r from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200"
  },
  OVERDUE: {
    text: "Quá hạn",
    icon: AlertCircle,
    color: "text-rose-600",
    bgColor: "bg-gradient-to-r from-rose-50 to-pink-50",
    borderColor: "border-rose-200"
  }
};

// SortableHeader Component
function SortableHeader<T extends string>({ 
  label, 
  column, 
  sortColumn, 
  sortDirection, 
  onSort 
}: { 
  label: string; 
  column: T; 
  sortColumn: T | null; 
  sortDirection: "asc" | "desc"; 
  onSort: (col: T) => void;
}) {
  const isActive = sortColumn === column;
  
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-2 hover:text-pink-600 transition-colors cursor-pointer text-left"
    >
      <span>{label}</span>
      <div className="flex flex-col">
        {isActive ? (
          sortDirection === "asc" ? (
            <ChevronUp size={14} className="text-pink-600" />
          ) : (
            <ChevronDown size={14} className="text-pink-600" />
          )
        ) : (
          <ArrowUpDown size={14} className="text-gray-400" />
        )}
      </div>
    </button>
  );
}

function StudentAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .map(word => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${color} text-white font-bold text-sm`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor} ${config.borderColor} border ${config.color}`}>
      <Icon size={14} />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}

function FileTypeBadge({ type }: { type: string }) {
  const typeColors: Record<string, string> = {
    "PDF": "bg-rose-100 text-rose-700",
    "DOCX": "bg-blue-100 text-blue-700",
    "MP3": "bg-emerald-100 text-emerald-700",
    "ZIP": "bg-amber-100 text-amber-700",
    "PPT": "bg-orange-100 text-orange-700",
    "XLSX": "bg-green-100 text-green-700"
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${typeColors[type] || "bg-gray-100 text-gray-700"}`}>
      {type}
    </span>
  );
}

function SubmissionRow({ item }: { item: Submission }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`grid grid-cols-12 gap-4 items-center py-4 px-4 rounded-xl transition-all duration-300 border ${
        isHovered 
          ? "bg-gradient-to-r from-pink-50/50 to-rose-50/50 border-pink-200 shadow-sm" 
          : "bg-white border-pink-100"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Student Info */}
      <div className="col-span-3">
        <div className="flex items-center gap-3">
          <StudentAvatar name={item.student} color={item.color} />
          <div>
            <div className="font-semibold text-gray-900">{item.student}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span>{item.className}</span>
              <span>•</span>
              <span>ID: {item.studentId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="col-span-2">
        <div className="text-sm font-medium text-gray-900">{item.assignmentTitle}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
          <Calendar size={12} />
          Hạn: {item.dueDate}
        </div>
      </div>

      {/* File Info */}
      <div className="col-span-2">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-sm text-gray-900 truncate">{item.file}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <FileTypeBadge type={item.fileType} />
              <span>{item.fileSize}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Turn In Time */}
      <div className="col-span-2">
        <div className="text-sm text-gray-900">{item.turnIn.split(" ")[0]}</div>
        <div className="text-xs text-gray-500">{item.turnIn.split(" ")[1]}</div>
      </div>

      {/* Status & Score */}
      <div className="col-span-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          {item.score && (
            <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              {item.score}/10
            </div>
          )}
        </div>
        {item.note && (
          <div className="text-xs text-gray-600 mt-2 truncate">{item.note}</div>
        )}
      </div>

      {/* Actions */}
      <div className="col-span-1 flex items-center justify-end gap-1">
        <button className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer">
          <Eye size={18} />
        </button>
        <button className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer">
          <Download size={18} />
        </button>
        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
          <Send size={18} />
        </button>
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
        trong tổng số <span className="font-semibold text-gray-900">{totalItems}</span> bài nộp
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

export default function TeacherAssignmentsPage() {
  const [filter, setFilter] = useState<SubmissionStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [sortColumn, setSortColumn] = useState<"student" | "assignment" | "turnIn" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const classes = Array.from(new Set(SUBMISSIONS.map(s => s.className)));

  const handleSort = (column: "student" | "assignment" | "turnIn") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = SUBMISSIONS;
    
    if (filter !== "ALL") {
      result = result.filter(s => s.status === filter);
    }
    
    if (selectedClass !== "ALL") {
      result = result.filter(s => s.className === selectedClass);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.student.toLowerCase().includes(query) ||
        s.studentId.toLowerCase().includes(query) ||
        s.assignmentTitle.toLowerCase().includes(query) ||
        s.className.toLowerCase().includes(query)
      );
    }
    
    // Sort
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        if (sortColumn === "student") {
          comparison = a.student.localeCompare(b.student);
        } else if (sortColumn === "assignment") {
          comparison = a.assignmentTitle.localeCompare(b.assignmentTitle);
        } else if (sortColumn === "turnIn") {
          // Parse date format: "04/12/2024 19:10"
          const parseDate = (dateStr: string) => {
            const [datePart, timePart] = dateStr.split(" ");
            const [day, month, year] = datePart.split("/");
            return new Date(`${year}-${month}-${day} ${timePart || "00:00"}`);
          };
          const dateA = parseDate(a.turnIn);
          const dateB = parseDate(b.turnIn);
          comparison = dateA.getTime() - dateB.getTime();
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }
    
    return result;
  }, [filter, searchQuery, selectedClass, sortColumn, sortDirection]);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, selectedClass]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubmissions = filtered.slice(startIndex, endIndex);

  const stats = useMemo(() => {
    const total = SUBMISSIONS.length;
    const pending = SUBMISSIONS.filter(s => s.status === "PENDING").length;
    const reviewed = SUBMISSIONS.filter(s => s.status === "REVIEWED").length;
    const overdue = SUBMISSIONS.filter(s => s.status === "OVERDUE").length;
    const avgScore = Math.round(
      SUBMISSIONS.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / 
      SUBMISSIONS.filter(s => s.score).length * 10
    ) / 10;

    return { total, pending, reviewed, overdue, avgScore };
  }, []);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <ClipboardList size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Bài tập & Nộp bài
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý bài tập đã giao, theo dõi tiến độ nộp bài và gửi nhận xét cho học viên.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng bài nộp</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{stats.total}</div>
              </div>
              <div className="p-3 rounded-xl bg-pink-100">
                <FileCheck size={24} className="text-pink-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Chờ chấm</div>
                <div className="text-2xl font-bold mt-2 text-amber-600">{stats.pending}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock size={24} className="text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Đã chấm</div>
                <div className="text-2xl font-bold mt-2 text-emerald-600">{stats.reviewed}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-rose-50 rounded-2xl border border-rose-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Quá hạn</div>
                <div className="text-2xl font-bold mt-2 text-rose-600">{stats.overdue}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-100">
                <AlertCircle size={24} className="text-rose-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Điểm TB</div>
                <div className="text-2xl font-bold mt-2 text-blue-600">{stats.avgScore || "N/A"}</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
        {/* Filters and Actions */}
        <div className="px-6 pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {(["ALL", "PENDING", "SUBMITTED", "REVIEWED", "OVERDUE"] as const).map((key) => {
                if (key === "ALL") {
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                        filter === key
                          ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md"
                          : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
                      }`}
                    >
                      <BarChart3 size={16} />
                      Tất cả
                    </button>
                  );
                }
                
                const config = STATUS_CONFIG[key];
                const Icon = config.icon;
                
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                      filter === key
                        ? `bg-gradient-to-r ${config.bgColor.replace("bg-gradient-to-r ", "")} text-white shadow-md`
                        : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
                    }`}
                  >
                    <Icon size={16} />
                    {config.text}
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all cursor-pointer">
                <TimerReset size={16} />
                Giao bài mới
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-white border border-pink-200 pl-12 pr-4 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                placeholder="Tìm kiếm học viên, bài tập, hoặc mã ID..."
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none rounded-xl bg-white border border-pink-200 pl-4 pr-10 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                >
                  <option value="ALL">Tất cả lớp</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              <button className="p-3.5 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 transition-colors">
                <Filter size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="px-6">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-4 text-sm font-semibold text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl mb-2">
            <div className="col-span-3">
              <SortableHeader
                label="Học viên & Lớp"
                column="student"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-2">
              <SortableHeader
                label="Bài tập"
                column="assignment"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-2 font-medium">Tệp đính kèm</div>
            <div className="col-span-2">
              <SortableHeader
                label="Thời gian nộp"
                column="turnIn"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-2 font-medium">Trạng thái</div>
            <div className="col-span-1 font-medium text-right">Thao tác</div>
          </div>
          
          {/* Submissions List */}
          <div className="space-y-2">
            {paginatedSubmissions.length > 0 ? (
              paginatedSubmissions.map((item) => (
                <SubmissionRow key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4">
                  <Search size={32} className="text-pink-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy bài nộp
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem kết quả.
                </p>
              </div>
            )}
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

        {/* AI Tools Section */}
        <div className="px-6 pb-6 pt-8 mt-8 border-t border-pink-200">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                  <TimerReset size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Giao bài tập mới</h3>
                  <p className="text-sm text-gray-600">Create & Schedule assignments</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">
                Tạo bài tập theo lớp, đặt hạn nộp và tự động nhắc nhở qua Zalo nếu học viên chưa nộp trước giờ học.
              </p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-amber-200 rounded-xl">
                    <div className="text-xs text-gray-600">Đang mở</div>
                    <div className="text-lg font-bold text-amber-600">12</div>
                    <div className="text-xs text-gray-600">bài tập</div>
                  </div>
                  <div className="p-3 bg-white border border-amber-200 rounded-xl">
                    <div className="text-xs text-gray-600">Sắp hết hạn</div>
                    <div className="text-lg font-bold text-amber-600">3</div>
                    <div className="text-xs text-gray-600">trong 24h</div>
                  </div>
                </div>
                
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 font-medium hover:shadow-lg transition-all cursor-pointer">
                  <Calendar size={16} />
                  Lên lịch nhắc nhở
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                  <Wand2 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Tạo feedback tự động</h3>
                  <p className="text-sm text-gray-600">AI-powered suggestions</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">
                Dùng AI để gợi ý nhận xét chi tiết dựa trên bài làm của học viên, sau đó chỉnh sửa trước khi gửi.
              </p>
              
              <div className="space-y-3">
                <div className="p-3 bg-white border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600">Đề xuất từ AI</div>
                      <div className="text-sm text-gray-900 mt-1">"Bài viết có cấu trúc tốt, cần chú ý đến ngữ pháp câu phức..."</div>
                    </div>
                    <Sparkles size={20} className="text-emerald-500" />
                  </div>
                </div>
                
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 font-medium hover:shadow-lg transition-all cursor-pointer">
                  <Zap size={16} />
                  Gợi ý từ AI
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}