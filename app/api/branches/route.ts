import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import type { GetAllBranchesApiResponse, CreateBranchRequest, CreateBranchApiResponse } from "@/types/branch";

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

    // Get query params from URL
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    
    const url = buildApiUrl(BACKEND_BRANCH_ENDPOINTS.GET_ALL);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: GetAllBranchesApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get all branches error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy danh sách chi nhánh",
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
          message: "Chưa đăng nhập",
        },
        { status: 401 }
      );
    }

    const body: CreateBranchRequest = await req.json();

    // Validate required fields according to API spec
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

    // Prepare payload with only required fields for API
    const payload: CreateBranchRequest = {
      code: body.code,
      name: body.name,
      address: body.address,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
    };

    const upstream = await fetch(buildApiUrl(BACKEND_BRANCH_ENDPOINTS.CREATE), {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
