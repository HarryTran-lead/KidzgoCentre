import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_TICKET_TYPE_COMPATIBILITY_ENDPOINTS,
  buildApiUrl,
} from "@/constants/apiURL";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildHeaders(request: NextRequest) {
  const headers = new Headers();
  headers.set("Content-Type", request.headers.get("content-type") ?? "application/json");

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return headers;
}

async function proxyResponse(response: Response) {
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ learningTicketTypeId: string }> },
) {
  const { learningTicketTypeId } = await context.params;
  const body = await request.text();
  const response = await fetch(
    buildApiUrl(BACKEND_TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BULK_OVERRIDES(learningTicketTypeId)),
    {
      method: "PUT",
      headers: buildHeaders(request),
      body,
      cache: "no-store",
    },
  );

  return proxyResponse(response);
}
