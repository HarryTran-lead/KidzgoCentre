"use client";

import { Calendar, Clock, CheckCircle, XCircle, UserX } from "lucide-react";
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
    cancelled: testsArray.filter((t) => t.status === "Cancelled").length,
    noShow: testsArray.filter((t) => t.status === "NoShow").length,
  };

  const statCards = [
    {
      label: "Tổng số test",
      value: stats.total,
      icon: Calendar,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      label: "Đã đặt lịch",
      value: stats.scheduled,
      icon: Clock,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Đã hoàn thành",
      value: stats.completed,
      icon: CheckCircle,
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "Không đến",
      value: stats.noShow,
      icon: UserX,
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
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
            className="group relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-6 transition-all hover:shadow-lg hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <Icon size={24} className={stat.textColor} />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
          </div>
        );
      })}
    </div>
  );
}
