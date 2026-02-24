"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Send,
  Plus,
  Search,
  Filter,
  Eye,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  Calendar,
  Users,
  TrendingUp,
  Zap,
  MoreVertical,
  Play,
  Edit2,
  Trash2,
  ArrowUpDown,
} from "lucide-react";

type CampaignStatus = "Draft" | "Scheduled" | "Sent" | "Failed";
type Channel = "Zalo OA" | "Email" | "Zalo OA + Email";

type Campaign = {
  id: string;
  title: string;
  channel: Channel;
  audience: string;
  status: CampaignStatus;
  sendAt: string;
  createdAt?: string;
  openedRate?: number;
  clickRate?: number;
};

const CAMPAIGNS: Campaign[] = [
  {
    id: "NT-01",
    title: "Nhắc đóng học phí tháng 10",
    channel: "Zalo OA",
    audience: "Phụ huynh",
    status: "Scheduled",
    sendAt: "12/10 09:00",
    createdAt: "10/10 14:30",
    openedRate: 85,
    clickRate: 42,
  },
  {
    id: "NT-02",
    title: "Thông báo lịch workshop",
    channel: "Zalo OA + Email",
    audience: "Phụ huynh + Học viên",
    status: "Draft",
    sendAt: "",
    createdAt: "11/10 10:15",
  },
  {
    id: "NT-03",
    title: "Báo cáo tháng đã sẵn sàng",
    channel: "Zalo OA",
    audience: "Phụ huynh",
    status: "Sent",
    sendAt: "05/10 19:00",
    createdAt: "05/10 18:00",
    openedRate: 78,
    clickRate: 35,
  },
  {
    id: "NT-04",
    title: "Thông báo nghỉ lễ 20/10",
    channel: "Email",
    audience: "Tất cả",
    status: "Sent",
    sendAt: "08/10 08:00",
    createdAt: "07/10 16:20",
    openedRate: 92,
    clickRate: 58,
  },
  {
    id: "NT-05",
    title: "Nhắc lịch học bù tuần này",
    channel: "Zalo OA",
    audience: "Học viên",
    status: "Scheduled",
    sendAt: "13/10 07:00",
    createdAt: "11/10 15:45",
  },
  {
    id: "NT-06",
    title: "Khuyến mãi khóa học mới",
    channel: "Zalo OA + Email",
    audience: "Phụ huynh",
    status: "Draft",
    sendAt: "",
    createdAt: "12/10 09:30",
  },
];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
  trend?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5 transition-all duration-300 hover:border-red-300 hover:shadow-lg cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-red-600 mb-3">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="flex items-center gap-2">
            {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
            {trend && (
              <div className="flex items-center gap-1 text-emerald-600 text-sm">
                <TrendingUp size={14} />
                {trend}
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${color} text-white shadow-lg`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, { cls: string; icon: any; label: string }> = {
    Draft: {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: Edit2,
      label: "Bản nháp",
    },
    Scheduled: {
      cls: "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 border border-blue-200",
      icon: Clock,
      label: "Đã lên lịch",
    },
    Sent: {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
      label: "Đã gửi",
    },
    Failed: {
      cls: "bg-gradient-to-r from-red-50 to-red-50 text-red-700 border border-red-200",
      icon: Zap,
      label: "Lỗi",
    },
  };

  const cfg = map[status];
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} />
      <span>{cfg.label}</span>
    </span>
  );
}

function ChannelBadge({ channel }: { channel: Channel }) {
  const map: Record<Channel, { cls: string; icon: any }> = {
    "Zalo OA": {
      cls: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200",
      icon: MessageSquare,
    },
    Email: {
      cls: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200",
      icon: Mail,
    },
    "Zalo OA + Email": {
      cls: "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border border-red-200",
      icon: Send,
    },
  };

  const cfg = map[channel];
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} />
      <span>{channel}</span>
    </span>
  );
}

export default function Page() {
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [channelFilter, setChannelFilter] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<
    "title" | "channel" | "audience" | "status" | "sendAt" | "id" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const stats = useMemo(() => {
    const pending = CAMPAIGNS.filter((c) => c.status === "Scheduled").length;
    const sentToday = CAMPAIGNS.filter((c) => c.status === "Sent").length;
    const avgOpenRate =
      CAMPAIGNS.filter((c) => c.openedRate !== undefined).reduce(
        (sum, c) => sum + (c.openedRate || 0),
        0
      ) / CAMPAIGNS.filter((c) => c.openedRate !== undefined).length || 0;
    return { pending, sentToday, avgOpenRate: Math.round(avgOpenRate) };
  }, []);

  const statusOptions: (CampaignStatus | "Tất cả")[] = [
    "Tất cả",
    "Draft",
    "Scheduled",
    "Sent",
    "Failed",
  ];

  const channelOptions: (Channel | "Tất cả")[] = [
    "Tất cả",
    "Zalo OA",
    "Email",
    "Zalo OA + Email",
  ];

  const filtered = useMemo(() => {
    return CAMPAIGNS.filter((c) => {
      const matchesStatus = statusFilter === "Tất cả" || c.status === statusFilter;
      const matchesChannel = channelFilter === "Tất cả" || c.channel === channelFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.audience.toLowerCase().includes(q);
      return matchesStatus && matchesChannel && matchesSearch;
    });
  }, [statusFilter, channelFilter, searchQuery]);

  const sortedCampaigns = useMemo(() => {
    const copy = [...filtered];
    if (!sortKey) return copy;

    const getVal = (c: Campaign) => {
      switch (sortKey) {
        case "title":
          return c.title;
        case "channel":
          return c.channel;
        case "audience":
          return c.audience;
        case "status":
          return c.status;
        case "sendAt":
          return c.sendAt ?? "";
        case "id":
        default:
          return c.id;
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

  const visibleIds = useMemo(() => sortedCampaigns.map((c) => c.id), [sortedCampaigns]);
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

  const createNotification = () => alert("Tạo thông báo mới — Demo");

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <Bell size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Trung tâm thông báo
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Zap size={14} className="text-red-500" />
                Gửi broadcast qua Zalo OA/Email, theo dõi lịch gửi và kết quả
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={createNotification}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus size={16} /> Tạo thông báo
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Đang chờ gửi"
            value={String(stats.pending)}
            subtitle="Trong hàng đợi"
            icon={Clock}
            color="from-blue-500 to-cyan-500"
            trend="Sắp gửi"
          />
          <StatCard
            title="Đã gửi hôm nay"
            value={String(stats.sentToday)}
            subtitle="Thông báo"
            icon={Send}
            color="from-emerald-500 to-teal-500"
            trend="+12% so với hôm qua"
          />
          <StatCard
            title="Tỉ lệ mở trung bình"
            value={`${stats.avgOpenRate}%`}
            subtitle="Hiệu quả cao"
            icon={TrendingUp}
            color="from-purple-500 to-violet-500"
            trend="Tăng 5%"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã, tiêu đề, đối tượng..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-red-200 bg-white focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
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
                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === "Draft"
                      ? "Bản nháp"
                      : s === "Scheduled"
                        ? "Đã lên lịch"
                        : s === "Sent"
                          ? "Đã gửi"
                          : s === "Failed"
                            ? "Lỗi"
                            : s}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer"
            >
              {channelOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors cursor-pointer">
              <MoreVertical size={16} />
              Thêm lọc
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.slice(1).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "Tất cả" : status)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === status
                  ? status === "Draft"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : status === "Scheduled"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : status === "Sent"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-red-700 border-red-200"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status === "Draft" && <Edit2 size={12} />}
              {status === "Scheduled" && <Clock size={12} />}
              {status === "Sent" && <CheckCircle2 size={12} />}
              {status === "Failed" && <Zap size={12} />}
              {status === "Draft"
                ? "Bản nháp"
                : status === "Scheduled"
                  ? "Đã lên lịch"
                  : status === "Sent"
                    ? "Đã gửi"
                    : "Lỗi"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 overflow-hidden">
        <div className="p-5 border-b border-red-200 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách thông báo
              <span className="ml-2 text-sm font-normal text-gray-500">({sortedCampaigns.length} thông báo)</span>
            </h3>
            <div className="text-sm text-gray-500">Cập nhật: Hôm nay, 14:30</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-red-100 bg-red-50/50">
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
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("title")}
                    className="inline-flex items-center gap-1 hover:text-red-700"
                  >
                    Mã & Tiêu đề
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "title" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("channel")}
                    className="inline-flex items-center gap-1 hover:text-red-700"
                  >
                    Kênh
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "channel" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("audience")}
                    className="inline-flex items-center gap-1 hover:text-red-700"
                  >
                    Đối tượng
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "audience" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-1 hover:text-red-700"
                  >
                    Trạng thái
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "status" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("sendAt")}
                    className="inline-flex items-center gap-1 hover:text-red-700"
                  >
                    Lịch gửi
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "sendAt" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {sortedCampaigns.length > 0 ? (
                sortedCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-red-50/30 transition-colors group"
                  >
                    <td className="py-4 px-4 align-top">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[campaign.id]}
                        onChange={() => toggleSelectOne(campaign.id)}
                        className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                        aria-label={`Chọn ${campaign.title}`}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-red-500 to-red-500 flex items-center justify-center text-white font-bold">
                          {campaign.id.slice(-2)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{campaign.title}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{campaign.id}</span>
                            {campaign.createdAt && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar size={10} />
                                  {campaign.createdAt}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <ChannelBadge channel={campaign.channel} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center text-white">
                          <Users size={14} />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{campaign.audience}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={campaign.status} />
                    </td>
                    <td className="py-4 px-6">
                      {campaign.sendAt ? (
                        <div className="text-sm text-gray-700 flex items-center gap-1">
                          <Clock size={14} className="text-gray-400" />
                          {campaign.sendAt}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Chưa lên lịch</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {campaign.openedRate !== undefined ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Mở: {campaign.openedRate}%</span>
                            <span className="text-gray-600">Click: {campaign.clickRate}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-red-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-400 transition-all duration-500"
                              style={{ width: `${campaign.openedRate}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Chưa có dữ liệu</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="p-1.5 rounded-lg border border-red-200 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Xem"
                        >
                          <Eye size={14} />
                        </button>
                        {campaign.status === "Draft" && (
                          <>
                            <button
                              className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Sửa"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Gửi thử"
                            >
                              <Play size={14} />
                            </button>
                          </>
                        )}
                        {campaign.status === "Scheduled" && (
                          <button
                            className="p-1.5 rounded-lg border border-red-200 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Gửi ngay"
                          >
                            <Send size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-100 flex items-center justify-center">
                      <Search size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không có thông báo phù hợp</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-red-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-pink-500" />
            <span>Hệ thống thông báo tự động • Tích hợp Zalo OA & Email • Phiên bản 2.0</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Đã gửi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Đã lên lịch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Bản nháp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
