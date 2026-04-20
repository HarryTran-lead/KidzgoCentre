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

    const { searchParams } = new URL(req.url);
    const targetProfileId = searchParams.get("targetProfileId");

    const formData = await req.formData();
    const file = formData.get("file") ?? formData.get("avatar") ?? formData.get("Avatar");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.append("file", file);

    const endpoint = targetProfileId
      ? `${BACKEND_FILE_ENDPOINTS.AVATAR}?targetProfileId=${encodeURIComponent(targetProfileId)}`
      : BACKEND_FILE_ENDPOINTS.AVATAR;

    const upstream = await fetch(buildApiUrl(endpoint), {
      method: "POST",
      headers: { Authorization: authHeader },
      body: upstreamForm,
    });

    const rawText = await upstream.text();
    let data: any = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { message: rawText };
      }
    }
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tải ảnh đại diện" },
      { status: 500 }
    );
  }
}
