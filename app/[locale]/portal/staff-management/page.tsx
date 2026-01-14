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
  color = "pink",
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  trend?: "up" | "down" | "stable";
  color?: "pink" | "green" | "yellow" | "blue" | "purple";
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    pink: "bg-gradient-to-r from-pink-500 to-rose-500",
    green: "bg-gradient-to-r from-emerald-500 to-teal-500",
    yellow: "bg-gradient-to-r from-amber-500 to-orange-500",
    blue: "bg-gradient-to-r from-blue-500 to-sky-500",
    purple: "bg-gradient-to-r from-purple-500 to-indigo-500",
  };

  const trendColors = {
    up: "text-emerald-600",
    down: "text-rose-600",
    stable: "text-amber-600",
  };

  return (
    <div
      className={`bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5 transition-all duration-700 transform cursor-pointer ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
          <div className={`text-xs flex items-center gap-1 mt-1 ${trendColors[trend]}`}>
            {trend === "up" && <ArrowUpRight size={12} />}
            {trend === "down" && <ArrowDownRight size={12} />}
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
  color?: "gray" | "blue" | "red" | "green" | "purple" | "yellow" | "pink";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    red: "bg-rose-50 text-rose-700 border border-rose-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    yellow: "bg-amber-50 text-amber-700 border border-amber-200",
    pink: "bg-pink-50 text-pink-700 border border-pink-200",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

// Chart Data (staff-management)
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
  { name: "Tư vấn học", value: 45, color: "#3b82f6" },
  { name: "Đổi lịch", value: 28, color: "#8b5cf6" },
  { name: "Báo cáo", value: 18, color: "#10b981" },
  { name: "Khác", value: 9, color: "#f59e0b" },
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
        <div className="bg-white p-3 rounded-xl border border-pink-200 shadow-lg">
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
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
              <BarChart3 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Vận hành & Học vụ
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles size={14} className="text-pink-500" />
                Tổng quan lead, xếp lớp, học bù, báo cáo tháng và ticket hỗ trợ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 rounded-xl">
              <Calendar size={16} className="text-pink-500" />
              <span className="text-sm font-medium text-gray-700">Tháng 12/2024</span>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all cursor-pointer flex items-center gap-2">
              <Download size={16} />
              Xuất báo cáo
            </button>
            <button className="p-2 bg-white border border-pink-200 rounded-xl hover:bg-pink-50 transition-colors cursor-pointer">
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
            color="pink"
            delay={100}
          />
          <StatCard
            icon={<Target size={20} />}
            label="Qualified Lead"
            value="108"
            hint="Tỷ lệ 47%"
            trend="stable"
            color="blue"
            delay={200}
          />
          <StatCard
            icon={<CalendarRange size={20} />}
            label="Ca học tuần này"
            value="155"
            hint="Xung đột: 5"
            trend="down"
            color="yellow"
            delay={300}
          />
          <StatCard
            icon={<NotebookPen size={20} />}
            label="Báo cáo tháng"
            value="83% đã nộp"
            hint="Còn 9 báo cáo"
            trend="up"
            color="green"
            delay={400}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className={`flex items-center gap-1 mb-6 p-1 bg-white border border-pink-200 rounded-xl w-fit transition-all duration-700 ${
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
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                : "text-gray-700 hover:bg-pink-50"
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
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-500" />
                    Tăng trưởng Lead
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">6 tháng gần nhất</p>
                </div>
                <Badge color="blue">+24% tháng này</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="leads" name="Lead" stroke="#3b82f6" fill="url(#leadFill)" strokeWidth={2} />
                    <Area type="monotone" dataKey="qualified" name="Qualified" stroke="#10b981" fill="url(#qualifiedFill)" strokeWidth={2} />
                    <defs>
                      <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="qualifiedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={20} className="text-purple-500" />
                    Phân loại ticket
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Theo nhóm yêu cầu</p>
                </div>
                <Badge color="purple">Tuần này</Badge>
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
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-pink-50/50 rounded-xl transition-colors cursor-pointer">
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
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <CalendarRange size={20} className="text-emerald-500" />
                  Ca học & xung đột tuần
                </h3>
                <Badge color="green">7 ngày</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classOpsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="sessions" name="Ca học" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conflicts" name="Xung đột" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle size={20} className="text-rose-500" />
                    Tiến độ báo cáo tháng
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Tỷ lệ nộp & tồn</p>
                </div>
                <Badge color="pink">+4% cải thiện</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="submitted" name="Đã nộp" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="pending" name="Còn lại" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "leads" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-sky-500 rounded-lg">
                  <TrendingUp size={20} className="text-white" />
                </div>
                Lead & Qualified 6 tháng
              </h3>
              <Badge color="blue">Tổng lead: 1,019</Badge>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="leads" name="Lead" stroke="#3b82f6" fill="url(#leadFill2)" strokeWidth={2} />
                  <Area type="monotone" dataKey="qualified" name="Qualified" stroke="#10b981" fill="url(#qualifiedFill2)" strokeWidth={2} />
                  <defs>
                    <linearGradient id="leadFill2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="qualifiedFill2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <CalendarRange size={20} className="text-white" />
                </div>
                Ca học & xung đột tuần
              </h3>
              <Badge color="green">Tuần hiện tại</Badge>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classOpsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="sessions" name="Ca học" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conflicts" name="Xung đột" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
                  <NotebookPen size={20} className="text-white" />
                </div>
                Tiến độ báo cáo tháng
              </h3>
              <Badge color="pink">83% đã nộp</Badge>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="submitted" name="Đã nộp" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="pending" name="Còn lại" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-8 pt-6 border-t border-pink-200 transition-all duration-700 delay-300 ${isPageLoaded ? "opacity-100" : "opacity-0"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-pink-500" />
            <span>Cập nhật thời gian thực • Dữ liệu được cập nhật lúc 14:30</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Ổn định</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Cần chú ý</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Cần hành động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
