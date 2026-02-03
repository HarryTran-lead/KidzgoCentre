/**
 * Public Lead API Route
 * POST /api/leads/public
 * 
 * Allows unauthenticated users (customers) to submit lead/contact forms.
 * No authentication required - this is a public endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_LEAD_ENDPOINTS, buildApiUrl } from '@/constants/apiURL';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { contactName, email, phone } = body;
    
    if (!contactName || !email || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Email, Số điện thoại)',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email không hợp lệ',
        },
        { status: 400 }
      );
    }

    // Forward to backend API
    const backendUrl = buildApiUrl(BACKEND_LEAD_ENDPOINTS.CREATE_PUBLIC);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      // Log error for debugging
      console.error('Backend error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        body: body
      });

      // Handle specific error codes
      let errorMessage = data.message || 'Không thể gửi thông tin. Vui lòng thử lại sau.';
      
      if (response.status === 409) {
        errorMessage = 'Email hoặc số điện thoại đã được đăng ký. Vui lòng sử dụng thông tin khác.';
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data.data,
        message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating public lead:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}
