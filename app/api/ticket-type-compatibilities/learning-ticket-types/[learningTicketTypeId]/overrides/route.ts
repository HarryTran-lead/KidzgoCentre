import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_BASE_URL ??
  process.env.BACKEND_API_URL ??
  "";

function backendUrl(path: string) {
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  return `${baseUrl}${path}`;
}

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
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { learningTicketTypeId: string } },
) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { isSuccess: false, detail: "Missing API base URL configuration." },
      { status: 500 },
    );
  }

  const body = await request.text();
  const response = await fetch(
    backendUrl(`/api/ticket-type-compatibilities/learning-ticket-types/${params.learningTicketTypeId}/overrides`),
    {
      method: "PUT",
      headers: buildHeaders(request),
      body,
      cache: "no-store",
    },
  );

  return proxyResponse(response);
}
