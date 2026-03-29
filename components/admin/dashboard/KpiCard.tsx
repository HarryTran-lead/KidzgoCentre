"use client";

import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
}

const trendStyle: Record<NonNullable<KpiCardProps["trend"]>, string> = {
  up: "text-emerald-600 bg-emerald-50 border-emerald-100",
  down: "text-red-600 bg-red-50 border-red-100",
  neutral: "text-slate-600 bg-slate-100 border-slate-200",
};

export default function KpiCard({ title, value, subValue, icon, trend = "neutral" }: KpiCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon ? <div className="rounded-xl bg-slate-100 p-2 text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">{icon}</div> : null}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subValue ? (
        <div className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${trendStyle[trend]}`}>
          {subValue}
        </div>
      ) : null}
    </div>
  );
}
