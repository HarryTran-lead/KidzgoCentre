"use client";

import { X, Building2, MapPin, Phone, Mail, FileText } from "lucide-react";
import type { Branch } from "@/types/branch";

interface BranchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
}

function StatusIndicator({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`px-3 py-1 text-sm font-medium rounded-full border ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      {isActive ? 'Đang hoạt động' : 'Không hoạt động'}
    </span>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
      <div className="text-red-600 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    </div>
  );
}

export default function BranchDetailModal({ isOpen, onClose, branch }: BranchDetailModalProps) {
  if (!isOpen || !branch) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Chi tiết chi nhánh</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full border border-red-200">
                  {branch.code}
                </span>
                <StatusIndicator isActive={branch.isActive} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{branch.name}</h3>
            </div>
          </div>

          <div className="grid gap-4">
            <InfoRow label="Địa chỉ" value={branch.address} icon={<MapPin size={16} />} />
            <InfoRow label="Số liên hệ" value={branch.contactPhone || 'Chưa cập nhật'} icon={<Phone size={16} />} />
            <InfoRow label="Email liên hệ" value={branch.contactEmail || 'Chưa cập nhật'} icon={<Mail size={16} />} />
            {branch.description && <InfoRow label="Mô tả" value={branch.description} icon={<FileText size={16} />} />}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-red-100">
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="text-2xl font-bold text-red-600">{branch.totalStudents || 0}</div>
              <div className="text-xs text-gray-600 mt-1">Học viên</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="text-2xl font-bold text-red-600">{branch.totalClasses || 0}</div>
              <div className="text-xs text-gray-600 mt-1">Lớp học</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="text-2xl font-bold text-red-600">{branch.totalTeachers || 0}</div>
              <div className="text-xs text-gray-600 mt-1">Giáo viên</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-red-100">
            <div>Ngày tạo: {new Date(branch.createdAt).toLocaleString('vi-VN')}</div>
            {branch.updatedAt && <div>Cập nhật: {new Date(branch.updatedAt).toLocaleString('vi-VN')}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-red-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-red-200 text-gray-700 font-medium hover:bg-red-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
