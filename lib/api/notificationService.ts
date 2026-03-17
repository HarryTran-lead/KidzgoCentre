"use client";

import { NOTIFICATION_ENDPOINTS } from "@/constants/apiURL";
import type { Role } from "@/lib/role";
import { getAccessToken } from "@/lib/store/authToken";
import type {
  BackendNotificationRole,
  NotificationAudience,
  NotificationChannel,
  NotificationKind,
  NotificationPriority,
} from "@/types/notification";

type NotificationListResponse = {
  isSuccess: boolean;
  data: {
    items?: Array<{
      id: string;
      title: string;
      content: string | null;
      deeplink: string | null;
      status: string | number;
      channel: string | number;
      sentAt?: string | null;
      readAt?: string | null;
      isRead?: boolean;
      createdAt: string;
      kind?: string | null;
      priority?: string | null;
      senderRole?: string | null;
      senderName?: string | null;
    }>;
    notifications?: {
      items: Array<{
        id: string;
        title: string;
        content: string | null;
        deeplink: string | null;
        status: string | number;
        channel: string | number;
        sentAt?: string | null;
        readAt?: string | null;
        isRead?: boolean;
        createdAt: string;
        kind?: string | null;
        priority?: string | null;
        senderRole?: string | null;
        senderName?: string | null;
      }>;
    };
  };
};

type NotificationListItem =
  NonNullable<NotificationListResponse["data"]["items"]>[number];

const EVENT_NAME = "kidzgo:notifications-updated";

function getAuthHeaders(extra?: HeadersInit) {
  const token = getAccessToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

export function emitNotificationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function subscribeNotificationsChanged(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

export async function fetchNotifications(role: Role, unreadOnly = false) {
  const params = new URLSearchParams({
    unreadOnly: unreadOnly ? "true" : "false",
    pageNumber: "1",
    pageSize: "100",
  });

  const response = await fetch(`/api/notifications?${params.toString()}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  const json = (await response.json()) as NotificationListResponse;
  const items = json?.data?.notifications?.items ?? json?.data?.items ?? [];

  return items.map((item: NotificationListItem) => ({
    id: item.id,
    title: item.title,
    content: item.content ?? null,
    deeplink: item.deeplink ?? null,
    status: String(item.status ?? ""),
    channel: String(item.channel ?? ""),
    readAt: item.readAt ?? (item.isRead ? item.sentAt ?? item.createdAt : null),
    createdAt: item.createdAt,
    kind: item.kind ?? null,
    priority: item.priority ?? null,
    senderRole: item.senderRole ?? null,
    senderName: item.senderName ?? null,
  }));
}

export async function fetchBroadcastHistory() {
  const response = await fetch("/api/notifications/broadcast/history", {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  const json = await response.json();
  return json.data ?? [];
}

export async function fetchNotificationTemplates() {
  const response = await fetch("/api/notifications/templates", {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  const json = await response.json();

  if (Array.isArray(json?.data)) {
    return json.data;
  }

  if (Array.isArray(json?.data?.items)) {
    return json.data.items;
  }

  if (Array.isArray(json?.data?.templates?.items)) {
    return json.data.templates.items;
  }

  return [];
}

export async function createNotificationTemplate(payload: {
  code: string;
  channel: string;
  title: string;
  content: string;
  placeholders: string[];
  isActive: boolean;
}) {
  const response = await fetch("/api/notifications/templates", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      ...payload,
      placeholders: JSON.stringify(payload.placeholders),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Create template failed.");
  }

  emitNotificationsChanged();
}

export async function deleteNotificationTemplate(id: string) {
  await fetch(`/api/notifications/templates/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  emitNotificationsChanged();
}

export async function markNotificationRead(id: string) {
  await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  emitNotificationsChanged();
}

export async function deleteNotification(id: string) {
  await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  emitNotificationsChanged();
}

export async function broadcastNotification(input: {
  title: string;
  message: string;
  audience: NotificationAudience;
  channel: NotificationChannel;
  kind: NotificationKind;
  senderRole: Role;
  senderName: string;
  priority?: NotificationPriority;
}) {
  const role =
    input.audience === "management"
      ? "Admin,ManagementStaff,AccountantStaff"
      : input.audience === "family"
      ? "Parent+Student"
      : input.audience === "teaching"
      ? "Teacher"
      : input.audience === "all"
      ? "Admin,ManagementStaff,AccountantStaff,Teacher,Parent,Student"
      : (input.audience as BackendNotificationRole);

  const headers = getAuthHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/notifications/broadcast", {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: input.title,
      content: input.message,
      deeplink: null,
      channel: input.channel,
      role,
      kind: input.kind,
      priority: input.priority ?? "medium",
      senderRole: input.senderRole,
      senderName: input.senderName,
      userIds: [],
      profileIds: [],
      branchId: null,
      classId: null,
      studentProfileId: null,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Broadcast failed for role ${role}`);
  }

  emitNotificationsChanged();
}

export async function registerDeviceToken(payload: Record<string, unknown>) {
  await fetch(NOTIFICATION_ENDPOINTS.DEVICE_TOKEN, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function ingestForegroundNotification(payload: {
  title: string;
  body: string;
  targetRole: Role;
  kind: string;
  priority: string;
  senderRole: string;
  senderName: string;
  link?: string;
}) {
  await fetch("/api/notifications/broadcast", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      title: payload.title,
      content: payload.body,
      deeplink: payload.link ?? null,
      channel: "Push",
      role: payload.targetRole,
      kind: payload.kind,
      priority: payload.priority,
      senderRole: payload.senderRole,
      senderName: payload.senderName,
      userIds: [],
      profileIds: [],
    }),
  });
  emitNotificationsChanged();
}
