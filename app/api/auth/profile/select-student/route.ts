import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { SelectStudentProfileRequest, SelectStudentApiResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const body: SelectStudentProfileRequest = await req.json();

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Chưa đăng nhập",
        },
        { status: 401 }
      );
    }

    if (!body.profileId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Profile ID là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_AUTH_ENDPOINTS.SELECT_STUDENT), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    });

    const data: SelectStudentApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Select student error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi chọn học sinh",
      },
      { status: 500 }
    );
  }
}