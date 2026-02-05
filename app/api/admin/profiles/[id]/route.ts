import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, BACKEND_PROFILE_ENDPOINTS } from '@/constants/apiURL';

/**
 * GET /api/admin/profiles/[id] - Get profile by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const backendUrl = buildApiUrl(BACKEND_PROFILE_ENDPOINTS.GET_BY_ID(id));

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to fetch profile' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/profiles/[id] - Update profile
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = buildApiUrl(BACKEND_PROFILE_ENDPOINTS.UPDATE(id));

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to update profile' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/profiles/[id] - Delete profile
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const backendUrl = buildApiUrl(BACKEND_PROFILE_ENDPOINTS.DELETE(id));

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error deleting profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to delete profile' 
      },
      { status: 500 }
    );
  }
}
