import { NextResponse } from "next/server";
import { buildApiUrl } from "@/constants/apiURL";

// Backend Student Homework Endpoints
const BACKEND_STUDENT_HOMEWORK_ENDPOINTS = {
  SUBMIT: '/students/homework/submit',
};

/**
 * POST /api/students/homework/submit
 * Submit a student's homework
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Chưa đăng nhập",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const url = buildApiUrl(BACKEND_STUDENT_HOMEWORK_ENDPOINTS.SUBMIT);

    console.log("Submit homework - Backend URL:", url);
    console.log("Submit homework - Request body:", body);

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    
    console.log("Submit homework - Backend response status:", upstream.status);
    console.log("Submit homework - Backend response text:", text);

    // Handle empty response
    if (!text) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Backend trả về response trống",
        },
        { status: 502 }
      );
    }

    const data = JSON.parse(text);

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Submit homework error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi nộp bài tập",
      },
      { status: 500 }
    );
  }
}
