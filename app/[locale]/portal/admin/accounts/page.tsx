"use client";

import { useMemo, useState } from "react";

type SortDirection = "asc" | "desc";

type SortState<T> = {
  key: keyof T | null;
  direction: SortDirection;
};

function quickSort<T>(
  items: T[],
  compare: (a: T, b: T) => number
): T[] {
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
  if (v == null) return "";
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  return String(v).toLowerCase();
}

function buildComparator<T>(
  key: keyof T,
  direction: SortDirection
): (a: T, b: T) => number {
  const dir = direction === "asc" ? 1 : -1;
  return (a, b) => {
    const av = toSortableValue((a as any)[key]);
    const bv = toSortableValue((b as any)[key]);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  };
}

import {
  Search,
  ShieldCheck,
  UserPlus,
  Lock,
  Mail,
  Phone,
  Filter,
  Users,
  Key,
  Bell,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  User,
  Calendar
} from "lucide-react";

type Role = "ADMIN" | "TEACHER" | "PARENT" | "STAFF";

type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  lastLogin: string;
  createdAt: string;
  avatarColor: string;
  twoFactor: boolean;
  department?: string;
};

const ACCOUNTS: Account[] = [
  {
    id: "ACC001",
    name: "Nguyễn Minh Anh",
    email: "admin@kidzgo.vn",
    phone: "0901 111 222",
    role: "ADMIN",
    status: "ACTIVE",
    lastLogin: "05/12/2024 08:00",
    createdAt: "15/08/2024",
    avatarColor: "from-pink-400 to-rose-500",
    twoFactor: true,
    department: "Administration"
  },
  {
    id: "ACC045",
    name: "Phạm Thu Hằng",
    email: "hang.teacher@kidzgo.vn",
    phone: "0903 456 789",
    role: "TEACHER",
    status: "ACTIVE",
    lastLogin: "04/12/2024 21:30",
    createdAt: "20/09/2024",
    avatarColor: "from-blue-400 to-cyan-500",
    twoFactor: true,
    department: "Academic"
  },
  {
    id: "ACC102",
    name: "Trần Văn Bình",
    email: "parent.binh@gmail.com",
    phone: "0987 654 321",
    role: "PARENT",
    status: "SUSPENDED",
    lastLogin: "29/11/2024 10:15",
    createdAt: "05/11/2024",
    avatarColor: "from-emerald-400 to-teal-500",
    twoFactor: false,
    department: "Parents"
  },
  {
    id: "ACC103",
    name: "Lê Thị Mai",
    email: "mai.teacher@kidzgo.vn",
    phone: "0902 333 444",
    role: "TEACHER",
    status: "ACTIVE",
    lastLogin: "05/12/2024 14:20",
    createdAt: "12/10/2024",
    avatarColor: "from-violet-400 to-purple-500",
    twoFactor: false,
    department: "Academic"
  },
  {
    id: "ACC104",
    name: "Hoàng Văn Tùng",
    email: "tung.staff@kidzgo.vn",
    phone: "0904 555 666",
    role: "STAFF",
    status: "ACTIVE",
    lastLogin: "04/12/2024 16:45",
    createdAt: "01/11/2024",
    avatarColor: "from-amber-400 to-orange-500",
    twoFactor: true,
    department: "Operations"
  },
  {
    id: "ACC105",
    name: "Nguyễn Thị Lan",
    email: "lan.parent@gmail.com",
    phone: "0988 777 888",
    role: "PARENT",
    status: "PENDING",
    lastLogin: "Chưa đăng nhập",
    createdAt: "30/11/2024",
    avatarColor: "from-indigo-400 to-blue-500",
    twoFactor: false,
    department: "Parents"
  },
  {
    id: "ACC106",
    name: "Trần Quang Huy",
    email: "huy.admin@kidzgo.vn",
    phone: "0905 999 000",
    role: "ADMIN",
    status: "ACTIVE",
    lastLogin: "05/12/2024 09:30",
    createdAt: "25/09/2024",
    avatarColor: "from-rose-400 to-pink-500",
    twoFactor: true,
    department: "Administration"
  },
  {
    id: "ACC107",
    name: "Phạm Quốc Việt",
    email: "viet.teacher@kidzgo.vn",
    phone: "0906 111 222",
    role: "TEACHER",
    status: "ACTIVE",
    lastLogin: "03/12/2024 18:15",
    createdAt: "15/10/2024",
    avatarColor: "from-emerald-400 to-teal-500",
    twoFactor: false,
    department: "Academic"
  },
];

const ROLE_INFO: Record<Role, {
  label: string;
  cls: string;
  bg: string;
  icon: React.ReactNode;
}> = {
  ADMIN: {
    label: "Quản trị",
    cls: "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border border-pink-200",
    bg: "from-pink-400 to-rose-500",
    icon: <ShieldCheck size={12} />
  },
  TEACHER: {
    label: "Giáo viên",
    cls: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200",
    bg: "from-blue-400 to-cyan-500",
    icon: <User size={12} />
  },
  PARENT: {
    label: "Phụ huynh",
    cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
    bg: "from-emerald-400 to-teal-500",
    icon: <Users size={12} />
  },
  STAFF: {
    label: "Nhân viên",
    cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
    bg: "from-amber-400 to-orange-500",
    icon: <User size={12} />
  },
};

const STATUS_INFO: Record<Account['status'], {
  label: string;
  cls: string;
  icon: React.ReactNode;
}> = {
  ACTIVE: {
    label: "Đang hoạt động",
    cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
    icon: <CheckCircle size={12} />
  },
  SUSPENDED: {
    label: "Tạm khóa",
    cls: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200",
    icon: <XCircle size={12} />
  },
  PENDING: {
    label: "Chờ kích hoạt",
    cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
    icon: <AlertCircle size={12} />
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

function RoleBadge({ role }: { role: Role }) {
  const { label, cls, icon } = ROLE_INFO[role];
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Account['status'] }) {
  const { label, cls, icon } = STATUS_INFO[status];
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function TwoFactorBadge({ enabled }: { enabled: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${enabled
      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200'
      : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200'
      }`}>
      {enabled ? <ShieldCheck size={10} /> : <XCircle size={10} />}
      <span>{enabled ? 'Bật 2FA' : 'Chưa bật'}</span>
    </div>
  );
}

export default function AccountsPage() {
  const [role, setRole] = useState<Role | "ALL">("ALL");
  const [status, setStatus] = useState<Account['status'] | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState<Account>>({ key: null, direction: "asc" });

  const toggleSort = (key: keyof Account) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
    setCurrentPage(1);
  };

  const SortHeader = ({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey: keyof Account;
    className?: string;
  }) => {
    const active = sort.key === sortKey;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className={`inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 ${className ?? ""}`}
      >
        <span>{label}</span>
        {active ? (
          sort.direction === "asc" ? (
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
      title: 'Tổng tài khoản',
      value: `${ACCOUNTS.length}`,
      icon: <Users size={20} />,
      color: 'from-pink-500 to-rose-500',
      subtitle: 'Toàn hệ thống'
    },
    {
      title: 'Đang hoạt động',
      value: `${ACCOUNTS.filter(a => a.status === 'ACTIVE').length}`,
      icon: <CheckCircle size={20} />,
      color: 'from-emerald-500 to-teal-500',
      subtitle: 'Truy cập thường xuyên'
    },
    {
      title: 'Bật xác thực 2 lớp',
      value: `${ACCOUNTS.filter(a => a.twoFactor).length}`,
      icon: <ShieldCheck size={20} />,
      color: 'from-blue-500 to-cyan-500',
      subtitle: 'Bảo mật cao'
    },
    {
      title: 'Tài khoản mới',
      value: `+${ACCOUNTS.filter(a => {
        const createdDate = new Date(a.createdAt.split('/').reverse().join('-'));
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 30;
      }).length}`,
      icon: <UserPlus size={20} />,
      color: 'from-amber-500 to-orange-500',
      subtitle: '30 ngày gần đây'
    }
  ];

  const list = useMemo(() => {
    let result = ACCOUNTS;

    if (role !== "ALL") {
      result = result.filter(acc => acc.role === role);
    }

    if (status !== "ALL") {
      result = result.filter(acc => acc.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(acc =>
        acc.name.toLowerCase().includes(searchLower) ||
        acc.email.toLowerCase().includes(searchLower) ||
        acc.phone.toLowerCase().includes(searchLower) ||
        acc.id.toLowerCase().includes(searchLower)
      );
    }

    if (sort.key) {
      result = quickSort([...result], buildComparator(sort.key, sort.direction));
    }

    return result;
  }, [role, status, search, sort.key, sort.direction]);

  // Pagination
  const totalPages = Math.ceil(list.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = list.slice(startIndex, endIndex);

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

  const activeCount = ACCOUNTS.filter(a => a.status === 'ACTIVE').length;
  const pendingCount = ACCOUNTS.filter(a => a.status === 'PENDING').length;
  const suspendedCount = ACCOUNTS.filter(a => a.status === 'SUSPENDED').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Users size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Quản lý Tài khoản
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Phân quyền truy cập, quản lý bảo mật và theo dõi hoạt động người dùng
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Key size={16} /> Đặt lại mật khẩu
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <UserPlus size={16} /> Tạo tài khoản mới
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
            {/* Role Filter */}
            <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1">
              {[
                { k: 'ALL', label: 'Tất cả', count: ACCOUNTS.length },
                { k: 'ADMIN', label: 'Quản trị', count: ACCOUNTS.filter(a => a.role === 'ADMIN').length },
                { k: 'TEACHER', label: 'Giáo viên', count: ACCOUNTS.filter(a => a.role === 'TEACHER').length },
                { k: 'PARENT', label: 'Phụ huynh', count: ACCOUNTS.filter(a => a.role === 'PARENT').length },
                { k: 'STAFF', label: 'Nhân viên', count: ACCOUNTS.filter(a => a.role === 'STAFF').length },
              ].map((item) => (
                <button
                  key={item.k}
                  onClick={() => setRole(item.k as typeof role)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${role === item.k
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50'
                    }`}
                >
                  {item.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${role === item.k ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="ALL">Tất cả trạng thái ({ACCOUNTS.length})</option>
                <option value="ACTIVE">Đang hoạt động ({activeCount})</option>
                <option value="PENDING">Chờ kích hoạt ({pendingCount})</option>
                <option value="SUSPENDED">Tạm khóa ({suspendedCount})</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tên, email, số điện thoại..."
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
            <h2 className="text-lg font-semibold text-gray-900">Danh sách tài khoản</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{list.length} tài khoản</span>
              {selectedRows.length > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-pink-600 font-medium">
                    Đã chọn {selectedRows.length} tài khoản
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
                    <SortHeader label="Người dùng" sortKey="name" />
                  </div>
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Thông tin liên hệ" sortKey="email" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Vai trò" sortKey="role" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Bảo mật" sortKey="twoFactor" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Hoạt động" sortKey="lastLogin" />
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
                currentRows.map((acc) => (
                  <tr
                    key={acc.id}
                    className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(acc.id)}
                          onChange={() => toggleSelectRow(acc.id)}
                          className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200"
                        />
                        <div className="flex items-center gap-3">
                          <Avatar name={acc.name} color={acc.avatarColor} />
                          <div>
                            <div className="font-medium text-gray-900">{acc.name}</div>
                            <div className="text-xs text-gray-500">{acc.id}</div>
                            {acc.department && (
                              <div className="text-xs text-gray-400">{acc.department}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail size={12} className="text-gray-400" />
                          <span className="font-medium">{acc.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone size={12} className="text-gray-400" />
                          <span>{acc.phone}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={10} />
                          Tạo ngày: {acc.createdAt}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <RoleBadge role={acc.role} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <TwoFactorBadge enabled={acc.twoFactor} />
                        <div className="text-xs text-gray-500">
                          {acc.lastLogin === "Chưa đăng nhập" ? "Chưa đăng nhập" : `Đăng nhập: ${acc.lastLogin}`}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${acc.lastLogin === "Chưa đăng nhập"
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-blue-50 text-blue-600'
                          }`}>
                          {acc.lastLogin === "Chưa đăng nhập" ? (
                            <>
                              <AlertCircle size={10} />
                              Chưa kích hoạt
                            </>
                          ) : (
                            <>
                              <CheckCircle size={10} />
                              Đã đăng nhập
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {acc.lastLogin === "Chưa đăng nhập"
                            ? "Đang chờ kích hoạt"
                            : "Hoạt động gần nhất"
                          }
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={acc.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1  transition-opacity duration-200">
                        <button
                          className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors text-gray-400 hover:text-amber-600 cursor-pointer"
                          title="Đặt lại mật khẩu"
                        >
                          <Key size={14} />
                        </button>
                        {acc.status === 'ACTIVE' ? (
                          <button
                            className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors text-gray-400 hover:text-rose-600 cursor-pointer"
                            title="Tạm khóa"
                          >
                            <Lock size={14} />
                          </button>
                        ) : (
                          <button
                            className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-gray-400 hover:text-emerald-600 cursor-pointer"
                            title="Kích hoạt"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
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
                    <div className="text-gray-600 font-medium">Không tìm thấy tài khoản</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo tài khoản mới</div>
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
                {' '}trong tổng số <span className="font-semibold text-gray-900">{list.length}</span> tài khoản
                {selectedRows.length > 0 && (
                  <span className="ml-3 text-pink-600 font-medium">
                    Đã chọn {selectedRows.length} tài khoản
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

      {/* Security Configuration Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Security Settings */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cấu hình Bảo mật</h3>
                <p className="text-sm text-gray-600">Thiết lập xác thực và quyền truy cập nâng cao</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white">
                <div>
                  <div className="font-medium text-gray-900">Xác thực hai lớp (2FA)</div>
                  <div className="text-sm text-gray-600">Yêu cầu OTP cho thao tác quan trọng</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white">
                <div>
                  <div className="font-medium text-gray-900">Tự động khóa tài khoản</div>
                  <div className="text-sm text-gray-600">Sau 30 ngày không đăng nhập</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white">
                <div>
                  <div className="font-medium text-gray-900">Cảnh báo đăng nhập lạ</div>
                  <div className="text-sm text-gray-600">Thông báo qua email khi có đăng nhập mới</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>
            </div>

            <button className="mt-6 w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all">
              Lưu cấu hình bảo mật
            </button>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="space-y-2">
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <Mail size={16} />
                Gửi email kích hoạt
              </button>
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <Key size={16} />
                Đặt lại mật khẩu hàng loạt
              </button>
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <Bell size={16} />
                Gửi thông báo bảo mật
              </button>
            </div>
          </div>

          {/* Role Distribution */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <h4 className="font-semibold text-gray-900 mb-3">Phân bố vai trò</h4>
            <div className="space-y-3">
              {(['ADMIN', 'TEACHER', 'PARENT', 'STAFF'] as Role[]).map(role => {
                const count = ACCOUNTS.filter(a => a.role === role).length;
                const percentage = Math.round((count / ACCOUNTS.length) * 100);
                const info = ROLE_INFO[role];

                return (
                  <div key={role} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{info.label}</span>
                      <span className="font-semibold text-gray-900">{count} người</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${info.bg}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}