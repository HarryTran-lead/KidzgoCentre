"use client";

import { useEffect, useMemo, useState } from "react";
import type { Role } from "@/lib/role";
import {
  createNotificationCampaign,
  getCampaigns,
  getNotificationRoute,
  getNotificationsForRole,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  removeNotification,
  subscribeNotificationStore,
} from "@/lib/notifications";
import type {
  NotificationAudience,
  NotificationChannel,
  NotificationKind,
  NotificationPriority,
} from "@/types/notification";

export function useNotifications(role: Role) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    return subscribeNotificationStore(() => {
      setVersion((value) => value + 1);
    });
  }, []);

  const notifications = useMemo(() => getNotificationsForRole(role), [role, version]);
  const unreadCount = useMemo(() => getUnreadCount(role), [role, version]);
  const campaigns = useMemo(() => getCampaigns(), [version]);
  const notificationsRoute = useMemo(() => getNotificationRoute(role), [role]);

  return {
    notifications,
    unreadCount,
    campaigns,
    notificationsRoute,
    markAsRead: (id: string) => markNotificationAsRead(role, id),
    markAllAsRead: () => markAllNotificationsAsRead(role),
    removeOne: (id: string) => removeNotification(role, id),
    createCampaign: (input: {
      title: string;
      message: string;
      audience: NotificationAudience;
      channel: NotificationChannel;
      kind: NotificationKind;
      senderRole: Role;
      senderName: string;
      priority?: NotificationPriority;
    }) => createNotificationCampaign(input),
  };
}
