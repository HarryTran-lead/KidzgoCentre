import { NextResponse } from "next/server";
import { findProfile, getAccessTokenFromHeader, getUserByAccessToken } from "@/lib/mock/auth";

export async function POST(req: Request) {
  const token = getAccessTokenFromHeader(req.headers.get("authorization"));
  const user = getUserByAccessToken(token);

  if (!user) {
    return NextResponse.json(
      { isSuccess: false, message: "Chưa đăng nhập" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const profileId = String(body?.profileId ?? "");
  const pin = String(body?.pin ?? "");

  const profile = findProfile(user, profileId);
  if (!profile || profile.profileType !== "Parent") {
    return NextResponse.json(
      { isSuccess: false, message: "Profile không tồn tại hoặc không phải Parent" },
      { status: 404 }
    );
  }

  if (pin !== user.parentPin) {
    return NextResponse.json(
      { isSuccess: false, message: "PIN không đúng hoặc Profile không hợp lệ" },
      { status: 400 }
    );
  }

  return NextResponse.json({ isSuccess: true, data: null });
}