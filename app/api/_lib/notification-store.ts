import { promises as fs } from "fs";
import path from "path";
import { ROLES, type Role, normalizeRole } from "@/lib/role";

type NotificationChannel = "InApp" | "Push" | "Email" | "ZaloOa";
type NotificationStatus = "Pending" | "Sent" | "Failed";

export type StoredNotification = {
  id: string;
  recipientUserId: string;
  recipientProfileId: string | null;
  channel: NotificationChannel;
  title: string;
  content: string | null;
  deeplink: string | null;
  status: NotificationStatus;
  sentAt: string | null;
  readAt: string | null;
  templateId: string | null;
  createdAt: string;
  targetRole: Role;
  kind: string | null;
  priority: string | null;
  senderRole: string | null;
  senderName: string | null;
  campaignId: string | null;
};

export type StoredDeviceToken = {
  id: string;
  userId: string;
  token: string;
  deviceType: string | null;
  deviceId: string | null;
  role: Role;
  browser: string | null;
  locale: string | null;
  branchId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
};

export type StoredTemplate = {
  id: string;
  code: string;
  channel: NotificationChannel;
  title: string;
  content: string;
  placeholders: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type StoredCampaign = {
  id: string;
  title: string;
  content: string;
  deeplink: string | null;
  channel: NotificationChannel;
  role: string | null;
  branchId: string | null;
  classId: string | null;
  studentProfileId: string | null;
  userIds: string[];
  profileIds: string[];
  createdAt: string;
  createdCount: number;
  senderRole: string;
  senderName: string;
};

type NotificationDb = {
  notifications: StoredNotification[];
  deviceTokens: StoredDeviceToken[];
  templates: StoredTemplate[];
  campaigns: StoredCampaign[];
};

const PROJECT_ROOT =
  path.basename(process.cwd()) === "KidzgoCentre"
    ? process.cwd()
    : path.join(process.cwd(), "KidzgoCentre");
const DATA_DIR = path.join(PROJECT_ROOT, ".data");
const STORE_PATH = path.join(DATA_DIR, "notifications.json");

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function makeSeed(): NotificationDb {
  const createdAt = now();

  return {
    notifications: [
      {
        id: id("noti"),
        recipientUserId: "parent-demo",
        recipientProfileId: null,
        channel: "InApp",
        title: "Báo cáo tháng đã công bố",
        content: "Phụ huynh có thể xem báo cáo tháng mới nhất của học viên.",
        deeplink: "/vi/portal/parent/notifications",
        status: "Sent",
        sentAt: createdAt,
        readAt: null,
        templateId: null,
        createdAt,
        targetRole: "Parent",
        kind: "report",
        priority: "high",
        senderRole: "Teacher",
        senderName: "KidzGo Centre",
        campaignId: null,
      },
      {
        id: id("noti"),
        recipientUserId: "teacher-demo",
        recipientProfileId: null,
        channel: "InApp",
        title: "Có feedback mới cần xử lý",
        content: "Một báo cáo tháng vừa được staff trả về để giáo viên chỉnh sửa.",
        deeplink: "/vi/portal/teacher/notifications",
        status: "Sent",
        sentAt: createdAt,
        readAt: null,
        templateId: null,
        createdAt,
        targetRole: "Teacher",
        kind: "feedback",
        priority: "high",
        senderRole: "Staff_Manager",
        senderName: "Phòng học vụ",
        campaignId: null,
      },
    ],
    deviceTokens: [],
    templates: [
      {
        id: id("tpl"),
        code: "SESSION_REMINDER_24H",
        channel: "Email",
        title: "Nhắc nhở buổi học",
        content:
          "Em chào phụ huynh {{parentName}}, con {{studentName}} có buổi học {{className}} vào ngày {{date}} lúc {{time}}.",
        placeholders: ["parentName", "studentName", "className", "date", "time"],
        isActive: true,
        isDeleted: false,
        createdAt,
        updatedAt: null,
      },
    ],
    campaigns: [],
  };
}

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(makeSeed(), null, 2), "utf8");
  }
}

export async function readNotificationDb(): Promise<NotificationDb> {
  await ensureFile();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return JSON.parse(raw) as NotificationDb;
}

export async function writeNotificationDb(next: NotificationDb) {
  await ensureFile();
  await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
}

export function resolveRoles(inputRole?: string | null): Role[] {
  if (!inputRole) {
    return Object.keys(ROLES) as Role[];
  }

  if (inputRole === "Staff") {
    return ["Admin", "Staff_Manager", "Staff_Accountant"];
  }

  const normalized = normalizeRole(inputRole);
  return [normalized];
}
