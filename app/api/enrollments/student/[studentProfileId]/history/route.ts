/**
 * Enrollment Student History API Route
 * GET /api/enrollments/student/[studentProfileId]/history - Get enrollment history for a student
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_ENROLLMENT_ENDPOINTS, buildApiUrl } from '@/constants/apiURL';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentProfileId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    const { studentProfileId } = await params;
    const backendUrl = buildApiUrl(BACKEND_ENROLLMENT_ENDPOINTS.STUDENT_HISTORY(studentProfileId));

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch enrollment history' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching enrollment history:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
