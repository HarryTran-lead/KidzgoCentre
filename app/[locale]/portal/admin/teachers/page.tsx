'use client';

import {
  Phone, Mail, Clock3, Eye, PencilLine, Search,
  Users, GraduationCap, Calendar, Star, Filter,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, BookOpen, Award, TrendingUp, Download,
  Plus, MessageSquare, UserCheck, XCircle, CheckCircle,
  MapPin, Globe, Instagram, Facebook, Youtube
} from 'lucide-react';
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


type Teacher = {
  code: string;
  name: string;
  phone: string;
  email: string;
  subjects: string[];
  extra?: number;
  exp: string;
  load: string;
  classes: number;
  status: 'active' | 'off' | 'parttime';
  joinDate: string;
  rating: number;
  avatarColor: string;
  department: string;
  specialization: string[];
  students: number;
  location: string;
  social?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
};

const TEACHERS: Teacher[] = [
  {
    code: 'GV001',
    name: 'Ms. Sarah Johnson',
    phone: '0901111111',
    email: 'sarah.johnson@kidzgo.com',
    subjects: ['English Grammar', 'IELTS Speaking'],
    extra: 0,
    exp: '8 năm',
    load: '25h/tuần',
    classes: 2,
    status: 'active',
    joinDate: '15/01/2020',
    rating: 4.9,
    avatarColor: 'from-pink-400 to-rose-500',
    department: 'Academic',
    specialization: ['IELTS', 'Grammar'],
    students: 145,
    location: 'Cơ sở 1',

  },
  {
    code: 'GV002',
    name: 'Mr. John Smith',
    phone: '0902222222',
    email: 'john.smith@kidzgo.com',
    subjects: ['IELTS Writing', 'Academic English'],
    extra: 0,
    exp: '12 năm',
    load: '28h/tuần',
    classes: 2,
    status: 'active',
    joinDate: '20/03/2019',
    rating: 4.8,
    avatarColor: 'from-blue-400 to-cyan-500',
    department: 'Academic',
    specialization: ['IELTS', 'Academic'],
    students: 189,
    location: 'Cơ sở 2',

  },
  {
    code: 'GV003',
    name: 'Ms. Emily Davis',
    phone: '0903333333',
    email: 'emily.davis@kidzgo.com',
    subjects: ['Business English', 'Conversation'],
    extra: 0,
    exp: '5 năm',
    load: '22h/tuần',
    classes: 2,
    status: 'active',
    joinDate: '10/08/2021',
    rating: 4.7,
    avatarColor: 'from-emerald-400 to-teal-500',
    department: 'Business English',
    specialization: ['Business', 'Communication'],
    students: 112,
    location: 'Cơ sở 1',
  },
  {
    code: 'GV004',
    name: 'Mr. David Wilson',
    phone: '0904444444',
    email: 'david.wilson@kidzgo.com',
    subjects: ['TOEIC', 'English Grammar'],
    extra: 1,
    exp: '7 năm',
    load: '24h/tuần',
    classes: 2,
    status: 'parttime',
    joinDate: '05/11/2020',
    rating: 4.6,
    avatarColor: 'from-violet-400 to-purple-500',
    department: 'Test Preparation',
    specialization: ['TOEIC', 'TOEFL'],
    students: 98,
    location: 'Cơ sở 3',
  },
  {
    code: 'GV005',
    name: 'Ms. Lisa Anderson',
    phone: '0905555555',
    email: 'lisa.anderson@kidzgo.com',
    subjects: ['English for Kids', 'Elementary English'],
    extra: 0,
    exp: '6 năm',
    load: '0h/tuần',
    classes: 0,
    status: 'off',
    joinDate: '15/06/2022',
    rating: 4.5,
    avatarColor: 'from-amber-400 to-orange-500',
    department: 'Kids Program',
    specialization: ['Kids', 'Elementary'],
    students: 76,
    location: 'Cơ sở 2',
  },
  {
    code: 'GV006',
    name: 'Mr. Michael Brown',
    phone: '0906666666',
    email: 'michael.brown@kidzgo.com',
    subjects: ['Speaking Master', 'Pronunciation'],
    extra: 2,
    exp: '10 năm',
    load: '30h/tuần',
    classes: 3,
    status: 'active',
    joinDate: '12/02/2018',
    rating: 4.9,
    avatarColor: 'from-indigo-400 to-blue-500',
    department: 'Communication',
    specialization: ['Speaking', 'Pronunciation'],
    students: 201,
    location: 'Cơ sở 1',

  },
  {
    code: 'GV007',
    name: 'Ms. Sophia Williams',
    phone: '0907777777',
    email: 'sophia.williams@kidzgo.com',
    subjects: ['Writing Advanced', 'Essay Writing'],
    extra: 1,
    exp: '9 năm',
    load: '26h/tuần',
    classes: 2,
    status: 'active',
    joinDate: '25/09/2019',
    rating: 4.8,
    avatarColor: 'from-rose-400 to-pink-500',
    department: 'Academic',
    specialization: ['Writing', 'Essay'],
    students: 167,
    location: 'Cơ sở 2',
  },
  {
    code: 'GV008',
    name: 'Mr. Daniel Lee',
    phone: '0908888888',
    email: 'daniel.lee@kidzgo.com',
    subjects: ['Business Communication', 'Negotiation'],
    extra: 0,
    exp: '11 năm',
    load: '20h/tuần',
    classes: 1,
    status: 'parttime',
    joinDate: '30/04/2021',
    rating: 4.7,
    avatarColor: 'from-rose-400 to-pink-500',
    department: 'Business English',
    specialization: ['Business', 'Negotiation'],
    students: 89,
    location: 'Cơ sở 3',
  },
];

const STATUS_INFO: Record<Teacher['status'], {
  label: string;
  cls: string;
  icon: React.ReactNode;
}> = {
  active: {
    label: 'Đang làm việc',
    cls: 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200',
    icon: <CheckCircle size={12} />
  },
  parttime: {
    label: 'Bán thời gian',
    cls: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200',
    icon: <Clock3 size={12} />
  },
  off: {
    label: 'Tạm nghỉ',
    cls: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200',
    icon: <XCircle size={12} />
  },
};

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${color}`}></div>
      <div className="relative flex items-center justify-between gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-600 truncate">{title}</div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
          {subtitle && <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>}
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
    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-semibold text-xs bg-gradient-to-r from-pink-500 to-rose-500 shadow-sm">
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: Teacher['status'] }) {
  const { label, cls, icon } = STATUS_INFO[status];
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-1 text-xs font-medium text-amber-700 border border-amber-200">
      <Star size={10} className="fill-amber-500 text-amber-500" />
      <span>{rating}</span>
    </div>
  );
}

function SubjectChip({ children }: { children: string }) {
  return (
    <span className="px-2 py-1 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-xs font-medium border border-blue-200">
      {children}
    </span>
  );
}

export default function TeachersPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'parttime' | 'off'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState<Teacher>>({ key: null, direction: 'asc' });

  const toggleSort = (key: keyof Teacher) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
    setCurrentPage(1);
  };

  const SortHeader = ({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey: keyof Teacher;
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

  const stats = [
    {
      title: 'Tổng giáo viên',
      value: `${TEACHERS.length}`,
      icon: <Users size={20} />,
      color: 'from-pink-500 to-rose-500',
      subtitle: 'Toàn hệ thống'
    },
    {
      title: 'Đang làm việc',
      value: `${TEACHERS.filter(t => t.status === 'active').length}`,
      icon: <UserCheck size={20} />,
      color: 'from-emerald-500 to-teal-500',
      subtitle: 'Full-time & Part-time'
    },
    {
      title: 'Học viên trung bình',
      value: `${Math.round(TEACHERS.reduce((sum, t) => sum + t.students, 0) / TEACHERS.length)}`,
      icon: <GraduationCap size={20} />,
      color: 'from-blue-500 to-cyan-500',
      subtitle: 'Mỗi giáo viên'
    },
    {
      title: 'Đánh giá TB',
      value: `${(TEACHERS.reduce((sum, t) => sum + t.rating, 0) / TEACHERS.length).toFixed(1)}`,
      icon: <Star size={20} />,
      color: 'from-amber-500 to-orange-500',
      subtitle: 'Từ học viên'
    }
  ];

  const list = useMemo(() => {
    let result = TEACHERS;

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    if (departmentFilter !== 'all') {
      result = result.filter(t => t.department === departmentFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.code.toLowerCase().includes(searchLower) ||
        t.email.toLowerCase().includes(searchLower) ||
        t.phone.toLowerCase().includes(searchLower)
      );
    }

    if (sort.key) {
      result = quickSort([...result], buildComparator(sort.key, sort.direction));
    }

    return result;
  }, [statusFilter, departmentFilter, search, sort.key, sort.direction]);

  // Pagination
  const totalPages = Math.ceil(list.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = list.slice(startIndex, endIndex);

  const departments = ['all', ...new Set(TEACHERS.map(t => t.department))];

  const toggleSelectRow = (code: string) => {
    setSelectedRows(prev =>
      prev.includes(code)
        ? prev.filter(rowCode => rowCode !== code)
        : [...prev, code]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === currentRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentRows.map(row => row.code));
    }
  };

  const activeTeachers = TEACHERS.filter(t => t.status === 'active').length;
  const parttimeTeachers = TEACHERS.filter(t => t.status === 'parttime').length;
  const offTeachers = TEACHERS.filter(t => t.status === 'off').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Quản lý Giáo viên
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý thông tin, chuyên môn và lịch dạy của giáo viên
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Download size={16} /> Xuất danh sách
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <Plus size={16} /> Thêm giáo viên mới
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
                { k: 'all', label: 'Tất cả', count: TEACHERS.length },
                { k: 'active', label: 'Đang làm việc', count: activeTeachers },
                { k: 'parttime', label: 'Bán thời gian', count: parttimeTeachers },
                { k: 'off', label: 'Tạm nghỉ', count: offTeachers },
              ].map((item) => (
                <button
                  key={item.k}
                  onClick={() => setStatusFilter(item.k as typeof statusFilter)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${statusFilter === item.k
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-pink-50'
                    }`}
                >
                  {item.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === item.k ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="all">Tất cả bộ môn</option>
                {departments.filter(d => d !== 'all').map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm giáo viên..."
              className="h-10 w-72 rounded-xl border border-pink-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách giáo viên</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{list.length} giáo viên</span>
              {selectedRows.length > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-pink-600 font-medium">
                    Đã chọn {selectedRows.length} giáo viên
                  </span>
                </>
              )}
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
                    <SortHeader label="Giáo viên" sortKey="name" />
                  </div>
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Chuyên môn" sortKey="department" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Kinh nghiệm" sortKey="exp" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Lịch dạy" sortKey="load" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Đánh giá" sortKey="rating" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Trạng thái" sortKey="status" />
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {currentRows.length > 0 ? (
                currentRows.map((t) => (
                  <tr
                    key={t.code}
                    className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(t.code)}
                          onChange={() => toggleSelectRow(t.code)}
                          className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200"
                        />
                        <div className="flex items-center gap-3">
                          <Avatar name={t.name} color={t.avatarColor} />
                          <div>
                            <div className="font-medium text-gray-900">{t.name}</div>
                            <div className="text-xs text-gray-500">{t.code}</div>
                            <div className="text-xs text-gray-400">{t.department}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {t.subjects.slice(0, 2).map((subject) => (
                            <SubjectChip key={subject}>{subject}</SubjectChip>
                          ))}
                          {t.extra ? (
                            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                              +{t.extra}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.specialization.join(', ')}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-900">
                          <Clock3 size={14} className="text-gray-400" />
                          <span className="font-medium">{t.exp}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          Tham gia: {t.joinDate}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">{t.load}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <BookOpen size={12} />
                          <span>{t.classes} lớp • {t.students} học viên</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} />
                          <span>{t.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <RatingBadge rating={t.rating} />
                        </div>
                        
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 transition-opacity duration-200">
                        <button
                          className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600  cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <PencilLine size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-gray-400 hover:text-emerald-600 cursor-pointer"
                          title="Nhắn tin"
                        >
                          <MessageSquare size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer"
                          title="Thao tác khác"
                        >
                          <MoreVertical size={14} />
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
                    <div className="text-gray-600 font-medium">Không tìm thấy giáo viên</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc thêm giáo viên mới</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Pagination */}
        {list.length > 0 && (
          <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, list.length)}</span>
                {' '}trong tổng số <span className="font-semibold text-gray-900">{list.length}</span> giáo viên
                {selectedRows.length > 0 && (
                  <span className="ml-3 text-pink-600 font-medium">
                    Đã chọn {selectedRows.length} giáo viên
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
                        className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum
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
                  <ChevronRight size={16} className="text-gray-600" />
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
    </div>
  );
}