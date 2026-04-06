"use client";

import { useCallback, useEffect, useState } from "react";
import { X, User, Phone, Mail, MessageSquare, Calendar, Tag, Activity, Clock, Building, FileText, Users } from "lucide-react";
import type { Lead } from "@/types/lead";
import { getLeadChildren } from "@/lib/api/leadService";
import LeadChildrenManager from "./LeadChildrenManager";

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
  readOnly?: boolean;
}

export default function LeadDetailModal({ isOpen, lead, onClose, onEdit, readOnly = false }: LeadDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'children'>('info');
  const [childProgramInterests, setChildProgramInterests] = useState<string[]>([]);

  const refreshChildProgramInterests = useCallback(async () => {
    if (!lead?.id) {
      setChildProgramInterests([]);
      return;
    }

    try {
      const response = await getLeadChildren(lead.id);
      const interests = Array.from(
        new Set(
          (response.data?.children || [])
            .map((child) => child.programInterest?.trim())
            .filter((interest): interest is string => Boolean(interest))
        )
      );

      setChildProgramInterests(interests);
    } catch {
      setChildProgramInterests([]);
    }
  }, [lead?.id]);

  useEffect(() => {
    if (!isOpen) {
      setChildProgramInterests([]);
      return;
    }

    refreshChildProgramInterests();
  }, [isOpen, refreshChildProgramInterests]);
  
  if (!isOpen || !lead) return null;

  const displayProgramInterest =
    childProgramInterests.length > 0
      ? childProgramInterests.join(", ")
      : lead.programInterest || "Không có";

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header - Gradient đỏ như modal mẫu */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Chi tiết Lead</h2>
                <p className="text-sm text-red-100">Thông tin chi tiết về khách hàng tiềm năng</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'info'
                  ? 'bg-white text-red-600 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <User size={16} />
              Thông tin Lead
            </button>
            <button
              onClick={() => setActiveTab('children')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'children'
                  ? 'bg-white text-red-600 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Users size={16} />
              Thông tin bé
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Tab: Lead Info */}
            {activeTab === 'info' && (
              <>
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <User size={16} className="text-red-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Thông tin cơ bản</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Họ và tên</label>
                      <p className="text-sm font-medium text-gray-900">{lead.contactName || "Không có"}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Phone size={12} /> Số điện thoại
                      </label>
                      <p className="text-sm font-medium text-gray-900">{lead.phone || "Không có"}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Mail size={12} /> Email
                      </label>
                      <p className="text-sm font-medium text-gray-900">{lead.email || "Không có"}</p>
                    </div>
                  </div>
                </div>

                {/* Lead Status & Assignment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <Activity size={16} className="text-red-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Trạng thái & Phân công</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Trạng thái</label>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.status ? STATUS_MAPPING[lead.status as StatusType] : "Không có"}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Phụ trách</label>
                      <p className="text-sm font-medium text-gray-900">{lead.ownerStaffName || "Chưa phân công"}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Calendar size={12} /> Phản hồi lần đầu
                      </label>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.firstResponseAt ? new Date(lead.firstResponseAt).toLocaleString('vi-VN') : "Chưa phản hồi"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Số lần tiếp xúc</label>
                      <p className="text-sm font-medium text-gray-900">{lead.touchCount || 0} lần</p>
                    </div>
                  </div>
                </div>

                {/* Source & Campaign */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <Tag size={16} className="text-red-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Nguồn lead</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Nguồn</label>
                      <p className="text-sm font-medium text-gray-900">{lead.source || "Không có"}</p>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <Building size={16} className="text-red-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Sở thích</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Chi nhánh mong muốn</label>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.branchPreferenceName || lead.branchPreference || "Không có"}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Chương trình quan tâm</label>
                      <p className="text-sm font-medium text-gray-900">{displayProgramInterest}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {lead.notes && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-red-100">
                        <FileText size={16} className="text-red-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700">Ghi chú</h3>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-200">
                      {lead.notes}
                    </p>
                  </div>
                )}

                {/* Conversion Info */}
                {lead.convertedStudentProfileId && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-100">
                        <Users size={16} className="text-emerald-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-emerald-700">Đã chuyển đổi</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/30 p-4 rounded-xl border border-emerald-200">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">ID học viên</label>
                        <p className="text-sm font-medium text-gray-900">{lead.convertedStudentProfileId}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Ngày chuyển đổi</label>
                        <p className="text-sm font-medium text-gray-900">
                          {lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString('vi-VN') : "Không có"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gray-100">
                      <Clock size={16} className="text-gray-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Thông tin hệ thống</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="font-medium">Ngày tạo:</span>{" "}
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleString('vi-VN') : "Không có"}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab: Children */}
            {activeTab === 'children' && (
              <LeadChildrenManager
                leadId={lead.id}
                isEditable={!readOnly}
                onChildrenChanged={refreshChildProgramInterests}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-end gap-3">
            {!readOnly && (
              <button
                onClick={() => {
                  onEdit(lead);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}