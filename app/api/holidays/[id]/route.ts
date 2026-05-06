import { NextResponse } from "next/server";
import { BACKEND_HOLIDAY_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type {
  HolidayDeleteResponse,
  HolidayResponse,
  HolidayUpsertPayload,
} from "@/types/holiday";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
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
    const upstream = await fetch(buildApiUrl(BACKEND_HOLIDAY_ENDPOINTS.GET_BY_ID(id)), {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: HolidayResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get holiday by id error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Da xay ra loi khi lay holiday",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
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
    const payload: HolidayUpsertPayload = await req.json();
    const upstream = await fetch(buildApiUrl(BACKEND_HOLIDAY_ENDPOINTS.UPDATE(id)), {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: HolidayResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Update holiday error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Da xay ra loi khi cap nhat holiday",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: Params) {
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
    const upstream = await fetch(buildApiUrl(BACKEND_HOLIDAY_ENDPOINTS.DELETE(id)), {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: HolidayDeleteResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Delete holiday error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Da xay ra loi khi xoa holiday",
      },
      { status: 500 }
    );
  }
}
