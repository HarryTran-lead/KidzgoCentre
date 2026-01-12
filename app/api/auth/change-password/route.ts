import { NextResponse } from "next/server";
import { getAccessTokenFromHeader, getUserByAccessToken, updatePassword } from "@/lib/mock/auth";

export async function PUT(req: Request) {
  const token = getAccessTokenFromHeader(req.headers.get("authorization"));
  const user = getUserByAccessToken(token);

  if (!user) {
    return NextResponse.json(
      { isSuccess: false, message: "Chưa đăng nhập" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body?.currentPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");

  if (currentPassword !== user.password) {
    return NextResponse.json(
      { isSuccess: false, message: "Mật khẩu hiện tại không đúng" },
      { status: 400 }
    );
  }

  updatePassword(user.id, newPassword);
  return NextResponse.json({ isSuccess: true, data: null });
}