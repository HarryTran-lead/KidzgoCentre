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
  up: "text-red-600 bg-red-50 border-red-100",
  down: "text-gray-600 bg-gray-100 border-gray-200",
  neutral: "text-gray-600 bg-gray-50 border-gray-200",
};

export default function KpiCard({ title, value, subValue, icon, trend = "neutral" }: KpiCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon ? (
          <div className="rounded-xl bg-gray-100 p-2 text-gray-600 transition group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:to-red-700 group-hover:text-white">
            {icon}
          </div>
        ) : null}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subValue ? (
        <div className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${trendStyle[trend]}`}>
          {subValue}
        </div>
      ) : null}
    </div>
  );
}