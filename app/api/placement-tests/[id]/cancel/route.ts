/**
 * Placement Test Cancel API Route
 * POST /api/placement-tests/[id]/cancel - Cancel a placement test
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_PLACEMENT_TEST_ENDPOINTS, buildApiUrl } from '@/constants/apiURL';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chưa đăng nhập',
        },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Forward to backend API
    const backendUrl = buildApiUrl(BACKEND_PLACEMENT_TEST_ENDPOINTS.CANCEL(id));

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to cancel placement test',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error canceling placement test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
