import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { UserMeApiResponse } from "@/types/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

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

    const upstream = await fetch(buildApiUrl(BACKEND_AUTH_ENDPOINTS.ME), {
      method: "GET",
      cache: "no-store",
      headers: {
        "Authorization": authHeader,
      },
    });

    const data: UserMeApiResponse = await upstream.json();

    return NextResponse.json(
      data,
      {
        status: upstream.status,
        headers: NO_STORE_HEADERS,
      }
    );
  } catch (error) {
    console.error("Get user info error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy thông tin người dùng",
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");

    const upstream = await (async () => {
      if (isMultipart) {
        const incomingFormData = await req.formData();
        const upstreamFormData = new FormData();
        incomingFormData.forEach((value, key) => {
          upstreamFormData.append(key, value);
        });

        return fetch(buildApiUrl(BACKEND_AUTH_ENDPOINTS.ME), {
          method: "PUT",
          headers: {
            "Authorization": authHeader,
          },
          body: upstreamFormData,
        });
      }

      const body = await req.json();
      return fetch(buildApiUrl(BACKEND_AUTH_ENDPOINTS.ME), {
        method: "PUT",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    })();

    const rawText = await upstream.text();
    let data: UserMeApiResponse | { message?: string } = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { message: rawText };
      }
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Update user info error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi cập nhật thông tin người dùng",
      },
      { status: 500 }
    );
  }
}