import React from "react";

type Props = {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  color?: "pink" | "mint" | "yellow" | "blue";
};

const tone = {
  pink: "bg-pink-50 ring-pink-100",
  mint: "bg-emerald-50 ring-emerald-100",
  yellow: "bg-amber-50 ring-amber-100",
  blue: "bg-sky-50 ring-sky-100",
};

export default function StatCard({ icon, label, value, hint, color = "pink" }: Props) {
  return (
    <div className={`rounded-2xl border border-slate-200 p-5 ring-1 ${tone[color]}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/70 ring-1 ring-slate-200">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">{label}</div>
          {/* value luôn đen */}
          <div className="mt-1 text-3xl font-extrabold text-black">{value}</div>
          {hint ? <div className="mt-1 text-xs text-gray-700">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}
