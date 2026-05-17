"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  RefreshCw,
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
          icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
          bg: "bg-blue-50",
          text: "text-blue-700",
        },
        {
          label: "Hoàn thành",
          value: dashboard.completedStudents,
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          bg: "bg-green-50",
          text: "text-green-700",
        },
        {
          label: "Cần phụ đạo",
          value: dashboard.remedialRequiredStudents,
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          bg: "bg-orange-50",
          text: "text-orange-700",
        },
        {
          label: "Không lên lớp",
          value: dashboard.failedPromotions,
          icon: <TrendingDown className="h-5 w-5 text-red-500" />,
          bg: "bg-red-50",
          text: "text-red-700",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <BarChart3 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Academic Dashboard</h2>
            <p className="text-xs text-gray-500">Theo dõi tiến trình học thuật toàn trung tâm</p>
          </div>
        </div>
        <button
          onClick={loadDashboard}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="h-3 w-3" />
          Làm mới
        </button>
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className={`rounded-2xl border p-5 ${stat.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  {stat.icon}
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{stat.label}</p>
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
