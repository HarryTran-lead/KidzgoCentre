/**
 * Enrollment Schedule Segment API Route
 * POST /api/enrollments/[id]/schedule-segments - Add schedule segment for supplementary enrollment
 */

import { NextRequest, NextResponse } from "next/server";
import { BACKEND_ENROLLMENT_ENDPOINTS } from "@/constants/apiURL";
import { proxyEnrollmentRequest } from "../../_proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    return proxyEnrollmentRequest(
      request,
      BACKEND_ENROLLMENT_ENDPOINTS.SCHEDULE_SEGMENTS(id),
      "POST",
      body,
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        isSuccess: false,
        message: "Dữ liệu gửi lên không hợp lệ.",
      },
      { status: 400 },
    );
  }
}
