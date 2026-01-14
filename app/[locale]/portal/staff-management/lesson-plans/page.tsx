"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  PlusCircle,
  Search,
  ShieldCheck,
  AlertCircle,
  ArrowUpDown,
  MoreVertical,
} from "lucide-react";

type PlanStatus = "Đã chuẩn hóa" | "Chờ cập nhật";

type Plan = {
  id: string;
  program: string;
  unit: string;
  status: PlanStatus;
  lastUpdate: string;
};

type ReviewStatus = "Đã nộp" | "Chưa nộp";

type Review = {
  id: string;
  className: string;
  teacher: string;
  status: ReviewStatus;
};

const PLANS: Plan[] = [
  {
    id: "LP-01",
    program: "Cambridge Movers",
    unit: "Unit 4",
    status: "Đã chuẩn hóa",
    lastUpdate: "08/10",
  },
  {
    id: "LP-02",
    program: "IELTS A1",
    unit: "Writing Task 1",
    status: "Chờ cập nhật",
    lastUpdate: "05/10",
  },
];

const REVIEWS: Review[] = [
  {
    id: "RV-01",
    className: "IELTS A1",
    teacher: "Lê Quốc Huy",
    status: "Chưa nộp",
  },
  {
    id: "RV-02",
    className: "Kids Tue",
    teacher: "Ngô Minh Phúc",
    status: "Đã nộp",
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

function StatusBadge({ status }: { status: PlanStatus | ReviewStatus }) {
  const map: Record<string, { cls: string; icon: any }> = {
    "Đã chuẩn hóa": {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "Chờ cập nhật": {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: Clock,
    },
    "Đã nộp": {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "Chưa nộp": {
      cls: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200",
      icon: AlertCircle,
    },
  };

  const cfg = map[status] || map["Chờ cập nhật"];
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
  const [activeTab, setActiveTab] = useState<"library" | "tracking">("library");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sortKeyPlans, setSortKeyPlans] = useState<"program" | "unit" | "lastUpdate" | "status" | "id" | null>(null);
  const [sortDirPlans, setSortDirPlans] = useState<"asc" | "desc">("asc");
  const [sortKeyReviews, setSortKeyReviews] = useState<"className" | "teacher" | "status" | "id" | null>(null);
  const [sortDirReviews, setSortDirReviews] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const planStats = useMemo(() => {
    const total = PLANS.length;
    const standardized = PLANS.filter((p) => p.status === "Đã chuẩn hóa").length;
    const pending = PLANS.filter((p) => p.status === "Chờ cập nhật").length;
    return { total, standardized, pending };
  }, []);

  const reviewStats = useMemo(() => {
    const total = REVIEWS.length;
    const submitted = REVIEWS.filter((r) => r.status === "Đã nộp").length;
    const missing = REVIEWS.filter((r) => r.status === "Chưa nộp").length;
    return { total, submitted, missing };
  }, []);

  const statusOptions = useMemo(() => {
    if (activeTab === "library") return ["Tất cả", "Đã chuẩn hóa", "Chờ cập nhật"];
    return ["Tất cả", "Đã nộp", "Chưa nộp"];
  }, [activeTab]);

  const filteredPlans = useMemo(() => {
    return PLANS.filter((p) => {
      const matchesStatus = statusFilter === "Tất cả" || p.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.program.toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, searchQuery]);

  const sortedPlans = useMemo(() => {
    const copy = [...filteredPlans];
    if (!sortKeyPlans) return copy;
    const getVal = (p: Plan) => {
      switch (sortKeyPlans) {
        case "program":
          return p.program;
        case "unit":
          return p.unit;
        case "lastUpdate":
          return p.lastUpdate;
        case "status":
          return p.status;
        case "id":
        default:
          return p.id;
      }
    };
    copy.sort((a, b) => {
      const res = String(getVal(a)).localeCompare(String(getVal(b)), "vi", { numeric: true, sensitivity: "base" });
      return sortDirPlans === "asc" ? res : -res;
    });
    return copy;
  }, [filteredPlans, sortKeyPlans, sortDirPlans]);

  const filteredReviews = useMemo(() => {
    return REVIEWS.filter((r) => {
      const matchesStatus = statusFilter === "Tất cả" || r.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.className.toLowerCase().includes(q) ||
        r.teacher.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, searchQuery]);

  const sortedReviews = useMemo(() => {
    const copy = [...filteredReviews];
    if (!sortKeyReviews) return copy;
    const getVal = (r: Review) => {
      switch (sortKeyReviews) {
        case "className":
          return r.className;
        case "teacher":
          return r.teacher;
        case "status":
          return r.status;
        case "id":
        default:
          return r.id;
      }
    };
    copy.sort((a, b) => {
      const res = String(getVal(a)).localeCompare(String(getVal(b)), "vi", { numeric: true, sensitivity: "base" });
      return sortDirReviews === "asc" ? res : -res;
    });
    return copy;
  }, [filteredReviews, sortKeyReviews, sortDirReviews]);

  const statsCards = useMemo(() => {
    if (activeTab === "library") {
      return [
        {
          title: "Giáo án",
          value: String(planStats.total),
          subtitle: "Trong thư viện",
          icon: BookOpenCheck,
          color: "from-pink-500 to-rose-500",
        },
        {
          title: "Đã chuẩn hóa",
          value: String(planStats.standardized),
          subtitle: "Sẵn sàng triển khai",
          icon: CheckCircle2,
          color: "from-emerald-500 to-teal-500",
        },
        {
          title: "Chờ cập nhật",
          value: String(planStats.pending),
          subtitle: "Cần rà soát",
          icon: Clock,
          color: "from-amber-500 to-orange-500",
        },
        {
          title: "Khuyến nghị",
          value: "QC",
          subtitle: "Ưu tiên unit có lớp đang chạy",
          icon: ShieldCheck,
          color: "from-purple-500 to-violet-500",
        },
      ];
    }

    return [
      {
        title: "Theo dõi",
        value: String(reviewStats.total),
        subtitle: "Lớp cần nộp",
        icon: FileText,
        color: "from-pink-500 to-rose-500",
      },
      {
        title: "Đã nộp",
        value: String(reviewStats.submitted),
        subtitle: "Đủ hồ sơ",
        icon: CheckCircle2,
        color: "from-emerald-500 to-teal-500",
      },
      {
        title: "Chưa nộp",
        value: String(reviewStats.missing),
        subtitle: "Nhắc giáo viên",
        icon: AlertCircle,
        color: "from-rose-500 to-pink-600",
      },
      {
        title: "Gợi ý",
        value: "Auto",
        subtitle: "Nhắc theo deadline",
        icon: Clock,
        color: "from-amber-500 to-orange-500",
      },
    ];
  }, [activeTab, planStats, reviewStats]);

  const visibleIds = useMemo(
    () => (activeTab === "library" ? sortedPlans.map((p) => p.id) : sortedReviews.map((r) => r.id)),
    [activeTab, sortedPlans, sortedReviews]
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

  const toggleSortPlans = (key: NonNullable<typeof sortKeyPlans>) => {
    setSortKeyPlans((prev) => {
      if (prev !== key) {
        setSortDirPlans("asc");
        return key;
      }
      setSortDirPlans((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
  };

  const toggleSortReviews = (key: NonNullable<typeof sortKeyReviews>) => {
    setSortKeyReviews((prev) => {
      if (prev !== key) {
        setSortDirReviews("asc");
        return key;
      }
      setSortDirReviews((d) => (d === "asc" ? "desc" : "asc"));
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
            <BookOpenCheck size={28} className="text-white" />
          </div>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Giáo án & chất lượng
          </h1>
            <p className="text-sm text-gray-600 mt-1">
            Thư viện giáo án khung, theo dõi nộp giáo án thực tế và kiểm soát nội dung
          </p>
        </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Download size={16} /> Xuất DS
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <PlusCircle size={16} /> Tạo giáo án khung
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

      {/* Filter + Tabs + Search */}
      <div
        className={`rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 transition-all duration-700 delay-150 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder={
                  activeTab === "library"
                    ? "Tìm kiếm theo mã, chương trình, unit..."
                    : "Tìm kiếm theo mã, lớp, giáo viên..."
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

            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-pink-50 transition-colors cursor-pointer">
              <MoreVertical size={16} />
              Thêm lọc
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl border border-pink-200 bg-white/60 p-1">
            <button
              onClick={() => {
                setActiveTab("library");
                setStatusFilter("Tất cả");
                setSearchQuery("");
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "library"
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-pink-50"
              }`}
            >
              Thư viện giáo án
            </button>
            <button
              onClick={() => {
                setActiveTab("tracking");
                setStatusFilter("Tất cả");
                setSearchQuery("");
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "tracking"
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-pink-50"
              }`}
            >
              Theo dõi giáo án thực tế
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
              {activeTab === "library" ? "Thư viện giáo án" : "Theo dõi nộp giáo án"}
            </h2>
            <div className="text-sm text-gray-600 font-medium">
              {activeTab === "library"
                ? `${sortedPlans.length} giáo án`
                : `${sortedReviews.length} mục`}
          </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === "library" ? (
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
                      onClick={() => toggleSortPlans("program")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Mã & Chương trình
                      <ArrowUpDown size={14} className={sortKeyPlans === "program" ? "text-pink-600" : "text-gray-400"} />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortPlans("unit")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Unit
                      <ArrowUpDown size={14} className={sortKeyPlans === "unit" ? "text-pink-600" : "text-gray-400"} />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortPlans("lastUpdate")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Cập nhật
                      <ArrowUpDown
                        size={14}
                        className={sortKeyPlans === "lastUpdate" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortPlans("status")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Trạng thái
                      <ArrowUpDown size={14} className={sortKeyPlans === "status" ? "text-pink-600" : "text-gray-400"} />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100">
                {sortedPlans.length > 0 ? (
                  sortedPlans.map((p) => (
                    <tr
                      key={p.id}
                      className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-4 align-top">
                        <input
                          type="checkbox"
                          checked={!!selectedIds[p.id]}
                          onChange={() => toggleSelectOne(p.id)}
                          className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200 cursor-pointer"
                          aria-label={`Chọn ${p.program}`}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold text-xs">
                            {p.program
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{p.program}</div>
                            <div className="text-xs text-gray-500 font-mono">{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">{p.unit}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700">{p.lastUpdate}</div>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <button
                            className="p-1.5 rounded-lg border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                            title="Xem"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                            title="Chuẩn hóa"
                          >
                            <ShieldCheck size={16} />
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
                      <div className="text-gray-600 font-medium">Không có giáo án phù hợp</div>
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
                      onClick={() => toggleSortReviews("className")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Mã & Lớp
                      <ArrowUpDown
                        size={14}
                        className={sortKeyReviews === "className" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortReviews("teacher")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Giáo viên
                      <ArrowUpDown
                        size={14}
                        className={sortKeyReviews === "teacher" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSortReviews("status")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700"
                    >
                      Trạng thái
                      <ArrowUpDown
                        size={14}
                        className={sortKeyReviews === "status" ? "text-pink-600" : "text-gray-400"}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left">
                    <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100">
                {sortedReviews.length > 0 ? (
                  sortedReviews.map((r) => (
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
                          aria-label={`Chọn ${r.className}`}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900">{r.className}</div>
                          <div className="text-xs text-gray-500 font-mono">{r.id}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">{r.teacher}</div>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <button
                            className="p-1.5 rounded-lg border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                            title="Xem"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                            title="Nhắc nộp"
                          >
                            <AlertCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                        <Search size={24} className="text-pink-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Không có mục phù hợp</div>
                      <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
