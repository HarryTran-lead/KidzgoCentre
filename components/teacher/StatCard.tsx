import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  color?: "pink" | "green" | "yellow" | "blue";
};

const tone: Record<NonNullable<Props["color"]>, string> = {
  pink: "bg-pink-50 border-pink-100",
  green: "bg-emerald-50 border-emerald-100",
  yellow: "bg-amber-50 border-amber-100",
  blue: "bg-sky-50 border-sky-100",
};

export default function StatCard({ icon, label, value, hint, color = "pink" }: Props) {
  return (
    <div className={`rounded-2xl border ${tone[color]} p-4`}>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-white grid place-items-center">{icon}</div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
      </div>
      <div className="mt-2 text-3xl font-extrabold text-black">{value}</div>
      {hint ? <div className="text-xs text-slate-500 mt-0.5">{hint}</div> : null}
    </div>
  );
}
