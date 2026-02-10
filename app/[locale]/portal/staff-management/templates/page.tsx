"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit2,
  Send,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  Zap,
  MoreVertical,
  Copy,
  Trash2,
  Eye,
  Tag,
  Code,
  Sparkles,
  User,
  GraduationCap,
  Calendar,
  DollarSign,
  FileBarChart,
  TrendingUp,
} from "lucide-react";

type TemplateStatus = "Active" | "Draft";
type Channel = "Zalo OA" | "Email";
type Category = "Lịch học" | "Bài tập" | "Báo cáo" | "Tài chính" | "Sự kiện";

type Template = {
  id: string;
  title: string;
  channel: Channel;
  category: Category;
  body: string;
  status: TemplateStatus;
  createdAt?: string;
  usageCount?: number;
};

const INIT: Template[] = [
  {
    id: "TMP-01",
    title: "Nhắc lịch học",
    channel: "Zalo OA",
    category: "Lịch học",
    body: "Chào PH, lớp {class} của {student} vào {time} {date}. Vui lòng có mặt đúng giờ.",
    status: "Active",
    createdAt: "01/09/2024",
    usageCount: 45,
  },
  {
    id: "TMP-02",
    title: "Nhắc hạn nộp bài",
    channel: "Zalo OA",
    category: "Bài tập",
    body: "Chào {student}, bài tập {assignment} hạn {date}. Cố gắng hoàn thành nhé!",
    status: "Active",
    createdAt: "05/09/2024",
    usageCount: 32,
  },
  {
    id: "TMP-03",
    title: "Biên lai học phí",
    channel: "Email",
    category: "Tài chính",
    body: "Kính gửi PH {parent}. Trung tâm xác nhận đã nhận học phí {amount} cho {student}.",
    status: "Draft",
    createdAt: "10/09/2024",
    usageCount: 0,
  },
  {
    id: "TMP-04",
    title: "Báo cáo tháng đã sẵn sàng",
    channel: "Email",
    category: "Báo cáo",
    body: "Kính gửi PH {parent}, báo cáo tháng của {student} đã sẵn sàng. Vui lòng kiểm tra email.",
    status: "Active",
    createdAt: "15/09/2024",
    usageCount: 28,
  },
  {
    id: "TMP-05",
    title: "Thông báo nghỉ học",
    channel: "Zalo OA",
    category: "Lịch học",
    body: "Chào PH, lớp {class} của {student} sẽ nghỉ vào {date}. Lịch học bù sẽ được thông báo sau.",
    status: "Active",
    createdAt: "20/09/2024",
    usageCount: 15,
  },
  {
    id: "TMP-06",
    title: "Nhắc đóng học phí",
    channel: "Zalo OA",
    category: "Tài chính",
    body: "Chào PH, học phí tháng {month} của {student} là {amount}. Vui lòng thanh toán trước {date}.",
    status: "Draft",
    createdAt: "25/09/2024",
    usageCount: 0,
  },
];

const variables = [
  { key: "{parent}", label: "Tên phụ huynh", icon: User },
  { key: "{student}", label: "Tên học viên", icon: User },
  { key: "{class}", label: "Tên lớp", icon: GraduationCap },
  { key: "{date}", label: "Ngày tháng", icon: Calendar },
  { key: "{time}", label: "Giờ học", icon: Clock },
  { key: "{assignment}", label: "Bài tập", icon: FileText },
  { key: "{amount}", label: "Số tiền", icon: DollarSign },
  { key: "{month}", label: "Tháng", icon: Calendar },
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

function StatusBadge({ status }: { status: TemplateStatus }) {
  const map: Record<TemplateStatus, { cls: string; icon: any; label: string }> = {
    Active: {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
      label: "Đang dùng",
    },
    Draft: {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: Edit2,
      label: "Bản nháp",
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

function CategoryBadge({ category }: { category: Category }) {
  const map: Record<Category, { cls: string; icon: any }> = {
    "Lịch học": {
      cls: "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 border border-blue-200",
      icon: Calendar,
    },
    "Bài tập": {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: FileText,
    },
    "Báo cáo": {
      cls: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200",
      icon: FileBarChart,
    },
    "Tài chính": {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: DollarSign,
    },
    "Sự kiện": {
      cls: "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border border-red-200",
      icon: Sparkles,
    },
  };

  const cfg = map[category];
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} />
      <span>{category}</span>
    </span>
  );
}

export default function Page() {
  const [items, setItems] = useState(INIT);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<Channel>("Zalo OA");
  const [category, setCategory] = useState<Category>("Lịch học");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [channelFilter, setChannelFilter] = useState<string>("Tất cả");
  const [categoryFilter, setCategoryFilter] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((t) => t.status === "Active").length;
    const drafts = items.filter((t) => t.status === "Draft").length;
    const totalUsage = items.reduce((sum, t) => sum + (t.usageCount || 0), 0);
    return { total, active, drafts, totalUsage };
  }, [items]);

  const statusOptions: (TemplateStatus | "Tất cả")[] = ["Tất cả", "Active", "Draft"];
  const channelOptions: (Channel | "Tất cả")[] = ["Tất cả", "Zalo OA", "Email"];
  const categoryOptions: (Category | "Tất cả")[] = [
    "Tất cả",
    "Lịch học",
    "Bài tập",
    "Báo cáo",
    "Tài chính",
    "Sự kiện",
  ];

  const filtered = useMemo(() => {
    return items.filter((t) => {
      const matchesStatus = statusFilter === "Tất cả" || t.status === statusFilter;
      const matchesChannel = channelFilter === "Tất cả" || t.channel === channelFilter;
      const matchesCategory = categoryFilter === "Tất cả" || t.category === categoryFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q);
      return matchesStatus && matchesChannel && matchesCategory && matchesSearch;
    });
  }, [items, statusFilter, channelFilter, categoryFilter, searchQuery]);

  const add = () => {
    if (!title || !body) return;
    setItems((prev) => [
      ...prev,
      {
        id: `TMP-${(prev.length + 1).toString().padStart(2, "0")}`,
        title,
        channel,
        category,
        body,
        status: "Draft",
        createdAt: new Date().toLocaleDateString("vi-VN"),
        usageCount: 0,
      },
    ]);
    setTitle("");
    setBody("");
  };

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + variable);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <FileText size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Mẫu thông báo
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Zap size={14} className="text-red-500" />
                Quản lý template Zalo OA / Email cho lịch học, học phí, báo cáo tháng
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Tổng mẫu"
            value={String(stats.total)}
            subtitle="Trong hệ thống"
            icon={FileText}
            color="from-red-600 to-red-700"
            trend="+2 tháng này"
          />
          <StatCard
            title="Đang dùng"
            value={String(stats.active)}
            subtitle="Hoạt động"
            icon={CheckCircle2}
            color="from-emerald-500 to-teal-500"
            trend="Tỷ lệ cao"
          />
          <StatCard
            title="Bản nháp"
            value={String(stats.drafts)}
            subtitle="Chờ duyệt"
            icon={Edit2}
            color="from-amber-500 to-orange-500"
            trend="Cần xử lý"
          />
          <StatCard
            title="Tổng lượt dùng"
            value={String(stats.totalUsage)}
            subtitle="Tháng này"
            icon={TrendingUp}
            color="from-blue-500 to-cyan-500"
            trend="Tăng 15%"
          />
        </div>
      </div>

      {/* Create Template Form */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white">
              <Plus size={18} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Tạo mẫu mới</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="Nhập tiêu đề mẫu..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kênh</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                  className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer"
                >
                  <option>Zalo OA</option>
                  <option>Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer"
                >
                  <option>Lịch học</option>
                  <option>Bài tập</option>
                  <option>Báo cáo</option>
                  <option>Tài chính</option>
                  <option>Sự kiện</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung
                <span className="text-xs text-gray-500 ml-2">
                  (Dùng biến như {`{student}`}, {`{class}`}, {`{date}`}...)
                </span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm min-h-[120px] focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="Nhập nội dung mẫu..."
              />
            </div>

            <button
              onClick={add}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus size={16} /> Thêm mẫu
            </button>
          </div>
        </div>

        {/* Variables Panel */}
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 text-white">
              <Code size={18} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Biến động dữ liệu</h3>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Click vào biến để chèn vào nội dung. Biến sẽ tự động điền thông tin học viên/phụ huynh.
          </p>

          <div className="space-y-2 mb-4">
            {variables.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => insertVariable(item.key)}
                  className="w-full flex items-center justify-between rounded-xl border border-red-200 bg-white px-3 py-2 text-sm hover:bg-red-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-red-100 text-red-600">
                      <Icon size={14} />
                    </div>
                    <div className="text-left">
                      <div className="font-mono text-xs text-gray-900">{item.key}</div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                    </div>
                  </div>
                  <Copy size={14} className="text-gray-400 group-hover:text-red-500" />
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-dashed border-red-300 bg-red-50/50 p-3 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <Sparkles size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">Lưu ý:</div>
                <div>Mẫu Email dùng cho biên lai, báo cáo tháng, thông báo chính sách.</div>
              </div>
            </div>
          </div>
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
                placeholder="Tìm kiếm theo mã, tiêu đề, nội dung..."
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
                    {s === "Active" ? "Đang dùng" : s === "Draft" ? "Bản nháp" : s}
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

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer"
            >
              {categoryOptions.map((c) => (
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
                  ? status === "Active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status === "Active" && <CheckCircle2 size={12} />}
              {status === "Draft" && <Edit2 size={12} />}
              {status === "Active" ? "Đang dùng" : "Bản nháp"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 overflow-hidden">
        <div className="p-5 border-b border-red-200 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách mẫu
              <span className="ml-2 text-sm font-normal text-gray-500">({filtered.length} mẫu)</span>
            </h3>
            <div className="text-sm text-gray-500">Cập nhật: Hôm nay, 14:30</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-pink-100 bg-red-50/50">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mã & Tiêu đề
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Kênh
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nội dung
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {filtered.length > 0 ? (
                filtered.map((template) => (
                  <tr key={template.id} className="hover:bg-red-50/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white font-bold">
                          {template.id.slice(-2)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{template.title}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{template.id}</span>
                            {template.usageCount !== undefined && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Send size={10} />
                                  {template.usageCount} lượt dùng
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <ChannelBadge channel={template.channel} />
                    </td>
                    <td className="py-4 px-6">
                      <CategoryBadge category={template.category} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={template.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-md">
                        <div className="text-sm text-gray-700 line-clamp-2">{template.body}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-red-50 transition-colors cursor-pointer">
                          <Eye size={12} />
                          Xem
                        </button>
                        <button className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer">
                          <Edit2 size={12} />
                          Sửa
                        </button>
                        {template.status === "Active" && (
                          <button className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer">
                            <Send size={12} />
                            Gửi thử
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-100 flex items-center justify-center">
                      <Search size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không có mẫu phù hợp</div>
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
            <Zap size={16} className="text-red-500" />
            <span>Hệ thống quản lý mẫu thông báo • Tích hợp Zalo OA & Email • Phiên bản 2.0</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Đang dùng</span>
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
