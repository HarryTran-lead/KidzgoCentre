import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, BACKEND_PROFILE_ENDPOINTS } from '@/constants/apiURL';

/**
 * GET /api/admin/profiles - Get all profiles with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Forward query params to backend
    const queryString = searchParams.toString();
    const backendUrl = buildApiUrl(BACKEND_PROFILE_ENDPOINTS.GET_ALL);
    const fullUrl = queryString ? `${backendUrl}?${queryString}` : backendUrl;

    console.log('Calling backend URL:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', response.headers);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Backend returned non-JSON response:', text);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Backend returned invalid response',
          details: text.substring(0, 200)
        },
        { status: response.status || 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to fetch profiles' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/profiles - Create a new profile (Parent or Student)
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
    const backendUrl = buildApiUrl(BACKEND_PROFILE_ENDPOINTS.CREATE);

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
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to create profile' 
      },
      { status: 500 }
    );
  }
}
