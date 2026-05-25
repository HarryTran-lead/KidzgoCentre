"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  Calendar,
  CheckCheck,
  Info,
  MessageSquare,
  Receipt,
  RotateCcw,
  School,
  Trash2,
  Sparkles,
  Search,
  CheckCircle,
  XCircle,
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

type SortField = "title" | "kind" | "senderName" | "createdAt" | "read";
type SortDirection = "asc" | "desc" | null;

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

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Admin Notification Card (Light theme)
function AdminNotificationCard({
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
  const IconComponent = kindIcon(item.kind);

  return (
    <article className={`group rounded-xl border transition-all duration-200 hover:shadow-md ${
      item.read 
        ? "border-gray-200 bg-white hover:border-gray-300" 
        : "border-red-200 bg-red-50/30 hover:border-red-300 hover:shadow-red-100"
    }`}>
      <div className="flex items-start gap-4 p-4">
        <div className={`rounded-lg p-2.5 shrink-0 ${
          item.read
            ? "bg-gray-100 text-gray-500"
            : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
        }`}>
          <IconComponent className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-semibold ${item.read ? "text-gray-700" : "text-gray-900"}`}>
              {item.title}
            </h3>
            {!item.read && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {tr("Mới", "New")}
              </span>
            )}
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium border ${
              item.read
                ? "bg-gray-100 text-gray-600 border-gray-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {kindLabel(item.kind, isEn)}
            </span>
          </div>

          <p className={`mt-2 text-sm leading-relaxed ${item.read ? "text-gray-600" : "text-gray-700"}`}>
            {item.message}
          </p>

          <div className={`mt-2 flex flex-wrap items-center gap-3 text-xs ${item.read ? "text-gray-500" : "text-red-600/70"}`}>
            <span>{formatTime(item.createdAt)}</span>
            <span>{tr("Từ", "From")}: {item.senderName}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!item.read && (
            <button
              onClick={onRead}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
            >
              {tr("Đã đọc", "Mark read")}
            </button>
          )}
          <button
            onClick={onRetry}
            className="rounded-lg p-1.5 transition-all cursor-pointer text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300"
            aria-label={tr("Thử gửi lại thông báo", "Retry notification")}
            title={tr("Thử gửi lại", "Retry")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="rounded-lg p-1.5 transition-all cursor-pointer text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300"
            aria-label={tr("Xóa thông báo", "Delete notification")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

// Student Notification Card (Dark theme)
function StudentNotificationCard({
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
  const IconComponent = kindIcon(item.kind);

  return (
    <article className={`rounded-2xl border p-4 shadow-lg transition-all duration-300 cursor-pointer group ${
      item.read 
        ? "bg-gray-800/50 to-gray-900/50 border-white/10 hover:border-white/40" 
        : "bg-indigo-600/30 via-purple-600/30 to-pink-600/30 border-white/20 hover:shadow-purple-500/30 hover:border-white/40"
    }`}>
      <div className="flex items-start gap-4">
        <div className="rounded-xl p-2.5 text-white shrink-0 shadow-lg bg-indigo-500 to-purple-500 shadow-purple-500/30">
          <IconComponent className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{item.title}</h3>
            {!item.read && (
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold border bg-indigo-500/30 text-indigo-200 border-indigo-400/50">
                {tr("Mới", "New")}
              </span>
            )}
            <span className="rounded-full px-2.5 py-1 text-xs border bg-white/10 text-indigo-200/80 border-white/20">
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
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer backdrop-blur-sm border border-emerald-400/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/40 hover:border-emerald-300"
            >
              {tr("Đã đọc", "Mark read")}
            </button>
          )}
          <button
            onClick={onRetry}
            className="rounded-lg p-1.5 transition cursor-pointer backdrop-blur-sm border border-blue-400/50 bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 hover:border-blue-300"
            aria-label={tr("Thử gửi lại thông báo", "Retry notification")}
            title={tr("Thử gửi lại", "Retry")}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="rounded-lg p-1.5 transition cursor-pointer backdrop-blur-sm border border-red-400/50 bg-red-500/20 text-red-300 hover:bg-red-500/40 hover:border-red-300"
            aria-label={tr("Xóa thông báo", "Delete notification")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

// Modern Stat Card Component (for Admin only)
function ModernStatCard({
  icon,
  title,
  value,
  subtitle,
  color = "red"
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color?: "red" | "gray" | "black" | "green";
}) {
  const iconBgClasses = {
    red: "from-red-600 to-red-700",
    gray: "from-gray-600 to-gray-700",
    black: "from-gray-800 to-gray-900",
    green: "from-emerald-600 to-teal-600",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700"></div>
      <div className="relative flex items-center gap-3">
        <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBgClasses[color]} grid place-items-center`}>
          <span className="text-white">{icon}</span>
        </span>
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-2xl font-extrabold text-gray-900">{value}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

// Student Stat Card
function StudentStatCard({
  icon,
  title,
  value,
  color = "indigo"
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  color?: "indigo" | "purple";
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-4 hover:border-white/40 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 rounded-xl grid place-items-center ${color === "indigo" ? "bg-indigo-500/30" : "bg-purple-500/30"}`}>
          <span className={color === "indigo" ? "text-indigo-300" : "text-purple-300"}>{icon}</span>
        </span>
        <div>
          <div className="text-sm text-indigo-200/80">{title}</div>
          <div className="text-2xl font-extrabold text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationInboxPage({ role }: { role: Role }) {
  const pathname = usePathname();
  const isEn = pathname?.split("/")[1] === "en";
  const tr = (vi: string, en: string) => (isEn ? en : vi);
  const isAdmin = role === "Admin";

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
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const resolveErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

  const handleMarkAsRead = async (item: UiNotification) => {
    try {
      await markAsRead(item.id);
      toast.success({
        title: tr("Đã cập nhật trạng thái thông báo", "Notification status updated"),
        description: tr(
          `Tiêu đề: ${item.title}. Người gửi: ${item.senderName}.`,
          `Title: ${item.title}. Sender: ${item.senderName}.`
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
    if (!pendingDeleteItem) return;

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
          `Đã cập nhật ${unreadItems.length} thông báo.`,
          `Updated ${unreadItems.length} notifications.`
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

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.message.toLowerCase().includes(searchLower) ||
        item.senderName.toLowerCase().includes(searchLower) ||
        kindLabel(item.kind, isEn).toLowerCase().includes(searchLower)
      );
    }

    if (filter === "unread") {
      result = result.filter(item => !item.read);
    }

    if (kindFilter !== "all") {
      result = result.filter(item => item.kind === kindFilter);
    }

    if (sortField && sortDirection) {
      result = [...result].sort((a, b) => {
        let av: string | number = "";
        let bv: string | number = "";

        if (sortField === "title") {
          av = a.title.toLowerCase();
          bv = b.title.toLowerCase();
        } else if (sortField === "kind") {
          av = kindLabel(a.kind, isEn).toLowerCase();
          bv = kindLabel(b.kind, isEn).toLowerCase();
        } else if (sortField === "senderName") {
          av = a.senderName.toLowerCase();
          bv = b.senderName.toLowerCase();
        } else if (sortField === "createdAt") {
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
        } else if (sortField === "read") {
          av = a.read ? 1 : 0;
          bv = b.read ? 1 : 0;
        }

        if (typeof av === "string" && typeof bv === "string") {
          return sortDirection === "asc" 
            ? av.localeCompare(bv)
            : bv.localeCompare(av);
        } else {
          return sortDirection === "asc" 
            ? Number(av) - Number(bv)
            : Number(bv) - Number(av);
        }
      });
    }

    return result;
  }, [notifications, debouncedSearch, filter, kindFilter, isEn, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else setSortDirection("asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortableHeader = ({
    field,
    children,
    align = "left",
  }: {
    field: SortField;
    children: React.ReactNode;
    align?: "left" | "center" | "right";
  }) => {
    const isActive = sortField === field;
    const icon = isActive ? (
      sortDirection === "asc" ? (
        <ArrowUp size={14} className="text-red-600" />
      ) : (
        <ArrowDown size={14} className="text-red-600" />
      )
    ) : (
      <ArrowUpDown size={14} className="text-gray-400" />
    );

    const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

    return (
      <th
        onClick={() => handleSort(field)}
        className={`py-3 px-6 ${alignClass} text-sm font-semibold tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-red-50 transition-colors`}
      >
        <span className="inline-flex items-center gap-2">{children}{icon}</span>
      </th>
    );
  };

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // Admin Layout
  if (isAdmin || role === "Teacher" || role === "Parent") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-2 space-y-6">
        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <Bell size={25} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-2xl font-extrabold text-gray-900">
                Trung tâm thông báo
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles size={14} className="text-red-600" />
                Quản lý tất cả thông báo dành cho Quản trị viên
              </p>
            </div>
          </div>
          <button
            onClick={() => void handleMarkAllAsRead()}
            className="inline-flex items-center gap-2 text-sm rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-white font-semibold cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <CheckCheck size={14} />
            {tr("Đánh dấu tất cả", "Mark all")}
          </button>
        </div>

        {/* Statistics Cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <ModernStatCard
            icon={<Bell size={18} />}
            title="Tổng thông báo"
            value={`${notifications.length}`}
            color="red"
          />
          <ModernStatCard
            icon={<Bell size={18} />}
            title="Chưa đọc"
            value={`${unreadCount}`}
            subtitle="Cần xem ngay"
            color="green"
          />
          <ModernStatCard
            icon={<CheckCheck size={18} />}
            title="Đã đọc"
            value={`${notifications.length - unreadCount}`}
            color="gray"
          />
          <ModernStatCard
            icon={<Sparkles size={18} />}
            title="Tỷ lệ đã đọc"
            value={`${notifications.length ? Math.round((notifications.length - unreadCount) / notifications.length * 100) : 0}%`}
            color="black"
          />
        </div>

        {/* Filters Section */}
        <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {(["all", "unread"] as const).map((status) => {
                const counts: Record<typeof status, number> = {
                  all: notifications.length,
                  unread: unreadCount,
                };

                const labels: Record<typeof status, string> = {
                  all: "Tất cả thông báo",
                  unread: "Chưa đọc",
                };

                const isActive = filter === status;
                return (
                  <button
                    key={status}
                    onClick={() => {
                      setFilter(status);
                    }}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {labels[status]}
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isActive ? "bg-white/30 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {counts[status]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Search and Kind Filter */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={tr("Tìm kiếm theo tiêu đề, nội dung, tác giả...", "Search by title, content, sender...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 text-sm pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all"
                />
              </div>

              <Select value={kindFilter} onValueChange={(value) => setKindFilter(value as "all" | NotificationKind)}>
                <SelectTrigger className="w-[160px] rounded-xl border border-gray-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="system">Hệ thống</SelectItem>
                  <SelectItem value="schedule">Lịch học</SelectItem>
                  <SelectItem value="report">Báo cáo</SelectItem>
                  <SelectItem value="payment">Tài chính</SelectItem>
                  <SelectItem value="homework">Bài tập</SelectItem>
                  <SelectItem value="feedback">Góp ý</SelectItem>
                  <SelectItem value="event">Sự kiện</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Danh sách thông báo</h2>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{filtered.length} {tr("thông báo", "notifications")}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <SortableHeader field="title">Tiêu đề</SortableHeader>
                  <SortableHeader field="kind">Loại</SortableHeader>
                  <SortableHeader field="senderName">Người gửi</SortableHeader>
                  <SortableHeader field="createdAt">Thời gian</SortableHeader>
                  <SortableHeader field="read" align="center">Trạng thái</SortableHeader>
                  <th className="py-3 px-6 text-right text-sm font-medium tracking-wide text-gray-700 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.length > 0 ? (
                  filtered.map((item) => (
                    <tr key={item.id} className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-red-600 border border-red-700">
                            {(() => {
                              const IconComponent = kindIcon(item.kind);
                              return <IconComponent size={16} className="text-white shrink-0" />;
                            })()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{item.message}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {kindLabel(item.kind, isEn)}
                        </span>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <span className="text-sm text-gray-700 font-medium">{item.senderName}</span>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{formatTime(item.createdAt)}</span>
                      </td>
                      <td className="py-3 px-6 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          item.read
                            ? "bg-gray-100 text-gray-700 border-gray-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {item.read ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {item.read ? tr("Đã đọc", "Read") : tr("Chưa đọc", "Unread")}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center justify-end text-gray-700 gap-1">
                          {!item.read && (
                            <button
                              onClick={() => void handleMarkAsRead(item)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-emerald-600 cursor-pointer"
                              title={tr("Đánh dấu đã đọc", "Mark as read")}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => void handleRetry(item)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                            title={tr("Thử gửi lại", "Retry")}
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            onClick={() => void handleRemove(item)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            title={tr("Xóa", "Delete")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                        <Bell size={24} className="text-gray-400" />
                      </div>
                      <div className="text-gray-600 font-medium">{tr("Không có thông báo phù hợp", "No matching notifications")}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmModal
          isOpen={Boolean(pendingDeleteItem)}
          onClose={() => setPendingDeleteItem(null)}
          onConfirm={() => void confirmDelete()}
          title={tr("Xác nhận xóa thông báo", "Confirm notification deletion")}
          message={
            pendingDeleteItem
              ? tr(
                  `Bạn có chắc muốn xóa thông báo "${pendingDeleteItem.title}" từ ${pendingDeleteItem.senderName} không? Hành động này không thể hoàn tác.`,
                  `Do you want to delete notification "${pendingDeleteItem.title}" from ${pendingDeleteItem.senderName}? This action cannot be undone.`
                )
              : ""
          }
          confirmText={tr("Xóa thông báo", "Delete notification")}
          cancelText={tr("Giữ lại", "Keep")}
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // Student Layout (Original style)
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 p-4 md:p-2">
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
              <Bell size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold bg-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                {tr("Trung tâm thông báo", "Notification Center")}
              </h1>
              <p className="text-sm text-indigo-200/80">
                {tr("Quản lý tất cả thông báo của", "Manage all notifications for")} {ROLE_LABEL[role].toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={() => void handleMarkAllAsRead()}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg"
          >
            <CheckCheck size={18} />
            {tr("Đánh dấu tất cả", "Mark all")}
          </button>
        </div>

        {/* Statistics */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <StudentStatCard
            icon={<Bell size={18} />}
            title={tr("Tổng thông báo", "Total notifications")}
            value={`${notifications.length}`}
            color="indigo"
          />
          <StudentStatCard
            icon={<Bell size={18} />}
            title={tr("Chưa đọc", "Unread")}
            value={`${unreadCount}`}
            color="purple"
          />
        </div>

        {/* Filters */}
        <div className={`rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {(["all", "unread"] as const).map((status) => {
                const counts: Record<typeof status, number> = {
                  all: notifications.length,
                  unread: unreadCount,
                };

                const labels: Record<typeof status, string> = {
                  all: tr("Tất cả", "All"),
                  unread: tr("Chưa đọc", "Unread"),
                };

                const isActive = filter === status;
                return (
                  <button
                    key={status}
                    onClick={() => {
                      setFilter(status);
                    }}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                        : "bg-white/10 border-white/20 text-indigo-200 hover:bg-white/20 hover:border-white/30"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {labels[status]}
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isActive ? "bg-white/30 text-white" : "bg-white/10 text-indigo-200/80"
                        }`}
                      >
                        {counts[status]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-white/20"></div>

            {/* Search and Kind Filter */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={tr("Tìm kiếm theo tiêu đề, nội dung, tác giả...", "Search by title, content, sender...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 text-sm pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-indigo-500/40 focus:border-indigo-400/50 focus:outline-none focus:ring-2 transition-all backdrop-blur-sm"
                />
              </div>
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
                <StudentNotificationCard
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
          onConfirm={() => void confirmDelete()}
          title={tr("Xác nhận xóa thông báo", "Confirm notification deletion")}
          message={
            pendingDeleteItem
              ? tr(
                  `Bạn có chắc muốn xóa thông báo "${pendingDeleteItem.title}" từ ${pendingDeleteItem.senderName} không? Hành động này không thể hoàn tác.`,
                  `Do you want to delete notification "${pendingDeleteItem.title}" from ${pendingDeleteItem.senderName}? This action cannot be undone.`
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