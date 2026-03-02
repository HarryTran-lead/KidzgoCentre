"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  Users, BookOpen, TrendingUp, Clock,
  MapPin, BarChart3, Sparkles, Calendar, AlertCircle,
  MoreVertical, Target, Activity, Building2, GraduationCap,
  FileText, Ticket, Loader2
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { getAdminOverview } from "@/lib/api/dashboardService";
import type { AdminOverviewResponse } from "@/types/dashboard";
import { useBranchFilter } from "@/hooks/useBranchFilter";

// StatCard Component
function StatCard({
  icon,
  label,
  value,
  hint,
  trend = "up",
  color = "red",
  delay = 0
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  trend?: "up" | "down" | "stable";
  color?: "red" | "gray" | "black";
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    red: "bg-gradient-to-r from-red-600 to-red-700",
    gray: "bg-gradient-to-r from-gray-600 to-gray-700",
    black: "bg-gradient-to-r from-gray-800 to-gray-900"
  };

  const trendColors = {
    up: "text-red-600",
    down: "text-gray-600",
    stable: "text-gray-800"
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 p-5 transition-all duration-700 transform cursor-pointer hover:border-red-300 hover:shadow-md ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
          {hint && (
            <div className={`text-xs flex items-center gap-1 mt-1 ${trendColors[trend]}`}>
              {trend === "up" && <TrendingUp size={12} />}
              {trend === "down" && <TrendingUp size={12} className="rotate-180" />}
              {trend === "stable" && <span>→</span>}
              {hint}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Badge Component
function Badge({
  color = "gray",
  children
}: {
  color?: "gray" | "red" | "black";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    black: "bg-gray-900 text-white border border-gray-800"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

// Status badge color
function getStatusColor(status: string): "red" | "gray" | "black" {
  const s = status?.toLowerCase();
  if (["active", "open", "ongoing", "enrolled"].includes(s)) return "red";
  if (["pending", "upcoming", "scheduled", "draft"].includes(s)) return "gray";
  return "black";
}

// Priority color
function getPriorityColor(priority: string): "red" | "gray" | "black" {
  const p = priority?.toLowerCase();
  if (["high", "critical", "urgent"].includes(p)) return "red";
  if (["medium", "normal"].includes(p)) return "gray";
  return "black";
}

// Loading skeleton
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-3 bg-gray-200 rounded w-24"></div>
          <div className="h-7 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-48 mb-6"></div>
      <div className="h-64 bg-gray-100 rounded-xl"></div>
    </div>
  );
}

export default function Page() {
  const pathname = usePathname();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedBranchId } = useBranchFilter();

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    setActiveTab("overview");
  }, [pathname]);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminOverview(
        selectedBranchId ? { branchId: selectedBranchId } : undefined
      );
      if (res?.data) {
        setData(res.data);
      } else {
        setError("Không thể tải dữ liệu tổng quan");
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err?.message || "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived chart data
  const branchChartData = data?.branches?.map(b => ({
    name: b.name,
    classCount: b.classCount,
    studentCount: b.studentCount,
  })) ?? [];

  const classStatusData = (() => {
    if (!data?.classes) return [];
    const statusMap: Record<string, number> = {};
    data.classes.forEach(c => {
      const s = c.status || "Khác";
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const colors = ["#dc2626", "#404040", "#171717", "#991b1b", "#6b7280"];
    return Object.entries(statusMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  })();

  const classCapacityData = data?.classes
    ?.filter(c => c.capacity > 0)
    ?.sort((a, b) => (b.enrollmentCount / b.capacity) - (a.enrollmentCount / a.capacity))
    ?.slice(0, 8)
    ?.map(c => ({
      name: c.code,
      enrolled: c.enrollmentCount,
      capacity: c.capacity,
      fillRate: Math.round((c.enrollmentCount / c.capacity) * 100),
    })) ?? [];

  const stats = data?.statistics;

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <BarChart3 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Trung tâm KidzGo Analytics
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                Tổng quan hoạt động và hiệu suất
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl">
              <Calendar size={16} className="text-red-600" />
              <span className="text-sm font-medium text-gray-700">
                {new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
              </span>
            </div>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
                <Loader2 size={16} className="text-red-600 animate-spin" />
                <span className="text-sm text-gray-600">Đang tải...</span>
              </div>
            )}
            <button
              onClick={fetchData}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading && !data ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                icon={<Users size={20} />}
                label="Tổng học viên"
                value={stats?.totalStudents?.toLocaleString("vi-VN") ?? "0"}
                hint={`${stats?.upcomingSessions ?? 0} buổi sắp tới`}
                trend="up"
                color="red"
                delay={100}
              />
              <StatCard
                icon={<Building2 size={20} />}
                label="Chi nhánh"
                value={stats?.totalBranches?.toString() ?? "0"}
                hint={`${stats?.totalClasses ?? 0} lớp tổng cộng`}
                trend="stable"
                color="gray"
                delay={200}
              />
              <StatCard
                icon={<BookOpen size={20} />}
                label="Lớp đang hoạt động"
                value={stats?.activeClasses?.toString() ?? "0"}
                hint={`/${stats?.totalClasses ?? 0} tổng lớp`}
                trend="up"
                color="black"
                delay={300}
              />
              <StatCard
                icon={<Ticket size={20} />}
                label="Tickets & Báo cáo chờ"
                value={`${(stats?.openTickets ?? 0) + (stats?.pendingReports ?? 0)}`}
                hint={`${stats?.openTickets ?? 0} ticket, ${stats?.pendingReports ?? 0} báo cáo`}
                trend={(stats?.openTickets ?? 0) > 5 ? "down" : "stable"}
                color="red"
                delay={400}
              />
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`flex items-center gap-1 mb-6 p-1 bg-white border border-gray-200 rounded-xl w-fit transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        {["overview", "students", "classes", "operations"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === tab
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-50"
              }`}
          >
            {tab === "overview" && "Tổng quan"}
            {tab === "students" && "Học viên"}
            {tab === "classes" && "Lớp học"}
            {tab === "operations" && "Vận hành"}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {activeTab === "overview" && (
        <>
          <div className={`grid lg:grid-cols-2 gap-6 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Branch Overview Chart */}
            {loading && !data ? <SkeletonChart /> : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Building2 size={20} className="text-red-600" />
                      Tổng quan chi nhánh
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Số lớp & học viên theo chi nhánh</p>
                  </div>
                  <Badge color="red">
                    {data?.branches?.length ?? 0} chi nhánh
                  </Badge>
                </div>

                <div className="h-64">
                  {branchChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="classCount" name="Số lớp" fill="#dc2626" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="studentCount" name="Học viên" fill="#404040" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Không có dữ liệu chi nhánh
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Class Status Distribution */}
            {loading && !data ? <SkeletonChart /> : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen size={20} className="text-gray-900" />
                    Phân bố trạng thái lớp
                  </h3>
                  <Badge color="gray">
                    {stats?.totalClasses ?? 0} lớp
                  </Badge>
                </div>

                <div className="h-64">
                  {classStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={classStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {classStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Số lớp"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Không có dữ liệu lớp học
                    </div>
                  )}
                </div>

                {classStatusData.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {classStatusData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-sm text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Class Capacity Chart */}
            {loading && !data ? <SkeletonChart /> : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Target size={20} className="text-red-600" />
                    Tỷ lệ lấp đầy lớp học
                  </h3>
                  <Badge color="red">
                    Top {classCapacityData.length} lớp
                  </Badge>
                </div>

                <div className="h-64">
                  {classCapacityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classCapacityData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          width={80}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="enrolled" name="Đã ghi danh" fill="#dc2626" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="capacity" name="Sức chứa" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Không có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats Summary */}
            {loading && !data ? <SkeletonChart /> : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-red-600" />
                  Thống kê nhanh
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats?.totalStudents ?? 0}</div>
                    <div className="text-xs text-red-700 mt-1">Tổng học viên</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats?.activeClasses ?? 0}</div>
                    <div className="text-xs text-gray-700 mt-1">Lớp hoạt động</div>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-xl border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats?.totalSessions ?? 0}</div>
                    <div className="text-xs text-gray-700 mt-1">Tổng buổi học</div>
                  </div>
                  <div className="p-4 bg-red-100 rounded-xl border border-red-200 text-center">
                    <div className="text-2xl font-bold text-red-700">{stats?.upcomingSessions ?? 0}</div>
                    <div className="text-xs text-red-800 mt-1">Buổi sắp tới</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats?.pendingReports ?? 0}</div>
                    <div className="text-xs text-gray-700 mt-1">Báo cáo chờ</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats?.openTickets ?? 0}</div>
                    <div className="text-xs text-red-700 mt-1">Ticket mở</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row */}
          <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Clock size={20} className="text-red-600" />
                  Buổi học sắp tới
                </h3>
                <Badge color="red">{data?.upcomingSessions?.length ?? 0} buổi</Badge>
              </div>

              <div className="space-y-3">
                {loading && !data ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-3 border border-gray-200 rounded-xl animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    ))}
                  </div>
                ) : data?.upcomingSessions?.length ? (
                  data.upcomingSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{session.classCode}</div>
                        <Badge color={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDateTime(session.plannedDatetime)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Không có buổi học sắp tới</div>
                )}
              </div>
            </div>

            {/* Recent Enrollments */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap size={20} className="text-red-600" />
                  Ghi danh gần đây
                </h3>
                <Badge color="red">{data?.recentEnrollments?.length ?? 0} ghi danh</Badge>
              </div>

              <div className="space-y-3">
                {loading && !data ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-3 border border-gray-200 rounded-xl animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    ))}
                  </div>
                ) : data?.recentEnrollments?.length ? (
                  data.recentEnrollments.slice(0, 5).map((enrollment) => (
                    <div key={enrollment.id} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{enrollment.studentName}</div>
                        <Badge color={getStatusColor(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{enrollment.classCode}</span>
                        <span>{formatDate(enrollment.enrollDate)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Không có ghi danh gần đây</div>
                )}
              </div>
            </div>

            {/* Open Tickets */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-600" />
                  Ticket đang mở
                </h3>
                <Badge color="red">{data?.openTickets?.length ?? 0} ticket</Badge>
              </div>

              <div className="space-y-3">
                {loading && !data ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-3 border border-gray-200 rounded-xl animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    ))}
                  </div>
                ) : data?.openTickets?.length ? (
                  data.openTickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 truncate flex-1 mr-2">{ticket.title}</div>
                        <Badge color={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <Badge color={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Không có ticket đang mở</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab Students */}
      {activeTab === "students" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Students by Branch */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Users size={20} className="text-red-600" />
                  Phân bố học viên theo chi nhánh
                </h3>
                <p className="text-sm text-gray-600 mt-1">Tổng: {stats?.totalStudents ?? 0} học viên</p>
              </div>
              <Badge color="red">{data?.branches?.length ?? 0} chi nhánh</Badge>
            </div>

            <div className="h-80">
              {branchChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                    <Tooltip />
                    <Bar dataKey="studentCount" name="Số học viên" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Không có dữ liệu
                </div>
              )}
            </div>
          </div>

          {/* Student List */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-red-600" />
                Danh sách học viên
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data?.students?.length ? (
                  data.students.slice(0, 10).map((student) => (
                    <div key={student.profileId} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{student.displayName}</span>
                        <Badge color="red">{student.activeEnrollments} lớp</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin size={12} />
                        {student.branchName}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Không có dữ liệu học viên</div>
                )}
              </div>
            </div>

            {/* Recent Enrollments - Detailed */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap size={20} className="text-gray-900" />
                Ghi danh gần đây
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data?.recentEnrollments?.length ? (
                  data.recentEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{enrollment.studentName}</span>
                        <Badge color={getStatusColor(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{enrollment.classCode}</span>
                        <span className="font-medium text-gray-700">{formatDate(enrollment.enrollDate)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Không có ghi danh gần đây</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Classes */}
      {activeTab === "classes" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Class Capacity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen size={20} className="text-red-600" />
                  Tỷ lệ lấp đầy lớp học
                </h3>
                <p className="text-sm text-gray-600 mt-1">Ghi danh / Sức chứa</p>
              </div>
              <Badge color="red">{stats?.activeClasses ?? 0} lớp hoạt động</Badge>
            </div>

            <div className="h-80">
              {classCapacityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classCapacityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="enrolled" name="Đã ghi danh" fill="#dc2626" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="capacity" name="Sức chứa" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">Không có dữ liệu</div>
              )}
            </div>
          </div>

          {/* Class List */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-gray-900" />
                Danh sách lớp học
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data?.classes?.length ? (
                  data.classes.map((cls) => (
                    <div key={cls.id} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900">{cls.title}</div>
                          <div className="text-xs text-gray-500">{cls.code}</div>
                        </div>
                        <Badge color={getStatusColor(cls.status)}>
                          {cls.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <MapPin size={12} /> {cls.branchName}
                        </span>
                        <span className="font-semibold text-red-600">{cls.enrollmentCount}/{cls.capacity}</span>
                      </div>
                      {cls.capacity > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div
                            className="bg-gradient-to-r from-red-600 to-red-700 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((cls.enrollmentCount / cls.capacity) * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Không có dữ liệu lớp học</div>
                )}
              </div>
            </div>

            {/* Branch Class Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-red-600" />
                Lớp theo chi nhánh
              </h3>
              <div className="space-y-3">
                {data?.branches?.length ? (
                  data.branches.map((branch) => (
                    <div key={branch.id} className="p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">{branch.name}</div>
                          <div className="text-xs text-gray-500">{branch.code}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-center border border-red-100">
                          <div className="text-lg font-bold text-red-600">{branch.classCount}</div>
                          <div className="text-xs text-red-700">Lớp học</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center border border-gray-100">
                          <div className="text-lg font-bold text-gray-900">{branch.studentCount}</div>
                          <div className="text-xs text-gray-700">Học viên</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Không có dữ liệu chi nhánh</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Operations */}
      {activeTab === "operations" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Pending Reports & Tickets Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={<FileText size={20} />}
              label="Báo cáo chờ duyệt"
              value={stats?.pendingReports?.toString() ?? "0"}
              color="red"
            />
            <StatCard
              icon={<Ticket size={20} />}
              label="Ticket đang mở"
              value={stats?.openTickets?.toString() ?? "0"}
              color="gray"
            />
            <StatCard
              icon={<Clock size={20} />}
              label="Buổi học sắp tới"
              value={stats?.upcomingSessions?.toString() ?? "0"}
              color="black"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pending Reports */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-red-600" />
                  Báo cáo chờ duyệt
                </h3>
                <Badge color="red">{data?.pendingReports?.length ?? 0} báo cáo</Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data?.pendingReports?.length ? (
                  data.pendingReports.map((report) => (
                    <div key={report.id} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{report.studentName}</div>
                        <Badge color={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{report.classCode}</span>
                        <span>{formatDate(report.reportMonth)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Không có báo cáo chờ duyệt</div>
                )}
              </div>
            </div>

            {/* Open Tickets - Full */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Ticket size={20} className="text-red-600" />
                  Ticket đang mở
                </h3>
                <Badge color="red">{data?.openTickets?.length ?? 0} ticket</Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data?.openTickets?.length ? (
                  data.openTickets.map((ticket) => (
                    <div key={ticket.id} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 truncate flex-1 mr-2">{ticket.title}</div>
                        <Badge color={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <Badge color={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Không có ticket đang mở</div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Sessions - Full */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-red-600" />
                Lịch buổi học sắp tới
              </h3>
              <Badge color="red">{data?.upcomingSessions?.length ?? 0} buổi</Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data?.upcomingSessions?.length ? (
                data.upcomingSessions.map((session) => (
                  <div key={session.id} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{session.classCode}</div>
                      <Badge color={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={12} />
                      {formatDateTime(session.plannedDatetime)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-400 text-sm">Không có buổi học sắp tới</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-8 pt-6 border-t border-gray-200 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-600" />
            <span>
              Cập nhật lúc{" "}
              {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              {" "}• Dữ liệu từ API
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              <span>Hoạt động tốt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <span>Cần chú ý</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-900"></div>
              <span>Cần hành động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}