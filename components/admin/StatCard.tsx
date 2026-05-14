import React from "react";

type Props = {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  color?: "red" | "emerald" | "blue" | "violet" | "amber";
  title?: string;
  subtitle?: string;
};

const iconBgColors = {
  red: "bg-gradient-to-br from-red-600 to-red-700",
  emerald: "bg-gradient-to-br from-emerald-600 to-teal-600",
  blue: "bg-gradient-to-br from-blue-600 to-cyan-600",
  violet: "bg-gradient-to-br from-violet-600 to-purple-600",
  amber: "bg-gradient-to-br from-amber-600 to-orange-600",
};

export default function StatCard({ 
  icon, 
  label, 
  value, 
  hint, 
  color = "red",
  title,
  subtitle
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconBgColors[color]} text-white shadow-sm`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600">{label || title}</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
          {(hint || subtitle) && <div className="mt-1 text-xs text-gray-500">{hint || subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
