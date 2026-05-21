import { NextResponse, type NextRequest } from "next/server";

type ServePathContext = {
  params: Promise<{ path: string[] }>;
};

/**
 * GET /api/files/serve/[...path]
 * 
 * Proxy image/file requests from media API with proper authorization.
 * This allows <img src="/api/files/serve/media/..."> to work with protected content.
 * 
 * Extracts auth token from cookies (added by browser when loading images)
 * and forwards it as Authorization header to backend.
 */
async function handle(req: NextRequest, context: ServePathContext) {
  try {
    const { path } = await context.params;
    const pathStr = path.join("/");

    if (!pathStr) {
      return NextResponse.json(
        { message: "Invalid path" },
        { status: 400 }
      );
    }

    // Extract token from cookies (browser includes cookies in img requests)
    const cookieStore = await req.cookies;
    const accessToken = cookieStore.get("kidzgo.accessToken")?.value;
    
    if (!accessToken) {
      // No token in cookie - try Authorization header as fallback
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        return NextResponse.json(
          { message: "Unauthorized - no token found" },
          { status: 401 }
        );
      }
    }

    // Build the backend URL
    const { NEXT_PUBLIC_API_URL, BACKEND_API_BASE_URL } = process.env;
    const apiBase = (NEXT_PUBLIC_API_URL || BACKEND_API_BASE_URL || "").replace(/\/$/, "");
    
    const backendPath = `/${pathStr}`;
    const backendUrl = `${apiBase}${backendPath}`;

    // Preserve query parameters from original request
    const queryString = new URL(req.url).searchParams.toString();
    const finalUrl = queryString ? `${backendUrl}?${queryString}` : backendUrl;

    // Prepare authorization header
    const authHeader = accessToken 
      ? `Bearer ${accessToken}`
      : req.headers.get("authorization") || "";

    const upstream = await fetch(finalUrl, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    // Handle different content types appropriately
    const contentType = upstream.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      // If it's JSON, it might be an error response - return as JSON
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }

    // For binary/image/video content, stream directly
    const buffer = await upstream.arrayBuffer();
    
    if (upstream.status >= 400) {
      // If there's an error, log it and return error response
      console.error(`[File Serve] Backend returned ${upstream.status} for ${finalUrl}`);
      return new NextResponse(buffer, { status: upstream.status });
    }
    
    return new NextResponse(buffer, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json(
      { message: "Failed to serve file" },
      { status: 500 }
    );
  }
}

export const GET = handle;
