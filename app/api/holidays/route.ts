import { NextResponse } from "next/server";
import { BACKEND_HOLIDAY_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { HolidayResponse, HolidaysResponse, HolidayUpsertPayload } from "@/types/holiday";

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

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const url = buildApiUrl(BACKEND_HOLIDAY_ENDPOINTS.GET_ALL);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: HolidaysResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get holidays error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Da xay ra loi khi lay danh sach holiday",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    const payload: HolidayUpsertPayload = await req.json();
    const upstream = await fetch(buildApiUrl(BACKEND_HOLIDAY_ENDPOINTS.CREATE), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: HolidayResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Create holiday error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Da xay ra loi khi tao holiday",
      },
      { status: 500 }
    );
  }
}
