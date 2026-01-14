"use client";

import {
  Users,
  UserPlus,
  Filter,
  Search,
  ArrowUpDown,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Target,
  UserCheck,
  CalendarCheck,
  ArrowRight,
  MoreVertical,
  Download,
  Sparkles,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  owner: string;
  status: "Mới" | "Đang tư vấn" | "Đã test" | "Đã ghi danh" | "Đã hủy";
  next: string;
  placement: string;
  createdAt?: string;
};

const LEADS: Lead[] = [
  {
    id: "L-001",
    name: "Phạm Gia Huy",
    phone: "0903 111 222",
    email: "huy.pham@example.com",
    source: "Web form",
    owner: "NV. Lan",
    status: "Mới",
    next: "Hẹn gọi 10/10 14:00",
    placement: "Chưa đặt lịch",
    createdAt: "09/10/2024",
  },
  {
    id: "L-002",
    name: "Ngô Khánh An",
    phone: "0907 333 444",
    email: "an.ngo@example.com",
    source: "Zalo OA",
    owner: "NV. Hoa",
    status: "Đang tư vấn",
    next: "Demo buổi 12/10",
    placement: "11/10 18:00",
    createdAt: "08/10/2024",
  },
  {
    id: "L-003",
    name: "Trần Minh Tuấn",
    phone: "0911 555 666",
    email: "tuan.tran@example.com",
    source: "Facebook",
    owner: "NV. Lan",
    status: "Đã test",
    next: "Chờ kết quả test",
    placement: "15/10 10:00",
    createdAt: "05/10/2024",
  },
  {
    id: "L-004",
    name: "Lê Thị Mai",
    phone: "0988 777 888",
    email: "mai.le@example.com",
    source: "Web form",
    owner: "NV. Hoa",
    status: "Đã ghi danh",
    next: "Hoàn tất thủ tục",
    placement: "20/10 14:00",
    createdAt: "01/10/2024",
  },
];

const funnel = [
  { title: "Lead mới", value: "24", icon: Sparkles, color: "from-amber-500 to-orange-500", subtitle: "Chưa xử lý" },
  { title: "Đang tư vấn", value: "13", icon: Phone, color: "from-blue-500 to-cyan-500", subtitle: "Đang liên hệ" },
  { title: "Đã test", value: "8", icon: FileText, color: "from-purple-500 to-violet-500", subtitle: "Đã kiểm tra" },
  { title: "Đã ghi danh", value: "6", icon: CheckCircle2, color: "from-emerald-500 to-teal-500", subtitle: "Thành công" },
];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${color}`}></div>
      <div className="relative flex items-center justify-between gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}>
          <Icon size={20} />
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
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [selectedSource, setSelectedSource] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<
    "id" | "name" | "source" | "owner" | "status" | "placement" | "next" | "createdAt" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const statusOptions = ["Tất cả", "Mới", "Đang tư vấn", "Đã test", "Đã ghi danh", "Đã hủy"];
  const sourceOptions = ["Tất cả", "Web form", "Zalo OA", "Facebook", "Referral"];

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LEADS.filter((lead) => {
      const matchesStatus = selectedStatus === "Tất cả" || lead.status === selectedStatus;
      const matchesSource = selectedSource === "Tất cả" || lead.source === selectedSource;
      const matchesSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.phone.includes(searchQuery) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.id.toLowerCase().includes(q);

      return matchesStatus && matchesSource && matchesSearch;
    });
  }, [selectedStatus, selectedSource, searchQuery]);

  const filteredAndSortedLeads = useMemo(() => {
    const copy = [...filteredLeads];
    if (!sortKey) return copy;

    const getValue = (l: Lead) => {
      switch (sortKey) {
        case "id":
          return l.id;
        case "name":
          return l.name;
        case "source":
          return l.source;
        case "owner":
          return l.owner;
        case "status":
          return l.status;
        case "placement":
          return l.placement;
        case "next":
          return l.next;
        case "createdAt":
          return l.createdAt ?? "";
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
  }, [filteredLeads, sortKey, sortDir]);

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

  const allVisibleIds = useMemo(() => filteredAndSortedLeads.map((l) => l.id), [filteredAndSortedLeads]);
  const selectedVisibleCount = useMemo(
    () => allVisibleIds.filter((id) => selectedIds[id]).length,
    [allVisibleIds, selectedIds]
  );
  const allVisibleSelected = allVisibleIds.length > 0 && selectedVisibleCount === allVisibleIds.length;

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

  const getStatusBadge = (status: Lead['status']) => {
    const statusMap = {
      "Mới": { bg: "from-amber-50 to-orange-50", text: "text-amber-700", border: "border-amber-200", icon: Sparkles },
      "Đang tư vấn": { bg: "from-blue-50 to-cyan-50", text: "text-blue-700", border: "border-blue-200", icon: Phone },
      "Đã test": { bg: "from-purple-50 to-violet-50", text: "text-purple-700", border: "border-purple-200", icon: FileText },
      "Đã ghi danh": { bg: "from-emerald-50 to-teal-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
      "Đã hủy": { bg: "from-rose-50 to-pink-50", text: "text-rose-700", border: "border-rose-200", icon: XCircle },
    };
    const config = statusMap[status] || statusMap["Mới"];
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-gradient-to-r ${config.bg} ${config.text} border ${config.border}`}>
        <Icon size={12} />
        <span>{status}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Target size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Lead & Placement Test
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Nhận lead, phân công tư vấn, đặt lịch test và chuyển đổi ghi danh
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Download size={16} /> Xuất DS
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <UserPlus size={16} /> Nhập lead mới
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div
        className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {funnel.map((item, idx) => (
          <StatCard key={`stat-${idx}`} {...item} />
        ))}
      </div>

      {/* Filter Bar */}
      <div
        className={`rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 transition-all duration-700 delay-150 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tên, SĐT, email, mã lead..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-100 cursor-pointer"
              >
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1">
            {statusOptions.map((status) => {
              const count =
                status === "Tất cả"
                  ? LEADS.length
                  : LEADS.filter((l) => l.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    selectedStatus === status
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                      : "text-gray-700 hover:bg-pink-50"
                  }`}
                >
                  {status}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedStatus === status ? "bg-white/20" : "bg-gray-100"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Nếu cần thêm chip/filter khác, có thể đặt bên phải */}
        </div>
      </div>

      {/* Main Table */}
      <div
        className={`rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Table Header */}
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách Lead</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{filteredAndSortedLeads.length} lead</span>
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
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Mã & Thông tin
                    <ArrowUpDown size={14} className={sortKey === "name" ? "text-pink-600" : "text-gray-400"} />
                  </button>
                </th>

                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thông tin liên hệ</span>
                </th>

                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("source")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Nguồn
                    <ArrowUpDown size={14} className={sortKey === "source" ? "text-pink-600" : "text-gray-400"} />
                  </button>
                </th>

                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("owner")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Phụ trách
                    <ArrowUpDown size={14} className={sortKey === "owner" ? "text-pink-600" : "text-gray-400"} />
                  </button>
                </th>

                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Trạng thái
                    <ArrowUpDown size={14} className={sortKey === "status" ? "text-pink-600" : "text-gray-400"} />
                  </button>
                </th>

                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("placement")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Placement Test
                    <ArrowUpDown size={14} className={sortKey === "placement" ? "text-pink-600" : "text-gray-400"} />
                  </button>
                </th>

                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("next")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Tiếp theo
                    <ArrowUpDown size={14} className={sortKey === "next" ? "text-pink-600" : "text-gray-400"} />
                  </button>
                </th>

                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {filteredAndSortedLeads.length > 0 ? (
                filteredAndSortedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-4 align-top">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[lead.id]}
                        onChange={() => toggleSelectOne(lead.id)}
                        className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200 cursor-pointer"
                        aria-label={`Chọn ${lead.name}`}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1 min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold text-xs">
                            {lead.name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{lead.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{lead.id}</div>
                          </div>
                        </div>
                        {lead.createdAt && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />
                            Tạo: {lead.createdAt}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 align-top min-w-[220px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone size={14} className="text-gray-400" />
                          <span className="font-medium">{lead.phone}</span>
                        </div>
                        {lead.email ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail size={14} className="text-gray-400" />
                            <span className="truncate max-w-[260px]">{lead.email}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">Không có email</div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold">
                          {lead.owner.split(" ").pop()?.[0] || "N"}
                        </div>
                        <span className="font-medium text-gray-900">{lead.owner}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="py-4 px-6">
                      {lead.placement === "Chưa đặt lịch" ? (
                        <span className="text-sm text-gray-500">{lead.placement}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CalendarCheck size={14} className="text-emerald-500" />
                          <span className="text-sm font-medium text-gray-900">{lead.placement}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock size={14} className="text-gray-400" />
                        <span>{lead.next}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 transition-opacity duration-200">
                        <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                          title="Phân công"
                        >
                          <UserCheck size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors text-gray-400 hover:text-purple-600 cursor-pointer"
                          title="Đặt lịch test"
                        >
                          <CalendarCheck size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-gray-400 hover:text-emerald-600 cursor-pointer"
                          title="Chuyển ghi danh"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Xem thêm"
                        >
                          <MoreVertical size={14} className="text-gray-400" />
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
                    <div className="text-gray-600 font-medium">Không tìm thấy lead</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo lead mới</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredAndSortedLeads.length > 0 && (
          <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">1-{filteredAndSortedLeads.length}</span>
                {" "}trong tổng số <span className="font-semibold text-gray-900">{filteredAndSortedLeads.length}</span> lead
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
