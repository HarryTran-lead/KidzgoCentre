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
  Search,
  Filter,
} from "lucide-react";
import { getStudentProgressDashboard } from "@/lib/api/academicProgressionService";
import type { StudentProgressDashboardDto } from "@/types/academic-progression";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import StatCard from "@/components/admin/StatCard";

export default function AcademicDashboard() {
  const [dashboard, setDashboard] = useState<StudentProgressDashboardDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"all" | "weak">("all");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

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
          value: String(dashboard.inProgressStudents),
          icon: <TrendingUp className="h-5 w-5" />,
          color: "red" as const,

        },
        {
          label: "Hoàn thành",
          value: String(dashboard.completedStudents),
          icon: <CheckCircle2 className="h-5 w-5" />,
          color: "emerald" as const,

        },
        {
          label: "Cần phụ đạo",
          value: String(dashboard.remedialRequiredStudents),
          icon: <AlertTriangle className="h-5 w-5" />,
          color: "amber" as const,

        },
        {
          label: "Không lên lớp",
          value: String(dashboard.failedPromotions),
          icon: <TrendingDown className="h-5 w-5" />,
          color: "blue" as const,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-2xl border border-red-200 bg-white p-5 shadow-sm transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
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
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))}
          </div>

      {/* Filter Card */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Search Box - Full Width */}
          <div className="relative flex-1">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm module hoặc mã..."
              className="w-full h-10 rounded-xl border border-red-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <Select value={moduleFilter} onValueChange={(val) => setModuleFilter(val as "all" | "weak")}>
              <SelectTrigger className="w-full sm:w-auto h-10 px-3 py-2 rounded-xl border border-red-200 bg-white text-xs text-gray-700 transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200 data-[state=open]:border-red-400 data-[state=open]:ring-2 data-[state=open]:ring-red-200 [&>span]:text-gray-500 [&>span]:line-clamp-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả modules</SelectItem>
                <SelectItem value="weak">Modules yếu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

          {/* Weak modules */}
          {dashboard && dashboard.weakModules.length > 0 && (
            <div className={`rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-500" />
                <h3 className="font-semibold text-gray-700">Module yếu (cần chú ý)</h3>
              </div>
              <div className="space-y-3">
                {dashboard.weakModules
                  .filter((mod) => {
                    if (!searchTerm) return true;
                    const search = searchTerm.toLowerCase();
                    return (
                      mod.moduleCode.toLowerCase().includes(search) ||
                      mod.moduleName.toLowerCase().includes(search)
                    );
                  })
                  .map((mod) => (
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

          {dashboard && dashboard.weakModules.length > 0 && searchTerm && dashboard.weakModules.filter((mod) => {
            const search = searchTerm.toLowerCase();
            return (
              mod.moduleCode.toLowerCase().includes(search) ||
              mod.moduleName.toLowerCase().includes(search)
            );
          }).length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Không tìm thấy module phù hợp</p>
              <p className="text-xs text-gray-600 mt-1">Thử thay đổi tìm kiếm hoặc bộ lọc</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
