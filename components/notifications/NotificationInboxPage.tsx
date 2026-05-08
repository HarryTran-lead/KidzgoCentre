"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  CheckCheck,
  Info,
  MessageSquare,
  Receipt,
  RotateCcw,
  School,
  Trash2,
} from "lucide-react";
import type { Role } from "@/lib/role";
import { ROLE_LABEL } from "@/lib/role";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import type { NotificationKind } from "@/types/notification";
import FcmPermissionCard from "@/components/notifications/FcmPermissionCard";
import ConfirmModal from "@/components/ConfirmModal";
import { trackNotificationTelemetry } from "@/lib/telemetry/notificationTelemetry";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";

type UiNotification = {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  priority: "low" | "medium" | "high";
  createdAt: string;
  read: boolean;
  senderRole: Role;
  senderName: string;
  link?: string;
};

function kindLabel(kind: NotificationKind, isEn: boolean) {
  switch (kind) {
    case "payment":
      return isEn ? "Finance" : "Tài chính";
    case "report":
      return isEn ? "Report" : "Báo cáo";
    case "schedule":
      return isEn ? "Schedule" : "Lịch học";
    case "homework":
      return isEn ? "Homework" : "Bài tập";
    case "feedback":
      return isEn ? "Feedback" : "Góp ý";
    case "event":
      return isEn ? "Event" : "Sự kiện";
    default:
      return isEn ? "System" : "Hệ thống";
  }
}

function kindIcon(kind: NotificationKind) {
  switch (kind) {
    case "payment":
      return Receipt;
    case "report":
      return School;
    case "schedule":
      return Calendar;
    case "homework":
    case "feedback":
      return MessageSquare;
    default:
      return Info;
  }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function NotificationCard({
  item,
  isEn,
  tr,
  onRead,
  onRetry,
  onRemove,
}: {
  item: UiNotification;
  isEn: boolean;
  tr: (vi: string, en: string) => string;
  onRead: () => void;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const Icon = kindIcon(item.kind);

  return (
    <article
      className={`rounded-2xl backdrop-blur-xl border p-4 shadow-lg transition-all duration-300 cursor-pointer group hover:border-white/40 ${
        item.read 
          ? "bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10" 
          : "bg-gradient-to-br from-indigo-600/30 via-purple-600/30 to-pink-600/30 border-white/20 hover:shadow-purple-500/30"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 text-white shrink-0 shadow-lg shadow-purple-500/30">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{item.title}</h3>
            {!item.read && (
              <span className="rounded-full bg-indigo-500/30 px-2.5 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/50">
                {tr("Mới", "New")}
              </span>
            )}
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-indigo-200/80 border border-white/20">
              {kindLabel(item.kind, isEn)}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-white/80">{item.message}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-indigo-200/60">
            <span>{formatTime(item.createdAt)}</span>
            <span>{tr("Từ", "From")}: {item.senderName}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!item.read && (
            <button
              onClick={onRead}
              className="rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/40 hover:border-emerald-300 cursor-pointer backdrop-blur-sm"
            >
              {tr("Đã đọc", "Mark read")}
            </button>
          )}
          <button
            onClick={onRetry}
            className="rounded-lg border border-blue-400/50 bg-blue-500/20 p-1.5 text-blue-300 transition hover:bg-blue-500/40 hover:border-blue-300 cursor-pointer backdrop-blur-sm"
            aria-label={tr("Thử gửi lại thông báo", "Retry notification")}
            title={tr("Thử gửi lại", "Retry")}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="rounded-lg border border-red-400/50 bg-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/40 hover:border-red-300 cursor-pointer backdrop-blur-sm"
            aria-label={tr("Xóa thông báo", "Delete notification")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function NotificationInboxPage({ role }: { role: Role }) {
  const pathname = usePathname();
  const isEn = pathname?.split("/")[1] === "en";
  const tr = (vi: string, en: string) => (isEn ? en : vi);

  const { notifications, unreadCount, markAsRead, markAllAsRead, removeOne, retryOne } =
    useNotifications(role);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [kindFilter, setKindFilter] = useState<"all" | NotificationKind>("all");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<UiNotification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const resolveErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

  const handleMarkAsRead = async (item: UiNotification) => {
    try {
      await markAsRead(item.id);
      toast.success({
        title: tr("Đã cập nhật trạng thái thông báo", "Notification status updated"),
        description: tr(
          `Tiêu đề: ${item.title}. Người gửi: ${item.senderName}. Thời gian: ${formatTime(item.createdAt)}.`,
          `Title: ${item.title}. Sender: ${item.senderName}. Time: ${formatTime(item.createdAt)}.`
        ),
      });
      trackNotificationTelemetry("notification_mark_read", {
        role,
        notificationId: item.id,
        notificationTitle: item.title,
      });
    } catch (error) {
      toast.destructive({
        title: tr("Không thể đánh dấu đã đọc", "Cannot mark as read"),
        description: resolveErrorMessage(error, `Thông báo: ${item.title}. Vui lòng thử lại.`),
      });
    }
  };

  const handleRemove = async (item: UiNotification) => {
    setPendingDeleteItem(item);
  };

  const handleRetry = async (item: UiNotification) => {
    try {
      await retryOne(item.id);
      toast.success({
        title: tr("Đã gửi lại thông báo", "Retry requested"),
        description: tr(
          `Tiêu đề: ${item.title}. Người gửi: ${item.senderName}. Hệ thống đã nhận yêu cầu retry.`,
          `Retry has been requested for ${item.title} from ${item.senderName}.`
        ),
      });
      trackNotificationTelemetry("notification_retry", {
        role,
        notificationId: item.id,
        notificationTitle: item.title,
      });
    } catch (error) {
      toast.destructive({
        title: tr("Không thể gửi lại thông báo", "Cannot retry notification"),
        description: resolveErrorMessage(error, `Không thể retry cho thông báo: ${item.title}.`),
      });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteItem) {
      return;
    }

    setIsDeleting(true);
    try {
      await removeOne(pendingDeleteItem.id);
      toast.success({
        title: tr("Đã xóa thông báo", "Notification deleted"),
        description: tr(
          `Đã xóa: ${pendingDeleteItem.title}. Người gửi: ${pendingDeleteItem.senderName}.`,
          `Deleted: ${pendingDeleteItem.title}. Sender: ${pendingDeleteItem.senderName}.`
        ),
      });
      trackNotificationTelemetry("notification_delete", {
        role,
        notificationId: pendingDeleteItem.id,
        notificationTitle: pendingDeleteItem.title,
      });
      setPendingDeleteItem(null);
    } catch (error) {
      toast.destructive({
        title: tr("Không thể xóa thông báo", "Cannot delete notification"),
        description: resolveErrorMessage(
          error,
          `Thông báo: ${pendingDeleteItem.title}. Vui lòng thử lại.`
        ),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter((item) => !item.read);

    if (!unreadItems.length) {
      toast.info({
        title: tr("Không có thông báo chưa đọc", "No unread notifications"),
        description: tr(
          "Tất cả thông báo hiện đã ở trạng thái đã đọc.",
          "All notifications are already marked as read."
        ),
      });
      return;
    }

    try {
      await markAllAsRead();
      toast.success({
        title: tr("Đã đánh dấu tất cả là đã đọc", "All notifications marked as read"),
        description: tr(
          `Đã cập nhật ${unreadItems.length} thông báo cho ${ROLE_LABEL[role].toLowerCase()}.`,
          `Updated ${unreadItems.length} notifications for ${ROLE_LABEL[role].toLowerCase()}.`
        ),
      });
      trackNotificationTelemetry("notification_mark_all_read", {
        role,
        unreadCountBeforeAction: unreadItems.length,
      });
    } catch (error) {
      toast.destructive({
        title: tr("Không thể cập nhật tất cả thông báo", "Cannot update all notifications"),
        description: resolveErrorMessage(error, "Vui lòng thử lại sau ít phút."),
      });
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    let result = notifications;

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.message.toLowerCase().includes(searchLower) ||
        item.senderName.toLowerCase().includes(searchLower) ||
        kindLabel(item.kind, isEn).toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filter === "unread") {
      result = result.filter(item => !item.read);
    }

    // Kind filter
    if (kindFilter !== "all") {
      result = result.filter(item => item.kind === kindFilter);
    }

    return result;
  }, [notifications, debouncedSearch, filter, kindFilter, isEn]);

  // Set page loaded state on mount
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 p-4 md:p-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <FcmPermissionCard role={role} />

        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-purple-500/30">
              <Bell size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                {tr("Trung tâm thông báo", "Notification Center")}
              </h1>
              <p className="text-indigo-200/80 text-sm">
                {tr("Quản lý tất cả thông báo của", "Manage all notifications for")} {ROLE_LABEL[role].toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={() => void handleMarkAllAsRead()}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 text-sm border-2 border-transparent hover:shadow-lg hover:shadow-purple-500/50 shadow-lg shadow-purple-500/30"
          >
            <CheckCheck size={18} />
            {tr("Đánh dấu tất cả", "Mark all")}
          </button>
        </div>

        {/* Statistics */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600/40 to-purple-600/40 backdrop-blur-xl border border-white/20 p-4 hover:border-white/40 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl grid place-items-center bg-indigo-500/30"><Bell size={18} className="text-indigo-300" /></span>
              <div>
                <div className="text-sm text-indigo-200/80">{tr("Tổng thông báo", "Total notifications")}</div>
                <div className="text-2xl font-extrabold text-white">{notifications.length}</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-xl border border-white/20 p-4 hover:border-white/40 transition-all hover:shadow-xl hover:shadow-purple-500/20">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl grid place-items-center bg-purple-500/30"><Bell size={18} className="text-purple-300" /></span>
              <div>
                <div className="text-sm text-purple-200/80">{tr("Chưa đọc", "Unread")}</div>
                <div className="text-2xl font-extrabold text-white">{unreadCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-2xl bg-gradient-to-br from-indigo-600/30 via-purple-600/30 to-pink-600/30 backdrop-blur-xl border border-white/20 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={tr("Tìm kiếm theo tiêu đề, nội dung, tác giả...", "Search by title, content, sender...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/50 transition-all backdrop-blur-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3">
              <Select value={filter} onValueChange={(value) => setFilter(value as "all" | "unread")}>
                <SelectTrigger className="w-auto min-w-max rounded-xl h-10 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value="all">{tr("Tất cả", "All")} ({notifications.length})</SelectItem>
                  <SelectItem value="unread">{tr("Chưa đọc", "Unread")} ({unreadCount})</SelectItem>
                </SelectContent>
              </Select>
              <Select value={kindFilter} onValueChange={(value) => setKindFilter(value as "all" | NotificationKind)}>
                <SelectTrigger className="w-auto min-w-max rounded-xl h-10 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value="all">{tr("Tất cả loại", "All types")}</SelectItem>
                  <SelectItem value="system">{kindLabel("system", isEn)}</SelectItem>
                  <SelectItem value="schedule">{kindLabel("schedule", isEn)}</SelectItem>
                  <SelectItem value="report">{kindLabel("report", isEn)}</SelectItem>
                  <SelectItem value="payment">{kindLabel("payment", isEn)}</SelectItem>
                  <SelectItem value="homework">{kindLabel("homework", isEn)}</SelectItem>
                  <SelectItem value="feedback">{kindLabel("feedback", isEn)}</SelectItem>
                  <SelectItem value="event">{kindLabel("event", isEn)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className={`rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gradient-to-r from-indigo-600/40 to-purple-600/40 border-b border-white/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{tr("Danh sách thông báo", "Notification list")}</h2>
              <span className="text-sm text-indigo-200/80 font-medium">{filtered.length} {tr("thông báo", "notifications")}</span>
            </div>
          </div>
          <div className="space-y-3 p-5">
            {filtered.length ? (
              filtered.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  isEn={isEn}
                  tr={tr}
                  onRead={() => void handleMarkAsRead(item)}
                  onRetry={() => void handleRetry(item)}
                  onRemove={() => void handleRemove(item)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 px-6 py-14 text-center">
                <Bell className="mx-auto h-10 w-10 text-indigo-300/40" />
                <h2 className="mt-4 text-lg font-semibold text-white">{tr("Không có thông báo phù hợp", "No matching notifications")}</h2>
                <p className="mt-2 text-sm text-indigo-200/60">
                  {tr("Thay đổi bộ lọc hoặc chờ thông báo mới", "Change filters or wait for new notifications")}
                </p>
              </div>
            )}
          </div>
        </div>

        <ConfirmModal
          isOpen={Boolean(pendingDeleteItem)}
          onClose={() => setPendingDeleteItem(null)}
          onConfirm={() => {
            void confirmDelete();
          }}
          title={tr("Xác nhận xóa thông báo", "Confirm notification deletion")}
          message={
            pendingDeleteItem
              ? tr(
                  `Bạn có chắc muốn xóa thông báo \"${pendingDeleteItem.title}\" từ ${pendingDeleteItem.senderName} không? Hành động này không thể hoàn tác.`,
                  `Do you want to delete notification \"${pendingDeleteItem.title}\" from ${pendingDeleteItem.senderName}? This action cannot be undone.`
                )
              : ""
          }
          confirmText={tr("Xóa thông báo", "Delete notification")}
          cancelText={tr("Giữ lại", "Keep")}
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
