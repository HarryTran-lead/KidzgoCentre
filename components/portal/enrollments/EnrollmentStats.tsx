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
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      label: "Đang học",
      value: stats.active,
      icon: CheckCircle,
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "Tạm nghỉ",
      value: stats.paused,
      icon: PauseCircle,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      label: "Đã nghỉ",
      value: stats.dropped,
      icon: XCircle,
      color: "from-rose-500 to-red-500",
      bgColor: "bg-rose-50",
      textColor: "text-rose-600",
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
            className="group relative overflow-hidden rounded-2xl border border-pink-200 bg-linear-to-br from-white to-pink-50/30 p-6 transition-all hover:shadow-lg hover:scale-105"
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
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r ${stat.color}`} />
          </div>
        );
      })}
    </div>
  );
}
