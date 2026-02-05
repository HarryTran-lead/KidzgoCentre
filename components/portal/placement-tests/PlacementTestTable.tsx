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
} from "lucide-react";
import { useState } from "react";
import type { PlacementTest } from "@/types/placement-test";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/lightswind/dropdown-menu";
import { Button } from "@/components/lightswind/button";
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
  onCancel,
  onNoShow,
  onConvertToEnrolled,
}: PlacementTestTableProps) {
  const testsArray = Array.isArray(tests) ? tests : [];
  
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

  const SortHeader = ({ column, label }: { column: string; label: string }) => (
    <button
      onClick={() => onSort?.(column)}
      className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 transition-colors"
    >
      {label}
      <ArrowUpDown
        size={14}
        className={sortKey === column ? "text-blue-600" : "text-slate-400"}
      />
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!testsArray || testsArray.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">Không có placement test nào.</p>
      </div>
    );
  }

  return (
    <>
    <div className="overflow-x-auto rounded-xl border border-pink-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-linear-to-r from-pink-50 to-rose-50 border-b border-pink-200">
            <th className="text-left px-4 py-3 text-sm">
              <SortHeader column="childName" label="Tên trẻ" />
            </th>
            <th className="text-left px-4 py-3 text-sm">
              <SortHeader column="leadName" label="Phụ huynh" />
            </th>
            <th className="text-left px-4 py-3 text-sm">
              Liên hệ
            </th>
            <th className="text-left px-4 py-3 text-sm">
              <SortHeader column="scheduledAt" label="Thời gian" />
            </th>
            <th className="text-left px-4 py-3 text-sm">
              <SortHeader column="branchName" label="Chi nhánh" />
            </th>
            <th className="text-left px-4 py-3 text-sm">
              Giáo viên
            </th>
            <th className="text-left px-4 py-3 text-sm">
              <SortHeader column="status" label="Trạng thái" />
            </th>
            <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {testsArray.map((test, idx) => (
            <tr
              key={test.id}
              className={`border-b border-pink-100 hover:bg-pink-50/30 transition-colors ${
                idx % 2 === 0 ? "bg-white" : "bg-pink-50/10"
              }`}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{test.childName || 'N/A'}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-slate-700">{test.leadName || 'N/A'}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-slate-600">{test.leadPhone || 'N/A'}</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Calendar size={14} />
                  {formatDateTime(test.scheduledAt)}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-slate-700">{test.branchName || 'N/A'}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-slate-700">{test.assignedTeacherName || 'Chưa phân công'}</div>
              </td>
              <td className="px-4 py-3">
                {getStatusBadge(STATUS_MAPPING[test.status])}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(test)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye size={16} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {test.status === 'Scheduled' && (
                        <>
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(test)}>
                              <Edit size={16} className="mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                          )}
                          {onAddResult && (
                            <DropdownMenuItem onClick={() => onAddResult(test)}>
                              <FileText size={16} className="mr-2" />
                              Nhập kết quả
                            </DropdownMenuItem>
                          )}
                          {onNoShow && (
                            <DropdownMenuItem onClick={() => onNoShow(test)}>
                              <AlertCircle size={16} className="mr-2" />
                              Đánh dấu không đến
                            </DropdownMenuItem>
                          )}
                          {onCancel && (
                            <DropdownMenuItem onClick={() => onCancel(test)}>
                              <Ban size={16} className="mr-2" />
                              Hủy lịch test
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      {test.status === 'Completed' && (
                        <>
                          <DropdownMenuItem onClick={() => onView(test)}>
                            <Eye size={16} className="mr-2" />
                            Xem kết quả
                          </DropdownMenuItem>
                          {onConvertToEnrolled && (
                            <DropdownMenuItem onClick={() => onConvertToEnrolled(test)}>
                              <UserCheck size={16} className="mr-2" />
                              Chuyển thành học viên
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      {(test.status === 'Cancelled' || test.status === 'NoShow') && (
                        <DropdownMenuItem onClick={() => onView(test)}>
                          <Eye size={16} className="mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
    {/* Pagination */}
    {totalPages > 1 && (
      <div className="flex items-center justify-between px-6 py-4 bg-white rounded-xl border border-pink-200 mt-4">
        <div className="text-sm text-gray-600">
          Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} placement test
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={currentPage === pageNum ? "bg-gradient-to-r from-pink-500 to-rose-500" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      </div>
    )}
    </>
  );
}
