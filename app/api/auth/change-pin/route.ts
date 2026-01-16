import { NextResponse } from "next/server";
import { getAccessTokenFromHeader, getUserByAccessToken, updateParentPin } from "@/lib/mock/auth";

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
  const currentPin = String(body?.currentPin ?? "");
  const newPin = String(body?.newPin ?? "");

  if (currentPin !== user.parentPin) {
    return NextResponse.json(
      { isSuccess: false, message: "PIN hiện tại không đúng" },
      { status: 400 }
    );
  }

  updateParentPin(user.id, newPin);
  return NextResponse.json({ isSuccess: true, data: null });
}