"use client";

type SummaryItem = {
  label: string;
  value?: string | number | null;
};

type SyllabusSummaryPanelProps = {
  title?: string;
  description?: string;
  items: SummaryItem[];
  className?: string;
  stickyTopClassName?: string;
};

export default function SyllabusSummaryPanel({
  title = "Syllabus Summary / Tóm tắt syllabus",
  description = "Bản đồ nhanh để xác định buổi học đang nằm ở đâu trong chương trình.",
  items,
  className,
  stickyTopClassName = "xl:top-4",
}: SyllabusSummaryPanelProps) {
  const visibleItems = items.filter((item) => {
    const value = item.value;
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className={`rounded-2xl border border-slate-200 bg-slate-50/70 shadow-sm xl:sticky ${stickyTopClassName}`}>
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{title}</div>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <div className="space-y-3 px-4 py-4">
          {visibleItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-white bg-white px-3 py-2.5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{item.value}</div>
            </div>
          ))}
          {visibleItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-xs text-slate-500">
              Chưa có dữ liệu tóm tắt cho buổi học này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
