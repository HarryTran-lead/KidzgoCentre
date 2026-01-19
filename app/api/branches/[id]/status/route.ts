import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import type { 
  UpdateBranchStatusRequest, 
  UpdateBranchStatusApiResponse 
} from "@/types/branch";

type Params = {
  params: {
    id: string;
  };
};

export async function PATCH(req: Request, { params }: Params) {
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

    const body: UpdateBranchStatusRequest = await req.json();

    if (body.isActive === undefined) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Trạng thái là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_BRANCH_ENDPOINTS.UPDATE_STATUS(params.id)), {
      method: "PATCH",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: UpdateBranchStatusApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Update branch status error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi cập nhật trạng thái chi nhánh",
      },
      { status: 500 }
    );
  }
}
