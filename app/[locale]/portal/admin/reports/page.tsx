"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  DollarSign,
  GraduationCap,
  CheckCircle2,
  Calendar,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Eye,
  BookOpen,
  Clock,
  MapPin,
  UserCheck,
  Building,
  BarChart3,
  Target,
  Activity,
  ChevronRight,
  Star,
  Percent,
  Layers,
  CreditCard,
  Shield,
  Zap,
} from "lucide-react";
import clsx from "clsx";

/* ------------------------ UI Components ------------------------ */
type SummaryCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
};
function SummaryCard({ icon, label, value, hint, trend = "neutral", trendValue }: SummaryCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 transition-all duration-300 hover:border-pink-300 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 grid place-items-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600">
              {icon}
            </div>
            <div className="text-sm font-medium text-pink-600">{label}</div>
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">
            {value}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {trend === "up" && (
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                <TrendingUp size={12} />
                {trendValue || hint}
              </div>
            )}
            {trend === "down" && (
              <div className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                <TrendingDown size={12} />
                {trendValue || hint}
              </div>
            )}
            {trend === "neutral" && hint && (
              <div className="text-xs text-gray-500">{hint}</div>
            )}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye size={18} className="text-pink-400" />
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {action && <div className="text-sm text-pink-600">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function ProgressBar({
  value,
  className,
  color = "pink",
}: {
  value: number;
  className?: string;
  color?: "pink" | "emerald" | "blue" | "amber" | "purple";
}) {
  const colorClasses = {
    pink: "bg-gradient-to-r from-pink-500 to-rose-500",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-500",
    blue: "bg-gradient-to-r from-blue-500 to-sky-500",
    amber: "bg-gradient-to-r from-amber-500 to-orange-500",
    purple: "bg-gradient-to-r from-purple-500 to-indigo-500",
  };

  return (
    <div className={clsx("h-2 w-full rounded-full bg-pink-100", className)}>
      <div
        className={clsx("h-2 rounded-full transition-all duration-500", colorClasses[color])}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

function StatBadge({
  children,
  color = "blue",
}: {
  children: React.ReactNode;
  color?: "pink" | "emerald" | "blue" | "amber" | "purple" | "rose";
}) {
  const colorClasses = {
    pink: "bg-pink-50 text-pink-700 border border-pink-200",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    rose: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", colorClasses[color])}>
      {children}
    </span>
  );
}

/* ------------------------------- Page Component ------------------------------- */
export default function ReportsPage() {
  const [tab, setTab] = useState<
    "tuyensinh" | "doanhthu" | "khoahoc" | "giaovien" | "cosovatchat"
  >("tuyensinh");

  // Demo data
  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  
  // Enrollment data
  const enrollSeries = [45, 52, 48, 61, 56, 59, 63, 58, 70, 76, 82, 90];
  const maxEnroll = Math.max(...enrollSeries);
  
  // Revenue data
  const revenueData = months.map((month, i) => ({
    month,
    revenue: [320, 420, 520, 680, 820, 950, 1200, 1350, 1500, 1680, 1850, 2000][i] * 1000,
    target: [350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900][i] * 1000,
  }));

  // Course distribution
  const distribution = useMemo(
    () => [
      { name: "English B1", pct: 35, color: "bg-violet-500", students: 72, revenue: "48M" },
      { name: "IELTS Prep", pct: 19, color: "bg-emerald-500", students: 38, revenue: "32M" },
      { name: "TOEIC", pct: 11, color: "bg-amber-500", students: 22, revenue: "18M" },
      { name: "Business English", pct: 9, color: "bg-orange-500", students: 18, revenue: "15M" },
      { name: "English A2", pct: 12, color: "bg-green-500", students: 25, revenue: "16M" },
      { name: "English B2", pct: 14, color: "bg-blue-600", students: 28, revenue: "20M" },
    ],
    []
  );

  // Teacher data
  const teachers = [
    { name: "Ms. Anna", subject: "IELTS", rating: 4.9, students: 45, status: "active" },
    { name: "Mr. David", subject: "Business", rating: 4.8, students: 38, status: "active" },
    { name: "Ms. Sarah", subject: "TOEIC", rating: 4.7, students: 32, status: "active" },
    { name: "Mr. John", subject: "General", rating: 4.6, students: 28, status: "on-leave" },
    { name: "Ms. Lisa", subject: "Speaking", rating: 4.9, students: 42, status: "active" },
  ];

  // Facility data
  const facilities = [
    { name: "Phòng học P101", type: "Classroom", capacity: 25, status: "available", usage: 92 },
    { name: "Lab 201", type: "Computer Lab", capacity: 20, status: "in-use", usage: 100 },
    { name: "Thư viện", type: "Library", capacity: 30, status: "available", usage: 65 },
    { name: "Hội trường", type: "Auditorium", capacity: 100, status: "maintenance", usage: 40 },
    { name: "Phòng tự học", type: "Study Room", capacity: 15, status: "available", usage: 78 },
  ];

  // Course performance
  const coursePerformance = [
    { course: "IELTS Foundation", completion: 92, satisfaction: 4.8, revenue: "28.5M" },
    { course: "TOEIC Advanced", completion: 88, satisfaction: 4.7, revenue: "21.2M" },
    { course: "Business English", completion: 85, satisfaction: 4.6, revenue: "19.8M" },
    { course: "Academic Writing", completion: 90, satisfaction: 4.9, revenue: "15.5M" },
    { course: "Conversation Practice", completion: 82, satisfaction: 4.5, revenue: "12.1M" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
              <BarChart3 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Báo cáo & Thống kê KidzGo
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Shield size={14} className="text-pink-500" />
                Tổng hợp báo cáo và phân tích dữ liệu thời gian thực
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 rounded-xl">
              <Calendar size={16} className="text-pink-500" />
              <span className="text-sm font-medium text-gray-700">01/01/2025</span>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">31/10/2025</span>
            </div>

            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-pink-50 transition-colors">
              <Filter size={16} />
              Lọc
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all">
              <Download size={16} />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<Users className="text-pink-600" />}
            label="Tổng học viên"
            value="487"
            trend="up"
            trendValue="+8.2%"
          />
          <SummaryCard
            icon={<DollarSign className="text-emerald-600" />}
            label="Doanh thu YTD"
            value="1.48B VND"
            trend="up"
            trendValue="+15.3%"
          />
          <SummaryCard
            icon={<GraduationCap className="text-blue-600" />}
            label="Khóa học hoạt động"
            value="7"
            trend="up"
            trendValue="+1"
          />
          <SummaryCard
            icon={<CheckCircle2 className="text-amber-600" />}
            label="Tỷ lệ hoàn thành"
            value="94.2%"
            trend="up"
            trendValue="+2.1%"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 rounded-2xl border border-pink-200 bg-white p-1">
        <div className="flex flex-wrap">
          {[
            { key: "tuyensinh", label: "Tuyển sinh", icon: Users },
            { key: "doanhthu", label: "Doanh thu", icon: DollarSign },
            { key: "khoahoc", label: "Khóa học", icon: BookOpen },
            { key: "giaovien", label: "Giáo viên", icon: UserCheck },
            { key: "cosovatchat", label: "Cơ sở vật chất", icon: Building },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={clsx(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                tab === (t.key as typeof tab)
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-pink-50"
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content - Tuyển sinh */}
      {tab === "tuyensinh" && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Enrollment Trend Chart */}
          <SectionCard 
            title="Xu hướng tuyển sinh theo tháng"
            action={<StatBadge color="pink"><TrendingUp size={12} /> +24% so với năm trước</StatBadge>}
          >
            <div className="mt-6 grid grid-cols-12 items-end gap-3">
              {enrollSeries.map((v, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="relative w-8">
                    <div
                      className="w-8 rounded-t-xl bg-gradient-to-t from-pink-500 to-rose-400 transition-all hover:from-pink-600 hover:to-rose-500"
                      style={{
                        height: `${(v / maxEnroll) * 200 + 30}px`,
                      }}
                      title={`${months[i]}: ${v} học viên`}
                    />
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-600">
                      {v}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-4">{months[i]}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-4 border-t border-pink-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
                  <span className="text-gray-600">Học viên mới</span>
                </div>
                <div className="text-gray-900 font-semibold">Tổng: 723 học viên</div>
              </div>
            </div>
          </SectionCard>

          {/* Course Distribution */}
          <SectionCard title="Phân bố học viên theo khóa học">
            <div className="space-y-4">
              {distribution.map((d) => (
                <div key={d.name} className="group p-3 rounded-xl border border-pink-100 hover:border-pink-300 hover:bg-pink-50/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg ${d.color} flex items-center justify-center text-white font-bold`}>
                      {d.pct}%
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">{d.name}</div>
                        <div className="text-sm font-bold text-gray-900">{d.students} HV</div>
                      </div>
                      <ProgressBar value={d.pct} color={
                        d.color.includes("violet") ? "purple" :
                        d.color.includes("emerald") ? "emerald" :
                        d.color.includes("amber") ? "amber" :
                        d.color.includes("orange") ? "amber" :
                        d.color.includes("green") ? "emerald" : "blue"
                      } />
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>Doanh thu: {d.revenue} VND</span>
                        <span>{d.pct}% tổng số</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Enrollment Details */}
          <SectionCard title="Chi tiết tuyển sinh theo khóa học">
            <div className="grid gap-4 md:grid-cols-2">
              {distribution.map((c) => (
                <div
                  key={c.name}
                  className="group rounded-xl border border-pink-200 bg-white p-4 hover:border-pink-300 hover:shadow-md transition-all"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${c.color}`}></div>
                      <div className="font-semibold text-gray-900">{c.name}</div>
                    </div>
                    <StatBadge color="pink">{c.students} HV</StatBadge>
                  </div>
                  <div className="text-3xl font-extrabold text-gray-900">
                    {c.students}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">học viên đang theo học</div>
                  <div className="mb-2">
                    <ProgressBar value={(c.students / 80) * 100} color={
                      c.color.includes("violet") ? "purple" :
                      c.color.includes("emerald") ? "emerald" :
                      c.color.includes("amber") ? "amber" :
                      c.color.includes("orange") ? "amber" :
                      c.color.includes("green") ? "emerald" : "blue"
                    } />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tỷ lệ lấp đầy</span>
                    <span className="font-semibold text-gray-900">
                      {Math.min(Math.round((c.students / 80) * 100), 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Monthly Comparison */}
          <SectionCard title="So sánh tháng hiện tại vs cùng kỳ">
            <div className="space-y-4">
              {[
                { metric: "Học viên mới", current: 76, previous: 58, change: "+31%" },
                { metric: "Đăng ký trực tuyến", current: 45, previous: 32, change: "+40%" },
                { metric: "Đăng ký trực tiếp", current: 31, previous: 26, change: "+19%" },
                { metric: "Tỷ lệ chuyển đổi", current: "68%", previous: "62%", change: "+6%" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-pink-100 hover:bg-pink-50/50">
                  <div className="font-medium text-gray-900">{item.metric}</div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{item.current}</div>
                      <div className="text-xs text-gray-500">Hiện tại</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{item.previous}</div>
                      <div className="text-xs text-gray-500">Cùng kỳ</div>
                    </div>
                    <StatBadge color={item.change.startsWith("+") ? "emerald" : "rose"}>
                      {item.change}
                    </StatBadge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Content - Doanh thu */}
      {tab === "doanhthu" && (
        <div className="grid gap-6">
          {/* Revenue Overview */}
          <div className="grid gap-6 md:grid-cols-3">
            <SectionCard title="Doanh thu tháng này">
              <div className="text-4xl font-bold text-gray-900 mb-2">248M VND</div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-emerald-600 font-medium">+15.3%</span>
                <span className="text-gray-500 text-sm">so với tháng trước</span>
              </div>
              <ProgressBar value={85} color="emerald" className="mt-4" />
              <div className="text-xs text-gray-500 mt-2">Đạt 85% mục tiêu tháng</div>
            </SectionCard>

            <SectionCard title="Doanh thu trung bình/ngày">
              <div className="text-4xl font-bold text-gray-900 mb-2">8.27M VND</div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-emerald-600 font-medium">+8.2%</span>
                <span className="text-gray-500 text-sm">tăng trưởng</span>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Cao nhất:</span>
                  <span className="font-semibold">12.5M VND</span>
                </div>
                <div className="flex justify-between">
                  <span>Thấp nhất:</span>
                  <span className="font-semibold">5.2M VND</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Tỷ lệ hoàn thành mục tiêu">
              <div className="text-4xl font-bold text-gray-900 mb-2">142%</div>
              <div className="flex items-center gap-2">
                <Target size={16} className="text-pink-600" />
                <span className="text-pink-600 font-medium">Vượt 42%</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-lg bg-emerald-50">
                  <div className="text-lg font-bold text-emerald-700">12</div>
                  <div className="text-xs text-emerald-600">Tháng liên tiếp</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-pink-50">
                  <div className="text-lg font-bold text-pink-700">1.48B</div>
                  <div className="text-xs text-pink-600">Tổng YTD</div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Revenue Chart */}
          <SectionCard 
            title="Biểu đồ doanh thu theo tháng"
            action={<StatBadge color="emerald"><TrendingUp size={12} /> Tăng trưởng ổn định</StatBadge>}
          >
            <div className="mt-6">
              <div className="grid grid-cols-12 gap-4">
                {revenueData.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-4">
                    <div className="relative w-8 h-40 flex items-end">
                      {/* Actual Revenue */}
                      <div
                        className="absolute w-8 rounded-t-lg bg-gradient-to-t from-blue-500 to-sky-400"
                        style={{ height: `${(item.revenue / 2000000) * 160}px` }}
                        title={`${item.month}: ${(item.revenue / 1000000).toFixed(1)}M`}
                      />
                      {/* Target */}
                      <div
                        className="absolute w-8 rounded-t-lg border-2 border-amber-500 border-dashed"
                        style={{ height: `${(item.target / 2000000) * 160}px` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-gray-500">{item.month}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-4 border-t border-pink-100">
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-sky-500"></div>
                    <span className="text-sm text-gray-600">Doanh thu thực tế</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-amber-500 border-dashed"></div>
                    <span className="text-sm text-gray-600">Mục tiêu</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Revenue by Source */}
          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard title="Doanh thu theo nguồn">
              <div className="space-y-4">
                {[
                  { source: "Học phí khóa học", amount: "85%", value: "1.26B", color: "blue" },
                  { source: "Phí thi chứng chỉ", amount: "8%", value: "118M", color: "emerald" },
                  { source: "Tài liệu học tập", amount: "4%", value: "59M", color: "purple" },
                  { source: "Dịch vụ bổ trợ", amount: "3%", value: "44M", color: "amber" },
                ].map((item, i) => (
                  <div key={i} className="group p-3 rounded-xl border border-pink-100 hover:bg-pink-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{item.source}</div>
                      <div className="font-bold text-gray-900">{item.value} VND</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <ProgressBar value={parseInt(item.amount)} color={item.color as any} />
                      <div className="ml-4 text-sm font-semibold text-gray-900">{item.amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Top khóa học doanh thu cao">
              <div className="space-y-3">
                {[
                  { course: "IELTS Foundation", revenue: "285M", students: 45, growth: "+32%" },
                  { course: "TOEIC Advanced", revenue: "212M", students: 32, growth: "+28%" },
                  { course: "Business English", revenue: "198M", students: 28, growth: "+24%" },
                  { course: "Academic Writing", revenue: "155M", students: 22, growth: "+19%" },
                  { course: "Conversation Practice", revenue: "121M", students: 18, growth: "+15%" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-pink-100 hover:bg-pink-50/50">
                    <div>
                      <div className="font-medium text-gray-900">{item.course}</div>
                      <div className="text-xs text-gray-500">{item.students} học viên</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{item.revenue} VND</div>
                      <StatBadge color="emerald">{item.growth}</StatBadge>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Content - Khóa học */}
      {tab === "khoahoc" && (
        <div className="grid gap-6">
          {/* Course Performance Overview */}
          <div className="grid gap-6 md:grid-cols-3">
            <SectionCard title="Số khóa học đang hoạt động">
              <div className="text-4xl font-bold text-gray-900 mb-2">7</div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-emerald-600 font-medium">+1 khóa</span>
                <span className="text-gray-500 text-sm">so với quý trước</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg bg-blue-50">
                  <div className="text-lg font-bold text-blue-700">4</div>
                  <div className="text-xs text-blue-600">Đang mở</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-50">
                  <div className="text-lg font-bold text-amber-700">3</div>
                  <div className="text-xs text-amber-600">Sắp khai giảng</div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Tỷ lệ hoàn thành trung bình">
              <div className="text-4xl font-bold text-gray-900 mb-2">94.2%</div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-emerald-600 font-medium">+2.1%</span>
                <span className="text-gray-500 text-sm">cải thiện</span>
              </div>
              <ProgressBar value={94.2} color="emerald" className="mt-4" />
              <div className="text-xs text-gray-500 mt-2">Mục tiêu: 95%</div>
            </SectionCard>

            <SectionCard title="Đánh giá học viên">
              <div className="text-4xl font-bold text-gray-900 mb-2">4.7/5</div>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={20} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">5 sao:</span>
                  <span className="font-semibold">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">4 sao:</span>
                  <span className="font-semibold">26%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">3 sao trở xuống:</span>
                  <span className="font-semibold">6%</span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Course Performance Table */}
          <SectionCard title="Hiệu suất các khóa học">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-pink-100">
                    <th className="pb-3 text-left font-semibold text-gray-900">Khóa học</th>
                    <th className="pb-3 text-left font-semibold text-gray-900">Tỷ lệ hoàn thành</th>
                    <th className="pb-3 text-left font-semibold text-gray-900">Đánh giá</th>
                    <th className="pb-3 text-left font-semibold text-gray-900">Doanh thu</th>
                    <th className="pb-3 text-left font-semibold text-gray-900">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {coursePerformance.map((course, i) => (
                    <tr key={i} className="border-b border-pink-50 hover:bg-pink-50/50">
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{course.course}</div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={course.completion} color="emerald" className="w-24" />
                          <span className="font-semibold">{course.completion}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{course.satisfaction}</span>
                          <span className="text-sm text-gray-500">/5</span>
                        </div>
                      </td>
                      <td className="py-3 font-bold text-gray-900">{course.revenue} VND</td>
                      <td className="py-3">
                        <StatBadge color={
                          course.completion >= 90 ? "emerald" :
                          course.completion >= 80 ? "blue" : "amber"
                        }>
                          {course.completion >= 90 ? "Xuất sắc" :
                           course.completion >= 80 ? "Tốt" : "Cần cải thiện"}
                        </StatBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Course Distribution Chart */}
          <SectionCard title="Phân bổ học viên theo khóa học">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {distribution.map((course) => (
                <div key={course.name} className="text-center p-4 rounded-xl border border-pink-200 bg-white hover:shadow-md transition-all">
                  <div className={`h-16 w-16 rounded-full ${course.color} flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold`}>
                    {course.pct}%
                  </div>
                  <div className="font-semibold text-gray-900 mb-1">{course.name}</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{course.students}</div>
                  <div className="text-sm text-gray-500">học viên</div>
                  <ProgressBar value={course.pct} className="mt-3" color={
                    course.color.includes("violet") ? "purple" :
                    course.color.includes("emerald") ? "emerald" :
                    course.color.includes("amber") ? "amber" :
                    course.color.includes("orange") ? "amber" :
                    course.color.includes("green") ? "emerald" : "blue"
                  } />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Content - Giáo viên */}
      {tab === "giaovien" && (
        <div className="grid gap-6">
          {/* Teacher Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <SectionCard title="Tổng số giáo viên">
              <div className="text-4xl font-bold text-gray-900 mb-2">24</div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-emerald-600 font-medium">+6</span>
                <span className="text-gray-500 text-sm">so với năm ngoái</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg bg-emerald-50">
                  <div className="text-lg font-bold text-emerald-700">20</div>
                  <div className="text-xs text-emerald-600">Đang dạy</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-blue-50">
                  <div className="text-lg font-bold text-blue-700">4</div>
                  <div className="text-xs text-blue-600">Part-time</div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Đánh giá trung bình">
              <div className="text-4xl font-bold text-gray-900 mb-2">4.8/5</div>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={20} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Giáo viên 5 sao:</span>
                  <span className="font-semibold">16 người</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Giáo viên 4 sao:</span>
                  <span className="font-semibold">8 người</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Tỷ lệ giữ chân">
              <div className="text-4xl font-bold text-gray-900 mb-2">96%</div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-emerald-600 font-medium">+3%</span>
                <span className="text-gray-500 text-sm">cải thiện</span>
              </div>
              <ProgressBar value={96} color="emerald" className="mt-4" />
              <div className="text-xs text-gray-500 mt-2">Tỷ lệ cao nhất trong 3 năm</div>
            </SectionCard>
          </div>

          {/* Teacher List */}
          <SectionCard title="Danh sách giáo viên">
            <div className="space-y-3">
              {teachers.map((teacher, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white hover:border-pink-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-pink-600 font-bold">
                      {teacher.name.split(" ")[1].charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{teacher.name}</div>
                      <div className="text-sm text-gray-600">{teacher.subject}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span className="font-bold text-gray-900">{teacher.rating}</span>
                      </div>
                      <div className="text-xs text-gray-500">Đánh giá</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{teacher.students}</div>
                      <div className="text-xs text-gray-500">Học viên</div>
                    </div>
                    
                    <StatBadge color={teacher.status === "active" ? "emerald" : "amber"}>
                      {teacher.status === "active" ? "Đang dạy" : "Nghỉ phép"}
                    </StatBadge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Teacher Performance */}
          <SectionCard title="Hiệu suất giảng dạy">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Ms. Anna", completion: 95, satisfaction: 4.9, students: 45 },
                { name: "Mr. David", completion: 92, satisfaction: 4.8, students: 38 },
                { name: "Ms. Sarah", completion: 88, satisfaction: 4.7, students: 32 },
                { name: "Mr. John", completion: 85, satisfaction: 4.6, students: 28 },
                { name: "Ms. Lisa", completion: 90, satisfaction: 4.9, students: 42 },
                { name: "Mr. Robert", completion: 87, satisfaction: 4.7, students: 35 },
              ].map((teacher, i) => (
                <div key={i} className="p-4 rounded-xl border border-pink-200 bg-white hover:shadow-md transition-all">
                  <div className="font-semibold text-gray-900 mb-3">{teacher.name}</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Tỷ lệ hoàn thành</span>
                        <span className="font-semibold">{teacher.completion}%</span>
                      </div>
                      <ProgressBar value={teacher.completion} color="emerald" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Đánh giá học viên</span>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{teacher.satisfaction}</span>
                        </div>
                      </div>
                      <ProgressBar value={teacher.satisfaction * 20} color="amber" />
                    </div>
                    <div className="pt-2 border-t border-pink-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Số học viên:</span>
                        <span className="font-bold text-gray-900">{teacher.students}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Content - Cơ sở vật chất */}
      {tab === "cosovatchat" && (
        <div className="grid gap-6">
          {/* Facility Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <SectionCard title="Tổng số phòng">
              <div className="text-4xl font-bold text-gray-900 mb-2">18</div>
              <div className="flex items-center gap-2">
                <Building size={16} className="text-blue-600" />
                <span className="text-blue-600 font-medium">+2 phòng mới</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg bg-blue-50">
                  <div className="text-lg font-bold text-blue-700">14</div>
                  <div className="text-xs text-blue-600">Đang sử dụng</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-50">
                  <div className="text-lg font-bold text-amber-700">4</div>
                  <div className="text-xs text-amber-600">Bảo trì</div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Tỷ lệ sử dụng">
              <div className="text-4xl font-bold text-gray-900 mb-2">78%</div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-emerald-600 font-medium">+12%</span>
                <span className="text-gray-500 text-sm">so với quý trước</span>
              </div>
              <ProgressBar value={78} color="blue" className="mt-4" />
              <div className="text-xs text-gray-500 mt-2">Hiệu quả sử dụng cao</div>
            </SectionCard>

            <SectionCard title="Sức chứa tổng">
              <div className="text-4xl font-bold text-gray-900 mb-2">310</div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-pink-600" />
                <span className="text-pink-600 font-medium">Đáp ứng 100%</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phòng học:</span>
                  <span className="font-semibold">250 chỗ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phòng chức năng:</span>
                  <span className="font-semibold">60 chỗ</span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Facility List */}
          <SectionCard title="Danh sách cơ sở vật chất">
            <div className="space-y-3">
              {facilities.map((facility, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white hover:border-pink-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl grid place-items-center ${
                      facility.status === "available" ? "bg-emerald-50 text-emerald-600" :
                      facility.status === "in-use" ? "bg-blue-50 text-blue-600" :
                      "bg-amber-50 text-amber-600"
                    }`}>
                      <Building size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{facility.name}</div>
                      <div className="text-sm text-gray-600">{facility.type} • {facility.capacity} chỗ</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{facility.usage}%</div>
                      <div className="text-xs text-gray-500">Sử dụng</div>
                    </div>
                    
                    <StatBadge color={
                      facility.status === "available" ? "emerald" :
                      facility.status === "in-use" ? "blue" : "amber"
                    }>
                      {facility.status === "available" ? "Sẵn sàng" :
                       facility.status === "in-use" ? "Đang dùng" : "Bảo trì"}
                    </StatBadge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Facility Usage Chart */}
          <SectionCard title="Tỷ lệ sử dụng theo phòng">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilities.map((facility, i) => (
                <div key={i} className="p-4 rounded-xl border border-pink-200 bg-white hover:shadow-md transition-all">
                  <div className="font-semibold text-gray-900 mb-3">{facility.name}</div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Tỷ lệ sử dụng</span>
                        <span className="font-semibold">{facility.usage}%</span>
                      </div>
                      <ProgressBar 
                        value={facility.usage} 
                        color={
                          facility.usage >= 80 ? "emerald" :
                          facility.usage >= 60 ? "blue" : "amber"
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-pink-100">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{facility.capacity}</div>
                        <div className="text-xs text-gray-500">Sức chứa</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {Math.round(facility.capacity * facility.usage / 100)}
                        </div>
                        <div className="text-xs text-gray-500">Sử dụng TB</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Maintenance Schedule */}
          <SectionCard title="Lịch bảo trì">
            <div className="space-y-3">
              {[
                { facility: "Phòng học P101", type: "Vệ sinh định kỳ", date: "15/11/2024", status: "planned" },
                { facility: "Lab 201", type: "Nâng cấp máy tính", date: "20/11/2024", status: "in-progress" },
                { facility: "Hội trường", type: "Sửa chữa âm thanh", date: "25/11/2024", status: "planned" },
                { facility: "Thư viện", type: "Bổ sung sách", date: "30/11/2024", status: "planned" },
                { facility: "Phòng tự học", type: "Thay đèn", date: "05/12/2024", status: "planned" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-pink-100 hover:bg-pink-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg grid place-items-center ${
                      item.status === "in-progress" ? "bg-blue-50 text-blue-600" :
                      "bg-amber-50 text-amber-600"
                    }`}>
                      <Clock size={14} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.facility}</div>
                      <div className="text-sm text-gray-600">{item.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-700">{item.date}</div>
                    <StatBadge color={item.status === "in-progress" ? "blue" : "amber"}>
                      {item.status === "in-progress" ? "Đang thực hiện" : "Đã lên lịch"}
                    </StatBadge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-pink-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-pink-500" />
            <span>Cập nhật thời gian thực • Dữ liệu được cập nhật lúc 14:30</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Hoạt động tốt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Cần chú ý</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span>Cần hành động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}