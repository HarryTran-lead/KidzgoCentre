/**
 * Enrollment Assign Tuition Plan API Route
 * PATCH /api/enrollments/[id]/assign-tuition-plan - Assign tuition plan to enrollment
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_ENROLLMENT_ENDPOINTS } from '@/constants/apiURL';
import { proxyEnrollmentRequest } from '../../_proxy';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    return proxyEnrollmentRequest(
      request,
      BACKEND_ENROLLMENT_ENDPOINTS.ASSIGN_TUITION_PLAN(id),
      'PATCH',
      body,
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        isSuccess: false,
        message: 'Dữ liệu gửi lên không hợp lệ.',
      },
      { status: 400 }
    );
  }
}
