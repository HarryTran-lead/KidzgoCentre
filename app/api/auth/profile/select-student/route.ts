import { NextResponse } from "next/server";
import {
  findProfile,
  getAccessTokenFromHeader,
  getUserByAccessToken,
  selectProfile,
} from "@/lib/mock/auth";

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
  if (!profile || profile.profileType !== "Student") {
    return NextResponse.json(
      { isSuccess: false, message: "Profile không tồn tại hoặc không phải Student" },
      { status: 404 }
    );
  }

  selectProfile(user.id, profileId);
  return NextResponse.json({ isSuccess: true, data: null });
}