"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { getStudentProgressDashboard } from "@/lib/api/academicProgressionService";
import type { StudentProgressDashboardDto } from "@/types/academic-progression";

export default function AcademicDashboard() {
  const [dashboard, setDashboard] = useState<StudentProgressDashboardDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getStudentProgressDashboard();
    if (res.isSuccess && res.data) {
      setDashboard(res.data);
    } else {
      setError(res.message ?? "Không thể tải dashboard");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const stats = dashboard
    ? [
        {
          label: "Đang học",
          value: dashboard.inProgressStudents,
          icon: <TrendingUp className="h-5 w-5 text-white" />,
          bg: "bg-gradient-to-br from-white to-red-50/30",
          text: "text-red-700",
          iconBg: "bg-blue-600",
          borderColor: "border-red-100",
          gradient: "from-red-600 to-red-700",
        },
        {
          label: "Hoàn thành",
          value: dashboard.completedStudents,
          icon: <CheckCircle2 className="h-5 w-5 text-white" />,
          bg: "bg-gradient-to-br from-white to-red-50/30",
          text: "text-red-700",
          iconBg: "bg-emerald-600",
          borderColor: "border-red-100",
          gradient: "from-red-600 to-red-700",
        },
        {
          label: "Cần phụ đạo",
          value: dashboard.remedialRequiredStudents,
          icon: <AlertTriangle className="h-5 w-5 text-white" />,
          bg: "bg-gradient-to-br from-white to-red-50/30",
          text: "text-red-700",
          iconBg: "bg-amber-500",
          borderColor: "border-red-100",
          gradient: "from-red-600 to-red-700",
        },
        {
          label: "Không lên lớp",
          value: dashboard.failedPromotions,
          icon: <TrendingDown className="h-5 w-5 text-white" />,
          bg: "bg-gradient-to-br from-white to-red-50/30",
          text: "text-red-700",
          iconBg: "bg-red-600",
          borderColor: "border-red-100",
          gradient: "from-red-600 to-red-700",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <BarChart3 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Academic Dashboard</h1>
              <p className="text-sm text-gray-500">Theo dõi tiến trình học thuật toàn trung tâm</p>
            </div>
          </div>
          <button
            onClick={loadDashboard}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
          placeholder="Tìm kiếm học sinh, module, hoặc lớp..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <span className="ml-2 text-sm">Đang tải...</span>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className={`relative overflow-hidden rounded-2xl border ${stat.borderColor} bg-gradient-to-br from-white ${stat.bg} p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102`}>
                <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${stat.gradient}`}></div>
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg ${stat.iconBg} p-2.5 transition-all duration-300`}>
                    {stat.icon}
                  </div>
                  <span className="text-2xl font-bold text-gray-800">
                    {stat.value}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-700">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {stat.value} sinh viên
                </p>
              </div>
            ))}
          </div>

          {/* Weak modules */}
          {dashboard && dashboard.weakModules.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-500" />
                <h3 className="font-semibold text-gray-700">Module yếu (cần chú ý)</h3>
              </div>
              <div className="space-y-3">
                {dashboard.weakModules.map((mod) => (
                  <div key={mod.moduleId} className="flex items-center gap-4 rounded-xl bg-orange-50/60 px-4 py-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
                          {mod.moduleCode}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{mod.moduleName}</span>
                      </div>
                      {/* Completion bar */}
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-orange-400"
                            style={{ width: `${mod.averageCompletionPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {mod.averageCompletionPercent.toFixed(0)}% avg
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{mod.remedialCount}</p>
                      <p className="text-xs text-gray-500">phụ đạo</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboard && dashboard.weakModules.length === 0 && !loading && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <p className="text-sm font-medium text-green-700">Không có module yếu nào</p>
              <p className="text-xs text-green-600 mt-1">Tất cả modules đang hoạt động tốt</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
