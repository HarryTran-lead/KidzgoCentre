"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  BookOpen,
  FileText,
  Download,
  Send,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  Eye,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Loader2,
  Award,
  MessageSquare,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { fetchHomeworkDetail, fetchHomeworkSubmissions } from "@/lib/api/homeworkService";
import type {
  HomeworkSubmission,
  HomeworkSubmissionItem,
  SubmissionStatusFromApi,
} from "@/types/teacher/homework";

type SubmissionStatusUi = "ASSIGNED" | "SUBMITTED" | "GRADED" | "LATE" | "MISSING";

function mapApiStatusToUi(
  apiStatus: string,
  dueAt: string,
  submittedAt: string | null
): SubmissionStatusUi {
  const normalizedStatus = String(apiStatus || "").trim() as SubmissionStatusFromApi;

  if (
    normalizedStatus === "Assigned" &&
    !submittedAt &&
    dueAt &&
    new Date() > new Date(dueAt)
  ) {
    return "MISSING";
  }

  switch (normalizedStatus) {
    case "Submitted":
      return "SUBMITTED";
    case "Graded":
      return "GRADED";
    case "Late":
      return "LATE";
    case "Missing":
      return "MISSING";
    case "Assigned":
    default:
      return "ASSIGNED";
  }
}

const STATUS_CONFIG: Record<SubmissionStatusUi, {
  text: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  ASSIGNED: {
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
  GRADED: {
    text: "Đã phản hồi",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-gradient-to-r from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200"
  },
  LATE: {
    text: "Nộp trễ",
    icon: AlertCircle,
    color: "text-yellow-700",
    bgColor: "bg-gradient-to-r from-yellow-50 to-amber-50",
    borderColor: "border-yellow-200"
  },
  MISSING: {
    text: "Quá hạn",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-gradient-to-r from-red-50 to-red-100",
    borderColor: "border-red-200"
  }
};

STATUS_CONFIG.ASSIGNED.text = "Đã giao";
STATUS_CONFIG.SUBMITTED.text = "Đã nộp";
STATUS_CONFIG.GRADED.text = "Đã chấm";
STATUS_CONFIG.LATE.text = "Nộp trễ";
STATUS_CONFIG.MISSING.text = "Thiếu bài";

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
      className="flex items-center gap-2 hover:text-red-600 transition-colors cursor-pointer text-left"
    >
      <span>{label}</span>
      <div className="flex flex-col">
        {isActive ? (
          sortDirection === "asc" ? (
            <ChevronUp size={14} className="text-red-600" />
          ) : (
            <ChevronDown size={14} className="text-red-600" />
          )
        ) : (
          <ArrowUpDown size={14} className="text-gray-400" />
        )}
      </div>
    </button>
  );
}

function StudentAvatar({ name = "", color }: { name?: string; color: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map(word => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${color} text-white font-bold text-sm`}>
      {initials || "NA"}
    </div>
  );
}

function StatusBadge({ status }: { status: SubmissionStatusUi }) {
  const config = STATUS_CONFIG[status] || {
    icon: Clock,
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    color: "text-gray-600",
    text: "Unknown"
  };

  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor} ${config.borderColor} border ${config.color}`}
    >
      <Icon size={14} />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  startIndex = 0,
  endIndex = 0,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  startIndex?: number;
  endIndex?: number;
}) {
  const pages: (number | string)[] = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
  }

  return (
    <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="text-sm text-gray-600">
          Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> trong tổng số{" "}
          <span className="font-semibold text-gray-900">{totalItems}</span> bài nộp
        </div>

        {/* Right: Pagination Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1">
            {pages.map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === "number" && onPageChange(page)}
                disabled={page === "..."}
                className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  page === currentPage
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                    : page === "..."
                    ? "cursor-default text-gray-400"
                    : "border border-red-200 hover:bg-red-50 text-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomeworkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;

  const [homework, setHomework] = useState<HomeworkSubmission | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<SubmissionStatusUi | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<"student" | "submittedAt" | "score">("student");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const recordsPerPage = 10;

  // Fetch homework detail
  const loadHomeworkDetail = useCallback(async () => {
    if (!homeworkId) {
      setError("Không tìm thấy ID bài tập");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchHomeworkDetail(homeworkId);

      if (result.ok && result.data) {
        setHomework(result.data);
      }else {
        setError(result.error || "Không thể tải thông tin bài tập");
      }
    } catch (err) {
      console.error("Error loading homework detail:", err);
      setError("Có lỗi xảy ra khi tải thông tin bài tập");
    } finally {
      setIsLoading(false);
    }
  }, [homeworkId]);

  // Fetch all submissions for this homework using /api/homework/submissions
  const loadSubmissions = useCallback(async (classId?: string) => {
    if (!homeworkId) return;

    setIsLoadingSubmissions(true);

    try {
      // Use the submissions API - filter by homeworkAssignmentId on client side
      const result = await fetchHomeworkSubmissions({
        classId,
        pageNumber: 1,
        pageSize: 100,
      });

      if (result.ok && result.data) {
        // Filter submissions for this specific homework assignment
        const filtered = result.data.filter(
          (sub) => sub.homeworkAssignmentId === homeworkId || sub.id === homeworkId
        );
        setSubmissions(filtered);
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [homeworkId]);

  useEffect(() => {
    loadHomeworkDetail();
  }, [loadHomeworkDetail]);

  // Load submissions after homework is loaded (need classId)
  useEffect(() => {
    if (homework) {
      loadSubmissions(homework.classId);
    }
  }, [homework, loadSubmissions]);

  const handleSort = (column: "student" | "submittedAt" | "score") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];

    if (filterStatus !== "ALL") {
      result = result.filter(sub => {
        const uiStatus = mapApiStatusToUi(sub.status, sub.dueAt, sub.submittedAt);
        return uiStatus === filterStatus;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(sub =>
        sub.studentName?.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "student") {
        comparison = (a.studentName || "").localeCompare(b.studentName || "");
      } else if (sortColumn === "submittedAt") {
        comparison = (a.submittedAt || "").localeCompare(b.submittedAt || "");
      } else if (sortColumn === "score") {
        comparison = (a.score || 0) - (b.score || 0);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [submissions, filterStatus, searchQuery, sortColumn, sortDirection]);

  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredSubmissions.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredSubmissions, currentPage]);

  const totalPages = Math.ceil(filteredSubmissions.length / recordsPerPage);

  const stats = useMemo(() => {
    const total = submissions.length;
    const assigned = submissions.filter(s => mapApiStatusToUi(s.status, s.dueAt, s.submittedAt) === "ASSIGNED").length;
    const submitted = submissions.filter(s => mapApiStatusToUi(s.status, s.dueAt, s.submittedAt) === "SUBMITTED").length;
    const graded = submissions.filter(s => mapApiStatusToUi(s.status, s.dueAt, s.submittedAt) === "GRADED").length;
    const late = submissions.filter(s => mapApiStatusToUi(s.status, s.dueAt, s.submittedAt) === "LATE").length;
    const missing = submissions.filter(s => mapApiStatusToUi(s.status, s.dueAt, s.submittedAt) === "MISSING").length;

    return { total, assigned, submitted, graded, late, missing };
  }, [submissions]);

  const getAvatarColor = (index: number) => {
    const colors = [
      "from-red-500 to-red-600",
      "from-blue-500 to-blue-600",
      "from-emerald-500 to-emerald-600",
      "from-purple-500 to-purple-600",
      "from-amber-500 to-amber-600",
      "from-teal-500 to-teal-600",
      "from-indigo-500 to-indigo-600",
      "from-pink-500 to-pink-600",
    ];
    return colors[index % colors.length];
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      });
    } catch {
      return dateStr;
    }
  };

  // DueAt từ API giờ đã có offset +07:00 → dùng formatDateTime trực tiếp
  const formatDueAtVn = formatDateTime;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto text-red-600 mb-4" />
          <p className="text-gray-600">Đang tải thông tin bài tập...</p>
        </div>
      </div>
    );
  }

  if (error || !homework) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error || "Không tìm thấy bài tập"}</p>
          <button
            onClick={() => router.push("/vi/portal/teacher/assignments")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
          >
            <ArrowLeft size={16} /> Quay lại trang Bài tập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <BookOpen size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Chi tiết bài tập
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {homework.title}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => router.push("/vi/portal/teacher/assignments")}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer">
            <Download size={16} /> Tải tất cả
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer">
            <Send size={16} /> Gửi thông báo
          </button>
        </div>
      </div>

      {/* Homework Info Card */}
      <div className="bg-gradient-to-br from-white via-gray-50/30 to-white rounded-2xl border border-red-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
                <BookOpen size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{homework.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Users size={16} className="text-red-600" />
                    <span className="font-medium">{homework.classTitle}</span>
                  </div>
                  {homework.branchName && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-red-600" />
                      <span>{homework.branchName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} className="text-red-600" />
                <div>
                  <div className="text-xs text-gray-500">Ngày giao</div>
                  <div className="font-medium text-gray-900">{formatDateTime(homework.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} className="text-red-600" />
                <div>
                  <div className="text-xs text-gray-500">Hạn nộp</div>
                  <div className="font-medium text-gray-900">{formatDueAtVn(homework.dueAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FileText size={16} className="text-red-600" />
                <div>
                  <div className="text-xs text-gray-500">Điểm tối đa</div>
                  <div className="font-medium text-gray-900">{homework.maxScore || 10}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users size={16} className="text-red-600" />
                <div>
                  <div className="text-xs text-gray-500">Tổng nộp</div>
                  <div className="font-medium text-gray-900">{submissions.length} bài</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Skills */}
        {(homework.description || homework.skills) && (
          <div className="mt-6 pt-6 border-t border-red-200">
              {homework.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Mô tả bài tập
                  </h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{homework.description}</p>
                </div>
              )}
              {homework.skills && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Kỹ năng</h3>
                  <div className="flex flex-wrap gap-2">
                    {homework.skills.split(",").map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl from-red-500 to-red-700`}></div>
            <div className="relative flex items-center justify-between gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white shadow-sm flex-shrink-0">
                <Users size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-gray-600 truncate">Tổng</div>
                <div className="text-xl font-bold text-gray-900 leading-tight">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl from-sky-500 to-blue-600`}></div>
            <div className="relative flex items-center justify-between gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm flex-shrink-0">
                <UploadCloud size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-sky-600 truncate">Đã nộp</div>
                <div className="text-xl font-bold text-sky-600 leading-tight">{stats.submitted}</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl from-amber-500 to-orange-600`}></div>
            <div className="relative flex items-center justify-between gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm flex-shrink-0">
                <Clock size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-amber-600 truncate">Đã giao</div>
                <div className="text-xl font-bold text-amber-600 leading-tight">{stats.assigned}</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl from-emerald-500 to-teal-600`}></div>
            <div className="relative flex items-center justify-between gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm flex-shrink-0">
                <CheckCircle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-emerald-600 truncate">Đã chấm</div>
                <div className="text-xl font-bold text-emerald-600 leading-tight">{stats.graded}</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl from-red-500 to-red-700`}></div>
            <div className="relative flex items-center justify-between gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white shadow-sm flex-shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-red-600 truncate">Thiếu bài</div>
                <div className="text-xl font-bold text-red-600 leading-tight">{stats.missing}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users size={20} className="text-red-600" />
                Danh sách nộp bài
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredSubmissions.length} bài nộp</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-6 py-4 border-b border-red-200 bg-white">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-xl border border-red-200 bg-white p-1">
                {[
                  { k: 'ALL', label: 'Tất cả', count: submissions.length },
                  { k: 'SUBMITTED', label: 'Đã nộp', count: stats.submitted },
                  { k: 'ASSIGNED', label: 'Đã giao', count: stats.assigned },
                  { k: 'GRADED', label: 'Đã chấm', count: stats.graded },
                  { k: 'LATE', label: 'Nộp trễ', count: stats.late },
                  { k: 'MISSING', label: 'Thiếu bài', count: stats.missing },
                ].map((item) => (
                  <button
                    key={item.k}
                    onClick={() => {
                      setFilterStatus(item.k as SubmissionStatusUi | "ALL");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                      filterStatus === item.k
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-red-50'
                    }`}
                  >
                    {item.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filterStatus === item.k ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative ml-auto">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-72 rounded-xl border border-red-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Tìm kiếm học viên..."
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    <SortableHeader
                      label="Học viên"
                      column="student"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    <SortableHeader
                      label="Ngày nộp"
                      column="submittedAt"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  {homework.submissionType !== "MULTIPLE_CHOICE" && (
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Phản hồi</th>
                  )}
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    <SortableHeader
                      label="Điểm"
                      column="score"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-red-100">
                {isLoadingSubmissions ? (
                  <tr>
                    <td colSpan={homework.submissionType === "MULTIPLE_CHOICE" ? 5 : 6} className="py-12 text-center">
                      <Loader2 size={32} className="animate-spin mx-auto text-red-600 mb-4" />
                      <p className="text-gray-600">Đang tải danh sách nộp bài...</p>
                    </td>
                  </tr>
                ) : paginatedSubmissions.length > 0 ? (
                  paginatedSubmissions.map((submission, index) => (
                    <tr
                      key={submission.id}
                      className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                    >
                      {/* Student Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <StudentAvatar name={submission.studentName || ""} color={getAvatarColor(index)} />
                          <div>
                            <div className="font-medium text-gray-900">{submission.studentName || "Chưa có tên"}</div>
                            <div className="text-xs text-gray-500">{submission.studentProfileId?.slice(0, 8) || "-"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <StatusBadge status={mapApiStatusToUi(submission.status, submission.dueAt, submission.submittedAt)} />
                      </td>

                      {/* Submitted At */}
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {formatDateTime(submission.submittedAt || undefined)}
                      </td>

                      {/* Attachments - hidden for multiple choice */}
                      {homework.submissionType !== "MULTIPLE_CHOICE" && (
                        <td className="py-4 px-6">
                          {submission.teacherFeedback ? (
                            <span className="text-sm text-gray-500 italic">Có phản hồi</span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      )}

                      {/* Score */}
                      <td className="py-4 px-6">
                        {(() => {
                          const status = mapApiStatusToUi(submission.status, submission.dueAt, submission.submittedAt);
                          const isMissingSubmission = status === "MISSING" && submission.submittedAt === null;
                          const displayScore = isMissingSubmission ? 0 : submission.score;
                          if (displayScore !== null && displayScore !== undefined) {
                            return (
                              <div className="flex items-center gap-1">
                                <span className={`text-lg font-bold ${isMissingSubmission ? "text-red-500" : "text-emerald-600"}`}>{displayScore}</span>
                                <span className="text-gray-400 text-sm">/ {homework.maxScore || 10}</span>
                              </div>
                            );
                          }
                          return <span className="text-gray-400 text-sm">Chưa chấm</span>;
                        })()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/${String(params.locale || "vi")}/portal/teacher/assignments/${homeworkId}/submissions/${submission.id}`)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-emerald-50 transition-colors text-gray-400 hover:text-emerald-600 cursor-pointer"
                            title="Tải xuống"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                            title="Gửi phản hồi"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-amber-50 transition-colors text-gray-400 hover:text-amber-600 cursor-pointer"
                            title="Chấm điểm"
                          >
                            <Award size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={homework.submissionType === "MULTIPLE_CHOICE" ? 5 : 6} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                        <Search size={24} className="text-red-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Không tìm thấy bài nộp</div>
                      <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredSubmissions.length}
              startIndex={(currentPage - 1) * recordsPerPage}
              endIndex={(currentPage - 1) * recordsPerPage + paginatedSubmissions.length}
            />
          )}
        </div>
      </div>
  );
}
