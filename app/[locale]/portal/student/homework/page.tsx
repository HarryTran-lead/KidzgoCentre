"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  BookOpen,
  ChevronDown,
  Paperclip,
  Award,
  TrendingUp,
} from "lucide-react";
import type {
  AssignmentListItem,
  AssignmentStatus,
  AssignmentType,
  HomeworkStats,
  HomeworkFilter,
  SortOption,
  AssignmentStatusConfig,
} from "@/types/student/homework";

// Status Badge Component
function StatusBadge({ status }: { status: AssignmentStatus }) {
  const config: AssignmentStatusConfig = {
    SUBMITTED: {
      variant: "success",
      label: "Đã nộp",
    },
    PENDING: {
      variant: "warning",
      label: "Chưa nộp",
    },
    MISSING: {
      variant: "danger",
      label: "Quá hạn",
    },
    LATE: {
      variant: "info",
      label: "Nộp trễ",
    },
  };

  const { variant, label } = config[status];

  const colors = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${colors[variant]}`}
    >
      {label}
    </span>
  );
}

// Stats Card Component
function StatsCard({
  icon,
  label,
  value,
  color = "indigo",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg grid place-items-center ${colorClasses[color]}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

// Sample Data
const SAMPLE_ASSIGNMENTS: AssignmentListItem[] = [
  {
    id: "1",
    title: "Bài viết: Giáng Sinh",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    assignedDate: "15/12/2024",
    dueDate: "22/12/2024",
    status: "PENDING",
    type: "ESSAY",
    submissionCount: 0,
    hasAttachments: true,
    attachmentTypes: ["PDF", "DOC"],
  },
  {
    id: "2",
    title: "Worksheet Unit 5",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    assignedDate: "18/12/2024",
    dueDate: "21/12/2024",
    status: "SUBMITTED",
    type: "FILE_UPLOAD",
    score: 9.5,
    maxScore: 10,
    submissionCount: 1,
    hasAttachments: false,
  },
  {
    id: "3",
    title: "Quiz Grammar - Present Simple",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    assignedDate: "10/12/2024",
    dueDate: "17/12/2024",
    status: "LATE",
    type: "QUIZ",
    score: 7,
    maxScore: 10,
    submissionCount: 2,
    hasAttachments: false,
  },
  {
    id: "4",
    title: "Thuyết trình nhóm: Daily Routines",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    assignedDate: "05/12/2024",
    dueDate: "12/12/2024",
    status: "MISSING",
    type: "PRESENTATION",
    submissionCount: 0,
    hasAttachments: true,
    attachmentTypes: ["PDF", "VIDEO"],
  },
  {
    id: "5",
    title: "Bài đọc hiểu: Family",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    assignedDate: "20/12/2024",
    dueDate: "27/12/2024",
    status: "PENDING",
    type: "FILE_UPLOAD",
    submissionCount: 0,
    hasAttachments: true,
    attachmentTypes: ["PDF"],
  },
];

export default function HomeworkPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("DUE_DATE_ASC");
  const [showFilters, setShowFilters] = useState(false);

  // Calculate stats
  const stats: HomeworkStats = useMemo(() => {
    const total = SAMPLE_ASSIGNMENTS.length;
    const submitted = SAMPLE_ASSIGNMENTS.filter(
      (a) => a.status === "SUBMITTED"
    ).length;
    const pending = SAMPLE_ASSIGNMENTS.filter(
      (a) => a.status === "PENDING"
    ).length;
    const missing = SAMPLE_ASSIGNMENTS.filter(
      (a) => a.status === "MISSING"
    ).length;
    const late = SAMPLE_ASSIGNMENTS.filter((a) => a.status === "LATE").length;

    const scoredAssignments = SAMPLE_ASSIGNMENTS.filter(
      (a) => a.score !== undefined
    );
    const averageScore =
      scoredAssignments.length > 0
        ? scoredAssignments.reduce((sum, a) => sum + (a.score || 0), 0) /
          scoredAssignments.length
        : undefined;

    return { total, submitted, pending, missing, late, averageScore };
  }, []);

  // Filter and sort
  const filteredAssignments = useMemo(() => {
    let result = [...SAMPLE_ASSIGNMENTS];

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter((a) => statusFilter.includes(a.status));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "DUE_DATE_ASC":
          return (
            new Date(a.dueDate.split("/").reverse().join("-")).getTime() -
            new Date(b.dueDate.split("/").reverse().join("-")).getTime()
          );
        case "DUE_DATE_DESC":
          return (
            new Date(b.dueDate.split("/").reverse().join("-")).getTime() -
            new Date(a.dueDate.split("/").reverse().join("-")).getTime()
          );
        case "STATUS":
          const statusOrder = { MISSING: 0, PENDING: 1, LATE: 2, SUBMITTED: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, statusFilter, sortBy]);

  const getTypeIcon = (type: AssignmentType) => {
    switch (type) {
      case "ESSAY":
        return <FileText size={16} />;
      case "FILE_UPLOAD":
        return <Upload size={16} />;
      case "QUIZ":
        return <CheckCircle size={16} />;
      case "PROJECT":
        return <BookOpen size={16} />;
      case "PRESENTATION":
        return <Award size={16} />;
    }
  };

  const getTypeLabel = (type: AssignmentType) => {
    switch (type) {
      case "ESSAY":
        return "Bài viết";
      case "FILE_UPLOAD":
        return "Upload file";
      case "QUIZ":
        return "Trắc nghiệm";
      case "PROJECT":
        return "Dự án";
      case "PRESENTATION":
        return "Thuyết trình";
    }
  };

  return (
    <div className="flex flex-col h-full isolate">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 pb-4 ">
        <div className="px-8 pt-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Bài tập</h1>
            <p className="text-white/60 mt-1">Quản lý và nộp bài tập của bạn</p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Status Filter Buttons - Top Left */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStatusFilter([])}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                  statusFilter.length === 0
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Tất cả ({stats.total})
              </button>
              {(
                ["PENDING", "SUBMITTED", "LATE", "MISSING"] as AssignmentStatus[]
              ).map((status) => {
                const labels = {
                  PENDING: `Chưa nộp (${stats.pending})`,
                  SUBMITTED: `Đã nộp (${stats.submitted})`,
                  LATE: `Nộp trễ (${stats.late})`,
                  MISSING: `Quá hạn (${stats.missing})`,
                };
                return (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter([status]);
                    }}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                      statusFilter.includes(status)
                        ? "bg-gray-900 text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {labels[status]}
                  </button>
                );
              })}
            </div>

            {/* Search & Sort Row */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài tập..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="DUE_DATE_ASC">Hạn nộp: Gần nhất</option>
                <option value="DUE_DATE_DESC">Hạn nộp: Xa nhất</option>
                <option value="STATUS">Trạng thái</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="px-8 pb-5 h-[600px] overflow-y-scroll">

        {/* Assignments List */}
        <div className="space-y-3">
          {filteredAssignments.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Không tìm thấy bài tập nào</p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() =>
                  router.push(
                    `/${locale}/portal/student/homework/${assignment.id}`
                  )
                }
                className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 grid place-items-center flex-shrink-0">
                    {getTypeIcon(assignment.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {assignment.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            {assignment.className}
                          </span>
                          <span>•</span>
                          <span>{assignment.subject}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(assignment.type)}
                            {getTypeLabel(assignment.type)}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={assignment.status} />
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Calendar size={14} />
                        Giao: {assignment.assignedDate}
                      </span>
                      <span
                        className={`font-medium flex items-center gap-1 ${
                          assignment.status === "MISSING" ||
                          assignment.status === "LATE"
                            ? "text-rose-600"
                            : "text-slate-900"
                        }`}
                      >
                        <Clock size={14} />
                        Hạn: {assignment.dueDate}
                      </span>
                      {assignment.hasAttachments && (
                        <span className="text-slate-600 flex items-center gap-1">
                          <Paperclip size={14} />
                          Có tài liệu
                        </span>
                      )}
                      {assignment.score !== undefined && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Award size={14} />
                          {assignment.score}/{assignment.maxScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )} 
        </div>
      </div>
    </div>
  );
}
