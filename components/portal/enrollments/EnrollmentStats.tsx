"use client";

import { Users, CheckCircle, PauseCircle, XCircle } from "lucide-react";
import type { Enrollment } from "@/types/enrollment";

interface EnrollmentStatsProps {
  enrollments: Enrollment[];
  isLoading?: boolean;
}

export default function EnrollmentStats({ enrollments, isLoading }: EnrollmentStatsProps) {
  const enrollmentsArray = Array.isArray(enrollments) ? enrollments : [];

  const stats = {
    total: enrollmentsArray.length,
    active: enrollmentsArray.filter((e) => e.status === "Active").length,
    paused: enrollmentsArray.filter((e) => e.status === "Paused").length,
    dropped: enrollmentsArray.filter((e) => e.status === "Dropped").length,
  };

  const statCards = [
    {
      label: "Tổng ghi danh",
      value: stats.total,
      icon: Users,
      color: "from-red-600 to-red-700",
      subtitle: "Tất cả hồ sơ học",
    },
    {
      label: "Đang học",
      value: stats.active,
      icon: CheckCircle,
      color: "from-gray-600 to-gray-700",
      subtitle: "Đang theo lớp",
    },
    {
      label: "Tạm nghỉ",
      value: stats.paused,
      icon: PauseCircle,
      color: "from-gray-700 to-gray-800",
      subtitle: "Tạm dừng học",
    },
    {
      label: "Đã nghỉ",
      value: stats.dropped,
      icon: XCircle,
      color: "from-red-500 to-red-600",
      subtitle: "Kết thúc ghi danh",
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
