"use client";

import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  colorScheme?: "red" | "emerald" | "blue" | "violet" | "amber";
}

const iconColorMap: Record<NonNullable<KpiCardProps["colorScheme"]>, string> = {
  red: "from-red-600 to-red-700",
  emerald: "from-emerald-600 to-teal-600",
  blue: "from-blue-600 to-cyan-600",
  violet: "from-violet-600 to-purple-600",
  amber: "from-amber-600 to-orange-600",
};

const trendStyle: Record<NonNullable<KpiCardProps["trend"]>, string> = {
  up: "text-red-600 bg-red-50 border-red-100",
  down: "text-gray-600 bg-gray-100 border-gray-200",
  neutral: "text-gray-600 bg-gray-50 border-gray-200",
};

export default function KpiCard({ title, value, subValue, icon, trend = "neutral", colorScheme = "red" }: KpiCardProps) {
  const iconGradient = iconColorMap[colorScheme];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
      <div className="absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-r from-red-600 to-red-700 opacity-10 blur-xl" />
      <div className="flex items-start gap-3 relative z-10">
        {icon ? (
          <div className={`rounded-xl bg-gradient-to-r ${iconGradient} p-2.5 text-white flex-shrink-0`}>
            <span className="text-white">{icon}</span>
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl font-bold text-gray-900 leading-tight mt-1">{value}</p>
          {subValue ? (
            <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full mt-2 ${trendStyle[trend]}`}>
              {subValue}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}