"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  LifeBuoy,
  PlusCircle,
  Search,
  ShieldCheck,
  Tag,
  User,
  ArrowUpDown,
  Eye,
} from "lucide-react";

type TicketStatus = "Mới" | "Đang xử lý" | "Đã phản hồi" | "Đã đóng";

type TicketCategory = "Operations" | "Accountant" | "Teacher" | "Other";

type Ticket = {
  id: string;
  title: string;
  requester: string;
  category: TicketCategory;
  status: TicketStatus;
  updated: string;
};

const TICKETS: Ticket[] = [
  {
    id: "TK-1001",
    title: "Đổi lịch học tạm thời",
    requester: "PH: Trần Thị B",
    category: "Operations",
    status: "Mới",
    updated: "10/10 09:20",
  },
  {
    id: "TK-1002",
    title: "Thắc mắc hóa đơn tháng 10",
    requester: "PH: Nguyễn Văn A",
    category: "Accountant",
    status: "Đang xử lý",
    updated: "10/10 08:40",
  },
  {
    id: "TK-1003",
    title: "Xin nhận xét thêm bài tập",
    requester: "HS: Lê Gia Hân",
    category: "Teacher",
    status: "Đã phản hồi",
    updated: "09/10 17:05",
  },
];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div
        className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${color}`}
      ></div>
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

function StatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, { cls: string; icon: any }> = {
    "Mới": {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: AlertCircle,
    },
    "Đang xử lý": {
      cls: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200",
      icon: Clock,
    },
    "Đã phản hồi": {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "Đã đóng": {
      cls: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200",
      icon: ShieldCheck,
    },
  };

  const cfg = map[status];
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} />
      <span>{status}</span>
    </span>
  );
}

function CategoryBadge({ category }: { category: TicketCategory }) {
  const map: Record<TicketCategory, { label: string; cls: string }> = {
    Operations: {
      label: "Operations",
      cls: "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border border-pink-200",
    },
    Accountant: {
      label: "Accountant",
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
    },
    Teacher: {
      label: "Teacher",
      cls: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200",
    },
    Other: {
      label: "Other",
      cls: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200",
    },
  };

  const cfg = map[category];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
      <Tag size={12} />
      <span>{cfg.label}</span>
    </span>
  );
}

export default function Page() {
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [categoryFilter, setCategoryFilter] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<
    "title" | "requester" | "category" | "status" | "updated" | "id" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const stats = useMemo(() => {
    const total = TICKETS.length;
    const fresh = TICKETS.filter((t) => t.status === "Mới").length;
    const inProgress = TICKETS.filter((t) => t.status === "Đang xử lý").length;
    const done = TICKETS.filter((t) => t.status === "Đã phản hồi").length;
    return { total, fresh, inProgress, done };
  }, []);

  const statusOptions: (TicketStatus | "Tất cả")[] = [
    "Tất cả",
    "Mới",
    "Đang xử lý",
    "Đã phản hồi",
    "Đã đóng",
  ];

  const categoryOptions: (TicketCategory | "Tất cả")[] = [
    "Tất cả",
    "Operations",
    "Accountant",
    "Teacher",
    "Other",
  ];

  const filtered = useMemo(() => {
    return TICKETS.filter((t) => {
      const matchesStatus = statusFilter === "Tất cả" || t.status === statusFilter;
      const matchesCategory = categoryFilter === "Tất cả" || t.category === categoryFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.requester.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q);
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [statusFilter, categoryFilter, searchQuery]);

  const sortedTickets = useMemo(() => {
    const copy = [...filtered];
    if (!sortKey) return copy;

    const getVal = (t: Ticket) => {
      switch (sortKey) {
        case "title":
          return t.title;
        case "requester":
          return t.requester;
        case "category":
          return t.category;
        case "status":
          return t.status;
        case "updated":
          return t.updated;
        case "id":
        default:
          return t.id;
      }
    };

    copy.sort((a, b) => {
      const res = String(getVal(a)).localeCompare(String(getVal(b)), "vi", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? res : -res;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const visibleIds = useMemo(() => sortedTickets.map((t) => t.id), [sortedTickets]);
  const selectedVisibleCount = useMemo(
    () => visibleIds.filter((id) => selectedIds[id]).length,
    [visibleIds, selectedIds]
  );
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (allVisibleSelected) {
        visibleIds.forEach((id) => delete next[id]);
        return next;
      }
      visibleIds.forEach((id) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <LifeBuoy size={28} className="text-white" />
          </div>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Ticket hỗ trợ
          </h1>
            <p className="text-sm text-gray-600 mt-1">
            Quản lý phản hồi phụ huynh/học viên, phân tuyến cho giáo viên và staff
          </p>
        </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Download size={16} /> Xuất DS
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <PlusCircle size={16} /> Tạo ticket
        </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng ticket"
          value={String(stats.total)}
          subtitle="Trong danh sách"
          icon={LifeBuoy}
          color="from-pink-500 to-rose-500"
        />
        <StatCard
          title="Ticket mới"
          value={String(stats.fresh)}
          subtitle="Cần tiếp nhận"
          icon={AlertCircle}
          color="from-amber-500 to-orange-500"
        />
        <StatCard
          title="Đang xử lý"
          value={String(stats.inProgress)}
          subtitle="Đang theo dõi"
          icon={Clock}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Đã phản hồi"
          value={String(stats.done)}
          subtitle="Hoàn tất phản hồi"
          icon={CheckCircle2}
          color="from-emerald-500 to-teal-500"
        />
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
      </div>

          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã, tiêu đề, người gửi..."
              className="h-10 w-72 rounded-xl border border-pink-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
            </div>
          </div>

      {/* Table */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách ticket</h2>
            <div className="text-sm text-gray-600 font-medium">{sortedTickets.length} ticket</div>
          </div>
      </div>

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
                    onClick={() => toggleSort("title")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Ticket
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "title" ? "text-pink-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("requester")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Người gửi
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "requester" ? "text-pink-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("category")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Nhóm xử lý
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "category" ? "text-pink-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Trạng thái
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "status" ? "text-pink-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("updated")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                  >
                    Cập nhật
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "updated" ? "text-pink-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {sortedTickets.length > 0 ? (
                sortedTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-4 align-top">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[t.id]}
                        onChange={() => toggleSelectOne(t.id)}
                        className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200 cursor-pointer"
                        aria-label={`Chọn ${t.title}`}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">{t.title}</div>
                        <div className="text-xs text-gray-500 font-mono">{t.id}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white">
                          <User size={14} />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{t.requester}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <CategoryBadge category={t.category} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-700">{t.updated}</div>
                </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="p-1.5 rounded-lg border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                          title="Xem"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                          title="Phân tuyến"
                        >
                          <ShieldCheck size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                      <Search size={24} className="text-pink-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không có ticket phù hợp</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa</div>
                </td>
              </tr>
              )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
