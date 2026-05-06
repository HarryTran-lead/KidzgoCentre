/**
 * Enrollment API Routes
 * GET /api/enrollments - Get all enrollments (with filters)
 * POST /api/enrollments - Create a new enrollment
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_ENROLLMENT_ENDPOINTS } from '@/constants/apiURL';
import { proxyEnrollmentRequest } from './_proxy';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `${BACKEND_ENROLLMENT_ENDPOINTS.GET_ALL}?${queryString}`
    : BACKEND_ENROLLMENT_ENDPOINTS.GET_ALL;

  return proxyEnrollmentRequest(request, endpoint, 'GET');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return proxyEnrollmentRequest(
      request,
      BACKEND_ENROLLMENT_ENDPOINTS.CREATE,
      'POST',
      body,
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        isSuccess: false,
        message: 'Dữ liệu gửi lên không hợp lệ.',
      },
      { status: 400 },
    );
  }
}
