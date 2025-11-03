export default function RevenueProgress({
  targetLabel,
  reachedLabel,
  reachedPercent,
  segments,
}: {
  targetLabel: string;
  reachedLabel: string;
  reachedPercent: number; // 0..100
  segments: { label: string; value: string; color: string }[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-4 border-b border-slate-200/70">
        <h3 className="font-semibold">Tiến độ doanh thu tháng 10/2025</h3>
      </div>

      <div className="px-5 py-5 space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{targetLabel}</span>
          <span>{reachedLabel}</span>
        </div>

        {/* progress bar */}
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-slate-900 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, reachedPercent))}%` }}
          />
        </div>

        {/* legend */}
        <div className="grid grid-cols-3 gap-6 text-center pt-2">
          {segments.map((s) => (
            <div key={s.label}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
