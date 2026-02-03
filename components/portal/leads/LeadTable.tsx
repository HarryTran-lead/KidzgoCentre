"use client";

import {
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Sparkles,
  FileText,
  XCircle,
  ArrowUpDown,
  MoreVertical,
  UserCheck,
  CalendarCheck,
  Edit,
  Eye,
  Trash2,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Lead } from "@/types/lead";
import LeadPagination from "./LeadPagination";
import StatusSelect from "./StatusSelect";

type StatusType = 'New' | 'Contacted' | 'BookedTest' | 'TestDone' | 'Enrolled' | 'Lost';

const STATUS_MAPPING: Record<StatusType, string> = {
  New: "Mới",
  Contacted: "Đang tư vấn",
  BookedTest: "Đã đặt lịch test",
  TestDone: "Đã test",
  Enrolled: "Đã ghi danh",
  Lost: "Đã hủy",
};

interface LeadTableProps {
  leads: Lead[];
  isLoading?: boolean;
  selectedIds: Record<string, boolean>;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSelectAll: () => void;
  onSelectOne: (id: string) => void;
  onSort: (key: string) => void;
  onEdit: (lead: Lead) => void;
  onView: (lead: Lead) => void;
  onAction: (lead: Lead, action: string) => void;
  onStatusChange?: (lead: Lead, newStatus: StatusType) => void;
  currentUserId?: string; // ID của staff hiện tại để kiểm tra quyền
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export default function LeadTable({
  leads,
  isLoading,
  selectedIds,
  sortKey,
  sortDir,
  onSelectAll,
  onSelectOne,
  onSort,
  onEdit,
  onView,
  onAction,
  onStatusChange,
  currentUserId,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
}: LeadTableProps) {
  const allVisibleSelected = leads.length > 0 && leads.every((l) => selectedIds[l.id]);

  const getStatusBadge = (statusText: string) => {
    const statusMap: Record<string, { bg: string; text: string; border: string; icon: any }> = {
      "Mới": { bg: "from-amber-50 to-orange-50", text: "text-amber-700", border: "border-amber-200", icon: Sparkles },
      "Đang tư vấn": { bg: "from-blue-50 to-cyan-50", text: "text-blue-700", border: "border-blue-200", icon: Phone },
      "Đã đặt lịch test": { bg: "from-indigo-50 to-purple-50", text: "text-indigo-700", border: "border-indigo-200", icon: CalendarCheck },
      "Đã test": { bg: "from-purple-50 to-violet-50", text: "text-purple-700", border: "border-purple-200", icon: FileText },
      "Đã ghi danh": { bg: "from-emerald-50 to-teal-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
      "Đã hủy": { bg: "from-rose-50 to-pink-50", text: "text-rose-700", border: "border-rose-200", icon: XCircle },
    };
    const config = statusMap[statusText] || statusMap["Mới"];
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-gradient-to-r ${config.bg} ${config.text} border ${config.border}`}>
        <Icon size={12} />
        <span>{statusText}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-white p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-gradient-to-r from-pink-50 to-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-white p-12 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
          <Sparkles size={24} className="text-pink-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có lead nào</h3>
        <p className="text-sm text-gray-500">Hãy tạo lead mới hoặc điều chỉnh bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Danh sách Lead</h3>
          <div className="text-sm text-gray-600">{leads.length} lead</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
            <tr>
              <th className="py-3 px-4 text-left">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200 cursor-pointer"
                />
              </th>

              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort("contactName")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                >
                  Thông tin
                  <ArrowUpDown size={14} className={sortKey === "contactName" ? "text-pink-600" : "text-gray-400"} />
                </button>
              </th>

              <th className="py-3 px-6 text-left">
                <span className="text-sm font-semibold text-gray-700">Liên hệ</span>
              </th>

              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort("source")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                >
                  Nguồn
                  <ArrowUpDown size={14} className={sortKey === "source" ? "text-pink-600" : "text-gray-400"} />
                </button>
              </th>

              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort("ownerStaffName")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                >
                  Phụ trách
                  <ArrowUpDown size={14} className={sortKey === "ownerStaffName" ? "text-pink-600" : "text-gray-400"} />
                </button>
              </th>

              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort("status")}
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
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
              >
                <td className="py-4 px-4 align-top">
                  <input
                    type="checkbox"
                    checked={!!selectedIds[lead.id]}
                    onChange={() => onSelectOne(lead.id)}
                    className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200 cursor-pointer"
                    aria-label={`Chọn ${lead.contactName || 'Lead'}`}
                  />
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-1 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold text-xs">
                        {lead.contactName ? lead.contactName.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2) : "??"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{lead.contactName || "Không có tên"}</div>
                        <div className="text-xs text-gray-500 font-mono">{lead.id}</div>
                      </div>
                    </div>
                    {lead.createdAt && (
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} />
                        Tạo: {new Date(lead.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                </td>

                <td className="py-4 px-6 align-top min-w-[220px]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone size={14} className="text-gray-400" />
                      <span className="font-medium">{lead.phone}</span>
                    </div>
                    {lead.email ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail size={14} className="text-gray-400" />
                        <span className="truncate max-w-[260px]">{lead.email}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">Không có email</div>
                    )}
                  </div>
                </td>

                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200">
                    {lead.source || "Không rõ"}
                  </span>
                </td>
                
                <td className="py-4 px-6">
                  {lead.ownerStaffName ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold">
                        {lead.ownerStaffName.split(" ").pop()?.[0] || "N"}
                      </div>
                      <span className="font-medium text-gray-900">{lead.ownerStaffName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Chưa phân công</span>
                  )}
                </td>
                
                <td className="py-4 px-6">
                  <StatusSelect
                    value={lead.status || "New"}
                    onChange={(newStatus) => onStatusChange?.(lead, newStatus)}
                    disabled={!lead.ownerStaffId || lead.ownerStaffId !== currentUserId}
                    title={!lead.ownerStaffId ? "Lead chưa được phân công" : lead.ownerStaffId !== currentUserId ? "Chỉ nhân viên phụ trách mới có thể thay đổi trạng thái" : ""}
                  />
                </td>
                
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onView(lead)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(lead)}
                      className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors text-gray-400 hover:text-purple-600 cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit size={14} />
                    </button>
                    {/* Chỉ hiển thị nút nhận lead nếu chưa có owner */}
                    {!lead.ownerStaffId && (
                      <button
                        onClick={() => onAction(lead, "self-assign")}
                        className="p-1.5 rounded-lg hover:bg-green-50 transition-colors text-gray-400 hover:text-green-600 cursor-pointer"
                        title="Nhận lead"
                      >
                        <UserCheck size={14} />
                      </button>
                    )}
                    <button
                      className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
                      title="Thêm"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && onPageChange && onPageSizeChange && (
        <div className="border-t border-pink-200">
          <LeadPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
