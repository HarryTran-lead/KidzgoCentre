import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import type { 
  GetBranchByIdApiResponse, 
  UpdateBranchRequest, 
  UpdateBranchApiResponse,
  DeleteBranchApiResponse 
} from "@/types/branch";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
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

    const { id } = await params;

    const upstream = await fetch(buildApiUrl(BACKEND_BRANCH_ENDPOINTS.GET_BY_ID(id)), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: GetBranchByIdApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get branch by ID error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy thông tin chi nhánh",
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
          message: "Chưa đăng nhập",
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: UpdateBranchRequest = await req.json();

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
    const payload: UpdateBranchRequest = {
      code: body.code,
      name: body.name,
      address: body.address,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
    };

    const upstream = await fetch(buildApiUrl(BACKEND_BRANCH_ENDPOINTS.UPDATE(id)), {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: UpdateBranchApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Update branch error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi cập nhật chi nhánh",
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
          message: "Chưa đăng nhập",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    const upstream = await fetch(buildApiUrl(BACKEND_BRANCH_ENDPOINTS.DELETE(id)), {
      method: "DELETE",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: DeleteBranchApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Delete branch error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi xóa chi nhánh",
      },
      { status: 500 }
    );
  }
}
