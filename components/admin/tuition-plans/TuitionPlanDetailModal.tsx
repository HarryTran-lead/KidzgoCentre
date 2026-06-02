"use client";

import { BookOpen, Clock, DollarSign, FileText, Layers, Loader2, Tag, Wallet, X } from "lucide-react";
import type { TuitionPlan } from "@/types/admin/tuition_plan";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function StatusBadge({ status, isActive }: { status?: "active" | "inactive"; isActive: boolean }) {
  const active = status === "active" || (status === undefined && isActive);
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", active ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-700 border border-gray-200")}>
      {active ? "Đang hoạt động" : "Tạm dừng"}
    </span>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">{icon}{label}</label>
      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900">{children}</div>
    </div>
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

        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-red-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wallet size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chi tiết gói học</h2>
                <p className="text-sm text-red-100">{detail?.name || "Thông tin chi tiết"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer" aria-label="Đóng">
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[68vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={36} className="animate-spin text-red-500" />
            </div>
          ) : !detail ? (
            <div className="text-center py-12 text-gray-500">Không có dữ liệu để hiển thị</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field icon={<Wallet size={16} className="text-red-600" />} label="Tên gói học">{detail.name}</Field>
                <Field icon={<BookOpen size={16} className="text-red-600" />} label="Chương trình học">{detail.programName || "Chưa có"}</Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field icon={<Layers size={16} className="text-red-600" />} label="Level">{detail.levelName || "Chưa có"}</Field>
                <Field icon={<BookOpen size={16} className="text-blue-600" />} label="Module">
                  {detail.moduleName ? detail.moduleName : <span className="text-gray-400 italic">Không giới hạn module</span>}
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field icon={<Clock size={16} className="text-red-600" />} label="Số buổi học">{detail.totalSessions} buổi</Field>
                <Field icon={<DollarSign size={16} className="text-red-600" />} label="Học phí">
                  {detail.tuitionAmount.toLocaleString("vi-VN")} {detail.currency || "VND"}
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field icon={<DollarSign size={16} className="text-red-600" />} label="Giá mỗi buổi">
                  {detail.unitPriceSession.toLocaleString("vi-VN")} {detail.currency || "VND"}
                </Field>
                <Field icon={<FileText size={16} className="text-red-600" />} label="Trạng thái">
                  <StatusBadge status={detail.status} isActive={detail.isActive} />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Field icon={<Tag size={16} className="text-purple-600" />} label="Loại vé học">
                  {detail.learningTicketTypeCode ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 font-mono font-bold text-xs">{detail.learningTicketTypeCode}</span>
                      {detail.learningTicketTypeName && <span className="text-gray-700">{detail.learningTicketTypeName}</span>}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Không gán — mặc định pass tất cả vé</span>
                  )}
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-4 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

