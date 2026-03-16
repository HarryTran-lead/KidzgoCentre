import type { Role } from "@/lib/role";

export type NotificationKind =
  | "system"
  | "schedule"
  | "report"
  | "payment"
  | "homework"
  | "feedback"
  | "event";

export type NotificationPriority = "low" | "medium" | "high";

export type NotificationChannel = "InApp" | "Email" | "Zalo OA" | "InApp + Email";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  priority: NotificationPriority;
  createdAt: string;
  read: boolean;
  targetRole: Role;
  senderRole: Role;
  senderName: string;
  link?: string;
};

export type NotificationAudience =
  | "all"
  | "family"
  | "teaching"
  | "management"
  | Role;

export type NotificationCampaign = {
  id: string;
  title: string;
  message: string;
  audience: NotificationAudience;
  channel: NotificationChannel;
  kind: NotificationKind;
  createdAt: string;
  senderRole: Role;
  senderName: string;
  deliveredCount: number;
};

export type NotificationStore = {
  notifications: Record<Role, AppNotification[]>;
  campaigns: NotificationCampaign[];
};
