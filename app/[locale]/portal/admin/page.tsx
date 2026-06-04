"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDashboardOverall } from "@/lib/api/dashboardService";
import { getAllBranches } from "@/lib/api/branchService";
import { getAllUsers } from "@/lib/api/userService";
import { getAllClasses } from "@/lib/api/classService";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { usePageI18n } from "@/hooks/usePageI18n";
import type { DashboardOverallResponse } from "@/types/dashboard";
import { DashboardPage } from "@/components/admin/dashboard";
import { BarChart3, Sparkles, Calendar, Download } from "lucide-react";

export default function Page() {
  const { messages } = usePageI18n();
  const t = messages.adminPages.dashboard;
  const { selectedBranchId } = useBranchFilter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardOverallResponse | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [userStats, setUserStats] = useState<Record<string, { students: number; teachers: number }>>({});
  const [classStats, setClassStats] = useState<Record<string, number>>({});
  const [branchesData, setBranchesData] = useState<Array<{
    id: string;
    name: string;
    address?: string;
    isActive: boolean;
    studentCount: number;
    teacherCount: number;
    classCount: number;
  }>>([]);

  // Fetch users to calculate student and teacher counts by branch
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        const response = await getAllUsers({ pageSize: 500, isActive: true });
        const responseData = response.data || response;

        if ((response.success || response.isSuccess) && responseData?.items) {
          const allUsers = responseData.items;
          const stats: Record<string, { students: number; teachers: number }> = {};

          allUsers.forEach((user) => {
            const branchId = (user.branchId as string | undefined) || "no-branch";
            if (!stats[branchId]) {
              stats[branchId] = { students: 0, teachers: 0 };
            }

            if (user.role === "Teacher") {
              stats[branchId].teachers += 1;
            }

            if (user.profiles && Array.isArray(user.profiles)) {
              const studentProfiles = (user.profiles as Array<Record<string, unknown>>).filter(
                (p: Record<string, unknown>) => p.profileType === "Student"
              );
              stats[branchId].students += studentProfiles.length;
            }
          });

          setUserStats(stats);
        }
      } catch (error) {
        console.error("Error fetching users data:", error);
      }
    };

    fetchUsersData();
  }, []);

  // Fetch classes to calculate class counts by branch
  useEffect(() => {
    const fetchClassesData = async () => {
      try {
        const response = await getAllClasses({ pageSize: 500, pageNumber: 1 });
        const responseData = response.data || response;

        if ((response.success || response.isSuccess) && responseData?.classes?.items) {
          const allClasses = responseData.classes.items;
          const stats: Record<string, number> = {};

          allClasses.forEach((classItem: { branchId?: string }) => {
            const branchId = classItem.branchId as string;
            if (branchId) {
              stats[branchId] = (stats[branchId] || 0) + 1;
            }
          });

          setClassStats(stats);
        }
      } catch (error) {
        console.error("Error fetching classes data:", error);
      }
    };

    fetchClassesData();
  }, []);

  // Fetch branches
  useEffect(() => {
    const fetchBranchesData = async () => {
      try {
        const response = await getAllBranches({
          page: 1,
          limit: 100,
          sortBy: "createdAt" as const,
          sortOrder: "desc" as const,
        });

        const responseData = response.data;

        if ((response.success || response.isSuccess) && responseData) {
          const branches = responseData.branches || [];
          
          // Enrich branches with stats
          const enrichedBranches = branches.map((branch) => {
            const branchStats = userStats[branch.id];
            const classCount = classStats[branch.id] || 0;

            return {
              ...branch,
              studentCount: branchStats?.students || (branch.totalStudents as number) || 0,
              teacherCount: branchStats?.teachers || (branch.totalTeachers as number) || 0,
              classCount: classCount || (branch.totalClasses as number) || 0,
            };
          });

          setBranchesData(enrichedBranches);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    if (Object.keys(userStats).length > 0 && Object.keys(classStats).length > 0) {
      fetchBranchesData();
    }
  }, [userStats, classStats]);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardOverall(
        selectedBranchId ? { branchId: selectedBranchId } : undefined
      );

      const summaryData = (response?.data as unknown as Record<string, unknown>)?.summary || response?.data;

      if (summaryData) {
        setData(summaryData as DashboardOverallResponse);
      } else {
        setError("Dashboard API returned empty data.");
      }
    } catch (fetchError: unknown) {
      console.error("Failed to fetch dashboard data", fetchError);
      const errorMessage = (fetchError as Record<string, unknown>)?.message || "Failed to fetch dashboard data.";
      setError(String(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchDashboard();
    setIsPageLoaded(true);
  }, [fetchDashboard]);

  const resolvedData = useMemo(() => {
    if (!data) return null;

    const totalStudents = branchesData.reduce((sum, b) => sum + (b.studentCount || 0), 0);
    const totalTeachers = branchesData.reduce((sum, b) => sum + (b.teacherCount || 0), 0);
    const activeBranches = branchesData.filter((b) => b.isActive).length;
    const totalClasses = branchesData.reduce((sum, b) => sum + (b.classCount || 0), 0);

    return {
      ...data,
      branches: {
        totalBranches: branchesData.length,
        activeBranches,
        totalStudents,
        totalTeachers,
        totalClasses,
        branchesData,
      },
    };
  }, [data, branchesData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-2">
      {/* Header - Redesigned to match the first page */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-linear-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <BarChart3 size={25} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-2xl font-bold text-gray-900">
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
              className="px-4 py-2 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Download size={16} />
              {t.header.refreshData}
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