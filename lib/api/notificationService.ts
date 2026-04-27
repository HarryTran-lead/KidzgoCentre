"use client";

import { NOTIFICATION_ENDPOINTS } from "@/constants/apiURL";
import { normalizeRole, type Role } from "@/lib/role";
import { getAccessToken } from "@/lib/store/authToken";
import { nowISOVN } from "@/lib/datetime";
import type {
  BackendNotificationRole,
  NotificationCampaign,
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

type BroadcastHistoryItem = {
  id?: string;
  campaignId?: string;
  title?: string;
  content?: string | null;
  message?: string | null;
  role?: string | null;
  audience?: string | null;
  channel?: string | null;
  kind?: string | null;
  createdAt?: string | null;
  senderRole?: string | null;
  senderName?: string | null;
  createdCount?: number | null;
  deliveredCount?: number | null;
};

const EVENT_NAME = "kidzgo:notifications-updated";

async function readApiError(response: Response, fallback: string) {
  const rawText = await response.text();

  if (!rawText) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawText) as {
      message?: string;
      error?: string;
      errors?: string[];
      data?: { message?: string };
    };

    return (
      parsed?.message ||
      parsed?.error ||
      parsed?.data?.message ||
      (Array.isArray(parsed?.errors) ? parsed.errors.join("; ") : "") ||
      rawText ||
      fallback
    );
  } catch {
    return rawText || fallback;
  }
}

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
  if (!response.ok) {
    throw new Error(
      await readApiError(response, `Không thể tải danh sách thông báo cho vai trò ${role}.`)
    );
  }
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

export async function fetchBroadcastHistory(senderRole?: Role) {
  const params = new URLSearchParams();
  if (senderRole) {
    params.set("senderRole", toBackendNotificationRole(senderRole));
  }
  const queryString = params.toString();

  const response = await fetch(
    queryString
      ? `/api/notifications/broadcast/history?${queryString}`
      : "/api/notifications/broadcast/history",
    {
      cache: "no-store",
      headers: getAuthHeaders(),
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Không thể tải lịch sử broadcast từ hệ thống.")
    );
  }
  const json = await response.json();
  const items = Array.isArray(json?.data)
    ? (json.data as BroadcastHistoryItem[])
    : Array.isArray(json?.data?.items)
    ? (json.data.items as BroadcastHistoryItem[])
    : [];

  return items.map((item) => ({
    id: item.id ?? item.campaignId ?? crypto.randomUUID(),
    title: item.title ?? "Broadcast",
    message: item.message ?? item.content ?? "",
    audience: mapBroadcastAudience(item.audience ?? item.role),
    channel: normalizeBroadcastChannel(item.channel),
    kind: normalizeBroadcastKind(item.kind),
    createdAt: item.createdAt ?? nowISOVN(),
    senderRole: normalizeSenderRole(item.senderRole),
    senderName: item.senderName ?? "KidzGo Centre",
    deliveredCount: Number(item.deliveredCount ?? item.createdCount ?? 0),
  })) as NotificationCampaign[];
}

export async function fetchNotificationTemplates() {
  const response = await fetch("/api/notifications/templates", {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Không thể tải danh sách template thông báo.")
    );
  }
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
    throw new Error(
      await readApiError(response, "Không thể tạo template thông báo.")
    );
  }

  emitNotificationsChanged();
}

export async function deleteNotificationTemplate(id: string) {
  const response = await fetch(`/api/notifications/templates/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, `Không thể xóa template thông báo (${id}).`)
    );
  }

  emitNotificationsChanged();
}

export async function markNotificationRead(id: string) {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, `Không thể đánh dấu đã đọc cho thông báo (${id}).`)
    );
  }

  emitNotificationsChanged();
}

export async function deleteNotification(id: string) {
  const response = await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, `Không thể xóa thông báo (${id}).`)
    );
  }

  emitNotificationsChanged();
}

export async function retryNotification(id: string) {
  const response = await fetch(`/api/notifications/${id}/retry`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, `Không thể thử gửi lại thông báo (${id}).`)
    );
  }

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
      senderRole: toBackendNotificationRole(input.senderRole),
      senderName: input.senderName,
      userIds: [],
      profileIds: [],
      branchId: null,
      classId: null,
      studentProfileId: null,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, `Không thể gửi broadcast cho nhóm ${input.audience}.`)
    );
  }

  emitNotificationsChanged();
}

export async function registerDeviceToken(payload: Record<string, unknown>) {
  const response = await fetch(NOTIFICATION_ENDPOINTS.DEVICE_TOKEN, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Không thể đăng ký thiết bị nhận thông báo push.")
    );
  }
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
  const response = await fetch("/api/notifications/broadcast", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      title: payload.title,
      content: payload.body,
      deeplink: payload.link ?? null,
      channel: "Push",
      role: toBackendNotificationRole(payload.targetRole),
      kind: payload.kind,
      priority: payload.priority,
      senderRole: toBackendNotificationRole(payload.senderRole),
      senderName: payload.senderName,
      userIds: [],
      profileIds: [],
      skipHistory: true,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Không thể đồng bộ thông báo realtime vào inbox.")
    );
  }

  emitNotificationsChanged();
}

function normalizeBroadcastChannel(
  value?: string | null
): NotificationCampaign["channel"] {
  if (value === "Push" || value === "Email" || value === "ZaloOa") {
    return value;
  }

  return "InApp";
}

function normalizeBroadcastKind(
  value?: string | null
): NotificationCampaign["kind"] {
  if (
    value === "schedule" ||
    value === "report" ||
    value === "payment" ||
    value === "homework" ||
    value === "feedback" ||
    value === "event"
  ) {
    return value;
  }

  return "system";
}

function mapBroadcastAudience(value?: string | null): NotificationAudience {
  if (!value) {
    return "all";
  }

  const tokens = value
    .split(/[,+]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const signature = [...new Set(tokens)].sort().join("|");

  if (signature === "Parent|Student") {
    return "family";
  }

  if (signature === "Teacher") {
    return "teaching";
  }

  if (signature === "AccountantStaff|Admin|ManagementStaff") {
    return "management";
  }

  if (signature === "AccountantStaff|Admin|ManagementStaff|Parent|Student|Teacher") {
    return "all";
  }

  return (tokens[0] as NotificationAudience) || "all";
}

function normalizeSenderRole(value?: string | null): Role {
  return normalizeRole(value ?? undefined);
}

function toBackendNotificationRole(
  value?: Role | string | null
): BackendNotificationRole {
  const normalizedRole = normalizeRole(value ?? undefined);

  if (normalizedRole === "Staff_Manager") {
    return "ManagementStaff";
  }

  if (normalizedRole === "Staff_Accountant") {
    return "AccountantStaff";
  }

  return normalizedRole;
}
