"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  CheckCheck,
  Info,
  MessageSquare,
  Receipt,
  School,
  Trash2,
} from "lucide-react";
import type { Role } from "@/lib/role";
import { ROLE_LABEL } from "@/lib/role";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationKind } from "@/types/notification";
import FcmPermissionCard from "@/components/notifications/FcmPermissionCard";
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

function kindLabel(kind: NotificationKind) {
  switch (kind) {
    case "payment":
      return "Tài chính";
    case "report":
      return "Báo cáo";
    case "schedule":
      return "Lịch học";
    case "homework":
      return "Bài tập";
    case "feedback":
      return "Góp ý";
    case "event":
      return "Sự kiện";
    default:
      return "Hệ thống";
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
  onRead,
  onRemove,
}: {
  item: UiNotification;
  onRead: () => void;
  onRemove: () => void;
}) {
  const Icon = kindIcon(item.kind);

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm transition ${
        item.read ? "border-gray-200 bg-white" : "border-red-200 bg-red-50/40"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-red-600 p-2.5 text-white shrink-0">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            {!item.read && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                Mới
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
              {kindLabel(item.kind)}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-gray-700">{item.message}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>{formatTime(item.createdAt)}</span>
            <span>Từ: {item.senderName}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!item.read && (
            <button
              onClick={onRead}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
            >
              Đã đọc
            </button>
          )}
          <button
            onClick={onRemove}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-100 cursor-pointer"
            aria-label="Xóa thông báo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function NotificationInboxPage({ role }: { role: Role }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeOne } =
    useNotifications(role);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [kindFilter, setKindFilter] = useState<"all" | NotificationKind>("all");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

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
        kindLabel(item.kind).toLowerCase().includes(searchLower)
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
  }, [notifications, debouncedSearch, filter, kindFilter]);

  // Set page loaded state on mount
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
      <FcmPermissionCard role={role} />

      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
            <Bell size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Trung tâm thông báo</h1>
            <p className="text-sm text-gray-600">Quản lý tất cả thông báo của {ROLE_LABEL[role].toLowerCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 text-sm"
          >
            <CheckCheck size={18} />
            Đánh dấu tất cả
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl grid place-items-center bg-red-100"><Bell size={18} className="text-red-600" /></span>
            <div>
              <div className="text-sm text-gray-600">Tổng thông báo</div>
              <div className="text-2xl font-extrabold text-gray-900">{notifications.length}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl grid place-items-center bg-rose-100"><Bell size={18} className="text-rose-600" /></span>
            <div>
              <div className="text-sm text-rose-600">Chưa đọc</div>
              <div className="text-2xl font-extrabold text-rose-700">{unreadCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, nội dung, tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <Select value={filter} onValueChange={(value) => setFilter(value as "all" | "unread")}>
              <SelectTrigger className="w-auto min-w-max rounded-xl h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ({notifications.length})</SelectItem>
                <SelectItem value="unread">Chưa đọc ({unreadCount})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kindFilter} onValueChange={(value) => setKindFilter(value as "all" | NotificationKind)}>
              <SelectTrigger className="w-auto min-w-max rounded-xl h-10">
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
      <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách thông báo</h2>
            <span className="text-sm text-gray-600 font-medium">{filtered.length} thông báo</span>
          </div>
        </div>
        <div className="space-y-3 p-5">
          {filtered.length ? (
            filtered.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onRead={() => markAsRead(item.id)}
                onRemove={() => removeOne(item.id)}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
              <Bell className="mx-auto h-10 w-10 text-gray-300" />
              <h2 className="mt-4 text-lg font-semibold text-gray-800">Không có thông báo phù hợp</h2>
              <p className="mt-2 text-sm text-gray-500">
                Thay đổi bộ lọc hoặc chờ thông báo mới
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
