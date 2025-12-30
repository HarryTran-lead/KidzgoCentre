"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/lightswind/card";
import { cn } from "@/lib/utils";

type QuickStatProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  colorScheme?: "blue" | "green" | "purple" | "orange" | "pink" | "red";
  onClick?: () => void;
};

const colorSchemes = {
  blue: {
    bg: "from-blue-50 to-cyan-50",
    border: "border-blue-100",
    icon: "text-blue-600",
    value: "text-blue-900",
    subtitle: "text-blue-600",
  },
  green: {
    bg: "from-green-50 to-emerald-50",
    border: "border-green-100",
    icon: "text-green-600",
    value: "text-green-900",
    subtitle: "text-green-600",
  },
  purple: {
    bg: "from-purple-50 to-pink-50",
    border: "border-purple-100",
    icon: "text-purple-600",
    value: "text-purple-900",
    subtitle: "text-purple-600",
  },
  orange: {
    bg: "from-orange-50 to-amber-50",
    border: "border-orange-100",
    icon: "text-orange-600",
    value: "text-orange-900",
    subtitle: "text-orange-600",
  },
  pink: {
    bg: "from-pink-50 to-rose-50",
    border: "border-pink-100",
    icon: "text-pink-600",
    value: "text-pink-900",
    subtitle: "text-pink-600",
  },
  red: {
    bg: "from-red-50 to-orange-50",
    border: "border-red-100",
    icon: "text-red-600",
    value: "text-red-900",
    subtitle: "text-red-600",
  },
};

export default function QuickStat({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  colorScheme = "blue",
  onClick,
}: QuickStatProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <Card
      className={cn(
        `bg-linear-to-br ${colors.bg} border ${colors.border} shadow-sm transition-all duration-300`,
        onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn("w-4 h-4", colors.icon)} strokeWidth={2.5} />
          <span className={cn("text-xs font-medium", colors.icon)}>{label}</span>
        </div>
        
        <div className={cn("text-2xl font-bold mb-1", colors.value)}>
          {value}
        </div>
        
        {subtitle && (
          <p className={cn("text-xs", colors.subtitle)}>{subtitle}</p>
        )}

        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <span
              className={cn(
                "text-xs font-semibold",
                trend.isPositive === false ? "text-red-600" : "text-green-600"
              )}
            >
              {trend.isPositive === false ? "↓" : "↑"} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-slate-500">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export a grid wrapper for convenience
export function QuickStatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
