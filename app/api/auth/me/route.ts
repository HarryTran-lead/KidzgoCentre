import { NextResponse } from "next/server";
import { getAccessTokenFromHeader, getUserByAccessToken } from "@/lib/mock/auth";

export async function GET(req: Request) {
  const token = getAccessTokenFromHeader(req.headers.get("authorization"));
  const user = getUserByAccessToken(token);

  if (!user) {
    return NextResponse.json(
      { isSuccess: false, message: "Chưa đăng nhập" },
      { status: 401 }
    );
  }

  const { password: _password, parentPin: _parentPin, ...publicUser } = user;

  return NextResponse.json({ isSuccess: true, data: publicUser });
}