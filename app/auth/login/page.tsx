// app/auth/login/page.tsx
import LoginCard from "@/components/auth/LoginCard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

/** 👇 Chuyển themeColor sang viewport, KHÔNG để trong metadata */
export const viewport = {
  themeColor: "#0ea5e9",
};

// ===== Server Action =====
async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "");
  const _password = String(formData.get("password") || "");
  const returnTo = String(formData.get("returnTo") || "/portal");

  // ✅ Next 15: cookies() là async
  const jar = await cookies();
  jar.set("session", `user:${email}`, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // secure: process.env.NODE_ENV === "production",
    // maxAge: 60 * 60 * 24 * 7,
  });

  redirect(returnTo);
}

type SP = Record<string, string | string[] | undefined>;

/** ✅ Next 15: searchParams là Promise -> phải await */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams; // <-- unwrap
  const raw = sp?.returnTo;
  const returnTo =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";

  return (
    <div className="w-full">
      <LoginCard action={loginAction} returnTo={returnTo} />
    </div>
  );
}
