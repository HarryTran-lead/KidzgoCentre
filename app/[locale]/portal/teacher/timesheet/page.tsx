'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Clock,
  DollarSign,
  TrendingUp,
  Download,
  ChevronDown,
  Calendar,
  TrendingDown,
  Sparkles,
  CheckCircle,
  CreditCard,
  BarChart3,
  Target,
  Zap,
  Users,
  Award,
  FileText,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Share2,
} from 'lucide-react';

/* ---------- helpers ---------- */
function vnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function cx(...cls: (string | false | undefined)[]) {
  return cls.filter(Boolean).join(' ');
}

/* ---------- modern stat card ---------- */
function ModernStatCard({
  icon,
  title,
  value,
  trend,
  subtitle,
  delay = 0,
  color = 'pink',
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  delay?: number;
  color?: 'pink' | 'emerald' | 'amber' | 'blue';
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const colorClasses = {
    pink: {
      gradient: 'from-pink-500 to-rose-500',
      light: 'bg-pink-100',
      text: 'text-pink-600',
      border: 'border-pink-200',
    },
    emerald: {
      gradient: 'from-emerald-500 to-teal-500',
      light: 'bg-emerald-100',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
    },
    amber: {
      gradient: 'from-amber-500 to-orange-500',
      light: 'bg-amber-100',
      text: 'text-amber-600',
      border: 'border-amber-200',
    },
    blue: {
      gradient: 'from-blue-500 to-sky-500',
      light: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
  };

  const currentColor = colorClasses[color];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border ${currentColor.border} bg-white p-6 transition-all duration-700 hover:shadow-xl hover:shadow-pink-100/30 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Background gradient effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${currentColor.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-16 h-16">
        <div className={`absolute top-0 right-0 w-8 h-8 bg-gradient-to-br ${currentColor.gradient} opacity-10 rounded-bl-2xl`} />
      </div>

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${currentColor.light}`}>
              <div className={currentColor.text}>
                {icon}
              </div>
            </div>
            <span className="text-sm text-gray-600">{title}</span>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            
            {subtitle && (
              <div className="text-xs text-gray-500">{subtitle}</div>
            )}
            
            {trend && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                trend.isPositive 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                <span className="text-gray-500">vs tháng trước</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom decorative line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${currentColor.gradient} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </div>
  );
}

/* ---------- Hours Bar Chart ---------- */
function HoursBarChart({ months }: { months: Array<{ label: string; full: string; hours: number; income: number }> }) {
  const maxHours = Math.max(...months.map(m => m.hours));
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [animatedHeights, setAnimatedHeights] = useState(Array(months.length).fill(0));

  useEffect(() => {
    const timers = months.map((_, index) => {
      return setTimeout(() => {
        setAnimatedHeights(prev => {
          const newHeights = [...prev];
          newHeights[index] = 1;
          return newHeights;
        });
      }, index * 150);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [months]);

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Công giờ theo tháng</h3>
          <p className="text-sm text-gray-600">Tổng số giờ giảng dạy</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-sky-500"></div>
          <span className="text-sm text-gray-600">Công giờ</span>
        </div>
      </div>

      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-4">
          {[0, 20, 40, 60, 80].map((value) => (
            <div key={value} className="text-xs text-gray-400 text-right pr-2">
              {value}h
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="ml-12 h-64 flex items-end gap-3 justify-between">
          {months.map((month, index) => {
            const barHeight = (month.hours / maxHours) * 90;
            const isHovered = hoveredBar === index;
            const isAnimated = animatedHeights[index];

            return (
              <div 
                key={month.label}
                className="flex flex-col items-center relative flex-none w-8 sm:w-10 md:w-12"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Bar */}
                <div className="relative w-full flex flex-col items-center group">
                  <div className="w-full bg-gradient-to-t from-gray-100 to-white rounded-lg overflow-hidden h-48 flex items-end">
                    <div
                      className={`w-full rounded-lg transition-all duration-1000 ease-out ${
                        isHovered
                          ? 'bg-gradient-to-t from-blue-600 to-sky-600 shadow-lg'
                          : 'bg-gradient-to-t from-blue-500 to-sky-500'
                      }`}
                      style={{ 
                        height: isAnimated ? `${barHeight}%` : '0%',
                        transitionDelay: `${index * 150}ms`
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg"></div>
                    </div>
                  </div>

                  {/* Hover tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-3 bg-white border border-blue-200 rounded-xl p-4 shadow-xl z-10 min-w-[180px]">
                      <div className="mb-2">
                        <div className="text-sm font-bold text-gray-900">{month.full}</div>
                        <div className="text-xs text-gray-500">Công giờ</div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{month.hours}h</div>
                    </div>
                  )}
                </div>

                {/* Month label */}
                <div className={`mt-4 text-sm font-medium transition-all duration-300 ${
                  isHovered ? 'text-blue-600 font-bold' : 'text-gray-700'
                }`}>
                  {month.label}
                </div>

                {/* Hours indicator */}
                {isAnimated && (
                  <div className={`mt-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                    isHovered
                      ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-md'
                      : 'bg-blue-50 text-gray-700'
                  }`}>
                    {month.hours}h
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis line */}
        <div className="ml-12 h-px bg-gradient-to-r from-gray-200 to-gray-200 mt-2"></div>
      </div>
    </div>
  );
}

/* ---------- Income Bar Chart ---------- */
function IncomeBarChart({ months }: { months: Array<{ label: string; full: string; hours: number; income: number }> }) {
  const maxIncome = Math.max(...months.map(m => m.income));
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [animatedHeights, setAnimatedHeights] = useState(Array(months.length).fill(0));

  useEffect(() => {
    const timers = months.map((_, index) => {
      return setTimeout(() => {
        setAnimatedHeights(prev => {
          const newHeights = [...prev];
          newHeights[index] = 1;
          return newHeights;
        });
      }, index * 150);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [months]);

  return (
    <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl border border-emerald-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Thu nhập theo tháng</h3>
          <p className="text-sm text-gray-600">Tổng thu nhập từ giảng dạy</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <span className="text-sm text-gray-600">Thu nhập</span>
        </div>
      </div>

      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between py-4">
          {[0, 5, 10, 15, 20].map((value) => (
            <div key={value} className="text-xs text-gray-400 text-right pr-2">
              {value}M
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="ml-16 h-64 flex items-end gap-3 justify-between">
          {months.map((month, index) => {
            const barHeight = (month.income / maxIncome) * 90;
            const isHovered = hoveredBar === index;
            const isAnimated = animatedHeights[index];

            return (
              <div 
                key={month.label}
                className="flex flex-col items-center relative flex-none w-8 sm:w-10 md:w-12"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Bar */}
                <div className="relative w-full flex flex-col items-center group">
                  <div className="w-full bg-gradient-to-t from-gray-100 to-white rounded-lg overflow-hidden h-48 flex items-end">
                    <div
                      className={`w-full rounded-lg transition-all duration-1000 ease-out ${
                        isHovered
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-600 shadow-lg'
                          : 'bg-gradient-to-t from-emerald-500 to-teal-500'
                      }`}
                      style={{ 
                        height: isAnimated ? `${barHeight}%` : '0%',
                        transitionDelay: `${index * 150}ms`
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg"></div>
                    </div>
                  </div>

                  {/* Hover tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-3 bg-white border border-emerald-200 rounded-xl p-4 shadow-xl z-10 min-w-[180px]">
                      <div className="mb-2">
                        <div className="text-sm font-bold text-gray-900">{month.full}</div>
                        <div className="text-xs text-gray-500">Thu nhập</div>
                      </div>
                      <div className="text-lg font-bold text-emerald-600">{vnd(month.income)}</div>
                    </div>
                  )}
                </div>

                {/* Month label */}
                <div className={`mt-4 text-sm font-medium transition-all duration-300 ${
                  isHovered ? 'text-emerald-600 font-bold' : 'text-gray-700'
                }`}>
                  {month.label}
                </div>

                {/* Income indicator */}
                {isAnimated && (
                  <div className={`mt-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                    isHovered
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                      : 'bg-emerald-50 text-gray-700'
                  }`}>
                    {(month.income / 1000000).toFixed(1)}M
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis line */}
        <div className="ml-16 h-px bg-gradient-to-r from-gray-200 to-gray-200 mt-2"></div>
      </div>
    </div>
  );
}

/* ---------- Main Bar Charts Container ---------- */
function ModernBarChart() {
  const [filter, setFilter] = useState<'thisMonth' | '6months' | '1year'>('6months');
  
  // Dữ liệu đầy đủ 1 năm (với tháng số để sắp xếp)
  const allMonths = [
    { label: 'T6', full: 'Tháng 6/2025', monthNum: 6, year: 2025, hours: 68, income: 20400000 },
    { label: 'T5', full: 'Tháng 5/2025', monthNum: 5, year: 2025, hours: 70, income: 21000000 },
    { label: 'T4', full: 'Tháng 4/2025', monthNum: 4, year: 2025, hours: 60, income: 18000000 },
    { label: 'T3', full: 'Tháng 3/2025', monthNum: 3, year: 2025, hours: 72, income: 21600000 },
    { label: 'T2', full: 'Tháng 2/2025', monthNum: 2, year: 2025, hours: 68, income: 20400000 },
    { label: 'T1', full: 'Tháng 1/2025', monthNum: 1, year: 2025, hours: 64, income: 19200000 },
    { label: 'T12', full: 'Tháng 12/2024', monthNum: 12, year: 2024, hours: 65, income: 19500000 },
    { label: 'T11', full: 'Tháng 11/2024', monthNum: 11, year: 2024, hours: 70, income: 21000000 },
    { label: 'T10', full: 'Tháng 10/2024', monthNum: 10, year: 2024, hours: 66, income: 19800000 },
    { label: 'T9', full: 'Tháng 9/2024', monthNum: 9, year: 2024, hours: 62, income: 18600000 },
    { label: 'T8', full: 'Tháng 8/2024', monthNum: 8, year: 2024, hours: 68, income: 20400000 },
    { label: 'T7', full: 'Tháng 7/2024', monthNum: 7, year: 2024, hours: 64, income: 19200000 },
  ];

  // Filter dữ liệu
  const months = useMemo(() => {
    if (filter === 'thisMonth') {
      return [allMonths[0]];
    } else if (filter === '6months') {
      return allMonths.slice(0, 6);
    } else {
      // Sắp xếp từ tháng 1 đến tháng 12 từ trái sang phải
      // Lấy 12 tháng gần nhất và sắp xếp theo tháng số (1-12)
      return [...allMonths].sort((a, b) => {
        // Sắp xếp theo tháng số từ 1 đến 12
        return a.monthNum - b.monthNum;
      });
    }
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 bg-white border border-pink-200 rounded-xl p-1">
          <button
            onClick={() => setFilter('thisMonth')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'thisMonth'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-pink-50'
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setFilter('6months')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === '6months'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-pink-50'
            }`}
          >
            6 tháng
          </button>
          <button
            onClick={() => setFilter('1year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === '1year'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-pink-50'
            }`}
          >
            1 năm
          </button>
        </div>
      </div>

      {/* Two separate charts */}
      <HoursBarChart months={months} />
      <IncomeBarChart months={months} />
    </div>
  );
}

/* ---------- modern data table ---------- */
function ModernDataTable({ data }: { data: Array<{
  month: string;
  hours: number;
  income: number;
  rate: number;
  status: 'paid' | 'pending';
  classes: number;
}> }) {
  return (
    <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-pink-50 to-rose-50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  Tháng
                </div>
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                <div className="flex items-center gap-2 justify-center">
                  <Clock size={16} />
                  Công giờ
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                <div className="flex items-center gap-2 justify-end">
                  <DollarSign size={16} />
                  Thu nhập
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                <div className="flex items-center gap-2 justify-end">
                  <TrendingUp size={16} />
                  Đơn giá
                </div>
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  Lớp học
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={row.month}
                className={`group transition-all duration-300 hover:bg-pink-50/60 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-pink-50/30'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${
                      index === 0 
                        ? 'from-pink-500 to-rose-500' 
                        : 'from-pink-400 to-rose-400'
                    }`}>
                      <Calendar size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{row.month}</div>
                      <div className="text-xs text-gray-500">{row.hours} giờ giảng dạy</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center border border-pink-200 group-hover:border-pink-300">
                      <span className="text-base font-bold text-gray-900">{row.hours}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="space-y-1">
                    <div className="font-bold text-gray-900">{vnd(row.income)}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      TB {vnd(row.income / row.hours)}/h
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                    <span className="text-sm font-medium text-gray-900">{vnd(row.rate)}/h</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 flex items-center justify-center">
                      <Users size={14} className="text-blue-600" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{row.classes}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={`inline-flex items-center justify-end gap-2 px-4 py-2 rounded-lg ${
                    row.status === 'paid'
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'
                      : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
                  }`}>
                    {row.status === 'paid' ? (
                      <>
                        <CheckCircle size={14} className="text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Đã thanh toán</span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} className="text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Đang chờ</span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- main page ---------- */
export default function Page() {
  const [tab, setTab] = useState<'overview' | 'detail'>('overview');
  const [year] = useState(2025);

  const monthlyData = [
    { month: 'T6/2025', hours: 68, income: 20400000, rate: 300000, status: 'paid' as const, classes: 4 },
    { month: 'T5/2025', hours: 70, income: 21000000, rate: 300000, status: 'paid' as const, classes: 4 },
    { month: 'T4/2025', hours: 60, income: 18000000, rate: 300000, status: 'paid' as const, classes: 3 },
    { month: 'T3/2025', hours: 72, income: 21600000, rate: 300000, status: 'paid' as const, classes: 5 },
    { month: 'T2/2025', hours: 68, income: 20400000, rate: 300000, status: 'paid' as const, classes: 4 },
    { month: 'T1/2025', hours: 64, income: 19200000, rate: 300000, status: 'paid' as const, classes: 4 },
  ];

  const thisMonth = monthlyData[0];
  const yearlySummary = {
    totalHours: monthlyData.reduce((sum, m) => sum + m.hours, 0),
    totalIncome: monthlyData.reduce((sum, m) => sum + m.income, 0),
    averagePerMonth: Math.round(monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length),
    totalClasses: monthlyData.reduce((sum, m) => sum + m.classes, 0),
  };

  const exportReport = () => {
    const header = ['Tháng', 'Công giờ', 'Thu nhập (đ)', 'Đơn giá/h', 'Lớp học', 'Trạng thái'].join(',');
    const rows = monthlyData.map((m) =>
      [m.month, m.hours, m.income, m.rate, m.classes, m.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'].join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cong-gio-thu-nhap-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/20 via-white to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-xl">
                <DollarSign size={28} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 p-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg">
                <TrendingUp size={12} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Công giờ & Thu nhập
              </h1>
              <p className="text-gray-600 mt-1">
                Phân tích hiệu suất và tài chính giảng dạy theo thời gian thực
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <select className="appearance-none rounded-xl bg-white border border-pink-200 pl-4 pr-10 py-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all">
                <option value="2025">Năm 2025</option>
                <option value="2024">Năm 2024</option>
                <option value="2023">Năm 2023</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={exportReport}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-xl transition-all shadow-lg hover:scale-105 duration-300"
            >
              <Download size={16} /> Xuất báo cáo
            </button>
            <button className="p-2.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-colors">
              <Share2 size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ModernStatCard
            icon={<Clock size={20} />}
            title="Công giờ tháng này"
            value={`${thisMonth.hours} giờ`}
            trend={{ value: 12, isPositive: true }}
            subtitle="Trung bình 28h/tuần"
            color="pink"
            delay={100}
          />
          <ModernStatCard
            icon={<DollarSign size={20} />}
            title="Thu nhập tháng này"
            value={vnd(thisMonth.income)}
            trend={{ value: 8, isPositive: true }}
            subtitle="Tăng trưởng ổn định"
            color="emerald"
            delay={200}
          />
          <ModernStatCard
            icon={<TrendingUp size={20} />}
            title="Đơn giá trung bình"
            value={`${vnd(Math.round(thisMonth.income / thisMonth.hours))}/h`}
            subtitle="Tối ưu hiệu suất"
            color="amber"
            delay={300}
          />
          <ModernStatCard
            icon={<Users size={20} />}
            title="Lớp đang dạy"
            value={`${thisMonth.classes} lớp`}
            subtitle="4 lớp chính thức"
            color="blue"
            delay={400}
          />
        </div>

        {/* Yearly Summary Card */}
        <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 p-6 mb-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Tổng kết hiệu suất {year}</h3>
                <p className="text-sm text-gray-600">Thống kê toàn diện về giảng dạy</p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1 max-w-2xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{yearlySummary.totalHours}</div>
                <div className="text-sm text-gray-600">Giờ dạy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{vnd(yearlySummary.totalIncome)}</div>
                <div className="text-sm text-gray-600">Tổng thu nhập</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{vnd(yearlySummary.averagePerMonth)}</div>
                <div className="text-sm text-gray-600">TB/tháng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{yearlySummary.totalClasses}</div>
                <div className="text-sm text-gray-600">Lớp học</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-white to-pink-50/30 rounded-2xl border border-pink-200 shadow-sm">
        {/* Tabs */}
        <div className="px-6 pt-6">
          <div className="inline-flex bg-white border border-pink-200 rounded-xl p-1">
            <button
              onClick={() => setTab('overview')}
              className={cx(
                'px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all text-sm font-medium',
                tab === 'overview' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' 
                  : 'text-gray-700 hover:bg-pink-50'
              )}
            >
              <Sparkles size={16} />
              Tổng quan
            </button>
            <button
              onClick={() => setTab('detail')}
              className={cx(
                'px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all text-sm font-medium',
                tab === 'detail' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' 
                  : 'text-gray-700 hover:bg-pink-50'
              )}
            >
              <Target size={16} />
              Chi tiết
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'overview' ? (
            <div className="space-y-8">
              {/* Modern Bar Chart */}
              <ModernBarChart />

              {/* Data Table */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Báo cáo theo tháng</h3>
                    <p className="text-sm text-gray-600">Chi tiết công giờ và thu nhập</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                      <Eye size={14} />
                      Xem tất cả
                    </button>
                  </div>
                </div>
                
                <ModernDataTable data={monthlyData} />
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <CreditCard size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-900">Tự động thanh toán</h4>
                      <p className="text-xs text-emerald-700">Hóa đơn được xử lý tự động</p>
                    </div>
                  </div>
                  <div className="text-sm text-emerald-700">
                    Ngày thanh toán: <span className="font-bold">05/{thisMonth.month.split('/')[0]}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border border-blue-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-r from-blue-500 to-sky-500 rounded-lg">
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Mục tiêu tháng tới</h4>
                      <p className="text-xs text-blue-700">Tăng trưởng 15%</p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-700">
                    Đặt mục tiêu: <span className="font-bold">75 giờ</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                      <FileText size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900">Báo cáo chi tiết</h4>
                      <p className="text-xs text-amber-700">Xuất dữ liệu đầy đủ</p>
                    </div>
                  </div>
                  <button 
                    onClick={exportReport}
                    className="text-sm text-amber-700 hover:text-amber-800 font-medium"
                  >
                    Tải xuống →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Tab "Chi tiết" */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Chi tiết tháng {thisMonth.month}</h3>
                  <p className="text-sm text-gray-600">Phân tích từng lớp học và hạng mục</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{vnd(thisMonth.income)}</div>
                  <div className="text-sm text-gray-600">Tổng thu nhập tháng</div>
                </div>
              </div>

              {/* Detailed breakdown */}
              <div className="bg-white rounded-2xl border border-pink-200 p-6">
                <h4 className="font-bold text-gray-900 mb-4">Phân tích theo lớp học</h4>
                <div className="space-y-4">
                  {[
                    { class: 'IELTS Foundation - A1', hours: 16, rate: 300000, status: 'paid' },
                    { class: 'TOEIC Intermediate', hours: 12, rate: 300000, status: 'paid' },
                    { class: 'Business English', hours: 20, rate: 300000, status: 'paid' },
                    { class: 'Training & Meetings', hours: 20, rate: 150000, status: 'pending' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50/50 to-white rounded-xl border border-pink-100 hover:border-pink-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${index === 0 ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-pink-100'}`}>
                          <Users size={18} className={index === 0 ? 'text-white' : 'text-pink-600'} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{item.class}</div>
                          <div className="text-sm text-gray-600">{item.hours} giờ • {vnd(item.rate)}/h</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{vnd(item.hours * item.rate)}</div>
                          <div className="text-sm text-gray-600">Thành tiền</div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          item.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.status === 'paid' ? 'Đã thanh toán' : 'Đang chờ'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Đã thanh toán</div>
                      <div className="text-3xl font-bold mt-2 text-emerald-600">{vnd(thisMonth.income - 3000000)}</div>
                      <div className="text-xs text-emerald-500 mt-1">3/4 hạng mục</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-100">
                      <CheckCircle size={24} className="text-emerald-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Chờ thanh toán</div>
                      <div className="text-3xl font-bold mt-2 text-amber-600">{vnd(3000000)}</div>
                      <div className="text-xs text-amber-500 mt-1">1/4 hạng mục</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-100">
                      <Clock size={24} className="text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}