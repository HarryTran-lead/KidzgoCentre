import { NextResponse } from "next/server";
import { BACKEND_MAKEUP_CREDIT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { MakeupSettingsResponse, UpdateMakeupSettingsPayload } from "@/types/makeupCredit";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Chua dang nhap",
        },
        { status: 401 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_MAKEUP_CREDIT_ENDPOINTS.SETTINGS), {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: MakeupSettingsResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get makeup settings error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Da xay ra loi khi lay cau hinh makeup credit",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Chua dang nhap",
        },
        { status: 401 }
      );
    }

    const payload: UpdateMakeupSettingsPayload = await req.json();
    const upstream = await fetch(buildApiUrl(BACKEND_MAKEUP_CREDIT_ENDPOINTS.SETTINGS), {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: MakeupSettingsResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Update makeup settings error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Da xay ra loi khi cap nhat cau hinh makeup credit",
      },
      { status: 500 }
    );
  }
}
