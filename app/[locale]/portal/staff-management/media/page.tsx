"use client";

import { useMemo, useState } from "react";
import {
  Image,
  Upload,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  Eye,
  ShieldCheck,
  Calendar,
  FileImage,
  Video,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";

type MediaStatus = "Chờ duyệt" | "Đã publish" | "Đã từ chối";

type MediaType = "Image" | "Video" | "Album";

type MediaItem = {
  id: string;
  title: string;
  className: string;
  month: string;
  status: MediaStatus;
  type?: MediaType;
  uploader?: string;
  uploadDate?: string;
};

const ITEMS: MediaItem[] = [
  {
    id: "MD-01",
    title: "Hoạt động lớp Starters",
    className: "Starters B",
    month: "10/2024",
    status: "Chờ duyệt",
    type: "Album",
    uploader: "Cô Hoa",
    uploadDate: "10/10 14:30",
  },
  {
    id: "MD-02",
    title: "Video luyện nói",
    className: "IELTS A1",
    month: "10/2024",
    status: "Đã publish",
    type: "Video",
    uploader: "Thầy Minh",
    uploadDate: "09/10 16:20",
  },
  {
    id: "MD-03",
    title: "Bài tập Speaking",
    className: "TOEIC Intermediate",
    month: "10/2024",
    status: "Chờ duyệt",
    type: "Image",
    uploader: "Cô Lan",
    uploadDate: "11/10 09:15",
  },
  {
    id: "MD-04",
    title: "Hoạt động ngoại khóa",
    className: "Kids English F1",
    month: "10/2024",
    status: "Đã publish",
    type: "Album",
    uploader: "Cô Vi",
    uploadDate: "08/10 18:45",
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
    <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
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

function StatusBadge({ status }: { status: MediaStatus }) {
  const map: Record<MediaStatus, { cls: string; icon: any }> = {
    "Chờ duyệt": {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: Clock,
    },
    "Đã publish": {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "Đã từ chối": {
      cls: "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200",
      icon: AlertCircle,
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

function TypeIcon({ type }: { type?: MediaType }) {
  const map: Record<MediaType, { icon: any; color: string }> = {
    Image: { icon: FileImage, color: "text-blue-500" },
    Video: { icon: Video, color: "text-purple-500" },
    Album: { icon: Image, color: "text-red-500" },
  };

  const cfg = type ? map[type] : { icon: FileImage, color: "text-gray-500" };
  const Icon = cfg.icon;

  return <Icon size={16} className={cfg.color} />;
}

export default function Page() {
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [typeFilter, setTypeFilter] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<
    "title" | "className" | "month" | "uploader" | "status" | "uploadDate" | "id" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const stats = useMemo(() => {
    const total = ITEMS.length;
    const pending = ITEMS.filter((i) => i.status === "Chờ duyệt").length;
    const published = ITEMS.filter((i) => i.status === "Đã publish").length;
    const albums = ITEMS.filter((i) => i.type === "Album").length;
    return { total, pending, published, albums };
  }, []);

  const statusOptions: (MediaStatus | "Tất cả")[] = [
    "Tất cả",
    "Chờ duyệt",
    "Đã publish",
    "Đã từ chối",
  ];

  const typeOptions: (MediaType | "Tất cả")[] = [
    "Tất cả",
    "Image",
    "Video",
    "Album",
  ];

  const filtered = useMemo(() => {
    return ITEMS.filter((item) => {
      const matchesStatus = statusFilter === "Tất cả" || item.status === statusFilter;
      const matchesType = typeFilter === "Tất cả" || item.type === typeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.className.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.uploader?.toLowerCase().includes(q);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [statusFilter, typeFilter, searchQuery]);

  const sortedItems = useMemo(() => {
    const copy = [...filtered];
    if (!sortKey) return copy;

    const getVal = (i: MediaItem) => {
      switch (sortKey) {
        case "title":
          return i.title;
        case "className":
          return i.className;
        case "month":
          return i.month;
        case "uploader":
          return i.uploader ?? "";
        case "status":
          return i.status;
        case "uploadDate":
          return i.uploadDate ?? "";
        case "id":
        default:
          return i.id;
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

  const visibleIds = useMemo(() => sortedItems.map((i) => i.id), [sortedItems]);
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
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Image size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Media & Album
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Duyệt media giáo viên upload, publish album cho phụ huynh/học viên
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-gradient-to-r from-white to-red-50 px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer">
            <Download size={16} /> Xuất DS
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all cursor-pointer">
            <Upload size={16} /> Upload media
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng media"
          value={String(stats.total)}
          subtitle="Trong hệ thống"
          icon={Image}
          color="from-red-600 to-red-700"
        />
        <StatCard
          title="Chờ duyệt"
          value={String(stats.pending)}
          subtitle="Cần xem xét"
          icon={Clock}
          color="from-amber-500 to-orange-500"
        />
        <StatCard
          title="Đã publish"
          value={String(stats.published)}
          subtitle="Đã công khai"
          icon={CheckCircle2}
          color="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Album"
          value={String(stats.albums)}
          subtitle="Bộ sưu tập"
          icon={FileImage}
          color="from-purple-500 to-violet-500"
        />
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer"
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
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer"
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã, tiêu đề, lớp, người upload..."
              className="h-10 w-72 rounded-xl border border-red-300 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-text"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-red-50 to-red-100/30 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách Media</h2>
            <div className="text-sm text-gray-600 font-medium">{sortedItems.length} mục</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
              <tr>
                <th className="py-3 px-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("title")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                  >
                    Media
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "title" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("className")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                  >
                    Lớp
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "className" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("month")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                  >
                    Tháng
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "month" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("uploader")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                  >
                    Người upload
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "uploader" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                  >
                    Trạng thái
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "status" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {sortedItems.length > 0 ? (
                sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-4 align-top">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[item.id]}
                        onChange={() => toggleSelectOne(item.id)}
                        className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                        aria-label={`Chọn ${item.title}`}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                          <TypeIcon type={item.type} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.title}</div>
                          <div className="text-xs text-gray-500 font-mono">{item.id}</div>
                          {item.uploadDate && (
                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <Calendar size={10} />
                              {item.uploadDate}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-gray-900">{item.className}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-700">{item.month}</div>
                    </td>
                    <td className="py-4 px-6">
                      {item.uploader ? (
                        <div className="text-sm font-medium text-gray-900">{item.uploader}</div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="p-1.5 rounded-lg border border-red-300 bg-gradient-to-r from-white to-red-50 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Xem"
                        >
                          <Eye size={14} />
                        </button>
                        {item.status === "Chờ duyệt" && (
                          <button
                            className="p-1.5 rounded-lg border border-red-300 bg-gradient-to-r from-white to-red-50 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Duyệt"
                          >
                            <ShieldCheck size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                      <Search size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không có media phù hợp</div>
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