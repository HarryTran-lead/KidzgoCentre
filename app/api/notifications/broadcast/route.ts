import { NextResponse } from "next/server";
import { appendCampaign } from "@/app/api/_lib/notification-store";
import { BACKEND_NOTIFICATION_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type BroadcastRequestBody = {
  title?: string;
  content?: string | null;
  deeplink?: string | null;
  channel?: string | null;
  role?: string | null;
  kind?: string | null;
  priority?: string | null;
  senderRole?: string | null;
  senderName?: string | null;
  branchId?: string | null;
  classId?: string | null;
  studentProfileId?: string | null;
  userIds?: string[];
  profileIds?: string[];
  skipHistory?: boolean;
};

function normalizeChannel(value?: string | null) {
  if (value === "Push" || value === "Email" || value === "ZaloOa") {
    return value;
  }

  return "InApp";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function extractCreatedCount(data: unknown, fallback: number) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const candidates = [
    (data as { createdCount?: unknown }).createdCount,
    (data as { deliveredCount?: unknown }).deliveredCount,
    (data as { count?: unknown }).count,
    (data as { total?: unknown }).total,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return fallback;
}

function extractCampaignId(data: unknown) {
  if (!data || typeof data !== "object") {
    return crypto.randomUUID();
  }

  const candidates = [
    (data as { id?: unknown }).id,
    (data as { campaignId?: unknown }).campaignId,
    (data as { notificationId?: unknown }).notificationId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return crypto.randomUUID();
}

function extractCreatedAt(data: unknown) {
  if (!data || typeof data !== "object") {
    return new Date().toISOString();
  }

  const candidates = [
    (data as { createdAt?: unknown }).createdAt,
    (data as { sentAt?: unknown }).sentAt,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return new Date().toISOString();
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await req.json()) as BroadcastRequestBody;
    const upstream = await fetch(buildApiUrl(BACKEND_NOTIFICATION_ENDPOINTS.BROADCAST), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    if (!text) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Empty upstream response" },
        { status: 502 },
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Invalid upstream JSON" },
        { status: 502 },
      );
    }

    if (upstream.ok && !body.skipHistory) {
      const userIds = normalizeStringArray(body.userIds);
      const profileIds = normalizeStringArray(body.profileIds);

      await appendCampaign({
        id: extractCampaignId((json as { data?: unknown }).data),
        title: body.title?.trim() || "Broadcast",
        content: body.content?.trim() || "",
        deeplink: body.deeplink ?? null,
        channel: normalizeChannel(body.channel),
        role: body.role ?? null,
        kind: body.kind ?? null,
        priority: body.priority ?? null,
        branchId: body.branchId ?? null,
        classId: body.classId ?? null,
        studentProfileId: body.studentProfileId ?? null,
        userIds,
        profileIds,
        createdAt: extractCreatedAt((json as { data?: unknown }).data),
        createdCount: extractCreatedCount(
          (json as { data?: unknown }).data,
          Math.max(userIds.length, profileIds.length),
        ),
        senderRole: body.senderRole?.trim() || "Admin",
        senderName: body.senderName?.trim() || "KidzGo Centre",
      });
    }

    return NextResponse.json(json, { status: upstream.status });
  } catch (error) {
    console.error("Broadcast proxy error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Proxy request failed" },
      { status: 500 },
    );
  }
}
