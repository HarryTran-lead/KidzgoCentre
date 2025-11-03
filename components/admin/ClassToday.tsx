export type TodayClass = {
  name: string;
  teacher: string;
  time: string;
  room: string;
  students: number;
};

export default function ClassToday({ classes }: { classes: TodayClass[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-4 border-b border-slate-200/70">
        <h3 className="font-semibold">Lớp học hôm nay</h3>
      </div>

      <ul className="divide-y divide-slate-200/70">
        {classes.map((c) => (
          <li key={c.name} className="px-5 py-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-slate-500">
                {c.teacher} • {c.time}
              </div>
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-6">
              <span className="text-slate-600">{c.students} học viên</span>
              <span className="rounded-lg bg-slate-100 text-slate-700 px-2 py-1 text-xs font-medium">
                {c.room}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
