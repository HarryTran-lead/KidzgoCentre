'use client';

import { useMemo, useState } from 'react';
import { 
  Banknote, 
  CheckCircle2, 
  Clock3, 
  Download, 
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  CreditCard,
  DollarSign,
  PieChart,
  BarChart3,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  Send,
  FileText,
  Calculator,
  Wallet,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
  Bell,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

type PayrollRow = {
  id: string;
  name: string;
  role: string;
  unit: string;
  total: number;
  status: 'PAID' | 'PENDING' | 'PROCESSING';
  avatarColor: string;
  baseSalary: number;
  overtime: number;
  bonus: number;
  deductions: number;
  netPay: number;
  paymentDate: string;
  paymentMethod: string;
  department: string;
  performance: number;
};

const ROWS: PayrollRow[] = [
  {
    id: 'PAY-0925-01',
    name: 'Ms. Sarah Johnson',
    role: 'Giáo viên chính',
    unit: '24 buổi',
    total: 14400000,
    status: 'PENDING',
    avatarColor: 'from-pink-400 to-rose-500',
    baseSalary: 12000000,
    overtime: 2400000,
    bonus: 0,
    deductions: 0,
    netPay: 14400000,
    paymentDate: '25/09/2025',
    paymentMethod: 'Chuyển khoản',
    department: 'Academic',
    performance: 95
  },
  {
    id: 'PAY-0925-02',
    name: 'Mr. John Smith',
    role: 'Giáo viên chính',
    unit: '26 buổi',
    total: 15600000,
    status: 'PAID',
    avatarColor: 'from-blue-400 to-cyan-500',
    baseSalary: 12000000,
    overtime: 3600000,
    bonus: 0,
    deductions: 0,
    netPay: 15600000,
    paymentDate: '20/09/2025',
    paymentMethod: 'Chuyển khoản',
    department: 'Academic',
    performance: 98
  },
  {
    id: 'PAY-0925-03',
    name: 'Nguyễn Thu Hà',
    role: 'Staff vận hành',
    unit: 'Full-time',
    total: 9500000,
    status: 'PENDING',
    avatarColor: 'from-emerald-400 to-teal-500',
    baseSalary: 8500000,
    overtime: 1000000,
    bonus: 0,
    deductions: 0,
    netPay: 9500000,
    paymentDate: '25/09/2025',
    paymentMethod: 'Tiền mặt',
    department: 'Operations',
    performance: 85
  },
  {
    id: 'PAY-0925-04',
    name: 'Trần Văn Minh',
    role: 'Quản lý học vụ',
    unit: 'Full-time',
    total: 18500000,
    status: 'PAID',
    avatarColor: 'from-violet-400 to-purple-500',
    baseSalary: 15000000,
    overtime: 2500000,
    bonus: 1000000,
    deductions: 0,
    netPay: 18500000,
    paymentDate: '18/09/2025',
    paymentMethod: 'Chuyển khoản',
    department: 'Academic',
    performance: 92
  },
  {
    id: 'PAY-0925-05',
    name: 'Lê Thị Lan',
    role: 'Tư vấn viên',
    unit: 'Full-time',
    total: 12500000,
    status: 'PROCESSING',
    avatarColor: 'from-amber-400 to-orange-500',
    baseSalary: 10000000,
    overtime: 1500000,
    bonus: 1000000,
    deductions: 0,
    netPay: 12500000,
    paymentDate: '26/09/2025',
    paymentMethod: 'Chuyển khoản',
    department: 'Sales',
    performance: 88
  },
  {
    id: 'PAY-0925-06',
    name: 'Phạm Quang Huy',
    role: 'Giáo viên bán thời gian',
    unit: '16 buổi',
    total: 9600000,
    status: 'PENDING',
    avatarColor: 'from-indigo-400 to-blue-500',
    baseSalary: 8000000,
    overtime: 1600000,
    bonus: 0,
    deductions: 0,
    netPay: 9600000,
    paymentDate: '25/09/2025',
    paymentMethod: 'Tiền mặt',
    department: 'Academic',
    performance: 90
  },
];

const DEPARTMENTS = [
  { name: 'Academic', count: 4, color: 'from-blue-400 to-cyan-500' },
  { name: 'Operations', count: 1, color: 'from-emerald-400 to-teal-500' },
  { name: 'Sales', count: 1, color: 'from-amber-400 to-orange-500' },
  { name: 'Marketing', count: 0, color: 'from-rose-400 to-pink-500' },
];

const STATUS_INFO: Record<PayrollRow['status'], { 
  text: string; 
  cls: string;
  bg: string;
  icon: React.ReactNode;
}> = {
  PENDING: { 
    text: 'Chờ duyệt', 
    cls: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200',
    bg: 'from-amber-400 to-orange-500',
    icon: <Clock3 size={14} />
  },
  PAID: { 
    text: 'Đã chi trả', 
    cls: 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200',
    bg: 'from-emerald-400 to-teal-500',
    icon: <CheckCircle2 size={14} />
  },
  PROCESSING: { 
    text: 'Đang xử lý', 
    cls: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200',
    bg: 'from-blue-400 to-cyan-500',
    icon: <RefreshCw size={14} />
  },
};

const formatVND = (n: number) =>
  n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).replace('₫', 'VND');

function StatCard({ 
  title, 
  value, 
  icon, 
  color,
  trend,
  subtitle 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; label: string };
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-20 w-20 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${color}`}></div>
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm`}>
              {icon}
            </div>
            {trend && (
              <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                trend.value >= 0 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-rose-50 text-rose-600'
              }`}>
                {trend.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white font-semibold text-xs ${color} shadow-sm`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: PayrollRow['status'] }) {
  const { text, cls, icon } = STATUS_INFO[status];
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

function PerformanceIndicator({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 90) return 'from-emerald-400 to-teal-500';
    if (score >= 80) return 'from-blue-400 to-cyan-500';
    if (score >= 70) return 'from-amber-400 to-orange-500';
    return 'from-rose-400 to-pink-500';
  };

  const color = getColor(score);

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-6 w-6">
        <svg className="h-6 w-6" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={`url(#gradient-${score})`}
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
          />
          <defs>
            <linearGradient id={`gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color.includes('emerald') ? '#10b981' : color.includes('blue') ? '#0ea5e9' : color.includes('amber') ? '#f59e0b' : '#f43f5e'} />
              <stop offset="100%" stopColor={color.includes('teal') ? '#0d9488' : color.includes('cyan') ? '#06b6d4' : color.includes('orange') ? '#ea580c' : '#db2777'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
          {score}
        </div>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'PROCESSING'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('09/2025');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const rows = useMemo(() => {
    let result = ROWS;
    
    if (filter !== 'ALL') {
      result = result.filter(r => r.status === filter);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(searchLower) ||
        r.role.toLowerCase().includes(searchLower) ||
        r.id.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedDepartment !== 'ALL') {
      result = result.filter(r => r.department === selectedDepartment);
    }
    
    return result;
  }, [filter, search, selectedDepartment]);

  const total = ROWS.reduce((s, r) => s + r.total, 0);
  const pendingCount = ROWS.filter(r => r.status === 'PENDING').length;
  const paidCount = ROWS.filter(r => r.status === 'PAID').length;
  const processingCount = ROWS.filter(r => r.status === 'PROCESSING').length;
  const avgPerformance = Math.round(ROWS.reduce((sum, r) => sum + r.performance, 0) / ROWS.length);

  // Pagination
  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);

  const stats = [
    {
      title: 'Tổng chi lương',
      value: formatVND(total),
      icon: <Banknote size={20} />,
      color: 'from-pink-500 to-rose-500',
      subtitle: 'Tháng 09/2025',
      trend: { value: 8, label: 'vs tháng trước' }
    },
    {
      title: 'Chờ thanh toán',
      value: `${pendingCount} hồ sơ`,
      icon: <Clock3 size={20} />,
      color: 'from-amber-500 to-orange-500',
      subtitle: formatVND(ROWS.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.total, 0)),
      trend: { value: -2, label: 'giao dịch' }
    },
    {
      title: 'Đã chi trả',
      value: `${paidCount} hồ sơ`,
      icon: <CheckCircle2 size={20} />,
      color: 'from-emerald-500 to-teal-500',
      subtitle: formatVND(ROWS.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.total, 0)),
      trend: { value: 12, label: 'vs tháng trước' }
    },
    {
      title: 'Hiệu suất trung bình',
      value: `${avgPerformance}%`,
      icon: <TrendingUp size={20} />,
      color: 'from-blue-500 to-cyan-500',
      subtitle: 'Toàn bộ nhân sự',
      trend: { value: 5, label: 'tăng trưởng' }
    }
  ];

  const departments = ['ALL', ...new Set(ROWS.map(r => r.department))];
  const months = ['09/2025', '08/2025', '07/2025', '06/2025'];

  const toggleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === currentRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentRows.map(row => row.id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Wallet size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Quản lý Bảng lương
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Tính lương, theo dõi thanh toán và đánh giá hiệu suất nhân sự
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Download size={16} /> Xuất bảng lương
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <Plus size={16} /> Tạo bảng lương mới
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1">
              {[
                { k: 'ALL', label: 'Tất cả', count: ROWS.length },
                { k: 'PENDING', label: 'Chờ duyệt', count: pendingCount },
                { k: 'PAID', label: 'Đã chi trả', count: paidCount },
                { k: 'PROCESSING', label: 'Đang xử lý', count: processingCount },
              ].map((item) => (
                <button
                  key={item.k}
                  onClick={() => setFilter(item.k as typeof filter)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    filter === item.k 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-pink-50'
                  }`}
                >
                  {item.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filter === item.k ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-500" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nhân sự..."
              className="h-10 w-72 rounded-xl border border-pink-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content - Table */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách lương tháng 09/2025</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{rows.length} nhân sự</span>
              <span className="mx-2">•</span>
              <span>{formatVND(total)} tổng chi</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
              <tr>
                <th className="py-3 px-6 text-left">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === currentRows.length && currentRows.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200"
                    />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Nhân sự</span>
                  </div>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Vị trí</span>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Phòng ban</span>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Lương cơ bản</span>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Làm thêm + Thưởng</span>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Tổng thu nhập</span>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Hiệu suất</span>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</span>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {currentRows.length > 0 ? (
                currentRows.map((row) => (
                  <tr 
                    key={row.id} 
                    className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={() => toggleSelectRow(row.id)}
                          className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200"
                        />
                        <div className="flex items-center gap-3">
                          <Avatar name={row.name} color={row.avatarColor} />
                          <div>
                            <div className="font-medium text-gray-900">{row.name}</div>
                            <div className="text-xs text-gray-500">{row.id}</div>
                            <div className="text-xs text-gray-400">{row.unit}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{row.role}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        row.department === 'Academic' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        row.department === 'Operations' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {row.department}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{formatVND(row.baseSalary)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">{formatVND(row.overtime)}</div>
                        {row.bonus > 0 && (
                          <div className="text-xs text-emerald-600 font-medium">
                            +{formatVND(row.bonus)} thưởng
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900">{formatVND(row.total)}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={10} />
                          {row.paymentDate}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <PerformanceIndicator score={row.performance} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 transition-opacity duration-200">
                        <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer" title="Xem chi tiết">
                          <Eye size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer" title="Gửi phiếu lương">
                          <Send size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer" title="Thao tác khác">
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                      <Search size={24} className="text-pink-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy hồ sơ lương</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo bảng lương mới</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Pagination */}
        {rows.length > 0 && (
          <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, rows.length)}</span> 
                {' '}trong tổng số <span className="font-semibold text-gray-900">{rows.length}</span> nhân sự
                {selectedRows.length > 0 && (
                  <span className="ml-3 text-pink-600 font-medium">
                    Đã chọn {selectedRows.length} hồ sơ
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                >
                  <ChevronsLeft size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                            : 'border border-pink-200 bg-white text-gray-700 hover:bg-pink-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                >
                  <ChevronRightIcon size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                >
                  <ChevronsRight size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics & Actions Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Department Breakdown */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
                <PieChart size={18} className="text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Phân tích chi phí theo phòng ban</h3>
            </div>
            <div className="space-y-4">
              {DEPARTMENTS.map((dept) => {
                const deptRows = ROWS.filter(r => r.department === dept.name);
                const deptTotal = deptRows.reduce((sum, r) => sum + r.total, 0);
                const avgSalary = deptRows.length > 0 ? Math.round(deptTotal / deptRows.length) : 0;
                
                if (dept.count === 0) return null;
                
                return (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${dept.color}`}></div>
                        <span className="font-medium text-gray-900">{dept.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {dept.count} người
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{formatVND(deptTotal)}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Trung bình: {formatVND(avgSalary)}/người</span>
                      <span>{Math.round((deptTotal / total) * 100)}% tổng chi</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="space-y-2">
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <Calculator size={16} />
                Tính lương tự động
              </button>
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <Send size={16} />
                Gửi phiếu lương hàng loạt
              </button>
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <BarChart3 size={16} />
                Xuất báo cáo thuế
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <h4 className="font-semibold text-gray-900 mb-3">Thống kê nhanh</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Đã chi trả tháng này</span>
                <span className="font-semibold text-emerald-600">{paidCount} người</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Chờ duyệt</span>
                <span className="font-semibold text-amber-600">{pendingCount} người</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Chi phí/Doanh thu</span>
                <span className="font-semibold text-blue-600">
                  {Math.round((total / 100000000) * 100)}%
                </span>
              </div>
            </div>
            <button className="mt-4 w-full rounded-xl border border-pink-200 bg-white py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
              Xem báo cáo chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
        <div className="text-sm font-semibold text-gray-900 mb-3">Chú thích trạng thái</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <span className="text-sm text-gray-600">Chờ duyệt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <span className="text-sm text-gray-600">Đã chi trả</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
            <span className="text-sm text-gray-600">Đang xử lý</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
            <span className="text-sm text-gray-600">Academic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <span className="text-sm text-gray-600">Operations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <span className="text-sm text-gray-600">Sales</span>
          </div>
        </div>
      </div>
    </div>
  );
}