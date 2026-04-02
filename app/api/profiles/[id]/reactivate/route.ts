/**
 * Profile Reactivate API Route
 * PUT /api/profiles/[id]/reactivate - Reactivate a student profile via email link
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_PROFILE_ENDPOINTS, buildApiUrl } from '@/constants/apiURL';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const backendUrl = buildApiUrl(BACKEND_PROFILE_ENDPOINTS.REACTIVATE(id));

    let payload: unknown = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    let response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload ?? {}),
    });

    // Backend may expose this operation as PATCH.
    if (response.status === 404 || response.status === 405) {
      response = await fetch(backendUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(payload ?? {}),
      });
    }

    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { success: response.ok, message: await response.text() };

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Không thể xác minh hồ sơ' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error reactivating profile:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}
