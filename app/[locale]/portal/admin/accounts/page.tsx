"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  CornerUpLeft,
  Eye,
  FileText,
  Megaphone,
  Send,
  Sparkles,
  Trash2,
  CheckCheck,
  Clock,
  Inbox,
  Zap,
  Layers,
  PlusCircle,
  Bookmark,
  Settings2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Filter,
  Search,
  MoreVertical,
  Download,
  Calendar,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type {
  NotificationAudience,
  NotificationChannel,
  NotificationKind,
} from "@/types/notification";
import FcmPermissionCard from "@/components/notifications/FcmPermissionCard";
import {
  createNotificationTemplate,
  deleteNotificationTemplate,
  fetchNotificationTemplates,
} from "@/lib/api/notificationService";
import { CreditCard, MessageSquare, Mail, MessageCircle } from "lucide-react";

const AUDIENCE_OPTIONS: { value: NotificationAudience; label: string; hint: string; color: string }[] = [
  { value: "all", label: "Tất cả role", hint: "Gửi toàn hệ thống", color: "bg-red-100 text-red-700 border border-red-200" },
  { value: "family", label: "Parent + Student", hint: "Khối gia đình và học viên", color: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  { value: "teaching", label: "Teacher", hint: "Đội ngũ giảng dạy", color: "bg-blue-100 text-blue-700 border border-blue-200" },
  { value: "management", label: "Staff Manager + Accountant", hint: "Khối vận hành nội bộ", color: "bg-purple-100 text-purple-700 border border-purple-200" },
  { value: "Parent", label: "Chỉ Parent", hint: "Chỉ phụ huynh", color: "bg-pink-100 text-pink-700 border border-pink-200" },
  { value: "Student", label: "Chỉ Student", hint: "Chỉ học viên", color: "bg-amber-100 text-amber-700 border border-amber-200" },
  { value: "Teacher", label: "Chỉ Teacher", hint: "Chỉ giáo viên", color: "bg-cyan-100 text-cyan-700 border border-cyan-200" },
];

const KIND_OPTIONS: { value: NotificationKind; label: string; icon: any; color: string }[] = [
  { value: "system", label: "Hệ thống", icon: Settings2, color: "text-gray-700 bg-gray-100 border border-gray-200" },
  { value: "schedule", label: "Lịch học", icon: Clock, color: "text-blue-700 bg-blue-100 border border-blue-200" },
  { value: "report", label: "Báo cáo", icon: FileText, color: "text-purple-700 bg-purple-100 border border-purple-200" },
  { value: "payment", label: "Tài chính", icon: CreditCard, color: "text-emerald-700 bg-emerald-100 border border-emerald-200" },
  { value: "homework", label: "Bài tập", icon: Bookmark, color: "text-amber-700 bg-amber-100 border border-amber-200" },
  { value: "feedback", label: "Góp ý", icon: MessageSquare, color: "text-rose-700 bg-rose-100 border border-rose-200" },
  { value: "event", label: "Sự kiện", icon: Sparkles, color: "text-indigo-700 bg-indigo-100 border border-indigo-200" },
];

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string; hint: string; icon: any }[] = [
  { value: "InApp", label: "In-app", hint: "Hiển thị trong inbox nội bộ", icon: Bell },
  { value: "Push", label: "Push", hint: "Thiết bị đã đăng ký FCM", icon: Zap },
  { value: "Email", label: "Email", hint: "Gửi qua email", icon: Mail },
  { value: "ZaloOa", label: "Zalo OA", hint: "Kênh Zalo Official Account", icon: MessageCircle },
];

const TABS = [
  { id: "list", label: "Danh sách thông báo", icon: Inbox },
  { id: "compose", label: "Tạo broadcast", icon: Megaphone },
  { id: "templates", label: "Tạo template", icon: Layers },
] as const;

type StaffTab = (typeof TABS)[number]["id"];

type TemplateItem = {
  id: string;
  code?: string | null;
  title?: string | null;
  content?: string | null;
  channel?: string | null;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAudienceMeta(value: NotificationAudience) {
  return AUDIENCE_OPTIONS.find((option) => option.value === value) ?? {
    value,
    label: value,
    hint: "",
    color: "bg-gray-100 text-gray-700 border border-gray-200",
  };
}

function getKindMeta(value: NotificationKind) {
  return KIND_OPTIONS.find((option) => option.value === value) ?? {
    value,
    label: value,
    icon: Bell,
    color: "text-gray-700 bg-gray-100 border border-gray-200",
  };
}

function getChannelMeta(value: NotificationChannel) {
  return CHANNEL_OPTIONS.find((option) => option.value === value) ?? {
    value,
    label: value,
    hint: "",
    icon: Bell,
  };
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string | number; trend?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-5 transition-all hover:shadow-md border border-gray-100">
      <div className="absolute inset-0 bg-gradient-to-b from-red-50/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-gradient-to-br from-red-100 to-red-200 p-3 text-red-600 shadow-sm">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationBroadcastPage() {
  const {
    notifications,
    unreadCount,
    campaigns,
    createCampaign,
    markAsRead,
    markAllAsRead,
    removeOne,
  } = useNotifications("Staff_Manager");
  const formRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<StaffTab>("compose");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<NotificationAudience>("family");
  const [channel, setChannel] = useState<NotificationChannel>("InApp");
  const [kind, setKind] = useState<NotificationKind>("system");
  const [templateCode, setTemplateCode] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [messageFilter, setMessageFilter] = useState<"all" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    void (async () => {
      const items = await fetchNotificationTemplates();
      setTemplates(Array.isArray(items) ? items : []);
    })();
  }, []);

  const stats = useMemo(() => {
    const sentToday = campaigns.filter(
      (item) => new Date(item.createdAt).toDateString() === new Date().toDateString(),
    ).length;
    return {
      notifications: notifications.length,
      unread: unreadCount,
      campaigns: campaigns.length,
      sentToday,
      templates: templates.length,
    };
  }, [campaigns, notifications.length, templates.length, unreadCount]);

  const selectedAudience = getAudienceMeta(audience);
  const selectedKind = getKindMeta(kind);
  const KindIcon = selectedKind.icon;
  const selectedChannel = getChannelMeta(channel);
  const ChannelIcon = selectedChannel.icon;
  const activeTemplate = templates.find((template) => template.id === activeTemplateId) ?? null;
  
  const filteredNotifications = useMemo(() => {
    let filtered = messageFilter === "unread" ? notifications.filter((item) => !item.read) : notifications;
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [notifications, messageFilter, searchQuery]);

  const refreshTemplates = async () => {
    const items = await fetchNotificationTemplates();
    setTemplates(Array.isArray(items) ? items : []);
  };

  const applyTemplate = (template: TemplateItem) => {
    setActiveTemplateId(template.id);
    setTitle(template.title ?? "");
    setMessage(template.content ?? "");
    if (
      template.channel === "InApp" ||
      template.channel === "Push" ||
      template.channel === "Email" ||
      template.channel === "ZaloOa"
    ) {
      setChannel(template.channel);
    }
    setSubmitSuccess("Đã nạp template vào form broadcast.");
    setSubmitError("");
    setActiveTab("compose");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      setSubmitError("Cần nhập tiêu đề và nội dung trước khi gửi.");
      return;
    }
    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);
    try {
      await createCampaign({
        title: title.trim(),
        message: message.trim(),
        audience,
        channel,
        kind,
        senderRole: "Staff_Manager",
        senderName: "Phòng học vụ",
        priority: kind === "payment" || kind === "report" ? "high" : "medium",
      });
      setTitle("");
      setMessage("");
      setAudience("family");
      setChannel("InApp");
      setKind("system");
      setActiveTemplateId(null);
      setSubmitSuccess("Đã gửi broadcast thành công.");
      setActiveTab("list");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Broadcast failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateCode.trim() || !templateTitle.trim() || !templateContent.trim()) {
      setTemplateError("Code, tiêu đề và nội dung template là bắt buộc.");
      return;
    }
    setTemplateError("");
    setIsSavingTemplate(true);
    try {
      await createNotificationTemplate({
        code: templateCode.trim(),
        channel,
        title: templateTitle.trim(),
        content: templateContent.trim(),
        placeholders: [],
        isActive: true,
      });
      setTemplateCode("");
      setTemplateTitle("");
      setTemplateContent("");
      await refreshTemplates();
      setSubmitSuccess("Đã lưu template mới.");
    } catch (error) {
      setTemplateError(error instanceof Error ? error.message : "Không thể lưu template.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-red-50/30 to-white min-h-screen p-4 md:p-6">
      <div className="space-y-6">
        {/* Header với hiệu ứng gradient nhẹ */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-transparent to-transparent" />
          
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-100 to-red-200 px-4 py-2">
                <Megaphone className="h-4 w-4 text-red-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                  Notification Center
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 lg:text-4xl">
                Bảng điều phối
                <span className="block text-red-600">
                  thông báo staff
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
                Quản lý tập trung tất cả thông báo nội bộ, tạo broadcast và xây dựng thư viện template để tối ưu quy trình làm việc.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2">
                <Calendar size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Tháng 12/2024</span>
              </div>
              <button className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-red-100 to-red-200 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-all hover:shadow-md">
                <Download size={16} />
                Xuất báo cáo
              </button>
              <button className="cursor-pointer rounded-xl bg-gray-100 p-2 transition-all hover:bg-gray-200">
                <MoreVertical size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={<Inbox size={20} />}
            label="Tổng thông báo"
            value={stats.notifications}
            trend="+12% so với tháng trước"
          />
          <StatCard
            icon={<Bell size={20} />}
            label="Chưa đọc"
            value={stats.unread}
            trend="Cần xử lý"
          />
          <StatCard
            icon={<Megaphone size={20} />}
            label="Campaign"
            value={stats.campaigns}
            trend={`Hôm nay: ${stats.sentToday}`}
          />
          <StatCard
            icon={<Layers size={20} />}
            label="Template"
            value={stats.templates}
            trend="Sẵn sàng sử dụng"
          />
        </div>

        {/* FCM Permission Card */}
        <FcmPermissionCard role="Staff_Manager" />

        {/* Tabs */}
        <div className="rounded-2xl bg-white p-1 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-red-100 to-red-200 text-red-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="relative flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nội dung chính */}
        {activeTab === "list" && (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Danh sách thông báo */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Danh sách thông báo</h2>
                  <p className="mt-1 text-sm text-gray-500">Theo dõi và xử lý inbox nội bộ</p>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm thông báo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-64 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setMessageFilter("all")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    messageFilter === "all"
                      ? "bg-gradient-to-r from-red-100 to-red-200 text-red-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Tất cả <span className="ml-1 rounded-full bg-white/80 px-1.5 py-0.5 text-xs">{notifications.length}</span>
                </button>
                <button
                  onClick={() => setMessageFilter("unread")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    messageFilter === "unread"
                      ? "bg-gradient-to-r from-red-100 to-red-200 text-red-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Chưa đọc <span className="ml-1 rounded-full bg-white/80 px-1.5 py-0.5 text-xs">{unreadCount}</span>
                </button>
                <button
                  onClick={() => void markAllAsRead()}
                  className="rounded-xl bg-gradient-to-r from-red-100 to-red-200 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-all hover:shadow-md flex items-center gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Đánh dấu tất cả
                </button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {filteredNotifications.length ? (
                  filteredNotifications.map((item) => {
                    const kindMeta = getKindMeta(item.kind);
                    const KindIcon = kindMeta.icon;
                    return (
                      <article
                        key={item.id}
                        className={`group relative overflow-hidden rounded-xl border-2 p-5 transition-all hover:shadow-md ${
                          item.read
                            ? "border-gray-100 bg-white"
                            : "border-red-200 bg-gradient-to-r from-red-50/50 to-white"
                        }`}
                      >
                        {!item.read && (
                          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-red-300 to-red-400" />
                        )}
                        <div className="flex items-start gap-4">
                          <div className={`rounded-xl p-3 ${kindMeta.color}`}>
                            <KindIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                              {!item.read && (
                                <span className="rounded-full bg-gradient-to-r from-red-100 to-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">
                                  Mới
                                </span>
                              )}
                              <span className={`rounded-full px-2.5 py-1 text-xs ${kindMeta.color}`}>
                                {kindMeta.label}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-2">{item.message}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(item.createdAt)}
                              </span>
                              <span>Từ: {item.senderName}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {!item.read ? (
                              <button
                                onClick={() => void markAsRead(item.id)}
                                className="rounded-xl bg-gradient-to-r from-red-100 to-red-200 px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition-all hover:shadow-md cursor-pointer"
                              >
                                Đã đọc
                              </button>
                            ) : null}
                            <button
                              onClick={() => void removeOne(item.id)}
                              className="rounded-xl border border-gray-200 bg-white p-2 text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              aria-label="Xóa thông báo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
                    <Inbox className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-gray-400">Không có thông báo nào</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mẹo xử lý & Thống kê nhanh */}
            <div className="space-y-6">
              {/* Thống kê nhanh */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-500" />
                  Thống kê nhanh
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Tỷ lệ đọc</span>
                    <span className="font-semibold text-gray-900">
                      {notifications.length ? Math.round(((notifications.length - unreadCount) / notifications.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Phản hồi trung bình</span>
                    <span className="font-semibold text-gray-900">2.4 giờ</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Campaign active</span>
                    <span className="font-semibold text-gray-900">{campaigns.length}</span>
                  </div>
                </div>
              </div>

              {/* Mẹo xử lý */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-gradient-to-r from-red-100 to-red-200 p-2">
                    <Sparkles className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Mẹo xử lý</h2>
                    <p className="text-sm text-gray-500">Tối ưu quy trình làm việc</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      title: "Đánh dấu đã đọc",
                      description: "Xử lý ngay để tránh sót việc quan trọng",
                      icon: CheckCheck,
                    },
                    {
                      title: "Sử dụng template",
                      description: "Tái sử dụng nội dung cho các broadcast tương tự",
                      icon: Layers,
                    },
                    {
                      title: "Xem trước nội dung",
                      description: "Kiểm tra kỹ trước khi gửi broadcast",
                      icon: Eye,
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={index}
                        className="group rounded-xl bg-gray-50 p-4 transition-all hover:bg-red-50/50 cursor-pointer border border-gray-100"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-white p-2 border border-gray-200">
                            <Icon className="h-4 w-4 text-red-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "compose" && (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Form compose */}
            <div ref={formRef} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between mb-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-gradient-to-r from-red-100 to-red-200 p-2">
                    <BellRing className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Tạo broadcast</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Soạn nội dung và gửi tới đúng nhóm nhận
                    </p>
                  </div>
                </div>
                {activeTemplate && (
                  <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Bookmark className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Đang dùng:</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs border border-gray-200">
                        {activeTemplate.code}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                    {submitSuccess}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  {/* Audience Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Đối tượng</label>
                    <select
                      value={audience}
                      onChange={(event) => setAudience(event.target.value as NotificationAudience)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    >
                      {AUDIENCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400">{selectedAudience.hint}</p>
                  </div>

                  {/* Kind Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Loại</label>
                    <select
                      value={kind}
                      onChange={(event) => setKind(event.target.value as NotificationKind)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    >
                      {KIND_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Channel Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Kênh</label>
                    <select
                      value={channel}
                      onChange={(event) => setChannel(event.target.value as NotificationChannel)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    >
                      {CHANNEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400">{selectedChannel.hint}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="Nhập tiêu đề thông báo..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nội dung</label>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="Nhập nội dung broadcast..."
                  />
                </div>

                <button
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-red-100 to-red-200 px-6 text-sm font-semibold text-red-700 shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Gửi broadcast
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview và Templates */}
            <div className="space-y-6">
              {/* Preview Card */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-gradient-to-r from-red-100 to-red-200 p-2">
                    <Eye className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Preview</h2>
                    <p className="text-sm text-gray-500">Xem trước nội dung</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-3 ${selectedKind.color}`}>
                      <KindIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {title.trim() || "Tiêu đề sẽ hiển thị ở đây"}
                        </h3>
                        <span className="flex items-center gap-1 rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-600">
                          <ChannelIcon className="h-3 w-3" />
                          {selectedChannel.label}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-gray-600">
                        {message.trim() || "Nội dung preview sẽ hiển thị tại đây..."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs ${selectedAudience.color}`}>
                          {selectedAudience.label}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs ${selectedKind.color}`}>
                          {selectedKind.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Templates nhanh */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-gradient-to-r from-red-100 to-red-200 p-2">
                    <Layers className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Template nhanh</h2>
                    <p className="text-sm text-gray-500">Sử dụng template có sẵn</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {templates.slice(0, 3).length ? (
                    templates.slice(0, 3).map((template) => (
                      <div
                        key={template.id}
                        className="group relative rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-red-200 hover:bg-red-50/50 cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{template.title}</h3>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{template.content}</p>
                          </div>
                          <button
                            onClick={() => applyTemplate(template)}
                            className="ml-2 rounded-lg bg-gradient-to-r from-red-100 to-red-200 p-2 text-red-600 opacity-0 shadow-sm transition-all group-hover:opacity-100 cursor-pointer"
                          >
                            <CornerUpLeft className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 border border-gray-200">
                            {template.code}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
                      <Layers className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-400">Chưa có template nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            {/* Tạo template mới */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-xl bg-gradient-to-r from-red-100 to-red-200 p-2">
                  <PlusCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tạo template mới</h2>
                  <p className="text-sm text-gray-500">Lưu mẫu để sử dụng nhanh</p>
                </div>
              </div>

              <div className="space-y-4">
                {templateError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {templateError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mã template</label>
                  <input
                    value={templateCode}
                    onChange={(event) => setTemplateCode(event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="VD: SESSION_REMINDER"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                  <input
                    value={templateTitle}
                    onChange={(event) => setTemplateTitle(event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="Nhập tiêu đề template"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nội dung</label>
                  <textarea
                    value={templateContent}
                    onChange={(event) => setTemplateContent(event.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="Nhập nội dung template"
                  />
                </div>

                <button
                  onClick={() => void handleCreateTemplate()}
                  disabled={isSavingTemplate}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-red-100 to-red-200 px-6 text-sm font-semibold text-red-700 shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingTemplate ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Lưu template
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Thư viện template */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-xl bg-gradient-to-r from-red-100 to-red-200 p-2">
                  <Bookmark className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Thư viện template</h2>
                  <p className="text-sm text-gray-500">Quản lý các mẫu có sẵn</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {templates.length ? (
                  templates.map((template) => {
                    const isActive = template.id === activeTemplateId;
                    const channelMeta = getChannelMeta(template.channel as NotificationChannel);
                    const ChannelIcon = channelMeta.icon;

                    return (
                      <article
                        key={template.id}
                        className={`group rounded-xl border-2 p-5 transition-all hover:shadow-md ${
                          isActive
                            ? "border-red-200 bg-gradient-to-r from-red-50/50 to-white"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900">{template.title}</h3>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 border border-gray-200">
                                {template.code}
                              </span>
                              {template.channel && (
                                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                  <ChannelIcon className="h-3 w-3" />
                                  {channelMeta.label}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-2">
                              {template.content}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 ml-4">
                            <button
                              onClick={() => applyTemplate(template)}
                              className="rounded-lg bg-gradient-to-r from-red-100 to-red-200 p-2 text-red-600 opacity-0 shadow-sm transition-all group-hover:opacity-100 cursor-pointer"
                              title="Sử dụng template"
                            >
                              <CornerUpLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                await deleteNotificationTemplate(template.id);
                                if (template.id === activeTemplateId) {
                                  setActiveTemplateId(null);
                                }
                                await refreshTemplates();
                              }}
                              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              title="Xóa template"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
                    <Layers className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-gray-400">Chưa có template nào</p>
                    <p className="text-xs text-gray-400 mt-1">Tạo template mới để bắt đầu</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}