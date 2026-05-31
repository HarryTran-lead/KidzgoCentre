import type { Dispatch, SetStateAction } from "react";
import { CalendarClock, CheckCircle2, FileText, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type { ReportPeriodDto, ReportPeriodType } from "@/types/reports-v3";
import type { PeriodDraft } from "@/components/reports-v3/tabs/types";
import { EmptyState, SectionCard } from "@/components/reports-v3/tabs/shared";

type PeriodsTabProps = {
  periods: ReportPeriodDto[];
  periodDraft: PeriodDraft;
  setPeriodDraft: Dispatch<SetStateAction<PeriodDraft>>;
  periodTypeOptions: ReportPeriodType[];
  formatPeriodType: (value?: string | null) => string;
  formatDate: (value?: string | null) => string;
  onSavePeriod: () => void;
  onDeletePeriod: (periodId: string) => void;
  onResetPeriodDraft: () => void;
  savingPeriod: boolean;
  canDeletePeriod: boolean;
};

export default function PeriodsTab({
  periods,
  periodDraft,
  setPeriodDraft,
  periodTypeOptions,
  formatPeriodType,
  formatDate,
  onSavePeriod,
  onDeletePeriod,
  onResetPeriodDraft,
  savingPeriod,
  canDeletePeriod,
}: PeriodsTabProps) {
  return (
    <div className="grid gap-6 [grid-template-columns:minmax(0,7fr)_minmax(0,3fr)] max-[1400px]:grid-cols-1">
      <SectionCard title="Danh mục kỳ báo cáo" subtitle="Theo tuần, tháng, mô-đun hoặc tùy chỉnh. Tạo báo cáo sẽ dùng mốc ngày của kỳ." icon={<CalendarClock size={18} />}>
        {periods.length ? (
          <div className="space-y-2">
            {periods.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="mt-1 text-sm text-gray-500">{item.code} • {formatPeriodType(item.type)} • {formatDate(item.startDate)} - {formatDate(item.endDate)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPeriodDraft({
                        id: item.id,
                        code: item.code,
                        name: item.name,
                        type: item.type as ReportPeriodType,
                        startDate: item.startDate?.slice(0, 10) || "",
                        endDate: item.endDate?.slice(0, 10) || "",
                      })}
                      className="rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Chỉnh sửa
                    </button>
                    {canDeletePeriod ? (
                      <button
                        type="button"
                        onClick={() => onDeletePeriod(item.id)}
                        className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có kỳ báo cáo" description="Tạo kỳ báo cáo đầu tiên để chạy tạo báo cáo theo mốc thời gian rõ ràng." />
        )}
      </SectionCard>

      <SectionCard title={periodDraft.id ? "Chỉnh sửa kỳ báo cáo" : "Tạo kỳ báo cáo"} subtitle="Quản lý có thể tạo/cập nhật kỳ báo cáo. Quyền xóa chỉ mở cho quản trị viên." icon={<FileText size={18} />}>
        <div className="space-y-3">
          <input value={periodDraft.code} onChange={(event) => setPeriodDraft((current) => ({ ...current, code: event.target.value }))} placeholder="Mã kỳ báo cáo" className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
          <input value={periodDraft.name} onChange={(event) => setPeriodDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Tên kỳ báo cáo" className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
          <Select value={periodDraft.type} onValueChange={(value) => setPeriodDraft((current) => ({ ...current, type: value as ReportPeriodType }))}>
            <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700">
              <SelectValue placeholder="Loại kỳ báo cáo" />
            </SelectTrigger>
            <SelectContent>
              {periodTypeOptions.map((item) => <SelectItem key={item} value={item}>{formatPeriodType(item)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid gap-3 md:grid-cols-2">
            <input type="date" value={periodDraft.startDate} onChange={(event) => setPeriodDraft((current) => ({ ...current, startDate: event.target.value }))} className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
            <input type="date" value={periodDraft.endDate} onChange={(event) => setPeriodDraft((current) => ({ ...current, endDate: event.target.value }))} className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onSavePeriod} disabled={savingPeriod} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {savingPeriod ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Lưu kỳ báo cáo
            </button>
            <button type="button" onClick={onResetPeriodDraft} className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Đặt lại</button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
