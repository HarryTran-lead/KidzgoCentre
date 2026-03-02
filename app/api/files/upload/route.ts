import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_FILE_ENDPOINTS } from "@/constants/apiURL";

/**
 * POST /api/files/upload
 * Upload a file to the backend (proxies to backend /api/files/upload)
 * Query params: folder (default: uploads), resourceType (default: auto)
 * Body: multipart/form-data with file field
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") ?? "uploads";
    const resourceType = searchParams.get("resourceType") ?? "auto";

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, data: null, message: "Không tìm thấy file" },
        { status: 400 }
      );
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const backendUrl = buildApiUrl(
      `${BACKEND_FILE_ENDPOINTS.UPLOAD}?folder=${encodeURIComponent(folder)}&resourceType=${encodeURIComponent(resourceType)}`
    );

    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: backendFormData,
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi tải file lên" },
      { status: 500 }
    );
  }
}
