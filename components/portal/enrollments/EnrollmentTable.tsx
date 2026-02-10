"use client";

import {
  CheckCircle2,
  PauseCircle,
  XCircle,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Pause,
  Play,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
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
  onPause?: (enrollment: Enrollment) => void;
  onDrop?: (enrollment: Enrollment) => void;
  onReactivate?: (enrollment: Enrollment) => void;
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
  onPause,
  onDrop,
  onReactivate,
}: EnrollmentTableProps) {
  const enrollmentsArray = Array.isArray(enrollments) ? enrollments : [];
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const statusText = STATUS_MAPPING[status as StatusType] || status;
    const statusMap: Record<string, { bg: string; text: string; border: string; icon: any }> = {
      "Đang học": { bg: "from-emerald-50 to-teal-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
      "Tạm nghỉ": { bg: "from-amber-50 to-orange-50", text: "text-amber-700", border: "border-amber-200", icon: PauseCircle },
      "Đã nghỉ": { bg: "from-rose-50 to-pink-50", text: "text-rose-700", border: "border-rose-200", icon: XCircle },
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
      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-pink-50/50 transition-colors"
      onClick={() => onSort?.(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          size={14}
          className={`transition-colors ${sortKey === sortKeyName ? "text-pink-500" : "text-gray-300"}`}
        />
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-white overflow-hidden p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-300 border-t-pink-600 rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (enrollmentsArray.length === 0) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-white p-12 text-center">
        <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Chưa có dữ liệu ghi danh</h3>
        <p className="text-gray-400">Tạo ghi danh mới để bắt đầu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pink-100 bg-linear-to-r from-pink-50 to-rose-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
              <SortHeader label="Học viên" sortKeyName="studentName" />
              <SortHeader label="Lớp" sortKeyName="classTitle" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã lớp</th>
              <SortHeader label="Ngày GD" sortKeyName="enrollDate" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Chương trình</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">GVCN</th>
              <SortHeader label="Trạng thái" sortKeyName="status" />
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {enrollmentsArray.map((enrollment, index) => (
              <tr
                key={enrollment.id}
                className="border-b border-pink-50 hover:bg-pink-50/30 transition-colors"
              >
                <td className="px-4 py-3 text-gray-500">
                  {(currentPage - 1) * pageSize + index + 1}
                </td>
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
                <td className="px-4 py-3 text-gray-600">
                  {enrollment.programName || "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {enrollment.mainTeacherName || "N/A"}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(enrollment.status)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === enrollment.id ? null : enrollment.id)}
                      className="p-1.5 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                      <MoreVertical size={16} className="text-gray-500" />
                    </button>
                    {openMenuId === enrollment.id && (
                      <>
                        <div
                          className="fixed inset-0 z-9998"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-9999 min-w-44">
                          <button
                            onClick={() => {
                              onView(enrollment);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye size={14} />
                            Xem chi tiết
                          </button>
                          {enrollment.status === "Active" && (
                            <button
                              onClick={() => {
                                onPause?.(enrollment);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                            >
                              <Pause size={14} />
                              Tạm nghỉ
                            </button>
                          )}
                          {enrollment.status === "Active" && (
                            <button
                              onClick={() => {
                                onDrop?.(enrollment);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 size={14} />
                              Cho nghỉ
                            </button>
                          )}
                          {(enrollment.status === "Paused" || enrollment.status === "Dropped") && (
                            <button
                              onClick={() => {
                                onReactivate?.(enrollment);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                            >
                              <Play size={14} />
                              Kích hoạt lại
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-pink-100 px-4 py-3">
          <p className="text-sm text-gray-500">
            Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, totalCount)} / {totalCount} kết quả
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-pink-50 transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers().map((page, idx) =>
              typeof page === "string" ? (
                <span key={`dots-${idx}`} className="px-2 text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`min-w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    currentPage === page
                      ? "bg-linear-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-pink-50"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-pink-50 transition-colors disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
