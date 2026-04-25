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
  UserPlus,
  School,
  RotateCcw,
  Ban,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import type { PlacementTest } from "@/types/placement-test";
import { formatDateTime } from "@/lib/utils";

function formatTableScheduledAt(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return formatDateTime(date.toISOString());
}

type StatusType = "Scheduled" | "Completed" | "Cancelled" | "NoShow";

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
  readOnly?: boolean;
  onEdit?: (test: PlacementTest) => void;
  onAddResult?: (test: PlacementTest) => void;
  onAddNote?: (test: PlacementTest) => void;
  onCancel?: (test: PlacementTest) => void;
  onNoShow?: (test: PlacementTest) => void;
  onCreateAccount?: (test: PlacementTest) => void;
  onStartRegistration?: (test: PlacementTest) => void;
  onRetake?: (test: PlacementTest) => void;
  onRefresh?: () => void;
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
  readOnly = false,
  onEdit,
  onAddResult,
  onAddNote,
  onCancel,
  onNoShow,
  onCreateAccount,
  onStartRegistration,
  onRetake,
  onRefresh,
}: PlacementTestTableProps) {
  const testsArray = Array.isArray(tests) ? tests : [];
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getStatusBadge = (statusText: string) => {
    const statusMap: Record<
      string,
      { bg: string; text: string; border: string; icon: any }
    > = {
      "Đã lên lịch": {
        bg: "from-blue-50 to-blue-100",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: Clock,
      },
      "Đã hoàn thành": {
        bg: "from-green-50 to-green-100",
        text: "text-green-700",
        border: "border-green-200",
        icon: CheckCircle2,
      },
      "Đã hủy": {
        bg: "from-red-50 to-red-100",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
      },
      "Không đến": {
        bg: "from-amber-50 to-amber-100",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: AlertCircle,
      },
    };
    const config = statusMap[statusText] || statusMap["Đã lên lịch"];
    const Icon = config.icon;
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-linear-to-r ${config.bg} ${config.text} border ${config.border}`}
      >
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
      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-linear-to-r from-red-100 to-red-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!testsArray || testsArray.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-r from-red-100 to-red-200">
          <FileText size={24} className="text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Không có placement test nào
        </h3>
        <p className="text-sm text-gray-500">
          Hãy tạo placement test mới hoặc điều chỉnh bộ lọc
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Danh sách kiểm tra đầu vào
          </h3>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
            <tr>
              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort?.("childName")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                >
                  Tên trẻ
                  <ArrowUpDown
                    size={14}
                    className={
                      sortKey === "childName" ? "text-red-600" : "text-gray-400"
                    }
                  />
                </button>
              </th>
              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort?.("leadContactName")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                >
                  Phụ huynh
                  <ArrowUpDown
                    size={14}
                    className={
                      sortKey === "leadContactName"
                        ? "text-red-600"
                        : "text-gray-400"
                    }
                  />
                </button>
              </th>
              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort?.("scheduledAt")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                >
                  Thời gian
                  <ArrowUpDown
                    size={14}
                    className={
                      sortKey === "scheduledAt"
                        ? "text-red-600"
                        : "text-gray-400"
                    }
                  />
                </button>
              </th>
              <th className="py-3 px-6 text-left">
                <span className="text-sm font-semibold text-gray-700">
                  Người giám sát
                </span>
              </th>
              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort?.("status")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                >
                  Trạng thái
                  <ArrowUpDown
                    size={14}
                    className={
                      sortKey === "status" ? "text-red-600" : "text-gray-400"
                    }
                  />
                </button>
              </th>
              <th className="py-3 px-6 text-left">
                <span className="text-sm font-semibold text-gray-700">
                  Thao tác
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-100">
            {testsArray.map((test) => (
              <tr
                key={test.id}
                className="group hover:bg-linear-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
              >
                {/* Tên trẻ */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-linear-to-r from-red-600 to-red-700 flex items-center justify-center text-white font-semibold text-xs">
                      {test.childName
                        ? test.childName
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "??"}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {test.childName || "N/A"}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Phụ huynh */}
                <td className="py-4 px-6">
                  <div className="font-medium text-gray-700">
                    {test.leadContactName || "N/A"}
                  </div>
                </td>

                {/* Thời gian */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{formatTableScheduledAt(test.scheduledAt)}</span>
                  </div>
                  {test.room && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Phòng: {test.room}
                    </div>
                  )}
                </td>

                {/* Người giám sát */}
                <td className="py-4 px-6">
                  {test.invigilatorName ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-linear-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-semibold">
                        {test.invigilatorName.split(" ").pop()?.[0] || "N"}
                      </div>
                      <span className="font-medium text-gray-900">
                        {test.invigilatorName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">
                      Chưa phân công
                    </span>
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
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>

                    {!readOnly && (
                      <>
                        {test.status === "Scheduled" && onEdit && (
                          <button
                            onClick={() => onEdit(test)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </button>
                        )}

                        {test.status === "Scheduled" && onAddResult && (
                          <button
                            onClick={() => onAddResult(test)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            title="Nhập kết quả"
                          >
                            <FileText size={14} />
                          </button>
                        )}

                        {/* More actions dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === test.id ? null : test.id,
                              )
                            }
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
                              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-red-200 bg-white shadow-lg py-1">
                                {(() => {
                                  const shouldShowCreateAccount =
                                    !test.isAccountProfileCreated;
                                  return (
                                    <>
                                      {test.status === "Scheduled" && (
                                        <>
                                          {onNoShow && (
                                            <button
                                              onClick={() => {
                                                onNoShow(test);
                                                setOpenMenuId(null);
                                              }}
                                              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                            >
                                              <AlertCircle size={14} />
                                              Đánh dấu không đến
                                            </button>
                                          )}
                                          {onCancel && (
                                            <button
                                              onClick={() => {
                                                onCancel(test);
                                                setOpenMenuId(null);
                                              }}
                                              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                            >
                                              <Ban size={14} />
                                              Hủy lịch test
                                            </button>
                                          )}
                                        </>
                                      )}
                                      {onAddNote && (
                                        <button
                                          onClick={() => {
                                            onAddNote(test);
                                            setOpenMenuId(null);
                                          }}
                                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                        >
                                          <MessageSquare size={14} />
                                          Thêm ghi chú
                                        </button>
                                      )}
                                      {test.status === "Completed" &&
                                        shouldShowCreateAccount &&
                                        onCreateAccount && (
                                          <button
                                            onClick={() => {
                                              onCreateAccount(test);
                                              setOpenMenuId(null);
                                            }}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                          >
                                            <UserPlus size={14} />
                                            Tạo tài khoản & Profile
                                          </button>
                                        )}
                                      {test.status === "Completed" &&
                                        onStartRegistration && (
                                          <button
                                            onClick={() => {
                                              onStartRegistration(test);
                                              setOpenMenuId(null);
                                            }}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                          >
                                            <School size={14} />
                                            Bắt đầu đăng ký
                                          </button>
                                        )}
                                      {test.status === "Completed" &&
                                        onRetake && (
                                          <button
                                            onClick={() => {
                                              onRetake(test);
                                              setOpenMenuId(null);
                                            }}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                          >
                                            <RotateCcw size={14} />
                                            Retake
                                          </button>
                                        )}
                                    </>
                                  );
                                })()}
                              </div>
                            </>
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

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="border-t border-red-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-semibold text-gray-900">{totalCount}</span>{" "}
              placement test
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
                    onClick={() =>
                      typeof page === "number" && onPageChange(page)
                    }
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
