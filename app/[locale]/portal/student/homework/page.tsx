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
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/lightswind/card";
import { Button } from "@/components/lightswind/button";
import { FilterTabs, TabOption } from "@/components/portal/student/FilterTabs";
import type {
  AssignmentListItem,
  SortOption,
} from "@/types/student/homework";
import { getStudentHomework } from "@/lib/api/studentService";

// Constants
const PAGE_SIZE = 50;
const DEBOUNCE_DELAY = 300;

// Helper functions
const getTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    "File": "Nộp file",
    "Quiz": "Trắc nghiệm",
    "Essay": "Bài viết",
    "PROJECT": "Dự án",
    "PRESENTATION": "Thuyết trình",
    FILE_UPLOAD: "Nộp file",
    ESSAY: "Bài viết",
    QUIZ: "Trắc nghiệm",
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
      return <CheckCircle size={24} />;
    case "ESSAY":
      return <FileText size={24} />;
    case "PROJECT":
      return <BookOpen size={24} />;
    case "PRESENTATION":
      return <Award size={24} />;
    default:
      return <FileText size={24} />;
  }
};

const formatDate = (dateString: string, locale: string = 'vi-VN') => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const isToday = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  } catch {
    return false;
  }
};

const isTomorrow = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  } catch {
    return false;
  }
};

const isThisWeek = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    return date > today && date <= weekLater;
  } catch {
    return false;
  }
};

// Sub-components
function StatusBadge({ 
  status, 
  score, 
  maxScore 
}: { 
  status: string; 
  score?: number | null; 
  maxScore?: number;
}) {
  const config: Record<string, { label: string; className: string }> = {
    SUBMITTED: {
      label: score !== undefined && score !== null ? `Đã nộp - ${score}/${maxScore}` : "Đã nộp",
      className: "bg-emerald-100 text-emerald-700",
    },
    ASSIGNED: {
      label: "Chưa nộp",
      className: "bg-amber-100 text-amber-700",
    },
    PENDING: {
      label: "Chờ chấm",
      className: "bg-blue-100 text-blue-700",
    },
    LATE: {
      label: "Nộp trễ",
      className: "bg-yellow-100 text-yellow-700",
    },
    MISSING: {
      label: "Quá hạn",
      className: "bg-rose-100 text-rose-700",
    },
  };

  const currentConfig = config[status] || config.ASSIGNED;

  return (
    <span className={`px-3 py-1 rounded-lg text-[11px] font-bold ${currentConfig.className}`}>
      {currentConfig.label}
    </span>
  );
}

function TodayHomeworkSection({ 
  assignments, 
  onViewAll,
  locale,
  onAssignmentClick
}: { 
  assignments: AssignmentListItem[];
  onViewAll: () => void;
  locale: string;
  onAssignmentClick: (id: string) => void;
}) {
  const todayAssignments = useMemo(() => {
    return assignments
      .filter(a => {
        if (a.status === 'SUBMITTED' || a.status === 'LATE') return false;
        return isToday(a.dueAt);
      })
      .slice(0, 3); // Giới hạn 3 bài để tránh quá tải
  }, [assignments]);

  if (todayAssignments.length === 0) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <AlertCircle size={18} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-lg">Bài tập hạn hôm nay</h2>
          <span className="bg-white/30 text-white px-2 py-0.5 rounded-full text-xs font-bold">
            {todayAssignments.length}
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="text-white/90 hover:text-white text-sm font-semibold flex items-center gap-1"
        >
          Xem tất cả <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {todayAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white/90 backdrop-blur rounded-xl p-3 flex items-start gap-3 cursor-pointer hover:bg-white transition-all"
            onClick={() => onAssignmentClick(assignment.id)}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shrink-0">
              {getTypeIcon(assignment.submissionType || "")}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-slate-800 line-clamp-1">
                {assignment.assignmentTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {assignment.classTitle}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={10} className="text-orange-500" />
                <span className="text-[10px] font-semibold text-orange-600">
                  {formatDate(assignment.dueAt, locale)}
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
        let apiStatus: number | undefined;
        if (statusFilter === "PENDING") apiStatus = 1;
        else if (statusFilter === "SUBMITTED") apiStatus = 2;
        else if (statusFilter === "MISSING") apiStatus = 3;
        
        const response = await getStudentHomework({
          status: apiStatus,
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
  const stats = useMemo(() => ({
    total: assignments.length,
    notSubmitted: assignments.filter(a => a.status === 'PENDING').length,
    submitted: assignments.filter(a => a.status === 'SUBMITTED').length,
    late: assignments.filter(a => a.status === 'LATE').length,
    missing: assignments.filter(a => a.status === 'MISSING').length,
  }), [assignments]);

  // Filter and sort logic
  const filteredAssignments = useMemo(() => {
    let result = [...assignments];
    
    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(a => 
        a.assignmentTitle?.toLowerCase().includes(searchLower) || 
        a.classTitle?.toLowerCase().includes(searchLower) ||
        a.subject?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "ALL") {
      result = result.filter(a => a.status === statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "DUE_DATE_ASC":
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        case "DUE_DATE_DESC":
          return new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime();
        case "STATUS":
          const statusOrder: Record<string, number> = { 'PENDING': 1, 'LATE': 2, 'SUBMITTED': 3, 'MISSING': 4 };
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

  const handleAssignmentClick = useCallback((assignmentId: string) => {
    router.push(`/${locale}/portal/student/homework/${assignmentId}`);
  }, [locale, router]);

  // Tab options
  const homeworkTabs: TabOption[] = useMemo(() => [
    { id: 'ALL', label: 'Tất cả', count: stats.total },
    { id: 'PENDING', label: 'Chưa nộp', count: stats.notSubmitted },
    { id: 'SUBMITTED', label: 'Đã nộp', count: stats.submitted },
    { id: 'LATE', label: 'Nộp trễ', count: stats.late },
    { id: 'MISSING', label: 'Quá hạn', count: stats.missing },
  ], [stats]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header Section */}
      <div className={`shrink-0 px-6 pt-6 pb-4 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="mb-6">
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">Bài tập</h1>
          <p className="text-white mt-1 font-semibold text-base">Quản lý và nộp bài tập của bạn</p>
        </div>

        {/* Today's Homework Section */}
        <TodayHomeworkSection 
          assignments={assignments}
          onViewAll={handleViewAllToday}
          locale={locale}
          onAssignmentClick={handleAssignmentClick}
        />

        {/* Filters Row */}
        <FilterTabs
          tabs={homeworkTabs}
          activeTab={statusFilter}
          onChange={setStatusFilter}
          variant="outline"
          size="md"
          className="mb-4"
        />

        {/* Search & Sort Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border-none rounded-xl text-slate-950 placeholder:text-slate-500 text-[13px] font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm"
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border-none rounded-xl text-slate-950 text-[13px] font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="DUE_DATE_ASC">Hạn nộp: Gần nhất</option>
              <option value="DUE_DATE_DESC">Hạn nộp: Xa nhất</option>
              <option value="STATUS">Trạng thái</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Content */}
      <div className={`flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
            <span className="ml-3 text-white font-semibold">Đang tải bài tập...</span>
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
            <p className="text-white font-semibold text-lg">Không có bài tập nào</p>
            <p className="text-white/70">Danh sách bài tập trống</p>
          </div>
        )}

        {/* Assignments List */}
        {!isLoading && !error && filteredAssignments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssignments.map((assignment) => {
              const isSubmitted = assignment.status === 'SUBMITTED' || assignment.status === 'LATE';
              const isLate = assignment.status === 'LATE';
              const isDueToday = isToday(assignment.dueAt) && !isSubmitted;

              return (
                <Card
                  key={assignment.id}
                  hoverable
                  onClick={() => handleAssignmentClick(assignment.id)}
                  className={`bg-white/90 backdrop-blur-xl border rounded-2xl overflow-hidden cursor-pointer flex flex-col shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${
                    isDueToday ? 'ring-2 ring-orange-400 ring-offset-2' : ''
                  } ${
                    isSubmitted
                      ? isLate ? 'border-amber-200/80' : 'border-emerald-200/80'
                      : 'border-white/60'
                  }`}
                >
                  {/* Cover Image Area */}
                  <div className={`relative w-full h-36 flex items-center justify-center overflow-hidden ${
                    isDueToday ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500' :
                    isSubmitted
                      ? isLate ? 'bg-gradient-to-br from-amber-200 via-orange-200 to-yellow-200' : 'bg-gradient-to-br from-emerald-200 via-teal-200 to-cyan-200'
                      : 'bg-gradient-to-br from-violet-300 via-purple-300 to-fuchsia-300'
                  }`}>
                    {/* Colorful decoration blobs */}
                    <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-white/40" />
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/30" />
                    <div className="absolute top-3 right-8 w-6 h-6 rounded-full bg-white/40" />

                    {/* Icon */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-md bg-white/80`}>
                        {isSubmitted ? (
                          <CheckCircle size={32} className={isLate ? 'text-amber-500' : 'text-emerald-500'} />
                        ) : (
                          getTypeIcon(assignment.submissionType || "")
                        )}
                      </div>
                      {isDueToday && (
                        <span className="absolute -bottom-6 whitespace-nowrap bg-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
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
                      />
                    </div>

                    {/* Help Button */}
                    {!isSubmitted && (
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="absolute bottom-2 right-2 z-20 w-8 h-8 rounded-full bg-yellow-400 hover:bg-yellow-500 shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
                      >
                        <HelpCircle size={18} className="text-violet-600" />
                      </button>
                    )}

                    {/* Submitted overlay */}
                    {isSubmitted && (
                      <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow-sm">
                        <CheckCircle size={12} className={isLate ? 'text-amber-500' : 'text-emerald-500'} />
                        <span className={`text-[10px] font-bold ${isLate ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {isLate ? 'Nộp trễ' : 'Đã nộp'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-3 flex flex-col flex-1">
                    {/* Title */}
                    <h3 className={`font-bold text-[13px] leading-snug mb-1 line-clamp-2 ${
                      isSubmitted ? 'text-slate-700' : 'text-slate-950'
                    }`}>
                      {assignment.assignmentTitle}
                    </h3>

                    {/* Class & Type */}
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold mb-2 ${
                      isSubmitted ? 'text-slate-500' : 'text-slate-600'
                    }`}>
                      <BookOpen size={11} />
                      <span className="truncate">{assignment.classTitle}</span>
                      <span className="text-slate-400">•</span>
                      <span className={isSubmitted ? 'text-slate-400' : 'text-slate-500'}>
                        {getTypeLabel(assignment.submissionType || "")}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="space-y-0.5 mb-3 mt-auto">
                      {assignment.submittedAt && (
                        <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${isLate ? 'text-amber-600' : 'text-emerald-600'}`}>
                          <Calendar size={12} /> Đã nộp: {formatDate(assignment.submittedAt, locale)}
                        </span>
                      )}
                      <span className={`text-[11px] flex items-center gap-1.5 font-bold ${
                        isDueToday ? 'text-orange-600' :
                        isLate ? 'text-amber-500' : 
                        isSubmitted ? 'text-slate-500' : 'text-violet-600'
                      }`}>
                        <Clock size={12} /> Hạn: {formatDate(assignment.dueAt, locale)}
                        {isTomorrow(assignment.dueAt) && !isSubmitted && (
                          <span className="ml-1 text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                            Ngày mai
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button
                      size="sm"
                      className={`w-full h-9 rounded-xl text-[12px] font-bold shadow-md hover:shadow-lg mt-auto cursor-pointer transition-all duration-200 ${
                        isSubmitted
                          ? isLate
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white'
                            : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white'
                          : isDueToday
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white animate-pulse'
                            : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white hover:shadow-violet-300'
                      }`}
                    >
                      {isSubmitted ? "Xem lại" : isDueToday ? "Nộp gấp" : "Nộp bài"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}