"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Building2, Calendar, Download, Sparkles } from "lucide-react";
import { DashboardPage } from "@/components/admin/dashboard";
import { getDashboardOverall } from "@/lib/api/dashboardService";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { DashboardData, DashboardOverallResponse } from "@/types/dashboard";

function toDashboardOverall(rawData: DashboardData | DashboardOverallResponse | undefined): DashboardOverallResponse | null {
  if (!rawData) return null;

  const fullData = rawData as Partial<DashboardData>;
  const summaryData = fullData.summary;
  if (summaryData) {
    const { summary, ...dashboardMeta } = fullData;
    return { ...summary, ...dashboardMeta } as DashboardOverallResponse;
  }

  return rawData as DashboardOverallResponse;
}

function num(...values: Array<number | undefined>): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

export default function StaffScopedDashboardPage() {
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardOverallResponse | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const branchId = user?.branchId?.trim() || "";
  const branchName = user?.branchName?.trim() || "Chi nhánh hiện tại";

  const fetchDashboard = useCallback(async () => {
    if (isUserLoading) return;

    if (!branchId) {
      setData(null);
      setError("Tài khoản staff chưa được gán chi nhánh. Vui lòng kiểm tra cấu hình tài khoản.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardOverall({ branchId });
      const normalized = toDashboardOverall(response?.data as DashboardData | DashboardOverallResponse | undefined);

      if (normalized) {
        setData(normalized);
      } else {
        setError("Dashboard API returned empty data.");
      }
    } catch (fetchError: unknown) {
      console.error("Failed to fetch staff scoped dashboard data", fetchError);
      const errorMessage = (fetchError as Record<string, unknown>)?.message || "Failed to fetch dashboard data.";
      setError(String(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [branchId, isUserLoading]);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const resolvedData = useMemo(() => {
    if (!data) return null;

    const hasBranchPayload =
      (data.branchSummaries?.length ?? 0) > 0 ||
      (data.studentDistribution?.length ?? 0) > 0;

    if (hasBranchPayload || !branchId) {
      return data;
    }

    return {
      ...data,
      branches: {
        totalBranches: 1,
        activeBranches: 1,
        totalStudents: num(data.students?.total, data.students?.totalStudents),
        totalTeachers: num(data.humanResources?.teacherCount),
        totalClasses: 0,
        branchesData: [
          {
            id: branchId,
            name: branchName,
            isActive: true,
            studentCount: num(data.students?.total, data.students?.totalStudents),
            teacherCount: num(data.humanResources?.teacherCount),
            classCount: 0,
            attendanceRate: num(data.attendance?.attendanceRate),
          },
        ],
      },
    };
  }, [branchId, branchName, data]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-2">
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-linear-to-r from-red-600 to-red-700 p-3 shadow-lg">
              <BarChart3 size={25} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-2xl">Tổng quan vận hành</h1>
              <p className="mt-1 flex items-center gap-2 text-gray-600">
                <Sparkles size={14} className="text-red-600" />
                Dashboard theo chi nhánh của tài khoản staff
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2">
              <Building2 size={16} className="text-red-600" />
              <span className="text-sm font-medium text-gray-700">{branchName}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2">
              <Calendar size={16} className="text-red-600" />
              <span className="text-sm font-medium text-gray-700">
                Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => fetchDashboard()}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg"
            >
              <Download size={16} />
              Làm mới dữ liệu
            </button>
          </div>
        </div>
      </div>

      <DashboardPage
        data={resolvedData}
        loading={loading || isUserLoading}
        error={error}
        onRefresh={fetchDashboard}
      />
    </div>
  );
}
