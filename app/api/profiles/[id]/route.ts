import { NextRequest, NextResponse } from "next/server";
import { BACKEND_PROFILE_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type Params = { params: Promise<{ id: string }> };

function authError() {
  return NextResponse.json(
    { success: false, data: null, message: "Chưa đăng nhập" },
    { status: 401 }
  );
}

async function parseJson(upstream: Response) {
  const contentType = upstream.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? await upstream.json()
    : { success: false, data: null, message: await upstream.text() };
}

/**
 * GET /api/profiles/[id]
 * Get a single profile by ID.
 * Forwards to backend GET /profiles/{id}
 */
export async function GET(req: NextRequest, { params }: Params) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return authError();

  try {
    const { id } = await params;
    const upstream = await fetch(buildApiUrl(BACKEND_PROFILE_ENDPOINTS.GET_BY_ID(id)), {
      method: "GET",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
    });
    return NextResponse.json(await parseJson(upstream), { status: upstream.status });
  } catch (error) {
    console.error("Get profile by id error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi lấy hồ sơ" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profiles/[id]
 * Update a profile (displayName, isActive).
 * Forwards to backend PUT /profiles/{id}
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return authError();

  try {
    const { id } = await params;
    const body = await req.json();
    const upstream = await fetch(buildApiUrl(BACKEND_PROFILE_ENDPOINTS.UPDATE(id)), {
      method: "PUT",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await parseJson(upstream), { status: upstream.status });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi cập nhật hồ sơ" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profiles/[id]
 * Soft-delete a profile (sets IsDeleted=true, IsActive=false).
 * Forwards to backend DELETE /profiles/{id}
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return authError();

  try {
    const { id } = await params;
    const upstream = await fetch(buildApiUrl(BACKEND_PROFILE_ENDPOINTS.DELETE(id)), {
      method: "DELETE",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
    });
    return NextResponse.json(await parseJson(upstream), { status: upstream.status });
  } catch (error) {
    console.error("Delete profile error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi xóa hồ sơ" },
      { status: 500 }
    );
  }
}
