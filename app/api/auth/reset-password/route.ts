import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body?.token ?? "");
  const newPassword = String(body?.newPassword ?? "");

  if (!token || !newPassword) {
    return NextResponse.json(
      { isSuccess: false, message: "Token không hợp lệ hoặc đã hết hạn" },
      { status: 400 }
    );
  }

  return NextResponse.json({ isSuccess: true, data: null });
}