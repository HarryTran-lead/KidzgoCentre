/**
 * Lead Management API Routes
 * GET /api/leads - Get all leads (with filters)
 * POST /api/leads - Create a new lead (authenticated)
 * 
 * These endpoints require authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_LEAD_ENDPOINTS, buildApiUrl } from '@/constants/apiURL';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Forward to backend API
    const backendUrl = buildApiUrl(
      `${BACKEND_LEAD_ENDPOINTS.GET_ALL}${queryString ? `?${queryString}` : ''}`
    );

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
        {
          success: false,
          message: data.message || 'Failed to fetch leads',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Forward to backend API
    const backendUrl = buildApiUrl(BACKEND_LEAD_ENDPOINTS.CREATE);

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
          message: data.message || 'Failed to create lead',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
