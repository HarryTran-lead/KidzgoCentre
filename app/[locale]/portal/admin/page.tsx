"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDashboardOverall } from "@/lib/api/dashboardService";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { usePageI18n } from "@/hooks/usePageI18n";
import type { DashboardOverallResponse } from "@/types/dashboard";
import { DashboardPage } from "@/components/admin/dashboard";
import { BarChart3, Sparkles, Calendar, Download, MoreVertical } from "lucide-react";

export default function Page() {
  const { messages } = usePageI18n();
  const t = messages.adminPages.dashboard;
  const { selectedBranchId } = useBranchFilter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardOverallResponse | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

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
    setIsPageLoaded(true);
  }, [fetchDashboard]);

  const resolvedData = useMemo(() => data, [data]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header - Redesigned to match the first page */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <BarChart3 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {t.header.title}
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles size={14} className="text-red-600" />
                {t.header.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl">
              <Calendar size={16} className="text-red-600" />
              <span className="text-sm font-medium text-gray-700">{t.header.month} {new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
            </div>
            <button 
              onClick={() => fetchDashboard()}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Download size={16} />
              {t.header.refreshData}
            </button>
            <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <DashboardPage
        data={resolvedData}
        loading={loading}
        error={error}
        onRefresh={fetchDashboard}
      />
    </div>
  );
}