import { Loader2, Sparkles } from "lucide-react";
import type { ReportPeriodDto, ReportsV3GenerateType } from "@/types/reports-v3";
import type { Option } from "@/components/reports-v3/tabs/types";
import { cn } from "@/components/reports-v3/tabs/shared";

type GenerateReportModalProps = {
  open: boolean;
  onClose: () => void;
  reportType: ReportsV3GenerateType;
  setReportType: (value: ReportsV3GenerateType) => void;
  reportTypeLabels: Record<ReportsV3GenerateType, string>;
  branchOptions: Option[];
  showBranchContext?: boolean;
  classOptions: Option[];
  studentOptions: Option[];
  periods: ReportPeriodDto[];
  selectedBranchId: string;
  selectedClassId: string;
  selectedStudentId: string;
  selectedPeriodId: string;
  onGenerate: () => void;
  savingGenerate: boolean;
};

export default function GenerateReportModal({
  open,
  onClose,
  reportType,
  setReportType,
  reportTypeLabels,
  branchOptions,
  showBranchContext = true,
  classOptions,
  studentOptions,
  periods,
  selectedBranchId,
  selectedClassId,
  selectedStudentId,
  selectedPeriodId,
  onGenerate,
  savingGenerate,
}: GenerateReportModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-5xl rounded-3xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-gray-900">Tạo báo cáo học viên</div>
            <div className="mt-1 text-sm text-gray-500">Tạo snapshot bất biến theo học viên + kỳ + loại báo cáo.</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Đóng</button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[7fr_3fr]">
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Loại báo cáo</label>
              <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(reportTypeLabels).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setReportType(key as ReportsV3GenerateType)} className={cn("rounded-2xl border px-4 py-4 text-left transition", reportType === key ? "border-red-500 bg-white shadow-sm" : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/30")}>
                    <div className="text-sm font-semibold text-gray-900">{label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-red-200 bg-white px-4 py-4 text-sm text-gray-700">
              <div className="font-semibold text-gray-900">Ngữ cảnh hiện tại</div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {showBranchContext ? (
                  <div>Chi nhánh: <span className="font-medium">{branchOptions.find((item) => item.id === selectedBranchId)?.label || "—"}</span></div>
                ) : null}
                <div>Lớp học: <span className="font-medium">{classOptions.find((item) => item.id === selectedClassId)?.label || "—"}</span></div>
                <div>Học viên: <span className="font-medium">{studentOptions.find((item) => item.id === selectedStudentId)?.label || "—"}</span></div>
                <div>Kỳ báo cáo: <span className="font-medium">{periods.find((item) => item.id === selectedPeriodId)?.name || "—"}</span></div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Checklist trước khi tạo</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>Một báo cáo học viên dùng chung snapshot cho bản phụ huynh/học thuật/nội bộ.</li>
              <li>Báo cáo cũ không thay đổi khi dữ liệu vận hành thay đổi về sau.</li>
              <li>Công bố cho phụ huynh là bước riêng, không tự động chạy sau khi tạo báo cáo.</li>
            </ul>
            <button type="button" onClick={onGenerate} disabled={savingGenerate || !selectedStudentId || !selectedPeriodId} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
              {savingGenerate ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Tạo báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
