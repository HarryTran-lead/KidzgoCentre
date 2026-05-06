/**
 * Enrollment Detail API Routes
 * GET /api/enrollments/[id] - Get enrollment by ID
 * PUT /api/enrollments/[id] - Update enrollment
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_ENROLLMENT_ENDPOINTS } from '@/constants/apiURL';
import { proxyEnrollmentRequest } from '../_proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyEnrollmentRequest(
    request,
    BACKEND_ENROLLMENT_ENDPOINTS.GET_BY_ID(id),
    'GET',
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    return proxyEnrollmentRequest(
      request,
      BACKEND_ENROLLMENT_ENDPOINTS.UPDATE(id),
      'PUT',
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
