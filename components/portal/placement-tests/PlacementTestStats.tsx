"use client";

import { CalendarClock, Calendar, CheckCircle2, UserX } from "lucide-react";
import type { PlacementTest } from "@/types/placement-test";

interface PlacementTestStatsProps {
  tests: PlacementTest[];
  isLoading?: boolean;
}

export default function PlacementTestStats({ tests, isLoading }: PlacementTestStatsProps) {
  const testsArray = Array.isArray(tests) ? tests : [];
  
  const stats = {
    total: testsArray.length,
    scheduled: testsArray.filter((t) => t.status === "Scheduled").length,
    completed: testsArray.filter((t) => t.status === "Completed").length,
    noShow: testsArray.filter((t) => t.status === "NoShow").length,
  };

  const statCards = [
    {
      label: "Tổng số test",
      value: stats.total,
      icon: Calendar,
      color: "from-red-600 to-red-700",
      subtitle: "Tất cả lịch test",
    },
    {
      label: "Đã đặt lịch",
      value: stats.scheduled,
      icon: CalendarClock,
      color: "from-blue-600 to-cyan-600",
      subtitle: "Đang chờ kiểm tra",
    },
    {
      label: "Đã hoàn thành",
      value: stats.completed,
      icon: CheckCircle2,
      color: "from-emerald-600 to-teal-600",
      subtitle: "Đã có kết quả",
    },
    {
      label: "Không đến",
      value: stats.noShow,
      icon: UserX,
      color: "from-amber-600 to-orange-600",
      subtitle: "Vắng mặt buổi test",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-gray-200 bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102"
          >
            <div className={`absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700`} />
            <div className="relative flex items-center gap-3">
              <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-2 text-white shadow-sm flex-shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-600">{stat.label}</div>
                <div className="leading-tight text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="truncate text-[11px] text-gray-500">{stat.subtitle}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
