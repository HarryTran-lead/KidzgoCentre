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

  const profile = findProfile(user, profileId);
  if (!profile) {
    return NextResponse.json(
      { isSuccess: false, message: "Profile không tồn tại hoặc không phải Parent" },
      { status: 404 }
    );
  }

  if (profile.profileType !== "Parent") {
    return NextResponse.json(
      { isSuccess: false, message: "Profile không hợp lệ hoặc không có email" },
      { status: 400 }
    );
  }

  if (!profile.email) {
    return NextResponse.json(
      { isSuccess: false, message: "Profile không hợp lệ hoặc không có email" },
      { status: 400 }
    );
  }

  return NextResponse.json({ isSuccess: true, data: null });
}