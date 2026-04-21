import { get } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const PRIVATE_BLOB_HOST_SUFFIX = ".private.blob.vercel-storage.com";

function sanitizePathname(pathname: string): string {
  return pathname
    .trim()
    .split(/[?#]/, 1)[0]
    .replace(/^\/+/, "")
    .replace(/\.\./g, "");
}

function normalizePathname(input: string): string {
  const raw = input.trim();
  if (!raw) return "";

  // If a full URL is passed, keep only pathname.
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const host = parsed.hostname.toLowerCase();
      if (!host.endsWith(PRIVATE_BLOB_HOST_SUFFIX)) {
        return "";
      }
      return sanitizePathname(parsed.pathname);
    } catch {
      return "";
    }
  }

  return sanitizePathname(raw);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const pathnameParam = request.nextUrl.searchParams.get("pathname");
  const urlParam = request.nextUrl.searchParams.get("url");
  const resolved = normalizePathname(pathnameParam || urlParam || "");

  if (!resolved) {
    return NextResponse.json({ error: "Missing or invalid pathname" }, { status: 400 });
  }

  try {
    const candidates = Array.from(
      new Set([
        resolved,
        `/${resolved}`,
      ])
    ).filter(Boolean);

    let result: Awaited<ReturnType<typeof get>> | null = null;
    for (const candidate of candidates) {
      try {
        result = await get(candidate, { access: "private" });
        if (result?.stream) break;
      } catch {
        // Try next candidate.
      }
    }

    if (!result?.stream) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Private blob view failed:", error);
    return new NextResponse("Not found", { status: 404 });
  }
}
