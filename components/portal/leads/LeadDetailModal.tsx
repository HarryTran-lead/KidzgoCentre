"use client";

import { X, User, Phone, Mail, MessageSquare, Calendar, Tag, Activity, Clock, Building, FileText } from "lucide-react";
import type { Lead } from "@/types/lead";

type StatusType = 'New' | 'Contacted' | 'BookedTest' | 'TestDone' | 'Enrolled' | 'Lost';

const STATUS_MAPPING: Record<StatusType, string> = {
  New: "Mới",
  Contacted: "Đang tư vấn",
  BookedTest: "Đã đặt lịch test",
  TestDone: "Đã test",
  Enrolled: "Đã ghi danh",
  Lost: "Đã hủy",
};

interface LeadDetailModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
}

export default function LeadDetailModal({ isOpen, lead, onClose, onEdit }: LeadDetailModalProps) {
  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl hide-scrollbar">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Chi tiết Lead</h2>
              <p className="text-sm text-white/80 mt-1">ID: {lead.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5 custom-scrollbar">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <User size={16} className="text-pink-600" />
              Thông tin cơ bản
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Họ và tên</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.contactName || "N/A"}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Phone size={12} /> Số điện thoại
                </label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.phone || "N/A"}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Mail size={12} /> Email
                </label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.email || "N/A"}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <MessageSquare size={12} /> Zalo ID
                </label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.zaloId || "N/A"}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">Công ty</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.company || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Lead Status & Assignment */}
          <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-pink-600" />
              Trạng thái & Phân công
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Trạng thái</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {lead.status ? STATUS_MAPPING[lead.status as StatusType] : "N/A"}
                </p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500">Phụ trách</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.ownerStaffName || "Chưa phân công"}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Calendar size={12} /> Phản hồi lần đầu
                </label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {lead.firstResponseAt ? new Date(lead.firstResponseAt).toLocaleString('vi-VN') : "Chưa phản hồi"}
                </p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> Hành động tiếp theo
                </label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {lead.nextActionAt ? new Date(lead.nextActionAt).toLocaleString('vi-VN') : "Chưa đặt lịch"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">Số lần tiếp xúc</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.touchCount || 0} lần</p>
              </div>
            </div>
          </div>

          {/* Source & Campaign */}
          <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Tag size={16} className="text-pink-600" />
              Nguồn lead
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Nguồn</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.source || "N/A"}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500">Campaign</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.campaign || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Building size={16} className="text-pink-600" />
              Sở thích
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Chi nhánh mong muốn</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {lead.branchPreferenceName || lead.branchPreference || "N/A"}
                </p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500">Chương trình quan tâm</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.programInterest || "N/A"}</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-500">Chủ đề</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{lead.subject || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText size={16} className="text-pink-600" />
                Ghi chú
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {/* Conversion Info */}
          {lead.convertedStudentProfileId && (
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
              <h3 className="text-sm font-semibold text-emerald-700 mb-3">Đã chuyển đổi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">ID học viên</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{lead.convertedStudentProfileId}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Ngày chuyển đổi</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString('vi-VN') : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Ngày tạo:</span>{" "}
                {lead.createdAt ? new Date(lead.createdAt).toLocaleString('vi-VN') : "N/A"}
              </div>
              <div>
                <span className="font-medium">Cập nhật:</span>{" "}
                {lead.updatedAt ? new Date(lead.updatedAt).toLocaleString('vi-VN') : "N/A"}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                onEdit(lead);
                onClose();
              }}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:shadow-lg transition-all"
            >
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
