"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  Calendar,
  Clock,
  FileText,
  Upload,
  CheckCircle,
  BookOpen,
  Award,
  Loader2,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/lightswind/button";
import type { AssignmentListItem, SortOption } from "@/types/student/homework";
import {
  getStudentHomework,
  getStudentHomeworkFeedback,
  getStudentSubmittedHomework,
} from "@/lib/api/studentService";

// Constants
const PAGE_SIZE = 50;
const DEBOUNCE_DELAY = 300;

// Helper functions
const getTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    FILE: "Nộp file",
    Quiz: "Trắc nghiệm",
    Essay: "Bài viết",
    PROJECT: "Dự án",
    PRESENTATION: "Thuyết trình",
    FILE_UPLOAD: "Nộp file",
    ESSAY: "Bài viết",
    MULTIPLECHOICE: "Trắc nghiệm",
    MULTIPLE_CHOICE: "Trắc nghiệm",
    Text: "Trả lời bằng văn bản",
  };
  return map[type] || "Bài tập";
};

const getTypeIcon = (type: string) => {
  const normalizedType = type?.toUpperCase();
  switch (normalizedType) {
    case "FILE":
    case "FILE_UPLOAD":
      return <Upload size={24} />;
    case "QUIZ":
    case "MULTIPLE_CHOICE":
    case "MULTIPLECHOICE":
      return <CheckCircle size={24} />;
    case "ESSAY":
      return <FileText size={24} />;
    case "PROJECT":
      return <BookOpen size={24} />;
    case "PRESENTATION":
      return <Award size={24} />;
    case "TRUE_FALSE":
    case "FILL_IN_BLANK":
      return <HelpCircle size={24} />;
    default:
      return <FileText size={24} />;
  }
};

const hasGradingResult = (assignment: AssignmentListItem): boolean =>
  Boolean(
    assignment.gradedAt ||
    assignment.score !== null ||
    (assignment.teacherFeedback && assignment.teacherFeedback.trim()) ||
    (assignment.aiFeedback && assignment.aiFeedback.trim()),
  );

const getFeedbackPreview = (assignment: AssignmentListItem): string =>
  assignment.teacherFeedback?.trim() ||
  assignment.aiFeedback?.trim() ||
  "";

const formatDate = (dateString: string, locale: string = "vi-VN") => {
  if (!dateString) return "-";
  try {
    const match = String(dateString).match(
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|([+-]\d{2}:?\d{2}))?$/,
    );
    let date: Date;
    if (match) {
      const [, year, month, day, hours, minutes] = match;
      const vnMs = Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours) - 7,
        parseInt(minutes),
      );
      date = new Date(vnMs);
    } else {
      date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
    }
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString: string, locale: string = "vi-VN") => {
  if (!dateString) return "-";
  try {
    const match = String(dateString).match(
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|([+-]\d{2}:?\d{2}))?$/,
    );
    let date: Date;
    if (match) {
      const [, year, month, day, hours, minutes] = match;
      const vnMs = Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours) - 7,
        parseInt(minutes),
      );
      date = new Date(vnMs);
    } else {
      date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
    }
    return date.toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return dateString;
  }
};

const isToday = (dateString: string): boolean => {
  if (!dateString) return false;
  try {
    const match = String(dateString).match(
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|([+-]\d{2}:?\d{2}))?$/,
    );
    let date: Date;
    if (match) {
      const [, year, month, day] = match;
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      date = new Date(dateString);
      if (isNaN(date.getTime())) return false;
    }
    const today = new Date();
    return date.toDateString() === today.toDateString();
  } catch {
    return false;
  }
};

const isTomorrow = (dateString: string): boolean => {
  if (!dateString) return false;
  try {
    const match = String(dateString).match(
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|([+-]\d{2}:?\d{2}))?$/,
    );
    let date: Date;
    if (match) {
      const [, year, month, day] = match;
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      date = new Date(dateString);
      if (isNaN(date.getTime())) return false;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  } catch {
    return false;
  }
};

// Sub-components
function StatusBadge({
  status,
  score,
  maxScore,
  isGraded = false,
}: {
  status: string;
  score?: number | null;
  maxScore?: number;
  isGraded?: boolean;
}) {
  if (isGraded) {
    return (
      <span className="px-3 py-1 rounded-lg text-[11px] font-bold backdrop-blur-sm bg-cyan-500/30 border border-cyan-400/40 text-cyan-200">
        {score !== undefined && score !== null
          ? `${score}/${maxScore}`
          : "Da cham"}
      </span>
    );
  }

  const config: Record<string, { label: string; className: string }> = {
    SUBMITTED: {
      label:
        score !== undefined && score !== null
          ? `${score}/${maxScore}`
          : "Đã nộp",
      className: "bg-green-500/30 border border-green-400/40 text-green-300",
    },
    ASSIGNED: {
      label: "Chưa làm",
      className: "bg-amber-500/30 border border-amber-400/40 text-amber-300",
    },
    PENDING: {
      label: "Chưa làm",
      className: "bg-blue-500/30 border border-blue-400/40 text-blue-300",
    },
    LATE: {
      label: "Nộp trễ",
      className: "bg-yellow-500/30 border border-yellow-400/40 text-yellow-300",
    },
    MISSING: {
      label: "Quá hạn",
      className: "bg-rose-500/30 border border-rose-400/40 text-rose-300",
    },
  };

  const currentConfig = config[status] || config.ASSIGNED;

  return (
    <span
      className={`px-3 py-1 rounded-lg text-[11px] font-bold backdrop-blur-sm ${currentConfig.className}`}
    >
      {currentConfig.label}
    </span>
  );
}

function TodayHomeworkSection({
  assignments,
  onViewAll,
  locale,
  onAssignmentClick,
}: {
  assignments: AssignmentListItem[];
  onViewAll: () => void;
  locale: string;
  onAssignmentClick: (id: string) => void;
}) {
  const todayAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        if (a.status === "SUBMITTED" || a.status === "LATE") return false;
        return isToday(a.dueAt);
      })
      .slice(0, 3);
  }, [assignments]);

  if (todayAssignments.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl p-4 border border-purple-500/30 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-xl shadow-lg shadow-purple-900/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/40">
            <AlertCircle size={18} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-lg">Bài tập hạn hôm nay</h2>
          <span className="bg-orange-500/30 border border-orange-400/40 text-orange-300 px-2 py-0.5 rounded-full text-xs font-bold">
            {todayAssignments.length}
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="text-purple-300 hover:text-white text-sm font-semibold flex items-center gap-1 transition-colors"
        >
          Xem tất cả <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {todayAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="rounded-xl p-3 flex items-start gap-3 cursor-pointer border border-purple-500/20 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-sm hover:border-purple-400/50 hover:from-slate-900/90 transition-all"
            onClick={() => onAssignmentClick(assignment.id)}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
              {getTypeIcon(assignment.submissionType || "")}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-white line-clamp-1">
                {assignment.assignmentTitle}
              </h3>
              <p className="text-xs text-purple-300 mt-0.5 line-clamp-1">
                {assignment.classTitle}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={10} className="text-orange-400" />
                <span className="text-[10px] font-semibold text-orange-400">
                  {formatDateTime(assignment.dueAt, locale)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Main component
export default function HomeworkPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("DUE_DATE_ASC");
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_DELAY);

  // Page load animation
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // Fetch homework from API
  useEffect(() => {
    const fetchHomework = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response =
          statusFilter === "FEEDBACK"
            ? await getStudentHomeworkFeedback({
                pageNumber: 1,
                pageSize: PAGE_SIZE,
              })
            : statusFilter === "SUBMITTED"
              ? await getStudentSubmittedHomework({
                  pageNumber: 1,
                  pageSize: PAGE_SIZE,
                })
              : await getStudentHomework({
                  pageNumber: 1,
                  pageSize: PAGE_SIZE,
                });

        if (response.isSuccess && response.data?.homeworkAssignments?.items) {
          setAssignments(response.data.homeworkAssignments.items);
        } else {
          setAssignments([]);
        }
      } catch (err) {
        console.error("Error fetching homework:", err);
        setError("Không thể tải danh sách bài tập");
        setAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomework();
  }, [statusFilter]);

  // Stats calculation
  const stats = useMemo(
    () => ({
      total: assignments.length,
      notSubmitted: assignments.filter((a) => a.status === "PENDING").length,
      submitted: assignments.filter((a) => a.status === "SUBMITTED").length,
      late: assignments.filter((a) => a.status === "LATE").length,
      missing: assignments.filter((a) => a.status === "MISSING").length,
      feedback: assignments.filter(hasGradingResult).length,
    }),
    [assignments],
  );

  // Filter and sort logic
  const filteredAssignments = useMemo(() => {
    let result = [...assignments];

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.assignmentTitle?.toLowerCase().includes(searchLower) ||
          a.classTitle?.toLowerCase().includes(searchLower) ||
          a.subject?.toLowerCase().includes(searchLower),
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL" && statusFilter !== "FEEDBACK") {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "DUE_DATE_ASC":
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        case "DUE_DATE_DESC":
          return new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime();
        case "STATUS":
          const statusOrder: Record<string, number> = {
            PENDING: 1,
            LATE: 2,
            SUBMITTED: 3,
            MISSING: 4,
          };
          return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        default:
          return 0;
      }
    });

    return result;
  }, [assignments, debouncedSearch, statusFilter, sortBy]);

  // Handlers
  const handleViewAllToday = useCallback(() => {
    setStatusFilter("PENDING");
  }, []);

  const handleAssignmentClick = useCallback(
    (assignmentId: string) => {
      router.push(`/${locale}/portal/student/homework/${assignmentId}`);
    },
    [locale, router],
  );

  // Tab options
  const homeworkTabs = useMemo(
    () => [
      { id: "ALL", label: "Tất cả", count: stats.total },
      { id: "PENDING", label: "Chưa nộp", count: stats.notSubmitted },
      { id: "SUBMITTED", label: "Đã nộp", count: stats.submitted },
      { id: "FEEDBACK", label: "Kết quả", count: stats.feedback },
      { id: "LATE", label: "Nộp trễ", count: stats.late },
      { id: "MISSING", label: "Quá hạn", count: stats.missing },
    ],
    [stats],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header Section */}
      <div
        className={`shrink-0 px-6 pt-6 pb-4 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
      >
        {/* Today's Homework Section */}
        <TodayHomeworkSection
          assignments={assignments}
          onViewAll={handleViewAllToday}
          locale={locale}
          onAssignmentClick={handleAssignmentClick}
        />

        {/* Filters Row */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {homeworkTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/30"
                    : "bg-slate-800/50 border border-purple-500/30 text-purple-300 hover:border-purple-400/50 hover:text-white backdrop-blur-sm"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === tab.id ? "bg-white/20" : "bg-purple-500/20"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-purple-500/30 rounded-xl text-purple-100 placeholder:text-purple-400/60 text-[13px] font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-lg backdrop-blur-sm"
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-900/80 border border-purple-500/30 rounded-xl text-purple-100 text-[13px] font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-lg cursor-pointer backdrop-blur-sm"
            >
              <option value="DUE_DATE_ASC">Hạn nộp: Gần nhất</option>
              <option value="DUE_DATE_DESC">Hạn nộp: Xa nhất</option>
              <option value="STATUS">Trạng thái</option>
            </select>
            <ChevronRight
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 rotate-90 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* List Content */}
      <div
        className={`flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
            <span className="ml-3 text-white font-semibold">
              Đang tải bài tập...
            </span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-white font-semibold mb-2">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-white/20 hover:bg-white/30 text-white cursor-pointer"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredAssignments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-16 h-16 text-white/50 mb-4" />
            <p className="text-white font-semibold text-lg">
              Không có bài tập nào
            </p>
            <p className="text-white/70">Danh sách bài tập trống</p>
          </div>
        )}

        {/* Assignments List */}
        {!isLoading && !error && filteredAssignments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssignments.map((assignment) => {
              const isSubmitted =
                assignment.status === "SUBMITTED" ||
                assignment.status === "LATE";
              const isLate = assignment.status === "LATE";
              const isGraded = hasGradingResult(assignment);
              const feedbackPreview = getFeedbackPreview(assignment);
              const isDueToday = isToday(assignment.dueAt) && !isSubmitted;

              return (
                <div
                  key={assignment.id}
                  onClick={() => handleAssignmentClick(assignment.id)}
                  className={`rounded-2xl overflow-hidden cursor-pointer flex flex-col border backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group ${
                    isDueToday
                      ? "border-orange-500/50 bg-gradient-to-b from-orange-500/10 to-slate-900/90 shadow-orange-500/20"
                      : isGraded
                        ? "border-cyan-500/30 bg-gradient-to-b from-cyan-500/10 to-slate-900/90 shadow-cyan-500/10"
                        : isSubmitted
                          ? isLate
                            ? "border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-slate-900/90 shadow-amber-500/10"
                            : "border-green-500/30 bg-gradient-to-b from-green-500/10 to-slate-900/90 shadow-green-500/10"
                          : "border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-slate-900/90 shadow-purple-500/10 hover:border-purple-400/50"
                  }`}
                >
                  {/* Cover Area */}
                  <div
                    className={`relative w-full h-36 flex items-center justify-center overflow-hidden ${
                      isDueToday
                        ? "bg-gradient-to-br from-orange-500/30 via-pink-500/20 to-purple-500/20"
                        : isGraded
                          ? "bg-gradient-to-br from-cyan-500/20 via-sky-500/20 to-emerald-500/20"
                          : isSubmitted
                            ? isLate
                              ? "bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20"
                              : "bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20"
                            : "bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20"
                    }`}
                  >
                    {/* Decoration blobs */}
                    <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-purple-500/20" />
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-blue-500/20" />
                    <div className="absolute top-3 right-8 w-6 h-6 rounded-full bg-pink-500/20" />

                    {/* Icon */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-16 h-16 rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-lg border ${
                          isDueToday
                            ? "bg-orange-500/40 border-orange-400/40"
                            : isGraded
                              ? "bg-cyan-500/40 border-cyan-400/40"
                              : isSubmitted
                                ? isLate
                                  ? "bg-amber-500/40 border-amber-400/40"
                                  : "bg-green-500/40 border-green-400/40"
                                : "bg-purple-500/40 border-purple-400/40"
                        }`}
                      >
                        {isGraded ? (
                          <Award size={32} className="text-cyan-200" />
                        ) : isSubmitted ? (
                          <CheckCircle
                            size={32}
                            className={
                              isLate ? "text-amber-400" : "text-green-400"
                            }
                          />
                        ) : (
                          getTypeIcon(assignment.submissionType || "")
                        )}
                      </div>
                      {isDueToday && (
                        <span className="absolute -bottom-6 whitespace-nowrap bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg">
                          Hạn hôm nay
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2 z-20">
                      <StatusBadge
                        status={assignment.status}
                        score={assignment.score}
                        maxScore={assignment.maxScore}
                        isGraded={isGraded}
                      />
                    </div>

                    {/* Help Button */}
                    {!isSubmitted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="absolute bottom-2 right-2 z-20 w-8 h-8 rounded-full bg-yellow-400/80 hover:bg-yellow-400 shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                      >
                        <HelpCircle size={18} className="text-violet-600" />
                      </button>
                    )}

                    {/* Submitted overlay */}
                    {isSubmitted && (
                      <div
                        className={`absolute bottom-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm shadow-sm ${
                          isGraded
                            ? "border border-cyan-500/20"
                            : "border border-green-500/20"
                        }`}
                      >
                        {isGraded ? (
                          <Award size={12} className="text-cyan-300" />
                        ) : (
                          <CheckCircle
                            size={12}
                            className={
                              isLate ? "text-amber-400" : "text-green-400"
                            }
                          />
                        )}
                        <span
                          className={`text-[10px] font-bold ${
                            isGraded
                              ? "text-cyan-200"
                              : isLate
                                ? "text-amber-300"
                                : "text-green-300"
                          }`}
                        >
                          {isGraded ? "Đã chấm" : isLate ? "Nộp trễ" : "Đã nộp"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-3 flex flex-col flex-1">
                    <h3
                      className={`font-bold text-[13px] leading-snug mb-1 line-clamp-2 ${
                        isSubmitted ? "text-slate-400" : "text-white"
                      }`}
                    >
                      {assignment.assignmentTitle}
                    </h3>

                    <div
                      className={`flex items-center gap-1.5 text-[11px] font-semibold mb-2 ${isSubmitted ? "text-slate-500" : "text-purple-300"}`}
                    >
                      <BookOpen size={11} />
                      <span className="truncate">{assignment.classTitle}</span>
                      <span className="text-purple-500">•</span>
                      <span>
                        {getTypeLabel(assignment.submissionType || "")}
                      </span>
                    </div>

                    <div className="space-y-0.5 mb-3 mt-auto">
                      {assignment.submittedAt && (
                        <span
                          className={`text-[11px] font-semibold flex items-center gap-1.5 ${isLate ? "text-amber-400" : "text-green-400"}`}
                        >
                          <Calendar size={12} /> Đã nộp:{" "}
                          {formatDate(assignment.submittedAt, locale)}
                        </span>
                      )}
                      <span
                        className={`text-[11px] flex items-center gap-1.5 font-bold ${
                          isDueToday
                            ? "text-orange-400"
                            : isLate
                              ? "text-amber-500"
                              : isSubmitted
                                ? "text-slate-500"
                                : "text-purple-400"
                        }`}
                      >
                        <Clock size={12} /> Hạn:{" "}
                        {formatDateTime(assignment.dueAt, locale)}
                        {isTomorrow(assignment.dueAt) && !isSubmitted && (
                          <span className="ml-1 text-[9px] bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 px-1.5 py-0.5 rounded-full">
                            Ngày mai
                          </span>
                        )}
                      </span>
                    </div>

                    {isGraded && (
                      <div className="mb-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-cyan-100">
                          <span>
                            {assignment.score !== null
                              ? `Điểm: ${assignment.score}/${assignment.maxScore ?? "-"}`
                              : "Đã có kết quả chấm bài"}
                          </span>
                          {assignment.gradedAt && (
                            <span className="text-[10px] text-cyan-200/80">
                              {formatDate(assignment.gradedAt, locale)}
                            </span>
                          )}
                        </div>
                        {feedbackPreview && (
                          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-cyan-50/90">
                            {feedbackPreview}
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      className={`w-full h-9 rounded-xl text-[12px] font-bold shadow-md hover:shadow-lg mt-auto cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        isGraded
                          ? "bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white"
                          : isSubmitted
                            ? isLate
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                              : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                            : isDueToday
                              ? "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white animate-pulse"
                              : "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
                      }`}
                    >
                      {isGraded ? (
                        <>
                          <Award size={14} /> Xem kết quả
                        </>
                      ) : isSubmitted ? (
                        <>
                          <CheckCircle size={14} /> Xem lại
                        </>
                      ) : isDueToday ? (
                        <>
                          <Clock size={14} /> Nộp gấp
                        </>
                      ) : (
                        <>
                          <ChevronRight size={14} /> Nộp bài
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
