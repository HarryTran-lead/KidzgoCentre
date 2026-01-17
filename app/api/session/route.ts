import { NextResponse } from "next/server";

type SessionPayload = {
  role?: string;
  name?: string;
  avatar?: string;
};

export async function POST(req: Request) {
  const payload = (await req.json().catch(() => ({}))) as SessionPayload;
  const { role, name, avatar } = payload;

  const res = NextResponse.json({ ok: true });

  if (role) {
    res.cookies.set("role", role, { path: "/", httpOnly: false, sameSite: "lax" });
  }

  if (name) {
    res.cookies.set("user-name", name, { path: "/", httpOnly: false, sameSite: "lax" });
  }

  if (avatar) {
    res.cookies.set("user-avatar", avatar, { path: "/", httpOnly: false, sameSite: "lax" });
  }

  return res;
}