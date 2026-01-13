'use client';

import { useMemo, useState } from 'react';

type SortDirection = 'asc' | 'desc';

type SortState<T> = {
  key: keyof T | null;
  direction: SortDirection;
};

function quickSort<T>(items: T[], compare: (a: T, b: T) => number): T[] {
  if (items.length <= 1) return items;

  const pivot = items[items.length - 1];
  const left: T[] = [];
  const right: T[] = [];

  for (let i = 0; i < items.length - 1; i++) {
    const c = compare(items[i], pivot);
    if (c <= 0) left.push(items[i]);
    else right.push(items[i]);
  }

  return [...quickSort(left, compare), pivot, ...quickSort(right, compare)];
}

function toSortableValue(v: unknown): string | number {
  if (v == null) return '';
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return String(v).toLowerCase();
}

function buildComparator<T>(
  key: keyof T,
  direction: SortDirection
): (a: T, b: T) => number {
  const dir = direction === 'asc' ? 1 : -1;
  return (a, b) => {
    const av = toSortableValue((a as any)[key]);
    const bv = toSortableValue((b as any)[key]);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  };
}

import {
  Download, Plus, Search, DollarSign, TriangleAlert,
  CheckCircle2, Eye, Send, CalendarClock, Filter,
  TrendingUp, Bell, CreditCard,
  BarChart3, MoreVertical
} from 'lucide-react';

/* ---------- utils ---------- */
const formatVND = (n: number) =>
  n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).replace('₫', 'VND');

type FeeStatus = 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING';
type Row = {
  id: string;
  student: string;
  course: string;
  total: number;
  paid: number;
  due: string;         // dd/mm/yyyy
  status: FeeStatus;
  avatarColor: string;
  progress: number;
};

/* ---------- demo data ---------- */
const ROWS: Row[] = [
  { 
    id: 'HV001', 
    student: 'Nguyễn Văn An',  
    course: 'English B1',     
    total: 2500000, 
    paid: 2500000, 
    due: '15/01/2025', 
    status: 'PAID',
    avatarColor: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    progress: 100
  },
  { 
    id: 'HV002', 
    student: 'Trần Thị Bình',  
    course: 'IELTS Prep',     
    total: 3200000, 
    paid: 1600000, 
    due: '15/10/2025', 
    status: 'PARTIAL',
    avatarColor: 'bg-gradient-to-r from-blue-400 to-cyan-500',
    progress: 50
  },
  { 
    id: 'HV003', 
    student: 'Lê Văn Cường',   
    course: 'TOEIC Advanced', 
    total: 2800000, 
    paid: 1400000, 
    due: '30/09/2025', 
    status: 'OVERDUE',
    avatarColor: 'bg-gradient-to-r from-rose-400 to-pink-500',
    progress: 50
  },
  { 
    id: 'HV004', 
    student: 'Phạm Thị Dung',  
    course: 'English A2',     
    total: 2200000, 
    paid: 2200000, 
    due: '01/03/2025', 
    status: 'PAID',
    avatarColor: 'bg-gradient-to-r from-violet-400 to-purple-500',
    progress: 100
  },
  { 
    id: 'HV005', 
    student: 'Hoàng Văn Em',   
    course: 'Business Eng.',  
    total: 3500000, 
    paid: 0,       
    due: '20/10/2025', 
    status: 'PENDING',
    avatarColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
    progress: 0
  },
  { 
    id: 'HV006', 
    student: 'Nguyễn Thị Mai',   
    course: 'Speaking Master',  
    total: 4200000, 
    paid: 2100000,       
    due: '05/10/2025', 
    status: 'PARTIAL',
    avatarColor: 'bg-gradient-to-r from-indigo-400 to-blue-500',
    progress: 50
  },
  { 
    id: 'HV007', 
    student: 'Trần Quang Huy',   
    course: 'Grammar Pro',  
    total: 1800000, 
    paid: 1800000,       
    due: '25/09/2025', 
    status: 'PAID',
    avatarColor: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    progress: 100
  },
  { 
    id: 'HV008', 
    student: 'Lê Thị Hương',   
    course: 'Writing Advanced',  
    total: 2900000, 
    paid: 0,       
    due: '18/09/2025', 
    status: 'OVERDUE',
    avatarColor: 'bg-gradient-to-r from-rose-400 to-pink-500',
    progress: 0
  },
];

/* ---------- modern stat card ---------- */
function StatCard(props: {
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  trend?: number;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-pink-100/50">
      {/* Background gradient accent */}
      <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${props.color}`}></div>
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`p-2.5 rounded-xl bg-gradient-to-r ${props.color} text-white shadow-sm`}>
              {props.icon}
            </div>
            {props.trend !== undefined && (
              <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                props.trend >= 0 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-rose-50 text-rose-600'
              }`}>
                <TrendingUp size={12} className={props.trend >= 0 ? '' : 'rotate-180'} />
                {Math.abs(props.trend)}%
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-gray-600">{props.label}</div>
          <div className="text-2xl font-bold text-gray-900">{props.value}</div>
          {props.subtext && (
            <div className="text-xs text-gray-500">{props.subtext}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- modern status badge ---------- */
function StatusBadge({ status }: { status: FeeStatus }) {
  const map: Record<FeeStatus, { 
    text: string; 
    cls: string;
    icon: React.ReactNode;
  }> = {
    PAID: { 
      text: 'Đã thanh toán',      
      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      icon: <CheckCircle2 size={12} />
    },
    PARTIAL: { 
      text: 'Thanh toán một phần', 
      cls: 'bg-sky-50 text-sky-700 border border-sky-200',
      icon: <BarChart3 size={12} />
    },
    OVERDUE: { 
      text: 'Quá hạn',             
      cls: 'bg-rose-50 text-rose-700 border border-rose-200',
      icon: <TriangleAlert size={12} />
    },
    PENDING: { 
      text: 'Chờ thanh toán',      
      cls: 'bg-amber-50 text-amber-700 border border-amber-200',
      icon: <CalendarClock size={12} />
    },
  };
  const s = map[status];
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${s.cls}`}>
      {s.icon}
      <span>{s.text}</span>
    </div>
  );
}

/* ---------- progress bar ---------- */

/* ---------- avatar ---------- */
function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-semibold text-sm ${color} shadow-sm`}>
      {initials}
    </div>
  );
}

/* ---------- modern action button ---------- */
function ActionButton({ 
  icon, 
  label, 
  variant = 'secondary',
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:shadow-pink-200',
    secondary: 'bg-white border border-pink-200 text-gray-700 hover:bg-pink-50',
    danger: 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${variants[variant]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ---------- table row ---------- */
function FeeRow({ r }: { r: Row }) {
  const remain = r.total - r.paid;

  return (
    <div className="group grid grid-cols-12 items-center gap-4 border-b border-pink-100 py-4 px-4 text-gray-900 hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-300">
      {/* Học viên */}
      <div className="col-span-3">
        <div className="flex items-center gap-3">
          <Avatar name={r.student} color={r.avatarColor} />
          <div>
            <div className="font-semibold text-gray-900">{r.student}</div>
            <div className="text-xs text-gray-500">{r.id}</div>
          </div>
        </div>
      </div>

      {/* Khóa học */}
      <div className="col-span-2">
        <div className="rounded-lg bg-gradient-to-r from-pink-50 to-rose-50/30 px-3 py-1.5 border border-pink-200">
          <span className="text-sm font-medium text-gray-800">{r.course}</span>
        </div>
      </div>

      {/* Số tiền */}
      <div className="col-span-2 space-y-1">
        <div className="text-sm font-semibold text-gray-900">{formatVND(r.total)}</div>
        <div className={`text-xs font-medium ${remain > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatVND(remain)} còn lại
        </div>
      </div>

      {/* Hạn thanh toán */}
      <div className="col-span-2 text-center">
        <div className="inline-flex flex-col items-center gap-1">
          <div className={`text-sm font-semibold ${
            r.status === 'OVERDUE' ? 'text-rose-600' : 'text-gray-700'
          }`}>
            {r.due}
          </div>
          {r.status === 'OVERDUE' && (
            <div className="text-[10px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
              Quá hạn
            </div>
          )}
        </div>
      </div>

      {/* Trạng thái */}
      <div className="col-span-2">
        <StatusBadge status={r.status} />
      </div>

      {/* Actions */}
      <div className="col-span-1">
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer text-gray-500 hover:text-pink-600">
            <Eye size={16} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer text-gray-500 hover:text-pink-600">
            <Send size={16} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer text-gray-500 hover:text-pink-600">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function FeesPage() {
  const [tab, setTab] = useState<'ALL' | 'OVERDUE' | 'PARTIAL' | 'PAID'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FeeStatus | 'ALL'>('ALL');
  const [sort, setSort] = useState<SortState<Row>>({ key: null, direction: 'asc' });

  const toggleSort = (key: keyof Row) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const SortHeader = ({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey: keyof Row;
    className?: string;
  }) => {
    const active = sort.key === sortKey;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className={`inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 ${className ?? ''}`}
      >
        <span>{label}</span>
        {active ? (
          sort.direction === 'asc' ? (
            <span aria-hidden>↑</span>
          ) : (
            <span aria-hidden>↓</span>
          )
        ) : (
          <span aria-hidden className="text-gray-300">↕</span>
        )}
      </button>
    );
  };

  const filtered = useMemo(() => {
    let result = ROWS;
    
    // Filter by tab
    if (tab === 'OVERDUE') result = result.filter(r => r.status === 'OVERDUE');
    if (tab === 'PARTIAL') result = result.filter(r => r.status === 'PARTIAL');
    if (tab === 'PAID') result = result.filter(r => r.status === 'PAID');
    
    // Filter by selected status
    if (selectedStatus !== 'ALL') {
      result = result.filter(r => r.status === selectedStatus);
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(r => 
        r.student.toLowerCase().includes(searchLower) ||
        r.course.toLowerCase().includes(searchLower) ||
        r.id.toLowerCase().includes(searchLower)
      );
    }

    if (sort.key) {
      result = quickSort([...result], buildComparator(sort.key, sort.direction));
    }

    return result;
  }, [tab, search, selectedStatus, sort.key, sort.direction]);

  const revenueThisMonth = 7700000;
  const debt = ROWS.reduce((s, r) => s + (r.total - r.paid), 0);
  const overdueCount = ROWS.filter(r => r.status === 'OVERDUE').length;
  const paidCount = ROWS.filter(r => r.status === 'PAID').length;
  const partialCount = ROWS.filter(r => r.status === 'PARTIAL').length;
  
  const stats = [
    {
      label: 'Tổng doanh thu',
      value: formatVND(ROWS.reduce((sum, r) => sum + r.total, 0)),
      icon: <DollarSign size={20} />,
      color: 'from-emerald-400 to-teal-500',
      trend: 12,
      subtext: 'Tháng này'
    },
    {
      label: 'Công nợ',
      value: formatVND(debt),
      icon: <TriangleAlert size={20} />,
      color: 'from-rose-400 to-pink-500',
      subtext: `${overdueCount} hồ sơ quá hạn`
    },
    {
      label: 'Đã thanh toán',
      value: `${paidCount} hồ sơ`,
      icon: <CheckCircle2 size={20} />,
      color: 'from-blue-400 to-cyan-500',
      subtext: `${formatVND(ROWS.reduce((sum, r) => sum + r.paid, 0))}`
    },
    {
      label: 'Thanh toán một phần',
      value: `${partialCount} hồ sơ`,
      icon: <BarChart3 size={20} />,
      color: 'from-amber-400 to-orange-500',
      subtext: 'Đang theo dõi'
    }
  ];

  const statusFilters: Array<{ value: FeeStatus | 'ALL'; label: string; count: number }> = [
    { value: 'ALL', label: 'Tất cả', count: ROWS.length },
    { value: 'PAID', label: 'Đã thanh toán', count: paidCount },
    { value: 'PARTIAL', label: 'Thanh toán một phần', count: partialCount },
    { value: 'OVERDUE', label: 'Quá hạn', count: overdueCount },
    { value: 'PENDING', label: 'Chờ thanh toán', count: ROWS.filter(r => r.status === 'PENDING').length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <CreditCard size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Quản lý học phí
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi thanh toán, công nợ và doanh thu từ học viên
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton 
            icon={<Download size={16} />} 
            label="Xuất báo cáo" 
            variant="secondary"
          />
          <ActionButton 
            icon={<Plus size={16} />} 
            label="Ghi nhận thanh toán" 
            variant="primary"
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            color={stat.color}
            subtext={stat.subtext}
          />
        ))}
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1">
            {[
              { k: 'ALL', label: 'Tổng quan' },
              { k: 'OVERDUE', label: 'Quá hạn' },
              { k: 'PARTIAL', label: 'Thanh toán một phần' },
              { k: 'PAID', label: 'Đã thanh toán' },
            ].map(t => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as typeof tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  tab === t.k 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm' 
                    : 'text-gray-700 hover:bg-pink-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as FeeStatus | 'ALL')}
              className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              {statusFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label} ({filter.count})
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm học viên, khóa học..."
              className="h-10 w-72 rounded-xl border border-pink-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main table */}
      <div className="overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 border-b border-pink-100 bg-gradient-to-r from-pink-500/10 to-rose-500/10 px-4 py-3 text-gray-700">
          <div className="col-span-3">
            <SortHeader label="Học viên" sortKey="student" />
          </div>
          <div className="col-span-2">
            <SortHeader label="Khóa học" sortKey="course" />
          </div>
          <div className="col-span-2">
            <SortHeader label="Học phí" sortKey="total" />
          </div>
          <div className="col-span-2 text-center">
            <SortHeader label="Hạn thanh toán" sortKey="due" />
          </div>
          <div className="col-span-2">
            <SortHeader label="Trạng thái" sortKey="status" />
          </div>
          <div className="col-span-1 text-right">
            <span className="text-sm font-semibold text-gray-700">Thao tác</span>
          </div>
        </div>

        {/* Table body */}
        <div className="divide-y divide-pink-100">
          {filtered.length > 0 ? (
            filtered.map((r) => <FeeRow key={r.id} r={r} />)
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                <Search size={24} className="text-pink-400" />
              </div>
              <div className="text-gray-600 font-medium">Không tìm thấy hồ sơ phù hợp</div>
              <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm khác</div>
            </div>
          )}
        </div>

        {/* Table footer */}
        <div className="border-t border-pink-100 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold text-gray-900">{filtered.length}</span> trong tổng số <span className="font-semibold text-gray-900">{ROWS.length}</span> hồ sơ
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-pink-200 bg-white px-3 py-1.5 text-sm hover:bg-pink-50">
                Trước
              </button>
              <div className="flex items-center gap-1">
                <button className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium">
                  1
                </button>
                <button className="h-8 w-8 rounded-lg border border-pink-200 bg-white text-sm hover:bg-pink-50">
                  2
                </button>
                <button className="h-8 w-8 rounded-lg border border-pink-200 bg-white text-sm hover:bg-pink-50">
                  3
                </button>
              </div>
              <button className="rounded-lg border border-pink-200 bg-white px-3 py-1.5 text-sm hover:bg-pink-50">
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}