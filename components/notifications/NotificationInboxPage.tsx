"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  CheckCheck,
  ExternalLink,
  Filter,
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
      className={`rounded-3xl border p-5 shadow-sm transition ${
        item.read ? "border-slate-200 bg-white" : "border-rose-200 bg-rose-50/40"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-slate-900 p-3 text-white">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
            {!item.read && (
              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                Mới
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              {kindLabel(item.kind)}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-700">{item.message}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{formatTime(item.createdAt)}</span>
            <span>Từ: {item.senderName}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!item.read && (
            <button
              onClick={onRead}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              Đã đọc
            </button>
          )}
          <button
            onClick={onRemove}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
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
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [kindFilter, setKindFilter] = useState<"all" | NotificationKind>("all");

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (filter === "unread" && item.read) {
        return false;
      }
      if (kindFilter !== "all" && item.kind !== kindFilter) {
        return false;
      }
      return true;
    });
  }, [notifications, filter, kindFilter]);

  const counts = useMemo(() => {
    return notifications.reduce<Record<string, number>>((acc, item) => {
      acc[item.kind] = (acc[item.kind] ?? 0) + 1;
      return acc;
    }, {});
  }, [notifications]);

  return (
    <div className="space-y-6">
      <FcmPermissionCard role={role} />

      <section className="rounded-[28px] border border-rose-200 bg-gradient-to-br from-white via-white to-rose-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
              <Bell className="h-3.5 w-3.5" />
              Notifications
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              Trung tâm thông báo cho {ROLE_LABEL[role].toLowerCase()}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Tất cả thông báo in-app của vai trò này được gom về một nguồn dữ liệu chung.
              Bell ở header và trang danh sách luôn đồng bộ với nhau.
            </p>
          </div>

          <div className="grid min-w-[240px] grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">Tổng thông báo</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{notifications.length}</div>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-sm text-rose-600">Chưa đọc</div>
              <div className="mt-2 text-2xl font-bold text-rose-700">{unreadCount}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === "unread" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700"
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
            >
              <CheckCheck className="h-4 w-4" />
              Đánh dấu tất cả
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
              <Filter className="h-4 w-4" />
              Loại:
            </span>
            {(["all", "system", "schedule", "report", "payment", "homework", "feedback", "event"] as const).map(
              (kind) => (
                <button
                  key={kind}
                  onClick={() => setKindFilter(kind)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    kindFilter === kind ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {kind === "all" ? "Tất cả" : `${kindLabel(kind)} (${counts[kind] ?? 0})`}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
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
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Bell className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-800">Không có thông báo phù hợp</h2>
            <p className="mt-2 text-sm text-slate-500">
              Đổi bộ lọc hoặc chờ staff/admin gửi broadcast mới.
            </p>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Link
          href="#top"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
        >
          Lên đầu trang
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
