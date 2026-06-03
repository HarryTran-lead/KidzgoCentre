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
  horizontal?: boolean;
};

const getColorForLabel = (label: string): { bg: string; border: string; text: string } => {
  const upperLabel = label.toUpperCase();
  if (upperLabel.includes("COURSE")) return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" };
  if (upperLabel.includes("UNIT") || upperLabel.includes("MODULE")) return { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" };
  if (upperLabel.includes("TOPIC")) return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" };
  if (upperLabel.includes("DATE") || upperLabel.includes("NGÀY")) return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" };
  if (upperLabel.includes("TIME") || upperLabel.includes("GIỜ")) return { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" };
  if (upperLabel.includes("TEACHER") || upperLabel.includes("GIÁO VIÊN")) return { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" };
  if (upperLabel.includes("ROOM") || upperLabel.includes("PHÒNG")) return { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" };
  return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700" };
};

export default function SyllabusSummaryPanel({
  title = "Syllabus Summary / Tóm tắt syllabus",
  description = "Bản đồ nhanh để xác định buổi học đang nằm ở đâu trong chương trình.",
  items,
  className,
  stickyTopClassName = "xl:top-4",
  horizontal = false,
}: SyllabusSummaryPanelProps) {
  const visibleItems = items.filter((item) => {
    const value = item.value;
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });

  return (
    <div className={`${horizontal ? "" : "space-y-4"} ${className || ""}`}>
      {!horizontal && (
        <div className={`rounded-2xl border border-slate-200 bg-slate-50/70 shadow-sm xl:sticky ${stickyTopClassName}`}>
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="text-xs font-semibold  text-slate-600">{title}</div>
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
      )}
      {horizontal && (
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          {visibleItems.map((item) => {
            const colors = getColorForLabel(item.label);
            return (
              <span key={item.label} className={`inline-flex rounded-lg border ${colors.border} ${colors.bg} px-3 py-1.5 text-xs  font-medium ${colors.text} whitespace-nowrap shrink-0`}>
                {item.value}
              </span>
            );
          })}
          {visibleItems.length === 0 && (
            <span className="text-xs text-slate-500">Chưa có dữ liệu</span>
          )}
        </div>
      )}
    </div>
  );
}
