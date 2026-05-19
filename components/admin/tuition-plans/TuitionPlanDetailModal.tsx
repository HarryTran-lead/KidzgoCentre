"use client";

import { BookOpen, Clock, DollarSign, FileText, Layers, Tag, Wallet, X } from "lucide-react";
import type { TuitionPlan } from "@/types/admin/tuition_plan";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function StatusBadge({ status, isActive }: { status?: 'active' | 'inactive'; isActive: boolean }) {
  const active = status === 'active' || (status === undefined && isActive);
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-semibold",
      active ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-700 border border-gray-200"
    )}>
      {active ? "Đang hoạt động" : "Tạm dừng"}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Wallet size={16} className="text-red-600" />
                    Tên gói học
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900">{detail.name}</div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BookOpen size={16} className="text-red-600" />
                    Chương trình học
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900">{detail.programName || "Chưa có"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Layers size={16} className="text-red-600" />
                    Level
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900">{detail.levelName || "Chưa có"}</div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BookOpen size={16} className="text-blue-600" />
                    Module
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900">
                    {detail.moduleName ? detail.moduleName : <span className="text-gray-400 italic">Không giới hạn module</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock size={16} className="text-red-600" />
                    Số buổi học
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900">{detail.sessionCount} buổi</div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign size={16} className="text-red-600" />
                    Học phí
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900">
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
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900">
                    {detail.unitPriceSession.toLocaleString("vi-VN")} {detail.currency || "VND"}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FileText size={16} className="text-red-600" />
                    Trạng thái
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm">
                    <StatusBadge status={detail.status} isActive={detail.isActive} />
                  </div>
                </div>
              </div>

              {/* Loại vé học (Phase 1.5) */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Tag size={16} className="text-purple-600" />
                    Loại vé học
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm">
                    {detail.learningTicketTypeCode ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 font-mono font-bold text-xs">
                          {detail.learningTicketTypeCode}
                        </span>
                        {detail.learningTicketTypeName && (
                          <span className="text-gray-700">{detail.learningTicketTypeName}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Không gán — mặc định pass tất cả vé</span>
                    )}
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
