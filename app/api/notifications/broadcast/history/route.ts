import { NextResponse } from "next/server";
import { readNotificationDb } from "@/app/api/_lib/notification-store";
import { normalizeRole } from "@/lib/role";
import type {
  NotificationAudience,
  NotificationCampaign,
  NotificationChannel,
  NotificationKind,
} from "@/types/notification";

function normalizeChannel(value?: string | null): NotificationChannel {
  if (value === "Push" || value === "Email" || value === "ZaloOa") {
    return value;
  }

  return "InApp";
}

function normalizeKind(value?: string | null): NotificationKind {
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

function mapAudience(value?: string | null): NotificationAudience {
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

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const senderRole = searchParams.get("senderRole");
    const normalizedSenderRole = senderRole ? normalizeRole(senderRole) : null;

    const db = await readNotificationDb();
    const campaigns = db.campaigns
      .filter((item) =>
        normalizedSenderRole ? normalizeRole(item.senderRole) === normalizedSenderRole : true,
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map<NotificationCampaign>((item) => ({
        id: item.id,
        title: item.title,
        message: item.content ?? "",
        audience: mapAudience(item.role),
        channel: normalizeChannel(item.channel),
        kind: normalizeKind(item.kind),
        createdAt: item.createdAt,
        senderRole: normalizeRole(item.senderRole ?? "Admin"),
        senderName: item.senderName || "KidzGo Centre",
        deliveredCount: Number(item.createdCount ?? 0),
      }));

    return NextResponse.json({
      isSuccess: true,
      data: campaigns,
    });
  } catch (error) {
    console.error("Broadcast history error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Cannot load broadcast history" },
      { status: 500 },
    );
  }
}
