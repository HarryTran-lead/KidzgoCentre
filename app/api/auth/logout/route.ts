import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { role = "TEACHER", name, avatar } = await req.json().catch(() => ({}));
  const res = NextResponse.json({ ok: true, role });

  res.cookies.set("role", role, { path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 30 });
  if (name)   res.cookies.set("user-name", name, { path: "/", httpOnly: false });
  if (avatar) res.cookies.set("user-avatar", avatar, { path: "/", httpOnly: false });

  return res;
}
