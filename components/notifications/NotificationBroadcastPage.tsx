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
  Shield,
  Users,
  UserPlus,
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
  { value: "all", label: "Tất cả role", hint: "Gửi toàn hệ thống", color: "from-red-600 to-red-700" },
  { value: "family", label: "Parent + Student", hint: "Khối gia đình và học viên", color: "from-emerald-500 to-teal-500" },
  { value: "teaching", label: "Teacher", hint: "Đội ngũ giảng dạy", color: "from-blue-500 to-cyan-500" },
  { value: "management", label: "Staff Manager + Accountant", hint: "Khối vận hành nội bộ", color: "from-purple-500 to-violet-500" },
  { value: "Parent", label: "Chỉ Parent", hint: "Chỉ phụ huynh", color: "from-pink-500 to-rose-500" },
  { value: "Student", label: "Chỉ Student", hint: "Chỉ học viên", color: "from-amber-500 to-orange-500" },
  { value: "Teacher", label: "Chỉ Teacher", hint: "Chỉ giáo viên", color: "from-cyan-500 to-blue-500" },
];

const KIND_OPTIONS: { value: NotificationKind; label: string; icon: any; color: string }[] = [
  { value: "system", label: "Hệ thống", icon: Settings2, color: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "schedule", label: "Lịch học", icon: Clock, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "report", label: "Báo cáo", icon: FileText, color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "payment", label: "Tài chính", icon: CreditCard, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "homework", label: "Bài tập", icon: Bookmark, color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "feedback", label: "Góp ý", icon: MessageSquare, color: "bg-rose-100 text-rose-700 border-rose-200" },
  { value: "event", label: "Sự kiện", icon: Sparkles, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
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
    color: "from-gray-500 to-gray-600",
  };
}

function getKindMeta(value: NotificationKind) {
  return KIND_OPTIONS.find((option) => option.value === value) ?? {
    value,
    label: value,
    icon: Bell,
    color: "bg-gray-100 text-gray-700 border-gray-200",
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

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color = "red",
  isPageLoaded = false,
  delay = 0
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "red" | "emerald" | "amber" | "purple" | "blue";
  isPageLoaded?: boolean;
  delay?: number;
}) {
  const colorClasses = {
    red: "from-red-600 to-red-700",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    purple: "from-purple-500 to-violet-500",
    blue: "from-blue-500 to-cyan-500",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${colorClasses[color]}`}></div>
      <div className="relative flex items-center justify-between gap-3">
        <div className={`rounded-xl bg-gradient-to-r ${colorClasses[color]} p-2 text-white shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-600 truncate">{label}</div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
          {subtitle && <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>}
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
  const [isPageLoaded, setIsPageLoaded] = useState(false);
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
    setIsPageLoaded(true);
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

  const statsList = [
    {
      icon: <Inbox size={20} />,
      label: "Tổng thông báo",
      value: stats.notifications,
      subtitle: "Toàn hệ thống",
      color: "red" as const,
      delay: 100
    },
    {
      icon: <Bell size={20} />,
      label: "Chưa đọc",
      value: stats.unread,
      subtitle: "Cần xử lý",
      color: "amber" as const,
      delay: 150
    },
    {
      icon: <Megaphone size={20} />,
      label: "Campaign",
      value: stats.campaigns,
      subtitle: `Hôm nay: ${stats.sentToday}`,
      color: "purple" as const,
      delay: 200
    },
    {
      icon: <Layers size={20} />,
      label: "Template",
      value: stats.templates,
      subtitle: "Sẵn sàng sử dụng",
      color: "blue" as const,
      delay: 250
    },
    {
      icon: <Send size={20} />,
      label: "Đã gửi hôm nay",
      value: stats.sentToday,
      subtitle: "Broadcast",
      color: "emerald" as const,
      delay: 300
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Megaphone size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Bảng điều phối thông báo
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý tập trung tất cả thông báo nội bộ, tạo broadcast và xây dựng thư viện template
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer">
            <Download size={16} /> Xuất báo cáo
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer">
            <UserPlus size={16} /> Tạo thông báo mới
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsList.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            subtitle={stat.subtitle}
            color={stat.color}
            isPageLoaded={isPageLoaded}
            delay={stat.delay}
          />
        ))}
      </div>

      {/* FCM Permission Card */}
      <div className={`transition-all duration-700 delay-350 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <FcmPermissionCard role="Staff_Manager" />
      </div>

      {/* Tabs */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-1 shadow-sm transition-all duration-700 delay-400 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-medium transition-all cursor-pointer ${isActive
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                    : "text-gray-600 hover:bg-red-50"
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
          <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-450 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Danh sách thông báo</h2>
                  <p className="text-sm text-gray-600 mt-1">Theo dõi và xử lý inbox nội bộ</p>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm thông báo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-64 rounded-xl border border-red-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setMessageFilter("all")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all cursor-pointer ${messageFilter === "all"
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                      : "border border-red-200 bg-white text-gray-700 hover:bg-red-50"
                    }`}
                >
                  Tất cả{" "}
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${messageFilter === "all" ? "bg-white/20" : "bg-gray-100"
                    }`}>
                    {notifications.length}
                  </span>
                </button>
                <button
                  onClick={() => setMessageFilter("unread")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all cursor-pointer ${messageFilter === "unread"
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                      : "border border-red-200 bg-white text-gray-700 hover:bg-red-50"
                    }`}
                >
                  Chưa đọc{" "}
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${messageFilter === "unread" ? "bg-white/20" : "bg-gray-100"
                    }`}>
                    {unreadCount}
                  </span>
                </button>
                <button
                  onClick={() => void markAllAsRead()}
                  className="rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg flex items-center gap-2 cursor-pointer"
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
                        className={`group relative overflow-hidden rounded-xl border-2 p-5 transition-all hover:shadow-md ${item.read
                            ? "border-red-100 bg-white"
                            : "border-red-300 bg-gradient-to-r from-red-50/50 to-white"
                          }`}
                      >
                        {!item.read && (
                          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-red-600 to-red-700" />
                        )}
                        <div className="flex items-start gap-4">
                          <div className={`rounded-xl p-3 ${kindMeta.color}`}>
                            <KindIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                              {!item.read && (
                                <span className="rounded-full bg-gradient-to-r from-red-600 to-red-700 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                                  Mới
                                </span>
                              )}
                              <span className={`rounded-full px-2.5 py-1 text-xs ${kindMeta.color}`}>
                                {kindMeta.label}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-2">{item.message}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
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
                                className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md cursor-pointer"
                              >
                                Đã đọc
                              </button>
                            ) : null}
                            <button
                              onClick={() => void removeOne(item.id)}
                              className="rounded-xl border border-red-200 bg-white p-2 text-gray-400 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 cursor-pointer"
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
                  <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50/30 px-6 py-16 text-center">
                    <Inbox className="mx-auto h-12 w-12 text-red-300" />
                    <p className="mt-4 text-sm text-gray-500">Không có thông báo nào</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mẹo xử lý & Thống kê nhanh */}
          <div className="space-y-6">
            {/* Thống kê nhanh */}
            <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-sm transition-all duration-700 delay-500 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-600" />
                Thống kê nhanh
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-100">
                  <span className="text-sm text-gray-600">Tỷ lệ đọc</span>
                  <span className="font-semibold text-gray-900">
                    {notifications.length ? Math.round(((notifications.length - unreadCount) / notifications.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-100">
                  <span className="text-sm text-gray-600">Phản hồi trung bình</span>
                  <span className="font-semibold text-gray-900">2.4 giờ</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-100">
                  <span className="text-sm text-gray-600">Campaign active</span>
                  <span className="font-semibold text-gray-900">{campaigns.length}</span>
                </div>
              </div>
            </div>

            {/* Mẹo xử lý */}
            <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-2 shadow-sm">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Mẹo xử lý</h2>
                  <p className="text-sm text-gray-600">Tối ưu quy trình làm việc</p>
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
                      className="group rounded-xl border border-red-200 bg-white p-4 transition-all hover:border-red-300 hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-gradient-to-r from-red-50 to-red-100 p-2">
                          <Icon className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="mt-1 text-sm text-gray-600">{item.description}</p>
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
          <div
            ref={formRef}
            className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-450 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-2 shadow-sm">
                    <BellRing className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Tạo broadcast</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Soạn nội dung và gửi tới đúng nhóm nhận
                    </p>
                  </div>
                </div>
                {activeTemplate && (
                  <div className="rounded-xl bg-white px-4 py-3 border border-red-200 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Bookmark className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Đang dùng:</span>
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs border border-red-200">
                        {activeTemplate.code}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
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
                      className="h-11 w-full rounded-xl border border-red-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    >
                      {AUDIENCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">{selectedAudience.hint}</p>
                  </div>

                  {/* Kind Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Loại</label>
                    <select
                      value={kind}
                      onChange={(event) => setKind(event.target.value as NotificationKind)}
                      className="h-11 w-full rounded-xl border border-red-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
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
                      className="h-11 w-full rounded-xl border border-red-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    >
                      {CHANNEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">{selectedChannel.hint}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-11 w-full rounded-xl border border-red-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="Nhập tiêu đề thông báo..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nội dung</label>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="Nhập nội dung broadcast..."
                  />
                </div>

                <button
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
          </div>

          {/* Preview và Templates */}
          <div className="space-y-6">
            {/* Preview Card */}
            <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-sm transition-all duration-700 delay-500 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-2 shadow-sm">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Preview</h2>
                  <p className="text-sm text-gray-600">Xem trước nội dung</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-red-200 bg-white p-5">
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl p-3 ${selectedKind.color}`}>
                    <KindIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {title.trim() || "Tiêu đề sẽ hiển thị ở đây"}
                      </h3>
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-gray-600 border border-red-200">
                        <ChannelIcon className="h-3 w-3" />
                        {selectedChannel.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      {message.trim() || "Nội dung preview sẽ hiển thị tại đây..."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`rounded-full bg-gradient-to-r ${selectedAudience.color} px-3 py-1 text-xs text-white shadow-sm`}>
                        {selectedAudience.label}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs border ${selectedKind.color}`}>
                        {selectedKind.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Templates nhanh */}
            <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-sm transition-all duration-700 delay-550 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-2 shadow-sm">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Template nhanh</h2>
                  <p className="text-sm text-gray-600">Sử dụng template có sẵn</p>
                </div>
              </div>

              <div className="space-y-3">
                {templates.slice(0, 3).length ? (
                  templates.slice(0, 3).map((template) => (
                    <div
                      key={template.id}
                      className="group relative rounded-xl border border-red-200 bg-white p-4 transition-all hover:border-red-300 hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{template.title}</h3>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{template.content}</p>
                        </div>
                        <button
                          onClick={() => applyTemplate(template)}
                          className="ml-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 p-2 text-white opacity-0 shadow-sm transition-all group-hover:opacity-100 cursor-pointer"
                        >
                          <CornerUpLeft className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-gray-600 border border-red-200">
                          {template.code}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-red-200 py-8 text-center">
                    <Layers className="mx-auto h-8 w-8 text-red-300" />
                    <p className="mt-2 text-sm text-gray-500">Chưa có template nào</p>
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
          <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-450 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-2 shadow-sm">
                  <PlusCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Tạo template mới</h2>
                  <p className="text-sm text-gray-600 mt-1">Lưu mẫu để sử dụng nhanh</p>
                </div>
              </div>
            </div>

            <div className="p-6">
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
                    className="h-11 w-full rounded-xl border border-red-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="VD: SESSION_REMINDER"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                  <input
                    value={templateTitle}
                    onChange={(event) => setTemplateTitle(event.target.value)}
                    className="h-11 w-full rounded-xl border border-red-200 bg-white px-4 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="Nhập tiêu đề template"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nội dung</label>
                  <textarea
                    value={templateContent}
                    onChange={(event) => setTemplateContent(event.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="Nhập nội dung template"
                  />
                </div>

                <button
                  onClick={() => void handleCreateTemplate()}
                  disabled={isSavingTemplate}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingTemplate ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
          </div>

          {/* Thư viện template */}
          <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-500 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-2 shadow-sm">
                  <Bookmark className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Thư viện template</h2>
                  <p className="text-sm text-gray-600 mt-1">Quản lý các mẫu có sẵn</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {templates.length ? (
                  templates.map((template) => {
                    const isActive = template.id === activeTemplateId;
                    const channelMeta = getChannelMeta(template.channel as NotificationChannel);
                    const ChannelIcon = channelMeta.icon;

                    return (
                      <article
                        key={template.id}
                        className={`group rounded-xl border-2 p-5 transition-all hover:shadow-md ${isActive
                            ? "border-red-300 bg-gradient-to-r from-red-50/50 to-white"
                            : "border-red-100 bg-white hover:border-red-200"
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900">{template.title}</h3>
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-gray-600 border border-red-200">
                                {template.code}
                              </span>
                              {template.channel && (
                                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-gray-600 border border-red-200">
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
                              className="rounded-lg bg-gradient-to-r from-red-600 to-red-700 p-2 text-white opacity-0 shadow-sm transition-all group-hover:opacity-100 cursor-pointer"
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
                              className="rounded-lg border border-red-200 bg-white p-2 text-gray-400 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 cursor-pointer"
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
                  <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50/30 px-6 py-16 text-center">
                    <Layers className="mx-auto h-12 w-12 text-red-300" />
                    <p className="mt-4 text-sm text-gray-500">Chưa có template nào</p>
                    <p className="text-xs text-gray-500 mt-1">Tạo template mới để bắt đầu</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}