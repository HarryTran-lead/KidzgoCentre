import { NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/mock/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const refreshToken =
    typeof body === "string" ? body : typeof body?.refreshToken === "string" ? body.refreshToken : "";

  const tokens = rotateRefreshToken(refreshToken);
  if (!tokens) {
    return NextResponse.json(
      { isSuccess: false, message: "Refresh token không hợp lệ" },
      { status: 400 }
    );
  }

  return NextResponse.json({ isSuccess: true, data: tokens });
}