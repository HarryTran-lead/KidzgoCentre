import { NextResponse } from "next/server";
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
    const { skipHistory: _skipHistory, ...upstreamBody } = body;
    const upstream = await fetch(buildApiUrl(BACKEND_NOTIFICATION_ENDPOINTS.BROADCAST), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(upstreamBody),
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

    return NextResponse.json(json, { status: upstream.status });
  } catch (error) {
    console.error("Broadcast proxy error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Proxy request failed" },
      { status: 500 },
    );
  }
}
