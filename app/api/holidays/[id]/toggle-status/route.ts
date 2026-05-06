import { NextResponse } from "next/server";
import { BACKEND_HOLIDAY_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { HolidayResponse } from "@/types/holiday";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
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

    const { id } = await params;
    const upstream = await fetch(buildApiUrl(BACKEND_HOLIDAY_ENDPOINTS.TOGGLE_STATUS(id)), {
      method: "PATCH",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data: HolidayResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Toggle holiday status error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Da xay ra loi khi doi trang thai holiday",
      },
      { status: 500 }
    );
  }
}
