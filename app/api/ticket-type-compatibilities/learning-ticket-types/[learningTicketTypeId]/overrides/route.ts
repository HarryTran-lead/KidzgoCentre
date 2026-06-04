import { NextResponse } from "next/server";
import {
  BACKEND_TICKET_TYPE_COMPATIBILITY_ENDPOINTS,
  buildApiUrl,
} from "@/constants/apiURL";

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ learningTicketTypeId: string }> }
) {
  const { learningTicketTypeId } = await params;
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, data: null, message: "Chưa đăng nhập" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const upstream = await fetch(
    buildApiUrl(
      BACKEND_TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BULK_OVERRIDES(
        learningTicketTypeId
      )
    ),
    {
      method: "PUT",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}
