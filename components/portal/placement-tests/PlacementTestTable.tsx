"use client";

import {
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowUpDown,
  MoreVertical,
  Edit,
  Eye,
  FileText,
  UserCheck,
  Ban,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import type { PlacementTest } from "@/types/placement-test";
import { formatDateTime } from "@/lib/utils";

type StatusType = 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow';

const STATUS_MAPPING: Record<StatusType, string> = {
  Scheduled: "Đã lên lịch",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
  NoShow: "Không đến",
};

interface PlacementTestTableProps {
  tests: PlacementTest[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onView: (test: PlacementTest) => void;
  onPageChange: (page: number) => void;
  sortKey?: string | null;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onEdit?: (test: PlacementTest) => void;
  onAddResult?: (test: PlacementTest) => void;
  onAddNote?: (test: PlacementTest) => void;
  onCancel?: (test: PlacementTest) => void;
  onNoShow?: (test: PlacementTest) => void;
  onConvertToEnrolled?: (test: PlacementTest) => void;
}

export default function PlacementTestTable({
  tests,
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
  onEdit,
  onAddResult,
  onAddNote,
  onCancel,
  onNoShow,
  onConvertToEnrolled,
}: PlacementTestTableProps) {
  const testsArray = Array.isArray(tests) ? tests : [];
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getStatusBadge = (statusText: string) => {
    const statusMap: Record<string, { bg: string; text: string; border: string; icon: any }> = {
      "Đã lên lịch": { bg: "from-blue-50 to-cyan-50", text: "text-blue-700", border: "border-blue-200", icon: Clock },
      "Đã hoàn thành": { bg: "from-emerald-50 to-teal-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
      "Đã hủy": { bg: "from-rose-50 to-pink-50", text: "text-rose-700", border: "border-rose-200", icon: XCircle },
      "Không đến": { bg: "from-amber-50 to-orange-50", text: "text-amber-700", border: "border-amber-200", icon: AlertCircle },
    };
    const config = statusMap[statusText] || statusMap["Đã lên lịch"];
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

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-white p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-linear-to-r from-pink-50 to-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!testsArray || testsArray.length === 0) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-white p-12 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-linear-to-r from-pink-100 to-rose-100 flex items-center justify-center">
          <FileText size={24} className="text-pink-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có placement test nào</h3>
        <p className="text-sm text-gray-500">Hãy tạo placement test mới hoặc điều chỉnh bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-200 bg-linear-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Danh sách Placement Test</h3>
          <div className="text-sm text-gray-600">{totalCount} placement test</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-linear-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
            <tr>
              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort?.("childName")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                >
                  Tên trẻ
                  <ArrowUpDown size={14} className={sortKey === "childName" ? "text-pink-600" : "text-gray-400"} />
                </button>
              </th>
              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort?.("leadContactName")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                >
                  Phụ huynh
                  <ArrowUpDown size={14} className={sortKey === "leadContactName" ? "text-pink-600" : "text-gray-400"} />
                </button>
              </th>
              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort?.("scheduledAt")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                >
                  Thời gian
                  <ArrowUpDown size={14} className={sortKey === "scheduledAt" ? "text-pink-600" : "text-gray-400"} />
                </button>
              </th>
              <th className="py-3 px-6 text-left">
                <span className="text-sm font-semibold text-gray-700">Người giám sát</span>
              </th>
              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort?.("status")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                >
                  Trạng thái
                  <ArrowUpDown size={14} className={sortKey === "status" ? "text-pink-600" : "text-gray-400"} />
                </button>
              </th>
              <th className="py-3 px-6 text-left">
                <span className="text-sm font-semibold text-gray-700">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-100">
            {testsArray.map((test) => (
              <tr
                key={test.id}
                className="group hover:bg-linear-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
              >
                {/* Tên trẻ */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs">
                      {test.childName ? test.childName.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2) : "??"}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{test.childName || "N/A"}</div>
                    </div>
                  </div>
                </td>

                {/* Phụ huynh */}
                <td className="py-4 px-6">
                  <div className="font-medium text-gray-700">{test.leadContactName || "N/A"}</div>
                </td>

                {/* Thời gian */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{formatDateTime(test.scheduledAt)}</span>
                  </div>
                  {test.room && (
                    <div className="text-xs text-gray-400 mt-0.5">Phòng: {test.room}</div>
                  )}
                </td>

                {/* Người giám sát */}
                <td className="py-4 px-6">
                  {test.invigilatorName ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-linear-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold">
                        {test.invigilatorName.split(" ").pop()?.[0] || "N"}
                      </div>
                      <span className="font-medium text-gray-900">{test.invigilatorName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Chưa phân công</span>
                  )}
                </td>

                {/* Trạng thái */}
                <td className="py-4 px-6">
                  {getStatusBadge(STATUS_MAPPING[test.status] || test.status)}
                </td>

                {/* Thao tác */}
                <td className="py-4 px-6">
                  <div className="relative flex items-center gap-1">
                    <button
                      onClick={() => onView(test)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>

                    {test.status === "Scheduled" && onEdit && (
                      <button
                        onClick={() => onEdit(test)}
                        className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors text-gray-400 hover:text-purple-600 cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit size={14} />
                      </button>
                    )}

                    {test.status === "Scheduled" && onAddResult && (
                      <button
                        onClick={() => onAddResult(test)}
                        className="p-1.5 rounded-lg hover:bg-green-50 transition-colors text-gray-400 hover:text-green-600 cursor-pointer"
                        title="Nhập kết quả"
                      >
                        <FileText size={14} />
                      </button>
                    )}

                    {/* More actions dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === test.id ? null : test.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
                        title="Thêm"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {openMenuId === test.id && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />
                          {/* Menu */}
                          <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-pink-200 bg-white shadow-lg py-1">
                            {test.status === "Scheduled" && (
                              <>
                                {onNoShow && (
                                  <button
                                    onClick={() => { onNoShow(test); setOpenMenuId(null); }}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                  >
                                    <AlertCircle size={14} />
                                    Đánh dấu không đến
                                  </button>
                                )}
                                {onCancel && (
                                  <button
                                    onClick={() => { onCancel(test); setOpenMenuId(null); }}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                  >
                                    <Ban size={14} />
                                    Hủy lịch test
                                  </button>
                                )}
                              </>
                            )}
                            {onAddNote && (
                              <button
                                onClick={() => { onAddNote(test); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                              >
                                <MessageSquare size={14} />
                                Thêm ghi chú
                              </button>
                            )}
                            {test.status === "Completed" && onConvertToEnrolled && (
                              <button
                                onClick={() => { onConvertToEnrolled(test); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                              >
                                <UserCheck size={14} />
                                Chuyển thành học viên
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="bg-linear-to-r from-pink-500/5 to-rose-500/5 border-t border-pink-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold text-gray-900">
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)}
              </span> trong tổng số{" "}
              <span className="font-semibold text-gray-900">{totalCount}</span> placement test
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className={`min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                      page === currentPage
                        ? "bg-linear-to-r from-pink-500 to-rose-500 text-white shadow-md"
                        : page === "..."
                        ? "cursor-default text-gray-400"
                        : "border border-pink-200 hover:bg-pink-50 text-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
0