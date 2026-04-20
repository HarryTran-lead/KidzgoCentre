"use client";

import { BookOpen, Building2, Clock, DollarSign, FileText, Wallet, X } from "lucide-react";
import type { TuitionPlan } from "@/types/admin/tuition_plan";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function StatusBadge({ value }: { value: "Đang hoạt động" | "Tạm dừng" }) {
  const map: Record<string, string> = {
    "Đang hoạt động": "bg-green-100 text-green-700 border border-green-200",
    "Tạm dừng": "bg-gray-100 text-gray-700 border border-gray-200",
  };

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
}

export default function TuitionPlanDetailModal({
  open,
  loading,
  detail,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  detail: TuitionPlan | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-linear-to-r from-red-600 to-red-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wallet size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chi tiết gói học</h2>
                <p className="text-sm text-red-100">Thông tin chi tiết về gói học</p>
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
        </div>

        <div className="p-6 max-h-[82vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Wallet size={16} className="text-red-600" />
                  Tên gói học
                </label>
                <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">{detail.name}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BookOpen size={16} className="text-red-600" />
                    Khóa học
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">{detail.programName || "Chưa có"}</div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Building2 size={16} className="text-red-600" />
                    Chi nhánh
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">{detail.branchName || "Chưa có"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock size={16} className="text-red-600" />
                    Số buổi học
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">{detail.totalSessions} buổi</div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign size={16} className="text-red-600" />
                    Học phí
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                    {detail.tuitionAmount.toLocaleString("vi-VN")} {detail.currency || "VND"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign size={16} className="text-red-600" />
                    Giá mỗi buổi
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                    {detail.unitPriceSession.toLocaleString("vi-VN")} {detail.currency || "VND"}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FileText size={16} className="text-red-600" />
                    Trạng thái
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">
                    <StatusBadge value={detail.isActive ? "Đang hoạt động" : "Tạm dừng"} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">Không có dữ liệu để hiển thị</div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
