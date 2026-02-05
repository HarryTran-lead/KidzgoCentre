import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, BACKEND_PROFILE_ENDPOINTS } from '@/constants/apiURL';

/**
 * POST /api/admin/profiles/unlink - Unlink student from parent
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = buildApiUrl(BACKEND_PROFILE_ENDPOINTS.UNLINK);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error unlinking profiles:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to unlink profiles' 
      },
      { status: 500 }
    );
  }
}
