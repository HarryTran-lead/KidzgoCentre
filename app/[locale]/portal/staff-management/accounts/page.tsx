"use client";

import { 
  Users, 
  UserPlus, 
  Filter, 
  Search, 
  ArrowUpDown,
  X,
  Shield, 
  Lock, 
  Unlock,
  Key,
  Building,
  Phone,
  UserCog,
  Eye,
  Download,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";

type Account = {
  id: string;
  name: string;
  role: string;
  phone: string;
  branch: string;
  status: "Active" | "Locked";
  email?: string;
  lastLogin?: string;
  avatarColor: string;
};

const ACCS: Account[] = [
  {
    id: "U1001",
    name: "Nguyễn Văn A",
    role: "STUDENT",
    phone: "0901 234 567",
    branch: "Quận 1",
    status: "Active",
    email: "vana@example.com",
    lastLogin: "Hôm nay, 09:30",
    avatarColor: "bg-gradient-to-r from-blue-500 to-sky-500",
  },
  {
    id: "U1002",
    name: "Trần Thị B",
    role: "PARENT",
    phone: "0909 888 111",
    branch: "Quận 1",
    status: "Active",
    email: "thib@example.com",
    lastLogin: "Hôm qua, 14:20",
    avatarColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
  },
  {
    id: "U2001",
    name: "Lê Minh",
    role: "TEACHER",
    phone: "0912 555 777",
    branch: "Quận 7",
    status: "Locked",
    email: "minh@example.com",
    lastLogin: "3 ngày trước",
    avatarColor: "bg-gradient-to-r from-purple-500 to-indigo-500",
  },
  {
    id: "U3001",
    name: "Phạm Văn C",
    role: "STAFF",
    phone: "0933 444 222",
    branch: "Quận 1",
    status: "Active",
    email: "vanc@example.com",
    lastLogin: "Hôm nay, 08:15",
    avatarColor: "bg-gradient-to-r from-pink-500 to-rose-500",
  },
  {
    id: "U4001",
    name: "Hoàng Thị D",
    role: "ACCOUNTANT",
    phone: "0988 777 333",
    branch: "Quận 7",
    status: "Active",
    email: "thid@example.com",
    lastLogin: "Hôm nay, 10:45",
    avatarColor: "bg-gradient-to-r from-amber-500 to-orange-500",
  },
  {
    id: "U5001",
    name: "Vũ Văn E",
    role: "MANAGER",
    phone: "0977 666 444",
    branch: "Quận 1",
    status: "Active",
    email: "vane@example.com",
    lastLogin: "Hôm nay, 07:30",
    avatarColor: "bg-gradient-to-r from-violet-500 to-purple-500",
  },
];

const ROLES = [
  { value: "STUDENT", label: "Học viên", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "PARENT", label: "Phụ huynh", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "TEACHER", label: "Giáo viên", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "STAFF", label: "Nhân viên", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { value: "ACCOUNTANT", label: "Kế toán", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "MANAGER", label: "Quản lý", color: "bg-violet-100 text-violet-700 border-violet-200" },
];

const BRANCHES = ["Tất cả", "Quận 1", "Quận 7", "Quận 3", "Quận Bình Thạnh"];

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

export default function Page() {
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("Tất cả");
  const [selectedBranch, setSelectedBranch] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<
    "name" | "role" | "branch" | "status" | "lastLogin" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ACCS.filter((account) => {
      const matchesRole = selectedRole === "Tất cả" || account.role === selectedRole;
      const matchesBranch = selectedBranch === "Tất cả" || account.branch === selectedBranch;
      const matchesSearch =
        !q ||
        account.name.toLowerCase().includes(q) ||
        account.email?.toLowerCase().includes(q) ||
        account.phone.includes(searchQuery);

      return matchesRole && matchesBranch && matchesSearch;
    });
  }, [selectedRole, selectedBranch, searchQuery]);

  const filteredAndSortedAccounts = useMemo(() => {
    const copy = [...filteredAccounts];
    if (!sortKey) return copy;

    const getValue = (a: Account) => {
      switch (sortKey) {
        case "name":
          return a.name;
        case "role":
          return a.role;
        case "branch":
          return a.branch;
        case "status":
          return a.status;
        case "lastLogin":
          return a.lastLogin ?? "";
        default:
          return "";
      }
    };

    copy.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      const res = String(av).localeCompare(String(bv), "vi", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? res : -res;
    });

    return copy;
  }, [filteredAccounts, sortKey, sortDir]);

  const toggleSort = (key: NonNullable<typeof sortKey>) => {
    setSortKey((prev) => {
      if (prev !== key) {
        setSortDir("asc");
        return key;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
  };

  const allVisibleIds = useMemo(
    () => filteredAndSortedAccounts.map((a) => a.id),
    [filteredAndSortedAccounts]
  );
  const selectedVisibleCount = useMemo(
    () => allVisibleIds.filter((id) => selectedIds[id]).length,
    [allVisibleIds, selectedIds]
  );
  const allVisibleSelected =
    allVisibleIds.length > 0 && selectedVisibleCount === allVisibleIds.length;

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (allVisibleSelected) {
        allVisibleIds.forEach((id) => {
          delete next[id];
        });
        return next;
      }
      allVisibleIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const stats = {
    total: ACCS.length,
    active: ACCS.filter(a => a.status === "Active").length,
    locked: ACCS.filter(a => a.status === "Locked").length,
    teachers: ACCS.filter(a => a.role === "TEACHER").length,
    students: ACCS.filter(a => a.role === "STUDENT").length,
  };

  const statsList = [
    {
      title: 'Tổng tài khoản',
      value: `${stats.total}`,
      icon: <Users size={20} />,
      color: 'from-pink-500 to-rose-500',
      subtitle: 'Toàn hệ thống'
    },
    {
      title: 'Đang hoạt động',
      value: `${stats.active}`,
      icon: <CheckCircle2 size={20} />,
      color: 'from-emerald-500 to-teal-500',
      subtitle: 'Truy cập thường xuyên'
    },
    {
      title: 'Đã khoá',
      value: `${stats.locked}`,
      icon: <XCircle size={20} />,
      color: 'from-amber-500 to-orange-500',
      subtitle: 'Tạm thời vô hiệu'
    },
    {
      title: 'Giáo viên',
      value: `${stats.teachers}`,
      icon: <UserCog size={20} />,
      color: 'from-purple-500 to-violet-500',
      subtitle: 'Tài khoản giáo viên'
    },
    {
      title: 'Học viên',
      value: `${stats.students}`,
      icon: <Users size={20} />,
      color: 'from-blue-500 to-cyan-500',
      subtitle: 'Tài khoản học viên'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Shield size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Quản lý tài khoản & phân quyền
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Thêm/sửa vai trò, gán chi nhánh và reset mật khẩu/PIN
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Download size={16} /> Xuất DS
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <UserPlus size={16} /> Tạo tài khoản mới
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {statsList.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Filter Bar */}
      <div className={`rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 transition-all duration-700 delay-150 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Role Filter */}
            <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1">
              {[
                { k: 'Tất cả', label: 'Tất cả', count: ACCS.length },
                ...ROLES.map(role => ({
                  k: role.value,
                  label: role.label,
                  count: ACCS.filter(a => a.role === role.value).length
                }))
              ].map((item) => (
                <button
                  key={item.k}
                  onClick={() => setSelectedRole(item.k)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${selectedRole === item.k
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50'
                    }`}
                >
                  {item.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedRole === item.k ? 'bg-white/20' : 'bg-gray-100'
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
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {BRANCHES.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="h-10 w-full sm:w-64 rounded-xl border border-pink-200 bg-white pl-9 pr-9 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
              {searchQuery.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-pink-50 text-gray-400 hover:text-pink-600 transition-colors"
                  title="Xóa"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              {filteredAndSortedAccounts.length} kết quả
              {selectedVisibleCount > 0 ? ` • Đã chọn ${selectedVisibleCount}` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className={`rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {/* Table Header */}
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách tài khoản</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{filteredAndSortedAccounts.length} tài khoản</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
              <tr>
                <th className="py-3 px-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200 cursor-pointer"
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    onClick={() => toggleSort("name")}
                    type="button"
                  >
                    Người dùng{" "}
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "name" ? "text-pink-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    onClick={() => toggleSort("role")}
                    type="button"
                  >
                    Vai trò{" "}
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "role" ? "text-pink-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    onClick={() => toggleSort("branch")}
                    type="button"
                  >
                    Chi nhánh{" "}
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "branch" ? "text-pink-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thông tin liên hệ</span>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    onClick={() => toggleSort("status")}
                    type="button"
                  >
                    Trạng thái{" "}
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "status" ? "text-pink-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {filteredAndSortedAccounts.length > 0 ? (
                filteredAndSortedAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200 "
                  >
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[account.id]}
                        onChange={() => toggleSelectOne(account.id)}
                        className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200 cursor-pointer"
                        aria-label={`Chọn ${account.name}`}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg ${account.avatarColor} flex items-center justify-center text-white font-semibold text-xs`}>
                          {account.name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div className=" text-gray-900">{account.name}</div>
                          <div className="text-xs text-gray-500">{account.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        account.role === "STUDENT" ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200" :
                        account.role === "PARENT" ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200" :
                        account.role === "TEACHER" ? "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200" :
                        account.role === "STAFF" ? "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border border-pink-200" :
                        account.role === "ACCOUNTANT" ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200" :
                        "bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border border-violet-200"
                      }`}>
                        {account.role === "STUDENT" && <Users size={12} />}
                        {account.role === "PARENT" && <Users size={12} />}
                        {account.role === "TEACHER" && <UserCog size={12} />}
                        {account.role === "STAFF" && <Users size={12} />}
                        {account.role === "ACCOUNTANT" && <UserCog size={12} />}
                        {account.role === "MANAGER" && <Shield size={12} />}
                        <span>{ROLES.find(r => r.value === account.role)?.label || account.role}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-gray-400" />
                        <span className=" text-gray-900">{account.branch}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {account.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-gray-400">@</span>
                            <span className="">{account.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone size={12} className="text-gray-400" />
                          <span>{account.phone}</span>
                        </div>
                        {account.lastLogin && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span>Đăng nhập: {account.lastLogin}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {account.status === "Active" ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>Đang hoạt động</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200">
                          <XCircle size={12} />
                          <span>Tạm khóa</span>
                        </div>
                      )}
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
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <UserCog size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors text-gray-400 hover:text-amber-600 cursor-pointer"
                          title="Đặt lại mật khẩu"
                        >
                          <Key size={14} />
                        </button>
                        {account.status === 'Active' ? (
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
                            <Unlock size={14} />
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
        {filteredAndSortedAccounts.length > 0 && (
          <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">1-{filteredAndSortedAccounts.length}</span>
                {" "}trong tổng số <span className="font-semibold text-gray-900">{filteredAndSortedAccounts.length}</span> tài khoản
              </div>
            </div>
          </div>
        )}
      </div>  
    </div>
  );
}