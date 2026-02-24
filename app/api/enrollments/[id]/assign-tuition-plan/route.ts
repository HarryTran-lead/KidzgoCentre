/**
 * Enrollment Assign Tuition Plan API Route
 * PATCH /api/enrollments/[id]/assign-tuition-plan - Assign tuition plan to enrollment
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_ENROLLMENT_ENDPOINTS, buildApiUrl } from '@/constants/apiURL';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const backendUrl = buildApiUrl(BACKEND_ENROLLMENT_ENDPOINTS.ASSIGN_TUITION_PLAN(id));

    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to assign tuition plan' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error assigning tuition plan:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
