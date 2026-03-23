"use client";

import { useEffect, useMemo, useState } from "react";
import type { Role } from "@/lib/role";
import { getNotificationRoute } from "@/lib/notifications";
import {
  broadcastNotification,
  deleteNotification,
  fetchBroadcastHistory,
  fetchNotifications,
  markNotificationRead,
  subscribeNotificationsChanged,
} from "@/lib/api/notificationService";
import type {
  NotificationCampaign,
  NotificationAudience,
  NotificationChannel,
  NotificationKind,
  NotificationPriority,
} from "@/types/notification";

const REFRESH_INTERVAL_MS = 10000;

type UiNotification = {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  priority: NotificationPriority;
  createdAt: string;
  read: boolean;
  senderRole: Role;
  senderName: string;
  link?: string;
};

export function useNotifications(role: Role) {
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);

  const refresh = async () => {
    const items = await fetchNotifications(role);
    const history = await fetchBroadcastHistory(role).catch(() => []);

    setNotifications(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.content ?? "",
        kind: ((item.kind as NotificationKind | null) ?? "system"),
        priority: ((item.priority as NotificationPriority | null) ?? "medium"),
        createdAt: item.createdAt,
        read: Boolean(item.readAt),
        senderRole: ((item.senderRole as Role | null) ?? "Admin"),
        senderName: item.senderName ?? "KidzGo Centre",
        link: item.deeplink ?? undefined,
      }))
    );
    setCampaigns(history);
  };

  useEffect(() => {
    void refresh();
    return subscribeNotificationsChanged(() => {
      void refresh();
    });
  }, [role]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, REFRESH_INTERVAL_MS);

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [role]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    campaigns,
    notificationsRoute: getNotificationRoute(role),
    markAsRead: async (id: string) => {
      await markNotificationRead(id);
    },
    markAllAsRead: async () => {
      await Promise.all(
        notifications.filter((item) => !item.read).map((item) => markNotificationRead(item.id))
      );
    },
    removeOne: async (id: string) => {
      await deleteNotification(id);
    },
    createCampaign: (input: {
      title: string;
      message: string;
      audience: NotificationAudience;
      channel: NotificationChannel;
      kind: NotificationKind;
      senderRole: Role;
      senderName: string;
      priority?: NotificationPriority;
    }) => broadcastNotification(input),
  };
}
