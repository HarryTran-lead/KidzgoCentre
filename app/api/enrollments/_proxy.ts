import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/constants/apiURL";

type EnrollmentProxyMethod = "GET" | "POST" | "PUT" | "PATCH";

async function safeParseJson(response: Response): Promise<any> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      isSuccess: false,
      message: text,
    };
  }
}

export async function proxyEnrollmentRequest(
  request: NextRequest,
  backendPath: string,
  method: EnrollmentProxyMethod,
  body?: unknown,
) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      {
        success: false,
        isSuccess: false,
        message: "Chưa đăng nhập",
      },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(buildApiUrl(backendPath), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body:
        body !== undefined && method !== "GET"
          ? JSON.stringify(body)
          : undefined,
    });

    const payload = await safeParseJson(response);

    if (payload === null) {
      return NextResponse.json(
        {
          success: response.ok,
          isSuccess: response.ok,
          data: null,
          message: response.ok
            ? ""
            : "Không nhận được dữ liệu phản hồi từ máy chủ.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Enrollment proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        isSuccess: false,
        message: "Đã xảy ra lỗi máy chủ khi xử lý yêu cầu ghi danh.",
      },
      { status: 500 },
    );
  }
}
