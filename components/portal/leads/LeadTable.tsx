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
  RefreshCw,
} from "lucide-react";
import { getLeadSourceLabel } from "@/types/lead";
import type { Lead } from "@/types/lead";
import StatusSelect from "./StatusSelect";
import LeadPagination from "./LeadPagination";

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
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onEdit: (lead: Lead) => void;
  onView: (lead: Lead) => void;
  onAction: (lead: Lead, action: string) => void;
  onStatusChange?: (lead: Lead, newStatus: StatusType) => void;
  currentUserId?: string; 
  readOnly?: boolean; 
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRefresh?: () => void;
}

const sourceColorMap: Record<string, string> = {
  Landing: "from-blue-50 to-blue-100 text-blue-700 border-blue-200",
  Zalo: "from-green-50 to-green-100 text-green-700 border-green-200",
  Referral: "from-amber-50 to-amber-100 text-amber-700 border-amber-200",
  Offline: "from-slate-50 to-slate-100 text-slate-700 border-slate-200",
  Default: "from-gray-50 to-gray-100 text-gray-700 border-gray-200",
};

export default function LeadTable({
  leads,
  isLoading,
  sortKey,
  onSort,
  onEdit,
  onView,
  onAction,
  onStatusChange,
  currentUserId,
  readOnly = false,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  onRefresh,
}: LeadTableProps) {
  const getStatusBadge = (statusText: string) => {
    const statusMap: Record<string, { bg: string; text: string; border: string; icon: any }> = {
      "Mới": { bg: "from-red-50 to-red-100", text: "text-red-700", border: "border-red-200", icon: Sparkles },
      "Đang tư vấn": { bg: "from-red-50 to-red-100", text: "text-red-700", border: "border-red-200", icon: Phone },
      "Đã đặt lịch test": { bg: "from-red-50 to-red-100", text: "text-red-700", border: "border-red-200", icon: CalendarCheck },
      "Đã test": { bg: "from-red-50 to-red-100", text: "text-red-700", border: "border-red-200", icon: FileText },
      "Đã ghi danh": { bg: "from-red-50 to-red-100", text: "text-red-700", border: "border-red-200", icon: CheckCircle2 },
      "Đã hủy": { bg: "from-red-50 to-red-100", text: "text-red-700", border: "border-red-200", icon: XCircle },
    };
    const config = statusMap[statusText] || statusMap["Mới"];
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-linear-to-r ${config.bg}${config.text} border ${config.border}`}>
        <Icon size={12} />
        <span>{statusText}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-linear-to-r from-red-100 to-red-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 p-12 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-linear-to-r from-red-100 to-red-200 flex items-center justify-center">
          <Sparkles size={24} className="text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có khách tiềm năng nào</h3>
        <p className="text-sm text-gray-500">Hãy tạo khách tiềm năng mới hoặc điều chỉnh bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
      <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách khách hàng tiềm năng</h3>
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
            <tr>
              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort("contactName")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                >
                  Thông tin
                  <ArrowUpDown size={14} className={sortKey === "contactName" ? "text-red-600" : "text-gray-400"} />
                </button>
              </th>

              <th className="py-3 px-6 text-left">
                <span className="text-sm font-semibold text-gray-700">Liên hệ</span>
              </th>

              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort("source")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                >
                  Nguồn
                  <ArrowUpDown size={14} className={sortKey === "source" ? "text-red-600" : "text-gray-400"} />
                </button>
              </th>

              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort("ownerStaffName")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                >
                  Phụ trách
                  <ArrowUpDown size={14} className={sortKey === "ownerStaffName" ? "text-red-600" : "text-gray-400"} />
                </button>
              </th>

              <th className="py-3 px-6 text-left">
                <button
                  type="button"
                  onClick={() => onSort("status")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                >
                  Trạng thái
                  <ArrowUpDown size={14} className={sortKey === "status" ? "text-red-600" : "text-gray-400"} />
                </button>
              </th>

              <th className="py-3 px-6 text-left">
                <span className="text-sm font-semibold text-gray-700">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-100">
            {leads.map((lead, index) => (
              <tr
                key={lead.id}
                className="group hover:bg-linear-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
              >
                <td className="py-4 px-6">
                  <div className="space-y-1 min-w-55">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-linear-to-r from-red-600 to-red-700 flex items-center justify-center text-white font-semibold text-xs">
                        {lead.contactName ? lead.contactName.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2) : "??"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{lead.contactName || "Không có tên"}</div>
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

                <td className="py-4 px-6 align-top min-w-55">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone size={14} className="text-gray-400" />
                      <span className="font-medium">{lead.phone}</span>
                    </div>
                    {lead.email ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail size={14} className="text-gray-400" />
                        <span className="truncate max-w-65">{lead.email}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">Không có email</div>
                    )}
                  </div>
                </td>

                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-linear-to-r border ${
                      sourceColorMap[lead.source || "Default"] || sourceColorMap.Default
                    }`}
                  >
                    {getLeadSourceLabel(lead.source)}
                  </span>
                </td>
                
                <td className="py-4 px-6">
                  {lead.ownerStaffName ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-linear-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-semibold">
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
                    disabled={readOnly || !lead.ownerStaffId || lead.ownerStaffId !== currentUserId}
                    title={readOnly ? "Chế độ chỉ xem" : !lead.ownerStaffId ? "Khách tiềm năng chưa được phân công" : lead.ownerStaffId !== currentUserId ? "Chỉ nhân viên phụ trách mới có thể thay đổi trạng thái" : ""}
                  />
                </td>
                
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onView(lead)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => onEdit(lead)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit size={14} />
                        </button>
                        {/* Chỉ hiển thị nút nhận lead nếu chưa có owner */}
                        {!lead.ownerStaffId && (
                          <button
                            onClick={() => onAction(lead, "self-assign")}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            title="Nhận khách tiềm năng"
                          >
                            <UserCheck size={14} />
                          </button>
                        )}
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
      {totalPages > 0 && onPageChange && onPageSizeChange && (
        <div>
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
