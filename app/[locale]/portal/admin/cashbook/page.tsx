'use client';

import { useMemo, useState } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  CalendarDays, 
  Download, 
  Plus, 
  Filter,
  TrendingUp,
  TrendingDown,
  Wallet,
  Banknote,
  CreditCard,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Clock
} from 'lucide-react';

type CashRow = {
  id: string;
  type: 'IN' | 'OUT';
  title: string;
  amount: number;
  date: string;
  method: string;
  note: string;
  category: string;
  branch: string;
  status: 'completed' | 'pending';
  color: string;
};

const ROWS: CashRow[] = [
  {
    id: 'THU-0920',
    type: 'IN',
    title: 'Thu học phí - IELTS Prep',
    amount: 3200000,
    date: '20/09/2025',
    method: 'PayOS',
    note: 'HV002 - Trần Thị Bình',
    category: 'Học phí',
    branch: 'Cơ sở 1',
    status: 'completed',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    id: 'CHI-0919',
    type: 'OUT',
    title: 'Chi lương giáo viên',
    amount: 18500000,
    date: '19/09/2025',
    method: 'Chuyển khoản',
    note: 'Đợt lương tháng 09',
    category: 'Lương',
    branch: 'Toàn hệ thống',
    status: 'completed',
    color: 'from-rose-400 to-pink-500'
  },
  {
    id: 'CHI-0918',
    type: 'OUT',
    title: 'Mua giáo cụ',
    amount: 2400000,
    date: '18/09/2025',
    method: 'Tiền mặt',
    note: 'Giáo cụ lớp Starters',
    category: 'Vật tư',
    branch: 'Cơ sở 2',
    status: 'completed',
    color: 'from-amber-400 to-orange-500'
  },
  {
    id: 'THU-0917',
    type: 'IN',
    title: 'Thu học phí - TOEIC Advanced',
    amount: 2800000,
    date: '17/09/2025',
    method: 'VNPay',
    note: 'HV003 - Lê Văn Cường',
    category: 'Học phí',
    branch: 'Cơ sở 1',
    status: 'completed',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    id: 'CHI-0916',
    type: 'OUT',
    title: 'Thuê mặt bằng',
    amount: 15000000,
    date: '16/09/2025',
    method: 'Chuyển khoản',
    note: 'Tiền thuê tháng 9',
    category: 'Thuê mặt bằng',
    branch: 'Cơ sở 1',
    status: 'completed',
    color: 'from-violet-400 to-purple-500'
  },
  {
    id: 'THU-0915',
    type: 'IN',
    title: 'Đăng ký khóa mới',
    amount: 4200000,
    date: '15/09/2025',
    method: 'Tiền mặt',
    note: 'HV006 - Nguyễn Thị Mai',
    category: 'Học phí',
    branch: 'Cơ sở 2',
    status: 'pending',
    color: 'from-blue-400 to-cyan-500'
  },
];

const CATEGORIES = [
  { name: 'Học phí', type: 'IN', count: 3, color: 'from-emerald-400 to-teal-500' },
  { name: 'Lương', type: 'OUT', count: 1, color: 'from-rose-400 to-pink-500' },
  { name: 'Vật tư', type: 'OUT', count: 1, color: 'from-amber-400 to-orange-500' },
  { name: 'Thuê mặt bằng', type: 'OUT', count: 1, color: 'from-violet-400 to-purple-500' },
  { name: 'Marketing', type: 'OUT', count: 0, color: 'from-blue-400 to-cyan-500' },
];

const PAYMENT_METHODS = [
  { name: 'PayOS', count: 1, color: 'from-purple-400 to-pink-500' },
  { name: 'Chuyển khoản', count: 2, color: 'from-blue-400 to-cyan-500' },
  { name: 'Tiền mặt', count: 2, color: 'from-emerald-400 to-teal-500' },
  { name: 'VNPay', count: 1, color: 'from-orange-400 to-amber-500' },
];

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

function TransactionCard({ row }: { row: CashRow }) {
  return (
    <div className="group rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-pink-100/50">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${row.color}`}></div>
            <h3 className="font-semibold text-gray-900">{row.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              row.status === 'completed' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {row.status === 'completed' ? 'Hoàn thành' : 'Chờ xử lý'}
            </span>
          </div>
          <div className="text-xs text-gray-500">{row.id}</div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600">
            <Eye size={14} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600">
            <Edit size={14} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors text-gray-400 hover:text-rose-600">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{row.category}</span>
            <span className="mx-2">•</span>
            <span>{row.branch}</span>
          </div>
          <div className={`text-lg font-bold ${
            row.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {row.type === 'IN' ? '+' : '-'} {formatVND(row.amount)}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Banknote size={12} />
              <span>{row.method}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{row.date}</span>
            </div>
          </div>
          <div className="text-xs px-2 py-1 bg-gray-50 rounded-lg">
            {row.note}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CashbookPage() {
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('09/2025');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const rows = useMemo(() => {
    let result = ROWS;
    
    if (filter !== 'ALL') {
      result = result.filter(r => r.type === filter);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.note.toLowerCase().includes(searchLower) ||
        r.id.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedCategory !== 'ALL') {
      result = result.filter(r => r.category === selectedCategory);
    }
    
    return result;
  }, [filter, search, selectedCategory]);

  const totalIn = ROWS.filter((r) => r.type === 'IN').reduce((s, r) => s + r.amount, 0);
  const totalOut = ROWS.filter((r) => r.type === 'OUT').reduce((s, r) => s + r.amount, 0);
  const balance = totalIn - totalOut;
  
  const pendingAmount = ROWS.filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (r.type === 'IN' ? r.amount : -r.amount), 0);

  const stats = [
    {
      title: 'Số dư hiện tại',
      value: formatVND(balance),
      icon: <Wallet size={20} />,
      color: 'from-pink-500 to-rose-500',
      subtitle: 'Sau khi trừ chi phí',
      trend: { value: 8, label: 'vs tháng trước' }
    },
    {
      title: 'Tổng thu tháng',
      value: formatVND(totalIn),
      icon: <ArrowUpRight size={20} />,
      color: 'from-emerald-500 to-teal-500',
      subtitle: 'Từ học phí & dịch vụ',
      trend: { value: 12, label: 'vs tháng trước' }
    },
    {
      title: 'Tổng chi tháng',
      value: formatVND(totalOut),
      icon: <ArrowDownRight size={20} />,
      color: 'from-rose-500 to-pink-500',
      subtitle: 'Lương, vật tư, mặt bằng',
      trend: { value: -5, label: 'vs tháng trước' }
    },
    {
      title: 'Giao dịch chờ',
      value: formatVND(pendingAmount),
      icon: <Clock size={20} />,
      color: 'from-amber-500 to-orange-500',
      subtitle: 'Chưa xử lý',
      trend: { value: 3, label: 'giao dịch' }
    }
  ];

  const categories = ['ALL', ...new Set(ROWS.map(r => r.category))];
  const months = ['09/2025', '08/2025', '07/2025', '06/2025'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <DollarSign size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Sổ quỹ & Dòng tiền
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi thu chi, dòng tiền và báo cáo tài chính theo chi nhánh
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Download size={16} /> Xuất báo cáo
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <Plus size={16} /> Ghi thu/chi mới
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
            {/* Type Filter */}
            <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1">
              {[
                { k: 'ALL', label: 'Tất cả', count: ROWS.length },
                { k: 'IN', label: 'Thu', count: ROWS.filter(r => r.type === 'IN').length },
                { k: 'OUT', label: 'Chi', count: ROWS.filter(r => r.type === 'OUT').length },
              ].map((item) => (
                <button
                  key={item.k}
                  onClick={() => setFilter(item.k as typeof filter)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
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

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-gray-500" />
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
              placeholder="Tìm kiếm giao dịch..."
              className="h-10 w-72 rounded-xl border border-pink-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transactions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Nhật ký thu chi</h2>
            <button className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-pink-600 transition-colors">
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {rows.length > 0 ? (
              rows.map((row) => (
                <TransactionCard key={row.id} row={row} />
              ))
            ) : (
              <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-8 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                  <Search size={24} className="text-pink-400" />
                </div>
                <div className="text-gray-600 font-medium">Không tìm thấy giao dịch</div>
                <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo giao dịch mới</div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Analytics */}
        <div className="space-y-6">
          {/* Categories Breakdown */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
                <PieChart size={18} className="text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Phân loại chi tiêu</h3>
            </div>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const amount = ROWS
                  .filter(r => r.category === cat.name)
                  .reduce((sum, r) => sum + r.amount, 0);
                
                if (amount === 0 && cat.count === 0) return null;
                
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{cat.name}</span>
                      <span className="font-semibold text-gray-900">{formatVND(amount)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                        style={{ 
                          width: `${(amount / (cat.type === 'IN' ? totalIn : totalOut)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50">
                <CreditCard size={18} className="text-emerald-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Phương thức thanh toán</h3>
            </div>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const amount = ROWS
                  .filter(r => r.method === method.name)
                  .reduce((sum, r) => sum + r.amount, 0);
                
                const percentage = (method.count / ROWS.length) * 100;
                
                return (
                  <div key={method.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${method.color}`}></div>
                      <span className="text-sm text-gray-700">{method.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{formatVND(amount)}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="space-y-2">
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <RefreshCw size={16} />
                Đối soát ngân hàng
              </button>
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <BarChart3 size={16} />
                Xuất báo cáo thuế
              </button>
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <CalendarDays size={16} />
                Xem dự báo dòng tiền
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Panel */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Tổng giao dịch</div>
          <div className="text-2xl font-bold text-gray-900">{ROWS.length}</div>
          <div className="text-xs text-gray-500 mt-1">trong tháng 9/2025</div>
        </div>
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Tỷ lệ thu/chi</div>
          <div className="text-2xl font-bold text-gray-900">
            {totalOut > 0 ? Math.round((totalIn / totalOut) * 100) : 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Hiệu quả tài chính</div>
        </div>
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Chi nhánh hoạt động</div>
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-xs text-gray-500 mt-1">Cơ sở 1, 2, 3</div>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
        <div className="text-sm font-semibold text-gray-900 mb-3">Chú thích</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <span className="text-sm text-gray-600">Thu nhập (IN)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-rose-400 to-pink-500"></div>
            <span className="text-sm text-gray-600">Chi phí (OUT)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <span className="text-sm text-gray-600">Chờ xử lý</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <span className="text-sm text-gray-600">Hoàn thành</span>
          </div>
        </div>
      </div>
    </div>
  );
}