"use client";

import { ROLES, type Role } from "@/lib/role";
import type {
  AppNotification,
  NotificationAudience,
  NotificationCampaign,
  NotificationChannel,
  NotificationKind,
  NotificationPriority,
  NotificationStore,
} from "@/types/notification";

const STORAGE_KEY = "kidzgo.notifications.v1";
const UPDATE_EVENT = "kidzgo:notifications-updated";

const ROLE_LIST = Object.keys(ROLES) as Role[];

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeNotification(input: {
  title: string;
  message: string;
  kind: NotificationKind;
  priority: NotificationPriority;
  targetRole: Role;
  senderRole: Role;
  senderName: string;
  createdAt?: string;
  read?: boolean;
  link?: string;
}): AppNotification {
  return {
    id: makeId("noti"),
    createdAt: input.createdAt ?? nowIso(),
    read: input.read ?? false,
    ...input,
  };
}

function createSeedStore(): NotificationStore {
  return {
    notifications: {
      Admin: [
        makeNotification({
          title: "Tổng hợp báo cáo tháng đã sẵn sàng",
          message: "Khối monthly report tháng này đã hoàn tất đồng bộ và sẵn sàng kiểm tra.",
          kind: "report",
          priority: "high",
          targetRole: "Admin",
          senderRole: "Staff_Manager",
          senderName: "Hệ thống điều phối",
        }),
      ],
      Staff_Accountant: [
        makeNotification({
          title: "Có 3 khoản học phí đến hạn",
          message: "Một số phụ huynh sắp đến hạn thanh toán trong 48 giờ tới.",
          kind: "payment",
          priority: "high",
          targetRole: "Staff_Accountant",
          senderRole: "Admin",
          senderName: "Kế toán tổng hợp",
        }),
      ],
      Staff_Manager: [
        makeNotification({
          title: "Teacher vừa submit 5 session report",
          message: "Có 5 báo cáo buổi học đang chờ review trong hôm nay.",
          kind: "report",
          priority: "medium",
          targetRole: "Staff_Manager",
          senderRole: "Teacher",
          senderName: "Giảng viên hệ thống",
        }),
      ],
      Teacher: [
        makeNotification({
          title: "Có góp ý mới từ staff/admin",
          message: "Một monthly report vừa bị trả về và cần chỉnh sửa trước khi submit lại.",
          kind: "feedback",
          priority: "high",
          targetRole: "Teacher",
          senderRole: "Staff_Manager",
          senderName: "Phòng học vụ",
        }),
        makeNotification({
          title: "Lịch dạy ngày mai đã cập nhật",
          message: "Một buổi học được đổi phòng, vui lòng kiểm tra lại thời khóa biểu.",
          kind: "schedule",
          priority: "medium",
          targetRole: "Teacher",
          senderRole: "Admin",
          senderName: "Điều hành trung tâm",
        }),
      ],
      Student: [
        makeNotification({
          title: "Bài tập mới đã được giao",
          message: "Giáo viên vừa đăng bài tập speaking mới cho lớp của bạn.",
          kind: "homework",
          priority: "medium",
          targetRole: "Student",
          senderRole: "Teacher",
          senderName: "Cô Phương",
        }),
      ],
      Parent: [
        makeNotification({
          title: "Nhắc đóng học phí",
          message: "Học phí tháng này sắp đến hạn. Vui lòng kiểm tra mục thanh toán.",
          kind: "payment",
          priority: "high",
          targetRole: "Parent",
          senderRole: "Staff_Accountant",
          senderName: "Phòng kế toán",
        }),
        makeNotification({
          title: "Báo cáo tháng đã công bố",
          message: "Phụ huynh có thể xem monthly report mới nhất của học viên.",
          kind: "report",
          priority: "medium",
          targetRole: "Parent",
          senderRole: "Teacher",
          senderName: "KidzGo Centre",
        }),
      ],
    },
    campaigns: [
      {
        id: makeId("camp"),
        title: "Nhắc kiểm tra monthly report",
        message: "Tất cả quản lý kiểm tra nhanh tiến độ publish báo cáo tháng trong ngày.",
        audience: "management",
        channel: "InApp",
        kind: "report",
        createdAt: nowIso(),
        senderRole: "Admin",
        senderName: "Hệ thống KidzGo",
        deliveredCount: 2,
      },
    ],
  };
}

function normalizeStore(raw: unknown): NotificationStore {
  const seed = createSeedStore();

  if (!raw || typeof raw !== "object") {
    return seed;
  }

  const parsed = raw as Partial<NotificationStore>;
  const notifications = {} as Record<Role, AppNotification[]>;

  for (const role of ROLE_LIST) {
    notifications[role] = Array.isArray(parsed.notifications?.[role])
      ? parsed.notifications?.[role] ?? []
      : seed.notifications[role];
  }

  return {
    notifications,
    campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : seed.campaigns,
  };
}

export function getNotificationRoute(role: Role) {
  return `${ROLES[role]}/notifications`;
}

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  }
}

export function readNotificationStore(): NotificationStore {
  if (typeof window === "undefined") {
    return createSeedStore();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = createSeedStore();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    const seed = createSeedStore();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function writeNotificationStore(next: NotificationStore) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emitUpdate();
}

export function subscribeNotificationStore(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const sync = () => callback();
  window.addEventListener(UPDATE_EVENT, sync);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener(UPDATE_EVENT, sync);
    window.removeEventListener("storage", sync);
  };
}

export function getNotificationsForRole(role: Role) {
  return [...readNotificationStore().notifications[role]].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function getUnreadCount(role: Role) {
  return getNotificationsForRole(role).filter((item) => !item.read).length;
}

export function markNotificationAsRead(role: Role, id: string) {
  const store = readNotificationStore();
  store.notifications[role] = store.notifications[role].map((item) =>
    item.id === id ? { ...item, read: true } : item
  );
  writeNotificationStore(store);
}

export function markAllNotificationsAsRead(role: Role) {
  const store = readNotificationStore();
  store.notifications[role] = store.notifications[role].map((item) => ({
    ...item,
    read: true,
  }));
  writeNotificationStore(store);
}

export function removeNotification(role: Role, id: string) {
  const store = readNotificationStore();
  store.notifications[role] = store.notifications[role].filter((item) => item.id !== id);
  writeNotificationStore(store);
}

function resolveAudienceRoles(audience: NotificationAudience): Role[] {
  if (audience === "all") {
    return ROLE_LIST;
  }
  if (audience === "family") {
    return ["Parent", "Student"];
  }
  if (audience === "teaching") {
    return ["Teacher"];
  }
  if (audience === "management") {
    return ["Admin", "Staff_Manager", "Staff_Accountant"];
  }
  return [audience];
}

export function createNotificationCampaign(input: {
  title: string;
  message: string;
  audience: NotificationAudience;
  channel: NotificationChannel;
  kind: NotificationKind;
  senderRole: Role;
  senderName: string;
  priority?: NotificationPriority;
}) {
  const store = readNotificationStore();
  const targetRoles = resolveAudienceRoles(input.audience);
  const createdAt = nowIso();

  const campaign: NotificationCampaign = {
    id: makeId("camp"),
    title: input.title,
    message: input.message,
    audience: input.audience,
    channel: input.channel,
    kind: input.kind,
    createdAt,
    senderRole: input.senderRole,
    senderName: input.senderName,
    deliveredCount: targetRoles.length,
  };

  for (const role of targetRoles) {
    store.notifications[role] = [
      makeNotification({
        title: input.title,
        message: input.message,
        kind: input.kind,
        priority: input.priority ?? "medium",
        targetRole: role,
        senderRole: input.senderRole,
        senderName: input.senderName,
        createdAt,
      }),
      ...store.notifications[role],
    ];
  }

  store.campaigns = [campaign, ...store.campaigns];
  writeNotificationStore(store);
  return campaign;
}

export function getCampaigns() {
  return [...readNotificationStore().campaigns].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function pushNotificationToRole(input: {
  role: Role;
  title: string;
  message: string;
  kind: NotificationKind;
  priority?: NotificationPriority;
  senderRole?: Role;
  senderName?: string;
  createdAt?: string;
  link?: string;
}) {
  const store = readNotificationStore();
  const nextItem = makeNotification({
    title: input.title,
    message: input.message,
    kind: input.kind,
    priority: input.priority ?? "medium",
    targetRole: input.role,
    senderRole: input.senderRole ?? "Admin",
    senderName: input.senderName ?? "Firebase Cloud Messaging",
    createdAt: input.createdAt,
    link: input.link,
  });

  store.notifications[input.role] = [nextItem, ...store.notifications[input.role]];
  writeNotificationStore(store);
  return nextItem;
}
