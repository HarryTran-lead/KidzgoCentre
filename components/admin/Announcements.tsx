type Item = {
  title: string;
  desc: string;
  tone: "warning" | "info" | "success";
};

const toneStyle: Record<Item["tone"], string> = {
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
};

export default function Announcements({ items }: { items: Item[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-4 border-b border-slate-200/70">
        <h3 className="font-semibold">Thông báo quan trọng</h3>
      </div>

      <div className="p-5 space-y-3">
        {items.map((it, i) => (
          <div
            key={i}
            className={`rounded-xl border px-4 py-3 ${toneStyle[it.tone]}`}
          >
            <div className="font-semibold">{it.title}</div>
            <div className="text-sm opacity-90">{it.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
