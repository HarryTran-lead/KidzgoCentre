'use client';

import { useState, useMemo } from 'react';
import {
  Building2, MapPin, Users, BookOpen, ArrowUpRight,
  TrendingUp, TrendingDown, BarChart3, PieChart,
  Target, Calendar, Clock, Globe, UserCheck,
  Filter, Search, Download, MoreVertical,
  Sparkles, AlertCircle, CheckCircle, ArrowUp, ArrowDown,
  ArrowUpDown, Edit
} from 'lucide-react';
import {
  BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const BRANCHES = [
  {
    id: 'CN01',
    name: 'KidzGo Nguyễn Văn Trỗi',
    address: '120 Nguyễn Văn Trỗi, Q. Phú Nhuận',
    students: 240,
    classes: 14,
    teachers: 9,
    status: 'active',
    occupancy: 85,
    revenue: 125000000,
    growth: 12.5,
    newStudents: 45,
  },
  {
    id: 'CN02',
    name: 'KidzGo Phạm Văn Đồng',
    address: '15 Phạm Văn Đồng, Q. Gò Vấp',
    students: 190,
    classes: 10,
    teachers: 7,
    status: 'active',
    occupancy: 76,
    revenue: 98000000,
    growth: 8.3,
    newStudents: 32,
  },
  {
    id: 'CN03',
    name: 'KidzGo Thủ Đức',
    address: '46 Võ Văn Ngân, TP. Thủ Đức',
    students: 120,
    classes: 6,
    teachers: 5,
    status: 'preparing',
    occupancy: 60,
    revenue: 45000000,
    growth: 0,
    newStudents: 28,
  },
];

// Chart Data
const revenueData = [
  { month: 'T7', CN01: 105, CN02: 82, CN03: 0 },
  { month: 'T8', CN01: 112, CN02: 88, CN03: 0 },
  { month: 'T9', CN01: 118, CN02: 90, CN03: 15 },
  { month: 'T10', CN01: 122, CN02: 95, CN03: 30 },
  { month: 'T11', CN01: 125, CN02: 98, CN03: 42 },
  { month: 'T12', CN01: 135, CN02: 102, CN03: 48 },
];

const studentDistribution = [
  { name: 'Beginner', value: 35, color: '#3b82f6' },
  { name: 'Intermediate', value: 28, color: '#8b5cf6' },
  { name: 'Advanced', value: 22, color: '#10b981' },
  { name: 'Business', value: 15, color: '#f59e0b' },
];

const attendanceData = [
  { name: 'CN01', rate: 92 },
  { name: 'CN02', rate: 88 },
  { name: 'CN03', rate: 76 },
];

function StatCard({
  icon,
  label,
  value,
  color = "blue"
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: "blue" | "green" | "pink" | "purple" | "orange";
}) {
  return (
    <div className="bg-gradient-to-br from-white to-pink-50 rounded-xl border border-pink-200 p-4 transition-all hover:shadow-md cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-600 mb-1">{label}</div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
        </div>
        <div className={`p-2.5 rounded-lg bg-gradient-to-r ${color === "blue" ? "from-blue-500 to-sky-500" :
          color === "green" ? "from-emerald-500 to-teal-500" :
            color === "pink" ? "from-pink-500 to-rose-500" :
              color === "purple" ? "from-purple-500 to-indigo-500" :
                "from-amber-500 to-orange-500"
          } text-white shadow-md`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SortableHeader({
  children,
  sortKey,
  currentSort,
  onSort,
  align = "left"
}: {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  align?: "left" | "center" | "right";
}) {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  const icon = isActive ? (
    direction === "asc" ? <ArrowUp size={14} className="text-pink-500" /> : <ArrowDown size={14} className="text-pink-500" />
  ) : (
    <ArrowUpDown size={14} className="text-gray-400" />
  );

  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <th
      className={`py-3 px-6 ${alignClass} text-xs font-semibold uppercase tracking-wider text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-pink-50 transition-colors`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-2">{children}{icon}</span>
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: CheckCircle, text: 'Đang hoạt động' },
    preparing: { color: 'bg-amber-100 text-amber-700 border border-amber-200', icon: Clock, text: 'Chuẩn bị khai trương' },
    maintenance: { color: 'bg-orange-100 text-orange-700 border border-orange-200', icon: AlertCircle, text: 'Bảo trì' },
  }[status] || { color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: Clock, text: status };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {config.text}
    </div>
  );
}

export default function CenterOverviewPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const totalStats = {
    branches: BRANCHES.length,
    students: BRANCHES.reduce((sum, b) => sum + b.students, 0),
    classes: BRANCHES.reduce((sum, b) => sum + b.classes, 0),
    teachers: BRANCHES.reduce((sum, b) => sum + b.teachers, 0),
    revenue: BRANCHES.reduce((sum, b) => sum + b.revenue, 0),
  };

  const handleSort = (key: string) => {
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        setSortConfig({ key, direction: 'desc' });
      } else if (sortConfig.direction === 'desc') {
        setSortConfig(null);
      } else {
        setSortConfig({ key, direction: 'asc' });
      }
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const sortedBranches = useMemo(() => {
    let filtered = [...BRANCHES];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (branch) =>
          branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'students':
            aValue = a.students;
            bValue = b.students;
            break;
          case 'classes':
            aValue = a.classes;
            bValue = b.classes;
            break;
          case 'revenue':
            aValue = a.revenue;
            bValue = b.revenue;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [searchQuery, sortConfig]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
              <Building2 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
                Tổng quan chi nhánh
              </h1>
              <p className="text-gray-600">
                Phân tích hiệu suất và theo dõi tăng trưởng toàn hệ thống
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 rounded-xl">
              <Calendar size={16} className="text-pink-500" />
              <span className="text-sm font-medium text-gray-700">Tháng 12/2024</span>
            </div>
            <button className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer">
              <Download size={18} />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <StatCard
            icon={<Building2 size={18} />}
            label="Chi nhánh"
            value={totalStats.branches.toString()}
            color="blue"
          />
          <StatCard
            icon={<Users size={18} />}
            label="Học viên"
            value={totalStats.students.toString()}
            color="green"
          />
          <StatCard
            icon={<BookOpen size={18} />}
            label="Lớp học"
            value={totalStats.classes.toString()}
            color="pink"
          />
          <StatCard
            icon={<UserCheck size={18} />}
            label="Giáo viên"
            value={totalStats.teachers.toString()}
            color="purple"
          />
          <StatCard
            icon={<BarChart3 size={18} />}
            label="Doanh thu"
            value={`${(totalStats.revenue / 1000000).toFixed(1)}M`}
            color="orange"
          />
        </div>

        {/* Branches Table */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden mb-6">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 size={20} className="text-pink-500" />
                  Danh sách chi nhánh
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm chi nhánh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-pink-200 rounded-xl text-sm w-full md:w-64 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2.5 border border-pink-200 rounded-xl hover:bg-pink-50 transition-colors cursor-pointer">
                  <Filter size={18} className="text-gray-600" />
                </button>
                <button className="p-2.5 border border-pink-200 rounded-xl hover:bg-pink-50 transition-colors cursor-pointer">
                  <MoreVertical size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
                <tr>
                  <th className="py-3 px-6 text-left">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Chi nhánh</span>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Địa chỉ</span>
                  </th>
                  <SortableHeader sortKey="students" currentSort={sortConfig} onSort={handleSort} align="left">
                    Học viên
                  </SortableHeader>
                  <SortableHeader sortKey="classes" currentSort={sortConfig} onSort={handleSort} align="left">
                    Lớp học
                  </SortableHeader>
                  <SortableHeader sortKey="revenue" currentSort={sortConfig} onSort={handleSort} align="left">
                    Doanh thu
                  </SortableHeader>
                  <SortableHeader sortKey="status" currentSort={sortConfig} onSort={handleSort} align="left">
                    Trạng thái
                  </SortableHeader>
                  <th className="py-3 px-6 text-left">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100">
                {sortedBranches.length > 0 ? (
                  sortedBranches.map((branch) => (
                    <tr
                      key={branch.id}
                      className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{branch.name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                          <span>{branch.address}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{branch.students}</div>
                        <div className="text-xs text-emerald-600 mt-1">+{branch.newStudents} mới</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{branch.classes}</div>
                        <div className="text-xs text-gray-500 mt-1">{branch.teachers} giáo viên</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {(branch.revenue / 1000000).toFixed(1)}M VND
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge status={branch.status} />
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-1 transition-opacity duration-200">
                          <button
                            className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <ArrowUpRight size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors text-gray-400 hover:text-amber-600 cursor-pointer"
                            title="Xuất báo cáo"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                        <Search size={24} className="text-pink-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Không tìm thấy chi nhánh</div>
                      <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {sortedBranches.length > 0 && (
            <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-pink-500" />
                  <span>
                    Tổng cộng <span className="font-semibold text-gray-900">{sortedBranches.length}</span> chi nhánh
                    {searchQuery && ` (tìm thấy ${sortedBranches.length})`}
                    {' • '}
                    <span className="font-semibold text-gray-900">{sortedBranches.filter(b => b.status === 'active').length}</span> đang hoạt động
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Đạt mục tiêu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span>Cần cải thiện</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-500" />
                  Xu hướng doanh thu (triệu VND)
                </h3>
                <p className="text-sm text-gray-600 mt-1">6 tháng gần nhất</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600">CN01</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-gray-600">CN02</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-gray-600">CN03</span>
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${value} triệu VND`, 'Doanh thu']}
                    labelFormatter={(label) => `Tháng ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="CN01"
                    name="CN01 - Nguyễn Văn Trỗi"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="CN02"
                    name="CN02 - Phạm Văn Đồng"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="CN03"
                    name="CN03 - Thủ Đức"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Student Distribution */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl  border-pink-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <PieChart size={20} className="text-purple-500" />
                  Phân bố cấp độ học viên
                </h3>
                <p className="text-sm text-gray-600 mt-1">Toàn hệ thống</p>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {totalStats.students} học viên
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={studentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {studentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Tỷ lệ"]} />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {studentDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-pink-50/50 rounded-xl transition-colors cursor-pointer">
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
        </div>
      </div>
    </div>
  );
}