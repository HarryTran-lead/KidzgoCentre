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
      color: "from-gray-600 to-gray-700",
      subtitle: "Đang chờ kiểm tra",
    },
    {
      label: "Đã hoàn thành",
      value: stats.completed,
      icon: CheckCircle2,
      color: "from-gray-700 to-gray-800",
      subtitle: "Đã có kết quả",
    },
    {
      label: "Không đến",
      value: stats.noShow,
      icon: UserX,
      color: "from-red-500 to-red-600",
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
            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md"
          >
            <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-5 blur-xl bg-linear-to-r ${stat.color}`} />
            <div className="relative flex items-center justify-between gap-3">
              <div className={`rounded-xl bg-linear-to-r ${stat.color} p-2 text-white shadow-sm`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-gray-600">{stat.label}</div>
                <div className="leading-tight text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="truncate text-[11px] text-gray-500">{stat.subtitle}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
