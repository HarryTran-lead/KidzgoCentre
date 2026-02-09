"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CalendarRange,
  NotebookPen,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Calendar,
  BarChart3,
  Target,
  Download,
  MoreVertical,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function StatCard({
  icon,
  label,
  value,
  hint,
  trend = "up",
  color = "red",
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
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
    black: "bg-gradient-to-r from-gray-800 to-gray-900",
  };

  const trendColors = {
    up: "text-red-600",
    down: "text-gray-600",
    stable: "text-gray-800",
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 p-5 transition-all duration-700 transform cursor-pointer hover:border-red-300 hover:shadow-md ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
          <div className={`text-xs flex items-center gap-1 mt-1 ${trendColors[trend]}`}>
            {trend === "up" && <TrendingUp size={12} />}
            {trend === "down" && <TrendingUp size={12} className="rotate-180" />}
            {trend === "stable" && <span>→</span>}
            {hint}
          </div>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Badge({
  color = "gray",
  children,
}: {
  color?: "gray" | "red" | "black";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    black: "bg-gray-900 text-white border border-gray-800",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

// Chart Data (staff-management) - Updated colors
const leadGrowthData = [
  { month: "T7", leads: 120, qualified: 48 },
  { month: "T8", leads: 142, qualified: 62 },
  { month: "T9", leads: 158, qualified: 71 },
  { month: "T10", leads: 176, qualified: 86 },
  { month: "T11", leads: 195, qualified: 92 },
  { month: "T12", leads: 228, qualified: 108 },
];

const classOpsData = [
  { day: "T2", sessions: 22, conflicts: 1 },
  { day: "T3", sessions: 25, conflicts: 0 },
  { day: "T4", sessions: 24, conflicts: 2 },
  { day: "T5", sessions: 26, conflicts: 1 },
  { day: "T6", sessions: 28, conflicts: 1 },
  { day: "T7", sessions: 18, conflicts: 0 },
  { day: "CN", sessions: 12, conflicts: 0 },
];

const ticketDistribution = [
  { name: "Tư vấn học", value: 45, color: "#dc2626" },       // red-600
  { name: "Đổi lịch", value: 28, color: "#404040" },         // gray-600
  { name: "Báo cáo", value: 18, color: "#171717" },          // gray-900
  { name: "Khác", value: 9, color: "#991b1b" },              // red-800
];

const reportProgressData = [
  { month: "T7", submitted: 62, pending: 18 },
  { month: "T8", submitted: 68, pending: 15 },
  { month: "T9", submitted: 71, pending: 14 },
  { month: "T10", submitted: 75, pending: 12 },
  { month: "T11", submitted: 79, pending: 10 },
  { month: "T12", submitted: 83, pending: 9 },
];

export default function Page() {
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "schedule" | "reports">("overview");

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {payload.map((p: any) => (
            <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <BarChart3 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Vận hành & Học vụ
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles size={14} className="text-red-600" />
                Tổng quan lead, xếp lớp, học bù, báo cáo tháng và ticket hỗ trợ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl">
              <Calendar size={16} className="text-red-600" />
              <span className="text-sm font-medium text-gray-700">Tháng 12/2024</span>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all cursor-pointer flex items-center gap-2">
              <Download size={16} />
              Xuất báo cáo
            </button>
            <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Users size={20} />}
            label="Lead mới (tháng)"
            value="228"
            hint="+17% so với T11"
            trend="up"
            color="red"
            delay={100}
          />
          <StatCard
            icon={<Target size={20} />}
            label="Qualified Lead"
            value="108"
            hint="Tỷ lệ 47%"
            trend="stable"
            color="gray"
            delay={200}
          />
          <StatCard
            icon={<CalendarRange size={20} />}
            label="Ca học tuần này"
            value="155"
            hint="Xung đột: 5"
            trend="down"
            color="gray"
            delay={300}
          />
          <StatCard
            icon={<NotebookPen size={20} />}
            label="Báo cáo tháng"
            value="83% đã nộp"
            hint="Còn 9 báo cáo"
            trend="up"
            color="red"
            delay={400}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className={`flex items-center gap-1 mb-6 p-1 bg-white border border-gray-200 rounded-xl w-fit transition-all duration-700 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        {(
          [
            { key: "overview", label: "Tổng quan" },
            { key: "leads", label: "Lead" },
            { key: "schedule", label: "Lịch học" },
            { key: "reports", label: "Báo cáo" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {activeTab === "overview" && (
        <>
          <div className={`grid lg:grid-cols-2 gap-6 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {/* Lead Growth Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-red-600" />
                    Tăng trưởng Lead
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">6 tháng gần nhất</p>
                </div>
                <Badge color="red">+24% tháng này</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="leads" name="Lead" stroke="#dc2626" fill="url(#leadFill)" strokeWidth={2} />
                    <Area type="monotone" dataKey="qualified" name="Qualified" stroke="#404040" fill="url(#qualifiedFill)" strokeWidth={2} />
                    <defs>
                      <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="qualifiedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#404040" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#404040" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ticket Distribution Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={20} className="text-red-600" />
                    Phân loại ticket
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Theo nhóm yêu cầu</p>
                </div>
                <Badge color="gray">Tuần này</Badge>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ticketDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={90} dataKey="value">
                      {ticketDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value}%`, "Tỷ lệ"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {ticketDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`grid md:grid-cols-2 gap-6 transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {/* Class Operations Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <CalendarRange size={20} className="text-gray-900" />
                  Ca học & xung đột tuần
                </h3>
                <Badge color="gray">7 ngày</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classOpsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="sessions" name="Ca học" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conflicts" name="Xung đột" fill="#404040" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Report Progress Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-600" />
                    Tiến độ báo cáo tháng
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Tỷ lệ nộp & tồn</p>
                </div>
                <Badge color="gray">+4% cải thiện</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="submitted" name="Đã nộp" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="pending" name="Còn lại" stroke="#404040" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Leads Tab */}
      {activeTab === "leads" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                  <TrendingUp size={20} className="text-white" />
                </div>
                Lead & Qualified 6 tháng
              </h3>
              <Badge color="red">Tổng lead: 1,019</Badge>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="leads" name="Lead" stroke="#dc2626" fill="url(#leadFill2)" strokeWidth={3} />
                  <Area type="monotone" dataKey="qualified" name="Qualified" stroke="#404040" fill="url(#qualifiedFill2)" strokeWidth={3} />
                  <defs>
                    <linearGradient id="leadFill2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="qualifiedFill2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#404040" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#404040" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg">
                  <CalendarRange size={20} className="text-white" />
                </div>
                Ca học & xung đột tuần
              </h3>
              <Badge color="gray">Tuần hiện tại</Badge>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classOpsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="sessions" name="Ca học" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="conflicts" name="Xung đột" fill="#404040" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                  <NotebookPen size={20} className="text-white" />
                </div>
                Tiến độ báo cáo tháng
              </h3>
              <Badge color="gray">83% đã nộp</Badge>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="submitted" name="Đã nộp" stroke="#dc2626" strokeWidth={3} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="pending" name="Còn lại" stroke="#404040" strokeWidth={3} dot={{ r: 5 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-8 pt-6 border-t border-gray-200 transition-all duration-700 delay-300 ${isPageLoaded ? "opacity-100" : "opacity-0"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-600" />
            <span>Cập nhật thời gian thực • Dữ liệu được cập nhật lúc 14:30</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              <span>Hoạt động tốt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600" />
              <span>Cần chú ý</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-900" />
              <span>Cần hành động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}