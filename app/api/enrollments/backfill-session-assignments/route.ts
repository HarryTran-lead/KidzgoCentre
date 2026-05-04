/**
 * Enrollment Backfill API Route
 * POST /api/enrollments/backfill-session-assignments - Backfill StudentSessionAssignment
 */

import { NextRequest, NextResponse } from "next/server";
import { BACKEND_ENROLLMENT_ENDPOINTS } from "@/constants/apiURL";
import { proxyEnrollmentRequest } from "../_proxy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return proxyEnrollmentRequest(
      request,
      BACKEND_ENROLLMENT_ENDPOINTS.BACKFILL_SESSION_ASSIGNMENTS,
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
