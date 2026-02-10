"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Users, UserCog, BookOpen, DollarSign, TrendingUp, Clock,
  MapPin, BarChart3, Sparkles, Calendar, AlertCircle,
  ArrowUpRight, ArrowDownRight, MoreVertical, Target,
  TrendingDown, Activity
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";

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

// Chart Data
const revenueData = [
  { month: 'T7', revenue: 3200000, target: 3500000 },
  { month: 'T8', revenue: 4200000, target: 4000000 },
  { month: 'T9', revenue: 5200000, target: 4500000 },
  { month: 'T10', revenue: 6800000, target: 5000000 },
  { month: 'T11', revenue: 8200000, target: 5500000 },
  { month: 'T12', revenue: 12000000, target: 6000000 },
];

const studentGrowthData = [
  { month: 'T7', new: 45, total: 320 },
  { month: 'T8', new: 52, total: 372 },
  { month: 'T9', new: 68, total: 440 },
  { month: 'T10', new: 74, total: 514 },
  { month: 'T11', new: 85, total: 599 },
  { month: 'T12', new: 92, total: 691 },
];

const classDistributionData = [
  { name: 'Beginner', value: 35, color: '#dc2626' },
  { name: 'Intermediate', value: 28, color: '#404040' },
  { name: 'Advanced', value: 22, color: '#171717' },
  { name: 'Business', value: 15, color: '#991b1b' },
];

const attendanceData = [
  { day: 'T2', rate: 92 },
  { day: 'T3', rate: 88 },
  { day: 'T4', rate: 95 },
  { day: 'T5', rate: 90 },
  { day: 'T6', rate: 94 },
  { day: 'T7', rate: 89 },
  { day: 'CN', rate: 85 },
];

const performanceData = [
  { subject: 'Listening', score: 85, fullMark: 100 },
  { subject: 'Reading', score: 78, fullMark: 100 },
  { subject: 'Writing', score: 65, fullMark: 100 },
  { subject: 'Speaking', score: 72, fullMark: 100 },
  { subject: 'Grammar', score: 88, fullMark: 100 },
];

export default function Page() {
  const pathname = usePathname();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    setActiveTab("overview");
  }, [pathname]);

  // Custom Tooltip for Revenue Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-red-600">
            Doanh thu: {new Intl.NumberFormat('vi-VN').format(payload[0].value)} VND
          </p>
          <p className="text-sm text-gray-700">
            Mục tiêu: {new Intl.NumberFormat('vi-VN').format(payload[1].value)} VND
          </p>
        </div>
      );
    }
    return null;
  };

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
              <span className="text-sm font-medium text-gray-700">Tháng 12/2024</span>
            </div>
            <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Users size={20} />}
            label="Tổng học viên"
            value="691"
            hint="+92 (12%)"
            trend="up"
            color="red"
            delay={100}
          />
          <StatCard
            icon={<UserCog size={20} />}
            label="Giáo viên"
            value="24"
            hint="+6 (25%)"
            trend="up"
            color="gray"
            delay={200}
          />
          <StatCard
            icon={<BookOpen size={20} />}
            label="Lớp học"
            value="48"
            hint="+8 (20%)"
            trend="up"
            color="black"
            delay={300}
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Doanh thu tháng"
            value="12.2M VND"
            hint="+3.2M (35%)"
            trend="up"
            color="red"
            delay={400}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`flex items-center gap-1 mb-6 p-1 bg-white border border-gray-200 rounded-xl w-fit transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        {["overview", "revenue", "students", "performance"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === tab
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-50"
              }`}
          >
            {tab === "overview" && "Tổng quan"}
            {tab === "revenue" && "Doanh thu"}
            {tab === "students" && "Học viên"}
            {tab === "performance" && "Hiệu suất"}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {activeTab === "overview" && (
        <>
          <div className={`grid lg:grid-cols-2 gap-6 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-red-600" />
                    Tăng trưởng doanh thu
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">6 tháng gần nhất</p>
                </div>
                <Badge color="red">
                  <Target size={14} />
                  Đạt 142% mục tiêu
                </Badge>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu thực tế"
                      stroke="#dc2626"
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      name="Mục tiêu"
                      stroke="#404040"
                      fill="url(#colorTarget)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#404040" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#404040" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <span className="text-sm text-gray-600">Doanh thu thực tế</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-600 border-2 border-gray-600 border-dashed"></div>
                  <span className="text-sm text-gray-600">Mục tiêu</span>
                </div>
              </div>
            </div>

            {/* Student Growth Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Users size={20} className="text-gray-900" />
                    Tăng trưởng học viên
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Tổng số và học viên mới</p>
                </div>
                <Badge color="red">
                  +47% so với cùng kỳ
                </Badge>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={studentGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                      formatter={(value) => [value, ""]}
                      labelFormatter={(label) => `Tháng ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Tổng học viên"
                      stroke="#171717"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="new"
                      name="Học viên mới"
                      stroke="#dc2626"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Class Distribution */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen size={20} className="text-gray-900" />
                  Phân bố cấp độ lớp
                </h3>
                <Badge color="gray">
                  48 lớp đang hoạt động
                </Badge>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {classDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Tỷ lệ"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {classDistributionData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Radar Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Target size={20} className="text-red-600" />
                  Đánh giá hiệu suất
                </h3>
                <Badge color="red">
                  Tổng điểm: 78/100
                </Badge>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Điểm số"
                      dataKey="score"
                      stroke="#dc2626"
                      fill="#dc2626"
                      fillOpacity={0.3}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="text-lg font-bold text-red-600">85</div>
                  <div className="text-xs text-red-700">Listening</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-lg font-bold text-gray-900">88</div>
                  <div className="text-xs text-gray-700">Grammar</div>
                </div>
                <div className="text-center p-3 bg-gray-100 rounded-xl border border-gray-200">
                  <div className="text-lg font-bold text-gray-900">65</div>
                  <div className="text-xs text-gray-700">Writing</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Attendance Rate */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-red-600" />
                Tỷ lệ điểm danh tuần
              </h3>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      domain={[80, 100]}
                    />
                    <Tooltip formatter={(value) => [`${value}%`, "Tỷ lệ"]} />
                    <Bar
                      dataKey="rate"
                      name="Tỷ lệ điểm danh"
                      fill="#dc2626"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">92%</div>
                  <div className="text-xs text-gray-600">Cao nhất (T2)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">89%</div>
                  <div className="text-xs text-gray-600">Trung bình tuần</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-700">85%</div>
                  <div className="text-xs text-gray-600">Thấp nhất (CN)</div>
                </div>
              </div>
            </div>

            {/* Today's Classes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Clock size={20} className="text-red-600" />
                  Lớp học hôm nay
                </h3>
                <Badge color="red">3 lớp</Badge>
              </div>

              <div className="space-y-3">
                {[
                  { name: "English B1-01", time: "08:00 - 10:00", room: "P101", status: "active", teacher: "Ms. Anna" },
                  { name: "IELTS Prep-02", time: "14:00 - 16:00", room: "P203", status: "upcoming", teacher: "Mr. David" },
                  { name: "TOEIC Advanced", time: "18:00 - 20:00", room: "P105", status: "upcoming", teacher: "Ms. Sarah" },
                ].map((cls, i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{cls.name}</div>
                      <Badge color={cls.status === "active" ? "red" : "gray"}>
                        {cls.status === "active" ? "Đang diễn ra" : "Sắp diễn ra"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {cls.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          {cls.room}
                        </div>
                      </div>
                      <div className="text-gray-700">{cls.teacher}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee Reminders */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-600" />
                  Nhắc nhở học phí
                </h3>
                <Badge color="red">2 quá hạn</Badge>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Nguyễn Văn A", course: "English B1", due: "Hôm nay", amount: "2,500,000", status: "due" },
                  { name: "Trần Thị B", course: "IELTS Prep", due: "Quá 3 ngày", amount: "3,200,000", status: "overdue" },
                  { name: "Lê Văn C", course: "TOEIC", due: "15/12", amount: "2,800,000", status: "upcoming" },
                ].map((fee, i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{fee.name}</div>
                      <Badge color={fee.status === "overdue" ? "red" : fee.status === "due" ? "gray" : "black"}>
                        {fee.due}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{fee.course}</span>
                      <span className="font-semibold text-gray-900">{fee.amount} VND</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer">
                Xem tất cả nhắc nhở
              </button>
            </div>
          </div>
        </>
      )}

      {/* Tab Revenue */}
      {activeTab === "revenue" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Revenue Chart - Full Width */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                  <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  Tăng trưởng doanh thu 6 tháng
                </h3>
                <p className="text-sm text-gray-600 mt-2 ml-12">Phân tích chi tiết doanh thu theo tháng</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge color="red">
                  <Target size={14} />
                  Đạt 142% mục tiêu
                </Badge>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-700">Tăng trưởng tích cực</span>
                </div>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu thực tế"
                    stroke="#dc2626"
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    name="Mục tiêu"
                    stroke="#404040"
                    fill="url(#colorTarget)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#404040" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#404040" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-sm text-gray-600">Doanh thu thực tế</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-600 border-2 border-gray-600 border-dashed"></div>
                <span className="text-sm text-gray-600">Mục tiêu</span>
              </div>
            </div>
          </div>

          {/* Revenue by Source */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                  <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                    <DollarSign size={18} className="text-white" />
                  </div>
                  Doanh thu theo nguồn
                </h3>
                <Badge color="red">Tổng: 12.2M VND</Badge>
              </div>
              <div className="space-y-5">
                {[
                  { source: "Học phí", amount: "8.5M", percent: 70, color: "red", icon: "📚" },
                  { source: "Phí thi", amount: "2.1M", percent: 17, color: "black", icon: "📝" },
                  { source: "Tài liệu", amount: "1.2M", percent: 10, color: "gray", icon: "📖" },
                  { source: "Khác", amount: "0.4M", percent: 3, color: "darkRed", icon: "💼" },
                ].map((item, i) => (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-sm font-semibold text-gray-800">{item.source}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200">{item.amount} VND</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`bg-gradient-to-r ${
                          item.color === "red" ? "from-red-600 to-red-700" :
                          item.color === "black" ? "from-gray-900 to-gray-800" :
                          item.color === "gray" ? "from-gray-600 to-gray-700" :
                          "from-red-800 to-red-900"
                        } h-3 rounded-full transition-all duration-700 group-hover:shadow-lg`}
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-600">{item.percent}% tổng doanh thu</div>
                      <div className="text-xs font-medium text-gray-700">{(item.percent / 100 * 12.2).toFixed(1)}M VND</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                  <div className="p-2 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg">
                    <Calendar size={18} className="text-white" />
                  </div>
                  Top 5 khóa học doanh thu cao
                </h3>
                <Badge color="red">5 khóa học</Badge>
              </div>
              <div className="space-y-3">
                {[
                  { course: "IELTS Foundation", revenue: "2.8M", students: 45, rank: 1 },
                  { course: "TOEIC Advanced", revenue: "2.1M", students: 32, rank: 2 },
                  { course: "Business English", revenue: "1.9M", students: 28, rank: 3 },
                  { course: "Academic Writing", revenue: "1.5M", students: 22, rank: 4 },
                  { course: "Conversation Practice", revenue: "1.2M", students: 18, rank: 5 },
                ].map((item, i) => (
                  <div key={i} className="group p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer hover:shadow-md hover:border-gray-300">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                          item.rank === 1 ? "bg-gradient-to-r from-red-600 to-red-700 text-white" :
                          item.rank === 2 ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white" :
                          item.rank === 3 ? "bg-gradient-to-r from-red-800 to-red-900 text-white" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {item.rank}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900 block">{item.course}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Users size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-600">{item.students} học viên</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-red-600 block">{item.revenue} VND</span>
                        <span className="text-xs text-gray-500">{(parseFloat(item.revenue.replace('M', '')) / 12.2 * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-gradient-to-r from-red-600 to-red-700 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${(parseFloat(item.revenue.replace('M', '')) / 2.8) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Students */}
      {activeTab === "students" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Student Growth Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Users size={20} className="text-red-600" />
                  Tăng trưởng học viên 6 tháng
                </h3>
                <p className="text-sm text-gray-600 mt-1">Tổng số và học viên mới theo tháng</p>
              </div>
              <Badge color="red">
                +47% so với cùng kỳ
              </Badge>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={studentGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    formatter={(value) => [value, ""]}
                    labelFormatter={(label) => `Tháng ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Tổng học viên"
                    stroke="#171717"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="new"
                    name="Học viên mới"
                    stroke="#dc2626"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Student Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-gray-900" />
                Phân bố học viên theo cấp độ
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {classDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Tỷ lệ"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-red-600" />
                Top 5 lớp có nhiều học viên nhất
              </h3>
              <div className="space-y-3">
                {[
                  { course: "IELTS Foundation", students: 45, capacity: 50 },
                  { course: "TOEIC Intermediate", students: 38, capacity: 40 },
                  { course: "Business English", students: 32, capacity: 35 },
                  { course: "Academic Writing", students: 28, capacity: 30 },
                  { course: "Conversation Practice", students: 25, capacity: 30 },
                ].map((item, i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{item.course}</span>
                      <span className="text-sm font-bold text-red-600">{item.students}/{item.capacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-600 to-red-700 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(item.students / item.capacity) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{Math.round((item.students / item.capacity) * 100)}% đầy</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Performance */}
      {activeTab === "performance" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Performance Radar Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Target size={20} className="text-red-600" />
                  Đánh giá hiệu suất tổng thể
                </h3>
                <p className="text-sm text-gray-600 mt-1">Phân tích chi tiết các kỹ năng</p>
              </div>
              <Badge color="red">
                Tổng điểm: 78/100
              </Badge>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={performanceData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Điểm số"
                    dataKey="score"
                    stroke="#dc2626"
                    fill="#dc2626"
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-5 gap-3 mt-6">
              {performanceData.map((item, i) => (
                <div key={i} className={`text-center p-3 rounded-xl border ${
                  i === 0 ? "bg-red-50 border-red-100" :
                  i === 1 ? "bg-gray-50 border-gray-100" :
                  i === 2 ? "bg-gray-100 border-gray-200" :
                  i === 3 ? "bg-red-100 border-red-200" :
                  "bg-gray-50 border-gray-100"
                }`}>
                  <div className={`text-lg font-bold ${
                    i === 0 ? "text-red-600" :
                    i === 1 ? "text-gray-900" :
                    i === 2 ? "text-gray-900" :
                    i === 3 ? "text-red-700" :
                    "text-gray-900"
                  }`}>{item.score}</div>
                  <div className={`text-xs mt-1 ${
                    i === 0 ? "text-red-700" :
                    i === 1 ? "text-gray-700" :
                    i === 2 ? "text-gray-700" :
                    i === 3 ? "text-red-800" :
                    "text-gray-700"
                  }`}>{item.subject}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-red-600" />
              Tỷ lệ điểm danh tuần
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    domain={[80, 100]}
                  />
                  <Tooltip formatter={(value) => [`${value}%`, "Tỷ lệ"]} />
                  <Bar
                    dataKey="rate"
                    name="Tỷ lệ điểm danh"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">92%</div>
                <div className="text-xs text-gray-600">Cao nhất (T2)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">89%</div>
                <div className="text-xs text-gray-600">Trung bình tuần</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700">85%</div>
                <div className="text-xs text-gray-600">Thấp nhất (CN)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-8 pt-6 border-t border-gray-200 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-600" />
            <span>Cập nhật thời gian thực • Dữ liệu được cập nhật lúc 09:30</span>
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