import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_FILE_ENDPOINTS } from "@/constants/apiURL";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.append("file", file);

    const upstream = await fetch(buildApiUrl(BACKEND_FILE_ENDPOINTS.AVATAR), {
      method: "POST",
      headers: { Authorization: authHeader },
      body: upstreamForm,
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tải ảnh đại diện" },
      { status: 500 }
    );
  }
}
