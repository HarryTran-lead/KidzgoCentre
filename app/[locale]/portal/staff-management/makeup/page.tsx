"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Phone,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  Users,
  XCircle,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";

type LeaveRequestStatus = "Auto-approve" | "Chờ duyệt" | "Từ chối";

type LeaveRequest = {
  id: string;
  student: string;
  course: string;
  type: string;
  requestTime: string;
  sessionTime: string;
  status: LeaveRequestStatus;
  credit: number;
  note: string;
};

type MakeupStatus = "Chờ xác nhận" | "Đã xác nhận" | "Đã hủy";

type MakeupSession = {
  id: string;
  student: string;
  fromClass: string;
  targetClass: string;
  date: string;
  time: string;
  status: MakeupStatus;
};

const REQUESTS: LeaveRequest[] = [
  {
    id: "LR-1001",
    student: "Nguyễn Văn A",
    course: "IELTS A1",
    type: "Nghỉ 1 ngày",
    requestTime: "10/10 09:00",
    sessionTime: "11/10 08:00",
    status: "Auto-approve",
    credit: 1,
    note: "Bận thi",
  },
  {
    id: "LR-1002",
    student: "Trần Thị B",
    course: "TOEIC",
    type: "Nghỉ dài ngày",
    requestTime: "08/10 18:30",
    sessionTime: "09/10 18:00",
    status: "Chờ duyệt",
    credit: 0,
    note: "Ốm",
  },
];

const MAKEUP_SESSIONS: MakeupSession[] = [
  {
    id: "MU-01",
    student: "Nguyễn Văn A",
    fromClass: "IELTS A1",
    targetClass: "IELTS A1 - lớp bù T7",
    date: "14/10",
    time: "18:00-19:30",
    status: "Chờ xác nhận",
  },
  {
    id: "MU-02",
    student: "Lê Gia Hân",
    fromClass: "Cambridge Starters",
    targetClass: "Starters B",
    date: "12/10",
    time: "15:30-17:00",
    status: "Đã xác nhận",
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

function StatusBadge({ status }: { status: LeaveRequestStatus | MakeupStatus }) {
  const map: Record<string, { cls: string; icon: any }> = {
    "Auto-approve": {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "Chờ duyệt": {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: Clock,
    },
    "Từ chối": {
      cls: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200",
      icon: XCircle,
    },
    "Chờ xác nhận": {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: Clock,
    },
    "Đã xác nhận": {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "Đã hủy": {
      cls: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200",
      icon: XCircle,
    },
  };

  const cfg = map[status] || map["Chờ duyệt"];
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} />
      <span>{status}</span>
    </span>
  );
}

export default function Page() {
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"requests" | "sessions">("requests");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sortKeyRequests, setSortKeyRequests] = useState<
    "student" | "course" | "requestTime" | "sessionTime" | "status" | "credit" | "id" | null
  >(null);
  const [sortDirRequests, setSortDirRequests] = useState<"asc" | "desc">("asc");
  const [sortKeySessions, setSortKeySessions] = useState<
    "student" | "fromClass" | "targetClass" | "date" | "time" | "status" | "id" | null
  >(null);
  const [sortDirSessions, setSortDirSessions] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const requestStats = useMemo(() => {
    const total = REQUESTS.length;
    const autoApproved = REQUESTS.filter((r) => r.status === "Auto-approve").length;
    const pending = REQUESTS.filter((r) => r.status === "Chờ duyệt").length;
    const credits = REQUESTS.reduce((sum, r) => sum + r.credit, 0);
    return { total, autoApproved, pending, credits };
  }, []);

  const sessionStats = useMemo(() => {
    const total = MAKEUP_SESSIONS.length;
    const confirmed = MAKEUP_SESSIONS.filter((s) => s.status === "Đã xác nhận").length;
    const pending = MAKEUP_SESSIONS.filter((s) => s.status === "Chờ xác nhận").length;
    return { total, confirmed, pending };
  }, []);

  const filteredRequests = useMemo(() => {
    return REQUESTS.filter((r) => {
      const matchesStatus = statusFilter === "Tất cả" || r.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.student.toLowerCase().includes(q) ||
        r.course.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, searchQuery]);

  const sortedRequests = useMemo(() => {
    const copy = [...filteredRequests];
    if (!sortKeyRequests) return copy;

    const getValue = (r: LeaveRequest) => {
      switch (sortKeyRequests) {
        case "student":
          return r.student;
        case "course":
          return r.course;
        case "requestTime":
          return r.requestTime;
        case "sessionTime":
          return r.sessionTime;
        case "status":
          return r.status;
        case "credit":
          return r.credit.toString();
        case "id":
        default:
          return r.id;
      }
    };

    copy.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      const res = String(av).localeCompare(String(bv), "vi", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDirRequests === "asc" ? res : -res;
    });

    return copy;
  }, [filteredRequests, sortKeyRequests, sortDirRequests]);

  const filteredSessions = useMemo(() => {
    return MAKEUP_SESSIONS.filter((s) => {
      const matchesStatus = statusFilter === "Tất cả" || s.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.student.toLowerCase().includes(q) ||
        s.fromClass.toLowerCase().includes(q) ||
        s.targetClass.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, searchQuery]);

  const sortedSessions = useMemo(() => {
    const copy = [...filteredSessions];
    if (!sortKeySessions) return copy;

    const getValue = (s: MakeupSession) => {
      switch (sortKeySessions) {
        case "student":
          return s.student;
        case "fromClass":
          return s.fromClass;
        case "targetClass":
          return s.targetClass;
        case "date":
          return s.date;
        case "time":
          return s.time;
        case "status":
          return s.status;
        case "id":
        default:
          return s.id;
      }
    };

    copy.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      const res = String(av).localeCompare(String(bv), "vi", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDirSessions === "asc" ? res : -res;
    });

    return copy;
  }, [filteredSessions, sortKeySessions, sortDirSessions]);

  const statusOptions = useMemo(() => {
    if (activeTab === "requests") {
      return ["Tất cả", "Auto-approve", "Chờ duyệt", "Từ chối"];
    }
    return ["Tất cả", "Chờ xác nhận", "Đã xác nhận", "Đã hủy"];
  }, [activeTab]);

  const statsCards = useMemo(() => {
    if (activeTab === "requests") {
      return [
        {
          title: "Đơn nghỉ",
          value: String(requestStats.total),
          subtitle: "Tổng số",
          icon: ShieldCheck,
          color: "from-pink-500 to-rose-500",
        },
        {
          title: "Auto-approve",
          value: String(requestStats.autoApproved),
          subtitle: "Theo luật 24h",
          icon: CheckCircle2,
          color: "from-emerald-500 to-teal-500",
        },
        {
          title: "Chờ duyệt",
          value: String(requestStats.pending),
          subtitle: "Cần xử lý",
          icon: Clock,
          color: "from-amber-500 to-orange-500",
        },
        {
          title: "Credit đã cấp",
          value: String(requestStats.credits),
          subtitle: "Tổng credit",
          icon: Users,
          color: "from-blue-500 to-cyan-500",
        },
      ];
    }

    return [
      {
        title: "Buổi bù",
        value: String(sessionStats.total),
        subtitle: "Đã lên lịch",
        icon: CalendarDays,
        color: "from-pink-500 to-rose-500",
      },
      {
        title: "Đã xác nhận",
        value: String(sessionStats.confirmed),
        subtitle: "Hoàn tất",
        icon: CheckCircle2,
        color: "from-emerald-500 to-teal-500",
      },
      {
        title: "Chờ xác nhận",
        value: String(sessionStats.pending),
        subtitle: "Chờ phản hồi",
        icon: Clock,
        color: "from-amber-500 to-orange-500",
      },
      {
        title: "Gợi ý",
        value: "Tối ưu",
        subtitle: "Ưu tiên xếp lớp trống",
        icon: AlertCircle,
        color: "from-purple-500 to-violet-500",
      },
    ];
  }, [activeTab, requestStats, sessionStats]);

  const visibleIds = useMemo(
    () => (activeTab === "requests" ? sortedRequests.map((r) => r.id) : sortedSessions.map((s) => s.id)),
    [activeTab, sortedRequests, sortedSessions]
  );
  const selectedVisibleCount = useMemo(
    () => visibleIds.filter((id) => selectedIds[id]).length,
    [visibleIds, selectedIds]
  );
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (allVisibleSelected) {
        visibleIds.forEach((id) => {
          delete next[id];
        });
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

  const toggleSortRequests = (key: NonNullable<typeof sortKeyRequests>) => {
    setSortKeyRequests((prev) => {
      if (prev !== key) {
        setSortDirRequests("asc");
        return key;
      }
      setSortDirRequests((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
  };

  const toggleSortSessions = (key: NonNullable<typeof sortKeySessions>) => {
    setSortKeySessions((prev) => {
      if (prev !== key) {
        setSortDirSessions("asc");
        return key;
      }
      setSortDirSessions((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
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
            <CalendarDays size={28} className="text-white" />
          </div>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Học bù & MakeUpCredit
          </h1>
            <p className="text-sm text-gray-600 mt-1">
            Duyệt đơn nghỉ, tự động cấp credit theo luật 24h và xếp buổi bù
          </p>
        </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Download size={16} /> Xuất DS
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <PlusCircle size={16} /> Tạo lịch bù
        </button>
      </div>
            </div>

      {/* Stats */}
      <div
        className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {statsCards.map((s, idx) => (
          <StatCard key={`stat-${idx}`} {...s} />
        ))}
      </div>

      {/* Filter Bar + Tabs + Search */}
      <div
        className={`rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 transition-all duration-700 delay-150 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder={
                  activeTab === "requests"
                    ? "Tìm theo mã, học viên, khóa..."
                    : "Tìm theo mã, học viên, lớp..."
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-100 cursor-pointer"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-3">
          <div className="inline-flex rounded-2xl border border-pink-200 bg-white/60 p-1">
            <button
              onClick={() => {
                setActiveTab("requests");
                setStatusFilter("Tất cả");
                setSearchQuery("");
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "requests"
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-pink-50"
              }`}
            >
              Đơn xin nghỉ
            </button>
            <button
              onClick={() => {
                setActiveTab("sessions");
                setStatusFilter("Tất cả");
                setSearchQuery("");
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "sessions"
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-pink-50"
              }`}
            >
              Buổi bù đã lên lịch
            </button>
          </div>

          {/* Nếu cần thêm chip filter trạng thái, có thể đặt lại vào đây */}
        </div>
      </div>

      {/* Main Table */}
      <div
        className={`rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "requests" ? "Đơn xin nghỉ" : "Buổi bù"}
            </h2>
            <div className="text-sm text-gray-600 font-medium">
              {activeTab === "requests"
                ? `${sortedRequests.length} đơn`
                : `${sortedSessions.length} buổi`}
              </div>
              </div>
            </div>

        <div className="overflow-x-auto">
          {activeTab === "requests" ? (
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
                      onClick={() => toggleSortRequests("student")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Mã & Học viên
                      <ArrowUpDown
                        size={14}
                        className={sortKeyRequests === "student" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortRequests("course")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Khóa học
                      <ArrowUpDown
                        size={14}
                        className={sortKeyRequests === "course" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortRequests("requestTime")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Thời gian
                      <ArrowUpDown
                        size={14}
                        className={
                          sortKeyRequests === "requestTime" ? "text-pink-600" : "text-gray-400"
                        }
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortRequests("status")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Trạng thái
                      <ArrowUpDown
                        size={14}
                        className={sortKeyRequests === "status" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortRequests("credit")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Credit
                      <ArrowUpDown
                        size={14}
                        className={sortKeyRequests === "credit" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100">
                {sortedRequests.length > 0 ? (
                  sortedRequests.map((r) => (
                    <tr
                      key={r.id}
                      className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-4 align-top">
                        <input
                          type="checkbox"
                          checked={!!selectedIds[r.id]}
                          onChange={() => toggleSelectOne(r.id)}
                          className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200 cursor-pointer"
                          aria-label={`Chọn ${r.student}`}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold text-xs">
                            {r.student
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{r.student}</div>
                            <div className="text-xs text-gray-500 font-mono">{r.id}</div>
                            <div className="text-xs text-gray-400">{r.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">{r.course}</div>
                        <div className="text-xs text-gray-500">Lý do: {r.note}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700">Tạo: {r.requestTime}</div>
                        <div className="text-sm text-gray-700">Buổi: {r.sessionTime}</div>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200">
                          {r.credit}
              </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <button
                            className="p-1.5 rounded-lg border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                            title="Duyệt / Từ chối"
                          >
                            <ShieldCheck size={16} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                            title="Xếp buổi bù"
                          >
                            <CalendarDays size={16} />
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
                      <div className="text-gray-600 font-medium">Không có đơn phù hợp</div>
                      <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
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
                      onClick={() => toggleSortSessions("student")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Mã & Học viên
                      <ArrowUpDown
                        size={14}
                        className={sortKeySessions === "student" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortSessions("fromClass")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Từ lớp
                      <ArrowUpDown
                        size={14}
                        className={sortKeySessions === "fromClass" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortSessions("targetClass")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Lớp bù
                      <ArrowUpDown
                        size={14}
                        className={sortKeySessions === "targetClass" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortSessions("date")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Thời gian
                      <ArrowUpDown
                        size={14}
                        className={sortKeySessions === "date" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortSessions("status")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Trạng thái
                      <ArrowUpDown
                        size={14}
                        className={sortKeySessions === "status" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100">
                {sortedSessions.length > 0 ? (
                  sortedSessions.map((s) => (
                    <tr
                      key={s.id}
                      className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-4 align-top">
                        <input
                          type="checkbox"
                          checked={!!selectedIds[s.id]}
                          onChange={() => toggleSelectOne(s.id)}
                          className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200 cursor-pointer"
                          aria-label={`Chọn ${s.student}`}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold text-xs">
                            {s.student
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{s.student}</div>
                            <div className="text-xs text-gray-500 font-mono">{s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">{s.fromClass}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">{s.targetClass}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700">{s.date}</div>
                        <div className="text-sm text-gray-700">{s.time}</div>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <button
                            className="p-1.5 rounded-lg border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                            title="Đổi buổi"
                          >
                            <CalendarDays size={16} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                            title="Gửi Zalo"
                          >
                            <Send size={16} />
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
                      <div className="text-gray-600 font-medium">Không có lịch bù phù hợp</div>
                      <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick note */}
      <div
        className={`rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 transition-all duration-700 delay-300 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
            <Phone size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Gợi ý quy trình</div>
            <div className="text-sm text-gray-600 mt-1">
              Ưu tiên xử lý đơn "Chờ duyệt" trước. Với đơn auto-approve theo luật 24h, kiểm tra credit và xếp buổi bù phù hợp.
            </div>
            </div>
          </div>
      </div>
    </div>
  );
}
