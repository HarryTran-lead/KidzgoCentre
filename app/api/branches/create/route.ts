import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import type { CreateBranchRequest, CreateBranchApiResponse } from "@/types/branch";

export async function POST(req: Request) {
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

    const body: CreateBranchRequest = await req.json();

    // Validate required fields
    if (!body.code || !body.name || !body.address || !body.contactPhone || !body.contactEmail) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Mã chi nhánh, tên, địa chỉ, số điện thoại và email là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_BRANCH_ENDPOINTS.CREATE), {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: CreateBranchApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Create branch error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi tạo chi nhánh",
      },
      { status: 500 }
    );
  }
}
