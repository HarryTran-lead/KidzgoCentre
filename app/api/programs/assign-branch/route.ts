import { NextResponse } from "next/server";
import { BACKEND_ADMIN_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(name.length + 1));
}

function getAuthHeader(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader) return authHeader;

  const token = getCookieValue(req.headers.get("cookie"), "kidzgo.accessToken");
  return token ? `Bearer ${token}` : null;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const programId = url.searchParams.get("programId");
  const branchId = url.searchParams.get("branchId");

  if (!programId || !branchId) {
    return NextResponse.json(
      {
        isSuccess: false,
        data: null,
        message: "Missing programId or branchId",
      },
      { status: 400 },
    );
  }

  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    return NextResponse.json(
      {
        isSuccess: false,
        data: null,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const upstream = await fetch(
    buildApiUrl(BACKEND_ADMIN_ENDPOINTS.PROGRAMS_ASSIGN_BRANCH(programId, branchId)),
    {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
    },
  );

  const text = await upstream.text();
  if (!text) {
    return new NextResponse(null, { status: upstream.status });
  }

  try {
    return NextResponse.json(JSON.parse(text), { status: upstream.status });
  } catch {
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "text/plain",
      },
    });
  }
}
