// app/login/page.tsx
import LoginCard from "@/components/auth/LoginCard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Server Action
async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "");
  const _password = String(formData.get("password") || "");
  const returnTo = String(formData.get("returnTo") || "/portal");

  // ⬅️ PHẢI await ở Server Action
  const jar = await cookies();
  jar.set("session", `user:${email}`, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // tùy chọn: maxAge: 60 * 60 * 24 * 7, secure: process.env.NODE_ENV === "production",
  });

  redirect(returnTo);
}

type SP = { [k: string]: string | string[] | undefined };

export default function LoginPage({ searchParams }: { searchParams?: SP }) {
  const returnTo = (searchParams?.returnTo as string | undefined) ?? "";
  return (
    <div className="w-full">
      <LoginCard action={loginAction} returnTo={returnTo} />
    </div>
  );
}
