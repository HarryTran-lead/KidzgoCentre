/**
 * Lead Notes API Route
 * POST /api/leads/[id]/notes - Add a note to lead
 * 
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_LEAD_ENDPOINTS, buildApiUrl } from '@/constants/apiURL';

export async function POST(
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
    const backendUrl = buildApiUrl(BACKEND_LEAD_ENDPOINTS.ADD_NOTE(id));

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
          message: data.message || 'Failed to add note',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error adding lead note:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
