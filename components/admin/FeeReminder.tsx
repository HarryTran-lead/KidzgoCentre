type Row = {
  name: string;
  course: string;
  amount: string;
  due: string;
  status: "Sắp đến hạn" | "Quá hạn";
  tone: "warning" | "danger";
};

const toneMap = {
  warning: {
    chip: "bg-slate-800 text-white",
    btn: "bg-slate-100 text-slate-700",
  },
  danger: {
    chip: "bg-rose-100 text-rose-700",
    btn: "bg-rose-600 text-white",
  },
};

export default function FeeReminder({ items }: { items: Row[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-4 border-b border-slate-200/70">
        <h3 className="font-semibold">Nhắc nhở học phí</h3>
      </div>

      <ul className="divide-y divide-slate-200/70">
        {items.map((r, idx) => {
          const tone = toneMap[r.tone];
          return (
            <li key={idx} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-sm text-slate-500">{r.course}</div>
                </div>

                <div className="text-right">
                  <div className={`font-semibold ${r.tone === "danger" ? "text-rose-600" : "text-amber-600"}`}>
                    {r.amount}
                  </div>
                  <div className="text-xs text-slate-500">{r.due}</div>
                </div>
              </div>

              <div className="mt-3">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tone.chip}`}>
                  {r.status}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
