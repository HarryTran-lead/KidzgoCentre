"use client";

import {
  CheckCircle2,
  PauseCircle,
  XCircle,
  ArrowUpDown,
  Eye,
  Calendar,
  Pause,
  Play,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import type { Enrollment } from "@/types/enrollment";

type StatusType = "Active" | "Paused" | "Dropped";

const STATUS_MAPPING: Record<StatusType, string> = {
  Active: "Đang học",
  Paused: "Tạm nghỉ",
  Dropped: "Đã nghỉ",
};

interface EnrollmentTableProps {
  enrollments: Enrollment[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onView: (enrollment: Enrollment) => void;
  onPageChange: (page: number) => void;
  sortKey?: string | null;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  readOnly?: boolean;
  onPause?: (enrollment: Enrollment) => void;
  onDrop?: (enrollment: Enrollment) => void;
  onReactivate?: (enrollment: Enrollment) => void;
  onManageScheduleSegment?: (enrollment: Enrollment) => void;
  canManageScheduleSegment?: (enrollment: Enrollment) => boolean;
  onRefresh?: () => void;
}

export default function EnrollmentTable({
  enrollments,
  isLoading,
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onView,
  onPageChange,
  sortKey,
  sortDir,
  onSort,
  readOnly = false,
  onPause,
  onDrop,
  onReactivate,
  onManageScheduleSegment,
  canManageScheduleSegment,
  onRefresh,
}: EnrollmentTableProps) {
  const enrollmentsArray = Array.isArray(enrollments) ? enrollments : [];

  const getStatusBadge = (status: string) => {
    const statusText = STATUS_MAPPING[status as StatusType] || status;
    const statusMap: Record<string, { bg: string; text: string; border: string; icon: any }> = {
      "Đang học": {
    bg: "from-green-50 to-green-100",
    text: "text-green-700",
    border: "border-green-200",
    icon: CheckCircle2
  },
  "Tạm nghỉ": {
    bg: "from-amber-50 to-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: PauseCircle
  },
  "Đã nghỉ": {
    bg: "from-red-50 to-red-100",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle
  }
    };
    const config = statusMap[statusText] || statusMap["Đang học"];
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-linear-to-r ${config.bg} ${config.text} border ${config.border}`}>
        <Icon size={12} />
        <span>{statusText}</span>
      </div>
    );
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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
    return pages;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: string }) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-gray-600  cursor-pointer hover:bg-red-50/50 transition-colors"
      onClick={() => onSort?.(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          size={14}
          className={`transition-colors ${sortKey === sortKeyName ? "text-red-600" : "text-gray-300"}`}
        />
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 overflow-hidden p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (enrollmentsArray.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 p-12 text-center">
        <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Chưa có dữ liệu ghi danh</h3>
        <p className="text-gray-400">Tạo ghi danh mới để bắt đầu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
      <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách Ghi danh</h3>
          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <RefreshCw size={14} /> Làm mới
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-red-200 bg-linear-to-r from-red-500/5 to-red-700/5">
              <SortHeader label="Học viên" sortKeyName="studentName" />
              <SortHeader label="Lớp" sortKeyName="classTitle" />
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 ">Mã lớp</th>
              <SortHeader label="Ngày GD" sortKeyName="enrollDate" />
              <SortHeader label="Trạng thái" sortKeyName="status" />
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 ">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {enrollmentsArray.map((enrollment, index) => (
              <tr
                key={enrollment.id}
                className="border-b border-red-100 hover:bg-red-50/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{enrollment.studentName || "N/A"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{enrollment.classTitle || "N/A"}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {enrollment.classCode || "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDate(enrollment.enrollDate)}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(enrollment.status)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onView(enrollment)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                    {onManageScheduleSegment && (
                      <button
                        onClick={() => onManageScheduleSegment(enrollment)}
                        disabled={canManageScheduleSegment ? !canManageScheduleSegment(enrollment) : false}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 transition-colors text-gray-400 hover:text-indigo-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          canManageScheduleSegment && !canManageScheduleSegment(enrollment)
                            ? "Chỉ áp dụng cho chương trình bù"
                            : "Quản lý Schedule Segment"
                        }
                      >
                        <Calendar size={16} />
                      </button>
                    )}
                    {!readOnly && enrollment.status === "Active" && (
                      <>
                        <button
                          onClick={() => onPause?.(enrollment)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors text-gray-400 hover:text-amber-600 cursor-pointer"
                          title="Tạm nghỉ"
                        >
                          <Pause size={16} />
                        </button>
                        <button
                          onClick={() => onDrop?.(enrollment)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          title="Cho nghỉ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {!readOnly && enrollment.status === "Paused" && (
                      <button
                        onClick={() => onReactivate?.(enrollment)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-gray-400 hover:text-emerald-600 cursor-pointer"
                        title="Kích hoạt lại"
                      >
                        <Play size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="border-t border-red-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold text-gray-900">
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)}
              </span> trong tổng số{" "}
              <span className="font-semibold text-gray-900">{totalCount}</span> ghi danh
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Trang trước"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === "number" && onPageChange(page)}
                    disabled={page === "..."}
                    className={`min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      page === currentPage
                        ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
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
                aria-label="Trang sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}