"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDashboardOverall } from "@/lib/api/dashboardService";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import type { DashboardOverallResponse } from "@/types/dashboard";
import { DashboardPage } from "@/components/admin/dashboard";

export default function Page() {
  const { selectedBranchId } = useBranchFilter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardOverallResponse | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardOverall(
        selectedBranchId ? { branchId: selectedBranchId } : undefined
      );

      const summaryData = (response?.data as any)?.summary || response?.data;

      if (summaryData) {
        setData(summaryData);
      } else {
        setError("Dashboard API returned empty data.");
      }
    } catch (fetchError: any) {
      console.error("Failed to fetch dashboard data", fetchError);
      setError(fetchError?.message || "Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const resolvedData = useMemo(() => data, [data]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <DashboardPage
        data={resolvedData}
        loading={loading}
        error={error}
        onRefresh={fetchDashboard}
      />
    </div>
  );
}
