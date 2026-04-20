/**
 * Placement Test Results API Route
 * PUT /api/placement-tests/[id]/results - Update placement test results
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_PLACEMENT_TEST_ENDPOINTS, buildApiUrl } from '@/constants/apiURL';

function normalizeAttachmentUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return [];
    return raw
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();
    const attachmentUrls = Array.from(
      new Set([
        ...normalizeAttachmentUrls(body?.attachmentUrls),
        ...normalizeAttachmentUrls(body?.attachmentUrl),
      ])
    );

    const normalizedBody = {
      ...(body || {}),
      ...(attachmentUrls.length > 0
        ? {
            attachmentUrl:
              attachmentUrls.length > 1 ? attachmentUrls : attachmentUrls[0],
            attachmentUrls,
          }
        : {}),
    };

    if (process.env.NODE_ENV !== 'production') {
      console.info('[placement-tests/results] Forward payload attachments', {
        attachmentUrlType: Array.isArray(normalizedBody.attachmentUrl)
          ? 'array'
          : typeof normalizedBody.attachmentUrl,
        attachmentUrlCount: Array.isArray(normalizedBody.attachmentUrl)
          ? normalizedBody.attachmentUrl.length
          : normalizeAttachmentUrls(normalizedBody.attachmentUrl).length,
        attachmentUrlsCount: Array.isArray(normalizedBody.attachmentUrls)
          ? normalizedBody.attachmentUrls.length
          : 0,
      });
    }

    // Forward to backend API
    const backendUrl = buildApiUrl(BACKEND_PLACEMENT_TEST_ENDPOINTS.UPDATE_RESULTS(id));

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(normalizedBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to update placement test results',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error updating placement test results:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
