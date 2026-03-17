"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  CopyPlus,
  CornerUpLeft,
  Eye,
  FileText,
  LayoutTemplate,
  Megaphone,
  Send,
  Sparkles,
  Trash2,
  Users,
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

const AUDIENCE_OPTIONS: { value: NotificationAudience; label: string; hint: string }[] = [
  { value: "all", label: "Tất cả role", hint: "Gửi toàn hệ thống" },
  { value: "family", label: "Parent + Student", hint: "Khối gia đình và học viên" },
  { value: "teaching", label: "Teacher", hint: "Đội ngũ giảng dạy" },
  { value: "management", label: "Staff Manager + Accountant", hint: "Khối vận hành nội bộ" },
  { value: "Parent", label: "Chỉ Parent", hint: "Chỉ phụ huynh" },
  { value: "Student", label: "Chỉ Student", hint: "Chỉ học viên" },
  { value: "Teacher", label: "Chỉ Teacher", hint: "Chỉ giáo viên" },
];

const KIND_OPTIONS: { value: NotificationKind; label: string }[] = [
  { value: "system", label: "Hệ thống" },
  { value: "schedule", label: "Lịch học" },
  { value: "report", label: "Báo cáo" },
  { value: "payment", label: "Tài chính" },
  { value: "homework", label: "Bài tập" },
  { value: "feedback", label: "Góp ý" },
  { value: "event", label: "Sự kiện" },
];

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string; hint: string }[] = [
  { value: "InApp", label: "In-app", hint: "Hiển thị trong inbox nội bộ" },
  { value: "Push", label: "Push", hint: "Thiết bị đã đăng ký FCM" },
  { value: "Email", label: "Email", hint: "Gửi qua email" },
  { value: "ZaloOa", label: "Zalo OA", hint: "Kênh Zalo Official Account" },
];

const TABS = [
  { id: "list", label: "Danh sách thông báo", icon: Bell },
  { id: "compose", label: "Tạo broadcast", icon: Megaphone },
  { id: "templates", label: "Tạo template", icon: LayoutTemplate },
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
  return AUDIENCE_OPTIONS.find((option) => option.value === value) ?? { value, label: value, hint: "" };
}

function getKindLabel(value: NotificationKind) {
  return KIND_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getChannelMeta(value: NotificationChannel) {
  return CHANNEL_OPTIONS.find((option) => option.value === value) ?? { value, label: value, hint: "" };
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
  const selectedChannel = getChannelMeta(channel);
  const activeTemplate = templates.find((template) => template.id === activeTemplateId) ?? null;
  const filteredNotifications =
    messageFilter === "unread" ? notifications.filter((item) => !item.read) : notifications;

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
    <div className="space-y-6">
      <FcmPermissionCard role="Staff_Manager" />
      <section className="rounded-[28px] border border-rose-200 bg-gradient-to-br from-white via-white to-rose-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
              <Megaphone className="h-3.5 w-3.5" />
              Notifications
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">Bảng điều phối thông báo cho staff</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Chia rõ 3 tab theo công việc: xem inbox nội bộ, tạo broadcast và quản lý template.
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">Tổng thông báo</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{stats.notifications}</div>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-sm text-rose-600">Chưa đọc</div>
              <div className="mt-2 text-2xl font-bold text-rose-700">{stats.unread}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">Campaign</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{stats.campaigns}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">Template</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{stats.templates}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "list" ? (
        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Danh sách thông báo nội bộ</h2>
                <p className="mt-1 text-sm text-slate-500">Theo dõi inbox của role staff manager.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMessageFilter("all")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    messageFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Tất cả ({notifications.length})
                </button>
                <button
                  onClick={() => setMessageFilter("unread")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    messageFilter === "unread" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  Chưa đọc ({unreadCount})
                </button>
                <button
                  onClick={() => {
                    void markAllAsRead();
                  }}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
                >
                  Đánh dấu tất cả
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filteredNotifications.length ? (
                filteredNotifications.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-3xl border p-5 shadow-sm transition ${
                      item.read ? "border-slate-200 bg-white" : "border-rose-200 bg-rose-50/40"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-slate-900 p-3 text-white">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                          {!item.read ? (
                            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                              Mới
                            </span>
                          ) : null}
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                            {getKindLabel(item.kind)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{item.message}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>{formatTime(item.createdAt)}</span>
                          <span>Từ: {item.senderName}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {!item.read ? (
                          <button
                            onClick={() => {
                              void markAsRead(item.id);
                            }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Đã đọc
                          </button>
                        ) : null}
                        <button
                          onClick={() => {
                            void removeOne(item.id);
                          }}
                          className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                          aria-label="Xóa thông báo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
                  Không có thông báo phù hợp.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Mẹo xử lý</h2>
                <p className="text-sm text-slate-500">Giúp staff thao tác inbox nhanh hơn.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Đánh dấu đã đọc ngay sau khi xử lý để tránh sót việc.",
                "Nếu cùng một nội dung phải gửi lặp lại, tạo template để dùng lại.",
                "Broadcast nên được soạn ở tab Tạo broadcast để có preview trước khi gửi.",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "compose" ? (
        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div ref={formRef} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-900 p-3 text-white">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Tạo broadcast</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Soạn nội dung và gửi tới đúng nhóm nhận. Có thể dùng template để nạp nhanh.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {activeTemplate ? `Đang dùng template: ${activeTemplate.code ?? "Không mã"}` : "Đang soạn thủ công"}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {submitError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              ) : null}
              {submitSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {submitSuccess}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Audience</span>
                  <select
                    value={audience}
                    onChange={(event) => setAudience(event.target.value as NotificationAudience)}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-rose-300"
                  >
                    {AUDIENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500">{selectedAudience.hint}</span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Loại</span>
                  <select
                    value={kind}
                    onChange={(event) => setKind(event.target.value as NotificationKind)}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-rose-300"
                  >
                    {KIND_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Kênh</span>
                  <select
                    value={channel}
                    onChange={(event) => setChannel(event.target.value as NotificationChannel)}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-rose-300"
                  >
                    {CHANNEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500">{selectedChannel.hint}</span>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Tiêu đề</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-rose-300"
                  placeholder="Ví dụ: Trung tâm nghỉ lễ 30/4"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Nội dung</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-[180px] rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-rose-300"
                  placeholder="Nhập nội dung broadcast..."
                />
              </label>

              <button
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Đang gửi..." : "Gửi broadcast"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Preview</h2>
                  <p className="text-sm text-slate-500">Xem nội dung trước khi gửi.</p>
                </div>
              </div>
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-rose-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-slate-900 p-3 text-white">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {title.trim() || "Tiêu đề sẽ hiển thị ở đây"}
                      </h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">
                        {selectedChannel.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {message.trim() || "Nội dung preview sẽ thay đổi theo phần đang soạn."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-white px-2.5 py-1">Nhóm nhận: {selectedAudience.label}</span>
                      <span className="rounded-full bg-white px-2.5 py-1">Loại: {getKindLabel(kind)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-900 p-3 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Template dùng nhanh</h2>
                  <p className="text-sm text-slate-500">Nạp từ thư viện mà không cần đổi tab sâu.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {templates.slice(0, 4).length ? (
                  templates.slice(0, 4).map((template) => (
                    <div key={template.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{template.title}</h3>
                        <span className="rounded-full bg-white px-2 py-1 text-[11px] text-slate-600">
                          {template.code}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{template.content}</p>
                      <button
                        onClick={() => applyTemplate(template)}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        <CornerUpLeft className="h-4 w-4" />
                        Dùng template
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    Chưa có template nào.
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      ) : null}

      {activeTab === "templates" ? (
        <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <CopyPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Tạo template</h2>
                <p className="text-sm text-slate-500">Lưu mẫu chuẩn để staff dùng lại nhanh hơn.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {templateError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {templateError}
                </div>
              ) : null}

              <input
                value={templateCode}
                onChange={(event) => setTemplateCode(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-rose-300"
                placeholder="Code: SESSION_REMINDER_24H"
              />
              <input
                value={templateTitle}
                onChange={(event) => setTemplateTitle(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-rose-300"
                placeholder="Tiêu đề template"
              />
              <textarea
                value={templateContent}
                onChange={(event) => setTemplateContent(event.target.value)}
                className="min-h-[180px] rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-rose-300"
                placeholder="Nội dung template"
              />
              <button
                onClick={() => {
                  void handleCreateTemplate();
                }}
                disabled={isSavingTemplate}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText className="h-4 w-4" />
                {isSavingTemplate ? "Đang lưu..." : "Lưu template"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Thư viện template</h2>
                <p className="text-sm text-slate-500">Quản lý mẫu nội dung và nạp lại vào broadcast.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {templates.length ? (
                templates.map((template) => {
                  const isActive = template.id === activeTemplateId;
                  return (
                    <article
                      key={template.id}
                      className={`rounded-[26px] border px-5 py-4 transition ${
                        isActive
                          ? "border-rose-300 bg-rose-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">{template.title}</h3>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">
                              {template.code}
                            </span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">
                              {template.channel}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-600">{template.content}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <button
                            onClick={() => applyTemplate(template)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            <CornerUpLeft className="h-4 w-4" />
                            Dùng template
                          </button>
                          <button
                            onClick={async () => {
                              await deleteNotificationTemplate(template.id);
                              if (template.id === activeTemplateId) {
                                setActiveTemplateId(null);
                              }
                              await refreshTemplates();
                            }}
                            className="rounded-xl border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                            aria-label="Xóa template"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[26px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                  Chưa có template nào.
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
