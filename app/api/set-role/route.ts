import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  for (const k of ["role", "user-name", "user-avatar", "session-role", "x-role"]) {
    res.cookies.set(k, "", { path: "/", expires: new Date(0) });
  }
  return res;
}
